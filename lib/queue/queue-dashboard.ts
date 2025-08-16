/**
 * Queue Dashboard
 * Monitoring and management interface for the queue system
 */

import { QueueManager } from './queue-manager';
import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';

export interface QueueDashboardData {
  overview: {
    totalQueues: number;
    totalWorkers: number;
    totalJobs: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
    systemHealth: 'healthy' | 'warning' | 'critical';
    uptime: number;
  };
  queues: Record<string, QueueStats>;
  workers: Record<string, WorkerStats>;
  performance: PerformanceMetrics;
  alerts: Alert[];
  trends: TrendData;
}

export interface QueueStats {
  name: string;
  status: 'active' | 'paused' | 'stopped';
  jobs: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  throughput: {
    jobsPerMinute: number;
    averageProcessingTime: number;
    successRate: number;
  };
  lastActivity: Date | null;
  health: 'healthy' | 'warning' | 'critical';
}

export interface WorkerStats {
  name: string;
  status: 'running' | 'paused' | 'stopped';
  concurrency: number;
  activeJobs: number;
  processedJobs: number;
  failedJobs: number;
  averageJobTime: number;
  memoryUsage: number;
  lastActivity: Date | null;
}

export interface PerformanceMetrics {
  averageLatency: number;
  throughput: number;
  errorRate: number;
  memoryUsage: {
    total: number;
    used: number;
    percentage: number;
  };
  cpuUsage: number;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  queueName?: string;
  workerName?: string;
  timestamp: Date;
  acknowledged: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrendData {
  jobVolumeByHour: Array<{ hour: string; count: number }>;
  successRateTrend: Array<{ time: string; rate: number }>;
  latencyTrend: Array<{ time: string; latency: number }>;
  queueSizeTrend: Record<string, Array<{ time: string; size: number }>>;
}

/**
 * Queue Dashboard Implementation
 */
export class QueueDashboard {
  private queueManager: QueueManager;
  private redis: Redis;
  private alerts: Alert[] = [];
  private startTime: number;
  private metricsHistory: Map<string, any[]> = new Map();
  private alertThresholds: Record<string, any>;

