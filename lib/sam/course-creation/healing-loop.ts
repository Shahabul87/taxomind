/**
 * Healing Loop — Autonomous Post-Generation Quality Recovery
 *
 * After all chapters are generated and reflection identifies quality issues,
 * autonomously regenerates flagged chapters without human intervention.
 *
 * Flow:
 * 1. Check reflection for flagged chapters above severity threshold
 * 2. Regenerate each flagged chapter using chapter-regenerator
 * 3. Re-run reflection on updated course
 * 4. Repeat if still below coherence threshold (max iterations)
 *
 * Safety:
 * - Hard cap on iterations (maxHealingIterations, default 2)
 * - Only heals chapters above severity threshold
 * - Skips healing entirely if coherence is already above minCoherenceScore
 * - Each iteration emits SSE events for UI visibility
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { traceAICall } from './helpers';
import { regenerateChapter, regenerateSectionsOnly, regenerateDetailsOnly } from './chapter-regenerator';
import { reflectOnCourse } from './course-reflector';
import type {
  CompletedChapter,
  ConceptTracker,
  CourseContext,
  QualityScore,
  CourseBlueprintPlan,
  CourseReflection,
  HealingLoopConfig,
  HealingResult,
  HealingStrategy,
  HealingStrategyType,
  BloomsLevel,
  ContentType,
} from './types';

// ============================================================================
// Constants
// ============================================================================

/** Maximum allowed healing iterations (hard cap regardless of config) */
const ABSOLUTE_MAX_ITERATIONS = 3;

// ============================================================================
// Public API
// ============================================================================

/**
 * Run the autonomous healing loop — regenerate flagged chapters and re-evaluate.
 *
 * Returns a HealingResult with details about what was healed and the
 * final coherence score.
 */
