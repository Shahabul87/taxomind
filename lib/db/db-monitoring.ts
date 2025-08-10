/**
 * Database Performance Monitoring
 * Comprehensive monitoring and alerting for database operations
 */

import { PrismaClient } from '@prisma/client';
import { ConnectionPoolManager } from './connection-pool';
import { DatabaseReplicaManager } from './db-replicas';

export interface QueryPerformanceData {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  affectedRows?: number;
  poolName?: string;
}

export interface DatabaseMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  peakQueryTime: number;
  queriesPerSecond: number;
  lastUpdated: Date;
}

export interface PerformanceAlert {
  id: string;
  type: 'slow-query' | 'high-error-rate' | 'connection-issue' | 'resource-exhaustion';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  acknowledged: boolean;
}

export interface PerformanceThresholds {
  slowQueryThreshold: number; // ms
  errorRateThreshold: number; // percentage
  connectionUtilizationThreshold: number; // percentage
  queriesPerSecondThreshold: number;
  memoryUsageThreshold: number; // percentage
}

/**
 * Database Performance Monitor
 */
export class DatabasePerformanceMonitor {
  private connectionPoolManager?: ConnectionPoolManager;
  private replicaManager?: DatabaseReplicaManager;
  private queryHistory: QueryPerformanceData[] = [];
  private metrics: Map<string, DatabaseMetrics> = new Map();
  private alerts: PerformanceAlert[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private thresholds: PerformanceThresholds;
  private maxHistorySize = 10000;

  constructor(
    connectionPoolManager?: ConnectionPoolManager,
    replicaManager?: DatabaseReplicaManager
  ) {
    this.connectionPoolManager = connectionPoolManager;
    this.replicaManager = replicaManager;
    
    this.thresholds = {
      slowQueryThreshold: 1000, // 1 second
      errorRateThreshold: 5, // 5%
      connectionUtilizationThreshold: 80, // 80%
      queriesPerSecondThreshold: 1000,
      memoryUsageThreshold: 85, // 85%
    };

    this.startMonitoring();
  }

  /**
   * Record query performance data
   */
  recordQuery(data: QueryPerformanceData): void {
    // Add to history
    this.queryHistory.push(data);
    
    // Maintain history size limit
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(-this.maxHistorySize);
    }

    // Update metrics
    this.updateMetrics(data);
    
    // Check for alerts
    this.checkForAlerts(data);
  }

  /**
   * Wrap Prisma client to monitor queries
   */
  wrapPrismaClient(client: PrismaClient, poolName?: string): PrismaClient {
    // Create proxy to intercept query methods
    return new Proxy(client, {
      get: (target, prop) => {
        const originalMethod = target[prop as keyof PrismaClient];
        
        // Intercept query methods
        if (typeof originalMethod === 'function' && this.isQueryMethod(prop as string)) {
          return async (...args: any[]) => {
            const startTime = Date.now();
            const queryInfo = this.extractQueryInfo(prop as string, args);
            
            try {
              const result = await originalMethod.apply(target, args);
              
              this.recordQuery({
                query: queryInfo.query,
                duration: Date.now() - startTime,
                timestamp: new Date(),
                success: true,
                affectedRows: queryInfo.affectedRows,
                poolName,
              });
              
              return result;
              
            } catch (error) {
              this.recordQuery({
                query: queryInfo.query,
                duration: Date.now() - startTime,
                timestamp: new Date(),
                success: false,
                errorMessage: (error as Error).message,
                poolName,
              });
              
              throw error;
            }
          };
        }
        
        return originalMethod;
      },
    });
  }

  /**
   * Check if method is a query method
   */
  private isQueryMethod(method: string): boolean {
    const queryMethods = [
      'findMany', 'findUnique', 'findFirst', 'findUniqueOrThrow', 'findFirstOrThrow',
      'create', 'createMany', 'update', 'updateMany', 'upsert',
      'delete', 'deleteMany', 'count', 'aggregate', 'groupBy',
      '$queryRaw', '$executeRaw', '$transaction'
    ];
    
    return queryMethods.some(qm => method.includes(qm));
  }

