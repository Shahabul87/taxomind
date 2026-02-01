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
import { useContextGathering } from './useContextGathering';
export function useContextMemorySync(options = {}) {
    const { syncDebounceMs = 2000, apiEndpoint = '/api/sam/context', enabled = true, ...gatheringOptions } = options;
    const { snapshot, isGathering, refresh } = useContextGathering({ enabled, ...gatheringOptions });
    const lastSyncedHashRef = useRef('');
    const syncTimerRef = useRef(null);
    const syncCountRef = useRef(0);
    const lastSyncedStateRef = useRef(null);
    const syncSnapshot = useCallback(async (snap) => {
        // Skip if same hash already synced
        if (snap.contentHash === lastSyncedHashRef.current)
            return;
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
        }
        catch {
            // Non-blocking — silently ignore sync failures
        }
    }, [apiEndpoint]);
    // Debounced sync on snapshot change
    useEffect(() => {
        if (!snapshot || !enabled)
            return;
        if (syncTimerRef.current)
            clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => {
            syncSnapshot(snapshot);
        }, syncDebounceMs);
        return () => {
            if (syncTimerRef.current)
                clearTimeout(syncTimerRef.current);
        };
    }, [snapshot?.contentHash, enabled, syncDebounceMs, syncSnapshot]);
    return {
        snapshot,
        isGathering,
        lastSynced: lastSyncedStateRef.current,
        syncCount: syncCountRef.current,
        refresh,
    };
}