export async function runHealingLoop(
  config: HealingLoopConfig,
  completedChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
  courseContext: CourseContext,
  qualityScores: QualityScore[],
  blueprintPlan: CourseBlueprintPlan | null,
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void,
  runId?: string,
): Promise<HealingResult> {
  const maxIterations = Math.min(
    config.maxHealingIterations,
    ABSOLUTE_MAX_ITERATIONS,
  );

  // Get initial reflection
  let reflection = reflectOnCourse(
    completedChapters,
    conceptTracker,
    courseContext,
    qualityScores,
    blueprintPlan ?? undefined,
  );

  const initialCoherence = reflection.coherenceScore;

  // Skip healing if already above threshold
  if (reflection.coherenceScore >= config.minCoherenceScore) {
    logger.info('[HealingLoop] Skipping — coherence already above threshold', {
      coherenceScore: reflection.coherenceScore,
      threshold: config.minCoherenceScore,
    });
    return {
      healed: false,
      iterationsRun: 0,
      chaptersRegenerated: [],
      finalCoherenceScore: reflection.coherenceScore,
      improvementDelta: 0,
    };
  }

  const allRegeneratedChapters = new Set<number>();
  const chapterFailureCounts = new Map<number, number>();
  let iterationsRun = 0;
  let previousCoherence = reflection.coherenceScore;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    iterationsRun++;

    // Get flagged chapters above severity threshold
    const flagged = filterBySeverity(
      reflection.flaggedChapters,
      config.severityThreshold,
    );

    if (flagged.length === 0) {
      logger.info('[HealingLoop] No chapters to heal at severity threshold', {
        iteration,
        severityThreshold: config.severityThreshold,
      });
      break;
    }

    logger.info('[HealingLoop] Starting healing iteration', {
      iteration: iteration + 1,
      flaggedCount: flagged.length,
      coherenceScore: reflection.coherenceScore,
    });

    onSSEEvent?.({
      type: 'healing_start',
      data: {
        iteration: iteration + 1,
        maxIterations,
        flaggedCount: flagged.length,
        coherenceScore: reflection.coherenceScore,
      },
    });

    // Regenerate each flagged chapter
    for (const flag of flagged) {
      const chapter = completedChapters.find(ch => ch.position === flag.position);
      if (!chapter) continue;

      // Skip if already regenerated in any prior iteration
      if (allRegeneratedChapters.has(flag.position)) continue;

      logger.info('[HealingLoop] Regenerating chapter', {
        position: flag.position,
        reason: flag.reason,
        severity: flag.severity,
      });

      onSSEEvent?.({
        type: 'healing_chapter',
        data: {
          position: flag.position,
          reason: flag.reason,
          severity: flag.severity,
          iteration: iteration + 1,
        },
      });

      try {
        // AI diagnosis: determine the best healing strategy
        const strategy = await diagnoseChapterIssues(
          config.userId,
          chapter,
          flag.reason,
          flag.severity,
          courseContext,
          runId,
        );

        onSSEEvent?.({
          type: 'healing_diagnosis',
          data: {
            position: flag.position,
            strategy: strategy.type,
            reasoning: strategy.reasoning,
          },
        });

        logger.info('[HealingLoop] AI diagnosis complete', {
          position: flag.position,
          strategy: strategy.type,
          reasoning: strategy.reasoning,
        });

        // Skip healing if AI determines flag is a false positive
        if (strategy.type === 'skip_healing') {
          logger.info('[HealingLoop] AI recommends skipping healing (false positive)', {
            position: flag.position,
          });
          continue;
        }

        const regenOptions = {
          userId: config.userId,
          courseId: config.courseId,
          chapterId: chapter.id,
          chapterPosition: flag.position,
          onSSEEvent,
        };

        let result;

        switch (strategy.type) {
          case 'sections_only':
            result = await regenerateSectionsOnly(regenOptions);
            break;
          case 'details_only':
            result = await regenerateDetailsOnly(regenOptions);
            break;
          case 'targeted_sections':
            result = await regenerateSectionsOnly({
              ...regenOptions,
              targetSectionPositions: strategy.targetSections,
            });
            break;
          case 'full_regeneration':
          default:
            result = await regenerateChapter(regenOptions);
            break;
        }

        if (result.success) {
          allRegeneratedChapters.add(flag.position);

          // Reload chapter from DB to replace stale data in completedChapters[]
          try {
            const freshChapter = await db.chapter.findUnique({
              where: { id: chapter.id },
              include: { sections: { orderBy: { position: 'asc' } } },
            });
            if (freshChapter) {
              const idx = completedChapters.findIndex(ch => ch.position === flag.position);
              if (idx !== -1) {
                completedChapters[idx] = {
                  id: freshChapter.id,
                  position: freshChapter.position,
                  title: freshChapter.title,
                  description: freshChapter.description ?? '',
                  bloomsLevel: (freshChapter.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
                  learningObjectives: (freshChapter.courseGoals ?? '').split('\n').filter(Boolean),
                  keyTopics: completedChapters[idx].keyTopics,
                  prerequisites: freshChapter.prerequisites ?? '',
                  estimatedTime: freshChapter.estimatedTime ?? '1-2 hours',
                  topicsToExpand: completedChapters[idx].topicsToExpand ?? [],
                  sections: freshChapter.sections.map(sec => ({
                    id: sec.id,
                    position: sec.position,
                    title: sec.title,
                    contentType: (sec.type ?? 'video') as ContentType,
                    estimatedDuration: sec.duration ? `${sec.duration} minutes` : '15-20 minutes',
                    topicFocus: sec.title,
                    parentChapterContext: {
                      title: freshChapter.title,
                      bloomsLevel: (freshChapter.targetBloomsLevel ?? 'UNDERSTAND') as BloomsLevel,
                      relevantObjectives: (freshChapter.courseGoals ?? '').split('\n').filter(Boolean).slice(0, 2),
                    },
                    details: sec.description ? {
                      description: sec.description,
                      learningObjectives: (sec.learningObjectives ?? '').split('\n').filter(Boolean),
                      keyConceptsCovered: (sec.keyConceptsCovered ?? '').split('\n').filter(Boolean),
                      practicalActivity: sec.practicalActivity ?? '',
                      creatorGuidelines: sec.creatorGuidelines ?? '',
                    } : undefined,
                  })),
                };
              }
            }
          } catch (reloadError) {
            logger.warn('[HealingLoop] Failed to reload chapter from DB after healing — using stale data', {
              position: flag.position,
              error: reloadError instanceof Error ? reloadError.message : String(reloadError),
            });
          }

          logger.info('[HealingLoop] Chapter healed successfully', {
            position: flag.position,
            strategy: strategy.type,
            newTitle: result.chapterTitle,
          });
        } else {
          const current = chapterFailureCounts.get(flag.position) ?? 0;
          chapterFailureCounts.set(flag.position, current + 1);
          logger.warn('[HealingLoop] Chapter regeneration failed', {
            position: flag.position,
            strategy: strategy.type,
            error: result.error,
            failureCount: current + 1,
          });
        }
      } catch (error) {
        const current = chapterFailureCounts.get(flag.position) ?? 0;
        chapterFailureCounts.set(flag.position, current + 1);
        logger.warn('[HealingLoop] Chapter regeneration error', {
          position: flag.position,
          error: error instanceof Error ? error.message : String(error),
          failureCount: current + 1,
        });
        // Continue with other chapters — healing is best-effort
      }
    }

    // Re-run reflection after this iteration
    reflection = reflectOnCourse(
      completedChapters,
      conceptTracker,
      courseContext,
      qualityScores,
      blueprintPlan ?? undefined,
    );

    logger.info('[HealingLoop] Iteration complete', {
      iteration: iteration + 1,
      newCoherenceScore: reflection.coherenceScore,
      previousCoherence,
      chaptersRegenerated: allRegeneratedChapters.size,
    });

    // Stop if coherence is now above threshold
    if (reflection.coherenceScore >= config.minCoherenceScore) {
      logger.info('[HealingLoop] Coherence threshold reached', {
        coherenceScore: reflection.coherenceScore,
        threshold: config.minCoherenceScore,
      });
      break;
    }

    // Coherence regression guard: stop if healing made quality worse
    if (reflection.coherenceScore < previousCoherence) {
      logger.warn('[HealingLoop] Coherence regressed after healing — stopping to prevent further degradation', {
        previousCoherence,
        newCoherence: reflection.coherenceScore,
        iteration: iteration + 1,
      });
      break;
    }

    previousCoherence = reflection.coherenceScore;
  }

  // Identify chapters that exhausted all healing attempts
  const exhaustedChapters = [...chapterFailureCounts.entries()]
    .filter(([, failures]) => failures >= maxIterations)
    .map(([chapterNum]) => chapterNum);

  if (exhaustedChapters.length > 0) {
    logger.warn('[HealingLoop] Chapters exhausted healing attempts', {
      exhaustedChapters,
      maxIterations,
    });
  }

  const result: HealingResult = {
    healed: allRegeneratedChapters.size > 0,
    iterationsRun,
    chaptersRegenerated: [...allRegeneratedChapters],
    finalCoherenceScore: reflection.coherenceScore,
    improvementDelta: reflection.coherenceScore - initialCoherence,
    healingExhaustedChapters: exhaustedChapters.length > 0 ? exhaustedChapters : undefined,
  };

  onSSEEvent?.({
    type: 'healing_complete',
    data: {
      healed: result.healed,
      iterationsRun: result.iterationsRun,
      chaptersRegenerated: result.chaptersRegenerated,
      finalCoherenceScore: result.finalCoherenceScore,
      improvementDelta: result.improvementDelta,
    },
  });

  logger.info('[HealingLoop] Healing complete', result);
  return result;
}

