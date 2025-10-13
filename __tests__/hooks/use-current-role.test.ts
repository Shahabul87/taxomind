import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useCurrentRole } from '@/hooks/use-current-role';

// Mock next-auth
jest.mock('next-auth/react');
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('useCurrentRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user role when session and user exist', () => {
    const mockUser = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'ADMIN'
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBe('ADMIN');
  });

  it('should return USER role for regular users', () => {
    const mockUser = {
      id: 'user-2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'USER'
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBe('USER');
  });

  it('should return undefined when no session exists', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBeUndefined();
  });

  it('should return undefined when session exists but user is null', () => {
    mockUseSession.mockReturnValue({
      data: { user: null },
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBeUndefined();
  });

  it('should return undefined when user exists but has no role', () => {
    const mockUser = {
      id: 'user-3',
      name: 'No Role User',
      email: 'norole@example.com'
      // role is undefined
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBeUndefined();
  });

  it('should handle loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn()
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBeUndefined();
  });

  it('should update when role changes', () => {
    const mockUser1 = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'USER'
    };

    const mockUser2 = {
      ...mockUser1,
      role: 'ADMIN'
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser1 },
      status: 'authenticated',
      update: jest.fn()
    });

    const { result, rerender } = renderHook(() => useCurrentRole());

    expect(result.current).toBe('USER');

    // Update the mock to return user with different role
    mockUseSession.mockReturnValue({
      data: { user: mockUser2 },
      status: 'authenticated',
      update: jest.fn()
    });

    rerender();

    expect(result.current).toBe('ADMIN');
  });
});