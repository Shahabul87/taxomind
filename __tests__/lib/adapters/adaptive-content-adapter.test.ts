/**
 * Tests for Adaptive Content Adapter
 * Source: lib/adapters/adaptive-content-adapter.ts
 */

import {
  PrismaAdaptiveContentDatabaseAdapter,
  getAdaptiveContentAdapter,
  resetAdaptiveContentAdapter,
} from '@/lib/adapters/adaptive-content-adapter';
import { db } from '@/lib/db';

// The global mock in jest.setup.js may not include all models.
// Add any missing ones needed by this adapter.
function ensureMockModel(name: string) {
  if (!(db as Record<string, unknown>)[name]) {
    (db as Record<string, unknown>)[name] = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(() => Promise.resolve(0)),
      aggregate: jest.fn(),
    };
  }
}

describe('PrismaAdaptiveContentDatabaseAdapter', () => {
  let adapter: PrismaAdaptiveContentDatabaseAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    ensureMockModel('sAMLearningProfile');
    ensureMockModel('realtime_activities');
    resetAdaptiveContentAdapter();
    adapter = new PrismaAdaptiveContentDatabaseAdapter();
  });

  // -------------------------------------------------------------------
  // getLearnerProfile
  // -------------------------------------------------------------------
  describe('getLearnerProfile', () => {
    it('returns mapped profile when found', async () => {
      ((db as Record<string, unknown>).sAMLearningProfile as Record<string, jest.Mock>).findUnique.mockResolvedValue({
        userId: 'u1',
        learningStyle: 'VISUAL',
        preferences: {
          styleScores: { visual: 80, auditory: 10, reading: 5, kinesthetic: 5 },
          preferredFormats: ['video', 'diagram'],
          preferredComplexity: 'standard',
          readingPace: 'moderate',
          preferredSessionDuration: 30,
          knownConcepts: ['js'],
          conceptsInProgress: ['ts'],
          strugglingAreas: [],
          confidence: 0.7,
        },
        lastUpdated: new Date('2024-06-01'),
        user: { learningStyle: 'VISUAL' },
      });

      const profile = await adapter.getLearnerProfile('u1');
      expect(profile).not.toBeNull();
      expect(profile?.primaryStyle).toBe('visual');
      expect(profile?.styleScores.visual).toBe(80);
      expect(profile?.preferredFormats).toEqual(['video', 'diagram']);
    });

    it('returns null when profile not found', async () => {
      ((db as Record<string, unknown>).sAMLearningProfile as Record<string, jest.Mock>).findUnique.mockResolvedValue(null);
      expect(await adapter.getLearnerProfile('unknown')).toBeNull();
    });

    it('returns null on database error', async () => {
      ((db as Record<string, unknown>).sAMLearningProfile as Record<string, jest.Mock>).findUnique.mockRejectedValue(
        new Error('Connection timeout')
      );
      expect(await adapter.getLearnerProfile('u1')).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // saveLearnerProfile
  // -------------------------------------------------------------------
  describe('saveLearnerProfile', () => {
    it('upserts the profile with mapped style', async () => {
      ((db as Record<string, unknown>).sAMLearningProfile as Record<string, jest.Mock>).upsert.mockResolvedValue({ id: 'p1' });

      await adapter.saveLearnerProfile({
        userId: 'u1',
        primaryStyle: 'kinesthetic',
        styleScores: { visual: 10, auditory: 10, reading: 10, kinesthetic: 70 },
        preferredFormats: ['interactive'],
        preferredComplexity: 'advanced',
        readingPace: 'fast',
        preferredSessionDuration: 45,
        knownConcepts: [],
        conceptsInProgress: [],
        strugglingAreas: [],
        confidence: 0.5,
        lastUpdated: new Date(),
      });

      expect(
        ((db as Record<string, unknown>).sAMLearningProfile as Record<string, jest.Mock>).upsert
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'u1' },
          update: expect.objectContaining({
            learningStyle: 'KINESTHETIC',
          }),
        })
      );
    });

    it('throws on database error', async () => {
      ((db as Record<string, unknown>).sAMLearningProfile as Record<string, jest.Mock>).upsert.mockRejectedValue(
        new Error('Constraint violation')
      );

      await expect(
        adapter.saveLearnerProfile({
          userId: 'u1',
          primaryStyle: 'visual',
          styleScores: { visual: 25, auditory: 25, reading: 25, kinesthetic: 25 },
          preferredFormats: ['text'],
          preferredComplexity: 'standard',
          readingPace: 'moderate',
          preferredSessionDuration: 25,
          knownConcepts: [],
          conceptsInProgress: [],
          strugglingAreas: [],
          confidence: 0.3,
          lastUpdated: new Date(),
        })
      ).rejects.toThrow('Constraint violation');
    });
  });

  // -------------------------------------------------------------------
  // getInteractions
  // -------------------------------------------------------------------
  describe('getInteractions', () => {
    it('returns content interactions for a user', async () => {
      ((db as Record<string, unknown>).realtime_activities as Record<string, jest.Mock>).findMany.mockResolvedValue([
        {
          id: 'act-1',
          userId: 'u1',
          activityType: 'VIDEO_WATCH',
          courseId: 'c1',
          duration: 300,
          timestamp: new Date(),
          metadata: { contentId: 'vid-1', scrollDepth: 100, completed: true },
        },
      ]);

      const interactions = await adapter.getInteractions('u1', { limit: 10 });
      expect(interactions).toHaveLength(1);
      expect(interactions[0].format).toBe('video');
      expect(interactions[0].completed).toBe(true);
    });

    it('returns empty array on error', async () => {
      ((db as Record<string, unknown>).realtime_activities as Record<string, jest.Mock>).findMany.mockRejectedValue(
        new Error('DB timeout')
      );
      const result = await adapter.getInteractions('u1');
      expect(result).toEqual([]);
    });
  });

  // -------------------------------------------------------------------
  // getCachedContent
  // -------------------------------------------------------------------
  describe('getCachedContent', () => {
    it('returns null when no cache exists', async () => {
      ((db as Record<string, unknown>).sAMLearningProfile as Record<string, jest.Mock>).findMany.mockResolvedValue([]);
      const result = await adapter.getCachedContent('orig-1', 'visual');
      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      ((db as Record<string, unknown>).sAMLearningProfile as Record<string, jest.Mock>).findMany.mockRejectedValue(new Error('fail'));
      const result = await adapter.getCachedContent('orig-1', 'visual');
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------
  // Singleton
  // -------------------------------------------------------------------
  describe('getAdaptiveContentAdapter', () => {
    it('returns singleton instance', () => {
      const a1 = getAdaptiveContentAdapter();
      const a2 = getAdaptiveContentAdapter();
      expect(a1).toBe(a2);
    });

    it('resets singleton on resetAdaptiveContentAdapter', () => {
      const a1 = getAdaptiveContentAdapter();
      resetAdaptiveContentAdapter();
      const a2 = getAdaptiveContentAdapter();
      expect(a1).not.toBe(a2);
    });
  });
});
