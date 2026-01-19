'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type {
  PracticeSession,
  CreateSessionData,
  SessionTypeInfo,
  BloomsLevelInfo,
} from '@/components/sam/practice-dashboard/types';

// ============================================================================
// HOOK TYPES
// ============================================================================

interface UsePracticeSessionOptions {
  enabled?: boolean;
  pollInterval?: number;
}

interface UsePracticeSessionReturn {
  // State
  activeSession: PracticeSession | null;
  isLoading: boolean;
  isStarting: boolean;
  isPausing: boolean;
  isResuming: boolean;
  isEnding: boolean;
  error: string | null;

  // Session metadata
  sessionTypeInfo: SessionTypeInfo[];
  bloomsLevelInfo: BloomsLevelInfo[];

  // Actions
  startSession: (data: CreateSessionData) => Promise<PracticeSession | null>;
  pauseSession: () => Promise<boolean>;
  resumeSession: () => Promise<boolean>;
  endSession: (rating?: number, notes?: string) => Promise<boolean>;
  refreshActiveSession: () => Promise<void>;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function usePracticeSession(
  options: UsePracticeSessionOptions = {}
): UsePracticeSessionReturn {
  const { enabled = true, pollInterval = 5000 } = options;
  const { toast } = useToast();

  // State
  const [activeSession, setActiveSession] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session metadata from API
  const [sessionTypeInfo, setSessionTypeInfo] = useState<SessionTypeInfo[]>([]);
  const [bloomsLevelInfo, setBloomsLevelInfo] = useState<BloomsLevelInfo[]>([]);

  // Refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  const fetchActiveSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sam/practice/sessions/active');
      if (!response.ok) {
        throw new Error('Failed to fetch active session');
      }
      const result = await response.json();
      if (result.success) {
        setActiveSession(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch active session';
      setError(message);
      console.error('[usePracticeSession] fetchActiveSession error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSessionMetadata = useCallback(async () => {
    try {
      // Fetch sessions to get the metadata
      const response = await fetch('/api/sam/practice/sessions?limit=1');
      if (!response.ok) return;
      const result = await response.json();
      if (result.success) {
        setSessionTypeInfo(result.data.sessionTypeInfo || []);
        setBloomsLevelInfo(result.data.bloomsLevelInfo || []);
      }
    } catch (err) {
      console.error('[usePracticeSession] fetchSessionMetadata error:', err);
    }
  }, []);

  // ============================================================================
  // SESSION ACTIONS
  // ============================================================================

  const startSession = useCallback(
    async (data: CreateSessionData): Promise<PracticeSession | null> => {
      setIsStarting(true);
      setError(null);
      try {
        const response = await fetch('/api/sam/practice/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          // Check for active session conflict
          if (response.status === 409 && result.activeSession) {
            setActiveSession(result.activeSession);
            toast({
              title: 'Session Already Active',
              description: 'You have an active practice session. Please end it first.',
              variant: 'destructive',
            });
            return null;
          }
          throw new Error(result.error || 'Failed to start session');
        }

        if (result.success) {
          setActiveSession(result.data);
          toast({
            title: 'Session Started',
            description: `Started practicing ${data.skillName || 'skill'}`,
          });
          return result.data;
        }

        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to start session';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        return null;
      } finally {
        setIsStarting(false);
      }
    },
    [toast]
  );

  const pauseSession = useCallback(async (): Promise<boolean> => {
    if (!activeSession) return false;

    setIsPausing(true);
    setError(null);
    try {
      const response = await fetch(`/api/sam/practice/sessions/${activeSession.id}/pause`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to pause session');
      }

      const result = await response.json();
      if (result.success) {
        setActiveSession(result.data);
        toast({
          title: 'Session Paused',
          description: 'Your practice session has been paused.',
        });
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause session';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsPausing(false);
    }
  }, [activeSession, toast]);

  const resumeSession = useCallback(async (): Promise<boolean> => {
    if (!activeSession) return false;

    setIsResuming(true);
    setError(null);
    try {
      const response = await fetch(`/api/sam/practice/sessions/${activeSession.id}/resume`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to resume session');
      }

      const result = await response.json();
      if (result.success) {
        setActiveSession(result.data);
        toast({
          title: 'Session Resumed',
          description: 'Your practice session has resumed.',
        });
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume session';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsResuming(false);
    }
  }, [activeSession, toast]);

  const endSession = useCallback(
    async (rating?: number, notes?: string): Promise<boolean> => {
      if (!activeSession) return false;

      setIsEnding(true);
      setError(null);
      try {
        const response = await fetch(`/api/sam/practice/sessions/${activeSession.id}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, notes }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to end session');
        }

        const result = await response.json();
        if (result.success) {
          const { session, masteryUpdate } = result.data;
          setActiveSession(null);
          toast({
            title: 'Session Completed!',
            description: `Logged ${session.qualityHours.toFixed(2)} quality hours (${session.qualityMultiplier.toFixed(
              2
            )}x multiplier)`,
          });

          // Show mastery update if significant
          if (masteryUpdate && masteryUpdate.levelUp) {
            setTimeout(() => {
              toast({
                title: 'Level Up!',
                description: `You&apos;ve reached ${masteryUpdate.newLevel} in ${masteryUpdate.skillName}!`,
              });
            }, 1000);
          }

          return true;
        }

        return false;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to end session';
        setError(message);
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsEnding(false);
      }
    },
    [activeSession, toast]
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchActiveSession();
      fetchSessionMetadata();
    }
  }, [enabled, fetchActiveSession, fetchSessionMetadata]);

  // Poll for active session updates when session is active
  useEffect(() => {
    if (enabled && activeSession && activeSession.status === 'ACTIVE') {
      pollIntervalRef.current = setInterval(() => {
        fetchActiveSession();
      }, pollInterval);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [enabled, activeSession, pollInterval, fetchActiveSession]);

  return {
    // State
    activeSession,
    isLoading,
    isStarting,
    isPausing,
    isResuming,
    isEnding,
    error,

    // Session metadata
    sessionTypeInfo,
    bloomsLevelInfo,

    // Actions
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    refreshActiveSession: fetchActiveSession,
  };
}

export default usePracticeSession;
