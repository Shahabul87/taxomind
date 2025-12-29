"use client";

import { useState, useEffect, useCallback } from "react";

export interface PredictionsInsights {
  averageSessionLength: number;
  mostProductiveDay: string;
  studyConsistency: number;
  weeklyTrend: "improving" | "stable" | "declining";
}

export interface PredictionsData {
  completionDate: string;
  daysToComplete: number;
  recommendedDailyMinutes: number;
  optimalStudyTimes: string[];
  learningVelocity: number;
  burnoutRisk: "low" | "medium" | "high";
  confidence: number;
  insights: PredictionsInsights;
}

interface UsePredictionsResult {
  data: PredictionsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for fetching smart predictions data
 */
export function usePredictions(courseId: string): UsePredictionsResult {
  const [data, setData] = useState<PredictionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(
        `/api/courses/${courseId}/smart-predictions`
      );
      const responseData = await response.json();

      if (!response.ok || !responseData.success) {
        throw new Error(
          responseData.error?.message || "Failed to fetch predictions"
        );
      }

      setData(responseData.data);
    } catch (err) {
      console.error("Error fetching predictions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load predictions"
      );
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchPredictions,
  };
}

/**
 * Lightweight hook for just getting completion estimate
 */
export function useCompletionEstimate(courseId: string): {
  daysToComplete: number;
  completionDate: Date | null;
  isLoading: boolean;
} {
  const [estimate, setEstimate] = useState<{
    daysToComplete: number;
    completionDate: Date | null;
  }>({
    daysToComplete: 0,
    completionDate: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEstimate() {
      try {
        const response = await fetch(
          `/api/courses/${courseId}/smart-predictions`
        );
        const data = await response.json();

        if (response.ok && data.success) {
          setEstimate({
            daysToComplete: data.data.daysToComplete,
            completionDate: new Date(data.data.completionDate),
          });
        }
      } catch (err) {
        console.error("Error fetching completion estimate:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEstimate();
  }, [courseId]);

  return { ...estimate, isLoading };
}
