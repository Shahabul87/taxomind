/**
 * Evaluation Calibrator
 *
 * Priority 6: Add Calibration Loop
 * Main calibration loop implementation for continuous improvement
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  CalibrationLoop,
  CalibrationSample,
  CalibrationSampleStore,
  CalibrationConfig,
  CalibrationResult,
  CalibrationStatus,
  CalibrationAlert,
  CalibrationAdjustment,
  DriftAnalysis,
  DriftAnalysisOptions,
  EvaluationSampleInput,
  HumanReview,
} from './types';
import { DEFAULT_CALIBRATION_CONFIG } from './types';
import { DriftAnalyzer, createDriftAnalyzerFromCalibrationConfig } from './drift-analyzer';
import { InMemorySampleStore } from './sample-store';

// ============================================================================
// EVALUATION CALIBRATOR IMPLEMENTATION
// ============================================================================

/**
 * Logger interface for calibration events
 */
export interface CalibrationLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * Full calibrator configuration
 */
export interface CalibratorConfig extends CalibrationConfig {
  /**
   * Sample store implementation
   */
  sampleStore?: CalibrationSampleStore;

  /**
   * Logger implementation
   */
  logger?: CalibrationLogger;

  /**
   * Callback when alerts are generated
   */
  onAlert?: (alert: CalibrationAlert) => void | Promise<void>;

  /**
   * Callback when calibration completes
   */
  onCalibrationComplete?: (result: CalibrationResult) => void | Promise<void>;
}

/**
 * Evaluation Calibrator
 * Implements the calibration loop for continuous AI evaluation improvement
 */
export class EvaluationCalibrator implements CalibrationLoop {
  private readonly config: Required<Omit<CalibrationConfig, 'alertSettings'>>;
  private readonly sampleStore: CalibrationSampleStore;
  private readonly driftAnalyzer: DriftAnalyzer;
  private readonly logger?: CalibrationLogger;
  private readonly onAlert?: (alert: CalibrationAlert) => void | Promise<void>;
  private readonly onCalibrationComplete?: (
    result: CalibrationResult
  ) => void | Promise<void>;

  private lastCalibration?: CalibrationResult;
  private nextCalibrationDate: Date;
  private enabled: boolean = true;

  constructor(config: CalibratorConfig = {}) {
    this.config = {
      driftThreshold:
        config.driftThreshold ?? DEFAULT_CALIBRATION_CONFIG.driftThreshold,
      minSamplesForAnalysis:
        config.minSamplesForAnalysis ??
        DEFAULT_CALIBRATION_CONFIG.minSamplesForAnalysis,
      analysisWindowDays:
        config.analysisWindowDays ??
        DEFAULT_CALIBRATION_CONFIG.analysisWindowDays,
      targetCorrelation:
        config.targetCorrelation ??
        DEFAULT_CALIBRATION_CONFIG.targetCorrelation,
      autoApplyAdjustments:
        config.autoApplyAdjustments ??
        DEFAULT_CALIBRATION_CONFIG.autoApplyAdjustments,
      maxAutoAdjustment:
        config.maxAutoAdjustment ??
        DEFAULT_CALIBRATION_CONFIG.maxAutoAdjustment,
      calibrationFrequencyHours:
        config.calibrationFrequencyHours ??
        DEFAULT_CALIBRATION_CONFIG.calibrationFrequencyHours,
      sampleSelectionStrategy:
        config.sampleSelectionStrategy ??
        DEFAULT_CALIBRATION_CONFIG.sampleSelectionStrategy,
      samplesPerRun:
        config.samplesPerRun ?? DEFAULT_CALIBRATION_CONFIG.samplesPerRun,
    };

    this.sampleStore = config.sampleStore ?? new InMemorySampleStore();
    this.driftAnalyzer = createDriftAnalyzerFromCalibrationConfig(this.config);
    this.logger = config.logger;
    this.onAlert = config.onAlert;
    this.onCalibrationComplete = config.onCalibrationComplete;

    // Schedule next calibration
    this.nextCalibrationDate = this.calculateNextCalibration();
  }

