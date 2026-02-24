/**
 * Consistency Checker (Step 4)
 *
 * Checks for consistency between course goals and chapters,
 * and consistency between sections within chapters.
 */

import type {
  CourseInput,
  BloomsAnalysisResult,
  ConsistencyAnalysisResult,
} from '../types';

/**
 * Extract key terms from text for comparison
 */
function extractKeyTerms(text: string): Set<string> {
  const terms = new Set<string>();
  const words = text.toLowerCase().split(/\W+/).filter((w) => w.length > 3);

  // Filter out common stop words
  const stopWords = new Set([
    'this',
    'that',
    'with',
    'from',
    'have',
    'will',
    'your',
    'about',
    'they',
    'what',
    'when',
    'where',
    'which',
    'their',
    'there',
    'been',
    'being',
    'would',
    'could',
    'should',
    'these',
    'those',
    'other',
    'into',
    'more',
    'some',
    'such',
    'than',
    'then',
    'them',
    'only',
    'over',
    'also',
    'after',
    'before',
    'most',
    'made',
    'make',
    'just',
    'very',
    'much',
    'many',
    'each',
    'well',
    'does',
    'done',
    'using',
    'used',
    'understand',
    'learn',
    'learning',
    'course',
    'chapter',
    'section',
  ]);

  for (const word of words) {
    if (!stopWords.has(word)) {
      terms.add(word);
    }
  }

  return terms;
}

/**
 * Calculate overlap between two sets
 */
function calculateOverlap(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  for (const term of setA) {
    if (setB.has(term)) overlap++;
  }

  // Jaccard similarity
  const union = new Set([...setA, ...setB]).size;
  return Math.round((overlap / union) * 100);
}

/**
 * Analyze alignment between course goals and chapters
 */
function analyzeGoalAlignment(
  course: CourseInput
): ConsistencyAnalysisResult['chapterGoalAlignment'] {
  const results: ConsistencyAnalysisResult['chapterGoalAlignment'] = [];

  // Extract goals from course
  const courseGoalTerms = extractKeyTerms(
    [
      course.courseGoals || '',
      course.description || '',
      ...course.whatYouWillLearn,
    ].join(' ')
  );

  for (const chapter of course.chapters) {
    // Extract terms from chapter content
    const chapterText = [
      chapter.title,
      chapter.description || '',
      ...chapter.sections.flatMap((s) => [
        s.title,
        s.description || '',
        s.content || '',
        ...(s.objectives || []),
      ]),
    ].join(' ');

    const chapterTerms = extractKeyTerms(chapterText);

    // Find aligned and unaligned goals
    const alignedGoals: string[] = [];
    const unalignedGoals: string[] = [];
    const suggestions: string[] = [];

    for (const goal of course.whatYouWillLearn) {
      const goalTerms = extractKeyTerms(goal);
      const overlapWithChapter = calculateOverlap(goalTerms, chapterTerms);

      if (overlapWithChapter >= 20) {
        alignedGoals.push(goal);
      }
    }

    // Calculate alignment score based on term overlap
    const alignmentScore = calculateOverlap(courseGoalTerms, chapterTerms);

    // Generate suggestions
    if (alignmentScore < 30) {
      suggestions.push(
        `Chapter "${chapter.title}" has weak alignment with course goals. Consider reviewing content focus.`
      );
    }
    if (alignedGoals.length === 0 && course.whatYouWillLearn.length > 0) {
      suggestions.push(
        `No direct goal alignment found. Consider which course outcomes this chapter supports.`
      );
    }

    results.push({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      alignmentScore,
      alignedGoals,
      unalignedGoals,
      suggestions,
    });
  }

  return results;
}

/**
 * Analyze consistency within chapters (between sections)
 */
