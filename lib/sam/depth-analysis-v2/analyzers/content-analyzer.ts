/**
 * Content Analyzer (Step 5)
 *
 * Analyzes content quality, identifies duplicates, thin sections,
 * and content gaps.
 */

import type {
  CourseInput,
  ContentAnalysisResult,
  DuplicateContent,
  ThinSection,
} from '../types';

/**
 * Calculate similarity between two texts using Jaccard similarity
 * on n-grams (shingles)
 */
function calculateTextSimilarity(textA: string, textB: string): number {
  if (!textA || !textB) return 0;

  const normalizeText = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9\s]/g, '');

  const getShingles = (text: string, n: number = 3): Set<string> => {
    const words = normalizeText(text).split(/\s+/).filter((w) => w.length > 2);
    const shingles = new Set<string>();
    for (let i = 0; i <= words.length - n; i++) {
      shingles.add(words.slice(i, i + n).join(' '));
    }
    return shingles;
  };

  const shinglesA = getShingles(textA);
  const shinglesB = getShingles(textB);

  if (shinglesA.size === 0 || shinglesB.size === 0) return 0;

  let intersection = 0;
  for (const shingle of shinglesA) {
    if (shinglesB.has(shingle)) intersection++;
  }

  const union = new Set([...shinglesA, ...shinglesB]).size;
  return Math.round((intersection / union) * 100);
}

/**
 * Extract overlapping concepts between two texts
 */
function extractOverlappingConcepts(textA: string, textB: string): string[] {
  const extractWords = (text: string) => {
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 4);
    return new Set(words);
  };

  const wordsA = extractWords(textA);
  const wordsB = extractWords(textB);

  const overlapping: string[] = [];
  for (const word of wordsA) {
    if (wordsB.has(word)) {
      overlapping.push(word);
    }
  }

  // Sort by length (longer words likely more specific)
  return overlapping.sort((a, b) => b.length - a.length).slice(0, 10);
}

/**
 * Find duplicate or highly similar content across the course
 */
function findDuplicates(course: CourseInput): DuplicateContent[] {
  const duplicates: DuplicateContent[] = [];
  const contentBlocks: Array<{
    chapterId: string;
    chapterTitle: string;
    sectionId?: string;
    sectionTitle?: string;
    content: string;
  }> = [];

  // Collect all content blocks
  for (const chapter of course.chapters) {
    // Chapter description as a content block
    if (chapter.description && chapter.description.length > 100) {
      contentBlocks.push({
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        content: chapter.description,
      });
    }

    // Section content blocks
    for (const section of chapter.sections) {
      const sectionContent = [
        section.description || '',
        section.content || '',
      ]
        .filter((c) => c.length > 0)
        .join(' ');

      if (sectionContent.length > 100) {
        contentBlocks.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          sectionId: section.id,
          sectionTitle: section.title,
          content: sectionContent,
        });
      }
    }
  }

  // Compare all pairs
  let duplicateId = 0;
  for (let i = 0; i < contentBlocks.length; i++) {
    for (let j = i + 1; j < contentBlocks.length; j++) {
      const blockA = contentBlocks[i];
      const blockB = contentBlocks[j];

      const similarity = calculateTextSimilarity(blockA.content, blockB.content);

      // Flag if similarity is above threshold (40% for potential, 60% for definite)
      if (similarity >= 40) {
        const overlappingConcepts = extractOverlappingConcepts(
          blockA.content,
          blockB.content
        );

        // Determine recommendation
        let recommendation: DuplicateContent['recommendation'];
        let recommendationReason: string;

        if (similarity >= 70) {
          // High similarity - likely duplicates
          const aIsLonger = blockA.content.length > blockB.content.length;
          recommendation = aIsLonger ? 'KEEP_A' : 'KEEP_B';
          recommendationReason = `Content is ${similarity}% similar. Keep the ${aIsLonger ? 'first' : 'second'} version as it is more comprehensive.`;
        } else if (similarity >= 50) {
          recommendation = 'MERGE';
          recommendationReason = `Content overlaps ${similarity}%. Consider merging into a single, comprehensive section.`;
        } else {
          recommendation = 'KEEP_BOTH';
          recommendationReason = `Content has ${similarity}% similarity but may cover different aspects. Review for intentional repetition.`;
        }

        duplicates.push({
          id: `dup-${++duplicateId}`,
          sourceA: {
            chapterId: blockA.chapterId,
            chapterTitle: blockA.chapterTitle,
            sectionId: blockA.sectionId,
            sectionTitle: blockA.sectionTitle,
            content:
              blockA.content.substring(0, 200) +
              (blockA.content.length > 200 ? '...' : ''),
          },
          sourceB: {
            chapterId: blockB.chapterId,
            chapterTitle: blockB.chapterTitle,
            sectionId: blockB.sectionId,
            sectionTitle: blockB.sectionTitle,
            content:
              blockB.content.substring(0, 200) +
              (blockB.content.length > 200 ? '...' : ''),
          },
          similarityScore: similarity,
          overlappingConcepts,
          recommendation,
          recommendationReason,
        });
      }
    }
  }

  // Sort by similarity (highest first)
  return duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Find sections that are too thin (lacking content)
 */