  /**
   * Collect an evaluation sample
   */
  async collectSample(
    evaluation: EvaluationSampleInput,
    humanReview?: HumanReview
  ): Promise<CalibrationSample> {
    const sample: CalibrationSample = {
      id: uuidv4(),
      evaluationId: evaluation.evaluationId,
      aiScore: evaluation.aiScore,
      aiFeedback: evaluation.aiFeedback,
      context: evaluation.context,
      versionInfo: evaluation.versionInfo,
      evaluatedAt: new Date(),
      tags: evaluation.tags,
    };

    // If human review is provided, include it
    if (humanReview) {
      sample.humanScore = humanReview.score;
      sample.humanFeedback = humanReview.feedback;
      sample.adjustmentReason = humanReview.reason;
      sample.reviewedAt = new Date();
      sample.reviewerId = humanReview.reviewerId;
    }

    await this.sampleStore.save(sample);

    this.logger?.debug('Collected calibration sample', {
      sampleId: sample.id,
      evaluationId: sample.evaluationId,
      hasHumanReview: !!humanReview,
    });

    return sample;
  }

  /**
   * Add human review to an existing sample
   */
  async addHumanReview(
    evaluationId: string,
    review: HumanReview
  ): Promise<CalibrationSample> {
    // Find the sample by evaluation ID
    const stats = await this.sampleStore.getStatistics();
    const samples = await this.sampleStore.getByDateRange(
      new Date(0),
      new Date()
    );

    const sample = samples.find((s) => s.evaluationId === evaluationId);

    if (!sample) {
      throw new Error(`Sample not found for evaluation: ${evaluationId}`);
    }

    const updated = await this.sampleStore.updateWithReview(sample.id, review);

    this.logger?.info('Added human review to sample', {
      sampleId: sample.id,
      evaluationId,
      aiScore: sample.aiScore,
      humanScore: review.score,
      drift: Math.abs(sample.aiScore - review.score),
    });

    return updated;
  }

  /**
   * Analyze drift between AI and human ratings
   */
  async analyzeDrift(options?: DriftAnalysisOptions): Promise<DriftAnalysis> {
    // Get samples for analysis
    const endDate = options?.endDate ?? new Date();
    const startDate =
      options?.startDate ??
      new Date(
        endDate.getTime() - this.config.analysisWindowDays * 24 * 60 * 60 * 1000
      );

    const samples = await this.sampleStore.getByDateRange(startDate, endDate);

    if (samples.length < this.config.minSamplesForAnalysis) {
      this.logger?.warn('Insufficient samples for drift analysis', {
        available: samples.length,
        required: this.config.minSamplesForAnalysis,
      });
    }

    const analysis = this.driftAnalyzer.analyze(samples, options);

    // Generate alerts if needed
    if (analysis.driftExceedsThreshold) {
      await this.generateAlert({
        severity: 'warning',
        type: 'drift_threshold',
        message: `Drift exceeds threshold: ${(analysis.meanDrift * 100).toFixed(1)}% > ${(this.config.driftThreshold * 100).toFixed(1)}%`,
        action: 'Review evaluation prompts and rubrics',
        data: {
          meanDrift: analysis.meanDrift,
          threshold: this.config.driftThreshold,
          samplesAnalyzed: analysis.samplesAnalyzed,
        },
      });
    }

    if (analysis.correlation < this.config.targetCorrelation) {
      await this.generateAlert({
        severity:
          analysis.correlation < this.config.targetCorrelation - 0.2
            ? 'critical'
            : 'warning',
        type: 'correlation_drop',
        message: `Correlation below target: ${(analysis.correlation * 100).toFixed(1)}% < ${(this.config.targetCorrelation * 100).toFixed(1)}%`,
        action: 'Urgent review of AI evaluation quality needed',
        data: {
          correlation: analysis.correlation,
          target: this.config.targetCorrelation,
        },
      });
    }

    this.logger?.info('Drift analysis completed', {
      samplesAnalyzed: analysis.samplesAnalyzed,
      correlation: analysis.correlation,
      meanDrift: analysis.meanDrift,
      trend: analysis.trend,
    });

    return analysis;
  }

