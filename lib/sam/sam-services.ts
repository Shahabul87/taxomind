/**
 * SAM Services - Consolidated Service Singleton
 *
 * This module consolidates all 11+ separate singletons into a single,
 * well-managed service container with:
 * - Promise-based initialization locking (prevents race conditions)
 * - Lazy initialization (services created on first access)
 * - Proper cleanup methods
 * - Health checking capabilities
 * - Unified error handling
 *
 * ARCHITECTURE: This is the SINGLE ENTRY POINT for all SAM services.
 * Import from here instead of individual service files.
 *
 * Usage:
 *   import { samServices } from '@/lib/sam/sam-services';
 *   const tooling = await samServices.getTooling();
 *   const memory = await samServices.getMemory();
 */

import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// TYPE IMPORTS (from individual service modules)
// ============================================================================

import type { MemorySystem } from '@sam-ai/agentic';
import type {
  ToolRegistry,
  ToolExecutor,
  PermissionManager,
  ConfirmationManager,
  AuditLogger as ToolAuditLogger,
  BehaviorMonitor,
  CheckInScheduler,
  MultiSessionPlanTracker,
  ConfidenceScorer,
  QualityTracker,
  TutoringLoopController,
  PlanContextInjector,
  ActiveStepExecutor,
  ConfirmationGate,
  MemoryLifecycleManager,
  BackgroundWorker,
  MemoryNormalizer,
  KGRefreshScheduler,
} from '@sam-ai/agentic';

import type { AIAdapter } from '@sam-ai/core';

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface ToolingServices {
  toolRegistry: ToolRegistry;
  toolExecutor: ToolExecutor;
  permissionManager: PermissionManager;
  confirmationManager: ConfirmationManager;
  auditLogger: ToolAuditLogger;
}

export interface ProactiveServices {
  behaviorMonitor: BehaviorMonitor;
  checkInScheduler: CheckInScheduler;
  planTracker: MultiSessionPlanTracker;
}

export interface SelfEvaluationServices {
  confidenceScorer: ConfidenceScorer;
  qualityTracker: QualityTracker;
}

export interface OrchestrationServices {
  tutoringController: TutoringLoopController;
  contextInjector: PlanContextInjector;
  stepExecutor: ActiveStepExecutor;
  confirmationGate: ConfirmationGate;
}

export interface MemoryLifecycleServices {
  lifecycleManager: MemoryLifecycleManager;
  backgroundWorker: BackgroundWorker;
  memoryNormalizer: MemoryNormalizer;
  kgRefreshScheduler: KGRefreshScheduler;
}

export interface SAMServicesHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    tooling: ServiceHealth;
    memory: ServiceHealth;
    proactive: ServiceHealth;
    orchestration: ServiceHealth;
    memoryLifecycle: ServiceHealth;
    aiAdapter: ServiceHealth;
  };
  timestamp: Date;
}

export interface ServiceHealth {
  initialized: boolean;
  healthy: boolean;
  error?: string;
  latencyMs?: number;
}

// ============================================================================
// SAM SERVICES CLASS
// ============================================================================

class SAMServices {
  // Service instances (lazily initialized)
  private _tooling: ToolingServices | null = null;
  private _memory: MemorySystem | null = null;
  private _proactive: ProactiveServices | null = null;
  private _selfEvaluation: SelfEvaluationServices | null = null;
  private _orchestration: OrchestrationServices | null = null;
  private _memoryLifecycle: MemoryLifecycleServices | null = null;

  // Promise locks for thread-safe initialization
  private _toolingPromise: Promise<ToolingServices> | null = null;
  private _memoryPromise: Promise<MemorySystem> | null = null;
  private _proactivePromise: Promise<ProactiveServices> | null = null;
  private _selfEvaluationPromise: Promise<SelfEvaluationServices> | null = null;
  private _orchestrationPromise: Promise<OrchestrationServices> | null = null;
  private _memoryLifecyclePromise: Promise<MemoryLifecycleServices> | null = null;

