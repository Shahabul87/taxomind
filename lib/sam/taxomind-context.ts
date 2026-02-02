/**
 * Taxomind Integration Context (SERVER-ONLY)
 *
 * Singleton wrapper that provides centralized access to all SAM agentic stores
 * and integrations. This is the SINGLE ENTRY POINT for accessing Prisma stores.
 *
 * Architecture Goal: All SAM integration code should go through this context
 * instead of directly importing/creating stores.
 *
 * Usage:
 * ```typescript
 * import { getTaxomindContext } from '@/lib/sam/taxomind-context';
 *
 * const context = getTaxomindContext();
 * const goalStore = context.stores.goal;
 * const planStore = context.stores.plan;
 * ```
 *
 * NOTE: This module uses Prisma and MUST only be imported in server contexts.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  bootstrapTaxomindIntegration,
  getTaxomindIntegration,
  type TaxomindIntegrationContext as AdapterIntegrationContext,
} from '@sam-ai/adapter-taxomind';

// Import interface types from @sam-ai/agentic for stores that return interface types
import type {
  BehaviorEventStore,
  PatternStore,
  InterventionStore,
  CheckInStore,
  PresenceStore,
} from '@sam-ai/agentic';

// Import all store factories from local stores
import { createPrismaContextSnapshotStore } from './stores/context-snapshot-store';
import type { PrismaContextSnapshotStore } from './stores/context-snapshot-store';

import {
  createPrismaGoalStore,
  createPrismaSubGoalStore,
  createPrismaPlanStore,
  createPrismaBehaviorEventStore,
  createPrismaPatternStore,
  createPrismaInterventionStore,
  createPrismaCheckInStore,
  createPrismaToolStore,
  createPrismaLearningSessionStore,
  createPrismaTopicProgressStore,
  createPrismaLearningGapStore,
  createPrismaSkillAssessmentStore,
  createPrismaRecommendationStore,
  createPrismaContentStore,
  createPrismaVectorAdapter,
  createPrismaKnowledgeGraphStore,
  createPrismaSessionContextStore,
  createPrismaSkillStore,
  createPrismaLearningPathStore,
  createPrismaCourseGraphStore,
  createPrismaLearningPlanStore,
  createPrismaTutoringSessionStore,
  createPrismaSkillBuildTrackStore,
  // Phase 6: Educational Engine Store Factories
  createPrismaMicrolearningStore,
  createPrismaMetacognitionStore,
  createPrismaCompetencyStore,
  createPrismaPeerLearningStore,
  createPrismaIntegrityStore,
  createPrismaMultimodalStore,
  // Phase 7: 10,000 Hour Practice Tracking Store Factories
  createPrismaPracticeSessionStore,
  createPrismaSkillMastery10KStore,
  createPrismaPracticeLeaderboardStore,
  createPrismaDailyPracticeLogStore,
  // Practice Challenge Store Factory
  createPrismaPracticeChallengeStore,
  // Practice Goal Store Factory
  createPrismaPracticeGoalStore,
  // Spaced Repetition Store Factory
  createPrismaSpacedRepetitionStore,
  // Memory Lifecycle: Reindex Job Store Factory
  createPrismaReindexJobStore,
} from './stores';

// Import adapter-prisma stores for observability, presence, student profile, review schedule, push queue
import {
  createPrismaObservabilityStores,
  createPrismaPresenceStore,
  createPrismaStudentProfileStore,
  createPrismaReviewScheduleStore,
  createPrismaPushQueueStore,
  createPrismaSelfEvaluationStores,
  createPrismaMetaLearningStores,
  createPrismaJourneyTimelineStore,
  type PrismaToolTelemetryStore,
  type PrismaConfidenceCalibrationStore,
  type PrismaMemoryQualityStore,
  type PrismaPlanLifecycleStore,
  type PrismaMetricsStore,
  type PrismaPresenceStore,
  type PrismaStudentProfileStore,
  type PrismaReviewScheduleStore,
  type PrismaPushQueueStore,
  type PrismaConfidenceScoreStore,
  type PrismaVerificationResultStore,
  type PrismaQualityRecordStore,
  type PrismaCalibrationStore,
  type PrismaSelfCritiqueStore,
  type PrismaLearningPatternStore,
  type PrismaMetaLearningInsightStore,
  type PrismaLearningStrategyStore,
  type PrismaLearningEventStore,
  type PrismaJourneyTimelineStore,
} from '@sam-ai/adapter-prisma';

// Import class types from stores (for stores that return class types)
import type {
  PrismaGoalStore,
  PrismaSubGoalStore,
  PrismaPlanStore,
  PrismaToolStore,
  PrismaLearningSessionStore,
  PrismaTopicProgressStore,
  PrismaLearningGapStore,
  PrismaSkillAssessmentStore,
  PrismaRecommendationStore,
  PrismaContentStore,
  PrismaVectorAdapter,
  PrismaKnowledgeGraphStore,
  PrismaSessionContextStore,
  PrismaSkillStore,
  PrismaLearningPathStore,
  PrismaCourseGraphStore,
  PrismaLearningPlanStore,
  PrismaTutoringSessionStore,
  PrismaSkillBuildTrackStore,
  // Phase 6: Educational Engine Store Types
  PrismaMicrolearningStore,
  PrismaMetacognitionStore,
  PrismaCompetencyStore,
  PrismaPeerLearningStore,
  PrismaIntegrityStore,
  PrismaMultimodalStore,
  // Phase 7: 10,000 Hour Practice Tracking Store Types
  PrismaPracticeSessionStore,
  PrismaSkillMastery10KStore,
  PrismaPracticeLeaderboardStore,
  PrismaDailyPracticeLogStore,
  // Practice Challenge Store Type
  PrismaPracticeChallengeStore,
  // Practice Goal Store Type
  PrismaPracticeGoalStore,
  // Spaced Repetition Store Type
  PrismaSpacedRepetitionStore,
  // Memory Lifecycle: Reindex Job Store Type
  PrismaReindexJobStore,
} from './stores';

// ============================================================================
// STORE TYPES
// ============================================================================

/**
 * All available Prisma stores for SAM integration
 * Note: Some stores return interface types from @sam-ai/agentic,
 * while others return class types from our local stores.
 */
