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

import { getSAMAdapter, getSAMAdapterSystem } from '@/lib/sam/ai-provider';
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

import { getAllModes } from '@/lib/sam/modes/registry';

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
// Engine Validation
// ---------------------------------------------------------------------------

/**
 * Cross-reference mode-referenced engine names against engines registered in
 * the orchestrator. Logs warnings for any engine names used in mode presets
 * that have no corresponding registration.
 *
 * In development, throws to surface configuration errors early.
 * In production, only warns to avoid crashing on non-critical mismatches.
 */
function validateModeEngines(orchestrator: SAMAgentOrchestrator): void {
  const registeredEngines = new Set(orchestrator.getRegisteredEngines());
  const modes = getAllModes();
  const missingEngines = new Map<string, string[]>();

  for (const mode of modes) {
    for (const engineName of mode.enginePreset) {
      if (!registeredEngines.has(engineName)) {
        const modesForEngine = missingEngines.get(engineName) ?? [];
        modesForEngine.push(mode.id);
        missingEngines.set(engineName, modesForEngine);
      }
    }
  }

  if (missingEngines.size === 0) {
    logger.info('[SUBSYSTEM_INIT] Engine validation passed: all mode-referenced engines are registered');
    return;
  }

  const summary: Record<string, string[]> = {};
  for (const [engine, modeIds] of missingEngines) {
    summary[engine] = modeIds;
  }

  if (process.env.NODE_ENV === 'development') {
    logger.error('[SUBSYSTEM_INIT] Engine validation FAILED — mode presets reference unregistered engines:', summary);
    // In development, throw so the developer sees it immediately
    throw new Error(
      `SAM engine validation failed: engines [${Array.from(missingEngines.keys()).join(', ')}] ` +
      `referenced in mode presets but not registered. Register these engines or update mode presets.`
    );
  }

  logger.warn('[SUBSYSTEM_INIT] Engine validation warning — some mode-referenced engines are not registered:', summary);
}

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
export async function initializeSubsystems(userId?: string): Promise<SubsystemBundle> {
  if (bundle) {
    return bundle;
  }

  // 1. AI adapter — user-scoped when userId available, otherwise system-level fallback
  const aiAdapter = userId
    ? await getSAMAdapter({ userId, capability: 'chat' })
    : await getSAMAdapterSystem();
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
      greeting: "Hello! I'm SAM, your intelligent learning assistant.",
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

  // Validate mode-referenced engines against registered engines
  validateModeEngines(orchestrator);

  logger.info('[SUBSYSTEM_INIT] All subsystems initialized:', {
    engines: orchestrator.getRegisteredEngines(),
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
export async function getOrchestrator(userId?: string): Promise<SAMAgentOrchestrator> {
  return (await initializeSubsystems(userId)).orchestrator;
}
