/**
 * SAM AI Observability Metrics API Tests
 * Tests for the admin metrics endpoint
 *
 * Note: These tests require SAM observability models to exist in Prisma schema.
 * Models needed: SAMToolExecution, SAMConfidenceScore, SAMMemoryRetrieval, SAMPlanLifecycleEvent
 */

import { NextRequest } from 'next/server';

// ============================================================================
// MOCKS - Using inline jest.fn() for proper hoisting
// ============================================================================

// Mock the pooled db module to avoid browser check - inline mocks
jest.mock('@/lib/db-pooled', () => ({
  db: {
    sAMToolExecution: { findMany: jest.fn() },
    sAMConfidenceScore: { findMany: jest.fn() },
    sAMMemoryRetrieval: { findMany: jest.fn() },
    sAMPlanLifecycleEvent: { findMany: jest.fn() },
  },
  getDb: jest.fn(),
  getDbMetrics: jest.fn(),
  checkDatabaseHealth: jest.fn(),
}));

// Mock the db module (which re-exports from db-pooled)
jest.mock('@/lib/db', () => ({
  db: {
    sAMToolExecution: { findMany: jest.fn() },
    sAMConfidenceScore: { findMany: jest.fn() },
    sAMMemoryRetrieval: { findMany: jest.fn() },
    sAMPlanLifecycleEvent: { findMany: jest.fn() },
  },
}));

// Mock auth
jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

// Import after mocks are set up
import { POST } from '../route';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// Get typed references to mocked functions
const mockDb = db as unknown as {
  sAMToolExecution: { findMany: jest.Mock };
  sAMConfidenceScore: { findMany: jest.Mock };
  sAMMemoryRetrieval: { findMany: jest.Mock };
  sAMPlanLifecycleEvent: { findMany: jest.Mock };
};

const mockAuth = auth as jest.Mock;

// ============================================================================
// TEST HELPERS
// ============================================================================

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/sam/metrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function createMockToolExecution(overrides: Partial<{
  id: string;
  toolName: string;
  status: string;
  durationMs: number | null;
  confirmationRequired: boolean;
  createdAt: Date;
}> = {}) {
  return {
    id: 'exec-1',
    toolName: 'search',
    status: 'SUCCESS',
    durationMs: 100,
    confirmationRequired: false,
    createdAt: new Date(),
    ...overrides,
  };
}

function createMockConfidenceScore(overrides: Partial<{
  responseType: string;
  predictedConfidence: number;
  accurate: boolean | null;
  predictedAt: Date;
}> = {}) {
  return {
    responseType: 'answer',
    predictedConfidence: 0.85,
    accurate: true,
    predictedAt: new Date(),
    ...overrides,
  };
}

function createMockMemoryRetrieval(overrides: Partial<{
  source: string;
  resultCount: number;
  avgRelevanceScore: number;
  cacheHit: boolean;
  latencyMs: number;
  timestamp: Date;
}> = {}) {
  return {
    source: 'vector_search',
    resultCount: 5,
    avgRelevanceScore: 0.75,
    cacheHit: false,
    latencyMs: 50,
    timestamp: new Date(),
    ...overrides,
  };
}

function createMockPlanEvent(overrides: Partial<{
  planId: string;
  eventType: string;
  timestamp: Date;
}> = {}) {
  return {
    planId: 'plan-1',
    eventType: 'created',
    timestamp: new Date(),
    ...overrides,
  };
}

// ============================================================================
// TESTS
// ============================================================================

