import Groq from 'groq-sdk';
import { ChatMessage } from '../types';

const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 500;
const MAX_HISTORY = 10;
const REQUEST_TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You are a helpful customer support agent for "ShopEasy" — a fictional e-commerce store.
Always answer clearly, concisely, and in a friendly tone.

Store Knowledge Base:
- Shipping Policy: We ship across India and internationally. Domestic delivery takes 3-5 
  business days. International delivery takes 7-14 business days. Free shipping on orders 
  above ₹999. Express shipping available at ₹149 extra.
- Return & Refund Policy: Items can be returned within 30 days of delivery. Products must 
  be unused and in original packaging. Refunds are processed within 5-7 business days to 
  the original payment method.
- Support Hours: Monday to Saturday, 10 AM to 7 PM IST. For urgent issues outside hours, 
  email support@shopeasy.in and we'll respond within 24 hours.
- Payment Methods: We accept UPI, credit/debit cards, net banking, and Cash on Delivery 
  (COD) for orders below ₹5000.
- Order Tracking: Customers can track orders via the "My Orders" section after logging in, 
  or using the tracking link sent via SMS/email.
- Cancellations: Orders can be cancelled within 12 hours of placement. Post-shipment 
  cancellations are not possible.

If a question is outside ShopEasy's domain, politely say you can only help with 
ShopEasy-related queries.`;

type GroqMessage = Groq.Chat.Completions.ChatCompletionMessageParam;

/**
 * Maps conversation history to Groq chat completion message format.
 */
function formatHistory(history: ChatMessage[]): GroqMessage[] {
  const recent = history.slice(-MAX_HISTORY);

  return recent.map((msg) => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.text,
  }));
}

/**
 * Classifies Groq API errors and returns a user-friendly message.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Groq.APIError) {
    if (error.status === 401 || error.status === 403) {
      return 'Service configuration error. Please contact support.';
    }
    if (error.status === 429) {
      return "We're experiencing high traffic. Please wait a moment and retry.";
    }
  }

  if (error instanceof Error) {
    if (
      error.message.includes('timeout') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('AbortError') ||
      error.name === 'APIConnectionTimeoutError'
    ) {
      return 'Our agent is temporarily unavailable. Please try again shortly.';
    }
  }

  return 'Something went wrong. Please try again.';
}

/**
 * Generates an AI reply using Groq with conversation context.
 *
 * @param history - Previous messages in the conversation
 * @param userMessage - The latest user message to respond to
 * @returns The AI-generated reply text
 */
export async function generateReply(
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return 'Service configuration error. Please contact support.';
  }

  const client = new Groq({ apiKey });

  const messages: GroqMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...formatHistory(history),
    { role: 'user', content: userMessage },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await client.chat.completions.create(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages,
      },
      { signal: controller.signal }
    );

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return 'Something went wrong. Please try again.';
    }

    return content;
  } catch (error: unknown) {
    return getErrorMessage(error);
  } finally {
    clearTimeout(timeoutId);
  }
}
