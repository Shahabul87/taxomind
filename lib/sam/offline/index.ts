/**
 * Offline Manager
 *
 * Orchestrates offline detection, message queuing, and background sync.
 * Client-side only — all imports use dynamic checks for browser APIs.
 */

import { getSyncManager } from './sync-manager';
import { getIDBStore } from './idb-store';

export { type PendingMessage, type CachedResponse, type ConversationSnapshot } from './idb-store';
export { getSyncManager } from './sync-manager';
export { getIDBStore } from './idb-store';

// =============================================================================
// TYPES
// =============================================================================

type OnlineStatusCallback = (isOnline: boolean) => void;

// =============================================================================
// OFFLINE MANAGER
// =============================================================================

export class OfflineManager {
  private statusListeners: OnlineStatusCallback[] = [];
  private boundOnline: (() => void) | null = null;
  private boundOffline: (() => void) | null = null;

  /**
   * Check current connectivity
   */
  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }

  /**
   * Subscribe to online/offline status changes
   */
  onStatusChange(callback: OnlineStatusCallback): () => void {
    this.statusListeners.push(callback);
    this.ensureListeners();

    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
      if (this.statusListeners.length === 0) {
        this.removeListeners();
      }
    };
  }

  /**
   * Queue a message for later delivery (when offline)
   */
  async queueMessage(
    message: string,
    courseId: string | null = null,
    conversationId: string | null = null
  ): Promise<string> {
    const syncManager = getSyncManager();
    return syncManager.queueMessage(message, courseId, conversationId);
  }

  /**
   * Attempt to sync all pending messages
   */
  async syncPendingMessages(): Promise<{ syncedCount: number; failedCount: number }> {
    const syncManager = getSyncManager();
    const result = await syncManager.syncPendingMessages();
    return { syncedCount: result.syncedCount, failedCount: result.failedCount };
  }

  /**
   * Get number of messages waiting to be sent
   */
  async getPendingCount(): Promise<number> {
    const syncManager = getSyncManager();
    return syncManager.getPendingCount();
  }

  /**
   * Cache a response for offline access
   */
  async cacheResponse(
    messageId: string,
    response: string,
    suggestions: string[],
    ttlMs: number = 24 * 60 * 60 * 1000
  ): Promise<void> {
    const store = getIDBStore();
    await store.cacheResponse({
      id: messageId,
      messageId,
      response,
      suggestions,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Cleanup expired cache entries
   */
  async cleanupCache(): Promise<void> {
    const store = getIDBStore();
    await store.clearExpiredCache();
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private ensureListeners(): void {
    if (typeof window === 'undefined') return;
    if (this.boundOnline) return;

    this.boundOnline = () => {
      this.notifyStatus(true);
      // Auto-sync when coming back online
      this.syncPendingMessages().catch(() => {});
    };

    this.boundOffline = () => {
      this.notifyStatus(false);
    };

    window.addEventListener('online', this.boundOnline);
    window.addEventListener('offline', this.boundOffline);
  }

  private removeListeners(): void {
    if (typeof window === 'undefined') return;
    if (this.boundOnline) {
      window.removeEventListener('online', this.boundOnline);
      this.boundOnline = null;
    }
    if (this.boundOffline) {
      window.removeEventListener('offline', this.boundOffline);
      this.boundOffline = null;
    }
  }

  private notifyStatus(isOnline: boolean): void {
    for (const listener of this.statusListeners) {
      listener(isOnline);
    }
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let offlineManagerInstance: OfflineManager | null = null;

export function getOfflineManager(): OfflineManager {
  if (!offlineManagerInstance) {
    offlineManagerInstance = new OfflineManager();
  }
  return offlineManagerInstance;
}
