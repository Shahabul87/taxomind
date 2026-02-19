/**
 * Knowledge Graph Stage
 *
 * Extracts concepts from the AI response and updates the
 * knowledge graph with entities, relationships, and interactions.
 */

import { logger } from '@/lib/logger';
import {
  extractConceptsFromResponse,
  addConceptsToKnowledgeGraph,
  recordConceptInteraction,
} from '@/lib/sam/services/knowledge-graph-builder';
import type { PipelineContext } from './types';

export async function runKnowledgeGraphStage(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  if (!ctx.responseText) {
    return ctx;
  }

  try {
    const concepts = extractConceptsFromResponse(ctx.responseText, ctx.message);
    if (concepts.length > 0) {
      const courseIdForKg = ctx.pageContext.entityId ?? undefined;
      const kgResult = await addConceptsToKnowledgeGraph(
        ctx.user.id,
        concepts,
        courseIdForKg,
      );
      logger.debug('[SAM_UNIFIED] Knowledge graph updated:', {
        conceptsExtracted: kgResult.conceptsExtracted,
        entitiesCreated: kgResult.entitiesCreated,
        relationshipsCreated: kgResult.relationshipsCreated,
      });

      // Record concept interactions based on quality + orchestration evaluation
      const qualityScore = (ctx.qualityResult as Record<string, unknown> | null)?.overallScore as number | undefined ?? 50;
      const bloomsConfidence = (ctx.bloomsAnalysis as Record<string, unknown> | null)?.confidence as number | undefined ?? 0.5;
      const stepComplete = ctx.orchestrationData?.stepProgress?.stepComplete;
      const stepTitle = ctx.orchestrationData?.currentStep?.title;

      if (stepComplete && stepTitle) {
        // Use quality + blooms confidence to determine mastery level
        if (qualityScore >= 75 && bloomsConfidence >= 0.7) {
          await recordConceptInteraction(ctx.user.id, stepTitle, 'mastered', courseIdForKg);
        } else {
          await recordConceptInteraction(ctx.user.id, stepTitle, 'reviewed', courseIdForKg);
        }
      } else if (
        ctx.orchestrationData?.stepProgress &&
        ctx.orchestrationData.stepProgress.progressPercent < 50 &&
        stepTitle
      ) {
        await recordConceptInteraction(ctx.user.id, stepTitle, 'struggled', courseIdForKg);
      }
    }
  } catch (kgError) {
    logger.warn('[SAM_UNIFIED] Failed to update knowledge graph:', kgError);
  }

  return ctx;
}
