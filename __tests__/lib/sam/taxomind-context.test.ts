/**
 * TaxomindContext Integration Tests
 *
 * Tests for the centralized SAM store access layer.
 * These tests verify the singleton pattern, store initialization,
 * and convenience accessor functions.
 *
 * Note: This file tests the exported functions and their behavior,
 * not the actual store implementations (which require a database).
 */

// ============================================================================
// MOCKS MUST BE DEFINED BEFORE ANY IMPORTS
// ============================================================================

// Mock server-only module
jest.mock('server-only', () => ({}));

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
    completions: { create: jest.fn() },
  })),
}));

// Mock OpenAI SDK
jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } },
    embeddings: { create: jest.fn() },
  })),
}));

// Mock the db module
jest.mock('@/lib/db', () => ({
  db: {
    sAMGoal: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    sAMSubGoal: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    sAMPlan: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    sAMBehaviorEvent: { findMany: jest.fn(), create: jest.fn() },
    sAMPattern: { findMany: jest.fn(), create: jest.fn() },
    sAMIntervention: { findMany: jest.fn(), create: jest.fn() },
    sAMCheckIn: { findMany: jest.fn(), create: jest.fn() },
    sAMTool: { findMany: jest.fn(), findUnique: jest.fn() },
    sAMLearningSession: { findMany: jest.fn(), create: jest.fn() },
    sAMTopicProgress: { findMany: jest.fn(), create: jest.fn() },
    sAMLearningGap: { findMany: jest.fn(), create: jest.fn() },
    sAMSkillAssessment: { findMany: jest.fn(), create: jest.fn() },
    sAMRecommendation: { findMany: jest.fn(), create: jest.fn() },
    sAMContent: { findMany: jest.fn(), create: jest.fn() },
    sAMVector: { findMany: jest.fn(), create: jest.fn() },
    sAMKnowledgeGraph: { findMany: jest.fn(), create: jest.fn() },
    sAMSessionContext: { findMany: jest.fn(), create: jest.fn() },
    sAMSkill: { findMany: jest.fn(), create: jest.fn() },
    sAMLearningPath: { findMany: jest.fn(), create: jest.fn() },
    sAMCourseGraph: { findMany: jest.fn(), create: jest.fn() },
    sAMLearningPlan: { findMany: jest.fn(), create: jest.fn() },
    sAMTutoringSession: { findMany: jest.fn(), create: jest.fn() },
    sAMSkillBuildTrack: { findMany: jest.fn(), create: jest.fn() },
    sAMMicrolearning: { findMany: jest.fn(), create: jest.fn() },
    sAMMetacognition: { findMany: jest.fn(), create: jest.fn() },
    sAMCompetency: { findMany: jest.fn(), create: jest.fn() },
    sAMPeerLearning: { findMany: jest.fn(), create: jest.fn() },
    sAMIntegrity: { findMany: jest.fn(), create: jest.fn() },
    sAMMultimodal: { findMany: jest.fn(), create: jest.fn() },
    sAMPracticeSession: { findMany: jest.fn(), create: jest.fn() },
    sAMSkillMastery10K: { findMany: jest.fn(), create: jest.fn() },
    sAMPracticeLeaderboard: { findMany: jest.fn(), create: jest.fn() },
    sAMDailyPracticeLog: { findMany: jest.fn(), create: jest.fn() },
    sAMPracticeChallenge: { findMany: jest.fn(), create: jest.fn() },
    sAMPracticeGoal: { findMany: jest.fn(), create: jest.fn() },
    sAMSpacedRepetition: { findMany: jest.fn(), create: jest.fn() },
    sAMToolTelemetry: { findMany: jest.fn(), create: jest.fn() },
    sAMConfidenceCalibration: { findMany: jest.fn(), create: jest.fn() },
    sAMMemoryQuality: { findMany: jest.fn(), create: jest.fn() },
    sAMPlanLifecycle: { findMany: jest.fn(), create: jest.fn() },
    sAMMetrics: { findMany: jest.fn(), create: jest.fn() },
    sAMPresence: { findMany: jest.fn(), create: jest.fn(), upsert: jest.fn() },
    sAMStudentProfile: { findMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
    sAMReviewSchedule: { findMany: jest.fn(), create: jest.fn() },
    sAMPushQueue: { findMany: jest.fn(), create: jest.fn() },
    sAMConfidenceScore: { findMany: jest.fn(), create: jest.fn() },
    sAMVerificationResult: { findMany: jest.fn(), create: jest.fn() },
    sAMQualityRecord: { findMany: jest.fn(), create: jest.fn() },
    sAMCalibration: { findMany: jest.fn(), create: jest.fn() },
    sAMSelfCritique: { findMany: jest.fn(), create: jest.fn() },
    sAMLearningPattern: { findMany: jest.fn(), create: jest.fn() },
    sAMMetaLearningInsight: { findMany: jest.fn(), create: jest.fn() },
    sAMLearningStrategy: { findMany: jest.fn(), create: jest.fn() },
    sAMLearningEvent: { findMany: jest.fn(), create: jest.fn() },
    sAMJourneyTimeline: { findMany: jest.fn(), create: jest.fn() },
    $transaction: jest.fn((fn) => fn({
      sAMGoal: { findMany: jest.fn(), create: jest.fn() },
    })),
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Create mock store objects
const createMockStore = (name: string) => ({
  list: jest.fn().mockResolvedValue([]),
  get: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockResolvedValue({ id: `mock-${name}-id` }),
  update: jest.fn().mockResolvedValue({ id: `mock-${name}-id` }),
  delete: jest.fn().mockResolvedValue(true),
  record: jest.fn().mockResolvedValue(true),
  search: jest.fn().mockResolvedValue([]),
  upsert: jest.fn().mockResolvedValue({ id: `mock-${name}-id` }),
  track: jest.fn().mockResolvedValue(true),
  schedule: jest.fn().mockResolvedValue(true),
  push: jest.fn().mockResolvedValue(true),
  set: jest.fn().mockResolvedValue(true),
});

// Mock adapter-taxomind - must be complete to prevent actual module loading
jest.mock('@sam-ai/adapter-taxomind', () => ({
  bootstrapTaxomindIntegration: jest.fn(() => ({
    profile: { id: 'test-profile', version: '1.0.0' },
    factory: { createAdapter: jest.fn() },
    registry: { getCapabilities: jest.fn() },
  })),
  getTaxomindIntegration: jest.fn(() => {
    throw new Error('Not initialized');
  }),
}));

// Mock adapter-prisma stores
jest.mock('@sam-ai/adapter-prisma', () => ({
  createPrismaObservabilityStores: jest.fn(() => ({
    toolTelemetry: createMockStore('toolTelemetry'),
    confidenceCalibration: createMockStore('confidenceCalibration'),
    memoryQuality: createMockStore('memoryQuality'),
    planLifecycle: createMockStore('planLifecycle'),
    metrics: createMockStore('metrics'),
  })),
  createPrismaSelfEvaluationStores: jest.fn(() => ({
    confidenceScore: createMockStore('confidenceScore'),
    verificationResult: createMockStore('verificationResult'),
    qualityRecord: createMockStore('qualityRecord'),
    calibration: createMockStore('calibration'),
    selfCritique: createMockStore('selfCritique'),
  })),
  createPrismaMetaLearningStores: jest.fn(() => ({
    learningPattern: createMockStore('learningPattern'),
    metaLearningInsight: createMockStore('metaLearningInsight'),
    learningStrategy: createMockStore('learningStrategy'),
    learningEvent: createMockStore('learningEvent'),
  })),
  createPrismaJourneyTimelineStore: jest.fn(() => createMockStore('journeyTimeline')),
  createPrismaPresenceStore: jest.fn(() => createMockStore('presence')),
  createPrismaStudentProfileStore: jest.fn(() => createMockStore('studentProfile')),
  createPrismaReviewScheduleStore: jest.fn(() => createMockStore('reviewSchedule')),
  createPrismaPushQueueStore: jest.fn(() => createMockStore('pushQueue')),
}));

// Mock local stores
jest.mock('@/lib/sam/stores', () => ({
  createPrismaGoalStore: jest.fn(() => createMockStore('goal')),
  createPrismaSubGoalStore: jest.fn(() => createMockStore('subGoal')),
  createPrismaPlanStore: jest.fn(() => createMockStore('plan')),
  createPrismaBehaviorEventStore: jest.fn(() => createMockStore('behaviorEvent')),
  createPrismaPatternStore: jest.fn(() => createMockStore('pattern')),
  createPrismaInterventionStore: jest.fn(() => createMockStore('intervention')),
  createPrismaCheckInStore: jest.fn(() => createMockStore('checkIn')),
  createPrismaToolStore: jest.fn(() => createMockStore('tool')),
  createPrismaLearningSessionStore: jest.fn(() => createMockStore('learningSession')),
  createPrismaTopicProgressStore: jest.fn(() => createMockStore('topicProgress')),
  createPrismaLearningGapStore: jest.fn(() => createMockStore('learningGap')),
  createPrismaSkillAssessmentStore: jest.fn(() => createMockStore('skillAssessment')),
  createPrismaRecommendationStore: jest.fn(() => createMockStore('recommendation')),
  createPrismaContentStore: jest.fn(() => createMockStore('content')),
  createPrismaVectorAdapter: jest.fn(() => createMockStore('vector')),
  createPrismaKnowledgeGraphStore: jest.fn(() => createMockStore('knowledgeGraph')),
  createPrismaSessionContextStore: jest.fn(() => createMockStore('sessionContext')),
  createPrismaSkillStore: jest.fn(() => createMockStore('skill')),
  createPrismaLearningPathStore: jest.fn(() => createMockStore('learningPath')),
  createPrismaCourseGraphStore: jest.fn(() => createMockStore('courseGraph')),
  createPrismaLearningPlanStore: jest.fn(() => createMockStore('learningPlan')),
  createPrismaTutoringSessionStore: jest.fn(() => createMockStore('tutoringSession')),
  createPrismaSkillBuildTrackStore: jest.fn(() => createMockStore('skillBuildTrack')),
  createPrismaMicrolearningStore: jest.fn(() => createMockStore('microlearning')),
  createPrismaMetacognitionStore: jest.fn(() => createMockStore('metacognition')),
  createPrismaCompetencyStore: jest.fn(() => createMockStore('competency')),
  createPrismaPeerLearningStore: jest.fn(() => createMockStore('peerLearning')),
  createPrismaIntegrityStore: jest.fn(() => createMockStore('integrity')),
  createPrismaMultimodalStore: jest.fn(() => createMockStore('multimodal')),
  createPrismaPracticeSessionStore: jest.fn(() => createMockStore('practiceSession')),
  createPrismaSkillMastery10KStore: jest.fn(() => createMockStore('skillMastery10K')),
  createPrismaPracticeLeaderboardStore: jest.fn(() => createMockStore('practiceLeaderboard')),
  createPrismaDailyPracticeLogStore: jest.fn(() => createMockStore('dailyPracticeLog')),
  createPrismaPracticeChallengeStore: jest.fn(() => createMockStore('practiceChallenge')),
  createPrismaPracticeGoalStore: jest.fn(() => createMockStore('practiceGoal')),
  createPrismaSpacedRepetitionStore: jest.fn(() => createMockStore('spacedRepetition')),
}));

// ============================================================================
// TESTS
// ============================================================================

describe('TaxomindContext', () => {
  // Reset modules before each test to get fresh singleton
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('getTaxomindContext', () => {
    it('should return a context object with stores and integration', async () => {
      const { getTaxomindContext } = await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(context).toBeDefined();
      expect(context.stores).toBeDefined();
      expect(context.integration).toBeDefined();
      expect(context.isInitialized).toBe(true);
      expect(context.initializationTime).toBeInstanceOf(Date);
    });

    it('should return the same instance on subsequent calls (singleton)', async () => {
      const { getTaxomindContext } = await import('@/lib/sam/taxomind-context');
      const context1 = getTaxomindContext();
      const context2 = getTaxomindContext();

      expect(context1).toBe(context2);
    });

    it('should initialize all expected stores', async () => {
      const { getTaxomindContext } = await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      // Core stores
      expect(context.stores.goal).toBeDefined();
      expect(context.stores.subGoal).toBeDefined();
      expect(context.stores.plan).toBeDefined();

      // Proactive stores
      expect(context.stores.behaviorEvent).toBeDefined();
      expect(context.stores.pattern).toBeDefined();
      expect(context.stores.intervention).toBeDefined();
      expect(context.stores.checkIn).toBeDefined();

      // Tool store
      expect(context.stores.tool).toBeDefined();

      // Analytics stores
      expect(context.stores.learningSession).toBeDefined();
      expect(context.stores.topicProgress).toBeDefined();
      expect(context.stores.learningGap).toBeDefined();
      expect(context.stores.skillAssessment).toBeDefined();
      expect(context.stores.recommendation).toBeDefined();

      // Memory stores
      expect(context.stores.vector).toBeDefined();
      expect(context.stores.knowledgeGraph).toBeDefined();
      expect(context.stores.sessionContext).toBeDefined();

      // Learning path stores
      expect(context.stores.skill).toBeDefined();
      expect(context.stores.learningPath).toBeDefined();
      expect(context.stores.courseGraph).toBeDefined();

      // Practice stores
      expect(context.stores.practiceSession).toBeDefined();
      expect(context.stores.practiceGoal).toBeDefined();
      expect(context.stores.spacedRepetition).toBeDefined();
    });
  });

  describe('resetTaxomindContext', () => {
    it('should reset the singleton instance', async () => {
      const { getTaxomindContext, resetTaxomindContext, isTaxomindContextInitialized } =
        await import('@/lib/sam/taxomind-context');

      // Initialize
      getTaxomindContext();
      expect(isTaxomindContextInitialized()).toBe(true);

      // Reset
      resetTaxomindContext();
      expect(isTaxomindContextInitialized()).toBe(false);
    });

    it('should create a new instance after reset', async () => {
      const { getTaxomindContext, resetTaxomindContext } =
        await import('@/lib/sam/taxomind-context');

      const context1 = getTaxomindContext();
      const time1 = context1.initializationTime;

      resetTaxomindContext();

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      const context2 = getTaxomindContext();
      const time2 = context2.initializationTime;

      expect(context1).not.toBe(context2);
      expect(time2.getTime()).toBeGreaterThan(time1.getTime());
    });
  });

  describe('getStore', () => {
    it('should return the requested store', async () => {
      const { getStore, getTaxomindContext } = await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      const goalStore = getStore('goal');
      expect(goalStore).toBe(context.stores.goal);

      const planStore = getStore('plan');
      expect(planStore).toBe(context.stores.plan);

      const practiceGoalStore = getStore('practiceGoal');
      expect(practiceGoalStore).toBe(context.stores.practiceGoal);
    });
  });

  describe('Store group accessors', () => {
    it('getGoalStores should return goal-related stores', async () => {
      const { getGoalStores, getTaxomindContext } = await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();
      const goalStores = getGoalStores();

      expect(goalStores.goal).toBe(context.stores.goal);
      expect(goalStores.subGoal).toBe(context.stores.subGoal);
      expect(goalStores.plan).toBe(context.stores.plan);
    });

    it('getProactiveStores should return proactive intervention stores', async () => {
      const { getProactiveStores, getTaxomindContext } = await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();
      const proactiveStores = getProactiveStores();

      expect(proactiveStores.behaviorEvent).toBe(context.stores.behaviorEvent);
      expect(proactiveStores.pattern).toBe(context.stores.pattern);
      expect(proactiveStores.intervention).toBe(context.stores.intervention);
      expect(proactiveStores.checkIn).toBe(context.stores.checkIn);
    });

    it('getMemoryStores should return memory-related stores', async () => {
      const { getMemoryStores, getTaxomindContext } = await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();
      const memoryStores = getMemoryStores();

      expect(memoryStores.vector).toBe(context.stores.vector);
      expect(memoryStores.knowledgeGraph).toBe(context.stores.knowledgeGraph);
      expect(memoryStores.sessionContext).toBe(context.stores.sessionContext);
    });

    it('getLearningPathStores should return learning path stores', async () => {
      const { getLearningPathStores, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();
      const pathStores = getLearningPathStores();

      expect(pathStores.skill).toBe(context.stores.skill);
      expect(pathStores.learningPath).toBe(context.stores.learningPath);
      expect(pathStores.courseGraph).toBe(context.stores.courseGraph);
    });

    it('getAnalyticsStores should return analytics stores', async () => {
      const { getAnalyticsStores, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();
      const analyticsStores = getAnalyticsStores();

      expect(analyticsStores.learningSession).toBe(context.stores.learningSession);
      expect(analyticsStores.topicProgress).toBe(context.stores.topicProgress);
      expect(analyticsStores.learningGap).toBe(context.stores.learningGap);
      expect(analyticsStores.skillAssessment).toBe(context.stores.skillAssessment);
      expect(analyticsStores.recommendation).toBe(context.stores.recommendation);
      expect(analyticsStores.content).toBe(context.stores.content);
    });

    it('getPracticeStores should return practice tracking stores', async () => {
      const { getPracticeStores, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();
      const practiceStores = getPracticeStores();

      expect(practiceStores.practiceSession).toBe(context.stores.practiceSession);
      expect(practiceStores.skillMastery10K).toBe(context.stores.skillMastery10K);
      expect(practiceStores.practiceLeaderboard).toBe(context.stores.practiceLeaderboard);
      expect(practiceStores.dailyPracticeLog).toBe(context.stores.dailyPracticeLog);
      expect(practiceStores.practiceChallenge).toBe(context.stores.practiceChallenge);
      expect(practiceStores.practiceGoal).toBe(context.stores.practiceGoal);
      expect(practiceStores.spacedRepetition).toBe(context.stores.spacedRepetition);
    });

    it('getEducationalEngineStores should return educational engine stores', async () => {
      const { getEducationalEngineStores, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();
      const eduStores = getEducationalEngineStores();

      expect(eduStores.microlearning).toBe(context.stores.microlearning);
      expect(eduStores.metacognition).toBe(context.stores.metacognition);
      expect(eduStores.competency).toBe(context.stores.competency);
      expect(eduStores.peerLearning).toBe(context.stores.peerLearning);
      expect(eduStores.integrity).toBe(context.stores.integrity);
      expect(eduStores.multimodal).toBe(context.stores.multimodal);
    });

    it('getObservabilityStores should return observability stores', async () => {
      const { getObservabilityStores, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();
      const obsStores = getObservabilityStores();

      expect(obsStores.toolTelemetry).toBe(context.stores.toolTelemetry);
      expect(obsStores.confidenceCalibration).toBe(context.stores.confidenceCalibration);
      expect(obsStores.memoryQuality).toBe(context.stores.memoryQuality);
      expect(obsStores.planLifecycle).toBe(context.stores.planLifecycle);
      expect(obsStores.metrics).toBe(context.stores.metrics);
    });
  });

  describe('Individual store accessors', () => {
    it('getPresenceStore should return presence store', async () => {
      const { getPresenceStore, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(getPresenceStore()).toBe(context.stores.presence);
    });

    it('getStudentProfileStore should return student profile store', async () => {
      const { getStudentProfileStore, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(getStudentProfileStore()).toBe(context.stores.studentProfile);
    });

    it('getReviewScheduleStore should return review schedule store', async () => {
      const { getReviewScheduleStore, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(getReviewScheduleStore()).toBe(context.stores.reviewSchedule);
    });

    it('getPushQueueStore should return push queue store', async () => {
      const { getPushQueueStore, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(getPushQueueStore()).toBe(context.stores.pushQueue);
    });

    it('getSpacedRepetitionStore should return spaced repetition store', async () => {
      const { getSpacedRepetitionStore, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(getSpacedRepetitionStore()).toBe(context.stores.spacedRepetition);
    });
  });

  describe('Integration context accessors', () => {
    it('getIntegrationContext should return the integration context', async () => {
      const { getIntegrationContext, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(getIntegrationContext()).toBe(context.integration);
    });

    it('getAdapterFactory should return the factory', async () => {
      const { getAdapterFactory, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(getAdapterFactory()).toBe(context.integration.factory);
    });

    it('getIntegrationProfile should return the profile', async () => {
      const { getIntegrationProfile, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(getIntegrationProfile()).toBe(context.integration.profile);
    });

    it('getCapabilityRegistry should return the registry', async () => {
      const { getCapabilityRegistry, getTaxomindContext } =
        await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();

      expect(getCapabilityRegistry()).toBe(context.integration.registry);
    });
  });

  describe('Store count verification', () => {
    it('should have at least 48 stores (current: 55)', async () => {
      const { getTaxomindContext } = await import('@/lib/sam/taxomind-context');
      const context = getTaxomindContext();
      const storeCount = Object.keys(context.stores).length;

      // Based on the TaxomindAgenticStores interface (may grow over time)
      expect(storeCount).toBeGreaterThanOrEqual(48);
      // Current count is 56 - update if stores are added
      expect(storeCount).toBe(56);
    });
  });
});
