/**
 * Tests for @sam-ai/realtime - Presence Manager
 * Covers: PresenceManager (connect, disconnect, status, heartbeat, subscriptions, listeners)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PresenceManager, createPresenceManager } from '../presence-manager';

describe('PresenceManager', () => {
  let manager: PresenceManager;

  beforeEach(() => {
    manager = new PresenceManager({
      staleTimeout: 5 * 60 * 1000,
      cleanupInterval: 60 * 60 * 1000, // Long interval to avoid interference
    });
  });

  afterEach(() => {
    manager.stop();
  });

  describe('connect', () => {
    it('registers a user as online', async () => {
      const presence = await manager.connect('user-1', 'conn-1');

      expect(presence.userId).toBe('user-1');
      expect(presence.connectionId).toBe('conn-1');
      expect(presence.status).toBe('online');
    });

    it('preserves existing connectedAt on reconnect', async () => {
      const first = await manager.connect('user-1', 'conn-1');
      const second = await manager.connect('user-1', 'conn-2');

      expect(second.connectedAt).toEqual(first.connectedAt);
    });

    it('passes device metadata', async () => {
      const presence = await manager.connect('user-1', 'conn-1', {
        deviceType: 'mobile',
        browser: 'Safari',
        courseId: 'course-1',
      });

      expect(presence.deviceType).toBe('mobile');
      expect(presence.browser).toBe('Safari');
      expect(presence.courseId).toBe('course-1');
    });
  });

  describe('disconnect', () => {
    it('marks user as offline', async () => {
      await manager.connect('user-1', 'conn-1');
      await manager.disconnect('user-1');

      const presence = await manager.getPresence('user-1');
      expect(presence?.status).toBe('offline');
    });

    it('handles disconnect for non-existent user', async () => {
      // Should not throw
      await manager.disconnect('unknown');
    });
  });

  describe('updateStatus', () => {
    it('updates user status', async () => {
      await manager.connect('user-1', 'conn-1');

      const updated = await manager.updateStatus('user-1', 'busy');

      expect(updated?.status).toBe('busy');
    });

    it('returns null for non-existent user', async () => {
      const result = await manager.updateStatus('unknown', 'busy');
      expect(result).toBeNull();
    });
  });

  describe('heartbeat', () => {
    it('updates lastActivityAt', async () => {
      await manager.connect('user-1', 'conn-1');

      const result = await manager.heartbeat('user-1');
      expect(result).toBe(true);
    });

    it('transitions from away to online', async () => {
      await manager.connect('user-1', 'conn-1');
      await manager.updateStatus('user-1', 'away');

      await manager.heartbeat('user-1');

      const presence = await manager.getPresence('user-1');
      expect(presence?.status).toBe('online');
    });

    it('returns false for non-existent user', async () => {
      expect(await manager.heartbeat('unknown')).toBe(false);
    });
  });

  describe('updateLocation', () => {
    it('updates user page location', async () => {
      await manager.connect('user-1', 'conn-1');

      const updated = await manager.updateLocation('user-1', {
        pageUrl: '/courses/1',
        courseId: 'course-1',
      });

      expect(updated?.pageUrl).toBe('/courses/1');
      expect(updated?.courseId).toBe('course-1');
    });

    it('returns null for non-existent user', async () => {
      const result = await manager.updateLocation('unknown', { pageUrl: '/test' });
      expect(result).toBeNull();
    });
  });

  describe('getOnlineUsers and getOnlineCount', () => {
    it('returns online users', async () => {
      await manager.connect('u1', 'c1');
      await manager.connect('u2', 'c2');
      await manager.disconnect('u2');

      const online = await manager.getOnlineUsers();
      expect(online).toHaveLength(1);
      expect(online[0].userId).toBe('u1');
    });

    it('counts online users', async () => {
      await manager.connect('u1', 'c1');
      await manager.connect('u2', 'c2');

      expect(await manager.getOnlineCount()).toBe(2);
    });
  });

  describe('subscriptions', () => {
    it('subscribes user to a channel', async () => {
      await manager.connect('user-1', 'conn-1');

      const result = await manager.subscribe('user-1', 'course:1');
      expect(result).toBe(true);

      const subscribers = await manager.getSubscribers('course:1');
      expect(subscribers).toHaveLength(1);
      expect(subscribers[0].userId).toBe('user-1');
    });

    it('unsubscribes user from a channel', async () => {
      await manager.connect('user-1', 'conn-1');
      await manager.subscribe('user-1', 'course:1');

      await manager.unsubscribe('user-1', 'course:1');

      const subscribers = await manager.getSubscribers('course:1');
      expect(subscribers).toHaveLength(0);
    });

    it('returns false for non-existent user subscribe', async () => {
      expect(await manager.subscribe('unknown', 'channel')).toBe(false);
    });

    it('does not duplicate subscriptions', async () => {
      await manager.connect('user-1', 'conn-1');
      await manager.subscribe('user-1', 'course:1');
      await manager.subscribe('user-1', 'course:1');

      const presence = await manager.getPresence('user-1');
      expect(presence?.subscriptions.filter((s) => s === 'course:1')).toHaveLength(1);
    });
  });

  describe('event listeners', () => {
    it('notifies user-specific listener on connect', async () => {
      const callback = vi.fn();
      manager.onUserPresenceChange('user-1', callback);

      await manager.connect('user-1', 'conn-1');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', status: 'online' })
      );
    });

    it('notifies global listener on connect', async () => {
      const callback = vi.fn();
      manager.onPresenceChange(callback);

      await manager.connect('user-1', 'conn-1');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
        'connect'
      );
    });

    it('returns unsubscribe function for user listener', async () => {
      const callback = vi.fn();
      const unsub = manager.onUserPresenceChange('user-1', callback);

      unsub();
      await manager.connect('user-1', 'conn-1');

      expect(callback).not.toHaveBeenCalled();
    });

    it('returns unsubscribe function for global listener', async () => {
      const callback = vi.fn();
      const unsub = manager.onPresenceChange(callback);

      unsub();
      await manager.connect('user-1', 'conn-1');

      expect(callback).not.toHaveBeenCalled();
    });

    it('handles listener errors gracefully', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Listener error');
      });
      manager.onUserPresenceChange('user-1', errorCallback);

      // Should not throw
      await manager.connect('user-1', 'conn-1');
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('history', () => {
    it('records presence change history', async () => {
      await manager.connect('user-1', 'conn-1');
      await manager.disconnect('user-1');

      const history = await manager.getHistory('user-1');
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('factory function', () => {
    it('creates a PresenceManager', () => {
      const pm = createPresenceManager({ cleanupInterval: 60 * 60 * 1000 });
      expect(pm).toBeInstanceOf(PresenceManager);
      pm.stop();
    });
  });
});
