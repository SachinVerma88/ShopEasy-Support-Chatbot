'use client';

import { ChatMessage } from '@/lib/api';

interface MessageBubbleProps {
  message: ChatMessage;
  isError?: boolean;
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function BotAvatar() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1h-1.5a2.5 2.5 0 00-5 0H10.5a2.5 2.5 0 00-5 0H4v-1a7 7 0 017-7h1V5.73A2 2 0 0112 2zM8 14.5a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0zm8 0a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0z" />
      </svg>
    </div>
  );
}

export default function MessageBubble({ message, isError = false }: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div className="rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-white shadow-sm">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.text}
            </p>
          </div>
          <p className="mt-1 text-right text-xs text-gray-400">
            {formatTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2">
      <BotAvatar />
      <div className="max-w-[80%] sm:max-w-[70%]">
        <div
          className={`rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm ${
            isError
              ? 'border border-red-200 bg-red-50 text-red-700'
              : 'border border-gray-100 bg-gray-50 text-gray-800'
          }`}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {message.text}
          </p>
        </div>
        <p className="mt-1 text-xs text-gray-400">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div
      className="flex justify-start gap-2"
      role="status"
      aria-live="polite"
      aria-label="Agent is typing"
    >
      <BotAvatar />
      <div className="rounded-2xl rounded-bl-md border border-gray-100 bg-gray-50 px-4 py-3.5 shadow-sm">
        <div className="flex h-4 items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="typing-dot h-2 w-2 rounded-full bg-gray-400"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
