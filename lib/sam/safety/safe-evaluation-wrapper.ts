/**
 * Safe Evaluation Wrapper
 *
 * Integrates safety validation into the evaluation pipeline.
 * Wraps AI-generated feedback with safety checks and auto-correction.
 */

import type { EvaluationFeedback, SafetyResult } from './types';
import {
  FairnessSafetyValidator,
  createFairnessSafetyValidator,
  createStrictFairnessValidator,
} from './fairness-validator';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Evaluation result from AI (matches SubjectiveEvaluationResult structure)
 */
export interface AIEvaluationResult {
  score: number;
  maxScore: number;
  accuracy?: number;
  completeness?: number;
  relevance?: number;
  depth?: number;
  feedback: string;
  strengths?: string[];
  improvements?: string[];
  nextSteps?: string[];
  demonstratedBloomsLevel?: string;
  misconceptions?: string[];
}

/**
 * Safe evaluation result with safety validation
 */
export interface SafeEvaluationResult extends AIEvaluationResult {
  safetyValidation: {
    passed: boolean;
    score: number;
    issueCount: number;
    wasRewritten: boolean;
    originalFeedback?: string;
    issues?: Array<{
      type: string;
      severity: string;
      description: string;
    }>;
  };
}

/**
 * Configuration for safe evaluation wrapper
 */
export interface SafeEvaluationWrapperConfig {
  /**
   * Enable automatic rewriting of unsafe feedback
   * @default true
   */
  autoRewrite?: boolean;

  /**
   * Use strict validation (higher standards)
   * @default false
   */
  strictMode?: boolean;

  /**
   * Target grade level for readability
   * @default 8
   */
  targetGradeLevel?: number;

  /**
   * Skip safety validation (for testing only)
   * @default false
   */
  skipValidation?: boolean;

  /**
   * Log safety validation results
   * @default true
   */
  logResults?: boolean;

  /**
   * Custom validator instance
   */
  validator?: FairnessSafetyValidator;
}

// ============================================================================
// SAFE EVALUATION WRAPPER
// ============================================================================

/**
 * Safe Evaluation Wrapper
 * Ensures all AI-generated feedback passes safety checks
 */
export class SafeEvaluationWrapper {
  private readonly validator: FairnessSafetyValidator;
  private readonly config: Required<Omit<SafeEvaluationWrapperConfig, 'validator'>>;

  constructor(config: SafeEvaluationWrapperConfig = {}) {
    this.config = {
      autoRewrite: config.autoRewrite ?? true,
      strictMode: config.strictMode ?? false,
      targetGradeLevel: config.targetGradeLevel ?? 8,
      skipValidation: config.skipValidation ?? false,
      logResults: config.logResults ?? true,
    };

    this.validator =
      config.validator ??
      (config.strictMode
        ? createStrictFairnessValidator({ targetGradeLevel: this.config.targetGradeLevel })
        : createFairnessSafetyValidator({ targetGradeLevel: this.config.targetGradeLevel }));
  }

  /**
   * Wrap an AI evaluation result with safety validation
   */
  async wrapEvaluation(
    evaluation: AIEvaluationResult,
    evaluationId?: string
  ): Promise<SafeEvaluationResult> {
    if (this.config.skipValidation) {
      return {
        ...evaluation,
        safetyValidation: {
          passed: true,
          score: 100,
          issueCount: 0,
          wasRewritten: false,
        },
      };
    }

    // Convert to EvaluationFeedback format
    const feedback: EvaluationFeedback = {
      id: evaluationId ?? `eval-${Date.now()}`,
      text: evaluation.feedback,
      score: evaluation.score,
      maxScore: evaluation.maxScore,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      targetGradeLevel: this.config.targetGradeLevel,
    };

    // Run safety validation
    const safetyResult = await this.validator.validateFeedback(feedback);

    if (this.config.logResults) {
      this.logSafetyResult(evaluationId, safetyResult);
    }

    // If passed, return as-is
    if (safetyResult.passed) {
      return {
        ...evaluation,
        safetyValidation: {
          passed: true,
          score: safetyResult.score,
          issueCount: safetyResult.issues.length,
          wasRewritten: false,
        },
      };
    }

    // If failed and auto-rewrite is enabled, attempt to fix
    if (this.config.autoRewrite) {
      const rewrittenFeedback = this.validator.rewriteFeedback(feedback);
      const improvements = this.validator.suggestImprovements(feedback);

      return {
        ...evaluation,
        feedback: rewrittenFeedback.text,
        strengths: this.ensurePositiveStrengths(evaluation.strengths),
        improvements: this.ensureConstructiveImprovements(evaluation.improvements),
        safetyValidation: {
          passed: false,
          score: safetyResult.score,
          issueCount: safetyResult.issues.length,
          wasRewritten: true,
          originalFeedback: evaluation.feedback,
          issues: safetyResult.issues.map((issue) => ({
            type: issue.type,
            severity: issue.severity,
            description: issue.description,
          })),
        },
      };
    }

    // Return with issues flagged
    return {
      ...evaluation,
      safetyValidation: {
        passed: false,
        score: safetyResult.score,
        issueCount: safetyResult.issues.length,
        wasRewritten: false,
        issues: safetyResult.issues.map((issue) => ({
          type: issue.type,
          severity: issue.severity,
          description: issue.description,
        })),
      },
    };
  }

