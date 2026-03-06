/**
 * Tests for lib/permissions.ts
 * Covers Permission enum, PermissionManager class, and usePermission hook.
 */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Database mock is provided by __mocks__/db.js via moduleNameMapper.
// We add missing models that the auto-mock does not include.

import { Permission, PermissionManager } from '@/lib/permissions';
import { db } from '@/lib/db';

// Extend the auto-mocked db with models needed by permissions.ts
// The auto-mock includes user, course, enrollment, post but not comment,
// permission, userPermission, or enhancedAuditLog with the needed shape.
const mockDb = db as Record<string, Record<string, jest.Mock>>;

// Ensure all required models exist with the correct mock methods
beforeAll(() => {
  if (!mockDb.comment) {
    mockDb.comment = {
      findUnique: jest.fn(),
    };
  }
  if (!mockDb.permission) {
    mockDb.permission = {
      findUnique: jest.fn(),
      create: jest.fn(),
    };
  }
  if (!mockDb.userPermission) {
    mockDb.userPermission = {
      upsert: jest.fn(),
      updateMany: jest.fn(),
    };
  }
  if (!mockDb.enhancedAuditLog) {
    mockDb.enhancedAuditLog = {
      create: jest.fn(),
    };
  }
});

describe('Permission enum', () => {
  it('contains all expected course permissions', () => {
    expect(Permission.COURSE_CREATE).toBe('COURSE_CREATE');
    expect(Permission.COURSE_EDIT_OWN).toBe('COURSE_EDIT_OWN');
    expect(Permission.COURSE_EDIT_ANY).toBe('COURSE_EDIT_ANY');
    expect(Permission.COURSE_DELETE_OWN).toBe('COURSE_DELETE_OWN');
    expect(Permission.COURSE_DELETE_ANY).toBe('COURSE_DELETE_ANY');
    expect(Permission.COURSE_PUBLISH).toBe('COURSE_PUBLISH');
    expect(Permission.COURSE_UNPUBLISH).toBe('COURSE_UNPUBLISH');
    expect(Permission.COURSE_PRICE_SET).toBe('COURSE_PRICE_SET');
  });

  it('contains all expected content permissions', () => {
    expect(Permission.CONTENT_MODERATE).toBe('CONTENT_MODERATE');
    expect(Permission.CONTENT_APPROVE).toBe('CONTENT_APPROVE');
    expect(Permission.CONTENT_FLAG).toBe('CONTENT_FLAG');
  });

  it('contains all expected user permissions', () => {
    expect(Permission.USER_VIEW_ANALYTICS).toBe('USER_VIEW_ANALYTICS');
    expect(Permission.USER_MANAGE_OWN).toBe('USER_MANAGE_OWN');
    expect(Permission.USER_MANAGE_ANY).toBe('USER_MANAGE_ANY');
    expect(Permission.USER_BAN).toBe('USER_BAN');
    expect(Permission.USER_VERIFY_INSTRUCTOR).toBe('USER_VERIFY_INSTRUCTOR');
  });

  it('contains all expected financial permissions', () => {
    expect(Permission.PAYMENT_RECEIVE).toBe('PAYMENT_RECEIVE');
    expect(Permission.PAYMENT_WITHDRAW).toBe('PAYMENT_WITHDRAW');
    expect(Permission.PAYMENT_VIEW_REPORTS).toBe('PAYMENT_VIEW_REPORTS');
    expect(Permission.PAYMENT_MANAGE_REFUNDS).toBe('PAYMENT_MANAGE_REFUNDS');
  });

  it('contains all expected platform permissions', () => {
    expect(Permission.PLATFORM_ADMIN).toBe('PLATFORM_ADMIN');
    expect(Permission.PLATFORM_ANALYTICS).toBe('PLATFORM_ANALYTICS');
    expect(Permission.PLATFORM_SETTINGS).toBe('PLATFORM_SETTINGS');
    expect(Permission.PLATFORM_AUDIT_LOGS).toBe('PLATFORM_AUDIT_LOGS');
  });

  it('contains the correct total number of permission values', () => {
    const values = Object.values(Permission);
    // 8 COURSE + 3 CONTENT + 5 USER + 4 PAYMENT + 4 PLATFORM = 24
    expect(values).toHaveLength(24);
  });
});

describe('PermissionManager.getRolePermissions', () => {
  it('returns an empty array for any role (deprecated)', () => {
    expect(PermissionManager.getRolePermissions('ADMIN')).toEqual([]);
    expect(PermissionManager.getRolePermissions('USER')).toEqual([]);
    expect(PermissionManager.getRolePermissions('TEACHER')).toEqual([]);
    expect(PermissionManager.getRolePermissions('')).toEqual([]);
  });
});

