/**
 * Content Generator Tool
 *
 * SAM agentic tool for generating course/chapter/section content
 * (descriptions, learning objectives, chapter lists, section lists).
 *
 * The handler validates input and returns parameters for the API route
 * to use. The actual AI call remains in the API route (needs userId).
 * Quality validation is exported separately for post-generation checks.
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
// INPUT SCHEMA
// =============================================================================

const BloomsLevelsSchema = z.object({
  remember: z.boolean().optional(),
  understand: z.boolean().optional(),
  apply: z.boolean().optional(),
  analyze: z.boolean().optional(),
  evaluate: z.boolean().optional(),
  create: z.boolean().optional(),
});

const CourseContextSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  whatYouWillLearn: z.array(z.string()).optional(),
  courseGoals: z.string().nullable().optional(),
  difficulty: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

const ChapterContextSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  learningOutcomes: z.string().nullable().optional(),
  position: z.number().optional(),
});

const SectionContextSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  learningObjectives: z.string().nullable().optional(),
  position: z.number().optional(),
});

const AdvancedSettingsSchema = z.object({
  targetAudience: z.string().optional(),
  difficulty: z.string().optional(),
  duration: z.string().optional(),
  tone: z.string().optional(),
  creativity: z.number().min(1).max(10).optional(),
  detailLevel: z.number().min(1).max(10).optional(),
  includeExamples: z.boolean().optional(),
  learningStyle: z.string().optional(),
  industryFocus: z.string().optional(),
});

export const ContentGeneratorInputSchema = z.object({
  contentType: z.enum([
    'description',
    'learningObjectives',
    'content',
    'chapters',
    'sections',
    'questions',
    'codeExplanation',
    'mathExplanation',
    'creatorGuidelines',
  ]).describe('Type of content to generate'),
  entityLevel: z.enum(['course', 'chapter', 'section']).describe('Level in the course hierarchy'),
  entityTitle: z.string().min(1).max(500).describe('Title of the entity to generate content for'),
  context: z.object({
    course: CourseContextSchema.optional(),
    chapter: ChapterContextSchema.optional(),
    section: SectionContextSchema.optional(),
  }).optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  userPrompt: z.string().max(2000).optional(),
  focusArea: z.string().max(500).optional(),
  bloomsEnabled: z.boolean().default(true),
  bloomsLevels: BloomsLevelsSchema.optional(),
  advancedMode: z.boolean().optional(),
  advancedSettings: AdvancedSettingsSchema.optional(),
  existingContent: z.string().nullable().optional(),
  chapterSettings: z.object({
    chapterCount: z.number().min(2).max(20),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    targetDuration: z.string(),
    focusAreas: z.array(z.string()),
    includeKeywords: z.string(),
    additionalInstructions: z.string(),
  }).optional(),
  sectionSettings: z.object({
    sectionCount: z.number().min(2).max(15),
    contentType: z.enum(['mixed', 'theory', 'practical', 'project']),
    includeAssessment: z.boolean(),
    focusAreas: z.array(z.string()),
    additionalInstructions: z.string(),
  }).optional(),
});

export type ContentGeneratorInput = z.infer<typeof ContentGeneratorInputSchema>;

// =============================================================================
// QUALITY VALIDATION
// =============================================================================

/**
 * Bloom's action verbs for detecting taxonomy alignment in learning objectives
 */
const BLOOMS_ACTION_VERBS = [
  // Remember
  'define', 'list', 'recall', 'identify', 'name', 'state', 'recognize',
  // Understand
  'describe', 'explain', 'summarize', 'interpret', 'classify', 'discuss',
  // Apply
  'apply', 'demonstrate', 'solve', 'use', 'implement', 'execute',
  // Analyze
  'analyze', 'compare', 'contrast', 'examine', 'differentiate', 'organize',
  // Evaluate
  'evaluate', 'judge', 'assess', 'critique', 'justify', 'defend',
  // Create
  'create', 'design', 'develop', 'construct', 'formulate', 'invent',
];

export interface QualityValidationResult {
  score: number;
  feedback: string;
}

/**
 * Validate the quality of generated content based on content type and entity level.
 * Returns a score from 0-100 and feedback string.
 */
