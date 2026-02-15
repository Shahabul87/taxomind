/**
 * Course Planner — Pre-Generation AI Planning
 *
 * Before generating any content, analyzes the course requirements and creates
 * an AI-powered blueprint that DIRECTS generation. This transforms the pipeline
 * from "generate blind" to "plan then generate."
 *
 * The blueprint includes:
 * - Optimal chapter sequence with reasoning
 * - Concept dependency graph
 * - Bloom's progression strategy
 * - Risk areas (complex topics, prerequisite gaps)
 *
 * The orchestrator stores the blueprint in Goal context and uses each
 * chapter's entry to guide its generation prompt.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import type {
  CourseContext,
  CourseBlueprintPlan,
  ChapterPlanEntry,
  BloomsLevel,
  CompletedChapter,
  ConceptTracker,
} from './types';
import { BLOOMS_LEVELS } from './types';
import type { RecalledMemory } from './memory-recall';

// ============================================================================
// Constants
// ============================================================================

/** Planning prompt timeout — planning should be fast (single AI call) */
const PLANNING_TIMEOUT_MS = 30_000;

// ============================================================================
// Public API
// ============================================================================

/**
 * Generate a course blueprint plan before any content generation starts.
 *
 * Makes a single AI call to plan the entire course structure.
 * Returns a default plan on failure (non-blocking).
 */
export async function planCourseBlueprint(
  userId: string,
  courseContext: CourseContext,
  recalledMemory?: RecalledMemory,
): Promise<CourseBlueprintPlan> {
  try {
    const plan = await withTimeout(
      doGenerateBlueprint(userId, courseContext, recalledMemory),
      PLANNING_TIMEOUT_MS,
    );
    logger.info('[CoursePlanner] Blueprint generated', {
      chapters: plan.chapterPlan.length,
      confidence: plan.planConfidence,
      riskAreas: plan.riskAreas.length,
    });
    return plan;
  } catch (error) {
    logger.warn('[CoursePlanner] Blueprint generation failed, using default plan', {
      error: error instanceof Error ? error.message : String(error),
    });
    return buildDefaultBlueprint(courseContext);
  }
}

/**
 * Build a prompt block from a blueprint entry for injection into Stage 1 prompts.
 *
 * Returns empty string if no entry exists for this chapter.
 */
export function buildBlueprintBlock(
  blueprint: CourseBlueprintPlan,
  chapterNumber: number,
): string {
  const entry = blueprint.chapterPlan.find(e => e.position === chapterNumber);
  if (!entry) return '';

  const riskWarnings = blueprint.riskAreas
    .filter(r => r.toLowerCase().includes(`chapter ${chapterNumber}`) || r.toLowerCase().includes(entry.primaryFocus.toLowerCase()))
    .map(r => `  - ${r}`)
    .join('\n');

  const deps = blueprint.conceptDependencies
    .filter(d => entry.keyConcepts.some(k => k.toLowerCase() === d.concept.toLowerCase()))
    .map(d => `  - ${d.concept} depends on: ${d.dependsOn.join(', ')}`)
    .join('\n');

  const lines = [
    '',
    '## COURSE BLUEPRINT (Your Pre-Planning)',
    `You previously planned this chapter to focus on: **${entry.primaryFocus}**`,
    `Suggested title: "${entry.suggestedTitle}"`,
    `Key concepts to introduce: ${entry.keyConcepts.join(', ')}`,
    `This chapter should be ${entry.bloomsLevel} level because: ${entry.rationale}`,
    `Estimated complexity: ${entry.estimatedComplexity}`,
  ];

  if (deps) {
    lines.push('', '### Concept Dependencies:', deps);
  }

  if (riskWarnings) {
    lines.push('', '### Risk Areas (pay extra attention):', riskWarnings);
  }

  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// Internal Implementation
// ============================================================================

async function doGenerateBlueprint(
  userId: string,
  courseContext: CourseContext,
  recalledMemory?: RecalledMemory,
): Promise<CourseBlueprintPlan> {
  const memorySection = recalledMemory && recalledMemory.priorConcepts.length > 0
    ? `\n\nPRIOR KNOWLEDGE: The instructor has previously taught these concepts in related courses: ${recalledMemory.priorConcepts.map(c => c.concept).join(', ')}. Build on this experience.`
    : '';

  const qualitySection = recalledMemory?.qualityPatterns
    ? `\nQUALITY HISTORY: Average score from prior courses: ${recalledMemory.qualityPatterns.averageScore}/100. Weak areas: ${recalledMemory.qualityPatterns.weakDimensions.join(', ') || 'none'}.`
    : '';

  const systemPrompt = `You are a course architecture planner. Your job is to create an optimal blueprint for a course BEFORE any content is generated. Think carefully about concept dependencies, cognitive progression, and risk areas.`;

  const userPrompt = `Plan the complete structure for this course:

## COURSE
- Title: "${courseContext.courseTitle}"
- Description: ${courseContext.courseDescription}
- Category: ${courseContext.courseCategory}${courseContext.courseSubcategory ? ` > ${courseContext.courseSubcategory}` : ''}
- Target Audience: ${courseContext.targetAudience}
- Difficulty: ${courseContext.difficulty}
- Total Chapters: ${courseContext.totalChapters}
- Learning Objectives:
${courseContext.courseLearningObjectives.map((obj, i) => `  ${i + 1}. ${obj}`).join('\n')}
${memorySection}${qualitySection}

## TASK
Create a blueprint with:
1. A plan for each chapter (title, focus, Bloom's level, key concepts, complexity, rationale, and optionally a recommended section count)
2. Concept dependencies (which concepts depend on which)
3. Bloom's progression strategy (how cognitive levels should advance)
4. Risk areas (topics that are complex, need careful scaffolding, or have prerequisite gaps)
5. Confidence score for the overall plan (0-100)
6. If you believe the course needs more or fewer chapters than specified, include a "recommendedChapterCount" field. Stay within ±2 of the requested count.

## OUTPUT FORMAT
Return a JSON object:
{
  "chapterPlan": [
    {
      "position": 1,
      "suggestedTitle": "...",
      "primaryFocus": "...",
      "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
      "keyConcepts": ["concept1", "concept2"],
      "estimatedComplexity": "low|medium|high",
      "rationale": "Why this chapter belongs here and at this level",
      "recommendedSections": 7
    }
  ],
  "conceptDependencies": [
    { "concept": "concept_name", "dependsOn": ["prerequisite1"] }
  ],
  "bloomsStrategy": [
    { "level": "UNDERSTAND", "chapters": [1, 2] }
  ],
  "riskAreas": ["Risk description..."],
  "planConfidence": 85,
  "recommendedChapterCount": ${courseContext.totalChapters}
}

Return ONLY valid JSON, no markdown formatting.`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt,
    maxTokens: 3000,
    temperature: 0.6,
  });

  return parseBlueprintResponse(responseText, courseContext);
}

