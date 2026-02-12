/**
 * Profile: Course Creation Stage 2 (Section Generation)
 *
 * Wrapper around existing buildStage2Prompt() from lib/sam/course-creation/prompts.ts.
 */

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';
import { buildStage2Prompt } from '@/lib/sam/course-creation/prompts';
import type {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  EnrichedChapterContext,
} from '@/lib/sam/course-creation/types';

// ============================================================================
// Input / Output types
// ============================================================================

export interface CourseStage2Input {
  courseContext: CourseContext;
  chapter: GeneratedChapter;
  currentSectionNumber: number;
  previousSections: GeneratedSection[];
  allExistingSectionTitles: string[];
  enrichedContext?: EnrichedChapterContext;
}

const Stage2OutputSchema = z.object({
  thinking: z.string(),
  section: z.object({
    position: z.number(),
    title: z.string(),
    contentType: z.string(),
    estimatedDuration: z.string(),
    topicFocus: z.string(),
    conceptsIntroduced: z.array(z.string()).optional(),
    conceptsReferenced: z.array(z.string()).optional(),
    parentChapterContext: z.object({
      title: z.string(),
      bloomsLevel: z.string(),
      relevantObjectives: z.array(z.string()),
    }),
  }),
});

export type Stage2Output = z.infer<typeof Stage2OutputSchema>;

// ============================================================================
// Profile definition
// ============================================================================

const courseStage2Profile: PromptProfile<CourseStage2Input, Stage2Output> = {
  taskType: 'course-stage-2',
  description: 'Sequential course creation: generates a single section within a chapter',

  aiParameters: {
    capability: 'course',
    maxTokens: 3000,
    temperature: 0.7,
  },

  systemPrompt:
    'You are SAM, an expert educational course designer. Return ONLY valid JSON, no markdown formatting.',

  knowledgeModules: [],

  buildUserPrompt: (input: CourseStage2Input): string => {
    return buildStage2Prompt(
      input.courseContext,
      input.chapter,
      input.currentSectionNumber,
      input.previousSections,
      input.allExistingSectionTitles,
      input.enrichedContext,
    );
  },

  outputSchema: Stage2OutputSchema,

  postValidate: (output, input) => {
    const issues: string[] = [];

    if (output.section.position !== input.currentSectionNumber) {
      issues.push(
        `Section position ${output.section.position} does not match expected ${input.currentSectionNumber}`,
      );
    }

    // Check title uniqueness
    const existingLower = input.allExistingSectionTitles.map((t) =>
      t.toLowerCase(),
    );
    if (existingLower.includes(output.section.title.toLowerCase())) {
      issues.push(
        `Section title "${output.section.title}" duplicates an existing section`,
      );
    }

    return { valid: issues.length === 0, issues };
  },
};

// Auto-register
registerProfile(courseStage2Profile);

export { courseStage2Profile };
