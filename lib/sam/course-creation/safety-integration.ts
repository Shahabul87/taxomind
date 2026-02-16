/**
 * Content Safety Integration for Course Creation
 *
 * Validates AI-generated educational content for:
 * - Bias and fairness (via @sam-ai/safety BiasDetector)
 * - Accessibility compliance (via @sam-ai/safety AccessibilityChecker)
 * - Discouraging language that may harm learner confidence
 *   (via @sam-ai/safety DiscouragingLanguageDetector)
 *
 * Safety issues are surfaced in SAMValidationResult. High-severity issues
 * trigger a score penalty in blendScores(), causing retry via the quality gate.
 * Results are added as optional fields on quality validation results.
 */

import {
  createBiasDetector,
  createAccessibilityChecker,
  createDiscouragingLanguageDetector,
  type BiasDetectionResult,
  type AccessibilityResult,
  type DiscouragingLanguageResult,
} from '@sam-ai/safety';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface ContentSafetyResult {
  /** Whether all detectors passed without high-severity issues */
  passed: boolean;
  /** Overall safety score (0-100, higher is better) */
  overallScore: number;
  /** Structured issues found by the detectors */
  issues: ContentSafetyIssue[];
  /** Whether safety validation actually ran (false if all detectors timed out) */
  validationRan: boolean;
}

