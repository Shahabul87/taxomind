/**
 * Roadmap Generator — Stage 1 of Breadth-First Course Creation Pipeline
 *
 * Generates the COMPLETE course roadmap (all chapter titles + all section titles)
 * in a single AI call with optional self-review refinement.
 *
 * Think of it like a professor planning a full semester syllabus:
 * first outline ALL lecture titles, then write each module description.
 *
 * Flow:
 * 1. Build roadmap prompt from course context + blueprint + memory
 * 2. Single AI call to generate full roadmap
 * 3. Parse response with CourseRoadmapSchema
 * 4. Self-review: second AI call evaluates consistency, coverage, Bloom's
 * 5. If review score < 75 AND rounds < 2: refinement call, loop back
 * 6. Return finalized CourseRoadmap
 */

import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { CourseRoadmapSchema, RoadmapReviewSchema } from './response-schemas';
import { getCourseDesignExpertise } from './prompts';
import { sanitizeCourseContext, traceAICall } from './helpers';
import { buildMemoryRecallBlock } from './memory-recall';
import type { RecalledMemory } from './memory-recall';
import type {
  CourseContext,
  CourseRoadmap,
  RoadmapChapter,
  CourseBlueprintPlan,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const MAX_REFINEMENT_ROUNDS = 2;
const SELF_REVIEW_ACCEPT_THRESHOLD = 75;

// ============================================================================
// Roadmap Design Principles (injected into system prompt)
// ============================================================================

const ROADMAP_DESIGN_PRINCIPLES = `## ROADMAP DESIGN PRINCIPLES

### What is a Course Roadmap?
A roadmap is the COMPLETE SKELETON of a course — every chapter title and every section
title, designed as a coherent whole. Think of it like a professor planning an entire
semester syllabus before writing any lecture content.

### Roadmap Quality Criteria
1. **Coherent Progression**: Chapters build logically — each chapter&apos;s concepts are
   prerequisites for later chapters
2. **No Duplication**: No two chapters cover the same topic. No two section titles
   across the ENTIRE course are identical or near-identical
3. **Bloom&apos;s Progression**: Cognitive levels advance non-decreasingly across chapters
   (REMEMBER -> UNDERSTAND -> APPLY -> ANALYZE -> EVALUATE -> CREATE)
4. **ARROW Arc Per Chapter**: Each chapter&apos;s sections follow the ARROW framework
   (hook -> reverse-engineer -> intuition -> formalization -> failure -> practice -> reflection)
5. **Concept Coverage**: All course learning objectives are addressed by at least
   one chapter. The roadmap collectively covers what a student needs to master this
   subject at this difficulty level
6. **Specific Titles**: Section titles are outcome-oriented and specific, NOT generic
   ("Building REST APIs with Express.js" not "Introduction to APIs")

### Difficulty Calibration
- BEGINNER: Chapters focus on foundational vocabulary and building blocks.
  Bloom&apos;s range: REMEMBER -> APPLY. More intuition-building sections.
- INTERMEDIATE: Chapters balance theory and application.
  Bloom&apos;s range: UNDERSTAND -> EVALUATE. Include failure analysis sections.
- ADVANCED/EXPERT: Chapters push toward mastery and creation.
  Bloom&apos;s range: APPLY -> CREATE. Include design challenges and capstone projects.`;

// ============================================================================
// Prompt Builders
// ============================================================================

function buildRoadmapSystemPrompt(variant?: string): string {
  return `${getCourseDesignExpertise(variant)}

${ROADMAP_DESIGN_PRINCIPLES}`;
}

function buildRoadmapUserPrompt(
  courseContext: CourseContext,
  blueprintPlan: CourseBlueprintPlan | null,
  recalledMemory: RecalledMemory | null,
): string {
  const ctx = sanitizeCourseContext(courseContext);
  const totalSections = ctx.totalChapters * ctx.sectionsPerChapter;

  // Blueprint guidance (if available)
  let blueprintBlock = '';
  if (blueprintPlan) {
    blueprintBlock = `
## BLUEPRINT GUIDANCE (Suggested — you may adjust titles but respect the conceptual direction)
${blueprintPlan.chapterPlan.map(entry =>
  `Ch${entry.position}: "${entry.suggestedTitle}" [${entry.bloomsLevel}] — ${entry.primaryFocus}`
).join('\n')}
`;
  }

  // Memory recall (if available)
  const memoryBlock = recalledMemory ? buildMemoryRecallBlock(recalledMemory) : '';

  return `## COURSE CONTEXT
- **Title**: "${ctx.courseTitle}"
- **Description**: ${ctx.courseDescription}
- **Category**: ${ctx.courseCategory}${ctx.courseSubcategory ? ` > ${ctx.courseSubcategory}` : ''}
- **Target Audience**: ${ctx.targetAudience}
- **Difficulty**: ${ctx.difficulty}${ctx.duration ? `\n- **Target Duration**: ${ctx.duration}` : ''}
- **Course Learning Objectives**:
${ctx.courseLearningObjectives.map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}
- **Bloom&apos;s Focus Levels**: ${ctx.bloomsFocus.join(', ') || 'Auto-progressive'}
${blueprintBlock}${memoryBlock}
## YOUR TASK
Generate the COMPLETE roadmap for this course.
- EXACTLY ${ctx.totalChapters} chapters
- EXACTLY ${ctx.sectionsPerChapter} sections per chapter
- Total: ${totalSections} section titles

## THINKING PROCESS
1. What are the major knowledge domains this course must cover?
2. How should these domains be sequenced for progressive learning?
3. What Bloom&apos;s level fits each chapter position?
4. For each chapter: what ARROW-driven section arc makes pedagogical sense?
5. Self-check: are all course objectives addressed? Any gaps?

## OUTPUT (JSON)
Return a JSON object with this EXACT structure:
{
  "structuralReasoning": "2-4 sentence explanation of the course arc and sequencing rationale",
  "chapters": [
    {
      "position": 1,
      "title": "Specific, outcome-oriented chapter title",
      "focusSummary": "1-2 sentence focus description",
      "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
      "keyConcepts": ["concept1", "concept2", "concept3"],
      "sections": [
        {
          "position": 1,
          "title": "Specific section title",
          "arrowRole": "hook|reverse-engineer|intuition|formalization|failure-analysis|design-challenge|practice|reflection",
          "contentType": "video|reading|assignment|quiz|project|discussion"
        }
      ]
    }
  ]
}

Return ONLY valid JSON, no markdown formatting.`;
}

function buildSelfReviewPrompt(roadmapJson: string, courseContext: CourseContext): string {
  return `## TASK: Review This Course Roadmap

You are reviewing a course roadmap for "${courseContext.courseTitle}" (${courseContext.difficulty} level, ${courseContext.totalChapters} chapters).

## ROADMAP TO REVIEW
${roadmapJson}

## COURSE LEARNING OBJECTIVES (Must all be covered)
${courseContext.courseLearningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

## REVIEW CRITERIA
Review for these specific quality criteria:
1. DUPLICATE CHECK: Any overlapping chapter topics or near-identical section titles?
2. PROGRESSION CHECK: Do Bloom&apos;s levels advance non-decreasingly?
3. COVERAGE CHECK: Do chapters collectively cover ALL course objectives?
4. CONCEPT CHECK: Are keyConcepts unique across chapters (no repeated concepts)?
5. ARROW CHECK: Does each chapter&apos;s sections follow a valid ARROW arc?
6. SPECIFICITY CHECK: Are titles specific and outcome-oriented (not generic)?

Score 0-100 and list specific issues with types.

## OUTPUT (JSON)
{
  "overallScore": 85,
  "issues": [
    {
      "type": "duplicate_topic|bloom_regression|coverage_gap|concept_overlap|arrow_violation|title_generic",
      "description": "Specific description of the issue",
      "affectedChapters": [1, 3],
      "affectedSections": ["Section title 1"]
    }
  ],
  "verdict": "accept|refine"
}

Return ONLY valid JSON, no markdown formatting.`;
}

function buildRefinementPrompt(
  roadmapJson: string,
  issues: Array<{ type: string; description: string }>,
): string {
  return `## TASK: Fix Roadmap Issues

The following issues were found in the course roadmap:
${issues.map((i, idx) => `${idx + 1}. [${i.type}] ${i.description}`).join('\n')}

## CURRENT ROADMAP
${roadmapJson}

Fix ONLY the identified issues. Keep everything else unchanged.
Return the complete REVISED roadmap JSON in the same format.

Return ONLY valid JSON, no markdown formatting.`;
}

// ============================================================================
// Compact Roadmap Serializers
// ============================================================================

/**
 * ~300-500 tokens — used in Stage 2 (chapter detail generation).
 * Includes focus summary, concepts, and section titles with roles.
 */
export function buildCompactRoadmapBlock(roadmap: CourseRoadmap): string {
  return roadmap.chapters.map(ch =>
    `Ch${ch.position}: "${ch.title}" [${ch.bloomsLevel}] — ${ch.focusSummary}\n` +
    `  Concepts: ${ch.keyConcepts.join(', ')}\n` +
    `  Sections: ${ch.sections.map(s => `${s.position}."${s.title}" (${s.arrowRole ?? 'content'})`).join(' | ')}`
  ).join('\n\n');
}

/**
 * ~150-200 tokens — used in Stage 3 (section detail generation).
 * Minimal: just chapter titles and section titles.
 */
export function buildMinimalRoadmapBlock(roadmap: CourseRoadmap): string {
  return roadmap.chapters.map(ch =>
    `Ch${ch.position}: "${ch.title}" [${ch.bloomsLevel}] — ` +
    ch.sections.map(s => `"${s.title}"`).join(', ')
  ).join('\n');
}

// ============================================================================
// Main Entry Point
// ============================================================================

export interface GenerateRoadmapOptions {
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  runId?: string;
  maxRefinementRounds?: number;
  variant?: string;
}

/**
 * Generate a complete course roadmap (all chapter + section titles) in a single
 * AI call with self-review refinement loop.
 */
export async function generateCourseRoadmap(
  userId: string,
  courseContext: CourseContext,
  blueprintPlan: CourseBlueprintPlan | null,
  recalledMemory: RecalledMemory | null,
  options: GenerateRoadmapOptions = {},
): Promise<CourseRoadmap> {
  const { onSSEEvent, runId, maxRefinementRounds = MAX_REFINEMENT_ROUNDS, variant } = options;

  onSSEEvent?.({
    type: 'roadmap_generating',
    data: { message: 'Generating complete course roadmap...' },
  });

  // Step 1: Generate initial roadmap
  const systemPrompt = buildRoadmapSystemPrompt(variant);
  const userPrompt = buildRoadmapUserPrompt(courseContext, blueprintPlan, recalledMemory);

  const rawResponse = await traceAICall(
    { runId, stage: 0, label: 'Roadmap generation' },
    () => runSAMChatWithPreference({
      userId,
      capability: 'course',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      maxTokens: 4000,
      temperature: 0.7,
      extended: true,
    }),
  );

  let roadmap = parseRoadmapResponse(rawResponse, courseContext);

  // Step 2: Self-review loop
  let selfReviewScore = 0;
  let refinementRounds = 0;

  for (let round = 0; round < maxRefinementRounds; round++) {
    onSSEEvent?.({
      type: 'roadmap_reviewing',
      data: { message: `Reviewing roadmap quality (round ${round + 1})...`, round: round + 1 },
    });

    const roadmapJson = JSON.stringify(roadmap.chapters, null, 2);
    const reviewPrompt = buildSelfReviewPrompt(roadmapJson, courseContext);

    const reviewResponse = await traceAICall(
      { runId, stage: 0, label: `Roadmap review round ${round + 1}` },
      () => runSAMChatWithPreference({
        userId,
        capability: 'course',
        messages: [{ role: 'user', content: reviewPrompt }],
        systemPrompt: 'You are a course quality reviewer. Evaluate the roadmap strictly.',
        maxTokens: 1500,
        temperature: 0.3,
        extended: true,
      }),
    );

    const review = parseReviewResponse(reviewResponse);
    selfReviewScore = review.overallScore;

    logger.info('[ROADMAP_GENERATOR] Self-review result', {
      round: round + 1,
      score: review.overallScore,
      verdict: review.verdict,
      issueCount: review.issues?.length ?? 0,
    });

    if (review.verdict === 'accept' || review.overallScore >= SELF_REVIEW_ACCEPT_THRESHOLD) {
      break;
    }

    // Refinement needed
    if (review.issues && review.issues.length > 0) {
      onSSEEvent?.({
        type: 'roadmap_refining',
        data: {
          message: `Refining roadmap (${review.issues.length} issues found)...`,
          issues: review.issues.length,
          round: round + 1,
        },
      });

      const refinementPrompt = buildRefinementPrompt(roadmapJson, review.issues);
      const refinedResponse = await traceAICall(
        { runId, stage: 0, label: `Roadmap refinement round ${round + 1}` },
        () => runSAMChatWithPreference({
          userId,
          capability: 'course',
          messages: [{ role: 'user', content: refinementPrompt }],
          systemPrompt,
          maxTokens: 4000,
          temperature: 0.5,
          extended: true,
        }),
      );

      roadmap = parseRoadmapResponse(refinedResponse, courseContext);
      refinementRounds++;
    }
  }

  // If we never did a review (0 rounds completed), set a default score
  if (selfReviewScore === 0) {
    selfReviewScore = 80; // Assume reasonable quality without review
  }

  const finalRoadmap: CourseRoadmap = {
    ...roadmap,
    selfReviewScore,
    refinementRounds,
  };

  logger.info('[ROADMAP_GENERATOR] Roadmap generation complete', {
    chapters: finalRoadmap.chapters.length,
    totalSections: finalRoadmap.chapters.reduce((s, ch) => s + ch.sections.length, 0),
    selfReviewScore,
    refinementRounds,
  });

  return finalRoadmap;
}

// ============================================================================
// Response Parsers
// ============================================================================

function parseRoadmapResponse(
  rawResponse: string,
  courseContext: CourseContext,
): CourseRoadmap {
  try {
    // Extract JSON from potential markdown wrapping
    const jsonStr = extractJson(rawResponse);
    const parsed = JSON.parse(jsonStr);

    // Validate with Zod
    const validated = CourseRoadmapSchema.parse(parsed);

    // Enforce correct positions and fill optional fields
    const chapters: RoadmapChapter[] = validated.chapters.map((ch, idx) => ({
      position: idx + 1,
      title: ch.title,
      focusSummary: ch.focusSummary ?? `Focus area for chapter ${idx + 1}`,
      bloomsLevel: ch.bloomsLevel,
      keyConcepts: ch.keyConcepts ?? [],
      sections: ch.sections.map((sec, sIdx) => ({
        position: sIdx + 1,
        title: sec.title,
        arrowRole: sec.arrowRole,
        contentType: sec.contentType as CourseContext['preferredContentTypes'][number] | undefined,
      })),
    }));

    return {
      chapters,
      selfReviewScore: 0,
      refinementRounds: 0,
      structuralReasoning: validated.structuralReasoning ?? '',
    };
  } catch (error) {
    logger.warn('[ROADMAP_GENERATOR] Failed to parse roadmap response, building fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
    return buildFallbackRoadmap(courseContext);
  }
}

function parseReviewResponse(rawResponse: string): {
  overallScore: number;
  issues?: Array<{ type: string; description: string }>;
  verdict: 'accept' | 'refine';
} {
  try {
    const jsonStr = extractJson(rawResponse);
    const parsed = JSON.parse(jsonStr);
    const validated = RoadmapReviewSchema.parse(parsed);
    return {
      overallScore: validated.overallScore,
      issues: validated.issues?.map(i => ({ type: i.type, description: i.description })),
      verdict: validated.verdict,
    };
  } catch {
    logger.warn('[ROADMAP_GENERATOR] Failed to parse review response, accepting roadmap');
    return { overallScore: 75, verdict: 'accept' };
  }
}

function extractJson(text: string): string {
  // Try to find JSON in markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text;
}

function buildFallbackRoadmap(courseContext: CourseContext): CourseRoadmap {
  const chapters: RoadmapChapter[] = [];
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;

  for (let i = 0; i < courseContext.totalChapters; i++) {
    const bloomsIdx = Math.min(
      Math.floor((i / (courseContext.totalChapters - 1 || 1)) * bloomsLevels.length),
      bloomsLevels.length - 1,
    );

    const sections = Array.from({ length: courseContext.sectionsPerChapter }, (_, j) => ({
      position: j + 1,
      title: `Section ${j + 1} of Chapter ${i + 1}`,
      arrowRole: (['hook', 'reverse-engineer', 'intuition', 'formalization', 'failure-analysis', 'design-challenge', 'practice', 'reflection'] as const)[j % 8],
      contentType: undefined,
    }));

    chapters.push({
      position: i + 1,
      title: `Chapter ${i + 1}: ${courseContext.courseTitle} — Part ${i + 1}`,
      focusSummary: `Core concepts for part ${i + 1} of the course`,
      bloomsLevel: bloomsLevels[bloomsIdx],
      keyConcepts: [],
      sections,
    });
  }

  return {
    chapters,
    selfReviewScore: 50,
    refinementRounds: 0,
    structuralReasoning: 'Fallback roadmap generated due to parsing failure',
  };
}
