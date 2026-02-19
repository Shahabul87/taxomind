/**
 * Agentic Stage
 *
 * Handles confidence scoring, response verification, safety checks,
 * session recording, goal context, skill assessment, and recommendations.
 */

import { logger } from '@/lib/logger';
import { ConfidenceLevel } from '@/lib/sam/agentic-bridge';
import { isFeedbackTextSafe, getFeedbackSuggestions } from '@sam-ai/safety';
import { SAM_FEATURES } from '@/lib/sam/feature-flags';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';
import { toGoalContext, type RecommendationItem, type SkillUpdateData } from '@/lib/sam/agentic-chat/types';
import { bridgeChatSkillToSkillTrack } from '@/lib/sam/cross-feature-bridge';
import type { VerificationResult, SkillAssessment, RecommendationBatch } from '@sam-ai/agentic';
import type { PipelineContext } from './types';

export async function runAgenticStage(
  ctx: PipelineContext,
): Promise<PipelineContext> {
  const { agenticBridge, entityContext, classifiedIntent, bloomsAnalysis } = ctx;
  let responseText = ctx.responseText;
  let responseGated = ctx.responseGated;

  // ========================================================================
  // 1. Confidence Scoring
  // ========================================================================

  let agenticConfidence = ctx.agenticConfidence;
  if (responseText.length > 0) {
    try {
      const confidenceResult = await agenticBridge.scoreConfidence(responseText, {
        topic:
          entityContext.course?.title ||
          entityContext.chapter?.title ||
          entityContext.section?.title,
        responseType: 'explanation',
      });

      agenticConfidence = {
        level: confidenceResult.level,
        score: confidenceResult.overallScore,
        factors: confidenceResult.factors.map((f) => ({
          name: f.type,
          score: f.score,
          weight: f.weight,
        })),
      };

      // Telemetry
      if (SAM_FEATURES.OBSERVABILITY_ENABLED) {
        try {
          const telemetry = getSAMTelemetryService();
          await telemetry.recordConfidencePrediction({
            userId: ctx.user.id,
            sessionId: ctx.sessionId,
            responseId: `resp_${Date.now()}`,
            responseType: 'EXPLANATION',
            predictedConfidence: confidenceResult.overallScore,
            factors: confidenceResult.factors.map((f) => ({
              type: f.type,
              name: f.type,
              weight: f.weight,
              score: f.score,
              contribution: f.weight * f.score,
            })),
          });
        } catch (telemetryError) {
          logger.warn('[SAM_UNIFIED] Confidence telemetry failed:', telemetryError);
        }
      }

      logger.debug('[SAM_UNIFIED] Agentic confidence scored:', {
        level: confidenceResult.level,
        score: confidenceResult.overallScore,
        factorCount: confidenceResult.factors.length,
      });
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Agentic confidence scoring failed:', error);
    }
  }

  // ========================================================================
  // 2. Response Verification
  // ========================================================================

  let verificationResult: VerificationResult | null = null;
  if (responseText.length > 0) {
    try {
      const strictMode = agenticConfidence?.level === ConfidenceLevel.LOW;
      verificationResult = await agenticBridge.verifyResponse(responseText, {
        strictMode,
      });

      const hasCriticalIssues = verificationResult.issues.some(
        (issue) => issue.severity === 'critical' || issue.severity === 'high',
      );

      if (
        hasCriticalIssues ||
        verificationResult.status === 'contradicted' ||
        (verificationResult.status === 'unverified' && (agenticConfidence?.score ?? 0) < 0.6)
      ) {
        responseGated = true;
        responseText = [
          'I want to be careful here because I could not verify parts of that response.',
          'If you can share source material or clarify the exact goal, I can provide a verified answer.',
        ].join(' ');
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Response verification failed:', error);
    }
  }

  // ========================================================================
  // 3. Safety Validation
  // ========================================================================

  let safetyResult: { passed: boolean; suggestions: string[] } | null = null;
  if (responseText.length > 0) {
    try {
      const isSafe = await isFeedbackTextSafe(responseText);
      const suggestions = isSafe ? [] : getFeedbackSuggestions(responseText);

      safetyResult = { passed: isSafe, suggestions };

      if (!isSafe) {
        responseGated = true;
        responseText =
          "I can't provide that response safely. Please rephrase or ask a different question.";
        logger.warn('[SAM_UNIFIED] Safety check flagged issues:', {
          suggestionCount: suggestions.length,
        });
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Safety validation failed:', error);
      safetyResult = { passed: true, suggestions: [] }; // Fail open for availability
    }
  }

  // ========================================================================
  // 4. Session Recording
  // ========================================================================

  let sessionRecorded = false;
  const topicId = ctx.pageContext.entityId || 'unknown';
  const sessionDuration = (Date.now() - ctx.startTime) / 1000;

  try {
    await agenticBridge.recordSession({
      topicId,
      duration: Math.max(1, Math.round(sessionDuration)),
      questionsAnswered: 1,
      correctAnswers: agenticConfidence?.level === 'HIGH' ? 1 : 0,
      conceptsCovered: [
        entityContext.course?.title,
        entityContext.chapter?.title,
        entityContext.section?.title,
      ].filter((t): t is string => !!t),
    });

    sessionRecorded = true;
    logger.debug('[SAM_UNIFIED] Agentic session recorded:', {
      topicId,
      duration: sessionDuration,
    });
  } catch (error) {
    logger.warn('[SAM_UNIFIED] Agentic session recording failed:', error);
  }

  // ========================================================================
  // 5. Goal Context
  // ========================================================================

  let agenticGoalContext: ReturnType<typeof toGoalContext> | null = null;
  if (classifiedIntent.shouldCheckGoals || classifiedIntent.intent !== 'greeting') {
    try {
      const activeGoals = await agenticBridge.getActiveGoals();
      if (activeGoals.length > 0) {
        agenticGoalContext = toGoalContext(activeGoals, ctx.message);
        logger.debug('[SAM_UNIFIED] Goal context built:', {
          activeGoals: activeGoals.length,
          relevantGoal: agenticGoalContext.relevantGoal?.title ?? 'none',
        });
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Goal context retrieval failed:', error);
    }
  }

  // ========================================================================
  // 6. Skill Assessment
  // ========================================================================

  let agenticSkillUpdate: SkillUpdateData | null = null;
  if (bloomsAnalysis && (bloomsAnalysis.dominantLevel as string) && responseText.length > 0) {
    try {
      const topicName =
        entityContext.section?.title ??
        entityContext.chapter?.title ??
        entityContext.course?.title ??
        'general';
      const skillId = topicName.toLowerCase().replace(/\s+/g, '-').slice(0, 50);

      const bloomsScore = Math.round(((bloomsAnalysis.confidence as number) ?? 0.5) * 100);

      const assessment: SkillAssessment = await agenticBridge.assessSkill(
        skillId,
        bloomsScore,
        100,
        'self_assessment',
      );

      agenticSkillUpdate = {
        skillId,
        skillName: topicName,
        previousLevel: assessment.previousLevel ?? 'unknown',
        newLevel: assessment.level,
        score: assessment.score,
        source: 'chat_blooms_analysis',
      };

      logger.debug('[SAM_UNIFIED] Skill assessed from chat:', {
        skillId,
        level: assessment.level,
        score: assessment.score,
      });

      // Cross-feature bridge: forward to SkillBuildTrack for decay prediction
      bridgeChatSkillToSkillTrack({
        userId: ctx.user.id,
        skillId,
        skillName: topicName,
        score: bloomsScore,
        bloomsLevel: bloomsAnalysis.dominantLevel as string,
      }).catch(() => {}); // Already logged internally
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Skill assessment from chat failed:', error);
    }
  }

  // ========================================================================
  // 7. Recommendations
  // ========================================================================

  let agenticRecommendations: RecommendationItem[] | null = null;
  if (classifiedIntent.shouldCheckGoals || classifiedIntent.intent === 'progress_check') {
    try {
      const recBatch: RecommendationBatch = await agenticBridge.getRecommendations({
        availableTime: 30,
      });

      if (recBatch.recommendations.length > 0) {
        const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
          critical: 'high',
          high: 'high',
          medium: 'medium',
          low: 'low',
        };

        agenticRecommendations = recBatch.recommendations.slice(0, 3).map((rec) => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          priority: priorityMap[rec.priority] ?? 'medium',
          estimatedMinutes: rec.estimatedDuration ?? 15,
          skillId: rec.targetSkillId,
        }));

        logger.debug('[SAM_UNIFIED] Recommendations generated:', {
          count: agenticRecommendations.length,
        });
      }
    } catch (error) {
      logger.warn('[SAM_UNIFIED] Recommendation generation failed:', error);
    }
  }

  return {
    ...ctx,
    responseText,
    responseGated,
    agenticConfidence,
    verificationResult,
    safetyResult,
    sessionRecorded,
    agenticGoalContext: agenticGoalContext as Record<string, unknown> | null,
    agenticSkillUpdate,
    agenticRecommendations,
  };
}