export interface TaxomindAgenticStores {
  // Goal Planning
  goal: PrismaGoalStore;
  subGoal: PrismaSubGoalStore;
  plan: PrismaPlanStore;

  // Proactive Intervention (these return interface types from @sam-ai/agentic)
  behaviorEvent: BehaviorEventStore;
  pattern: PatternStore;
  intervention: InterventionStore;
  checkIn: CheckInStore;

  // Tool Registry
  tool: PrismaToolStore;

  // Analytics
  learningSession: PrismaLearningSessionStore;
  topicProgress: PrismaTopicProgressStore;
  learningGap: PrismaLearningGapStore;
  skillAssessment: PrismaSkillAssessmentStore;
  recommendation: PrismaRecommendationStore;
  content: PrismaContentStore;

  // Memory
  vector: PrismaVectorAdapter;
  knowledgeGraph: PrismaKnowledgeGraphStore;
  sessionContext: PrismaSessionContextStore;

  // Learning Path
  skill: PrismaSkillStore;
  learningPath: PrismaLearningPathStore;
  courseGraph: PrismaCourseGraphStore;

  // Multi-Session
  learningPlan: PrismaLearningPlanStore;
  tutoringSession: PrismaTutoringSessionStore;

  // SkillBuildTrack
  skillBuildTrack: PrismaSkillBuildTrackStore;

  // Observability (telemetry, calibration, quality metrics)
  toolTelemetry: PrismaToolTelemetryStore;
  confidenceCalibration: PrismaConfidenceCalibrationStore;
  memoryQuality: PrismaMemoryQualityStore;
  planLifecycle: PrismaPlanLifecycleStore;
  metrics: PrismaMetricsStore;

