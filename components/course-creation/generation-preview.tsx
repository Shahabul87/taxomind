"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChapterState {
  position: number;
  title: string;
  state: 'completed' | 'generating' | 'failed' | 'pending';
}

interface GenerationPreviewData {
  courseId: string;
  courseTitle: string;
  chapters: ChapterState[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

interface GenerationPreviewProps {
  courseId: string;
  pollIntervalMs?: number;
}

const STATE_ICONS: Record<ChapterState['state'], React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  generating: <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  pending: <Clock className="h-4 w-4 text-slate-300 dark:text-slate-600" />,
};

const STATE_LABELS: Record<ChapterState['state'], string> = {
  completed: 'Ready',
  generating: 'Generating...',
  failed: 'Failed',
  pending: 'Pending',
};

export function GenerationPreview({ courseId, pollIntervalMs = 3000 }: GenerationPreviewProps) {
  const [data, setData] = useState<GenerationPreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`/api/sam/course-creation/progress?courseId=${courseId}`);
      if (!res.ok) {
        setError('Failed to fetch progress');
        return;
      }
      const json = await res.json();
      if (json.success && json.generationPreview) {
        setData(json.generationPreview);
        setError(null);

        // Stop polling when all chapters are completed or failed
        const allDone = json.generationPreview.chapters.every(
          (ch: ChapterState) => ch.state === 'completed' || ch.state === 'failed'
        );
        if (allDone && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      setError('Failed to fetch progress');
    }
  }, [courseId]);

  useEffect(() => {
    fetchProgress();
    intervalRef.current = setInterval(fetchProgress, pollIntervalMs);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchProgress, pollIntervalMs]);

  if (error && !data) {
    return null; // Silent fail — don't show anything if we can't fetch
  }

  if (!data || data.chapters.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{data.completedCount} of {data.totalCount} chapters ready</span>
          <span>{data.percentage}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${data.percentage}%` }}
          />
        </div>
      </div>

      {/* Chapter list */}
      <div className="space-y-1">
        {data.chapters.map((chapter) => (
          <div
            key={chapter.position}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              chapter.state === 'completed' && 'bg-emerald-50/50 dark:bg-emerald-900/10',
              chapter.state === 'generating' && 'bg-amber-50/50 dark:bg-amber-900/10',
              chapter.state === 'failed' && 'bg-red-50/50 dark:bg-red-900/10',
              chapter.state === 'pending' && 'bg-slate-50/50 dark:bg-slate-800/30',
            )}
          >
            {STATE_ICONS[chapter.state]}
            <span className={cn(
              'flex-1 truncate',
              chapter.state === 'pending' && 'text-slate-400 dark:text-slate-600',
              chapter.state === 'completed' && 'text-slate-700 dark:text-slate-300',
              chapter.state === 'generating' && 'text-amber-700 dark:text-amber-300',
              chapter.state === 'failed' && 'text-red-700 dark:text-red-300',
            )}>
              Ch {chapter.position}: {chapter.title}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0">
              {STATE_LABELS[chapter.state]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
