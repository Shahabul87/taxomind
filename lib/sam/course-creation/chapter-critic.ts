/**
 * Chapter Critic — Multi-Agent Review for Course Creation
 *
 * Provides a SEPARATE AI persona (reviewer, not creator) that critiques
 * generated chapters. This creates multi-agent collaboration where:
 * - Generator AI produces content
 * - Critic AI evaluates content from an independent perspective
 *
 * The critic checks:
 * - ARROW framework compliance
 * - Bloom's taxonomy alignment
 * - Concept prerequisite flow
 * - Content specificity (not generic)
 * - Overlap with prior chapters
 *
 * Falls back to rule-based approval if AI call fails (graceful degradation).
 * Single call per chapter, 5-second timeout.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import {
  getMultiAgentCoordinator,
  AgentType,
  AgentPriority,
  DecisionType,
} from '@/lib/sam/multi-agent-coordinator';
import type { AgentExecutor } from '@/lib/sam/multi-agent-coordinator';
import type {
  GeneratedChapter,
  CourseContext,
  CompletedChapter,
  ConceptTracker,
} from './types';

// ============================================================================
// Types
// ============================================================================

export type CriticVerdict = 'approve' | 'revise' | 'reject';

export interface ChapterCritique {
  /** Overall verdict */
  verdict: CriticVerdict;
  /** Confidence in the verdict (0-100) */
  confidence: number;
  /** Summary reasoning */
  reasoning: string;
  /** ARROW framework compliance score (0-100) */
  arrowCompliance: number;
  /** Bloom's alignment score (0-100) */
  bloomsAlignment: number;
  /** Concept prerequisite flow score (0-100) */
  conceptFlow: number;
  /** Content specificity score (0-100) */
  specificity: number;
  /** Actionable improvements for revision */
  actionableImprovements: string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Timeout for critic AI call (ms) */
const CRITIC_TIMEOUT_MS = 5000;

/** Minimum confidence to act on a 'revise' verdict */
const MIN_REVISE_CONFIDENCE = 60;

// ============================================================================
// Critic Persona
// ============================================================================

const COURSE_CRITIC_PERSONA = `You are a COURSE QUALITY REVIEWER — a separate expert from the content creator.
Your role is to critically evaluate a generated chapter from an INDEPENDENT perspective.

You are NOT the creator. You are the reviewer. Be honest, specific, and constructive.

## Evaluation Dimensions

1. **ARROW Framework Compliance** (0-100):
   - Does the chapter structure follow Application → Reverse-Engineer → Intuition → Formalization flow?
   - Are there clear hooks, walkthroughs, and practice elements implied by the objectives?
   - Score 80+ if ARROW phases are well-represented in objectives and topics.

2. **Bloom's Alignment** (0-100):
   - Do ALL learning objectives use verbs appropriate for the stated Bloom's level?
   - Is the cognitive complexity consistent across objectives?
   - Score 80+ if objectives clearly match the target Bloom's level.

3. **Concept Prerequisite Flow** (0-100):
   - Do the key topics build on previously covered concepts?
   - Are there any concepts referenced that lack prerequisites?
   - Score 80+ if the concept chain is logical and well-ordered.

4. **Content Specificity** (0-100):
   - Are topics concrete and specific (named technologies, real examples)?
   - Or are they vague and generic ("introduction to concepts")?
   - Score 80+ if topics are clearly actionable and specific.

## Response Format

Return ONLY a JSON object (no markdown, no explanation outside JSON):
{
  "verdict": "approve" | "revise" | "reject",
  "confidence": <0-100>,
  "reasoning": "<2-3 sentence summary>",
  "arrowCompliance": <0-100>,
  "bloomsAlignment": <0-100>,
  "conceptFlow": <0-100>,
  "specificity": <0-100>,
  "actionableImprovements": ["<specific improvement 1>", "<specific improvement 2>"]
}

## Verdict Guidelines

- **approve**: All dimensions >= 70, no critical issues
- **revise**: 1-2 dimensions < 70, or specific improvements would meaningfully enhance quality
- **reject**: Multiple dimensions < 50, fundamentally flawed structure (rare)

Be specific in actionableImprovements — tell the creator exactly what to fix.`;

// ============================================================================
// Public API
// ============================================================================

/**
 * Review a generated chapter with an independent critic AI persona.
 *
 * Makes a single AI call with a 5-second timeout.
 * Falls back to rule-based approval on failure.
 */
