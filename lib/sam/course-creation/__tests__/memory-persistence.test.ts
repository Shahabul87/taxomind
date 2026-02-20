/**
 * Tests for Memory Persistence (fire-and-forget)
 *
 * Covers: persistConceptsBackground and persistQualityScoresBackground
 * which write to KnowledgeGraph and sessionContext stores without blocking
 * the course generation pipeline.
 */

// ---------------------------------------------------------------------------
// Mocks — MUST be declared before any imports
// ---------------------------------------------------------------------------

jest.mock('server-only', () => ({}));

const mockCreateEntity = jest.fn().mockResolvedValue({ id: 'entity-1' });
const mockCreateRelationship = jest.fn().mockResolvedValue({ id: 'rel-1' });
const mockFindEntities = jest.fn().mockResolvedValue([]);

const mockSessionGet = jest.fn().mockResolvedValue(null);
const mockSessionCreate = jest.fn().mockResolvedValue({ id: 'session-1' });
const mockSessionUpdate = jest.fn().mockResolvedValue({ id: 'session-1' });

jest.mock('@/lib/sam/taxomind-context', () => ({
  getMemoryStores: jest.fn(() => ({
    knowledgeGraph: {
      createEntity: mockCreateEntity,
      createRelationship: mockCreateRelationship,
      findEntities: mockFindEntities,
    },
    sessionContext: {
      get: mockSessionGet,
      create: mockSessionCreate,
      update: mockSessionUpdate,
    },
  })),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  persistConceptsBackground,
  persistQualityScoresBackground,
} from '../memory-persistence';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
import { logger } from '@/lib/logger';
import { ConceptTracker, QualityScore, ConceptEntry } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wait for fire-and-forget microtasks to settle */
const flush = () => new Promise<void>((r) => setTimeout(r, 100));

function makeConceptTracker(
  entries: Array<[string, Omit<ConceptEntry, 'concept'>]> = [
    ['React Hooks', { introducedInChapter: 1, bloomsLevel: 'APPLY' }],
    ['State Management', { introducedInChapter: 2, bloomsLevel: 'ANALYZE' }],
  ]
): ConceptTracker {
  const concepts = new Map<string, ConceptEntry>();
  for (const [name, entry] of entries) {
    concepts.set(name, { concept: name, ...entry });
  }
  return { concepts, vocabulary: [], skillsBuilt: [] };
}

function makeQualityScores(count = 2): QualityScore[] {
  return Array.from({ length: count }, (_, i) => ({
    uniqueness: 80 + i,
    specificity: 75 + i,
    bloomsAlignment: 85 + i,
    completeness: 90 + i,
    depth: 70 + i,
    overall: 80 + i,
  }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('memory-persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default resolved values after clearAllMocks
    mockCreateEntity.mockResolvedValue({ id: 'entity-1' });
    mockCreateRelationship.mockResolvedValue({ id: 'rel-1' });
    mockFindEntities.mockResolvedValue([]);
    mockSessionGet.mockResolvedValue(null);
    mockSessionCreate.mockResolvedValue({ id: 'session-1' });
    mockSessionUpdate.mockResolvedValue({ id: 'session-1' });
  });

  // =========================================================================
  // persistConceptsBackground
  // =========================================================================

  describe('persistConceptsBackground', () => {
    it('returns void immediately (non-blocking)', () => {
      const tracker = makeConceptTracker();
      const result = persistConceptsBackground('user-1', 'course-1', tracker, 1);

      // Should return undefined (void) — NOT a Promise
      expect(result).toBeUndefined();
    });

    it('creates KnowledgeGraph entities for each concept', async () => {
      // Give each entity a unique ID so relationship edges are distinguishable
      mockCreateEntity
        .mockResolvedValueOnce({ id: 'entity-react-hooks' })
        .mockResolvedValueOnce({ id: 'entity-state-mgmt' });

      const tracker = makeConceptTracker();
      persistConceptsBackground('user-1', 'course-1', tracker, 1, 'My Course', 'programming');

      await flush();

      expect(mockCreateEntity).toHaveBeenCalledTimes(2);

      // First entity — React Hooks
      expect(mockCreateEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'concept',
          name: 'React Hooks',
          properties: expect.objectContaining({
            courseId: 'course-1',
            userId: 'user-1',
            bloomsLevel: 'APPLY',
            courseTitle: 'My Course',
            courseCategory: 'programming',
          }),
        })
      );

      // Second entity — State Management
      expect(mockCreateEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'concept',
          name: 'State Management',
          properties: expect.objectContaining({
            bloomsLevel: 'ANALYZE',
          }),
        })
      );
    });

    it('creates relationships between sequential concepts', async () => {
      mockCreateEntity
        .mockResolvedValueOnce({ id: 'entity-a' })
        .mockResolvedValueOnce({ id: 'entity-b' });

      const tracker = makeConceptTracker();
      persistConceptsBackground('user-1', 'course-1', tracker, 1);

      await flush();

      // 2 concepts = 1 relationship (prerequisite_of edge)
      expect(mockCreateRelationship).toHaveBeenCalledTimes(1);
      expect(mockCreateRelationship).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'prerequisite_of',
          sourceId: 'entity-a',
          targetId: 'entity-b',
          weight: 1.0,
          properties: expect.objectContaining({
            courseId: 'course-1',
            stage: 1,
          }),
        })
      );
    });

    it('creates N-1 relationships for N concepts', async () => {
      mockCreateEntity
        .mockResolvedValueOnce({ id: 'e-1' })
        .mockResolvedValueOnce({ id: 'e-2' })
        .mockResolvedValueOnce({ id: 'e-3' });

      const tracker = makeConceptTracker([
        ['Concept A', { introducedInChapter: 1, bloomsLevel: 'REMEMBER' }],
        ['Concept B', { introducedInChapter: 2, bloomsLevel: 'UNDERSTAND' }],
        ['Concept C', { introducedInChapter: 3, bloomsLevel: 'APPLY' }],
      ]);

      persistConceptsBackground('user-1', 'course-1', tracker, 1);
      await flush();

      expect(mockCreateEntity).toHaveBeenCalledTimes(3);
      expect(mockCreateRelationship).toHaveBeenCalledTimes(2);
    });

    it('skips persistence when concept tracker is empty', async () => {
      const tracker = makeConceptTracker([]);
      persistConceptsBackground('user-1', 'course-1', tracker, 1);

      await flush();

      expect(mockCreateEntity).not.toHaveBeenCalled();
      expect(mockCreateRelationship).not.toHaveBeenCalled();
    });

    it('catches and logs errors — never throws', async () => {
      mockCreateEntity.mockRejectedValue(new Error('KG write failed'));

      const tracker = makeConceptTracker();

      // Should NOT throw
      expect(() => {
        persistConceptsBackground('user-1', 'course-1', tracker, 1);
      }).not.toThrow();

      await flush();

      // Error should be logged, not propagated
      expect((logger.warn as jest.Mock)).toHaveBeenCalledWith(
        expect.stringContaining('persistence'),
        expect.objectContaining({
          courseId: 'course-1',
        })
      );
    });

    it('includes section info in entity description when present', async () => {
      mockCreateEntity.mockResolvedValue({ id: 'entity-1' });

      const tracker = makeConceptTracker([
        [
          'Hooks API',
          {
            introducedInChapter: 1,
            introducedInSection: 3,
            bloomsLevel: 'APPLY',
          },
        ],
      ]);

      persistConceptsBackground('user-1', 'course-1', tracker, 2);
      await flush();

      expect(mockCreateEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringContaining('section 3'),
          properties: expect.objectContaining({
            introducedInSection: 3,
            persistedAtStage: 2,
          }),
        })
      );
    });

    it('logs success info after persisting', async () => {
      mockCreateEntity
        .mockResolvedValueOnce({ id: 'e-1' })
        .mockResolvedValueOnce({ id: 'e-2' });

      const tracker = makeConceptTracker();
      persistConceptsBackground('user-1', 'course-1', tracker, 1);

      await flush();

      expect((logger.info as jest.Mock)).toHaveBeenCalledWith(
        expect.stringContaining('Concepts persisted'),
        expect.objectContaining({
          courseId: 'course-1',
          stage: 1,
          entityCount: 2,
          edgeCount: 1,
        })
      );
    });
  });

  // =========================================================================
  // persistQualityScoresBackground
  // =========================================================================

  describe('persistQualityScoresBackground', () => {
    it('returns void immediately (non-blocking)', () => {
      const scores = makeQualityScores();
      const result = persistQualityScoresBackground('user-1', 'course-1', scores, 1);

      expect(result).toBeUndefined();
    });

    it('creates new sessionContext when none exists', async () => {
      mockSessionGet.mockResolvedValue(null);

      const scores = makeQualityScores(2);
      persistQualityScoresBackground('user-1', 'course-1', scores, 1);

      await flush();

      expect(mockSessionGet).toHaveBeenCalledWith('user-1', 'course-1');
      expect(mockSessionCreate).toHaveBeenCalledTimes(1);
      expect(mockSessionUpdate).not.toHaveBeenCalled();

      // Verify the created session has correct structure
      const createArg = mockSessionCreate.mock.calls[0][0];
      expect(createArg).toMatchObject({
        userId: 'user-1',
        courseId: 'course-1',
        currentState: expect.objectContaining({
          currentTopic: 'course-creation',
          currentGoal: 'course-1',
        }),
      });

      // Verify quality score data is embedded in insights
      expect(createArg.insights).toHaveProperty('stage1Quality');
      expect(createArg.insights.stage1Quality).toMatchObject({
        scoreCount: 2,
        averageScore: expect.any(Number),
      });
    });

    it('updates existing sessionContext when one exists', async () => {
      const existingSession = {
        id: 'session-existing',
        insights: {
          strengths: ['focus'],
          weaknesses: [],
          recommendedTopics: [],
          masteredConcepts: [],
          strugglingConcepts: [],
          averageSessionDuration: 0,
          totalLearningTime: 0,
          completionRate: 0,
          engagementScore: 0,
        },
      };
      mockSessionGet.mockResolvedValue(existingSession);

      const scores = makeQualityScores(1);
      persistQualityScoresBackground('user-1', 'course-1', scores, 2);

      await flush();

      expect(mockSessionGet).toHaveBeenCalledWith('user-1', 'course-1');
      expect(mockSessionCreate).not.toHaveBeenCalled();
      expect(mockSessionUpdate).toHaveBeenCalledTimes(1);

      // Verify it updates with the existing session ID
      expect(mockSessionUpdate).toHaveBeenCalledWith(
        'session-existing',
        expect.objectContaining({
          lastActiveAt: expect.any(Date),
          insights: expect.objectContaining({
            stage2Quality: expect.objectContaining({
              scoreCount: 1,
              averageScore: expect.any(Number),
            }),
          }),
        })
      );
    });

    it('computes correct average score', async () => {
      mockSessionGet.mockResolvedValue(null);

      const scores: QualityScore[] = [
        {
          uniqueness: 100,
          specificity: 100,
          bloomsAlignment: 100,
          completeness: 100,
          depth: 100,
          overall: 60,
        },
        {
          uniqueness: 80,
          specificity: 80,
          bloomsAlignment: 80,
          completeness: 80,
          depth: 80,
          overall: 40,
        },
      ];

      persistQualityScoresBackground('user-1', 'course-1', scores, 1);
      await flush();

      const createArg = mockSessionCreate.mock.calls[0][0];
      // Average of 60 and 40 = 50
      expect(createArg.insights.stage1Quality.averageScore).toBe(50);
    });

    it('skips persistence when scores array is empty', async () => {
      persistQualityScoresBackground('user-1', 'course-1', [], 1);

      await flush();

      expect(mockSessionGet).not.toHaveBeenCalled();
      expect(mockSessionCreate).not.toHaveBeenCalled();
      expect(mockSessionUpdate).not.toHaveBeenCalled();
    });

    it('catches and logs errors — never throws', async () => {
      mockSessionGet.mockRejectedValue(new Error('DB connection failed'));

      const scores = makeQualityScores();

      // Should NOT throw
      expect(() => {
        persistQualityScoresBackground('user-1', 'course-1', scores, 1);
      }).not.toThrow();

      await flush();

      // Error should be logged
      expect((logger.warn as jest.Mock)).toHaveBeenCalledWith(
        expect.stringContaining('persistence'),
        expect.objectContaining({
          courseId: 'course-1',
          stage: 1,
        })
      );
    });

    it('includes individual score breakdowns in persisted data', async () => {
      mockSessionGet.mockResolvedValue(null);

      const scores = makeQualityScores(1);
      persistQualityScoresBackground('user-1', 'course-1', scores, 3);

      await flush();

      const createArg = mockSessionCreate.mock.calls[0][0];
      const stageScores = createArg.insights.stage3Quality.scores;

      expect(stageScores).toHaveLength(1);
      expect(stageScores[0]).toMatchObject({
        completeness: expect.any(Number),
        specificity: expect.any(Number),
        bloomsAlignment: expect.any(Number),
        uniqueness: expect.any(Number),
        depth: expect.any(Number),
        overall: expect.any(Number),
      });
    });

    it('logs success info after persisting', async () => {
      mockSessionGet.mockResolvedValue(null);

      const scores = makeQualityScores(3);
      persistQualityScoresBackground('user-1', 'course-1', scores, 2);

      await flush();

      expect((logger.info as jest.Mock)).toHaveBeenCalledWith(
        expect.stringContaining('Quality scores persisted'),
        expect.objectContaining({
          courseId: 'course-1',
          stage: 2,
          scoreCount: 3,
          averageScore: expect.any(Number),
        })
      );
    });
  });
});
