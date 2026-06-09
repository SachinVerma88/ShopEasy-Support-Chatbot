import { prisma, getRedisClient } from '../db';
import {
  ChatMessage,
  HistoryResult,
  MessageHistoryItem,
  SendMessageResult,
} from '../types';
import { generateReply } from './llm.service';

const CACHE_TTL_SECONDS = 3600;
const MAX_MESSAGE_LENGTH = 2000;

function cacheKey(sessionId: string): string {
  return `session:${sessionId}:history`;
}

/**
 * Serializes chat messages for Redis storage.
 */
function serializeMessages(messages: ChatMessage[]): string {
  return JSON.stringify(
    messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      text: m.text,
      timestamp: m.timestamp.toISOString(),
    }))
  );
}

/**
 * Deserializes cached messages from Redis.
 */
function deserializeMessages(data: string): ChatMessage[] {
  const parsed = JSON.parse(data) as MessageHistoryItem[];
  return parsed.map((m) => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    timestamp: new Date(m.timestamp),
  }));
}

/**
 * Fetches conversation history from Redis cache or database.
 *
 * @param sessionId - The conversation UUID
 * @returns Array of chat messages ordered by timestamp
 */
export async function getConversationHistory(
  sessionId: string
): Promise<ChatMessage[]> {
  try {
    const redis = await getRedisClient();
    const cached = await redis.get(cacheKey(sessionId));

    if (cached) {
      return deserializeMessages(cached);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.warn('Redis read failed, falling back to DB:', message);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: sessionId },
    orderBy: { timestamp: 'asc' },
  });

  const history: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    sender: m.sender as 'user' | 'ai',
    text: m.text,
    timestamp: m.timestamp,
  }));

  await updateCache(sessionId, history);

  return history;
}

/**
 * Updates Redis cache with the latest conversation history.
 *
 * @param sessionId - The conversation UUID
 * @param messages - Messages to cache
 */
async function updateCache(
  sessionId: string,
  messages: ChatMessage[]
): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.setEx(
      cacheKey(sessionId),
      CACHE_TTL_SECONDS,
      serializeMessages(messages)
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.warn('Redis write failed:', message);
  }
}

/**
 * Invalidates the Redis cache for a session.
 *
 * @param sessionId - The conversation UUID
 */
async function invalidateCache(sessionId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    await redis.del(cacheKey(sessionId));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.warn('Redis invalidate failed:', message);
  }
}

/**
 * Formats messages for API response.
 */
function toHistoryItems(messages: ChatMessage[]): MessageHistoryItem[] {
  return messages.map((m) => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    timestamp: m.timestamp.toISOString(),
  }));
}

/**
 * Processes an incoming user message: persists it, calls the LLM, and stores the reply.
 *
 * @param message - The user's message text
 * @param sessionId - Optional existing conversation UUID
 * @returns The AI reply and session ID
 */
export async function processMessage(
  message: string,
  sessionId?: string
): Promise<SendMessageResult> {
  let truncated = false;
  let processedMessage = message;

  if (processedMessage.length > MAX_MESSAGE_LENGTH) {
    processedMessage = processedMessage.slice(0, MAX_MESSAGE_LENGTH);
    truncated = true;
  }

  let conversationId = sessionId;

  if (conversationId) {
    const existing = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!existing) {
      conversationId = undefined;
    }
  }

  if (!conversationId) {
    const conversation = await prisma.conversation.create({ data: {} });
    conversationId = conversation.id;
  }

  const history = await getConversationHistory(conversationId);

  const userRecord = await prisma.message.create({
    data: {
      conversationId,
      sender: 'user',
      text: processedMessage,
    },
  });

  const updatedHistory: ChatMessage[] = [
    ...history,
    {
      id: userRecord.id,
      sender: 'user',
      text: processedMessage,
      timestamp: userRecord.timestamp,
    },
  ];

  const reply = await generateReply(history, processedMessage);

  const aiRecord = await prisma.message.create({
    data: {
      conversationId,
      sender: 'ai',
      text: reply,
    },
  });

  const fullHistory: ChatMessage[] = [
    ...updatedHistory,
    {
      id: aiRecord.id,
      sender: 'ai',
      text: reply,
      timestamp: aiRecord.timestamp,
    },
  ];

  await invalidateCache(conversationId);
  await updateCache(conversationId, fullHistory);

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return {
    reply,
    sessionId: conversationId,
    ...(truncated && { truncated: true }),
  };
}

/**
 * Retrieves full chat history for a session.
 *
 * @param sessionId - The conversation UUID
 * @returns Messages and session ID, or null if conversation not found
 */
export async function getHistory(
  sessionId: string
): Promise<HistoryResult | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: sessionId },
  });

  if (!conversation) {
    return null;
  }

  const history = await getConversationHistory(sessionId);

  return {
    messages: toHistoryItems(history),
    sessionId,
  };
}