// ============================================================================
// AI Diagnosis
// ============================================================================

/**
 * Ask AI to diagnose the root cause of a flagged chapter and recommend a
 * healing strategy. Falls back to 'full_regeneration' on any failure.
 */
export async function diagnoseChapterIssues(
  userId: string,
  chapter: CompletedChapter,
  flagReason: string,
  flagSeverity: string,
  courseContext: CourseContext,
  runId?: string,
): Promise<HealingStrategy> {
  const fallback: HealingStrategy = {
    type: 'full_regeneration',
    reasoning: 'Default: full regeneration (AI diagnosis unavailable)',
  };

  try {
    const sectionSummaries = (chapter.sections ?? [])
      .map((s, i) => `  ${i + 1}. "${s.title}" (${s.contentType})`)
      .join('\n');

    const prompt = `You are a course quality diagnostician. A chapter has been flagged for quality issues.

## Flagged Chapter
- Title: "${chapter.title}"
- Position: ${chapter.position}
- Bloom's Level: ${chapter.bloomsLevel}
- Learning Objectives: ${chapter.learningObjectives.slice(0, 3).join('; ')}
- Sections:
${sectionSummaries || '  (none)'}

## Flag Details
- Reason: ${flagReason}
- Severity: ${flagSeverity}

## Course Context
- Course: "${courseContext.courseTitle}"
- Difficulty: ${courseContext.difficulty}
- Total Chapters: ${courseContext.totalChapters}

## Available Healing Strategies
1. "full_regeneration" — Delete everything and regenerate chapter + all sections + details (Stage 1+2+3). Use when the chapter concept/structure is fundamentally wrong.
2. "sections_only" — Keep the chapter metadata (title, bloom's, objectives) but regenerate all sections and details (Stage 2+3). Use when the chapter framing is fine but section content is poor.
3. "details_only" — Keep chapter and section structure, only regenerate section details/descriptions (Stage 3). Use when sections are well-structured but lack depth or have poor descriptions.
4. "targeted_sections" — Regenerate only specific sections by position number. Use when only 1-2 sections are problematic.
5. "skip_healing" — The chapter is actually fine; the flag is a false positive from the rule-based system. Use sparingly.

Respond ONLY with valid JSON:
{
  "type": "<strategy_type>",
  "reasoning": "<1-2 sentence explanation>",
  "targetSections": [1, 3],
  "guidanceForRegeneration": "<optional extra prompt guidance>"
}

For "targetSections", only include if type is "targeted_sections".`;

    const response = await traceAICall(
      { runId, stage: 'heal', chapter: chapter.position, label: `Heal diagnosis Ch${chapter.position}` },
      () => withRetryableTimeout(
        () => runSAMChatWithPreference({
          userId,
          capability: 'analysis',
          messages: [{ role: 'user', content: prompt }],
          systemPrompt: 'You are a JSON-only responder. Output valid JSON with no markdown fences or extra text.',
          maxTokens: 500,
          temperature: 0.3,
        }),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'healDiagnosis',
      ),
    );

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]) as {
      type?: string;
      reasoning?: string;
      targetSections?: number[];
      guidanceForRegeneration?: string;
    };

    const validTypes: HealingStrategyType[] = [
      'full_regeneration', 'sections_only', 'details_only',
      'targeted_sections', 'skip_healing',
    ];

    if (!parsed.type || !validTypes.includes(parsed.type as HealingStrategyType)) {
      return fallback;
    }

    // Validate targeted_sections has actual positions
    if (parsed.type === 'targeted_sections') {
      if (!Array.isArray(parsed.targetSections) || parsed.targetSections.length === 0) {
        return { ...fallback, reasoning: 'AI recommended targeted healing but provided no section positions' };
      }
    }

    return {
      type: parsed.type as HealingStrategyType,
      reasoning: parsed.reasoning ?? 'AI-diagnosed strategy',
      targetSections: parsed.targetSections,
      guidanceForRegeneration: parsed.guidanceForRegeneration,
    };
  } catch (error) {
    logger.warn('[HealingLoop] AI diagnosis failed, falling back to full regeneration', {
      chapter: chapter.position,
      error: error instanceof Error ? error.message : String(error),
    });
    return fallback;
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Filter flagged chapters by severity threshold.
 * 'high' → only high severity
 * 'medium' → high + medium
 * 'low' → all flagged chapters
 */
function filterBySeverity(
  flagged: CourseReflection['flaggedChapters'],
  threshold: 'high' | 'medium' | 'low',
): CourseReflection['flaggedChapters'] {
  switch (threshold) {
    case 'high':
      return flagged.filter(f => f.severity === 'high');
    case 'medium':
      return flagged.filter(f => f.severity === 'high' || f.severity === 'medium');
    case 'low':
      return flagged;
  }
}
