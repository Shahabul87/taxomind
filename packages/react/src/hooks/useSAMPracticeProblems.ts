/**
 * @sam-ai/react - useSAMPracticeProblems Hook
 * React hook for practice problems generation and management
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  PracticeProblem,
  PracticeProblemInput,
  PracticeProblemOutput,
  ProblemEvaluation,
  ProblemHint,
  PracticeSessionStats,
  DifficultyRecommendation,
  ProblemDifficulty,
} from '@sam-ai/educational';
import type { BloomsLevel } from '@sam-ai/core';

/**
 * Options for the practice problems hook
 */
export interface UseSAMPracticeProblemsOptions {
  /** API endpoint for practice problems */
  apiEndpoint?: string;
  /** User ID for personalization */
  userId?: string;
  /** Course ID for context */
  courseId?: string;
  /** Section ID for context */
  sectionId?: string;
  /** Enable adaptive difficulty */
  adaptiveDifficulty?: boolean;
  /** Enable spaced repetition */
  spacedRepetition?: boolean;
  /** Callback when a problem is completed */
  onProblemComplete?: (problem: PracticeProblem, evaluation: ProblemEvaluation) => void;
  /** Callback when session stats update */
  onStatsUpdate?: (stats: PracticeSessionStats) => void;
}

/**
 * Return type for the practice problems hook
 */
export interface UseSAMPracticeProblemsReturn {
  /** Current set of problems */
  problems: PracticeProblem[];
  /** Currently active problem */
  currentProblem: PracticeProblem | null;
  /** Current problem index */
  currentIndex: number;
  /** Whether problems are being generated */
  isGenerating: boolean;
  /** Whether an answer is being evaluated */
  isEvaluating: boolean;
  /** Last evaluation result */
  lastEvaluation: ProblemEvaluation | null;
  /** Session statistics */
  sessionStats: PracticeSessionStats | null;
  /** Difficulty recommendation */
  difficultyRecommendation: DifficultyRecommendation | null;
  /** Error message if any */
  error: string | null;
  /** Hints used for current problem */
  hintsUsed: string[];
  /** Generate new practice problems */
  generateProblems: (input: PracticeProblemInput) => Promise<PracticeProblemOutput | null>;
  /** Submit an answer for evaluation */
  submitAnswer: (answer: string) => Promise<ProblemEvaluation | null>;
  /** Get next hint for current problem */
  getNextHint: () => ProblemHint | null;
  /** Move to next problem */
  nextProblem: () => void;
  /** Move to previous problem */
  previousProblem: () => void;
  /** Go to specific problem */
  goToProblem: (index: number) => void;
  /** Skip current problem */
  skipProblem: () => void;
  /** Reset the session */
  resetSession: () => void;
  /** Get adaptive difficulty recommendation */
  getRecommendedDifficulty: () => Promise<DifficultyRecommendation | null>;
  /** Get problems due for review (spaced repetition) */
  getReviewProblems: () => Promise<PracticeProblem[]>;
}

