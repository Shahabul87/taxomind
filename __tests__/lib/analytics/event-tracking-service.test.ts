/**
 * Tests for Event Tracking Service
 * Source: lib/analytics/event-tracking-service.ts
 */

import { EventTrackingService } from '@/lib/analytics/event-tracking-service';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

// Ensure redis has all methods needed by EventTrackingService
function ensureRedisMethods() {
  const methodsWithDefaults: Record<string, jest.Mock> = {
    hincrby: jest.fn(() => Promise.resolve(1)),
    hgetall: jest.fn(() => Promise.resolve({})),
    hset: jest.fn(() => Promise.resolve(1)),
    sadd: jest.fn(() => Promise.resolve(1)),
    scard: jest.fn(() => Promise.resolve(0)),
    incr: jest.fn(() => Promise.resolve(1)),
    expire: jest.fn(() => Promise.resolve(1)),
    lpush: jest.fn(() => Promise.resolve(1)),
    ltrim: jest.fn(() => Promise.resolve('OK')),
    lrange: jest.fn(() => Promise.resolve([])),
  };

  for (const [method, mock] of Object.entries(methodsWithDefaults)) {
    if (!(redis as Record<string, unknown>)[method]) {
      (redis as Record<string, unknown>)[method] = mock;
    }
  }
}

describe('EventTrackingService', () => {
  let service: EventTrackingService;

  beforeEach(() => {
    jest.clearAllMocks();
    ensureRedisMethods();
    // Ensure sAMInteraction model exists
    if (!(db as Record<string, unknown>).sAMInteraction) {
      (db as Record<string, unknown>).sAMInteraction = {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(() => Promise.resolve([])),
        create: jest.fn(),
        count: jest.fn(() => Promise.resolve(0)),
      };
    }
    service = EventTrackingService.getInstance();
  });

  describe('trackEvent', () => {
    it('stores event in database', async () => {
      const samModel = (db as Record<string, unknown>).sAMInteraction as Record<string, jest.Mock>;
      samModel.create.mockResolvedValue({ id: 'ev-1' });

      await service.trackEvent('user-1', 'page_view', { page: '/courses' });

      expect(samModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            interactionType: 'page_view',
          }),
        })
      );
    });

    it('updates Redis real-time metrics', async () => {
      const samModel = (db as Record<string, unknown>).sAMInteraction as Record<string, jest.Mock>;
      samModel.create.mockResolvedValue({ id: 'ev-1' });

      await service.trackEvent('user-1', 'click', { button: 'enroll' });

      expect((redis as Record<string, jest.Mock>).hincrby).toHaveBeenCalled();
      expect((redis as Record<string, jest.Mock>).sadd).toHaveBeenCalled();
    });

    it('handles session correlation', async () => {
      const samModel = (db as Record<string, unknown>).sAMInteraction as Record<string, jest.Mock>;
      samModel.create.mockResolvedValue({ id: 'ev-1' });

      await service.trackEvent('user-1', 'page_view', {}, { sessionId: 'sess-123' });

      expect(samModel.create).toHaveBeenCalled();
    });

    it('tracks user identification via active users set', async () => {
      const samModel = (db as Record<string, unknown>).sAMInteraction as Record<string, jest.Mock>;
      samModel.create.mockResolvedValue({ id: 'ev-1' });

      await service.trackEvent('user-1', 'login', {});

      expect((redis as Record<string, jest.Mock>).sadd).toHaveBeenCalledWith(
        expect.stringContaining('analytics:active_users:'),
        'user-1'
      );
    });

    it('handles database error gracefully without throwing', async () => {
      const samModel = (db as Record<string, unknown>).sAMInteraction as Record<string, jest.Mock>;
      samModel.create.mockRejectedValue(new Error('DB down'));

      // Should not throw
      await service.trackEvent('user-1', 'page_view', {});
      expect(logger.error).toHaveBeenCalled();
    });

    it('handles Redis error gracefully', async () => {
      const samModel = (db as Record<string, unknown>).sAMInteraction as Record<string, jest.Mock>;
      samModel.create.mockResolvedValue({ id: 'ev-1' });
      (redis as Record<string, jest.Mock>).hincrby.mockRejectedValue(new Error('Redis down'));

      // Should not throw
      await service.trackEvent('user-1', 'page_view', {});
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('trackLearningEvent', () => {
    it('tracks a learning event with course context', async () => {
      const samModel = (db as Record<string, unknown>).sAMInteraction as Record<string, jest.Mock>;
      samModel.create.mockResolvedValue({ id: 'ev-1' });

      await service.trackLearningEvent('user-1', 'course-1', 'chapter_complete', 'ch-1');

      expect(samModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            interactionType: 'learning_chapter_complete',
          }),
        })
      );
    });
  });

  describe('getEventStats', () => {
    it('returns aggregated event statistics', async () => {
      (redis as Record<string, jest.Mock>).hgetall.mockResolvedValue({ page_view: '10', click: '5' });
      (redis as Record<string, jest.Mock>).scard.mockResolvedValue(3);

      const stats = await service.getEventStats();
      expect(stats.totalEvents).toBe(15);
      expect(stats.activeUsers).toBe(3);
    });

    it('returns zero stats on Redis error', async () => {
      (redis as Record<string, jest.Mock>).hgetall.mockRejectedValue(new Error('Redis down'));

      const stats = await service.getEventStats();
      expect(stats.totalEvents).toBe(0);
      expect(stats.activeUsers).toBe(0);
    });
  });
});
