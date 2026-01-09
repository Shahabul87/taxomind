import { useState, useEffect, useCallback } from "react";
import type {
  LearningNotificationPreference,
  UpdatePreferencesInput,
} from "@/types/learning-notifications";

interface UseNotificationPreferencesReturn {
  preferences: LearningNotificationPreference | null;
  isLoading: boolean;
  error: string | null;
  updatePreferences: (updates: UpdatePreferencesInput) => Promise<boolean>;
  resetPreferences: () => Promise<boolean>;
  refresh: () => void;
}

/**
 * Hook for managing learning notification preferences
 */
export function useNotificationPreferences(): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] =
    useState<LearningNotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        "/api/dashboard/learning-notifications/preferences"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notification preferences");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPreferences(result.data);
      } else {
        throw new Error(result.error?.message || "Invalid response");
      }
    } catch (err) {
      console.error("[useNotificationPreferences]", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreferences = useCallback(
    async (updates: UpdatePreferencesInput): Promise<boolean> => {
      try {
        setError(null);

        const response = await fetch(
          "/api/dashboard/learning-notifications/preferences",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update preferences");
        }

        const result = await response.json();

        if (result.success && result.data) {
          setPreferences(result.data);
          return true;
        }

        throw new Error(result.error?.message || "Update failed");
      } catch (err) {
        console.error("[useNotificationPreferences] Update error:", err);
        setError(err instanceof Error ? err.message : "Failed to update");
        return false;
      }
    },
    []
  );

  const resetPreferences = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch(
        "/api/dashboard/learning-notifications/preferences",
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset preferences");
      }

      const result = await response.json();

      if (result.success && result.data) {
        setPreferences(result.data);
        return true;
      }

      throw new Error(result.error?.message || "Reset failed");
    } catch (err) {
      console.error("[useNotificationPreferences] Reset error:", err);
      setError(err instanceof Error ? err.message : "Failed to reset");
      return false;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    resetPreferences,
    refresh,
  };
}
