/**
 * Agentic Depth Analysis - Memory Persistence
 *
 * Fire-and-forget background persistence to SAM memory stores.
 * Caller does NOT await these functions — they run in the background.
 *
 * Follows the exact pattern from course-creation/memory-persistence.ts.
 */

import { logger } from '@/lib/logger';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
import type {
  ChapterAnalysisResult,
  AnalysisIssue,
  BloomsDistribution,
  AnalysisMemoryContext,
} from './types';

// =============================================================================
// PERSIST QUALITY PATTERNS (fire-and-forget)
// =============================================================================

/**
 * Persists quality findings to KnowledgeGraph.
 * Called after each chapter analysis completes.
 * NEVER awaited by caller — fire-and-forget.
 */
export function persistQualityPatternsBackground(
  userId: string,
  courseId: string,
  chapterResult: ChapterAnalysisResult,
  courseCategory: string
): void {
  doPersistQualityPatterns(userId, courseId, chapterResult, courseCategory).catch(error => {
    logger.warn('[AnalysisMemory] Background quality pattern persistence failed', {
      userId, courseId, chapterNumber: chapterResult.chapterNumber, error,
    });
  });
}

async function doPersistQualityPatterns(
  userId: string,
  courseId: string,
  chapterResult: ChapterAnalysisResult,
  courseCategory: string
): Promise<void> {
  const { knowledgeGraph } = getMemoryStores();

  // Persist Bloom's distribution as a quality pattern entity
  const distributionEntity = await knowledgeGraph.createEntity({
    type: 'quality-pattern',
    name: `blooms-dist-${courseId}-ch${chapterResult.chapterNumber}`,
    properties: {
      userId,
      courseId,
      courseCategory,
      chapterNumber: chapterResult.chapterNumber,
      bloomsDistribution: chapterResult.bloomsDistribution,
      overallScore: chapterResult.overallScore,
      cognitiveScore: chapterResult.cognitiveScore,
      pedagogicalScore: chapterResult.pedagogicalScore,
      analyzedAt: new Date().toISOString(),
    },
  });

  // Persist issue patterns for cross-analysis learning
  const issuesByType = new Map<string, number>();
  for (const issue of chapterResult.issues) {
    issuesByType.set(issue.type, (issuesByType.get(issue.type) ?? 0) + 1);
  }

  if (issuesByType.size > 0) {
    await knowledgeGraph.createEntity({
      type: 'issue-pattern',
      name: `issue-pattern-${courseId}-ch${chapterResult.chapterNumber}`,
      properties: {
        userId,
        courseId,
        courseCategory,
        chapterNumber: chapterResult.chapterNumber,
        issueDistribution: Object.fromEntries(issuesByType),
        totalIssues: chapterResult.issues.length,
        criticalCount: chapterResult.issues.filter(i => i.severity === 'CRITICAL').length,
        analyzedAt: new Date().toISOString(),
      },
    });

    // Create relationship between quality pattern and issue pattern
    if (distributionEntity?.id) {
      await knowledgeGraph.createRelationship({
        sourceId: distributionEntity.id,
        targetId: distributionEntity.id, // self-link for now
        type: 'has_issues',
        properties: {
          issueCount: chapterResult.issues.length,
          courseCategory,
        },
      }).catch(() => {
        // Relationship creation is best-effort
      });
    }
  }

  logger.info('[AnalysisMemory] Quality patterns persisted', {
    courseId,
    chapterNumber: chapterResult.chapterNumber,
    issueTypes: issuesByType.size,
  });
}

// =============================================================================
// PERSIST ANALYSIS SCORES (fire-and-forget)
// =============================================================================

/**
 * Persists analysis scores to SessionContext for tracking over time.
 * Called after each chapter stage completes.
 * NEVER awaited by caller — fire-and-forget.
 */
export function persistAnalysisScoresBackground(
  userId: string,
  courseId: string,
  overallScore: number,
  dimensionScores: Record<string, number>,
  bloomsAggregation: BloomsDistribution
): void {
  doPersistAnalysisScores(userId, courseId, overallScore, dimensionScores, bloomsAggregation).catch(error => {
    logger.warn('[AnalysisMemory] Background score persistence failed', {
      userId, courseId, error,
    });
  });
}

