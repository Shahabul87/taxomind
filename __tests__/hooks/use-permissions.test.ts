/**
 * Tests for usePermissions hook
 * Source: hooks/use-permissions.ts
 */

import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';

const mockUseSession = useSession as jest.Mock;

jest.mock('@/types/admin-role', () => ({
  AdminRole: {
    ADMIN: 'ADMIN' as const,
    SUPERADMIN: 'SUPERADMIN' as const,
  },
}));

jest.mock('@/lib/role-management', () => ({
  USER_PERMISSIONS: [
    'course:view',
    'course:enroll',
    'course:create',
    'course:edit_own',
    'course:delete_own',
    'exam:take',
    'exam:create',
    'exam:edit_own',
    'progress:view_own',
    'analytics:view_own',
    'analytics:view_students',
    'analytics:view_courses',
  ] as const,
  Permission: {},
}));

import { usePermissions } from '@/hooks/use-permissions';

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return isAdmin true for ADMIN role', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', role: 'ADMIN', email: 'admin@test.com' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin()).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should return isAdmin true for SUPERADMIN role', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'sa-1', role: 'SUPERADMIN', email: 'sa@test.com' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin()).toBe(true);
  });

  it('should return isAdmin false for regular user', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'user@test.com' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin()).toBe(false);
  });

  it('should check hasPermission for authenticated user', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'user@test.com' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission('course:view' as never)).toBe(true);
    expect(result.current.hasPermission('course:create' as never)).toBe(true);
  });

  it('should return false for hasPermission when no session', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission('course:view' as never)).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should check hasRole correctly', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', role: 'ADMIN' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasRole('ADMIN')).toBe(true);
    expect(result.current.hasRole('SUPERADMIN')).toBe(false);
    expect(result.current.hasRole(['ADMIN', 'SUPERADMIN'])).toBe(true);
  });

  it('should return loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isLoading).toBe(true);
  });

  it('should return getUserRole', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'admin-1', role: 'ADMIN' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.getUserRole()).toBe('ADMIN');
  });

  it('should return null getUserRole when no session', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.getUserRole()).toBeNull();
  });

  it('should return getPermissions for authenticated user', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    const permissions = result.current.getPermissions();
    expect(permissions).toContain('course:view');
    expect(permissions).toContain('course:create');
  });

  it('should return empty permissions when no session', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.getPermissions()).toEqual([]);
  });

  it('should return deprecated isTeacher as false', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.isTeacher()).toBe(false);
    expect(result.current.isStudent()).toBe(false);
  });

  it('should check canCreateCourses', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canCreateCourses()).toBe(true);
  });

  it('should check canManageUsers (admin only)', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => usePermissions());

    // Regular user cannot manage users
    expect(result.current.canManageUsers()).toBe(false);
  });
});
