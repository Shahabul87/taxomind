/**
 * @sam-ai/react - useContextMemorySync
 *
 * Bridges useContextGathering with the /api/sam/context endpoint.
 * Automatically submits snapshots when page context changes.
 *
 * Features:
 * - Debounced at 2 seconds to batch rapid changes
 * - Skips redundant submissions via contentHash comparison
 * - Non-blocking — failures are silently ignored
 */

import { useEffect, useRef, useCallback } from 'react';
import type { PageContextSnapshot } from '@sam-ai/core';
import { useContextGathering } from './useContextGathering';
import type { UseContextGatheringOptions } from '@sam-ai/core';

export interface UseContextMemorySyncOptions extends UseContextGatheringOptions {
  /** Whether context gathering and sync is enabled. Default: true */
  enabled?: boolean;
  /** Sync debounce in ms. Default: 2000 */
  syncDebounceMs?: number;
  /** API endpoint. Default: '/api/sam/context' */
  apiEndpoint?: string;
}

export interface UseContextMemorySyncReturn {
  snapshot: PageContextSnapshot | null;
  isGathering: boolean;
  lastSynced: Date | null;
  syncCount: number;
  refresh: () => void;
}

export function useContextMemorySync(
  options: UseContextMemorySyncOptions = {},
): UseContextMemorySyncReturn {
  const {
    syncDebounceMs = 2000,
    apiEndpoint = '/api/sam/context',
    enabled = true,
    ...gatheringOptions
  } = options;

  const { snapshot, isGathering, refresh } =
    useContextGathering({ enabled, ...gatheringOptions });

  const lastSyncedHashRef = useRef<string>('');
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncCountRef = useRef(0);
  const lastSyncedStateRef = useRef<Date | null>(null);

  const syncSnapshot = useCallback(
    async (snap: PageContextSnapshot) => {
      // Skip if same hash already synced
      if (snap.contentHash === lastSyncedHashRef.current) return;

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snapshot: snap }),
        });

        if (response.ok) {
          lastSyncedHashRef.current = snap.contentHash;
          lastSyncedStateRef.current = new Date();
          syncCountRef.current += 1;
        }
      } catch {
        // Non-blocking — silently ignore sync failures
      }
    },
    [apiEndpoint],
  );

  // Debounced sync on snapshot change
  // syncSnapshot already deduplicates via contentHash comparison
  useEffect(() => {
    if (!snapshot || !enabled) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(() => {
      syncSnapshot(snapshot);
    }, syncDebounceMs);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [snapshot, enabled, syncDebounceMs, syncSnapshot]);

  return {
    snapshot,
    isGathering,
    lastSynced: lastSyncedStateRef.current,
    syncCount: syncCountRef.current,
    refresh,
  };
}
