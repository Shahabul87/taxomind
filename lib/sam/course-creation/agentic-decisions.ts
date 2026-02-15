/**
 * Agentic Decision Engine for Course Creation
 *
 * After each chapter completes, evaluates the outcome and makes autonomous
 * decisions about what to do next. Transforms the pipeline from "blindly
 * continue" to "evaluate, decide, adapt."
 *
 * Decisions are based on:
 * - Quality score trends (improving/declining/stable)
 * - Blueprint alignment (does the chapter match the plan?)
 * - Concept coverage (are planned concepts being introduced?)
 *
 * All decisions are deterministic (pure code, no AI calls) and logged
 * for audit trail purposes.
 */

import { logger } from '@/lib/logger';
import type {
  QualityScore,
  CourseBlueprintPlan,
  ChapterPlanEntry,
  AgenticDecision,
  AIDecisionResponse,
  QualityTrend,
  ConceptTracker,
  CompletedChapter,
  BloomsLevel,
  CourseContext,
} from './types';
import { BLOOMS_LEVELS } from './types';
import type { AdaptiveStrategyMonitor } from './adaptive-strategy';

// ============================================================================
// Constants
// ============================================================================

/** Number of recent scores to analyze for trends */
const TREND_WINDOW = 3;

/** Score threshold below which quality is considered low */
const LOW_QUALITY_THRESHOLD = 55;

/** Score threshold above which quality is considered high */
const HIGH_QUALITY_THRESHOLD = 75;

/** Consecutive low scores before flagging for review */
const FLAG_THRESHOLD = 2;

/** Minimum concept coverage ratio before emphasizing missing concepts */
const CONCEPT_COVERAGE_MIN = 0.5;

// ============================================================================
// Public API
// ============================================================================

/**
 * Evaluate a completed chapter's outcome and decide what to do next.
 *
 * Pure code analysis — no AI calls. Returns a decision that the orchestrator
 * uses to adapt the next chapter's generation.
 */
export function evaluateChapterOutcome(
  completedChapter: CompletedChapter,
  qualityScores: QualityScore[],
  blueprint: CourseBlueprintPlan,
  conceptTracker: ConceptTracker,
): AgenticDecision {
  const chapterNumber = completedChapter.position;
  const blueprintEntry = blueprint.chapterPlan.find(e => e.position === chapterNumber);

  // Analyze quality trend
  const trend = analyzeQualityTrend(qualityScores);

  // Check concept coverage against blueprint
  const conceptCoverage = checkConceptCoverage(blueprintEntry, completedChapter, conceptTracker);

  // Check quality score of this chapter specifically
  const chapterScores = qualityScores.filter((_, i) => {
    // Chapter scores are added first in the orchestrator loop
    // Approximate: use the most recent score for this chapter
    return i === qualityScores.length - 1 || i >= qualityScores.length - completedChapter.sections.length - 1;
  });
  const avgChapterScore = chapterScores.length > 0
    ? Math.round(chapterScores.reduce((sum, s) => sum + s.overall, 0) / chapterScores.length)
    : 70;

  // Decision logic
  if (trend.consecutiveLow >= FLAG_THRESHOLD || avgChapterScore < LOW_QUALITY_THRESHOLD) {
    const decision: AgenticDecision = {
      action: 'flag_for_review',
      reasoning: buildFlagReasoning(trend, avgChapterScore, conceptCoverage),
      adjustments: {
        temperatureShift: -0.1,
        additionalGuidance: buildQualityGuidance(trend, avgChapterScore),
        conceptsToEmphasize: conceptCoverage.missingConcepts.slice(0, 3),
      },
    };
    logger.info('[AgenticDecisions] Chapter flagged for review', {
      chapter: chapterNumber, action: 'flag_for_review', avgScore: avgChapterScore,
    });
    return decision;
  }

  if (trend.trend === 'declining' || conceptCoverage.missingConcepts.length > 2) {
    const decision: AgenticDecision = {
      action: 'adjust_strategy',
      reasoning: buildAdjustReasoning(trend, conceptCoverage),
      adjustments: {
        additionalGuidance: buildAdaptiveGuidanceText(trend, conceptCoverage, blueprintEntry),
        conceptsToEmphasize: conceptCoverage.missingConcepts.slice(0, 5),
      },
    };
    logger.info('[AgenticDecisions] Strategy adjusted', {
      chapter: chapterNumber, action: 'adjust_strategy', trend: trend.trend,
    });
    return decision;
  }

  const decision: AgenticDecision = {
    action: 'continue',
    reasoning: `Chapter ${chapterNumber} completed successfully. Quality trend: ${trend.trend} (avg ${trend.recentAverage}/100). Concept coverage: ${conceptCoverage.coverageRatio.toFixed(1)}. Continuing with standard strategy.`,
  };
  logger.debug('[AgenticDecisions] Continuing', {
    chapter: chapterNumber, action: 'continue', trend: trend.trend,
  });
  return decision;
}

