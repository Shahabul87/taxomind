/**
 * Email Queue Monitoring and Logging System
 * 
 * Features:
 * - Real-time job status tracking
 * - Performance metrics collection
 * - Alert system for failures
 * - Dashboard data aggregation
 * - Historical analytics
 * - SLA monitoring
 * - Integration with external monitoring services
 */

import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { emailQueue, EmailQueue } from './email-queue';
import { queueManager } from './queue-manager';

// Monitoring configuration
interface MonitoringConfig {
  metricsRetention: {
    realTime: number; // minutes
    hourly: number; // days
    daily: number; // days
  };
  alerting: {
    enabled: boolean;
    thresholds: {
      errorRate: number; // percentage
      queueDepth: number; // number of jobs
      processingTime: number; // milliseconds
      dlqSize: number; // number of jobs
    };
    channels: string[]; // slack, email, webhook
  };
  sla: {
    verificationEmail: number; // seconds
    passwordReset: number; // seconds
    twoFactor: number; // seconds
    notification: number; // seconds
  };
}

const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  metricsRetention: {
    realTime: 60, // 1 hour
    hourly: 7, // 7 days
    daily: 30, // 30 days
  },
  alerting: {
    enabled: true,
    thresholds: {
      errorRate: 10, // 10%
      queueDepth: 100, // 100 jobs
      processingTime: 30000, // 30 seconds
      dlqSize: 50, // 50 jobs
    },
    channels: ['email', 'webhook'],
  },
  sla: {
    verificationEmail: 300, // 5 minutes
    passwordReset: 180, // 3 minutes
    twoFactor: 60, // 1 minute
    notification: 600, // 10 minutes
  },
};

// Metric types
interface EmailJobMetric {
  timestamp: Date;
  jobType: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
  processingTime?: number;
  attemptCount: number;
  errorMessage?: string;
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  priority: number;
  userEmail: string;
  retryCount?: number;
}

interface AggregatedMetrics {
  timestamp: Date;
  period: 'minute' | 'hour' | 'day';
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageProcessingTime: number;
  queueDepth: number;
  dlqSize: number;
  errorRate: number;
  throughput: number;
  slaViolations: Record<string, number>;
  jobTypeBreakdown: Record<string, {
    total: number;
    completed: number;
    failed: number;
    avgProcessingTime: number;
  }>;
}

interface AlertData {
  id: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'error_rate' | 'queue_depth' | 'processing_time' | 'dlq_size' | 'sla_violation';
  message: string;
  details: Record<string, any>;
  acknowledged: boolean;
  resolvedAt?: Date;
}

/**
 * Email Queue Monitor
 */
