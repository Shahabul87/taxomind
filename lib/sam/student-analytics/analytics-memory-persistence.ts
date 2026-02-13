/**
 * Memory Persistence for Student Analytics
 *
 * Background persistence (fire-and-forget) for analytics insights.
 * Writes to SAM&apos;s SessionContext and KnowledgeGraph stores without blocking analysis.
 *
 * Uses: getMemoryStores() from TaxomindContext for store access.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
import type {
  BloomsCognitiveMap,
  InterpretiveAnalysis,
  PrescriptionOutput,
} from './agentic-types';

/**
 * Persist analytics insights to SessionContext (fire-and-forget).
 * Does NOT block analytics — errors are logged but swallowed.
 */
export function persistAnalyticsInsightsBackground(
  userId: string,
  cognitiveMap: BloomsCognitiveMap,
  interpretation: InterpretiveAnalysis,
  prescriptions: PrescriptionOutput
): void {
  doPersistInsights(userId, cognitiveMap, interpretation, prescriptions).catch(
    (error) => {
      logger.warn(
        '[StudentAnalyticsMemory] Background insight persistence failed',
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
        }
      );
    }
  );
}

async function doPersistInsights(
  userId: string,
  cognitiveMap: BloomsCognitiveMap,
  interpretation: InterpretiveAnalysis,
  prescriptions: PrescriptionOutput
): Promise<void> {
  const { sessionContext } = getMemoryStores();

  const cacheKey = `student-analytics:${userId}`;

  const insightData = {
    type: 'student-prism-analytics',
    cognitiveCluster: interpretation.cognitiveCluster,
    cognitiveCeiling: cognitiveMap.cognitiveCeiling,
    growthEdge: cognitiveMap.growthEdge,
    velocity: cognitiveMap.velocity,
    cognitiveHealthScore: cognitiveMap.cognitiveHealthScore,
    fragileKnowledgePercentage: cognitiveMap.fragileKnowledgePercentage,
    alertCount: prescriptions.alerts.length,
    prescriptionCount: prescriptions.prescriptions.length,
    keyFinding: interpretation.keyFinding,
    persistedAt: new Date().toISOString(),
  };

  try {
    const existing = await sessionContext.get(userId, cacheKey);

    if (existing) {
      const currentInsights = (existing.insights ?? {}) as Record<
        string,
        unknown
      >;
      await sessionContext.update(existing.id, {
        lastActiveAt: new Date(),
        insights: {
          ...currentInsights,
          prismAnalytics: insightData,
          cognitiveProfile: {
            levelMastery: cognitiveMap.levelMastery,
            ceiling: cognitiveMap.cognitiveCeiling,
            growthEdge: cognitiveMap.growthEdge,
            cluster: interpretation.cognitiveCluster,
          },
        },
      });
    } else {
      await sessionContext.create({
        userId,
        courseId: cacheKey,
        lastActiveAt: new Date(),
        currentState: {
          type: 'student-analytics',
        },
        history: [],
        preferences: {},
        insights: {
          prismAnalytics: insightData,
          cognitiveProfile: {
            levelMastery: cognitiveMap.levelMastery,
            ceiling: cognitiveMap.cognitiveCeiling,
            growthEdge: cognitiveMap.growthEdge,
            cluster: interpretation.cognitiveCluster,
          },
        },
      });
    }

    logger.info('[StudentAnalyticsMemory] Insights persisted', {
      userId,
      cluster: interpretation.cognitiveCluster,
      healthScore: cognitiveMap.cognitiveHealthScore,
    });
  } catch (error) {
    logger.warn('[StudentAnalyticsMemory] SessionContext persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
  }
}

/**
 * Persist cognitive profile to KnowledgeGraph (fire-and-forget).
 * Creates an entity representing the student&apos;s current cognitive state.
 */
export function persistCognitiveProfileBackground(
  userId: string,
  cognitiveMap: BloomsCognitiveMap,
  interpretation: InterpretiveAnalysis
): void {
  doPersistProfile(userId, cognitiveMap, interpretation).catch((error) => {
    logger.warn(
      '[StudentAnalyticsMemory] Background profile persistence failed',
      {
        error: error instanceof Error ? error.message : String(error),
        userId,
      }
    );
  });
}

async function doPersistProfile(
  userId: string,
  cognitiveMap: BloomsCognitiveMap,
  interpretation: InterpretiveAnalysis
): Promise<void> {
  const { knowledgeGraph } = getMemoryStores();

  try {
    const entity = await knowledgeGraph.createEntity({
      type: 'cognitive_profile',
      name: `Student Cognitive Profile - ${interpretation.cognitiveCluster}`,
      description: `PRISM cognitive profile snapshot. Ceiling: ${cognitiveMap.cognitiveCeiling}, Health: ${cognitiveMap.cognitiveHealthScore}/100`,
      properties: {
        userId,
        cluster: interpretation.cognitiveCluster,
        ceiling: cognitiveMap.cognitiveCeiling,
        growthEdge: cognitiveMap.growthEdge,
        velocity: cognitiveMap.velocity,
        healthScore: cognitiveMap.cognitiveHealthScore,
        fragilePercentage: cognitiveMap.fragileKnowledgePercentage,
        snapshotAt: new Date().toISOString(),
      },
    });

    await knowledgeGraph.createRelationship({
      type: 'has_cognitive_profile',
      sourceId: userId,
      targetId: entity.id,
      weight: 1.0,
      properties: {
        snapshotAt: new Date().toISOString(),
        cluster: interpretation.cognitiveCluster,
      },
    });

    logger.info('[StudentAnalyticsMemory] Cognitive profile persisted', {
      userId,
      entityId: entity.id,
    });
  } catch (error) {
    logger.warn('[StudentAnalyticsMemory] KnowledgeGraph persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
  }
}
