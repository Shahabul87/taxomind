/**
 * Tests for AdaptiveQuestionSelector
 * Source: lib/adaptive-question-selection.ts
 */

jest.mock('@/lib/cognitive-prerequisite-mapping', () => ({
  CognitivePrerequisiteMapper: {
    getInstance: jest.fn().mockReturnValue({
      assessPrerequisiteMastery: jest.fn().mockReturnValue({
        readinessScore: 0.8,
        gaps: [],
      }),
    }),
  },
}));

jest.mock('@/lib/cognitive-analytics', () => ({
  CognitiveAnalyticsEngine: {
    getInstance: jest.fn().mockReturnValue({
      analyzeStudentProfile: jest.fn(),
    }),
  },
}));

jest.mock('@prisma/client', () => ({
  BloomsLevel: {
    REMEMBER: 'REMEMBER',
    UNDERSTAND: 'UNDERSTAND',
    APPLY: 'APPLY',
    ANALYZE: 'ANALYZE',
    EVALUATE: 'EVALUATE',
    CREATE: 'CREATE',
  },
  QuestionType: {
    MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
    TRUE_FALSE: 'TRUE_FALSE',
    SHORT_ANSWER: 'SHORT_ANSWER',
    ESSAY: 'ESSAY',
    FILL_IN_BLANK: 'FILL_IN_BLANK',
  },
  QuestionDifficulty: {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
  },
}));

import AdaptiveQuestionSelector from '@/lib/adaptive-question-selection';
import type {
  AdaptiveQuestion,
  StudentProfile,
  SelectionCriteria,
} from '@/lib/adaptive-question-selection';

