'use client';

import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProfileEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ProfileEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: ProfileEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-700/50 mb-4">
        <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-1">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          className="mt-4 h-9 sm:h-10 text-xs sm:text-sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