export function validateContentQuality(
  content: string,
  contentType: string,
  entityLevel: string
): QualityValidationResult {
  if (!content || content.trim().length === 0) {
    return { score: 0, feedback: 'Empty content generated' };
  }

  const checks: { passed: boolean; weight: number; label: string }[] = [];

  switch (contentType) {
    case 'description': {
      // Length check: descriptions should be substantial
      const minLength = entityLevel === 'section' ? 100 : 150;
      checks.push({
        passed: content.length >= minLength,
        weight: 30,
        label: `Description length >= ${minLength} chars`,
      });

      // Engagement markers: student-facing language
      const engagementPatterns = [
        /\b(you will|you('|&apos;)ll|learners? will|students? will)\b/i,
        /\b(hands-on|practical|real-world|interactive|engaging)\b/i,
        /\b(master|develop|build|gain|achieve|acquire)\b/i,
      ];
      const engagementCount = engagementPatterns.filter(p => p.test(content)).length;
      checks.push({
        passed: engagementCount >= 2,
        weight: 25,
        label: 'Contains student-facing engagement language',
      });

      // Not too short (generic placeholder)
      checks.push({
        passed: content.length >= 50,
        weight: 20,
        label: 'Not a placeholder response',
      });

      // Has meaningful sentences (not just a list of keywords)
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      checks.push({
        passed: sentences.length >= 2,
        weight: 25,
        label: 'Contains multiple meaningful sentences',
      });
      break;
    }

    case 'learningObjectives': {
      // Length check
      checks.push({
        passed: content.length >= 80,
        weight: 20,
        label: 'Objectives have sufficient length',
      });

      // Bloom's action verb detection
      const lowerContent = content.toLowerCase();
      const foundVerbs = BLOOMS_ACTION_VERBS.filter(v => lowerContent.includes(v));
      checks.push({
        passed: foundVerbs.length >= 2,
        weight: 35,
        label: `Contains Bloom's action verbs (found: ${foundVerbs.length})`,
      });

      // Multiple objectives (check for list items)
      const listItemCount = (content.match(/<li/gi) || []).length
        || (content.match(/^\s*[-•*]\s/gm) || []).length
        || (content.match(/^\s*\d+\.\s/gm) || []).length;
      checks.push({
        passed: listItemCount >= 3,
        weight: 25,
        label: `Has multiple objectives (found: ${listItemCount})`,
      });

      // Measurable language
      const measurablePatterns = [
        /\b(able to|can|will be able|demonstrate|apply|create|analyze)\b/i,
      ];
      checks.push({
        passed: measurablePatterns.some(p => p.test(content)),
        weight: 20,
        label: 'Contains measurable outcome language',
      });
      break;
    }

    case 'chapters':
    case 'sections': {
      // JSON array validation
      let parsed: unknown[] = [];
      try {
        parsed = JSON.parse(content);
        checks.push({
          passed: Array.isArray(parsed),
          weight: 40,
          label: 'Valid JSON array',
        });
      } catch {
        checks.push({ passed: false, weight: 40, label: 'Valid JSON array' });
      }

      if (Array.isArray(parsed)) {
        // Each item is a non-empty string
        const allStrings = parsed.every(
          (item) => typeof item === 'string' && item.trim().length > 0
        );
        checks.push({
          passed: allStrings,
          weight: 30,
          label: 'All items are non-empty strings',
        });

        // Reasonable count
        const minCount = contentType === 'chapters' ? 2 : 2;
        checks.push({
          passed: parsed.length >= minCount,
          weight: 30,
          label: `Has >= ${minCount} items (found: ${parsed.length})`,
        });
      }
      break;
    }

    case 'creatorGuidelines': {
      // Length check: guidelines should be substantial
      checks.push({
        passed: content.length >= 200,
        weight: 25,
        label: 'Guidelines have sufficient length (>= 200 chars)',
      });

      // Structure check: should have sections/headings
      const headingCount = (content.match(/<h[34]/gi) || []).length
        || (content.match(/^#{2,4}\s/gm) || []).length;
      checks.push({
        passed: headingCount >= 3,
        weight: 30,
        label: `Has structured sections (found: ${headingCount} headings)`,
      });

      // Actionable language: should guide the creator
      const actionablePatterns = [
        /\b(prepare|record|demonstrate|explain|show|include|cover|start|use)\b/i,
        /\b(example|analogy|visual|slide|diagram|demo)\b/i,
        /\b(topic|concept|objective|student|learner|viewer)\b/i,
      ];
      const actionableCount = actionablePatterns.filter(p => p.test(content)).length;
      checks.push({
        passed: actionableCount >= 2,
        weight: 25,
        label: 'Contains actionable instructional language',
      });

      // Has list items (practical steps)
      const listItems = (content.match(/<li/gi) || []).length
        || (content.match(/^\s*[-•*]\s/gm) || []).length;
      checks.push({
        passed: listItems >= 5,
        weight: 20,
        label: `Has practical steps/items (found: ${listItems})`,
      });
      break;
    }

    default: {
      // Generic content quality
      checks.push({
        passed: content.length >= 50,
        weight: 50,
        label: 'Content has sufficient length',
      });
      checks.push({
        passed: content.length < 50000,
        weight: 50,
        label: 'Content is not excessively long',
      });
    }
  }

  // Calculate weighted score
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = checks
    .filter(c => c.passed)
    .reduce((sum, c) => sum + c.weight, 0);
  const score = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;

  // Build feedback
  const failed = checks.filter(c => !c.passed);
  const feedback = failed.length === 0
    ? 'All quality checks passed'
    : `Issues: ${failed.map(c => c.label).join('; ')}`;

  return { score, feedback };
}

// =============================================================================
// HANDLER
// =============================================================================

function createContentGeneratorHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = ContentGeneratorInputSchema.safeParse(input);
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

    const { contentType, entityLevel, entityTitle } = parsed.data;

    logger.info('[ContentGenerator] Validated content generation request', {
      contentType,
      entityLevel,
      entityTitle,
    });

    // The handler validates input and returns structured parameters.
    // The actual AI call happens in the API route (requires userId from request context).
    return {
      success: true,
      output: {
        validated: true,
        parameters: parsed.data,
        contentType,
        entityLevel,
        entityTitle,
      },
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createContentGeneratorTool(): ToolDefinition {
  return {
    id: 'sam-content-generator',
    name: 'Content Generator',
    description:
      'Generates course, chapter, and section content including descriptions, learning objectives, chapter lists, and section lists. Supports Bloom\'s taxonomy alignment and hierarchical context awareness.',
    version: '1.0.0',
    category: ToolCategory.CONTENT,
    handler: createContentGeneratorHandler(),
    inputSchema: ContentGeneratorInputSchema,
    outputSchema: z.object({
      validated: z.boolean(),
      parameters: z.record(z.unknown()),
      contentType: z.string(),
      entityLevel: z.string(),
      entityTitle: z.string(),
    }),
    requiredPermissions: [PermissionLevel.WRITE],
    confirmationType: ConfirmationType.IMPLICIT,
    enabled: true,
    tags: ['content', 'generation', 'course', 'blooms', 'description', 'objectives'],
    rateLimit: { maxCalls: 30, windowMs: 3_600_000, scope: 'user' },
    timeoutMs: 60_000,
    maxRetries: 1,
  };
}