/**
 * Analyze quality score trends from the pipeline's running scores.
 *
 * Returns trend direction, averages, and consecutive low/high counts.
 */
export function analyzeQualityTrend(qualityScores: QualityScore[]): QualityTrend {
  if (qualityScores.length === 0) {
    return { trend: 'stable', recentAverage: 0, overallAverage: 0, consecutiveLow: 0, consecutiveHigh: 0 };
  }

  const overallAverage = Math.round(
    qualityScores.reduce((sum, s) => sum + s.overall, 0) / qualityScores.length,
  );

  const recentScores = qualityScores.slice(-TREND_WINDOW);
  const recentAverage = Math.round(
    recentScores.reduce((sum, s) => sum + s.overall, 0) / recentScores.length,
  );

  // Count consecutive low/high from the end
  let consecutiveLow = 0;
  let consecutiveHigh = 0;
  for (let i = qualityScores.length - 1; i >= 0; i--) {
    if (qualityScores[i].overall < LOW_QUALITY_THRESHOLD) {
      consecutiveLow++;
    } else {
      break;
    }
  }
  for (let i = qualityScores.length - 1; i >= 0; i--) {
    if (qualityScores[i].overall >= HIGH_QUALITY_THRESHOLD) {
      consecutiveHigh++;
    } else {
      break;
    }
  }

  // Determine trend
  let trend: QualityTrend['trend'] = 'stable';
  if (qualityScores.length >= TREND_WINDOW) {
    if (recentAverage < overallAverage - 8) {
      trend = 'declining';
    } else if (recentAverage > overallAverage + 5) {
      trend = 'improving';
    }
  }

  return { trend, recentAverage, overallAverage, consecutiveLow, consecutiveHigh };
}

/**
 * Build an adaptive guidance block from a decision for injection into the next
 * chapter's prompt.
 *
 * Returns empty string if no adjustments are needed.
 */
