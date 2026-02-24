/**
 * Blueprint Response Zod Schema
 *
 * Provides structural validation for AI-generated blueprint responses.
 * Used as an optional validation pass after JSON.parse -- on failure,
 * falls through to existing manual extraction (backward-compatible).
 */

import { z } from 'zod';

export const BlueprintSectionSchema = z.object({
  position: z.number().int().optional(),
  title: z.string().min(3),
  keyTopics: z.array(z.string()).default([]),
  estimatedMinutes: z.number().optional(),
  formativeAssessment: z.object({
    type: z.string(),
    prompt: z.string(),
  }).optional(),
});

export const BlueprintChapterSchema = z.object({
  position: z.number().int(),
  title: z.string().min(3),
  goal: z.string().default(''),
  bloomsLevel: z.string().default('UNDERSTAND'),
  deliverable: z.string().optional(),
  prerequisiteChapters: z.array(z.number().int()).optional(),
  estimatedMinutes: z.number().optional(),
  sections: z.array(BlueprintSectionSchema).min(1),
});

export const BlueprintAIResponseSchema = z.object({
  chapters: z.array(BlueprintChapterSchema).min(1),
  northStarProject: z.string().optional(),
  confidence: z.number().min(0).max(100).default(70),
  riskAreas: z.array(z.string()).default([]),
});

export type BlueprintAIResponse = z.infer<typeof BlueprintAIResponseSchema>;
