/**
 * Blueprint Critic — Multi-Agent Review for Course Blueprint Generation
 *
 * Provides a SEPARATE AI persona (reviewer, not creator) that critiques
 * generated course blueprints. This creates multi-agent collaboration where:
 * - Generator AI produces the blueprint (Backwards Design)
 * - Critic AI evaluates the blueprint from an independent perspective
 *
 * The critic checks 6 dimensions:
 * - Objective coverage (every learning objective -> at least 1 chapter)
 * - Topic sequencing (prerequisites taught before needed)
 * - Bloom's progression (cognitive complexity genuinely escalates)
 * - Scope coherence (ALL topics belong in this course)
 * - North Star alignment (every deliverable -> capstone project)
 * - Specificity (expert-level or generic filler)
 *
 * No borderline quality gate — every blueprint gets reviewed because
 * a bad blueprint cascades to every downstream chapter/section.
 *
 * Falls back to rule-based approval if AI call fails (graceful degradation).
 * Single call per blueprint, 15-second timeout.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { traceAICall, sanitizeCourseContext } from './helpers';
import type { CourseContext } from './types';

// ============================================================================
// Types
// ============================================================================

export type CriticVerdict = 'approve' | 'revise' | 'reject';

export interface BlueprintCritique {
  /** Overall verdict */
  verdict: CriticVerdict;
  /** Confidence in the verdict (0-100) */
  confidence: number;
  /** Summary reasoning */
  reasoning: string;
  /** Every learning objective -> at least 1 chapter? (0-100) */
  objectiveCoverage: number;
  /** Prerequisites taught before needed? (0-100) */
  topicSequencing: number;
  /** Cognitive complexity genuinely escalates? (0-100) */
  bloomsProgression: number;
  /** ALL topics belong in this course? (0-100) */
  scopeCoherence: number;
  /** Every deliverable -> capstone project? (0-100) */
  northStarAlignment: number;
  /** Expert-level or generic filler? (0-100) */
  specificity: number;
  /** Actionable improvements for revision */
  actionableImprovements: string[];
}