  /**
   * Run calibration process
   */
  async calibrate(): Promise<CalibrationResult> {
    const calibrationId = uuidv4();
    const timestamp = new Date();

    this.logger?.info('Starting calibration run', { calibrationId });

    // Analyze current drift
    const preDriftAnalysis = await this.analyzeDrift();

    const adjustments: CalibrationAdjustment[] = [];
    const alerts: CalibrationAlert[] = [];

    // Check if we have enough samples
    if (
      preDriftAnalysis.samplesAnalyzed < this.config.minSamplesForAnalysis
    ) {
      alerts.push({
        severity: 'info',
        type: 'sample_shortage',
        message: `Only ${preDriftAnalysis.samplesAnalyzed} samples available, ${this.config.minSamplesForAnalysis} recommended`,
        action: 'Increase human review rate to collect more calibration data',
      });
    }

    // Generate adjustments based on analysis
    if (preDriftAnalysis.driftExceedsThreshold) {
      // Determine direction of adjustment needed
      const biasDirection = this.determineBiasDirection(preDriftAnalysis);

      if (biasDirection === 'lenient' && this.config.autoApplyAdjustments) {
        adjustments.push({
          type: 'threshold',
          target: 'scoring_strictness',
          previousValue: 0,
          newValue: Math.min(
            this.config.maxAutoAdjustment,
            preDriftAnalysis.meanDrift
          ),
          reason: 'AI scores consistently higher than human scores',
          expectedImpact: 'Reduce over-scoring by adjusting thresholds',
        });
      } else if (
        biasDirection === 'strict' &&
        this.config.autoApplyAdjustments
      ) {
        adjustments.push({
          type: 'threshold',
          target: 'scoring_leniency',
          previousValue: 0,
          newValue: Math.min(
            this.config.maxAutoAdjustment,
            preDriftAnalysis.meanDrift
          ),
          reason: 'AI scores consistently lower than human scores',
          expectedImpact: 'Reduce under-scoring by adjusting thresholds',
        });
      }

      // Add prompt adjustment recommendations
      for (const rec of preDriftAnalysis.recommendations) {
        if (rec.priority === 'high') {
          adjustments.push({
            type: rec.category as CalibrationAdjustment['type'],
            target: rec.recommendation.slice(0, 50),
            previousValue: 'N/A',
            newValue: 'Recommended',
            reason: rec.recommendation,
            expectedImpact: rec.expectedImpact,
          });
        }
      }
    }

    // Check for bias patterns
    const biasReason = preDriftAnalysis.topAdjustmentReasons.find(
      (r) => r.reason === 'BIAS_DETECTED'
    );
    if (biasReason && biasReason.percentage > 5) {
      alerts.push({
        severity: 'critical',
        type: 'bias_detected',
        message: `Potential bias detected in ${biasReason.percentage.toFixed(1)}% of reviews`,
        action: 'Immediately review evaluation prompts for bias patterns',
        data: {
          percentage: biasReason.percentage,
          count: biasReason.count,
        },
      });
    }

    // Schedule next calibration
    this.nextCalibrationDate = this.calculateNextCalibration();

    // Build result
    const result: CalibrationResult = {
      calibrated: adjustments.length > 0 || alerts.length > 0,
      calibrationId,
      timestamp,
      preDriftAnalysis,
      adjustments,
      alerts,
      nextCalibration: this.nextCalibrationDate,
      summary: this.generateSummary(preDriftAnalysis, adjustments, alerts),
    };

    // Store result
    this.lastCalibration = result;

    // Trigger callbacks
    for (const alert of alerts) {
      await this.generateAlert(alert);
    }

    if (this.onCalibrationComplete) {
      await this.onCalibrationComplete(result);
    }

    this.logger?.info('Calibration completed', {
      calibrationId,
      adjustmentsCount: adjustments.length,
      alertsCount: alerts.length,
      nextCalibration: this.nextCalibrationDate,
    });

    return result;
  }

  /**
   * Get current calibration status
   */
  async getStatus(): Promise<CalibrationStatus> {
    const stats = await this.sampleStore.getStatistics();
    const pendingSamples = await this.sampleStore.getPendingReview(1000);

    // Calculate current drift (quick analysis)
    let currentDrift = 0;
    let health: CalibrationStatus['health'] = 'healthy';
    const activeAlerts: CalibrationAlert[] = [];

    if (this.lastCalibration) {
      currentDrift = this.lastCalibration.preDriftAnalysis.meanDrift;

      if (currentDrift > this.config.driftThreshold * 1.5) {
        health = 'critical';
      } else if (currentDrift > this.config.driftThreshold) {
        health = 'needs_attention';
      }

      activeAlerts.push(...this.lastCalibration.alerts);
    }

    // Check sample shortage
    if (stats.reviewedSamples < this.config.minSamplesForAnalysis) {
      health = health === 'critical' ? 'critical' : 'needs_attention';
      activeAlerts.push({
        severity: 'warning',
        type: 'sample_shortage',
        message: 'Insufficient human-reviewed samples for reliable calibration',
        action: 'Increase human review rate',
      });
    }

    return {
      enabled: this.enabled,
      lastCalibration: this.lastCalibration,
      nextCalibration: this.nextCalibrationDate,
      currentDrift,
      totalSamples: stats.totalSamples,
      reviewedSamples: stats.reviewedSamples,
      pendingReviews: pendingSamples.length,
      health,
      activeAlerts,
    };
  }

