/**
 * Tests for useEnhancedAuth hooks (use-enhanced-auth.ts)
 * Source: hooks/use-enhanced-auth.ts
 *
 * This file exports multiple hooks: useCurrentUser, useCurrentRole,
 * useHasPermission, useRequireAuth, useRequireRole, etc.
 */

import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const mockUseSession = useSession as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

jest.mock('@/types/admin-role', () => ({
  AdminRole: {
    ADMIN: 'ADMIN' as const,
    SUPERADMIN: 'SUPERADMIN' as const,
  },
}));

jest.mock('@/types/auth', () => ({
  Permission: {},
}));

jest.mock('@/lib/auth/permissions', () => ({
  hasPermission: jest.fn((role: string, permission: string) => {
    if (role === 'ADMIN' || role === 'SUPERADMIN') return true;
    return false;
  }),
  hasAnyPermission: jest.fn((role: string, permissions: string[]) => {
    if (role === 'ADMIN' || role === 'SUPERADMIN') return true;
    return false;
  }),
  hasAllPermissions: jest.fn((role: string, permissions: string[]) => {
    if (role === 'ADMIN' || role === 'SUPERADMIN') return true;
    return false;
  }),
}));

import {
  useCurrentUser as useEnhancedCurrentUser,
  useCurrentRole as useEnhancedCurrentRole,
  useHasPermission,
  useRequireAuth,
} from '@/hooks/use-enhanced-auth';

describe('useEnhancedAuth - useCurrentUser', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it('should return authenticated state with user', () => {
    const mockUser = { id: 'user-1', name: 'Test', email: 'test@test.com', role: 'ADMIN' };
    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useEnhancedCurrentUser());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.authenticated).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('should return unauthenticated state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useEnhancedCurrentUser());

    expect(result.current.user).toBeUndefined();
    expect(result.current.authenticated).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('should return loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useEnhancedCurrentUser());

    expect(result.current.loading).toBe(true);
    expect(result.current.authenticated).toBe(false);
  });
});

describe('useEnhancedAuth - useCurrentRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return role for admin user', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', role: 'ADMIN' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useEnhancedCurrentRole());

    expect(result.current).toBe('ADMIN');
  });

  it('should return null when no session', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useEnhancedCurrentRole());

    expect(result.current).toBeNull();
  });
});

describe('useEnhancedAuth - useHasPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for admin with permission', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', role: 'ADMIN' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useHasPermission('manage_users' as never));

    expect(result.current).toBe(true);
  });

  it('should return false when no session', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useHasPermission('manage_users' as never));

    expect(result.current).toBe(false);
  });
});

describe('useEnhancedAuth - useRequireAuth', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it('should not redirect when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    renderHook(() => useRequireAuth());

    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    renderHook(() => useRequireAuth());

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
});
