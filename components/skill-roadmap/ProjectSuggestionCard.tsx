'use client';

import { Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProjectSuggestionCardProps {
  title: string;
  description: string;
  difficulty?: string;
  estimatedHours?: number;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  INTERMEDIATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  ADVANCED: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

export function ProjectSuggestionCard({
  title,
  description,
  difficulty,
  estimatedHours,
}: ProjectSuggestionCardProps) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex-shrink-0">
          <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {title}
            </h4>
            {difficulty && (
              <Badge className={cn('text-[10px] px-1.5 py-0 border-0', DIFFICULTY_STYLES[difficulty] ?? DIFFICULTY_STYLES.BEGINNER)}>
                {difficulty}
              </Badge>
            )}
          </div>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
            {description}
          </p>

          {estimatedHours != null && estimatedHours > 0 && (
            <span className="inline-block mt-2 text-xs text-slate-400">
              ~{estimatedHours}h hands-on
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
