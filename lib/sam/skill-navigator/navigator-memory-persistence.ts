/**
 * NAVIGATOR Memory Persistence
 *
 * Fire-and-forget: persists skill graph, gap analysis, and need profile
 * to SAM memory stores for future reference by the AI tutor.
 */

import { logger } from '@/lib/logger';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
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
    await knowledgeGraph.addNode({
      userId,
      nodeType: 'skill_graph',
      label: `${params.skillName} Skill Graph`,
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

    // 2. Persist gap analysis to SessionContext
    await sessionContext.set(
      userId,
      `navigator_gap_${params.skillName.toLowerCase().replace(/\s+/g, '_')}`,
      {
        skillName: params.skillName,
        gapTable: gapAnalysis.gapTable,
        criticalGaps: gapAnalysis.criticalGaps,
        totalGapHours: gapAnalysis.totalGapHours,
        roadmapId,
        analyzedAt: new Date().toISOString(),
      },
    );

    // 3. Persist need profile to SessionContext
    await sessionContext.set(
      userId,
      `navigator_profile_${params.skillName.toLowerCase().replace(/\s+/g, '_')}`,
      {
        skillName: params.skillName,
        goalDNA: needAnalysis.goalDNA,
        refinedGoal: needAnalysis.refinedGoal,
        goalClassification: needAnalysis.goalClassification,
        fragileKnowledge: skillAudit.fragileKnowledge,
        strengths: skillAudit.strengths,
        roadmapId,
        analyzedAt: new Date().toISOString(),
      },
    );

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
