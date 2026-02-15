/**
 * Profile: Course Creation Stage 3 (Section Detail Generation)
 *
 * Wrapper around existing buildStage3Prompt() from lib/sam/course-creation/prompts.ts.
 */

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';
import { buildStage3Prompt } from '@/lib/sam/course-creation/prompts';
import type {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  EnrichedChapterContext,
} from '@/lib/sam/course-creation/types';

// ============================================================================
// Input / Output types
// ============================================================================

export interface CourseStage3Input {
  courseContext: CourseContext;
  chapter: GeneratedChapter;
  section: GeneratedSection;
  chapterSections: GeneratedSection[];
  enrichedContext?: EnrichedChapterContext;
}

const Stage3OutputSchema = z.object({
  thinking: z.string(),
  details: z.object({
    description: z.string(),
    learningObjectives: z.array(z.string()),
    keyConceptsCovered: z.array(z.string()),
    conceptsIntroduced: z.array(z.string()).optional(),
    practicalActivity: z.string(),
  }),
});

export type Stage3Output = z.infer<typeof Stage3OutputSchema>;

// ============================================================================
// Profile definition
// ============================================================================

const courseStage3Profile: PromptProfile<CourseStage3Input, Stage3Output> = {
  taskType: 'course-stage-3',
  description: 'Sequential course creation: generates detailed description and objectives for a section',

  aiParameters: {
    capability: 'course',
    maxTokens: 3000,
    temperature: 0.7,
  },

  systemPrompt:
    'You are SAM, an expert educational course designer. Return ONLY valid JSON, no markdown formatting.',

  knowledgeModules: [],

  buildUserPrompt: (input: CourseStage3Input): string => {
    const { userPrompt } = buildStage3Prompt({
      courseContext: input.courseContext,
      chapter: input.chapter,
      section: input.section,
      chapterSections: input.chapterSections,
      enrichedContext: input.enrichedContext,
    });
    return userPrompt;
  },

  outputSchema: Stage3OutputSchema,

  postValidate: (output) => {
    const issues: string[] = [];

    if (output.details.description.length < 30) {
      issues.push('Section description is too short (< 30 characters)');
    }

    if (output.details.learningObjectives.length === 0) {
      issues.push('No learning objectives generated for section');
    }

    return { valid: issues.length === 0, issues };
  },
};

// Auto-register
registerProfile(courseStage3Profile);

export { courseStage3Profile };