  // Self-Evaluation (confidence, verification, quality, critique)
  confidenceScore: PrismaConfidenceScoreStore;
  verificationResult: PrismaVerificationResultStore;
  qualityRecord: PrismaQualityRecordStore;
  calibration: PrismaCalibrationStore;
  selfCritique: PrismaSelfCritiqueStore;

  // Meta-Learning (patterns, insights, strategies, events)
  learningPattern: PrismaLearningPatternStore;
  metaLearningInsight: PrismaMetaLearningInsightStore;
  learningStrategy: PrismaLearningStrategyStore;
  learningEvent: PrismaLearningEventStore;

  // Journey Timeline
  journeyTimeline: PrismaJourneyTimelineStore;

  // Presence (realtime user tracking)
  presence: PrismaPresenceStore;

  // Student Profile (mastery tracking)
  studentProfile: PrismaStudentProfileStore;

  // Review Schedule (spaced repetition)
  reviewSchedule: PrismaReviewScheduleStore;

  // Push Queue (persistent push notification queue)
  pushQueue: PrismaPushQueueStore;

  // Phase 6: Educational Engine Stores
  microlearning: PrismaMicrolearningStore;
  metacognition: PrismaMetacognitionStore;
  competency: PrismaCompetencyStore;
  peerLearning: PrismaPeerLearningStore;
  integrity: PrismaIntegrityStore;
  multimodal: PrismaMultimodalStore;

  // Phase 7: 10,000 Hour Practice Tracking Stores
  practiceSession: PrismaPracticeSessionStore;
  skillMastery10K: PrismaSkillMastery10KStore;
  practiceLeaderboard: PrismaPracticeLeaderboardStore;
  dailyPracticeLog: PrismaDailyPracticeLogStore;

  // Practice Challenge Store
  practiceChallenge: PrismaPracticeChallengeStore;

  // Practice Goal Store
  practiceGoal: PrismaPracticeGoalStore;

  // Spaced Repetition Store (SM-2 Algorithm)
  spacedRepetition: PrismaSpacedRepetitionStore;

  // Memory Lifecycle: Reindex Job Store
  reindexJob: PrismaReindexJobStore;

  // Context Gathering
  contextSnapshot: PrismaContextSnapshotStore;
}

/**
 * Taxomind Integration Context
 * Single entry point for all SAM stores and integrations
 */
export interface TaxomindIntegrationContext {
  stores: TaxomindAgenticStores;
  integration: AdapterIntegrationContext;
  isInitialized: boolean;
  initializationTime: Date;
}

// ============================================================================
// SINGLETON IMPLEMENTATION
// ============================================================================

let contextInstance: TaxomindIntegrationContext | null = null;

/**
 * Create lazy-initialized stores using Proxy
 *
 * Instead of creating all 50+ stores eagerly on first context access,
 * each store is created on-demand when first accessed. This reduces
 * the initial memory spike and speeds up cold starts.
 *
 * Batch-created stores (observability, self-evaluation, meta-learning)
 * are initialized as a group when any store from that group is accessed.
 */
