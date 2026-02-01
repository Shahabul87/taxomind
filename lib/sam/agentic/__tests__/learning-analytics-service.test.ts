/**
 * Unit tests for LearningAnalyticsService
 *
 * Tests session recording, skill assessment, recommendation generation,
 * progress reporting, and skill map retrieval.
 *
 * Mock collaborators are injected directly into private fields to bypass
 * workspace ESM resolution issues with @sam-ai/agentic factories.
 */

import {
  AssessmentSource,
  TimePeriod,
  MasteryLevel,
  TrendDirection,
} from '@sam-ai/agentic';
import type {
  SkillAssessment,
  RecommendationBatch,
  ProgressReport,
  SkillMap,
} from '@sam-ai/agentic';
import type { AgenticLogger } from '../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../taxomind-context', () => ({
  getTaxomindContext: jest.fn(() => ({
    stores: {
      learningSession: {},
      topicProgress: {},
      learningGap: {},
      skillAssessment: {},
      recommendation: {},
      content: {},
    },
  })),
}));

import { LearningAnalyticsService } from '../learning-analytics-service';

// ---------------------------------------------------------------------------
// Mock function references and service accessor type
// ---------------------------------------------------------------------------

const mockRecordSession = jest.fn();
const mockAssessSkill = jest.fn();
const mockGenerateRecommendations = jest.fn();
const mockGenerateReport = jest.fn();
const mockGenerateSkillMap = jest.fn();

interface ServiceInternals {
  progressAnalyzer?: {
    recordSession: jest.Mock;
    generateReport: jest.Mock;
  };
  skillAssessor?: {
    assessSkill: jest.Mock;
    generateSkillMap: jest.Mock;
  };
  recommendationEngine?: {
    generateRecommendations: jest.Mock;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createLogger(): AgenticLogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createServiceWithMocks(
  userId: string,
  logger: AgenticLogger,
  options: {
    withProgressAnalyzer?: boolean;
    withSkillAssessor?: boolean;
    withRecommendationEngine?: boolean;
  } = {},
): LearningAnalyticsService {
  const svc = new LearningAnalyticsService(userId, logger);
  const internals = svc as unknown as ServiceInternals;

  if (options.withProgressAnalyzer !== false) {
    internals.progressAnalyzer = {
      recordSession: mockRecordSession,
      generateReport: mockGenerateReport,
    };
  }
  if (options.withSkillAssessor !== false) {
    internals.skillAssessor = {
      assessSkill: mockAssessSkill,
      generateSkillMap: mockGenerateSkillMap,
    };
  }
  if (options.withRecommendationEngine !== false) {
    internals.recommendationEngine = {
      generateRecommendations: mockGenerateRecommendations,
    };
  }

  return svc;
}

function buildSkillAssessment(overrides: Partial<SkillAssessment> = {}): SkillAssessment {
  return {
    id: 'sa_1',
    userId: 'user_1',
    skillId: 'skill_ts_generics',
    skillName: 'TypeScript Generics',
    level: MasteryLevel.INTERMEDIATE,
    score: 72,
    confidence: 0.8,
    source: AssessmentSource.QUIZ,
    evidence: [],
    assessedAt: new Date('2025-01-15'),
    ...overrides,
  };
}

function buildRecommendationBatch(
  overrides: Partial<RecommendationBatch> = {},
): RecommendationBatch {
  return {
    id: 'rb_1',
    userId: 'user_1',
    recommendations: [
      {
        id: 'rec_1',
        userId: 'user_1',
        title: 'Practice generics exercises',
        description: 'Work through generic constraint exercises',
        priority: 'high',
        reason: 'knowledge_gap',
        contentType: 'exercise',
        estimatedTime: 30,
        skillId: 'skill_ts_generics',
        isCompleted: false,
        createdAt: new Date('2025-01-15'),
      },
    ],
    generatedAt: new Date('2025-01-15'),
    totalEstimatedTime: 30,
    context: {} as RecommendationBatch['context'],
    ...overrides,
  };
}

function buildProgressReport(overrides: Partial<ProgressReport> = {}): ProgressReport {
  return {
    id: 'pr_1',
    userId: 'user_1',
    generatedAt: new Date('2025-01-15'),
    period: TimePeriod.WEEKLY,
    periodStart: new Date('2025-01-08'),
    periodEnd: new Date('2025-01-15'),
    summary: {
      totalTimeSpent: 300,
      averageSessionDuration: 45,
      topicsCompleted: 2,
      topicsInProgress: 3,
      overallMastery: 65,
      quizzesCompleted: 5,
      averageQuizScore: 78,
      currentStreak: 4,
      longestStreak: 7,
      engagementLevel: 'medium',
    },
    topicBreakdown: [],
    trends: [],
    gaps: [],
    achievements: [],
    recommendations: [],
    ...overrides,
  };
}

function buildSkillMap(overrides: Partial<SkillMap> = {}): SkillMap {
  return {
    userId: 'user_1',
    generatedAt: new Date('2025-01-15'),
    nodes: [
      {
        skillId: 'skill_ts_generics',
        name: 'TypeScript Generics',
        level: MasteryLevel.INTERMEDIATE,
        score: 72,
        trend: TrendDirection.IMPROVING,
        connections: [],
        lastAssessedAt: new Date('2025-01-15'),
      },
    ],
    clusters: [],
    overallMastery: MasteryLevel.INTERMEDIATE,
    totalSkills: 1,
    assessedSkills: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LearningAnalyticsService', () => {
  let service: LearningAnalyticsService;
  let logger: AgenticLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = createLogger();
    service = createServiceWithMocks('user_1', logger);
  });

  // ========================================================================
  // recordSession
  // ========================================================================

  describe('recordSession', () => {
    it('creates a learning session record with user context', async () => {
      mockRecordSession.mockResolvedValue(undefined);

      await service.recordSession({
        topicId: 'topic_generics',
        duration: 45,
        questionsAnswered: 10,
        correctAnswers: 8,
        conceptsCovered: ['type-params', 'constraints'],
      });

      expect(mockRecordSession).toHaveBeenCalledWith({
        userId: 'user_1',
        topicId: 'topic_generics',
        duration: 45,
        questionsAnswered: 10,
        correctAnswers: 8,
        conceptsCovered: ['type-params', 'constraints'],
      });
    });

    it('logs the topicId and duration after recording', async () => {
      mockRecordSession.mockResolvedValue(undefined);

      await service.recordSession({ topicId: 'topic_1', duration: 20 });

      expect(logger.info).toHaveBeenCalledWith(
        'Session recorded',
        expect.objectContaining({ topicId: 'topic_1', duration: 20 }),
      );
    });

    it('handles sessions with only required fields', async () => {
      mockRecordSession.mockResolvedValue(undefined);

      await service.recordSession({ topicId: 'topic_2', duration: 5 });

      expect(mockRecordSession).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_1',
          topicId: 'topic_2',
          duration: 5,
        }),
      );
    });

