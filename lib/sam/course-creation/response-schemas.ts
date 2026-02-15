/**
 * Zod Schemas for AI Response Validation (Course Creation Pipeline)
 *
 * These schemas provide structural validation for AI-generated responses
 * across all 3 pipeline stages. They act as a **soft validation layer**:
 * - On success: confirms AI output matches expected structure
 * - On failure: logs warnings with specific field errors (non-blocking)
 *
 * The pipeline continues with existing `??` fallbacks regardless of
 * validation outcome — Zod catches issues without breaking graceful degradation.
 */

import { z } from 'zod';
import { BLOOMS_LEVELS } from './types';

// =============================================================================
// Stage 1: Chapter Response Schema
// =============================================================================

export const AIChapterResponseSchema = z.object({
  thinking: z.string().optional(),
  chapter: z.object({
    title: z.string().min(5),
    description: z.string().min(20),
    bloomsLevel: z.enum(BLOOMS_LEVELS).catch('UNDERSTAND'),
    learningObjectives: z.array(z.string().min(5)).min(1),
    keyTopics: z.array(z.string().min(2)).min(1),
    prerequisites: z.string().optional(),
    estimatedTime: z.string().optional(),
    topicsToExpand: z.array(z.string()).optional(),
    conceptsIntroduced: z.array(z.string()).optional(),
  }),
});

// =============================================================================
// Stage 2: Section Response Schema
// =============================================================================

export const AISectionResponseSchema = z.object({
  thinking: z.string().optional(),
  section: z.object({
    title: z.string().min(3),
    contentType: z.string().optional(),
    estimatedDuration: z.string().optional(),
    topicFocus: z.string().optional(),
    parentChapterContext: z.object({
      relevantObjectives: z.array(z.string()).optional(),
    }).optional(),
    conceptsIntroduced: z.array(z.string()).optional(),
    conceptsReferenced: z.array(z.string()).optional(),
  }),
});

// =============================================================================
// Stage 3: Section Details Response Schema
// =============================================================================

export const AIDetailsResponseSchema = z.object({
  thinking: z.string().optional(),
  details: z.object({
    description: z.string().min(50),
    learningObjectives: z.array(z.string().min(5)).min(1),
    keyConceptsCovered: z.array(z.string()).optional(),
    practicalActivity: z.string().min(10),
    resources: z.array(z.string()).optional(),
  }),
});

export type AIChapterResponse = z.infer<typeof AIChapterResponseSchema>;
export type AISectionResponse = z.infer<typeof AISectionResponseSchema>;
export type AIDetailsResponse = z.infer<typeof AIDetailsResponseSchema>;
