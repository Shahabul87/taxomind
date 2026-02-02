/**
 * Flashcard Generator Tool
 *
 * Generates structured flashcards from a topic using Bloom's taxonomy alignment.
 * No external API calls required — uses algorithmic card structure generation.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  type ToolDefinition,
  type ToolHandler,
  type ToolExecutionResult,
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
} from '@sam-ai/agentic';

// =============================================================================
// TYPES
// =============================================================================

export interface Flashcard {
  front: string;
  back: string;
  bloomsLevel: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const FlashcardInputSchema = z.object({
  topic: z.string().min(1).max(500).describe('The topic to generate flashcards for'),
  count: z.number().min(1).max(20).optional().default(5),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate'),
  bloomsLevels: z.array(z.string()).optional(),
});

// =============================================================================
// BLOOM'S QUESTION TEMPLATES
// =============================================================================

const BLOOMS_TEMPLATES: Record<string, { verbs: string[]; questionStems: string[] }> = {
  remember: {
    verbs: ['define', 'list', 'recall', 'identify', 'name'],
    questionStems: [
      'What is the definition of {topic}?',
      'List the key components of {topic}.',
      'What are the main characteristics of {topic}?',
      'Name the types of {topic}.',
    ],
  },
  understand: {
    verbs: ['explain', 'describe', 'summarize', 'interpret', 'classify'],
    questionStems: [
      'Explain how {topic} works.',
      'Describe the purpose of {topic}.',
      'Summarize the key principles of {topic}.',
      'How would you classify {topic}?',
    ],
  },
  apply: {
    verbs: ['apply', 'demonstrate', 'solve', 'use', 'implement'],
    questionStems: [
      'How would you apply {topic} in practice?',
      'Give an example of using {topic}.',
      'What steps would you follow to implement {topic}?',
      'Demonstrate how {topic} solves a real problem.',
    ],
  },
  analyze: {
    verbs: ['analyze', 'compare', 'contrast', 'examine', 'differentiate'],
    questionStems: [
      'What are the key differences within {topic}?',
      'Analyze the relationship between the parts of {topic}.',
      'Compare and contrast approaches to {topic}.',
      'What patterns can you identify in {topic}?',
    ],
  },
  evaluate: {
    verbs: ['evaluate', 'assess', 'justify', 'critique', 'judge'],
    questionStems: [
      'What are the strengths and weaknesses of {topic}?',
      'How would you evaluate the effectiveness of {topic}?',
      'What criteria would you use to assess {topic}?',
      'Justify the importance of {topic}.',
    ],
  },
  create: {
    verbs: ['design', 'create', 'construct', 'propose', 'formulate'],
    questionStems: [
      'How would you design a new approach using {topic}?',
      'Propose an improvement to {topic}.',
      'What would you create by combining aspects of {topic}?',
      'Formulate a hypothesis about {topic}.',
    ],
  },
};

const DIFFICULTY_LEVELS: Record<string, string[]> = {
  beginner: ['remember', 'understand'],
  intermediate: ['understand', 'apply', 'analyze'],
  advanced: ['analyze', 'evaluate', 'create'],
};

// =============================================================================
// HANDLER
// =============================================================================

function createFlashcardHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = FlashcardInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { topic, count, difficulty } = parsed.data;
    const bloomsLevels = parsed.data.bloomsLevels ?? DIFFICULTY_LEVELS[difficulty];

    logger.info('[FlashcardGenerator] Generating flashcards', {
      topic,
      count,
      difficulty,
      bloomsLevels,
    });

    const flashcards: Flashcard[] = [];

    for (let i = 0; i < count; i++) {
      const levelIndex = i % bloomsLevels.length;
      const bloomsLevel = bloomsLevels[levelIndex];
      const templates = BLOOMS_TEMPLATES[bloomsLevel] ?? BLOOMS_TEMPLATES.understand;
      const stemIndex = i % templates.questionStems.length;

      const front = templates.questionStems[stemIndex].replace(/\{topic\}/g, topic);
      const verb = templates.verbs[i % templates.verbs.length];
      const back = `[${verb.charAt(0).toUpperCase() + verb.slice(1)}] Use your knowledge of ${topic} to answer this ${bloomsLevel}-level question. Key area: ${topic}.`;

      flashcards.push({
        front,
        back,
        bloomsLevel,
        difficulty,
      });
    }

    return {
      success: true,
      output: {
        flashcards,
        topic,
        count: flashcards.length,
        difficulty,
        bloomsLevelsUsed: [...new Set(flashcards.map((f) => f.bloomsLevel))],
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createFlashcardGeneratorTool(): ToolDefinition {
  return {
    id: 'sam-flashcard-generator',
    name: 'Flashcard Generator',
    description: 'Generates structured flashcards aligned with Bloom\'s taxonomy levels for any topic.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createFlashcardHandler(),
    inputSchema: FlashcardInputSchema,
    outputSchema: z.object({
      flashcards: z.array(z.object({
        front: z.string(),
        back: z.string(),
        bloomsLevel: z.string(),
        difficulty: z.string(),
      })),
      topic: z.string(),
      count: z.number(),
      difficulty: z.string(),
      bloomsLevelsUsed: z.array(z.string()),
    }),
    requiredPermissions: [PermissionLevel.READ],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['content', 'flashcards', 'blooms', 'study'],
    rateLimit: { maxCalls: 20, windowMs: 60_000, scope: 'user' },
    timeoutMs: 5000,
    maxRetries: 1,
  };
}
