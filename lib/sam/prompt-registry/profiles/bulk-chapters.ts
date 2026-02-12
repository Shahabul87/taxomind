/**
 * Profile: Bulk Chapters Generation
 *
 * Generates multiple chapter outlines for a course in a single AI call.
 * Used when a course needs rapid scaffolding of chapter structure.
 */

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';

// ============================================================================
// Input / Output types
// ============================================================================

export interface BulkChaptersInput {
  courseTitle: string;
  courseDescription: string;
  targetAudience: string;
  difficulty: string;
  chapterCount: number;
  courseLearningObjectives: string[];
}

const ChapterOutlineSchema = z.object({
  position: z.number(),
  title: z.string(),
  description: z.string(),
  bloomsLevel: z.string(),
  learningObjectives: z.array(z.string()),
  keyTopics: z.array(z.string()),
  estimatedTime: z.string(),
});

const ChaptersArraySchema = z.array(ChapterOutlineSchema).min(1);

export type GeneratedChapterOutlines = z.infer<typeof ChaptersArraySchema>;

// ============================================================================
// Profile definition
// ============================================================================

const bulkChaptersProfile: PromptProfile<BulkChaptersInput, GeneratedChapterOutlines> = {
  taskType: 'bulk-chapters-generation',
  description: 'Generates multiple chapter outlines for rapid course scaffolding',

  aiParameters: {
    capability: 'course',
    maxTokens: 4000,
    temperature: 0.7,
  },

  systemPrompt: `You are an expert instructional designer who creates well-structured course outlines with clear learning progressions aligned to Bloom's taxonomy.

You MUST respond with a valid JSON array of chapter objects. No text outside the JSON array.`,

  knowledgeModules: ['blooms-taxonomy', 'chapter-thinking'],

  buildUserPrompt: (input: BulkChaptersInput): string => {
    const objectivesList = input.courseLearningObjectives
      .map((obj, i) => `${i + 1}. ${obj}`)
      .join('\n');

    return `Generate ${input.chapterCount} chapter outlines for the following course:

**Course Title**: ${input.courseTitle}
**Description**: ${input.courseDescription || 'No description provided'}
**Target Audience**: ${input.targetAudience || 'General learners'}
**Difficulty Level**: ${input.difficulty}

**Course Learning Objectives**:
${objectivesList || 'No objectives specified'}

Requirements:
- Chapters should progress from foundational to advanced
- Each chapter must have a unique, specific title
- Learning objectives must use Bloom&apos;s taxonomy verbs
- Bloom&apos;s levels should progress (REMEMBER -> CREATE) across chapters
- Key topics should be specific to the course subject
- Time estimates should be realistic

Respond with a JSON array of exactly ${input.chapterCount} chapter objects:
[
  {
    "position": 1,
    "title": "Unique, descriptive chapter title",
    "description": "2-3 sentence chapter description",
    "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
    "learningObjectives": ["Objective with Bloom's verb..."],
    "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
    "estimatedTime": "X hours"
  }
]`;
  },

  outputSchema: ChaptersArraySchema,

  postValidate: (output, input) => {
    const issues: string[] = [];

    if (output.length !== input.chapterCount) {
      issues.push(
        `Expected ${input.chapterCount} chapters but got ${output.length}`,
      );
    }

    const titles = new Set<string>();
    for (const chapter of output) {
      if (titles.has(chapter.title)) {
        issues.push(`Duplicate chapter title: "${chapter.title}"`);
      }
      titles.add(chapter.title);
    }

    return { valid: issues.length === 0, issues };
  },
};

// Auto-register
registerProfile(bulkChaptersProfile);

export { bulkChaptersProfile };
