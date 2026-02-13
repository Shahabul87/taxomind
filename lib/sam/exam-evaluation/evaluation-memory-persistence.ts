/**
 * Memory Persistence for Exam Evaluation
 *
 * Background persistence (fire-and-forget) for diagnostic insights and misconceptions.
 * Writes to SAM&apos;s KnowledgeGraph and SessionContext stores without blocking evaluation.
 *
 * Uses: getMemoryStores() from TaxomindContext for store access.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
import type { AnswerDiagnosis, CognitiveProfile, MisconceptionEntry } from './agentic-types';

/**
 * Persist diagnostic insights to the SessionContext store (fire-and-forget).
 * Does NOT block evaluation — errors are logged but swallowed.
 */
export function persistDiagnosticInsightsBackground(
  userId: string,
  attemptId: string,
  diagnoses: AnswerDiagnosis[],
  profile: CognitiveProfile
): void {
  doPersistInsights(userId, attemptId, diagnoses, profile).catch((error) => {
    logger.warn('[EvalMemoryPersistence] Background insight persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      attemptId,
    });
  });
}

async function doPersistInsights(
  userId: string,
  attemptId: string,
  diagnoses: AnswerDiagnosis[],
  profile: CognitiveProfile
): Promise<void> {
  if (diagnoses.length === 0) return;

  const { sessionContext } = getMemoryStores();

  const avgComposite =
    diagnoses.reduce((sum, d) => sum + d.scores.composite, 0) / diagnoses.length;
  const avgGap =
    diagnoses.reduce((sum, d) => sum + Math.abs(d.bloomsGap), 0) / diagnoses.length;

  const insightData = {
    type: 'diagnose-evaluation',
    attemptId,
    totalAnswers: diagnoses.length,
    averageComposite: Math.round(avgComposite * 10) / 10,
    averageBloomsGap: Math.round(avgGap * 10) / 10,
    cognitiveCeiling: profile.cognitiveCeiling,
    growthEdge: profile.growthEdge,
    reasoningDistribution: profile.reasoningPathDistribution,
    strengthCount: profile.strengthMap.length,
    vulnerabilityCount: profile.vulnerabilityMap.length,
    misconceptionCount: profile.misconceptionSummary.length,
    fragileCorrectCount: diagnoses.filter((d) => d.reasoningPath === 'fragile').length,
    persistedAt: new Date().toISOString(),
  };

  try {
    const existing = await sessionContext.get(userId, attemptId);

    if (existing) {
      const currentInsights = (existing.insights ?? {}) as Record<string, unknown>;
      await sessionContext.update(existing.id, {
        lastActiveAt: new Date(),
        insights: {
          ...currentInsights,
          diagnoseEvaluation: insightData,
          cognitiveProfile: {
            bloomsMap: profile.bloomsCognitiveMap,
            ceiling: profile.cognitiveCeiling,
            growthEdge: profile.growthEdge,
          },
        },
      });
    } else {
      await sessionContext.create({
        userId,
        courseId: attemptId, // reuse courseId field for attemptId
        lastActiveAt: new Date(),
        currentState: {
          type: 'exam-evaluation',
          attemptId,
        },
        history: [],
        preferences: {},
        insights: {
          diagnoseEvaluation: insightData,
          cognitiveProfile: {
            bloomsMap: profile.bloomsCognitiveMap,
            ceiling: profile.cognitiveCeiling,
            growthEdge: profile.growthEdge,
          },
        },
      });
    }

    logger.info('[EvalMemoryPersistence] Diagnostic insights persisted', {
      attemptId,
      totalAnswers: diagnoses.length,
      averageComposite: insightData.averageComposite,
    });
  } catch (error) {
    logger.warn('[EvalMemoryPersistence] SessionContext persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      attemptId,
    });
  }
}

/**
 * Persist misconceptions to the KnowledgeGraph store (fire-and-forget).
 * Creates entities for each unique misconception and tracks frequency.
 * Does NOT block evaluation.
 */
export function persistMisconceptionsBackground(
  userId: string,
  attemptId: string,
  misconceptions: MisconceptionEntry[]
): void {
  doPersistMisconceptions(userId, attemptId, misconceptions).catch((error) => {
    logger.warn('[EvalMemoryPersistence] Background misconception persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      attemptId,
    });
  });
}

async function doPersistMisconceptions(
  userId: string,
  attemptId: string,
  misconceptions: MisconceptionEntry[]
): Promise<void> {
  if (misconceptions.length === 0) return;

  const { knowledgeGraph } = getMemoryStores();

  // Deduplicate misconceptions
  const uniqueMisconceptions = new Map<string, { entry: MisconceptionEntry; count: number }>();
  for (const m of misconceptions) {
    const existing = uniqueMisconceptions.get(m.id);
    if (existing) {
      existing.count++;
    } else {
      uniqueMisconceptions.set(m.id, { entry: m, count: 1 });
    }
  }

  const entityIds: string[] = [];

  try {
    for (const [misconceptionId, { entry, count }] of uniqueMisconceptions) {
      const entity = await knowledgeGraph.createEntity({
        type: 'misconception',
        name: entry.name,
        description: `[${misconceptionId}] ${entry.description} (category: ${entry.category})`,
        properties: {
          misconceptionId,
          category: entry.category,
          userId,
          attemptId,
          frequency: count,
          detectedAt: new Date().toISOString(),
        },
      });
      entityIds.push(entity.id);

      // Create relationship: user has_misconception
      await knowledgeGraph.createRelationship({
        type: 'has_misconception',
        sourceId: userId,
        targetId: entity.id,
        weight: Math.min(count / 3, 1.0), // Higher weight for repeated misconceptions
        properties: {
          attemptId,
          frequency: count,
          detectedAt: new Date().toISOString(),
        },
      });
    }

    logger.info('[EvalMemoryPersistence] Misconceptions persisted to KnowledgeGraph', {
      attemptId,
      uniqueCount: uniqueMisconceptions.size,
      totalCount: misconceptions.length,
      entityCount: entityIds.length,
    });
  } catch (error) {
    logger.warn('[EvalMemoryPersistence] KnowledgeGraph misconception persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      attemptId,
    });
  }
}
