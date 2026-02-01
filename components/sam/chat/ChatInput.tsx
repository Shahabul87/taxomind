"use client";

import React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isProcessing: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onKeyPress,
  isProcessing,
  placeholder = 'Ask SAM anything...',
  className,
}: ChatInputProps) {
  return (
    <div className={cn('p-3 shrink-0', className)}>
      <div
        className="flex items-center gap-2 rounded-2xl px-1 py-1"
        style={{
          background: 'var(--sam-input-bg)',
          border: '1px solid var(--sam-input-border)',
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder={placeholder}
          className={cn(
            'flex-1 px-3 py-2 bg-transparent text-sm',
            'text-[var(--sam-text)] placeholder:text-[var(--sam-text-muted)]',
            'focus:outline-none'
          )}
          disabled={isProcessing}
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || isProcessing}
          className={cn(
            'h-9 w-9 rounded-xl flex items-center justify-center',
            'transition-all duration-200',
            value.trim() && !isProcessing
              ? 'bg-[var(--sam-accent)] text-white hover:bg-[var(--sam-accent-hover)] scale-100'
              : 'bg-transparent text-[var(--sam-text-muted)] scale-90',
            'disabled:cursor-not-allowed'
          )}
          aria-label="Send message"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
