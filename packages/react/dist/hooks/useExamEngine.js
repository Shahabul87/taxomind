/**
 * @sam-ai/react - useExamEngine Hook
 * React hook for SAM AI exam generation and management
 *
 * This hook provides access to the portable @sam-ai/educational
 * ExamEngine for generating exams with Bloom's Taxonomy alignment.
 */
'use client';
import { useState, useCallback, useRef } from 'react';
// ============================================================================
// CONSTANTS
// ============================================================================
const DEFAULT_BLOOMS_DISTRIBUTION = {
    REMEMBER: 15,
    UNDERSTAND: 20,
    APPLY: 25,
    ANALYZE: 20,
    EVALUATE: 15,
    CREATE: 5,
};
const DEFAULT_DIFFICULTY_DISTRIBUTION = {
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
export function useExamEngine(options = {}) {
    const { apiEndpoint = '/api/sam/exam-engine', courseId, sectionIds, includeStudentProfile = true, onExamGenerated, onError, } = options;
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedExam, setGeneratedExam] = useState(null);
    const [examWithProfile, setExamWithProfile] = useState(null);
    const [error, setError] = useState(null);
    // Use ref to access latest options in callbacks
    const optionsRef = useRef(options);
    optionsRef.current = options;
    /**
     * Generate a new exam
     */
    const generateExam = useCallback(async (config) => {
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
                const exam = data.data;
                setGeneratedExam(exam);
                onExamGenerated?.(exam);
                return exam;
            }
            throw new Error(data.error || 'Failed to generate exam');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            onError?.(message);
            return null;
        }
        finally {
            setIsGenerating(false);
        }
    }, [apiEndpoint, courseId, sectionIds, includeStudentProfile, onExamGenerated, onError]);
    /**
     * Get exam with Bloom's profile
     */
    const getExam = useCallback(async (examId) => {
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
                const exam = data.data;
                setExamWithProfile(exam);
                return exam;
            }
            throw new Error(data.error || 'Failed to get exam');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setError(message);
            onError?.(message);
            return null;
        }
        finally {
            setIsLoading(false);
        }
    }, [apiEndpoint, onError]);
    /**
     * Get default Bloom's distribution
     */
    const getDefaultBloomsDistribution = useCallback(() => {
        return { ...DEFAULT_BLOOMS_DISTRIBUTION };
    }, []);
    /**
     * Get default difficulty distribution
     */
    const getDefaultDifficultyDistribution = useCallback(() => {
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