export async function reviewChapterWithCritic(params: {
  userId: string;
  chapter: GeneratedChapter;
  courseContext: CourseContext;
  priorChapters: CompletedChapter[];
  conceptTracker: ConceptTracker;
}): Promise<ChapterCritique> {
  const { userId, chapter, courseContext, priorChapters, conceptTracker } = params;

  try {
    const critique = await withTimeout(
      doReviewChapter(userId, chapter, courseContext, priorChapters, conceptTracker),
      CRITIC_TIMEOUT_MS,
    );

    logger.info('[ChapterCritic] Review complete', {
      chapter: chapter.position,
      verdict: critique.verdict,
      confidence: critique.confidence,
      arrowCompliance: critique.arrowCompliance,
      bloomsAlignment: critique.bloomsAlignment,
    });

    return critique;
  } catch (error) {
    logger.warn('[ChapterCritic] AI review failed, using rule-based fallback', {
      chapter: chapter.position,
      error: error instanceof Error ? error.message : String(error),
    });

    return buildRuleBasedCritique(chapter, courseContext, priorChapters, conceptTracker);
  }
}

/**
 * Register the critic as an agent with the MultiAgentCoordinator.
 *
 * This wraps reviewChapterWithCritic as an AgentExecutor for future
 * multi-agent pipeline integration. Not used in the immediate flow
 * but enables coordinator-level orchestration.
 */
export function registerCriticAgent(): void {
  const coordinator = getMultiAgentCoordinator();

  const executor: AgentExecutor = async (input) => {
    const metadata = input.metadata ?? {};
    const chapter = metadata.chapter as GeneratedChapter | undefined;
    const courseContext = metadata.courseContext as CourseContext | undefined;
    const priorChapters = (metadata.priorChapters ?? []) as CompletedChapter[];
    const conceptTracker = metadata.conceptTracker as ConceptTracker | undefined;
    const userId = (metadata.userId ?? '') as string;

    if (!chapter || !courseContext || !conceptTracker) {
      return {
        agentId: 'course-chapter-critic',
        agentType: AgentType.QUALITY,
        decision: DecisionType.DEFER,
        confidence: 0,
        reasoning: 'Missing required metadata for chapter critique',
        executionTimeMs: 0,
        timestamp: new Date(),
      };
    }

    const startTime = Date.now();
    const critique = await reviewChapterWithCritic({
      userId,
      chapter,
      courseContext,
      priorChapters,
      conceptTracker,
    });

    const decision = critique.verdict === 'approve'
      ? DecisionType.APPROVE
      : critique.verdict === 'reject'
        ? DecisionType.REJECT
        : DecisionType.MODIFY;

    return {
      agentId: 'course-chapter-critic',
      agentType: AgentType.QUALITY,
      decision,
      confidence: critique.confidence / 100,
      reasoning: critique.reasoning,
      suggestions: critique.actionableImprovements.map(imp => ({
        text: imp,
        priority: 'high' as const,
        category: 'quality',
      })),
      metadata: {
        arrowCompliance: critique.arrowCompliance,
        bloomsAlignment: critique.bloomsAlignment,
        conceptFlow: critique.conceptFlow,
        specificity: critique.specificity,
      },
      executionTimeMs: Date.now() - startTime,
      timestamp: new Date(),
    };
  };

  coordinator.registerAgent({
    id: 'course-chapter-critic',
    type: AgentType.QUALITY,
    name: 'Course Chapter Critic',
    description: 'Independent reviewer that critiques generated chapters for ARROW compliance, Bloom\'s alignment, concept flow, and specificity',
    priority: AgentPriority.HIGH,
    executor,
  });

  logger.info('[ChapterCritic] Critic agent registered with MultiAgentCoordinator');
}

// ============================================================================
// Internal
// ============================================================================

async function doReviewChapter(
  userId: string,
  chapter: GeneratedChapter,
  courseContext: CourseContext,
  priorChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
): Promise<ChapterCritique> {
  // Build context for the critic
  const priorChapterSummary = priorChapters.length > 0
    ? priorChapters.map(ch =>
      `Ch${ch.position}: "${ch.title}" (${ch.bloomsLevel}) — ${ch.learningObjectives.slice(0, 3).join('; ')}`
    ).join('\n')
    : 'No prior chapters (this is the first chapter)';

  const priorConcepts = Array.from(conceptTracker.concepts.keys()).slice(0, 20);

  const userPrompt = `## Chapter to Review

**Chapter ${chapter.position}: "${chapter.title}"**
- Bloom's Level: ${chapter.bloomsLevel}
- Description: ${chapter.description}
- Learning Objectives:
${chapter.learningObjectives.map(obj => `  - ${obj}`).join('\n')}
- Key Topics: ${chapter.keyTopics.join(', ')}
- Prerequisites: ${chapter.prerequisites || 'None specified'}
- Estimated Time: ${chapter.estimatedTime}

## Course Context

- Title: "${courseContext.courseTitle}"
- Category: ${courseContext.courseCategory}
- Difficulty: ${courseContext.difficulty}
- Target Audience: ${courseContext.targetAudience}
- Total Chapters: ${courseContext.totalChapters}

## Prior Chapters

${priorChapterSummary}

## Concepts Already Covered

${priorConcepts.length > 0 ? priorConcepts.join(', ') : 'None yet (first chapter)'}

Review this chapter and return your critique as JSON.`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt: COURSE_CRITIC_PERSONA,
    maxTokens: 1000,
    temperature: 0.3,
  });

  return parseCriticResponse(responseText, chapter);
}

