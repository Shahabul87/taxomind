/**
 * Profile: Chapter Sections Generation
 *
 * Serves: /api/ai/chapter-sections
 * Generates section structures for a chapter with progressive learning flow.
 */

import { z } from 'zod';
import { registerProfile } from '../registry';
import type { PromptProfile } from '../types';

// ============================================================================
// Input / Output types
// ============================================================================

export interface ChapterSectionsInput {
  chapterTitle: string;
  sectionCount: number;
  focusArea?: string;
  userPrompt?: string;
}

const SectionItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  estimatedTime: z.string(),
  contentType: z.enum(['introduction', 'concept', 'application', 'assessment', 'review']),
  keyPoints: z.array(z.string()),
});

const SectionsArraySchema = z.array(SectionItemSchema).min(1);

export type GeneratedSections = z.infer<typeof SectionsArraySchema>;

// ============================================================================
// Profile definition
// ============================================================================

const chapterSectionsProfile: PromptProfile<ChapterSectionsInput, GeneratedSections> = {
  taskType: 'chapter-sections-generation',
  description: 'Generates section structures for a chapter with progressive learning flow',

  aiParameters: {
    capability: 'course',
    maxTokens: 4000,
    temperature: 0.7,
  },

  systemPrompt: `You are an expert educational content structurer who specializes in breaking down chapters into logical, progressive sections that optimize learning. You understand how to create sections that build upon each other systematically and maintain student engagement.

Your expertise includes:
- Creating logical learning progressions within chapters
- Designing sections that scaffold knowledge effectively
- Balancing different types of content and activities
- Ensuring each section has clear purpose and outcomes
- Creating realistic time estimates for content consumption
- Understanding cognitive load and attention spans

You MUST respond with a valid JSON array containing section objects. Do not include any text outside the JSON array.`,

  knowledgeModules: ['section-thinking'],

  buildUserPrompt: (input: ChapterSectionsInput): string => {
    const focusText = input.focusArea ? `\n**Focus Area**: ${input.focusArea}` : '';
    const userInstructions = input.userPrompt
      ? `\n**Special Instructions**: ${input.userPrompt}`
      : '';

    return `Create a comprehensive ${input.sectionCount}-section structure for the following chapter:

**Chapter Title**: ${input.chapterTitle}${focusText}${userInstructions}

**Requirements for Section Structure**:

1. **Section Progression**:
   - Start with introduction/overview
   - Build complexity gradually
   - Include practical application
   - End with assessment/review
   - Create clear dependencies between sections

2. **Section Types to Include**:
   - **Introduction**: Set context and preview content
   - **Concept Sections**: Core knowledge and theory
   - **Application Section**: Hands-on practice and examples
   - **Assessment Section**: Knowledge validation

3. **Section Naming Guidelines**:
   - Clear, descriptive titles
   - Action-oriented when appropriate
   - Specific to the content covered
   - Student-friendly language
   - 3-8 words per title

4. **Design Principles**:
   - Each section should take 15-45 minutes to complete
   - Sections should build logically on previous content
   - Include both knowledge and application
   - Make titles engaging and clear

Respond with a JSON array of exactly ${input.sectionCount} section objects, each with this structure:
{
  "title": "string (clear, engaging section title)",
  "description": "string (brief description of section content and purpose)",
  "estimatedTime": "string (realistic time estimate)",
  "contentType": "introduction|concept|application|assessment|review",
  "keyPoints": ["string (3-4 main points covered in this section)"]
}`;
  },

  outputSchema: SectionsArraySchema,

  postValidate: (output, input) => {
    const issues: string[] = [];

    if (output.length !== input.sectionCount) {
      issues.push(
        `Expected ${input.sectionCount} sections but got ${output.length}`,
      );
    }

    const titles = new Set<string>();
    for (const section of output) {
      if (titles.has(section.title)) {
        issues.push(`Duplicate section title: "${section.title}"`);
      }
      titles.add(section.title);
    }

    return { valid: issues.length === 0, issues };
  },
};

// Auto-register
registerProfile(chapterSectionsProfile);

export { chapterSectionsProfile };
