/**
 * @sam-ai/agentic - AuditLogger Tests
 * Comprehensive tests for audit logging with queries and reports
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AuditLogger,
  createAuditLogger,
  type AuditLoggerConfig,
  type AuditContext,
} from '../src/tool-registry/audit-logger';
import type {
  AuditStore,
  AuditLogEntry,
  AuditLogLevel,
  ToolInvocation,
  ToolDefinition,
  ToolError,
} from '../src/tool-registry/types';
import {
  AuditLogLevel as LogLevelEnum,
  ToolExecutionStatus,
  ToolCategory,
  ConfirmationType,
  PermissionLevel,
} from '../src/tool-registry/types';
import { z } from 'zod';

// ============================================================================
// MOCKS
// ============================================================================

const createMockAuditStore = (): AuditStore => {
  const entries: AuditLogEntry[] = [];

  return {
    log: vi.fn().mockImplementation((entry) => {
      const newEntry: AuditLogEntry = {
        ...entry,
        id: `entry-${entries.length + 1}`,
        timestamp: new Date(),
      };
      entries.push(newEntry);
      return Promise.resolve(newEntry);
    }),
    query: vi.fn().mockImplementation((options) => {
      let filtered = [...entries];

      if (options.userId) {
        filtered = filtered.filter((e) => e.userId === options.userId);
      }
      if (options.toolId) {
        filtered = filtered.filter((e) => e.toolId === options.toolId);
      }
      if (options.action?.length) {
        filtered = filtered.filter((e) => options.action.includes(e.action));
      }
      if (options.level?.length) {
        filtered = filtered.filter((e) => options.level.includes(e.level));
      }
      if (options.startDate) {
        filtered = filtered.filter((e) => e.timestamp >= options.startDate);
      }
      if (options.endDate) {
        filtered = filtered.filter((e) => e.timestamp <= options.endDate);
      }
      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      return Promise.resolve(filtered);
    }),
    count: vi.fn().mockImplementation(() => Promise.resolve(entries.length)),
  };
};

const createMockInvocation = (overrides?: Partial<ToolInvocation>): ToolInvocation => ({
  id: 'inv-1',
  toolId: 'tool-1',
  userId: 'user-1',
  sessionId: 'session-1',
  input: { test: 'data' },
  status: ToolExecutionStatus.PENDING,
  confirmationType: ConfirmationType.NONE,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockTool = (overrides?: Partial<ToolDefinition>): ToolDefinition => ({
  id: 'tool-1',
  name: 'Test Tool',
  description: 'A test tool',
  category: ToolCategory.CONTENT,
  version: '1.0.0',
  inputSchema: z.object({}),
  requiredPermissions: [PermissionLevel.EXECUTE],
  confirmationType: ConfirmationType.NONE,
  handler: vi.fn(),
  enabled: true,
  ...overrides,
});

const createMockContext = (overrides?: Partial<AuditContext>): AuditContext => ({
  userId: 'user-1',
  sessionId: 'session-1',
  requestId: 'req-1',
  ...overrides,
});

// ============================================================================
// TESTS
// ============================================================================

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;
  let mockAuditStore: AuditStore;
  let config: AuditLoggerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuditStore = createMockAuditStore();
    config = {
      auditStore: mockAuditStore,
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      minLevel: LogLevelEnum.DEBUG,
      includePayloads: true,
    };
    auditLogger = new AuditLogger(config);
  });

  describe('constructor', () => {
    it('should create an AuditLogger instance', () => {
      expect(auditLogger).toBeInstanceOf(AuditLogger);
    });

    it('should use console as default logger', () => {
      const logger = new AuditLogger({
        auditStore: mockAuditStore,
      });
      expect(logger).toBeInstanceOf(AuditLogger);
    });
  });

  describe('createAuditLogger factory', () => {
    it('should create an AuditLogger using factory function', () => {
      const instance = createAuditLogger(config);
      expect(instance).toBeInstanceOf(AuditLogger);
    });
  });

  describe('log', () => {
    it('should log an entry to the store', async () => {
      const context = createMockContext();
      const entry = await auditLogger.log(
        LogLevelEnum.INFO,
        'tool_invoked',
        context,
        { toolId: 'tool-1' }
      );

      expect(entry).toBeDefined();
      expect(entry?.level).toBe(LogLevelEnum.INFO);
      expect(entry?.action).toBe('tool_invoked');
      expect(mockAuditStore.log).toHaveBeenCalled();
    });

    it('should filter entries below minimum level', async () => {
      const loggerWithHighLevel = new AuditLogger({
        ...config,
        minLevel: LogLevelEnum.ERROR,
      });

      const context = createMockContext();
      const entry = await loggerWithHighLevel.log(
        LogLevelEnum.DEBUG,
        'tool_invoked',
        context
      );

      expect(entry).toBeNull();
      expect(mockAuditStore.log).not.toHaveBeenCalled();
    });

    it('should include payloads when enabled', async () => {
      const context = createMockContext();
      await auditLogger.log(
        LogLevelEnum.INFO,
        'tool_invoked',
        context,
        { input: { test: 'data' }, output: { result: 'ok' } }
      );

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          input: { test: 'data' },
          output: { result: 'ok' },
        })
      );
    });

    it('should exclude payloads when disabled', async () => {
      const loggerNoPayloads = new AuditLogger({
        ...config,
        includePayloads: false,
      });

      const context = createMockContext();
      await loggerNoPayloads.log(
        LogLevelEnum.INFO,
        'tool_invoked',
        context,
        { input: { test: 'data' } }
      );

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.not.objectContaining({
          input: expect.anything(),
        })
      );
    });
  });

  describe('level helpers', () => {
    it('should log debug level', async () => {
      const context = createMockContext();
      const entry = await auditLogger.debug('tool_invoked', context);

      expect(entry?.level).toBe(LogLevelEnum.DEBUG);
    });

    it('should log info level', async () => {
      const context = createMockContext();
      const entry = await auditLogger.info('tool_invoked', context);

      expect(entry?.level).toBe(LogLevelEnum.INFO);
    });

    it('should log warning level', async () => {
      const context = createMockContext();
      const entry = await auditLogger.warn('permission_denied', context);

      expect(entry?.level).toBe(LogLevelEnum.WARNING);
    });

    it('should log error level', async () => {
      const context = createMockContext();
      const entry = await auditLogger.error('execution_failed', context);

      expect(entry?.level).toBe(LogLevelEnum.ERROR);
    });

    it('should log critical level', async () => {
      const context = createMockContext();
      const entry = await auditLogger.critical('execution_failed', context);

      expect(entry?.level).toBe(LogLevelEnum.CRITICAL);
    });
  });

  describe('tool lifecycle logging', () => {
    it('should log tool registration', async () => {
      const tool = createMockTool();
      const context = createMockContext();

      await auditLogger.logToolRegistered(tool, context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'tool_registered',
          toolId: tool.id,
        })
      );
    });

    it('should log tool invocation', async () => {
      const invocation = createMockInvocation();
      const context = createMockContext();

      await auditLogger.logToolInvoked(invocation, context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'tool_invoked',
          toolId: invocation.toolId,
          invocationId: invocation.id,
        })
      );
    });

    it('should log execution start', async () => {
      const invocation = createMockInvocation();
      const context = createMockContext();

      await auditLogger.logExecutionStarted(invocation, context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'execution_started',
        })
      );
    });

    it('should log execution success', async () => {
      const invocation = createMockInvocation({
        result: { success: true, output: 'done' },
      });
      const context = createMockContext();

      await auditLogger.logExecutionSuccess(invocation, context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'execution_success',
        })
      );
    });

    it('should log execution failure', async () => {
      const invocation = createMockInvocation();
      const error: ToolError = {
        code: 'TEST_ERROR',
        message: 'Test failure',
        recoverable: false,
      };
      const context = createMockContext();

      await auditLogger.logExecutionFailed(invocation, error, context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'execution_failed',
          level: LogLevelEnum.ERROR,
          error,
        })
      );
    });

    it('should log permission denied', async () => {
      const context = createMockContext();

      await auditLogger.logPermissionDenied('tool-1', 'Insufficient permissions', context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'permission_denied',
          level: LogLevelEnum.WARNING,
        })
      );
    });

    it('should log confirmation requested', async () => {
      const invocation = createMockInvocation();
      const context = createMockContext();

      await auditLogger.logConfirmationRequested(invocation, context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'confirmation_requested',
        })
      );
    });

    it('should log confirmation granted', async () => {
      const invocation = createMockInvocation();
      const context = createMockContext();

      await auditLogger.logConfirmationGranted(invocation, context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'confirmation_granted',
        })
      );
    });

    it('should log confirmation denied', async () => {
      const invocation = createMockInvocation();
      const context = createMockContext();

      await auditLogger.logConfirmationDenied(invocation, context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'confirmation_denied',
        })
      );
    });

    it('should log rate limit exceeded', async () => {
      const context = createMockContext();

      await auditLogger.logRateLimitExceeded('tool-1', context);

      expect(mockAuditStore.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'rate_limit_exceeded',
          level: LogLevelEnum.WARNING,
        })
      );
    });
  });

  describe('querying', () => {
    it('should query audit logs', async () => {
      const context = createMockContext();
      await auditLogger.info('tool_invoked', context);
      await auditLogger.info('execution_success', context);

      const results = await auditLogger.query({ userId: 'user-1' });

      expect(results).toBeDefined();
      expect(mockAuditStore.query).toHaveBeenCalled();
    });

    it('should count audit logs', async () => {
      const count = await auditLogger.count({ userId: 'user-1' });

      expect(typeof count).toBe('number');
      expect(mockAuditStore.count).toHaveBeenCalled();
    });

    it('should get recent user activity', async () => {
      const results = await auditLogger.getRecentUserActivity('user-1', 10);

      expect(mockAuditStore.query).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          limit: 10,
        })
      );
    });

    it('should get recent tool activity', async () => {
      const results = await auditLogger.getRecentToolActivity('tool-1', 20);

      expect(mockAuditStore.query).toHaveBeenCalledWith(
        expect.objectContaining({
          toolId: 'tool-1',
          limit: 20,
        })
      );
    });

    it('should get errors within date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');

      await auditLogger.getErrors(startDate, endDate, 50);

      expect(mockAuditStore.query).toHaveBeenCalledWith(
        expect.objectContaining({
          level: [LogLevelEnum.ERROR, LogLevelEnum.CRITICAL],
          startDate,
          endDate,
          limit: 50,
        })
      );
    });
  });

  describe('reporting', () => {
    beforeEach(async () => {
      const context = createMockContext();
      // Add some test entries
      await auditLogger.info('tool_invoked', context, { toolId: 'tool-1' });
      await auditLogger.info('execution_success', context, { toolId: 'tool-1' });
      await auditLogger.error('execution_failed', context, {
        toolId: 'tool-2',
        error: { code: 'ERR', message: 'fail', recoverable: false },
      });
    });

    it('should generate summary report', async () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date();

      const report = await auditLogger.generateSummaryReport(startDate, endDate);

      expect(report).toBeDefined();
      expect(report.period.startDate).toEqual(startDate);
      expect(report.period.endDate).toEqual(endDate);
      expect(report.totalEntries).toBeGreaterThanOrEqual(0);
      expect(report.byLevel).toBeDefined();
      expect(report.byAction).toBeDefined();
      expect(report.topTools).toBeDefined();
      expect(report.topUsers).toBeDefined();
      expect(typeof report.errorRate).toBe('number');
    });

    it('should generate user activity report', async () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date();

      const report = await auditLogger.generateUserActivityReport(
        'user-1',
        startDate,
        endDate
      );

      expect(report).toBeDefined();
      expect(report.userId).toBe('user-1');
      expect(report.totalActions).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.toolsUsed)).toBe(true);
      expect(typeof report.successfulExecutions).toBe('number');
      expect(typeof report.failedExecutions).toBe('number');
      expect(typeof report.deniedExecutions).toBe('number');
    });

    it('should generate tool usage report', async () => {
      const startDate = new Date(Date.now() - 86400000);
      const endDate = new Date();

      const report = await auditLogger.generateToolUsageReport(
        'tool-1',
        startDate,
        endDate
      );

      expect(report).toBeDefined();
      expect(report.toolId).toBe('tool-1');
      expect(typeof report.totalInvocations).toBe('number');
      expect(typeof report.uniqueUsers).toBe('number');
      expect(typeof report.successRate).toBe('number');
      expect(Array.isArray(report.errorBreakdown)).toBe(true);
      expect(Array.isArray(report.usageByDay)).toBe(true);
    });
  });
});