  constructor(queueManager: QueueManager, redis: Redis) {
    this.queueManager = queueManager;
    this.redis = redis;
    this.startTime = Date.now();
    
    this.alertThresholds = {
      queueSize: 1000,
      failureRate: 0.1, // 10%
      avgProcessingTime: 60000, // 60 seconds
      memoryUsage: 0.85, // 85%
      workerInactivity: 300000, // 5 minutes
    };

    this.startMetricsCollection();
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<QueueDashboardData> {
    const [overview, queues, workers, performance, trends] = await Promise.all([
      this.getOverview(),
      this.getQueueStats(),
      this.getWorkerStats(),
      this.getPerformanceMetrics(),
      this.getTrendData(),
    ]);

    // Update alerts based on current metrics
    await this.updateAlerts(queues, workers, performance);

    return {
      overview,
      queues,
      workers,
      performance,
      alerts: this.getActiveAlerts(),
      trends,
    };
  }

  /**
   * Get system overview
   */
  private async getOverview(): Promise<QueueDashboardData['overview']> {
    const allStats = await this.queueManager.getAllQueueStats();
    const workerHealth = this.queueManager.getWorkerHealth();

    const totalJobs = Object.values(allStats).reduce(
      (acc: any, stats: any) => ({
        waiting: acc.waiting + stats.jobs.waiting,
        active: acc.active + stats.jobs.active,
        completed: acc.completed + stats.jobs.completed,
        failed: acc.failed + stats.jobs.failed,
        delayed: acc.delayed + stats.jobs.delayed,
      }),
      { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
    );

    const systemHealth = this.calculateSystemHealth(allStats, workerHealth);

    return {
      totalQueues: Object.keys(allStats).length,
      totalWorkers: Object.keys(workerHealth).length,
      totalJobs,
      systemHealth,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get detailed queue statistics
   */
  private async getQueueStats(): Promise<Record<string, QueueStats>> {
    const allStats = await this.queueManager.getAllQueueStats();
    const queueStats: Record<string, QueueStats> = {};

    for (const [queueName, stats] of Object.entries(allStats)) {
      const statsCasted = stats as any;
      const throughput = await this.calculateQueueThroughput(queueName);
      
      queueStats[queueName] = {
        name: queueName,
        status: 'active', // TODO: Get actual status from queue
        jobs: statsCasted.jobs,
        throughput,
        lastActivity: statsCasted.metrics?.lastJobTime || null,
        health: this.determineQueueHealth(statsCasted, throughput),
      };
    }

    return queueStats;
  }

  /**
   * Get worker statistics
   */
  private async getWorkerStats(): Promise<Record<string, WorkerStats>> {
    const workerHealth = this.queueManager.getWorkerHealth();
    const workerStats: Record<string, WorkerStats> = {};

    for (const [workerName, health] of Object.entries(workerHealth)) {
      const healthCasted = health as any;
      const metrics = await this.getWorkerMetrics(workerName);
      
      workerStats[workerName] = {
        name: workerName,
        status: healthCasted.isRunning ? 'running' : 'stopped',
        concurrency: healthCasted.concurrency,
        activeJobs: metrics.activeJobs,
        processedJobs: metrics.processedJobs,
        failedJobs: metrics.failedJobs,
        averageJobTime: metrics.averageJobTime,
        memoryUsage: metrics.memoryUsage,
        lastActivity: metrics.lastActivity,
      };
    }

    return workerStats;
  }

  /**
   * Get performance metrics
   */
  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    
    // Calculate system-wide metrics
    const averageLatency = await this.calculateAverageLatency();
    const throughput = await this.calculateSystemThroughput();
    const errorRate = await this.calculateErrorRate();

    return {
      averageLatency,
      throughput,
      errorRate,
      memoryUsage: {
        total: Math.round(totalMemory / 1024 / 1024), // MB
        used: Math.round(memUsage.rss / 1024 / 1024), // MB
        percentage: (memUsage.rss / totalMemory) * 100,
      },
      cpuUsage: await this.getCPUUsage(),
    };
  }

  /**
   * Get trend data for charts
   */
  private async getTrendData(): Promise<TrendData> {
    const now = new Date();
    const hoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    return {
      jobVolumeByHour: await this.getJobVolumeByHour(hoursAgo, now),
      successRateTrend: await this.getSuccessRateTrend(hoursAgo, now),
      latencyTrend: await this.getLatencyTrend(hoursAgo, now),
      queueSizeTrend: await this.getQueueSizeTrend(hoursAgo, now),
    };
  }

  /**
   * Calculate queue throughput
   */
  private async calculateQueueThroughput(queueName: string): Promise<any> {
    const key = `queue_metrics:${queueName}`;
    const metrics = await this.redis.hgetall(key);
    
    const processedJobs = parseInt(metrics.processedJobs) || 0;
    const averageTime = parseInt(metrics.averageProcessingTime) || 0;
    const successfulJobs = parseInt(metrics.successfulJobs) || 0;
    
    // Calculate jobs per minute over last hour
    const jobsPerMinute = processedJobs > 0 ? Math.round(processedJobs / 60) : 0;
    const successRate = processedJobs > 0 ? (successfulJobs / processedJobs) * 100 : 100;

    return {
      jobsPerMinute,
      averageProcessingTime: averageTime,
      successRate,
    };
  }

  /**
   * Determine queue health
   */
  private determineQueueHealth(stats: any, throughput: any): 'healthy' | 'warning' | 'critical' {
    if (stats.jobs.waiting > this.alertThresholds.queueSize) {
      return 'critical';
    }
    
    if (throughput.successRate < 90 || stats.jobs.failed > 50) {
      return 'warning';
    }
    
    if (throughput.averageProcessingTime > this.alertThresholds.avgProcessingTime) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * Get worker metrics
   */
  private async getWorkerMetrics(workerName: string): Promise<any> {
    const key = `worker_metrics:${workerName}`;
    const metrics = await this.redis.hgetall(key);
    
    return {
      activeJobs: parseInt(metrics.activeJobs) || 0,
      processedJobs: parseInt(metrics.processedJobs) || 0,
      failedJobs: parseInt(metrics.failedJobs) || 0,
      averageJobTime: parseInt(metrics.averageJobTime) || 0,
      memoryUsage: parseInt(metrics.memoryUsage) || 0,
      lastActivity: metrics.lastActivity ? new Date(metrics.lastActivity) : null,
    };
  }

  /**
   * Calculate system health
   */
  private calculateSystemHealth(queues: any, workers: any): 'healthy' | 'warning' | 'critical' {
    let warningCount = 0;
    let criticalCount = 0;

    // Check queue health
    Object.values(queues).forEach((queue: any) => {
      if (queue.jobs.failed > 100) criticalCount++;
      else if (queue.jobs.failed > 10) warningCount++;
      
      if (queue.jobs.waiting > 1000) criticalCount++;
      else if (queue.jobs.waiting > 100) warningCount++;
    });

    // Check worker health
    Object.values(workers).forEach((worker: any) => {
      if (!worker.isRunning) criticalCount++;
    });

    if (criticalCount > 0) return 'critical';
    if (warningCount > 2) return 'warning';
    return 'healthy';
  }

  /**
   * Update alerts based on current metrics
   */
  private async updateAlerts(queues: any, workers: any, performance: any): Promise<void> {
    const newAlerts: Alert[] = [];

    // Check queue-specific alerts
    Object.values(queues).forEach((queue: any) => {
      if (queue.jobs.waiting > this.alertThresholds.queueSize) {
        newAlerts.push(this.createAlert(
          'warning',
          'High Queue Size',
          `Queue ${queue.name} has ${queue.jobs.waiting} waiting jobs`,
          queue.name
        ));
      }

      if (queue.throughput.successRate < 90) {
        newAlerts.push(this.createAlert(
          'error',
          'Low Success Rate',
          `Queue ${queue.name} success rate is ${queue.throughput.successRate.toFixed(1)}%`,
          queue.name
        ));
      }
    });

    // Check worker alerts
    Object.values(workers).forEach((worker: any) => {
      if (worker.status === 'stopped') {
        newAlerts.push(this.createAlert(
          'error',
          'Worker Stopped',
          `Worker ${worker.name} is not running`,
          undefined,
          worker.name
        ));
      }
    });

    // Check system performance alerts
    if (performance.memoryUsage.percentage > 85) {
      newAlerts.push(this.createAlert(
        'warning',
        'High Memory Usage',
        `System memory usage is ${performance.memoryUsage.percentage.toFixed(1)}%`
      ));
    }

    if (performance.errorRate > 0.1) {
      newAlerts.push(this.createAlert(
        'error',
        'High Error Rate',
        `System error rate is ${(performance.errorRate * 100).toFixed(1)}%`
      ));
    }

    // Add new alerts
    this.alerts.push(...newAlerts);

    // Clean up old alerts (older than 24 hours)
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp.getTime() > cutoff);
  }

  /**
   * Create alert object
   */
  private createAlert(
    type: Alert['type'],
    title: string,
    message: string,
    queueName?: string,
    workerName?: string
  ): Alert {
    const severity = type === 'error' ? 'high' : type === 'warning' ? 'medium' : 'low';
    
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      queueName,
      workerName,
      timestamp: new Date(),
      acknowledged: false,
      severity,
    };
  }

  /**
   * Get active alerts
   */
  private getActiveAlerts(): Alert[] {
    return this.alerts
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  /**
   * Calculate average latency
   */
  private async calculateAverageLatency(): Promise<number> {
    const allStats = await this.queueManager.getAllQueueStats();
    let totalTime = 0;
    let totalJobs = 0;

    Object.values(allStats).forEach((stats: any) => {
      if (stats.metrics?.avgProcessingTime) {
        totalTime += stats.metrics.avgProcessingTime * stats.metrics.processed;
        totalJobs += stats.metrics.processed;
      }
    });

    return totalJobs > 0 ? totalTime / totalJobs : 0;
  }

  /**
   * Calculate system throughput
   */
  private async calculateSystemThroughput(): Promise<number> {
    const allStats = await this.queueManager.getAllQueueStats();
    
    return Object.values(allStats).reduce((total: number, stats: any) => {
      return total + (stats.metrics?.processed || 0);
    }, 0);
  }

  /**
   * Calculate error rate
   */
  private async calculateErrorRate(): Promise<number> {
    const allStats = await this.queueManager.getAllQueueStats();
    let totalJobs = 0;
    let totalErrors = 0;

    Object.values(allStats).forEach((stats: any) => {
      totalJobs += stats.metrics?.processed || 0;
      totalErrors += stats.metrics?.failed || 0;
    });

    return totalJobs > 0 ? totalErrors / totalJobs : 0;
  }

  /**
   * Get CPU usage
   */
  private async getCPUUsage(): Promise<number> {
    // Mock CPU usage - in production, use proper system monitoring
    return Math.round(Math.random() * 30 + 20); // 20-50%
  }

  /**
   * Get job volume by hour
   */
  private async getJobVolumeByHour(start: Date, end: Date): Promise<Array<{ hour: string; count: number }>> {
    const data = [];
    const hourMs = 60 * 60 * 1000;
    
    for (let time = start.getTime(); time <= end.getTime(); time += hourMs) {
      const hour = new Date(time).toISOString().substr(0, 13) + ':00:00Z';
      const count = Math.round(Math.random() * 100 + 10); // Mock data
      data.push({ hour, count });
    }

    return data;
  }

  /**
   * Get success rate trend
   */
  private async getSuccessRateTrend(start: Date, end: Date): Promise<Array<{ time: string; rate: number }>> {
    const data = [];
    const intervalMs = 30 * 60 * 1000; // 30 minutes
    
    for (let time = start.getTime(); time <= end.getTime(); time += intervalMs) {
      const timeStr = new Date(time).toISOString();
      const rate = Math.round((Math.random() * 20 + 80) * 100) / 100; // 80-100%
      data.push({ time: timeStr, rate });
    }

    return data;
  }

  /**
   * Get latency trend
   */
  private async getLatencyTrend(start: Date, end: Date): Promise<Array<{ time: string; latency: number }>> {
    const data = [];
    const intervalMs = 30 * 60 * 1000; // 30 minutes
    
    for (let time = start.getTime(); time <= end.getTime(); time += intervalMs) {
      const timeStr = new Date(time).toISOString();
      const latency = Math.round(Math.random() * 2000 + 500); // 500-2500ms
      data.push({ time: timeStr, latency });
    }

    return data;
  }

  /**
   * Get queue size trend
   */
  private async getQueueSizeTrend(start: Date, end: Date): Promise<Record<string, Array<{ time: string; size: number }>>> {
    const allStats = await this.queueManager.getAllQueueStats();
    const trends: Record<string, Array<{ time: string; size: number }>> = {};
    const intervalMs = 30 * 60 * 1000; // 30 minutes

    for (const queueName of Object.keys(allStats)) {
      trends[queueName] = [];
      
      for (let time = start.getTime(); time <= end.getTime(); time += intervalMs) {
        const timeStr = new Date(time).toISOString();
        const size = Math.round(Math.random() * 50 + 5); // Mock queue size
        trends[queueName].push({ time: timeStr, size });
      }
    }

    return trends;
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(async () => {
      try {
        const metrics = await this.getPerformanceMetrics();
        const timestamp = new Date().toISOString();
        
        // Store metrics history
        const history = this.metricsHistory.get('performance') || [];
        history.push({ timestamp, ...metrics });
        
        // Keep only last 100 entries
        if (history.length > 100) {
          history.shift();
        }
        
        this.metricsHistory.set('performance', history);
        
        // Store in Redis for persistence
        await this.redis.zadd(
          'queue_dashboard:performance_history',
          Date.now(),
          JSON.stringify({ timestamp, ...metrics })
        );
        
        // Keep only last 24 hours of data
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        await this.redis.zremrangebyscore('queue_dashboard:performance_history', 0, oneDayAgo);
        
      } catch (error: any) {
        logger.error('[QUEUE_DASHBOARD] Failed to collect metrics:', error);
      }
    }, 60000); // Collect every minute
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    await this.queueManager.pauseQueue(queueName);
    
    this.alerts.push(this.createAlert(
      'info',
      'Queue Paused',
      `Queue ${queueName} has been manually paused`,
      queueName
    ));
  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    await this.queueManager.resumeQueue(queueName);
    
    this.alerts.push(this.createAlert(
      'info',
      'Queue Resumed',
      `Queue ${queueName} has been resumed`,
      queueName
    ));
  }

  /**
   * Retry failed jobs in queue
   */
  async retryFailedJobs(queueName: string, limit?: number): Promise<void> {
    await this.queueManager.retryFailedJobs(queueName, limit);
    
    this.alerts.push(this.createAlert(
      'info',
      'Jobs Retried',
      `Retried failed jobs in queue ${queueName}${limit ? ` (limit: ${limit})` : ''}`,
      queueName
    ));
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(queueName: string, olderThanHours: number = 24): Promise<void> {
    const grace = olderThanHours * 60 * 60 * 1000;
    await this.queueManager.cleanQueue(queueName, grace);
    
    this.alerts.push(this.createAlert(
      'info',
      'Queue Cleaned',
      `Cleaned old jobs from queue ${queueName} (older than ${olderThanHours} hours)`,
      queueName
    ));
  }

  /**
   * Export metrics for external monitoring
   */
  async exportMetrics(): Promise<any> {
    const dashboardData = await this.getDashboardData();
    
    return {
      timestamp: new Date().toISOString(),
      system: {
        health: dashboardData.overview.systemHealth,
        uptime: dashboardData.overview.uptime,
        totalQueues: dashboardData.overview.totalQueues,
        totalWorkers: dashboardData.overview.totalWorkers,
      },
      queues: Object.values(dashboardData.queues).map(queue => ({
        name: queue.name,
        health: queue.health,
        waiting: queue.jobs.waiting,
        active: queue.jobs.active,
        failed: queue.jobs.failed,
        successRate: queue.throughput.successRate,
      })),
      performance: dashboardData.performance,
      alerts: dashboardData.alerts.length,
    };
  }

  /**
   * Shutdown dashboard
   */
  async shutdown(): Promise<void> {
    this.metricsHistory.clear();
    this.alerts = [];

  }
}

export default QueueDashboard;