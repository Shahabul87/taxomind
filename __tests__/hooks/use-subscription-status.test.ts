/**
 * Tests for useSubscriptionStatus hook
 * Source: hooks/use-subscription-status.ts
 *
 * This hook has a module-level cache. We isolate tests by using
 * jest.isolateModules to get a fresh module instance per test.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';

const mockUseSession = useSession as jest.Mock;
const mockFetch = global.fetch as jest.Mock;

// Helper to get a fresh hook module (bypasses the 5-minute module-level cache)
function getFreshHook() {
  let hookModule: typeof import('@/hooks/use-subscription-status');
  jest.isolateModules(() => {
    hookModule = require('@/hooks/use-subscription-status');
  });
  return hookModule!;
}

describe('useSubscriptionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPremiumResponse = {
    success: true,
    data: {
      isPremium: true,
      plan: 'MONTHLY' as const,
      expiresAt: '2027-01-01T00:00:00.000Z',
      daysRemaining: 30,
      isExpired: false,
      samAi: {
        remainingFreeUsage: null,
        isUnlimited: true,
        features: [
          { feature: 'course-creation', available: true, reason: 'Premium' },
          { feature: 'content-generation', available: true, reason: 'Premium' },
          { feature: 'quiz-generation', available: true, reason: 'Premium' },
          { feature: 'advanced-analytics', available: true, reason: 'Premium' },
          { feature: 'exam-creation', available: true, reason: 'Premium' },
        ],
      },
    },
  };

  const mockFreeResponse = {
    success: true,
    data: {
      isPremium: false,
      plan: null,
      expiresAt: null,
      daysRemaining: null,
      isExpired: false,
      samAi: {
        remainingFreeUsage: 5,
        isUnlimited: false,
        features: [
          { feature: 'course-creation', available: false, reason: 'Premium required' },
          { feature: 'content-generation', available: false, reason: 'Premium required' },
          { feature: 'quiz-generation', available: true, reason: 'Free tier' },
          { feature: 'advanced-analytics', available: false, reason: 'Premium required' },
          { feature: 'exam-creation', available: false, reason: 'Premium required' },
        ],
      },
    },
  };

  function setupAuthenticatedSession() {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', name: 'Test', email: 'test@test.com' } },
      status: 'authenticated',
      update: jest.fn(),
    });
  }

  it('should return loading state initially', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.isLoading).toBe(true);
  });

  it('should return not premium for unauthenticated user', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(false);
    expect(result.current.plan).toBeNull();
  });

  it('should detect premium subscription (MONTHLY)', async () => {
    setupAuthenticatedSession();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPremiumResponse),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(true);
    expect(result.current.plan).toBe('MONTHLY');
    expect(result.current.daysRemaining).toBe(30);
    expect(result.current.isExpired).toBe(false);
  });

  it('should detect free tier correctly', async () => {
    setupAuthenticatedSession();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFreeResponse),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isPremium).toBe(false);
    expect(result.current.plan).toBeNull();
    expect(result.current.samAi.remainingFreeUsage).toBe(5);
    expect(result.current.samAi.isUnlimited).toBe(false);
  });

  it('should populate feature access for premium user', async () => {
    setupAuthenticatedSession();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPremiumResponse),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.features.canAccessAICourseCreation).toBe(true);
    expect(result.current.features.canAccessContentGeneration).toBe(true);
    expect(result.current.features.canAccessQuizGeneration).toBe(true);
    expect(result.current.features.canAccessAdvancedAnalytics).toBe(true);
    expect(result.current.features.canAccessExamCreation).toBe(true);
  });

  it('should restrict features for free user', async () => {
    setupAuthenticatedSession();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockFreeResponse),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.features.canAccessAICourseCreation).toBe(false);
    expect(result.current.features.canAccessQuizGeneration).toBe(true);
    expect(result.current.features.canAccessAdvancedAnalytics).toBe(false);
  });

  it('should handle expired subscription', async () => {
    setupAuthenticatedSession();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: {
          isPremium: false,
          plan: 'MONTHLY',
          expiresAt: '2025-01-01T00:00:00.000Z',
          daysRemaining: 0,
          isExpired: true,
          samAi: { remainingFreeUsage: 0, isUnlimited: false, features: [] },
        },
      }),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isExpired).toBe(true);
    expect(result.current.daysRemaining).toBe(0);
  });

  it('should handle API error response', async () => {
    setupAuthenticatedSession();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
      }),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Something went wrong');
    expect(result.current.isPremium).toBe(false);
  });

  it('should handle network error', async () => {
    setupAuthenticatedSession();
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error. Please try again.');
  });

  it('should support refetch clearing cache', async () => {
    setupAuthenticatedSession();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPremiumResponse),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    // refetch clears cache and re-fetches
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should include unlimited SAM AI for premium', async () => {
    setupAuthenticatedSession();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockPremiumResponse),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.samAi.isUnlimited).toBe(true);
    expect(result.current.samAi.remainingFreeUsage).toBeNull();
  });

  it('should handle YEARLY plan', async () => {
    setupAuthenticatedSession();
    const yearlyResponse = {
      success: true,
      data: {
        ...mockPremiumResponse.data,
        plan: 'YEARLY' as const,
        daysRemaining: 365,
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(yearlyResponse),
    });

    const { useSubscriptionStatus } = getFreshHook();
    const { result } = renderHook(() => useSubscriptionStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.plan).toBe('YEARLY');
    expect(result.current.daysRemaining).toBe(365);
  });
});

describe('useCanAccessAIFeature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should indicate access for premium user', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1' } },
      status: 'authenticated',
      update: jest.fn(),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: {
          isPremium: true,
          plan: 'MONTHLY',
          expiresAt: null,
          daysRemaining: null,
          isExpired: false,
          samAi: { remainingFreeUsage: null, isUnlimited: true, features: [] },
        },
      }),
    });

    const { useCanAccessAIFeature } = getFreshHook();
    const { result } = renderHook(() => useCanAccessAIFeature('course-creation'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccess).toBe(true);
    expect(result.current.isPremium).toBe(true);
    expect(result.current.requiresUpgrade).toBe(false);
  });
});
