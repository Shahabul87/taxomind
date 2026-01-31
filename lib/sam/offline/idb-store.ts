/**
 * IndexedDB Store for Offline Support
 *
 * Provides a typed wrapper around IndexedDB for storing
 * pending messages, cached responses, and conversation snapshots.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface PendingMessage {
  id: string;
  message: string;
  courseId: string | null;
  conversationId: string | null;
  timestamp: number;
  retryCount: number;
}

export interface CachedResponse {
  id: string;
  messageId: string;
  response: string;
  suggestions: string[];
  timestamp: number;
  expiresAt: number;
}

export interface ConversationSnapshot {
  id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  updatedAt: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DB_NAME = 'sam-offline';
const DB_VERSION = 1;
const STORES = {
  PENDING_MESSAGES: 'pending-messages',
  CACHED_RESPONSES: 'cached-responses',
  CONVERSATION_SNAPSHOTS: 'conversation-snapshots',
} as const;

// =============================================================================
// IDB STORE
// =============================================================================

export class IDBStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Open or create the IndexedDB database
   */
  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORES.PENDING_MESSAGES)) {
          const store = db.createObjectStore(STORES.PENDING_MESSAGES, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains(STORES.CACHED_RESPONSES)) {
          const store = db.createObjectStore(STORES.CACHED_RESPONSES, { keyPath: 'id' });
          store.createIndex('expiresAt', 'expiresAt');
        }
        if (!db.objectStoreNames.contains(STORES.CONVERSATION_SNAPSHOTS)) {
          db.createObjectStore(STORES.CONVERSATION_SNAPSHOTS, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // ---------------------------------------------------------------------------
  // Pending Messages
  // ---------------------------------------------------------------------------

  async addPendingMessage(message: PendingMessage): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_MESSAGES, 'readwrite');
      tx.objectStore(STORES.PENDING_MESSAGES).put(message);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getPendingMessages(): Promise<PendingMessage[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_MESSAGES, 'readonly');
      const request = tx.objectStore(STORES.PENDING_MESSAGES).index('timestamp').getAll();
      request.onsuccess = () => resolve(request.result as PendingMessage[]);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingMessage(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_MESSAGES, 'readwrite');
      tx.objectStore(STORES.PENDING_MESSAGES).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getPendingMessageCount(): Promise<number> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PENDING_MESSAGES, 'readonly');
      const request = tx.objectStore(STORES.PENDING_MESSAGES).count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ---------------------------------------------------------------------------
  // Cached Responses
  // ---------------------------------------------------------------------------

  async cacheResponse(response: CachedResponse): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CACHED_RESPONSES, 'readwrite');
      tx.objectStore(STORES.CACHED_RESPONSES).put(response);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCachedResponse(messageId: string): Promise<CachedResponse | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CACHED_RESPONSES, 'readonly');
      const request = tx.objectStore(STORES.CACHED_RESPONSES).get(messageId);
      request.onsuccess = () => {
        const result = request.result as CachedResponse | undefined;
        if (result && result.expiresAt > Date.now()) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpiredCache(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CACHED_RESPONSES, 'readwrite');
      const store = tx.objectStore(STORES.CACHED_RESPONSES);
      const request = store.index('expiresAt').openCursor();
      const now = Date.now();

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const record = cursor.value as CachedResponse;
          if (record.expiresAt < now) {
            cursor.delete();
          }
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ---------------------------------------------------------------------------
  // Conversation Snapshots
  // ---------------------------------------------------------------------------

  async saveSnapshot(snapshot: ConversationSnapshot): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CONVERSATION_SNAPSHOTS, 'readwrite');
      tx.objectStore(STORES.CONVERSATION_SNAPSHOTS).put(snapshot);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSnapshot(conversationId: string): Promise<ConversationSnapshot | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.CONVERSATION_SNAPSHOTS, 'readonly');
      const request = tx.objectStore(STORES.CONVERSATION_SNAPSHOTS).get(conversationId);
      request.onsuccess = () => resolve((request.result as ConversationSnapshot) ?? null);
      request.onerror = () => reject(request.error);
    });
  }
}

// =============================================================================
// SINGLETON
// =============================================================================

let idbStoreInstance: IDBStore | null = null;

export function getIDBStore(): IDBStore {
  if (!idbStoreInstance) {
    idbStoreInstance = new IDBStore();
  }
  return idbStoreInstance;
}
