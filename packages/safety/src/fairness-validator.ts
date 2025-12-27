/**
 * Fairness Safety Validator
 *
 * Priority 10: Safety + Fairness Checks
 * Main integration that combines all safety checks
 */

import type {
  EvaluationFeedback,
  SafetyResult,
  SafetyIssue,
  SafetyRecommendation,
  FairnessValidatorConfig,
  SafetyLogger,
} from './types';
import { DEFAULT_FAIRNESS_CONFIG } from './types';
import {
  DiscouragingLanguageDetector,
  type DiscouragingLanguageDetectorConfig,
} from './discouraging-language-detector';
import { BiasDetector, type BiasDetectorConfig } from './bias-detector';
import {
  AccessibilityChecker,
  type AccessibilityCheckerConfig,
} from './accessibility-checker';
import {
  ConstructiveFramingChecker,
  type ConstructiveFramingCheckerConfig,
} from './constructive-framing-checker';

// ============================================================================
// VALIDATOR CONFIGURATION
// ============================================================================

/**
 * Full validator configuration
 */
export interface FullFairnessValidatorConfig extends FairnessValidatorConfig {
  /**
   * Discouraging language detector config
   */
  discouragingConfig?: DiscouragingLanguageDetectorConfig;

  /**
   * Bias detector config
   */
  biasConfig?: BiasDetectorConfig;

  /**
   * Accessibility checker config
   */
  accessibilityConfig?: AccessibilityCheckerConfig;

  /**
   * Constructive framing checker config
   */
  constructiveConfig?: ConstructiveFramingCheckerConfig;
}

// ============================================================================
// VALIDATOR IMPLEMENTATION
// ============================================================================

/**
 * Fairness Safety Validator
 * Comprehensive safety validation for evaluation feedback
 */
export class FairnessSafetyValidator {
  private readonly config: Required<
    Omit<
      FairnessValidatorConfig,
      'logger' | 'customDiscouragingPhrases' | 'customBiasPatterns'
    >
  >;
  private readonly logger?: SafetyLogger;

  private readonly discouragingDetector: DiscouragingLanguageDetector;
  private readonly biasDetector: BiasDetector;
  private readonly accessibilityChecker: AccessibilityChecker;
  private readonly constructiveChecker: ConstructiveFramingChecker;

  constructor(config: FullFairnessValidatorConfig = {}) {
    this.config = { ...DEFAULT_FAIRNESS_CONFIG, ...config };
    this.logger = config.logger;

    // Initialize sub-components
    this.discouragingDetector = new DiscouragingLanguageDetector({
      ...config.discouragingConfig,
      customPhrases: config.customDiscouragingPhrases,
      logger: config.logger,
    });

    this.biasDetector = new BiasDetector({
      ...config.biasConfig,
      customPatterns: config.customBiasPatterns?.map((pattern) => ({
        pattern,
        category: 'cultural',
        confidence: 0.7,
        explanation: 'Custom bias pattern detected',
        neutralAlternative: 'Consider rephrasing',
      })),
      logger: config.logger,
    });

    this.accessibilityChecker = new AccessibilityChecker({
      ...config.accessibilityConfig,
      targetGradeLevel:
        config.targetGradeLevel ?? DEFAULT_FAIRNESS_CONFIG.targetGradeLevel,
      maxGradeLevel:
        config.maxReadingLevel ?? DEFAULT_FAIRNESS_CONFIG.maxReadingLevel,
      logger: config.logger,
    });

    this.constructiveChecker = new ConstructiveFramingChecker({
      ...config.constructiveConfig,
      logger: config.logger,
    });
  }

