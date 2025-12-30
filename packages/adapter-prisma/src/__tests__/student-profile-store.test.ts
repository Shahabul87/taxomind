/**
 * @sam-ai/adapter-prisma - Student Profile Store Tests
 * Tests for PrismaStudentProfileStore
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaStudentProfileStore, createPrismaStudentProfileStore } from '../student-profile-store';
import { createMockPrismaClient, createSampleStudentProfile } from './setup';
import type { StudentProfile, MasteryUpdate, PathwayAdjustment, PathwayStep } from '../student-profile-store';

describe('PrismaStudentProfileStore', () => {
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;
  let store: PrismaStudentProfileStore;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    store = new PrismaStudentProfileStore({ prisma: mockPrisma });
    vi.clearAllMocks();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should use default table names', () => {
      const store = new PrismaStudentProfileStore({ prisma: mockPrisma });
      expect(store).toBeDefined();
    });

    it('should accept custom table names', () => {
      const store = new PrismaStudentProfileStore({
        prisma: mockPrisma,
        profileTableName: 'customProfile',
        masteryTableName: 'customMastery',
        pathwayTableName: 'customPathway',
      });
      expect(store).toBeDefined();
    });
  });

  // ============================================================================
  // GET TESTS
  // ============================================================================

  describe('get', () => {
    it('should return student profile by id', async () => {
      const mockProfile = createSampleStudentProfile({ id: 'student-1' });
      mockPrisma.studentProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await store.get('student-1');

      expect(mockPrisma.studentProfile.findUnique).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        include: { masteryRecords: true, pathways: true },
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe('student-1');
    });

    it('should return null for non-existent profile', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue(null);

      const result = await store.get('non-existent');

      expect(result).toBeNull();
    });

    it('should map mastery records to masteryByTopic', async () => {
      const mockProfile = {
        ...createSampleStudentProfile({ id: 'student-1' }),
        masteryRecords: [
          {
            topicId: 'topic-1',
            level: 'intermediate',
            score: 75,
            bloomsLevel: 'APPLY',
            assessmentCount: 5,
            averageScore: 75,
            lastAssessedAt: new Date('2024-01-15'),
            trend: 'improving',
            confidence: 0.75,
          },
        ],
      };
      mockPrisma.studentProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await store.get('student-1');

      expect(result?.masteryByTopic['topic-1']).toBeDefined();
      expect(result?.masteryByTopic['topic-1'].level).toBe('intermediate');
    });
  });

  // ============================================================================
  // SAVE TESTS
  // ============================================================================

  describe('save', () => {
    it('should save a student profile', async () => {
      const profile: StudentProfile = {
        id: 'student-1',
        userId: 'user-1',
        masteryByTopic: {},
        activePathways: [],
        cognitivePreferences: {
          learningStyles: ['visual'],
          contentLengthPreference: 'moderate',
          pacePreference: 'moderate',
          challengePreference: 'moderate',
          examplesFirst: true,
        },
        performanceMetrics: {
          overallAverageScore: 80,
          totalAssessments: 15,
          weeklyAssessments: 3,
          currentStreak: 5,
          longestStreak: 10,
          topicsMastered: 5,
          totalStudyTimeMinutes: 300,
          averageSessionDuration: 45,
          completionRate: 0.85,
        },
        overallBloomsDistribution: {
          REMEMBER: 15,
          UNDERSTAND: 25,
          APPLY: 25,
          ANALYZE: 15,
          EVALUATE: 10,
          CREATE: 10,
        },
        knowledgeGaps: ['topic-3'],
        strengths: ['topic-1', 'topic-2'],
        createdAt: new Date('2024-01-01'),
        lastActiveAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      };

      await store.save(profile);

      expect(mockPrisma.studentProfile.upsert).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        create: expect.objectContaining({
          id: 'student-1',
          userId: 'user-1',
          knowledgeGaps: ['topic-3'],
          strengths: ['topic-1', 'topic-2'],
        }),
        update: expect.objectContaining({
          knowledgeGaps: ['topic-3'],
          strengths: ['topic-1', 'topic-2'],
          updatedAt: expect.any(Date),
        }),
      });
    });
  });

  // ============================================================================
  // UPDATE MASTERY TESTS
  // ============================================================================

  describe('updateMastery', () => {
    it('should create new mastery record', async () => {
      mockPrisma.topicMastery.findUnique.mockResolvedValue(null);
      mockPrisma.topicMastery.create.mockResolvedValue({
        topicId: 'topic-1',
        level: 'intermediate',
        score: 75,
        bloomsLevel: 'APPLY',
        assessmentCount: 1,
        averageScore: 75,
        lastAssessedAt: new Date('2024-01-15'),
        trend: 'stable',
        confidence: 0.55,
      });

      const update: MasteryUpdate = {
        topicId: 'topic-1',
        score: 75,
        maxScore: 100,
        bloomsLevel: 'APPLY',
        timestamp: new Date('2024-01-15'),
      };

      const result = await store.updateMastery('student-1', update);

      expect(mockPrisma.topicMastery.create).toHaveBeenCalled();
      expect(result.topicId).toBe('topic-1');
      expect(result.level).toBe('intermediate');
    });

    it('should update existing mastery record', async () => {
      const existingMastery = {
        topicId: 'topic-1',
        level: 'beginner',
        score: 60,
        bloomsLevel: 'UNDERSTAND',
        assessmentCount: 2,
        averageScore: 60,
        lastAssessedAt: new Date('2024-01-10'),
        trend: 'stable',
        confidence: 0.6,
      };
      mockPrisma.topicMastery.findUnique.mockResolvedValue(existingMastery);
      mockPrisma.topicMastery.update.mockResolvedValue({
        ...existingMastery,
        level: 'intermediate',
        score: 70,
        assessmentCount: 3,
        averageScore: 70,
        trend: 'improving',
        confidence: 0.65,
      });

      const update: MasteryUpdate = {
        topicId: 'topic-1',
        score: 80,
        maxScore: 100,
        bloomsLevel: 'APPLY',
        timestamp: new Date('2024-01-15'),
      };

      const result = await store.updateMastery('student-1', update);

      expect(mockPrisma.topicMastery.update).toHaveBeenCalled();
      expect(result.assessmentCount).toBe(3);
    });
  });

  // ============================================================================
  // GET MASTERY TESTS
  // ============================================================================

  describe('getMastery', () => {
    it('should return mastery for topic', async () => {
      const mockMastery = {
        topicId: 'topic-1',
        level: 'proficient',
        score: 85,
        bloomsLevel: 'ANALYZE',
        assessmentCount: 10,
        averageScore: 85,
        lastAssessedAt: new Date('2024-01-15'),
        trend: 'improving',
        confidence: 0.95,
      };
      mockPrisma.topicMastery.findUnique.mockResolvedValue(mockMastery);

      const result = await store.getMastery('student-1', 'topic-1');

      expect(mockPrisma.topicMastery.findUnique).toHaveBeenCalledWith({
        where: {
          studentId_topicId: { studentId: 'student-1', topicId: 'topic-1' },
        },
      });
      expect(result?.level).toBe('proficient');
    });

    it('should return null for non-existent mastery', async () => {
      mockPrisma.topicMastery.findUnique.mockResolvedValue(null);

      const result = await store.getMastery('student-1', 'unknown-topic');

      expect(result).toBeNull();
    });
  });

  // ============================================================================
  // UPDATE PATHWAY TESTS
  // ============================================================================

  describe('updatePathway', () => {
    it('should throw error when pathway not found', async () => {
      mockPrisma.learningPathway.findUnique.mockResolvedValue(null);

      const adjustment: PathwayAdjustment = {
        type: 'no_change',
      };

      await expect(store.updatePathway('student-1', 'pathway-1', adjustment)).rejects.toThrow(
        'Pathway not found: pathway-1'
      );
    });

    it('should throw error when pathway belongs to different student', async () => {
      mockPrisma.learningPathway.findUnique.mockResolvedValue({
        id: 'pathway-1',
        studentId: 'student-2', // Different student
        steps: [],
        currentStepIndex: 0,
      });

      const adjustment: PathwayAdjustment = {
        type: 'no_change',
      };

      await expect(store.updatePathway('student-1', 'pathway-1', adjustment)).rejects.toThrow(
        'Pathway not found: pathway-1'
      );
    });

    it('should add remediation steps', async () => {
      const existingSteps: PathwayStep[] = [
        { id: 'step-1', title: 'Step 1', type: 'lesson', status: 'completed' },
        { id: 'step-2', title: 'Step 2', type: 'quiz', status: 'active' },
        { id: 'step-3', title: 'Step 3', type: 'lesson', status: 'pending' },
      ];
      mockPrisma.learningPathway.findUnique.mockResolvedValue({
        id: 'pathway-1',
        studentId: 'student-1',
        courseId: 'course-1',
        steps: existingSteps,
        currentStepIndex: 1,
        progress: 0.33,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      });
      mockPrisma.learningPathway.update.mockResolvedValue({
        id: 'pathway-1',
        studentId: 'student-1',
        courseId: 'course-1',
        steps: [
          existingSteps[0],
          { id: 'remediation-1', title: 'Remediation', type: 'lesson', status: 'pending' },
          existingSteps[1],
          existingSteps[2],
        ],
        currentStepIndex: 1,
        progress: 0.33,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      });

      const adjustment: PathwayAdjustment = {
        type: 'add_remediation',
        stepsToAdd: [
          { id: 'remediation-1', title: 'Remediation', type: 'lesson', status: 'pending' },
        ],
      };

      await store.updatePathway('student-1', 'pathway-1', adjustment);

      expect(mockPrisma.learningPathway.update).toHaveBeenCalled();
    });

    it('should add challenge steps', async () => {
      const existingSteps: PathwayStep[] = [
        { id: 'step-1', title: 'Step 1', type: 'lesson', status: 'completed' },
        { id: 'step-2', title: 'Step 2', type: 'quiz', status: 'active' },
      ];
      mockPrisma.learningPathway.findUnique.mockResolvedValue({
        id: 'pathway-1',
        studentId: 'student-1',
        courseId: 'course-1',
        steps: existingSteps,
        currentStepIndex: 1,
        progress: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      });
      mockPrisma.learningPathway.update.mockResolvedValue({
        id: 'pathway-1',
        studentId: 'student-1',
        courseId: 'course-1',
        steps: [
          existingSteps[0],
          existingSteps[1],
          { id: 'challenge-1', title: 'Advanced Quiz', type: 'quiz', status: 'pending' },
        ],
        currentStepIndex: 1,
        progress: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
      });

      const adjustment: PathwayAdjustment = {
        type: 'add_challenge',
        stepsToAdd: [
          { id: 'challenge-1', title: 'Advanced Quiz', type: 'quiz', status: 'pending' },
        ],
      };

      await store.updatePathway('student-1', 'pathway-1', adjustment);

      expect(mockPrisma.learningPathway.update).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // GET ACTIVE PATHWAYS TESTS
  // ============================================================================

  describe('getActivePathways', () => {
    it('should return active pathways for student', async () => {
      const mockPathways = [
        {
          id: 'pathway-1',
          studentId: 'student-1',
          courseId: 'course-1',
          steps: [],
          currentStepIndex: 0,
          progress: 0.5,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
        },
      ];
      mockPrisma.learningPathway.findMany.mockResolvedValue(mockPathways);

      const result = await store.getActivePathways('student-1');

      expect(mockPrisma.learningPathway.findMany).toHaveBeenCalledWith({
        where: { studentId: 'student-1', status: 'active' },
      });
      expect(result).toHaveLength(1);
    });
  });

  // ============================================================================
  // UPDATE METRICS TESTS
  // ============================================================================

  describe('updateMetrics', () => {
    it('should update performance metrics', async () => {
      const existingProfile = createSampleStudentProfile({ id: 'student-1' });
      mockPrisma.studentProfile.findUnique.mockResolvedValue(existingProfile);
      mockPrisma.studentProfile.update.mockResolvedValue(existingProfile);

      const result = await store.updateMetrics('student-1', {
        currentStreak: 10,
        totalAssessments: 20,
      });

      expect(mockPrisma.studentProfile.update).toHaveBeenCalledWith({
        where: { id: 'student-1' },
        data: expect.objectContaining({
          performanceMetrics: expect.objectContaining({
            currentStreak: 10,
            totalAssessments: 20,
          }),
          updatedAt: expect.any(Date),
        }),
      });
      expect(result.currentStreak).toBe(10);
    });

    it('should throw error when profile not found', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue(null);

      await expect(
        store.updateMetrics('non-existent', { currentStreak: 5 })
      ).rejects.toThrow('Student profile not found: non-existent');
    });
  });

  // ============================================================================
  // GET KNOWLEDGE GAPS TESTS
  // ============================================================================

  describe('getKnowledgeGaps', () => {
    it('should return topics with low mastery', async () => {
      const mockResults = [{ topicId: 'topic-1' }, { topicId: 'topic-3' }];
      mockPrisma.topicMastery.findMany.mockResolvedValue(mockResults);

      const result = await store.getKnowledgeGaps('student-1');

      expect(mockPrisma.topicMastery.findMany).toHaveBeenCalledWith({
        where: {
          studentId: 'student-1',
          level: { in: ['novice', 'beginner'] },
        },
        select: { topicId: true },
      });
      expect(result).toEqual(['topic-1', 'topic-3']);
    });

    it('should return empty array when no gaps', async () => {
      mockPrisma.topicMastery.findMany.mockResolvedValue([]);

      const result = await store.getKnowledgeGaps('student-1');

      expect(result).toEqual([]);
    });
  });

  // ============================================================================
  // DELETE TESTS
  // ============================================================================

  describe('delete', () => {
    it('should delete student profile', async () => {
      await store.delete('student-1');

      expect(mockPrisma.studentProfile.delete).toHaveBeenCalledWith({
        where: { id: 'student-1' },
      });
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('createPrismaStudentProfileStore', () => {
    it('should create PrismaStudentProfileStore instance', () => {
      const store = createPrismaStudentProfileStore({ prisma: mockPrisma });

      expect(store).toBeInstanceOf(PrismaStudentProfileStore);
    });
  });
});
