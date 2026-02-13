'use client';

/**
 * useSkillNavigatorTool
 *
 * Hook for managing NAVIGATOR skill builder tool interactions in SAM chat.
 * Handles conversation state, option selection, and generation triggering.
 * Same pattern as useSkillRoadmapTool but with NAVIGATOR-specific types.
 */

import { useState, useCallback } from 'react';
import type { ConversationalOption } from '../ConversationalOptions';

// =============================================================================
// TYPES
// =============================================================================

export interface SkillNavigatorToolOutput {
  type: 'conversation' | 'generate_roadmap';
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
    skillName: string;
    goalOutcome: string;
    goalType: string;
    currentLevel: string;
    targetLevel: string;
    hoursPerWeek: number;
    deadline: string;
    learningStyle: string;
  };
  summary?: string;
  apiEndpoint?: string;
  triggerGeneration?: boolean;
}

export interface NavigatorRoadmapResult {
  roadmapId: string;
  title: string;
  description: string;
  totalEstimatedHours: number;
  milestoneCount: number;
  milestones: Array<{
    id: string;
    order: number;
    title: string;
    status: string;
    estimatedHours: number;
    exitRamp: string;
  }>;
  matchedCourses: number;
  totalCourses: number;
  skillGraphSummary: {
    totalNodes: number;
    criticalPath: string[];
    blockerCount: number;
  };
  gapHighlights: {
    criticalGaps: string[];
    totalGapHours: number;
  };
  contingencyPlans: Array<{
    scenario: string;
    trigger: string;
    action: string;
    adjustments: string[];
  }>;
}

interface UseSkillNavigatorToolOptions {
  onSendMessage: (message: string) => void;
  onRoadmapComplete?: (roadmap: NavigatorRoadmapResult) => void;
  onRoadmapError?: (error: string) => void;
}

interface UseSkillNavigatorToolReturn {
  // State
  conversationId: string | null;
  isGenerating: boolean;
  generationParams: SkillNavigatorToolOutput['params'] | null;
  completedRoadmap: NavigatorRoadmapResult | null;
  generationError: string | null;

  // Actions
  handleOptionSelect: (value: string) => void;
  handleTextResponse: (text: string) => void;
  handleGenerationComplete: (roadmap: NavigatorRoadmapResult) => void;
  handleGenerationError: (error: string) => void;
  resetState: () => void;

  // Utilities
  parseToolOutput: (output: unknown) => SkillNavigatorToolOutput | null;
  isSkillNavigatorOutput: (output: unknown) => boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useSkillNavigatorTool({
  onSendMessage,
  onRoadmapComplete,
  onRoadmapError,
}: UseSkillNavigatorToolOptions): UseSkillNavigatorToolReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationParams, setGenerationParams] = useState<SkillNavigatorToolOutput['params'] | null>(null);
  const [completedRoadmap, setCompletedRoadmap] = useState<NavigatorRoadmapResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const parseToolOutput = useCallback((output: unknown): SkillNavigatorToolOutput | null => {
    if (!output || typeof output !== 'object') return null;
    const data = output as Record<string, unknown>;
    if (data.type !== 'conversation' && data.type !== 'generate_roadmap') {
      return null;
    }
    return data as SkillNavigatorToolOutput;
  }, []);

  const isSkillNavigatorOutput = useCallback((output: unknown): boolean => {
    return parseToolOutput(output) !== null;
  }, [parseToolOutput]);

  const handleOptionSelect = useCallback(
    (value: string) => {
      if (!conversationId) return;
      onSendMessage(value);
    },
    [conversationId, onSendMessage],
  );

  const handleTextResponse = useCallback(
    (text: string) => {
      onSendMessage(text);
    },
    [onSendMessage],
  );

  const handleGenerationComplete = useCallback(
    (roadmap: NavigatorRoadmapResult) => {
      setIsGenerating(false);
      setCompletedRoadmap(roadmap);
      setGenerationParams(null);
      setConversationId(null);
      onRoadmapComplete?.(roadmap);
    },
    [onRoadmapComplete],
  );

  const handleGenerationError = useCallback(
    (error: string) => {
      setIsGenerating(false);
      setGenerationError(error);
      onRoadmapError?.(error);
    },
    [onRoadmapError],
  );

  const resetState = useCallback(() => {
    setConversationId(null);
    setIsGenerating(false);
    setGenerationParams(null);
    setCompletedRoadmap(null);
    setGenerationError(null);
  }, []);

  const processToolOutput = useCallback(
    (output: SkillNavigatorToolOutput) => {
      if (output.type === 'conversation') {
        if (output.conversationId) {
          setConversationId(output.conversationId);
        }
        setIsGenerating(false);
        setGenerationParams(null);
      } else if (output.type === 'generate_roadmap' && output.triggerGeneration) {
        setIsGenerating(true);
        setGenerationParams(output.params ?? null);
        setConversationId(null);
      }
    },
    [],
  );

  const enhancedParseToolOutput = useCallback(
    (output: unknown): SkillNavigatorToolOutput | null => {
      const parsed = parseToolOutput(output);
      if (parsed) {
        processToolOutput(parsed);
      }
      return parsed;
    },
    [parseToolOutput, processToolOutput],
  );

  return {
    conversationId,
    isGenerating,
    generationParams,
    completedRoadmap,
    generationError,
    handleOptionSelect,
    handleTextResponse,
    handleGenerationComplete,
    handleGenerationError,
    resetState,
    parseToolOutput: enhancedParseToolOutput,
    isSkillNavigatorOutput,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract skill navigator tool output from SAM message
 */
export function extractNavigatorToolOutput(message: {
  toolExecution?: {
    toolId?: string;
    result?: unknown;
  };
}): SkillNavigatorToolOutput | null {
  if (
    message.toolExecution?.toolId === 'sam-skill-navigator' &&
    message.toolExecution?.result
  ) {
    const result = message.toolExecution.result as Record<string, unknown>;
    if (result.output) {
      return result.output as SkillNavigatorToolOutput;
    }
  }
  return null;
}

/**
 * Check if a SAM message contains skill navigator tool output
 */
export function hasSkillNavigatorOutput(message: {
  toolExecution?: {
    toolId?: string;
  };
}): boolean {
  return message.toolExecution?.toolId === 'sam-skill-navigator';
}
