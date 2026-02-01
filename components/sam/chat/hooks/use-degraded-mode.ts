/**
 * Degraded Mode Hook
 *
 * Detects when the AI backend is unavailable and manages degraded mode state.
 * Queues failed messages for retry when connectivity returns.
 */

import { useCallback, useRef, useState } from 'react';
import { getCachedResponse } from '@/lib/sam/cache/response-cache';

// =============================================================================
// TYPES
// =============================================================================

interface QueuedMessage {
  content: string;
  timestamp: number;
}

interface DegradedModeState {
  isDegraded: boolean;
  consecutiveFailures: number;
  lastFailure: number | null;
  queuedMessages: QueuedMessage[];
}

interface UseDegradedModeReturn {
  isDegraded: boolean;
  queuedMessageCount: number;
  recordFailure: () => void;
  recordSuccess: () => void;
  queueMessage: (content: string) => void;
  getQueuedMessages: () => QueuedMessage[];
  retryPendingMessages: (sendFn: (content: string) => Promise<void>) => Promise<void>;
  getCachedFallback: (query: string, mode: string, pageType: string) => string | null;
  clearQueue: () => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const FAILURE_THRESHOLD = 2; // Enter degraded mode after 2 consecutive failures
const MAX_QUEUED_MESSAGES = 5;
const RECOVERY_COOLDOWN_MS = 30_000; // 30 seconds before auto-recovery attempt

// =============================================================================
// HOOK
// =============================================================================

export function useDegradedMode(): UseDegradedModeReturn {
  const [state, setState] = useState<DegradedModeState>({
    isDegraded: false,
    consecutiveFailures: 0,
    lastFailure: null,
    queuedMessages: [],
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const recordFailure = useCallback(() => {
    setState((prev) => {
      const failures = prev.consecutiveFailures + 1;
      return {
        ...prev,
        consecutiveFailures: failures,
        isDegraded: failures >= FAILURE_THRESHOLD,
        lastFailure: Date.now(),
      };
    });
  }, []);

  const recordSuccess = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDegraded: false,
      consecutiveFailures: 0,
    }));
  }, []);

  const queueMessage = useCallback((content: string) => {
    setState((prev) => {
      const queued = [...prev.queuedMessages, { content, timestamp: Date.now() }];
      // Keep only most recent messages within the limit
      return {
        ...prev,
        queuedMessages: queued.slice(-MAX_QUEUED_MESSAGES),
      };
    });
  }, []);

  const getQueuedMessages = useCallback((): QueuedMessage[] => {
    return stateRef.current.queuedMessages;
  }, []);

  const retryPendingMessages = useCallback(
    async (sendFn: (content: string) => Promise<void>) => {
      const messages = stateRef.current.queuedMessages;
      if (messages.length === 0) return;

      // Clear queue first to avoid double-sends
      setState((prev) => ({ ...prev, queuedMessages: [] }));

      for (const msg of messages) {
        try {
          await sendFn(msg.content);
        } catch {
          // If retry fails, re-queue the remaining messages
          const remaining = messages.slice(messages.indexOf(msg));
          setState((prev) => ({
            ...prev,
            queuedMessages: remaining,
          }));
          break;
        }
      }
    },
    []
  );

  const getCachedFallback = useCallback(
    (query: string, mode: string, pageType: string): string | null => {
      const cached = getCachedResponse(query, mode, pageType);
      if (!cached) return null;
      return cached.response;
    },
    []
  );

  const clearQueue = useCallback(() => {
    setState((prev) => ({ ...prev, queuedMessages: [] }));
  }, []);

  return {
    isDegraded: state.isDegraded,
    queuedMessageCount: state.queuedMessages.length,
    recordFailure,
    recordSuccess,
    queueMessage,
    getQueuedMessages,
    retryPendingMessages,
    getCachedFallback,
    clearQueue,
  };
}