describe('PermissionManager.hasPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false if user is not found', async () => {
    mockDb.user.findUnique.mockResolvedValue(null);

    const result = await PermissionManager.hasPermission(
      'non-existent-user',
      Permission.COURSE_CREATE
    );

    expect(result).toBe(false);
  });

  it('returns false if user account is locked', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: true,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.COURSE_CREATE },
        },
      ],
    });

    const result = await PermissionManager.hasPermission(
      'locked-user',
      Permission.COURSE_CREATE
    );

    expect(result).toBe(false);
  });

  it('returns true if user has a granted, non-expired permission', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.COURSE_CREATE },
        },
      ],
    });

    const result = await PermissionManager.hasPermission(
      'user-1',
      Permission.COURSE_CREATE
    );

    expect(result).toBe(true);
  });

  it('returns false if the specific permission is not found in user permissions', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.CONTENT_MODERATE },
        },
      ],
    });

    const result = await PermissionManager.hasPermission(
      'user-1',
      Permission.COURSE_CREATE
    );

    expect(result).toBe(false);
  });

  it('returns false if permission has expired', async () => {
    const pastDate = new Date('2020-01-01T00:00:00Z');

    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: pastDate,
          permission: { name: Permission.COURSE_CREATE },
        },
      ],
    });

    const result = await PermissionManager.hasPermission(
      'user-1',
      Permission.COURSE_CREATE
    );

    expect(result).toBe(false);
  });

  it('returns true if permission has not yet expired', async () => {
    const futureDate = new Date('2099-12-31T23:59:59Z');

    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: futureDate,
          permission: { name: Permission.COURSE_CREATE },
        },
      ],
    });

    const result = await PermissionManager.hasPermission(
      'user-1',
      Permission.COURSE_CREATE
    );

    expect(result).toBe(true);
  });

  it('returns false on database error', async () => {
    mockDb.user.findUnique.mockRejectedValue(
      new Error('DB connection failed')
    );

    const result = await PermissionManager.hasPermission(
      'user-1',
      Permission.COURSE_CREATE
    );

    expect(result).toBe(false);
  });

  it('returns false if permission is found but not granted', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: false,
          expiresAt: null,
          permission: { name: Permission.COURSE_CREATE },
        },
      ],
    });

    const result = await PermissionManager.hasPermission(
      'user-1',
      Permission.COURSE_CREATE
    );

    expect(result).toBe(false);
  });
});

describe('PermissionManager.hasAnyPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true if at least one permission matches', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.CONTENT_MODERATE },
        },
      ],
    });

    const result = await PermissionManager.hasAnyPermission('user-1', [
      Permission.COURSE_CREATE,
      Permission.CONTENT_MODERATE,
    ]);

    expect(result).toBe(true);
  });

  it('returns false if no permissions match', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.PLATFORM_ADMIN },
        },
      ],
    });

    const result = await PermissionManager.hasAnyPermission('user-1', [
      Permission.COURSE_CREATE,
      Permission.CONTENT_MODERATE,
    ]);

    expect(result).toBe(false);
  });

  it('returns false for an empty permissions array', async () => {
    const result = await PermissionManager.hasAnyPermission('user-1', []);
    expect(result).toBe(false);
  });
});

describe('PermissionManager.hasAllPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true only if all permissions match', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.COURSE_CREATE },
        },
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.CONTENT_MODERATE },
        },
      ],
    });

    const result = await PermissionManager.hasAllPermissions('user-1', [
      Permission.COURSE_CREATE,
      Permission.CONTENT_MODERATE,
    ]);

    expect(result).toBe(true);
  });

  it('returns false if any one permission is missing', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.COURSE_CREATE },
        },
      ],
    });

    const result = await PermissionManager.hasAllPermissions('user-1', [
      Permission.COURSE_CREATE,
      Permission.CONTENT_MODERATE,
    ]);

    expect(result).toBe(false);
  });

  it('returns true for an empty permissions array', async () => {
    const result = await PermissionManager.hasAllPermissions('user-1', []);
    expect(result).toBe(true);
  });
});

