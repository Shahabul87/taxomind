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
import type { PageContextSnapshot } from '@sam-ai/core';
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
export declare function useContextMemorySync(options?: UseContextMemorySyncOptions): UseContextMemorySyncReturn;
//# sourceMappingURL=useContextMemorySync.d.ts.map