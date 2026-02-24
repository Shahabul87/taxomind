/**
 * Zod Schemas for AI Response Validation (Course Creation Pipeline)
 *
 * These schemas provide structural validation for AI-generated responses
 * across all 3 pipeline stages. Validation behavior is controlled by
 * `ValidationMode` ('strict' | 'warn' | 'silent'):
 * - strict: rejects malformed output and triggers fallback
 * - warn:   keeps AI content, penalizes quality score, logs issues
 * - silent: keeps AI content, penalizes quality score, no logging
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
    bloomsLevel: z.enum(BLOOMS_LEVELS),
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
    description: z.string().min(100),
    learningObjectives: z.array(z.string().min(5)).min(1),
    keyConceptsCovered: z.array(z.string()).optional(),
    practicalActivity: z.string().min(10),
    creatorGuidelines: z.string().min(50),
    resources: z.array(z.string()).optional(),
  }),
});

export type AIChapterResponse = z.infer<typeof AIChapterResponseSchema>;
export type AISectionResponse = z.infer<typeof AISectionResponseSchema>;
export type AIDetailsResponse = z.infer<typeof AIDetailsResponseSchema>;

// =============================================================================
// Validation Mode Configuration
// =============================================================================

/** How strictly to enforce Zod schema validation on AI responses */
export type ValidationMode = 'strict' | 'warn' | 'silent';

/** Per-stage validation configuration */
export interface StageValidationConfig {
  stage1: ValidationMode; // Chapter structure
  stage2: ValidationMode; // Section structure
  stage3: ValidationMode; // Student-facing details
}

/**
 * Default validation modes per stage:
 * - Stage 1/2 (internal structure): 'warn' — keep AI content, penalize score
 * - Stage 3 (student-facing): 'strict' — reject and retry on schema failure
 */
export const DEFAULT_STAGE_VALIDATION: StageValidationConfig = {
  stage1: 'warn',
  stage2: 'warn',
  stage3: 'strict',
};

// =============================================================================
// Breadth-First Pipeline: Roadmap Schemas
// =============================================================================

const ARROW_ROLES = [
  'hook', 'reverse-engineer', 'intuition', 'formalization',
  'failure-analysis', 'design-challenge', 'practice', 'reflection',
] as const;

export const RoadmapSectionSchema = z.object({
  position: z.number().int().min(1),
  title: z.string().min(3),
  arrowRole: z.enum(ARROW_ROLES).optional(),
  contentType: z.string().optional(),
});

export const RoadmapChapterSchema = z.object({
  position: z.number().int().min(1),
  title: z.string().min(5),
  focusSummary: z.string().min(10).optional(),
  bloomsLevel: z.enum(BLOOMS_LEVELS),
  keyConcepts: z.array(z.string()).min(1).optional(),
  sections: z.array(RoadmapSectionSchema).min(1),
});

export const CourseRoadmapSchema = z.object({
  structuralReasoning: z.string().optional(),
  chapters: z.array(RoadmapChapterSchema).min(1),
});

export const RoadmapReviewSchema = z.object({
  overallScore: z.number().min(0).max(100),
  issues: z.array(z.object({
    type: z.enum([
      'duplicate_topic', 'bloom_regression', 'coverage_gap',
      'concept_overlap', 'arrow_violation', 'title_generic',
    ]),
    description: z.string(),
    affectedChapters: z.array(z.number()).optional(),
    affectedSections: z.array(z.string()).optional(),
  })).optional(),
  verdict: z.enum(['accept', 'refine']),
});

export type AIRoadmapResponse = z.infer<typeof CourseRoadmapSchema>;
export type AIRoadmapReviewResponse = z.infer<typeof RoadmapReviewSchema>;