function createLazyStores(): TaxomindAgenticStores {
  const cache = new Map<string, unknown>();

  // Lazy batch initializers - create all stores in a group on first access
  let observabilityStores: ReturnType<typeof createPrismaObservabilityStores> | null = null;
  const getObservabilityStores = () => {
    if (!observabilityStores) {
      observabilityStores = createPrismaObservabilityStores({ prisma: db as Parameters<typeof createPrismaObservabilityStores>[0]['prisma'] });
    }
    return observabilityStores;
  };

  let selfEvaluationStores: ReturnType<typeof createPrismaSelfEvaluationStores> | null = null;
  const getSelfEvaluationStores = () => {
    if (!selfEvaluationStores) {
      selfEvaluationStores = createPrismaSelfEvaluationStores({ prisma: db as Parameters<typeof createPrismaSelfEvaluationStores>[0]['prisma'] });
    }
    return selfEvaluationStores;
  };

  let metaLearningStores: ReturnType<typeof createPrismaMetaLearningStores> | null = null;
  const getMetaLearningStores = () => {
    if (!metaLearningStores) {
      metaLearningStores = createPrismaMetaLearningStores({ prisma: db as Parameters<typeof createPrismaMetaLearningStores>[0]['prisma'] });
    }
    return metaLearningStores;
  };

  // Per-store factory map: storeName → factory function
  const storeFactories: Record<string, () => unknown> = {
    // Goal Planning
    goal: () => createPrismaGoalStore(),
    subGoal: () => createPrismaSubGoalStore(),
    plan: () => createPrismaPlanStore(),

    // Proactive Intervention
    behaviorEvent: () => createPrismaBehaviorEventStore(),
    pattern: () => createPrismaPatternStore(),
    intervention: () => createPrismaInterventionStore(),
    checkIn: () => createPrismaCheckInStore(),

    // Tool Registry
    tool: () => createPrismaToolStore(),

    // Analytics
    learningSession: () => createPrismaLearningSessionStore(),
    topicProgress: () => createPrismaTopicProgressStore(),
    learningGap: () => createPrismaLearningGapStore(),
    skillAssessment: () => createPrismaSkillAssessmentStore(),
    recommendation: () => createPrismaRecommendationStore(),
    content: () => createPrismaContentStore(),

    // Memory
    vector: () => createPrismaVectorAdapter(),
    knowledgeGraph: () => createPrismaKnowledgeGraphStore(),
    sessionContext: () => createPrismaSessionContextStore(),

    // Learning Path
    skill: () => createPrismaSkillStore(),
    learningPath: () => createPrismaLearningPathStore(),
    courseGraph: () => createPrismaCourseGraphStore(),

    // Multi-Session
    learningPlan: () => createPrismaLearningPlanStore(),
    tutoringSession: () => createPrismaTutoringSessionStore(),

    // SkillBuildTrack
    skillBuildTrack: () => createPrismaSkillBuildTrackStore(),

    // Observability (batch-created from adapter-prisma)
    toolTelemetry: () => getObservabilityStores().toolTelemetry,
    confidenceCalibration: () => getObservabilityStores().confidenceCalibration,
    memoryQuality: () => getObservabilityStores().memoryQuality,
    planLifecycle: () => getObservabilityStores().planLifecycle,
    metrics: () => getObservabilityStores().metrics,

    // Self-Evaluation (batch-created from adapter-prisma)
    confidenceScore: () => getSelfEvaluationStores().confidenceScore,
    verificationResult: () => getSelfEvaluationStores().verificationResult,
    qualityRecord: () => getSelfEvaluationStores().qualityRecord,
    calibration: () => getSelfEvaluationStores().calibration,
    selfCritique: () => getSelfEvaluationStores().selfCritique,

    // Meta-Learning (batch-created from adapter-prisma)
    learningPattern: () => getMetaLearningStores().learningPattern,
    metaLearningInsight: () => getMetaLearningStores().metaLearningInsight,
    learningStrategy: () => getMetaLearningStores().learningStrategy,
    learningEvent: () => getMetaLearningStores().learningEvent,

    // Journey Timeline (from adapter-prisma)
    journeyTimeline: () => createPrismaJourneyTimelineStore({ prisma: db as Parameters<typeof createPrismaJourneyTimelineStore>[0]['prisma'] }),

    // Presence (realtime user tracking)
    presence: () => createPrismaPresenceStore({ prisma: db as Parameters<typeof createPrismaPresenceStore>[0]['prisma'] }),

    // Student Profile (mastery tracking)
    studentProfile: () => createPrismaStudentProfileStore({ prisma: db as Parameters<typeof createPrismaStudentProfileStore>[0]['prisma'] }),

    // Review Schedule (spaced repetition)
    reviewSchedule: () => createPrismaReviewScheduleStore({ prisma: db as Parameters<typeof createPrismaReviewScheduleStore>[0]['prisma'] }),

    // Push Queue (persistent push notification queue)
    pushQueue: () => createPrismaPushQueueStore({ prisma: db as unknown as Parameters<typeof createPrismaPushQueueStore>[0]['prisma'] }),

    // Phase 6: Educational Engine Stores
    microlearning: () => createPrismaMicrolearningStore(),
    metacognition: () => createPrismaMetacognitionStore(),
    competency: () => createPrismaCompetencyStore(),
    peerLearning: () => createPrismaPeerLearningStore(),
    integrity: () => createPrismaIntegrityStore(),
    multimodal: () => createPrismaMultimodalStore(),

    // Phase 7: 10,000 Hour Practice Tracking Stores
    practiceSession: () => createPrismaPracticeSessionStore(),
    skillMastery10K: () => createPrismaSkillMastery10KStore(),
    practiceLeaderboard: () => createPrismaPracticeLeaderboardStore(),
    dailyPracticeLog: () => createPrismaDailyPracticeLogStore(),

    // Practice Challenge Store
    practiceChallenge: () => createPrismaPracticeChallengeStore(),

    // Practice Goal Store
    practiceGoal: () => createPrismaPracticeGoalStore(),

    // Spaced Repetition Store (SM-2 Algorithm)
    spacedRepetition: () => createPrismaSpacedRepetitionStore(),

    // Memory Lifecycle: Reindex Job Store
    reindexJob: () => createPrismaReindexJobStore(),

    // Context Gathering
    contextSnapshot: () => createPrismaContextSnapshotStore(),
  };

  logger.info('[TaxomindContext] Lazy store proxy created', {
    registeredStores: Object.keys(storeFactories).length,
  });

  // Return a Proxy that creates stores on first access
  return new Proxy({} as TaxomindAgenticStores, {
    get(_target, prop: string) {
      if (cache.has(prop)) {
        return cache.get(prop);
      }

      const factory = storeFactories[prop];
      if (!factory) {
        return undefined;
      }

      logger.debug(`[TaxomindContext] Lazy-initializing store: ${prop}`);
      const store = factory();
      cache.set(prop, store);
      return store;
    },
    ownKeys() {
      return Object.keys(storeFactories);
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      if (prop in storeFactories) {
        return { configurable: true, enumerable: true, writable: false };
      }
      return undefined;
    },
  });
}

