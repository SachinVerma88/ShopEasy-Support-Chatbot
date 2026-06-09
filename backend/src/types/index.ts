export type Sender = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
}

export interface MessageHistoryItem {
  id: string;
  sender: Sender;
  text: string;
  timestamp: string;
}

export interface SendMessageResult {
  reply: string;
  sessionId: string;
  truncated?: boolean;
}

export interface HistoryResult {
  messages: MessageHistoryItem[];
  sessionId: string;
}
