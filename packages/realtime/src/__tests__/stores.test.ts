/**
 * Tests for @sam-ai/realtime - In-Memory Stores
 * Covers: InMemoryPresenceStore, InMemoryNotificationStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryPresenceStore,
  InMemoryNotificationStore,
  createInMemoryPresenceStore,
  createInMemoryNotificationStore,
} from '../stores';
import type { UserPresence } from '../types';

function makePresence(overrides: Partial<UserPresence> = {}): UserPresence {
  return {
    userId: 'user-1',
    connectionId: 'conn-1',
    status: 'online',
    lastActivityAt: new Date(),
    connectedAt: new Date(),
    subscriptions: [],
    ...overrides,
  };
}

describe('InMemoryPresenceStore', () => {
  let store: InMemoryPresenceStore;

  beforeEach(() => {
    store = new InMemoryPresenceStore();
  });

  it('returns null for non-existent user', async () => {
    expect(await store.get('unknown')).toBeNull();
  });

  it('stores and retrieves user presence', async () => {
    const presence = makePresence();
    await store.set(presence);

    const retrieved = await store.get('user-1');
    expect(retrieved).toEqual(presence);
  });

  it('retrieves presence by connection ID', async () => {
    await store.set(makePresence());

    const retrieved = await store.getByConnection('conn-1');
    expect(retrieved?.userId).toBe('user-1');
  });

  it('returns null for unknown connection ID', async () => {
    expect(await store.getByConnection('unknown')).toBeNull();
  });

  it('updates existing presence', async () => {
    await store.set(makePresence());

    const updated = await store.update('user-1', { status: 'away' });

    expect(updated?.status).toBe('away');
    expect(updated?.userId).toBe('user-1');
  });

  it('returns null when updating non-existent user', async () => {
    const result = await store.update('unknown', { status: 'away' });
    expect(result).toBeNull();
  });

  it('updates connection map when connectionId changes', async () => {
    await store.set(makePresence());

    await store.update('user-1', { connectionId: 'conn-2' });

    expect(await store.getByConnection('conn-1')).toBeNull();
    expect(await store.getByConnection('conn-2')).not.toBeNull();
  });

  it('deletes user presence', async () => {
    await store.set(makePresence());

    const deleted = await store.delete('user-1');
    expect(deleted).toBe(true);
    expect(await store.get('user-1')).toBeNull();
    expect(await store.getByConnection('conn-1')).toBeNull();
  });

  it('returns false when deleting non-existent user', async () => {
    expect(await store.delete('unknown')).toBe(false);
  });

  it('gets online users excluding offline', async () => {
    await store.set(makePresence({ userId: 'u1', connectionId: 'c1', status: 'online' }));
    await store.set(makePresence({ userId: 'u2', connectionId: 'c2', status: 'away' }));
    await store.set(makePresence({ userId: 'u3', connectionId: 'c3', status: 'offline' }));

    const online = await store.getOnlineUsers();
    expect(online).toHaveLength(2);
    expect(online.map((p) => p.userId).sort()).toEqual(['u1', 'u2']);
  });

  it('filters online users by courseId', async () => {
    await store.set(makePresence({ userId: 'u1', connectionId: 'c1', courseId: 'course-1' }));
    await store.set(makePresence({ userId: 'u2', connectionId: 'c2', courseId: 'course-2' }));

    const filtered = await store.getOnlineUsers({ courseId: 'course-1' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].userId).toBe('u1');
  });

  it('respects limit in getOnlineUsers', async () => {
    await store.set(makePresence({ userId: 'u1', connectionId: 'c1' }));
    await store.set(makePresence({ userId: 'u2', connectionId: 'c2' }));
    await store.set(makePresence({ userId: 'u3', connectionId: 'c3' }));

    const limited = await store.getOnlineUsers({ limit: 2 });
    expect(limited).toHaveLength(2);
  });

  it('counts online users', async () => {
    await store.set(makePresence({ userId: 'u1', connectionId: 'c1', status: 'online' }));
    await store.set(makePresence({ userId: 'u2', connectionId: 'c2', status: 'offline' }));

    expect(await store.getOnlineCount()).toBe(1);
  });

  it('counts online users by courseId', async () => {
    await store.set(makePresence({ userId: 'u1', connectionId: 'c1', courseId: 'course-1' }));
    await store.set(makePresence({ userId: 'u2', connectionId: 'c2', courseId: 'course-2' }));

    expect(await store.getOnlineCount('course-1')).toBe(1);
  });

  it('records and retrieves history', async () => {
    await store.recordHistory({
      userId: 'user-1',
      previousStatus: 'offline',
      newStatus: 'online',
      reason: 'connect',
      changedAt: new Date(),
    });

    const history = await store.getHistory('user-1');
    expect(history).toHaveLength(1);
    expect(history[0].reason).toBe('connect');
  });

  it('limits history to 100 entries per user', async () => {
    for (let i = 0; i < 105; i++) {
      await store.recordHistory({
        userId: 'user-1',
        previousStatus: 'offline',
        newStatus: 'online',
        reason: 'connect',
        changedAt: new Date(Date.now() + i),
      });
    }

    const history = await store.getHistory('user-1');
    expect(history).toHaveLength(100);
  });

  it('respects limit in getHistory', async () => {
    for (let i = 0; i < 10; i++) {
      await store.recordHistory({
        userId: 'user-1',
        previousStatus: 'offline',
        newStatus: 'online',
        reason: 'connect',
        changedAt: new Date(Date.now() + i),
      });
    }

    const history = await store.getHistory('user-1', 3);
    expect(history).toHaveLength(3);
  });

  it('cleans up stale presences', async () => {
    const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
    await store.set(makePresence({ userId: 'u1', connectionId: 'c1', lastActivityAt: oldDate }));
    await store.set(makePresence({ userId: 'u2', connectionId: 'c2', lastActivityAt: new Date() }));

    const cleaned = await store.cleanupStale(5 * 60 * 1000); // 5 min threshold
    expect(cleaned).toBe(1);
    expect(await store.get('u1')).toBeNull();
    expect(await store.get('u2')).not.toBeNull();
  });

  it('factory function creates instance', () => {
    const instance = createInMemoryPresenceStore();
    expect(instance).toBeInstanceOf(InMemoryPresenceStore);
  });
});

describe('InMemoryNotificationStore', () => {
  let store: InMemoryNotificationStore;

  beforeEach(() => {
    store = new InMemoryNotificationStore();
  });

  it('creates and retrieves a notification', async () => {
    const notif = await store.create({
      userId: 'user-1',
      type: 'achievement',
      title: 'Badge Earned',
      message: 'You earned a badge!',
      priority: 'normal',
    });

    expect(notif.id).toBeDefined();
    expect(notif.createdAt).toBeInstanceOf(Date);

    const retrieved = await store.get(notif.id);
    expect(retrieved?.title).toBe('Badge Earned');
  });

  it('returns null for non-existent notification', async () => {
    expect(await store.get('unknown')).toBeNull();
  });

  it('gets notifications by user', async () => {
    await store.create({ userId: 'user-1', type: 'achievement', title: 'A', message: 'msg', priority: 'normal' });
    await store.create({ userId: 'user-1', type: 'reminder', title: 'B', message: 'msg', priority: 'normal' });
    await store.create({ userId: 'user-2', type: 'achievement', title: 'C', message: 'msg', priority: 'normal' });

    const user1Notifs = await store.getByUser('user-1');
    expect(user1Notifs).toHaveLength(2);
  });

  it('filters unread notifications', async () => {
    const n1 = await store.create({ userId: 'user-1', type: 'achievement', title: 'A', message: 'msg', priority: 'normal' });
    await store.create({ userId: 'user-1', type: 'reminder', title: 'B', message: 'msg', priority: 'normal' });
    await store.markAsRead(n1.id);

    const unread = await store.getByUser('user-1', { unreadOnly: true });
    expect(unread).toHaveLength(1);
    expect(unread[0].title).toBe('B');
  });

  it('respects limit in getByUser', async () => {
    for (let i = 0; i < 5; i++) {
      await store.create({ userId: 'user-1', type: 'achievement', title: `N${i}`, message: 'msg', priority: 'normal' });
    }

    const limited = await store.getByUser('user-1', { limit: 2 });
    expect(limited).toHaveLength(2);
  });

  it('marks notification as read', async () => {
    const notif = await store.create({ userId: 'user-1', type: 'achievement', title: 'A', message: 'msg', priority: 'normal' });

    await store.markAsRead(notif.id);

    const retrieved = await store.get(notif.id);
    expect(retrieved?.readAt).toBeInstanceOf(Date);
  });

  it('marks all user notifications as read', async () => {
    await store.create({ userId: 'user-1', type: 'achievement', title: 'A', message: 'msg', priority: 'normal' });
    await store.create({ userId: 'user-1', type: 'reminder', title: 'B', message: 'msg', priority: 'normal' });

    const count = await store.markAllAsRead('user-1');
    expect(count).toBe(2);

    const unread = await store.getByUser('user-1', { unreadOnly: true });
    expect(unread).toHaveLength(0);
  });

  it('deletes a notification', async () => {
    const notif = await store.create({ userId: 'user-1', type: 'achievement', title: 'A', message: 'msg', priority: 'normal' });

    expect(await store.delete(notif.id)).toBe(true);
    expect(await store.get(notif.id)).toBeNull();
  });

  it('returns false when deleting non-existent notification', async () => {
    expect(await store.delete('unknown')).toBe(false);
  });

  it('deletes expired notifications', async () => {
    await store.create({
      userId: 'user-1',
      type: 'reminder',
      title: 'Expired',
      message: 'msg',
      priority: 'normal',
      expiresAt: new Date(Date.now() - 1000),
    });
    await store.create({
      userId: 'user-1',
      type: 'achievement',
      title: 'Active',
      message: 'msg',
      priority: 'normal',
    });

    const deleted = await store.deleteExpired();
    expect(deleted).toBe(1);

    const remaining = await store.getByUser('user-1');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('Active');
  });

  it('factory function creates instance', () => {
    const instance = createInMemoryNotificationStore();
    expect(instance).toBeInstanceOf(InMemoryNotificationStore);
  });
});