function initializeIntegrationContext(): AdapterIntegrationContext {
  try {
    return getTaxomindIntegration();
  } catch (error) {
    logger.info('[TaxomindContext] Bootstrapping adapter integration context');
  }

  // During build phase, API keys may not be available. Pass undefined to avoid
  // eager client initialization that throws errors.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.SKIP_ENV_VALIDATION === 'true';

  const openaiApiKey = isBuildPhase ? undefined : process.env.OPENAI_API_KEY;
  const anthropicApiKey = isBuildPhase ? undefined : process.env.ANTHROPIC_API_KEY;

  const integration = bootstrapTaxomindIntegration({
    prisma: db as unknown as Parameters<typeof bootstrapTaxomindIntegration>[0]['prisma'],
    isDevelopment: process.env.NODE_ENV !== 'production',
    region: process.env.SAM_REGION,
    anthropicApiKey,
    openaiApiKey,
  });

  logger.info('[TaxomindContext] Adapter integration initialized', {
    profileId: integration.profile.id,
    profileVersion: integration.profile.version,
    isBuildPhase,
  });

  return integration;
}

/**
 * Get the Taxomind Integration Context singleton
 *
 * This is the RECOMMENDED way to access all SAM stores.
 * Use this instead of directly importing store factories.
 *
 * @returns The initialized TaxomindIntegrationContext
 */