  /**
   * Validate feedback for safety and fairness
   */
  async validateFeedback(feedback: EvaluationFeedback): Promise<SafetyResult> {
    const startTime = Date.now();
    const issues: SafetyIssue[] = [];

    this.logger?.info('Starting safety validation', { feedbackId: feedback.id });

    // Combine all text for analysis
    const fullText = this.combineText(feedback);

    // 1. Check for discouraging language
    if (this.config.checkDiscouragingLanguage) {
      const discouragingResult = this.discouragingDetector.detect(fullText);
      if (discouragingResult.found) {
        for (const match of discouragingResult.matches) {
          issues.push({
            type: 'discouraging_language',
            severity: match.severity,
            description: `Discouraging language detected: "${match.phrase}"`,
            details: [match.phrase],
            suggestion: match.alternative,
            location: match.position,
            confidence: 0.9,
          });
        }
      }
    }

    // 2. Check for bias
    if (this.config.checkBias) {
      const biasResult = this.biasDetector.detect(fullText);
      if (biasResult.detected) {
        for (const indicator of biasResult.indicators) {
          issues.push({
            type: 'potential_bias',
            severity: indicator.confidence > 0.8 ? 'critical' : 'high',
            description: indicator.explanation,
            details: [indicator.trigger],
            suggestion: indicator.neutralAlternative,
            confidence: indicator.confidence,
          });
        }
      }
    }

    // 3. Check accessibility
    if (this.config.checkAccessibility) {
      const accessibilityResult = this.accessibilityChecker.check(
        fullText,
        feedback.targetGradeLevel
      );
      for (const issue of accessibilityResult.issues) {
        issues.push({
          type: 'accessibility',
          severity: issue.severity,
          description: issue.description,
          details: [issue.suggestion],
          suggestion: issue.suggestion,
          confidence: 0.8,
        });
      }
    }

    // 4. Check constructive framing
    if (this.config.checkConstructiveFraming) {
      const constructiveResult = this.constructiveChecker.check(feedback);
      for (const issue of constructiveResult.issues) {
        issues.push({
          type: 'non_constructive',
          severity: issue.type === 'fixed_mindset_language' ? 'high' : 'medium',
          description: issue.description,
          details: [issue.text].filter(Boolean),
          suggestion: issue.suggestion,
          confidence: 0.85,
        });
      }
    }

    // Calculate overall score
    const score = this.calculateOverallScore(issues);

    // Determine pass/fail
    const criticalOrHighIssues = issues.filter(
      (i) => i.severity === 'critical' || i.severity === 'high'
    );
    const passed =
      criticalOrHighIssues.length === 0 && score >= this.config.minPassingScore;

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues);

    const result: SafetyResult = {
      passed,
      score,
      issues,
      recommendations,
      validatedAt: new Date(),
      validationTimeMs: Date.now() - startTime,
    };

    this.logger?.info('Safety validation complete', {
      feedbackId: feedback.id,
      passed,
      score,
      issueCount: issues.length,
      validationTimeMs: result.validationTimeMs,
    });

