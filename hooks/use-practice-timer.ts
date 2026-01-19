'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { PracticeSession } from '@/components/sam/practice-dashboard/types';

// ============================================================================
// HOOK TYPES
// ============================================================================

interface UsePracticeTimerOptions {
  session: PracticeSession | null;
  updateInterval?: number;
}

interface UsePracticeTimerReturn {
  // Timer values
  elapsedSeconds: number;
  elapsedMinutes: number;
  elapsedHours: number;

  // Formatted time
  formattedTime: string;
  formattedTimeCompact: string;

  // Estimated quality hours
  estimatedQualityHours: number;
  estimatedQualityMultiplier: number;

  // Timer state
  isRunning: boolean;
  isPaused: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(hours.toString().padStart(2, '0'));
  }
  parts.push(minutes.toString().padStart(2, '0'));
  parts.push(secs.toString().padStart(2, '0'));

  return parts.join(':');
}

function formatTimeCompact(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// ============================================================================
// QUALITY MULTIPLIER CALCULATION
// ============================================================================

const SESSION_TYPE_MULTIPLIERS: Record<string, number> = {
  DELIBERATE: 1.5,
  POMODORO: 1.35,
  GUIDED: 1.2,
  ASSESSMENT: 1.4,
  CASUAL: 0.8,
  REVIEW: 1.1,
};

const FOCUS_LEVEL_MULTIPLIERS: Record<string, number> = {
  DEEP_FLOW: 1.5,
  HIGH: 1.25,
  MEDIUM: 1.0,
  LOW: 0.75,
  VERY_LOW: 0.5,
};

const BLOOMS_MULTIPLIERS: Record<string, number> = {
  CREATE: 1.5,
  EVALUATE: 1.4,
  ANALYZE: 1.3,
  APPLY: 1.2,
  UNDERSTAND: 1.1,
  REMEMBER: 1.0,
};

function calculateQualityMultiplier(session: PracticeSession): number {
  const sessionTypeMult = SESSION_TYPE_MULTIPLIERS[session.sessionType] ?? 1;
  const focusLevelMult = FOCUS_LEVEL_MULTIPLIERS[session.focusLevel] ?? 1;
  const bloomsMult = session.bloomsLevel
    ? BLOOMS_MULTIPLIERS[session.bloomsLevel] ?? 1
    : 1;

  // Geometric mean of multipliers for balanced weighting
  return Math.pow(sessionTypeMult * focusLevelMult * bloomsMult, 1 / 3);
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function usePracticeTimer(
  options: UsePracticeTimerOptions
): UsePracticeTimerReturn {
  const { session, updateInterval = 1000 } = options;

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate initial elapsed time from session
  const calculateElapsed = useCallback((): number => {
    if (!session || !session.startedAt) return 0;

    const startTime = new Date(session.startedAt).getTime();
    const pausedSeconds = session.totalPausedSeconds ?? 0;

    if (session.status === 'ACTIVE') {
      const now = Date.now();
      return Math.floor((now - startTime) / 1000) - pausedSeconds;
    }

    if (session.status === 'PAUSED' && session.pausedAt) {
      const pauseTime = new Date(session.pausedAt).getTime();
      return Math.floor((pauseTime - startTime) / 1000) - pausedSeconds;
    }

    // Use provided elapsed if available
    if (session.currentElapsedSeconds !== undefined) {
      return session.currentElapsedSeconds;
    }

    return 0;
  }, [session]);

  // Derived values
  const isRunning = session?.status === 'ACTIVE';
  const isPaused = session?.status === 'PAUSED';

  const elapsedMinutes = useMemo(() => Math.floor(elapsedSeconds / 60), [elapsedSeconds]);
  const elapsedHours = useMemo(() => elapsedSeconds / 3600, [elapsedSeconds]);

  const formattedTime = useMemo(() => formatTime(elapsedSeconds), [elapsedSeconds]);
  const formattedTimeCompact = useMemo(
    () => formatTimeCompact(elapsedSeconds),
    [elapsedSeconds]
  );

  const estimatedQualityMultiplier = useMemo(
    () => (session ? calculateQualityMultiplier(session) : 1),
    [session]
  );

  const estimatedQualityHours = useMemo(
    () => elapsedHours * estimatedQualityMultiplier,
    [elapsedHours, estimatedQualityMultiplier]
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initialize elapsed time when session changes
  useEffect(() => {
    setElapsedSeconds(calculateElapsed());
  }, [calculateElapsed]);

  // Run timer when session is active
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, updateInterval]);

  // Reset timer when session ends
  useEffect(() => {
    if (!session) {
      setElapsedSeconds(0);
    }
  }, [session]);

  return {
    // Timer values
    elapsedSeconds,
    elapsedMinutes,
    elapsedHours,

    // Formatted time
    formattedTime,
    formattedTimeCompact,

    // Estimated quality hours
    estimatedQualityHours,
    estimatedQualityMultiplier,

    // Timer state
    isRunning,
    isPaused,
  };
}

export default usePracticeTimer;