function analyzeSectionConsistency(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult
): ConsistencyAnalysisResult['sectionConsistency'] {
  const results: ConsistencyAnalysisResult['sectionConsistency'] = [];

  for (const chapter of course.chapters) {
    const issues: string[] = [];

    // Get blooms data for this chapter
    const chapterBlooms = bloomsResult.chapters.find(
      (c) => c.chapterId === chapter.id
    );

    // Calculate depth variation (standard deviation of Bloom's levels)
    let depthVariation = 0;
    if (chapterBlooms && chapterBlooms.sectionResults.length > 1) {
      const levels = chapterBlooms.sectionResults.map((s) => {
        const levelMap: Record<string, number> = {
          REMEMBER: 1,
          UNDERSTAND: 2,
          APPLY: 3,
          ANALYZE: 4,
          EVALUATE: 5,
          CREATE: 6,
        };
        return levelMap[s.primaryLevel] || 2;
      });

      const mean = levels.reduce((a, b) => a + b, 0) / levels.length;
      const squaredDiffs = levels.map((l) => Math.pow(l - mean, 2));
      depthVariation = Math.sqrt(
        squaredDiffs.reduce((a, b) => a + b, 0) / levels.length
      );
    }

    // Check section lengths for consistency
    const sectionLengths = chapter.sections.map((s) => {
      const content = [
        s.description || '',
        s.content || '',
        ...(s.objectives || []),
      ].join(' ');
      return content.length;
    });

    if (sectionLengths.length > 1) {
      const maxLength = Math.max(...sectionLengths);
      const minLength = Math.min(...sectionLengths);
      const ratio = minLength > 0 ? maxLength / minLength : 0;

      if (ratio > 5) {
        issues.push(
          'Section lengths vary significantly. Some sections may need expansion or others need trimming.'
        );
      }
    }

    // Check for sections without objectives
    const sectionsWithoutObjectives = chapter.sections.filter(
      (s) => !s.objectives || s.objectives.length === 0
    );
    if (
      sectionsWithoutObjectives.length > 0 &&
      sectionsWithoutObjectives.length < chapter.sections.length
    ) {
      issues.push(
        `${sectionsWithoutObjectives.length} of ${chapter.sections.length} sections lack learning objectives.`
      );
    }

    // Check for sections without content
    const sectionsWithoutContent = chapter.sections.filter(
      (s) => (!s.content || s.content.trim().length < 50) && !s.videoUrl
    );
    if (sectionsWithoutContent.length > 0) {
      issues.push(
        `${sectionsWithoutContent.length} sections have minimal content (less than 50 characters and no video).`
      );
    }

    // Calculate consistency score
    let consistencyScore = 100;
    consistencyScore -= depthVariation * 10; // Penalize for depth variation
    consistencyScore -= issues.length * 10; // Penalize for each issue
    consistencyScore = Math.max(0, Math.min(100, consistencyScore));

    results.push({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      consistencyScore: Math.round(consistencyScore),
      depthVariation: Math.round(depthVariation * 100) / 100,
      issues,
    });
  }

  return results;
}

/**
 * Analyze cross-chapter consistency
 */
function analyzeCrossChapterConsistency(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult
): ConsistencyAnalysisResult['crossChapterConsistency'] {
  const issues: string[] = [];

  // Check chapter length consistency
  const chapterSectionCounts = course.chapters.map((c) => c.sections.length);
  const avgSections =
    chapterSectionCounts.reduce((a, b) => a + b, 0) / chapterSectionCounts.length;
  const maxSections = Math.max(...chapterSectionCounts);
  const minSections = Math.min(...chapterSectionCounts);

  let lengthConsistencyScore = 100;
  if (minSections > 0 && maxSections / minSections > 3) {
    issues.push(
      `Chapter sizes vary significantly: ${minSections} to ${maxSections} sections. Consider balancing.`
    );
    lengthConsistencyScore -= 20;
  }

  // Check depth consistency across chapters
  const chapterDepths = bloomsResult.chapters.map((c) => {
    const levelMap: Record<string, number> = {
      REMEMBER: 1,
      UNDERSTAND: 2,
      APPLY: 3,
      ANALYZE: 4,
      EVALUATE: 5,
      CREATE: 6,
    };
    return levelMap[c.primaryLevel] || 2;
  });

  let depthConsistencyScore = 100;
  if (chapterDepths.length > 1) {
    const depthRange =
      Math.max(...chapterDepths) - Math.min(...chapterDepths);
    if (depthRange > 3) {
      issues.push(
        `Cognitive depth varies significantly across chapters. Consider a more gradual progression.`
      );
      depthConsistencyScore -= depthRange * 5;
    }
  }

  // Check style consistency (based on content patterns)
  let styleConsistencyScore = 100;
  const chaptersWithVideos = course.chapters.filter((c) =>
    c.sections.some((s) => s.videoUrl)
  ).length;
  const chaptersWithExams = course.chapters.filter((c) =>
    c.sections.some((s) => s.exams && s.exams.length > 0)
  ).length;

  if (
    chaptersWithVideos > 0 &&
    chaptersWithVideos < course.chapters.length * 0.5
  ) {
    issues.push(
      `Only ${chaptersWithVideos} of ${course.chapters.length} chapters have video content. Consider consistent media usage.`
    );
    styleConsistencyScore -= 10;
  }

  if (
    chaptersWithExams > 0 &&
    chaptersWithExams < course.chapters.length * 0.5
  ) {
    issues.push(
      `Only ${chaptersWithExams} of ${course.chapters.length} chapters have assessments. Consider consistent assessment coverage.`
    );
    styleConsistencyScore -= 10;
  }

  return {
    styleConsistencyScore: Math.max(0, styleConsistencyScore),
    depthConsistencyScore: Math.max(0, depthConsistencyScore),
    lengthConsistencyScore: Math.max(0, lengthConsistencyScore),
    issues,
  };
}

