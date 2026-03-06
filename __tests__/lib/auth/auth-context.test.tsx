/**
 * Tests for lib/auth/auth-context.ts
 * Covers the useAuth() hook which wraps next-auth/react useSession.
 */

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

import { renderHook } from '@testing-library/react';
import { useAuth } from '@/lib/auth/auth-context';
import { useSession } from 'next-auth/react';

const mockUseSession = useSession as jest.Mock;

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null user and "loading" status when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe('loading');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  it('returns user data when session is authenticated', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.jpg',
      role: 'USER',
      isTeacher: false,
      isAffiliate: false,
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser },
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.status).toBe('authenticated');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns null user when session is unauthenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe('unauthenticated');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('sets isAuthenticated to true only when status is "authenticated"', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('sets isAuthenticated to false when status is "unauthenticated"', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets isLoading to true when status is "loading"', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
  });

  it('sets isLoading to false when status is "authenticated"', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(false);
  });

  it('sets isLoading to false when status is "unauthenticated"', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(false);
  });

  it('handles session data with optional null fields', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-2',
          email: null,
          name: null,
          image: null,
        },
      },
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual({
      id: 'user-2',
      email: null,
      name: null,
      image: null,
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('returns user with teacher flag when session contains isTeacher', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'teacher-1',
          email: 'teacher@example.com',
          name: 'Teacher User',
          image: null,
          isTeacher: true,
          isAffiliate: false,
        },
      },
      status: 'authenticated',
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user?.isTeacher).toBe(true);
    expect(result.current.user?.isAffiliate).toBe(false);
  });
});
