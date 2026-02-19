'use client';

/**
 * useLearningAnalyticsTool
 *
 * Hook for managing learning analytics tool interactions in SAM chat.
 * Handles conversation state, option selection, and generation triggering.
 */

import { useState, useCallback } from 'react';
import type { ConversationalOption } from '../ConversationalOptions';

// =============================================================================
// TYPES
// =============================================================================

export interface LearningAnalyticsToolOutput {
  type: 'conversation' | 'generate_analytics';
  conversationId?: string;
  step?: string;
  question?: string;
  options?: ConversationalOption[];
  hint?: string;
  collected?: Record<string, unknown>;
  message?: string;
  retryReason?: string;
  progress?: {
    current: number;
    total: number;
  };
  params?: {
    scope: string;
    courseId?: string;
    timeRange: string;
    metricFocus: string;
    includeRecommendations: boolean;
  };
  summary?: string;
  apiEndpoint?: string;
  triggerGeneration?: boolean;
}

export interface LearningAnalyticsResult {
  scope: string;
  timeRange: string;
  generatedAt: string;

  overview: {
    totalCourses: number;
    totalHoursLearned: number;
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    level: number;
  };

  progress: {
    completionRate: number;
    chaptersCompleted: number;
    sectionsCompleted: number;
    assessmentsPassed: number;
    progressTrend: 'up' | 'down' | 'stable';
    progressByDay: Array<{ date: string; progress: number }>;
  };

  mastery: {
    bloomsDistribution: Record<string, number>;
    averageMasteryLevel: number;
    skillsInProgress: number;
    skillsMastered: number;
    weakAreas: string[];
    strongAreas: string[];
  };

  engagement: {
    averageSessionDuration: number;
    sessionsPerWeek: number;
    mostActiveDay: string;
    mostActiveTime: string;
    engagementTrend: 'up' | 'down' | 'stable';
  };

  goals?: {
    activeGoals: number;
    completedGoals: number;
    goalProgress: Array<{
      id: string;
      title: string;
      progress: number;
      dueDate?: string;
    }>;
  };

  recommendations?: string[];

  comparison?: {
    previousPeriod: {
      progressDelta: number;
      timeDelta: number;
      engagementDelta: number;
    };
  };

  courseDetails?: {
    id: string;
    title: string;
    progress: number;
    chaptersTotal: number;
    chaptersCompleted: number;
  };
}

interface UseLearningAnalyticsToolOptions {
  onSendMessage: (message: string) => void;
  onAnalyticsComplete?: (analytics: LearningAnalyticsResult) => void;
  onAnalyticsError?: (error: string) => void;
}

interface UseLearningAnalyticsToolReturn {
  // State
  conversationId: string | null;
  isGenerating: boolean;
  generationParams: LearningAnalyticsToolOutput['params'] | null;
  completedAnalytics: LearningAnalyticsResult | null;
  generationError: string | null;

  // Actions
  handleOptionSelect: (value: string) => void;
  handleTextResponse: (text: string) => void;
  handleGenerationComplete: (analytics: LearningAnalyticsResult) => void;
  handleGenerationError: (error: string) => void;
  resetState: () => void;