export function buildAdaptiveGuidance(
  decision: AgenticDecision,
  blueprint: CourseBlueprintPlan,
  nextChapterNumber: number,
): string {
  if (decision.action === 'continue' && !decision.adjustments) return '';

  const lines: string[] = [
    '',
    '## ADAPTIVE GUIDANCE (From Prior Chapter Analysis)',
  ];

  if (decision.adjustments?.additionalGuidance) {
    lines.push(decision.adjustments.additionalGuidance);
  }

  if (decision.adjustments?.conceptsToEmphasize && decision.adjustments.conceptsToEmphasize.length > 0) {
    lines.push(`\n### Concepts to Emphasize:`);
    lines.push(`The following concepts were planned but not fully covered in previous chapters. Incorporate them where appropriate: ${decision.adjustments.conceptsToEmphasize.join(', ')}`);
  }

  // Add blueprint guidance for the next chapter
  const nextEntry = blueprint.chapterPlan.find(e => e.position === nextChapterNumber);
  if (nextEntry && nextEntry.primaryFocus) {
    lines.push(`\n### Blueprint Reminder:`);
    lines.push(`The next chapter was planned to focus on: "${nextEntry.primaryFocus}"`);
    if (nextEntry.keyConcepts.length > 0) {
      lines.push(`Key concepts to introduce: ${nextEntry.keyConcepts.join(', ')}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ============================================================================
// Actionable Decision Application (Phase 2)
// ============================================================================

/** Number of consecutive chapters with quality below threshold before triggering replan */
const REPLAN_CONSECUTIVE_LOW = 2;

/** Concept coverage ratio below which replan is triggered */
const REPLAN_CONCEPT_COVERAGE_MIN = 0.6;

/**
 * Apply an agentic decision to the pipeline state.
 *
 * Called in the orchestrator loop to make decisions actionable rather
 * than purely informational. Modifies strategy monitor and healing queue.
 */
export function applyAgenticDecision(
  decision: AgenticDecision,
  strategyMonitor: AdaptiveStrategyMonitor,
  healingQueue: number[],
): void {
  switch (decision.action) {
    case 'adjust_strategy':
      // Apply strategy overrides from actionPayload
      if (decision.actionPayload?.strategyOverrides) {
        strategyMonitor.applyOverrides(decision.actionPayload.strategyOverrides);
      }
      break;

    case 'flag_for_review':
      // Add to healing queue for post-generation regeneration
      if (decision.actionPayload?.targetChapter) {
        if (!healingQueue.includes(decision.actionPayload.targetChapter)) {
          healingQueue.push(decision.actionPayload.targetChapter);
        }
      }
      break;

    case 'regenerate_chapter':
      // Mark for immediate regeneration (before next chapter)
      if (decision.actionPayload?.targetChapter) {
        if (!healingQueue.includes(decision.actionPayload.targetChapter)) {
          healingQueue.unshift(decision.actionPayload.targetChapter);
        }
      }
      break;

    case 'replan_remaining':
      // Re-planning is handled by the orchestrator after this function returns
      break;

    case 'inject_bridge_content':
      // Bridge content injection is handled by the orchestrator
      break;

    case 'skip_next_chapter':
      // Chapter skipping is handled by the state machine after this function returns
      break;

    case 'continue':
      // No action needed
      break;
  }

  logger.info('[AgenticDecisions] Decision applied', {
    action: decision.action,
    hasPayload: !!decision.actionPayload,
    healingQueueSize: healingQueue.length,
  });
}

/**
 * Enhanced decision evaluation with new trigger conditions for
 * replan_remaining and regenerate_chapter actions.
 *
 * Layered on top of evaluateChapterOutcome — checks for:
 * - 2+ consecutive low-quality chapters → replan_remaining
 * - Bloom's regression of 2+ levels → replan_remaining
 * - Very low single chapter score → regenerate_chapter
 * - Concept coverage below 60% of blueprint → replan_remaining
 */
export function evaluateChapterOutcomeEnhanced(
  completedChapter: CompletedChapter,
  allCompletedChapters: CompletedChapter[],
  qualityScores: QualityScore[],
  blueprint: CourseBlueprintPlan,
  conceptTracker: ConceptTracker,
): AgenticDecision {
  const chapterNumber = completedChapter.position;

  // First, get base decision from standard evaluation
  const baseDecision = evaluateChapterOutcome(
    completedChapter,
    qualityScores,
    blueprint,
    conceptTracker,
  );

  // Check for Bloom's regression of 2+ levels
  if (allCompletedChapters.length >= 2) {
    const prev = allCompletedChapters[allCompletedChapters.length - 2];
    const prevIdx = BLOOMS_LEVELS.indexOf(prev.bloomsLevel);
    const currIdx = BLOOMS_LEVELS.indexOf(completedChapter.bloomsLevel);

    if (prevIdx - currIdx >= 2) {
      return {
        action: 'replan_remaining',
        reasoning: `Bloom's level regressed by ${prevIdx - currIdx} levels (${prev.bloomsLevel} → ${completedChapter.bloomsLevel}). Re-planning remaining chapters to correct cognitive trajectory.`,
        adjustments: baseDecision.adjustments,
        actionPayload: {
          bloomsCorrection: BLOOMS_LEVELS[Math.min(prevIdx + 1, BLOOMS_LEVELS.length - 1)] as BloomsLevel,
        },
      };
    }
  }

  // Check for consecutive low-quality chapters
  if (allCompletedChapters.length >= REPLAN_CONSECUTIVE_LOW) {
    const recentChapters = allCompletedChapters.slice(-REPLAN_CONSECUTIVE_LOW);
    const recentScores = recentChapters.map(ch => {
      const chScores = qualityScores.filter((_, i) => i >= qualityScores.length - REPLAN_CONSECUTIVE_LOW * 3);
      return chScores.length > 0
        ? chScores.reduce((sum, s) => sum + s.overall, 0) / chScores.length
        : 70;
    });

    if (recentScores.every(s => s < LOW_QUALITY_THRESHOLD)) {
      return {
        action: 'replan_remaining',
        reasoning: `${REPLAN_CONSECUTIVE_LOW} consecutive chapters scored below threshold. Re-planning to adjust approach.`,
        adjustments: {
          temperatureShift: -0.15,
          additionalGuidance: 'Quality has been consistently low. Simplify concepts and add more concrete examples.',
        },
      };
    }
  }

  // Check for very low single chapter score → trigger regeneration
  const chapterScores = qualityScores.slice(-1);
  const latestScore = chapterScores.length > 0 ? chapterScores[0].overall : 70;
  if (latestScore < 40) {
    return {
      action: 'regenerate_chapter',
      reasoning: `Chapter ${chapterNumber} scored critically low (${latestScore}/100). Scheduling immediate regeneration.`,
      adjustments: baseDecision.adjustments,
      actionPayload: {
        targetChapter: chapterNumber,
      },
    };
  }

  // Check concept coverage against blueprint
  const blueprintEntry = blueprint.chapterPlan.find(e => e.position <= chapterNumber);
  if (blueprintEntry) {
    const totalPlannedConcepts = blueprint.chapterPlan
      .filter(e => e.position <= chapterNumber)
      .flatMap(e => e.keyConcepts)
      .length;
    const coveredConcepts = conceptTracker.concepts.size;
    const coverageRatio = totalPlannedConcepts > 0 ? coveredConcepts / totalPlannedConcepts : 1;

    if (coverageRatio < REPLAN_CONCEPT_COVERAGE_MIN && chapterNumber >= 3) {
      return {
        action: 'replan_remaining',
        reasoning: `Concept coverage is only ${Math.round(coverageRatio * 100)}% of blueprint (${coveredConcepts}/${totalPlannedConcepts} concepts). Re-planning to fill gaps.`,
        adjustments: baseDecision.adjustments,
        actionPayload: {
          conceptGaps: blueprint.chapterPlan
            .filter(e => e.position <= chapterNumber)
            .flatMap(e => e.keyConcepts)
            .filter(c => !conceptTracker.concepts.has(c.toLowerCase())),
        },
      };
    }
  }

  // If flag_for_review, add targetChapter to payload for healing queue
  if (baseDecision.action === 'flag_for_review' && !baseDecision.actionPayload?.targetChapter) {
    return {
      ...baseDecision,
      actionPayload: {
        ...baseDecision.actionPayload,
        targetChapter: chapterNumber,
      },
    };
  }

  return baseDecision;
}

