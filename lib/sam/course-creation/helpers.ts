/**
 * SAM Course Creation Helpers
 *
 * Pure helper functions extracted from the orchestrator for testability and reuse.
 * Includes: parsing, normalization, quality scoring, fallback generators, and validators.
 */

import {
  validateObjective,
} from '@/lib/sam/prompts/content-generation-criteria';
import {
  BLOOMS_TAXONOMY,
  BLOOMS_LEVELS,
} from './types';
import type {
  CourseContext,
  GeneratedChapter,
  GeneratedSection,
  SectionDetails,
  BloomsLevel,
  ContentType,
  QualityScore,
} from './types';

// =============================================================================
// PARSING & NORMALIZATION
// =============================================================================

export function cleanTitle(title: string | undefined, num: number, courseTitle: string): string {
  if (!title || title.length < 5) return `${courseTitle} - Part ${num}`;
  return title.replace(/^Chapter\s*\d+\s*[:\-]\s*/i, '').trim() || `${courseTitle} - Part ${num}`;
}

export function ensureArray(arr: unknown, minLength: number): string[] {
  if (!Array.isArray(arr)) return Array.from({ length: minLength }, (_, i) => `Item ${i + 1}`);
  const filtered = arr.filter((item): item is string => typeof item === 'string' && item.length > 0);
  while (filtered.length < minLength) {
    filtered.push(`Additional item ${filtered.length + 1}`);
  }
  return filtered;
}

/** Parse an optional array from AI response — returns empty array if not present. */
export function ensureOptionalArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

const VALID_CONTENT_TYPES = ['video', 'reading', 'assignment', 'quiz', 'project', 'discussion'] as const;

export function normalizeContentType(ct: string | undefined): ContentType {
  if (!ct) return 'video';
  const lower = ct.toLowerCase().trim();
  const match = VALID_CONTENT_TYPES.find((t) => t === lower);
  if (match) return match;
  if (lower.includes('video')) return 'video';
  if (lower.includes('read')) return 'reading';
  if (lower.includes('assign') || lower.includes('exercise')) return 'assignment';
  if (lower.includes('quiz') || lower.includes('test')) return 'quiz';
  if (lower.includes('project')) return 'project';
  if (lower.includes('discuss')) return 'discussion';
  return 'video';
}