describe('PermissionManager.ownsResource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when user owns the course', async () => {
    mockDb.course.findUnique.mockResolvedValue({
      userId: 'user-1',
    });

    const result = await PermissionManager.ownsResource(
      'user-1',
      'course',
      'course-1'
    );

    expect(result).toBe(true);
    expect(mockDb.course.findUnique).toHaveBeenCalledWith({
      where: { id: 'course-1' },
      select: { userId: true },
    });
  });

  it('returns false when user does not own the course', async () => {
    mockDb.course.findUnique.mockResolvedValue({
      userId: 'other-user',
    });

    const result = await PermissionManager.ownsResource(
      'user-1',
      'course',
      'course-1'
    );

    expect(result).toBe(false);
  });

  it('returns true when user owns the enrollment', async () => {
    mockDb.enrollment.findUnique.mockResolvedValue({
      userId: 'user-1',
    });

    const result = await PermissionManager.ownsResource(
      'user-1',
      'enrollment',
      'enrollment-1'
    );

    expect(result).toBe(true);
  });

  it('returns false when user does not own the enrollment', async () => {
    mockDb.enrollment.findUnique.mockResolvedValue({
      userId: 'other-user',
    });

    const result = await PermissionManager.ownsResource(
      'user-1',
      'enrollment',
      'enrollment-1'
    );

    expect(result).toBe(false);
  });

  it('returns true when user owns the post', async () => {
    mockDb.post.findUnique.mockResolvedValue({
      userId: 'user-1',
    });

    const result = await PermissionManager.ownsResource(
      'user-1',
      'post',
      'post-1'
    );

    expect(result).toBe(true);
  });

  it('returns false when user does not own the post', async () => {
    mockDb.post.findUnique.mockResolvedValue({
      userId: 'other-user',
    });

    const result = await PermissionManager.ownsResource(
      'user-1',
      'post',
      'post-1'
    );

    expect(result).toBe(false);
  });

  it('returns true when user owns the comment', async () => {
    mockDb.comment.findUnique.mockResolvedValue({
      userId: 'user-1',
    });

    const result = await PermissionManager.ownsResource(
      'user-1',
      'comment',
      'comment-1'
    );

    expect(result).toBe(true);
  });

  it('returns false when user does not own the comment', async () => {
    mockDb.comment.findUnique.mockResolvedValue({
      userId: 'other-user',
    });

    const result = await PermissionManager.ownsResource(
      'user-1',
      'comment',
      'comment-1'
    );

    expect(result).toBe(false);
  });

  it('returns false when the resource is not found (null)', async () => {
    mockDb.course.findUnique.mockResolvedValue(null);

    const result = await PermissionManager.ownsResource(
      'user-1',
      'course',
      'non-existent'
    );

    expect(result).toBe(false);
  });

  it('returns false on database error', async () => {
    mockDb.course.findUnique.mockRejectedValue(
      new Error('DB error')
    );

    const result = await PermissionManager.ownsResource(
      'user-1',
      'course',
      'course-1'
    );

    expect(result).toBe(false);
  });
});

describe('PermissionManager.canAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false for an unknown action', async () => {
    const result = await PermissionManager.canAccess('user-1', 'fly-to-moon');
    expect(result).toBe(false);
  });

  it('maps create-course action to COURSE_CREATE permission', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.COURSE_CREATE },
        },
      ],
    });

    const result = await PermissionManager.canAccess('user-1', 'create-course');
    expect(result).toBe(true);
  });

  it('checks both permission and ownership for OWN actions with resource', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.COURSE_EDIT_OWN },
        },
      ],
    });

    mockDb.course.findUnique.mockResolvedValue({
      userId: 'user-1',
    });

    const result = await PermissionManager.canAccess('user-1', 'edit-course', {
      type: 'course',
      id: 'course-1',
    });

    expect(result).toBe(true);
  });

  it('returns false for OWN action when user does not own the resource', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.COURSE_EDIT_OWN },
        },
      ],
    });

    mockDb.course.findUnique.mockResolvedValue({
      userId: 'other-user',
    });

    const result = await PermissionManager.canAccess('user-1', 'edit-course', {
      type: 'course',
      id: 'course-1',
    });

    expect(result).toBe(false);
  });

  it('only checks permission for ANY actions (no ownership check)', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.COURSE_EDIT_ANY },
        },
      ],
    });

    const result = await PermissionManager.canAccess(
      'user-1',
      'edit-any-course'
    );

    expect(result).toBe(true);
  });

  it('maps view-audit-logs action to PLATFORM_AUDIT_LOGS permission', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.PLATFORM_AUDIT_LOGS },
        },
      ],
    });

    const result = await PermissionManager.canAccess(
      'user-1',
      'view-audit-logs'
    );

    expect(result).toBe(true);
  });

  it('maps moderate-content action to CONTENT_MODERATE permission', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      isAccountLocked: false,
      userPermissions: [
        {
          granted: true,
          expiresAt: null,
          permission: { name: Permission.CONTENT_MODERATE },
        },
      ],
    });

    const result = await PermissionManager.canAccess(
      'user-1',
      'moderate-content'
    );

    expect(result).toBe(true);
  });
});