function parseBlueprintResponse(
  responseText: string,
  courseContext: CourseContext,
): CourseBlueprintPlan {
  try {
    // Strip markdown fences if present
    const cleaned = responseText
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/```\s*$/m, '')
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    const chapterPlan = parseChapterPlan(parsed.chapterPlan, courseContext);
    const conceptDependencies = parseConceptDependencies(parsed.conceptDependencies);
    const bloomsStrategy = parseBloomsStrategy(parsed.bloomsStrategy);
    const riskAreas = Array.isArray(parsed.riskAreas)
      ? (parsed.riskAreas as string[]).filter(r => typeof r === 'string').slice(0, 10)
      : [];
    const planConfidence = typeof parsed.planConfidence === 'number'
      ? Math.max(0, Math.min(100, Math.round(parsed.planConfidence)))
      : 70;

    // Parse optional recommended chapter count (bounded ±2 from user's count, hard limits 3-15)
    let recommendedChapterCount: number | undefined;
    if (typeof parsed.recommendedChapterCount === 'number') {
      const rec = Math.round(parsed.recommendedChapterCount);
      const clamped = Math.max(3, Math.min(15, Math.max(courseContext.totalChapters - 2, Math.min(courseContext.totalChapters + 2, rec))));
      if (clamped !== courseContext.totalChapters) {
        recommendedChapterCount = clamped;
      }
    }

    return { chapterPlan, conceptDependencies, bloomsStrategy, riskAreas, planConfidence, recommendedChapterCount };
  } catch {
    logger.warn('[CoursePlanner] Failed to parse blueprint response, using default');
    return buildDefaultBlueprint(courseContext);
  }
}

function parseChapterPlan(
  raw: unknown,
  courseContext: CourseContext,
): ChapterPlanEntry[] {
  if (!Array.isArray(raw)) return buildDefaultChapterPlan(courseContext);

  const entries: ChapterPlanEntry[] = [];
  for (let i = 0; i < courseContext.totalChapters; i++) {
    const item = raw[i] as Record<string, unknown> | undefined;
    if (!item) {
      entries.push(buildDefaultChapterEntry(i + 1, courseContext));
      continue;
    }

    const bloomsLevel = typeof item.bloomsLevel === 'string' && BLOOMS_LEVELS.includes(item.bloomsLevel as BloomsLevel)
      ? (item.bloomsLevel as BloomsLevel)
      : getDefaultBloomsLevel(i + 1, courseContext.totalChapters);

    // Parse optional recommendedSections (bounded 5-10)
    let recommendedSections: number | undefined;
    if (typeof item.recommendedSections === 'number') {
      const rec = Math.round(item.recommendedSections as number);
      if (rec >= 5 && rec <= 10) {
        recommendedSections = rec;
      }
    }

    entries.push({
      position: i + 1,
      suggestedTitle: typeof item.suggestedTitle === 'string' ? item.suggestedTitle : `Chapter ${i + 1}`,
      primaryFocus: typeof item.primaryFocus === 'string' ? item.primaryFocus : '',
      bloomsLevel,
      keyConcepts: Array.isArray(item.keyConcepts)
        ? (item.keyConcepts as string[]).filter(k => typeof k === 'string').slice(0, 7)
        : [],
      estimatedComplexity: isValidComplexity(item.estimatedComplexity)
        ? item.estimatedComplexity
        : 'medium',
      rationale: typeof item.rationale === 'string' ? item.rationale : '',
      recommendedSections,
    });
  }

  return entries;
}

function parseConceptDependencies(
  raw: unknown,
): Array<{ concept: string; dependsOn: string[] }> {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Record<string, unknown>>)
    .filter(d => typeof d.concept === 'string' && Array.isArray(d.dependsOn))
    .map(d => ({
      concept: d.concept as string,
      dependsOn: (d.dependsOn as string[]).filter(dep => typeof dep === 'string'),
    }))
    .slice(0, 30);
}

function parseBloomsStrategy(
  raw: unknown,
): Array<{ level: BloomsLevel; chapters: number[] }> {
  if (!Array.isArray(raw)) return [];
  return (raw as Array<Record<string, unknown>>)
    .filter(s =>
      typeof s.level === 'string' &&
      BLOOMS_LEVELS.includes(s.level as BloomsLevel) &&
      Array.isArray(s.chapters),
    )
    .map(s => ({
      level: s.level as BloomsLevel,
      chapters: (s.chapters as number[]).filter(c => typeof c === 'number'),
    }));
}

// ============================================================================
// Dynamic Re-Planning (Phase 4: Agentic Re-Planning)
// ============================================================================

/**
 * Re-plan remaining chapters based on current course state.
 *
 * Called when agentic decision engine triggers 'replan_remaining' due to:
 * - Concept coverage gaps (< 60% of blueprint covered)
 * - 2+ consecutive low-quality chapters
 * - Bloom's regression of 2+ levels
 *
 * Makes a single AI call with full context of what has been generated
 * vs what was originally planned, and returns a revised blueprint.
 *
 * Falls back to the current blueprint on failure (non-blocking).
 */
export async function replanRemainingChapters(
  userId: string,
  courseContext: CourseContext,
  completedChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
  currentBlueprint: CourseBlueprintPlan | null,
): Promise<CourseBlueprintPlan> {
  const completedCount = completedChapters.length;
  const remainingCount = courseContext.totalChapters - completedCount;

  if (remainingCount <= 0) {
    logger.debug('[CoursePlanner] No remaining chapters to re-plan');
    return currentBlueprint ?? buildDefaultBlueprint(courseContext);
  }

  try {
    const plan = await withTimeout(
      doReplanRemaining(userId, courseContext, completedChapters, conceptTracker, currentBlueprint),
      PLANNING_TIMEOUT_MS,
    );

    logger.info('[CoursePlanner] Re-plan complete', {
      remainingChapters: plan.chapterPlan.length,
      completedChapters: completedCount,
      confidence: plan.planConfidence,
    });

    return plan;
  } catch (error) {
    logger.warn('[CoursePlanner] Re-planning failed, keeping current blueprint', {
      error: error instanceof Error ? error.message : String(error),
    });
    return currentBlueprint ?? buildDefaultBlueprint(courseContext);
  }
}

async function doReplanRemaining(
  userId: string,
  courseContext: CourseContext,
  completedChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
  currentBlueprint: CourseBlueprintPlan | null,
): Promise<CourseBlueprintPlan> {
  const completedCount = completedChapters.length;
  const remainingCount = courseContext.totalChapters - completedCount;

  // Build summary of what has been generated so far
  const completedSummary = completedChapters.map(ch => {
    const concepts = ch.conceptsIntroduced ?? ch.keyTopics;
    return `  Ch${ch.position}: "${ch.title}" (${ch.bloomsLevel}) — concepts: ${concepts.slice(0, 5).join(', ')}`;
  }).join('\n');

  // Identify concept gaps
  const allPlannedConcepts = currentBlueprint?.chapterPlan
    .flatMap(e => e.keyConcepts) ?? [];
  const coveredConcepts = Array.from(conceptTracker.concepts.keys());
  const gapConcepts = allPlannedConcepts.filter(
    c => !coveredConcepts.some(cc => cc.toLowerCase() === c.toLowerCase()),
  );

  // Get Bloom's progression status
  const bloomsHistory = completedChapters.map(ch => `${ch.position}:${ch.bloomsLevel}`).join(' → ');

  const systemPrompt = `You are a course architecture planner performing a mid-course re-plan. The course has been partially generated and needs course-correction for remaining chapters.`;

  const userPrompt = `Re-plan the remaining ${remainingCount} chapters for this course:

## COURSE
- Title: "${courseContext.courseTitle}"
- Category: ${courseContext.courseCategory}
- Difficulty: ${courseContext.difficulty}
- Total Chapters: ${courseContext.totalChapters}
- Chapters Completed: ${completedCount}

## WHAT HAS BEEN GENERATED
${completedSummary}

## BLOOM'S PROGRESSION SO FAR
${bloomsHistory}

## CONCEPT GAPS
These planned concepts have NOT been covered yet:
${gapConcepts.length > 0 ? gapConcepts.slice(0, 15).join(', ') : 'None — all concepts covered'}

## ORIGINAL PLAN (for reference)
${currentBlueprint ? JSON.stringify(currentBlueprint.chapterPlan.filter(e => e.position > completedCount).slice(0, 10), null, 2) : 'No original plan available'}

## TASK
Create a revised plan for chapters ${completedCount + 1} through ${courseContext.totalChapters}.
The plan must:
1. Cover the concept gaps listed above
2. Continue Bloom's progression naturally from the last completed chapter
3. Account for what has already been taught (avoid repetition)
4. Maintain overall course coherence

## OUTPUT FORMAT
Return a JSON object:
{
  "chapterPlan": [
    {
      "position": ${completedCount + 1},
      "suggestedTitle": "...",
      "primaryFocus": "...",
      "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
      "keyConcepts": ["concept1", "concept2"],
      "estimatedComplexity": "low|medium|high",
      "rationale": "Why this chapter should be next given the gaps"
    }
  ],
  "conceptDependencies": [],
  "bloomsStrategy": [],
  "riskAreas": [],
  "planConfidence": 75
}

Return ONLY valid JSON, no markdown formatting.`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'course',
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt,
    maxTokens: 3000,
    temperature: 0.6,
  });

  const revisedPlan = parseBlueprintResponse(responseText, courseContext);

  // Merge: keep completed chapters from current blueprint, replace remaining with revised
  if (currentBlueprint) {
    const completedPlanEntries = currentBlueprint.chapterPlan.filter(
      e => e.position <= completedCount,
    );
    revisedPlan.chapterPlan = [
      ...completedPlanEntries,
      ...revisedPlan.chapterPlan.filter(e => e.position > completedCount),
    ];
  }

  return revisedPlan;
}

// ============================================================================
// Default Blueprint Builders (Fallback)
// ============================================================================

function buildDefaultBlueprint(courseContext: CourseContext): CourseBlueprintPlan {
  return {
    chapterPlan: buildDefaultChapterPlan(courseContext),
    conceptDependencies: [],
    bloomsStrategy: [],
    riskAreas: [],
    planConfidence: 50,
  };
}

function buildDefaultChapterPlan(courseContext: CourseContext): ChapterPlanEntry[] {
  return Array.from({ length: courseContext.totalChapters }, (_, i) =>
    buildDefaultChapterEntry(i + 1, courseContext),
  );
}

function buildDefaultChapterEntry(
  position: number,
  courseContext: CourseContext,
): ChapterPlanEntry {
  return {
    position,
    suggestedTitle: `Chapter ${position}`,
    primaryFocus: '',
    bloomsLevel: getDefaultBloomsLevel(position, courseContext.totalChapters),
    keyConcepts: [],
    estimatedComplexity: 'medium',
    rationale: '',
  };
}

function getDefaultBloomsLevel(position: number, totalChapters: number): BloomsLevel {
  const allLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const ratio = (position - 1) / (totalChapters - 1 || 1);
  const index = Math.min(Math.floor(ratio * allLevels.length), allLevels.length - 1);
  return allLevels[index];
}

function isValidComplexity(val: unknown): val is 'low' | 'medium' | 'high' {
  return val === 'low' || val === 'medium' || val === 'high';
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Planning timed out after ${ms}ms`)), ms);
    promise
      .then(result => { clearTimeout(timer); resolve(result); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}
