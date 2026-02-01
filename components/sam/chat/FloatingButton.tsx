"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { XPProgress } from './types';
import type { XPEvent } from '@/lib/sam/gamification';

interface FloatingButtonProps {
  onClick: () => void;
  className?: string;
  showXpAnimation?: boolean;
  xpNotifications?: XPEvent[];
}

export function FloatingButton({
  onClick,
  className,
  showXpAnimation = false,
  xpNotifications = [],
}: FloatingButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* XP Notification */}
      {showXpAnimation && xpNotifications.length > 0 && (
        <div className="animate-bounce bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
          +{xpNotifications[xpNotifications.length - 1]?.amount} XP
        </div>
      )}

      <Button
        onClick={onClick}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg',
          'bg-[var(--sam-accent)] hover:bg-[var(--sam-accent-hover)]',
          'transition-all duration-300 hover:scale-110',
          'sam-glow',
          className
        )}
        aria-label="Open SAM AI Assistant"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
}
