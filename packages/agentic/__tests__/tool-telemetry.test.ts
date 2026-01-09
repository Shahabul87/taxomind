/**
 * @sam-ai/agentic - Tool Telemetry Tests
 * Tests for tool execution store and telemetry tracking
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ToolTelemetry,
  InMemoryToolExecutionStore,
  createToolTelemetry,
  createInMemoryToolExecutionStore,
} from '../src/observability/tool-telemetry';
import { ToolExecutionStatus, type ToolExecutionEvent } from '../src/observability/types';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function createMockExecutionEvent(
  overrides: Partial<ToolExecutionEvent> = {}
): ToolExecutionEvent {
  return {
    executionId: 'exec-1',
    toolId: 'tool-1',
    toolName: 'Test Tool',
    userId: 'user-1',
    startedAt: new Date(),
    status: ToolExecutionStatus.PENDING,
    confirmationRequired: false,
    ...overrides,
  };
}

// ============================================================================
// IN-MEMORY TOOL EXECUTION STORE TESTS
// ============================================================================

describe('InMemoryToolExecutionStore', () => {
  let store: InMemoryToolExecutionStore;

  beforeEach(() => {
    store = createInMemoryToolExecutionStore();
  });

  describe('record and getById', () => {
    it('should record and retrieve event by ID', async () => {
      const event = createMockExecutionEvent();
      await store.record(event);

      const retrieved = await store.getById(event.executionId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.executionId).toBe(event.executionId);
    });

    it('should return null for unknown ID', async () => {
      const result = await store.getById('unknown-id');
      expect(result).toBeNull();
    });

    it('should enforce max events (FIFO eviction)', async () => {
      const maxEvents = 5;
      const storeWithLimit = createInMemoryToolExecutionStore(maxEvents);

      for (let i = 0; i < 10; i++) {
        await storeWithLimit.record(
          createMockExecutionEvent({ executionId: `exec-${i}` })
        );
      }

      // First 5 should be evicted
      for (let i = 0; i < 5; i++) {
        const result = await storeWithLimit.getById(`exec-${i}`);
        expect(result).toBeNull();
      }

      // Last 5 should exist
      for (let i = 5; i < 10; i++) {
        const result = await storeWithLimit.getById(`exec-${i}`);
        expect(result).not.toBeNull();
      }
    });
  });

  describe('query', () => {
    beforeEach(async () => {
      const baseTime = new Date();

      // Create diverse test data
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-1',
          userId: 'user-1',
          toolId: 'tool-a',
          status: ToolExecutionStatus.SUCCESS,
          startedAt: new Date(baseTime.getTime() - 10000),
        })
      );
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-2',
          userId: 'user-1',
          toolId: 'tool-b',
          status: ToolExecutionStatus.FAILED,
          planId: 'plan-1',
          startedAt: new Date(baseTime.getTime() - 5000),
        })
      );
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-3',
          userId: 'user-2',
          toolId: 'tool-a',
          status: ToolExecutionStatus.SUCCESS,
          startedAt: baseTime,
        })
      );
    });

    it('should return all events when no filters', async () => {
      const results = await store.query({});
      expect(results).toHaveLength(3);
    });

    it('should filter by userId', async () => {
      const results = await store.query({ userId: 'user-1' });
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.userId === 'user-1')).toBe(true);
    });

    it('should filter by toolId', async () => {
      const results = await store.query({ toolId: 'tool-a' });
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.toolId === 'tool-a')).toBe(true);
    });

    it('should filter by single status', async () => {
      const results = await store.query({ status: ToolExecutionStatus.SUCCESS });
      expect(results).toHaveLength(2);
      expect(results.every((e) => e.status === ToolExecutionStatus.SUCCESS)).toBe(true);
    });

    it('should filter by multiple statuses', async () => {
      const results = await store.query({
        status: [ToolExecutionStatus.SUCCESS, ToolExecutionStatus.FAILED],
      });
      expect(results).toHaveLength(3);
    });

    it('should filter by planId', async () => {
      const results = await store.query({ planId: 'plan-1' });
      expect(results).toHaveLength(1);
      expect(results[0].planId).toBe('plan-1');
    });

    it('should filter by time range', async () => {
      const now = new Date();
      const results = await store.query({
        startTime: new Date(now.getTime() - 7000),
        endTime: now,
      });
      expect(results).toHaveLength(2); // Only last 2 events
    });

    it('should sort by startedAt descending', async () => {
      const results = await store.query({});
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].startedAt.getTime()).toBeGreaterThanOrEqual(
          results[i].startedAt.getTime()
        );
      }
    });

    it('should apply pagination', async () => {
      const page1 = await store.query({ limit: 2, offset: 0 });
      expect(page1).toHaveLength(2);

      const page2 = await store.query({ limit: 2, offset: 2 });
      expect(page2).toHaveLength(1);
    });
  });

  describe('getMetrics', () => {
    it('should calculate execution metrics', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Record successful execution
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-1',
          status: ToolExecutionStatus.SUCCESS,
          durationMs: 100,
          startedAt: now,
        })
      );
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-2',
          status: ToolExecutionStatus.SUCCESS,
          durationMs: 200,
          startedAt: now,
        })
      );

      const metrics = await store.getMetrics(hourAgo, new Date(now.getTime() + 1000));

      expect(metrics.executionCount).toBe(2);
      expect(metrics.successRate).toBe(1);
      expect(metrics.avgLatencyMs).toBe(150);
    });

    it('should calculate success rate', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-1',
          status: ToolExecutionStatus.SUCCESS,
          startedAt: now,
        })
      );
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-2',
          status: ToolExecutionStatus.FAILED,
          startedAt: now,
        })
      );

      const metrics = await store.getMetrics(hourAgo, new Date(now.getTime() + 1000));

      expect(metrics.successRate).toBe(0.5);
    });

    it('should calculate percentile latencies', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Record 10 events with varying durations
      for (let i = 1; i <= 10; i++) {
        await store.record(
          createMockExecutionEvent({
            executionId: `exec-${i}`,
            status: ToolExecutionStatus.SUCCESS,
            durationMs: i * 10,
            startedAt: now,
          })
        );
      }

      const metrics = await store.getMetrics(hourAgo, new Date(now.getTime() + 1000));

      expect(metrics.p50LatencyMs).toBeDefined();
      expect(metrics.p95LatencyMs).toBeDefined();
      expect(metrics.p99LatencyMs).toBeDefined();
    });

    it('should track confirmation rate', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-1',
          confirmationRequired: true,
          confirmationGiven: true,
          status: ToolExecutionStatus.SUCCESS,
          startedAt: now,
        })
      );
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-2',
          confirmationRequired: false,
          status: ToolExecutionStatus.SUCCESS,
          startedAt: now,
        })
      );

      const metrics = await store.getMetrics(hourAgo, new Date(now.getTime() + 1000));

      expect(metrics.confirmationRate).toBe(0.5);
      expect(metrics.confirmationAcceptRate).toBe(1);
    });

    it('should track failures by code', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-1',
          status: ToolExecutionStatus.FAILED,
          error: { code: 'TIMEOUT', message: 'Timed out', retryable: true },
          startedAt: now,
        })
      );
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-2',
          status: ToolExecutionStatus.FAILED,
          error: { code: 'PERMISSION_DENIED', message: 'No access', retryable: false },
          startedAt: now,
        })
      );
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-3',
          status: ToolExecutionStatus.FAILED,
          error: { code: 'TIMEOUT', message: 'Timed out again', retryable: true },
          startedAt: now,
        })
      );

      const metrics = await store.getMetrics(hourAgo, new Date(now.getTime() + 1000));

      expect(metrics.failuresByCode['TIMEOUT']).toBe(2);
      expect(metrics.failuresByCode['PERMISSION_DENIED']).toBe(1);
    });

    it('should track executions by tool', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-1',
          toolId: 'search',
          startedAt: now,
        })
      );
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-2',
          toolId: 'search',
          startedAt: now,
        })
      );
      await store.record(
        createMockExecutionEvent({
          executionId: 'exec-3',
          toolId: 'calculate',
          startedAt: now,
        })
      );

      const metrics = await store.getMetrics(hourAgo, new Date(now.getTime() + 1000));

      expect(metrics.executionsByTool['search']).toBe(2);
      expect(metrics.executionsByTool['calculate']).toBe(1);
    });

    it('should handle empty period', async () => {
      const now = new Date();
      const metrics = await store.getMetrics(now, new Date(now.getTime() + 1000));

      expect(metrics.executionCount).toBe(0);
      expect(metrics.successRate).toBe(0);
      expect(metrics.avgLatencyMs).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all events', async () => {
      await store.record(createMockExecutionEvent({ executionId: 'exec-1' }));
      await store.record(createMockExecutionEvent({ executionId: 'exec-2' }));

      store.clear();

      const results = await store.query({});
      expect(results).toHaveLength(0);
    });
  });
});

// ============================================================================
// TOOL TELEMETRY TESTS
// ============================================================================

describe('ToolTelemetry', () => {
  let telemetry: ToolTelemetry;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    telemetry = createToolTelemetry({
      config: {
        enabled: true,
        sampleRate: 1.0,
        maxEvents: 1000,
        sanitize: true,
        redactFields: ['password', 'token', 'secret'],
      },
      logger: mockLogger,
    });
  });

  describe('startExecution', () => {
    it('should start tracking execution and return ID', () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      expect(executionId).toBeTruthy();
      expect(typeof executionId).toBe('string');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Tool execution started',
        expect.objectContaining({
          toolId: 'search',
          userId: 'user-1',
        })
      );
    });

    it('should return empty string when disabled', () => {
      const disabledTelemetry = createToolTelemetry({
        config: { enabled: false },
        logger: mockLogger,
      });

      const executionId = disabledTelemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      expect(executionId).toBe('');
    });

    it('should track with optional parameters', () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        sessionId: 'session-1',
        planId: 'plan-1',
        stepId: 'step-1',
        confirmationRequired: true,
        input: { query: 'test' },
        tags: { category: 'search' },
      });

      expect(executionId).toBeTruthy();
    });
  });

  describe('recordConfirmation', () => {
    it('should record confirmation given', () => {
      const executionId = telemetry.startExecution({
        toolId: 'delete',
        toolName: 'Delete Tool',
        userId: 'user-1',
        confirmationRequired: true,
      });

      telemetry.recordConfirmation(executionId, true);

      // Should not have completed yet
      expect(telemetry.getActiveExecutionCount()).toBe(1);
    });

    it('should complete execution when confirmation rejected', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'delete',
        toolName: 'Delete Tool',
        userId: 'user-1',
        confirmationRequired: true,
      });

      telemetry.recordConfirmation(executionId, false);

      // Wait for async completion
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(telemetry.getActiveExecutionCount()).toBe(0);
    });

    it('should handle unknown execution ID', () => {
      // Should not throw
      telemetry.recordConfirmation('unknown-id', true);
    });
  });

  describe('markExecuting', () => {
    it('should mark execution as executing', () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      telemetry.markExecuting(executionId);
      // No error means success
    });

    it('should handle unknown execution ID', () => {
      // Should not throw
      telemetry.markExecuting('unknown-id');
    });
  });

  describe('completeExecution', () => {
    it('should complete successful execution', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      await telemetry.completeExecution(executionId, true, { results: ['a', 'b'] });

      expect(telemetry.getActiveExecutionCount()).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Tool execution completed',
        expect.objectContaining({
          executionId,
          success: true,
        })
      );
    });

    it('should complete failed execution with error', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      await telemetry.completeExecution(executionId, false, undefined, {
        code: 'NETWORK_ERROR',
        message: 'Connection failed',
        retryable: true,
      });

      expect(telemetry.getActiveExecutionCount()).toBe(0);
    });

    it('should handle unknown execution ID', async () => {
      // Should not throw
      await telemetry.completeExecution('unknown-id', true);
    });

    it('should calculate duration', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 10));

      await telemetry.completeExecution(executionId, true);

      const event = await telemetry.getExecution(executionId);
      expect(event?.durationMs).toBeGreaterThanOrEqual(10);
    });
  });

  describe('recordTimeout', () => {
    it('should record timeout', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      await telemetry.recordTimeout(executionId);

      expect(telemetry.getActiveExecutionCount()).toBe(0);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Tool execution timeout',
        expect.objectContaining({ executionId })
      );

      const event = await telemetry.getExecution(executionId);
      expect(event?.status).toBe(ToolExecutionStatus.TIMEOUT);
    });

    it('should handle unknown execution ID', async () => {
      // Should not throw
      await telemetry.recordTimeout('unknown-id');
    });
  });

  describe('recordCancellation', () => {
    it('should record cancellation', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      await telemetry.recordCancellation(executionId);

      expect(telemetry.getActiveExecutionCount()).toBe(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Tool execution cancelled',
        expect.objectContaining({ executionId })
      );

      const event = await telemetry.getExecution(executionId);
      expect(event?.status).toBe(ToolExecutionStatus.CANCELLED);
    });

    it('should handle unknown execution ID', async () => {
      // Should not throw
      await telemetry.recordCancellation('unknown-id');
    });
  });

  describe('getExecution', () => {
    it('should return active execution', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      const event = await telemetry.getExecution(executionId);
      expect(event).not.toBeNull();
      expect(event?.executionId).toBe(executionId);
    });

    it('should return completed execution from store', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      await telemetry.completeExecution(executionId, true);

      const event = await telemetry.getExecution(executionId);
      expect(event).not.toBeNull();
      expect(event?.status).toBe(ToolExecutionStatus.SUCCESS);
    });

    it('should return null for unknown ID', async () => {
      const event = await telemetry.getExecution('unknown-id');
      expect(event).toBeNull();
    });
  });

  describe('queryExecutions', () => {
    it('should query completed executions', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      await telemetry.completeExecution(executionId, true);

      const results = await telemetry.queryExecutions({ userId: 'user-1' });
      expect(results).toHaveLength(1);
    });
  });

  describe('getMetrics', () => {
    it('should return metrics for period', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });
      await telemetry.completeExecution(executionId, true);

      const metrics = await telemetry.getMetrics(hourAgo, new Date(now.getTime() + 1000));

      expect(metrics.executionCount).toBe(1);
      expect(metrics.successRate).toBe(1);
    });
  });

  describe('getRecentMetrics', () => {
    it('should return recent metrics with default period', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });
      await telemetry.completeExecution(executionId, true);

      const metrics = await telemetry.getRecentMetrics();

      expect(metrics.executionCount).toBe(1);
    });

    it('should accept custom period in minutes', async () => {
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });
      await telemetry.completeExecution(executionId, true);

      const metrics = await telemetry.getRecentMetrics(5);

      expect(metrics).toHaveProperty('executionCount');
      expect(metrics).toHaveProperty('periodStart');
      expect(metrics).toHaveProperty('periodEnd');
    });
  });

  describe('getActiveExecutionCount', () => {
    it('should return active execution count', async () => {
      expect(telemetry.getActiveExecutionCount()).toBe(0);

      telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      expect(telemetry.getActiveExecutionCount()).toBe(1);

      telemetry.startExecution({
        toolId: 'calculate',
        toolName: 'Calculate Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      expect(telemetry.getActiveExecutionCount()).toBe(2);
    });
  });

  describe('sanitization', () => {
    it('should redact sensitive fields from input', () => {
      const executionId = telemetry.startExecution({
        toolId: 'auth',
        toolName: 'Auth Tool',
        userId: 'user-1',
        confirmationRequired: false,
        input: {
          username: 'testuser',
          password: 'secret123',
          token: 'bearer-token',
        },
      });

      expect(executionId).toBeTruthy();
      // The input should be sanitized when stored
    });

    it('should truncate long inputs', () => {
      const longInput = 'a'.repeat(1000);

      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
        input: longInput,
      });

      expect(executionId).toBeTruthy();
      // The input should be truncated
    });

    it('should handle serialization failures gracefully', () => {
      const circularRef: Record<string, unknown> = {};
      circularRef.self = circularRef;

      // Should not throw
      const executionId = telemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
        input: circularRef,
      });

      expect(executionId).toBeTruthy();
    });
  });

  describe('sampling', () => {
    it('should respect sample rate', () => {
      const sampledTelemetry = createToolTelemetry({
        config: {
          enabled: true,
          sampleRate: 0, // Never sample
        },
        logger: mockLogger,
      });

      const executionId = sampledTelemetry.startExecution({
        toolId: 'search',
        toolName: 'Search Tool',
        userId: 'user-1',
        confirmationRequired: false,
      });

      expect(executionId).toBe('');
    });
  });
});
