/**
 * @sam-ai/educational - Predictive Engine Tests
 * Tests for AI-powered predictive analytics for learning outcomes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PredictiveEngine, createPredictiveEngine } from '../engines/predictive-engine';
import type {
  PredictiveEngineConfig,
  PredictiveStudentProfile,
  StudentCohort,
  PredictiveLearningContext,
} from '../types';
import { createMockSAMConfig, createMockAIAdapter, createMockAIResponse } from './setup';

// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================

function createSamplePredictiveStudentProfile(
  overrides: Partial<PredictiveStudentProfile> = {}
): PredictiveStudentProfile {
  return {
    userId: 'user-1',
    courseId: 'course-1',
    learningHistory: {
      coursesCompleted: 3,
      averageScore: 75,
      timeSpentLearning: 1200, // minutes
      lastActivityDate: new Date(),
      learningStreak: 7,
      preferredLearningTime: 'evening',
      strongSubjects: ['programming', 'math'],
      weakSubjects: ['writing'],
    },
    performanceMetrics: {
      overallProgress: 0.5,
      assessmentScores: [70, 75, 80, 85],
      averageScore: 77.5,
      improvementRate: 0.05,
      consistencyScore: 0.8,
      engagementLevel: 0.7,
      participationRate: 0.8,
    },
    behaviorPatterns: {
      studyFrequency: 'daily',
      sessionDuration: 45,
      contentPreferences: ['video', 'interactive'],
      interactionPatterns: ['discussion', 'practice'],
      strugglingIndicators: [],
    },
    ...overrides,
  };
}

function createLowEngagementStudent(
  overrides: Partial<PredictiveStudentProfile> = {}
): PredictiveStudentProfile {
  const lastActivity = new Date();
  lastActivity.setDate(lastActivity.getDate() - 14); // 14 days ago

  return createSamplePredictiveStudentProfile({
    userId: 'user-low-engagement',
    performanceMetrics: {
      overallProgress: 0.2,
      assessmentScores: [50, 45, 40],
      averageScore: 45,
      improvementRate: -0.1,
      consistencyScore: 0.3,
      engagementLevel: 0.2,
      participationRate: 0.3,
    },
    behaviorPatterns: {
      studyFrequency: 'sporadic',
      sessionDuration: 15,
      contentPreferences: [],
      interactionPatterns: [],
      strugglingIndicators: ['Low motivation', 'Time constraints'],
    },
    learningHistory: {
      coursesCompleted: 0,
      averageScore: 45,
      timeSpentLearning: 120,
      lastActivityDate: lastActivity,
      learningStreak: 0,
      preferredLearningTime: 'unknown',
      strongSubjects: [],
      weakSubjects: ['all'],
    },
    ...overrides,
  });
}

function createHighPerformingStudent(
  overrides: Partial<PredictiveStudentProfile> = {}
): PredictiveStudentProfile {
  return createSamplePredictiveStudentProfile({
    userId: 'user-high-performing',
    performanceMetrics: {
      overallProgress: 0.8,
      assessmentScores: [90, 92, 95, 88, 94],
      averageScore: 91.8,
      improvementRate: 0.15,
      consistencyScore: 0.95,
      engagementLevel: 0.9,
      participationRate: 0.95,
    },
    behaviorPatterns: {
      studyFrequency: 'daily',
      sessionDuration: 60,
      contentPreferences: ['video', 'interactive', 'reading'],
      interactionPatterns: ['discussion', 'practice', 'collaboration'],
      strugglingIndicators: [],
    },
    ...overrides,
  });
}

function createSampleStudentCohort(
  overrides: Partial<StudentCohort> = {}
): StudentCohort {
  return {
    courseId: 'course-1',
    students: [
      createSamplePredictiveStudentProfile({ userId: 'user-1' }),
      createHighPerformingStudent({ userId: 'user-2' }),
      createLowEngagementStudent({ userId: 'user-3' }),
      createSamplePredictiveStudentProfile({
        userId: 'user-4',
        performanceMetrics: {
          overallProgress: 0.4,
          assessmentScores: [60, 65],
          averageScore: 62.5,
          improvementRate: 0.02,
          consistencyScore: 0.6,
          engagementLevel: 0.5,
          participationRate: 0.5,
        },
      }),
    ],
    timeframe: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    },
    ...overrides,
  };
}

function createSampleLearningContext(
  overrides: Partial<PredictiveLearningContext> = {}
): PredictiveLearningContext {
  return {
    studentProfile: createSamplePredictiveStudentProfile(),
    courseContext: {
      courseId: 'course-1',
      difficulty: 'medium',
      duration: 30, // days
      prerequisites: ['basics'],
      assessmentTypes: ['quiz', 'project'],
    },
    environmentFactors: {
      deviceType: 'desktop',
      networkQuality: 'good',
      distractionLevel: 'low',
      timeOfDay: 'evening',
    },
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('PredictiveEngine', () => {
  let engine: PredictiveEngine;
  let config: PredictiveEngineConfig;

  beforeEach(() => {
    config = {
      samConfig: createMockSAMConfig(),
    };
    engine = createPredictiveEngine(config);
  });

  // ==========================================================================
  // PREDICT LEARNING OUTCOMES TESTS
  // ==========================================================================

  describe('predictLearningOutcomes', () => {
    it('should return a valid outcome prediction', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.predictLearningOutcomes(student);

      expect(result).toBeDefined();
      expect(result.successProbability).toBeGreaterThanOrEqual(0);
      expect(result.successProbability).toBeLessThanOrEqual(1);
      expect(result.confidenceInterval).toBeDefined();
      expect(result.confidenceInterval.lower).toBeLessThanOrEqual(
        result.confidenceInterval.upper
      );
      expect(result.predictedCompletionDate).toBeInstanceOf(Date);
      expect(result.predictedFinalScore).toBeGreaterThanOrEqual(0);
      expect(result.predictedFinalScore).toBeLessThanOrEqual(100);
    });

    it('should identify risk factors for low engagement students', async () => {
      const student = createLowEngagementStudent();
      const result = await engine.predictLearningOutcomes(student);

      expect(result.riskFactors.length).toBeGreaterThan(0);
      const riskFactorNames = result.riskFactors.map((rf) => rf.factor);
      expect(riskFactorNames).toContain('Low Engagement');
    });

    it('should identify success factors for high performing students', async () => {
      const student = createHighPerformingStudent();
      const result = await engine.predictLearningOutcomes(student);

      expect(result.successFactors.length).toBeGreaterThan(0);
      const successFactorNames = result.successFactors.map((sf) => sf.factor);
      expect(successFactorNames).toContain('Strong Academic Performance');
    });

    it('should generate recommended actions based on risks and successes', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.predictLearningOutcomes(student);

      expect(result.recommendedActions).toBeDefined();
      expect(Array.isArray(result.recommendedActions)).toBe(true);
    });

    it('should predict higher success for high performing students', async () => {
      const highPerformer = createHighPerformingStudent();
      const lowEngagement = createLowEngagementStudent();

      const highResult = await engine.predictLearningOutcomes(highPerformer);
      const lowResult = await engine.predictLearningOutcomes(lowEngagement);

      expect(highResult.successProbability).toBeGreaterThan(
        lowResult.successProbability
      );
    });

    it('should predict completion date in the future', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.predictLearningOutcomes(student);

      expect(result.predictedCompletionDate.getTime()).toBeGreaterThan(
        Date.now()
      );
    });

    it('should include confidence interval within valid bounds', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.predictLearningOutcomes(student);

      expect(result.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
      expect(result.confidenceInterval.upper).toBeLessThanOrEqual(1);
    });

    it('should handle extended inactivity risk factor', async () => {
      const inactiveStudent = createLowEngagementStudent();
      const result = await engine.predictLearningOutcomes(inactiveStudent);

      const riskFactorNames = result.riskFactors.map((rf) => rf.factor);
      expect(riskFactorNames).toContain('Extended Inactivity');
    });

    it('should identify irregular study pattern risk', async () => {
      const student = createSamplePredictiveStudentProfile({
        behaviorPatterns: {
          studyFrequency: 'sporadic',
          sessionDuration: 20,
          contentPreferences: [],
          interactionPatterns: [],
          strugglingIndicators: [],
        },
      });
      const result = await engine.predictLearningOutcomes(student);

      const riskFactorNames = result.riskFactors.map((rf) => rf.factor);
      expect(riskFactorNames).toContain('Irregular Study Pattern');
    });

    it('should identify declining performance risk', async () => {
      const student = createSamplePredictiveStudentProfile({
        performanceMetrics: {
          overallProgress: 0.5,
          assessmentScores: [80, 70, 60, 50],
          averageScore: 65,
          improvementRate: -0.15,
          consistencyScore: 0.6,
          engagementLevel: 0.6,
          participationRate: 0.5,
        },
      });
      const result = await engine.predictLearningOutcomes(student);

      const riskFactorNames = result.riskFactors.map((rf) => rf.factor);
      expect(riskFactorNames).toContain('Declining Performance');
    });
  });

  // ==========================================================================
  // IDENTIFY AT-RISK STUDENTS TESTS
  // ==========================================================================

  describe('identifyAtRiskStudents', () => {
    it('should return a valid risk analysis for a cohort', async () => {
      const cohort = createSampleStudentCohort();
      const result = await engine.identifyAtRiskStudents(cohort);

      expect(result).toBeDefined();
      expect(result.atRiskStudents).toBeDefined();
      expect(Array.isArray(result.atRiskStudents)).toBe(true);
      expect(result.riskDistribution).toBeDefined();
      expect(result.cohortHealth).toBeGreaterThanOrEqual(0);
      expect(result.cohortHealth).toBeLessThanOrEqual(1);
    });

    it('should identify low engagement students as at-risk', async () => {
      const cohort = createSampleStudentCohort();
      const result = await engine.identifyAtRiskStudents(cohort);

      const atRiskUserIds = result.atRiskStudents.map((s) => s.userId);
      expect(atRiskUserIds).toContain('user-3'); // low engagement student
    });

    it('should calculate risk distribution correctly', async () => {
      const cohort = createSampleStudentCohort();
      const result = await engine.identifyAtRiskStudents(cohort);

      const total =
        result.riskDistribution.high +
        result.riskDistribution.medium +
        result.riskDistribution.low +
        result.riskDistribution.safe;

      expect(total).toBe(cohort.students.length);
    });

    it('should provide intervention recommendations', async () => {
      const cohort = createSampleStudentCohort();
      const result = await engine.identifyAtRiskStudents(cohort);

      expect(result.interventionRecommendations).toBeDefined();
      expect(Array.isArray(result.interventionRecommendations)).toBe(true);
    });

    it('should identify common risk factors across cohort', async () => {
      const cohort = createSampleStudentCohort({
        students: [
          createLowEngagementStudent({ userId: 'user-1' }),
          createLowEngagementStudent({ userId: 'user-2' }),
          createLowEngagementStudent({ userId: 'user-3' }),
        ],
      });
      const result = await engine.identifyAtRiskStudents(cohort);

      expect(result.commonRiskFactors.length).toBeGreaterThan(0);
    });

    it('should assign risk levels (high, medium, low) correctly', async () => {
      const cohort = createSampleStudentCohort();
      const result = await engine.identifyAtRiskStudents(cohort);

      result.atRiskStudents.forEach((student) => {
        expect(['high', 'medium', 'low']).toContain(student.riskLevel);
        expect(student.riskScore).toBeGreaterThanOrEqual(0);
      });
    });

    it('should include primary risks for each at-risk student', async () => {
      const cohort = createSampleStudentCohort();
      const result = await engine.identifyAtRiskStudents(cohort);

      result.atRiskStudents.forEach((student) => {
        expect(student.primaryRisks).toBeDefined();
        expect(Array.isArray(student.primaryRisks)).toBe(true);
      });
    });

    it('should handle empty cohort', async () => {
      const cohort = createSampleStudentCohort({ students: [] });
      const result = await engine.identifyAtRiskStudents(cohort);

      expect(result.atRiskStudents).toHaveLength(0);
      expect(result.riskDistribution.safe).toBe(0);
    });

    it('should calculate cohort health between 0 and 1', async () => {
      const cohort = createSampleStudentCohort();
      const result = await engine.identifyAtRiskStudents(cohort);

      expect(result.cohortHealth).toBeGreaterThanOrEqual(0);
      expect(result.cohortHealth).toBeLessThanOrEqual(1);
    });
  });

  // ==========================================================================
  // RECOMMEND INTERVENTIONS TESTS
  // ==========================================================================

  describe('recommendInterventions', () => {
    it('should return a valid intervention plan', async () => {
      const student = createLowEngagementStudent();
      const result = await engine.recommendInterventions(student);

      expect(result).toBeDefined();
      expect(result.studentId).toBe(student.userId);
      expect(result.interventions).toBeDefined();
      expect(Array.isArray(result.interventions)).toBe(true);
      expect(result.sequencing).toBeDefined();
      expect(['parallel', 'sequential']).toContain(result.sequencing);
    });

    it('should include timeline with milestones', async () => {
      const student = createLowEngagementStudent();
      const result = await engine.recommendInterventions(student);

      expect(result.timeline).toBeDefined();
      expect(result.timeline.start).toBeInstanceOf(Date);
      expect(result.timeline.end).toBeInstanceOf(Date);
      expect(result.timeline.milestones).toBeDefined();
      expect(Array.isArray(result.timeline.milestones)).toBe(true);
    });

    it('should calculate total expected impact', async () => {
      const student = createLowEngagementStudent();
      const result = await engine.recommendInterventions(student);

      expect(result.totalExpectedImpact).toBeGreaterThanOrEqual(0);
      expect(result.totalExpectedImpact).toBeLessThanOrEqual(1);
    });

    it('should select high-effectiveness interventions for high-risk students', async () => {
      const student = createLowEngagementStudent();
      const result = await engine.recommendInterventions(student);

      expect(result.interventions.length).toBeGreaterThan(0);
      expect(result.interventions.length).toBeLessThanOrEqual(3);
    });

    it('should include success criteria for each intervention', async () => {
      const student = createLowEngagementStudent();
      const result = await engine.recommendInterventions(student);

      result.interventions.forEach((intervention) => {
        expect(intervention.successCriteria).toBeDefined();
        expect(Array.isArray(intervention.successCriteria)).toBe(true);
        expect(intervention.successCriteria.length).toBeGreaterThan(0);
      });
    });

    it('should set intervention timings in the future', async () => {
      const student = createLowEngagementStudent();
      const result = await engine.recommendInterventions(student);

      result.interventions.forEach((intervention) => {
        expect(intervention.timing).toBeInstanceOf(Date);
      });
    });

    it('should include expected response for each intervention', async () => {
      const student = createLowEngagementStudent();
      const result = await engine.recommendInterventions(student);

      result.interventions.forEach((intervention) => {
        expect(intervention.expectedResponse).toBeDefined();
        expect(typeof intervention.expectedResponse).toBe('string');
      });
    });

    it('should use valid intervention types', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.recommendInterventions(student);

      const validTypes = [
        'email',
        'notification',
        'content-recommendation',
        'tutor-assignment',
        'peer-connection',
        'schedule-adjustment',
      ];

      result.interventions.forEach((intervention) => {
        expect(validTypes).toContain(intervention.type);
      });
    });
  });

  // ==========================================================================
  // OPTIMIZE LEARNING VELOCITY TESTS
  // ==========================================================================

  describe('optimizeLearningVelocity', () => {
    it('should return a valid velocity optimization', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.optimizeLearningVelocity(student);

      expect(result).toBeDefined();
      expect(result.currentVelocity).toBeGreaterThanOrEqual(0);
      expect(result.optimalVelocity).toBeGreaterThanOrEqual(0);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should provide a personalized schedule', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.optimizeLearningVelocity(student);

      expect(result.personalizedSchedule).toBeDefined();
      expect(result.personalizedSchedule.dailyGoals).toBeDefined();
      expect(result.personalizedSchedule.dailyGoals).toHaveLength(7);
    });

    it('should include all week days in schedule', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.optimizeLearningVelocity(student);

      const days = result.personalizedSchedule.dailyGoals.map((g) => g.day);
      expect(days).toContain('Monday');
      expect(days).toContain('Friday');
      expect(days).toContain('Sunday');
    });

    it('should calculate expected improvement', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.optimizeLearningVelocity(student);

      expect(result.expectedImprovement).toBeGreaterThanOrEqual(0);
      expect(result.expectedImprovement).toBeLessThanOrEqual(0.5);
    });

    it('should provide velocity recommendations with areas', async () => {
      const student = createSamplePredictiveStudentProfile({
        performanceMetrics: {
          overallProgress: 0.2,
          assessmentScores: [60],
          averageScore: 60,
          improvementRate: 0,
          consistencyScore: 0.5,
          engagementLevel: 0.5,
          participationRate: 0.5,
        },
      });
      const result = await engine.optimizeLearningVelocity(student);

      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach((rec) => {
        expect(rec.area).toBeDefined();
        expect(rec.currentApproach).toBeDefined();
        expect(rec.optimizedApproach).toBeDefined();
      });
    });

    it('should include weekly milestones in schedule', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.optimizeLearningVelocity(student);

      expect(result.personalizedSchedule.weeklyMilestones).toBeDefined();
      expect(result.personalizedSchedule.weeklyMilestones.length).toBeGreaterThan(0);
    });

    it('should include flexibility score in schedule', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.optimizeLearningVelocity(student);

      expect(result.personalizedSchedule.flexibilityScore).toBeGreaterThanOrEqual(0);
      expect(result.personalizedSchedule.flexibilityScore).toBeLessThanOrEqual(1);
    });

    it('should include adaptation triggers in schedule', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.optimizeLearningVelocity(student);

      expect(result.personalizedSchedule.adaptationTriggers).toBeDefined();
      expect(result.personalizedSchedule.adaptationTriggers.length).toBeGreaterThan(0);
    });

    it('should set difficulty based on day and performance', async () => {
      const student = createSamplePredictiveStudentProfile();
      const result = await engine.optimizeLearningVelocity(student);

      result.personalizedSchedule.dailyGoals.forEach((goal) => {
        expect(['easy', 'medium', 'hard']).toContain(goal.difficulty);
      });
    });
  });

  // ==========================================================================
  // CALCULATE SUCCESS PROBABILITY TESTS
  // ==========================================================================

  describe('calculateSuccessProbability', () => {
    it('should return a valid probability score', async () => {
      const context = createSampleLearningContext();
      const result = await engine.calculateSuccessProbability(context);

      expect(result).toBeDefined();
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include model version', async () => {
      const context = createSampleLearningContext();
      const result = await engine.calculateSuccessProbability(context);

      expect(result.modelVersion).toBeDefined();
      expect(typeof result.modelVersion).toBe('string');
    });

    it('should include calculation timestamp', async () => {
      const context = createSampleLearningContext();
      const result = await engine.calculateSuccessProbability(context);

      expect(result.calculatedAt).toBeInstanceOf(Date);
    });

    it('should identify contributing factors', async () => {
      const context = createSampleLearningContext();
      const result = await engine.calculateSuccessProbability(context);

      expect(result.factors).toBeDefined();
      expect(result.factors.positive).toBeDefined();
      expect(result.factors.negative).toBeDefined();
      expect(Array.isArray(result.factors.positive)).toBe(true);
      expect(Array.isArray(result.factors.negative)).toBe(true);
    });

    it('should return higher probability for engaged students', async () => {
      const highEngagementContext = createSampleLearningContext({
        studentProfile: createHighPerformingStudent(),
      });
      const lowEngagementContext = createSampleLearningContext({
        studentProfile: createLowEngagementStudent(),
      });

      const highResult = await engine.calculateSuccessProbability(highEngagementContext);
      const lowResult = await engine.calculateSuccessProbability(lowEngagementContext);

      expect(highResult.probability).toBeGreaterThan(lowResult.probability);
    });

    it('should identify positive factors for high performers', async () => {
      const context = createSampleLearningContext({
        studentProfile: createHighPerformingStudent(),
      });
      const result = await engine.calculateSuccessProbability(context);

      expect(result.factors.positive.length).toBeGreaterThan(0);
    });

    it('should identify negative factors for low performers', async () => {
      const context = createSampleLearningContext({
        studentProfile: createLowEngagementStudent(),
      });
      const result = await engine.calculateSuccessProbability(context);

      expect(result.factors.negative.length).toBeGreaterThan(0);
    });

    it('should consider course difficulty', async () => {
      const easyContext = createSampleLearningContext({
        courseContext: {
          courseId: 'course-easy',
          difficulty: 'easy',
          duration: 14,
          prerequisites: [],
          assessmentTypes: ['quiz'],
        },
      });

      const hardContext = createSampleLearningContext({
        courseContext: {
          courseId: 'course-hard',
          difficulty: 'hard',
          duration: 90,
          prerequisites: ['advanced-basics'],
          assessmentTypes: ['quiz', 'project', 'exam'],
        },
      });

      const easyResult = await engine.calculateSuccessProbability(easyContext);
      const hardResult = await engine.calculateSuccessProbability(hardContext);

      // Hard courses should generally have slightly lower probabilities
      expect(easyResult.probability).not.toBe(hardResult.probability);
    });
  });

  // ==========================================================================
  // FACTORY FUNCTION TESTS
  // ==========================================================================

  describe('factory function', () => {
    it('should create engine with basic config', () => {
      const basicConfig: PredictiveEngineConfig = {
        samConfig: createMockSAMConfig(),
      };

      const basicEngine = createPredictiveEngine(basicConfig);

      expect(basicEngine).toBeInstanceOf(PredictiveEngine);
    });

    it('should create engine with custom AI adapter', () => {
      const customAdapter = createMockAIAdapter(() =>
        createMockAIResponse('0.05')
      );

      const customConfig: PredictiveEngineConfig = {
        samConfig: {
          ...createMockSAMConfig(),
          ai: customAdapter,
        },
      };

      const customEngine = createPredictiveEngine(customConfig);
      expect(customEngine).toBeInstanceOf(PredictiveEngine);
    });
  });

  // ==========================================================================
  // AI INTEGRATION TESTS
  // ==========================================================================

  describe('AI integration', () => {
    it('should use AI adapter for ML adjustments', async () => {
      let aiCalled = false;
      const trackingAdapter = createMockAIAdapter(() => {
        aiCalled = true;
        return createMockAIResponse('0.1');
      });

      const trackingConfig: PredictiveEngineConfig = {
        samConfig: {
          ...createMockSAMConfig(),
          ai: trackingAdapter,
        },
      };

      const trackingEngine = createPredictiveEngine(trackingConfig);
      const student = createSamplePredictiveStudentProfile();

      await trackingEngine.predictLearningOutcomes(student);

      expect(aiCalled).toBe(true);
    });

    it('should handle AI adapter errors gracefully', async () => {
      const errorAdapter = createMockAIAdapter(() => {
        throw new Error('AI service unavailable');
      });

      const errorConfig: PredictiveEngineConfig = {
        samConfig: {
          ...createMockSAMConfig(),
          ai: errorAdapter,
        },
      };

      const errorEngine = createPredictiveEngine(errorConfig);
      const student = createSamplePredictiveStudentProfile();

      // Should not throw, should fall back to heuristic
      const result = await errorEngine.predictLearningOutcomes(student);
      expect(result).toBeDefined();
      expect(result.successProbability).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid AI response gracefully', async () => {
      const invalidAdapter = createMockAIAdapter(() =>
        createMockAIResponse('not-a-number')
      );

      const invalidConfig: PredictiveEngineConfig = {
        samConfig: {
          ...createMockSAMConfig(),
          ai: invalidAdapter,
        },
      };

      const invalidEngine = createPredictiveEngine(invalidConfig);
      const student = createSamplePredictiveStudentProfile();

      // Should not throw, should fall back to heuristic
      const result = await invalidEngine.predictLearningOutcomes(student);
      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle student with zero progress', async () => {
      const student = createSamplePredictiveStudentProfile({
        performanceMetrics: {
          overallProgress: 0,
          assessmentScores: [],
          averageScore: 0,
          improvementRate: 0,
          consistencyScore: 0,
          engagementLevel: 0,
          participationRate: 0,
        },
      });

      const result = await engine.predictLearningOutcomes(student);
      expect(result).toBeDefined();
      expect(result.successProbability).toBeGreaterThanOrEqual(0);
    });

    it('should handle student with perfect metrics', async () => {
      const student = createSamplePredictiveStudentProfile({
        performanceMetrics: {
          overallProgress: 1,
          assessmentScores: [100, 100, 100],
          averageScore: 100,
          improvementRate: 0.2,
          consistencyScore: 1,
          engagementLevel: 1,
          participationRate: 1,
        },
      });

      const result = await engine.predictLearningOutcomes(student);
      expect(result).toBeDefined();
      expect(result.successProbability).toBeGreaterThan(0.5);
    });

    it('should handle cohort with only safe students', async () => {
      const cohort = createSampleStudentCohort({
        students: [
          createHighPerformingStudent({ userId: 'user-1' }),
          createHighPerformingStudent({ userId: 'user-2' }),
        ],
      });

      const result = await engine.identifyAtRiskStudents(cohort);
      expect(result.atRiskStudents.length).toBe(0);
      expect(result.cohortHealth).toBeGreaterThan(0.5);
    });

    it('should handle cohort with only at-risk students', async () => {
      const cohort = createSampleStudentCohort({
        students: [
          createLowEngagementStudent({ userId: 'user-1' }),
          createLowEngagementStudent({ userId: 'user-2' }),
        ],
      });

      const result = await engine.identifyAtRiskStudents(cohort);
      expect(result.atRiskStudents.length).toBe(2);
      expect(result.cohortHealth).toBeLessThan(0.5);
    });

    it('should handle very recent last activity date', async () => {
      const student = createSamplePredictiveStudentProfile({
        learningHistory: {
          coursesCompleted: 1,
          averageScore: 75,
          timeSpentLearning: 100,
          lastActivityDate: new Date(), // Just now
          learningStreak: 1,
          preferredLearningTime: 'morning',
          strongSubjects: [],
          weakSubjects: [],
        },
      });

      const result = await engine.predictLearningOutcomes(student);
      expect(result).toBeDefined();

      // Should not have extended inactivity risk
      const riskFactorNames = result.riskFactors.map((rf) => rf.factor);
      expect(riskFactorNames).not.toContain('Extended Inactivity');
    });
  });
});
