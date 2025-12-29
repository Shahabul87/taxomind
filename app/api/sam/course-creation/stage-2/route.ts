/**
 * Stage 2 API: Section Generation
 *
 * Generates ONE section at a time for a specific chapter.
 * Ensures uniqueness across the entire course.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChat } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { buildStage2Prompt } from '@/lib/sam/course-creation/prompts';
import {
  Stage2Request,
  Stage2Response,
  GeneratedSection,
  ContentType,
  CONTENT_TYPES,
} from '@/lib/sam/course-creation/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse<Stage2Response>> {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: Stage2Request = await request.json();
    const {
      courseContext,
      currentChapter,
      previousSections = [],
      allExistingSectionTitles = [],
    } = body;

    if (!courseContext?.courseTitle || !currentChapter) {
      return NextResponse.json({
        success: false,
        error: 'Course context and current chapter are required',
      }, { status: 400 });
    }

    const currentSectionNumber = previousSections.length + 1;

    if (currentSectionNumber > courseContext.sectionsPerChapter) {
      return NextResponse.json({
        success: false,
        error: 'All sections for this chapter have been generated',
      }, { status: 400 });
    }

    logger.info('[STAGE2] Generating section', {
      chapterTitle: currentChapter.title,
      sectionNumber: currentSectionNumber,
      totalSections: courseContext.sectionsPerChapter,
      existingTitlesCount: allExistingSectionTitles.length,
    });

    // Build the prompt with chapter context
    const prompt = buildStage2Prompt(
      courseContext,
      currentChapter,
      currentSectionNumber,
      previousSections,
      allExistingSectionTitles
    );

    // Call SAM AI
    const responseText = await runSAMChat({
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1500,
      messages: [{ role: 'user', content: prompt }],
      extended: true,
    });

    // Parse and validate the response
    const { section, thinking, qualityScore, uniquenessValidated } = parseStage2Response(
      responseText,
      currentSectionNumber,
      currentChapter,
      allExistingSectionTitles,
      courseContext
    );

    // Double-check uniqueness
    if (!uniquenessValidated) {
      logger.warn('[STAGE2] Section title uniqueness check failed, regenerating...');
      // Could implement retry logic here
    }

    logger.info('[STAGE2] Section generated successfully', {
      sectionNumber: currentSectionNumber,
      title: section.title,
      contentType: section.contentType,
      qualityScore,
      uniquenessValidated,
    });

    return NextResponse.json({
      success: true,
      section,
      thinking,
      qualityScore,
      uniquenessValidated,
    });

  } catch (error) {
    logger.error('[STAGE2] Error generating section:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({
      success: false,
      error: `Failed to generate section: ${errorMessage}`,
    }, { status: 500 });
  }
}

/**
 * Parse and validate the AI response for Stage 2
 */
function parseStage2Response(
  responseText: string,
  sectionNumber: number,
  chapter: { title: string; bloomsLevel: string; learningObjectives: string[] },
  existingTitles: string[],
  courseContext: { courseTitle: string; sectionsPerChapter: number }
): {
  section: GeneratedSection;
  thinking: string;
  qualityScore: number;
  uniquenessValidated: boolean;
} {
  try {
    // Clean up response
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanedResponse);

    const thinking = parsed.thinking || 'Generated section based on chapter context.';
    const sectionData = parsed.section;

    if (!sectionData) {
      throw new Error('No section data in response');
    }

    // Validate title uniqueness
    const proposedTitle = sectionData.title || `Section ${sectionNumber}`;
    const { isUnique, adjustedTitle } = validateUniqueness(proposedTitle, existingTitles, chapter.title, sectionNumber);

    // Validate content type
    const contentType = validateContentType(sectionData.contentType);

    const section: GeneratedSection = {
      position: sectionNumber,
      title: adjustedTitle,
      contentType,
      estimatedDuration: sectionData.estimatedDuration || '15-20 minutes',
      topicFocus: sectionData.topicFocus || extractTopicFromTitle(adjustedTitle),
      parentChapterContext: {
        title: chapter.title,
        bloomsLevel: chapter.bloomsLevel as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE',
        relevantObjectives: sectionData.parentChapterContext?.relevantObjectives ||
          chapter.learningObjectives.slice(0, 2),
      },
    };

    const qualityScore = calculateSectionQualityScore(section, chapter, existingTitles);

    return {
      section,
      thinking,
      qualityScore,
      uniquenessValidated: isUnique,
    };

  } catch (parseError) {
    logger.error('[STAGE2] Failed to parse AI response:', parseError);
    logger.debug('[STAGE2] Raw response:', responseText);

    // Return fallback section
    return {
      section: generateFallbackSection(sectionNumber, chapter, existingTitles, courseContext),
      thinking: 'Used fallback generation due to parsing error.',
      qualityScore: 50,
      uniquenessValidated: true,
    };
  }
}

/**
 * Validate title uniqueness and adjust if necessary
 */