    return result;
  }

  /**
   * Quick validation (only critical checks)
   */
  async quickValidate(feedback: EvaluationFeedback): Promise<{
    passed: boolean;
    criticalIssues: SafetyIssue[];
  }> {
    const fullText = this.combineText(feedback);
    const criticalIssues: SafetyIssue[] = [];

    // Only check for critical issues
    const discouragingResult = this.discouragingDetector.detect(fullText);
    for (const match of discouragingResult.matches) {
      if (match.severity === 'critical') {
        criticalIssues.push({
          type: 'discouraging_language',
          severity: 'critical',
          description: `Critical discouraging language: "${match.phrase}"`,
          details: [match.phrase],
          suggestion: match.alternative,
          confidence: 0.9,
        });
      }
    }

    const biasResult = this.biasDetector.detect(fullText);
    for (const indicator of biasResult.indicators) {
      if (indicator.confidence > 0.8) {
        criticalIssues.push({
          type: 'potential_bias',
          severity: 'critical',
          description: indicator.explanation,
          details: [indicator.trigger],
          suggestion: indicator.neutralAlternative,
          confidence: indicator.confidence,
        });
      }
    }

    return {
      passed: criticalIssues.length === 0,
      criticalIssues,
    };
  }

  /**
   * Suggest improvements for feedback
   */
  suggestImprovements(feedback: EvaluationFeedback): string[] {
    const fullText = this.combineText(feedback);
    const suggestions: string[] = [];

    // Get suggestions from each component
    const discouragingResult = this.discouragingDetector.detect(fullText);
    if (discouragingResult.found) {
      const alternatives = this.discouragingDetector.suggestAlternatives(
        discouragingResult.matches
      );
      Array.from(alternatives.entries()).forEach(([phrase, alternative]) => {
        suggestions.push(`Replace "${phrase}" with: ${alternative}`);
      });
    }

    const biasResult = this.biasDetector.detect(fullText);
    const biasSuggestions = this.biasDetector.getSuggestions(
      biasResult.indicators
    );
    Array.from(biasSuggestions.entries()).forEach(([trigger, alternative]) => {
      suggestions.push(`Consider rephrasing "${trigger}": ${alternative}`);
    });

    const accessibilityResult = this.accessibilityChecker.check(fullText);
    suggestions.push(
      ...this.accessibilityChecker.getSuggestions(accessibilityResult)
    );

    const constructiveResult = this.constructiveChecker.check(feedback);
    suggestions.push(
      ...this.constructiveChecker.getSuggestions(constructiveResult)
    );

    return Array.from(new Set(suggestions)); // Remove duplicates
  }

  /**
   * Rewrite feedback with suggested improvements
   */
  rewriteFeedback(feedback: EvaluationFeedback): EvaluationFeedback {
    const discouragingResult = this.discouragingDetector.detect(feedback.text);

    const rewrittenText = this.discouragingDetector.rewriteWithAlternatives(
      feedback.text,
      discouragingResult.matches
    );

    return {
      ...feedback,
      text: rewrittenText,
    };
  }

  /**
   * Get detailed analysis
   */
  getDetailedAnalysis(feedback: EvaluationFeedback): {
    discouraging: ReturnType<DiscouragingLanguageDetector['detect']>;
    bias: ReturnType<BiasDetector['detect']>;
    accessibility: ReturnType<AccessibilityChecker['check']>;
    constructive: ReturnType<ConstructiveFramingChecker['check']>;
  } {
    const fullText = this.combineText(feedback);

    return {
      discouraging: this.discouragingDetector.detect(fullText),
      bias: this.biasDetector.detect(fullText),
      accessibility: this.accessibilityChecker.check(
        fullText,
        feedback.targetGradeLevel
      ),
      constructive: this.constructiveChecker.check(feedback),
    };
  }

  /**
   * Combine all text from feedback
   */
  private combineText(feedback: EvaluationFeedback): string {
    const parts: string[] = [feedback.text];

    if (feedback.strengths) {
      parts.push(...feedback.strengths);
    }
    if (feedback.improvements) {
      parts.push(...feedback.improvements);
    }
    if (feedback.comments) {
      parts.push(feedback.comments);
    }

    return parts.join(' ');
  }

  /**
   * Calculate overall safety score
   */
  private calculateOverallScore(issues: SafetyIssue[]): number {
    if (issues.length === 0) {
      return 100;
    }

    const severityWeights = {
      low: 5,
      medium: 15,
      high: 30,
      critical: 50,
    };

    let totalPenalty = 0;
    for (const issue of issues) {
      totalPenalty += severityWeights[issue.severity];
    }

    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(
    issues: SafetyIssue[]
  ): SafetyRecommendation[] {
    const recommendations: SafetyRecommendation[] = [];
    const issueTypes = new Set(issues.map((i) => i.type));

    if (issueTypes.has('discouraging_language')) {
      recommendations.push({
        priority: 'high',
        action: 'Replace discouraging language with growth-oriented alternatives',
        expectedImpact: 'Improves student motivation and self-efficacy',
        relatedIssues: ['discouraging_language'],
      });
    }

    if (issueTypes.has('potential_bias')) {
      recommendations.push({
        priority: 'high',
        action: 'Review and neutralize potentially biased language',
        expectedImpact: 'Ensures equitable feedback for all students',
        relatedIssues: ['potential_bias'],
      });
    }

    if (issueTypes.has('accessibility')) {
      recommendations.push({
        priority: 'medium',
        action: 'Simplify language and improve readability',
        expectedImpact: 'Makes feedback accessible to all reading levels',
        relatedIssues: ['accessibility'],
      });
    }

    if (issueTypes.has('non_constructive')) {
      recommendations.push({
        priority: 'medium',
        action: 'Add positive elements and actionable suggestions',
        expectedImpact: 'Creates more motivating and useful feedback',
        relatedIssues: ['non_constructive'],
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'low',
        action: 'Continue following best practices for feedback',
        expectedImpact: 'Maintains high-quality, fair feedback',
        relatedIssues: [],
      });
    }

    return recommendations;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create fairness safety validator
 */
export function createFairnessSafetyValidator(
  config?: FullFairnessValidatorConfig
): FairnessSafetyValidator {
  return new FairnessSafetyValidator(config);
}

/**
 * Create strict validator (all checks enabled, low tolerance)
 */
export function createStrictFairnessValidator(
  config?: Partial<FullFairnessValidatorConfig>
): FairnessSafetyValidator {
  return new FairnessSafetyValidator({
    ...config,
    minPassingScore: 80,
    checkDiscouragingLanguage: true,
    checkBias: true,
    checkAccessibility: true,
    checkConstructiveFraming: true,
  });
}

/**
 * Create lenient validator (essential checks only)
 */
export function createLenientFairnessValidator(
  config?: Partial<FullFairnessValidatorConfig>
): FairnessSafetyValidator {
  return new FairnessSafetyValidator({
    ...config,
    minPassingScore: 50,
    checkDiscouragingLanguage: true,
    checkBias: true,
    checkAccessibility: false,
    checkConstructiveFraming: false,
  });
}

/**
 * Create quick validator (bias and discouraging only)
 */
export function createQuickFairnessValidator(
  config?: Partial<FullFairnessValidatorConfig>
): FairnessSafetyValidator {
  return new FairnessSafetyValidator({
    ...config,
    minPassingScore: 60,
    checkDiscouragingLanguage: true,
    checkBias: true,
    checkAccessibility: false,
    checkConstructiveFraming: false,
  });
}

// ============================================================================
// DEFAULT INSTANCES
// ============================================================================

let defaultValidator: FairnessSafetyValidator | undefined;

/**
 * Get default validator instance
 */
export function getDefaultFairnessValidator(): FairnessSafetyValidator {
  if (!defaultValidator) {
    defaultValidator = new FairnessSafetyValidator();
  }
  return defaultValidator;
}

/**
 * Reset default validator (for testing)
 */
export function resetDefaultFairnessValidator(): void {
  defaultValidator = undefined;
}
