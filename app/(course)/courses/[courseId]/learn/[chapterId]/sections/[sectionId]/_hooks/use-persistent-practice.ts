"use client";

import { useState, useCallback, useRef } from "react";
import type {
  PracticeProblemSetSummary,
  PracticeQuestionForSolving,
  PracticeAttemptResults,
  PracticeStats,
  PracticeAnswerInput,
} from "@/types/practice-problems";
import type { GeneratePracticeSetInput } from "@/lib/validations/practice-problems";

interface PracticeSetWithQuestions {
  id: string;
  title: string | null;
  topic: string;
  difficulty: string | null;
  bloomsLevel: string | null;
}

interface AttemptInfo {
  id: string;
  attemptNumber: number;
  status: string;
  startedAt: string;
  totalQuestions: number;
  totalPoints: number;
}

interface StartAttemptData {
  attempt: AttemptInfo;
  set: PracticeSetWithQuestions;
  questions: PracticeQuestionForSolving[];
}

interface UsePersistentPracticeReturn {
  sets: PracticeProblemSetSummary[];
  stats: PracticeStats | null;
  currentAttempt: AttemptInfo | null;
  currentQuestions: PracticeQuestionForSolving[];
  currentSet: PracticeSetWithQuestions | null;
  results: PracticeAttemptResults | null;
  isLoadingSets: boolean;
  isGenerating: boolean;
  isStarting: boolean;
  isSubmitting: boolean;
  isLoadingResults: boolean;
  error: string | null;
  fetchSets: () => Promise<void>;
  generateSet: (input: GeneratePracticeSetInput) => Promise<string | null>;
  startAttempt: (setId: string) => Promise<void>;
  submitAttempt: (answers: PracticeAnswerInput[], timeSpent: number) => Promise<void>;
  fetchResults: (setId: string, attemptId: string) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export function usePersistentPractice(sectionId: string): UsePersistentPracticeReturn {
  const [sets, setSets] = useState<PracticeProblemSetSummary[]>([]);
  const [stats, setStats] = useState<PracticeStats | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<AttemptInfo | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<PracticeQuestionForSolving[]>([]);
  const [currentSet, setCurrentSet] = useState<PracticeSetWithQuestions | null>(null);
  const [results, setResults] = useState<PracticeAttemptResults | null>(null);
  const [isLoadingSets, setIsLoadingSets] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoadingRef = useRef(false);

  const basePath = `/api/courses/sections/${sectionId}/practice`;

  const fetchSets = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoadingSets(true);
    setError(null);

    try {
      const res = await fetch(basePath);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to fetch practice sets");
      }
      setSets(json.data.sets);
      setStats(json.data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch practice sets");
    } finally {
      setIsLoadingSets(false);
      isLoadingRef.current = false;
    }
  }, [basePath]);

  const generateSet = useCallback(
    async (input: GeneratePracticeSetInput): Promise<string | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const res = await fetch(`${basePath}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to generate practice set");
        }

        // Refresh list
        await fetchSets();
        return json.data.id as string;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate practice set");
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [basePath, fetchSets]
  );

  const startAttempt = useCallback(
    async (setId: string) => {
      setIsStarting(true);
      setError(null);

      try {
        const res = await fetch(`${basePath}/${setId}/attempt`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to start attempt");
        }

        const data = json.data as StartAttemptData;
        setCurrentAttempt(data.attempt);
        setCurrentQuestions(data.questions);
        setCurrentSet(data.set);
        setResults(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start attempt");
      } finally {
        setIsStarting(false);
      }
    },
    [basePath]
  );

  const submitAttempt = useCallback(
    async (answers: PracticeAnswerInput[], timeSpent: number) => {
      if (!currentAttempt || !currentSet) return;
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch(
          `${basePath}/${currentSet.id}/attempt/${currentAttempt.id}/submit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers, timeSpent }),
          }
        );
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to submit attempt");
        }

        setResults(json.data as PracticeAttemptResults);
        setCurrentAttempt(null);
        setCurrentQuestions([]);
        // Refresh sets for updated stats
        await fetchSets();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit attempt");
      } finally {
        setIsSubmitting(false);
      }
    },
    [basePath, currentAttempt, currentSet, fetchSets]
  );

  const fetchResults = useCallback(
    async (setId: string, attemptId: string) => {
      setIsLoadingResults(true);
      setError(null);

      try {
        const res = await fetch(`${basePath}/${setId}/attempt/${attemptId}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Failed to fetch results");
        }
        setResults(json.data as PracticeAttemptResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch results");
      } finally {
        setIsLoadingResults(false);
      }
    },
    [basePath]
  );

  const clearResults = useCallback(() => {
    setResults(null);
    setCurrentAttempt(null);
    setCurrentQuestions([]);
    setCurrentSet(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sets,
    stats,
    currentAttempt,
    currentQuestions,
    currentSet,
    results,
    isLoadingSets,
    isGenerating,
    isStarting,
    isSubmitting,
    isLoadingResults,
    error,
    fetchSets,
    generateSet,
    startAttempt,
    submitAttempt,
    fetchResults,
    clearResults,
    clearError,
  };
}