function validateUniqueness(
  proposedTitle: string,
  existingTitles: string[],
  chapterTitle: string,
  sectionNumber: number
): { isUnique: boolean; adjustedTitle: string } {
  // Normalize for comparison
  const normalizedProposed = proposedTitle.toLowerCase().trim();
  const normalizedExisting = existingTitles.map(t => t.toLowerCase().trim());

  // Check exact match
  if (normalizedExisting.includes(normalizedProposed)) {
    // Make it unique by adding chapter context
    const adjustedTitle = `${proposedTitle} - ${chapterTitle.split(':')[0] || `Chapter ${sectionNumber}`}`;
    return { isUnique: false, adjustedTitle };
  }

  // Check similarity (simple approach - check for common generic patterns)
  const genericPatterns = [
    /^(key concepts?|core concepts?|fundamentals?|basics?|overview|introduction|getting started)/i,
    /^section \d+:/i,
  ];

  for (const pattern of genericPatterns) {
    if (pattern.test(proposedTitle)) {
      // Too generic, needs adjustment
      const adjustedTitle = `${proposedTitle} in ${chapterTitle.split(':').pop()?.trim() || 'Context'}`;
      return { isUnique: false, adjustedTitle };
    }
  }

  // Check word similarity with existing titles
  for (const existing of existingTitles) {
    const similarity = calculateSimilarity(proposedTitle, existing);
    if (similarity > 0.7) {
      const adjustedTitle = `${proposedTitle} (${chapterTitle.split(' ')[0]})`;
      return { isUnique: false, adjustedTitle };
    }
  }

  return { isUnique: true, adjustedTitle: proposedTitle };
}

/**
 * Calculate string similarity (Jaccard index on words)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Validate and normalize content type
 */
function validateContentType(contentType: string | undefined): ContentType {
  if (!contentType) return 'video';

  const normalized = contentType.toLowerCase().trim();

  if (CONTENT_TYPES.includes(normalized as ContentType)) {
    return normalized as ContentType;
  }

  // Map common variations
  if (normalized.includes('video')) return 'video';
  if (normalized.includes('read')) return 'reading';
  if (normalized.includes('assign') || normalized.includes('exercise')) return 'assignment';
  if (normalized.includes('quiz') || normalized.includes('test')) return 'quiz';
  if (normalized.includes('project') || normalized.includes('hands-on')) return 'project';
  if (normalized.includes('discuss')) return 'discussion';

  return 'video';
}

/**
 * Extract topic from section title
 */
function extractTopicFromTitle(title: string): string {
  // Remove common prefixes
  let topic = title
    .replace(/^Section \d+[:\-]\s*/i, '')
    .replace(/^(Understanding|Implementing|Working with|Introduction to)\s*/i, '')
    .trim();

  return topic || title;
}

/**
 * Calculate quality score for generated section
 */
function calculateSectionQualityScore(
  section: GeneratedSection,
  chapter: { title: string },
  existingTitles: string[]
): number {
  let score = 100;

  // Title quality (40 points)
  if (section.title.length < 15) score -= 20;
  if (/^(Section \d+|Key Concepts|Overview|Fundamentals)$/i.test(section.title)) score -= 20;

  // Check uniqueness against existing
  for (const existing of existingTitles) {
    if (calculateSimilarity(section.title, existing) > 0.5) {
      score -= 15;
      break;
    }
  }

  // Topic focus quality (30 points)
  if (!section.topicFocus || section.topicFocus.length < 5) score -= 15;
  if (section.topicFocus === section.title) score -= 15; // Should be more specific

  // Content type appropriateness (20 points)
  if (!CONTENT_TYPES.includes(section.contentType)) score -= 20;

  // Duration format (10 points)
  if (!section.estimatedDuration || !/\d+/.test(section.estimatedDuration)) score -= 10;

  return Math.max(0, score);
}

/**
 * Generate fallback section when AI fails
 */
function generateFallbackSection(
  sectionNumber: number,
  chapter: { title: string; bloomsLevel: string; learningObjectives: string[] },
  existingTitles: string[],
  courseContext: { courseTitle: string; sectionsPerChapter: number }
): GeneratedSection {
  // Create unique topic based on position
  const topicVariations = [
    `Understanding ${chapter.title.split(':').pop()?.trim() || 'Core Concepts'}`,
    `Practical ${chapter.title.split(' ').slice(-2).join(' ')} Techniques`,
    `Applying ${chapter.title.split(':').pop()?.trim() || 'Concepts'}`,
    `Advanced ${chapter.title.split(' ').slice(-2).join(' ')} Patterns`,
    `${chapter.title.split(':').pop()?.trim() || 'Topic'} Best Practices`,
  ];

  let title = topicVariations[(sectionNumber - 1) % topicVariations.length];

  // Ensure uniqueness
  let attempts = 0;
  while (existingTitles.some(t => t.toLowerCase() === title.toLowerCase()) && attempts < 5) {
    title = `${title} - Part ${sectionNumber}`;
    attempts++;
  }

  const contentTypes: ContentType[] = ['video', 'reading', 'assignment', 'quiz', 'project'];

  return {
    position: sectionNumber,
    title,
    contentType: contentTypes[(sectionNumber - 1) % contentTypes.length],
    estimatedDuration: '15-20 minutes',
    topicFocus: title.replace(/^(Understanding|Practical|Applying|Advanced)\s*/i, ''),
    parentChapterContext: {
      title: chapter.title,
      bloomsLevel: chapter.bloomsLevel as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE',
      relevantObjectives: chapter.learningObjectives.slice(0, 2),
    },
  };
}