/**
 * Hook for SAM AI Practice Problems
 *
 * @example
 * ```tsx
 * function PracticeComponent() {
 *   const {
 *     problems,
 *     currentProblem,
 *     isGenerating,
 *     generateProblems,
 *     submitAnswer,
 *     getNextHint,
 *     nextProblem,
 *     sessionStats
 *   } = useSAMPracticeProblems({
 *     userId: user.id,
 *     courseId,
 *     adaptiveDifficulty: true
 *   });
 *
 *   const handleGenerate = async () => {
 *     await generateProblems({
 *       topic: 'JavaScript Closures',
 *       difficulty: 'intermediate',
 *       count: 5
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       {currentProblem && (
 *         <div>
 *           <h3>{currentProblem.title}</h3>
 *           <p>{currentProblem.statement}</p>
 *           <button onClick={getNextHint}>Get Hint</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSAMPracticeProblems(
  options: UseSAMPracticeProblemsOptions = {}
): UseSAMPracticeProblemsReturn {
  const {
    apiEndpoint = '/api/sam/practice-problems',
    userId,
    courseId,
    sectionId,
    adaptiveDifficulty = true,
    onProblemComplete,
    onStatsUpdate,
  } = options;

  const [problems, setProblems] = useState<PracticeProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastEvaluation, setLastEvaluation] = useState<ProblemEvaluation | null>(null);
  const [sessionStats, setSessionStats] = useState<PracticeSessionStats | null>(null);
  const [difficultyRecommendation, setDifficultyRecommendation] = useState<DifficultyRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState<string[]>([]);

  const sessionIdRef = useRef<string>(`session_${Date.now()}`);

  const currentProblem = problems[currentIndex] || null;

  /**
   * Generate new practice problems
   */
  const generateProblems = useCallback(
    async (input: PracticeProblemInput): Promise<PracticeProblemOutput | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch(`${apiEndpoint}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...input,
            userId,
            courseId,
            sectionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate problems: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const output = data.data as PracticeProblemOutput;
          setProblems(output.problems);
          setCurrentIndex(0);
          setHintsUsed([]);
          setLastEvaluation(null);
          return output;
        }

        throw new Error(data.error?.message || 'Failed to generate problems');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiEndpoint, userId, courseId, sectionId]
  );

  /**
   * Submit an answer for evaluation
   */
  const submitAnswer = useCallback(
    async (answer: string): Promise<ProblemEvaluation | null> => {
      if (!currentProblem) {
        setError('No problem selected');
        return null;
      }

      setIsEvaluating(true);
      setError(null);

      try {
        const response = await fetch(`${apiEndpoint}/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            problemId: currentProblem.id,
            problem: currentProblem,
            userAnswer: answer,
            hintsUsed,
            userId,
            sessionId: sessionIdRef.current,
          }),
        });

        if (!response.ok) {
          throw new Error(`Evaluation failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const evaluation = data.data as ProblemEvaluation;
          setLastEvaluation(evaluation);

          // Update stats if provided
          if (data.stats) {
            setSessionStats(data.stats);
            onStatsUpdate?.(data.stats);
          }

          // Callback
          onProblemComplete?.(currentProblem, evaluation);

          return evaluation;
        }

        throw new Error(data.error?.message || 'Evaluation failed');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        return null;
      } finally {
        setIsEvaluating(false);
      }
    },
    [apiEndpoint, currentProblem, hintsUsed, userId, onProblemComplete, onStatsUpdate]
  );

  /**
   * Get next hint for current problem
   */
  const getNextHint = useCallback((): ProblemHint | null => {
    if (!currentProblem) return null;

    const unusedHints = currentProblem.hints.filter((h) => !hintsUsed.includes(h.id));
    const sortedHints = unusedHints.sort((a, b) => a.order - b.order);

    if (sortedHints.length > 0) {
      const nextHint = sortedHints[0];
      setHintsUsed((prev) => [...prev, nextHint.id]);
      return nextHint;
    }

    return null;
  }, [currentProblem, hintsUsed]);

  /**
   * Move to next problem
   */
  const nextProblem = useCallback(() => {
    if (currentIndex < problems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setHintsUsed([]);
      setLastEvaluation(null);
    }
  }, [currentIndex, problems.length]);

  /**
   * Move to previous problem
   */
  const previousProblem = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setHintsUsed([]);
      setLastEvaluation(null);
    }
  }, [currentIndex]);

  /**
   * Go to specific problem
   */
  const goToProblem = useCallback(
    (index: number) => {
      if (index >= 0 && index < problems.length) {
        setCurrentIndex(index);
        setHintsUsed([]);
        setLastEvaluation(null);
      }
    },
    [problems.length]
  );

  /**
   * Skip current problem
   */
  const skipProblem = useCallback(() => {
    nextProblem();
  }, [nextProblem]);

  /**
   * Reset the session
   */
  const resetSession = useCallback(() => {
    setProblems([]);
    setCurrentIndex(0);
    setHintsUsed([]);
    setLastEvaluation(null);
    setSessionStats(null);
    setError(null);
    sessionIdRef.current = `session_${Date.now()}`;
  }, []);

  /**
   * Get adaptive difficulty recommendation
   */
  const getRecommendedDifficulty = useCallback(async (): Promise<DifficultyRecommendation | null> => {
    if (!userId || !adaptiveDifficulty) return null;

    try {
      const response = await fetch(`${apiEndpoint}/difficulty-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.success && data.data) {
        setDifficultyRecommendation(data.data);
        return data.data;
      }

      return null;
    } catch {
      return null;
    }
  }, [apiEndpoint, userId, courseId, adaptiveDifficulty]);

  /**
   * Get problems due for review (spaced repetition)
   */
  const getReviewProblems = useCallback(async (): Promise<PracticeProblem[]> => {
    if (!userId) return [];

    try {
      const response = await fetch(`${apiEndpoint}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, limit: 10 }),
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  }, [apiEndpoint, userId]);

  return {
    problems,
    currentProblem,
    currentIndex,
    isGenerating,
    isEvaluating,
    lastEvaluation,
    sessionStats,
    difficultyRecommendation,
    error,
    hintsUsed,
    generateProblems,
    submitAnswer,
    getNextHint,
    nextProblem,
    previousProblem,
    goToProblem,
    skipProblem,
    resetSession,
    getRecommendedDifficulty,
    getReviewProblems,
  };
}

export default useSAMPracticeProblems;