  /**
   * Enable calibration
   */
  enable(): void {
    this.enabled = true;
    this.logger?.info('Calibration enabled');
  }

  /**
   * Disable calibration
   */
  disable(): void {
    this.enabled = false;
    this.logger?.info('Calibration disabled');
  }

  /**
   * Get samples pending human review
   */
  async getPendingReviews(limit: number = 10): Promise<CalibrationSample[]> {
    return this.sampleStore.getPendingReview(limit);
  }

  /**
   * Get sample store for direct access
   */
  getSampleStore(): CalibrationSampleStore {
    return this.sampleStore;
  }

  /**
   * Generate and dispatch an alert
   */
  private async generateAlert(alert: CalibrationAlert): Promise<void> {
    this.logger?.warn('Calibration alert generated', alert);

    if (this.onAlert) {
      await this.onAlert(alert);
    }
  }

  /**
   * Determine if AI is biased lenient or strict
   */
  private determineBiasDirection(
    analysis: DriftAnalysis
  ): 'lenient' | 'strict' | 'balanced' {
    const lenientCount =
      analysis.topAdjustmentReasons.find((r) => r.reason === 'AI_TOO_LENIENT')
        ?.count ?? 0;
    const strictCount =
      analysis.topAdjustmentReasons.find((r) => r.reason === 'AI_TOO_STRICT')
        ?.count ?? 0;

    if (lenientCount > strictCount * 1.5) {
      return 'lenient';
    } else if (strictCount > lenientCount * 1.5) {
      return 'strict';
    }

    return 'balanced';
  }

  /**
   * Calculate next calibration date
   */
  private calculateNextCalibration(): Date {
    const next = new Date();
    next.setHours(
      next.getHours() + this.config.calibrationFrequencyHours
    );
    return next;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    analysis: DriftAnalysis,
    adjustments: CalibrationAdjustment[],
    alerts: CalibrationAlert[]
  ): string {
    const parts: string[] = [];

    parts.push(`Analyzed ${analysis.samplesAnalyzed} samples.`);
    parts.push(
      `Correlation: ${(analysis.correlation * 100).toFixed(1)}%, Drift: ${(analysis.meanDrift * 100).toFixed(1)}%.`
    );

    if (analysis.trend !== 'stable') {
      parts.push(`Trend: ${analysis.trend}.`);
    }

    if (adjustments.length > 0) {
      parts.push(`${adjustments.length} adjustment(s) recommended.`);
    }

    if (alerts.filter((a) => a.severity === 'critical').length > 0) {
      parts.push('CRITICAL alerts require immediate attention.');
    }

    return parts.join(' ');
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an evaluation calibrator with default config
 */
export function createEvaluationCalibrator(
  config?: CalibratorConfig
): EvaluationCalibrator {
  return new EvaluationCalibrator(config);
}

/**
 * Create a strict calibrator (lower thresholds)
 */
export function createStrictCalibrator(
  config?: Partial<CalibratorConfig>
): EvaluationCalibrator {
  return new EvaluationCalibrator({
    ...config,
    driftThreshold: 0.1,
    targetCorrelation: 0.9,
    minSamplesForAnalysis: 50,
  });
}

/**
 * Create a lenient calibrator (higher thresholds)
 */
export function createLenientCalibrator(
  config?: Partial<CalibratorConfig>
): EvaluationCalibrator {
  return new EvaluationCalibrator({
    ...config,
    driftThreshold: 0.2,
    targetCorrelation: 0.75,
    minSamplesForAnalysis: 20,
  });
}

/**
 * Singleton calibrator instance
 */
let defaultCalibrator: EvaluationCalibrator | null = null;

/**
 * Get the default calibrator (singleton)
 */
export function getDefaultCalibrator(): EvaluationCalibrator {
  if (!defaultCalibrator) {
    defaultCalibrator = createEvaluationCalibrator();
  }
  return defaultCalibrator;
}

/**
 * Reset the default calibrator (for testing)
 */
export function resetDefaultCalibrator(): void {
  defaultCalibrator = null;
}
