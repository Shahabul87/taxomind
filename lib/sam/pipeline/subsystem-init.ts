/**
 * Shared subsystem initialization for SAM unified and stream routes.
 *
 * Owns the singleton orchestrator, quality gates, pedagogy pipeline,
 * memory tracking, tutoring orchestration, and proactive interventions.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

import {
  SAMAgentOrchestrator,
  createSAMConfig,
  createMemoryCache,
  createContextEngine,
  createContentEngine,
  createPersonalizationEngine,
  createAssessmentEngine,
  createResponseEngine,
  type SAMConfig,
} from '@sam-ai/core';

import { getCoreAIAdapter } from '@/lib/sam/integration-adapters';
import { createUnifiedBloomsAdapterEngine } from '@sam-ai/educational';
import { createPrismaSAMAdapter } from '@sam-ai/adapter-prisma';

import {
  createQualityGatePipeline,
  type ContentQualityGatePipeline,
} from '@sam-ai/quality';

import {
  createPedagogicalPipeline,
  type PedagogicalPipeline,
} from '@sam-ai/pedagogy';

import {
  createSpacedRepetitionScheduler,
  createMasteryTracker,
  type SpacedRepetitionScheduler,
  type MasteryTracker,
} from '@sam-ai/memory';

import {
  initializeOrchestration,
  type OrchestrationSubsystems,
} from '@/lib/sam/orchestration-integration';

import {
  initializeProactiveInterventions,
  type ProactiveInterventionSubsystems,
} from '@/lib/sam/proactive-intervention-integration';

import {
  getTaxomindContext,
  getGoalStores,
  getStore,
  getStudentProfileStore,
  getReviewScheduleStore,
} from '@/lib/sam/taxomind-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubsystemBundle {
  orchestrator: SAMAgentOrchestrator;
  config: SAMConfig;
  quality: ContentQualityGatePipeline;
  pedagogy: PedagogicalPipeline;
  mastery: MasteryTracker;
  spacedRep: SpacedRepetitionScheduler;
  tutoring: OrchestrationSubsystems | null;
  proactive: ProactiveInterventionSubsystems | null;
  /** True when AI adapter initialization failed (degraded mode) */
  degradedMode?: boolean;
}

// ---------------------------------------------------------------------------
// Singleton state
// ---------------------------------------------------------------------------

let bundle: SubsystemBundle | null = null;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize (or return cached) the full SAM subsystem bundle.
 *
 * Both the unified route and stream route call this function.
 * The result is cached as a module-level singleton so each
 * subsystem is created at most once per process.
 */
