/**
 * Prompt Registry Core Types
 *
 * Defines PromptProfile, PromptTaskType, KnowledgeModule, and AIParameters
 * used by the unified prompt management system.
 */

import { z } from 'zod';
import type { AICapability } from '@/lib/sam/providers/ai-registry';

// ============================================================================
// Task Types — one per AI generation task
// ============================================================================

export type PromptTaskType =
  | 'chapter-content-generation'
  | 'chapter-sections-generation'
  | 'exam-generation'
  | 'bulk-chapters-generation'
  | 'course-stage-1'
  | 'course-stage-2'
  | 'course-stage-3'
  | 'skill-roadmap-generation'
  | 'depth-analysis'
  | 'practice-problems';

// ============================================================================
// Knowledge Modules — named, reusable context blocks
// ============================================================================

export interface KnowledgeModule {
  /** Unique identifier, e.g. 'blooms-taxonomy' */
  id: string;
  /** Human-readable name */
  name: string;
  /** The actual text to inject into the system prompt */
  content: string;
}

// ============================================================================
// AI Parameters
// ============================================================================

export interface AIParameters {
  capability: AICapability;
  maxTokens: number;
  temperature: number;
}

// ============================================================================
// Prompt Profile — fully typed input/output contract for an AI task
// ============================================================================

export interface PromptProfile<
  TInput = Record<string, unknown>,
  TOutput = unknown,
> {
  taskType: PromptTaskType;
  description: string;
  aiParameters: AIParameters;
  systemPrompt: string;
  /** IDs of KnowledgeModules to compose into the system prompt */
  knowledgeModules: string[];
  /** Builds the user-facing prompt from typed input */
  buildUserPrompt: (input: TInput) => string;
  /** Zod schema that validates + parses the AI JSON output */
  outputSchema: z.ZodType<TOutput>;
  /** Optional post-parse validation (semantic checks beyond Zod) */
  postValidate?: (
    output: TOutput,
    input: TInput,
  ) => { valid: boolean; issues: string[] };
}

// ============================================================================
// executeProfile result
// ============================================================================

export interface ExecuteProfileResult<TOutput> {
  data: TOutput;
  provider: string;
  model: string;
}
