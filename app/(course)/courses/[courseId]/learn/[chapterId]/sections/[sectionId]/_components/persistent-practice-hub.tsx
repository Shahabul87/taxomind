"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { usePersistentPractice } from "../_hooks/use-persistent-practice";
import { PracticeDashboard } from "./practice-dashboard";
import { PracticeSolver } from "./practice-solver";
import { PracticeResults } from "./practice-results";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type PracticeView = "dashboard" | "solving" | "results";

interface PersistentPracticeHubProps {
  sectionId: string;
  sectionTitle: string;
  userId: string;
  courseId: string;
  chapterId: string;
}

export function PersistentPracticeHub({
  sectionId,
  sectionTitle,
  userId,
  courseId,
  chapterId,
}: PersistentPracticeHubProps) {
  const [view, setView] = useState<PracticeView>("dashboard");
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const initialLoadRef = useRef(false);

  const {
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
  } = usePersistentPractice(sectionId);

  // Load sets on mount
  useEffect(() => {
    if (!initialLoadRef.current && userId) {
      initialLoadRef.current = true;
      fetchSets();
    }
  }, [fetchSets, userId]);

  // Transition to solving view when attempt starts
  useEffect(() => {
    if (currentAttempt && currentQuestions.length > 0) {
      setView("solving");
    }
  }, [currentAttempt, currentQuestions]);

  // Transition to results view when results arrive
  useEffect(() => {
    if (results) {
      setView("results");
    }
  }, [results]);

  const handleStart = useCallback(
    async (setId: string) => {
      setActiveSetId(setId);
      await startAttempt(setId);
    },
    [startAttempt]
  );

  const handleViewResults = useCallback(
    async (setId: string, attemptId: string) => {
      if (attemptId) {
        await fetchResults(setId, attemptId);
      } else {
        // Find the latest graded attempt for this set
        const set = sets.find((s) => s.id === setId);
        if (set && set.totalAttempts > 0) {
          // Fetch attempts list to get the latest
          try {
            const res = await fetch(`/api/courses/sections/${sectionId}/practice/${setId}/attempt`);
            const json = await res.json();
            if (json.success && json.data.length > 0) {
              const latestGraded = json.data.find(
                (a: { status: string }) => a.status === "GRADED"
              );
              if (latestGraded) {
                await fetchResults(setId, latestGraded.id);
              }
            }
          } catch {
            toast.error("Failed to load results");
          }
        }
      }
    },
    [fetchResults, sets, sectionId]
  );

  const handleRetry = useCallback(async () => {
    if (activeSetId) {
      clearResults();
      setView("dashboard");
      await startAttempt(activeSetId);
    }
  }, [activeSetId, clearResults, startAttempt]);

  const handleNewSet = useCallback(() => {
    clearResults();
    setView("dashboard");
  }, [clearResults]);

  const handleBackToDashboard = useCallback(() => {
    clearResults();
    setView("dashboard");
  }, [clearResults]);

  const handleCancel = useCallback(() => {
    clearResults();
    setView("dashboard");
  }, [clearResults]);

  const handleSubmit = useCallback(
    async (answers: Parameters<typeof submitAttempt>[0], timeSpent: number) => {
      await submitAttempt(answers, timeSpent);
      toast.success("Practice submitted! Reviewing your answers...");
    },
    [submitAttempt]
  );

  // Loading state
  if (isLoadingSets && sets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error display
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="outline" size="sm" onClick={clearError}>
          Dismiss
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[350px]">
      {view === "dashboard" && (
        <PracticeDashboard
          sets={sets}
          stats={stats}
          sectionTitle={sectionTitle}
          isGenerating={isGenerating}
          isStarting={isStarting}
          onGenerate={generateSet}
          onStart={handleStart}
          onViewResults={handleViewResults}
        />
      )}

      {view === "solving" && currentQuestions.length > 0 && (
        <PracticeSolver
          questions={currentQuestions}
          setTitle={currentSet?.title ?? sectionTitle}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {view === "results" && results && (
        <PracticeResults
          results={results}
          onRetry={handleRetry}
          onNewSet={handleNewSet}
          onBackToDashboard={handleBackToDashboard}
        />
      )}

      {/* Loading overlay for results */}
      {isLoadingResults && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Loading results...</span>
        </div>
      )}
    </div>
  );
}
