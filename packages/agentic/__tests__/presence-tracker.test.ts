/**
 * @sam-ai/agentic - Presence Tracker Tests
 * Tests for user presence tracking and activity monitoring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  PresenceTracker,
  InMemoryPresenceStore,
  createPresenceTracker,
  createInMemoryPresenceStore,
  type PresenceTrackerConfig,
} from '../src/realtime/presence-tracker';
import type { PresenceMetadata, ActivityPayload, PresenceStateChange } from '../src/realtime/types';
import { PresenceStatus, PresenceChangeReason } from '../src/realtime/types';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockMetadata(): PresenceMetadata {
  return {
    deviceType: 'desktop',
    browser: 'Chrome',
    os: 'macOS',
  };
}

function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

// ============================================================================
// IN-MEMORY PRESENCE STORE TESTS
// ============================================================================

describe('InMemoryPresenceStore', () => {
  let store: InMemoryPresenceStore;

  beforeEach(() => {
    store = createInMemoryPresenceStore();
  });

  describe('set and get', () => {
    it('should store and retrieve presence', async () => {
      const presence = {
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.ONLINE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      };

      await store.set(presence);
      const retrieved = await store.get('user-1');

      expect(retrieved).toEqual(presence);
    });

    it('should return null for non-existent user', async () => {
      const result = await store.get('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('getByConnection', () => {
    it('should retrieve presence by connection ID', async () => {
      const presence = {
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.ONLINE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      };

      await store.set(presence);
      const retrieved = await store.getByConnection('conn-1');

      expect(retrieved).toEqual(presence);
    });

    it('should return null for non-existent connection', async () => {
      const result = await store.getByConnection('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update existing presence', async () => {
      const presence = {
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.ONLINE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      };

      await store.set(presence);
      const updated = await store.update('user-1', { status: PresenceStatus.IDLE });

      expect(updated?.status).toBe(PresenceStatus.IDLE);
    });

    it('should return null when updating non-existent user', async () => {
      const result = await store.update('non-existent', { status: PresenceStatus.IDLE });
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete presence', async () => {
      const presence = {
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.ONLINE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      };

      await store.set(presence);
      const deleted = await store.delete('user-1');

      expect(deleted).toBe(true);
      expect(await store.get('user-1')).toBeNull();
    });

    it('should return false when deleting non-existent user', async () => {
      const result = await store.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('deleteByConnection', () => {
    it('should delete presence by connection ID', async () => {
      const presence = {
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.ONLINE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      };

      await store.set(presence);
      const deleted = await store.deleteByConnection('conn-1');

      expect(deleted).toBe(true);
      expect(await store.get('user-1')).toBeNull();
    });
  });

  describe('getOnline', () => {
    it('should return online and studying users', async () => {
      await store.set({
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.ONLINE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      });

      await store.set({
        userId: 'user-2',
        connectionId: 'conn-2',
        status: PresenceStatus.STUDYING,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      });

      await store.set({
        userId: 'user-3',
        connectionId: 'conn-3',
        status: PresenceStatus.OFFLINE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      });

      const online = await store.getOnline();
      expect(online).toHaveLength(2);
      expect(online.map((p) => p.userId)).toContain('user-1');
      expect(online.map((p) => p.userId)).toContain('user-2');
    });
  });

  describe('getByStatus', () => {
    it('should return users with specific status', async () => {
      await store.set({
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.IDLE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      });

      await store.set({
        userId: 'user-2',
        connectionId: 'conn-2',
        status: PresenceStatus.IDLE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      });

      const idle = await store.getByStatus(PresenceStatus.IDLE);
      expect(idle).toHaveLength(2);
    });
  });

  describe('cleanup', () => {
    it('should remove old offline presences', async () => {
      const oldDate = new Date(Date.now() - 100000);

      await store.set({
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.OFFLINE,
        lastActivityAt: oldDate,
        connectedAt: oldDate,
        metadata: createMockMetadata(),
        subscriptions: [],
      });

      const cutoff = new Date(Date.now() - 50000);
      const count = await store.cleanup(cutoff);

      expect(count).toBe(1);
      expect(await store.get('user-1')).toBeNull();
    });

    it('should not remove online users', async () => {
      const oldDate = new Date(Date.now() - 100000);

      await store.set({
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.ONLINE,
        lastActivityAt: oldDate,
        connectedAt: oldDate,
        metadata: createMockMetadata(),
        subscriptions: [],
      });

      const cutoff = new Date(Date.now() - 50000);
      const count = await store.cleanup(cutoff);

      expect(count).toBe(0);
      expect(await store.get('user-1')).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all presences', async () => {
      await store.set({
        userId: 'user-1',
        connectionId: 'conn-1',
        status: PresenceStatus.ONLINE,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: createMockMetadata(),
        subscriptions: [],
      });

      store.clear();

      expect(await store.get('user-1')).toBeNull();
      expect(await store.getOnline()).toHaveLength(0);
    });
  });
});

// ============================================================================
// PRESENCE TRACKER TESTS
// ============================================================================

describe('PresenceTracker', () => {
  let tracker: PresenceTracker;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    tracker = createPresenceTracker({
      config: {
        idleTimeoutMs: 1000,
        awayTimeoutMs: 3000,
        offlineTimeoutMs: 5000,
        checkIntervalMs: 500,
        autoCheckTimeouts: false, // Disable for manual testing
      },
      logger: mockLogger,
    });
  });

  afterEach(() => {
    tracker.stop();
  });

  describe('lifecycle', () => {
    it('should start and stop without errors', () => {
      tracker.start();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Presence tracker started',
        expect.any(Object)
      );

      tracker.stop();
      expect(mockLogger.info).toHaveBeenCalledWith('Presence tracker stopped');
    });

    it('should not restart if already running', () => {
      tracker.start();
      tracker.start();
      // Should only log once
      expect(
        mockLogger.info.mock.calls.filter(
          (call) => call[0] === 'Presence tracker started'
        )
      ).toHaveLength(1);
    });
  });

  describe('connect', () => {
    it('should create presence on connect', async () => {
      const presence = await tracker.connect('user-1', 'conn-1', createMockMetadata());

      expect(presence.userId).toBe('user-1');
      expect(presence.connectionId).toBe('conn-1');
      expect(presence.status).toBe(PresenceStatus.ONLINE);
    });

    it('should emit presence change on connect', async () => {
      const changeHandler = vi.fn();
      tracker.onPresenceChange(changeHandler);

      await tracker.connect('user-1', 'conn-1', createMockMetadata());

      expect(changeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          previousStatus: PresenceStatus.OFFLINE,
          newStatus: PresenceStatus.ONLINE,
          reason: PresenceChangeReason.CONNECTED,
        })
      );
    });
  });

  describe('disconnect', () => {
    it('should update status to offline on disconnect', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.disconnect('conn-1');

      const presence = await tracker.getPresence('user-1');
      expect(presence?.status).toBe(PresenceStatus.OFFLINE);
    });

    it('should emit presence change on disconnect', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());

      const changeHandler = vi.fn();
      tracker.onPresenceChange(changeHandler);

      await tracker.disconnect('conn-1');

      expect(changeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          newStatus: PresenceStatus.OFFLINE,
          reason: PresenceChangeReason.DISCONNECTED,
        })
      );
    });

    it('should handle disconnect for unknown connection', async () => {
      await tracker.disconnect('unknown-conn');
      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('recordActivity', () => {
    it('should update last activity time', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      const originalPresence = await tracker.getPresence('user-1');
      const originalTime = originalPresence?.lastActivityAt;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      const activity: ActivityPayload = {
        type: 'interaction',
        data: {},
      };
      await tracker.recordActivity('user-1', activity);

      const updatedPresence = await tracker.getPresence('user-1');
      expect(updatedPresence?.lastActivityAt.getTime()).toBeGreaterThan(
        originalTime?.getTime() ?? 0
      );
    });

    it('should transition to STUDYING when on course page', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());

      const activity: ActivityPayload = {
        type: 'interaction',
        data: {},
        pageContext: {
          url: '/courses/123',
          courseId: 'course-123',
        },
      };
      await tracker.recordActivity('user-1', activity);

      const presence = await tracker.getPresence('user-1');
      expect(presence?.status).toBe(PresenceStatus.STUDYING);
    });

    it('should return to online from idle on activity', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.updateStatus('user-1', PresenceStatus.IDLE);

      const activity: ActivityPayload = {
        type: 'focus',
        data: {},
      };
      await tracker.recordActivity('user-1', activity);

      const presence = await tracker.getPresence('user-1');
      expect(presence?.status).toBe(PresenceStatus.ONLINE);
    });

    it('should warn for activity from unknown user', async () => {
      const activity: ActivityPayload = {
        type: 'interaction',
        data: {},
      };
      await tracker.recordActivity('unknown-user', activity);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Activity recorded for unknown user',
        expect.any(Object)
      );
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.updateStatus('user-1', PresenceStatus.DO_NOT_DISTURB);

      const presence = await tracker.getPresence('user-1');
      expect(presence?.status).toBe(PresenceStatus.DO_NOT_DISTURB);
    });

    it('should emit change event', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());

      const changeHandler = vi.fn();
      tracker.onPresenceChange(changeHandler);

      await tracker.updateStatus('user-1', PresenceStatus.DO_NOT_DISTURB);

      expect(changeHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          newStatus: PresenceStatus.DO_NOT_DISTURB,
          reason: PresenceChangeReason.USER_SET,
        })
      );
    });

    it('should not emit if status unchanged', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());

      const changeHandler = vi.fn();
      tracker.onPresenceChange(changeHandler);

      await tracker.updateStatus('user-1', PresenceStatus.ONLINE);

      // Should not emit because already ONLINE from connect
      expect(changeHandler).not.toHaveBeenCalled();
    });
  });

  describe('checkTimeouts', () => {
    it('should transition online to idle after timeout', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());

      // Manually set last activity to past
      const presence = await tracker.getPresence('user-1');
      if (presence) {
        presence.lastActivityAt = new Date(Date.now() - 2000); // 2 seconds ago
      }

      const changes = await tracker.checkTimeouts();

      expect(changes.some((c) => c.userId === 'user-1' && c.newStatus === PresenceStatus.IDLE)).toBe(
        true
      );
    });

    it('should transition idle to away after timeout', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.updateStatus('user-1', PresenceStatus.IDLE);

      // Manually set last activity to past
      const presence = await tracker.getPresence('user-1');
      if (presence) {
        presence.lastActivityAt = new Date(Date.now() - 4000); // 4 seconds ago
      }

      const changes = await tracker.checkTimeouts();

      expect(changes.some((c) => c.userId === 'user-1' && c.newStatus === PresenceStatus.AWAY)).toBe(
        true
      );
    });

    it('should transition away to offline after timeout', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.updateStatus('user-1', PresenceStatus.AWAY);

      // Manually set last activity to past
      const presence = await tracker.getPresence('user-1');
      if (presence) {
        presence.lastActivityAt = new Date(Date.now() - 6000); // 6 seconds ago
      }

      const changes = await tracker.checkTimeouts();

      expect(
        changes.some((c) => c.userId === 'user-1' && c.newStatus === PresenceStatus.OFFLINE)
      ).toBe(true);
    });
  });

  describe('queries', () => {
    it('should get online users', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.connect('user-2', 'conn-2', createMockMetadata());

      const online = await tracker.getOnlineUsers();
      expect(online).toHaveLength(2);
    });

    it('should get studying users', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.recordActivity('user-1', {
        type: 'interaction',
        data: {},
        pageContext: { url: '/courses/123', courseId: 'course-123' },
      });

      const studying = await tracker.getStudyingUsers();
      expect(studying).toHaveLength(1);
      expect(studying[0].userId).toBe('user-1');
    });

    it('should get idle users', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.updateStatus('user-1', PresenceStatus.IDLE);

      const idle = await tracker.getIdleUsers();
      expect(idle).toHaveLength(1);
    });

    it('should check if user is online', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());

      expect(await tracker.isUserOnline('user-1')).toBe(true);
      expect(await tracker.isUserOnline('non-existent')).toBe(false);
    });
  });

  describe('subscriptions', () => {
    it('should add subscriptions', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.subscribe('user-1', ['channel-1', 'channel-2']);

      const presence = await tracker.getPresence('user-1');
      expect(presence?.subscriptions).toContain('channel-1');
      expect(presence?.subscriptions).toContain('channel-2');
    });

    it('should remove subscriptions', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.subscribe('user-1', ['channel-1', 'channel-2']);
      await tracker.unsubscribe('user-1', ['channel-1']);

      const presence = await tracker.getPresence('user-1');
      expect(presence?.subscriptions).not.toContain('channel-1');
      expect(presence?.subscriptions).toContain('channel-2');
    });

    it('should get users subscribed to channel', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.connect('user-2', 'conn-2', createMockMetadata());
      await tracker.subscribe('user-1', ['channel-1']);
      await tracker.subscribe('user-2', ['channel-1', 'channel-2']);

      const subscribers = await tracker.getSubscribedUsers('channel-1');
      expect(subscribers).toHaveLength(2);
      expect(subscribers).toContain('user-1');
      expect(subscribers).toContain('user-2');
    });
  });

  describe('change listener', () => {
    it('should subscribe and unsubscribe from changes', async () => {
      const handler = vi.fn();
      const unsubscribe = tracker.onPresenceChange(handler);

      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      expect(handler).toHaveBeenCalled();

      handler.mockClear();
      unsubscribe();

      await tracker.connect('user-2', 'conn-2', createMockMetadata());
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup old presences', async () => {
      await tracker.connect('user-1', 'conn-1', createMockMetadata());
      await tracker.disconnect('conn-1');

      // Set last activity to old
      const presence = await tracker.getPresence('user-1');
      if (presence) {
        presence.lastActivityAt = new Date(Date.now() - 100000);
      }

      const count = await tracker.cleanup(50000);
      expect(count).toBe(1);
    });
  });
});