describe('PermissionManager.grantPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates permission if it does not exist, then upserts userPermission and logs', async () => {
    mockDb.permission.findUnique.mockResolvedValue(null);
    mockDb.permission.create.mockResolvedValue({
      id: 'perm-new',
      name: 'COURSE_CREATE',
      category: 'COURSE',
    });
    mockDb.userPermission.upsert.mockResolvedValue({});
    mockDb.enhancedAuditLog.create.mockResolvedValue({});

    const result = await PermissionManager.grantPermission(
      'user-1',
      'COURSE_CREATE'
    );

    expect(result).toBe(true);
    expect(mockDb.permission.findUnique).toHaveBeenCalledWith({
      where: { name: 'COURSE_CREATE' },
    });
    expect(mockDb.permission.create).toHaveBeenCalledWith({
      data: {
        name: 'COURSE_CREATE',
        category: 'COURSE',
        description: 'Permission for COURSE_CREATE',
      },
    });
    expect(mockDb.userPermission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_permissionId: {
            userId: 'user-1',
            permissionId: 'perm-new',
          },
        },
        update: { granted: true, expiresAt: undefined },
        create: {
          userId: 'user-1',
          permissionId: 'perm-new',
          granted: true,
          expiresAt: undefined,
        },
      })
    );
    expect(mockDb.enhancedAuditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: 'PERMISSION_GRANTED',
        resource: 'PERMISSION',
        resourceId: 'perm-new',
        metadata: { permissionName: 'COURSE_CREATE', expiresAt: undefined },
      },
    });
  });

  it('uses existing permission when it already exists', async () => {
    mockDb.permission.findUnique.mockResolvedValue({
      id: 'perm-existing',
      name: 'COURSE_CREATE',
    });
    mockDb.userPermission.upsert.mockResolvedValue({});
    mockDb.enhancedAuditLog.create.mockResolvedValue({});

    const result = await PermissionManager.grantPermission(
      'user-1',
      'COURSE_CREATE'
    );

    expect(result).toBe(true);
    expect(mockDb.permission.create).not.toHaveBeenCalled();
    expect(mockDb.userPermission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_permissionId: {
            userId: 'user-1',
            permissionId: 'perm-existing',
          },
        },
      })
    );
  });

  it('passes expiresAt when provided', async () => {
    const expiry = new Date('2099-12-31T00:00:00Z');
    mockDb.permission.findUnique.mockResolvedValue({
      id: 'perm-1',
      name: 'COURSE_CREATE',
    });
    mockDb.userPermission.upsert.mockResolvedValue({});
    mockDb.enhancedAuditLog.create.mockResolvedValue({});

    const result = await PermissionManager.grantPermission(
      'user-1',
      'COURSE_CREATE',
      expiry
    );

    expect(result).toBe(true);
    expect(mockDb.userPermission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { granted: true, expiresAt: expiry },
        create: expect.objectContaining({ expiresAt: expiry }),
      })
    );
  });

  it('returns false on database error', async () => {
    mockDb.permission.findUnique.mockRejectedValue(
      new Error('DB error')
    );

    const result = await PermissionManager.grantPermission(
      'user-1',
      'COURSE_CREATE'
    );

    expect(result).toBe(false);
  });

  it('categorizes CONTENT_ permissions correctly', async () => {
    mockDb.permission.findUnique.mockResolvedValue(null);
    mockDb.permission.create.mockResolvedValue({
      id: 'perm-content',
      name: 'CONTENT_MODERATE',
    });
    mockDb.userPermission.upsert.mockResolvedValue({});
    mockDb.enhancedAuditLog.create.mockResolvedValue({});

    await PermissionManager.grantPermission('user-1', 'CONTENT_MODERATE');

    expect(mockDb.permission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: 'CONTENT' }),
      })
    );
  });

  it('categorizes PLATFORM_ permissions correctly', async () => {
    mockDb.permission.findUnique.mockResolvedValue(null);
    mockDb.permission.create.mockResolvedValue({
      id: 'perm-platform',
      name: 'PLATFORM_ADMIN',
    });
    mockDb.userPermission.upsert.mockResolvedValue({});
    mockDb.enhancedAuditLog.create.mockResolvedValue({});

    await PermissionManager.grantPermission('user-1', 'PLATFORM_ADMIN');

    expect(mockDb.permission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: 'PLATFORM' }),
      })
    );
  });

  it('categorizes unknown prefix as OTHER', async () => {
    mockDb.permission.findUnique.mockResolvedValue(null);
    mockDb.permission.create.mockResolvedValue({
      id: 'perm-other',
      name: 'CUSTOM_THING',
    });
    mockDb.userPermission.upsert.mockResolvedValue({});
    mockDb.enhancedAuditLog.create.mockResolvedValue({});

    await PermissionManager.grantPermission('user-1', 'CUSTOM_THING');

    expect(mockDb.permission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: 'OTHER' }),
      })
    );
  });
});

