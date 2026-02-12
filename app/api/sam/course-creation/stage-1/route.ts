/**
 * Stage 1 API: Chapter Generation
 *
 * Generates ONE chapter at a time with full context awareness.
 * Each chapter knows about all previous chapters for consistency.
 *
 * SUBSCRIPTION REQUIRED: This endpoint requires a premium subscription.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { handleAIAccessError } from '@/lib/sam/ai-provider';
import { createUserScopedAdapter } from '@/lib/ai/user-scoped-adapter';
import { logger } from '@/lib/logger';
import { buildStage1Prompt } from '@/lib/sam/course-creation/prompts';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import {
  Stage1Request,
  Stage1Response,
  GeneratedChapter,
  CourseContext,
} from '@/lib/sam/course-creation/types';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for AI generation

export async function POST(request: NextRequest): Promise<NextResponse<Stage1Response>> {
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Subscription gate: course creation requires STARTER+
    const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body: Stage1Request = await request.json();
    const { courseContext, previousChapters = [] } = body;

    // Validate required fields
    if (!courseContext?.courseTitle) {
      return NextResponse.json({
        success: false,
        error: 'Course title is required',
      }, { status: 400 });
    }

    const currentChapterNumber = previousChapters.length + 1;

    // Check if we've already generated all chapters
    if (currentChapterNumber > courseContext.totalChapters) {
      return NextResponse.json({
        success: false,
        error: 'All chapters have been generated',
      }, { status: 400 });
    }

    logger.info('[STAGE1] Generating chapter', {
      chapterNumber: currentChapterNumber,
      totalChapters: courseContext.totalChapters,
      courseTitle: courseContext.courseTitle,
    });

    // Build the prompt with full context
    const { systemPrompt, userPrompt } = buildStage1Prompt(
      courseContext,
      currentChapterNumber,
      previousChapters
    );

    // Create a user-scoped CoreAIAdapter for this request
    const aiAdapter = await createUserScopedAdapter(user.id, 'course');

    // Call AI via CoreAIAdapter
    const responseText = await withRetryableTimeout(
      async () => {
        const aiResponse = await aiAdapter.chat({
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt,
          maxTokens: 4000,
          temperature: 0.7,
        });
        return aiResponse.content;
      },
      TIMEOUT_DEFAULTS.AI_GENERATION,
      'stage1-chapter-generation'
    );

    // Parse the response
    const { chapter, thinking, qualityScore } = parseStage1Response(
      responseText,
      currentChapterNumber,
      courseContext
    );

    logger.info('[STAGE1] Chapter generated successfully', {
      chapterNumber: currentChapterNumber,
      title: chapter.title,
      objectivesCount: chapter.learningObjectives.length,
      qualityScore,
    });

    return NextResponse.json({
      success: true,
      chapter,
      thinking,
      qualityScore,
    });

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[STAGE1] Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ success: false, error: 'Operation timed out. Please try again.' }, { status: 504 });
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[STAGE1] Error generating chapter:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: `Failed to generate chapter: ${errorMessage}`,
    }, { status: 500 });
  }
}

/**
 * Parse and validate the AI response
 */
function parseStage1Response(
  responseText: string,
  chapterNumber: number,
  courseContext: CourseContext
): { chapter: GeneratedChapter; thinking: string; qualityScore: number } {
  try {
    // Clean up response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanedResponse);

    // Extract thinking and chapter
    const thinking = parsed.thinking || 'Generated chapter based on course context.';
    const chapterData = parsed.chapter;

    if (!chapterData) {
      throw new Error('No chapter data in response');
    }

    // Validate and normalize the chapter
    const chapter: GeneratedChapter = {
      position: chapterNumber,
      title: validateTitle(chapterData.title, chapterNumber, courseContext.courseTitle),
      description: validateDescription(chapterData.description, courseContext),
      bloomsLevel: chapterData.bloomsLevel || 'UNDERSTAND',
      learningObjectives: validateObjectives(
        chapterData.learningObjectives,
        courseContext.learningObjectivesPerChapter,
        chapterData.bloomsLevel || 'UNDERSTAND'
      ),
      keyTopics: chapterData.keyTopics || [],
      prerequisites: chapterData.prerequisites || 'None',
      estimatedTime: chapterData.estimatedTime || '1-2 hours',
      topicsToExpand: chapterData.topicsToExpand || chapterData.keyTopics || [],
    };

    // Calculate quality score
    const qualityScore = calculateQualityScore(chapter, courseContext);

    return { chapter, thinking, qualityScore };

  } catch (parseError) {
    logger.error('[STAGE1] Failed to parse AI response:', parseError);
    logger.debug('[STAGE1] Raw response:', responseText);

    // Return a fallback chapter with lower quality score
    return {
      chapter: generateFallbackChapter(chapterNumber, courseContext),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: 50,
    };
  }
}

/**
 * Validate and clean chapter title
 */
