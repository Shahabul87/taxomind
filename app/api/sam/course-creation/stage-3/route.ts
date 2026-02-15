/**
 * Stage 3 API: Section Detail Generation
 *
 * Fills in description and learning objectives for ONE section.
 * Has full context of course, chapter, and all sections.
 *
 * SUBSCRIPTION REQUIRED: This endpoint requires a premium subscription.
 *
 * @deprecated Replaced by the unified `/api/sam/course-creation/orchestrate` SSE endpoint.
 * This route is kept for backward compatibility with unknown external consumers.
 * Scheduled for removal in Q3 2026. Monitor deprecation warnings in logs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { handleAIAccessError } from '@/lib/sam/ai-provider';
import { createUserScopedAdapter } from '@/lib/ai/user-scoped-adapter';
import { logger } from '@/lib/logger';
import { buildStage3Prompt } from '@/lib/sam/course-creation/prompts';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import {
  Stage3Request,
  Stage3Response,
  SectionDetails,
  BLOOMS_TAXONOMY,
  BloomsLevel,
} from '@/lib/sam/course-creation/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse<Stage3Response>> {
  logger.warn('[DEPRECATED] POST /api/sam/course-creation/stage-3 called — use /orchestrate instead. Removal: Q3 2026.');

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

    const body: Stage3Request = await request.json();
    const {
      courseContext,
      chapter,
      chapterSections,
      currentSection,
    } = body;

    if (!courseContext?.courseTitle || !chapter || !currentSection) {
      return NextResponse.json({
        success: false,
        error: 'Course context, chapter, and current section are required',
      }, { status: 400 });
    }

    logger.info('[STAGE3] Generating section details', {
      chapterTitle: chapter.title,
      sectionTitle: currentSection.title,
      bloomsLevel: chapter.bloomsLevel,
    });

    // Build the prompt with full context
    const { systemPrompt, userPrompt } = buildStage3Prompt({
      courseContext,
      chapter,
      section: currentSection,
      chapterSections,
    });

    // Create a user-scoped CoreAIAdapter for this request
    const aiAdapter = await createUserScopedAdapter(user.id, 'course');

    // Call AI via CoreAIAdapter
    const responseText = await withRetryableTimeout(
      async () => {
        const aiResponse = await aiAdapter.chat({
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt,
          maxTokens: 3000,
          temperature: 0.7,
        });
        return aiResponse.content;
      },
      TIMEOUT_DEFAULTS.AI_GENERATION,
      'stage3-section-detail-generation'
    );

    // Parse and validate the response
    const { details, thinking, qualityScore } = parseStage3Response(
      responseText,
      chapter,
      currentSection,
      courseContext
    );

    logger.info('[STAGE3] Section details generated successfully', {
      sectionTitle: currentSection.title,
      descriptionLength: details.description.length,
      objectivesCount: details.learningObjectives.length,
      qualityScore,
    });

    return NextResponse.json({
      success: true,
      details,
      thinking,
      qualityScore,
    });

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[STAGE3] Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ success: false, error: 'Operation timed out. Please try again.' }, { status: 504 });
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[STAGE3] Error generating section details:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: `Failed to generate section details: ${errorMessage}`,
    }, { status: 500 });
  }
}

/**
 * Parse and validate the AI response for Stage 3
 */
function parseStage3Response(
  responseText: string,
  chapter: { title: string; bloomsLevel: string; learningObjectives: string[] },
  section: { title: string; contentType: string; topicFocus: string },
  courseContext: { courseTitle: string; targetAudience: string; learningObjectivesPerSection: number }
): {
  details: SectionDetails;
  thinking: string;
  qualityScore: number;
} {
  try {
    // Clean up response
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanedResponse);

    const thinking = parsed.thinking || 'Generated section details based on context.';
    const detailsData = parsed.details;

    if (!detailsData) {
      throw new Error('No details data in response');
    }

    // Validate and normalize the details
    const details: SectionDetails = {
      description: validateDescription(
        detailsData.description,
        section,
        courseContext
      ),
      learningObjectives: validateLearningObjectives(
        detailsData.learningObjectives,
        chapter.bloomsLevel as BloomsLevel,
        section.topicFocus,
        courseContext.learningObjectivesPerSection
      ),
      keyConceptsCovered: detailsData.keyConceptsCovered || [section.topicFocus],
      practicalActivity: validateActivity(
        detailsData.practicalActivity,
        section.contentType
      ),
      resources: detailsData.resources || [],
    };

    const qualityScore = calculateDetailsQualityScore(details, chapter, section);

    return { details, thinking, qualityScore };

  } catch (parseError) {
    logger.error('[STAGE3] Failed to parse AI response:', parseError);
    logger.debug('[STAGE3] Raw response:', responseText);

    // Return fallback details
    return {
      details: generateFallbackDetails(chapter, section, courseContext),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: 50,
    };
  }
}

/**
 * Validate and ensure description meets quality standards
 */
function validateDescription(
  description: string | undefined,
  section: { title: string; contentType: string; topicFocus: string },
  courseContext: { courseTitle: string; targetAudience: string }
): string {
  if (!description || description.length < 30) {
    return `In this ${section.contentType}, you will explore ${section.topicFocus} as part of ${courseContext.courseTitle}. ` +
      `Designed for ${courseContext.targetAudience}, this section provides practical knowledge and hands-on experience ` +
      `that you can immediately apply in real-world scenarios.`;
  }

  // Ensure minimum length
  if (description.length < 50) {
    return description + ` This ${section.contentType} focuses on building practical skills in ${section.topicFocus}.`;
  }

  return description;
}