/**
 * Check consistency throughout the course
 */
export async function checkConsistency(
  course: CourseInput,
  bloomsResult: BloomsAnalysisResult
): Promise<ConsistencyAnalysisResult> {
  // Analyze goal alignment
  const chapterGoalAlignment = analyzeGoalAlignment(course);

  // Analyze section consistency within chapters
  const sectionConsistency = analyzeSectionConsistency(course, bloomsResult);

  // Analyze cross-chapter consistency
  const crossChapterConsistency = analyzeCrossChapterConsistency(
    course,
    bloomsResult
  );

  // Calculate overall consistency score
  const goalAlignmentAvg =
    chapterGoalAlignment.length > 0
      ? chapterGoalAlignment.reduce((sum, c) => sum + c.alignmentScore, 0) /
        chapterGoalAlignment.length
      : 50;

  const sectionConsistencyAvg =
    sectionConsistency.length > 0
      ? sectionConsistency.reduce((sum, c) => sum + c.consistencyScore, 0) /
        sectionConsistency.length
      : 50;

  const crossChapterAvg =
    (crossChapterConsistency.styleConsistencyScore +
      crossChapterConsistency.depthConsistencyScore +
      crossChapterConsistency.lengthConsistencyScore) /
    3;

  const overallConsistencyScore = Math.round(
    (goalAlignmentAvg * 0.3 + sectionConsistencyAvg * 0.4 + crossChapterAvg * 0.3)
  );

  // Content diversity analysis: detect types present per chapter
  const contentDiversityPerChapter: ConsistencyAnalysisResult['contentDiversityPerChapter'] = [];
  const CONTENT_TYPE_COUNT = 5; // reading, video, quiz, project, discussion

  for (const chapter of course.chapters) {
    const typesFound: string[] = [];

    // Check for reading content (any section with description/content)
    if (chapter.sections.some((s) => (s.description && s.description.length > 50) || (s.content && s.content.length > 50))) {
      typesFound.push('reading');
    }
    // Check for video content
    if (chapter.sections.some((s) => s.videoUrl)) {
      typesFound.push('video');
    }
    // Check for quiz/assessment
    if (chapter.sections.some((s) => s.exams && s.exams.length > 0)) {
      typesFound.push('quiz');
    }
    // Check for project-like content (sections with "project", "build", "create" in title/objectives)
    const projectKeywords = /\b(project|build|create|develop|implement|design|construct)\b/i;
    if (chapter.sections.some((s) => projectKeywords.test(s.title) || s.objectives?.some((o) => projectKeywords.test(o)))) {
      typesFound.push('project');
    }
    // Check for discussion-like content
    const discussionKeywords = /\b(discuss|debate|reflect|peer|forum|collaborate)\b/i;
    if (chapter.sections.some((s) => discussionKeywords.test(s.title) || s.objectives?.some((o) => discussionKeywords.test(o)))) {
      typesFound.push('discussion');
    }

    const score = Math.round((typesFound.length / CONTENT_TYPE_COUNT) * 100);
    contentDiversityPerChapter.push({
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      typesFound,
      score,
    });
  }

  const contentDiversityScore = contentDiversityPerChapter.length > 0
    ? Math.round(contentDiversityPerChapter.reduce((sum, c) => sum + c.score, 0) / contentDiversityPerChapter.length)
    : 0;

  return {
    overallConsistencyScore,
    chapterGoalAlignment,
    sectionConsistency,
    crossChapterConsistency,
    contentDiversityScore,
    contentDiversityPerChapter,
  };
}