function findThinSections(course: CourseInput): ThinSection[] {
  const thinSections: ThinSection[] = [];

  // Recommended minimums based on section complexity
  const MINIMUM_WORD_COUNT = 150;
  const RECOMMENDED_WORD_COUNT = 300;

  for (const chapter of course.chapters) {
    for (const section of chapter.sections) {
      const content = [
        section.description || '',
        section.content || '',
      ].join(' ');

      const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

      // Check what's missing
      const missingElements: string[] = [];

      if (!section.description || section.description.trim().length < 20) {
        missingElements.push('description');
      }
      if (!section.content || section.content.trim().length < 50) {
        missingElements.push('main content');
      }
      if (!section.objectives || section.objectives.length === 0) {
        missingElements.push('learning objectives');
      }
      if (!section.videoUrl) {
        missingElements.push('video content');
      }
      if (!section.exams || section.exams.length === 0) {
        missingElements.push('assessment');
      }

      // Flag as thin if below minimum and missing elements
      if (wordCount < MINIMUM_WORD_COUNT || missingElements.length >= 3) {
        thinSections.push({
          sectionId: section.id,
          sectionTitle: section.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          currentWordCount: wordCount,
          recommendedWordCount: RECOMMENDED_WORD_COUNT,
          missingElements,
          suggestion:
            wordCount < MINIMUM_WORD_COUNT
              ? `Add ${RECOMMENDED_WORD_COUNT - wordCount} more words of content. Focus on: ${missingElements.slice(0, 3).join(', ')}.`
              : `Section has sufficient length but is missing: ${missingElements.join(', ')}.`,
        });
      }
    }
  }

  return thinSections;
}

/**
 * Identify content gaps based on course goals and objectives
 */
function findContentGaps(
  course: CourseInput
): ContentAnalysisResult['contentGaps'] {
  const gaps: ContentAnalysisResult['contentGaps'] = [];

  // Extract topics mentioned in goals but not covered in content
  const goalTopics = new Set<string>();
  const contentTopics = new Set<string>();

  // Extract from goals
  const goalText = [
    course.courseGoals || '',
    course.description || '',
    ...course.whatYouWillLearn,
  ].join(' ');

  const extractTopics = (text: string) => {
    const words = text
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 5);
    return new Set(words);
  };

  const goalWords = extractTopics(goalText);
  goalWords.forEach((w) => goalTopics.add(w));

  // Extract from content
  for (const chapter of course.chapters) {
    for (const section of chapter.sections) {
      const sectionText = [
        section.title,
        section.description || '',
        section.content || '',
        ...(section.objectives || []),
      ].join(' ');

      const sectionWords = extractTopics(sectionText);
      sectionWords.forEach((w) => contentTopics.add(w));
    }
  }

  // Find topics in goals but not in content
  const missingTopics: string[] = [];
  for (const topic of goalTopics) {
    if (!contentTopics.has(topic)) {
      missingTopics.push(topic);
    }
  }

  // Create gap entries for significant missing topics
  for (const topic of missingTopics.slice(0, 5)) {
    // Find which goal mentioned this topic
    let expectedIn = 'Course goals';
    for (const goal of course.whatYouWillLearn) {
      if (goal.toLowerCase().includes(topic)) {
        expectedIn = `Goal: "${goal}"`;
        break;
      }
    }

    gaps.push({
      topic,
      expectedIn,
      description: `The topic "${topic}" is mentioned in course goals but not adequately covered in content.`,
      suggestedContent: `Consider adding a section or expanding existing content to cover "${topic}" in depth.`,
    });
  }

  return gaps;
}

/**
 * Calculate overall quality score
 */
function calculateQualityScore(
  course: CourseInput,
  duplicates: DuplicateContent[],
  thinSections: ThinSection[],
  contentGaps: ContentAnalysisResult['contentGaps']
): number {
  let score = 100;

  // Penalize for duplicates
  const highSimilarityDuplicates = duplicates.filter(
    (d) => d.similarityScore >= 60
  );
  score -= highSimilarityDuplicates.length * 10;
  score -= (duplicates.length - highSimilarityDuplicates.length) * 5;

  // Penalize for thin sections
  const totalSections = course.chapters.reduce(
    (sum, ch) => sum + ch.sections.length,
    0
  );
  const thinRatio =
    totalSections > 0 ? thinSections.length / totalSections : 0;
  score -= thinRatio * 30;

  // Penalize for content gaps
  score -= contentGaps.length * 5;

  // Bonus for comprehensive content
  const sectionsWithObjectives = course.chapters.reduce(
    (sum, ch) =>
      sum +
      ch.sections.filter((s) => s.objectives && s.objectives.length > 0).length,
    0
  );
  const objectivesRatio =
    totalSections > 0 ? sectionsWithObjectives / totalSections : 0;
  if (objectivesRatio >= 0.8) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Analyze content quality, duplicates, and gaps
 */
export async function analyzeContent(
  course: CourseInput,
  aiEnabled: boolean = true
): Promise<ContentAnalysisResult> {
  // Find duplicate content
  const duplicates = findDuplicates(course);

  // Find thin sections
  const thinSections = findThinSections(course);

  // Find content gaps
  const contentGaps = findContentGaps(course);

  // Calculate overall quality score
  const qualityScore = calculateQualityScore(
    course,
    duplicates,
    thinSections,
    contentGaps
  );

  return {
    qualityScore,
    duplicates,
    thinSections,
    contentGaps,
  };
}
