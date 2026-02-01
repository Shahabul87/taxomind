"use client";

import React from 'react';
import { Trophy, Flame, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { XPProgress } from '../types';
import type { UserProgress } from '@/lib/sam/gamification';

interface ProgressPanelProps {
  userProgress: UserProgress | null;
  xpProgress: XPProgress | null;
  confidenceScore?: number;
  className?: string;
}

export function ProgressPanel({
  userProgress,
  xpProgress,
  confidenceScore,
  className,
}: ProgressPanelProps) {
  return (
    <div className={cn('space-y-3 p-3', className)}>
      {/* XP Progress */}
      {xpProgress && userProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy
                className="h-4 w-4"
                style={{ color: 'var(--sam-accent)' }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--sam-text)' }}
              >
                {xpProgress.levelName}
              </span>
            </div>
            <span
              className="text-xs"
              style={{ color: 'var(--sam-text-secondary)' }}
            >
              {userProgress.xp} XP
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--sam-border)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${xpProgress.percentage}%`,
                background: 'var(--sam-accent)',
              }}
            />
          </div>
          <p
            className="text-[11px]"
            style={{ color: 'var(--sam-text-muted)' }}
          >
            {xpProgress.current} / {xpProgress.needed} to Level{' '}
            {(userProgress.level || 1) + 1}
          </p>
        </div>
      )}

      {/* Stats row */}
      {userProgress && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard
            icon={<Star className="h-3.5 w-3.5 text-yellow-500" />}
            label="Level"
            value={String(userProgress.level)}
          />
          <StatCard
            icon={<Flame className="h-3.5 w-3.5 text-orange-500" />}
            label="Streak"
            value={`${userProgress.streak}d`}
          />
          <StatCard
            icon={
              <div
                className={cn(
                  'h-3.5 w-3.5 rounded-full',
                  confidenceScore != null && confidenceScore >= 0.7 && 'bg-green-400',
                  confidenceScore != null && confidenceScore >= 0.4 && confidenceScore < 0.7 && 'bg-yellow-400',
                  confidenceScore != null && confidenceScore < 0.4 && 'bg-red-400',
                  confidenceScore == null && 'bg-gray-300'
                )}
              />
            }
            label="Confidence"
            value={
              confidenceScore != null
                ? `${Math.round(confidenceScore * 100)}%`
                : '—'
            }
          />
        </div>
      )}

      {/* Empty state */}
      {!userProgress && (
        <p
          className="text-xs text-center py-4"
          style={{ color: 'var(--sam-text-muted)' }}
        >
          Send a message to start tracking progress
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-lg p-2 text-center"
      style={{
        background: 'var(--sam-surface-hover)',
        border: '1px solid var(--sam-border)',
      }}
    >
      <div className="flex justify-center mb-1">{icon}</div>
      <p
        className="text-xs font-semibold"
        style={{ color: 'var(--sam-text)' }}
      >
        {value}
      </p>
      <p
        className="text-[10px]"
        style={{ color: 'var(--sam-text-muted)' }}
      >
        {label}
      </p>
    </div>
  );
}
