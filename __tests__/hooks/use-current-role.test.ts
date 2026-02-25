/**
 * Tests for useCurrentRole hook
 * Source: hooks/use-current-role.ts
 */

import { renderHook } from '@testing-library/react';
import { useSession } from 'next-auth/react';

const mockUseSession = useSession as jest.Mock;

import { useCurrentRole } from '@/hooks/use-current-role';

describe('useCurrentRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return ADMIN role when user is admin', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
        expires: '2026-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBe('ADMIN');
  });

  it('should return USER role when user is a regular user', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'user-1', name: 'User', email: 'user@test.com', role: 'USER' },
        expires: '2026-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBe('USER');
  });

  it('should return undefined when no session exists', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBeUndefined();
  });

  it('should return undefined during loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useCurrentRole());

    expect(result.current).toBeUndefined();
  });
});
