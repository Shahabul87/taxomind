/**
 * Drift Analyzer
 *
 * Priority 6: Add Calibration Loop
 * Analyzes drift between AI and human evaluation scores
 */

import type {
  CalibrationSample,
  DriftAnalysis,
  DriftAnalysisOptions,
  ContentTypeDrift,
  AdjustmentReasonCount,
  AdjustmentReason,
  DriftRecommendation,
  CalibrationConfig,
} from './types';
import { DEFAULT_CALIBRATION_CONFIG } from './types';

// ============================================================================
// DRIFT ANALYZER IMPLEMENTATION
// ============================================================================

/**
 * Configuration for drift analysis
 */
export interface DriftAnalyzerConfig {
  /**
   * Threshold for concerning drift (0-1)
   */
  driftThreshold?: number;

  /**
   * Target correlation coefficient
   */
  targetCorrelation?: number;

  /**
   * Minimum samples for valid analysis
   */
  minSamples?: number;

  /**
   * Number of days for trend analysis
   */
  trendWindowDays?: number;
}

/**
 * Default analyzer configuration
 */
export const DEFAULT_DRIFT_ANALYZER_CONFIG: Required<DriftAnalyzerConfig> = {
  driftThreshold: 0.15,
  targetCorrelation: 0.85,
  minSamples: 30,
  trendWindowDays: 14,
};

/**
 * Drift Analyzer
 * Analyzes the difference between AI and human evaluations
 */
export class DriftAnalyzer {
  private readonly config: Required<DriftAnalyzerConfig>;

  constructor(config: DriftAnalyzerConfig = {}) {
    this.config = { ...DEFAULT_DRIFT_ANALYZER_CONFIG, ...config };
  }

  /**
   * Analyze drift from a set of calibration samples
   */
  analyze(
    samples: CalibrationSample[],
    options: DriftAnalysisOptions = {}
  ): DriftAnalysis {
    // Filter samples with human review
    let reviewedSamples = samples.filter((s) => s.humanScore !== undefined);

    // Apply date filters
    if (options.startDate) {
      reviewedSamples = reviewedSamples.filter(
        (s) => s.evaluatedAt >= options.startDate!
      );
    }
    if (options.endDate) {
      reviewedSamples = reviewedSamples.filter(
        (s) => s.evaluatedAt <= options.endDate!
      );
    }

    // Apply content type filter
    if (options.contentType) {
      reviewedSamples = reviewedSamples.filter(
        (s) => s.context.contentType === options.contentType
      );
    }

    // Apply subject filter
    if (options.subject) {
      reviewedSamples = reviewedSamples.filter(
        (s) => s.context.subject === options.subject
      );
    }

    // Get period boundaries
    const periodStart = this.getEarliestDate(reviewedSamples);
    const periodEnd = this.getLatestDate(reviewedSamples);

    // Calculate core metrics
    const aiScores = reviewedSamples.map((s) => s.aiScore);
    const humanScores = reviewedSamples.map((s) => s.humanScore!);

    const correlation = this.calculateCorrelation(aiScores, humanScores);
    const meanDrift = this.calculateMeanDrift(reviewedSamples);
    const standardDeviation = this.calculateStandardDeviation(
      reviewedSamples.map((s) => Math.abs(s.aiScore - s.humanScore!))
    );

    // Analyze by content type
    const byContentType = this.analyzeByContentType(reviewedSamples);

    // Analyze by subject
    const bySubject = this.analyzeBySubject(reviewedSamples);

    // Get top adjustment reasons
    const topAdjustmentReasons = this.getTopAdjustmentReasons(reviewedSamples);

    // Determine trend
    const trend = this.analyzeTrend(reviewedSamples);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      correlation,
      meanDrift,
      topAdjustmentReasons,
      byContentType
    );

