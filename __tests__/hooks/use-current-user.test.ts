/**
 * Tests for useCurrentUser hook
 * Source: hooks/use-current-user.ts
 */

import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';

const mockUseSession = useSession as jest.Mock;

import { useCurrentUser } from '@/hooks/use-current-user';

describe('useCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user from session when authenticated', () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'USER',
    };

    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: '2026-12-31' },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toEqual(mockUser);
  });

  it('should return undefined when unauthenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeUndefined();
  });

  it('should return undefined during loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeUndefined();
  });

  it('should return undefined when session data has no user', () => {
    mockUseSession.mockReturnValue({
      data: {},
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentUser());

    expect(result.current).toBeUndefined();
  });
});
