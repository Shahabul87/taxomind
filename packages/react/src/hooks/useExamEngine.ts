/**
 * @sam-ai/react - useExamEngine Hook
 * React hook for SAM AI exam generation and management
 *
 * This hook provides access to the portable @sam-ai/educational
 * ExamEngine for generating exams with Bloom's Taxonomy alignment.
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import type { BloomsLevel, QuestionType, QuestionDifficulty } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

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
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
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

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_BLOOMS_DISTRIBUTION: BloomsDistribution = {
  REMEMBER: 15,
  UNDERSTAND: 20,
  APPLY: 25,
  ANALYZE: 20,
  EVALUATE: 15,
  CREATE: 5,
};

const DEFAULT_DIFFICULTY_DISTRIBUTION: DifficultyDistribution = {
  EASY: 30,
  MEDIUM: 50,
  HARD: 20,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

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
export function useExamEngine(
  options: UseExamEngineOptions = {}
): UseExamEngineReturn {
  const {
    apiEndpoint = '/api/sam/exam-engine',
    courseId,
    sectionIds,
    includeStudentProfile = true,
    onExamGenerated,
    onError,
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<GeneratedExamResponse | null>(null);
  const [examWithProfile, setExamWithProfile] = useState<ExamWithProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use ref to access latest options in callbacks
  const optionsRef = useRef(options);
  optionsRef.current = options;

  /**
   * Generate a new exam
   */
  const generateExam = useCallback(
    async (config: ExamGenerationConfig): Promise<GeneratedExamResponse | null> => {
      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId,
            sectionIds,
            config: {
              totalQuestions: config.totalQuestions,
              timeLimit: config.timeLimit,
              bloomsDistribution: {
                ...DEFAULT_BLOOMS_DISTRIBUTION,
                ...config.bloomsDistribution,
              },
              difficultyDistribution: {
                ...DEFAULT_DIFFICULTY_DISTRIBUTION,
                ...config.difficultyDistribution,
              },
              questionTypes: config.questionTypes || ['MULTIPLE_CHOICE', 'SHORT_ANSWER'],
              adaptiveMode: config.adaptiveMode ?? false,
            },
            includeStudentProfile,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to generate exam: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const exam = data.data as GeneratedExamResponse;
          setGeneratedExam(exam);
          onExamGenerated?.(exam);
          return exam;
        }

        throw new Error(data.error || 'Failed to generate exam');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        onError?.(message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [apiEndpoint, courseId, sectionIds, includeStudentProfile, onExamGenerated, onError]
  );

  /**
   * Get exam with Bloom's profile
   */
  const getExam = useCallback(
    async (examId: string): Promise<ExamWithProfile | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ examId });
        const response = await fetch(`${apiEndpoint}?${params}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to get exam: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
          const exam = data.data as ExamWithProfile;
          setExamWithProfile(exam);
          return exam;
        }

        throw new Error(data.error || 'Failed to get exam');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        onError?.(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, onError]
  );

  /**
   * Get default Bloom's distribution
   */
  const getDefaultBloomsDistribution = useCallback((): BloomsDistribution => {
    return { ...DEFAULT_BLOOMS_DISTRIBUTION };
  }, []);

  /**
   * Get default difficulty distribution
   */
  const getDefaultDifficultyDistribution = useCallback((): DifficultyDistribution => {
    return { ...DEFAULT_DIFFICULTY_DISTRIBUTION };
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setGeneratedExam(null);
    setExamWithProfile(null);
    setError(null);
  }, []);

  return {
    isGenerating,
    isLoading,
    generatedExam,
    examWithProfile,
    error,
    generateExam,
    getExam,
    getDefaultBloomsDistribution,
    getDefaultDifficultyDistribution,
    reset,
  };
}

export default useExamEngine;
