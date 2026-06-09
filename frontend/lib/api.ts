const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface SendMessageResponse {
  reply: string;
  sessionId: string;
  warning?: string;
}

export interface HistoryResponse {
  messages: ChatMessage[];
  sessionId: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Sends a chat message to the backend API.
 */
export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_URL}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error ?? 'Failed to send message. Please try again.',
      response.status
    );
  }

  return data as SendMessageResponse;
}

/**
 * Fetches chat history for an existing session.
 */
export async function fetchHistory(sessionId: string): Promise<HistoryResponse> {
  const response = await fetch(`${API_URL}/api/chat/history/${sessionId}`);

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error ?? 'Failed to load chat history.',
      response.status
    );
  }

  return data as HistoryResponse;
}
