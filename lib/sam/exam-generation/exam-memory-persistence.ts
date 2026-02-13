/**
 * Memory Persistence for Exam Creation
 *
 * Background persistence (fire-and-forget) for exam concepts and quality scores.
 * Writes to SAM&apos;s KnowledgeGraph and SessionContext stores without blocking generation.
 *
 * Uses: getMemoryStores() from TaxomindContext for store access.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
import type { DecomposedConcept, ExamQualityScore } from './agentic-types';

/**
 * Persist exam concepts to the KnowledgeGraph store (fire-and-forget).
 * Does NOT block exam generation — errors are logged but swallowed.
 */
export function persistExamConceptsBackground(
  userId: string,
  examId: string,
  concepts: DecomposedConcept[],
  stage: number
): void {
  doPersistConcepts(userId, examId, concepts, stage).catch((error) => {
    logger.warn('[ExamMemoryPersistence] Background concept persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      examId,
      stage,
    });
  });
}

async function doPersistConcepts(
  userId: string,
  examId: string,
  concepts: DecomposedConcept[],
  stage: number
): Promise<void> {
  if (concepts.length === 0) return;

  const { knowledgeGraph } = getMemoryStores();
  const entityIds: string[] = [];

  try {
    for (const concept of concepts) {
      const entity = await knowledgeGraph.createEntity({
        type: 'exam-concept',
        name: concept.name,
        description: `${concept.description} (${concept.importance} concept for exam)`,
        properties: {
          examId,
          userId,
          importance: concept.importance,
          misconceptions: concept.commonMisconceptions,
          persistedAtStage: stage,
        },
      });
      entityIds.push(entity.id);
    }

    // Build prerequisite edges between concepts
    for (let i = 0; i < concepts.length; i++) {
      for (const prereqName of concepts[i].prerequisites) {
        const prereqIdx = concepts.findIndex((c) => c.name === prereqName);
        if (prereqIdx >= 0 && entityIds[prereqIdx] && entityIds[i]) {
          await knowledgeGraph.createRelationship({
            type: 'prerequisite_for',
            sourceId: entityIds[prereqIdx],
            targetId: entityIds[i],
            weight: 1.0,
            properties: { examId, stage },
          });
        }
      }
    }

    logger.info('[ExamMemoryPersistence] Concepts persisted to KnowledgeGraph', {
      examId,
      stage,
      entityCount: entityIds.length,
    });
  } catch (error) {
    logger.warn('[ExamMemoryPersistence] KnowledgeGraph persistence partial failure', {
      error: error instanceof Error ? error.message : String(error),
      examId,
      stage,
    });
  }
}

/**
 * Persist exam quality scores to session context (fire-and-forget).
 * Does NOT block exam generation.
 */
export function persistExamQualityBackground(
  userId: string,
  examId: string,
  scores: ExamQualityScore[],
  stage: number
): void {
  doPersistQuality(userId, examId, scores, stage).catch((error) => {
    logger.warn(
      '[ExamMemoryPersistence] Background quality score persistence failed',
      {
        error: error instanceof Error ? error.message : String(error),
        userId,
        examId,
        stage,
      }
    );
  });
}

async function doPersistQuality(
  userId: string,
  examId: string,
  scores: ExamQualityScore[],
  stage: number
): Promise<void> {
  if (scores.length === 0) return;

  const { sessionContext } = getMemoryStores();

  const avgScore = Math.round(
    scores.reduce((sum, s) => sum + s.overall, 0) / scores.length
  );

  try {
    const existing = await sessionContext.get(userId, examId);

    const qualityData = {
      scoreCount: scores.length,
      averageScore: avgScore,
      scores: scores.map((s) => ({
        bloomsAlignment: s.bloomsAlignment,
        clarity: s.clarity,
        distractorQuality: s.distractorQuality,
        diagnosticValue: s.diagnosticValue,
        cognitiveRigor: s.cognitiveRigor,
        overall: s.overall,
      })),
      persistedAt: new Date().toISOString(),
    };

    if (existing) {
      const currentInsights = (existing.insights ?? {}) as Record<
        string,
        unknown
      >;
      await sessionContext.update(existing.id, {
        lastActiveAt: new Date(),
        insights: {
          ...currentInsights,
          [`stage${stage}Quality`]: qualityData,
        },
      });
    } else {
      await sessionContext.create({
        userId,
        courseId: examId, // reuse courseId field for examId
        lastActiveAt: new Date(),
        currentState: {
          type: 'exam-creation',
          examId,
          stage,
        },
        history: [],
        preferences: {},
        insights: {
          [`stage${stage}Quality`]: qualityData,
        },
      });
    }

    logger.info(
      '[ExamMemoryPersistence] Quality scores persisted to session context',
      {
        examId,
        stage,
        scoreCount: scores.length,
        averageScore: avgScore,
      }
    );
  } catch (error) {
    logger.warn('[ExamMemoryPersistence] Session context persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      examId,
      stage,
    });
  }
}