/** Blueprint structure passed to the critic (matches route.ts types) */
interface BlueprintForReview {
  chapters: Array<{
    position: number;
    title: string;
    goal: string;
    bloomsLevel: string;
    deliverable?: string;
    sections: Array<{
      position: number;
      title: string;
      keyTopics: string[];
    }>;
  }>;
  northStarProject?: string;
  confidence: number;
  riskAreas: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Timeout for blueprint critic AI call (ms) — 15s for thorough review */
const CRITIC_TIMEOUT_MS = 15_000;

/** Minimum confidence to act on a &apos;revise&apos; verdict */
const MIN_REVISE_CONFIDENCE = 60;

// ============================================================================
// Critic Persona
// ============================================================================

const BLUEPRINT_CRITIC_PERSONA = `You are a BLUEPRINT QUALITY REVIEWER — a separate expert from the course architect.
Your role is to critically evaluate a generated course blueprint from an INDEPENDENT perspective.

You are NOT the creator. You are the reviewer. Be honest, specific, and constructive.

## Evaluation Dimensions

1. **Objective Coverage** (0-100):
   - Does EVERY learning objective map to at least one chapter?
   - Are any objectives only superficially covered?
   - Score 80+ if every objective has clear chapter ownership.

2. **Topic Sequencing** (0-100):
   - Are prerequisites taught BEFORE they are needed in later chapters?
   - Does the chapter order make pedagogical sense?
   - Score 80+ if no forward-dependency violations exist.

3. **Bloom's Progression** (0-100):
   - Does cognitive complexity genuinely escalate from early to late chapters?
   - Are there regressions (e.g., CREATE before APPLY)?
   - Score 80+ if Bloom's levels form a monotonically non-decreasing sequence.

4. **Scope Coherence** (0-100):
   - Do ALL chapter topics genuinely belong in THIS specific course?
   - Are there off-topic chapters that belong in a different course?
   - Score 80+ if every chapter clearly serves the course title and description.

5. **North Star Alignment** (0-100):
   - Does the North Star project logically emerge from the chapter deliverables?
   - Does each chapter deliverable contribute a component to the final project?
   - Score 80+ if the deliverable chain builds toward the capstone.

6. **Specificity** (0-100):
   - Are chapter/section titles expert-level or generic filler?
   - Do key topics name specific concepts, techniques, or tools?
   - Score 80+ if a domain expert would recognize the curriculum as rigorous.

## Response Format

Return ONLY a JSON object (no markdown, no explanation outside JSON):
{
  "verdict": "approve" | "revise" | "reject",
  "confidence": <0-100>,
  "reasoning": "<2-3 sentence summary>",
  "objectiveCoverage": <0-100>,
  "topicSequencing": <0-100>,
  "bloomsProgression": <0-100>,
  "scopeCoherence": <0-100>,
  "northStarAlignment": <0-100>,
  "specificity": <0-100>,
  "actionableImprovements": ["<specific improvement 1>", "<specific improvement 2>"]
}

## Verdict Guidelines

- **approve**: All dimensions >= 70, no critical issues
- **revise**: 1-2 dimensions < 70, or specific improvements would meaningfully enhance quality
- **reject**: 3+ dimensions < 50, fundamentally flawed structure (rare)

Be specific in actionableImprovements — tell the creator exactly what to fix.`;

// ============================================================================
// Public API
// ============================================================================

/**
 * Review a generated blueprint with an independent critic AI persona.
 *
 * Every blueprint gets reviewed (no borderline gate) because a bad blueprint
 * cascades to every downstream chapter/section. The ~$0.002 cost of one extra
 * analysis call is negligible vs. regenerating 6-20 chapters.
 *
 * Makes a single AI call with a 15-second timeout.
 * Falls back to rule-based approval on failure.
 */
export async function reviewBlueprintWithCritic(params: {
  userId: string;
  blueprint: BlueprintForReview;
  courseContext: CourseContext;
  courseGoals: string[];
  runId?: string;
}): Promise<BlueprintCritique> {
  const { userId, blueprint, courseContext, courseGoals, runId } = params;

  try {
    const critique = await withTimeout(
      doReviewBlueprint(userId, blueprint, courseContext, courseGoals, runId),
      CRITIC_TIMEOUT_MS,
    );

    logger.info('[BlueprintCritic] Review complete', {
      verdict: critique.verdict,
      confidence: critique.confidence,
      objectiveCoverage: critique.objectiveCoverage,
      topicSequencing: critique.topicSequencing,
      bloomsProgression: critique.bloomsProgression,
      scopeCoherence: critique.scopeCoherence,
      northStarAlignment: critique.northStarAlignment,
      specificity: critique.specificity,
    });

    return critique;
  } catch (error) {
    logger.warn('[BlueprintCritic] AI review failed, using rule-based fallback', {
      error: error instanceof Error ? error.message : String(error),
    });

    return buildRuleBasedBlueprintCritique(blueprint, courseContext, courseGoals);
  }
}

/**
 * Compute a weighted quality score from a critique.
 *
 * Weights:
 * - objectiveCoverage: 20%
 * - bloomsProgression: 20%
 * - topicSequencing: 15%
 * - scopeCoherence: 15%
 * - northStarAlignment: 15%
 * - specificity: 15%
 */
export function scoreBlueprintQuality(critique: BlueprintCritique): number {
  return Math.round(
    critique.objectiveCoverage * 0.20 +
    critique.bloomsProgression * 0.20 +
    critique.topicSequencing * 0.15 +
    critique.scopeCoherence * 0.15 +
    critique.northStarAlignment * 0.15 +
    critique.specificity * 0.15,
  );
}

/**
 * Build a feedback block from blueprint critic results for injection into retry prompts.
 * Same pattern as buildSectionCriticFeedbackBlock in chapter-critic.ts.
 */
export function buildBlueprintCriticFeedbackBlock(critique: BlueprintCritique): string {
  return [
    '\n\n## INDEPENDENT BLUEPRINT REVIEWER FEEDBACK',
    '',
    `An independent reviewer scored your blueprint and requests revision (confidence: ${critique.confidence}%).`,
    '',
    '### Reasoning:',
    critique.reasoning,
    '',
    '### Required Improvements:',
    ...critique.actionableImprovements.map((imp, i) => `${i + 1}. ${imp}`),
    '',
    `Dimension Scores: ObjectiveCoverage=${critique.objectiveCoverage}, TopicSequencing=${critique.topicSequencing}, BloomsProgression=${critique.bloomsProgression}, ScopeCoherence=${critique.scopeCoherence}, NorthStarAlignment=${critique.northStarAlignment}, Specificity=${critique.specificity}`,
    '',
    'Address ALL reviewer feedback. Generate a substantially improved blueprint that fixes the identified issues.',
  ].join('\n');
}

// ============================================================================
// Internal: AI Review
// ============================================================================

async function doReviewBlueprint(
  userId: string,
  blueprint: BlueprintForReview,
  courseContext: CourseContext,
  courseGoals: string[],
  runId?: string,
): Promise<BlueprintCritique> {
  const ctx = sanitizeCourseContext(courseContext);

  const chapterSummary = blueprint.chapters.map(ch =>
    `Ch${ch.position}: "${ch.title}" (${ch.bloomsLevel}) — Goal: ${ch.goal}${ch.deliverable ? ` — Deliverable: ${ch.deliverable}` : ''}
    Sections: ${ch.sections.map(s => `"${s.title}" [${s.keyTopics.join(', ')}]`).join('; ')}`
  ).join('\n');

  const userPrompt = `## Blueprint to Review

**Course**: "${ctx.courseTitle}"
- Category: ${ctx.courseCategory}${ctx.courseSubcategory ? ` > ${ctx.courseSubcategory}` : ''}
- Difficulty: ${ctx.difficulty}
- Target Audience: ${ctx.targetAudience}
- Total Chapters: ${ctx.totalChapters}

**North Star Project**: ${blueprint.northStarProject || 'Not specified'}

**Learning Objectives**:
${courseGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

**Blueprint Chapters**:
${chapterSummary}

Review this blueprint and return your critique as JSON.`;

  const responseText = await traceAICall(
    { runId, stage: 'blueprint-critic', label: 'BlueprintCritic' },
    () => runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt: BLUEPRINT_CRITIC_PERSONA,
      maxTokens: 1000,
      temperature: 0.3,
    }),
  );

  return parseBlueprintCriticResponse(responseText);
}