/**
 * Validate learning objectives using correct Bloom's verbs
 */
function validateLearningObjectives(
  objectives: string[] | undefined,
  bloomsLevel: BloomsLevel,
  topicFocus: string,
  requiredCount: number
): string[] {
  const bloomsInfo = BLOOMS_TAXONOMY[bloomsLevel] || BLOOMS_TAXONOMY['APPLY'];
  const validObjectives: string[] = [];

  if (Array.isArray(objectives)) {
    for (const obj of objectives) {
      if (obj && obj.length > 10) {
        // Check if it starts with a Bloom's verb
        const firstWord = obj.split(' ')[0];
        const hasValidVerb = bloomsInfo.verbs.some(
          v => v.toLowerCase() === firstWord.toLowerCase()
        );

        if (hasValidVerb) {
          validObjectives.push(obj);
        } else {
          // Prepend a valid verb
          const verb = bloomsInfo.verbs[validObjectives.length % bloomsInfo.verbs.length];
          validObjectives.push(`${verb} ${obj.charAt(0).toLowerCase()}${obj.slice(1)}`);
        }
      }
    }
  }

  // Ensure we have enough objectives
  while (validObjectives.length < requiredCount) {
    const verbIndex = validObjectives.length % bloomsInfo.verbs.length;
    const verb = bloomsInfo.verbs[verbIndex];
    validObjectives.push(
      `${verb} the key concepts and techniques of ${topicFocus}`
    );
  }

  return validObjectives.slice(0, requiredCount);
}

/**
 * Validate practical activity matches content type
 */
function validateActivity(
  activity: string | undefined,
  contentType: string
): string {
  if (activity && activity.length > 10) {
    return activity;
  }

  // Generate appropriate activity based on content type
  const activityTemplates: Record<string, string> = {
    video: 'Watch the video demonstration and take notes on the key concepts presented. Pause and practice along with the examples shown.',
    reading: 'Read through the material carefully, highlighting important concepts. Create a summary of the main points in your own words.',
    assignment: 'Complete the hands-on exercises provided. Apply the concepts learned to solve the given problems.',
    quiz: 'Test your understanding by completing the quiz. Review any incorrect answers and revisit the related material.',
    project: 'Work on the project deliverable using the techniques learned. Document your approach and decisions.',
    discussion: 'Participate in the discussion forum. Share your insights and respond to at least two peer contributions.',
  };

  return activityTemplates[contentType] || activityTemplates['assignment'];
}

/**
 * Calculate quality score for generated details
 */
function calculateDetailsQualityScore(
  details: SectionDetails,
  chapter: { bloomsLevel: string },
  section: { title: string; topicFocus: string }
): number {
  let score = 100;
  const bloomsInfo = BLOOMS_TAXONOMY[chapter.bloomsLevel as BloomsLevel] || BLOOMS_TAXONOMY['APPLY'];

  // Description quality (40 points)
  if (details.description.length < 50) score -= 20;
  if (details.description.length < 100) score -= 10;
  if (!details.description.toLowerCase().includes(section.topicFocus.toLowerCase().split(' ')[0])) {
    score -= 10;
  }

  // Learning objectives quality (40 points)
  if (details.learningObjectives.length < 2) score -= 20;

  // Check Bloom's verb usage
  let validVerbCount = 0;
  for (const obj of details.learningObjectives) {
    const firstWord = obj.split(' ')[0];
    if (bloomsInfo.verbs.some(v => v.toLowerCase() === firstWord.toLowerCase())) {
      validVerbCount++;
    }
  }
  const verbRatio = validVerbCount / details.learningObjectives.length;
  if (verbRatio < 0.5) score -= 20;
  else if (verbRatio < 0.8) score -= 10;

  // Key concepts quality (10 points)
  if (details.keyConceptsCovered.length < 2) score -= 10;

  // Activity quality (10 points)
  if (!details.practicalActivity || details.practicalActivity.length < 20) score -= 10;

  return Math.max(0, score);
}

/**
 * Generate fallback details when AI fails
 */
function generateFallbackDetails(
  chapter: { title: string; bloomsLevel: string; learningObjectives: string[] },
  section: { title: string; contentType: string; topicFocus: string },
  courseContext: { courseTitle: string; targetAudience: string; learningObjectivesPerSection: number }
): SectionDetails {
  const bloomsInfo = BLOOMS_TAXONOMY[chapter.bloomsLevel as BloomsLevel] || BLOOMS_TAXONOMY['APPLY'];

  return {
    description: `This ${section.contentType} covers ${section.topicFocus} as part of ${chapter.title}. ` +
      `Designed for ${courseContext.targetAudience}, you will learn essential concepts and gain practical skills ` +
      `that build upon the chapter's learning objectives. By the end of this section, you will have a solid ` +
      `understanding of ${section.topicFocus} and be able to apply it in real-world scenarios.`,
    learningObjectives: [
      `${bloomsInfo.verbs[0]} the fundamental concepts of ${section.topicFocus}`,
      `${bloomsInfo.verbs[1]} how ${section.topicFocus} applies to ${courseContext.courseTitle}`,
      `${bloomsInfo.verbs[2]} ${section.topicFocus} techniques in practical exercises`,
    ].slice(0, courseContext.learningObjectivesPerSection),
    keyConceptsCovered: [
      section.topicFocus,
      `${section.topicFocus} fundamentals`,
      'Practical applications',
    ],
    practicalActivity: `Complete the ${section.contentType} exercises on ${section.topicFocus}. ` +
      `Apply the concepts learned to reinforce your understanding and build practical skills.`,
  };
}