export function parseDuration(dur: string): number | null {
  const match = dur.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Clean AI response text by removing markdown fences and trimming.
 */
export function cleanAIResponse(responseText: string): string {
  return responseText
    .trim()
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
}

// =============================================================================
// SIMILARITY
// =============================================================================

export function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter((w) => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// =============================================================================
// QUALITY SCORING
// =============================================================================

export function buildDefaultQualityScore(overall: number): QualityScore {
  return {
    completeness: overall,
    specificity: overall,
    bloomsAlignment: overall,
    uniqueness: overall,
    depth: overall,
    overall,
  };
}

export function scoreChapter(
  ch: GeneratedChapter,
  ctx: CourseContext,
  previousChapters: GeneratedChapter[]
): QualityScore {
  // Completeness (20%)
  let completeness = 100;
  const descWordCount = ch.description.split(/\s+/).length;
  if (descWordCount < 50) completeness -= 30;
  else if (descWordCount < 30) completeness -= 50;
  if (ch.learningObjectives.length < ctx.learningObjectivesPerChapter) completeness -= 25;
  if (ch.keyTopics.length < 3) completeness -= 20;
  if (!ch.prerequisites || ch.prerequisites === 'None') completeness -= 5;
  completeness = Math.max(0, completeness);

  // Specificity (15%)
  let specificity = 100;
  if (ch.title.length < 20) specificity -= 25;
  const genericTitles = /^(introduction|getting started|fundamentals|overview|basics)/i;
  if (genericTitles.test(ch.title)) specificity -= 30;
  const descLower = ch.description.toLowerCase();
  const topicMentions = ch.keyTopics.filter(t => descLower.includes(t.toLowerCase())).length;
  if (topicMentions < 2) specificity -= 20;
  specificity = Math.max(0, specificity);

  // Bloom's Alignment (30%)
  let bloomsAlignment = 100;
  if (ch.learningObjectives.length > 0) {
    const objectiveScores = ch.learningObjectives.map(obj =>
      validateObjective(obj, ch.bloomsLevel).score
    );
    bloomsAlignment = Math.round(objectiveScores.reduce((a, b) => a + b, 0) / objectiveScores.length);
  }

  // Uniqueness (15%)
  let uniqueness = 100;
  if (previousChapters.length > 0) {
    for (const prev of previousChapters) {
      const sim = jaccardSimilarity(ch.keyTopics.join(' '), prev.keyTopics.join(' '));
      if (sim > 0.5) {
        uniqueness -= 30;
        break;
      } else if (sim > 0.3) {
        uniqueness -= 15;
      }
    }
    for (const prev of previousChapters) {
      if (jaccardSimilarity(ch.title, prev.title) > 0.5) {
        uniqueness -= 20;
        break;
      }
    }
  }
  uniqueness = Math.max(0, uniqueness);

  // Depth (20%)
  let depth = 100;
  if (descWordCount < 100) depth -= 20;
  if (descWordCount < 50) depth -= 20;
  const conceptCount = ch.conceptsIntroduced?.length ?? 0;
  if (conceptCount < 3) depth -= 25;
  else if (conceptCount < 5) depth -= 10;
  const avgObjLength = ch.learningObjectives.reduce((sum, o) => sum + o.split(/\s+/).length, 0) / Math.max(ch.learningObjectives.length, 1);
  if (avgObjLength < 8) depth -= 15;
  const avgTopicWords = ch.keyTopics.reduce((sum, t) => sum + t.split(/\s+/).length, 0) / Math.max(ch.keyTopics.length, 1);
  if (avgTopicWords < 2) depth -= 15;
  depth = Math.max(0, depth);

  const overall = Math.round(
    completeness * 0.20 + specificity * 0.15 + bloomsAlignment * 0.30 + uniqueness * 0.15 + depth * 0.20
  );

  return { completeness, specificity, bloomsAlignment, uniqueness, depth, overall };
}

export function scoreSection(sec: GeneratedSection, existingTitles: string[]): QualityScore {
  // Completeness (20%)
  let completeness = 100;
  if (!sec.title || sec.title.length < 5) completeness -= 30;
  if (!sec.topicFocus || sec.topicFocus.length < 5) completeness -= 30;
  if (!sec.contentType) completeness -= 20;
  if (!sec.estimatedDuration) completeness -= 10;
  completeness = Math.max(0, completeness);

  // Specificity (20%)
  let specificity = 100;
  if (sec.title.length < 15) specificity -= 25;
  if (/^(Section \d+|Key Concepts|Overview|Fundamentals|Core Concepts|Key Principles)$/i.test(sec.title)) specificity -= 40;
  if (sec.title === sec.parentChapterContext.title) specificity -= 30;
  specificity = Math.max(0, specificity);

  // Bloom's Alignment (20%)
  let bloomsAlignment = 100;
  const parentBloomsLevel = sec.parentChapterContext.bloomsLevel;
  const bloomsInfo = BLOOMS_TAXONOMY[parentBloomsLevel];
  if (bloomsInfo) {
    const combinedText = `${sec.title} ${sec.topicFocus}`.toLowerCase();
    const hasRelevantVerb = bloomsInfo.verbs.some(verb => combinedText.includes(verb.toLowerCase()));
    const levelIndex = BLOOMS_LEVELS.indexOf(parentBloomsLevel);
    const adjacentVerbs = levelIndex > 0
      ? BLOOMS_TAXONOMY[BLOOMS_LEVELS[levelIndex - 1]].verbs
      : [];
    const hasAdjacentVerb = adjacentVerbs.some(verb => combinedText.includes(verb.toLowerCase()));

    if (!hasRelevantVerb && !hasAdjacentVerb) {
      const objText = sec.parentChapterContext.relevantObjectives.join(' ').toLowerCase();
      const objHasVerb = bloomsInfo.verbs.some(verb => objText.includes(verb.toLowerCase()));
      if (!objHasVerb) {
        bloomsAlignment -= 30;
      }
    }
    if (sec.parentChapterContext.relevantObjectives.length === 0) {
      bloomsAlignment -= 20;
    }
  }
  bloomsAlignment = Math.max(0, bloomsAlignment);

  // Uniqueness (20%)
  let uniqueness = 100;
  for (const existing of existingTitles) {
    const sim = jaccardSimilarity(sec.title, existing);
    if (sim > 0.5) {
      uniqueness -= 30;
      break;
    } else if (sim > 0.3) {
      uniqueness -= 15;
    }
  }
  uniqueness = Math.max(0, uniqueness);

  // Depth (20%)
  let depth = 100;
  const topicWords = sec.topicFocus.split(/\s+/).length;
  if (topicWords < 2) depth -= 20;
  if (topicWords < 3) depth -= 10;
  const newConcepts = sec.conceptsIntroduced?.length ?? 0;
  if (newConcepts === 0) depth -= 25;
  else if (newConcepts < 2) depth -= 10;
  const referencedConcepts = sec.conceptsReferenced?.length ?? 0;
  if (referencedConcepts === 0 && sec.position > 1) depth -= 15;
  const titleWords = sec.title.split(/\s+/).length;
  if (titleWords < 3) depth -= 15;
  depth = Math.max(0, depth);

  const overall = Math.round(
    completeness * 0.20 + specificity * 0.20 + bloomsAlignment * 0.20 + uniqueness * 0.20 + depth * 0.20
  );

  return { completeness, specificity, bloomsAlignment, uniqueness, depth, overall };
}

export function scoreDetails(
  det: SectionDetails,
  sec: GeneratedSection,
  bloomsLevel: BloomsLevel
): QualityScore {
  // Completeness (25%)
  let completeness = 100;
  if (det.description.length < 500) completeness -= 25;
  if (det.learningObjectives.length < 2) completeness -= 25;
  if (det.keyConceptsCovered.length < 2) completeness -= 15;
  if (!det.practicalActivity || det.practicalActivity.length < 20) completeness -= 15;
  completeness = Math.max(0, completeness);

  // Specificity (15%)
  let specificity = 100;
  if (!det.description.toLowerCase().includes(sec.topicFocus.toLowerCase().split(' ')[0])) {
    specificity -= 30;
  }
  const activityLower = det.practicalActivity.toLowerCase();
  const contentTypeMatches: Record<string, string[]> = {
    video: ['watch', 'video', 'demonstrate', 'observe'],
    reading: ['read', 'study', 'review', 'research'],
    assignment: ['complete', 'write', 'exercise', 'practice', 'implement'],
    quiz: ['quiz', 'test', 'assess', 'answer'],
    project: ['project', 'build', 'create', 'design', 'develop'],
    discussion: ['discuss', 'debate', 'share', 'collaborate'],
  };
  const expectedTerms = contentTypeMatches[sec.contentType] ?? [];
  if (expectedTerms.length > 0 && !expectedTerms.some(t => activityLower.includes(t))) {
    specificity -= 25;
  }
  specificity = Math.max(0, specificity);

  // Bloom's Alignment (25%)
  let bloomsAlignment = 100;
  if (det.learningObjectives.length > 0) {
    const objectiveScores = det.learningObjectives.map(obj =>
      validateObjective(obj, bloomsLevel).score
    );
    bloomsAlignment = Math.round(objectiveScores.reduce((a, b) => a + b, 0) / objectiveScores.length);
  }

  // Uniqueness (15%)
  let uniqueness = 100;
  const allSame = det.keyConceptsCovered.every(c => c.toLowerCase() === sec.topicFocus.toLowerCase());
  if (allSame && det.keyConceptsCovered.length > 1) uniqueness -= 40;
  uniqueness = Math.max(0, uniqueness);

  // Depth (20%)
  let depth = 100;
  if (det.description.length < 2000) depth -= 15;
  if (det.description.length < 500) depth -= 15;
  const avgObjWords = det.learningObjectives.reduce((sum, o) => sum + o.split(/\s+/).length, 0) / Math.max(det.learningObjectives.length, 1);
  if (avgObjWords < 8) depth -= 20;
  if (det.practicalActivity.length < 50) depth -= 15;
  if (det.practicalActivity.length < 100) depth -= 10;
  if (det.keyConceptsCovered.length < 3) depth -= 15;
  if (!det.resources || det.resources.length === 0) depth -= 5;

  // HTML lesson structure checks
  const h2Count = (det.description.match(/<h2>/gi) ?? []).length;
  if (h2Count < 3) depth -= 25;
  else if (h2Count < 5) depth -= 10;

  // Word count check (strip HTML tags, count words)
  const plainText = det.description.replace(/<[^>]*>/g, ' ');
  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
  if (wordCount < 300) depth -= 25;
  else if (wordCount < 500) depth -= 10;

  depth = Math.max(0, depth);

  const overall = Math.round(
    completeness * 0.25 + specificity * 0.15 + bloomsAlignment * 0.25 + uniqueness * 0.15 + depth * 0.20
  );

  return { completeness, specificity, bloomsAlignment, uniqueness, depth, overall };
}

// =============================================================================
// COVERAGE VALIDATION
// =============================================================================

/**
 * Validates that a chapter's key topics are covered by its generated sections.
 */
export function validateChapterSectionCoverage(
  chapter: { position: number; title: string; keyTopics: string[]; topicsToExpand: string[] },
  sections: GeneratedSection[]
): { coveragePercent: number; coveredTopics: string[]; uncoveredTopics: string[] } {
  const allTopics = [...new Set([...chapter.keyTopics, ...chapter.topicsToExpand])];
  const coveredTopics: string[] = [];
  const uncoveredTopics: string[] = [];

  for (const topic of allTopics) {
    const topicLower = topic.toLowerCase();
    const topicWords = topicLower.split(/\s+/);

    const isCovered = sections.some(sec => {
      const sectionText = `${sec.title} ${sec.topicFocus} ${(sec.conceptsIntroduced ?? []).join(' ')}`.toLowerCase();
      if (sectionText.includes(topicLower)) return true;
      const matchingWords = topicWords.filter(w => w.length > 3 && sectionText.includes(w));
      return matchingWords.length >= Math.ceil(topicWords.length * 0.6);
    });

    if (isCovered) {
      coveredTopics.push(topic);
    } else {
      uncoveredTopics.push(topic);
    }
  }

  const coveragePercent = allTopics.length > 0
    ? Math.round((coveredTopics.length / allTopics.length) * 100)
    : 100;

  return { coveragePercent, coveredTopics, uncoveredTopics };
}

// =============================================================================
// FALLBACK GENERATORS
// =============================================================================

export function buildFallbackDescription(ctx: CourseContext): string {
  return (
    `This chapter provides essential knowledge for ${ctx.targetAudience} ` +
    `learning ${ctx.courseTitle} at the ${ctx.difficulty} level.`
  );
}

export function buildFallbackChapter(num: number, ctx: CourseContext): GeneratedChapter {
  const topics = [
    'Foundation and Core Concepts',
    'Practical Implementation Techniques',
    'Advanced Patterns and Best Practices',
    'Real-World Applications',
    'Integration and Optimization',
    'Mastery and Advanced Topics',
  ];
  const topic = topics[(num - 1) % topics.length];

  return {
    position: num,
    title: `${topic} in ${ctx.courseTitle}`,
    description: buildFallbackDescription(ctx),
    bloomsLevel: 'UNDERSTAND',
    learningObjectives: Array.from({ length: ctx.learningObjectivesPerChapter }, (_, i) =>
      `Explain key concepts related to ${topic.toLowerCase()} (${i + 1})`
    ),
    keyTopics: [`${topic} fundamentals`, 'Practical techniques', 'Common patterns'],
    prerequisites: num > 1 ? `Completion of Chapter ${num - 1}` : 'Basic understanding of the subject',
    estimatedTime: '1-2 hours',
    topicsToExpand: [`${topic} fundamentals`, 'Practical techniques', 'Common patterns'],
  };
}

export function buildFallbackSection(
  num: number,
  chapter: GeneratedChapter,
  existingTitles: string[]
): GeneratedSection {
  let title = `${chapter.title} - Part ${num}`;
  if (existingTitles.some((t) => t.toLowerCase() === title.toLowerCase())) {
    title = `${chapter.title} - Subsection ${num}`;
  }

  const types: ContentType[] = ['video', 'reading', 'assignment', 'quiz', 'project'];
  return {
    position: num,
    title,
    contentType: types[(num - 1) % types.length],
    estimatedDuration: '15-20 minutes',
    topicFocus: chapter.keyTopics[(num - 1) % chapter.keyTopics.length] ?? chapter.title,
    parentChapterContext: {
      title: chapter.title,
      bloomsLevel: chapter.bloomsLevel,
      relevantObjectives: chapter.learningObjectives.slice(0, 2),
    },
  };
}

export function buildFallbackDetails(
  chapter: GeneratedChapter,
  section: GeneratedSection,
  ctx: CourseContext
): SectionDetails {
  const topic = section.topicFocus;
  const audience = ctx.targetAudience;
  const difficulty = ctx.difficulty;

  const description = [
    `<h2>Why This Matters</h2>`,
    `<p>Understanding <strong>${topic}</strong> is essential for anyone working in this field. As ${audience}, you will encounter ${topic} in nearly every real-world project. This concept solves a fundamental problem that practitioners face daily, and mastering it will set you apart.</p>`,
    `<h2>The Big Picture</h2>`,
    `<p>${topic} fits into the broader context of "${chapter.title}". Without a solid grasp of ${topic}, the concepts that follow become much harder to understand. Think of it as a building block that supports everything else in this chapter.</p>`,
    `<h2>What You Will Learn</h2>`,
    `<ul>`,
    `<li>The core principles behind <strong>${topic}</strong> and why they matter</li>`,
    `<li>How to apply ${topic} in practical scenarios at the ${difficulty} level</li>`,
    `<li>Common pitfalls and how to avoid them when working with ${topic}</li>`,
    `</ul>`,
    `<h2>Problems You Can Solve</h2>`,
    `<ol>`,
    `<li>Analyze and break down ${topic} challenges in real projects</li>`,
    `<li>Apply ${topic} techniques to solve domain-specific problems</li>`,
    `<li>Evaluate different approaches to ${topic} and choose the best fit</li>`,
    `</ol>`,
    `<h2>Real-World Applications</h2>`,
    `<p>Professionals across the industry use <strong>${topic}</strong> every day. From startups to large enterprises, this knowledge is directly applicable to building robust, production-ready systems. Mastering ${topic} will give you the confidence to tackle complex challenges in your career.</p>`,
  ].join('\n');

  return {
    description,
    learningObjectives: Array.from({ length: ctx.learningObjectivesPerSection }, (_, i) =>
      `Explain key aspects of ${topic} (${i + 1})`
    ),
    keyConceptsCovered: [topic, `${topic} fundamentals`, 'Practical applications'],
    practicalActivity: `Complete the ${section.contentType} exercises on ${topic}.`,
  };
}