export async function initializeSubsystems(): Promise<SubsystemBundle> {
  if (bundle) {
    return bundle;
  }

  // 1. AI adapter — 3-tier fallback (Anthropic → OpenAI → DeepSeek) with circuit breaker
  const aiAdapter = await getCoreAIAdapter();
  if (!aiAdapter) {
    throw new Error('No AI adapter available (all providers failed)');
  }

  // 2. Cache + database adapters
  const cacheAdapter = createMemoryCache({ maxSize: 1000, defaultTTL: 300 });
  const databaseAdapter = createPrismaSAMAdapter({ prisma: db });

  // 3. SAM configuration
  const samConfig = createSAMConfig({
    ai: aiAdapter,
    cache: cacheAdapter,
    database: databaseAdapter,
    logger: {
      debug: (msg, ...args) => logger.debug(msg, ...args),
      info: (msg, ...args) => logger.info(msg, ...args),
      warn: (msg, ...args) => logger.warn(msg, ...args),
      error: (msg, ...args) => logger.error(msg, ...args),
    },
    features: {
      gamification: false,
      formSync: true,
      autoContext: true,
      emotionDetection: true,
      learningStyleDetection: true,
      streaming: true,
      analytics: true,
    },
    model: {
      name: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      maxTokens: 4096,
    },
    engine: {
      timeout: 30000,
      retries: 2,
      concurrency: 3,
      cacheEnabled: true,
      cacheTTL: 300,
    },
    maxConversationHistory: 20,
    personality: {
      name: 'SAM',
      greeting: 'Hello! I&apos;m SAM, your intelligent learning assistant.',
      tone: 'friendly and professional',
    },
  });

  // 4. Orchestrator + engines
  const orchestrator = new SAMAgentOrchestrator(samConfig);
  orchestrator.registerEngine(createContextEngine(samConfig));
  orchestrator.registerEngine(createContentEngine(samConfig));
  orchestrator.registerEngine(createPersonalizationEngine(samConfig));
  orchestrator.registerEngine(createAssessmentEngine(samConfig));
  orchestrator.registerEngine(createResponseEngine(samConfig));
  orchestrator.registerEngine(
    createUnifiedBloomsAdapterEngine({
      samConfig,
      database: databaseAdapter,
      defaultMode: 'standard',
      confidenceThreshold: 0.7,
      enableCache: true,
      cacheTTL: 3600,
    }),
  );

  // 5. Quality Gates
  const qualityPipeline = createQualityGatePipeline({
    threshold: 70,
    parallel: true,
    enableEnhancement: true,
    maxIterations: 2,
    timeoutMs: 30000,
  });

  // 6. Pedagogy Pipeline
  const pedagogyPipeline = createPedagogicalPipeline({});

  // 7. Memory Tracking (centralized stores from TaxomindContext)
  const profileStore = getStudentProfileStore();
  const reviewStore = getReviewScheduleStore();
  const masteryTracker = createMasteryTracker(
    profileStore as unknown as Parameters<typeof createMasteryTracker>[0],
  );
  const spacedRepScheduler = createSpacedRepetitionScheduler(
    reviewStore as unknown as Parameters<typeof createSpacedRepetitionScheduler>[0],
  );

  // 8. Tutoring Orchestration
  let tutoringOrchestration: OrchestrationSubsystems | null = null;
  try {
    const goalStores = getGoalStores();
    const toolStore = getStore('tool');

    tutoringOrchestration = initializeOrchestration({
      goalStore: goalStores.goal,
      planStore: goalStores.plan,
      toolStore,
    });

    logger.info('[SUBSYSTEM_INIT] Tutoring orchestration initialized');
  } catch (error) {
    logger.warn('[SUBSYSTEM_INIT] Failed to initialize tutoring orchestration:', error);
  }

  // 9. Proactive Interventions
  let proactiveSubsystems: ProactiveInterventionSubsystems | null = null;
  try {
    proactiveSubsystems = initializeProactiveInterventions({
      patternDetectionThreshold: 3,
      churnPredictionWindow: 14,
      frustrationThreshold: 0.7,
      checkInExpirationHours: 24,
    });

    logger.info('[SUBSYSTEM_INIT] Proactive intervention subsystems initialized');
  } catch (error) {
    logger.warn('[SUBSYSTEM_INIT] Failed to initialize proactive interventions:', error);
  }

  logger.info('[SUBSYSTEM_INIT] All subsystems initialized:', {
    engines: ['context', 'blooms', 'content', 'personalization', 'assessment', 'response'],
    qualityGates: true,
    pedagogyPipeline: true,
    memoryTracking: true,
    tutoringOrchestration: !!tutoringOrchestration,
    proactiveInterventions: !!proactiveSubsystems,
  });

  bundle = {
    orchestrator,
    config: samConfig,
    quality: qualityPipeline,
    pedagogy: pedagogyPipeline,
    mastery: masteryTracker,
    spacedRep: spacedRepScheduler,
    tutoring: tutoringOrchestration,
    proactive: proactiveSubsystems,
  };

  return bundle;
}

/**
 * Backward-compatible helper — returns just the orchestrator.
 */
export async function getOrchestrator(): Promise<SAMAgentOrchestrator> {
  return (await initializeSubsystems()).orchestrator;
}
