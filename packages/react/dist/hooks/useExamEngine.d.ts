/**
 * @sam-ai/react - useExamEngine Hook
 * React hook for SAM AI exam generation and management
 *
 * This hook provides access to the portable @sam-ai/educational
 * ExamEngine for generating exams with Bloom's Taxonomy alignment.
 */
import type { BloomsLevel, QuestionType, QuestionDifficulty } from '@prisma/client';
/**
 * Bloom's distribution for exam generation
 */
export interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
}
/**
 * Difficulty distribution for exam generation
 */
export interface DifficultyDistribution {
    EASY: number;
    MEDIUM: number;
    HARD: number;
}
/**
 * Exam generation configuration
 */
export interface ExamGenerationConfig {
    totalQuestions: number;
    timeLimit?: number;
    bloomsDistribution?: Partial<BloomsDistribution>;
    difficultyDistribution?: Partial<DifficultyDistribution>;
    questionTypes?: QuestionType[];
    adaptiveMode?: boolean;
}
/**
 * Generated question data
 */
export interface GeneratedQuestion {
    id: string;
    text: string;
    type: QuestionType;
    bloomsLevel: BloomsLevel;
    difficulty: QuestionDifficulty;
    options?: Array<{
        id: string;
        text: string;
        isCorrect: boolean;
    }>;
    correctAnswer: string;
    explanation?: string;
    estimatedTime: number;
    points: number;
    tags?: string[];
}
/**
 * Bloom's analysis result
 */
export interface BloomsAnalysisResult {
    targetVsActual: {
        alignmentScore: number;
        deviations: Record<BloomsLevel, number>;
    };
    distribution: BloomsDistribution;
    recommendations: string[];
}
/**
 * Generated exam response
 */
export interface GeneratedExamResponse {
    examId: string;
    questions: GeneratedQuestion[];
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number;
    bloomsAnalysis: BloomsAnalysisResult;
    metadata: {
        generatedAt: string;
        engine: string;
        adaptiveMode: boolean;
    };
}
/**
 * Exam with Bloom's profile
 */
export interface ExamWithProfile {
    exam: {
        id: string;
        title: string;
        timeLimit: number | null;
        isActive: boolean;
    };
    bloomsProfile: {
        targetDistribution: BloomsDistribution;
        actualDistribution: BloomsDistribution;
        difficultyMatrix: Record<string, unknown>;
        skillsAssessed: string[];
        coverageMap: Record<string, unknown>;
    } | null;
}
/**
 * Options for the exam engine hook
 */
export interface UseExamEngineOptions {
    /** API endpoint for exam engine */
    apiEndpoint?: string;
    /** Course ID for context */
    courseId?: string;
    /** Section IDs for scope */
    sectionIds?: string[];
    /** Include student profile for adaptive generation */
    includeStudentProfile?: boolean;
    /** Callback when exam is generated */
    onExamGenerated?: (exam: GeneratedExamResponse) => void;
    /** Callback on error */
    onError?: (error: string) => void;
}
/**
 * Return type for the exam engine hook
 */
export interface UseExamEngineReturn {
    /** Whether exam is being generated */
    isGenerating: boolean;
    /** Whether exam is being loaded */
    isLoading: boolean;
    /** Last generated exam */
    generatedExam: GeneratedExamResponse | null;
    /** Loaded exam with Bloom's profile */
    examWithProfile: ExamWithProfile | null;
    /** Error message if any */
    error: string | null;
    /** Generate a new exam */
    generateExam: (config: ExamGenerationConfig) => Promise<GeneratedExamResponse | null>;
    /** Get exam with Bloom's profile */
    getExam: (examId: string) => Promise<ExamWithProfile | null>;
    /** Get default Bloom's distribution */
    getDefaultBloomsDistribution: () => BloomsDistribution;
    /** Get default difficulty distribution */
    getDefaultDifficultyDistribution: () => DifficultyDistribution;
    /** Clear state */
    reset: () => void;
}
/**
 * Hook for SAM AI Exam Engine
 *
 * @example
 * ```tsx
 * function ExamGenerator() {
 *   const {
 *     isGenerating,
 *     generatedExam,
 *     error,
 *     generateExam,
 *     getDefaultBloomsDistribution,
 *   } = useExamEngine({
 *     courseId: course.id,
 *     sectionIds: [section.id],
 *     onExamGenerated: (exam) => {
 *       console.log('Generated exam:', exam);
 *     },
 *   });
 *
 *   const handleGenerate = async () => {
 *     await generateExam({
 *       totalQuestions: 20,
 *       timeLimit: 60,
 *       bloomsDistribution: getDefaultBloomsDistribution(),
 *       questionTypes: ['MULTIPLE_CHOICE', 'SHORT_ANSWER'],
 *       adaptiveMode: true,
 *     });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleGenerate} disabled={isGenerating}>
 *         {isGenerating ? 'Generating...' : 'Generate Exam'}
 *       </button>
 *       {generatedExam && (
 *         <div>
 *           <p>Generated {generatedExam.totalQuestions} questions</p>
 *           <p>Alignment score: {generatedExam.bloomsAnalysis.targetVsActual.alignmentScore}%</p>
 *         </div>
 *       )}
 *       {error && <p className="error">{error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export declare function useExamEngine(options?: UseExamEngineOptions): UseExamEngineReturn;
export default useExamEngine;
//# sourceMappingURL=useExamEngine.d.ts.map