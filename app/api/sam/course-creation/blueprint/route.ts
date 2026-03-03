/**
 * Course Blueprint Generation API — Thin Orchestrator
 *
 * Generates a teacher-reviewable blueprint (chapter titles, section titles,
 * key topics) for Step 4 of the AI course creator wizard.
 *
 * All pipeline logic lives in `lib/sam/course-creation/blueprint/`.
 * This route handles: auth, validation, SSE setup, and orchestration.
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithMetadata, resolveAIModelInfo, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';
import { safeErrorMessage } from '@/lib/api/safe-error';
import { getCategoryEnhancers, blendEnhancers, composeCategoryPrompt } from '@/lib/sam/course-creation/category-prompts';
import { sanitizeCourseContext } from '@/lib/sam/course-creation/helpers';
import {
  reviewBlueprintWithCritic,
  scoreBlueprintQuality,
  buildBlueprintCriticFeedbackBlock,
} from '@/lib/sam/course-creation/blueprint-critic';
import type { BlueprintCritique } from '@/lib/sam/course-creation/blueprint-critic';
import type { CourseContext } from '@/lib/sam/course-creation/types';
import {
  BlueprintRequestSchema,
  computeBloomsDistribution,
  formatBloomsAssignments,
  buildBlueprintPrompts,
  buildNorthStarPrompt,
  parseNorthStarResponse,
  parseBlueprintResponse,
  repairIncompleteChapters,
  fillIncompleteSections,
  computeTimeEstimates,
  computePrerequisiteGraph,
  injectFormativeAssessments,
  buildRuleBasedBlueprintScore,
  buildHeuristicBlueprint,
} from '@/lib/sam/course-creation/blueprint';
import type { BlueprintResponse, NorthStarContext } from '@/lib/sam/course-creation/blueprint';

export const runtime = 'nodejs';
export const maxDuration = 300;

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  // --- Pre-stream validation ---
  const rateLimitResponse = await withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  const user = await currentUser();
  if (!user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const gateResult = await withSubscriptionGate(user.id, { category: 'generation' });
  if (!gateResult.allowed && gateResult.response) return gateResult.response;

  const body = await request.json();
  const parseResult = BlueprintRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parseResult.data;
  const runId = crypto.randomUUID();

  // --- SSE stream ---
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let streamClosed = false;

      function sendSSE(event: string, payload: Record<string, unknown>) {
        if (streamClosed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify({ ...payload, runId })}\n\n`));
        } catch { streamClosed = true; }
      }

      const heartbeat = setInterval(() => {
        if (streamClosed) { clearInterval(heartbeat); return; }
        try { controller.enqueue(encoder.encode(': heartbeat\n\n')); }
        catch { streamClosed = true; clearInterval(heartbeat); }
      }, 10_000);

      request.signal.addEventListener('abort', () => {
        streamClosed = true;
        clearInterval(heartbeat);
      });

      try {
        // =====================================================================
        // STAGE 1: Pre-resolve model
        // =====================================================================
        const { provider: resolvedProvider, model: resolvedModel, isReasoningModel } = await resolveAIModelInfo({
          userId: user.id,
          capability: 'course',
        });

        sendSSE('model-resolved', { provider: resolvedProvider, model: resolvedModel, isReasoningModel });

        // =====================================================================
        // STAGE 2: Prepare prompts
        // =====================================================================
        const matchedEnhancers = getCategoryEnhancers(data.category, data.subcategory);
        const enhancer = matchedEnhancers.length >= 2
          ? blendEnhancers(matchedEnhancers[0], matchedEnhancers[1])
          : matchedEnhancers[0];

        const ctx = sanitizeCourseContext({
          courseTitle: data.courseTitle,
          courseDescription: data.courseShortOverview,
          courseCategory: data.category,
          courseSubcategory: data.subcategory,
          targetAudience: data.targetAudience,
          difficulty: data.difficulty.toLowerCase() as CourseContext['difficulty'],
          courseLearningObjectives: data.courseGoals,
          totalChapters: data.chapterCount,
          sectionsPerChapter: data.sectionsPerChapter,
          bloomsFocus: data.bloomsFocus as CourseContext['bloomsFocus'],
          learningObjectivesPerChapter: 5,
          learningObjectivesPerSection: 3,
        });

        const composed = enhancer ? composeCategoryPrompt(enhancer, undefined, data.subcategory) : null;
        const bloomsDistribution = computeBloomsDistribution(data.bloomsFocus, data.chapterCount);
        const bloomsAssignmentBlock = formatBloomsAssignments(bloomsDistribution);

        const routeStartTime = Date.now();
        const ROUTE_BUDGET_MS = (maxDuration - 10) * 1000;

        // =====================================================================
        // STAGE 2.5: North Star Pass 1 (2-pass split)
        // =====================================================================
        let northStarContext: NorthStarContext | undefined;

        sendSSE('progress', { stage: 'northstar', message: 'Defining course capstone project...', percentage: 5 });

        try {
          const { systemPrompt: nsSystem, userPrompt: nsUser } = buildNorthStarPrompt(ctx, data, composed);
          const nsResult = await runSAMChatWithMetadata({
            userId: user.id,
            capability: 'course',
            messages: [{ role: 'user', content: nsUser }],
            systemPrompt: nsSystem,
            maxTokens: 800,
            temperature: 0.8,
            responseFormat: 'json',
          });

          northStarContext = parseNorthStarResponse(nsResult.content) ?? undefined;

          if (northStarContext) {
            sendSSE('northstar-complete', {
              northStarProject: northStarContext.northStarProject,
              milestoneCount: northStarContext.milestones.length,
            });
            logger.info('[BLUEPRINT_ROUTE] North Star Pass 1 succeeded', {
              runId, northStarProject: northStarContext.northStarProject.slice(0, 100),
              milestones: northStarContext.milestones.length,
            });
          } else {
            logger.warn('[BLUEPRINT_ROUTE] North Star Pass 1 parse failed, falling back to single-pass', { runId });
          }
        } catch (nsError) {
          logger.warn('[BLUEPRINT_ROUTE] North Star Pass 1 failed, falling back to single-pass', {
            runId, error: nsError instanceof Error ? nsError.message : String(nsError),
          });
          // Graceful fallback: proceed without North Star context (single-pass behavior)
        }

        // =====================================================================
        // STAGE 3: Blueprint AI call with timeout
        // =====================================================================
        const { systemPrompt, userPrompt } = buildBlueprintPrompts(
          ctx, data, composed, bloomsAssignmentBlock, isReasoningModel, undefined, northStarContext,
        );
        const totalSections = data.chapterCount * data.sectionsPerChapter;

        const BLUEPRINT_TIMEOUT_MS = isReasoningModel
          ? Math.min(300_000, 120_000 + totalSections * 5000)
          : Math.min(120_000, 45_000 + totalSections * 2500);

        const blueprintMaxTokens = isReasoningModel
          ? Math.min(6144, 2000 + data.chapterCount * 250 + totalSections * 120)
          : Math.min(8192, 2000 + data.chapterCount * 300 + totalSections * 150);

        logger.info('[BLUEPRINT_ROUTE] Strategy', {
          runId, isReasoningModel, model: resolvedModel, timeout: BLUEPRINT_TIMEOUT_MS,
          maxTokens: blueprintMaxTokens, totalSections,
        });

        sendSSE('progress', { stage: 'generating', message: 'Generating course blueprint...', percentage: 10 });

        const aiPromise = runSAMChatWithMetadata({
          userId: user.id,
          capability: 'course',
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt,
          maxTokens: blueprintMaxTokens,
          temperature: isReasoningModel ? 0.5 : 0.6,
          responseFormat: isReasoningModel ? undefined : 'json',
        });

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Blueprint generation timed out')), BLUEPRINT_TIMEOUT_MS);
        });

        let responseText: string;
        const aiStartTime = Date.now();
        try {
          const aiResult = await Promise.race([aiPromise, timeoutPromise]);
          responseText = aiResult.content;
          logger.info('[BLUEPRINT_ROUTE] AI call succeeded', {
            runId, elapsed: `${Date.now() - aiStartTime}ms`, responseLength: responseText.length,
            provider: aiResult.provider, model: aiResult.model,
          });
        } catch (aiError) {
          const errMsg = aiError instanceof Error ? aiError.message : 'Unknown AI error';
          logger.warn('[BLUEPRINT_ROUTE] AI call failed, using heuristic fallback', { runId, error: errMsg });
          const fallback = buildHeuristicBlueprint(data);
          sendSSE('progress', { stage: 'complete', message: 'Blueprint ready (fallback)!', percentage: 100 });
          sendSSE('complete', { success: true, blueprint: fallback });
          clearInterval(heartbeat);
          try { controller.close(); } catch { /* already closed */ }
          return;
        }

        // =====================================================================
        // STAGE 4: Parse + chapter-parsed events
        // =====================================================================
        let blueprint = parseBlueprintResponse(responseText, data, bloomsDistribution);
        if (!blueprint) {
          logger.warn('[BLUEPRINT_ROUTE] Failed to parse AI response, using heuristic', { runId });
          const fallback = buildHeuristicBlueprint(data);
          sendSSE('progress', { stage: 'complete', message: 'Blueprint ready (fallback)!', percentage: 100 });
          sendSSE('complete', { success: true, blueprint: fallback });
          clearInterval(heartbeat);
          try { controller.close(); } catch { /* already closed */ }
          return;
        }

        // Emit chapter-parsed events for progressive frontend rendering
        for (const ch of blueprint.chapters) {
          sendSSE('chapter-parsed', {
            position: ch.position,
            title: ch.title,
            bloomsLevel: ch.bloomsLevel,
            sectionCount: ch.sections.length,
          });
        }

        // =====================================================================
        // STAGE 5: Repair + fill
        // =====================================================================
        sendSSE('progress', { stage: 'repairing', message: 'Refining blueprint quality...', percentage: 50 });

        blueprint = repairIncompleteChapters(blueprint, data);

        const incompleteSections = blueprint.chapters.filter(ch =>
          ch.sections.some(sec => sec.keyTopics.length === 0 || sec.title.startsWith('Section '))
        );
        if (incompleteSections.length > 0) {
          blueprint = fillIncompleteSections(blueprint, data, enhancer?.chapterSequencingAdvice);
        }

        sendSSE('repair-applied', {
          repairedChapters: blueprint.chapters.filter(ch => ch.title !== `Chapter ${ch.position}`).length,
          repairedSections: blueprint.chapters.flatMap(ch => ch.sections).filter(s => !s.title.startsWith('Section ')).length,
        });

        // =====================================================================
        // STAGE 6: Critic review
        // =====================================================================
        sendSSE('progress', { stage: 'reviewing', message: 'Reviewing blueprint quality...', percentage: 60 });

        const elapsedAfterPass1 = Date.now() - routeStartTime;
        const remainingBudget = ROUTE_BUDGET_MS - elapsedAfterPass1;
        const ruleBasedPreScore = buildRuleBasedBlueprintScore(blueprint, ctx, data.courseGoals);
        const preScoreValue = scoreBlueprintQuality(ruleBasedPreScore);
        const CRITIC_THRESHOLD = 80;

        let criticResult: BlueprintCritique | null = null;

        if (remainingBudget < ROUTE_BUDGET_MS * 0.4) {
          criticResult = ruleBasedPreScore;
        } else if (preScoreValue >= CRITIC_THRESHOLD) {
          criticResult = ruleBasedPreScore;
        } else {
          try {
            criticResult = await reviewBlueprintWithCritic({
              userId: user.id, blueprint, courseContext: ctx, courseGoals: data.courseGoals,
            });
          } catch {
            criticResult = ruleBasedPreScore;
          }
        }

        sendSSE('critic-result', {
          verdict: criticResult.verdict,
          score: scoreBlueprintQuality(criticResult),
          confidence: criticResult.confidence,
        });

        // =====================================================================
        // STAGE 7: Conditional retry
        // =====================================================================
        const elapsedAfterCritic = Date.now() - routeStartTime;
        const retryBudget = ROUTE_BUDGET_MS - elapsedAfterCritic;
        const hasTimeForRetry = retryBudget > BLUEPRINT_TIMEOUT_MS * 0.5;

        const originalBlueprint = structuredClone(blueprint);
        let wasRetried = false;

        if (criticResult.verdict === 'revise' && hasTimeForRetry) {
          sendSSE('progress', { stage: 'retrying', message: 'Improving blueprint based on review...', percentage: 70 });

          try {
            const feedbackBlock = buildBlueprintCriticFeedbackBlock(criticResult);
            const { systemPrompt: retrySystem, userPrompt: retryUser } = buildBlueprintPrompts(
              ctx, data, composed, bloomsAssignmentBlock, isReasoningModel, feedbackBlock,
            );

            const retryPromise = runSAMChatWithMetadata({
              userId: user.id,
              capability: 'course',
              messages: [{ role: 'user', content: retryUser }],
              systemPrompt: retrySystem,
              maxTokens: blueprintMaxTokens,
              temperature: isReasoningModel ? 0.5 : 0.6,
              responseFormat: isReasoningModel ? undefined : 'json',
            });

            const retryTimeoutMs = Math.min(BLUEPRINT_TIMEOUT_MS, ROUTE_BUDGET_MS - (Date.now() - routeStartTime) - 5000);
            const retryTimeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Blueprint retry timed out')), Math.max(retryTimeoutMs, 10_000));
            });

            const retryResult = await Promise.race([retryPromise, retryTimeoutPromise]);
            let retryBlueprint = parseBlueprintResponse(retryResult.content, data, bloomsDistribution);

            if (retryBlueprint) {
              retryBlueprint = repairIncompleteChapters(retryBlueprint, data);
              retryBlueprint = fillIncompleteSections(retryBlueprint, data, enhancer?.chapterSequencingAdvice);

              const originalCritique = buildRuleBasedBlueprintScore(blueprint, ctx, data.courseGoals);
              const retryCritique = buildRuleBasedBlueprintScore(retryBlueprint, ctx, data.courseGoals);
              const originalScore = scoreBlueprintQuality(originalCritique);
              const retryScore = scoreBlueprintQuality(retryCritique);

              if (retryScore >= originalScore) {
                blueprint = retryBlueprint;
                wasRetried = true;
                criticResult = {
                  ...criticResult,
                  verdict: retryCritique.verdict,
                  reasoning: `Retry improved blueprint (${originalScore} -> ${retryScore}). ${retryCritique.reasoning}`,
                  objectiveCoverage: retryCritique.objectiveCoverage,
                  topicSequencing: retryCritique.topicSequencing,
                  bloomsProgression: retryCritique.bloomsProgression,
                  scopeCoherence: retryCritique.scopeCoherence,
                  northStarAlignment: retryCritique.northStarAlignment,
                  specificity: retryCritique.specificity,
                  actionableImprovements: retryCritique.actionableImprovements,
                };
              }
            }
          } catch (retryError) {
            logger.warn('[BLUEPRINT_ROUTE] Retry failed, keeping original', {
              runId, error: retryError instanceof Error ? retryError.message : String(retryError),
            });
          }
        }

        // =====================================================================
        // STAGE 8: Post-processing + emit result
        // =====================================================================
        blueprint = computeTimeEstimates(blueprint, data.difficulty);
        blueprint = computePrerequisiteGraph(blueprint);
        blueprint = injectFormativeAssessments(blueprint);

        const criticResponse = criticResult ? {
          verdict: criticResult.verdict,
          score: scoreBlueprintQuality(criticResult),
          confidence: criticResult.confidence,
          reasoning: criticResult.reasoning,
          dimensions: {
            objectiveCoverage: criticResult.objectiveCoverage,
            topicSequencing: criticResult.topicSequencing,
            bloomsProgression: criticResult.bloomsProgression,
            scopeCoherence: criticResult.scopeCoherence,
            northStarAlignment: criticResult.northStarAlignment,
            specificity: criticResult.specificity,
          },
          improvements: criticResult.actionableImprovements,
        } : null;

        sendSSE('progress', { stage: 'complete', message: 'Blueprint ready!', percentage: 100 });
        sendSSE('complete', {
          success: true,
          blueprint,
          critic: criticResponse,
          ...(wasRetried && originalBlueprint ? {
            originalBlueprint,
            wasRetried: true,
          } : {}),
        });

      } catch (error) {
        logger.error('[BLUEPRINT_ROUTE] Error:', {
          runId,
          error: error instanceof Error ? error.message : String(error),
        });
        sendSSE('error', { success: false, error: safeErrorMessage(error) });
      } finally {
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'X-Run-Id': runId,
    },
  });
}
