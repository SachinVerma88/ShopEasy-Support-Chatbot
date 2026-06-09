'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, sendMessage, fetchHistory, ApiError } from '@/lib/api';
import MessageList from './MessageList';
import InputBar from './InputBar';

const SESSION_KEY = 'shopeasy_session_id';

function createLocalMessage(
  sender: 'user' | 'ai',
  text: string,
  idPrefix = 'local'
): ChatMessage {
  return {
    id: `${idPrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sender,
    text,
    timestamp: new Date().toISOString(),
  };
}

export default function ChatWidget() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const stored = localStorage.getItem(SESSION_KEY);

      if (!stored) {
        setIsInitializing(false);
        return;
      }

      try {
        const history = await fetchHistory(stored);
        setMessages(history.messages);
        setSessionId(history.sessionId);
      } catch {
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsInitializing(false);
      }
    }

    loadSession();
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      const userMessage = createLocalMessage('user', text);
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const response = await sendMessage(text, sessionId);

        if (!sessionId) {
          setSessionId(response.sessionId);
          localStorage.setItem(SESSION_KEY, response.sessionId);
        }

        const aiMessage = createLocalMessage('ai', response.reply, 'ai');
        setMessages((prev) => [...prev, aiMessage]);

        if (response.warning) {
          const warningMessage = createLocalMessage('ai', response.warning, 'warn');
          setMessages((prev) => [...prev, warningMessage]);
        }
      } catch (err) {
        const errorText =
          err instanceof ApiError
            ? err.message
            : 'Unable to reach the server. Please check your connection and try again.';

        const errorMessage = createLocalMessage('ai', errorText, 'error');
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  if (isInitializing) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="h-5 w-5 animate-spin text-indigo-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Loading conversation...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MessageList messages={messages} isTyping={isLoading} />
      <InputBar onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