// ============================================================================
// Internal: Parse AI Response
// ============================================================================

function parseBlueprintCriticResponse(responseText: string): BlueprintCritique {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in blueprint critic response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const verdict = parseVerdict(parsed.verdict);
  const confidence = clamp(Number(parsed.confidence) || 70, 0, 100);
  const objectiveCoverage = clamp(Number(parsed.objectiveCoverage) || 70, 0, 100);
  const topicSequencing = clamp(Number(parsed.topicSequencing) || 70, 0, 100);
  const bloomsProgression = clamp(Number(parsed.bloomsProgression) || 70, 0, 100);
  const scopeCoherence = clamp(Number(parsed.scopeCoherence) || 70, 0, 100);
  const northStarAlignment = clamp(Number(parsed.northStarAlignment) || 70, 0, 100);
  const specificity = clamp(Number(parsed.specificity) || 70, 0, 100);
  const reasoning = String(parsed.reasoning || 'Blueprint review complete');
  const actionableImprovements = Array.isArray(parsed.actionableImprovements)
    ? (parsed.actionableImprovements as unknown[]).map(String).slice(0, 5)
    : [];

  // Override: don't act on low-confidence revise verdicts
  const effectiveVerdict = verdict === 'revise' && confidence < MIN_REVISE_CONFIDENCE
    ? 'approve'
    : verdict;

  return {
    verdict: effectiveVerdict,
    confidence,
    reasoning,
    objectiveCoverage,
    topicSequencing,
    bloomsProgression,
    scopeCoherence,
    northStarAlignment,
    specificity,
    actionableImprovements,
  };
}

