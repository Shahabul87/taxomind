'use client';

/**
 * useSkillRoadmapTool
 *
 * Hook for managing skill roadmap tool interactions in SAM chat.
 * Handles conversation state, option selection, and generation triggering.
 */

import { useState, useCallback } from 'react';
import type { ConversationalOption } from '../ConversationalOptions';

// =============================================================================
// TYPES
// =============================================================================

export interface SkillRoadmapToolOutput {
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
    currentLevel: string;
    targetLevel: string;
    hoursPerWeek: number;
    learningStyle: string;
    includeAssessments: boolean;
    prioritizeQuickWins: boolean;
  };
  summary?: string;
  apiEndpoint?: string;
  triggerGeneration?: boolean;
}

export interface RoadmapResult {
  id: string;
  title: string;
  description?: string;
  totalEstimatedHours: number;
  milestoneCount: number;
  milestones: Array<{
    id: string;
    order: number;
    title: string;
    status: string;
    estimatedHours: number;
  }>;
}

interface UseSkillRoadmapToolOptions {
  onSendMessage: (message: string) => void;
  onRoadmapComplete?: (roadmap: RoadmapResult) => void;
  onRoadmapError?: (error: string) => void;
}

interface UseSkillRoadmapToolReturn {
  // State
  conversationId: string | null;
  isGenerating: boolean;
  generationParams: SkillRoadmapToolOutput['params'] | null;
  completedRoadmap: RoadmapResult | null;
  generationError: string | null;

  // Actions
  handleOptionSelect: (value: string) => void;
  handleTextResponse: (text: string) => void;
  handleGenerationComplete: (roadmap: RoadmapResult) => void;
  handleGenerationError: (error: string) => void;
  resetState: () => void;

  // Utilities
  parseToolOutput: (output: unknown) => SkillRoadmapToolOutput | null;
  isSkillRoadmapOutput: (output: unknown) => boolean;
}

// =============================================================================
// HOOK
// =============================================================================

export function useSkillRoadmapTool({
  onSendMessage,
  onRoadmapComplete,
  onRoadmapError,
}: UseSkillRoadmapToolOptions): UseSkillRoadmapToolReturn {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationParams, setGenerationParams] = useState<SkillRoadmapToolOutput['params'] | null>(null);
  const [completedRoadmap, setCompletedRoadmap] = useState<RoadmapResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  /**
   * Parse tool output to typed structure
   */
  const parseToolOutput = useCallback((output: unknown): SkillRoadmapToolOutput | null => {
    if (!output || typeof output !== 'object') return null;

    const data = output as Record<string, unknown>;

    // Check if it's a skill roadmap tool output
    if (data.type !== 'conversation' && data.type !== 'generate_roadmap') {
      return null;
    }

    return data as unknown as SkillRoadmapToolOutput;
  }, []);

  /**
   * Check if output is from skill roadmap tool
   */
  const isSkillRoadmapOutput = useCallback((output: unknown): boolean => {
    return parseToolOutput(output) !== null;
  }, [parseToolOutput]);

  /**
   * Handle option selection from ConversationalOptions
   */
  const handleOptionSelect = useCallback(
    (value: string) => {
      if (!conversationId) return;

      // Send the selected value as a message to continue the conversation
      // The tool will be re-invoked with the conversationId and userResponse
      onSendMessage(value);
    },
    [conversationId, onSendMessage]
  );

  /**
   * Handle free-text response (e.g., for skill name input)
   */
  const handleTextResponse = useCallback(
    (text: string) => {
      onSendMessage(text);
    },
    [onSendMessage]
  );

  /**
   * Handle successful roadmap generation
   */
  const handleGenerationComplete = useCallback(
    (roadmap: RoadmapResult) => {
      setIsGenerating(false);
      setCompletedRoadmap(roadmap);
      setGenerationParams(null);
      setConversationId(null);
      onRoadmapComplete?.(roadmap);
    },
    [onRoadmapComplete]
  );

  /**
   * Handle generation error
   */
  const handleGenerationError = useCallback(
    (error: string) => {
      setIsGenerating(false);
      setGenerationError(error);
      onRoadmapError?.(error);
    },
    [onRoadmapError]
  );

  /**
   * Reset all state
   */
  const resetState = useCallback(() => {
    setConversationId(null);
    setIsGenerating(false);
    setGenerationParams(null);
    setCompletedRoadmap(null);
    setGenerationError(null);
  }, []);

  /**
   * Process tool output and update state accordingly
   * This should be called when a new tool output is received
   */
  const processToolOutput = useCallback(
    (output: SkillRoadmapToolOutput) => {
      if (output.type === 'conversation') {
        // Update conversation state
        if (output.conversationId) {
          setConversationId(output.conversationId);
        }
        setIsGenerating(false);
        setGenerationParams(null);
      } else if (output.type === 'generate_roadmap' && output.triggerGeneration) {
        // Trigger generation
        setIsGenerating(true);
        setGenerationParams(output.params || null);
        setConversationId(null);
      }
    },
    []
  );

  // Expose processToolOutput via parseToolOutput for external use
  const enhancedParseToolOutput = useCallback(
    (output: unknown): SkillRoadmapToolOutput | null => {
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
    completedRoadmap,
    generationError,

    // Actions
    handleOptionSelect,
    handleTextResponse,
    handleGenerationComplete,
    handleGenerationError,
    resetState,

    // Utilities
    parseToolOutput: enhancedParseToolOutput,
    isSkillRoadmapOutput,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract skill roadmap tool output from SAM message
 */
export function extractToolOutput(message: {
  toolExecution?: {
    toolId?: string;
    result?: unknown;
  };
}): SkillRoadmapToolOutput | null {
  if (
    message.toolExecution?.toolId === 'sam-skill-roadmap-generator' &&
    message.toolExecution?.result
  ) {
    const result = message.toolExecution.result as Record<string, unknown>;
    if (result.output) {
      return result.output as SkillRoadmapToolOutput;
    }
  }
  return null;
}

/**
 * Check if a SAM message contains skill roadmap tool output
 */
export function hasSkillRoadmapOutput(message: {
  toolExecution?: {
    toolId?: string;
  };
}): boolean {
  return message.toolExecution?.toolId === 'sam-skill-roadmap-generator';
}