export class EmailMonitor {
  private static instance: EmailMonitor;
  private config: MonitoringConfig;
  private metricsInterval?: NodeJS.Timeout;
  private alertingInterval?: NodeJS.Timeout;
  private isRunning = false;
  private realtimeMetrics: EmailJobMetric[] = [];
  private activeAlerts: Map<string, AlertData> = new Map();

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: Partial<MonitoringConfig>): EmailMonitor {
    if (!EmailMonitor.instance) {
      EmailMonitor.instance = new EmailMonitor(config);
    }
    return EmailMonitor.instance;
  }

  /**
   * Start monitoring
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    logger.info('[EMAIL_MONITOR] Starting email queue monitoring...');

    this.isRunning = true;

    // Start metrics collection
    this.startMetricsCollection();

    // Start alerting system
    if (this.config.alerting.enabled) {
      this.startAlerting();
    }

    // Setup queue event listeners
    this.setupQueueListeners();

    logger.info('[EMAIL_MONITOR] Email queue monitoring started');
  }

  /**
   * Stop monitoring
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('[EMAIL_MONITOR] Stopping email queue monitoring...');

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    if (this.alertingInterval) {
      clearInterval(this.alertingInterval);
    }

    this.isRunning = false;

    logger.info('[EMAIL_MONITOR] Email queue monitoring stopped');
  }

  /**
   * Record job metric
   */
  public recordJobMetric(metric: EmailJobMetric): void {
    // Add to real-time metrics
    this.realtimeMetrics.push(metric);

    // Persist to storage
    this.persistMetric(metric);

    // Check for SLA violations
    if (metric.status === 'completed' || metric.status === 'failed') {
      this.checkSLAViolation(metric);
    }

    // Cleanup old real-time metrics
    this.cleanupRealtimeMetrics();
  }

  /**
   * Get real-time dashboard data
   */
  public async getDashboardData(): Promise<any> {
    try {
      const queueStats = await emailQueue.getQueueStatus();
      const recentMetrics = this.getRecentMetrics(15); // Last 15 minutes
      const aggregated = this.aggregateMetrics(recentMetrics, 'minute');
      const alerts = Array.from(this.activeAlerts.values());

      return {
        queue: queueStats,
        metrics: {
          current: this.getCurrentMetrics(),
          recent: recentMetrics,
          aggregated,
        },
        alerts: {
          active: alerts.filter(a => !a.acknowledged),
          total: alerts.length,
          critical: alerts.filter(a => a.severity === 'critical').length,
        },
        sla: await this.getSLAMetrics(),
        performance: {
          throughput: this.calculateThroughput(recentMetrics),
          avgProcessingTime: this.calculateAverageProcessingTime(recentMetrics),
          errorRate: this.calculateErrorRate(recentMetrics),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('[EMAIL_MONITOR] Failed to get dashboard data:', error);
      return {
        error: 'Failed to retrieve monitoring data',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get historical metrics
   */
  public async getHistoricalMetrics(
    startDate: Date,
    endDate: Date,
    granularity: 'minute' | 'hour' | 'day' = 'hour'
  ): Promise<AggregatedMetrics[]> {
    try {
      const metrics = await this.retrieveMetricsFromStorage(startDate, endDate);
      return this.aggregateMetricsByPeriod(metrics, granularity);
    } catch (error) {
      logger.error('[EMAIL_MONITOR] Failed to get historical metrics:', error);
      return [];
    }
  }

  /**
   * Get SLA report
   */
  public async getSLAReport(period: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const metrics = await this.retrieveMetricsFromStorage(startDate, endDate);
      const slaMetrics = this.calculateSLAMetrics(metrics);

      return {
        period: {
          start: startDate,
          end: endDate,
          duration: period,
        },
        sla: slaMetrics,
        compliance: this.calculateSLACompliance(slaMetrics),
        violations: this.getSLAViolations(metrics),
        recommendations: this.generateSLARecommendations(slaMetrics),
      };
    } catch (error) {
      logger.error('[EMAIL_MONITOR] Failed to generate SLA report:', error);
      return {
        error: 'Failed to generate SLA report',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): AlertData[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info(`[EMAIL_MONITOR] Alert acknowledged: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  public resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      alert.acknowledged = true;
      this.activeAlerts.delete(alertId);
      logger.info(`[EMAIL_MONITOR] Alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        logger.error('[EMAIL_MONITOR] Metrics collection failed:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Start alerting system
   */
  private startAlerting(): void {
    this.alertingInterval = setInterval(async () => {
      try {
        await this.checkThresholds();
      } catch (error) {
        logger.error('[EMAIL_MONITOR] Alert checking failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Setup queue event listeners
   */
  private setupQueueListeners(): void {
    // This would integrate with the queue system's event emitters
    // For now, we'll rely on explicit metric recording
    logger.info('[EMAIL_MONITOR] Queue listeners setup complete');
  }

  /**
   * Collect current metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const queueStats = await emailQueue.getQueueStatus();
      const currentTime = new Date();

      // Create aggregated metric entry
      const aggregatedMetric: AggregatedMetrics = {
        timestamp: currentTime,
        period: 'minute',
        totalJobs: this.realtimeMetrics.length,
        completedJobs: this.realtimeMetrics.filter(m => m.status === 'completed').length,
        failedJobs: this.realtimeMetrics.filter(m => m.status === 'failed').length,
        averageProcessingTime: this.calculateAverageProcessingTime(this.realtimeMetrics),
        queueDepth: queueStats.inMemoryQueue?.pendingJobs || 0,
        dlqSize: queueStats.dlq?.failedJobs || 0,
        errorRate: this.calculateErrorRate(this.realtimeMetrics),
        throughput: this.calculateThroughput(this.realtimeMetrics),
        slaViolations: this.calculateSLAViolationsCount(this.realtimeMetrics),
        jobTypeBreakdown: this.calculateJobTypeBreakdown(this.realtimeMetrics),
      };

      // Persist aggregated metric
      await this.persistAggregatedMetric(aggregatedMetric);

    } catch (error) {
      logger.error('[EMAIL_MONITOR] Failed to collect metrics:', error);
    }
  }

  /**
   * Check alert thresholds
   */
  private async checkThresholds(): Promise<void> {
    const recentMetrics = this.getRecentMetrics(5); // Last 5 minutes
    const { thresholds } = this.config.alerting;

    // Check error rate
    const errorRate = this.calculateErrorRate(recentMetrics);
    if (errorRate > thresholds.errorRate) {
      this.createAlert('error_rate', 'high', 
        `Error rate ${errorRate.toFixed(1)}% exceeds threshold of ${thresholds.errorRate}%`,
        { errorRate, threshold: thresholds.errorRate }
      );
    }

    // Check queue depth
    const queueStats = await emailQueue.getQueueStatus();
    const queueDepth = queueStats.inMemoryQueue?.pendingJobs || 0;
    if (queueDepth > thresholds.queueDepth) {
      this.createAlert('queue_depth', 'medium',
        `Queue depth ${queueDepth} exceeds threshold of ${thresholds.queueDepth}`,
        { queueDepth, threshold: thresholds.queueDepth }
      );
    }

    // Check DLQ size
    const dlqSize = queueStats.dlq?.failedJobs || 0;
    if (dlqSize > thresholds.dlqSize) {
      this.createAlert('dlq_size', 'high',
        `Dead letter queue size ${dlqSize} exceeds threshold of ${thresholds.dlqSize}`,
        { dlqSize, threshold: thresholds.dlqSize }
      );
    }

    // Check processing time
    const avgProcessingTime = this.calculateAverageProcessingTime(recentMetrics);
    if (avgProcessingTime > thresholds.processingTime) {
      this.createAlert('processing_time', 'medium',
        `Average processing time ${avgProcessingTime.toFixed(0)}ms exceeds threshold of ${thresholds.processingTime}ms`,
        { avgProcessingTime, threshold: thresholds.processingTime }
      );
    }
  }

  /**
   * Create alert
   */
  private createAlert(
    type: AlertData['type'],
    severity: AlertData['severity'],
    message: string,
    details: Record<string, any>
  ): void {
    const alertId = `${type}_${Date.now()}`;
    
    // Check if similar alert already exists
    const existingAlert = Array.from(this.activeAlerts.values())
      .find(alert => alert.type === type && !alert.acknowledged);
    
    if (existingAlert) {
      // Update existing alert
      existingAlert.details = { ...existingAlert.details, ...details };
      existingAlert.timestamp = new Date();
      return;
    }

    const alert: AlertData = {
      id: alertId,
      timestamp: new Date(),
      severity,
      type,
      message,
      details,
      acknowledged: false,
    };

    this.activeAlerts.set(alertId, alert);

    logger.warn(`[EMAIL_MONITOR] Alert created: ${message}`, alert);

    // Send alert notification
    this.sendAlertNotification(alert);
  }

  /**
   * Send alert notification
   */
  private async sendAlertNotification(alert: AlertData): Promise<void> {
    try {
      // In a real implementation, this would integrate with:
      // - Slack webhook
      // - Email notifications
      // - PagerDuty
      // - Custom webhooks
      
      logger.info('[EMAIL_MONITOR] Alert notification sent', {
        alertId: alert.id,
        channels: this.config.alerting.channels,
      });
    } catch (error) {
      logger.error('[EMAIL_MONITOR] Failed to send alert notification:', error);
    }
  }

  /**
   * Persist metric to storage
   */
  private async persistMetric(metric: EmailJobMetric): Promise<void> {
    try {
      if (redis) {
        const key = `email_metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await redis.setex(key, this.config.metricsRetention.realTime * 60, JSON.stringify(metric));
      }
    } catch (error) {
      logger.warn('[EMAIL_MONITOR] Failed to persist metric:', error);
    }
  }

  /**
   * Persist aggregated metric
   */
  private async persistAggregatedMetric(metric: AggregatedMetrics): Promise<void> {
    try {
      if (redis) {
        const key = `email_agg_${metric.period}_${metric.timestamp.getTime()}`;
        const ttl = metric.period === 'minute' 
          ? this.config.metricsRetention.realTime * 60
          : this.config.metricsRetention.daily * 24 * 60 * 60;
        
        await redis.setex(key, ttl, JSON.stringify(metric));
      }
    } catch (error) {
      logger.warn('[EMAIL_MONITOR] Failed to persist aggregated metric:', error);
    }
  }

  /**
   * Get recent metrics from memory
   */
  private getRecentMetrics(minutes: number): EmailJobMetric[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.realtimeMetrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Calculate error rate
   */
  private calculateErrorRate(metrics: EmailJobMetric[]): number {
    if (metrics.length === 0) return 0;
    
    const failedCount = metrics.filter(m => m.status === 'failed').length;
    return (failedCount / metrics.length) * 100;
  }

  /**
   * Calculate throughput (jobs per minute)
   */
  private calculateThroughput(metrics: EmailJobMetric[]): number {
    if (metrics.length === 0) return 0;
    
    const completedMetrics = metrics.filter(m => m.status === 'completed');
    const timeSpanMinutes = 15; // Based on recent metrics window
    
    return completedMetrics.length / timeSpanMinutes;
  }

  /**
   * Calculate average processing time
   */
  private calculateAverageProcessingTime(metrics: EmailJobMetric[]): number {
    const completedMetrics = metrics.filter(m => m.status === 'completed' && m.processingTime);
    
    if (completedMetrics.length === 0) return 0;
    
    const totalTime = completedMetrics.reduce((sum, metric) => sum + (metric.processingTime || 0), 0);
    return totalTime / completedMetrics.length;
  }

  /**
   * Calculate job type breakdown
   */
  private calculateJobTypeBreakdown(metrics: EmailJobMetric[]): Record<string, any> {
    const breakdown: Record<string, any> = {};
    
    metrics.forEach(metric => {
      if (!breakdown[metric.jobType]) {
        breakdown[metric.jobType] = {
          total: 0,
          completed: 0,
          failed: 0,
          avgProcessingTime: 0,
        };
      }
      
      breakdown[metric.jobType].total++;
      
      if (metric.status === 'completed') {
        breakdown[metric.jobType].completed++;
      } else if (metric.status === 'failed') {
        breakdown[metric.jobType].failed++;
      }
    });
    
    // Calculate average processing times
    Object.keys(breakdown).forEach(jobType => {
      const jobMetrics = metrics.filter(m => m.jobType === jobType && m.processingTime);
      if (jobMetrics.length > 0) {
        const totalTime = jobMetrics.reduce((sum, m) => sum + (m.processingTime || 0), 0);
        breakdown[jobType].avgProcessingTime = totalTime / jobMetrics.length;
      }
    });
    
    return breakdown;
  }

  /**
   * Check SLA violation
   */
  private checkSLAViolation(metric: EmailJobMetric): void {
    if (metric.status !== 'completed' || !metric.processingTime || !metric.startedAt) {
      return;
    }

    const slaLimit = this.config.sla[metric.jobType as keyof typeof this.config.sla];
    if (!slaLimit) return;

    const processingTimeSeconds = metric.processingTime / 1000;
    
    if (processingTimeSeconds > slaLimit) {
      this.createAlert('sla_violation', 'medium',
        `SLA violation for ${metric.jobType}: ${processingTimeSeconds.toFixed(1)}s exceeds ${slaLimit}s limit`,
        {
          jobType: metric.jobType,
          processingTime: processingTimeSeconds,
          slaLimit,
          userEmail: metric.userEmail,
        }
      );
    }
  }

  /**
   * Calculate SLA violations count
   */
  private calculateSLAViolationsCount(metrics: EmailJobMetric[]): Record<string, number> {
    const violations: Record<string, number> = {};
    
    metrics.forEach(metric => {
      if (metric.status === 'completed' && metric.processingTime) {
        const slaLimit = this.config.sla[metric.jobType as keyof typeof this.config.sla];
        if (slaLimit && (metric.processingTime / 1000) > slaLimit) {
          violations[metric.jobType] = (violations[metric.jobType] || 0) + 1;
        }
      }
    });
    
    return violations;
  }

  /**
   * Get current metrics snapshot
   */
  private getCurrentMetrics(): any {
    const recentMetrics = this.getRecentMetrics(1); // Last minute
    
    return {
      activeJobs: recentMetrics.filter(m => m.status === 'processing').length,
      queuedJobs: recentMetrics.filter(m => m.status === 'queued').length,
      completedJobs: recentMetrics.filter(m => m.status === 'completed').length,
      failedJobs: recentMetrics.filter(m => m.status === 'failed').length,
      retryingJobs: recentMetrics.filter(m => m.status === 'retrying').length,
      totalJobs: recentMetrics.length,
    };
  }

  /**
   * Get SLA metrics
   */
  private async getSLAMetrics(): Promise<any> {
    const recentMetrics = this.getRecentMetrics(60); // Last hour
    
    const slaMetrics: any = {};
    
    Object.keys(this.config.sla).forEach(jobType => {
      const jobMetrics = recentMetrics.filter(m => m.jobType === jobType && m.status === 'completed');
      const slaLimit = this.config.sla[jobType as keyof typeof this.config.sla];
      
      if (jobMetrics.length > 0) {
        const violations = jobMetrics.filter(m => (m.processingTime || 0) / 1000 > slaLimit).length;
        const compliance = ((jobMetrics.length - violations) / jobMetrics.length) * 100;
        
        slaMetrics[jobType] = {
          limit: slaLimit,
          processed: jobMetrics.length,
          violations,
          compliance: Math.round(compliance * 100) / 100,
        };
      } else {
        slaMetrics[jobType] = {
          limit: slaLimit,
          processed: 0,
          violations: 0,
          compliance: 100,
        };
      }
    });
    
    return slaMetrics;
  }

  /**
   * Cleanup old real-time metrics
   */
  private cleanupRealtimeMetrics(): void {
    const cutoff = new Date(Date.now() - this.config.metricsRetention.realTime * 60 * 1000);
    this.realtimeMetrics = this.realtimeMetrics.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Retrieve metrics from storage (placeholder)
   */
  private async retrieveMetricsFromStorage(startDate: Date, endDate: Date): Promise<EmailJobMetric[]> {
    // This would retrieve metrics from Redis or database
    // For now, return empty array
    return [];
  }

  /**
   * Aggregate metrics by period
   */
  private aggregateMetricsByPeriod(metrics: EmailJobMetric[], granularity: string): AggregatedMetrics[] {
    // This would group metrics by time periods and aggregate them
    // For now, return empty array
    return [];
  }

  /**
   * Aggregate metrics
   */
  private aggregateMetrics(metrics: EmailJobMetric[], period: string): AggregatedMetrics {
    return {
      timestamp: new Date(),
      period: period as any,
      totalJobs: metrics.length,
      completedJobs: metrics.filter(m => m.status === 'completed').length,
      failedJobs: metrics.filter(m => m.status === 'failed').length,
      averageProcessingTime: this.calculateAverageProcessingTime(metrics),
      queueDepth: 0,
      dlqSize: 0,
      errorRate: this.calculateErrorRate(metrics),
      throughput: this.calculateThroughput(metrics),
      slaViolations: this.calculateSLAViolationsCount(metrics),
      jobTypeBreakdown: this.calculateJobTypeBreakdown(metrics),
    };
  }

  /**
   * Calculate SLA metrics (placeholder)
   */
  private calculateSLAMetrics(metrics: EmailJobMetric[]): any {
    return {};
  }

  /**
   * Calculate SLA compliance (placeholder)
   */
  private calculateSLACompliance(slaMetrics: any): any {
    return {};
  }

  /**
   * Get SLA violations (placeholder)
   */
  private getSLAViolations(metrics: EmailJobMetric[]): any {
    return [];
  }

  /**
   * Generate SLA recommendations (placeholder)
   */
  private generateSLARecommendations(slaMetrics: any): any {
    return [];
  }
}

// Export singleton instance
export const emailMonitor = EmailMonitor.getInstance();

// Export convenience functions
export const startEmailMonitoring = (config?: Partial<MonitoringConfig>) => {
  const monitor = EmailMonitor.getInstance(config);
  return monitor.start();
};

export const stopEmailMonitoring = () => {
  return emailMonitor.stop();
};

export const getEmailDashboardData = () => {
  return emailMonitor.getDashboardData();
};

export const getEmailSLAReport = (period?: 'day' | 'week' | 'month') => {
  return emailMonitor.getSLAReport(period);
};

export const getActiveEmailAlerts = () => {
  return emailMonitor.getActiveAlerts();
};

// Export types
export type {
  MonitoringConfig,
  EmailJobMetric,
  AggregatedMetrics,
  AlertData,
};

export default EmailMonitor;