    return {
      correlation,
      meanDrift,
      standardDeviation,
      driftExceedsThreshold: meanDrift > this.config.driftThreshold,
      samplesAnalyzed: reviewedSamples.length,
      periodStart,
      periodEnd,
      byContentType,
      bySubject,
      topAdjustmentReasons,
      trend,
      recommendations,
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      return 0;
    }

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }

  /**
   * Calculate mean absolute drift
   */
  private calculateMeanDrift(samples: CalibrationSample[]): number {
    if (samples.length === 0) {
      return 0;
    }

    const drifts = samples.map((s) =>
      Math.abs(s.aiScore - (s.humanScore ?? s.aiScore))
    );
    return drifts.reduce((a, b) => a + b, 0) / drifts.length / 100; // Normalize to 0-1
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    return Math.sqrt(variance);
  }

  /**
   * Analyze drift by content type
   */
  private analyzeByContentType(
    samples: CalibrationSample[]
  ): Record<string, ContentTypeDrift> {
    const groups: Record<string, CalibrationSample[]> = {};

    for (const sample of samples) {
      const type = sample.context.contentType;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(sample);
    }

    const result: Record<string, ContentTypeDrift> = {};

    for (const [type, typeSamples] of Object.entries(groups)) {
      const aiScores = typeSamples.map((s) => s.aiScore);
      const humanScores = typeSamples.map((s) => s.humanScore!);

      result[type] = {
        contentType: type,
        meanDrift: this.calculateMeanDrift(typeSamples),
        sampleCount: typeSamples.length,
        correlation: this.calculateCorrelation(aiScores, humanScores),
      };
    }

    return result;
  }

  /**
   * Analyze drift by subject
   */
  private analyzeBySubject(
    samples: CalibrationSample[]
  ): Record<string, number> {
    const groups: Record<string, CalibrationSample[]> = {};

    for (const sample of samples) {
      const subject = sample.context.subject ?? 'unknown';
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(sample);
    }

    const result: Record<string, number> = {};

    for (const [subject, subjectSamples] of Object.entries(groups)) {
      result[subject] = this.calculateMeanDrift(subjectSamples);
    }

    return result;
  }

  /**
   * Get top adjustment reasons
   */
  private getTopAdjustmentReasons(
    samples: CalibrationSample[]
  ): AdjustmentReasonCount[] {
    const counts: Record<string, number> = {};

    for (const sample of samples) {
      if (sample.adjustmentReason) {
        counts[sample.adjustmentReason] =
          (counts[sample.adjustmentReason] ?? 0) + 1;
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return Object.entries(counts)
      .map(([reason, count]) => ({
        reason: reason as AdjustmentReason,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Analyze trend over time
   */
  private analyzeTrend(
    samples: CalibrationSample[]
  ): 'improving' | 'stable' | 'worsening' {
    if (samples.length < 10) {
      return 'stable';
    }

    // Sort by date
    const sorted = [...samples].sort(
      (a, b) => a.evaluatedAt.getTime() - b.evaluatedAt.getTime()
    );

    // Split into halves
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, midpoint);
    const secondHalf = sorted.slice(midpoint);

    // Calculate drift for each half
    const firstHalfDrift = this.calculateMeanDrift(firstHalf);
    const secondHalfDrift = this.calculateMeanDrift(secondHalf);

    const driftChange = secondHalfDrift - firstHalfDrift;

    // Threshold for determining trend (5% change)
    const changeThreshold = 0.05;

    if (driftChange < -changeThreshold) {
      return 'improving';
    } else if (driftChange > changeThreshold) {
      return 'worsening';
    }

    return 'stable';
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    correlation: number,
    meanDrift: number,
    topReasons: AdjustmentReasonCount[],
    byContentType: Record<string, ContentTypeDrift>
  ): DriftRecommendation[] {
    const recommendations: DriftRecommendation[] = [];

    // Low correlation recommendation
    if (correlation < this.config.targetCorrelation) {
      recommendations.push({
        priority: correlation < 0.5 ? 'high' : 'medium',
        category: 'prompt',
        recommendation:
          'Improve prompt clarity to better align AI scoring with human expectations',
        expectedImpact: `Could improve correlation from ${(correlation * 100).toFixed(1)}% to ${(this.config.targetCorrelation * 100).toFixed(1)}%`,
      });
    }

    // High drift recommendation
    if (meanDrift > this.config.driftThreshold) {
      recommendations.push({
        priority: 'high',
        category: 'threshold',
        recommendation:
          'Adjust scoring thresholds to reduce drift between AI and human scores',
        expectedImpact: `Could reduce drift from ${(meanDrift * 100).toFixed(1)}% to below ${(this.config.driftThreshold * 100).toFixed(1)}%`,
      });
    }

    // Reason-specific recommendations
    for (const reason of topReasons) {
      if (reason.percentage > 20) {
        const rec = this.getReasonRecommendation(reason.reason, reason.percentage);
        if (rec) {
          recommendations.push(rec);
        }
      }
    }

    // Content type specific recommendations
    for (const [type, metrics] of Object.entries(byContentType)) {
      if (metrics.meanDrift > this.config.driftThreshold * 1.5) {
        recommendations.push({
          priority: 'medium',
          category: 'rubric',
          recommendation: `Review and refine rubric for "${type}" content type`,
          expectedImpact: `Could reduce ${type} drift from ${(metrics.meanDrift * 100).toFixed(1)}% to acceptable levels`,
          context: { contentType: type },
        });
      }
    }

    return recommendations;
  }

  /**
   * Get recommendation for specific adjustment reason
   */
  private getReasonRecommendation(
    reason: AdjustmentReason,
    percentage: number
  ): DriftRecommendation | null {
    const reasonRecommendations: Record<AdjustmentReason, DriftRecommendation> = {
      AI_TOO_LENIENT: {
        priority: 'high',
        category: 'prompt',
        recommendation:
          'Adjust prompts to be more strict in scoring, emphasizing rubric adherence',
        expectedImpact: `Address ${percentage.toFixed(1)}% of adjustments due to lenient scoring`,
      },
      AI_TOO_STRICT: {
        priority: 'high',
        category: 'prompt',
        recommendation:
          'Adjust prompts to be more generous in partial credit and interpretation',
        expectedImpact: `Address ${percentage.toFixed(1)}% of adjustments due to strict scoring`,
      },
      MISUNDERSTOOD_RUBRIC: {
        priority: 'high',
        category: 'rubric',
        recommendation:
          'Add more explicit rubric examples and clarify ambiguous criteria',
        expectedImpact: `Address ${percentage.toFixed(1)}% of rubric misunderstanding issues`,
      },
      CONTEXT_MISSING: {
        priority: 'medium',
        category: 'prompt',
        recommendation:
          'Provide more context in evaluation prompts including course objectives and student background',
        expectedImpact: `Address ${percentage.toFixed(1)}% of context-related issues`,
      },
      TECHNICAL_ERROR: {
        priority: 'high',
        category: 'training',
        recommendation:
          'Review and correct technical inaccuracies in subject matter understanding',
        expectedImpact: `Address ${percentage.toFixed(1)}% of technical errors`,
      },
      FEEDBACK_QUALITY: {
        priority: 'medium',
        category: 'prompt',
        recommendation:
          'Improve feedback generation prompts to provide more actionable and constructive feedback',
        expectedImpact: `Address ${percentage.toFixed(1)}% of feedback quality issues`,
      },
      BIAS_DETECTED: {
        priority: 'high',
        category: 'prompt',
        recommendation:
          'Review evaluation prompts for potential bias and add fairness guidelines',
        expectedImpact: `Address ${percentage.toFixed(1)}% of potential bias incidents`,
      },
      OTHER: {
        priority: 'low',
        category: 'training',
        recommendation:
          'Review "Other" adjustments for patterns that could inform improvements',
        expectedImpact: 'May reveal additional improvement opportunities',
      },
    };

    return reasonRecommendations[reason] ?? null;
  }

  /**
   * Get earliest date from samples
   */
  private getEarliestDate(samples: CalibrationSample[]): Date {
    if (samples.length === 0) {
      return new Date();
    }
    return new Date(
      Math.min(...samples.map((s) => s.evaluatedAt.getTime()))
    );
  }

  /**
   * Get latest date from samples
   */
  private getLatestDate(samples: CalibrationSample[]): Date {
    if (samples.length === 0) {
      return new Date();
    }
    return new Date(
      Math.max(...samples.map((s) => s.evaluatedAt.getTime()))
    );
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a drift analyzer with default config
 */
export function createDriftAnalyzer(
  config?: DriftAnalyzerConfig
): DriftAnalyzer {
  return new DriftAnalyzer(config);
}

/**
 * Create a drift analyzer from calibration config
 */
export function createDriftAnalyzerFromCalibrationConfig(
  config: CalibrationConfig
): DriftAnalyzer {
  return new DriftAnalyzer({
    driftThreshold: config.driftThreshold ?? DEFAULT_CALIBRATION_CONFIG.driftThreshold,
    targetCorrelation: config.targetCorrelation ?? DEFAULT_CALIBRATION_CONFIG.targetCorrelation,
    minSamples: config.minSamplesForAnalysis ?? DEFAULT_CALIBRATION_CONFIG.minSamplesForAnalysis,
  });
}

/**
 * Quick analysis helper function
 */
export function analyzeDrift(
  samples: CalibrationSample[],
  options?: DriftAnalysisOptions
): DriftAnalysis {
  const analyzer = createDriftAnalyzer();
  return analyzer.analyze(samples, options);
}
