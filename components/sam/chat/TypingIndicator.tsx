"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex justify-start', className)}>
      <div
        className="rounded-2xl px-4 py-3 inline-flex items-center gap-1.5"
        style={{
          background: 'var(--sam-bubble-assistant)',
          color: 'var(--sam-bubble-assistant-text)',
        }}
      >
        <span className="sam-typing-dot w-2 h-2 rounded-full bg-[var(--sam-accent)]" />
        <span className="sam-typing-dot w-2 h-2 rounded-full bg-[var(--sam-accent)]" />
        <span className="sam-typing-dot w-2 h-2 rounded-full bg-[var(--sam-accent)]" />
      </div>
    </div>
  );
}