// ============================================================================
// Internal Helpers
// ============================================================================

interface ConceptCoverageResult {
  coverageRatio: number;
  missingConcepts: string[];
  coveredConcepts: string[];
}

function checkConceptCoverage(
  blueprintEntry: CourseBlueprintPlan['chapterPlan'][0] | undefined,
  completedChapter: CompletedChapter,
  conceptTracker: ConceptTracker,
): ConceptCoverageResult {
  if (!blueprintEntry || blueprintEntry.keyConcepts.length === 0) {
    return { coverageRatio: 1, missingConcepts: [], coveredConcepts: [] };
  }

  const plannedConcepts = blueprintEntry.keyConcepts.map(c => c.toLowerCase());
  const actualConcepts = new Set<string>();

  // Collect concepts from chapter and its sections
  const chapterConcepts = completedChapter.conceptsIntroduced ?? completedChapter.keyTopics;
  for (const c of chapterConcepts) {
    actualConcepts.add(c.toLowerCase());
  }
  for (const sec of completedChapter.sections) {
    for (const c of sec.conceptsIntroduced ?? []) {
      actualConcepts.add(c.toLowerCase());
    }
  }
  // Also check concept tracker
  for (const name of conceptTracker.concepts.keys()) {
    actualConcepts.add(name.toLowerCase());
  }

  const coveredConcepts: string[] = [];
  const missingConcepts: string[] = [];

  for (const planned of plannedConcepts) {
    if (actualConcepts.has(planned)) {
      coveredConcepts.push(planned);
    } else {
      // Fuzzy match: check if any actual concept contains the planned concept
      const fuzzyMatch = Array.from(actualConcepts).some(
        actual => actual.includes(planned) || planned.includes(actual),
      );
      if (fuzzyMatch) {
        coveredConcepts.push(planned);
      } else {
        missingConcepts.push(planned);
      }
    }
  }

  const coverageRatio = plannedConcepts.length > 0
    ? coveredConcepts.length / plannedConcepts.length
    : 1;

  return { coverageRatio, missingConcepts, coveredConcepts };
}

