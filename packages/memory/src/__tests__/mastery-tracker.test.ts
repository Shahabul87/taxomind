/**
 * @sam-ai/memory - Mastery Tracker Tests
 * Tests for MasteryTracker
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MasteryTracker,
  createMasteryTracker,
  DEFAULT_MASTERY_TRACKER_CONFIG,
} from '../mastery-tracker';
import { InMemoryStudentProfileStore } from '../student-profile-store';
import {
  createSampleEvaluationOutcome,
  createSampleStudentProfile,
  createSampleTopicMastery,
} from './setup';

describe('MasteryTracker', () => {
  let profileStore: InMemoryStudentProfileStore;
  let tracker: MasteryTracker;

  beforeEach(() => {
    profileStore = new InMemoryStudentProfileStore();
    tracker = new MasteryTracker(profileStore);
  });

  // ============================================================================
  // PROCESS EVALUATION TESTS
  // ============================================================================

  describe('processEvaluation', () => {
    it('should create new mastery for first evaluation', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
        bloomsLevel: 'APPLY',
      });

      const result = await tracker.processEvaluation(outcome);

      expect(result.previousMastery).toBeUndefined();
      expect(result.currentMastery).toBeDefined();
      expect(result.levelChanged).toBe(true);
      expect(result.scoreDifference).toBeGreaterThan(0);
    });

    it('should update existing mastery', async () => {
      // First evaluation
      const outcome1 = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 70,
      });
      await tracker.processEvaluation(outcome1);

      // Second evaluation
      const outcome2 = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 90,
      });
      const result = await tracker.processEvaluation(outcome2);

      expect(result.previousMastery).toBeDefined();
      expect(result.scoreDifference).toBeGreaterThan(0);
    });

    it('should apply Blooms weight to score', async () => {
      // REMEMBER has weight 0.5, so score of 100 becomes 50
      const outcomeRemember = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 100,
        bloomsLevel: 'REMEMBER',
      });
      const result1 = await tracker.processEvaluation(outcomeRemember);

      // CREATE has weight 1.1, so score of 90 becomes 99 (capped at 100)
      const outcomeCreate = createSampleEvaluationOutcome({
        studentId: 'student-2',
        topicId: 'topic-1',
        score: 90,
        bloomsLevel: 'CREATE',
      });
      const result2 = await tracker.processEvaluation(outcomeCreate);

      // The CREATE score should be higher due to weight
      expect(result2.currentMastery.score).toBeGreaterThan(result1.currentMastery.score);
    });

    it('should detect level improvement', async () => {
      const outcome1 = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 50,
        bloomsLevel: 'APPLY',
      });
      await tracker.processEvaluation(outcome1);

      const outcome2 = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 95,
        bloomsLevel: 'APPLY',
      });
      const result = await tracker.processEvaluation(outcome2);

      expect(result.changeDirection).toBe('improved');
      expect(result.levelChanged).toBe(true);
    });

    it('should detect level decline', async () => {
      // First with high score to achieve expert level
      const outcome1 = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 100,
        bloomsLevel: 'EVALUATE', // Weight 1.0, so score stays 100
      });
      const result1 = await tracker.processEvaluation(outcome1);
      expect(result1.currentMastery.level).toBe('expert');

      // Then many low scores to bring the average down significantly
      for (let i = 0; i < 20; i++) {
        const lowOutcome = createSampleEvaluationOutcome({
          studentId: 'student-1',
          topicId: 'topic-1',
          score: 20, // Very low score
          bloomsLevel: 'REMEMBER', // Weight 0.5, so effective score is 10
        });
        await tracker.processEvaluation(lowOutcome);
      }

      // Final check - should have declined significantly
      const finalMastery = await tracker.getMastery('student-1', 'topic-1');
      expect(finalMastery?.level === 'novice' || finalMastery?.level === 'beginner').toBe(true);
    });

    it('should mark mastery as stable after minimum assessments', async () => {
      for (let i = 0; i < 3; i++) {
        await tracker.processEvaluation(createSampleEvaluationOutcome({
          studentId: 'student-1',
          topicId: 'topic-1',
          score: 80,
        }));
      }

      const result = await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 80,
      }));

      expect(result.isStable).toBe(true);
    });

    it('should generate recommendations for low mastery', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 40,
        bloomsLevel: 'REMEMBER',
      });

      const result = await tracker.processEvaluation(outcome);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some((r) => r.type === 'review_basics')).toBe(true);
    });

    it('should generate challenge recommendation for high mastery', async () => {
      // Build up high mastery with multiple assessments
      for (let i = 0; i < 5; i++) {
        await tracker.processEvaluation(createSampleEvaluationOutcome({
          studentId: 'student-1',
          topicId: 'topic-1',
          score: 95,
          bloomsLevel: 'EVALUATE',
        }));
      }

      const result = await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 95,
        bloomsLevel: 'EVALUATE',
      }));

      expect(result.recommendations.some((r) =>
        r.type === 'challenge_increase' || r.type === 'maintain'
      )).toBe(true);
    });

    it('should include context in mastery update', async () => {
      const outcome = createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        courseId: 'course-1',
        chapterId: 'chapter-1',
        sectionId: 'section-1',
        assessmentType: 'quiz',
      });

      const result = await tracker.processEvaluation(outcome);

      expect(result.currentMastery).toBeDefined();
    });
  });

  // ============================================================================
  // GET MASTERY TESTS
  // ============================================================================

  describe('getMastery', () => {
    it('should return null for non-existent topic', async () => {
      const result = await tracker.getMastery('student-1', 'non-existent');
      expect(result).toBeNull();
    });

    it('should return mastery after evaluation', async () => {
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      }));

      const result = await tracker.getMastery('student-1', 'topic-1');

      expect(result).not.toBeNull();
      expect(result?.topicId).toBe('topic-1');
    });
  });

  // ============================================================================
  // CALCULATE MASTERY LEVEL TESTS
  // ============================================================================

  describe('calculateMasteryLevel', () => {
    it('should return novice for low scores', () => {
      expect(tracker.calculateMasteryLevel(30)).toBe('novice');
      expect(tracker.calculateMasteryLevel(0)).toBe('novice');
      expect(tracker.calculateMasteryLevel(49)).toBe('novice');
    });

    it('should return beginner for 50-69 scores', () => {
      expect(tracker.calculateMasteryLevel(50)).toBe('beginner');
      expect(tracker.calculateMasteryLevel(60)).toBe('beginner');
      expect(tracker.calculateMasteryLevel(69)).toBe('beginner');
    });

    it('should return intermediate for 70-79 scores', () => {
      expect(tracker.calculateMasteryLevel(70)).toBe('intermediate');
      expect(tracker.calculateMasteryLevel(75)).toBe('intermediate');
      expect(tracker.calculateMasteryLevel(79)).toBe('intermediate');
    });

    it('should return proficient for 80-89 scores', () => {
      expect(tracker.calculateMasteryLevel(80)).toBe('proficient');
      expect(tracker.calculateMasteryLevel(85)).toBe('proficient');
      expect(tracker.calculateMasteryLevel(89)).toBe('proficient');
    });

    it('should return expert for 90+ scores', () => {
      expect(tracker.calculateMasteryLevel(90)).toBe('expert');
      expect(tracker.calculateMasteryLevel(95)).toBe('expert');
      expect(tracker.calculateMasteryLevel(100)).toBe('expert');
    });
  });

  // ============================================================================
  // APPLY DECAY TESTS
  // ============================================================================

  describe('applyDecay', () => {
    it('should not decay recent topics', async () => {
      // Use current date for evaluation so it's considered recent
      const now = new Date();
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 90,
        bloomsLevel: 'EVALUATE',
        evaluatedAt: now, // Use current date so it's recent
      }));

      const originalMastery = await tracker.getMastery('student-1', 'topic-1');
      const originalScore = originalMastery?.score;

      const result = await tracker.applyDecay('student-1', 'topic-1', now);

      // Score should not change for recent topics (within 30 days)
      expect(result?.score).toBe(originalScore);
    });

    it('should return null for non-existent mastery', async () => {
      const result = await tracker.applyDecay('student-1', 'non-existent');
      expect(result).toBeNull();
    });

    it('should decay topics after decay start days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days ago

      // Create profile with old mastery
      const profile = createSampleStudentProfile({
        id: 'student-1',
        masteryByTopic: {
          'topic-1': createSampleTopicMastery({
            topicId: 'topic-1',
            score: 90,
            lastAssessedAt: oldDate,
          }),
        },
      });
      await profileStore.save(profile);

      const currentDate = new Date();
      const result = await tracker.applyDecay('student-1', 'topic-1', currentDate);

      // After 60 days with 30-day start, should have 30 days of decay
      // 30 days * 0.5% = 15% decay
      expect(result?.score).toBeLessThan(90);
    });
  });

  // ============================================================================
  // GET TOPICS NEEDING REVIEW TESTS
  // ============================================================================

  describe('getTopicsNeedingReview', () => {
    it('should return empty array for new student', async () => {
      const result = await tracker.getTopicsNeedingReview('non-existent');
      expect(result).toEqual([]);
    });

    it('should return topics below threshold', async () => {
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-high',
        score: 90,
        bloomsLevel: 'APPLY',
      }));
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-low',
        score: 50,
        bloomsLevel: 'REMEMBER',
      }));

      const result = await tracker.getTopicsNeedingReview('student-1', 70);

      expect(result.some((m) => m.topicId === 'topic-low')).toBe(true);
      expect(result.some((m) => m.topicId === 'topic-high')).toBe(false);
    });

    it('should use custom threshold', async () => {
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 75,
        bloomsLevel: 'APPLY',
      }));

      const result90 = await tracker.getTopicsNeedingReview('student-1', 90);
      const result50 = await tracker.getTopicsNeedingReview('student-1', 50);

      expect(result90.length).toBeGreaterThan(result50.length);
    });
  });

  // ============================================================================
  // GET MASTERY SUMMARY TESTS
  // ============================================================================

  describe('getMasterySummary', () => {
    it('should return empty summary for new student', async () => {
      const result = await tracker.getMasterySummary('non-existent');

      expect(result.totalTopics).toBe(0);
      expect(result.averageMastery).toBe(0);
      expect(result.recentTrend).toBe('stable');
    });

    it('should calculate summary for student with mastery', async () => {
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 90,
        bloomsLevel: 'APPLY',
      }));
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-2',
        score: 60,
        bloomsLevel: 'UNDERSTAND',
      }));

      const result = await tracker.getMasterySummary('student-1');

      expect(result.totalTopics).toBe(2);
      expect(result.averageMastery).toBeGreaterThan(0);
    });

    it('should include level distribution', async () => {
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 95,
        bloomsLevel: 'APPLY',
      }));
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-2',
        score: 40,
        bloomsLevel: 'REMEMBER',
      }));

      const result = await tracker.getMasterySummary('student-1');

      expect(result.levelDistribution).toBeDefined();
      const totalInDistribution = Object.values(result.levelDistribution).reduce(
        (sum, count) => sum + count,
        0
      );
      expect(totalInDistribution).toBe(2);
    });

    it('should include Blooms distribution', async () => {
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        bloomsLevel: 'APPLY',
      }));
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-2',
        bloomsLevel: 'CREATE',
      }));

      const result = await tracker.getMasterySummary('student-1');

      expect(result.bloomsDistribution).toBeDefined();
      expect(result.bloomsDistribution.APPLY).toBe(1);
      expect(result.bloomsDistribution.CREATE).toBe(1);
    });

    it('should identify topics needing attention', async () => {
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-struggling',
        score: 35,
        bloomsLevel: 'REMEMBER',
      }));
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-strong',
        score: 95,
        bloomsLevel: 'APPLY',
      }));

      const result = await tracker.getMasterySummary('student-1');

      expect(result.topicsNeedingAttention).toContain('topic-struggling');
      expect(result.topicsNeedingAttention).not.toContain('topic-strong');
    });

    it('should identify strengths', async () => {
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-expert',
        score: 95,
        bloomsLevel: 'APPLY',
      }));
      await tracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-weak',
        score: 40,
        bloomsLevel: 'REMEMBER',
      }));

      const result = await tracker.getMasterySummary('student-1');

      expect(result.strengths).toContain('topic-expert');
      expect(result.strengths).not.toContain('topic-weak');
    });
  });

  // ============================================================================
  // CUSTOM CONFIGURATION TESTS
  // ============================================================================

  describe('Custom Configuration', () => {
    it('should use custom level thresholds', () => {
      const customTracker = new MasteryTracker(profileStore, {
        levelThresholds: {
          beginner: 30,
          intermediate: 50,
          proficient: 70,
          expert: 85,
        },
      });

      expect(customTracker.calculateMasteryLevel(25)).toBe('novice');
      expect(customTracker.calculateMasteryLevel(35)).toBe('beginner');
      expect(customTracker.calculateMasteryLevel(55)).toBe('intermediate');
      expect(customTracker.calculateMasteryLevel(75)).toBe('proficient');
      expect(customTracker.calculateMasteryLevel(90)).toBe('expert');
    });

    it('should use custom recency weight', async () => {
      const customTracker = new MasteryTracker(profileStore, {
        recencyWeight: 0.9,
      });

      const result = await customTracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 85,
      }));

      expect(result.currentMastery).toBeDefined();
    });

    it('should use custom min assessments for stability', async () => {
      const customTracker = new MasteryTracker(profileStore, {
        minAssessmentsForStability: 5,
      });

      // Only 3 assessments
      for (let i = 0; i < 3; i++) {
        await customTracker.processEvaluation(createSampleEvaluationOutcome({
          studentId: 'student-1',
          topicId: 'topic-1',
          score: 80,
        }));
      }

      const result = await customTracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 80,
      }));

      expect(result.isStable).toBe(false);
    });

    it('should use custom Blooms weights', async () => {
      const customTracker = new MasteryTracker(profileStore, {
        bloomsWeights: {
          REMEMBER: 0.3,
          UNDERSTAND: 0.5,
          APPLY: 0.7,
          ANALYZE: 0.9,
          EVALUATE: 1.0,
          CREATE: 1.2,
        },
      });

      const result = await customTracker.processEvaluation(createSampleEvaluationOutcome({
        studentId: 'student-1',
        topicId: 'topic-1',
        score: 100,
        bloomsLevel: 'REMEMBER',
      }));

      // Score should be reduced by low REMEMBER weight
      expect(result.currentMastery.score).toBe(30); // 100 * 0.3
    });
  });

  // ============================================================================
  // DEFAULT CONFIG TESTS
  // ============================================================================

  describe('Default Configuration', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_MASTERY_TRACKER_CONFIG.recencyWeight).toBe(0.7);
      expect(DEFAULT_MASTERY_TRACKER_CONFIG.minAssessmentsForStability).toBe(3);
      expect(DEFAULT_MASTERY_TRACKER_CONFIG.decayRatePerDay).toBe(0.5);
      expect(DEFAULT_MASTERY_TRACKER_CONFIG.decayStartDays).toBe(30);
    });

    it('should have Blooms weights that increase with cognitive level', () => {
      const weights = DEFAULT_MASTERY_TRACKER_CONFIG.bloomsWeights;
      const orderedWeights = [
        weights.REMEMBER,
        weights.UNDERSTAND,
        weights.APPLY,
        weights.ANALYZE,
        weights.EVALUATE,
        weights.CREATE,
      ];

      for (let i = 1; i < orderedWeights.length; i++) {
        expect(orderedWeights[i]).toBeGreaterThan(orderedWeights[i - 1]);
      }
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('Factory Functions', () => {
  describe('createMasteryTracker', () => {
    it('should create MasteryTracker instance', () => {
      const profileStore = new InMemoryStudentProfileStore();
      const tracker = createMasteryTracker(profileStore);
      expect(tracker).toBeInstanceOf(MasteryTracker);
    });

    it('should accept custom config', () => {
      const profileStore = new InMemoryStudentProfileStore();
      const tracker = createMasteryTracker(profileStore, {
        recencyWeight: 0.8,
      });
      expect(tracker).toBeInstanceOf(MasteryTracker);
    });
  });
});