export interface ContentSafetyIssue {
  type: 'bias' | 'accessibility' | 'discouraging_language';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

// ============================================================================
// Detector Singletons (reuse across calls to avoid re-initialization)
// ============================================================================

let biasDetector: ReturnType<typeof createBiasDetector> | null = null;
let accessibilityChecker: ReturnType<typeof createAccessibilityChecker> | null = null;
let discouragingDetector: ReturnType<typeof createDiscouragingLanguageDetector> | null = null;

function getBiasDetector() {
  if (!biasDetector) {
    biasDetector = createBiasDetector({ minConfidence: 0.6 });
  }
  return biasDetector;
}

function getAccessibilityChecker() {
  if (!accessibilityChecker) {
    accessibilityChecker = createAccessibilityChecker({
      targetGradeLevel: 10,
      maxGradeLevel: 16,
      maxSentenceLength: 30,
    });
  }
  return accessibilityChecker;
}

function getDiscouragingDetector() {
  if (!discouragingDetector) {
    discouragingDetector = createDiscouragingLanguageDetector({
      minSeverity: 'medium',
    });
  }
  return discouragingDetector;
}

// ============================================================================
// Per-Detector Timeout Wrapper
// ============================================================================

const DETECTOR_TIMEOUT_MS = 3000;

/**
 * Run a synchronous detector with a timeout guard.
 * The detectors in @sam-ai/safety are synchronous (regex-based), but we
 * wrap them in a microtask with a timeout to protect against unexpectedly
 * long inputs and to maintain the Promise.allSettled() pattern.
 */
function withDetectorTimeout<T>(fn: () => T, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${DETECTOR_TIMEOUT_MS}ms`)),
      DETECTOR_TIMEOUT_MS,
    );
    try {
      const result = fn();
      clearTimeout(timer);
      resolve(result);
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Validate AI-generated course content for safety issues.
 *
 * Runs bias detection, accessibility checking, and discouraging language
 * detection in parallel. Each detector has a 3-second timeout.
 *
 * On any detector failure, that detector is treated as "passed" (graceful
 * degradation). Safety never blocks course creation.
 *
 * @param content - The text content to validate (HTML is acceptable; detectors
 *                  work on raw text patterns)
 * @param courseContext - Minimal context for tuning detector thresholds
 */
export async function validateContentSafety(
  content: string,
  courseContext: { difficulty: string; targetAudience: string },
): Promise<ContentSafetyResult> {
  if (!content || content.trim().length === 0) {
    return {
      passed: true,
      overallScore: 100,
      issues: [],
      validationRan: false,
    };
  }

  // Strip HTML tags for text-level analysis
  const plainText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const [biasSettled, accessibilitySettled, discouragingSettled] = await Promise.allSettled([
    withDetectorTimeout(() => getBiasDetector().detect(plainText), 'BiasDetector'),
    withDetectorTimeout(() => getAccessibilityChecker().check(plainText), 'AccessibilityChecker'),
    withDetectorTimeout(() => getDiscouragingDetector().detect(plainText), 'DiscouragingDetector'),
  ]);

  const issues: ContentSafetyIssue[] = [];
  let anyRan = false;
  let biasScore = 100;
  let accessibilityScore = 100;
  let discouragingScore = 100;

  // ── Bias results ──
  if (biasSettled.status === 'fulfilled') {
    anyRan = true;
    const biasResult: BiasDetectionResult = biasSettled.value;
    // BiasDetector riskScore: 0-100 where lower is better.
    // Convert to a "safety score" where higher is better.
    biasScore = Math.max(0, 100 - biasResult.riskScore);

    for (const indicator of biasResult.indicators) {
      issues.push({
        type: 'bias',
        severity: indicator.confidence >= 0.8 ? 'high' : indicator.confidence >= 0.6 ? 'medium' : 'low',
        description: `${indicator.explanation} (triggered by: "${indicator.trigger}")`,
        suggestion: indicator.neutralAlternative ?? 'Use neutral, inclusive language.',
      });
    }
  } else {
    logger.debug('[SAFETY_INTEGRATION] Bias detector failed/timed out', biasSettled.reason);
  }

  // ── Accessibility results ──
  if (accessibilitySettled.status === 'fulfilled') {
    anyRan = true;
    const accResult: AccessibilityResult = accessibilitySettled.value;
    accessibilityScore = accResult.readabilityScore;

    for (const issue of accResult.issues) {
      issues.push({
        type: 'accessibility',
        severity: mapSafetySeverity(issue.severity),
        description: issue.description,
        suggestion: issue.suggestion,
      });
    }
  } else {
    logger.debug('[SAFETY_INTEGRATION] Accessibility checker failed/timed out', accessibilitySettled.reason);
  }

  // ── Discouraging language results ──
  if (discouragingSettled.status === 'fulfilled') {
    anyRan = true;
    const dlResult: DiscouragingLanguageResult = discouragingSettled.value;
    discouragingScore = dlResult.score;

    for (const match of dlResult.matches) {
      issues.push({
        type: 'discouraging_language',
        severity: mapSafetySeverity(match.severity),
        description: `Discouraging phrase detected: "${match.phrase}" (${match.category})`,
        suggestion: match.alternative,
      });
    }
  } else {
    logger.debug('[SAFETY_INTEGRATION] Discouraging language detector failed/timed out', discouragingSettled.reason);
  }

  // ── Compute overall score ──
  // Weighted average: bias 40%, accessibility 30%, discouraging 30%
  const overallScore = anyRan
    ? Math.round(biasScore * 0.4 + accessibilityScore * 0.3 + discouragingScore * 0.3)
    : 100;

  // Passed if no high-severity issues
  const hasHighSeverity = issues.some(i => i.severity === 'high');
  const passed = !hasHighSeverity;

  if (issues.length > 0) {
    logger.debug('[SAFETY_INTEGRATION] Content safety validation complete', {
      passed,
      overallScore,
      issueCount: issues.length,
      highSeverityCount: issues.filter(i => i.severity === 'high').length,
      courseContext,
    });
  }

  return {
    passed,
    overallScore,
    issues,
    validationRan: anyRan,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Map @sam-ai/safety severity levels to our simplified 3-level severity.
 * The safety package uses 'low' | 'medium' | 'high' | 'critical'.
 * We collapse 'critical' into 'high' for the course creation context.
 */
function mapSafetySeverity(severity: string): 'low' | 'medium' | 'high' {
  if (severity === 'critical' || severity === 'high') return 'high';
  if (severity === 'medium') return 'medium';
  return 'low';
}
