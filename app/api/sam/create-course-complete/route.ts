/**
 * SAM Complete Course Creation API
 *
 * This endpoint orchestrates the complete course creation process:
 * 1. Generates course structure using SAM AI
 * 2. Validates content quality
 * 3. Creates course, chapters, and sections in database
 *
 * @route POST /api/sam/create-course-complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// ============================================================================
// Request Schema
// ============================================================================

const CreateCourseCompleteSchema = z.object({
  formData: z.object({
    courseTitle: z.string().min(3).max(200),
    courseDescription: z.string().optional(),
    courseShortOverview: z.string().min(10),
    courseCategory: z.string().optional(),
    courseSubcategory: z.string().optional(),
    targetAudience: z.string().min(5),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    courseIntent: z.string().optional(),
    courseGoals: z.array(z.string()).default([]),
    bloomsFocus: z.array(z.string()).default(['UNDERSTAND', 'APPLY', 'ANALYZE']),
    preferredContentTypes: z.array(z.string()).default(['video', 'reading', 'quiz']),
    chapterCount: z.number().min(1).max(20).default(8),
    sectionsPerChapter: z.number().min(1).max(10).default(3),
    includeAssessments: z.boolean().default(true),
    price: z.number().min(0).optional(),
  }),
  samContext: z.array(z.string()).default([]),
  generatedStructure: z.object({
    courseDescription: z.string(),
    learningObjectives: z.array(z.string()),
    chapters: z.array(z.object({
      title: z.string(),
      description: z.string(),
      learningOutcomes: z.string().optional(),
      bloomsLevel: z.string(),
      position: z.number(),
      isFree: z.boolean().optional(),
      sections: z.array(z.object({
        title: z.string(),
        description: z.string(),
        learningObjectives: z.string().optional(),
        contentType: z.string(),
        estimatedDuration: z.string(),
        position: z.number(),
        isFree: z.boolean().optional(),
      })),
    })),
  }).optional(),
  options: z.object({
    validateBeforeCreate: z.boolean().default(true),
    minimumQualityScore: z.number().min(0).max(100).default(70),
    generateIfMissing: z.boolean().default(true),
  }).default({}),
});

type CreateCourseCompleteRequest = z.infer<typeof CreateCourseCompleteSchema>;

// ============================================================================
// Quality Validation
// ============================================================================

interface QualityScore {
  overall: number;
  breakdown: {
    clarity: number;
    relevance: number;
    completeness: number;
    engagement: number;
    bloomsAlignment: number;
  };
  passed: boolean;
  suggestions: string[];
}

function validateQuality(
  formData: CreateCourseCompleteRequest['formData'],
  structure: NonNullable<CreateCourseCompleteRequest['generatedStructure']>,
  minimumScore: number
): QualityScore {
  const suggestions: string[] = [];
  let clarity = 100;
  let relevance = 100;
  let completeness = 100;
  let engagement = 100;
  let bloomsAlignment = 100;

  // Title validation
  if (formData.courseTitle.length < 10) {
    clarity -= 20;
    suggestions.push('Course title should be at least 10 characters');
  }

  // Description validation
  if (structure.courseDescription.length < 100) {
    completeness -= 30;
    suggestions.push('Course description should be at least 100 characters');
  }

  // Learning objectives
  if (structure.learningObjectives.length < 3) {
    completeness -= 25;
    suggestions.push('Add at least 3 learning objectives');
  }

  // Chapters
  if (structure.chapters.length < 3) {
    completeness -= 20;
    suggestions.push('Add at least 3 chapters');
  }

  // Bloom's alignment check
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const usedLevels = new Set(structure.chapters.map(ch => ch.bloomsLevel?.toUpperCase()));
  if (usedLevels.size < 3) {
    bloomsAlignment -= 20;
    suggestions.push('Use more diverse Bloom\'s taxonomy levels');
  }

  // Content type diversity
  const contentTypes = new Set(
    structure.chapters.flatMap(ch => ch.sections.map(s => s.contentType))
  );
  if (contentTypes.size < 2) {
    engagement -= 20;
    suggestions.push('Add more diverse content types (videos, readings, quizzes)');
  }

  const overall = Math.round(
    (clarity * 0.2) +
    (relevance * 0.2) +
    (completeness * 0.25) +
    (engagement * 0.15) +
    (bloomsAlignment * 0.2)
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    breakdown: {
      clarity: Math.max(0, clarity),
      relevance: Math.max(0, relevance),
      completeness: Math.max(0, completeness),
      engagement: Math.max(0, engagement),
      bloomsAlignment: Math.max(0, bloomsAlignment),
    },
    passed: overall >= minimumScore,
    suggestions: suggestions.slice(0, 5),
  };
}

// ============================================================================
// Structure Generation
// ============================================================================

async function generateCourseStructure(
  formData: CreateCourseCompleteRequest['formData'],
  samContext: string[],
  userId: string
): Promise<NonNullable<CreateCourseCompleteRequest['generatedStructure']>> {
  const prompt = `You are SAM, an expert AI course designer. Create a comprehensive course structure.

COURSE DETAILS:
- Title: "${formData.courseTitle}"
- Overview: "${formData.courseShortOverview}"
- Target Audience: ${formData.targetAudience}
- Difficulty: ${formData.difficulty}
- Bloom's Focus: ${formData.bloomsFocus.join(', ')}
- Content Types: ${formData.preferredContentTypes.join(', ')}
- Chapters Needed: ${formData.chapterCount}
- Sections per Chapter: ${formData.sectionsPerChapter}

CONTEXT FROM WIZARD:
${samContext.length > 0 ? samContext.join('\n') : 'No additional context'}

Create a JSON response with this structure:
{
  "courseDescription": "Comprehensive 2-3 paragraph description",
  "learningObjectives": ["Students will be able to...", ...],
  "chapters": [
    {
      "title": "Chapter Title",
      "description": "What students will learn in this chapter",
      "learningOutcomes": "Specific outcomes for this chapter",
      "bloomsLevel": "UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
      "position": 1,
      "sections": [
        {
          "title": "Section Title",
          "description": "Section content overview",
          "contentType": "video|reading|quiz|assignment|project",
          "estimatedDuration": "15 minutes",
          "position": 1
        }
      ]
    }
  ]
}

Requirements:
1. Progress through Bloom's levels: ${formData.bloomsFocus.join(' → ')}
2. Each chapter focuses on one Bloom's level
3. Create exactly ${formData.chapterCount} chapters
4. Each chapter has exactly ${formData.sectionsPerChapter} sections
5. Use action verbs in learning objectives
6. Make content appropriate for ${formData.difficulty} level learners`;

  const response = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    maxTokens: 4000,
    temperature: 0.7,
    messages: [{ role: 'user', content: prompt }],
    extended: true,
  });

  try {
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch {
    // Generate fallback structure
    return generateFallbackStructure(formData);
  }
}

function generateFallbackStructure(
  formData: CreateCourseCompleteRequest['formData']
): NonNullable<CreateCourseCompleteRequest['generatedStructure']> {
  const chapters = Array.from({ length: formData.chapterCount }, (_, i) => ({
    title: `Chapter ${i + 1}: ${formData.courseTitle} - Part ${i + 1}`,
    description: `This chapter covers essential concepts for ${formData.targetAudience}.`,
    learningOutcomes: `By the end of this chapter, students will understand key concepts.`,
    bloomsLevel: formData.bloomsFocus[i % formData.bloomsFocus.length] || 'UNDERSTAND',
    position: i + 1,
    isFree: i === 0,
    sections: Array.from({ length: formData.sectionsPerChapter }, (_, j) => ({
      title: `Section ${j + 1}: Core Concepts`,
      description: `Learn fundamental concepts and apply them practically.`,
      contentType: formData.preferredContentTypes[j % formData.preferredContentTypes.length] || 'video',
      estimatedDuration: '20 minutes',
      position: j + 1,
      isFree: i === 0 && j === 0,
    })),
  }));

  return {
    courseDescription: `${formData.courseShortOverview}\n\nThis comprehensive course is designed for ${formData.targetAudience} at the ${formData.difficulty} level.`,
    learningObjectives: formData.courseGoals.length > 0
      ? formData.courseGoals
      : [
          `Understand the fundamentals of ${formData.courseTitle}`,
          `Apply key concepts in practical scenarios`,
          `Analyze complex problems and develop solutions`,
        ],
    chapters,
  };
}

// ============================================================================
// Main Handler
// ============================================================================

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  const startTime = Date.now();

  try {
    // Authentication
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = CreateCourseCompleteSchema.parse(body);
    const { formData, samContext, options } = validatedData;

    // Generate structure if not provided
    let structure = validatedData.generatedStructure;
    if (!structure && options.generateIfMissing) {
      logger.info('Generating course structure with SAM AI...');
      structure = await withRetryableTimeout(
        () => generateCourseStructure(formData, samContext, user.id),
        TIMEOUT_DEFAULTS.AI_GENERATION,
        'create-course-complete-structure-generation'
      );
    }

    if (!structure) {
      return NextResponse.json(
        { success: false, error: { message: 'No course structure provided or generated' } },
        { status: 400 }
      );
    }

    // Validate quality
    if (options.validateBeforeCreate) {
      const quality = validateQuality(formData, structure, options.minimumQualityScore);

      if (!quality.passed) {
        return NextResponse.json({
          success: false,
          error: {
            message: `Quality score (${quality.overall}) is below minimum (${options.minimumQualityScore})`,
            code: 'QUALITY_CHECK_FAILED',
          },
          quality,
          suggestions: quality.suggestions,
        }, { status: 400 });
      }
    }

    // Create course in transaction
    const result = await db.$transaction(async (tx) => {
      // 1. Create course
      const course = await tx.course.create({
        data: {
          userId: user.id,
          title: formData.courseTitle,
          description: structure.courseDescription,
          whatYouWillLearn: structure.learningObjectives,
          difficulty: formData.difficulty,
          categoryId: formData.courseCategory || null,
          price: formData.price ?? null,
          isPublished: false,
        },
      });

      const createdChapters: Array<{
        id: string;
        title: string;
        position: number;
        sections: Array<{ id: string; title: string; position: number }>;
      }> = [];

      // 2. Create chapters and sections
      for (const chapter of structure.chapters) {
        const createdChapter = await tx.chapter.create({
          data: {
            courseId: course.id,
            title: chapter.title,
            description: chapter.description,
            learningOutcomes: chapter.learningOutcomes || chapter.description,
            position: chapter.position,
            isFree: chapter.isFree ?? false,
            isPublished: false,
          },
        });

        const createdSections: Array<{ id: string; title: string; position: number }> = [];

        for (const section of chapter.sections) {
          const createdSection = await tx.section.create({
            data: {
              chapterId: createdChapter.id,
              title: section.title,
              description: section.description,
              learningObjectives: section.learningObjectives || section.description,
              position: section.position,
              type: section.contentType,
              isFree: section.isFree ?? false,
              isPublished: false,
            },
          });

          createdSections.push({
            id: createdSection.id,
            title: createdSection.title,
            position: createdSection.position,
          });
        }

        createdChapters.push({
          id: createdChapter.id,
          title: createdChapter.title,
          position: createdChapter.position,
          sections: createdSections,
        });
      }

      return { course, chapters: createdChapters };
    });

    const creationTime = Date.now() - startTime;
    const totalSections = result.chapters.reduce((sum, ch) => sum + ch.sections.length, 0);

    logger.info('Course created successfully', {
      courseId: result.course.id,
      chapters: result.chapters.length,
      sections: totalSections,
      creationTimeMs: creationTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        course: {
          id: result.course.id,
          title: result.course.title,
          url: `/teacher/courses/${result.course.id}`,
        },
        chapters: result.chapters,
        quality: validateQuality(formData, structure, options.minimumQualityScore),
        stats: {
          totalChapters: result.chapters.length,
          totalSections,
          creationTimeMs: creationTime,
        },
      },
    });

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({
        success: false,
        error: { message: 'Operation timed out. Please try again.' },
      }, { status: 504 });
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('Complete course creation failed:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Invalid request data',
          details: error.errors,
        },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to create course',
      },
    }, { status: 500 });
  }
}
