/**
 * Shared subsystem initialization for SAM unified and stream routes.
 *
 * Owns the singleton orchestrator, quality gates, pedagogy pipeline,
 * memory tracking, tutoring orchestration, and proactive interventions.
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { createSAMLogger } from '@/lib/adapters/sam-config-factory';

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
  getGoalStores,
  getStore,
  getStudentProfileStore,
  getReviewScheduleStore,
} from '@/lib/sam/taxomind-context';

import { getAllModes } from '@/lib/sam/modes/registry';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shared subsystems that have NO user dependency — safe to cache as singleton. */
export interface SharedSubsystems {
  orchestrator: SAMAgentOrchestrator;
  quality: ContentQualityGatePipeline;
  pedagogy: PedagogicalPipeline;
  mastery: MasteryTracker;
  spacedRep: SpacedRepetitionScheduler;
  tutoring: OrchestrationSubsystems | null;
  proactive: ProactiveInterventionSubsystems | null;
}

/** Full bundle with per-request user-scoped AI adapter and SAMConfig. */
export interface SubsystemBundle extends SharedSubsystems {
  config: SAMConfig;
  /** True when AI adapter initialization failed (degraded mode) */
  degradedMode?: boolean;
}

// ---------------------------------------------------------------------------
// Singleton state (shared subsystems only — NO user-scoped data)
// ---------------------------------------------------------------------------

let sharedSubsystems: SharedSubsystems | null = null;

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
 * Initialize (or return cached) the shared subsystems.
 *
 * These subsystems have NO user dependency and are safe to cache
 * as a module-level singleton. The AI adapter and SAMConfig are
 * NOT included — those are created per-request via `createRequestBundle()`.
 */
async function initializeSharedSubsystems(): Promise<SharedSubsystems> {
  if (sharedSubsystems) {
    return sharedSubsystems;
  }

  // We need a temporary system-level adapter to build the initial SAMConfig
  // for engine registration. Engines don't call AI directly during init,
  // so the adapter identity doesn't matter here.
  const systemAdapter = await getSAMAdapterSystem();
  if (!systemAdapter) {
    throw new Error('No AI adapter available for subsystem initialization (all providers failed)');
  }

  // Cache + database adapters
  const cacheAdapter = createMemoryCache({ maxSize: 1000, defaultTTL: 300 });
  const databaseAdapter = createPrismaSAMAdapter({ prisma: db });

  // Temporary SAMConfig for engine registration only
  const initConfig = createSAMConfig({
    ai: systemAdapter,
    cache: cacheAdapter,
    database: databaseAdapter,
    logger: createSAMLogger(),
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
      name: systemAdapter.getModel(),
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

  // Orchestrator + engines
  const orchestrator = new SAMAgentOrchestrator(initConfig);
  orchestrator.registerEngine(createContextEngine(initConfig));
  orchestrator.registerEngine(createContentEngine(initConfig));
  orchestrator.registerEngine(createPersonalizationEngine(initConfig));
  orchestrator.registerEngine(createAssessmentEngine(initConfig));
  orchestrator.registerEngine(createResponseEngine(initConfig));
  orchestrator.registerEngine(
    createUnifiedBloomsAdapterEngine({
      samConfig: initConfig,
      database: databaseAdapter,
      defaultMode: 'standard',
      confidenceThreshold: 0.7,
      enableCache: true,
      cacheTTL: 3600,
    }),
  );

  // Quality Gates
  const qualityPipeline = createQualityGatePipeline({
    threshold: 70,
    parallel: true,
    enableEnhancement: true,
    maxIterations: 2,
    timeoutMs: 30000,
  });

  // Pedagogy Pipeline
  const pedagogyPipeline = createPedagogicalPipeline({});

  // Memory Tracking (centralized stores from TaxomindContext)
  const profileStore = getStudentProfileStore();
  const reviewStore = getReviewScheduleStore();
  const masteryTracker = createMasteryTracker(
    profileStore as unknown as Parameters<typeof createMasteryTracker>[0],
  );
  const spacedRepScheduler = createSpacedRepetitionScheduler(
    reviewStore as unknown as Parameters<typeof createSpacedRepetitionScheduler>[0],
  );

  // Tutoring Orchestration
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

  // Proactive Interventions
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

  logger.info('[SUBSYSTEM_INIT] Shared subsystems initialized:', {
    engines: orchestrator.getRegisteredEngines(),
    qualityGates: true,
    pedagogyPipeline: true,
    memoryTracking: true,
    tutoringOrchestration: !!tutoringOrchestration,
    proactiveInterventions: !!proactiveSubsystems,
  });

  sharedSubsystems = {
    orchestrator,
    quality: qualityPipeline,
    pedagogy: pedagogyPipeline,
    mastery: masteryTracker,
    spacedRep: spacedRepScheduler,
    tutoring: tutoringOrchestration,
    proactive: proactiveSubsystems,
  };

  return sharedSubsystems;
}

/**
 * Create a per-request SubsystemBundle with a fresh user-scoped AI adapter.
 *
 * Shared subsystems are cached (singleton). The AI adapter and SAMConfig
 * are created fresh per request to prevent cross-user adapter leakage.
 *
 * @param userId - The requesting user's ID (required for user-scoped adapter)
 */
export async function initializeSubsystems(userId?: string): Promise<SubsystemBundle> {
  const shared = await initializeSharedSubsystems();

  // Create a fresh user-scoped AI adapter for this request
  let aiAdapter;
  let degradedMode = false;

  try {
    aiAdapter = userId
      ? await getSAMAdapter({ userId, capability: 'chat' })
      : await getSAMAdapterSystem();
  } catch (error) {
    logger.warn('[SUBSYSTEM_INIT] AI adapter creation failed, using system fallback:', error);
    aiAdapter = await getSAMAdapterSystem();
  }

  if (!aiAdapter) {
    throw new Error('No AI adapter available (all providers failed)');
  }

  // Build a fresh SAMConfig with the user-scoped adapter
  const cacheAdapter = createMemoryCache({ maxSize: 1000, defaultTTL: 300 });
  const databaseAdapter = createPrismaSAMAdapter({ prisma: db });

  const samConfig = createSAMConfig({
    ai: aiAdapter,
    cache: cacheAdapter,
    database: databaseAdapter,
    logger: createSAMLogger(),
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
      name: aiAdapter.getModel(),
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

  return {
    ...shared,
    config: samConfig,
    degradedMode,
  };
}

/**
 * Backward-compatible helper — returns the shared orchestrator.
 * Does NOT require userId since the orchestrator is user-independent.
 */
export async function getOrchestrator(): Promise<SAMAgentOrchestrator> {
  const shared = await initializeSharedSubsystems();
  return shared.orchestrator;
}