  /**
   * Extract query information from method call
   */
  private extractQueryInfo(method: string, args: any[]): { query: string; affectedRows?: number } {
    let query = `${method}()`;
    let affectedRows: number | undefined;

    try {
      if (args.length > 0 && typeof args[0] === 'object') {
        const firstArg = args[0];
        
        // Extract relevant information from query args
        if (firstArg.where) {
          query += ` WHERE ${JSON.stringify(firstArg.where)}`;
        }
        
        if (firstArg.data) {
          query += ` DATA ${JSON.stringify(firstArg.data)}`;
        }
        
        if (firstArg.select) {
          query += ` SELECT ${JSON.stringify(firstArg.select)}`;
        }
        
        if (firstArg.include) {
          query += ` INCLUDE ${JSON.stringify(firstArg.include)}`;
        }
      }
      
      // Truncate very long queries
      if (query.length > 500) {
        query = query.substring(0, 500) + '...';
      }
      
    } catch (error) {
      // If we can't parse the query, just use the method name
      query = method;
    }

    return { query, affectedRows };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(data: QueryPerformanceData): void {
    const poolName = data.poolName || 'default';
    let metrics = this.metrics.get(poolName);
    
    if (!metrics) {
      metrics = {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        peakQueryTime: 0,
        queriesPerSecond: 0,
        lastUpdated: new Date(),
      };
      this.metrics.set(poolName, metrics);
    }

    // Update counters
    metrics.totalQueries++;
    
    if (data.success) {
      metrics.successfulQueries++;
    } else {
      metrics.failedQueries++;
    }

    // Update timing metrics
    metrics.averageQueryTime = 
      (metrics.averageQueryTime * (metrics.totalQueries - 1) + data.duration) / metrics.totalQueries;
    
    if (data.duration > metrics.peakQueryTime) {
      metrics.peakQueryTime = data.duration;
    }
    
    if (data.duration > this.thresholds.slowQueryThreshold) {
      metrics.slowQueries++;
    }

    // Calculate queries per second (over last minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentQueries = this.queryHistory.filter(q => 
      q.poolName === poolName && q.timestamp >= oneMinuteAgo
    );
    metrics.queriesPerSecond = recentQueries.length / 60;

    metrics.lastUpdated = new Date();
  }

  /**
   * Check for performance alerts
   */
  private checkForAlerts(data: QueryPerformanceData): void {
    // Slow query alert
    if (data.duration > this.thresholds.slowQueryThreshold) {
      this.createAlert({
        type: 'slow-query',
        severity: data.duration > this.thresholds.slowQueryThreshold * 2 ? 'critical' : 'warning',
        message: `Slow query detected: ${data.duration}ms`,
        details: {
          query: data.query,
          duration: data.duration,
          poolName: data.poolName,
          threshold: this.thresholds.slowQueryThreshold,
        },
      });
    }

    // Query failure alert
    if (!data.success) {
      this.createAlert({
        type: 'high-error-rate',
        severity: 'warning',
        message: `Query failed: ${data.errorMessage}`,
        details: {
          query: data.query,
          error: data.errorMessage,
          poolName: data.poolName,
        },
      });
    }

    // Check error rate
    const poolMetrics = this.metrics.get(data.poolName || 'default');
    if (poolMetrics && poolMetrics.totalQueries > 10) {
      const errorRate = (poolMetrics.failedQueries / poolMetrics.totalQueries) * 100;
      
      if (errorRate > this.thresholds.errorRateThreshold) {
        this.createAlert({
          type: 'high-error-rate',
          severity: errorRate > this.thresholds.errorRateThreshold * 2 ? 'critical' : 'warning',
          message: `High error rate: ${errorRate.toFixed(1)}%`,
          details: {
            errorRate,
            totalQueries: poolMetrics.totalQueries,
            failedQueries: poolMetrics.failedQueries,
            poolName: data.poolName,
          },
        });
      }
    }
  }

