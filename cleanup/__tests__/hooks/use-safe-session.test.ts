/**
 * Tests for useSafeSession hook
 * Source: hooks/use-safe-session.ts
 */

import { renderHook, act } from '@testing-library/react';
import { useSession } from 'next-auth/react';

const mockUseSession = useSession as jest.Mock;

jest.mock('@/lib/auth-error-handler', () => ({
  handleSessionError: jest.fn(),
  refreshSession: jest.fn(),
}));

import { useSafeSession } from '@/hooks/use-safe-session';
import { handleSessionError, refreshSession } from '@/lib/auth-error-handler';

const mockHandleSessionError = handleSessionError as jest.Mock;
const mockRefreshSession = refreshSession as jest.Mock;

describe('useSafeSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return session data when authenticated', () => {
    const mockUser = { id: 'user-1', name: 'Test User', email: 'test@test.com' };
    mockUseSession.mockReturnValue({
      data: { user: mockUser, expires: '2026-12-31' },
      status: 'authenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useSafeSession());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.status).toBe('authenticated');
    expect(result.current.hasError).toBe(false);
  });

  it('should return null user when no session exists', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useSafeSession());

    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe('unauthenticated');
  });

  it('should return loading status during session loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { result } = renderHook(() => useSafeSession());

    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe('loading');
  });

  it('should handle fetch error events and attempt session refresh', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
      update: jest.fn(),
    });

    mockHandleSessionError.mockReturnValue(true);
    mockRefreshSession.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSafeSession());

    // Simulate a fetch error event
    const errorEvent = new ErrorEvent('error', {
      message: 'Failed to fetch',
      error: new Error('Failed to fetch'),
    });

    await act(async () => {
      window.dispatchEvent(errorEvent);
    });

    expect(mockHandleSessionError).toHaveBeenCalled();
    expect(mockRefreshSession).toHaveBeenCalled();
  });

  it('should not handle non-fetch errors', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    renderHook(() => useSafeSession());

    const errorEvent = new ErrorEvent('error', {
      message: 'Some other error',
      error: new Error('Some other error'),
    });

    await act(async () => {
      window.dispatchEvent(errorEvent);
    });

    expect(mockHandleSessionError).not.toHaveBeenCalled();
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  it('should clean up event listener on unmount', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useSafeSession());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });
});
