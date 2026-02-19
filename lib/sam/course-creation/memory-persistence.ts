/**
 * Memory Persistence for Course Creation
 *
 * Background persistence (fire-and-forget) for course concepts and quality scores.
 * Writes to SAM's KnowledgeGraph and sessionContext stores without blocking generation.
 *
 * Uses: getMemoryStores() from TaxomindContext for store access.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
import type { LearningInsights } from '@sam-ai/agentic';
import type { ConceptTracker, QualityScore } from './types';

/**
 * Persist concepts from a completed stage to the KnowledgeGraph store (fire-and-forget).
 * Does NOT block course generation — errors are logged but swallowed.
 */
export function persistConceptsBackground(
  userId: string,
  courseId: string,
  conceptTracker: ConceptTracker,
  stage: number,
  courseTitle?: string,
  courseCategory?: string,
): void {
  // Fire and forget — don't await
  doPersistConcepts(userId, courseId, conceptTracker, stage, courseTitle, courseCategory).catch(error => {
    logger.warn('[MemoryPersistence] Background concept persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      courseId,
      stage,
    });
  });
}

async function doPersistConcepts(
  userId: string,
  courseId: string,
  conceptTracker: ConceptTracker,
  stage: number,
  courseTitle?: string,
  courseCategory?: string,
): Promise<void> {
  const { knowledgeGraph } = getMemoryStores();

  // Convert concept tracker entries to knowledge graph entities
  const concepts = Array.from(conceptTracker.concepts.entries());
  if (concepts.length === 0) return;

  // Store entity IDs for building relationships
  const entityIds: string[] = [];

  try {
    // Create knowledge graph entities for each concept
    for (const [name, entry] of concepts) {
      const entity = await knowledgeGraph.createEntity({
        type: 'concept',
        name,
        description: `Concept introduced in chapter ${entry.introducedInChapter}${
          entry.introducedInSection ? `, section ${entry.introducedInSection}` : ''
        } at ${entry.bloomsLevel} level`,
        properties: {
          courseId,
          userId,
          introducedInChapter: entry.introducedInChapter,
          introducedInSection: entry.introducedInSection,
          bloomsLevel: entry.bloomsLevel,
          persistedAtStage: stage,
          ...(courseTitle ? { courseTitle } : {}),
          ...(courseCategory ? { courseCategory } : {}),
        },
      });
      entityIds.push(entity.id);
    }

    // Build edges between sequential concepts (curriculum flow)
    const sortedConcepts = concepts.sort(
      (a, b) => a[1].introducedInChapter - b[1].introducedInChapter
    );

    for (let i = 1; i < sortedConcepts.length && i < entityIds.length; i++) {
      await knowledgeGraph.createRelationship({
        type: 'prerequisite_of',
        sourceId: entityIds[i - 1],
        targetId: entityIds[i],
        weight: 1.0,
        properties: {
          courseId,
          stage,
        },
      });
    }

    logger.info('[MemoryPersistence] Concepts persisted to KnowledgeGraph', {
      courseId,
      stage,
      entityCount: entityIds.length,
      edgeCount: Math.max(0, entityIds.length - 1),
    });
  } catch (error) {
    logger.warn('[MemoryPersistence] KnowledgeGraph persistence partial failure', {
      error: error instanceof Error ? error.message : String(error),
      courseId,
      stage,
    });
  }
}

/**
 * Persist quality scores from a completed stage to session context (fire-and-forget).
 * Does NOT block course generation.
 */
export function persistQualityScoresBackground(
  userId: string,
  courseId: string,
  scores: QualityScore[],
  stage: number
): void {
  doPersistQualityScores(userId, courseId, scores, stage).catch(error => {
    logger.warn('[MemoryPersistence] Background quality score persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      courseId,
      stage,
    });
  });
}

async function doPersistQualityScores(
  userId: string,
  courseId: string,
  scores: QualityScore[],
  stage: number
): Promise<void> {
  if (scores.length === 0) return;

  const { sessionContext } = getMemoryStores();

  const avgScore = Math.round(
    scores.reduce((sum, s) => sum + s.overall, 0) / scores.length
  );

  try {
    // Check if a session context already exists for this course creation
    const existing = await sessionContext.get(userId, courseId);

    if (existing) {
      // Update existing session context with new stage scores
      const currentInsights = existing.insights as unknown as Record<string, unknown>;
      await sessionContext.update(existing.id, {
        lastActiveAt: new Date(),
        insights: {
          ...existing.insights,
          ...currentInsights,
          [`stage${stage}Quality`]: {
            scoreCount: scores.length,
            averageScore: avgScore,
            scores: scores.map(s => ({
              completeness: s.completeness,
              specificity: s.specificity,
              bloomsAlignment: s.bloomsAlignment,
              uniqueness: s.uniqueness,
              depth: s.depth,
              overall: s.overall,
            })),
            persistedAt: new Date().toISOString(),
          },
        } as unknown as LearningInsights,
      });
    } else {
      // Create new session context
      await sessionContext.create({
        userId,
        courseId,
        lastActiveAt: new Date(),
        currentState: {
          currentTopic: 'course-creation',
          currentGoal: courseId,
          recentConcepts: [],
          pendingQuestions: [],
          activeArtifacts: [],
          sessionCount: 1,
        },
        history: [],
        preferences: {
          learningStyle: 'mixed',
          preferredPace: 'moderate',
          preferredContentTypes: [],
          preferredSessionLength: 30,
          notificationPreferences: {
            enabled: false,
            channels: [],
            frequency: 'daily',
          },
          accessibilitySettings: {
            fontSize: 'medium',
            highContrast: false,
            reduceMotion: false,
            screenReaderOptimized: false,
            captionsEnabled: false,
          },
        },
        insights: {
          strengths: [],
          weaknesses: [],
          recommendedTopics: [],
          masteredConcepts: [],
          strugglingConcepts: [],
          averageSessionDuration: 0,
          totalLearningTime: 0,
          completionRate: 0,
          engagementScore: 0,
          [`stage${stage}Quality`]: {
            scoreCount: scores.length,
            averageScore: avgScore,
            scores: scores.map(s => ({
              completeness: s.completeness,
              specificity: s.specificity,
              bloomsAlignment: s.bloomsAlignment,
              uniqueness: s.uniqueness,
              depth: s.depth,
              overall: s.overall,
            })),
            persistedAt: new Date().toISOString(),
          },
        } as unknown as LearningInsights,
      });
    }

    logger.info('[MemoryPersistence] Quality scores persisted to session context', {
      courseId,
      stage,
      scoreCount: scores.length,
      averageScore: avgScore,
    });
  } catch (error) {
    logger.warn('[MemoryPersistence] Session context persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      courseId,
      stage,
    });
  }
}