export function getTaxomindContext(): TaxomindIntegrationContext {
  if (!contextInstance) {
    logger.info('[TaxomindContext] Creating new context instance...');

    contextInstance = {
      stores: createLazyStores(),
      integration: initializeIntegrationContext(),
      isInitialized: true,
      initializationTime: new Date(),
    };

    logger.info('[TaxomindContext] Context created successfully', {
      initializationTime: contextInstance.initializationTime.toISOString(),
    });
  }

  return contextInstance;
}

/**
 * Reset the context singleton (useful for testing)
 */
export function resetTaxomindContext(): void {
  logger.info('[TaxomindContext] Resetting context instance');
  contextInstance = null;
}

/**
 * Check if the context has been initialized
 */
export function isTaxomindContextInitialized(): boolean {
  return contextInstance !== null && contextInstance.isInitialized;
}

/**
 * Gracefully shutdown the Taxomind context.
 * Clears all cached stores, releases resources, and logs the shutdown event.
 * Registered as a SIGTERM handler for Railway graceful shutdown.
 */
export function shutdownTaxomindContext(): void {
  if (!contextInstance) {
    logger.info('[TaxomindContext] No context to shut down');
    return;
  }

  logger.info('[TaxomindContext] Shutting down context...');

  // Reset the singleton — the lazy Proxy's internal Map is released
  contextInstance = null;

  logger.info('[TaxomindContext] Context shutdown complete');
}

/**
 * Pre-initialize specified stores during server startup to reduce first-request latency.
 * Call this in your instrumentation or server startup hook.
 *
 * @param storeNames - Names of stores to eagerly initialize
 */
export function warmupTaxomindContext(storeNames: Array<keyof TaxomindAgenticStores>): void {
  const ctx = getTaxomindContext();
  const warmedUp: string[] = [];

  for (const name of storeNames) {
    try {
      // Accessing the store through the Proxy triggers lazy creation
      const store = ctx.stores[name];
      if (store) {
        warmedUp.push(name);
      }
    } catch (error) {
      logger.warn(`[TaxomindContext] Failed to warm up store '${name}'`, { error });
    }
  }

  logger.info('[TaxomindContext] Warmup complete', {
    requested: storeNames.length,
    warmedUp: warmedUp.length,
    stores: warmedUp,
  });
}

// Register SIGTERM handler for graceful shutdown (Railway deploys send SIGTERM)
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGTERM', () => {
    logger.info('[TaxomindContext] SIGTERM received, initiating graceful shutdown');
    shutdownTaxomindContext();
  });
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export function getIntegrationContext(): AdapterIntegrationContext {
  return getTaxomindContext().integration;
}

export function getAdapterFactory(): AdapterIntegrationContext['factory'] {
  return getTaxomindContext().integration.factory;
}

export function getIntegrationProfile(): AdapterIntegrationContext['profile'] {
  return getTaxomindContext().integration.profile;
}

export function getCapabilityRegistry(): AdapterIntegrationContext['registry'] {
  return getTaxomindContext().integration.registry;
}

/**
 * Get a specific store from the context
 */
export function getStore<K extends keyof TaxomindAgenticStores>(
  storeName: K
): TaxomindAgenticStores[K] {
  return getTaxomindContext().stores[storeName];
}

/**
 * Get all proactive intervention stores
 */
export function getProactiveStores(): {
  behaviorEvent: BehaviorEventStore;
  pattern: PatternStore;
  intervention: InterventionStore;
  checkIn: CheckInStore;
} {
  const { stores } = getTaxomindContext();
  return {
    behaviorEvent: stores.behaviorEvent,
    pattern: stores.pattern,
    intervention: stores.intervention,
    checkIn: stores.checkIn,
  };
}

/**
 * Get all goal-related stores
 */
export function getGoalStores(): {
  goal: PrismaGoalStore;
  subGoal: PrismaSubGoalStore;
  plan: PrismaPlanStore;
} {
  const { stores } = getTaxomindContext();
  return {
    goal: stores.goal,
    subGoal: stores.subGoal,
    plan: stores.plan,
  };
}