describe('PermissionManager.revokePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates permission to granted=false and creates audit log', async () => {
    mockDb.permission.findUnique.mockResolvedValue({
      id: 'perm-1',
      name: 'COURSE_CREATE',
    });
    mockDb.userPermission.updateMany.mockResolvedValue({ count: 1 });
    mockDb.enhancedAuditLog.create.mockResolvedValue({});

    const result = await PermissionManager.revokePermission(
      'user-1',
      'COURSE_CREATE'
    );

    expect(result).toBe(true);
    expect(mockDb.userPermission.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', permissionId: 'perm-1' },
      data: { granted: false },
    });
    expect(mockDb.enhancedAuditLog.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        action: 'PERMISSION_REVOKED',
        resource: 'PERMISSION',
        resourceId: 'perm-1',
        metadata: { permissionName: 'COURSE_CREATE' },
      },
    });
  });

  it('returns false if the permission does not exist in the Permission table', async () => {
    mockDb.permission.findUnique.mockResolvedValue(null);

    const result = await PermissionManager.revokePermission(
      'user-1',
      'NON_EXISTENT'
    );

    expect(result).toBe(false);
    expect(mockDb.userPermission.updateMany).not.toHaveBeenCalled();
    expect(mockDb.enhancedAuditLog.create).not.toHaveBeenCalled();
  });

  it('returns false on database error', async () => {
    mockDb.permission.findUnique.mockRejectedValue(
      new Error('DB error')
    );

    const result = await PermissionManager.revokePermission(
      'user-1',
      'COURSE_CREATE'
    );

    expect(result).toBe(false);
  });
});

describe('PermissionManager.getUserPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an array of permission names for a valid user', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      userPermissions: [
        { permission: { name: 'COURSE_CREATE' } },
        { permission: { name: 'CONTENT_MODERATE' } },
      ],
    });

    const result = await PermissionManager.getUserPermissions('user-1');

    expect(result).toEqual(
      expect.arrayContaining(['COURSE_CREATE', 'CONTENT_MODERATE'])
    );
    expect(result).toHaveLength(2);
  });

  it('returns an empty array if user is not found', async () => {
    mockDb.user.findUnique.mockResolvedValue(null);

    const result = await PermissionManager.getUserPermissions('non-existent');

    expect(result).toEqual([]);
  });

  it('returns only granted, non-expired permissions', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      userPermissions: [
        { permission: { name: 'COURSE_CREATE' } },
      ],
    });

    const result = await PermissionManager.getUserPermissions('user-1');

    expect(result).toEqual(['COURSE_CREATE']);
    // Verify the query includes the filtering conditions
    expect(mockDb.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          userPermissions: expect.objectContaining({
            where: expect.objectContaining({
              granted: true,
            }),
          }),
        }),
      })
    );
  });

  it('returns an empty array on database error', async () => {
    mockDb.user.findUnique.mockRejectedValue(
      new Error('DB error')
    );

    const result = await PermissionManager.getUserPermissions('user-1');

    expect(result).toEqual([]);
  });

  it('deduplicates permission names', async () => {
    mockDb.user.findUnique.mockResolvedValue({
      userPermissions: [
        { permission: { name: 'COURSE_CREATE' } },
        { permission: { name: 'COURSE_CREATE' } },
      ],
    });

    const result = await PermissionManager.getUserPermissions('user-1');

    expect(result).toEqual(['COURSE_CREATE']);
    expect(result).toHaveLength(1);
  });
});

describe('usePermission hook', () => {
  it('returns an object with a hasPermission async function', async () => {
    const { usePermission } = await import('@/lib/permissions');
    const hook = usePermission(Permission.COURSE_CREATE);

    expect(hook).toHaveProperty('hasPermission');
    expect(typeof hook.hasPermission).toBe('function');
  });
});