function parseCriticResponse(responseText: string, chapter: GeneratedChapter): ChapterCritique {
  // Extract JSON from response (may have markdown fences)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in critic response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const verdict = parseVerdict(parsed.verdict);
  const confidence = clamp(Number(parsed.confidence) || 70, 0, 100);
  const arrowCompliance = clamp(Number(parsed.arrowCompliance) || 70, 0, 100);
  const bloomsAlignment = clamp(Number(parsed.bloomsAlignment) || 70, 0, 100);
  const conceptFlow = clamp(Number(parsed.conceptFlow) || 70, 0, 100);
  const specificity = clamp(Number(parsed.specificity) || 70, 0, 100);
  const reasoning = String(parsed.reasoning || `Chapter ${chapter.position} review complete`);
  const actionableImprovements = Array.isArray(parsed.actionableImprovements)
    ? (parsed.actionableImprovements as unknown[]).map(String).slice(0, 5)
    : [];

  // Override: don't act on low-confidence revise verdicts
  const effectiveVerdict = verdict === 'revise' && confidence < MIN_REVISE_CONFIDENCE
    ? 'approve'
    : verdict;

  return {
    verdict: effectiveVerdict,
    confidence,
    reasoning,
    arrowCompliance,
    bloomsAlignment,
    conceptFlow,
    specificity,
    actionableImprovements,
  };
}

function parseVerdict(raw: unknown): CriticVerdict {
  const value = String(raw).toLowerCase().trim();
  if (value === 'approve' || value === 'revise' || value === 'reject') {
    return value;
  }
  return 'approve'; // Default to approve on unparseable verdict
}

/**
 * Rule-based fallback when AI critic is unavailable.
 *
 * Checks basic structural quality without an AI call.
 */
function buildRuleBasedCritique(
  chapter: GeneratedChapter,
  courseContext: CourseContext,
  priorChapters: CompletedChapter[],
  conceptTracker: ConceptTracker,
): ChapterCritique {
  const improvements: string[] = [];
  let arrowCompliance = 75;
  let bloomsAlignment = 75;
  let conceptFlow = 80;
  let specificity = 75;

  // Check learning objectives count
  if (chapter.learningObjectives.length < 3) {
    improvements.push(`Add more learning objectives (currently ${chapter.learningObjectives.length}, recommend 4-6)`);
    bloomsAlignment -= 15;
  }

  // Check key topics count
  if (chapter.keyTopics.length < 2) {
    improvements.push('Add more key topics to ensure comprehensive coverage');
    specificity -= 15;
  }

  // Check for generic titles
  const genericPatterns = /^(introduction|overview|basics|getting started|conclusion)/i;
  if (genericPatterns.test(chapter.title) && chapter.position > 1 && chapter.position < courseContext.totalChapters) {
    improvements.push('Chapter title is too generic — use a more specific, content-rich title');
    specificity -= 10;
  }

  // Check concept overlap with prior chapters
  if (priorChapters.length > 0) {
    const priorTopics = new Set(priorChapters.flatMap(ch => ch.keyTopics.map(t => t.toLowerCase())));
    const overlapping = chapter.keyTopics.filter(t => priorTopics.has(t.toLowerCase()));
    if (overlapping.length > chapter.keyTopics.length * 0.5) {
      improvements.push(`High topic overlap with prior chapters: ${overlapping.join(', ')}`);
      conceptFlow -= 15;
    }
  }

  // Check prerequisites reference
  if (chapter.position > 1 && !chapter.prerequisites) {
    improvements.push('Chapter should reference prerequisites from prior chapters');
    conceptFlow -= 10;
  }

  // Check description length
  if (chapter.description.length < 50) {
    improvements.push('Chapter description is too brief — expand with specific learning context');
    arrowCompliance -= 10;
  }

  const scores = [arrowCompliance, bloomsAlignment, conceptFlow, specificity];
  const allAbove70 = scores.every(s => s >= 70);
  const anyBelow50 = scores.some(s => s < 50);

  const verdict: CriticVerdict = anyBelow50
    ? 'reject'
    : !allAbove70
      ? 'revise'
      : 'approve';

  return {
    verdict: improvements.length === 0 ? 'approve' : verdict,
    confidence: 65, // Rule-based is less confident than AI
    reasoning: improvements.length === 0
      ? `Chapter ${chapter.position} passes basic structural quality checks`
      : `Chapter ${chapter.position} has ${improvements.length} area(s) for improvement`,
    arrowCompliance: clamp(arrowCompliance, 0, 100),
    bloomsAlignment: clamp(bloomsAlignment, 0, 100),
    conceptFlow: clamp(conceptFlow, 0, 100),
    specificity: clamp(specificity, 0, 100),
    actionableImprovements: improvements,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Critic timed out after ${ms}ms`)), ms);
    promise
      .then(result => { clearTimeout(timer); resolve(result); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}