  // Initialization state
  private _isPreWarmed = false;

  // ============================================================================
  // TOOLING SERVICES
  // ============================================================================

  /**
   * Get the tooling services (tool registry, executor, permissions, etc.)
   * Thread-safe: Uses Promise-based locking to prevent race conditions
   */
  async getTooling(): Promise<ToolingServices> {
    if (this._tooling) {
      return this._tooling;
    }

    if (this._toolingPromise) {
      return this._toolingPromise;
    }

    this._toolingPromise = this._initializeTooling();
    this._tooling = await this._toolingPromise;
    return this._tooling;
  }

  private async _initializeTooling(): Promise<ToolingServices> {
    const startTime = Date.now();
    logger.info('[SAMServices] Initializing tooling services...');

    try {
      // Dynamic import to avoid circular dependencies
      const { getToolingSystem } = await import('./agentic-tooling');
      const tooling = await getToolingSystem();

      if (!tooling) {
        throw new Error('Failed to initialize tooling system');
      }

      logger.info('[SAMServices] Tooling services initialized', {
        latencyMs: Date.now() - startTime,
      });

      return tooling;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SAMServices] Failed to initialize tooling', { error: message });
      throw new Error(`Tooling initialization failed: ${message}`);
    }
  }

  // ============================================================================
  // MEMORY SERVICES
  // ============================================================================

  /**
   * Get the memory system (vector store, knowledge graph, session context)
   */
  async getMemory(): Promise<MemorySystem> {
    if (this._memory) {
      return this._memory;
    }

    if (this._memoryPromise) {
      return this._memoryPromise;
    }

    this._memoryPromise = this._initializeMemory();
    this._memory = await this._memoryPromise;
    return this._memory;
  }

  private async _initializeMemory(): Promise<MemorySystem> {
    const startTime = Date.now();
    logger.info('[SAMServices] Initializing memory system...');

    try {
      const { getAgenticMemorySystem } = await import('./agentic-memory');
      const memory = await getAgenticMemorySystem();

      logger.info('[SAMServices] Memory system initialized', {
        latencyMs: Date.now() - startTime,
      });

      return memory;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SAMServices] Failed to initialize memory', { error: message });
      throw new Error(`Memory initialization failed: ${message}`);
    }
  }

  // ============================================================================
  // PROACTIVE SERVICES
  // ============================================================================

  /**
   * Get proactive intervention services (behavior monitor, check-in scheduler, etc.)
   */
  async getProactive(): Promise<ProactiveServices> {
    if (this._proactive) {
      return this._proactive;
    }

    if (this._proactivePromise) {
      return this._proactivePromise;
    }

    this._proactivePromise = this._initializeProactive();
    this._proactive = await this._proactivePromise;
    return this._proactive;
  }

  private async _initializeProactive(): Promise<ProactiveServices> {
    const startTime = Date.now();
    logger.info('[SAMServices] Initializing proactive services...');

    try {
      const {
        initializeProactiveInterventions,
      } = await import('./proactive-intervention-integration');

      // Initialize the proactive subsystem (returns the subsystems)
      const subsystems = initializeProactiveInterventions();

      const { behaviorMonitor, checkInScheduler, planTracker } = subsystems;

      if (!behaviorMonitor || !checkInScheduler || !planTracker) {
        throw new Error('Proactive services not fully initialized');
      }

      logger.info('[SAMServices] Proactive services initialized', {
        latencyMs: Date.now() - startTime,
      });

      return { behaviorMonitor, checkInScheduler, planTracker };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SAMServices] Failed to initialize proactive services', { error: message });
      throw new Error(`Proactive initialization failed: ${message}`);
    }
  }

  // ============================================================================
  // SELF-EVALUATION SERVICES
  // ============================================================================

  /**
   * Get self-evaluation services (confidence scorer, quality tracker)
   */
  async getSelfEvaluation(): Promise<SelfEvaluationServices> {
    if (this._selfEvaluation) {
      return this._selfEvaluation;
    }

    if (this._selfEvaluationPromise) {
      return this._selfEvaluationPromise;
    }

    this._selfEvaluationPromise = this._initializeSelfEvaluation();
    this._selfEvaluation = await this._selfEvaluationPromise;
    return this._selfEvaluation;
  }

  private async _initializeSelfEvaluation(): Promise<SelfEvaluationServices> {
    const startTime = Date.now();
    logger.info('[SAMServices] Initializing self-evaluation services...');

    try {
      const { createConfidenceScorer, createQualityTracker } = await import('@sam-ai/agentic');
      const { getObservabilityStores } = await import('./taxomind-context');

      const stores = getObservabilityStores();

      // The Prisma store implements the core methods used by the scorer/tracker.
      // Full interface alignment is tracked separately.
      const confidenceScorer = createConfidenceScorer({
        store: stores.confidenceCalibration as unknown as Parameters<typeof createConfidenceScorer>[0] extends { store?: infer S } ? S : never,
        logger,
      });

      const qualityTracker = createQualityTracker({
        calibrationStore: stores.confidenceCalibration as unknown as Parameters<typeof createQualityTracker>[0] extends { calibrationStore?: infer S } ? S : never,
        logger,
      });

      logger.info('[SAMServices] Self-evaluation services initialized', {
        latencyMs: Date.now() - startTime,
      });

      return { confidenceScorer, qualityTracker };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SAMServices] Failed to initialize self-evaluation', { error: message });
      throw new Error(`Self-evaluation initialization failed: ${message}`);
    }
  }

  // ============================================================================
  // ORCHESTRATION SERVICES
  // ============================================================================

  /**
   * Get orchestration services (tutoring loop, context injector, step executor, etc.)
   */
  async getOrchestration(): Promise<OrchestrationServices> {
    if (this._orchestration) {
      return this._orchestration;
    }

    if (this._orchestrationPromise) {
      return this._orchestrationPromise;
    }

    this._orchestrationPromise = this._initializeOrchestration();
    this._orchestration = await this._orchestrationPromise;
    return this._orchestration;
  }

  private async _initializeOrchestration(): Promise<OrchestrationServices> {
    const startTime = Date.now();
    logger.info('[SAMServices] Initializing orchestration services...');

    try {
      const {
        initializeOrchestration,
      } = await import('./orchestration-integration');
      const { getMultiSessionStores, getStore } = await import('./taxomind-context');

      const multiSessionStores = getMultiSessionStores();

      // Initialize orchestration with required stores (returns subsystems).
      // The Prisma stores implement the core methods used by orchestration.
      // Full interface alignment is tracked separately.
      const subsystems = initializeOrchestration({
        goalStore: getStore('goal'),
        planStore: multiSessionStores.learningPlan as unknown as Parameters<typeof initializeOrchestration>[0]['planStore'],
        toolStore: getStore('tool'),
      });

      const tutoringController = subsystems.controller;
      const contextInjector = subsystems.injector;
      const stepExecutor = subsystems.executor;
      const confirmationGate = subsystems.confirmationGate;

      if (!tutoringController || !contextInjector || !stepExecutor || !confirmationGate) {
        throw new Error('Orchestration services not fully initialized');
      }

      logger.info('[SAMServices] Orchestration services initialized', {
        latencyMs: Date.now() - startTime,
      });

      return { tutoringController, contextInjector, stepExecutor, confirmationGate };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SAMServices] Failed to initialize orchestration', { error: message });
      throw new Error(`Orchestration initialization failed: ${message}`);
    }
  }

  // ============================================================================
  // MEMORY LIFECYCLE SERVICES
  // ============================================================================

  /**
   * Get memory lifecycle services (reindexing, background worker, normalizer, KG refresh)
   */
  async getMemoryLifecycle(): Promise<MemoryLifecycleServices> {
    if (this._memoryLifecycle) {
      return this._memoryLifecycle;
    }

    if (this._memoryLifecyclePromise) {
      return this._memoryLifecyclePromise;
    }

    this._memoryLifecyclePromise = this._initializeMemoryLifecycle();
    this._memoryLifecycle = await this._memoryLifecyclePromise;
    return this._memoryLifecycle;
  }

  private async _initializeMemoryLifecycle(): Promise<MemoryLifecycleServices> {
    const startTime = Date.now();
    logger.info('[SAMServices] Initializing memory lifecycle services...');

    try {
      const {
        initializeMemoryLifecycle,
        getMemoryLifecycleManager,
        getBackgroundWorker,
        getMemoryNormalizer,
        getKGRefreshScheduler,
      } = await import('./memory-lifecycle-service');

      // Initialize memory lifecycle
      await initializeMemoryLifecycle();

      const lifecycleManager = await getMemoryLifecycleManager();
      const backgroundWorker = await getBackgroundWorker();
      const memoryNormalizer = await getMemoryNormalizer();
      const kgRefreshScheduler = await getKGRefreshScheduler();

      if (!lifecycleManager || !backgroundWorker || !memoryNormalizer || !kgRefreshScheduler) {
        throw new Error('Memory lifecycle services not fully initialized');
      }

      logger.info('[SAMServices] Memory lifecycle services initialized', {
        latencyMs: Date.now() - startTime,
      });

      return { lifecycleManager, backgroundWorker, memoryNormalizer, kgRefreshScheduler };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SAMServices] Failed to initialize memory lifecycle', { error: message });
      throw new Error(`Memory lifecycle initialization failed: ${message}`);
    }
  }

  // ============================================================================
  // AI ADAPTER
  // ============================================================================

  /**
   * Get a fresh AI adapter for LLM interactions.
   *
   * NOT cached — each call creates a new user-scoped adapter to prevent
   * cross-user adapter leakage. For system-level checks (no user context),
   * omit userId to get a system adapter.
   */
  async getAIAdapter(userId?: string): Promise<AIAdapter | null> {
    const startTime = Date.now();

    try {
      const { getSAMAdapter, getSAMAdapterSystem } = await import('./ai-provider');
      const adapter = userId
        ? await getSAMAdapter({ userId, capability: 'chat' })
        : await getSAMAdapterSystem();

      if (!adapter) {
        logger.warn('[SAMServices] AI adapter not available - AI features disabled');
        return null;
      }

      logger.debug('[SAMServices] AI adapter created', {
        userId: userId ?? 'system',
        latencyMs: Date.now() - startTime,
      });

      return adapter;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[SAMServices] Failed to create AI adapter', { error: message });
      return null; // Non-fatal - AI features will be disabled
    }
  }

  // ============================================================================
  // PRE-WARMING
  // ============================================================================

  /**
   * Pre-warm all services on application startup
   * This reduces cold start latency by initializing services before they're needed
   */
  async preWarm(): Promise<void> {
    if (this._isPreWarmed) {
      logger.debug('[SAMServices] Already pre-warmed, skipping');
      return;
    }

    const startTime = Date.now();
    logger.info('[SAMServices] Starting pre-warm sequence...');

    // Initialize services in parallel for faster startup
    // Note: getAIAdapter() is excluded — it requires a userId and is created per-request
    const results = await Promise.allSettled([
      this.getTooling(),
      this.getProactive(),
      this.getSelfEvaluation(),
      // Note: Memory and MemoryLifecycle are heavier - initialize in background
    ]);

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this._isPreWarmed = true;

    logger.info('[SAMServices] Pre-warm complete', {
      latencyMs: Date.now() - startTime,
      succeeded,
      failed,
    });
  }

  /**
   * Pre-warm all services including heavy ones (memory, lifecycle)
   * Use this when you have more startup time available
   */
  async preWarmAll(): Promise<void> {
    const startTime = Date.now();
    logger.info('[SAMServices] Starting full pre-warm sequence...');

    // Note: getAIAdapter() is excluded — it requires a userId and is created per-request
    const results = await Promise.allSettled([
      this.getTooling(),
      this.getProactive(),
      this.getSelfEvaluation(),
      this.getOrchestration(),
      this.getMemory(),
      this.getMemoryLifecycle(),
    ]);

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this._isPreWarmed = true;

    logger.info('[SAMServices] Full pre-warm complete', {
      latencyMs: Date.now() - startTime,
      succeeded,
      failed,
    });
  }

  // ============================================================================
  // HEALTH CHECKING
  // ============================================================================

  /**
   * Check the health of all services
   */
  async healthCheck(): Promise<SAMServicesHealth> {
    const checks = await Promise.allSettled([
      this._checkServiceHealth('tooling', () => this.getTooling()),
      this._checkServiceHealth('memory', () => this.getMemory()),
      this._checkServiceHealth('proactive', () => this.getProactive()),
      this._checkServiceHealth('orchestration', () => this.getOrchestration()),
      this._checkServiceHealth('memoryLifecycle', () => this.getMemoryLifecycle()),
      this._checkServiceHealth('aiAdapter', async () => {
        // Use system-level adapter for health checks (no userId needed)
        const { getSAMAdapterSystem } = await import('./ai-provider');
        return getSAMAdapterSystem();
      }),
    ]);

    const services = {
      tooling: this._extractHealthResult(checks[0]),
      memory: this._extractHealthResult(checks[1]),
      proactive: this._extractHealthResult(checks[2]),
      orchestration: this._extractHealthResult(checks[3]),
      memoryLifecycle: this._extractHealthResult(checks[4]),
      aiAdapter: this._extractHealthResult(checks[5]),
    };

    const healthyCount = Object.values(services).filter((s) => s.healthy).length;
    const totalCount = Object.keys(services).length;

    let status: SAMServicesHealth['status'];
    if (healthyCount === totalCount) {
      status = 'healthy';
    } else if (healthyCount >= totalCount / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      timestamp: new Date(),
    };
  }

  private async _checkServiceHealth<T>(
    name: string,
    getter: () => Promise<T>
  ): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const result = await getter();
      return {
        initialized: true,
        healthy: result !== null,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        initialized: false,
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
        latencyMs: Date.now() - startTime,
      };
    }
  }

  private _extractHealthResult(
    result: PromiseSettledResult<ServiceHealth>
  ): ServiceHealth {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      initialized: false,
      healthy: false,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  }

  // ============================================================================
  // RESET (for testing)
  // ============================================================================

  /**
   * Reset all services (useful for testing)
   * WARNING: This will clear all cached instances
   */
  reset(): void {
    logger.warn('[SAMServices] Resetting all services');

    this._tooling = null;
    this._memory = null;
    this._proactive = null;
    this._selfEvaluation = null;
    this._orchestration = null;
    this._memoryLifecycle = null;

    this._toolingPromise = null;
    this._memoryPromise = null;
    this._proactivePromise = null;
    this._selfEvaluationPromise = null;
    this._orchestrationPromise = null;
    this._memoryLifecyclePromise = null;

    this._isPreWarmed = false;
  }

  /**
   * Check if services have been pre-warmed
   */
  get isPreWarmed(): boolean {
    return this._isPreWarmed;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * The singleton SAMServices instance
 * Import this from anywhere to access SAM services
 */
export const samServices = new SAMServices();

/**
 * Convenience function to pre-warm services
 * Call this during app initialization
 */
export async function preWarmSAMServices(): Promise<void> {
  return samServices.preWarm();
}

/**
 * Convenience function for full pre-warm
 */
export async function preWarmAllSAMServices(): Promise<void> {
  return samServices.preWarmAll();
}

/**
 * Convenience function to check health
 */
export async function checkSAMServicesHealth(): Promise<SAMServicesHealth> {
  return samServices.healthCheck();
}