function buildFlagReasoning(
  trend: QualityTrend,
  avgScore: number,
  conceptCoverage: ConceptCoverageResult,
): string {
  const reasons: string[] = [];

  if (avgScore < LOW_QUALITY_THRESHOLD) {
    reasons.push(`chapter quality score (${avgScore}/100) is below threshold`);
  }
  if (trend.consecutiveLow >= FLAG_THRESHOLD) {
    reasons.push(`${trend.consecutiveLow} consecutive low-quality items detected`);
  }
  if (conceptCoverage.coverageRatio < CONCEPT_COVERAGE_MIN) {
    reasons.push(`concept coverage is only ${Math.round(conceptCoverage.coverageRatio * 100)}%`);
  }

  return `Chapter flagged for review: ${reasons.join('; ')}.`;
}

function buildAdjustReasoning(
  trend: QualityTrend,
  conceptCoverage: ConceptCoverageResult,
): string {
  const reasons: string[] = [];

  if (trend.trend === 'declining') {
    reasons.push(`quality trend is declining (recent avg ${trend.recentAverage} vs overall ${trend.overallAverage})`);
  }
  if (conceptCoverage.missingConcepts.length > 0) {
    reasons.push(`${conceptCoverage.missingConcepts.length} planned concepts not yet covered: ${conceptCoverage.missingConcepts.slice(0, 3).join(', ')}`);
  }

  return `Strategy adjustment: ${reasons.join('; ')}.`;
}

function buildQualityGuidance(trend: QualityTrend, avgScore: number): string {
  const lines: string[] = [];

  if (avgScore < LOW_QUALITY_THRESHOLD) {
    lines.push('IMPORTANT: Previous chapter scored below quality threshold. For this chapter:');
    lines.push('- Be MORE specific with examples and concrete scenarios');
    lines.push('- Ensure ALL learning objectives use proper Bloom\'s verbs');
    lines.push('- Include detailed descriptions (not just surface-level content)');
  }

  if (trend.trend === 'declining') {
    lines.push('Quality has been declining across recent chapters. Pay extra attention to:');
    lines.push('- Depth of content (avoid surface-level explanations)');
    lines.push('- Specificity (name technologies, frameworks, real systems)');
    lines.push('- Bloom\'s alignment (use correct cognitive level verbs)');
  }

  return lines.join('\n');
}

function buildAdaptiveGuidanceText(
  trend: QualityTrend,
  conceptCoverage: ConceptCoverageResult,
  blueprintEntry: CourseBlueprintPlan['chapterPlan'][0] | undefined,
): string {
  const lines: string[] = [];

  if (trend.trend === 'declining') {
    lines.push('Previous chapters showed declining quality. Focus on depth and specificity.');
  }

  if (conceptCoverage.missingConcepts.length > 0) {
    lines.push(`These planned concepts were not covered in previous chapters and should be incorporated: ${conceptCoverage.missingConcepts.join(', ')}`);
  }

  if (blueprintEntry) {
    lines.push(`Blueprint focus for this position: ${blueprintEntry.primaryFocus}`);
  }

  return lines.join('\n');
}

// ============================================================================
// AI-Driven Decision Engine (replaces pure rule-based for richer reasoning)
// ============================================================================

