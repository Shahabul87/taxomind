/**
 * Self-Critique & Reasoning Analysis for Agentic Course Creation
 *
 * Two-tier critique system:
 * 1. AI-powered critique (primary): Uses a fast AI call to semantically evaluate
 *    reasoning quality, ARROW framework depth, and pedagogical reasoning.
 * 2. Rule-based critique (fallback): Pure text analysis when AI is unavailable
 *    or times out. Checks keyword coverage and structured step headers.
 *
 * Only runs when quality score < QUALITY_RETRY_THRESHOLD. Successful
 * generations skip critique entirely.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { runSAMChatWithPreference } from '@/lib/sam/ai-provider';
import type { QualityScore, BloomsLevel, CourseContext, ConceptTracker } from './types';
import type { SAMValidationResult } from './quality-integration';

// ============================================================================
// Types
// ============================================================================

export interface ReasoningAnalysis {
  /** Whether the thinking included structured step headers */
  followedStructuredThinking: boolean;
  /** Steps that were skipped or had shallow content */
  weakSteps: string[];
  /** Whether the thinking referenced prior concepts from ConceptTracker */
  referencedPriorConcepts: boolean;
  /** Which ARROW phases appeared in the thinking */
  arrowPhasesCovered: string[];
}

export interface GenerationCritique {
  /** Analysis of the reasoning process */
  reasoningAnalysis: ReasoningAnalysis;
  /** Top 3 actionable improvements */
  topImprovements: string[];
  /** Confidence score based on reasoning completeness (0-100) */
  confidenceScore: number;
  /** Whether this generation should be retried */
  shouldRetry: boolean;
}

// ============================================================================
// Constants
// ============================================================================

/** Structured thinking steps expected per stage */
const EXPECTED_STEPS: Record<1 | 2 | 3, string[]> = {
  1: [
    'ARROW ARC',
    'REVERSE ENGINEER',
    'TOPIC SELECTION',
    'LEARNING ARC',
    "BLOOM'S INTEGRATION",
    'CONCEPT TRACKING',
  ],
  2: [
    'ARROW SECTION FLOW',
    'TOPIC SELECTION',
    'CONTENT TYPE',
    'COGNITIVE LOAD',
    'UNIQUENESS',
    'OBJECTIVE ALIGNMENT',
  ],
  3: [
    'LESSON CONTENT',
    'LEARNING OBJECTIVES',
    'KEY CONCEPTS',
    'ARROW ASSESSMENT',
  ],
};

/** ARROW framework phases to check for */
const ARROW_PHASES = [
  'application',
  'reverse.?engineer',
  'intuition',
  'formali[sz]',
  'failure',
  'design',
  'constraint',
  'build',
  'socratic',
  'meta.?cognition',
  'knowledge.?graph',
];

/** Minimum thinking length (chars) per step to consider it non-shallow */
const MIN_STEP_DEPTH = 30;

/** Timeout for AI critique call (ms) */
const AI_CRITIQUE_TIMEOUT_MS = 6_000;

/** Max chars of thinking text to send to AI critique (token efficiency) */
const MAX_THINKING_CHARS = 1500;

/** Max chars of output text to send to AI critique */
const MAX_OUTPUT_CHARS = 800;

// ============================================================================
// AI Critique Persona
// ============================================================================

const SELF_CRITIQUE_PERSONA = `You are a REASONING QUALITY EVALUATOR for an AI course generator.

Your job: evaluate HOW WELL the generator reasoned through the task, not the final content quality (that's scored separately).

## What to Evaluate

1. **Structured Thinking Quality**: Did the generator follow the expected thinking steps? Were steps superficial or genuinely analytical?
2. **ARROW Framework Depth**: Did reasoning engage with ARROW phases (Application, Reverse-Engineer, Intuition, Formalization, Failure Analysis) substantively, or just mention keywords?
3. **Pedagogical Reasoning**: Did the generator reason about learner cognition, prerequisite flow, Bloom's alignment, and concept progression — or just produce content?

## Response Format

Return ONLY JSON (no markdown fences):
{
  "weakSteps": ["<step that was shallow or missing>", ...],
  "topImprovements": ["<specific actionable improvement>", ...],
  "confidenceScore": <0-100>,
  "shouldRetry": <true|false>
}

- weakSteps: max 3, name the specific thinking step that was weak
- topImprovements: max 3, concrete and actionable (not vague)
- confidenceScore: your confidence in the reasoning quality (NOT content quality)
- shouldRetry: true if reasoning was superficial enough to warrant re-generation

Be concise. Focus on reasoning process, not content.`;

