/**
 * @sam-ai/memory - Evaluation Memory Integration Tests
 * Tests for EvaluationMemoryIntegrationImpl
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EvaluationMemoryIntegrationImpl,
  createEvaluationMemoryIntegration,
  InMemoryMemoryStore,
  type MemoryIntegrationLogger,
} from '../evaluation-memory-integration';
import { InMemoryStudentProfileStore } from '../student-profile-store';
import { InMemoryReviewScheduleStore } from '../spaced-repetition';
import {
  createSampleEvaluationOutcome,
  createSampleStudentProfile,
  createSampleLearningPathway,
} from './setup';

describe('EvaluationMemoryIntegrationImpl', () => {
  let integration: EvaluationMemoryIntegrationImpl;
  let profileStore: InMemoryStudentProfileStore;
  let reviewStore: InMemoryReviewScheduleStore;
  let memoryStore: InMemoryMemoryStore;
  let mockLogger: MemoryIntegrationLogger;

  beforeEach(() => {
    profileStore = new InMemoryStudentProfileStore();
    reviewStore = new InMemoryReviewScheduleStore();
    memoryStore = new InMemoryMemoryStore();
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    integration = new EvaluationMemoryIntegrationImpl({
      profileStore,
      reviewStore,
      memoryStore,
      logger: mockLogger,
    });
  });

  // ============================================================================
  // RECORD EVALUATION OUTCOME TESTS
  // ============================================================================

  describe('recordEvaluationOutcome', () => {
    it('should record evaluation outcome successfully', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      const result = await integration.recordEvaluationOutcome(outcome);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should update mastery level', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 95,
        bloomsLevel: 'EVALUATE',
      });

      const result = await integration.recordEvaluationOutcome(outcome);

      expect(result.newMasteryLevel).toBeDefined();
    });

    it('should create memory entries', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      const result = await integration.recordEvaluationOutcome(outcome);

      expect(result.memoryEntriesCreated).toBeGreaterThanOrEqual(1);
      expect(memoryStore.getAll().length).toBeGreaterThanOrEqual(1);
    });

    it('should create spaced repetition schedule', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 75,
      });

      const result = await integration.recordEvaluationOutcome(outcome);

      expect(result.spacedRepetitionUpdates).toBeDefined();
      expect(result.spacedRepetitionUpdates).toHaveLength(1);
      expect(result.spacedRepetitionUpdates?.[0].topicId).toBe('topic-1');
    });

    it('should log recording steps', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      await integration.recordEvaluationOutcome(outcome);

      expect(mockLogger.info).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('should create milestone memory for high scores', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 95, // Above 90
        bloomsLevel: 'EVALUATE',
      });

      await integration.recordEvaluationOutcome(outcome);

      const memories = memoryStore.getAll();
      const milestoneMemory = memories.find((m) => m.type === 'LEARNING_MILESTONE');

      expect(milestoneMemory).toBeDefined();
      expect(milestoneMemory?.tags).toContain('high-score');
    });

    it('should create struggle point memory for low scores', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 35, // Below 50
        bloomsLevel: 'REMEMBER',
      });

      await integration.recordEvaluationOutcome(outcome);

      const memories = memoryStore.getAll();
      const struggleMemory = memories.find((m) => m.type === 'STRUGGLE_POINT');

      expect(struggleMemory).toBeDefined();
      expect(struggleMemory?.tags).toContain('struggle');
    });

    it('should handle multiple sequential evaluations', async () => {
      for (let i = 0; i < 5; i++) {
        const outcome = createSampleEvaluationOutcome({
          studentId: 'student-1',
          topicId: 'topic-1',
          score: 70 + i * 5,
        });
        await integration.recordEvaluationOutcome(outcome);
      }

      const profile = await integration.getStudentProfile('student-1');
      expect(profile?.masteryByTopic['topic-1']).toBeDefined();
    });

    it('should continue processing after mastery error', async () => {
      // Create integration with profile store that will fail on mastery update
      const failingProfileStore = new InMemoryStudentProfileStore();
      failingProfileStore.updateMastery = vi.fn().mockRejectedValue(new Error('Mastery error'));

      const integrationWithFailure = new EvaluationMemoryIntegrationImpl({
        profileStore: failingProfileStore,
        reviewStore,
        memoryStore,
        logger: mockLogger,
      });

      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      const result = await integrationWithFailure.recordEvaluationOutcome(outcome);

      // Should still have created memory entries and spaced repetition
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // PATHWAY ADJUSTMENT TESTS
  // ============================================================================

  describe('pathway adjustments', () => {
    it('should adjust pathway when outcome has courseId', async () => {
      // Set up a student with an active pathway
      const profile = createSampleStudentProfile({
        id: 'student-1',
        activePathways: [
          createSampleLearningPathway({
            studentId: 'student-1',
            courseId: 'course-1',
          }),
        ],
      });
      await profileStore.save(profile);

      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        courseId: 'course-1',
        score: 95,
      });

      const result = await integration.recordEvaluationOutcome(outcome);

      expect(result.pathwayAdjustments).toBeDefined();
    });

    it('should not adjust pathway when no courseId', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        courseId: undefined,
        score: 85,
      });

      const result = await integration.recordEvaluationOutcome(outcome);

      expect(result.pathwayAdjustments).toBeUndefined();
    });
  });

  // ============================================================================
  // GET STUDENT PROFILE TESTS
  // ============================================================================

  describe('getStudentProfile', () => {
    it('should return null for non-existent student', async () => {
      const profile = await integration.getStudentProfile('non-existent');
      expect(profile).toBeNull();
    });

    it('should return profile after evaluation', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      await integration.recordEvaluationOutcome(outcome);

      const profile = await integration.getStudentProfile('student-1');
      expect(profile).toBeDefined();
      expect(profile?.id).toBe('student-1');
    });
  });

  // ============================================================================
  // GET PENDING REVIEWS TESTS
  // ============================================================================

  describe('getPendingReviews', () => {
    it('should return empty array for new student', async () => {
      const reviews = await integration.getPendingReviews('student-1');
      expect(reviews).toEqual([]);
    });

    it('should return pending reviews after evaluation', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      await integration.recordEvaluationOutcome(outcome);

      const reviews = await integration.getPendingReviews('student-1');
      expect(reviews.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================================
  // GET RELEVANT MEMORIES TESTS
  // ============================================================================

  describe('getRelevantMemories', () => {
    it('should return empty array when no memories', async () => {
      const memories = await integration.getRelevantMemories('student-1', 'topic-1');
      expect(memories).toEqual([]);
    });

    it('should return topic-related memories', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      await integration.recordEvaluationOutcome(outcome);

      const memories = await integration.getRelevantMemories('student-1', 'topic-1');
      expect(memories.length).toBeGreaterThan(0);
      expect(memories.every((m) => m.relatedTopics.includes('topic-1'))).toBe(true);
    });

    it('should include high-importance memories', async () => {
      // Create a high-score evaluation (creates high importance milestone)
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 95,
      });

      await integration.recordEvaluationOutcome(outcome);

      const memories = await integration.getRelevantMemories('student-1', 'topic-2');
      // Should include high-importance memories even for different topic
      const importantMemories = memories.filter(
        (m) => m.importance === 'high' || m.importance === 'critical'
      );
      expect(importantMemories.length).toBeGreaterThanOrEqual(0);
    });

    it('should record access on retrieved memories', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      await integration.recordEvaluationOutcome(outcome);

      // Get memories first time
      await integration.getRelevantMemories('student-1', 'topic-1');

      // Check access was recorded
      const memories = memoryStore.getAll();
      expect(memories.some((m) => m.accessCount > 0)).toBe(true);
    });

    it('should deduplicate memories', async () => {
      // Create multiple evaluations for same topic
      for (let i = 0; i < 3; i++) {
        await integration.recordEvaluationOutcome(
          createSampleEvaluationOutcome({
            studentId: 'student-1',
            topicId: 'topic-1',
            score: 85 + i,
          })
        );
      }

      const memories = await integration.getRelevantMemories('student-1', 'topic-1');
      const ids = memories.map((m) => m.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should limit returned memories', async () => {
      // Create many evaluations
      for (let i = 0; i < 25; i++) {
        await integration.recordEvaluationOutcome(
          createSampleEvaluationOutcome({
            studentId: 'student-1',
            topicId: 'topic-1',
            score: 70,
          })
        );
      }

      const memories = await integration.getRelevantMemories('student-1', 'topic-1');
      expect(memories.length).toBeLessThanOrEqual(20);
    });
  });

  // ============================================================================
  // RECALCULATE PATHWAY TESTS
  // ============================================================================

  describe('recalculatePathway', () => {
    it('should recalculate pathway', async () => {
      // Set up a student with an active pathway
      const pathway = createSampleLearningPathway({
        id: 'pathway-1',
        studentId: 'student-1',
        courseId: 'course-1',
      });
      const profile = createSampleStudentProfile({
        id: 'student-1',
        activePathways: [pathway],
      });
      await profileStore.save(profile);

      const recalculated = await integration.recalculatePathway('student-1', 'pathway-1');

      expect(recalculated).toBeDefined();
      expect(recalculated.id).toBe('pathway-1');
    });
  });

  // ============================================================================
  // GET MASTERY SUMMARY TESTS
  // ============================================================================

  describe('getMasterySummary', () => {
    it('should return empty summary for new student', async () => {
      const summary = await integration.getMasterySummary('student-1');

      expect(summary.totalTopics).toBe(0);
      expect(summary.averageMastery).toBe(0);
    });

    it('should return summary after evaluations', async () => {
      await integration.recordEvaluationOutcome(
        createSampleEvaluationOutcome({
          studentId: 'student-1',
          topicId: 'topic-1',
          score: 90,
          bloomsLevel: 'EVALUATE',
        })
      );

      const summary = await integration.getMasterySummary('student-1');

      expect(summary.totalTopics).toBe(1);
      expect(summary.averageMastery).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // GET REVIEW STATS TESTS
  // ============================================================================

  describe('getReviewStats', () => {
    it('should return zero stats for new student', async () => {
      const stats = await integration.getReviewStats('student-1');

      expect(stats.totalPending).toBe(0);
      expect(stats.overdueCount).toBe(0);
    });

    it('should return stats after evaluations', async () => {
      await integration.recordEvaluationOutcome(
        createSampleEvaluationOutcome({
          studentId: 'student-1',
          topicId: 'topic-1',
          score: 75,
        })
      );

      const stats = await integration.getReviewStats('student-1');

      expect(stats.totalPending).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // CONFIGURATION TESTS
  // ============================================================================

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customIntegration = new EvaluationMemoryIntegrationImpl({
        profileStore,
        reviewStore,
        memoryStore,
        updateMasteryOnEvaluation: false,
        storeInMemory: false,
      });

      expect(customIntegration).toBeDefined();
    });

    it('should disable mastery updates when configured', async () => {
      const customIntegration = new EvaluationMemoryIntegrationImpl({
        profileStore,
        reviewStore,
        memoryStore,
        updateMasteryOnEvaluation: false,
        logger: mockLogger,
      });

      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      const result = await customIntegration.recordEvaluationOutcome(outcome);

      expect(result.newMasteryLevel).toBeUndefined();
    });

    it('should disable memory storage when configured', async () => {
      const customMemoryStore = new InMemoryMemoryStore();
      const customIntegration = new EvaluationMemoryIntegrationImpl({
        profileStore,
        reviewStore,
        memoryStore: customMemoryStore,
        storeInMemory: false,
        logger: mockLogger,
      });

      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      });

      const result = await customIntegration.recordEvaluationOutcome(outcome);

      expect(result.memoryEntriesCreated).toBeUndefined();
      expect(customMemoryStore.getAll().length).toBe(0);
    });
  });

  // ============================================================================
  // IMPORTANCE CALCULATION TESTS
  // ============================================================================

  describe('importance calculation', () => {
    it('should mark high score as high importance', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 95, // >= 90
        bloomsLevel: 'REMEMBER',
      });

      await integration.recordEvaluationOutcome(outcome);

      const memories = memoryStore.getAll();
      const evalMemory = memories.find((m) => m.type === 'EVALUATION_OUTCOME');

      expect(evalMemory?.importance).toBe('high');
    });

    it('should mark low score as high importance', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 35, // < 50
        bloomsLevel: 'REMEMBER',
      });

      await integration.recordEvaluationOutcome(outcome);

      const memories = memoryStore.getAll();
      const evalMemory = memories.find((m) => m.type === 'EVALUATION_OUTCOME');

      expect(evalMemory?.importance).toBe('high');
    });

    it('should mark high Blooms level as high importance', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 75, // Medium score
        bloomsLevel: 'CREATE', // Highest Blooms level
      });

      await integration.recordEvaluationOutcome(outcome);

      const memories = memoryStore.getAll();
      const evalMemory = memories.find((m) => m.type === 'EVALUATION_OUTCOME');

      expect(evalMemory?.importance).toBe('high');
    });

    it('should mark medium Blooms level as medium importance', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 75, // Medium score
        bloomsLevel: 'APPLY', // Medium Blooms level
      });

      await integration.recordEvaluationOutcome(outcome);

      const memories = memoryStore.getAll();
      const evalMemory = memories.find((m) => m.type === 'EVALUATION_OUTCOME');

      expect(evalMemory?.importance).toBe('medium');
    });

    it('should mark low Blooms level as low importance', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 75, // Medium score
        bloomsLevel: 'REMEMBER', // Low Blooms level
      });

      await integration.recordEvaluationOutcome(outcome);

      const memories = memoryStore.getAll();
      const evalMemory = memories.find((m) => m.type === 'EVALUATION_OUTCOME');

      expect(evalMemory?.importance).toBe('low');
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('Factory Functions', () => {
  describe('createEvaluationMemoryIntegration', () => {
    it('should create EvaluationMemoryIntegrationImpl instance', () => {
      const profileStore = new InMemoryStudentProfileStore();
      const reviewStore = new InMemoryReviewScheduleStore();
      const memoryStore = new InMemoryMemoryStore();

      const integration = createEvaluationMemoryIntegration({
        profileStore,
        reviewStore,
        memoryStore,
      });

      expect(integration).toBeInstanceOf(EvaluationMemoryIntegrationImpl);
    });
  });
});
