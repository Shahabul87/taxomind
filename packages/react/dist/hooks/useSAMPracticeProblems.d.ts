/**
 * @sam-ai/react - useSAMPracticeProblems Hook
 * React hook for practice problems generation and management
 */
import type { PracticeProblem, PracticeProblemInput, PracticeProblemOutput, ProblemEvaluation, ProblemHint, PracticeSessionStats, DifficultyRecommendation } from '@sam-ai/educational';
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
export declare function useSAMPracticeProblems(options?: UseSAMPracticeProblemsOptions): UseSAMPracticeProblemsReturn;
export default useSAMPracticeProblems;
//# sourceMappingURL=useSAMPracticeProblems.d.ts.map