// ============================================================================
// Public API
// ============================================================================

/**
 * Analyze a generation result's thinking + output.
 *
 * Tries AI-powered critique first (6s timeout), falls back to rule-based.
 * Returns actionable critique for the quality feedback loop.
 */
export async function critiqueGeneration(params: {
  thinking: string;
  output: string;
  stage: 1 | 2 | 3;
  bloomsLevel: BloomsLevel;
  courseContext: CourseContext;
  qualityScore: QualityScore;
  samResult: SAMValidationResult;
  conceptTracker?: ConceptTracker;
  userId?: string;
  runId?: string;
}): Promise<GenerationCritique> {
  const { thinking, output, stage, bloomsLevel, courseContext, qualityScore, samResult, conceptTracker, userId, runId } = params;

  // Try AI-powered critique if userId is available
  if (userId) {
    try {
      const aiCritique = await withTimeout(
        doAICritique(userId, thinking, output, stage, bloomsLevel, qualityScore, runId),
        AI_CRITIQUE_TIMEOUT_MS,
      );

      logger.debug('[SelfCritique] AI critique complete', {
        stage,
        confidenceScore: aiCritique.confidenceScore,
        weakStepsCount: aiCritique.reasoningAnalysis.weakSteps.length,
        shouldRetry: aiCritique.shouldRetry,
        source: 'ai',
      });

      return aiCritique;
    } catch (error) {
      logger.warn('[SelfCritique] AI critique failed, using rule-based fallback', {
        stage,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Fallback to rule-based critique
  return critiqueGenerationRuleBased({ thinking, output, stage, bloomsLevel, courseContext, qualityScore, samResult, conceptTracker });
}

// ============================================================================
// AI-Powered Critique
// ============================================================================

async function doAICritique(
  userId: string,
  thinking: string,
  output: string,
  stage: 1 | 2 | 3,
  bloomsLevel: BloomsLevel,
  qualityScore: QualityScore,
  runId?: string,
): Promise<GenerationCritique> {
  // Truncate inputs for token efficiency
  const truncatedThinking = thinking.length > MAX_THINKING_CHARS
    ? thinking.slice(0, MAX_THINKING_CHARS) + '...[truncated]'
    : thinking;
  const truncatedOutput = output.length > MAX_OUTPUT_CHARS
    ? output.slice(0, MAX_OUTPUT_CHARS) + '...[truncated]'
    : output;

  const expectedSteps = EXPECTED_STEPS[stage];

  const userPrompt = `## Generation to Critique

**Stage**: ${stage} | **Bloom's Level**: ${bloomsLevel}
**Quality Score**: overall=${qualityScore.overall}, blooms=${qualityScore.bloomsAlignment}, specificity=${qualityScore.specificity}, depth=${qualityScore.depth}

**Expected Thinking Steps**: ${expectedSteps.join(', ')}

### Generator's Thinking:
${truncatedThinking || '(no thinking captured)'}

### Generator's Output Summary:
${truncatedOutput || '(no output captured)'}

Evaluate the reasoning quality and return your critique as JSON.`;

  const responseText = await runSAMChatWithPreference({
    userId,
    capability: 'analysis',
    messages: [{ role: 'user', content: userPrompt }],
    systemPrompt: SELF_CRITIQUE_PERSONA,
    maxTokens: 600,
    temperature: 0.3,
  });

  if (runId) {
    logger.debug('[SelfCritique] AI call traced', { runId, stage });
  }

  return parseAICritiqueResponse(responseText, qualityScore);
}

function parseAICritiqueResponse(responseText: string, qualityScore: QualityScore): GenerationCritique {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI critique response');
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const weakSteps = Array.isArray(parsed.weakSteps)
    ? (parsed.weakSteps as unknown[]).map(String).slice(0, 3)
    : [];

  const topImprovements = Array.isArray(parsed.topImprovements)
    ? (parsed.topImprovements as unknown[]).map(String).slice(0, 3)
    : [];

  const confidenceScore = Math.max(0, Math.min(100, Number(parsed.confidenceScore) || 50));
  const shouldRetry = parsed.shouldRetry === true || confidenceScore < 50 || qualityScore.overall < 55;

  return {
    reasoningAnalysis: {
      followedStructuredThinking: weakSteps.length <= 1,
      weakSteps,
      referencedPriorConcepts: false, // AI critique doesn't track this
      arrowPhasesCovered: [], // AI critique evaluates holistically instead
    },
    topImprovements,
    confidenceScore,
    shouldRetry,
  };
}

// ============================================================================
// Rule-Based Critique (Fallback)
// ============================================================================

/**
 * Rule-based critique: Pure text analysis without AI calls.
 * Used as fallback when AI critique is unavailable.
 */
function critiqueGenerationRuleBased(params: {
  thinking: string;
  output: string;
  stage: 1 | 2 | 3;
  bloomsLevel: BloomsLevel;
  courseContext: CourseContext;
  qualityScore: QualityScore;
  samResult: SAMValidationResult;
  conceptTracker?: ConceptTracker;
}): GenerationCritique {
  const { thinking, output, stage, bloomsLevel, qualityScore, samResult, conceptTracker } = params;

  // 1. Analyze structured thinking steps
  const expectedSteps = EXPECTED_STEPS[stage];
  const stepAnalysis = analyzeStructuredSteps(thinking, expectedSteps);

  // 2. Check ARROW phase coverage
  const arrowCoverage = analyzeArrowCoverage(thinking + ' ' + output);

  // 3. Check concept references
  const referencedPriorConcepts = conceptTracker
    ? checkConceptReferences(thinking, conceptTracker)
    : false;

  // 4. Build reasoning analysis
  const reasoningAnalysis: ReasoningAnalysis = {
    followedStructuredThinking: stepAnalysis.followedStructure,
    weakSteps: stepAnalysis.weakSteps,
    referencedPriorConcepts,
    arrowPhasesCovered: arrowCoverage,
  };

  // 5. Build top improvements
  const topImprovements = buildImprovements(
    stepAnalysis,
    arrowCoverage,
    qualityScore,
    samResult,
    bloomsLevel,
    stage,
  );

  // 6. Calculate confidence score
  const confidenceScore = calculateConfidence(
    stepAnalysis,
    arrowCoverage,
    qualityScore,
  );

  // 7. Determine if retry is recommended
  const shouldRetry = confidenceScore < 50 || qualityScore.overall < 55;

  const critique: GenerationCritique = {
    reasoningAnalysis,
    topImprovements: topImprovements.slice(0, 3),
    confidenceScore,
    shouldRetry,
  };

  logger.debug('[SelfCritique] Rule-based critique complete', {
    stage,
    confidenceScore,
    weakStepsCount: stepAnalysis.weakSteps.length,
    arrowPhasesCovered: arrowCoverage.length,
    shouldRetry,
    source: 'rule-based',
  });

  return critique;
}

// ============================================================================
// Internal Analysis Functions (used by rule-based fallback)
// ============================================================================

interface StepAnalysis {
  followedStructure: boolean;
  weakSteps: string[];
  coveredSteps: string[];
  totalExpected: number;
}

function analyzeStructuredSteps(thinking: string, expectedSteps: string[]): StepAnalysis {
  const normalizedThinking = thinking.toLowerCase();
  const coveredSteps: string[] = [];
  const weakSteps: string[] = [];

  for (const step of expectedSteps) {
    const stepLower = step.toLowerCase();
    // Check if step header appears in thinking
    const stepPatterns = [
      `step \\d+.*${stepLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      stepLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    ];

    let found = false;
    for (const pattern of stepPatterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(normalizedThinking)) {
        found = true;
        break;
      }
    }

    if (found) {
      // Check depth: find the content after this step header
      const stepIdx = normalizedThinking.indexOf(stepLower);
      if (stepIdx >= 0) {
        // Get content between this step and the next step (or end)
        const afterStep = normalizedThinking.substring(stepIdx + stepLower.length);
        const nextStepMatch = afterStep.match(/step \d+/i);
        const contentLength = nextStepMatch
          ? afterStep.indexOf(nextStepMatch[0])
          : afterStep.length;

        if (contentLength < MIN_STEP_DEPTH) {
          weakSteps.push(`"${step}" was mentioned but lacked depth (too brief)`);
        } else {
          coveredSteps.push(step);
        }
      } else {
        coveredSteps.push(step);
      }
    } else {
      weakSteps.push(`"${step}" was not addressed in the reasoning`);
    }
  }

  return {
    followedStructure: coveredSteps.length >= expectedSteps.length * 0.6,
    weakSteps,
    coveredSteps,
    totalExpected: expectedSteps.length,
  };
}

function analyzeArrowCoverage(text: string): string[] {
  const normalizedText = text.toLowerCase();
  const covered: string[] = [];

  const phaseNames = [
    'Application', 'Reverse Engineer', 'Intuition', 'Formalization',
    'Failure Analysis', 'Design Thinking', 'Constraint', 'Build & Iterate',
    'Socratic Defense', 'Meta-Cognition', 'Knowledge Graph',
  ];

  for (let i = 0; i < ARROW_PHASES.length; i++) {
    const regex = new RegExp(ARROW_PHASES[i], 'i');
    if (regex.test(normalizedText)) {
      covered.push(phaseNames[i]);
    }
  }

  return covered;
}

function checkConceptReferences(thinking: string, conceptTracker: ConceptTracker): boolean {
  if (conceptTracker.concepts.size === 0) return true; // No concepts to reference yet

  const normalizedThinking = thinking.toLowerCase();
  let referencedCount = 0;

  for (const conceptName of conceptTracker.concepts.keys()) {
    if (normalizedThinking.includes(conceptName.toLowerCase())) {
      referencedCount++;
    }
  }

  // Referenced if at least 20% of prior concepts were mentioned
  return referencedCount >= Math.max(1, Math.floor(conceptTracker.concepts.size * 0.2));
}

function buildImprovements(
  stepAnalysis: StepAnalysis,
  arrowCoverage: string[],
  qualityScore: QualityScore,
  samResult: SAMValidationResult,
  bloomsLevel: BloomsLevel,
  stage: 1 | 2 | 3,
): string[] {
  const improvements: string[] = [];

  // Missing structured thinking steps
  const missingSteps = stepAnalysis.weakSteps.filter(s => s.includes('was not addressed'));
  if (missingSteps.length > 0) {
    improvements.push(
      `Your reasoning skipped ${missingSteps.length} structured thinking step(s): ${missingSteps.map(s => s.split('"')[1]).join(', ')}`,
    );
  }

  // Low ARROW coverage for Stage 1/2
  if (stage <= 2 && arrowCoverage.length < 3) {
    const missing = ['Application', 'Intuition', 'Failure Analysis']
      .filter(p => !arrowCoverage.includes(p));
    if (missing.length > 0) {
      improvements.push(
        `ARROW phases not addressed: ${missing.join(', ')} — include these in your reasoning`,
      );
    }
  }

  // Bloom's alignment issues
  if (qualityScore.bloomsAlignment < 60) {
    improvements.push(
      `Bloom's alignment is weak (${qualityScore.bloomsAlignment}/100). Ensure ALL learning objectives use ${bloomsLevel}-level verbs`,
    );
  }

  // Specificity issues
  if (qualityScore.specificity < 60) {
    improvements.push(
      'Content is too generic. Use specific examples, named technologies, concrete scenarios instead of vague descriptions',
    );
  }

  // Depth issues
  if (qualityScore.depth < 60) {
    improvements.push(
      'Content lacks depth. Add more detailed explanations, worked examples, and nuanced discussion',
    );
  }

  // SAM-reported issues (top priority)
  if (samResult.qualityIssues.length > 0) {
    improvements.unshift(samResult.qualityIssues[0]);
  }

  return improvements;
}

function calculateConfidence(
  stepAnalysis: StepAnalysis,
  arrowCoverage: string[],
  qualityScore: QualityScore,
): number {
  let score = 0;

  // Structured thinking coverage (0-30 points)
  const stepCoverage = stepAnalysis.coveredSteps.length / stepAnalysis.totalExpected;
  score += Math.round(stepCoverage * 30);

  // ARROW coverage (0-20 points)
  const arrowScore = Math.min(arrowCoverage.length / 5, 1);
  score += Math.round(arrowScore * 20);

  // Quality score contribution (0-50 points)
  score += Math.round((qualityScore.overall / 100) * 50);

  return Math.min(100, Math.max(0, score));
}

// ============================================================================
// Helpers
// ============================================================================

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Self-critique timed out after ${ms}ms`)), ms);
    promise
      .then(result => { clearTimeout(timer); resolve(result); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}