/**
 * Evaluate a completed chapter's outcome using AI reasoning.
 *
 * Makes an LLM call to reason about quality trends, concept gaps, and
 * Bloom's progression, then returns a structured decision. Falls back
 * to rule-based evaluation if the AI call fails.
 *
 * Guardrail: If AI says "continue" but rule-based says "flag_for_review"
 * (quality critically low), the stricter decision wins.
 */
export async function evaluateChapterOutcomeWithAI(
  userId: string,
  completedChapter: CompletedChapter,
  allCompletedChapters: CompletedChapter[],
  qualityScores: QualityScore[],
  blueprint: CourseBlueprintPlan,
  conceptTracker: ConceptTracker,
  courseContext: CourseContext,
): Promise<AgenticDecision> {
  // Always compute rule-based first (guardrail + fallback)
  const ruleBasedDecision = evaluateChapterOutcomeEnhanced(
    completedChapter,
    allCompletedChapters,
    qualityScores,
    blueprint,
    conceptTracker,
  );

  try {
    const { runSAMChatWithPreference } = await import('@/lib/sam/ai-provider');

    const chapterNumber = completedChapter.position;
    const trend = analyzeQualityTrend(qualityScores);
    const blueprintEntry = blueprint.chapterPlan.find(e => e.position === chapterNumber);
    const nextBlueprintEntry = blueprint.chapterPlan.find(e => e.position === chapterNumber + 1);

    // Build covered vs planned concepts
    const coveredConcepts = Array.from(conceptTracker.concepts.keys());
    const plannedConcepts = blueprint.chapterPlan
      .filter(e => e.position <= chapterNumber)
      .flatMap(e => e.keyConcepts);
    const missingConcepts = plannedConcepts.filter(
      c => !coveredConcepts.some(cc => cc.toLowerCase() === c.toLowerCase()),
    );

    const systemPrompt = `You are an agentic course creation decision engine. After each chapter is generated, you analyze quality and decide the next action. Return ONLY valid JSON.`;

    const userPrompt = `A chapter was just generated. Analyze and decide what to do next.

## Completed Chapter
- Title: ${completedChapter.title}
- Bloom's Level: ${completedChapter.bloomsLevel}
- Key Topics: ${completedChapter.keyTopics.join(', ')}
- Sections: ${completedChapter.sections.length}

## Quality Trend
- Recent Average: ${trend.recentAverage}/100
- Overall Average: ${trend.overallAverage}/100
- Trend: ${trend.trend}
- Consecutive Low: ${trend.consecutiveLow}

## Concept Coverage
- Covered: ${coveredConcepts.length} concepts
- Planned (up to this chapter): ${plannedConcepts.length}
- Missing: ${missingConcepts.length > 0 ? missingConcepts.join(', ') : 'none'}

## Bloom's Progression
${allCompletedChapters.map(ch => `Ch${ch.position}: ${ch.bloomsLevel}`).join(' → ')}

## Blueprint for Next Chapter
${nextBlueprintEntry ? `Title: "${nextBlueprintEntry.suggestedTitle}", Focus: ${nextBlueprintEntry.primaryFocus}, Key Concepts: ${nextBlueprintEntry.keyConcepts.join(', ')}` : 'No next chapter in blueprint (final chapter)'}

## Available Actions
- "continue" — proceed normally
- "adjust_strategy" — modify generation parameters
- "inject_bridge_content" — add scaffolding paragraphs between chapters to bridge concept gaps
- "replan_remaining" — revise the blueprint for remaining chapters
- "flag_for_review" — mark chapter for post-generation healing
- "regenerate_chapter" — immediately regenerate this chapter
- "skip_next_chapter" — skip the next chapter if its content would be redundant with what was already covered (use sparingly, max 1 skip per course)

Respond with JSON:
{
  "action": "<action>",
  "reasoning": "<1-2 sentence explanation>",
  "confidence": <0-100>,
  "conceptGaps": ["<missing concept 1>", ...],
  "bridgeContentSuggestion": "<brief suggestion if action is inject_bridge_content>",
  "strategyAdjustments": {
    "temperatureShift": <-0.2 to 0.2 or null>,
    "additionalGuidance": "<guidance text or null>",
    "conceptsToEmphasize": ["<concept>", ...]
  }
}`;

    const responseText = await runSAMChatWithPreference({
      userId,
      capability: 'analysis',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      maxTokens: 500,
      temperature: 0.3,
    });

    const aiDecision = parseAIDecisionResponse(responseText, completedChapter.position);
    if (!aiDecision) {
      logger.debug('[AgenticDecisions] AI response parse failed, using rule-based', { chapter: chapterNumber });
      return ruleBasedDecision;
    }

    // Validate and merge with rule-based guardrails
    const finalDecision = validateAIDecision(aiDecision, ruleBasedDecision, chapterNumber);

    logger.info('[AgenticDecisions] AI decision made', {
      chapter: chapterNumber,
      aiAction: aiDecision.action,
      finalAction: finalDecision.action,
      confidence: aiDecision.confidence,
      ruleBasedAction: ruleBasedDecision.action,
    });

    return finalDecision;
  } catch (error) {
    logger.warn('[AgenticDecisions] AI decision call failed, using rule-based', {
      chapter: completedChapter.position,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return ruleBasedDecision;
  }
}

/**
 * Parse an AI response into a structured AgenticDecision.
 * Returns null if the response cannot be parsed.
 */
function parseAIDecisionResponse(
  responseText: string,
  chapterNumber: number,
): AIDecisionResponse | null {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, responseText];
    const jsonStr = (jsonMatch[1] ?? responseText).trim();
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    const validActions = ['continue', 'adjust_strategy', 'flag_for_review', 'regenerate_chapter', 'inject_bridge_content', 'replan_remaining', 'skip_next_chapter'];
    const action = typeof parsed.action === 'string' && validActions.includes(parsed.action)
      ? parsed.action as AIDecisionResponse['action']
      : 'continue';

    return {
      action,
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : `AI decision for chapter ${chapterNumber}`,
      confidence: typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 50,
      conceptGaps: Array.isArray(parsed.conceptGaps) ? parsed.conceptGaps.filter((g): g is string => typeof g === 'string') : undefined,
      bridgeContentSuggestion: typeof parsed.bridgeContentSuggestion === 'string' ? parsed.bridgeContentSuggestion : undefined,
      strategyAdjustments: parsed.strategyAdjustments && typeof parsed.strategyAdjustments === 'object'
        ? {
            temperatureShift: typeof (parsed.strategyAdjustments as Record<string, unknown>).temperatureShift === 'number'
              ? (parsed.strategyAdjustments as Record<string, unknown>).temperatureShift as number
              : undefined,
            additionalGuidance: typeof (parsed.strategyAdjustments as Record<string, unknown>).additionalGuidance === 'string'
              ? (parsed.strategyAdjustments as Record<string, unknown>).additionalGuidance as string
              : undefined,
            conceptsToEmphasize: Array.isArray((parsed.strategyAdjustments as Record<string, unknown>).conceptsToEmphasize)
              ? ((parsed.strategyAdjustments as Record<string, unknown>).conceptsToEmphasize as unknown[]).filter((c): c is string => typeof c === 'string')
              : undefined,
          }
        : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Validate an AI decision against the rule-based decision.
 *
 * Guardrail: If AI says "continue" but rules say quality is critically low
 * (flag_for_review or regenerate_chapter), override with the stricter decision.
 */
function validateAIDecision(
  aiDecision: AIDecisionResponse,
  ruleBasedDecision: AgenticDecision,
  chapterNumber: number,
  totalChapters?: number,
  hasAlreadySkipped?: boolean,
): AgenticDecision {
  // Guardrails for skip_next_chapter
  if (aiDecision.action === 'skip_next_chapter') {
    const remaining = totalChapters ? totalChapters - chapterNumber : 0;
    const tooEarly = chapterNumber <= 2;
    const tooLate = remaining < 3;
    const alreadySkipped = hasAlreadySkipped === true;

    if (tooEarly || tooLate || alreadySkipped) {
      logger.info('[AgenticDecisions] Skip guardrail blocked skip_next_chapter', {
        chapter: chapterNumber, tooEarly, tooLate, alreadySkipped,
      });
      // Convert to continue
      aiDecision = { ...aiDecision, action: 'continue', reasoning: `${aiDecision.reasoning} (skip blocked by guardrail)` };
    }
  }

  const criticalActions = ['flag_for_review', 'regenerate_chapter'];

  // If rule-based says critical and AI says continue, override with stricter
  if (criticalActions.includes(ruleBasedDecision.action) && aiDecision.action === 'continue') {
    logger.info('[AgenticDecisions] AI overridden by rule-based guardrail', {
      chapter: chapterNumber,
      aiAction: aiDecision.action,
      ruleAction: ruleBasedDecision.action,
    });
    return {
      ...ruleBasedDecision,
      reasoning: `${ruleBasedDecision.reasoning} (AI suggested continue but quality guardrail overrode)`,
    };
  }

  // Convert AI decision to AgenticDecision format
  const decision: AgenticDecision = {
    action: aiDecision.action,
    reasoning: aiDecision.reasoning,
    adjustments: aiDecision.strategyAdjustments
      ? {
          temperatureShift: aiDecision.strategyAdjustments.temperatureShift,
          additionalGuidance: aiDecision.strategyAdjustments.additionalGuidance,
          conceptsToEmphasize: aiDecision.strategyAdjustments.conceptsToEmphasize,
        }
      : ruleBasedDecision.adjustments,
    actionPayload: {
      targetChapter: aiDecision.action === 'flag_for_review' || aiDecision.action === 'regenerate_chapter'
        ? chapterNumber
        : undefined,
      conceptGaps: aiDecision.conceptGaps,
    },
  };

  return decision;
}

// ============================================================================
// Bridge Content Generation
// ============================================================================

/**
 * Generate bridging content between chapters to scaffold concept gaps.
 *
 * Makes a small LLM call to produce 1-3 paragraphs that:
 * 1. Connect what was just learned to what comes next
 * 2. Briefly introduce gap concepts at an intuitive level
 * 3. Create curiosity for the next chapter
 */
export async function generateBridgeContent(
  userId: string,
  previousChapter: CompletedChapter,
  nextChapterBlueprint: ChapterPlanEntry | undefined,
  conceptGaps: string[],
  courseContext: CourseContext,
): Promise<string> {
  if (conceptGaps.length === 0 && !nextChapterBlueprint) {
    return '';
  }

  try {
    const { runSAMChatWithPreference } = await import('@/lib/sam/ai-provider');

    const systemPrompt = `You are a pedagogical bridge builder. Write 1-3 short paragraphs that connect concepts between course chapters. Be concise, intuitive, and create curiosity. Do NOT use JSON — write plain text only.`;

    const userPrompt = `Create a concept bridge between chapters.

## Just Completed
- Chapter: "${previousChapter.title}" (${previousChapter.bloomsLevel})
- Key Topics: ${previousChapter.keyTopics.join(', ')}

## Coming Next
${nextChapterBlueprint
  ? `- Chapter: "${nextChapterBlueprint.suggestedTitle}" (${nextChapterBlueprint.bloomsLevel})
- Focus: ${nextChapterBlueprint.primaryFocus}
- Key Concepts: ${nextChapterBlueprint.keyConcepts.join(', ')}`
  : '- Next chapter (details TBD)'}

## Concept Gaps to Bridge
${conceptGaps.length > 0 ? conceptGaps.join(', ') : 'No specific gaps — create a natural transition'}

## Course Context
- Course: "${courseContext.courseTitle}"
- Difficulty: ${courseContext.difficulty}
- Audience: ${courseContext.targetAudience}

Write 1-3 bridging paragraphs (plain text, no JSON).`;

    const bridgeText = await runSAMChatWithPreference({
      userId,
      capability: 'course',
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt,
      maxTokens: 500,
      temperature: 0.6,
    });

    logger.info('[AgenticDecisions] Bridge content generated', {
      previousChapter: previousChapter.position,
      conceptGaps: conceptGaps.length,
      bridgeLength: bridgeText.length,
    });

    return bridgeText.trim();
  } catch (error) {
    logger.warn('[AgenticDecisions] Bridge content generation failed', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return '';
  }
}
