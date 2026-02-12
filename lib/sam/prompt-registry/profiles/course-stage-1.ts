/**
 * Profile: Course Creation Stage 1 (Chapter Generation)
 *
 * Wrapper around existing buildStage1Prompt() from lib/sam/course-creation/prompts.ts.
 * The existing prompt builder is feature-rich; this profile delegates to it.
 */

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';
import { buildStage1Prompt } from '@/lib/sam/course-creation/prompts';
import type {
  CourseContext,
  GeneratedChapter,
  ConceptTracker,
} from '@/lib/sam/course-creation/types';

// ============================================================================
// Input / Output types
// ============================================================================

export interface CourseStage1Input {
  courseContext: CourseContext;
  currentChapterNumber: number;
  previousChapters: GeneratedChapter[];
  conceptTracker?: ConceptTracker;
}

const Stage1OutputSchema = z.object({
  thinking: z.string(),
  chapter: z.object({
    position: z.number(),
    title: z.string(),
    description: z.string(),
    bloomsLevel: z.string(),
    learningObjectives: z.array(z.string()),
    keyTopics: z.array(z.string()),
    conceptsIntroduced: z.array(z.string()).optional(),
    prerequisites: z.string(),
    estimatedTime: z.string(),
    topicsToExpand: z.array(z.string()),
  }),
});

export type Stage1Output = z.infer<typeof Stage1OutputSchema>;

// ============================================================================
// Profile definition
// ============================================================================

const courseStage1Profile: PromptProfile<CourseStage1Input, Stage1Output> = {
  taskType: 'course-stage-1',
  description: 'Sequential course creation: generates a single chapter with deep context awareness',

  aiParameters: {
    capability: 'course',
    maxTokens: 4000,
    temperature: 0.7,
  },

  // The system prompt is embedded in buildStage1Prompt (it produces a combined prompt).
  // We use a minimal system prompt here; the real content comes from buildUserPrompt.
  systemPrompt:
    'You are SAM, an expert educational course designer. Return ONLY valid JSON, no markdown formatting.',

  knowledgeModules: [],

  buildUserPrompt: (input: CourseStage1Input): string => {
    return buildStage1Prompt(
      input.courseContext,
      input.currentChapterNumber,
      input.previousChapters,
      input.conceptTracker,
    );
  },

  outputSchema: Stage1OutputSchema,

  postValidate: (output, input) => {
    const issues: string[] = [];

    if (output.chapter.position !== input.currentChapterNumber) {
      issues.push(
        `Chapter position ${output.chapter.position} does not match expected ${input.currentChapterNumber}`,
      );
    }

    if (output.chapter.learningObjectives.length === 0) {
      issues.push('No learning objectives generated');
    }

    // Check title uniqueness against previous chapters
    const existingTitles = input.previousChapters.map((ch) =>
      ch.title.toLowerCase(),
    );
    if (existingTitles.includes(output.chapter.title.toLowerCase())) {
      issues.push(`Chapter title "${output.chapter.title}" duplicates an existing chapter`);
    }

    return { valid: issues.length === 0, issues };
  },
};

// Auto-register
registerProfile(courseStage1Profile);

export { courseStage1Profile };