describe('POST /api/admin/sam/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: admin user authenticated
    mockAuth.mockResolvedValue({
      user: { id: 'admin-1', role: 'ADMIN' },
    });

    // Default: empty database responses
    mockDb.sAMToolExecution.findMany.mockResolvedValue([]);
    mockDb.sAMConfidenceScore.findMany.mockResolvedValue([]);
    mockDb.sAMMemoryRetrieval.findMany.mockResolvedValue([]);
    mockDb.sAMPlanLifecycleEvent.findMany.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when user is not admin', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'user-1', role: 'USER' },
      });

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error?.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 when admin is authenticated', async () => {
      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('time range', () => {
    it('should use 24h default when no timeRange provided', async () => {
      const request = createRequest({});
      await POST(request);

      expect(mockDb.sAMToolExecution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        })
      );
    });

    it('should handle 1h time range', async () => {
      const request = createRequest({ timeRange: '1h' });
      await POST(request);

      expect(mockDb.sAMToolExecution.findMany).toHaveBeenCalled();
    });

    it('should handle 7d time range', async () => {
      const request = createRequest({ timeRange: '7d' });
      await POST(request);

      expect(mockDb.sAMToolExecution.findMany).toHaveBeenCalled();
    });

    it('should handle 30d time range', async () => {
      const request = createRequest({ timeRange: '30d' });
      await POST(request);

      expect(mockDb.sAMToolExecution.findMany).toHaveBeenCalled();
    });
  });

  describe('tool metrics', () => {
    it('should calculate tool metrics correctly', async () => {
      mockDb.sAMToolExecution.findMany.mockResolvedValue([
        createMockToolExecution({ id: 'exec-1', status: 'SUCCESS', durationMs: 100 }),
        createMockToolExecution({ id: 'exec-2', status: 'SUCCESS', durationMs: 200 }),
        createMockToolExecution({ id: 'exec-3', status: 'FAILED', durationMs: 50 }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.toolMetrics.totalExecutions).toBe(3);
      expect(data.data.toolMetrics.successRate).toBeCloseTo(2/3);
      expect(data.data.toolMetrics.avgLatencyMs).toBeCloseTo(117, 0);
    });

    it('should handle empty tool executions', async () => {
      mockDb.sAMToolExecution.findMany.mockResolvedValue([]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.toolMetrics.totalExecutions).toBe(0);
      expect(data.data.toolMetrics.successRate).toBe(0);
      expect(data.data.toolMetrics.avgLatencyMs).toBe(0);
    });

    it('should track confirmation rate', async () => {
      mockDb.sAMToolExecution.findMany.mockResolvedValue([
        createMockToolExecution({ id: 'exec-1', confirmationRequired: true }),
        createMockToolExecution({ id: 'exec-2', confirmationRequired: false }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.toolMetrics.confirmationRate).toBe(0.5);
    });

    it('should group executions by status', async () => {
      mockDb.sAMToolExecution.findMany.mockResolvedValue([
        createMockToolExecution({ id: 'exec-1', status: 'SUCCESS' }),
        createMockToolExecution({ id: 'exec-2', status: 'SUCCESS' }),
        createMockToolExecution({ id: 'exec-3', status: 'FAILED' }),
        createMockToolExecution({ id: 'exec-4', status: 'TIMEOUT' }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.toolMetrics.executionsByStatus['SUCCESS']).toBe(2);
      expect(data.data.toolMetrics.executionsByStatus['FAILED']).toBe(1);
      expect(data.data.toolMetrics.executionsByStatus['TIMEOUT']).toBe(1);
    });

    it('should group executions by tool', async () => {
      mockDb.sAMToolExecution.findMany.mockResolvedValue([
        createMockToolExecution({ id: 'exec-1', toolName: 'search' }),
        createMockToolExecution({ id: 'exec-2', toolName: 'search' }),
        createMockToolExecution({ id: 'exec-3', toolName: 'calculate' }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.toolMetrics.executionsByTool['search']).toBe(2);
      expect(data.data.toolMetrics.executionsByTool['calculate']).toBe(1);
    });

    it('should include recent executions', async () => {
      mockDb.sAMToolExecution.findMany.mockResolvedValue([
        createMockToolExecution({ id: 'exec-1' }),
        createMockToolExecution({ id: 'exec-2' }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.toolMetrics.recentExecutions).toHaveLength(2);
      expect(data.data.toolMetrics.recentExecutions[0].id).toBe('exec-1');
    });
  });

  describe('confidence metrics', () => {
    it('should calculate confidence metrics correctly', async () => {
      mockDb.sAMConfidenceScore.findMany.mockResolvedValue([
        createMockConfidenceScore({ predictedConfidence: 0.8, accurate: true }),
        createMockConfidenceScore({ predictedConfidence: 0.9, accurate: true }),
        createMockConfidenceScore({ predictedConfidence: 0.7, accurate: false }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.confidenceMetrics.totalPredictions).toBe(3);
      expect(data.data.confidenceMetrics.outcomesRecorded).toBe(3);
      expect(data.data.confidenceMetrics.avgPredictedConfidence).toBeCloseTo(0.8);
      expect(data.data.confidenceMetrics.avgActualAccuracy).toBeCloseTo(2/3);
    });

    it('should handle predictions without outcomes', async () => {
      mockDb.sAMConfidenceScore.findMany.mockResolvedValue([
        createMockConfidenceScore({ predictedConfidence: 0.8, accurate: null }),
        createMockConfidenceScore({ predictedConfidence: 0.9, accurate: true }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.confidenceMetrics.totalPredictions).toBe(2);
      expect(data.data.confidenceMetrics.outcomesRecorded).toBe(1);
    });

    it('should calculate calibration error', async () => {
      mockDb.sAMConfidenceScore.findMany.mockResolvedValue([
        createMockConfidenceScore({ predictedConfidence: 0.9, accurate: true }),
        createMockConfidenceScore({ predictedConfidence: 0.9, accurate: false }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      // Predicted avg: 0.9, Actual: 0.5, Error: 0.4
      expect(data.data.confidenceMetrics.calibrationError).toBeCloseTo(0.4);
    });

    it('should group by response type', async () => {
      mockDb.sAMConfidenceScore.findMany.mockResolvedValue([
        createMockConfidenceScore({ responseType: 'answer', predictedConfidence: 0.8 }),
        createMockConfidenceScore({ responseType: 'answer', predictedConfidence: 0.9 }),
        createMockConfidenceScore({ responseType: 'explanation', predictedConfidence: 0.7 }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      const byType = data.data.confidenceMetrics.byResponseType;
      const answer = byType.find((t: { type: string }) => t.type === 'answer');
      const explanation = byType.find((t: { type: string }) => t.type === 'explanation');

      expect(answer.count).toBe(2);
      expect(explanation.count).toBe(1);
    });
  });

  describe('memory metrics', () => {
    it('should calculate memory metrics correctly', async () => {
      mockDb.sAMMemoryRetrieval.findMany.mockResolvedValue([
        createMockMemoryRetrieval({ avgRelevanceScore: 0.8, cacheHit: true, latencyMs: 50 }),
        createMockMemoryRetrieval({ avgRelevanceScore: 0.6, cacheHit: false, latencyMs: 100 }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.memoryMetrics.totalSearches).toBe(2);
      expect(data.data.memoryMetrics.avgRelevanceScore).toBeCloseTo(0.7);
      expect(data.data.memoryMetrics.cacheHitRate).toBe(0.5);
      expect(data.data.memoryMetrics.avgLatencyMs).toBe(75);
    });

    it('should calculate empty result rate', async () => {
      mockDb.sAMMemoryRetrieval.findMany.mockResolvedValue([
        createMockMemoryRetrieval({ resultCount: 5 }),
        createMockMemoryRetrieval({ resultCount: 0 }),
        createMockMemoryRetrieval({ resultCount: 0 }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.memoryMetrics.emptyResultRate).toBeCloseTo(2/3);
    });

    it('should group by source', async () => {
      mockDb.sAMMemoryRetrieval.findMany.mockResolvedValue([
        createMockMemoryRetrieval({ source: 'vector_search', avgRelevanceScore: 0.8 }),
        createMockMemoryRetrieval({ source: 'vector_search', avgRelevanceScore: 0.9 }),
        createMockMemoryRetrieval({ source: 'knowledge_graph', avgRelevanceScore: 0.7 }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      const bySource = data.data.memoryMetrics.bySource;
      const vector = bySource.find((s: { source: string }) => s.source === 'vector_search');
      const graph = bySource.find((s: { source: string }) => s.source === 'knowledge_graph');

      expect(vector.count).toBe(2);
      expect(vector.avgRelevance).toBeCloseTo(0.85);
      expect(graph.count).toBe(1);
    });
  });

  describe('plan metrics', () => {
    it('should calculate plan metrics correctly', async () => {
      mockDb.sAMPlanLifecycleEvent.findMany.mockResolvedValue([
        createMockPlanEvent({ planId: 'plan-1', eventType: 'created' }),
        createMockPlanEvent({ planId: 'plan-1', eventType: 'activated' }),
        createMockPlanEvent({ planId: 'plan-1', eventType: 'completed' }),
        createMockPlanEvent({ planId: 'plan-2', eventType: 'created' }),
        createMockPlanEvent({ planId: 'plan-2', eventType: 'abandoned' }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.planMetrics.totalEvents).toBe(5);
      expect(data.data.planMetrics.completedPlans).toBe(1);
      expect(data.data.planMetrics.abandonedPlans).toBe(1);
    });

    it('should track active plans', async () => {
      mockDb.sAMPlanLifecycleEvent.findMany.mockResolvedValue([
        createMockPlanEvent({ planId: 'plan-1', eventType: 'activated' }),
        createMockPlanEvent({ planId: 'plan-2', eventType: 'step_started' }),
        createMockPlanEvent({ planId: 'plan-3', eventType: 'activated' }),
        createMockPlanEvent({ planId: 'plan-3', eventType: 'completed' }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.planMetrics.activePlans).toBe(2); // plan-1 and plan-2
    });

    it('should group events by type', async () => {
      mockDb.sAMPlanLifecycleEvent.findMany.mockResolvedValue([
        createMockPlanEvent({ eventType: 'created' }),
        createMockPlanEvent({ eventType: 'created' }),
        createMockPlanEvent({ eventType: 'activated' }),
        createMockPlanEvent({ eventType: 'step_completed' }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.data.planMetrics.eventsByType['created']).toBe(2);
      expect(data.data.planMetrics.eventsByType['activated']).toBe(1);
      expect(data.data.planMetrics.eventsByType['step_completed']).toBe(1);
    });

    it('should calculate completion rate', async () => {
      mockDb.sAMPlanLifecycleEvent.findMany.mockResolvedValue([
        createMockPlanEvent({ planId: 'plan-1', eventType: 'created' }),
        createMockPlanEvent({ planId: 'plan-1', eventType: 'completed' }),
        createMockPlanEvent({ planId: 'plan-2', eventType: 'created' }),
        createMockPlanEvent({ planId: 'plan-2', eventType: 'abandoned' }),
        createMockPlanEvent({ planId: 'plan-3', eventType: 'created' }),
      ]);

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      // 1 completed out of 3 total unique plans
      expect(data.data.planMetrics.avgCompletionRate).toBeCloseTo(1/3);
    });
  });

  describe('error handling', () => {
    it('should handle database errors', async () => {
      mockDb.sAMToolExecution.findMany.mockRejectedValue(new Error('Database error'));

      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toHaveProperty('code');
      expect(data.error).toHaveProperty('message');
    });

    it('should handle JSON parse errors', async () => {
      const request = new NextRequest('http://localhost/api/admin/sam/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('response structure', () => {
    it('should return complete metrics response', async () => {
      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('toolMetrics');
      expect(data.data).toHaveProperty('confidenceMetrics');
      expect(data.data).toHaveProperty('memoryMetrics');
      expect(data.data).toHaveProperty('planMetrics');
    });

    it('should have correct toolMetrics structure', async () => {
      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      const toolMetrics = data.data.toolMetrics;
      expect(toolMetrics).toHaveProperty('totalExecutions');
      expect(toolMetrics).toHaveProperty('successRate');
      expect(toolMetrics).toHaveProperty('avgLatencyMs');
      expect(toolMetrics).toHaveProperty('p95LatencyMs');
      expect(toolMetrics).toHaveProperty('confirmationRate');
      expect(toolMetrics).toHaveProperty('executionsByStatus');
      expect(toolMetrics).toHaveProperty('executionsByTool');
      expect(toolMetrics).toHaveProperty('recentExecutions');
    });

    it('should have correct confidenceMetrics structure', async () => {
      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      const confidenceMetrics = data.data.confidenceMetrics;
      expect(confidenceMetrics).toHaveProperty('totalPredictions');
      expect(confidenceMetrics).toHaveProperty('outcomesRecorded');
      expect(confidenceMetrics).toHaveProperty('avgPredictedConfidence');
      expect(confidenceMetrics).toHaveProperty('avgActualAccuracy');
      expect(confidenceMetrics).toHaveProperty('calibrationError');
      expect(confidenceMetrics).toHaveProperty('byResponseType');
    });

    it('should have correct memoryMetrics structure', async () => {
      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      const memoryMetrics = data.data.memoryMetrics;
      expect(memoryMetrics).toHaveProperty('totalSearches');
      expect(memoryMetrics).toHaveProperty('avgRelevanceScore');
      expect(memoryMetrics).toHaveProperty('cacheHitRate');
      expect(memoryMetrics).toHaveProperty('avgLatencyMs');
      expect(memoryMetrics).toHaveProperty('emptyResultRate');
      expect(memoryMetrics).toHaveProperty('bySource');
    });

    it('should have correct planMetrics structure', async () => {
      const request = createRequest({ timeRange: '24h' });
      const response = await POST(request);
      const data = await response.json();

      const planMetrics = data.data.planMetrics;
      expect(planMetrics).toHaveProperty('totalEvents');
      expect(planMetrics).toHaveProperty('activePlans');
      expect(planMetrics).toHaveProperty('completedPlans');
      expect(planMetrics).toHaveProperty('abandonedPlans');
      expect(planMetrics).toHaveProperty('avgCompletionRate');
      expect(planMetrics).toHaveProperty('eventsByType');
    });
  });
});
