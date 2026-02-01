"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { SAMSuggestion } from './types';

interface SuggestionChipsProps {
  suggestions: SAMSuggestion[];
  onSuggestionClick: (suggestion: SAMSuggestion) => void;
  maxVisible?: number;
  className?: string;
}

export function SuggestionChips({
  suggestions,
  onSuggestionClick,
  maxVisible = 3,
  className,
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn('px-4 py-2 shrink-0', className)}>
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, maxVisible).map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full transition-all duration-200',
              'border border-[var(--sam-border)]',
              'text-[var(--sam-accent)]',
              'hover:bg-[var(--sam-accent)] hover:text-white',
              'hover:border-[var(--sam-accent)]',
              'active:scale-95'
            )}
          >
            {suggestion.label || suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
}
