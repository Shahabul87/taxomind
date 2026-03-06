/**
 * Tests for lib/role-management.ts
 * This file contains a simplified permission system where all authenticated
 * users have basic permissions. It exports USER_PERMISSIONS, hasPermission,
 * requirePermission, getAllUsers, isOwner, and canModifyUser.
 */

// Mock dependencies before imports
jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

// Database mock is provided by __mocks__/db.js via moduleNameMapper.

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  USER_PERMISSIONS,
  hasPermission,
  requirePermission,
  getAllUsers,
  isOwner,
  canModifyUser,
} from '@/lib/role-management';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, Record<string, jest.Mock>>;

describe('USER_PERMISSIONS constant', () => {
  it('contains expected course permissions', () => {
    expect(USER_PERMISSIONS).toContain('course:view');
    expect(USER_PERMISSIONS).toContain('course:enroll');
    expect(USER_PERMISSIONS).toContain('course:create');
    expect(USER_PERMISSIONS).toContain('course:edit_own');
    expect(USER_PERMISSIONS).toContain('course:delete_own');
  });

  it('contains expected exam permissions', () => {
    expect(USER_PERMISSIONS).toContain('exam:take');
    expect(USER_PERMISSIONS).toContain('exam:create');
    expect(USER_PERMISSIONS).toContain('exam:edit_own');
  });

  it('contains expected progress and analytics permissions', () => {
    expect(USER_PERMISSIONS).toContain('progress:view_own');
    expect(USER_PERMISSIONS).toContain('analytics:view_own');
    expect(USER_PERMISSIONS).toContain('analytics:view_students');
    expect(USER_PERMISSIONS).toContain('analytics:view_courses');
  });

  it('has exactly 12 permission entries', () => {
    expect(USER_PERMISSIONS).toHaveLength(12);
  });
});

describe('hasPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns false if user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const result = await hasPermission('course:view');

    expect(result).toBe(false);
  });

  it('returns true if user is authenticated and permission is in USER_PERMISSIONS', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });

    const result = await hasPermission('course:view');

    expect(result).toBe(true);
  });

  it('returns true for all defined permissions when authenticated', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });

    for (const permission of USER_PERMISSIONS) {
      const result = await hasPermission(permission);
      expect(result).toBe(true);
    }
  });
});

describe('requirePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws an error if user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    await expect(requirePermission('course:view')).rejects.toThrow(
      'Insufficient permissions: course:view required'
    );
  });

  it('does not throw if user is authenticated', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });

    await expect(requirePermission('course:view')).resolves.toBeUndefined();
  });

  it('includes the permission name in the error message', async () => {
    mockCurrentUser.mockResolvedValue(null);

    await expect(requirePermission('exam:take')).rejects.toThrow(
      'Insufficient permissions: exam:take required'
    );
  });
});

describe('getAllUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns users when authenticated', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        name: 'Alice',
        email: 'alice@example.com',
        createdAt: new Date(),
        emailVerified: new Date(),
      },
      {
        id: 'user-2',
        name: 'Bob',
        email: 'bob@example.com',
        createdAt: new Date(),
        emailVerified: null,
      },
    ];

    mockCurrentUser.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
    });
    mockDb.user.findMany.mockResolvedValue(mockUsers);

    const result = await getAllUsers();

    expect(result).toEqual(mockUsers);
    expect(mockDb.user.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        emailVerified: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('throws an error when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    await expect(getAllUsers()).rejects.toThrow('Authentication required');
    expect(mockDb.user.findMany).not.toHaveBeenCalled();
  });
});

describe('isOwner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when current user ID matches resourceUserId', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });

    const result = await isOwner('user-1');

    expect(result).toBe(true);
  });

  it('returns false when current user ID does not match resourceUserId', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });

    const result = await isOwner('user-2');

    expect(result).toBe(false);
  });

  it('returns false when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const result = await isOwner('user-1');

    expect(result).toBe(false);
  });
});

describe('canModifyUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when current user ID matches target user ID', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });

    const result = await canModifyUser('user-1');

    expect(result).toBe(true);
  });

  it('returns false when current user ID does not match target user ID', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
    });

    const result = await canModifyUser('user-other');

    expect(result).toBe(false);
  });

  it('returns false when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const result = await canModifyUser('user-1');

    expect(result).toBe(false);
  });
});
