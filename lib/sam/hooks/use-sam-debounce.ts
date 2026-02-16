import { useCallback, useRef, useState } from 'react';
import { logger } from '@/lib/logger';

/**
 * SAM Debounce Hook — Promise-based debounce with leading/trailing and maxWait.
 *
 * Features:
 * - `debouncedCall` returns `Promise<T>` so callers can await results
 * - Leading and trailing execution modes
 * - MaxWait protection to guarantee execution within a time window
 * - `pendingCount` tracks active debounced calls
 * - Backward-compatible: `hasActiveCalls` getter preserved
 */

interface SamDebouncedCall<T> {
  key: string;
  fn: () => Promise<T>;
  delay?: number;
}

interface DebounceOptions {
  /** Fire on the leading edge. Default: false */
  leading?: boolean;
  /** Fire on the trailing edge. Default: true */
  trailing?: boolean;
  /** Max time (ms) the function can be delayed before forced execution */
  maxWait?: number;
}

interface PendingEntry<T> {
  timeoutId: NodeJS.Timeout;
  maxWaitTimeoutId?: NodeJS.Timeout;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  leadingFired: boolean;
  fn: () => Promise<T>;
}

export function useSamDebounce(options?: DebounceOptions) {
  const leading = options?.leading ?? false;
  const trailing = options?.trailing ?? true;
  const maxWait = options?.maxWait;

  const pendingRef = useRef<Map<string, PendingEntry<unknown>>>(new Map());
  const [pendingCount, setPendingCount] = useState(0);

  const cleanup = useCallback((key: string) => {
    const entry = pendingRef.current.get(key);
    if (entry) {
      clearTimeout(entry.timeoutId);
      if (entry.maxWaitTimeoutId) clearTimeout(entry.maxWaitTimeoutId);
      pendingRef.current.delete(key);
      setPendingCount(pendingRef.current.size);
    }
  }, []);

  const execute = useCallback(
    async <T>(key: string, fn: () => Promise<T>, resolve: (v: T) => void, reject: (e: unknown) => void) => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        logger.error(`SAM debounced call failed for key: ${key}`, error);
        reject(error);
      } finally {
        pendingRef.current.delete(key);
        setPendingCount(pendingRef.current.size);
      }
    },
    [],
  );

  const debouncedCall = useCallback(
    <T>({ key, fn, delay = 1500 }: SamDebouncedCall<T>): Promise<T> => {
      // Clean up previous pending call for same key
      const existing = pendingRef.current.get(key);
      if (existing) {
        clearTimeout(existing.timeoutId);
        if (existing.maxWaitTimeoutId) clearTimeout(existing.maxWaitTimeoutId);
        // Reject previous promise if it hasn't resolved yet
        existing.reject(new Error(`Debounced call superseded for key: ${key}`));
        pendingRef.current.delete(key);
      }

      return new Promise<T>((resolve, reject) => {
        let leadingFired = false;

        // Leading edge: execute immediately on first call
        if (leading && !existing) {
          leadingFired = true;
          execute(key, fn, resolve, reject);
          if (!trailing) return; // If no trailing, we're done
        }

        // Set trailing timeout
        const timeoutId = setTimeout(() => {
          if (trailing && !leadingFired) {
            execute(key, fn, resolve, reject);
          } else if (!leadingFired) {
            // Neither leading nor trailing fired — clean up
            pendingRef.current.delete(key);
            setPendingCount(pendingRef.current.size);
            resolve(undefined as T);
          } else {
            // Leading already fired, just clean up maxWait
            const entry = pendingRef.current.get(key);
            if (entry?.maxWaitTimeoutId) clearTimeout(entry.maxWaitTimeoutId);
            pendingRef.current.delete(key);
            setPendingCount(pendingRef.current.size);
          }
        }, delay);

        // MaxWait: force execution if delay keeps getting reset
        let maxWaitTimeoutId: NodeJS.Timeout | undefined;
        if (maxWait !== undefined && trailing && !leadingFired) {
          maxWaitTimeoutId = setTimeout(() => {
            const entry = pendingRef.current.get(key);
            if (entry) {
              clearTimeout(entry.timeoutId);
              execute(key, fn, resolve, reject);
            }
          }, maxWait);
        }

        if (!leadingFired || trailing) {
          pendingRef.current.set(key, {
            timeoutId,
            maxWaitTimeoutId,
            resolve: resolve as (v: unknown) => void,
            reject,
            leadingFired,
            fn: fn as () => Promise<unknown>,
          });
          setPendingCount(pendingRef.current.size);
        }
      });
    },
    [leading, trailing, maxWait, execute],
  );

  const cancelCall = useCallback(
    (key: string) => {
      const entry = pendingRef.current.get(key);
      if (entry) {
        entry.reject(new Error(`Debounced call cancelled for key: ${key}`));
        cleanup(key);
      }
    },
    [cleanup],
  );

  const cancelAllCalls = useCallback(() => {
    pendingRef.current.forEach((entry, key) => {
      entry.reject(new Error(`Debounced call cancelled for key: ${key}`));
    });
    pendingRef.current.forEach((entry) => {
      clearTimeout(entry.timeoutId);
      if (entry.maxWaitTimeoutId) clearTimeout(entry.maxWaitTimeoutId);
    });
    pendingRef.current.clear();
    setPendingCount(0);
  }, []);

  return {
    debouncedCall,
    cancelCall,
    cancelAllCalls,
    pendingCount,
    /** Backward-compatible getter */
    get hasActiveCalls() {
      return pendingRef.current.size > 0;
    },
  };
}
