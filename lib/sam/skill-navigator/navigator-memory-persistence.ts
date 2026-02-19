/**
 * NAVIGATOR Memory Persistence
 *
 * Fire-and-forget: persists skill graph, gap analysis, and need profile
 * to SAM memory stores for future reference by the AI tutor.
 */

import { logger } from '@/lib/logger';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
import { EntityType } from '@sam-ai/agentic';
import type {
  NeedAnalysisResult,
  SkillAuditResult,
  SkillGraph,
  GapAnalysis,
  NavigatorCollectedParams,
} from './agentic-types';

// =============================================================================
// PERSIST TO MEMORY (Fire-and-forget)
// =============================================================================

export function persistNavigatorMemory(
  userId: string,
  params: NavigatorCollectedParams,
  needAnalysis: NeedAnalysisResult,
  skillAudit: SkillAuditResult,
  skillGraph: SkillGraph,
  gapAnalysis: GapAnalysis,
  roadmapId: string,
): void {
  // Fire-and-forget: don't await, don't block the pipeline
  void doPersist(userId, params, needAnalysis, skillAudit, skillGraph, gapAnalysis, roadmapId);
}

async function doPersist(
  userId: string,
  params: NavigatorCollectedParams,
  needAnalysis: NeedAnalysisResult,
  skillAudit: SkillAuditResult,
  skillGraph: SkillGraph,
  gapAnalysis: GapAnalysis,
  roadmapId: string,
): Promise<void> {
  try {
    const { knowledgeGraph, sessionContext } = getMemoryStores();

    // 1. Persist skill graph to KnowledgeGraph
    await knowledgeGraph.createEntity({
      type: EntityType.SKILL,
      name: `${params.skillName} Skill Graph`,
      description: `Skill graph for ${params.skillName} (${params.goalType})`,
      properties: {
        skillName: params.skillName,
        goalType: params.goalType,
        totalNodes: skillGraph.totalNodes,
        criticalPath: skillGraph.criticalPath,
        blockerCount: skillGraph.blockerCount,
        acceleratorCount: skillGraph.acceleratorCount,
        nodes: skillGraph.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          layer: n.layer,
          type: n.type,
        })),
        roadmapId,
        createdAt: new Date().toISOString(),
      },
    });

    // 2. Persist gap analysis + need profile to SessionContext
    const gapKey = `navigator_gap_${params.skillName.toLowerCase().replace(/\s+/g, '_')}`;
    const existing = await sessionContext.get(userId, gapKey);
    if (existing) {
      await sessionContext.update(existing.id, {
        lastActiveAt: new Date(),
        currentState: {
          currentTopic: params.skillName,
          recentConcepts: gapAnalysis.criticalGaps,
          pendingQuestions: [],
          activeArtifacts: [roadmapId],
          sessionCount: 1,
        },
      });
    } else {
      await sessionContext.create({
        userId,
        courseId: gapKey,
        lastActiveAt: new Date(),
        currentState: {
          currentTopic: params.skillName,
          recentConcepts: gapAnalysis.criticalGaps,
          pendingQuestions: [],
          activeArtifacts: [roadmapId],
          sessionCount: 1,
        },
        history: [],
        preferences: {
          learningStyle: 'mixed' as const,
          preferredPace: 'moderate' as const,
          preferredContentTypes: ['text' as const],
          preferredSessionLength: 30,
          notificationPreferences: { enabled: false, channels: [], frequency: 'daily' as const },
          accessibilitySettings: {
            highContrast: false,
            fontSize: 'medium' as const,
            reduceMotion: false,
            screenReaderOptimized: false,
            captionsEnabled: false,
          },
        },
        insights: {
          strengths: skillAudit.strengths,
          weaknesses: gapAnalysis.criticalGaps,
          recommendedTopics: [],
          masteredConcepts: [],
          strugglingConcepts: [],
          averageSessionDuration: 0,
          totalLearningTime: 0,
          completionRate: 0,
          engagementScore: 0,
        },
      });
    }

    logger.info('[NavigatorMemory] Persisted to memory stores', {
      userId,
      skillName: params.skillName,
      roadmapId,
    });
  } catch (error) {
    // Fire-and-forget: log but don't throw
    logger.warn('[NavigatorMemory] Failed to persist (non-blocking)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      skillName: params.skillName,
    });
  }
}
