/**
 * Memory Persistence for Creator Analytics
 *
 * Background persistence (fire-and-forget) for creator analytics results.
 * Writes to TeacherInsights and PredictiveLearningAnalysis without blocking.
 *
 * Uses: direct Prisma writes + getMemoryStores() from TaxomindContext.
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
import type {
  CohortCognitiveAnalysis,
  CreatorPrescriptions,
  RootCauseAnalysis,
} from './agentic-types';

/**
 * Persist creator analytics to TeacherInsights (fire-and-forget).
 */
export function persistCreatorInsightsBackground(
  teacherId: string,
  courseId: string,
  cohortAnalysis: CohortCognitiveAnalysis,
  prescriptions: CreatorPrescriptions
): void {
  doPersistInsights(teacherId, courseId, cohortAnalysis, prescriptions).catch(
    (error) => {
      logger.warn(
        '[CreatorAnalyticsMemory] Background insight persistence failed',
        {
          error: error instanceof Error ? error.message : String(error),
          teacherId,
          courseId,
        }
      );
    }
  );
}

async function doPersistInsights(
  teacherId: string,
  courseId: string,
  cohortAnalysis: CohortCognitiveAnalysis,
  prescriptions: CreatorPrescriptions
): Promise<void> {
  try {
    await db.teacherInsights.create({
      data: {
        id: `ti-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        teacherId,
        courseId,
        insightType: 'prism-creator-analytics',
        data: {
          cohortHealthScore: cohortAnalysis.cohortHealthScore,
          isBimodal: cohortAnalysis.isBimodal,
          velocity: cohortAnalysis.cohortVelocity,
          fragileAlarm: cohortAnalysis.fragileKnowledgeAlarm,
          dropoutRisk: cohortAnalysis.dropoutRisk,
          engagementDistribution: cohortAnalysis.engagementDistribution,
          prescriptionCount: prescriptions.prescriptions.length,
          topPrescription: prescriptions.prescriptions[0]?.title ?? null,
          analyzedAt: new Date().toISOString(),
        },
        recommendations: {
          prescriptions: prescriptions.prescriptions.map((p) => ({
            priority: p.priority,
            title: p.title,
            roi: p.roi,
            effort: p.effortLevel,
            impact: p.expectedImpact,
          })),
          assessmentRedesign: prescriptions.assessmentRedesign,
          cohortSplittingStrategy: prescriptions.cohortSplittingStrategy,
        },
        priority: prescriptions.prescriptions.length > 0
          ? prescriptions.prescriptions[0].priority
          : 5,
        actionable: prescriptions.prescriptions.length > 0,
      },
    });

    logger.info('[CreatorAnalyticsMemory] TeacherInsights persisted', {
      teacherId,
      courseId,
      prescriptionCount: prescriptions.prescriptions.length,
    });
  } catch (error) {
    logger.warn('[CreatorAnalyticsMemory] TeacherInsights persistence failed', {
      error: error instanceof Error ? error.message : String(error),
      teacherId,
      courseId,
    });
  }
}

/**
 * Persist predictions to PredictiveLearningAnalysis (fire-and-forget).
 */
export function persistPredictionsBackground(
  userId: string,
  courseId: string,
  rootCauseAnalysis: RootCauseAnalysis,
  cohortAnalysis: CohortCognitiveAnalysis
): void {
  doPersistPredictions(userId, courseId, rootCauseAnalysis, cohortAnalysis).catch(
    (error) => {
      logger.warn(
        '[CreatorAnalyticsMemory] Background predictions persistence failed',
        {
          error: error instanceof Error ? error.message : String(error),
          userId,
          courseId,
        }
      );
    }
  );
}

async function doPersistPredictions(
  userId: string,
  courseId: string,
  rootCauseAnalysis: RootCauseAnalysis,
  cohortAnalysis: CohortCognitiveAnalysis
): Promise<void> {
  try {
    await db.predictiveLearningAnalysis.create({
      data: {
        id: `pla-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId,
        courseId,
        predictionType: 'prism-cohort-trajectory',
        predictionData: {
          trajectory: rootCauseAnalysis.cohortTrajectory,
          dropoutPredictions: rootCauseAnalysis.dropoutPredictions,
          rootCauseSummary: rootCauseAnalysis.rootCauses.map((rc) => ({
            category: rc.category,
            rootCause: rc.rootCause,
            confidence: rc.confidence,
          })),
          cohortHealthScore: cohortAnalysis.cohortHealthScore,
          atRiskCount: cohortAnalysis.dropoutRisk.totalAtRisk,
          analyzedAt: new Date().toISOString(),
        },
        confidence: rootCauseAnalysis.rootCauses.length > 0
          ? rootCauseAnalysis.rootCauses[0].confidence
          : 0.5,
      },
    });

    logger.info('[CreatorAnalyticsMemory] Predictions persisted', {
      courseId,
      rootCauseCount: rootCauseAnalysis.rootCauses.length,
    });
  } catch (error) {
    logger.warn(
      '[CreatorAnalyticsMemory] PredictiveLearningAnalysis persistence failed',
      {
        error: error instanceof Error ? error.message : String(error),
        courseId,
      }
    );
  }
}

/**
 * Persist to SessionContext for caching (fire-and-forget).
 */
export function persistAnalyticsCacheBackground(
  userId: string,
  courseId: string,
  healthScore: number
): void {
  doPeristCache(userId, courseId, healthScore).catch((error) => {
    logger.warn(
      '[CreatorAnalyticsMemory] Cache persistence failed',
      {
        error: error instanceof Error ? error.message : String(error),
      }
    );
  });
}

async function doPeristCache(
  userId: string,
  courseId: string,
  healthScore: number
): Promise<void> {
  const { sessionContext } = getMemoryStores();
  const cacheKey = `creator-analytics:${userId}:${courseId}`;

  try {
    const existing = await sessionContext.get(userId, cacheKey);
    if (existing) {
      const currentInsights = (existing.insights ?? {}) as Record<string, unknown>;
      await sessionContext.update(existing.id, {
        lastActiveAt: new Date(),
        insights: {
          ...currentInsights,
          creatorPrismAnalytics: {
            courseId,
            cohortHealthScore: healthScore,
            analyzedAt: new Date().toISOString(),
          },
        },
      });
    } else {
      await sessionContext.create({
        userId,
        courseId: cacheKey,
        lastActiveAt: new Date(),
        currentState: { type: 'creator-analytics' },
        history: [],
        preferences: {},
        insights: {
          creatorPrismAnalytics: {
            courseId,
            cohortHealthScore: healthScore,
            analyzedAt: new Date().toISOString(),
          },
        },
      });
    }
  } catch (error) {
    logger.warn('[CreatorAnalyticsMemory] SessionContext cache failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
