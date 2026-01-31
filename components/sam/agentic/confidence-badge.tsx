'use client';

import React from 'react';
import type { ConfidenceContext } from '@/lib/sam/agentic-chat/types';

interface ConfidenceBadgeProps {
  confidence: ConfidenceContext;
}

const LEVEL_STYLES: Record<string, string> = {
  HIGH: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const style = LEVEL_STYLES[confidence.level] ?? LEVEL_STYLES.MEDIUM;

  return (
    <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full ${style}`}>
      {confidence.level}
    </span>
  );
}
