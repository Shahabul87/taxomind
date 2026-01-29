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
import type { BloomsLevel } from '@sam-ai/core';

// ============================================================================
// TYPES
// ============================================================================

export type BloomsSubLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

export interface CognitiveLoadData {
  totalLoad: number;
  loadCategory: 'low' | 'moderate' | 'high' | 'overload';
  intrinsicLoad: number;
  extraneousLoad: number;
  germaneLoad: number;
  balance: {
    status: 'optimal' | 'suboptimal' | 'problematic';
    extraneousMinimized: boolean;
    germaneMaximized: boolean;
    intrinsicAppropriate: boolean;
  };
  bloomsCompatibility?: {
    compatible: boolean;
    recommendedLevel: BloomsLevel;
    warning?: string;
  };
  recommendations: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    action: string;
  }>;
}

export interface EnhancedBloomsAnalysisResult {
  courseLevel: {
    distribution: Record<BloomsLevel, number>;
    cognitiveDepth: number;
    balance: 'well-balanced' | 'bottom-heavy' | 'top-heavy';
    confidence: number;
  };
  chapters: Array<{
    chapterId: string;
    chapterTitle: string;
    distribution: Record<BloomsLevel, number>;
    primaryLevel: BloomsLevel;
    cognitiveDepth: number;
    confidence: number;
    sections: Array<{
      id?: string;
      title: string;
      level: BloomsLevel;
      confidence: number;
      subLevel?: BloomsSubLevel;
      numericScore?: number;
      subLevelLabel?: string;
    }>;
  }>;
  learningPathway?: {
    stages: Array<{
      level: BloomsLevel;
      mastery: number;
      activities: string[];
      timeEstimate: number;
    }>;
    estimatedDuration: string;
    cognitiveProgression: BloomsLevel[];
    recommendations: string[];
  };
  recommendations: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high';
    targetLevel: BloomsLevel;
    description: string;
    expectedImpact: string;
  }>;
  analyzedAt: string;
  cognitiveLoad?: CognitiveLoadData;
}

export interface UseEnhancedBloomsAnalysisOptions {
  /** API endpoint for Bloom's analysis */
  apiEndpoint?: string;
  /** API endpoint for feedback submission */
  feedbackEndpoint?: string;
  /** Include sub-level granularity in analysis */
  includeSubLevel?: boolean;
  /** Include cognitive load analysis */
  includeCognitiveLoad?: boolean;
  /** Analysis depth */
  depth?: 'basic' | 'detailed' | 'comprehensive';
  /** Custom headers for API requests */
  headers?: Record<string, string>;
}

export interface UseEnhancedBloomsAnalysisReturn {
  /** Analyze a course for Bloom's Taxonomy levels */
  analyzeCourse: (courseId: string) => Promise<EnhancedBloomsAnalysisResult | null>;
  /** Submit feedback on a classification */
  submitFeedback: (feedback: FeedbackData) => Promise<FeedbackResult>;
  /** Whether analysis is in progress */
  isAnalyzing: boolean;
  /** Whether feedback submission is in progress */
  isSubmittingFeedback: boolean;
  /** Last analysis result */
  lastAnalysis: EnhancedBloomsAnalysisResult | null;
  /** Last error */
  error: Error | null;
  /** Clear the last error */
  clearError: () => void;
  /** Get a specific chapter's analysis */
  getChapterAnalysis: (chapterId: string) => EnhancedBloomsAnalysisResult['chapters'][0] | null;
  /** Get cognitive load summary */
  getCognitiveLoadSummary: () => CognitiveLoadData | null;
}

export interface FeedbackData {
  /** Content that was analyzed */
  content: string;
  /** Predicted level (1-6) */
  predictedLevel: number;
  /** Predicted sub-level */
  predictedSubLevel?: BloomsSubLevel;
  /** Predicted confidence (0-1) */
  predictedConfidence: number;
  /** Actual level (user correction) */
  actualLevel?: number;
  /** Actual sub-level (user correction) */
  actualSubLevel?: BloomsSubLevel;
  /** Assessment outcome for implicit feedback */
  assessmentOutcome?: number;
  /** Type of feedback */
  feedbackType: 'EXPLICIT' | 'IMPLICIT' | 'EXPERT';
  /** Course context */
  courseId?: string;
  /** Section context */
  sectionId?: string;
}

export interface FeedbackResult {
  success: boolean;
  feedbackId?: string;
  isCorrection?: boolean;
  error?: string;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

const DEFAULT_OPTIONS: Required<UseEnhancedBloomsAnalysisOptions> = {
  apiEndpoint: '/api/sam/blooms-analysis',
  feedbackEndpoint: '/api/sam/blooms-feedback',
  includeSubLevel: true,
  includeCognitiveLoad: false,
  depth: 'detailed',
  headers: {},
};

export function useEnhancedBloomsAnalysis(
  options: UseEnhancedBloomsAnalysisOptions = {}
): UseEnhancedBloomsAnalysisReturn {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<EnhancedBloomsAnalysisResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to access latest analysis in callbacks without adding to deps
  const analysisRef = useRef<EnhancedBloomsAnalysisResult | null>(null);
  analysisRef.current = lastAnalysis;

  /**
   * Analyze a course for Bloom's Taxonomy levels with enhanced features
   */
  const analyzeCourse = useCallback(
    async (courseId: string): Promise<EnhancedBloomsAnalysisResult | null> => {
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

        const analysisResult: EnhancedBloomsAnalysisResult = result.data;
        setLastAnalysis(analysisResult);
        return analysisResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [mergedOptions.apiEndpoint, mergedOptions.depth, mergedOptions.includeSubLevel, mergedOptions.includeCognitiveLoad, mergedOptions.headers]
  );

  /**
   * Submit feedback on a Bloom's classification
   */
  const submitFeedback = useCallback(
    async (feedback: FeedbackData): Promise<FeedbackResult> => {
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
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        return {
          success: false,
          error: error.message,
        };
      } finally {
        setIsSubmittingFeedback(false);
      }
    },
    [mergedOptions.feedbackEndpoint, mergedOptions.headers]
  );

  /**
   * Clear the last error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get a specific chapter's analysis from the last result
   */
  const getChapterAnalysis = useCallback(
    (chapterId: string): EnhancedBloomsAnalysisResult['chapters'][0] | null => {
      const analysis = analysisRef.current;
      if (!analysis) return null;
      return analysis.chapters.find((ch) => ch.chapterId === chapterId) ?? null;
    },
    []
  );

  /**
   * Get cognitive load summary from the last result
   */
  const getCognitiveLoadSummary = useCallback((): CognitiveLoadData | null => {
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