function validateTitle(title: string | undefined, chapterNumber: number, courseTitle: string): string {
  if (!title || title.length < 5) {
    return `Chapter ${chapterNumber}: ${courseTitle} Fundamentals`;
  }

  // Remove "Chapter X:" prefix if AI added it (we'll add our own formatting later)
  const cleanedTitle = title.replace(/^Chapter\s*\d+\s*[:\-]\s*/i, '').trim();

  return cleanedTitle || `${courseTitle} - Part ${chapterNumber}`;
}

/**
 * Validate and ensure description meets quality standards
 */
function validateDescription(description: string | undefined, context: CourseContext): string {
  if (!description || description.length < 50) {
    return `This chapter provides essential knowledge for ${context.targetAudience} ` +
      `learning ${context.courseTitle}. Through structured lessons and practical exercises, ` +
      `you will develop key skills at the ${context.difficulty} level.`;
  }

  return description;
}

/**
 * Validate learning objectives and ensure they use correct Bloom's verbs
 */
function validateObjectives(
  objectives: string[] | undefined,
  requiredCount: number,
  bloomsLevel: string
): string[] {
  const validObjectives: string[] = [];

  if (Array.isArray(objectives)) {
    for (const obj of objectives) {
      if (obj && obj.length > 10) {
        validObjectives.push(obj);
      }
    }
  }

  // Ensure we have enough objectives
  while (validObjectives.length < requiredCount) {
    validObjectives.push(`${getBloomsVerb(bloomsLevel)} key concepts and techniques in this chapter`);
  }

  return validObjectives.slice(0, requiredCount);
}

/**
 * Get a verb appropriate for the Bloom's level
 */
function getBloomsVerb(level: string): string {
  const verbs: Record<string, string> = {
    REMEMBER: 'Identify',
    UNDERSTAND: 'Explain',
    APPLY: 'Implement',
    ANALYZE: 'Analyze',
    EVALUATE: 'Evaluate',
    CREATE: 'Design',
  };
  return verbs[level] || 'Demonstrate';
}

/**
 * Calculate quality score for the generated chapter
 */
function calculateQualityScore(chapter: GeneratedChapter, context: CourseContext): number {
  let score = 100;

  // Title quality (20 points)
  if (chapter.title.length < 20) score -= 10;
  if (chapter.title.toLowerCase().includes('introduction') && chapter.position > 1) score -= 10;

  // Description quality (30 points)
  if (chapter.description.length < 100) score -= 15;
  if (chapter.description.length < 200) score -= 10;
  if (!chapter.description.toLowerCase().includes(context.courseTitle.toLowerCase().split(' ')[0])) score -= 5;

  // Learning objectives quality (30 points)
  if (chapter.learningObjectives.length < context.learningObjectivesPerChapter) score -= 15;
  const hasProperVerbs = chapter.learningObjectives.some(obj => {
    const firstWord = obj.split(' ')[0];
    return firstWord.length > 3 && /^[A-Z]/.test(firstWord);
  });
  if (!hasProperVerbs) score -= 15;

  // Key topics quality (20 points)
  if (chapter.keyTopics.length < 3) score -= 10;
  if (chapter.keyTopics.length < 2) score -= 10;

  return Math.max(0, score);
}

/**
 * Generate fallback chapter when AI fails
 */
function generateFallbackChapter(chapterNumber: number, context: CourseContext): GeneratedChapter {
  const topicProgression = [
    'Foundation and Core Concepts',
    'Practical Implementation Techniques',
    'Advanced Patterns and Best Practices',
    'Real-World Applications',
    'Integration and Optimization',
    'Mastery and Advanced Topics',
  ];

  const topicIndex = (chapterNumber - 1) % topicProgression.length;
  const topic = topicProgression[topicIndex];

  return {
    position: chapterNumber,
    title: `${topic} in ${context.courseTitle}`,
    description: `This chapter covers ${topic.toLowerCase()} for ${context.targetAudience} ` +
      `at the ${context.difficulty} level. You will learn essential skills and concepts ` +
      `that build upon previous knowledge and prepare you for more advanced topics.`,
    bloomsLevel: 'UNDERSTAND',
    learningObjectives: [
      `Explain the fundamental concepts of ${topic.toLowerCase()}`,
      `Identify key patterns and techniques used in practice`,
      `Apply learned concepts to solve common problems`,
      `Analyze different approaches and their trade-offs`,
      `Demonstrate understanding through practical exercises`,
    ],
    keyTopics: [
      `${topic} fundamentals`,
      'Practical techniques',
      'Common patterns',
    ],
    prerequisites: chapterNumber > 1 ? `Completion of Chapter ${chapterNumber - 1}` : 'Basic understanding of the subject',
    estimatedTime: '1-2 hours',
    topicsToExpand: [
      `${topic} fundamentals`,
      'Practical techniques',
      'Common patterns',
    ],
  };
}