  /**
   * Quick check if feedback is safe (without full result)
   */
  async isSafe(feedback: string): Promise<boolean> {
    if (this.config.skipValidation) {
      return true;
    }

    const result = await this.validator.quickValidate({
      id: 'quick-check',
      text: feedback,
      score: 0,
      maxScore: 100,
    });

    return result.passed;
  }

  /**
   * Get improvement suggestions for feedback
   */
  getSuggestions(feedback: string): string[] {
    return this.validator.suggestImprovements({
      id: 'suggestion-check',
      text: feedback,
      score: 0,
      maxScore: 100,
    });
  }

  /**
   * Ensure strengths are positively framed
   */
  private ensurePositiveStrengths(strengths?: string[]): string[] {
    if (!strengths || strengths.length === 0) {
      return ['Shows effort in attempting the question'];
    }

    return strengths.map((s) => {
      // Ensure strength doesn't contain negative language
      if (s.toLowerCase().includes('but') || s.toLowerCase().includes('however')) {
        return s.split(/\s+but\s+|\s+however\s+/i)[0].trim();
      }
      return s;
    });
  }

  /**
   * Ensure improvements are constructively framed
   */
  private ensureConstructiveImprovements(improvements?: string[]): string[] {
    if (!improvements || improvements.length === 0) {
      return [];
    }

    const constructiveStarters = [
      'Consider',
      'Try',
      'You might',
      'One way to improve is',
      'A helpful approach would be',
    ];

    return improvements.map((imp) => {
      // Check if already constructively framed
      const lowerImp = imp.toLowerCase();
      if (
        lowerImp.startsWith('consider') ||
        lowerImp.startsWith('try') ||
        lowerImp.startsWith('you might') ||
        lowerImp.startsWith('one way') ||
        lowerImp.startsWith('a helpful')
      ) {
        return imp;
      }

      // Reframe negative statements
      if (
        lowerImp.startsWith("don't") ||
        lowerImp.startsWith('never') ||
        lowerImp.startsWith('avoid') ||
        lowerImp.startsWith('stop')
      ) {
        const starter = constructiveStarters[Math.floor(Math.random() * constructiveStarters.length)];
        return `${starter} ${imp.replace(/^(don't|never|avoid|stop)\s+/i, '')}`;
      }

      return imp;
    });
  }

  /**
   * Log safety validation result
   */
  private logSafetyResult(evaluationId: string | undefined, result: SafetyResult): void {
    if (result.passed) {
      logger.info(`[SafeEvaluation] ${evaluationId ?? 'unknown'}: PASSED (score: ${result.score})`);
    } else {
      logger.warn(
        `[SafeEvaluation] ${evaluationId ?? 'unknown'}: FAILED (score: ${result.score}, issues: ${result.issues.length})`
      );
      for (const issue of result.issues) {
        logger.warn(`  - [${issue.severity}] ${issue.type}: ${issue.description}`);
      }
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a safe evaluation wrapper
 */
export function createSafeEvaluationWrapper(
  config?: SafeEvaluationWrapperConfig
): SafeEvaluationWrapper {
  return new SafeEvaluationWrapper(config);
}

/**
 * Create a strict safe evaluation wrapper
 */
export function createStrictSafeEvaluationWrapper(
  config?: Omit<SafeEvaluationWrapperConfig, 'strictMode'>
): SafeEvaluationWrapper {
  return new SafeEvaluationWrapper({ ...config, strictMode: true });
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultWrapper: SafeEvaluationWrapper | undefined;

/**
 * Get default safe evaluation wrapper
 */
export function getDefaultSafeEvaluationWrapper(): SafeEvaluationWrapper {
  if (!defaultWrapper) {
    defaultWrapper = new SafeEvaluationWrapper();
  }
  return defaultWrapper;
}

/**
 * Reset default wrapper (for testing)
 */
export function resetDefaultSafeEvaluationWrapper(): void {
  defaultWrapper = undefined;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Wrap an AI evaluation with safety validation (using default wrapper)
 */
export async function wrapEvaluationWithSafety(
  evaluation: AIEvaluationResult,
  evaluationId?: string
): Promise<SafeEvaluationResult> {
  return getDefaultSafeEvaluationWrapper().wrapEvaluation(evaluation, evaluationId);
}

/**
 * Quick check if feedback text is safe
 */
export async function isFeedbackTextSafe(feedback: string): Promise<boolean> {
  return getDefaultSafeEvaluationWrapper().isSafe(feedback);
}

/**
 * Get suggestions for improving feedback
 */
export function getFeedbackSuggestions(feedback: string): string[] {
  return getDefaultSafeEvaluationWrapper().getSuggestions(feedback);
}
