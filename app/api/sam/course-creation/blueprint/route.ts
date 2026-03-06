/**
 * Course Blueprint Generation API — Skill-Enhanced Single-Call
 *
 * Generates a teacher-reviewable blueprint (chapter titles, section titles,
 * key topics) for Step 2 of the AI course creator wizard.
 *
 * Architecture:
 *   1. Load difficulty template (pedagogical principles + structural rules)
 *   2. Load domain skill (category-specific teaching methodology, sequencing, quality criteria)
 *   3. Compose system prompt = template + domain skill + Bloom's assignments
 *   4. ONE AI call → parse + post-process (repair, fill, time estimates, prerequisites, assessments, scoring)
 */

import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { runSAMChatWithMetadata, resolveAIModelInfo, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';
import { safeErrorMessage } from '@/lib/api/safe-error';
import { getNonReasoningCounterpart } from '@/lib/sam/providers/ai-registry';
import { scoreBlueprintQuality } from '@/lib/sam/course-creation/blueprint-critic';
import {
  BlueprintRequestSchema,
  computeBloomsDistribution,
  formatBloomsAssignments,
  parseBlueprintResponse,
  repairIncompleteChapters,
  fillIncompleteSections,
  computeTimeEstimates,
  computePrerequisiteGraph,
  injectFormativeAssessments,
  buildRuleBasedBlueprintScore,
  buildHeuristicBlueprint,
} from '@/lib/sam/course-creation/blueprint';
import { buildTemplateSystemPrompt } from '@/lib/sam/course-creation/templates';
import { buildCourseUserPrompt } from '@/lib/sam/course-creation/templates/user-prompt';
import {
  getCategoryEnhancers,
  blendEnhancers,
  composeCategoryPrompt,
} from '@/lib/sam/course-creation/category-prompts';
import type { CourseContext } from '@/lib/sam/course-creation/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
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
        // STAGE 1: Prepare — model, blooms, template prompt, user prompt
        // =====================================================================
        const { provider: resolvedProvider, model: resolvedModel, isReasoningModel } = await resolveAIModelInfo({
          userId: user.id,
          capability: 'course',
        });

        // Use non-reasoning counterpart for blueprint generation (content structuring
        // doesn't benefit from chain-of-thought reasoning, and it's 3-5x faster).
        const effectiveModel = isReasoningModel
          ? getNonReasoningCounterpart(resolvedModel)
          : undefined; // undefined = use default resolved model

        sendSSE('model-resolved', { provider: resolvedProvider, model: effectiveModel ?? resolvedModel, isReasoningModel });

        const bloomsDistribution = computeBloomsDistribution(data.bloomsFocus, data.chapterCount);
        const bloomsAssignmentBlock = formatBloomsAssignments(bloomsDistribution);
        const difficulty = data.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

        // Load domain-specific skill for this course category
        const matchedEnhancers = getCategoryEnhancers(data.category, data.subcategory);
        const categoryEnhancer = matchedEnhancers.length > 1
          ? blendEnhancers(matchedEnhancers[0], matchedEnhancers[1])
          : matchedEnhancers[0];
        const composed = composeCategoryPrompt(categoryEnhancer, undefined, data.subcategory);

        sendSSE('skill-loaded', {
          categoryId: categoryEnhancer.categoryId,
          displayName: categoryEnhancer.displayName,
          tokenEstimate: composed.tokenEstimate.total,
        });

        const systemPrompt = buildTemplateSystemPrompt(difficulty, bloomsAssignmentBlock, composed);
        const userPrompt = buildCourseUserPrompt(data);

        const totalSections = data.chapterCount * data.sectionsPerChapter;
        const blueprintMaxTokens = Math.min(8192, 2000 + data.chapterCount * 300 + totalSections * 150);
        const BLUEPRINT_TIMEOUT_MS = Math.min(180_000, 60_000 + totalSections * 3000);

        logger.info('[BLUEPRINT_ROUTE] Skill-enhanced generation', {
          runId, difficulty, model: effectiveModel ?? resolvedModel,
          skill: categoryEnhancer.categoryId,
          skillTokens: composed.tokenEstimate.total,
          chapterCount: data.chapterCount, totalSections,
          maxTokens: blueprintMaxTokens, timeout: BLUEPRINT_TIMEOUT_MS,
        });

        // =====================================================================
        // STAGE 2: Single AI Call
        // =====================================================================
        sendSSE('progress', { stage: 'generating', message: 'Generating course blueprint...', percentage: 10 });

        const aiPromise = runSAMChatWithMetadata({
          userId: user.id,
          capability: 'course',
          messages: [{ role: 'user', content: userPrompt }],
          systemPrompt,
          maxTokens: blueprintMaxTokens,
          temperature: 0.6,
          responseFormat: 'json',
          model: effectiveModel,
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
          const errStack = aiError instanceof Error ? aiError.stack : undefined;
          logger.warn('[BLUEPRINT_ROUTE] AI call failed, using heuristic fallback', { runId, error: errMsg, stack: errStack });
          sendSSE('ai-error', { error: errMsg });
          const fallback = buildHeuristicBlueprint(data);
          sendSSE('progress', { stage: 'complete', message: 'Blueprint ready (fallback)!', percentage: 100 });
          sendSSE('complete', { success: true, blueprint: fallback });
          clearInterval(heartbeat);
          try { controller.close(); } catch { /* already closed */ }
          return;
        }

        // =====================================================================
        // STAGE 3: Parse + Post-process
        // =====================================================================
        sendSSE('progress', { stage: 'parsing', message: 'Refining blueprint structure...', percentage: 60 });

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

        // Repair + fill
        blueprint = repairIncompleteChapters(blueprint, data);

        const incompleteSections = blueprint.chapters.filter(ch =>
          ch.sections.some(sec => sec.keyTopics.length === 0 || sec.title.startsWith('Section '))
        );
        if (incompleteSections.length > 0) {
          blueprint = fillIncompleteSections(blueprint, data);
        }

        // Post-processing enrichment
        blueprint = computeTimeEstimates(blueprint, data.difficulty);
        blueprint = computePrerequisiteGraph(blueprint);
        blueprint = injectFormativeAssessments(blueprint);

        // Rule-based score for frontend display
        const ctx: CourseContext = {
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
        };

        const criticResult = buildRuleBasedBlueprintScore(blueprint, ctx, data.courseGoals);
        const criticResponse = {
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
        };

        sendSSE('critic-result', {
          verdict: criticResult.verdict,
          score: scoreBlueprintQuality(criticResult),
          confidence: criticResult.confidence,
        });

        sendSSE('progress', { stage: 'complete', message: 'Blueprint ready!', percentage: 100 });
        sendSSE('complete', {
          success: true,
          blueprint,
          critic: criticResponse,
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
  } catch (error) {
    console.error('[BLUEPRINT_ROUTE] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
