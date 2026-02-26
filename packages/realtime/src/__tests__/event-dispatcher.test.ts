/**
 * Tests for @sam-ai/realtime - Event Dispatcher
 * Covers: EventDispatcher (on, onUser, dispatch, channels, notifications, stats)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventDispatcher, createEventDispatcher } from '../event-dispatcher';
import type { RealtimeEvent } from '../types';

function makeEvent(overrides: Partial<RealtimeEvent> = {}): RealtimeEvent {
  return {
    id: 'evt-1',
    type: 'presence:connect',
    userId: 'user-1',
    timestamp: new Date(),
    payload: {},
    priority: 'normal',
    requiresAck: false,
    ...overrides,
  };
}

describe('EventDispatcher', () => {
  let dispatcher: EventDispatcher;

  beforeEach(() => {
    dispatcher = new EventDispatcher();
  });

  describe('event subscription', () => {
    it('subscribes to events by type', async () => {
      const handler = vi.fn();
      dispatcher.on('presence:connect', handler);

      await dispatcher.dispatch(makeEvent());

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'presence:connect' })
      );
    });

    it('wildcard handler receives all events', async () => {
      const handler = vi.fn();
      dispatcher.on('*', handler);

      await dispatcher.dispatch(makeEvent({ type: 'presence:connect' }));
      await dispatcher.dispatch(makeEvent({ id: 'evt-2', type: 'learning:goal_progress' }));

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('unsubscribes via returned function', async () => {
      const handler = vi.fn();
      const unsub = dispatcher.on('presence:connect', handler);

      unsub();
      await dispatcher.dispatch(makeEvent());

      expect(handler).not.toHaveBeenCalled();
    });

    it('subscribes to user-specific events', async () => {
      const handler = vi.fn();
      dispatcher.onUser('user-1', handler);

      await dispatcher.dispatch(makeEvent({ userId: 'user-1' }));
      await dispatcher.dispatch(makeEvent({ id: 'evt-2', userId: 'user-2' }));

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('dispatch', () => {
    it('returns delivery result on success', async () => {
      const result = await dispatcher.dispatch(makeEvent());

      expect(result.delivered).toBe(true);
      expect(result.eventId).toBe('evt-1');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('increments stats on dispatch', async () => {
      await dispatcher.dispatch(makeEvent());

      const stats = dispatcher.getStats();
      expect(stats.totalDispatched).toBe(1);
      expect(stats.totalDelivered).toBe(1);
    });
  });

  describe('dispatchToUser', () => {
    it('creates and dispatches event to user', async () => {
      const handler = vi.fn();
      dispatcher.onUser('user-1', handler);

      const result = await dispatcher.dispatchToUser('user-1', 'notification:achievement', {
        badge: 'gold',
      });

      expect(result.delivered).toBe(true);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'notification:achievement',
          userId: 'user-1',
          payload: { badge: 'gold' },
        })
      );
    });
  });

  describe('channel subscriptions', () => {
    it('subscribes users to channels', () => {
      dispatcher.subscribeToChannel('user-1', 'course:1');
      dispatcher.subscribeToChannel('user-2', 'course:1');

      const subs = dispatcher.getChannelSubscribers('course:1');
      expect(subs).toHaveLength(2);
      expect(subs).toContain('user-1');
    });

    it('unsubscribes user from channel', () => {
      dispatcher.subscribeToChannel('user-1', 'course:1');
      dispatcher.unsubscribeFromChannel('user-1', 'course:1');

      expect(dispatcher.getChannelSubscribers('course:1')).toHaveLength(0);
    });

    it('returns empty array for unknown channel', () => {
      expect(dispatcher.getChannelSubscribers('unknown')).toEqual([]);
    });
  });

  describe('dispatchToChannel', () => {
    it('dispatches event to all channel subscribers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      dispatcher.onUser('user-1', handler1);
      dispatcher.onUser('user-2', handler2);
      dispatcher.subscribeToChannel('user-1', 'course:1');
      dispatcher.subscribeToChannel('user-2', 'course:1');

      const results = await dispatcher.dispatchToChannel('course:1', 'learning:step_complete', {
        step: 'step-1',
      });

      expect(results).toHaveLength(2);
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('excludes specified users from channel dispatch loop', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      dispatcher.onUser('user-1', handler1);
      dispatcher.onUser('user-2', handler2);
      dispatcher.subscribeToChannel('user-1', 'course:1');
      dispatcher.subscribeToChannel('user-2', 'course:1');

      const results = await dispatcher.dispatchToChannel('course:1', 'learning:step_complete', {}, {
        excludeUsers: ['user-1'],
      });

      // Only user-2 is dispatched to directly (user-1 excluded from loop)
      expect(results).toHaveLength(1);
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('broadcast', () => {
    it('broadcasts to all user handlers', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      dispatcher.onUser('user-1', handler1);
      dispatcher.onUser('user-2', handler2);

      const count = await dispatcher.broadcast('system:maintenance', { message: 'Restarting' });

      expect(count).toBe(2);
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('excludes users from broadcast', async () => {
      const handler = vi.fn();
      dispatcher.onUser('user-1', handler);

      await dispatcher.broadcast('system:maintenance', {}, { excludeUsers: ['user-1'] });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('notifications', () => {
    it('sends notification and stores it', async () => {
      const notif = await dispatcher.sendNotification({
        userId: 'user-1',
        type: 'achievement',
        title: 'Badge Earned',
        message: 'You earned a badge!',
        priority: 'normal',
      });

      expect(notif.id).toBeDefined();
      expect(notif.title).toBe('Badge Earned');
    });

    it('sends intervention notification', async () => {
      const notif = await dispatcher.sendIntervention('user-1', {
        title: 'Study Break',
        message: 'Take a break!',
      });

      expect(notif.type).toBe('intervention');
      expect(notif.priority).toBe('high');
    });

    it('sends check-in notification', async () => {
      const notif = await dispatcher.sendCheckIn('user-1', {
        title: 'Daily Check-in',
        message: 'How are you doing?',
      });

      expect(notif.type).toBe('checkin');
      expect(notif.priority).toBe('normal');
    });

    it('sends achievement notification', async () => {
      const notif = await dispatcher.sendAchievement('user-1', {
        title: 'Level Up!',
        message: 'You reached level 5',
      });

      expect(notif.type).toBe('achievement');
    });
  });

  describe('stats and clear', () => {
    it('tracks subscriber count', () => {
      dispatcher.on('presence:connect', vi.fn());
      dispatcher.onUser('user-1', vi.fn());

      const stats = dispatcher.getStats();
      expect(stats.subscriberCount).toBe(2);
    });

    it('clears all handlers and stats', () => {
      dispatcher.on('presence:connect', vi.fn());
      dispatcher.onUser('user-1', vi.fn());
      dispatcher.subscribeToChannel('user-1', 'course:1');

      dispatcher.clear();

      const stats = dispatcher.getStats();
      expect(stats.subscriberCount).toBe(0);
      expect(stats.totalDispatched).toBe(0);
      expect(dispatcher.getChannelSubscribers('course:1')).toHaveLength(0);
    });
  });

  describe('factory function', () => {
    it('creates an EventDispatcher', () => {
      const ed = createEventDispatcher();
      expect(ed).toBeInstanceOf(EventDispatcher);
    });
  });
});
