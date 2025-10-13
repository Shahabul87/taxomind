import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { useAdmin } from '@/hooks/use-admin';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('useAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when user is ADMIN', () => {
    const mockSession = {
      user: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: UserRole.ADMIN
      }
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useAdmin());

    expect(result.current).toBe(true);
  });

  it('should return false when user is USER', () => {
    const mockSession = {
      user: {
        id: 'user-1',
        name: 'Regular User',
        email: 'user@example.com',
        role: UserRole.USER
      }
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useAdmin());

    expect(result.current).toBe(false);
  });

  it('should return false when no session exists', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useAdmin());

    expect(result.current).toBe(false);
  });

  it('should return false when session exists but user is null', () => {
    mockUseSession.mockReturnValue({
      data: { user: null },
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useAdmin());

    expect(result.current).toBe(false);
  });

  it('should return false when user exists but has no role', () => {
    const mockSession = {
      user: {
        id: 'user-2',
        name: 'No Role User',
        email: 'norole@example.com'
        // role is undefined
      }
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useAdmin());

    expect(result.current).toBe(false);
  });

  it('should handle loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn()
    });

    const { result } = renderHook(() => useAdmin());

    expect(result.current).toBe(false);
  });

  it('should update when role changes from USER to ADMIN', () => {
    const mockUserSession = {
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.USER
      }
    };

    const mockAdminSession = {
      user: {
        ...mockUserSession.user,
        role: UserRole.ADMIN
      }
    };

    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: 'authenticated',
      update: jest.fn()
    });

    const { result, rerender } = renderHook(() => useAdmin());

    expect(result.current).toBe(false);

    // Update to admin role
    mockUseSession.mockReturnValue({
      data: mockAdminSession,
      status: 'authenticated',
      update: jest.fn()
    });

    rerender();

    expect(result.current).toBe(true);
  });

  it('should update when role changes from ADMIN to USER', () => {
    const mockAdminSession = {
      user: {
        id: 'admin-1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: UserRole.ADMIN
      }
    };

    const mockUserSession = {
      user: {
        ...mockAdminSession.user,
        role: UserRole.USER
      }
    };

    mockUseSession.mockReturnValue({
      data: mockAdminSession,
      status: 'authenticated',
      update: jest.fn()
    });

    const { result, rerender } = renderHook(() => useAdmin());

    expect(result.current).toBe(true);

    // Update to user role
    mockUseSession.mockReturnValue({
      data: mockUserSession,
      status: 'authenticated',
      update: jest.fn()
    });

    rerender();

    expect(result.current).toBe(false);
  });
});