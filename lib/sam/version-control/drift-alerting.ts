/**
 * Drift Alerting System
 *
 * Priority 9: Prevent Evaluation Drift
 * Monitors for evaluation drift and sends alerts
 */

import type {
  DriftAlert,
  AlertType,
  AlertConfiguration,
  AlertChannel,
  DriftDimension,
  RegressionReport,
  DriftAnalysisResult,
  DriftTrend,
  RootCause,
  DriftRecommendation,
} from './types';
import { DEFAULT_ALERT_CONFIGURATION, DEFAULT_DRIFT_THRESHOLDS } from './types';

// ============================================================================
// ALERT STORE INTERFACE
// ============================================================================

/**
 * Alert store interface
 */
export interface DriftAlertStore {
  /**
   * Save alert
   */
  save(alert: DriftAlert): Promise<void>;

  /**
   * Get alert by ID
   */
  get(id: string): Promise<DriftAlert | undefined>;

  /**
   * Update alert
   */
  update(id: string, updates: Partial<DriftAlert>): Promise<void>;

  /**
   * List active alerts
   */
  listActive(): Promise<DriftAlert[]>;

  /**
   * List alerts by config
   */
  listByConfig(configId: string): Promise<DriftAlert[]>;

  /**
   * List alerts by severity
   */
  listBySeverity(severity: 'info' | 'warning' | 'error' | 'critical'): Promise<DriftAlert[]>;

  /**
   * Count active alerts
   */
  countActive(): Promise<number>;

  /**
   * Get recent alerts
   */
  getRecent(limit: number): Promise<DriftAlert[]>;
}

// ============================================================================
// IN-MEMORY ALERT STORE
// ============================================================================

/**
 * In-memory implementation of DriftAlertStore
 */
export class InMemoryAlertStore implements DriftAlertStore {
  private readonly alerts: Map<string, DriftAlert> = new Map();

  async save(alert: DriftAlert): Promise<void> {
    this.alerts.set(alert.id, alert);
  }

  async get(id: string): Promise<DriftAlert | undefined> {
    return this.alerts.get(id);
  }

  async update(id: string, updates: Partial<DriftAlert>): Promise<void> {
    const existing = this.alerts.get(id);
    if (!existing) {
      throw new Error(`Alert not found: ${id}`);
    }
    this.alerts.set(id, { ...existing, ...updates });
  }

  async listActive(): Promise<DriftAlert[]> {
    return Array.from(this.alerts.values()).filter(
      (a) => a.status === 'active'
    );
  }

  async listByConfig(configId: string): Promise<DriftAlert[]> {
    return Array.from(this.alerts.values()).filter(
      (a) => a.configId === configId
    );
  }

  async listBySeverity(
    severity: 'info' | 'warning' | 'error' | 'critical'
  ): Promise<DriftAlert[]> {
    return Array.from(this.alerts.values()).filter(
      (a) => a.severity === severity
    );
  }

  async countActive(): Promise<number> {
    return (await this.listActive()).length;
  }

  async getRecent(limit: number): Promise<DriftAlert[]> {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Clear all alerts (for testing)
   */
  clear(): void {
    this.alerts.clear();
  }
}

// ============================================================================
// ALERT CHANNEL IMPLEMENTATIONS
// ============================================================================

/**
 * Alert channel handler interface
 */
export interface AlertChannelHandler {
  /**
   * Send alert through channel
   */
  send(alert: DriftAlert): Promise<boolean>;
}

/**
 * Log channel handler
 */
export class LogChannelHandler implements AlertChannelHandler {
  private readonly logger: DriftAlerterLogger;

  constructor(logger?: DriftAlerterLogger) {
    this.logger = logger ?? console;
  }

  async send(alert: DriftAlert): Promise<boolean> {
    const method = alert.severity === 'critical' || alert.severity === 'error'
      ? 'error'
      : alert.severity === 'warning'
        ? 'warn'
        : 'info';

    this.logger[method](`[DRIFT ALERT] ${alert.title}`, {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      configId: alert.configId,
      driftScore: alert.driftData.score,
      message: alert.message,
    });

    return true;
  }
}

/**
 * Webhook channel handler
 */
export class WebhookChannelHandler implements AlertChannelHandler {
  private readonly webhookUrl: string;
  private readonly headers: Record<string, string>;

