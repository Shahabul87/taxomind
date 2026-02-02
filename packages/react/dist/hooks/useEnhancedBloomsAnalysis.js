/**
 * @sam-ai/react - useEnhancedBloomsAnalysis Hook
 *
 * Phase 1-6: Enhanced Bloom's Taxonomy analysis with:
 * - Sub-level granularity (BASIC/INTERMEDIATE/ADVANCED)
 * - Cognitive load analysis
 * - Feedback collection for calibration
 * - Multimedia content analysis
 */
'use client';
import { useState, useCallback, useRef } from 'react';
// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================
const DEFAULT_OPTIONS = {
    apiEndpoint: '/api/sam/blooms-analysis',
    feedbackEndpoint: '/api/sam/blooms-feedback',
    includeSubLevel: true,
    includeCognitiveLoad: false,
    depth: 'detailed',
    headers: {},
};
export function useEnhancedBloomsAnalysis(options = {}) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [lastAnalysis, setLastAnalysis] = useState(null);
    const [error, setError] = useState(null);
    // Use ref to access latest analysis in callbacks without adding to deps
    const analysisRef = useRef(null);
    analysisRef.current = lastAnalysis;
    /**
     * Analyze a course for Bloom's Taxonomy levels with enhanced features
     */
    const analyzeCourse = useCallback(async (courseId) => {
        setIsAnalyzing(true);
        setError(null);
        try {
            const response = await fetch(mergedOptions.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...mergedOptions.headers,
                },
                body: JSON.stringify({
                    courseId,
                    depth: mergedOptions.depth,
                    includeSubLevel: mergedOptions.includeSubLevel,
                    includeCognitiveLoad: mergedOptions.includeCognitiveLoad,
                    includeRecommendations: true,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error ?? `Analysis failed: ${response.status}`);
            }
            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error ?? 'Analysis failed');
            }
            const analysisResult = result.data;
            setLastAnalysis(analysisResult);
            return analysisResult;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            return null;
        }
        finally {
            setIsAnalyzing(false);
        }
    }, [mergedOptions.apiEndpoint, mergedOptions.depth, mergedOptions.includeSubLevel, mergedOptions.includeCognitiveLoad, mergedOptions.headers]);
    /**
     * Submit feedback on a Bloom's classification
     */
    const submitFeedback = useCallback(async (feedback) => {
        setIsSubmittingFeedback(true);
        try {
            const response = await fetch(mergedOptions.feedbackEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...mergedOptions.headers,
                },
                body: JSON.stringify(feedback),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.error ?? `Feedback submission failed: ${response.status}`,
                };
            }
            const result = await response.json();
            if (!result.success) {
                return {
                    success: false,
                    error: result.error ?? 'Feedback submission failed',
                };
            }
            return {
                success: true,
                feedbackId: result.data.feedbackId,
                isCorrection: result.data.isCorrection,
            };
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            return {
                success: false,
                error: error.message,
            };
        }
        finally {
            setIsSubmittingFeedback(false);
        }
    }, [mergedOptions.feedbackEndpoint, mergedOptions.headers]);
    /**
     * Clear the last error
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);
    /**
     * Get a specific chapter's analysis from the last result
     */
    const getChapterAnalysis = useCallback((chapterId) => {
        const analysis = analysisRef.current;
        if (!analysis)
            return null;
        return analysis.chapters.find((ch) => ch.chapterId === chapterId) ?? null;
    }, []);
    /**
     * Get cognitive load summary from the last result
     */
    const getCognitiveLoadSummary = useCallback(() => {
        const analysis = analysisRef.current;
        return analysis?.cognitiveLoad ?? null;
    }, []);
    return {
        analyzeCourse,
        submitFeedback,
        isAnalyzing,
        isSubmittingFeedback,
        lastAnalysis,
        error,
        clearError,
        getChapterAnalysis,
        getCognitiveLoadSummary,
    };
}
