/**
 * Tests for SAM Services Singleton
 */

import { samServices, preWarmSAMServices, checkSAMServicesHealth } from '../sam-services';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the tooling system
jest.mock('../agentic-tooling', () => ({
  getToolingSystem: jest.fn().mockResolvedValue({
    toolRegistry: {},
    toolExecutor: {},
    permissionManager: {},
    confirmationManager: {},
    auditLogger: {},
  }),
}));

// Mock the memory system
jest.mock('../agentic-memory', () => ({
  getAgenticMemorySystem: jest.fn().mockResolvedValue({
    store: jest.fn(),
    retrieve: jest.fn(),
  }),
}));

// Mock proactive interventions
jest.mock('../proactive-intervention-integration', () => ({
  initializeProactiveInterventions: jest.fn(),
  getBehaviorMonitor: jest.fn().mockReturnValue({}),
  getCheckInScheduler: jest.fn().mockReturnValue({}),
  getMultiSessionPlanTracker: jest.fn().mockReturnValue({}),
}));

// Mock self-evaluation services
jest.mock('@sam-ai/agentic', () => ({
  createConfidenceScorer: jest.fn().mockReturnValue({}),
  createQualityTracker: jest.fn().mockReturnValue({}),
}));

// Mock taxomind-context
jest.mock('../taxomind-context', () => ({
  getObservabilityStores: jest.fn().mockReturnValue({
    calibration: {},
    telemetry: {},
  }),
  getMultiSessionStores: jest.fn().mockReturnValue({
    plan: {},
  }),
  getStore: jest.fn().mockReturnValue({}),
}));

// Mock integration-adapters
jest.mock('../integration-adapters', () => ({
  getCoreAIAdapter: jest.fn().mockResolvedValue({
    complete: jest.fn(),
  }),
}));

// Mock orchestration-integration
jest.mock('../orchestration-integration', () => ({
  initializeOrchestration: jest.fn(),
  getTutoringController: jest.fn().mockReturnValue({}),
  getContextInjector: jest.fn().mockReturnValue({}),
  getStepExecutor: jest.fn().mockReturnValue({}),
  getConfirmationGate: jest.fn().mockReturnValue({}),
}));

// Mock memory-lifecycle-service
jest.mock('../memory-lifecycle-service', () => ({
  initializeMemoryLifecycle: jest.fn(),
  getLifecycleManager: jest.fn().mockReturnValue({}),
  getBackgroundWorker: jest.fn().mockReturnValue({}),
  getMemoryNormalizer: jest.fn().mockReturnValue({}),
  getKGRefreshScheduler: jest.fn().mockReturnValue({}),
}));

describe('SAM Services', () => {
  beforeEach(() => {
    // Reset the singleton before each test
    samServices.reset();
  });

  describe('getTooling', () => {
    it('returns tooling services on first call', async () => {
      const tooling = await samServices.getTooling();

      expect(tooling).toBeDefined();
      expect(tooling.toolRegistry).toBeDefined();
      expect(tooling.toolExecutor).toBeDefined();
    });

    it('returns same instance on subsequent calls', async () => {
      const tooling1 = await samServices.getTooling();
      const tooling2 = await samServices.getTooling();

      expect(tooling1).toBe(tooling2);
    });

    it('uses Promise-based locking for concurrent calls', async () => {
      // Call getTooling multiple times concurrently
      const promises = [
        samServices.getTooling(),
        samServices.getTooling(),
        samServices.getTooling(),
      ];

      const results = await Promise.all(promises);

      // All should return the same instance
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
    });
  });

  describe('getAIAdapter', () => {
    it('returns AI adapter on first call', async () => {
      const adapter = await samServices.getAIAdapter();

      expect(adapter).toBeDefined();
    });

    it('returns same instance on subsequent calls', async () => {
      const adapter1 = await samServices.getAIAdapter();
      const adapter2 = await samServices.getAIAdapter();

      expect(adapter1).toBe(adapter2);
    });
  });

  describe('getProactive', () => {
    it('returns proactive services', async () => {
      const proactive = await samServices.getProactive();

      expect(proactive).toBeDefined();
      expect(proactive.behaviorMonitor).toBeDefined();
      expect(proactive.checkInScheduler).toBeDefined();
      expect(proactive.planTracker).toBeDefined();
    });
  });

  describe('getSelfEvaluation', () => {
    it('returns self-evaluation services', async () => {
      const selfEval = await samServices.getSelfEvaluation();

      expect(selfEval).toBeDefined();
      expect(selfEval.confidenceScorer).toBeDefined();
      expect(selfEval.qualityTracker).toBeDefined();
    });
  });

  describe('getMemory', () => {
    it('returns memory system', async () => {
      const memory = await samServices.getMemory();

      expect(memory).toBeDefined();
    });
  });

  describe('preWarm', () => {
    it('initializes core services', async () => {
      expect(samServices.isPreWarmed).toBe(false);

      await samServices.preWarm();

      expect(samServices.isPreWarmed).toBe(true);
    });

    it('is idempotent - skips if already pre-warmed', async () => {
      await samServices.preWarm();
      const firstPreWarm = samServices.isPreWarmed;

      // Second call should not throw and should still be pre-warmed
      await samServices.preWarm();

      expect(samServices.isPreWarmed).toBe(firstPreWarm);
    });
  });

  describe('preWarmAll', () => {
    it('initializes all services including heavy ones', async () => {
      await samServices.preWarmAll();

      expect(samServices.isPreWarmed).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('returns health status for all services', async () => {
      const health = await samServices.healthCheck();

      expect(health.status).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(health.status);
      expect(health.services).toBeDefined();
      expect(health.timestamp).toBeInstanceOf(Date);
    });

    it('reports service-level health', async () => {
      const health = await samServices.healthCheck();

      expect(health.services.tooling).toBeDefined();
      expect(health.services.memory).toBeDefined();
      expect(health.services.proactive).toBeDefined();
      expect(health.services.aiAdapter).toBeDefined();
    });
  });

  describe('reset', () => {
    it('clears all cached instances', async () => {
      // Initialize some services
      await samServices.getTooling();
      expect(samServices.isPreWarmed).toBe(false); // preWarm wasn't called

      samServices.reset();

      // isPreWarmed should be false after reset
      expect(samServices.isPreWarmed).toBe(false);
    });
  });

  describe('Convenience functions', () => {
    it('preWarmSAMServices calls preWarm', async () => {
      await preWarmSAMServices();
      expect(samServices.isPreWarmed).toBe(true);
    });

    it('checkSAMServicesHealth returns health status', async () => {
      const health = await checkSAMServicesHealth();

      expect(health.status).toBeDefined();
      expect(health.services).toBeDefined();
    });
  });
});
