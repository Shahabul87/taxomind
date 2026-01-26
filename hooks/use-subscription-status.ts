/**
 * Hook for checking user subscription status
 *
 * Provides real-time subscription status for client-side feature gating.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export interface SubscriptionStatus {
  isPremium: boolean;
  plan: "MONTHLY" | "YEARLY" | "LIFETIME" | null;
  expiresAt: string | null;
  daysRemaining: number | null;
  isExpired: boolean;
  isLoading: boolean;
  error: string | null;
  features: {
    canAccessAICourseCreation: boolean;
    canAccessContentGeneration: boolean;
    canAccessQuizGeneration: boolean;
    canAccessAdvancedAnalytics: boolean;
    canAccessExamCreation: boolean;
  };
  samAi: {
    remainingFreeUsage: number | null;
    isUnlimited: boolean;
  };
}

interface SubscriptionFeature {
  feature: string;
  available: boolean;
  reason: string;
}

interface SubscriptionAPIResponse {
  success: boolean;
  data?: {
    isPremium: boolean;
    plan: "MONTHLY" | "YEARLY" | "LIFETIME" | null;
    expiresAt: string | null;
    daysRemaining: number | null;
    isExpired: boolean;
    samAi: {
      remainingFreeUsage: number | null;
      isUnlimited: boolean;
      features: SubscriptionFeature[];
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

const defaultStatus: SubscriptionStatus = {
  isPremium: false,
  plan: null,
  expiresAt: null,
  daysRemaining: null,
  isExpired: false,
  isLoading: true,
  error: null,
  features: {
    canAccessAICourseCreation: false,
    canAccessContentGeneration: false,
    canAccessQuizGeneration: false,
    canAccessAdvancedAnalytics: false,
    canAccessExamCreation: false,
  },
  samAi: {
    remainingFreeUsage: null,
    isUnlimited: false,
  },
};

// Cache for subscription status (5 minute TTL)
let cachedStatus: SubscriptionStatus | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useSubscriptionStatus(): SubscriptionStatus & {
  refetch: () => Promise<void>;
  clearCache: () => void;
} {
  const { data: session, status: sessionStatus } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>(defaultStatus);

  const fetchStatus = useCallback(async () => {
    // Check cache first
    const now = Date.now();
    if (cachedStatus && now - cacheTimestamp < CACHE_TTL) {
      setSubscriptionStatus(cachedStatus);
      return;
    }

    if (sessionStatus === "loading") {
      return;
    }

    if (!session?.user) {
      setSubscriptionStatus({
        ...defaultStatus,
        isLoading: false,
      });
      return;
    }

    try {
      const response = await fetch("/api/subscription/status");
      const data: SubscriptionAPIResponse = await response.json();

      if (data.success && data.data) {
        const features = data.data.samAi.features || [];

        const newStatus: SubscriptionStatus = {
          isPremium: data.data.isPremium,
          plan: data.data.plan,
          expiresAt: data.data.expiresAt,
          daysRemaining: data.data.daysRemaining,
          isExpired: data.data.isExpired,
          isLoading: false,
          error: null,
          features: {
            canAccessAICourseCreation:
              data.data.isPremium ||
              features.find((f) => f.feature === "course-creation")
                ?.available === true,
            canAccessContentGeneration:
              data.data.isPremium ||
              features.find((f) => f.feature === "content-generation")
                ?.available === true,
            canAccessQuizGeneration:
              data.data.isPremium ||
              features.find((f) => f.feature === "quiz-generation")
                ?.available === true,
            canAccessAdvancedAnalytics:
              data.data.isPremium ||
              features.find((f) => f.feature === "advanced-analytics")
                ?.available === true,
            canAccessExamCreation:
              data.data.isPremium ||
              features.find((f) => f.feature === "exam-creation")?.available ===
                true,
          },
          samAi: {
            remainingFreeUsage: data.data.samAi.remainingFreeUsage,
            isUnlimited: data.data.samAi.isUnlimited,
          },
        };

        // Update cache
        cachedStatus = newStatus;
        cacheTimestamp = now;

        setSubscriptionStatus(newStatus);
      } else {
        setSubscriptionStatus({
          ...defaultStatus,
          isLoading: false,
          error: data.error?.message || "Failed to fetch subscription status",
        });
      }
    } catch (error) {
      console.error("[useSubscriptionStatus] Error:", error);
      setSubscriptionStatus({
        ...defaultStatus,
        isLoading: false,
        error: "Network error. Please try again.",
      });
    }
  }, [session?.user, sessionStatus]);

  const clearCache = useCallback(() => {
    cachedStatus = null;
    cacheTimestamp = 0;
  }, []);

  const refetch = useCallback(async () => {
    clearCache();
    await fetchStatus();
  }, [clearCache, fetchStatus]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    ...subscriptionStatus,
    refetch,
    clearCache,
  };
}

/**
 * Check if a specific AI feature is accessible
 */
export function useCanAccessAIFeature(
  feature:
    | "course-creation"
    | "content-generation"
    | "quiz-generation"
    | "advanced-analytics"
    | "exam-creation"
): {
  canAccess: boolean;
  isLoading: boolean;
  isPremium: boolean;
  requiresUpgrade: boolean;
} {
  const { features, isPremium, isLoading } = useSubscriptionStatus();

  const featureMap = {
    "course-creation": features.canAccessAICourseCreation,
    "content-generation": features.canAccessContentGeneration,
    "quiz-generation": features.canAccessQuizGeneration,
    "advanced-analytics": features.canAccessAdvancedAnalytics,
    "exam-creation": features.canAccessExamCreation,
  };

  return {
    canAccess: isPremium || featureMap[feature],
    isLoading,
    isPremium,
    requiresUpgrade: !isPremium && !featureMap[feature],
  };
}
