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

      // Record concept interactions based on orchestration evaluation
      if (
        ctx.orchestrationData?.stepProgress?.stepComplete &&
        ctx.orchestrationData.currentStep?.title
      ) {
        await recordConceptInteraction(
          ctx.user.id,
          ctx.orchestrationData.currentStep.title,
          'mastered',
          courseIdForKg,
        );
      } else if (
        ctx.orchestrationData?.stepProgress &&
        ctx.orchestrationData.stepProgress.progressPercent < 50
      ) {
        if (ctx.orchestrationData.currentStep?.title) {
          await recordConceptInteraction(
            ctx.user.id,
            ctx.orchestrationData.currentStep.title,
            'struggled',
            courseIdForKg,
          );
        }
      }
    }
  } catch (kgError) {
    logger.warn('[SAM_UNIFIED] Failed to update knowledge graph:', kgError);
  }

  return ctx;
}
