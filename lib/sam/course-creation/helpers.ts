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
import type { TemplateSectionDef } from './chapter-templates';

// =============================================================================
// PROMPT SANITIZATION
// =============================================================================

/**
 * Sanitize user-provided text before interpolation into AI prompts.
 * Strips prompt injection patterns, markdown structure markers, and
 * excessive whitespace. Does NOT strip normal punctuation.
 */
export function sanitizeForPrompt(input: string, maxLength = 500): string {
  return input
    .replace(/ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|context)/gi, '')
    .replace(/\b(system|assistant|user)\s*:/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^#{1,6}\s/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{3,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize all user-controlled fields in a CourseContext before prompt interpolation.
 * Returns a shallow copy with sanitized string fields; other fields are passed through.
 */
export function sanitizeCourseContext(ctx: CourseContext): CourseContext {
  return {
    ...ctx,
    courseTitle: sanitizeForPrompt(ctx.courseTitle, 200),
    courseDescription: sanitizeForPrompt(ctx.courseDescription, 2000),
    targetAudience: sanitizeForPrompt(ctx.targetAudience, 200),
    courseLearningObjectives: ctx.courseLearningObjectives.map(
      (obj) => sanitizeForPrompt(obj, 300)
    ),
    courseIntent: ctx.courseIntent ? sanitizeForPrompt(ctx.courseIntent, 500) : undefined,
  };
}

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

export function buildDefaultQualityScore(
  overall: number,
  chapterNumber?: number,
  stage?: 1 | 2 | 3,
): QualityScore {
  return {
    completeness: overall,
    specificity: overall,
    bloomsAlignment: overall,
    uniqueness: overall,
    depth: overall,
    overall,
    ...(chapterNumber !== undefined && { chapterNumber }),
    ...(stage !== undefined && { stage }),
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

export function scoreSection(sec: GeneratedSection, existingTitles: string[], templateDef?: TemplateSectionDef): QualityScore {
  // Completeness (20%)
  let completeness = 100;
  if (!sec.title || sec.title.length < 5) completeness -= 30;
  if (!sec.topicFocus || sec.topicFocus.length < 5) completeness -= 30;
  if (!sec.contentType) completeness -= 20;
  if (!sec.estimatedDuration) completeness -= 10;
  // Template compliance: content type must match
  if (templateDef && sec.contentType !== templateDef.contentType) completeness -= 15;
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
  bloomsLevel: BloomsLevel,
  templateDef?: TemplateSectionDef
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
  if (templateDef) {
    // Template sections have different HTML structures — relax h2 count check
    if (h2Count < 1) depth -= 25;
  } else {
    if (h2Count < 3) depth -= 25;
    else if (h2Count < 5) depth -= 10;
  }

  // Word count check (strip HTML tags, count words)
  const plainText = det.description.replace(/<[^>]*>/g, ' ');
  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

  if (templateDef) {
    // Validate against template-specific word count range
    if (wordCount < templateDef.wordCountRange.min * 0.7) depth -= 25;
    else if (wordCount < templateDef.wordCountRange.min) depth -= 10;
  } else {
    if (wordCount < 300) depth -= 25;
    else if (wordCount < 500) depth -= 10;
  }

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
  existingTitles: string[],
  templateDef?: TemplateSectionDef
): GeneratedSection {
  let title: string;
  let contentType: ContentType;
  let topicFocus: string;

  if (templateDef) {
    // Use template role for fallback
    title = `${templateDef.displayName}: ${chapter.title}`;
    contentType = templateDef.contentType;
    topicFocus = `${templateDef.purpose.split('.')[0]} for ${chapter.keyTopics[0] ?? chapter.title}`;
  } else {
    title = `${chapter.title} - Part ${num}`;
    const types: ContentType[] = ['video', 'reading', 'assignment', 'quiz', 'project'];
    contentType = types[(num - 1) % types.length];
    topicFocus = chapter.keyTopics[(num - 1) % chapter.keyTopics.length] ?? chapter.title;
  }

  if (existingTitles.some((t) => t.toLowerCase() === title.toLowerCase())) {
    title = `${title} - ${chapter.title.split(':')[0]}`;
  }

  return {
    position: num,
    title,
    contentType,
    estimatedDuration: '15-20 minutes',
    topicFocus,
    parentChapterContext: {
      title: chapter.title,
      bloomsLevel: chapter.bloomsLevel,
      relevantObjectives: chapter.learningObjectives.slice(0, 2),
    },
    templateRole: templateDef?.role,
  };
}

export function buildFallbackDetails(
  chapter: GeneratedChapter,
  section: GeneratedSection,
  ctx: CourseContext,
  templateDef?: TemplateSectionDef
): SectionDetails {
  const topic = section.topicFocus;
  const audience = ctx.targetAudience;
  const difficulty = ctx.difficulty;

  let description: string;

  if (templateDef) {
    // Generate section-type-appropriate fallback HTML
    const role = templateDef.role;
    switch (role) {
      case 'HOOK':
        description = [
          `<h2>A Real-World Challenge</h2>`,
          `<p>Imagine you are working on a project and encounter <strong>${topic}</strong> for the first time. The problem seems complex, but what if understanding just one core idea could unlock everything?</p>`,
          `<p><strong>What if you could master ${topic} and apply it confidently?</strong></p>`,
        ].join('\n');
        break;
      case 'INTUITION':
        description = [
          `<h2>Building Your Mental Model</h2>`,
          `<p>Think of <strong>${topic}</strong> like organizing a kitchen. Before you learn the formal rules, you already have an intuition for where things should go.</p>`,
          `<table><tr><th>Familiar Concept</th><th>New Concept</th></tr>`,
          `<tr><td>Kitchen drawers</td><td>${topic} categories</td></tr>`,
          `<tr><td>Recipe steps</td><td>${topic} process</td></tr>`,
          `<tr><td>Ingredient list</td><td>${topic} inputs</td></tr></table>`,
          `<p><em>Picture this:</em> Imagine you have all the pieces in front of you, and ${topic} is the system that tells you how they fit together.</p>`,
          `<blockquote><strong>Aha:</strong> ${topic} is fundamentally about organizing complexity into manageable patterns.</blockquote>`,
          `<p>What do you think happens if you change the approach to ${topic}?</p>`,
        ].join('\n');
        break;
      case 'WALKTHROUGH':
        description = [
          `<h2>Worked Example</h2>`,
          `<p>Let&apos;s return to our scenario and work through <strong>${topic}</strong> step by step with real numbers.</p>`,
          `<h3>Iteration 1</h3>`,
          `<ol><li><strong>Step 1:</strong> Start with the simplest input for ${topic}.</li>`,
          `<li><strong>Step 2:</strong> Apply the core operation.</li>`,
          `<li><strong>Step 3:</strong> Observe the output.</li></ol>`,
          `<h3>Iteration 2</h3>`,
          `<ol><li><strong>Step 1:</strong> Use a slightly more complex input.</li>`,
          `<li><strong>Step 2:</strong> Apply the same operation.</li>`,
          `<li><strong>Step 3:</strong> Notice how the pattern holds.</li></ol>`,
          `<p><strong>The pattern:</strong> Each time we apply ${topic}, the result follows a consistent structure.</p>`,
          `<p>Verification: Let&apos;s check our answer matches what we expect.</p>`,
        ].join('\n');
        break;
      case 'FORMALIZATION':
        description = [
          `<h2>Formal Definition</h2>`,
          `<p>Remember the pattern you noticed? That pattern has a name: <strong>${topic}</strong>.</p>`,
          `<h3>The Formula</h3>`,
          `<code>${topic} = f(input) → structured output</code>`,
          `<p><em>In plain English:</em> ${topic} takes your input and transforms it into a structured result following the pattern we discovered.</p>`,
          `<h3>Mapping to Our Example</h3>`,
          `<p>When we worked through the iterations, we were applying ${topic} step by step. Now we can express it formally.</p>`,
        ].join('\n');
        break;
      case 'PLAYGROUND':
        description = [
          `<h2>Practice Playground</h2>`,
          `<h3>Exercise 1: Guided</h3>`,
          `<p><strong>Task:</strong> Apply ${topic} to the following scenario.</p>`,
          `<p><em>Template:</em> Step 1: Identify the input → Step 2: Apply ${topic} → Step 3: Verify the output.</p>`,
          `<p><strong>Expected:</strong> A correct application following the template.</p>`,
          `<h3>Exercise 2: Semi-Guided</h3>`,
          `<p><strong>Task:</strong> Solve a similar ${topic} problem with less guidance.</p>`,
          `<p><em>Hint:</em> Remember the pattern from the walkthrough.</p>`,
          `<h3>Exercise 3: Independent</h3>`,
          `<p><strong>Task:</strong> Solve this ${topic} problem from scratch with no scaffolding.</p>`,
        ].join('\n');
        break;
      case 'PRACTICE':
        description = [
          `<h2>Practice Exercises</h2>`,
          `<h3>Exercise 1: Mirror</h3>`,
          `<p><strong>Prompt:</strong> Reproduce the ${topic} example from the walkthrough.</p>`,
          `<p><em>Hint:</em> Follow the same steps but use your own values.</p>`,
          `<h3>Exercise 2: Adapt</h3>`,
          `<p><strong>Prompt:</strong> Modify the ${topic} example to handle a new scenario.</p>`,
          `<p><em>Hint:</em> Change one parameter and observe the effect.</p>`,
          `<h3>Exercise 3: Extend</h3>`,
          `<p><strong>Prompt:</strong> Add a new feature to your ${topic} solution.</p>`,
          `<p><em>Hint:</em> Think about edge cases.</p>`,
          `<h3>Exercise 4: Challenge</h3>`,
          `<p><strong>Prompt:</strong> Solve this ${topic} problem from scratch.</p>`,
          `<p><em>Hint:</em> Start with what you know and build up.</p>`,
        ].join('\n');
        break;
      case 'CHECKPOINT':
        description = [
          `<h2>Self-Assessment</h2>`,
          `<ol>`,
          `<li>Can you explain <strong>${topic}</strong> in your own words?</li>`,
          `<li>What are the key steps in applying ${topic}?</li>`,
          `<li>What common mistake should you avoid with ${topic}?</li>`,
          `</ol>`,
          `<h3>Confidence Check</h3>`,
          `<p>Rate your confidence 1-5 on understanding ${topic}. If below 3, revisit the earlier sections.</p>`,
        ].join('\n');
        break;
      case 'PITFALLS':
        description = [
          `<h2>Common Pitfalls</h2>`,
          `<h3>Pitfall 1: The Surface-Level Mistake</h3>`,
          `<p>Many learners assume <strong>${topic}</strong> works one way, but there&apos;s a subtle catch that trips up even experienced practitioners.</p>`,
          `<p><em>Using our earlier analogy:</em> This is like putting the wrong ingredient in the wrong drawer — everything looks fine until you try to cook.</p>`,
          `<h3>Pitfall 2: The Overconfidence Trap</h3>`,
          `<p>After the walkthrough, you might think ${topic} is straightforward. But this specific edge case breaks the simple model.</p>`,
          `<h3>Misconception Buster</h3>`,
          `<p><strong>Common belief:</strong> "${topic} always works this way." <strong>Reality:</strong> It only works this way under specific conditions that we need to verify.</p>`,
        ].join('\n');
        break;
      case 'SUMMARY':
        description = [
          `<h2>Chapter Summary</h2>`,
          `<h3>Key Concepts</h3>`,
          `<ul>`,
          `<li><strong>${topic}</strong> — the core concept and its practical applications.</li>`,
          `<li>The pattern we discovered in the walkthrough and formalized.</li>`,
          `<li>Common pitfalls and how to avoid them.</li>`,
          `</ul>`,
          `<h3>Formula Card</h3>`,
          `<p><code>${topic}: input → process → output</code></p>`,
          `<h3>Connections</h3>`,
          `<p><strong>Builds on:</strong> Foundational concepts from previous chapters.</p>`,
          `<p><strong>Leads to:</strong> More advanced applications in upcoming chapters.</p>`,
        ].join('\n');
        break;
      case 'PROVOCATION':
        description = [
          `<h2>The Provocation</h2>`,
          `<p>Most people would say they understand <strong>${topic}</strong>. They&apos;re wrong. Here&apos;s why.</p>`,
          `<h3>The Counterintuitive Result</h3>`,
          `<p>Consider this example: when you apply ${topic} in the obvious way, the result is not what you expect. The naive approach fails because it ignores a critical subtlety.</p>`,
          `<p><strong>By the end of this chapter, you&apos;ll understand why.</strong></p>`,
        ].join('\n');
        break;
      case 'INTUITION_ENGINE':
        description = [
          `<h2>Multiple Perspectives</h2>`,
          `<h3>Mental Model 1: The Physical Analogy</h3>`,
          `<p>Think of <strong>${topic}</strong> as a physical process: inputs flow in, transformations occur, outputs emerge.</p>`,
          `<h3>Mental Model 2: The Computational View</h3>`,
          `<p>Alternatively, imagine ${topic} as a systematic algorithm that processes information step by step.</p>`,
          `<h3>The Unifying Insight</h3>`,
          `<p>Both perspectives converge on one key idea: ${topic} is fundamentally about structured transformation.</p>`,
          `<table><tr><th>Model</th><th>Strengths</th><th>Limitations</th></tr>`,
          `<tr><td>Physical</td><td>Intuitive, visual</td><td>Breaks at edge cases</td></tr>`,
          `<tr><td>Computational</td><td>Precise, formal</td><td>Less intuitive</td></tr></table>`,
        ].join('\n');
        break;
      case 'DERIVATION':
        description = [
          `<h2>Deriving the Key Result</h2>`,
          `<p>Goal: We want to derive the core principle behind <strong>${topic}</strong>. Let&apos;s start from what we know.</p>`,
          `<h3>Step 1</h3>`,
          `<p><code>Start with the simplest formulation of ${topic}</code></p>`,
          `<p><em>In English:</em> We begin with the most basic version of the problem.</p>`,
          `<h3>Intuition Check</h3>`,
          `<p>Does this match our physical analogy? Yes, because the simplest case maps directly to our first mental model.</p>`,
          `<h3>Step 2</h3>`,
          `<p><code>Add the key constraint that makes ${topic} non-trivial</code></p>`,
          `<p><em>In English:</em> Now we account for the complexity that naive approaches miss.</p>`,
          `<p><strong>Final Result:</strong> The complete formulation of ${topic} emerges naturally from these steps.</p>`,
          `<p>What this tells us is: ${topic} requires careful attention to the constraint we added in Step 2.</p>`,
        ].join('\n');
        break;
      case 'LABORATORY':
        description = [
          `<h2>Laboratory</h2>`,
          `<h3>Ex 1: Compute</h3>`,
          `<p><strong>Context:</strong> A standard ${topic} scenario.</p>`,
          `<p><strong>Task:</strong> Apply the formula to compute the result.</p>`,
          `<h3>Ex 2: Predict-Verify</h3>`,
          `<p><strong>Task:</strong> Predict what happens when you change the input to ${topic}, then verify by computing.</p>`,
          `<h3>Ex 3: Diagnose</h3>`,
          `<p><strong>The error:</strong> A student applied ${topic} incorrectly. <strong>Find it:</strong> Identify and explain the mistake.</p>`,
          `<h3>Ex 4: Compare</h3>`,
          `<p><strong>Task:</strong> Compare two approaches to ${topic}. When is each better?</p>`,
          `<h3>Ex 5: Design</h3>`,
          `<p><strong>Task:</strong> Design a solution using ${topic} for a novel scenario.</p>`,
        ].join('\n');
        break;
      case 'DEPTH_DIVE':
        description = [
          `<h2>Going Deeper</h2>`,
          `<h3>Edge Cases</h3>`,
          `<p>What happens when the input to <strong>${topic}</strong> is at its extreme? The behavior changes in surprising ways.</p>`,
          `<h3>Breaking Conditions</h3>`,
          `<p>This approach to ${topic} fails when the assumptions we made in the derivation no longer hold. Here&apos;s why.</p>`,
          `<h3>Surprising Connections</h3>`,
          `<p>The same pattern from ${topic} appears in other fields because the underlying structure is universal.</p>`,
        ].join('\n');
        break;
      case 'SYNTHESIS':
        description = [
          `<h2>Synthesis</h2>`,
          `<h3>Key Insights</h3>`,
          `<ul>`,
          `<li><strong>${topic}</strong> is not just a technique — it reveals a deeper structural pattern.</li>`,
          `<li>The edge cases we explored show exactly where the model breaks.</li>`,
          `<li>The connections to other topics suggest a unifying framework.</li>`,
          `</ul>`,
          `<h3>Concept Map</h3>`,
          `<p>${topic} → depends on → foundational concepts → enables → advanced applications</p>`,
          `<h3>Connections</h3>`,
          `<p>This extends what we learned in previous chapters. This enables what comes next.</p>`,
        ].join('\n');
        break;
      case 'OPEN_QUESTION':
        description = [
          `<h2>The Open Question</h2>`,
          `<p><strong>Question:</strong> What is the fundamental limit of <strong>${topic}</strong>, and can we do better?</p>`,
          `<p><strong>Why it matters:</strong> This question drives active research and has practical implications for system design.</p>`,
          `<p><strong>The naive approach:</strong> Simply applying ${topic} directly — and why it&apos;s insufficient for real-world complexity.</p>`,
          `<p>To answer this, we need to think from first principles.</p>`,
        ].join('\n');
        break;
      case 'FIRST_PRINCIPLES':
        description = [
          `<h2>From First Principles</h2>`,
          `<h3>Layer 1: The Simplest Case</h3>`,
          `<p>Strip everything away: what is <strong>${topic}</strong> at its most basic?</p>`,
          `<h3>Layer 2: Adding Constraints</h3>`,
          `<p>Now the solution must account for real-world constraints. New insight: complexity emerges naturally.</p>`,
          `<h3>Layer 3: Adding More Complexity</h3>`,
          `<p>This breaks our previous assumption because the interaction effects are non-trivial. The structure that emerges is more nuanced.</p>`,
          `<h3>Layer 4: The Full Formulation</h3>`,
          `<p>Putting it all together: the complete picture of ${topic} reveals why the naive approach fails.</p>`,
        ].join('\n');
        break;
      case 'ANALYSIS':
        description = [
          `<h2>Formal Analysis</h2>`,
          `<h3>Complexity</h3>`,
          `<p>The computational cost of <strong>${topic}</strong>: Time O(n log n), Space O(n) for typical cases.</p>`,
          `<h3>Expressiveness</h3>`,
          `<p>Can express: most practical scenarios. Cannot express: edge cases requiring fundamentally different approaches.</p>`,
          `<h3>Limitations</h3>`,
          `<p>${topic} fails when inputs violate the core assumptions. This is a fundamental limitation, not an implementation bug.</p>`,
          `<h3>Comparison</h3>`,
          `<table><tr><th>Approach</th><th>Strengths</th><th>Weaknesses</th><th>When to Use</th></tr>`,
          `<tr><td>${topic}</td><td>Efficient, well-understood</td><td>Limited expressiveness</td><td>Standard cases</td></tr>`,
          `<tr><td>Alternative</td><td>More general</td><td>Higher cost</td><td>Edge cases</td></tr></table>`,
        ].join('\n');
        break;
      case 'DESIGN_STUDIO':
        description = [
          `<h2>Design Studio</h2>`,
          `<h3>Challenge 1: Analyze</h3>`,
          `<p><strong>Context:</strong> A real-world system using ${topic}.</p>`,
          `<p><strong>Task:</strong> Identify the design decisions and their trade-offs.</p>`,
          `<h3>Challenge 2: Evaluate</h3>`,
          `<p><strong>Task:</strong> Critique this implementation of ${topic}. What would you change and why?</p>`,
          `<h3>Challenge 3: Create</h3>`,
          `<p><strong>Constraints:</strong> Design a system using ${topic} that handles scale and edge cases.</p>`,
          `<h3>Challenge 4: Critique</h3>`,
          `<p><strong>Task:</strong> Review this solution and write a constructive critique with specific improvement suggestions.</p>`,
        ].join('\n');
        break;
      case 'FRONTIER':
        description = [
          `<h2>The Frontier</h2>`,
          `<h3>Open Questions</h3>`,
          `<ul>`,
          `<li>How can <strong>${topic}</strong> be extended to handle increasingly complex real-world scenarios?</li>`,
          `<li>What are the theoretical limits of current approaches to ${topic}?</li>`,
          `</ul>`,
          `<h3>Key Resources</h3>`,
          `<ul>`,
          `<li>Foundational texts on ${topic} and its theoretical foundations.</li>`,
          `<li>Recent papers exploring new directions in ${topic}.</li>`,
          `</ul>`,
          `<h3>Research Project Idea</h3>`,
          `<p><strong>Project:</strong> Implement and compare two approaches to ${topic} on a novel dataset.</p>`,
          `<p><strong>Skills needed:</strong> Implementation, analysis, technical writing.</p>`,
          `<p><strong>Expected outcome:</strong> A comparative study with actionable recommendations.</p>`,
        ].join('\n');
        break;
      default:
        // For all other template roles, use purpose-based fallback
        description = [
          `<h2>${templateDef.displayName}</h2>`,
          `<p>${templateDef.purpose}</p>`,
          `<p>This section covers <strong>${topic}</strong> within the context of "${chapter.title}". As ${audience} at the ${difficulty} level, you will build on what you have learned so far.</p>`,
        ].join('\n');
    }
  } else {
    description = [
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
  }

  return {
    description,
    learningObjectives: Array.from({ length: ctx.learningObjectivesPerSection }, (_, i) =>
      `Explain key aspects of ${topic} (${i + 1})`
    ),
    keyConceptsCovered: [topic, `${topic} fundamentals`, 'Practical applications'],
    practicalActivity: `Complete the ${section.contentType} exercises on ${topic}.`,
  };
}
