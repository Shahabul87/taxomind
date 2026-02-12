/**
 * Profile: Chapter Content Generation
 *
 * Serves: /api/courses/generate-chapter-content
 * Generates comprehensive chapter content with sections, learning outcomes,
 * and Bloom&apos;s taxonomy alignment.
 */

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';

// ============================================================================
// Input / Output types
// ============================================================================

export interface ChapterContentInput {
  chapterTitle: string;
  chapterDescription: string;
  difficultyLevel: string;
  contentType: string;
  generationMode: string;
  sectionCount: number;
  targetAudience: string;
  focusAreas: string;
}

const GeneratedSectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  contentType: z.enum(['video', 'reading', 'interactive', 'assessment', 'project']),
  estimatedDuration: z.string(),
  bloomsLevel: z.string(),
  content: z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
    activities: z.array(z.string()).optional(),
    assessmentQuestions: z.array(z.string()).optional(),
  }),
});

const GeneratedContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  learningOutcomes: z.array(z.string()),
  sections: z.array(GeneratedSectionSchema).min(1),
});

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;

// ============================================================================
// Profile definition
// ============================================================================

const chapterContentProfile: PromptProfile<ChapterContentInput, GeneratedContent> = {
  taskType: 'chapter-content-generation',
  description: 'Generates comprehensive chapter content with sections aligned to Bloom&apos;s taxonomy',

  aiParameters: {
    capability: 'course',
    maxTokens: 4000,
    temperature: 0.7,
  },

  systemPrompt: `You are an expert educational content architect who creates comprehensive chapter content with sections aligned to Bloom's taxonomy. You design engaging, progressive learning experiences with varied content types.

You MUST respond with valid JSON matching the exact schema provided. No text outside the JSON.`,

  knowledgeModules: ['blooms-taxonomy', 'chapter-thinking'],

  buildUserPrompt: (input: ChapterContentInput): string => {
    return `Generate comprehensive content for this chapter:

**Chapter Title**: ${input.chapterTitle}
**Chapter Description**: ${input.chapterDescription || 'No description provided'}
**Difficulty Level**: ${input.difficultyLevel}
**Content Type Focus**: ${input.contentType}
**Generation Mode**: ${input.generationMode}
**Number of Sections**: ${input.sectionCount}
**Target Audience**: ${input.targetAudience || 'General learners'}
**Focus Areas**: ${input.focusAreas || 'General coverage'}

Respond with JSON matching this schema:
{
  "title": "Enhanced chapter title",
  "description": "Comprehensive chapter description (2-3 sentences)",
  "learningOutcomes": ["Bloom's-aligned outcomes using proper verbs"],
  "sections": [
    {
      "title": "Specific, descriptive section title",
      "description": "What this section covers",
      "contentType": "video|reading|interactive|assessment|project",
      "estimatedDuration": "15-20 minutes",
      "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
      "content": {
        "summary": "Section summary",
        "keyPoints": ["Specific key points relevant to the topic"],
        "activities": ["Hands-on activities if interactive/project type"],
        "assessmentQuestions": ["Questions if assessment type"]
      }
    }
  ]
}

Requirements:
- Learning outcomes MUST use Bloom's taxonomy verbs for ${input.difficultyLevel} level
- Sections should progress from foundational to advanced within the chapter
- Each section must have a unique, specific title (not generic)
- Key points must be specific to the chapter topic, not generic templates
- Activities must be practical and actionable
- Generate exactly ${input.sectionCount} sections`;
  },

  outputSchema: GeneratedContentSchema,

  postValidate: (output, input) => {
    const issues: string[] = [];

    if (output.sections.length !== input.sectionCount) {
      issues.push(
        `Expected ${input.sectionCount} sections but got ${output.sections.length}`,
      );
    }

    if (output.learningOutcomes.length === 0) {
      issues.push('No learning outcomes generated');
    }

    return { valid: issues.length === 0, issues };
  },
};

// Auto-register
registerProfile(chapterContentProfile);

export { chapterContentProfile };
