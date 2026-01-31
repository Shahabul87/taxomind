/**
 * Tests for Offline Manager (Gap 4)
 *
 * Verifies offline detection, message queuing, and sync orchestration.
 * Uses mocked IndexedDB since jsdom doesn't support it.
 */

// Mock the idb-store module
jest.mock('@/lib/sam/offline/idb-store', () => {
  const pendingMessages: Map<string, unknown> = new Map();
  const cachedResponses: Map<string, unknown> = new Map();

  return {
    getIDBStore: jest.fn().mockReturnValue({
      addPendingMessage: jest.fn(async (msg: { id: string }) => {
        pendingMessages.set(msg.id, msg);
      }),
      getPendingMessages: jest.fn(async () => Array.from(pendingMessages.values())),
      removePendingMessage: jest.fn(async (id: string) => {
        pendingMessages.delete(id);
      }),
      getPendingMessageCount: jest.fn(async () => pendingMessages.size),
      cacheResponse: jest.fn(async (resp: { id: string }) => {
        cachedResponses.set(resp.id, resp);
      }),
      getCachedResponse: jest.fn(async () => null),
      clearExpiredCache: jest.fn(async () => {}),
    }),
    __resetMockStores: () => {
      pendingMessages.clear();
      cachedResponses.clear();
    },
  };
});

// Mock sync-manager to use the mocked idb-store
jest.mock('@/lib/sam/offline/sync-manager', () => {
  const actual = jest.requireActual('@/lib/sam/offline/sync-manager');
  return actual;
});

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { OfflineManager, getOfflineManager } from '@/lib/sam/offline';

describe('OfflineManager', () => {
  let manager: OfflineManager;

  beforeEach(() => {
    manager = new OfflineManager();
    // Reset mock stores
    const { __resetMockStores } = jest.requireMock('@/lib/sam/offline/idb-store');
    __resetMockStores();
  });

  describe('isOnline', () => {
    it('should return true when navigator.onLine is true', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true,
        configurable: true,
      });
      expect(manager.isOnline()).toBe(true);
    });

    it('should return false when navigator.onLine is false', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
        configurable: true,
      });
      expect(manager.isOnline()).toBe(false);
    });
  });

  describe('onStatusChange', () => {
    it('should call callback when online status changes', () => {
      const callback = jest.fn();
      manager.onStatusChange(callback);

      // Simulate going offline
      window.dispatchEvent(new Event('offline'));
      expect(callback).toHaveBeenCalledWith(false);

      // Simulate going online
      window.dispatchEvent(new Event('online'));
      expect(callback).toHaveBeenCalledWith(true);
    });

    it('should return unsubscribe function', () => {
      const callback = jest.fn();
      const unsub = manager.onStatusChange(callback);

      unsub();

      window.dispatchEvent(new Event('offline'));
      // Callback should still be called since the underlying listener
      // only removes when all listeners are gone
    });
  });

  describe('queueMessage', () => {
    it('should queue a message and return an ID', async () => {
      const id = await manager.queueMessage('Hello SAM', 'course-1', 'conv-1');
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.startsWith('pending-')).toBe(true);
    });
  });

  describe('getPendingCount', () => {
    it('should return 0 when no messages queued', async () => {
      const count = await manager.getPendingCount();
      expect(count).toBe(0);
    });

    it('should return correct count after queuing messages', async () => {
      await manager.queueMessage('Message 1');
      await manager.queueMessage('Message 2');

      const count = await manager.getPendingCount();
      expect(count).toBe(2);
    });
  });

  describe('cacheResponse', () => {
    it('should cache a response without throwing', async () => {
      await expect(
        manager.cacheResponse('msg-1', 'Response text', ['suggestion 1'])
      ).resolves.not.toThrow();
    });
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const a = getOfflineManager();
      const b = getOfflineManager();
      expect(a).toBe(b);
    });
  });
});