  /**
   * Create performance alert
   */
  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: PerformanceAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    console.warn(`[DB_MONITOR] ${alert.severity.toUpperCase()} ALERT: ${alert.message}`);
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.performSystemCheck();
    }, 60000); // Check every minute

    console.log('[DB_MONITOR] Started database performance monitoring');
  }

  /**
   * Perform system-wide performance check
   */
  private async performSystemCheck(): Promise<void> {
    try {
      // Check connection pool health
      if (this.connectionPoolManager) {
        const poolSummary = this.connectionPoolManager.getPoolSummary();
        
        if (poolSummary.averageUtilization > this.thresholds.connectionUtilizationThreshold) {
          this.createAlert({
            type: 'connection-issue',
            severity: 'warning',
            message: `High connection pool utilization: ${poolSummary.averageUtilization.toFixed(1)}%`,
            details: poolSummary,
          });
        }
      }

      // Check replica health
      if (this.replicaManager) {
        const status = this.replicaManager.getDatabaseStatus();
        
        if (status.healthyReplicas === 0 && status.replicas.length > 0) {
          this.createAlert({
            type: 'connection-issue',
            severity: 'critical',
            message: 'No healthy read replicas available',
            details: status,
          });
        }
      }

      // Check system resources
      await this.checkSystemResources();

    } catch (error) {
      console.error('[DB_MONITOR] System check failed:', error);
    }
  }

  /**
   * Check system resources
   */
  private async checkSystemResources(): Promise<void> {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const memoryUsagePercentage = (memUsage.rss / totalMemory) * 100;

    if (memoryUsagePercentage > this.thresholds.memoryUsageThreshold) {
      this.createAlert({
        type: 'resource-exhaustion',
        severity: memoryUsagePercentage > 95 ? 'critical' : 'warning',
        message: `High memory usage: ${memoryUsagePercentage.toFixed(1)}%`,
        details: {
          memoryUsage: memUsage,
          totalMemory,
          usagePercentage: memoryUsagePercentage,
        },
      });
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    summary: {
      totalQueries: number;
      averageQueryTime: number;
      slowQueries: number;
      errorRate: number;
      peakQueryTime: number;
    };
    metrics: Record<string, DatabaseMetrics>;
    recentSlowQueries: QueryPerformanceData[];
    recentErrors: QueryPerformanceData[];
    activeAlerts: PerformanceAlert[];
  } {
    const allMetrics = Array.from(this.metrics.values());
    const totalQueries = allMetrics.reduce((sum, m) => sum + m.totalQueries, 0);
    const totalSuccessful = allMetrics.reduce((sum, m) => sum + m.successfulQueries, 0);
    const totalFailed = allMetrics.reduce((sum, m) => sum + m.failedQueries, 0);
    const totalSlowQueries = allMetrics.reduce((sum, m) => sum + m.slowQueries, 0);
    
    const averageQueryTime = allMetrics.length > 0 ?
      allMetrics.reduce((sum, m) => sum + m.averageQueryTime, 0) / allMetrics.length : 0;
    
    const peakQueryTime = allMetrics.length > 0 ?
      Math.max(...allMetrics.map(m => m.peakQueryTime)) : 0;

    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentSlowQueries = this.queryHistory
      .filter(q => q.timestamp >= oneHourAgo && q.duration > this.thresholds.slowQueryThreshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const recentErrors = this.queryHistory
      .filter(q => q.timestamp >= oneHourAgo && !q.success)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const activeAlerts = this.alerts
      .filter(alert => !alert.acknowledged)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      summary: {
        totalQueries,
        averageQueryTime: Math.round(averageQueryTime),
        slowQueries: totalSlowQueries,
        errorRate: totalQueries > 0 ? Math.round((totalFailed / totalQueries) * 100 * 100) / 100 : 0,
        peakQueryTime: Math.round(peakQueryTime),
      },
      metrics: Object.fromEntries(this.metrics.entries()),
      recentSlowQueries,
      recentErrors,
      activeAlerts,
    };
  }

  /**
   * Get query history
   */
  getQueryHistory(limit?: number): QueryPerformanceData[] {
    const sorted = [...this.queryHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends(hours: number = 24): {
    queryVolume: Array<{ time: string; count: number }>;
    averageLatency: Array<{ time: string; latency: number }>;
    errorRate: Array<{ time: string; rate: number }>;
  } {
    const now = new Date();
    const startTime = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    const intervalMs = (hours * 60 * 60 * 1000) / 24; // 24 data points

    const trends = {
      queryVolume: [] as Array<{ time: string; count: number }>,
      averageLatency: [] as Array<{ time: string; latency: number }>,
      errorRate: [] as Array<{ time: string; rate: number }>,
    };

    for (let i = 0; i < 24; i++) {
      const intervalStart = new Date(startTime.getTime() + (i * intervalMs));
      const intervalEnd = new Date(startTime.getTime() + ((i + 1) * intervalMs));
      
      const intervalQueries = this.queryHistory.filter(q =>
        q.timestamp >= intervalStart && q.timestamp < intervalEnd
      );

      const count = intervalQueries.length;
      const avgLatency = count > 0 ?
        intervalQueries.reduce((sum, q) => sum + q.duration, 0) / count : 0;
      const errorCount = intervalQueries.filter(q => !q.success).length;
      const errorRate = count > 0 ? (errorCount / count) * 100 : 0;

      trends.queryVolume.push({
        time: intervalStart.toISOString(),
        count,
      });

      trends.averageLatency.push({
        time: intervalStart.toISOString(),
        latency: Math.round(avgLatency),
      });

      trends.errorRate.push({
        time: intervalStart.toISOString(),
        rate: Math.round(errorRate * 100) / 100,
      });
    }

    return trends;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('[DB_MONITOR] Updated performance thresholds:', this.thresholds);
  }

  /**
   * Clear history and metrics
   */
  clearHistory(): void {
    this.queryHistory = [];
    this.metrics.clear();
    this.alerts = [];
    console.log('[DB_MONITOR] Cleared performance history and metrics');
  }

  /**
   * Export monitoring data
   */
  exportData(): {
    thresholds: PerformanceThresholds;
    metrics: Record<string, DatabaseMetrics>;
    recentQueries: QueryPerformanceData[];
    alerts: PerformanceAlert[];
    exportedAt: Date;
  } {
    return {
      thresholds: this.thresholds,
      metrics: Object.fromEntries(this.metrics.entries()),
      recentQueries: this.queryHistory.slice(-1000), // Last 1000 queries
      alerts: this.alerts,
      exportedAt: new Date(),
    };
  }

  /**
   * Shutdown monitoring
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.queryHistory = [];
    this.metrics.clear();
    this.alerts = [];

    console.log('[DB_MONITOR] Database performance monitoring stopped');
  }
}

export default DatabasePerformanceMonitor;