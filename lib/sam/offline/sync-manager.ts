/**
 * Background Sync Manager
 *
 * Manages queued messages and syncs them when connectivity is restored.
 * Uses server-wins conflict resolution.
 */

import { getIDBStore, type PendingMessage } from './idb-store';

// =============================================================================
// TYPES
// =============================================================================

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

type SyncStatusCallback = (status: 'syncing' | 'synced' | 'failed', result?: SyncResult) => void;

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_RETRY_COUNT = 3;
const SYNC_TAG = 'sam-offline-sync';

// =============================================================================
// SYNC MANAGER
// =============================================================================

export class SyncManager {
  private isSyncing = false;
  private listeners: SyncStatusCallback[] = [];

  /**
   * Queue a message for later sync
   */
  async queueMessage(
    message: string,
    courseId: string | null,
    conversationId: string | null
  ): Promise<string> {
    const store = getIDBStore();
    const id = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await store.addPendingMessage({
      id,
      message,
      courseId,
      conversationId,
      timestamp: Date.now(),
      retryCount: 0,
    });

    // Try to register background sync if available
    this.registerBackgroundSync();

    return id;
  }

  /**
   * Sync all pending messages
   */
  async syncPendingMessages(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    this.notifyListeners('syncing');

    const store = getIDBStore();
    const pending = await store.getPendingMessages();

    if (pending.length === 0) {
      this.isSyncing = false;
      const result: SyncResult = { success: true, syncedCount: 0, failedCount: 0, errors: [] };
      this.notifyListeners('synced', result);
      return result;
    }

    let syncedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const pendingMsg of pending) {
      try {
        await this.sendMessage(pendingMsg);
        await store.removePendingMessage(pendingMsg.id);
        syncedCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Message ${pendingMsg.id}: ${errorMsg}`);

        if (pendingMsg.retryCount >= MAX_RETRY_COUNT) {
          // Give up on this message
          await store.removePendingMessage(pendingMsg.id);
          failedCount++;
        } else {
          // Increment retry count
          await store.addPendingMessage({
            ...pendingMsg,
            retryCount: pendingMsg.retryCount + 1,
          });
          failedCount++;
        }
      }
    }

    this.isSyncing = false;
    const result: SyncResult = {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      errors,
    };

    this.notifyListeners(result.success ? 'synced' : 'failed', result);
    return result;
  }

  /**
   * Get count of pending messages
   */
  async getPendingCount(): Promise<number> {
    const store = getIDBStore();
    return store.getPendingMessageCount();
  }

  /**
   * Subscribe to sync status changes
   */
  onSyncStatus(callback: SyncStatusCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async sendMessage(pending: PendingMessage): Promise<void> {
    const response = await fetch('/api/sam/unified', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: pending.message,
        pageContext: {
          type: 'course-detail',
          path: `/courses/${pending.courseId}`,
          entityId: pending.courseId,
          entityType: 'course',
        },
        conversationId: pending.conversationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
  }

  private registerBackgroundSync(): void {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready
      .then((registration) => {
        if ('sync' in registration) {
          return (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register(SYNC_TAG);
        }
      })
      .catch(() => {
        // Background sync not supported
      });
  }

  private notifyListeners(status: 'syncing' | 'synced' | 'failed', result?: SyncResult): void {
    for (const listener of this.listeners) {
      listener(status, result);
    }
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let syncManagerInstance: SyncManager | null = null;

export function getSyncManager(): SyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager();
  }
  return syncManagerInstance;
}