  constructor(webhookUrl: string, headers?: Record<string, string>) {
    this.webhookUrl = webhookUrl;
    this.headers = headers ?? {};
  }

  async send(alert: DriftAlert): Promise<boolean> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify({
          alert: {
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            configId: alert.configId,
            driftScore: alert.driftData.score,
            threshold: alert.driftData.threshold,
            createdAt: alert.createdAt.toISOString(),
          },
        }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// DRIFT ALERTER CONFIGURATION
// ============================================================================

/**
 * Drift alerter configuration
 */
export interface DriftAlerterConfig {
  /**
   * Alert store
   */
  store?: DriftAlertStore;

  /**
   * Alert configuration
   */
  alertConfig?: AlertConfiguration;

  /**
   * Channel handlers
   */
  channelHandlers?: Map<string, AlertChannelHandler>;

  /**
   * Logger
   */
  logger?: DriftAlerterLogger;
}

/**
 * Logger interface
 */
export interface DriftAlerterLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

// ============================================================================
// DRIFT ALERTER IMPLEMENTATION
// ============================================================================

/**
 * Drift Alerter
 * Monitors for evaluation drift and generates alerts
 */
export class DriftAlerter {
  private readonly store: DriftAlertStore;
  private readonly alertConfig: AlertConfiguration;
  private readonly channelHandlers: Map<string, AlertChannelHandler>;
  private readonly logger?: DriftAlerterLogger;
  private idCounter: number = 0;

  // Rate limiting
  private readonly alertHistory: Map<string, Date[]> = new Map();

  constructor(config: DriftAlerterConfig = {}) {
    this.store = config.store ?? new InMemoryAlertStore();
    this.alertConfig = config.alertConfig ?? DEFAULT_ALERT_CONFIGURATION;
    this.channelHandlers = config.channelHandlers ?? new Map();
    this.logger = config.logger;

    // Initialize default log handler if no handlers provided
    if (this.channelHandlers.size === 0) {
      this.channelHandlers.set('log', new LogChannelHandler(this.logger));
    }
  }

  // ==========================================================================
  // ALERT GENERATION
  // ==========================================================================

  /**
   * Check regression report and generate alerts if needed
   */
  async checkReport(report: RegressionReport): Promise<DriftAlert[]> {
    const alerts: DriftAlert[] = [];

    // Check drift threshold
    if (report.driftExceedsThreshold) {
      const alert = await this.createAlert(
        'drift_threshold_exceeded',
        report.configId,
        report.driftScore > DEFAULT_DRIFT_THRESHOLDS.overallDrift * 2 ? 'critical' : 'warning',
        `Evaluation Drift Detected`,
        `Drift score (${report.driftScore.toFixed(2)}) exceeds threshold (${this.alertConfig.driftThreshold}). ` +
          `Pass rate: ${report.passRate.toFixed(1)}%, Failed tests: ${report.failed}/${report.totalTests}.`,
        report.driftScore,
        this.alertConfig.driftThreshold,
        []
      );
      if (alert) alerts.push(alert);
    }

    // Check regression failures
    const failureRate = (report.failed / report.totalTests) * 100;
    if (failureRate > this.alertConfig.regressionFailureThreshold) {
      const alert = await this.createAlert(
        'regression_test_failed',
        report.configId,
        failureRate > 20 ? 'error' : 'warning',
        `High Regression Failure Rate`,
        `${report.failed} of ${report.totalTests} tests failed (${failureRate.toFixed(1)}%). ` +
          `Threshold: ${this.alertConfig.regressionFailureThreshold}%.`,
        failureRate,
        this.alertConfig.regressionFailureThreshold,
        []
      );
      if (alert) alerts.push(alert);
    }

    // Check critical failures
    if (report.criticalFailures.length >= this.alertConfig.criticalFailureThreshold) {
      const alert = await this.createAlert(
        'critical_test_failed',
        report.configId,
        'critical',
        `Critical Test Failures`,
        `${report.criticalFailures.length} critical test(s) failed. ` +
          `Immediate attention required.`,
        report.criticalFailures.length,
        this.alertConfig.criticalFailureThreshold,
        []
      );
      if (alert) alerts.push(alert);
    }

    // Check confidence degradation
    const confidenceMetRate = report.statistics.confidenceMetRate;
    if (confidenceMetRate < 80) {
      const alert = await this.createAlert(
        'confidence_degradation',
        report.configId,
        confidenceMetRate < 60 ? 'error' : 'warning',
        `Confidence Degradation Detected`,
        `Only ${confidenceMetRate.toFixed(1)}% of tests met confidence threshold. ` +
          `Average score difference: ${report.statistics.averageScoreDifference.toFixed(2)}.`,
        100 - confidenceMetRate,
        20,
        []
      );
      if (alert) alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Check drift analysis and generate alerts if needed
   */
  async checkDriftAnalysis(analysis: DriftAnalysisResult): Promise<DriftAlert[]> {
    const alerts: DriftAlert[] = [];

    if (analysis.exceedsThreshold) {
      const alert = await this.createAlert(
        'drift_threshold_exceeded',
        analysis.configId,
        this.mapDriftSeverityToAlertSeverity(analysis.severity),
        `Drift Analysis Alert: ${analysis.severity.toUpperCase()}`,
        this.buildDriftMessage(analysis),
        analysis.driftScore,
        DEFAULT_DRIFT_THRESHOLDS.overallDrift,
        analysis.dimensions
      );
      if (alert) alerts.push(alert);
    }

    return alerts;
  }

  /**
   * Create and send an alert
   */
  private async createAlert(
    type: AlertType,
    configId: string,
    severity: 'info' | 'warning' | 'error' | 'critical',
    title: string,
    message: string,
    driftScore: number,
    threshold: number,
    dimensions: DriftDimension[]
  ): Promise<DriftAlert | null> {
    // Check rate limiting
    if (!this.checkRateLimit(configId, type)) {
      this.logger?.debug('Alert rate limited', { type, configId });
      return null;
    }

    // Check channel severity filter
    const enabledChannels = this.alertConfig.channels.filter(
      (c) => c.enabled && this.severityMeetsMinimum(severity, c.minSeverity)
    );

    if (enabledChannels.length === 0) {
      this.logger?.debug('No enabled channels for severity', { severity });
      return null;
    }

    const alert: DriftAlert = {
      id: this.generateId(),
      type,
      severity,
      title,
      message,
      configId,
      driftData: {
        score: driftScore,
        threshold,
        dimensions,
      },
      status: 'active',
      createdAt: new Date(),
    };

    // Save alert
    await this.store.save(alert);

    // Send through channels
    await this.sendThroughChannels(alert, enabledChannels);

    this.logger?.info('Alert created and sent', {
      id: alert.id,
      type,
      severity,
      configId,
    });

    return alert;
  }

  /**
   * Send alert through enabled channels
   */
  private async sendThroughChannels(
    alert: DriftAlert,
    channels: AlertChannel[]
  ): Promise<void> {
    for (const channel of channels) {
      const handler = this.channelHandlers.get(channel.type);
      if (handler) {
        try {
          await handler.send(alert);
        } catch (error) {
          this.logger?.error('Failed to send alert through channel', {
            channel: channel.type,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  }

  // ==========================================================================
  // ALERT MANAGEMENT
  // ==========================================================================

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<DriftAlert> {
    const alert = await this.store.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    await this.store.update(alertId, {
      status: 'acknowledged',
      acknowledgedBy: userId,
      acknowledgedAt: new Date(),
    });

    const updated = await this.store.get(alertId);
    this.logger?.info('Alert acknowledged', { alertId, userId });
    return updated!;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(
    alertId: string,
    resolutionNotes?: string
  ): Promise<DriftAlert> {
    const alert = await this.store.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    await this.store.update(alertId, {
      status: 'resolved',
      resolvedAt: new Date(),
      resolutionNotes,
    });

    const updated = await this.store.get(alertId);
    this.logger?.info('Alert resolved', { alertId });
    return updated!;
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: string): Promise<DriftAlert> {
    const alert = await this.store.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    await this.store.update(alertId, {
      status: 'dismissed',
    });

    const updated = await this.store.get(alertId);
    this.logger?.info('Alert dismissed', { alertId });
    return updated!;
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<DriftAlert[]> {
    return this.store.listActive();
  }

  /**
   * Get alerts by config
   */
  async getAlertsByConfig(configId: string): Promise<DriftAlert[]> {
    return this.store.listByConfig(configId);
  }

  /**
   * Get alert count
   */
  async getActiveAlertCount(): Promise<number> {
    return this.store.countActive();
  }

  /**
   * Get recent alerts
   */
  async getRecentAlerts(limit: number = 10): Promise<DriftAlert[]> {
    return this.store.getRecent(limit);
  }

  // ==========================================================================
  // DRIFT ANALYSIS
  // ==========================================================================

  /**
   * Analyze drift from multiple regression reports
   */
  analyzeDrift(
    reports: RegressionReport[],
    configId: string
  ): DriftAnalysisResult {
    if (reports.length === 0) {
      return this.createEmptyAnalysis(configId);
    }

    // Sort by date
    const sortedReports = [...reports].sort(
      (a, b) => a.generatedAt.getTime() - b.generatedAt.getTime()
    );

    // Calculate dimensions
    const dimensions = this.calculateDriftDimensions(sortedReports);

    // Calculate overall drift score
    const driftScore = this.calculateOverallDrift(dimensions);

    // Determine severity
    const severity = this.determineDriftSeverity(driftScore);

    // Analyze trend
    const trend = this.analyzeTrend(sortedReports);

    // Identify root causes
    const rootCauses = this.identifyRootCauses(sortedReports, dimensions);

    // Generate recommendations
    const recommendations = this.generateDriftRecommendations(
      driftScore,
      severity,
      dimensions,
      trend
    );

    return {
      id: this.generateId(),
      configId,
      period: {
        start: sortedReports[0].generatedAt,
        end: sortedReports[sortedReports.length - 1].generatedAt,
      },
      driftScore,
      severity,
      exceedsThreshold: driftScore > DEFAULT_DRIFT_THRESHOLDS.overallDrift,
      dimensions,
      trend,
      rootCauses,
      recommendations,
      analyzedAt: new Date(),
    };
  }

  /**
   * Calculate drift dimensions
   */
  private calculateDriftDimensions(reports: RegressionReport[]): DriftDimension[] {
    if (reports.length < 2) return [];

    const baseline = reports[0];
    const current = reports[reports.length - 1];

    const dimensions: DriftDimension[] = [];

    // Pass rate dimension
    const passRateDrift = current.passRate - baseline.passRate;
    dimensions.push({
      name: 'Pass Rate',
      currentValue: current.passRate,
      baselineValue: baseline.passRate,
      drift: passRateDrift,
      driftPercentage: baseline.passRate !== 0
        ? (passRateDrift / baseline.passRate) * 100
        : 0,
      exceedsThreshold: Math.abs(passRateDrift) > 5,
    });

    // Drift score dimension
    const driftScoreChange = current.driftScore - baseline.driftScore;
    dimensions.push({
      name: 'Drift Score',
      currentValue: current.driftScore,
      baselineValue: baseline.driftScore,
      drift: driftScoreChange,
      driftPercentage: baseline.driftScore !== 0
        ? (driftScoreChange / baseline.driftScore) * 100
        : 0,
      exceedsThreshold: Math.abs(driftScoreChange) > DEFAULT_DRIFT_THRESHOLDS.scoreDifference,
    });

    // Confidence rate dimension
    const confidenceChange =
      current.statistics.confidenceMetRate - baseline.statistics.confidenceMetRate;
    dimensions.push({
      name: 'Confidence Rate',
      currentValue: current.statistics.confidenceMetRate,
      baselineValue: baseline.statistics.confidenceMetRate,
      drift: confidenceChange,
      driftPercentage: baseline.statistics.confidenceMetRate !== 0
        ? (confidenceChange / baseline.statistics.confidenceMetRate) * 100
        : 0,
      exceedsThreshold: Math.abs(confidenceChange) > DEFAULT_DRIFT_THRESHOLDS.confidenceDegradation * 100,
    });

    return dimensions;
  }

  /**
   * Calculate overall drift from dimensions
   */
  private calculateOverallDrift(dimensions: DriftDimension[]): number {
    if (dimensions.length === 0) return 0;

    const weights: Record<string, number> = {
      'Pass Rate': 0.4,
      'Drift Score': 0.35,
      'Confidence Rate': 0.25,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const dim of dimensions) {
      const weight = weights[dim.name] ?? 0.33;
      weightedSum += Math.abs(dim.driftPercentage) * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Determine drift severity
   */
  private determineDriftSeverity(
    driftScore: number
  ): 'none' | 'low' | 'medium' | 'high' | 'critical' {
    if (driftScore < 5) return 'none';
    if (driftScore < 10) return 'low';
    if (driftScore < 20) return 'medium';
    if (driftScore < 30) return 'high';
    return 'critical';
  }

  /**
   * Analyze trend from reports
   */
  private analyzeTrend(reports: RegressionReport[]): DriftTrend {
    if (reports.length < 3) {
      return {
        direction: 'stable',
        strength: 0,
        dataPoints: reports.length,
        projectedDrift: reports.length > 0 ? reports[reports.length - 1].driftScore : 0,
      };
    }

    // Calculate trend using simple linear regression
    const driftScores = reports.map((r) => r.driftScore);
    const n = driftScores.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = driftScores.reduce((a, b) => a + b, 0);
    const sumXY = driftScores.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    let direction: 'improving' | 'stable' | 'degrading';
    if (slope < -0.5) {
      direction = 'improving';
    } else if (slope > 0.5) {
      direction = 'degrading';
    } else {
      direction = 'stable';
    }

    const strength = Math.min(Math.abs(slope) / 2, 1);
    const projectedDrift = driftScores[n - 1] + slope * 5; // Project 5 periods ahead

    const daysUntilThreshold =
      direction === 'degrading' && slope > 0
        ? Math.ceil((DEFAULT_DRIFT_THRESHOLDS.overallDrift - driftScores[n - 1]) / slope)
        : undefined;

    return {
      direction,
      strength,
      dataPoints: n,
      projectedDrift: Math.max(0, projectedDrift),
      daysUntilThreshold: daysUntilThreshold && daysUntilThreshold > 0
        ? daysUntilThreshold
        : undefined,
    };
  }

  /**
   * Identify root causes
   */
  private identifyRootCauses(
    reports: RegressionReport[],
    dimensions: DriftDimension[]
  ): RootCause[] {
    const rootCauses: RootCause[] = [];

    // Check for sudden changes
    if (dimensions.some((d) => Math.abs(d.driftPercentage) > 20)) {
      rootCauses.push({
        type: 'model_update',
        confidence: 0.6,
        description: 'Significant score variation detected, possibly due to model changes',
        evidence: ['Large drift in multiple dimensions', 'Sudden change in pass rates'],
      });
    }

    // Check for gradual degradation
    if (reports.length >= 3) {
      const recentDriftScores = reports.slice(-3).map((r) => r.driftScore);
      if (recentDriftScores.every((s, i) => i === 0 || s > recentDriftScores[i - 1])) {
        rootCauses.push({
          type: 'data_shift',
          confidence: 0.5,
          description: 'Gradual performance degradation detected',
          evidence: ['Consistent increase in drift scores', 'Progressive decline in pass rates'],
        });
      }
    }

    if (rootCauses.length === 0) {
      rootCauses.push({
        type: 'unknown',
        confidence: 0.3,
        description: 'Unable to determine specific root cause',
        evidence: ['No clear pattern detected'],
      });
    }

    return rootCauses;
  }

  /**
   * Generate drift recommendations
   */
  private generateDriftRecommendations(
    driftScore: number,
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical',
    dimensions: DriftDimension[],
    trend: DriftTrend
  ): DriftRecommendation[] {
    const recommendations: DriftRecommendation[] = [];

    if (severity === 'none') {
      recommendations.push({
        priority: 'low',
        action: 'Continue monitoring',
        expectedImpact: 'Maintain current performance',
        effort: 'minimal',
      });
      return recommendations;
    }

    if (severity === 'critical' || severity === 'high') {
      recommendations.push({
        priority: 'urgent',
        action: 'Freeze current configuration and investigate',
        expectedImpact: 'Prevent further degradation',
        effort: 'minimal',
      });
    }

    if (dimensions.some((d) => d.name === 'Confidence Rate' && d.exceedsThreshold)) {
      recommendations.push({
        priority: severity === 'critical' ? 'urgent' : 'high',
        action: 'Review and recalibrate confidence thresholds',
        expectedImpact: 'Improve evaluation reliability',
        effort: 'moderate',
      });
    }

    if (trend.direction === 'degrading') {
      recommendations.push({
        priority: 'high',
        action: 'Analyze recent changes to prompts or model versions',
        expectedImpact: 'Identify source of degradation',
        effort: 'moderate',
      });
    }

    if (driftScore > 15) {
      recommendations.push({
        priority: 'medium',
        action: 'Run comprehensive golden test suite',
        expectedImpact: 'Identify specific failure patterns',
        effort: 'minimal',
      });
    }

    return recommendations;
  }

  /**
   * Create empty analysis result
   */
  private createEmptyAnalysis(configId: string): DriftAnalysisResult {
    const now = new Date();
    return {
      id: this.generateId(),
      configId,
      period: { start: now, end: now },
      driftScore: 0,
      severity: 'none',
      exceedsThreshold: false,
      dimensions: [],
      trend: {
        direction: 'stable',
        strength: 0,
        dataPoints: 0,
        projectedDrift: 0,
      },
      rootCauses: [],
      recommendations: [
        {
          priority: 'low',
          action: 'No data available for analysis',
          expectedImpact: 'Run regression tests to gather data',
          effort: 'minimal',
        },
      ],
      analyzedAt: now,
    };
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Check rate limiting
   */
  private checkRateLimit(configId: string, type: AlertType): boolean {
    const key = `${configId}:${type}`;
    const now = new Date();
    const history = this.alertHistory.get(key) ?? [];

    // Remove old entries
    const cutoff = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour
    const recentHistory = history.filter((d) => d > cutoff);

    // Check max per hour
    if (recentHistory.length >= this.alertConfig.frequencyLimits.maxAlertsPerHour) {
      return false;
    }

    // Check cooldown
    if (recentHistory.length > 0) {
      const lastAlert = recentHistory[recentHistory.length - 1];
      const cooldownMs = this.alertConfig.frequencyLimits.cooldownMinutes * 60 * 1000;
      if (now.getTime() - lastAlert.getTime() < cooldownMs) {
        return false;
      }
    }

    // Update history
    recentHistory.push(now);
    this.alertHistory.set(key, recentHistory);

    return true;
  }

  /**
   * Check if severity meets minimum
   */
  private severityMeetsMinimum(
    severity: 'info' | 'warning' | 'error' | 'critical',
    minimum: 'info' | 'warning' | 'error' | 'critical'
  ): boolean {
    const order = ['info', 'warning', 'error', 'critical'];
    return order.indexOf(severity) >= order.indexOf(minimum);
  }

  /**
   * Map drift severity to alert severity
   */
  private mapDriftSeverityToAlertSeverity(
    driftSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical'
  ): 'info' | 'warning' | 'error' | 'critical' {
    switch (driftSeverity) {
      case 'none':
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'critical';
    }
  }

  /**
   * Build drift message
   */
  private buildDriftMessage(analysis: DriftAnalysisResult): string {
    let message = `Drift score: ${analysis.driftScore.toFixed(2)} (${analysis.severity}). `;
    message += `Trend: ${analysis.trend.direction} with strength ${(analysis.trend.strength * 100).toFixed(0)}%. `;

    if (analysis.dimensions.length > 0) {
      const exceeding = analysis.dimensions.filter((d) => d.exceedsThreshold);
      if (exceeding.length > 0) {
        message += `Dimensions exceeding threshold: ${exceeding.map((d) => d.name).join(', ')}.`;
      }
    }

    return message;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `alert-${++this.idCounter}-${Date.now().toString(36)}`;
  }

  /**
   * Register channel handler
   */
  registerChannelHandler(type: string, handler: AlertChannelHandler): void {
    this.channelHandlers.set(type, handler);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create drift alerter
 */
export function createDriftAlerter(config?: DriftAlerterConfig): DriftAlerter {
  return new DriftAlerter(config);
}

/**
 * Create drift alerter with webhook
 */
export function createDriftAlerterWithWebhook(
  webhookUrl: string,
  config?: Omit<DriftAlerterConfig, 'channelHandlers'>
): DriftAlerter {
  const alerter = new DriftAlerter(config);
  alerter.registerChannelHandler('webhook', new WebhookChannelHandler(webhookUrl));
  return alerter;
}

// ============================================================================
// DEFAULT INSTANCES
// ============================================================================

let defaultAlerter: DriftAlerter | undefined;

/**
 * Get default alerter instance
 */
export function getDefaultDriftAlerter(): DriftAlerter {
  if (!defaultAlerter) {
    defaultAlerter = new DriftAlerter();
  }
  return defaultAlerter;
}

/**
 * Reset default alerter (for testing)
 */
export function resetDefaultDriftAlerter(): void {
  defaultAlerter = undefined;
}