/**
 * Get all memory-related stores
 */
export function getMemoryStores(): {
  vector: PrismaVectorAdapter;
  knowledgeGraph: PrismaKnowledgeGraphStore;
  sessionContext: PrismaSessionContextStore;
} {
  const { stores } = getTaxomindContext();
  return {
    vector: stores.vector,
    knowledgeGraph: stores.knowledgeGraph,
    sessionContext: stores.sessionContext,
  };
}

/**
 * Get all learning path stores
 */
export function getLearningPathStores(): {
  skill: PrismaSkillStore;
  learningPath: PrismaLearningPathStore;
  courseGraph: PrismaCourseGraphStore;
} {
  const { stores } = getTaxomindContext();
  return {
    skill: stores.skill,
    learningPath: stores.learningPath,
    courseGraph: stores.courseGraph,
  };
}

/**
 * Get all observability stores (telemetry, calibration, quality metrics)
 */
export function getObservabilityStores(): {
  toolTelemetry: PrismaToolTelemetryStore;
  confidenceCalibration: PrismaConfidenceCalibrationStore;
  memoryQuality: PrismaMemoryQualityStore;
  planLifecycle: PrismaPlanLifecycleStore;
  metrics: PrismaMetricsStore;
} {
  const { stores } = getTaxomindContext();
  return {
    toolTelemetry: stores.toolTelemetry,
    confidenceCalibration: stores.confidenceCalibration,
    memoryQuality: stores.memoryQuality,
    planLifecycle: stores.planLifecycle,
    metrics: stores.metrics,
  };
}

/**
 * Get all analytics stores
 */
export function getAnalyticsStores(): {
  learningSession: PrismaLearningSessionStore;
  topicProgress: PrismaTopicProgressStore;
  learningGap: PrismaLearningGapStore;
  skillAssessment: PrismaSkillAssessmentStore;
  recommendation: PrismaRecommendationStore;
  content: PrismaContentStore;
} {
  const { stores } = getTaxomindContext();
  return {
    learningSession: stores.learningSession,
    topicProgress: stores.topicProgress,
    learningGap: stores.learningGap,
    skillAssessment: stores.skillAssessment,
    recommendation: stores.recommendation,
    content: stores.content,
  };
}

/**
 * Get all multi-session stores
 */
export function getMultiSessionStores(): {
  learningPlan: PrismaLearningPlanStore;
  tutoringSession: PrismaTutoringSessionStore;
  skillBuildTrack: PrismaSkillBuildTrackStore;
} {
  const { stores } = getTaxomindContext();
  return {
    learningPlan: stores.learningPlan,
    tutoringSession: stores.tutoringSession,
    skillBuildTrack: stores.skillBuildTrack,
  };
}

/**
 * Get presence store for realtime user tracking
 */
export function getPresenceStore(): PrismaPresenceStore {
  return getTaxomindContext().stores.presence;
}

/**
 * Get student profile store for mastery tracking
 */
export function getStudentProfileStore(): PrismaStudentProfileStore {
  return getTaxomindContext().stores.studentProfile;
}

/**
 * Get review schedule store for spaced repetition
 */
export function getReviewScheduleStore(): PrismaReviewScheduleStore {
  return getTaxomindContext().stores.reviewSchedule;
}

/**
 * Get push queue store for persistent push notifications
 */
export function getPushQueueStore(): PrismaPushQueueStore {
  return getTaxomindContext().stores.pushQueue;
}

/**
 * Get all educational engine stores (Phase 6)
 */
export function getEducationalEngineStores(): {
  microlearning: PrismaMicrolearningStore;
  metacognition: PrismaMetacognitionStore;
  competency: PrismaCompetencyStore;
  peerLearning: PrismaPeerLearningStore;
  integrity: PrismaIntegrityStore;
  multimodal: PrismaMultimodalStore;
} {
  const { stores } = getTaxomindContext();
  return {
    microlearning: stores.microlearning,
    metacognition: stores.metacognition,
    competency: stores.competency,
    peerLearning: stores.peerLearning,
    integrity: stores.integrity,
    multimodal: stores.multimodal,
  };
}