  // Utilities
  parseToolOutput: (output: unknown) => LearningAnalyticsToolOutput | null;
  isLearningAnalyticsOutput: (output: unknown) => boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useLearningAnalyticsTool({
  onSendMessage,
  onAnalyticsComplete,
  onAnalyticsError,
}: UseLearningAnalyticsToolOptions): UseLearningAnalyticsToolReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationParams, setGenerationParams] = useState<LearningAnalyticsToolOutput['params'] | null>(null);
  const [completedAnalytics, setCompletedAnalytics] = useState<LearningAnalyticsResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  /**
   * Parse tool output to typed structure
   */
  const parseToolOutput = useCallback((output: unknown): LearningAnalyticsToolOutput | null => {
    if (!output || typeof output !== 'object') return null;

    const data = output as Record<string, unknown>;

    // Check if it's a learning analytics tool output
    if (data.type !== 'conversation' && data.type !== 'generate_analytics') {
      return null;
    }

    return data as unknown as LearningAnalyticsToolOutput;
  }, []);

  /**
   * Check if output is from learning analytics tool
   */
  const isLearningAnalyticsOutput = useCallback((output: unknown): boolean => {
    return parseToolOutput(output) !== null;
  }, [parseToolOutput]);

  /**
   * Handle option selection from ConversationalOptions
   */
  const handleOptionSelect = useCallback(
    (value: string) => {
      if (!conversationId) return;

      // Send the selected value as a message to continue the conversation
      onSendMessage(value);
    },
    [conversationId, onSendMessage]
  );

  /**
   * Handle free-text response
   */
  const handleTextResponse = useCallback(
    (text: string) => {
      onSendMessage(text);
    },
    [onSendMessage]
  );

  /**
   * Handle successful analytics generation
   */
  const handleGenerationComplete = useCallback(
    (analytics: LearningAnalyticsResult) => {
      setIsGenerating(false);
      setCompletedAnalytics(analytics);
      setGenerationParams(null);
      setConversationId(null);
      onAnalyticsComplete?.(analytics);
    },
    [onAnalyticsComplete]
  );

  /**
   * Handle generation error
   */
  const handleGenerationError = useCallback(
    (error: string) => {
      setIsGenerating(false);
      setGenerationError(error);
      onAnalyticsError?.(error);
    },
    [onAnalyticsError]
  );

  /**
   * Reset all state
   */
  const resetState = useCallback(() => {
    setConversationId(null);
    setIsGenerating(false);
    setGenerationParams(null);
    setCompletedAnalytics(null);
    setGenerationError(null);
  }, []);

  /**
   * Process tool output and update state accordingly
   */
  const processToolOutput = useCallback(
    (output: LearningAnalyticsToolOutput) => {
      if (output.type === 'conversation') {
        // Update conversation state
        if (output.conversationId) {
          setConversationId(output.conversationId);
        }
        setIsGenerating(false);
        setGenerationParams(null);
      } else if (output.type === 'generate_analytics' && output.triggerGeneration) {
        // Trigger generation
        setIsGenerating(true);
        setGenerationParams(output.params ?? null);
        setConversationId(null);
      }
    },
    []
  );

  // Expose processToolOutput via parseToolOutput for external use
  const enhancedParseToolOutput = useCallback(
    (output: unknown): LearningAnalyticsToolOutput | null => {
      const parsed = parseToolOutput(output);
      if (parsed) {
        processToolOutput(parsed);
      }
      return parsed;
    },
    [parseToolOutput, processToolOutput]
  );

  return {
    // State
    conversationId,
    isGenerating,
    generationParams,
    completedAnalytics,
    generationError,

    // Actions
    handleOptionSelect,
    handleTextResponse,
    handleGenerationComplete,
    handleGenerationError,
    resetState,

    // Utilities
    parseToolOutput: enhancedParseToolOutput,
    isLearningAnalyticsOutput,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract learning analytics tool output from SAM message
 */
export function extractToolOutput(message: {
  toolExecution?: {
    toolId?: string;
    result?: unknown;
  };
}): LearningAnalyticsToolOutput | null {
  if (
    message.toolExecution?.toolId === 'sam-learning-analytics' &&
    message.toolExecution?.result
  ) {
    const result = message.toolExecution.result as Record<string, unknown>;
    if (result.output) {
      return result.output as LearningAnalyticsToolOutput;
    }
  }
  return null;
}

/**
 * Check if a SAM message contains learning analytics tool output
 */
export function hasLearningAnalyticsOutput(message: {
  toolExecution?: {
    toolId?: string;
  };
}): boolean {
  return message.toolExecution?.toolId === 'sam-learning-analytics';
}
