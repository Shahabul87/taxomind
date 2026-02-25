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

  // Stopwords to filter from n-grams
  const NGRAM_STOPWORDS = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
    'her', 'was', 'one', 'our', 'out', 'has', 'his', 'how', 'its', 'may',
    'new', 'now', 'old', 'see', 'way', 'who', 'did', 'get', 'let', 'say',
    'she', 'too', 'use', 'will', 'with', 'this', 'that', 'from', 'have',
    'been', 'some', 'them', 'than', 'what', 'when', 'each', 'which', 'their',
    'about', 'would', 'there', 'could', 'other', 'into', 'more', 'also',
    'after', 'before', 'should', 'these', 'those', 'being', 'using', 'very',
  ]);

  /**
   * Extract single-word topics (6+ chars) and multi-word n-gram topics.
   * N-grams capture concepts like "machine learning", "React hooks", etc.
   */
  const extractTopics = (text: string): Set<string> => {
    const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 0);
    const topics = new Set<string>();

    // Single words (6+ chars)
    for (const w of words) {
      if (w.length >= 6 && !NGRAM_STOPWORDS.has(w)) {
        topics.add(w);
      }
    }

    // 2-grams (combined 8+ chars, most valuable for concept detection)
    for (let i = 0; i < words.length - 1; i++) {
      const w1 = words[i];
      const w2 = words[i + 1];
      if (!NGRAM_STOPWORDS.has(w1) && !NGRAM_STOPWORDS.has(w2) && w1.length + w2.length >= 8) {
        topics.add(`${w1} ${w2}`);
      }
    }

    // 3-grams (combined 12+ chars, catches "object oriented programming")
    for (let i = 0; i < words.length - 2; i++) {
      const w1 = words[i];
      const w2 = words[i + 1];
      const w3 = words[i + 2];
      // Allow middle word to be a stopword (e.g. "model view controller")
      if (!NGRAM_STOPWORDS.has(w1) && !NGRAM_STOPWORDS.has(w3) && w1.length + w2.length + w3.length >= 12) {
        topics.add(`${w1} ${w2} ${w3}`);
      }
    }

    return topics;
  };

  // Extract from goals
  const goalText = [
    course.courseGoals || '',
    course.description || '',
    ...course.whatYouWillLearn,
  ].join(' ');

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
  // For multi-word topics, use substring containment as fallback
  const missingTopics: string[] = [];
  const contentText = [...contentTopics].join(' ');
  for (const topic of goalTopics) {
    if (!contentTopics.has(topic)) {
      // For multi-word topics, check if the content contains them as substrings
      if (topic.includes(' ')) {
        if (!contentText.includes(topic)) {
          missingTopics.push(topic);
        }
      } else {
        missingTopics.push(topic);
      }
    }
  }

  // Sort by length descending — multi-word concepts are more specific and valuable
  missingTopics.sort((a, b) => b.length - a.length);

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
 * Count syllables in a word (approximation for Flesch-Kincaid)
 */
function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 2) return 1;

  let count = 0;
  const vowels = 'aeiouy';
  let prevIsVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevIsVowel) count++;
    prevIsVowel = isVowel;
  }

  // Silent 'e' at end
  if (w.endsWith('e') && count > 1) count--;
  // Words like "le" at end
  if (w.endsWith('le') && w.length > 2 && !vowels.includes(w[w.length - 3])) count++;

  return Math.max(1, count);
}

/**
 * Calculate Flesch-Kincaid Grade Level for a text.
 * Returns a grade level (e.g., 8.5 = 8th-9th grade reading level).
 */
function calculateFleschKincaid(text: string): number {
  if (!text || text.trim().length < 20) return 0;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  // Flesch-Kincaid Grade Level formula
  const grade = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

/** Expected FK grade ranges by difficulty level */
const FK_RANGES: Record<string, { min: number; max: number }> = {
  beginner: { min: 6, max: 10 },
  intermediate: { min: 10, max: 14 },
  advanced: { min: 14, max: 20 },
  expert: { min: 14, max: 22 },
};

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

/** Readability result per section (exported for issue generator) */
export interface ReadabilityResult {
  sectionId: string;
  sectionTitle: string;
  chapterId: string;
  chapterTitle: string;
  fkGrade: number;
  expectedRange: { min: number; max: number };
  isWithinRange: boolean;
  deviation: number;
}

/**
 * Analyze readability per section using Flesch-Kincaid Grade Level.
 * Compares FK grade against expected range for the course difficulty.
 */
export function analyzeReadability(course: CourseInput): ReadabilityResult[] {
  const results: ReadabilityResult[] = [];
  const difficulty = (course.difficulty ?? 'intermediate').toLowerCase();
  const expectedRange = FK_RANGES[difficulty] ?? FK_RANGES.intermediate;

  for (const chapter of course.chapters) {
    for (const section of chapter.sections) {
      const text = [section.description ?? '', section.content ?? ''].join(' ');
      if (text.trim().length < 50) continue;

      const fkGrade = calculateFleschKincaid(text);
      if (fkGrade === 0) continue;

      const deviation = fkGrade < expectedRange.min
        ? expectedRange.min - fkGrade
        : fkGrade > expectedRange.max
          ? fkGrade - expectedRange.max
          : 0;

      results.push({
        sectionId: section.id,
        sectionTitle: section.title,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        fkGrade,
        expectedRange,
        isWithinRange: deviation <= 2, // Allow ±2 tolerance
        deviation,
      });
    }
  }

  return results;
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
