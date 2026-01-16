'use client';

/**
 * ConnectedStudyStatusBadge
 *
 * Wrapper that connects StudyStatusBadge to the PresenceTrackingProvider context.
 * Automatically reflects and controls the current presence status.
 *
 * Usage:
 * ```tsx
 * // Inside a PresenceTrackingProvider
 * <ConnectedStudyStatusBadge
 *   currentActivity={{ type: 'course', id: 'course-123', title: 'React Basics' }}
 * />
 * ```
 */

import { useCallback, useState, useEffect, useMemo } from 'react';
import { StudyStatusBadge } from './StudyStatusBadge';
import { usePresenceTrackingOptional } from './PresenceTrackingProvider';
import type { PresenceStatus } from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

interface ConnectedStudyStatusBadgeProps {
  className?: string;
  /** What user is currently studying */
  currentActivity?: {
    type: 'course' | 'topic' | 'practice' | 'review';
    id: string;
    title: string;
    progress?: number;
  };
  /** Daily study goal in minutes */
  dailyGoalMinutes?: number;
  /** Today's study time in minutes (fetched from API if not provided) */
  todayStudyMinutes?: number;
  /** Compact mode */
  compact?: boolean;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ConnectedStudyStatusBadge({
  className,
  currentActivity,
  dailyGoalMinutes = 60,
  todayStudyMinutes: propTodayMinutes,
  compact = false,
}: ConnectedStudyStatusBadgeProps) {
  const presenceContext = usePresenceTrackingOptional();
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);
  const [todayStudyMinutes, setTodayStudyMinutes] = useState(propTodayMinutes ?? 0);

  // Track session start
  useEffect(() => {
    if (presenceContext?.status === 'studying' && !sessionStartedAt) {
      setSessionStartedAt(new Date());
    } else if (presenceContext?.status !== 'studying' && sessionStartedAt) {
      // Calculate session duration and add to today's minutes
      const sessionDurationMs = Date.now() - sessionStartedAt.getTime();
      const sessionMinutes = Math.floor(sessionDurationMs / 60000);
      setTodayStudyMinutes((prev) => prev + sessionMinutes);
      setSessionStartedAt(null);
    }
  }, [presenceContext?.status, sessionStartedAt]);

  // Use prop value if provided
  useEffect(() => {
    if (propTodayMinutes !== undefined) {
      setTodayStudyMinutes(propTodayMinutes);
    }
  }, [propTodayMinutes]);

  // Handle status change
  const handleStatusChange = useCallback(
    (newStatus: PresenceStatus) => {
      if (!presenceContext) return;

      switch (newStatus) {
        case 'studying':
          presenceContext.setStudying();
          break;
        case 'on_break':
          presenceContext.setOnBreak();
          break;
        default:
          presenceContext.resume();
      }
    },
    [presenceContext]
  );

  // Handle take break
  const handleTakeBreak = useCallback(() => {
    if (!presenceContext) return;
    presenceContext.setOnBreak();
  }, [presenceContext]);

  // If no context, render nothing (presence tracking not available)
  if (!presenceContext) {
    return null;
  }

  return (
    <StudyStatusBadge
      className={className}
      status={presenceContext.status}
      currentActivity={currentActivity}
      sessionStartedAt={sessionStartedAt ?? undefined}
      dailyGoalMinutes={dailyGoalMinutes}
      todayStudyMinutes={todayStudyMinutes}
      onStatusChange={handleStatusChange}
      onTakeBreak={handleTakeBreak}
      compact={compact}
    />
  );
}

export default ConnectedStudyStatusBadge;
