/**
 * Quality Feedback Loop for Agentic Course Creation
 *
 * Extracts actionable feedback from SAM validation results and custom quality
 * scores, then builds structured prompt blocks that guide retries toward
 * specific improvements instead of blind regeneration.
 *
 * Used INSIDE the retry loop: on each failed attempt, feedback from the
 * previous attempt is injected into the next prompt.
 */

import type { QualityScore } from './types';
import type { SAMValidationResult } from './quality-integration';

// ============================================================================
// Types
// ============================================================================

export interface QualityFeedback {
  /** Critical issues from SAM quality gates */
  criticalIssues: string[];
  /** Pedagogy issues from SAM evaluators */
  pedagogyIssues: string[];
  /** Actionable suggestions from both pipelines */
  suggestions: string[];
  /** Quality dimensions scoring below 60 */
  weakDimensions: string[];
  /** Names of quality gates that failed */
  failedGates: string[];
  /** Score from the previous attempt */
  previousScore: number;
  /** Current attempt number (1-indexed for display) */
  attemptNumber: number;
  /** Reasoning weaknesses from self-critique (Phase 3 integration) */
  reasoningWeaknesses?: string[];
  /** Structured thinking steps that were skipped */
  missingStructure?: string[];
}

// ============================================================================
// Dimension label mapping
// ============================================================================

const DIMENSION_LABELS: Record<keyof Omit<QualityScore, 'overall' | 'stage' | 'chapterNumber' | 'blueprintAlignment'>, string> = {
  uniqueness: 'Uniqueness across course',
  specificity: 'Topic specificity',
  bloomsAlignment: "Bloom's taxonomy alignment",
  completeness: 'Structural completeness',
  depth: 'Content depth',
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Extract structured quality feedback from a failed generation attempt.
 *
 * Combines SAM validation issues with custom quality score weaknesses
 * into a single QualityFeedback object for prompt injection.
 */
export function extractQualityFeedback(
  samResult: SAMValidationResult,
  customScore: QualityScore,
  attemptNumber: number,
): QualityFeedback {
  // Identify weak dimensions (sub-scores below 60)
  const weakDimensions: string[] = [];
  const dimensionKeys: Array<keyof Omit<QualityScore, 'overall' | 'stage' | 'chapterNumber' | 'blueprintAlignment'>> = [
    'uniqueness', 'specificity', 'bloomsAlignment', 'completeness', 'depth',
  ];

  for (const key of dimensionKeys) {
    const value = customScore[key];
    if (value !== undefined && value < 60) {
      weakDimensions.push(`${DIMENSION_LABELS[key]} (${value}/100)`);
    }
  }

  // Surface high-severity safety issues as critical issues so retry prompts address them
  const safetyIssues = (samResult.safetyIssues ?? [])
    .filter(issue => issue.startsWith('[high/'))
    .map(issue => `SAFETY: ${issue}`);

  return {
    criticalIssues: [...safetyIssues, ...samResult.qualityIssues.slice(0, 5)],
    pedagogyIssues: samResult.pedagogyIssues.slice(0, 3),
    suggestions: samResult.suggestions.slice(0, 4),
    weakDimensions,
    failedGates: samResult.failedGates ?? [],
    previousScore: samResult.combinedScore,
    attemptNumber,
  };
}

/**
 * Build a structured prompt block from quality feedback.
 *
 * This block is appended to the user prompt on retry attempts,
 * giving the AI specific, actionable guidance for improvement.
 */
export function buildQualityFeedbackBlock(feedback: QualityFeedback): string {
  const maxRetries = 3; // Display as "Attempt X/3"
  const lines: string[] = [
    `\n## QUALITY FEEDBACK (Attempt ${feedback.attemptNumber}/${maxRetries}, Previous Score: ${feedback.previousScore}/100)`,
    '',
    'Your previous generation did not meet quality standards. Address ALL issues below.',
    '',
  ];

  // Critical issues
  if (feedback.criticalIssues.length > 0) {
    lines.push('### Critical Issues Found:');
    for (const issue of feedback.criticalIssues) {
      lines.push(`- ${issue}`);
    }
    lines.push('');
  }

  // Pedagogy issues
  if (feedback.pedagogyIssues.length > 0) {
    lines.push('### Pedagogy Issues:');
    for (const issue of feedback.pedagogyIssues) {
      lines.push(`- ${issue}`);
    }
    lines.push('');
  }

  // Weak dimensions
  if (feedback.weakDimensions.length > 0) {
    lines.push('### Weak Quality Dimensions:');
    for (const dim of feedback.weakDimensions) {
      lines.push(`- ${dim}`);
    }
    lines.push('');
  }

  // Failed gates
  if (feedback.failedGates.length > 0) {
    lines.push(`### Failed Quality Gates: ${feedback.failedGates.join(', ')}`);
    lines.push('');
  }

  // Reasoning improvements (from Phase 3 self-critique)
  if (feedback.reasoningWeaknesses && feedback.reasoningWeaknesses.length > 0) {
    lines.push('### Reasoning Improvements:');
    for (const weakness of feedback.reasoningWeaknesses) {
      lines.push(`- ${weakness}`);
    }
    lines.push('');
  }

  if (feedback.missingStructure && feedback.missingStructure.length > 0) {
    lines.push('### Missing Structured Thinking Steps:');
    for (const step of feedback.missingStructure) {
      lines.push(`- ${step}`);
    }
    lines.push('');
  }

  // Suggestions
  if (feedback.suggestions.length > 0) {
    lines.push('### Required Improvements:');
    for (let i = 0; i < feedback.suggestions.length; i++) {
      lines.push(`${i + 1}. ${feedback.suggestions[i]}`);
    }
    lines.push('');
  }

  lines.push('IMPORTANT: Address ALL issues above. Do NOT repeat previous content. Generate a substantially improved version.');

  return lines.join('\n');
}
