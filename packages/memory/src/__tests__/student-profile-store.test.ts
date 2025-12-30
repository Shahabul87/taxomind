/**
 * @sam-ai/memory - Student Profile Store Tests
 * Tests for InMemoryStudentProfileStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryStudentProfileStore,
  createInMemoryStudentProfileStore,
  getDefaultStudentProfileStore,
  resetDefaultStudentProfileStore,
} from '../student-profile-store';
import {
  createSampleStudentProfile,
  createSampleMasteryUpdate,
  createSampleLearningPathway,
  createSamplePathwayStep,
} from './setup';
import type { PathwayAdjustment } from '../types';

describe('InMemoryStudentProfileStore', () => {
  let store: InMemoryStudentProfileStore;

  beforeEach(() => {
    store = new InMemoryStudentProfileStore();
  });

  // ============================================================================
  // GET TESTS
  // ============================================================================

  describe('get', () => {
    it('should return null for non-existent profile', async () => {
      const result = await store.get('non-existent');
      expect(result).toBeNull();
    });

    it('should return saved profile', async () => {
      const profile = createSampleStudentProfile({ id: 'student-1' });
      await store.save(profile);

      const result = await store.get('student-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('student-1');
      expect(result?.userId).toBe(profile.userId);
    });
  });

  // ============================================================================
  // SAVE TESTS
  // ============================================================================

  describe('save', () => {
    it('should save a new profile', async () => {
      const profile = createSampleStudentProfile({ id: 'student-1' });

      await store.save(profile);
      const result = await store.get('student-1');

      expect(result).toBeDefined();
      expect(result?.masteryByTopic).toEqual(profile.masteryByTopic);
    });

    it('should update existing profile', async () => {
      const profile = createSampleStudentProfile({ id: 'student-1' });
      await store.save(profile);

      const updatedProfile = { ...profile, userId: 'user-updated' };
      await store.save(updatedProfile);

      const result = await store.get('student-1');

      expect(result?.userId).toBe('user-updated');
    });

    it('should update updatedAt timestamp on save', async () => {
      const profile = createSampleStudentProfile({
        id: 'student-1',
        updatedAt: new Date('2024-01-01'),
      });

      await store.save(profile);
      const result = await store.get('student-1');

      expect(result?.updatedAt).not.toEqual(new Date('2024-01-01'));
    });
  });

  // ============================================================================
  // UPDATE MASTERY TESTS
  // ============================================================================

  describe('updateMastery', () => {
    it('should create new mastery for new topic', async () => {
      const update = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 80,
        maxScore: 100,
        bloomsLevel: 'APPLY',
      });

      const result = await store.updateMastery('student-1', update);

      expect(result.topicId).toBe('topic-1');
      expect(result.score).toBe(80);
      expect(result.level).toBe('proficient');
      expect(result.assessmentCount).toBe(1);
    });

    it('should create profile if not exists', async () => {
      const update = createSampleMasteryUpdate({ topicId: 'topic-1' });

      await store.updateMastery('new-student', update);

      const profile = await store.get('new-student');
      expect(profile).not.toBeNull();
      expect(profile?.masteryByTopic['topic-1']).toBeDefined();
    });

    it('should update existing mastery', async () => {
      const profile = createSampleStudentProfile({ id: 'student-1' });
      await store.save(profile);

      const update1 = createSampleMasteryUpdate({
        topicId: 'topic-new',
        score: 70,
        maxScore: 100,
      });
      await store.updateMastery('student-1', update1);

      const update2 = createSampleMasteryUpdate({
        topicId: 'topic-new',
        score: 90,
        maxScore: 100,
      });
      const result = await store.updateMastery('student-1', update2);

      expect(result.assessmentCount).toBe(2);
      expect(result.averageScore).toBe(80); // (70 + 90) / 2
    });

    it('should calculate trend as improving when score increases', async () => {
      const update1 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 50,
        maxScore: 100,
      });
      await store.updateMastery('student-1', update1);

      const update2 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 70,
        maxScore: 100,
      });
      const result = await store.updateMastery('student-1', update2);

      expect(result.trend).toBe('improving');
    });

    it('should calculate trend as declining when score decreases', async () => {
      const update1 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 90,
        maxScore: 100,
      });
      await store.updateMastery('student-1', update1);

      const update2 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 70,
        maxScore: 100,
      });
      const result = await store.updateMastery('student-1', update2);

      expect(result.trend).toBe('declining');
    });

    it('should calculate trend as stable for small changes', async () => {
      const update1 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 75,
        maxScore: 100,
      });
      await store.updateMastery('student-1', update1);

      const update2 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 77,
        maxScore: 100,
      });
      const result = await store.updateMastery('student-1', update2);

      expect(result.trend).toBe('stable');
    });

    it('should keep higher Blooms level', async () => {
      const update1 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 80,
        maxScore: 100,
        bloomsLevel: 'ANALYZE',
      });
      await store.updateMastery('student-1', update1);

      const update2 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 80,
        maxScore: 100,
        bloomsLevel: 'UNDERSTAND',
      });
      const result = await store.updateMastery('student-1', update2);

      expect(result.bloomsLevel).toBe('ANALYZE');
    });

    it('should update to higher Blooms level', async () => {
      const update1 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 80,
        maxScore: 100,
        bloomsLevel: 'UNDERSTAND',
      });
      await store.updateMastery('student-1', update1);

      const update2 = createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 80,
        maxScore: 100,
        bloomsLevel: 'CREATE',
      });
      const result = await store.updateMastery('student-1', update2);

      expect(result.bloomsLevel).toBe('CREATE');
    });

    it('should calculate mastery levels correctly', async () => {
      // Test novice level (< 50)
      let result = await store.updateMastery('s1', createSampleMasteryUpdate({
        topicId: 't1',
        score: 40,
        maxScore: 100,
      }));
      expect(result.level).toBe('novice');

      // Test beginner level (50-69)
      result = await store.updateMastery('s2', createSampleMasteryUpdate({
        topicId: 't2',
        score: 60,
        maxScore: 100,
      }));
      expect(result.level).toBe('beginner');

      // Test intermediate level (70-79)
      result = await store.updateMastery('s3', createSampleMasteryUpdate({
        topicId: 't3',
        score: 75,
        maxScore: 100,
      }));
      expect(result.level).toBe('intermediate');

      // Test proficient level (80-89)
      result = await store.updateMastery('s4', createSampleMasteryUpdate({
        topicId: 't4',
        score: 85,
        maxScore: 100,
      }));
      expect(result.level).toBe('proficient');

      // Test expert level (>= 90)
      result = await store.updateMastery('s5', createSampleMasteryUpdate({
        topicId: 't5',
        score: 95,
        maxScore: 100,
      }));
      expect(result.level).toBe('expert');
    });

    it('should increase confidence with more assessments', async () => {
      const topicId = 'topic-1';

      const result1 = await store.updateMastery('student-1', createSampleMasteryUpdate({
        topicId,
        score: 80,
        maxScore: 100,
      }));

      const result2 = await store.updateMastery('student-1', createSampleMasteryUpdate({
        topicId,
        score: 80,
        maxScore: 100,
      }));

      const result3 = await store.updateMastery('student-1', createSampleMasteryUpdate({
        topicId,
        score: 80,
        maxScore: 100,
      }));

      expect(result2.confidence).toBeGreaterThan(result1.confidence);
      expect(result3.confidence).toBeGreaterThan(result2.confidence);
    });

    it('should update overall metrics after mastery change', async () => {
      // Create expert mastery
      await store.updateMastery('student-1', createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 95,
        maxScore: 100,
      }));

      // Create beginner mastery
      await store.updateMastery('student-1', createSampleMasteryUpdate({
        topicId: 'topic-2',
        score: 55,
        maxScore: 100,
      }));

      const profile = await store.get('student-1');

      expect(profile?.strengths).toContain('topic-1');
      expect(profile?.knowledgeGaps).toContain('topic-2');
      expect(profile?.performanceMetrics.topicsMastered).toBe(1);
    });
  });

  // ============================================================================
  // GET MASTERY TESTS
  // ============================================================================

  describe('getMastery', () => {
    it('should return null for non-existent topic', async () => {
      const result = await store.getMastery('student-1', 'non-existent');
      expect(result).toBeNull();
    });

    it('should return null for non-existent student', async () => {
      const result = await store.getMastery('non-existent', 'topic-1');
      expect(result).toBeNull();
    });

    it('should return mastery for existing topic', async () => {
      await store.updateMastery('student-1', createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 80,
        maxScore: 100,
      }));

      const result = await store.getMastery('student-1', 'topic-1');

      expect(result).not.toBeNull();
      expect(result?.topicId).toBe('topic-1');
      expect(result?.score).toBe(80);
    });
  });

  // ============================================================================
  // UPDATE PATHWAY TESTS
  // ============================================================================

  describe('updatePathway', () => {
    it('should throw error when student not found', async () => {
      const adjustment: PathwayAdjustment = {
        type: 'no_change',
        reason: 'No change needed',
      };

      await expect(
        store.updatePathway('non-existent', 'pathway-1', adjustment)
      ).rejects.toThrow('Student profile not found');
    });

    it('should throw error when pathway not found', async () => {
      const profile = createSampleStudentProfile({ id: 'student-1' });
      await store.save(profile);

      const adjustment: PathwayAdjustment = {
        type: 'no_change',
        reason: 'No change needed',
      };

      await expect(
        store.updatePathway('student-1', 'non-existent', adjustment)
      ).rejects.toThrow('Pathway not found');
    });

    it('should skip ahead in pathway', async () => {
      const pathway = createSampleLearningPathway({
        id: 'pathway-1',
        studentId: 'student-1',
        currentStepIndex: 0,
      });
      const profile = createSampleStudentProfile({
        id: 'student-1',
        activePathways: [pathway],
      });
      await store.save(profile);

      const adjustment: PathwayAdjustment = {
        type: 'skip_ahead',
        reason: 'Student mastered prerequisite',
        newCurrentStepIndex: 2,
      };

      const result = await store.updatePathway('student-1', 'pathway-1', adjustment);

      expect(result.currentStepIndex).toBe(2);
    });

    it('should add remediation steps', async () => {
      const pathway = createSampleLearningPathway({
        id: 'pathway-1',
        studentId: 'student-1',
        currentStepIndex: 1,
        steps: [
          createSamplePathwayStep({ id: 'step-1', order: 1 }),
          createSamplePathwayStep({ id: 'step-2', order: 2 }),
        ],
      });
      const profile = createSampleStudentProfile({
        id: 'student-1',
        activePathways: [pathway],
      });
      await store.save(profile);

      const remediationStep = createSamplePathwayStep({
        id: 'remediation-1',
        order: 99,
      });
      const adjustment: PathwayAdjustment = {
        type: 'add_remediation',
        reason: 'Student needs more practice',
        stepsToAdd: [remediationStep],
      };

      const result = await store.updatePathway('student-1', 'pathway-1', adjustment);

      expect(result.steps).toHaveLength(3);
      expect(result.steps[1].id).toBe('remediation-1');
    });

    it('should add challenge steps', async () => {
      const pathway = createSampleLearningPathway({
        id: 'pathway-1',
        studentId: 'student-1',
        currentStepIndex: 0,
        steps: [
          createSamplePathwayStep({ id: 'step-1', order: 1 }),
          createSamplePathwayStep({ id: 'step-2', order: 2 }),
        ],
      });
      const profile = createSampleStudentProfile({
        id: 'student-1',
        activePathways: [pathway],
      });
      await store.save(profile);

      const challengeStep = createSamplePathwayStep({
        id: 'challenge-1',
        order: 99,
      });
      const adjustment: PathwayAdjustment = {
        type: 'add_challenge',
        reason: 'Student is excelling',
        stepsToAdd: [challengeStep],
      };

      const result = await store.updatePathway('student-1', 'pathway-1', adjustment);

      expect(result.steps).toHaveLength(3);
      expect(result.steps[1].id).toBe('challenge-1');
    });

    it('should reorder steps', async () => {
      const pathway = createSampleLearningPathway({
        id: 'pathway-1',
        studentId: 'student-1',
        steps: [
          createSamplePathwayStep({ id: 'step-1', order: 1 }),
          createSamplePathwayStep({ id: 'step-2', order: 2 }),
          createSamplePathwayStep({ id: 'step-3', order: 3 }),
        ],
      });
      const profile = createSampleStudentProfile({
        id: 'student-1',
        activePathways: [pathway],
      });
      await store.save(profile);

      const adjustment: PathwayAdjustment = {
        type: 'reorder',
        reason: 'Optimize learning order',
        newOrder: ['step-3', 'step-1', 'step-2'],
      };

      const result = await store.updatePathway('student-1', 'pathway-1', adjustment);

      expect(result.steps[0].id).toBe('step-3');
      expect(result.steps[1].id).toBe('step-1');
      expect(result.steps[2].id).toBe('step-2');
    });

    it('should remove steps', async () => {
      const pathway = createSampleLearningPathway({
        id: 'pathway-1',
        studentId: 'student-1',
        steps: [
          createSamplePathwayStep({ id: 'step-1', order: 1 }),
          createSamplePathwayStep({ id: 'step-2', order: 2 }),
          createSamplePathwayStep({ id: 'step-3', order: 3 }),
        ],
      });
      const profile = createSampleStudentProfile({
        id: 'student-1',
        activePathways: [pathway],
      });
      await store.save(profile);

      const adjustment: PathwayAdjustment = {
        type: 'no_change',
        reason: 'Remove unnecessary step',
        stepsToRemove: ['step-2'],
      };

      const result = await store.updatePathway('student-1', 'pathway-1', adjustment);

      expect(result.steps).toHaveLength(2);
      expect(result.steps.find((s) => s.id === 'step-2')).toBeUndefined();
    });

    it('should recalculate progress after adjustment', async () => {
      const pathway = createSampleLearningPathway({
        id: 'pathway-1',
        studentId: 'student-1',
        steps: [
          createSamplePathwayStep({ id: 'step-1', status: 'completed' }),
          createSamplePathwayStep({ id: 'step-2', status: 'in_progress' }),
        ],
        progress: 50,
      });
      const profile = createSampleStudentProfile({
        id: 'student-1',
        activePathways: [pathway],
      });
      await store.save(profile);

      const newStep = createSamplePathwayStep({ id: 'step-3', status: 'not_started' });
      const adjustment: PathwayAdjustment = {
        type: 'add_challenge',
        reason: 'Add extra challenge',
        stepsToAdd: [newStep],
      };

      const result = await store.updatePathway('student-1', 'pathway-1', adjustment);

      // 1 completed out of 3 = 33.33%
      expect(result.progress).toBeCloseTo(33.33, 1);
    });
  });

  // ============================================================================
  // GET ACTIVE PATHWAYS TESTS
  // ============================================================================

  describe('getActivePathways', () => {
    it('should return empty array for non-existent student', async () => {
      const result = await store.getActivePathways('non-existent');
      expect(result).toEqual([]);
    });

    it('should return only active pathways', async () => {
      const activePathway = createSampleLearningPathway({
        id: 'pathway-1',
        status: 'active',
      });
      const completedPathway = createSampleLearningPathway({
        id: 'pathway-2',
        status: 'completed',
      });
      const profile = createSampleStudentProfile({
        id: 'student-1',
        activePathways: [activePathway, completedPathway],
      });
      await store.save(profile);

      const result = await store.getActivePathways('student-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pathway-1');
    });
  });

  // ============================================================================
  // UPDATE METRICS TESTS
  // ============================================================================

  describe('updateMetrics', () => {
    it('should throw error for non-existent profile', async () => {
      await expect(
        store.updateMetrics('non-existent', { currentStreak: 5 })
      ).rejects.toThrow('Student profile not found');
    });

    it('should update specific metrics', async () => {
      const profile = createSampleStudentProfile({ id: 'student-1' });
      await store.save(profile);

      const result = await store.updateMetrics('student-1', {
        currentStreak: 10,
        totalAssessments: 25,
      });

      expect(result.currentStreak).toBe(10);
      expect(result.totalAssessments).toBe(25);
    });

    it('should preserve unmodified metrics', async () => {
      const profile = createSampleStudentProfile({ id: 'student-1' });
      await store.save(profile);
      const originalMetrics = profile.performanceMetrics;

      const result = await store.updateMetrics('student-1', {
        currentStreak: 10,
      });

      expect(result.totalAssessments).toBe(originalMetrics.totalAssessments);
      expect(result.overallAverageScore).toBe(originalMetrics.overallAverageScore);
    });
  });

  // ============================================================================
  // GET KNOWLEDGE GAPS TESTS
  // ============================================================================

  describe('getKnowledgeGaps', () => {
    it('should return empty array for non-existent student', async () => {
      const result = await store.getKnowledgeGaps('non-existent');
      expect(result).toEqual([]);
    });

    it('should return topics with novice or beginner mastery', async () => {
      await store.updateMastery('student-1', createSampleMasteryUpdate({
        topicId: 'topic-1',
        score: 40, // novice
        maxScore: 100,
      }));
      await store.updateMastery('student-1', createSampleMasteryUpdate({
        topicId: 'topic-2',
        score: 55, // beginner
        maxScore: 100,
      }));
      await store.updateMastery('student-1', createSampleMasteryUpdate({
        topicId: 'topic-3',
        score: 85, // proficient
        maxScore: 100,
      }));

      const result = await store.getKnowledgeGaps('student-1');

      expect(result).toContain('topic-1');
      expect(result).toContain('topic-2');
      expect(result).not.toContain('topic-3');
    });
  });

  // ============================================================================
  // DELETE TESTS
  // ============================================================================

  describe('delete', () => {
    it('should delete existing profile', async () => {
      const profile = createSampleStudentProfile({ id: 'student-1' });
      await store.save(profile);

      await store.delete('student-1');
      const result = await store.get('student-1');

      expect(result).toBeNull();
    });

    it('should not throw for non-existent profile', async () => {
      await expect(store.delete('non-existent')).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // UTILITY METHODS TESTS
  // ============================================================================

  describe('utility methods', () => {
    it('should clear all profiles', async () => {
      await store.save(createSampleStudentProfile({ id: 'student-1' }));
      await store.save(createSampleStudentProfile({ id: 'student-2' }));

      store.clear();

      expect(await store.get('student-1')).toBeNull();
      expect(await store.get('student-2')).toBeNull();
    });

    it('should get all profiles', async () => {
      await store.save(createSampleStudentProfile({ id: 'student-1' }));
      await store.save(createSampleStudentProfile({ id: 'student-2' }));

      const all = store.getAll();

      expect(all).toHaveLength(2);
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('Factory Functions', () => {
  describe('createInMemoryStudentProfileStore', () => {
    it('should create InMemoryStudentProfileStore instance', () => {
      const store = createInMemoryStudentProfileStore();
      expect(store).toBeInstanceOf(InMemoryStudentProfileStore);
    });
  });

  describe('getDefaultStudentProfileStore', () => {
    beforeEach(() => {
      resetDefaultStudentProfileStore();
    });

    it('should return same instance on multiple calls', () => {
      const store1 = getDefaultStudentProfileStore();
      const store2 = getDefaultStudentProfileStore();
      expect(store1).toBe(store2);
    });

    it('should create new instance after reset', () => {
      const store1 = getDefaultStudentProfileStore();
      resetDefaultStudentProfileStore();
      const store2 = getDefaultStudentProfileStore();
      expect(store1).not.toBe(store2);
    });
  });
});
