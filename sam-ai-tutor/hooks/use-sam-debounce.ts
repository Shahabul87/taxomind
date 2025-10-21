import { useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

/**
 * SAM Debounce Hook - Stub Implementation
 * This is a minimal stub for backward compatibility
 */

interface SamDebouncedCall {
  key: string;
  fn: () => Promise<any>;
  delay?: number;
}

export function useSamDebounce() {
  const activeCallsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const debouncedCall = useCallback(
    ({ key, fn, delay = 1500 }: SamDebouncedCall) => {
      // Clear existing timeout for this key
      const existingTimeout = activeCallsRef.current.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeoutId = setTimeout(async () => {
        try {
          await fn();
          activeCallsRef.current.delete(key);
        } catch (error: any) {
          logger.error(`SAM debounced call failed for key: ${key}`, error);
          activeCallsRef.current.delete(key);
        }
      }, delay);

      activeCallsRef.current.set(key, timeoutId);
    },
    []
  );

  const cancelCall = useCallback((key: string) => {
    const timeout = activeCallsRef.current.get(key);
    if (timeout) {
      clearTimeout(timeout);
      activeCallsRef.current.delete(key);
    }
  }, []);

  const cancelAllCalls = useCallback(() => {
    activeCallsRef.current.forEach(timeout => clearTimeout(timeout));
    activeCallsRef.current.clear();
  }, []);

  return {
    debouncedCall,
    cancelCall,
    cancelAllCalls,
    hasActiveCalls: activeCallsRef.current.size > 0
  };
}
