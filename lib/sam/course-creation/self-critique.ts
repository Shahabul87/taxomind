/**
 * Self-Critique & Reasoning Analysis for Agentic Course Creation
 *
 * Analyzes the AI's "thinking" text and output against the structured
 * thinking steps defined in prompts, WITHOUT making additional AI calls.
 *
 * Pure text analysis:
 * 1. Parses thinking for structured step headers
 * 2. Checks ARROW framework keyword coverage
 * 3. Checks concept tracker references
 * 4. Maps quality score dimensions to identify weak areas
 * 5. Produces actionable improvements for the quality feedback loop
 *
 * Only runs when quality score < QUALITY_RETRY_THRESHOLD. Successful
 * generations skip critique entirely.
 */

import { logger } from '@/lib/logger';
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

// ============================================================================
// Public API
// ============================================================================

/**
 * Analyze a generation result's thinking + output.
 *
 * Pure text analysis — NO additional AI calls.
 * Returns actionable critique for the quality feedback loop.
 */
export function critiqueGeneration(params: {
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

  logger.debug('[SelfCritique] Generation critique complete', {
    stage,
    confidenceScore,
    weakStepsCount: stepAnalysis.weakSteps.length,
    arrowPhasesCovered: arrowCoverage.length,
    shouldRetry,
  });

  return critique;
}

// ============================================================================
// Internal Analysis Functions
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
