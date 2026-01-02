/**
 * @sam-ai/agentic - PermissionManager Tests
 * Comprehensive tests for RBAC-based permission management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PermissionManager,
  createPermissionManager,
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  type PermissionManagerConfig,
} from '../src/tool-registry/permission-manager';
import type {
  PermissionStore,
  UserPermission,
  PermissionLevel,
  PermissionCheckResult,
  ToolDefinition,
  ToolCategory,
} from '../src/tool-registry/types';
import {
  PermissionLevel as PermissionLevelEnum,
  ToolCategory as ToolCategoryEnum,
  ConfirmationType,
} from '../src/tool-registry/types';
import { z } from 'zod';

// ============================================================================
// MOCKS
// ============================================================================

const createMockPermissionStore = (): PermissionStore => {
  const permissions: UserPermission[] = [];

  return {
    grant: vi.fn().mockImplementation((permission) => {
      const newPermission = {
        ...permission,
        grantedAt: new Date(),
      };
      permissions.push(newPermission);
      return Promise.resolve(newPermission);
    }),
    revoke: vi.fn().mockImplementation((userId, toolId, category) => {
      const index = permissions.findIndex(
        (p) =>
          p.userId === userId &&
          (toolId === undefined || p.toolId === toolId) &&
          (category === undefined || p.category === category)
      );
      if (index >= 0) {
        permissions.splice(index, 1);
      }
      return Promise.resolve();
    }),
    check: vi.fn().mockImplementation((userId, toolId, requiredLevels) => {
      const userPermissions = permissions.filter((p) => p.userId === userId);
      const grantedLevels = new Set<PermissionLevel>();

      for (const p of userPermissions) {
        if (!p.toolId || p.toolId === toolId) {
          for (const level of p.levels) {
            grantedLevels.add(level);
          }
        }
      }

      const missingLevels = requiredLevels.filter((l) => !grantedLevels.has(l));
      return Promise.resolve({
        granted: missingLevels.length === 0,
        grantedLevels: Array.from(grantedLevels),
        missingLevels,
        reason: missingLevels.length > 0 ? 'Missing permissions' : undefined,
      } as PermissionCheckResult);
    }),
    getUserPermissions: vi.fn().mockImplementation((userId) => {
      return Promise.resolve(permissions.filter((p) => p.userId === userId));
    }),
  };
};

const createMockTool = (overrides?: Partial<ToolDefinition>): ToolDefinition => ({
  id: 'test-tool',
  name: 'Test Tool',
  description: 'A test tool',
  category: ToolCategoryEnum.CONTENT,
  version: '1.0.0',
  inputSchema: z.object({}),
  requiredPermissions: [PermissionLevelEnum.EXECUTE],
  confirmationType: ConfirmationType.NONE,
  handler: vi.fn(),
  enabled: true,
  ...overrides,
});

// ============================================================================
// TESTS
// ============================================================================

describe('PermissionManager', () => {
  let permissionManager: PermissionManager;
  let mockPermissionStore: PermissionStore;
  let config: PermissionManagerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPermissionStore = createMockPermissionStore();
    config = {
      permissionStore: mockPermissionStore,
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };
    permissionManager = new PermissionManager(config);
  });

  describe('constructor', () => {
    it('should create a PermissionManager instance', () => {
      expect(permissionManager).toBeInstanceOf(PermissionManager);
    });

    it('should use console as default logger', () => {
      const manager = new PermissionManager({
        permissionStore: mockPermissionStore,
      });
      expect(manager).toBeInstanceOf(PermissionManager);
    });
  });

  describe('createPermissionManager factory', () => {
    it('should create a PermissionManager using factory function', () => {
      const instance = createPermissionManager(config);
      expect(instance).toBeInstanceOf(PermissionManager);
    });
  });

  describe('checkToolPermission', () => {
    it('should check tool permission via store', async () => {
      const tool = createMockTool();
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.EXECUTE]);

      const result = await permissionManager.checkToolPermission('user-1', tool);

      expect(result.granted).toBe(true);
      expect(mockPermissionStore.check).toHaveBeenCalled();
    });

    it('should deny permission if not granted', async () => {
      const tool = createMockTool();

      const result = await permissionManager.checkToolPermission('user-1', tool);

      expect(result.granted).toBe(false);
    });

    it('should cache permission results', async () => {
      const tool = createMockTool();
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.EXECUTE]);

      await permissionManager.checkToolPermission('user-1', tool);
      await permissionManager.checkToolPermission('user-1', tool);

      // Second call should use cache
      expect(mockPermissionStore.check).toHaveBeenCalledTimes(1);
    });
  });

  describe('hasPermission', () => {
    it('should check if user has specific permission levels', async () => {
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.READ]);

      const result = await permissionManager.hasPermission(
        'user-1',
        [PermissionLevelEnum.READ]
      );

      expect(result).toBe(true);
    });

    it('should return false if user lacks required permission', async () => {
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.READ]);

      const result = await permissionManager.hasPermission(
        'user-1',
        [PermissionLevelEnum.ADMIN]
      );

      expect(result).toBe(false);
    });

    it('should check permission for specific tool', async () => {
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.EXECUTE], {
        toolId: 'specific-tool',
      });

      const result = await permissionManager.hasPermission(
        'user-1',
        [PermissionLevelEnum.EXECUTE],
        'specific-tool'
      );

      expect(result).toBe(true);
    });
  });

  describe('isAdmin', () => {
    it('should return true if user has admin permission', async () => {
      await permissionManager.grantPermission('admin-1', [PermissionLevelEnum.ADMIN]);

      const result = await permissionManager.isAdmin('admin-1');

      expect(result).toBe(true);
    });

    it('should return false if user lacks admin permission', async () => {
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.EXECUTE]);

      const result = await permissionManager.isAdmin('user-1');

      expect(result).toBe(false);
    });
  });

  describe('grantPermission', () => {
    it('should grant permissions to a user', async () => {
      const result = await permissionManager.grantPermission(
        'user-1',
        [PermissionLevelEnum.READ, PermissionLevelEnum.WRITE]
      );

      expect(result.userId).toBe('user-1');
      expect(result.levels).toContain(PermissionLevelEnum.READ);
      expect(result.levels).toContain(PermissionLevelEnum.WRITE);
      expect(mockPermissionStore.grant).toHaveBeenCalled();
    });

    it('should grant tool-specific permissions', async () => {
      await permissionManager.grantPermission(
        'user-1',
        [PermissionLevelEnum.EXECUTE],
        { toolId: 'specific-tool' }
      );

      expect(mockPermissionStore.grant).toHaveBeenCalledWith(
        expect.objectContaining({
          toolId: 'specific-tool',
        })
      );
    });

    it('should grant category-specific permissions', async () => {
      await permissionManager.grantPermission(
        'user-1',
        [PermissionLevelEnum.READ],
        { category: ToolCategoryEnum.CONTENT }
      );

      expect(mockPermissionStore.grant).toHaveBeenCalledWith(
        expect.objectContaining({
          category: ToolCategoryEnum.CONTENT,
        })
      );
    });

    it('should invalidate cache after granting', async () => {
      const tool = createMockTool();

      await permissionManager.checkToolPermission('user-1', tool);
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.EXECUTE]);
      await permissionManager.checkToolPermission('user-1', tool);

      // Cache should have been invalidated, so check should be called twice
      expect(mockPermissionStore.check).toHaveBeenCalledTimes(2);
    });
  });

  describe('grantBatch', () => {
    it('should grant multiple permissions in batch', async () => {
      const grants = [
        { userId: 'user-1', levels: [PermissionLevelEnum.READ] as PermissionLevel[] },
        { userId: 'user-2', levels: [PermissionLevelEnum.WRITE] as PermissionLevel[] },
      ];

      const results = await permissionManager.grantBatch(grants);

      expect(results).toHaveLength(2);
      expect(mockPermissionStore.grant).toHaveBeenCalledTimes(2);
    });
  });

  describe('setRolePermissions', () => {
    it('should set default permissions for student role', async () => {
      const results = await permissionManager.setRolePermissions('user-1', UserRole.STUDENT);

      expect(results.length).toBeGreaterThan(0);
      expect(mockPermissionStore.grant).toHaveBeenCalled();
    });

    it('should set default permissions for admin role', async () => {
      const results = await permissionManager.setRolePermissions('admin-1', UserRole.ADMIN);

      expect(results.length).toBeGreaterThan(0);
      // Admin should have admin permission
      const hasAdmin = results.some((p) => p.levels.includes(PermissionLevelEnum.ADMIN));
      expect(hasAdmin).toBe(true);
    });

    it('should throw error for unknown role', async () => {
      await expect(
        permissionManager.setRolePermissions('user-1', 'unknown' as UserRole)
      ).rejects.toThrow('Unknown role');
    });
  });

  describe('revokePermission', () => {
    it('should revoke permissions from a user', async () => {
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.READ]);
      await permissionManager.revokePermission('user-1');

      expect(mockPermissionStore.revoke).toHaveBeenCalledWith('user-1', undefined, undefined);
    });

    it('should revoke tool-specific permissions', async () => {
      await permissionManager.revokePermission('user-1', 'specific-tool');

      expect(mockPermissionStore.revoke).toHaveBeenCalledWith(
        'user-1',
        'specific-tool',
        undefined
      );
    });

    it('should invalidate cache after revoking', async () => {
      const tool = createMockTool();
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.EXECUTE]);

      await permissionManager.checkToolPermission('user-1', tool);
      await permissionManager.revokePermission('user-1');
      await permissionManager.checkToolPermission('user-1', tool);

      // Cache should have been invalidated
      expect(mockPermissionStore.check).toHaveBeenCalledTimes(2);
    });
  });

  describe('revokeAll', () => {
    it('should revoke all permissions from a user', async () => {
      await permissionManager.revokeAll('user-1');

      expect(mockPermissionStore.revoke).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getUserPermissions', () => {
    it('should get all permissions for a user', async () => {
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.READ]);
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.WRITE]);

      const permissions = await permissionManager.getUserPermissions('user-1');

      expect(permissions.length).toBe(2);
    });
  });

  describe('getEffectivePermissions', () => {
    it('should get effective permissions for a tool', async () => {
      const tool = createMockTool({ category: ToolCategoryEnum.CONTENT });
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.READ]);
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.EXECUTE], {
        category: ToolCategoryEnum.CONTENT,
      });

      const effective = await permissionManager.getEffectivePermissions('user-1', tool);

      expect(effective).toContain(PermissionLevelEnum.READ);
      expect(effective).toContain(PermissionLevelEnum.EXECUTE);
    });
  });

  describe('getAccessibleTools', () => {
    it('should filter tools user can access', async () => {
      const tools = [
        createMockTool({ id: 'tool-1', requiredPermissions: [PermissionLevelEnum.READ] }),
        createMockTool({ id: 'tool-2', requiredPermissions: [PermissionLevelEnum.ADMIN] }),
      ];

      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.READ]);

      const accessible = await permissionManager.getAccessibleTools('user-1', tools);

      expect(accessible).toHaveLength(1);
      expect(accessible[0].id).toBe('tool-1');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached permissions', async () => {
      const tool = createMockTool();
      await permissionManager.grantPermission('user-1', [PermissionLevelEnum.EXECUTE]);

      await permissionManager.checkToolPermission('user-1', tool);
      permissionManager.clearCache();
      await permissionManager.checkToolPermission('user-1', tool);

      expect(mockPermissionStore.check).toHaveBeenCalledTimes(2);
    });
  });

  describe('DEFAULT_ROLE_PERMISSIONS', () => {
    it('should have permissions defined for all roles', () => {
      const roles = Object.values(UserRole);
      for (const role of roles) {
        const mapping = DEFAULT_ROLE_PERMISSIONS.find((m) => m.role === role);
        expect(mapping).toBeDefined();
        expect(mapping?.defaultPermissions).toBeDefined();
      }
    });
  });
});
