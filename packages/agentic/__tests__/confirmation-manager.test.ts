/**
 * @sam-ai/agentic - ConfirmationManager Tests
 * Comprehensive tests for user confirmation handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ConfirmationManager,
  createConfirmationManager,
  type ConfirmationManagerConfig,
} from '../src/tool-registry/confirmation-manager';
import type {
  ConfirmationStore,
  ConfirmationRequest,
  ToolInvocation,
  ToolDefinition,
} from '../src/tool-registry/types';
import {
  ConfirmationType,
  ToolExecutionStatus,
  ToolCategory,
  PermissionLevel,
} from '../src/tool-registry/types';
import { z } from 'zod';

// ============================================================================
// MOCKS
// ============================================================================

const createMockConfirmationStore = (): ConfirmationStore => {
  const requests: ConfirmationRequest[] = [];

  return {
    create: vi.fn().mockImplementation((request) => {
      const newRequest: ConfirmationRequest = {
        ...request,
        id: `confirm-${requests.length + 1}`,
        createdAt: new Date(),
      };
      requests.push(newRequest);
      return Promise.resolve(newRequest);
    }),
    get: vi.fn().mockImplementation((requestId) => {
      return Promise.resolve(requests.find((r) => r.id === requestId) ?? null);
    }),
    getByInvocation: vi.fn().mockImplementation((invocationId) => {
      return Promise.resolve(
        requests.find((r) => r.invocationId === invocationId) ?? null
      );
    }),
    respond: vi.fn().mockImplementation((requestId, confirmed) => {
      const request = requests.find((r) => r.id === requestId);
      if (request) {
        request.status = confirmed ? 'confirmed' : 'denied';
        request.respondedAt = new Date();
      }
      return Promise.resolve(request as ConfirmationRequest);
    }),
    getPending: vi.fn().mockImplementation((userId) => {
      return Promise.resolve(
        requests.filter((r) => r.userId === userId && r.status === 'pending')
      );
    }),
  };
};

const createMockInvocation = (overrides?: Partial<ToolInvocation>): ToolInvocation => ({
  id: 'inv-1',
  toolId: 'tool-1',
  userId: 'user-1',
  sessionId: 'session-1',
  input: { test: 'data' },
  status: ToolExecutionStatus.PENDING,
  confirmationType: ConfirmationType.EXPLICIT,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockTool = (overrides?: Partial<ToolDefinition>): ToolDefinition => ({
  id: 'tool-1',
  name: 'Test Tool',
  description: 'A test tool for testing',
  category: ToolCategory.CONTENT,
  version: '1.0.0',
  inputSchema: z.object({}),
  requiredPermissions: [PermissionLevel.EXECUTE],
  confirmationType: ConfirmationType.EXPLICIT,
  handler: vi.fn(),
  enabled: true,
  ...overrides,
});

// ============================================================================
// TESTS
// ============================================================================

describe('ConfirmationManager', () => {
  let confirmationManager: ConfirmationManager;
  let mockConfirmationStore: ConfirmationStore;
  let config: ConfirmationManagerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockConfirmationStore = createMockConfirmationStore();
    config = {
      confirmationStore: mockConfirmationStore,
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      defaultTimeoutSeconds: 60,
    };
    confirmationManager = new ConfirmationManager(config);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create a ConfirmationManager instance', () => {
      expect(confirmationManager).toBeInstanceOf(ConfirmationManager);
    });

    it('should use console as default logger', () => {
      const manager = new ConfirmationManager({
        confirmationStore: mockConfirmationStore,
      });
      expect(manager).toBeInstanceOf(ConfirmationManager);
    });
  });

  describe('createConfirmationManager factory', () => {
    it('should create a ConfirmationManager using factory function', () => {
      const instance = createConfirmationManager(config);
      expect(instance).toBeInstanceOf(ConfirmationManager);
    });
  });

  describe('requiresConfirmation', () => {
    it('should return true for explicit confirmation', () => {
      const tool = createMockTool({ confirmationType: ConfirmationType.EXPLICIT });
      expect(confirmationManager.requiresConfirmation(tool)).toBe(true);
    });

    it('should return true for critical confirmation', () => {
      const tool = createMockTool({ confirmationType: ConfirmationType.CRITICAL });
      expect(confirmationManager.requiresConfirmation(tool)).toBe(true);
    });

    it('should return true for implicit confirmation', () => {
      const tool = createMockTool({ confirmationType: ConfirmationType.IMPLICIT });
      expect(confirmationManager.requiresConfirmation(tool)).toBe(true);
    });

    it('should return false for no confirmation', () => {
      const tool = createMockTool({ confirmationType: ConfirmationType.NONE });
      expect(confirmationManager.requiresConfirmation(tool)).toBe(false);
    });
  });

  describe('requiresExplicitConfirmation', () => {
    it('should return true for explicit type', () => {
      expect(
        confirmationManager.requiresExplicitConfirmation(ConfirmationType.EXPLICIT)
      ).toBe(true);
    });

    it('should return true for critical type', () => {
      expect(
        confirmationManager.requiresExplicitConfirmation(ConfirmationType.CRITICAL)
      ).toBe(true);
    });

    it('should return false for implicit type', () => {
      expect(
        confirmationManager.requiresExplicitConfirmation(ConfirmationType.IMPLICIT)
      ).toBe(false);
    });

    it('should return false for none type', () => {
      expect(
        confirmationManager.requiresExplicitConfirmation(ConfirmationType.NONE)
      ).toBe(false);
    });
  });

  describe('getSeverityForType', () => {
    it('should return low for implicit', () => {
      expect(confirmationManager.getSeverityForType(ConfirmationType.IMPLICIT)).toBe(
        'low'
      );
    });

    it('should return medium for explicit', () => {
      expect(confirmationManager.getSeverityForType(ConfirmationType.EXPLICIT)).toBe(
        'medium'
      );
    });

    it('should return critical for critical', () => {
      expect(confirmationManager.getSeverityForType(ConfirmationType.CRITICAL)).toBe(
        'critical'
      );
    });
  });

  describe('createConfirmationRequest', () => {
    it('should create a confirmation request', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool();

      const request = await confirmationManager.createConfirmationRequest(
        invocation,
        tool
      );

      expect(request).toBeDefined();
      expect(request.invocationId).toBe(invocation.id);
      expect(request.toolId).toBe(tool.id);
      expect(request.status).toBe('pending');
      expect(mockConfirmationStore.create).toHaveBeenCalled();
    });

    it('should use custom options', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool();

      const request = await confirmationManager.createConfirmationRequest(
        invocation,
        tool,
        {
          title: 'Custom Title',
          message: 'Custom message',
          severity: 'high',
          confirmText: 'Yes',
          cancelText: 'No',
        }
      );

      expect(request.title).toBe('Custom Title');
      expect(request.severity).toBe('high');
      expect(request.confirmText).toBe('Yes');
      expect(request.cancelText).toBe('No');
    });

    it('should call onConfirmationRequested callback', async () => {
      const onRequested = vi.fn();
      const manager = new ConfirmationManager({
        ...config,
        onConfirmationRequested: onRequested,
      });

      const invocation = createMockInvocation();
      const tool = createMockTool();

      await manager.createConfirmationRequest(invocation, tool);

      expect(onRequested).toHaveBeenCalled();
    });
  });

  describe('getRequest', () => {
    it('should get a confirmation request by ID', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool();
      const created = await confirmationManager.createConfirmationRequest(
        invocation,
        tool
      );

      const request = await confirmationManager.getRequest(created.id);

      expect(request).toBeDefined();
      expect(request?.id).toBe(created.id);
    });

    it('should return null for non-existent request', async () => {
      const request = await confirmationManager.getRequest('non-existent');

      expect(request).toBeNull();
    });
  });

  describe('getRequestByInvocation', () => {
    it('should get request by invocation ID', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool();
      await confirmationManager.createConfirmationRequest(invocation, tool);

      const request = await confirmationManager.getRequestByInvocation(invocation.id);

      expect(request).toBeDefined();
      expect(request?.invocationId).toBe(invocation.id);
    });
  });

  describe('getPendingRequests', () => {
    it('should get pending requests for a user', async () => {
      const invocation = createMockInvocation({ userId: 'user-1' });
      const tool = createMockTool();
      await confirmationManager.createConfirmationRequest(invocation, tool);

      const pending = await confirmationManager.getPendingRequests('user-1');

      expect(pending.length).toBeGreaterThan(0);
    });
  });

  describe('respond', () => {
    it('should confirm a request', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool();
      const created = await confirmationManager.createConfirmationRequest(
        invocation,
        tool
      );

      const confirmed = await confirmationManager.respond(created.id, true);

      expect(confirmed.status).toBe('confirmed');
      expect(mockConfirmationStore.respond).toHaveBeenCalledWith(created.id, true);
    });

    it('should deny a request', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool();
      const created = await confirmationManager.createConfirmationRequest(
        invocation,
        tool
      );

      const denied = await confirmationManager.respond(created.id, false);

      expect(denied.status).toBe('denied');
      expect(mockConfirmationStore.respond).toHaveBeenCalledWith(created.id, false);
    });

    it('should call onConfirmationResolved callback', async () => {
      const onResolved = vi.fn();
      const manager = new ConfirmationManager({
        ...config,
        onConfirmationResolved: onResolved,
      });

      const invocation = createMockInvocation();
      const tool = createMockTool();
      const created = await manager.createConfirmationRequest(invocation, tool);

      await manager.respond(created.id, true);

      expect(onResolved).toHaveBeenCalledWith(
        expect.objectContaining({ id: created.id }),
        true
      );
    });
  });

  describe('confirm', () => {
    it('should be shorthand for respond(id, true)', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool();
      const created = await confirmationManager.createConfirmationRequest(
        invocation,
        tool
      );

      const confirmed = await confirmationManager.confirm(created.id);

      expect(confirmed.status).toBe('confirmed');
    });
  });

  describe('deny', () => {
    it('should be shorthand for respond(id, false)', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool();
      const created = await confirmationManager.createConfirmationRequest(
        invocation,
        tool
      );

      const denied = await confirmationManager.deny(created.id);

      expect(denied.status).toBe('denied');
    });
  });

  describe('autoConfirmImplicit', () => {
    it('should auto-confirm implicit confirmation types', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool({ confirmationType: ConfirmationType.IMPLICIT });

      const confirmed = await confirmationManager.autoConfirmImplicit(invocation, tool);

      expect(confirmed).toBeDefined();
      expect(confirmed?.status).toBe('confirmed');
    });

    it('should return null for non-implicit types', async () => {
      const invocation = createMockInvocation();
      const tool = createMockTool({ confirmationType: ConfirmationType.EXPLICIT });

      const result = await confirmationManager.autoConfirmImplicit(invocation, tool);

      expect(result).toBeNull();
    });
  });

  describe('confirmAllPending', () => {
    it('should confirm all pending requests for a user', async () => {
      const tool = createMockTool();
      await confirmationManager.createConfirmationRequest(
        createMockInvocation({ id: 'inv-1', userId: 'user-1' }),
        tool
      );
      await confirmationManager.createConfirmationRequest(
        createMockInvocation({ id: 'inv-2', userId: 'user-1' }),
        tool
      );

      const confirmed = await confirmationManager.confirmAllPending('user-1');

      expect(confirmed.length).toBe(2);
      confirmed.forEach((r) => {
        expect(r.status).toBe('confirmed');
      });
    });
  });

  describe('denyAllPending', () => {
    it('should deny all pending requests for a user', async () => {
      const tool = createMockTool();
      await confirmationManager.createConfirmationRequest(
        createMockInvocation({ id: 'inv-1', userId: 'user-1' }),
        tool
      );
      await confirmationManager.createConfirmationRequest(
        createMockInvocation({ id: 'inv-2', userId: 'user-1' }),
        tool
      );

      const denied = await confirmationManager.denyAllPending('user-1');

      expect(denied.length).toBe(2);
      denied.forEach((r) => {
        expect(r.status).toBe('denied');
      });
    });
  });

  describe('isExpired', () => {
    it('should return true if status is expired', () => {
      const request: ConfirmationRequest = {
        id: 'req-1',
        invocationId: 'inv-1',
        toolId: 'tool-1',
        toolName: 'Test',
        userId: 'user-1',
        title: 'Test',
        message: 'Test',
        type: ConfirmationType.EXPLICIT,
        severity: 'medium',
        status: 'expired',
        createdAt: new Date(),
      };

      expect(confirmationManager.isExpired(request)).toBe(true);
    });

    it('should return true if expiresAt has passed', () => {
      const request: ConfirmationRequest = {
        id: 'req-1',
        invocationId: 'inv-1',
        toolId: 'tool-1',
        toolName: 'Test',
        userId: 'user-1',
        title: 'Test',
        message: 'Test',
        type: ConfirmationType.EXPLICIT,
        severity: 'medium',
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() - 10000), // 10 seconds ago
      };

      expect(confirmationManager.isExpired(request)).toBe(true);
    });

    it('should return false if not expired', () => {
      const request: ConfirmationRequest = {
        id: 'req-1',
        invocationId: 'inv-1',
        toolId: 'tool-1',
        toolName: 'Test',
        userId: 'user-1',
        title: 'Test',
        message: 'Test',
        type: ConfirmationType.EXPLICIT,
        severity: 'medium',
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60000), // 1 minute from now
      };

      expect(confirmationManager.isExpired(request)).toBe(false);
    });
  });

  describe('getRemainingTime', () => {
    it('should return remaining seconds', () => {
      const request: ConfirmationRequest = {
        id: 'req-1',
        invocationId: 'inv-1',
        toolId: 'tool-1',
        toolName: 'Test',
        userId: 'user-1',
        title: 'Test',
        message: 'Test',
        type: ConfirmationType.EXPLICIT,
        severity: 'medium',
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30000), // 30 seconds from now
      };

      const remaining = confirmationManager.getRemainingTime(request);

      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(30);
    });

    it('should return 0 if already resolved', () => {
      const request: ConfirmationRequest = {
        id: 'req-1',
        invocationId: 'inv-1',
        toolId: 'tool-1',
        toolName: 'Test',
        userId: 'user-1',
        title: 'Test',
        message: 'Test',
        type: ConfirmationType.EXPLICIT,
        severity: 'medium',
        status: 'confirmed',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      expect(confirmationManager.getRemainingTime(request)).toBe(0);
    });
  });
});
