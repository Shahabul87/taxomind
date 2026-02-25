/**
 * Tests for usePremiumStatus, useSAMFeatureAccess, and useIsPremium hooks
 * Source: hooks/use-premium-status.ts
 */

import { renderHook, waitFor } from '@testing-library/react';

const mockFetch = global.fetch as jest.Mock;

import { usePremiumStatus, useSAMFeatureAccess, useIsPremium } from '@/hooks/use-premium-status';

describe('usePremiumStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const premiumApiResponse = {
    success: true,
    data: {
      isPremium: true,
      plan: 'MONTHLY',
      expiresAt: '2027-01-01T00:00:00.000Z',
      daysRemaining: 30,
      isExpired: false,
      samAi: {
        remainingFreeUsage: null,
        isUnlimited: true,
        features: [
          { feature: 'course-creation', available: true, reason: 'Premium' },
          { feature: 'quiz-generation', available: true, reason: 'Premium' },
        ],
      },
    },
  };

  const freeApiResponse = {
    success: true,
    data: {
      isPremium: false,
      plan: null,
      expiresAt: null,
      daysRemaining: null,
      isExpired: false,
      samAi: {
        remainingFreeUsage: 3,
        isUnlimited: false,
        features: [
          { feature: 'course-creation', available: false, reason: 'Premium required' },
          { feature: 'quiz-generation', available: true, reason: 'Free tier' },
        ],
      },
    },
  };

  it('should return premium status when user is premium', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(premiumApiResponse),
    });

    const { result } = renderHook(() => usePremiumStatus());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).not.toBeNull();
    expect(result.current.status?.isPremium).toBe(true);
    expect(result.current.status?.plan).toBe('MONTHLY');
    expect(result.current.error).toBeNull();
  });

  it('should return non-premium status for free user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(freeApiResponse),
    });

    const { result } = renderHook(() => usePremiumStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status?.isPremium).toBe(false);
    expect(result.current.status?.plan).toBeNull();
  });

  it('should handle API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        error: { code: 'INTERNAL', message: 'Server error' },
      }),
    });

    const { result } = renderHook(() => usePremiumStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Server error');
    expect(result.current.status).toBeNull();
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const { result } = renderHook(() => usePremiumStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toBe('Network failure');
  });

  it('should allow refetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(premiumApiResponse),
    });

    const { result } = renderHook(() => usePremiumStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(freeApiResponse),
    });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.status?.isPremium).toBe(false);
    });
  });

  it('should provide canAccessFeature for premium user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(premiumApiResponse),
    });

    const { result } = renderHook(() => usePremiumStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Premium users can access all features
    expect(result.current.canAccessFeature('course-creation')).toBe(true);
    expect(result.current.canAccessFeature('any-feature')).toBe(true);
  });

  it('should check specific feature access for free user', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(freeApiResponse),
    });

    const { result } = renderHook(() => usePremiumStatus());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccessFeature('quiz-generation')).toBe(true);
    expect(result.current.canAccessFeature('course-creation')).toBe(false);
  });

  it('should return false for canAccessFeature when status is null', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(premiumApiResponse),
    });

    const { result } = renderHook(() => usePremiumStatus());

    // While loading, status is null
    expect(result.current.canAccessFeature('course-creation')).toBe(false);
  });
});

describe('useSAMFeatureAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return SAM feature access details', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          isPremium: true,
          plan: 'YEARLY',
          expiresAt: null,
          daysRemaining: null,
          isExpired: false,
          samAi: {
            remainingFreeUsage: null,
            isUnlimited: true,
            features: [],
          },
        },
      }),
    });

    const { result } = renderHook(() => useSAMFeatureAccess('course-creation'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccess).toBe(true);
    expect(result.current.isPremium).toBe(true);
    expect(result.current.isUnlimited).toBe(true);
  });
});

describe('useIsPremium', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', configurable: true });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          isPremium: false,
          plan: null,
          expiresAt: null,
          daysRemaining: null,
          isExpired: false,
          samAi: { remainingFreeUsage: 0, isUnlimited: false, features: [] },
        },
      }),
    });

    const { result } = renderHook(() => useIsPremium());

    // In dev mode, always returns true
    expect(result.current).toBe(true);

    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv, configurable: true });
  });
});