async function doPersistAnalysisScores(
  userId: string,
  courseId: string,
  overallScore: number,
  dimensionScores: Record<string, number>,
  bloomsAggregation: BloomsDistribution
): Promise<void> {
  const { sessionContext } = getMemoryStores();

  await sessionContext.create({
    userId,
    courseId,
    type: 'depth-analysis-score',
    insights: {
      overallScore,
      dimensionScores,
      bloomsAggregation,
      recordedAt: new Date().toISOString(),
    },
  });
}

// =============================================================================
// RECALL ANALYSIS MEMORY
// =============================================================================

/**
 * Recalls prior analysis context for a course.
 * This IS awaited (with timeout) — it provides context for AI prompts.
 */
export async function recallAnalysisMemory(
  userId: string,
  courseId: string,
  _courseCategory: string,
  timeoutMs: number = 3000
): Promise<AnalysisMemoryContext> {
  const defaultContext: AnalysisMemoryContext = {
    priorIssues: [],
    priorScores: null,
    teachingStyle: null,
    categoryPatterns: null,
  };

  try {
    const result = await Promise.race([
      doRecallMemory(userId, courseId),
      new Promise<AnalysisMemoryContext>((resolve) =>
        setTimeout(() => resolve(defaultContext), timeoutMs)
      ),
    ]);
    return result;
  } catch (error) {
    logger.warn('[AnalysisMemory] Memory recall failed, using defaults', { userId, courseId, error });
    return defaultContext;
  }
}

async function doRecallMemory(
  userId: string,
  courseId: string
): Promise<AnalysisMemoryContext> {
  const { knowledgeGraph, sessionContext } = getMemoryStores();

  // Recall prior scores for this course
  let priorScores: AnalysisMemoryContext['priorScores'] = null;
  try {
    const sessions = await sessionContext.findByUser(userId, {
      type: 'depth-analysis-score',
      courseId,
      limit: 1,
    });
    if (sessions.length > 0) {
      const latest = sessions[0];
      const insights = latest.insights as Record<string, unknown>;
      priorScores = {
        overallScore: (insights.overallScore as number) ?? 0,
        dimensionScores: (insights.dimensionScores as Record<string, number>) ?? {},
        analysisDate: (insights.recordedAt as string) ?? '',
      };
    }
  } catch {
    // Best effort
  }

  // Recall teaching style from quality patterns
  let teachingStyle: AnalysisMemoryContext['teachingStyle'] = null;
  try {
    const patterns = await knowledgeGraph.findEntities({
      type: 'quality-pattern',
      properties: { userId },
      limit: 20,
    });
    if (patterns.length >= 3) {
      // Aggregate Bloom's distributions across courses
      const allDistributions = patterns
        .map(p => (p.properties as Record<string, unknown>).bloomsDistribution)
        .filter(Boolean) as BloomsDistribution[];

      if (allDistributions.length > 0) {
        const avgDepth = patterns.reduce((sum, p) =>
          sum + ((p.properties as Record<string, unknown>).cognitiveScore as number ?? 0), 0
        ) / patterns.length;

        // Find common gaps (low Bloom's levels across courses)
        const gaps: string[] = [];
        const avgBlooms: Record<string, number> = {};
        const levels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;
        for (const level of levels) {
          const avg = allDistributions.reduce((sum, d) => sum + (d[level] ?? 0), 0) / allDistributions.length;
          avgBlooms[level] = avg;
          if (level === 'EVALUATE' && avg < 10) gaps.push('Low evaluation-level content');
          if (level === 'CREATE' && avg < 5) gaps.push('Low creation-level activities');
        }

        // Find preferred levels (above 20%)
        const preferred = levels.filter(l => (avgBlooms[l] ?? 0) > 20);

        teachingStyle = {
          preferredBloomsLevels: preferred,
          averageContentDepth: avgDepth,
          commonGaps: gaps,
        };
      }
    }
  } catch {
    // Best effort
  }

  return {
    priorIssues: [], // Loaded from DB in orchestrator, not memory stores
    priorScores,
    teachingStyle,
    categoryPatterns: null, // TODO: aggregate category patterns
  };
}
