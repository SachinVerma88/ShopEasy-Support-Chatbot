'use client';

import { useState, KeyboardEvent, FormEvent } from 'react';

const MAX_LENGTH = 2000;
const WARN_THRESHOLD = 1800;

interface InputBarProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function InputBar({ onSend, disabled }: InputBarProps) {
  const [input, setInput] = useState('');

  const charCount = input.length;
  const showCharCount = charCount >= WARN_THRESHOLD;
  const isOverLimit = charCount > MAX_LENGTH;

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSend(input);
    setInput('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex max-w-3xl flex-col gap-1"
      >
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Type your message..."
              rows={1}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60"
              style={{ minHeight: '42px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
          </div>
          <button
            type="submit"
            disabled={disabled || !input.trim()}
            className="flex h-[42px] shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
            </svg>
            <span className="ml-1.5 hidden sm:inline">Send</span>
          </button>
        </div>
        {showCharCount && (
          <p
            className={`text-right text-xs ${
              isOverLimit ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {charCount}/{MAX_LENGTH}
            {isOverLimit && ' — message will be truncated'}
          </p>
        )}
      </form>
    </div>
  );
}