    it('throws when the service has no progressAnalyzer', async () => {
      const uninitService = createServiceWithMocks('user_1', logger, {
        withProgressAnalyzer: false,
      });
      (uninitService as unknown as ServiceInternals).progressAnalyzer = undefined;

      await expect(
        uninitService.recordSession({ topicId: 't', duration: 10 }),
      ).rejects.toThrow('Learning Analytics not enabled');
    });
  });

  // ========================================================================
  // assessSkill
  // ========================================================================

  describe('assessSkill', () => {
    it('returns a skill level assessment with mapped source', async () => {
      const assessment = buildSkillAssessment({ level: MasteryLevel.PROFICIENT, score: 88 });
      mockAssessSkill.mockResolvedValue(assessment);

      const result = await service.assessSkill('skill_ts_generics', 88, 100, 'quiz');

      expect(mockAssessSkill).toHaveBeenCalledWith({
        userId: 'user_1',
        skillId: 'skill_ts_generics',
        score: 88,
        maxScore: 100,
        source: AssessmentSource.QUIZ,
      });
      expect(result.level).toBe(MasteryLevel.PROFICIENT);
      expect(result.score).toBe(88);
    });

    it('maps exercise source correctly', async () => {
      const assessment = buildSkillAssessment();
      mockAssessSkill.mockResolvedValue(assessment);

      await service.assessSkill('skill_1', 50, 100, 'exercise');

      expect(mockAssessSkill).toHaveBeenCalledWith(
        expect.objectContaining({ source: AssessmentSource.EXERCISE }),
      );
    });

    it('maps project source correctly', async () => {
      const assessment = buildSkillAssessment();
      mockAssessSkill.mockResolvedValue(assessment);

      await service.assessSkill('skill_1', 80, 100, 'project');

      expect(mockAssessSkill).toHaveBeenCalledWith(
        expect.objectContaining({ source: AssessmentSource.PROJECT }),
      );
    });

    it('maps self_assessment source correctly', async () => {
      const assessment = buildSkillAssessment();
      mockAssessSkill.mockResolvedValue(assessment);

      await service.assessSkill('skill_1', 65, 100, 'self_assessment');

      expect(mockAssessSkill).toHaveBeenCalledWith(
        expect.objectContaining({ source: AssessmentSource.SELF_ASSESSMENT }),
      );
    });

    it('passes undefined source for unmapped source strings', async () => {
      const assessment = buildSkillAssessment();
      mockAssessSkill.mockResolvedValue(assessment);

      await service.assessSkill('skill_1', 70, 100, 'unknown_source');

      expect(mockAssessSkill).toHaveBeenCalledWith(
        expect.objectContaining({ source: undefined }),
      );
    });

    it('logs the assessed skill and level', async () => {
      const assessment = buildSkillAssessment({
        level: MasteryLevel.EXPERT,
      });
      mockAssessSkill.mockResolvedValue(assessment);

      await service.assessSkill('skill_ts', 95, 100, 'quiz');

      expect(logger.info).toHaveBeenCalledWith(
        'Skill assessed',
        expect.objectContaining({
          skillId: 'skill_ts',
          score: 95,
          level: MasteryLevel.EXPERT,
        }),
      );
    });

    it('throws when the service has no skillAssessor', async () => {
      const uninitService = createServiceWithMocks('user_1', logger, {
        withSkillAssessor: false,
      });
      (uninitService as unknown as ServiceInternals).skillAssessor = undefined;

      await expect(
        uninitService.assessSkill('s', 50, 100, 'quiz'),
      ).rejects.toThrow('Learning Analytics not enabled');
    });
  });

  // ========================================================================
  // getRecommendations
  // ========================================================================

  describe('getRecommendations', () => {
    it('returns learning recommendations with counts', async () => {
      const batch = buildRecommendationBatch();
      mockGenerateRecommendations.mockResolvedValue(batch);

      const result = await service.getRecommendations();

      expect(result.recommendations).toHaveLength(1);
      expect(result.totalEstimatedTime).toBe(30);
    });

    it('passes availableTime and goals to the engine', async () => {
      const batch = buildRecommendationBatch();
      mockGenerateRecommendations.mockResolvedValue(batch);

      await service.getRecommendations({
        availableTime: 60,
        goals: ['goal_1', 'goal_2'],
      });

      expect(mockGenerateRecommendations).toHaveBeenCalledWith({
        userId: 'user_1',
        availableTime: 60,
        currentGoals: ['goal_1', 'goal_2'],
      });
    });

    it('works with no options provided', async () => {
      const batch = buildRecommendationBatch();
      mockGenerateRecommendations.mockResolvedValue(batch);

      await service.getRecommendations();

      expect(mockGenerateRecommendations).toHaveBeenCalledWith({
        userId: 'user_1',
        availableTime: undefined,
        currentGoals: undefined,
      });
    });

    it('logs the recommendation count and total time', async () => {
      const batch = buildRecommendationBatch({ totalEstimatedTime: 120 });
      batch.recommendations = [
        ...batch.recommendations,
        { ...batch.recommendations[0], id: 'rec_2', title: 'Second recommendation' },
      ];
      mockGenerateRecommendations.mockResolvedValue(batch);

      await service.getRecommendations();

      expect(logger.info).toHaveBeenCalledWith(
        'Recommendations generated',
        expect.objectContaining({ count: 2, totalTime: 120 }),
      );
    });

    it('throws when the service has no recommendationEngine', async () => {
      const uninitService = createServiceWithMocks('user_1', logger, {
        withRecommendationEngine: false,
      });
      (uninitService as unknown as ServiceInternals).recommendationEngine = undefined;

      await expect(uninitService.getRecommendations()).rejects.toThrow(
        'Learning Analytics not enabled',
      );
    });
  });

  // ========================================================================
  // getProgressReport
  // ========================================================================

  describe('getProgressReport', () => {
    it('returns progress metrics for the weekly period by default', async () => {
      const report = buildProgressReport({ period: TimePeriod.WEEKLY });
      mockGenerateReport.mockResolvedValue(report);

      const result = await service.getProgressReport();

      expect(mockGenerateReport).toHaveBeenCalledWith('user_1', TimePeriod.WEEKLY);
      expect(result.period).toBe(TimePeriod.WEEKLY);
      expect(result.summary.totalTimeSpent).toBe(300);
    });

    it('maps daily period correctly', async () => {
      const report = buildProgressReport({ period: TimePeriod.DAILY });
      mockGenerateReport.mockResolvedValue(report);

      await service.getProgressReport('daily');

      expect(mockGenerateReport).toHaveBeenCalledWith('user_1', TimePeriod.DAILY);
    });

    it('maps monthly period correctly', async () => {
      const report = buildProgressReport({ period: TimePeriod.MONTHLY });
      mockGenerateReport.mockResolvedValue(report);

      await service.getProgressReport('monthly');

      expect(mockGenerateReport).toHaveBeenCalledWith('user_1', TimePeriod.MONTHLY);
    });

    it('throws when the service has no progressAnalyzer', async () => {
      const uninitService = createServiceWithMocks('user_1', logger, {
        withProgressAnalyzer: false,
      });
      (uninitService as unknown as ServiceInternals).progressAnalyzer = undefined;

      await expect(uninitService.getProgressReport()).rejects.toThrow(
        'Learning Analytics not enabled',
      );
    });
  });

  // ========================================================================
  // getSkillMap
  // ========================================================================

  describe('getSkillMap', () => {
    it('returns skill mapping data for the user', async () => {
      const skillMap = buildSkillMap();
      mockGenerateSkillMap.mockResolvedValue(skillMap);

      const result = await service.getSkillMap();

      expect(mockGenerateSkillMap).toHaveBeenCalledWith('user_1');
      expect(result.userId).toBe('user_1');
      expect(result.nodes).toHaveLength(1);
      expect(result.totalSkills).toBe(1);
      expect(result.overallMastery).toBe(MasteryLevel.INTERMEDIATE);
    });

    it('returns a skill map with multiple nodes', async () => {
      const multiNodeMap = buildSkillMap({
        totalSkills: 3,
        assessedSkills: 2,
        nodes: [
          {
            skillId: 'skill_1',
            name: 'TypeScript Basics',
            level: MasteryLevel.EXPERT,
            score: 95,
            trend: TrendDirection.STABLE,
            connections: ['skill_2'],
            lastAssessedAt: new Date('2025-01-10'),
          },
          {
            skillId: 'skill_2',
            name: 'TypeScript Generics',
            level: MasteryLevel.INTERMEDIATE,
            score: 60,
            trend: TrendDirection.IMPROVING,
            connections: ['skill_1'],
            lastAssessedAt: new Date('2025-01-14'),
          },
        ],
      });
      mockGenerateSkillMap.mockResolvedValue(multiNodeMap);

      const result = await service.getSkillMap();

      expect(result.nodes).toHaveLength(2);
      expect(result.totalSkills).toBe(3);
      expect(result.assessedSkills).toBe(2);
    });

    it('throws when the service has no skillAssessor', async () => {
      const uninitService = createServiceWithMocks('user_1', logger, {
        withSkillAssessor: false,
      });
      (uninitService as unknown as ServiceInternals).skillAssessor = undefined;

      await expect(uninitService.getSkillMap()).rejects.toThrow(
        'Learning Analytics not enabled',
      );
    });
  });

  // ========================================================================
  // Capability checks
  // ========================================================================

  describe('capability checks', () => {
    it('hasProgressAnalyzer returns true when injected', () => {
      expect(service.hasProgressAnalyzer()).toBe(true);
    });

    it('hasRecommendationEngine returns true when injected', () => {
      expect(service.hasRecommendationEngine()).toBe(true);
    });

    it('isEnabled returns true when progressAnalyzer is present', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('isEnabled returns false when service is not initialized', () => {
      const uninitService = new LearningAnalyticsService('user_1', logger);
      expect(uninitService.isEnabled()).toBe(false);
    });
  });
});
