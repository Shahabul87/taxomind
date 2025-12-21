"use client";

import { useEffect, useState, useCallback } from "react";

interface PremiumStatus {
  isPremium: boolean;
  plan: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  isExpired: boolean;
  samAi: {
    remainingFreeUsage: number | null;
    isUnlimited: boolean;
    features: Array<{
      feature: string;
      available: boolean;
      reason: string;
    }>;
  };
}

interface UsePremiumStatusReturn {
  status: PremiumStatus | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  canAccessFeature: (feature: string) => boolean;
}

export function usePremiumStatus(): UsePremiumStatusReturn {
  const [status, setStatus] = useState<PremiumStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/subscription/status");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || "Failed to fetch status");
      }

      setStatus(data.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const canAccessFeature = useCallback(
    (feature: string): boolean => {
      if (!status) return false;
      if (status.isPremium) return true;

      const featureStatus = status.samAi.features.find(
        (f) => f.feature === feature
      );
      return featureStatus?.available ?? false;
    },
    [status]
  );

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
    canAccessFeature,
  };
}

/**
 * Hook to check if a specific SAM feature can be accessed
 */
export function useSAMFeatureAccess(feature: string) {
  const { status, isLoading, canAccessFeature } = usePremiumStatus();

  return {
    canAccess: canAccessFeature(feature),
    isLoading,
    isPremium: status?.isPremium ?? false,
    remainingUsage: status?.samAi.remainingFreeUsage ?? 0,
    isUnlimited: status?.samAi.isUnlimited ?? false,
  };
}

/**
 * Simple hook to check if user is premium
 * Returns just the boolean for easy use in components
 *
 * In DEVELOPMENT mode, this always returns true to bypass premium gates.
 * In PRODUCTION, this checks the actual premium status.
 * If there's an error or the check fails, defaults to true to prevent blocking users.
 */
export function useIsPremium(): boolean {
  const { status, error, isLoading } = usePremiumStatus();

  // In development mode, always return true to bypass premium gates
  // This allows testing AI features without payment integration
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // If there's an error fetching premium status, default to allowing access
  // This prevents database schema issues from blocking the UI
  if (error) {
    return true;
  }

  // While loading, default to true to prevent flash of locked state
  if (isLoading) {
    return true;
  }

  return status?.isPremium ?? true;
}