function parseVerdict(raw: unknown): CriticVerdict {
  const value = String(raw).toLowerCase().trim();
  if (value === 'approve' || value === 'revise' || value === 'reject') {
    return value;
  }
  return 'approve';
}

// ============================================================================
// Internal: Rule-Based Fallback
// ============================================================================

/**
 * Rule-based fallback when AI critic is unavailable.
 * Checks basic structural quality without an AI call.
 */
function buildRuleBasedBlueprintCritique(
  blueprint: BlueprintForReview,
  courseContext: CourseContext,
  courseGoals: string[],
): BlueprintCritique {
  const improvements: string[] = [];
  let objectiveCoverage = 80;
  let topicSequencing = 80;
  let bloomsProgression = 80;
  let scopeCoherence = 80;
  let northStarAlignment = 80;
  let specificity = 80;

  // --- Objective Coverage ---
  // Check that each course goal has word overlap with at least one chapter
  const allChapterText = blueprint.chapters
    .map(ch => `${ch.title} ${ch.goal} ${ch.sections.map(s => `${s.title} ${s.keyTopics.join(' ')}`).join(' ')}`)
    .join(' ')
    .toLowerCase();

  const uncoveredGoals: string[] = [];
  for (const goal of courseGoals) {
    const goalWords = goal.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    const matchCount = goalWords.filter(w => allChapterText.includes(w)).length;
    if (goalWords.length > 0 && matchCount / goalWords.length < 0.3) {
      uncoveredGoals.push(goal);
    }
  }

  if (uncoveredGoals.length > 0) {
    objectiveCoverage -= uncoveredGoals.length * 15;
    improvements.push(`${uncoveredGoals.length} learning objective(s) lack clear chapter coverage: "${uncoveredGoals[0]}"${uncoveredGoals.length > 1 ? ` and ${uncoveredGoals.length - 1} more` : ''}`);
  }

  // --- Topic Sequencing (forward-prerequisite detection) ---
  // Check if key topics in later chapters reference concepts from earlier chapters
  const BLOOMS_ORDER = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  for (let i = 1; i < blueprint.chapters.length; i++) {
    const ch = blueprint.chapters[i];
    const chTopics = ch.sections.flatMap(s => s.keyTopics).map(t => t.toLowerCase());
    // Check if chapter references advanced concepts without prior foundation
    const prevTopics = new Set(
      blueprint.chapters.slice(0, i).flatMap(c => c.sections.flatMap(s => s.keyTopics.map(t => t.toLowerCase()))),
    );
    const novelTopics = chTopics.filter(t => {
      const words = t.split(/\s+/).filter(w => w.length > 4);
      return words.length > 0 && words.every(w => !Array.from(prevTopics).some(pt => pt.includes(w)));
    });
    // If more than 80% of topics are completely novel, sequencing might be off
    if (chTopics.length > 0 && novelTopics.length / chTopics.length > 0.8 && i > 1) {
      topicSequencing -= 10;
    }
  }
  if (topicSequencing < 70) {
    improvements.push('Some later chapters introduce mostly novel concepts without building on earlier material — check prerequisite flow');
  }

  // --- Bloom's Progression ---
  let regressionCount = 0;
  for (let i = 1; i < blueprint.chapters.length; i++) {
    const prevLevel = BLOOMS_ORDER.indexOf(blueprint.chapters[i - 1].bloomsLevel);
    const currLevel = BLOOMS_ORDER.indexOf(blueprint.chapters[i].bloomsLevel);
    if (prevLevel >= 0 && currLevel >= 0 && currLevel < prevLevel) {
      regressionCount++;
    }
  }
  if (regressionCount > 0) {
    bloomsProgression -= regressionCount * 15;
    improvements.push(`${regressionCount} Bloom&apos;s level regression(s) detected — cognitive complexity should escalate, not decrease`);
  }

  // --- Scope Coherence ---
  const courseTitleWords = courseContext.courseTitle
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !['the', 'and', 'for', 'with', 'course', 'complete', 'guide'].includes(w));

  let offTopicCount = 0;
  for (const ch of blueprint.chapters) {
    const chText = `${ch.title} ${ch.goal}`.toLowerCase();
    const titleWordHits = courseTitleWords.filter(w => chText.includes(w)).length;
    if (courseTitleWords.length > 0 && titleWordHits === 0) {
      offTopicCount++;
    }
  }
  if (offTopicCount > 0) {
    scopeCoherence -= offTopicCount * 12;
    improvements.push(`${offTopicCount} chapter(s) may be off-topic — title/goal does not reference core course subject`);
  }

  // --- North Star Alignment ---
  if (!blueprint.northStarProject) {
    northStarAlignment -= 30;
    improvements.push('No North Star project defined — the course needs a capstone project that ties all chapters together');
  } else {
    const noDeliverable = blueprint.chapters.filter(ch => !ch.deliverable || ch.deliverable.trim() === '');
    if (noDeliverable.length > 0) {
      northStarAlignment -= noDeliverable.length * 8;
      improvements.push(`${noDeliverable.length} chapter(s) have no deliverable — each chapter should produce an artifact contributing to the North Star project`);
    }
  }

  // --- Specificity ---
  const genericPattern = /^(introduction|overview|basics|getting started|conclusion|summary|review|chapter \d+)/i;
  const genericTitles = blueprint.chapters.filter(ch => genericPattern.test(ch.title));
  if (genericTitles.length > 1) {
    specificity -= genericTitles.length * 10;
    improvements.push(`${genericTitles.length} chapter(s) have generic titles — use specific, content-rich titles`);
  }

  // Check section-level specificity
  const genericSections = blueprint.chapters.flatMap(ch =>
    ch.sections.filter(s => /^Section \d+/i.test(s.title) || s.keyTopics.length === 0),
  );
  if (genericSections.length > 2) {
    specificity -= genericSections.length * 5;
    improvements.push(`${genericSections.length} section(s) have placeholder titles or empty key topics`);
  }

  // Clamp all scores
  objectiveCoverage = clamp(objectiveCoverage, 0, 100);
  topicSequencing = clamp(topicSequencing, 0, 100);
  bloomsProgression = clamp(bloomsProgression, 0, 100);
  scopeCoherence = clamp(scopeCoherence, 0, 100);
  northStarAlignment = clamp(northStarAlignment, 0, 100);
  specificity = clamp(specificity, 0, 100);

  const scores = [objectiveCoverage, topicSequencing, bloomsProgression, scopeCoherence, northStarAlignment, specificity];
  const allAbove70 = scores.every(s => s >= 70);
  const belowFiftyCount = scores.filter(s => s < 50).length;

  const verdict: CriticVerdict = belowFiftyCount >= 3
    ? 'reject'
    : !allAbove70
      ? 'revise'
      : 'approve';

  return {
    verdict: improvements.length === 0 ? 'approve' : verdict,
    confidence: 65, // Rule-based is less confident than AI
    reasoning: improvements.length === 0
      ? 'Blueprint passes basic structural quality checks'
      : `Blueprint has ${improvements.length} area(s) for improvement`,
    objectiveCoverage,
    topicSequencing,
    bloomsProgression,
    scopeCoherence,
    northStarAlignment,
    specificity,
    actionableImprovements: improvements,
  };
}

// ============================================================================
// Utilities
// ============================================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Blueprint critic timed out after ${ms}ms`)), ms);
    promise
      .then(result => { clearTimeout(timer); resolve(result); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}
