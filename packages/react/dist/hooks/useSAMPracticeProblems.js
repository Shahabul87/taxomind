/**
 * @sam-ai/react - useSAMPracticeProblems Hook
 * React hook for practice problems generation and management
 */
'use client';
import { useState, useCallback, useRef } from 'react';
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
export function useSAMPracticeProblems(options = {}) {
    const { apiEndpoint = '/api/sam/practice-problems', userId, courseId, sectionId, adaptiveDifficulty = true, onProblemComplete, onStatsUpdate, } = options;
    const [problems, setProblems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [lastEvaluation, setLastEvaluation] = useState(null);
    const [sessionStats, setSessionStats] = useState(null);
    const [difficultyRecommendation, setDifficultyRecommendation] = useState(null);
    const [error, setError] = useState(null);
    const [hintsUsed, setHintsUsed] = useState([]);
    const sessionIdRef = useRef(`session_${Date.now()}`);
    const currentProblem = problems[currentIndex] || null;
    /**
     * Generate new practice problems
     */
    const generateProblems = useCallback(async (input) => {
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
                const output = data.data;
                setProblems(output.problems);
                setCurrentIndex(0);
                setHintsUsed([]);
                setLastEvaluation(null);
                return output;
            }
            throw new Error(data.error?.message || 'Failed to generate problems');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        }
        finally {
            setIsGenerating(false);
        }
    }, [apiEndpoint, userId, courseId, sectionId]);
    /**
     * Submit an answer for evaluation
     */
    const submitAnswer = useCallback(async (answer) => {
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
                const evaluation = data.data;
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            return null;
        }
        finally {
            setIsEvaluating(false);
        }
    }, [apiEndpoint, currentProblem, hintsUsed, userId, onProblemComplete, onStatsUpdate]);
    /**
     * Get next hint for current problem
     */
    const getNextHint = useCallback(() => {
        if (!currentProblem)
            return null;
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
    const goToProblem = useCallback((index) => {
        if (index >= 0 && index < problems.length) {
            setCurrentIndex(index);
            setHintsUsed([]);
            setLastEvaluation(null);
        }
    }, [problems.length]);
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
    const getRecommendedDifficulty = useCallback(async () => {
        if (!userId || !adaptiveDifficulty)
            return null;
        try {
            const response = await fetch(`${apiEndpoint}/difficulty-recommendation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, courseId }),
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            if (data.success && data.data) {
                setDifficultyRecommendation(data.data);
                return data.data;
            }
            return null;
        }
        catch {
            return null;
        }
    }, [apiEndpoint, userId, courseId, adaptiveDifficulty]);
    /**
     * Get problems due for review (spaced repetition)
     */
    const getReviewProblems = useCallback(async () => {
        if (!userId)
            return [];
        try {
            const response = await fetch(`${apiEndpoint}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, limit: 10 }),
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.success ? data.data : [];
        }
        catch {
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
