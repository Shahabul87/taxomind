import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCombinedSession } from '@/lib/auth/combined-session';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleAIAccessError } from '@/lib/sam/ai-provider';
import { OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { executeProfile } from '@/lib/sam/prompt-registry';
import type { ChapterContentInput } from '@/lib/sam/prompt-registry/profiles/chapter-content';
import { safeErrorResponse } from '@/lib/api/safe-error';
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

// =============================================================================
// Validation
// =============================================================================

const ChapterContentRequestSchema = z.object({
  chapterId: z.string().min(1, 'Chapter ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  chapterTitle: z.string().min(1, 'Chapter title is required'),
  chapterDescription: z.string().optional(),
  preferences: z.object({
    contentType: z.string().default('comprehensive'),
    generationMode: z.string().default('standard'),
    sectionCount: z.number().min(1).max(12).default(4),
    focusAreas: z.string().default(''),
    targetAudience: z.string().default(''),
    difficultyLevel: z.string().default('intermediate'),
  }),
  existingSections: z.array(z.unknown()).default([]),
});

// =============================================================================
// Response types (matches what the component expects)
// =============================================================================

interface GeneratedSection {
  title: string;
  description: string;
  contentType: 'video' | 'reading' | 'interactive' | 'assessment' | 'project';
  estimatedDuration: string;
  bloomsLevel: string;
  content: {
    summary: string;
    keyPoints: string[];
    activities?: string[];
    assessmentQuestions?: string[];
  };
}

interface GeneratedContent {
  title: string;
  description: string;
  learningOutcomes: string[];
  sections: GeneratedSection[];
}

// =============================================================================
// Template fallback (slim version of original logic)
// =============================================================================

function generateTemplateFallback(
  chapterTitle: string,
  chapterDescription: string | undefined,
  preferences: z.infer<typeof ChapterContentRequestSchema>['preferences']
): GeneratedContent {
  const bloomsMap: Record<string, string[]> = {
    beginner: ['REMEMBER', 'UNDERSTAND', 'APPLY'],
    intermediate: ['UNDERSTAND', 'APPLY', 'ANALYZE'],
    advanced: ['APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'],
  };
  const bloomsLevels = bloomsMap[preferences.difficultyLevel] ?? bloomsMap['intermediate'];

  const contentTypeMap: Record<string, string[]> = {
    comprehensive: ['video', 'reading', 'interactive', 'assessment'],
    'video-focused': ['video', 'video', 'interactive', 'assessment'],
    'text-heavy': ['reading', 'reading', 'interactive', 'assessment'],
    'assessment-rich': ['reading', 'assessment', 'interactive', 'assessment'],
    'project-based': ['reading', 'project', 'interactive', 'project'],
  };
  const contentTypes = contentTypeMap[preferences.contentType] ?? contentTypeMap['comprehensive'];

  const learningOutcomes = bloomsLevels.map((level) => {
    const verbs: Record<string, string> = {
      REMEMBER: `Recall and identify key concepts in ${chapterTitle.toLowerCase()}`,
      UNDERSTAND: `Explain the fundamental principles of ${chapterTitle.toLowerCase()}`,
      APPLY: `Apply ${chapterTitle.toLowerCase()} concepts to solve practical problems`,
      ANALYZE: `Analyze complex scenarios involving ${chapterTitle.toLowerCase()}`,
      EVALUATE: `Evaluate different approaches in ${chapterTitle.toLowerCase()}`,
      CREATE: `Create original solutions using ${chapterTitle.toLowerCase()}`,
    };
    return verbs[level] ?? `Understand ${chapterTitle.toLowerCase()}`;
  });

  const sections: GeneratedSection[] = [];
  for (let i = 0; i < preferences.sectionCount; i++) {
    const ct = contentTypes[i % contentTypes.length] as GeneratedSection['contentType'];
    const bl = bloomsLevels[Math.min(Math.floor((i / preferences.sectionCount) * bloomsLevels.length), bloomsLevels.length - 1)];

    const section: GeneratedSection = {
      title: `Section ${i + 1}: ${chapterTitle} - Part ${i + 1}`,
      description: `Covers ${chapterTitle.toLowerCase()} concepts at the ${bl.toLowerCase()} level.`,
      contentType: ct,
      estimatedDuration: ct === 'project' ? '45-60 minutes' : '15-25 minutes',
      bloomsLevel: bl,
      content: {
        summary: `This section covers aspects of ${chapterTitle.toLowerCase()} with a focus on ${bl.toLowerCase()}-level learning.`,
        keyPoints: [
          `Core concepts of ${chapterTitle.toLowerCase()}`,
          'Practical applications and examples',
          'Key considerations and best practices',
        ],
      },
    };

    if (ct === 'interactive' || ct === 'project') {
      section.content.activities = [
        'Guided practice exercise',
        'Hands-on implementation task',
        'Reflection and review',
      ];
    }
    if (ct === 'assessment') {
      section.content.assessmentQuestions = [
        `What are the key components of ${chapterTitle.toLowerCase()}?`,
        `Explain how ${chapterTitle.toLowerCase()} works in practice.`,
        `How would you apply ${chapterTitle.toLowerCase()} in a real scenario?`,
      ];
    }

    sections.push(section);
  }

  return {
    title: chapterTitle.trim(),
    description:
      chapterDescription ??
      `This chapter covers essential concepts in ${chapterTitle.toLowerCase()}. Suitable for ${preferences.difficultyLevel} learners.`,
    learningOutcomes,
    sections,
  };
}

// =============================================================================
// Route handler
// =============================================================================

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Auth — supports both user (teacher) and admin
    const session = await getCombinedSession();
    if (!session.userId) {
      return ApiResponses.unauthorized();
    }

    // Parse and validate
    const body = await request.json();
    const parseResult = ChapterContentRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request format', details: parseResult.error.errors },
        { status: 400 }
      );
    }
    const req = parseResult.data;

    // Verify chapter ownership (admins can access any chapter)
    const chapter = await db.chapter.findUnique({
      where: {
        id: req.chapterId,
        courseId: req.courseId,
      },
      include: {
        course: { select: { userId: true } },
      },
    });

    if (!chapter || (!session.isAdmin && chapter.course.userId !== session.userId)) {
      return NextResponse.json(
        { error: 'Chapter not found or access denied' },
        { status: 404 }
      );
    }

    // Generate via AI using Prompt Registry
    try {
      const profileInput: ChapterContentInput = {
        chapterTitle: req.chapterTitle,
        chapterDescription: req.chapterDescription ?? '',
        difficultyLevel: req.preferences.difficultyLevel,
        contentType: req.preferences.contentType,
        generationMode: req.preferences.generationMode,
        sectionCount: req.preferences.sectionCount,
        targetAudience: req.preferences.targetAudience,
        focusAreas: req.preferences.focusAreas,
      };

      const result = await executeProfile<ChapterContentInput, GeneratedContent>({
        taskType: 'chapter-content-generation',
        input: profileInput,
        userId: session.userId,
      });

      // Return the generated content directly (component expects this shape)
      return NextResponse.json(result.data);
    } catch (aiError) {
      // AI call failed — fall back to template
      logger.warn('[CHAPTER_CONTENT] AI generation failed, using template fallback', {
        error: aiError instanceof Error ? aiError.message : String(aiError),
      });

      const fallback = generateTemplateFallback(
        req.chapterTitle,
        req.chapterDescription,
        req.preferences
      );
      return NextResponse.json(fallback);
    }
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[CHAPTER_CONTENT] Timeout', {
        operation: error.operationName,
        timeoutMs: error.timeoutMs,
      });
      return NextResponse.json(
        { error: 'Operation timed out. Please try again.' },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[CHAPTER_CONTENT] Error generating chapter content:', error);
    return safeErrorResponse(error, 500, 'CHAPTER_CONTENT');
  }
}