/**
 * Get all practice tracking stores (Phase 7: 10,000 Hour Practice)
 */
export function getPracticeStores(): {
  practiceSession: PrismaPracticeSessionStore;
  skillMastery10K: PrismaSkillMastery10KStore;
  practiceLeaderboard: PrismaPracticeLeaderboardStore;
  dailyPracticeLog: PrismaDailyPracticeLogStore;
  practiceChallenge: PrismaPracticeChallengeStore;
  practiceGoal: PrismaPracticeGoalStore;
  spacedRepetition: PrismaSpacedRepetitionStore;
} {
  const { stores } = getTaxomindContext();
  return {
    practiceSession: stores.practiceSession,
    skillMastery10K: stores.skillMastery10K,
    practiceLeaderboard: stores.practiceLeaderboard,
    dailyPracticeLog: stores.dailyPracticeLog,
    practiceChallenge: stores.practiceChallenge,
    practiceGoal: stores.practiceGoal,
    spacedRepetition: stores.spacedRepetition,
  };
}

/**
 * Get spaced repetition store for SM-2 review scheduling
 */
export function getSpacedRepetitionStore(): PrismaSpacedRepetitionStore {
  return getTaxomindContext().stores.spacedRepetition;
}

/**
 * Get reindex job store for memory lifecycle management
 */
export function getReindexJobStore(): PrismaReindexJobStore {
  return getTaxomindContext().stores.reindexJob;
}

// Re-export store types for external use
export type {
  // From @sam-ai/agentic (interface types)
  BehaviorEventStore,
  PatternStore,
  InterventionStore,
  CheckInStore,
  PresenceStore,
  // From local stores (class types)
  PrismaGoalStore,
  PrismaSubGoalStore,
  PrismaPlanStore,
  PrismaToolStore,
  PrismaLearningSessionStore,
  PrismaTopicProgressStore,
  PrismaLearningGapStore,
  PrismaSkillAssessmentStore,
  PrismaRecommendationStore,
  PrismaContentStore,
  PrismaVectorAdapter,
  PrismaKnowledgeGraphStore,
  PrismaSessionContextStore,
  PrismaSkillStore,
  PrismaLearningPathStore,
  PrismaCourseGraphStore,
  PrismaLearningPlanStore,
  PrismaTutoringSessionStore,
  PrismaSkillBuildTrackStore,
  // From @sam-ai/adapter-prisma (observability, presence, profile, review, push queue)
  PrismaToolTelemetryStore,
  PrismaConfidenceCalibrationStore,
  PrismaMemoryQualityStore,
  PrismaPlanLifecycleStore,
  PrismaMetricsStore,
  PrismaPresenceStore,
  PrismaStudentProfileStore,
  PrismaReviewScheduleStore,
  PrismaPushQueueStore,
  // Phase 6: Educational Engine Store Types
  PrismaMicrolearningStore,
  PrismaMetacognitionStore,
  PrismaCompetencyStore,
  PrismaPeerLearningStore,
  PrismaIntegrityStore,
  PrismaMultimodalStore,
  // Phase 7: 10,000 Hour Practice Tracking Store Types
  PrismaPracticeSessionStore,
  PrismaSkillMastery10KStore,
  PrismaPracticeLeaderboardStore,
  PrismaDailyPracticeLogStore,
  // Practice Challenge Store Type
  PrismaPracticeChallengeStore,
  // Practice Goal Store Type
  PrismaPracticeGoalStore,
  // Spaced Repetition Store Type
  PrismaSpacedRepetitionStore,
  // Memory Lifecycle: Reindex Job Store Type
  PrismaReindexJobStore,
};