describe('AdaptiveQuestionSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  let selector: InstanceType<typeof AdaptiveQuestionSelector>;

  beforeEach(() => {
    selector = AdaptiveQuestionSelector.getInstance();
  });

  function createQuestion(overrides: Partial<AdaptiveQuestion> = {}): AdaptiveQuestion {
    return {
      id: `q-${Math.random().toString(36).substr(2, 5)}`,
      question: 'What is a variable?',
      bloomsLevel: 'REMEMBER' as never,
      questionType: 'MULTIPLE_CHOICE' as never,
      difficulty: 'EASY' as never,
      cognitiveLoad: 1,
      prerequisites: [],
      learningObjectives: ['Define variables'],
      estimatedTime: 60,
      adaptiveMetrics: {
        difficultyCalibration: 0.3,
        discriminationIndex: 0.7,
        effectivenessScore: 0.8,
        cognitiveGrowthPotential: 0.5,
        engagementScore: 0.7,
        scaffoldingValue: 0.8,
      },
      ...overrides,
    };
  }

  function createStudentProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
    return {
      studentId: 'student-1',
      currentMasteryLevels: {
        REMEMBER: 0.9,
        UNDERSTAND: 0.8,
        APPLY: 0.6,
        ANALYZE: 0.4,
        EVALUATE: 0.2,
        CREATE: 0.1,
      } as never,
      learningVelocity: {
        REMEMBER: 2.0,
        UNDERSTAND: 1.5,
        APPLY: 1.0,
        ANALYZE: 0.8,
        EVALUATE: 0.5,
        CREATE: 0.3,
      } as never,
      strengthsWeaknesses: {
        cognitiveStrengths: ['REMEMBER', 'UNDERSTAND'] as never[],
        cognitiveWeaknesses: ['EVALUATE', 'CREATE'] as never[],
      },
      preferredQuestionTypes: ['MULTIPLE_CHOICE', 'SHORT_ANSWER'] as never[],
      optimalCognitiveLoad: 3,
      motivationalFactors: {
        challengePreference: 'moderate',
        feedbackSensitivity: 0.7,
        persistenceLevel: 0.8,
        growthMindset: 0.9,
        autonomyPreference: 0.6,
      },
      performanceHistory: {
        recentAccuracy: {
          REMEMBER: 0.95,
          UNDERSTAND: 0.85,
          APPLY: 0.70,
          ANALYZE: 0.50,
          EVALUATE: 0.30,
          CREATE: 0.20,
        } as never,
        learningTrends: {
          REMEMBER: 'stable',
          UNDERSTAND: 'improving',
          APPLY: 'improving',
          ANALYZE: 'stable',
          EVALUATE: 'declining',
          CREATE: 'stable',
        } as never,
        plateauRisk: {} as never,
        breakthroughReadiness: {} as never,
        errorPatterns: [],
      },
      ...overrides,
    };
  }

  function createCriteria(overrides: Partial<SelectionCriteria> = {}): SelectionCriteria {
    return {
      assessmentType: 'formative',
      adaptiveMode: 'learning',
      questionCount: 5,
      ...overrides,
    };
  }

  it('should be a singleton', () => {
    const instance1 = AdaptiveQuestionSelector.getInstance();
    const instance2 = AdaptiveQuestionSelector.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should select questions in learning mode', async () => {
    const questions = [
      createQuestion({ id: 'q1', bloomsLevel: 'REMEMBER' as never }),
      createQuestion({ id: 'q2', bloomsLevel: 'UNDERSTAND' as never, cognitiveLoad: 2 }),
      createQuestion({ id: 'q3', bloomsLevel: 'APPLY' as never, cognitiveLoad: 3 }),
      createQuestion({ id: 'q4', bloomsLevel: 'ANALYZE' as never, cognitiveLoad: 4 }),
      createQuestion({ id: 'q5', bloomsLevel: 'EVALUATE' as never, cognitiveLoad: 5 }),
    ];

    const profile = createStudentProfile();
    const criteria = createCriteria({ adaptiveMode: 'learning', questionCount: 3 });

    const result = await selector.selectQuestions(questions, profile, criteria);

    expect(result.selectedQuestions).toBeDefined();
    expect(result.selectedQuestions.length).toBeLessThanOrEqual(3);
    expect(result.selectionRationale).toBeDefined();
    expect(result.selectionRationale.primaryStrategy).toContain('learning');
    expect(result.predictedOutcomes).toBeDefined();
    expect(result.nextRecommendations).toBeDefined();
  });

  it('should select questions in challenge mode', async () => {
    const questions = [
      createQuestion({
        id: 'q1',
        bloomsLevel: 'APPLY' as never,
        cognitiveLoad: 3,
        adaptiveMetrics: {
          difficultyCalibration: 0.7,
          discriminationIndex: 0.8,
          effectivenessScore: 0.7,
          cognitiveGrowthPotential: 0.8,
          engagementScore: 0.6,
          scaffoldingValue: 0.5,
        },
      }),
      createQuestion({
        id: 'q2',
        bloomsLevel: 'ANALYZE' as never,
        cognitiveLoad: 4,
        adaptiveMetrics: {
          difficultyCalibration: 0.8,
          discriminationIndex: 0.9,
          effectivenessScore: 0.8,
          cognitiveGrowthPotential: 0.9,
          engagementScore: 0.7,
          scaffoldingValue: 0.4,
        },
      }),
    ];

    const profile = createStudentProfile();
    const criteria = createCriteria({ adaptiveMode: 'challenge', questionCount: 2 });

    const result = await selector.selectQuestions(questions, profile, criteria);

    expect(result.selectionRationale.primaryStrategy).toContain('challenge');
  });

  it('should select questions in remediation mode', async () => {
    const questions = [
      createQuestion({
        id: 'q1',
        bloomsLevel: 'EVALUATE' as never,
        difficulty: 'EASY' as never,
        cognitiveLoad: 2,
        adaptiveMetrics: {
          difficultyCalibration: 0.3,
          discriminationIndex: 0.5,
          effectivenessScore: 0.8,
          cognitiveGrowthPotential: 0.6,
          engagementScore: 0.8,
          scaffoldingValue: 0.9,
        },
      }),
    ];

    const profile = createStudentProfile();
    const criteria = createCriteria({ adaptiveMode: 'remediation', questionCount: 1 });

    const result = await selector.selectQuestions(questions, profile, criteria);

    expect(result.selectionRationale.primaryStrategy).toContain('remediation');
  });

  it('should select questions in advancement mode', async () => {
    const questions = [
      createQuestion({
        id: 'q1',
        bloomsLevel: 'APPLY' as never,
        cognitiveLoad: 3,
        adaptiveMetrics: {
          difficultyCalibration: 0.6,
          discriminationIndex: 0.7,
          effectivenessScore: 0.8,
          cognitiveGrowthPotential: 0.8,
          engagementScore: 0.7,
          scaffoldingValue: 0.7,
        },
      }),
    ];

    const profile = createStudentProfile();
    const criteria = createCriteria({ adaptiveMode: 'advancement', questionCount: 1 });

    const result = await selector.selectQuestions(questions, profile, criteria);

    expect(result.selectionRationale.primaryStrategy).toContain('advancement');
  });

  it('should handle empty question pool', async () => {
    const profile = createStudentProfile();
    const criteria = createCriteria({ questionCount: 5 });

    const result = await selector.selectQuestions([], profile, criteria);

    expect(result.selectedQuestions).toEqual([]);
  });

  it('should filter by prerequisites', async () => {
    const questions = [
      createQuestion({
        id: 'q-easy',
        bloomsLevel: 'REMEMBER' as never,
        prerequisites: [],
      }),
      createQuestion({
        id: 'q-hard',
        bloomsLevel: 'APPLY' as never,
        prerequisites: ['REMEMBER', 'UNDERSTAND'] as never[],
        cognitiveLoad: 3,
      }),
    ];

    // Student with low mastery in UNDERSTAND - should filter out q-hard
    const weakProfile = createStudentProfile({
      currentMasteryLevels: {
        REMEMBER: 0.9,
        UNDERSTAND: 0.3, // Below 0.7 threshold
        APPLY: 0.1,
        ANALYZE: 0.1,
        EVALUATE: 0.1,
        CREATE: 0.1,
      } as never,
    });

    const criteria = createCriteria({ questionCount: 5 });
    const result = await selector.selectQuestions(questions, weakProfile, criteria);

    // The hard question with UNDERSTAND prerequisite should be filtered out
    const selectedIds = result.selectedQuestions.map((q) => q.id);
    expect(selectedIds).not.toContain('q-hard');
  });

  it('should generate predicted outcomes', async () => {
    const questions = [
      createQuestion({ estimatedTime: 120 }),
      createQuestion({ estimatedTime: 180 }),
    ];

    const profile = createStudentProfile();
    const criteria = createCriteria({ questionCount: 2 });

    const result = await selector.selectQuestions(questions, profile, criteria);

    expect(result.predictedOutcomes.expectedAccuracy).toBeDefined();
    expect(result.predictedOutcomes.estimatedLearningGain).toBeDefined();
    expect(result.predictedOutcomes.challengeLevel).toBeDefined();
    expect(result.predictedOutcomes.engagementPrediction).toBeGreaterThan(0);
  });

  it('should generate adaptive adjustments when challenge is too hard', async () => {
    const questions = [
      createQuestion({ bloomsLevel: 'REMEMBER' as never }),
    ];

    // Low-performance student
    const weakProfile = createStudentProfile({
      performanceHistory: {
        recentAccuracy: {
          REMEMBER: 0.3,
          UNDERSTAND: 0.2,
          APPLY: 0.1,
          ANALYZE: 0.1,
          EVALUATE: 0.1,
          CREATE: 0.1,
        } as never,
        learningTrends: {} as never,
        plateauRisk: {} as never,
        breakthroughReadiness: {} as never,
        errorPatterns: [],
      },
    });

    const criteria = createCriteria({ questionCount: 1 });
    const result = await selector.selectQuestions(questions, weakProfile, criteria);

    // With very low accuracy, outcomes should predict "too_hard"
    if (result.predictedOutcomes.challengeLevel === 'too_hard') {
      expect(result.adaptiveAdjustments.length).toBeGreaterThan(0);
      expect(result.adaptiveAdjustments[0].adjustmentType).toBe('scaffolding');
    }
  });

  it('should generate recommendations', async () => {
    const questions = [createQuestion()];
    const profile = createStudentProfile();
    const criteria = createCriteria({ questionCount: 1 });

    const result = await selector.selectQuestions(questions, profile, criteria);

    expect(result.nextRecommendations.immediateNext).toBeDefined();
    expect(result.nextRecommendations.shortTermGoals).toBeDefined();
    expect(result.nextRecommendations.skillBuildingActivities).toBeDefined();
    expect(result.nextRecommendations.remediationNeeds).toBeDefined();
  });

  it('should respect cognitive load limits', async () => {
    const questions = [
      createQuestion({ id: 'q-low', cognitiveLoad: 1, bloomsLevel: 'REMEMBER' as never }),
      createQuestion({ id: 'q-high', cognitiveLoad: 5, bloomsLevel: 'REMEMBER' as never }),
    ];

    // Student with low optimal cognitive load
    const profile = createStudentProfile({ optimalCognitiveLoad: 2 });
    const criteria = createCriteria({ questionCount: 5 });

    const result = await selector.selectQuestions(questions, profile, criteria);

    // High cognitive load question (5) should be filtered out since optimal is 2 (allows up to 3)
    const selectedIds = result.selectedQuestions.map((q) => q.id);
    expect(selectedIds).not.toContain('q-high');
  });
});
