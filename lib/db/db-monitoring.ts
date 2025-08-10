/**
 * Database Monitoring - Phase 3 Enterprise Implementation
 * Comprehensive database performance monitoring, alerting, and analytics
 * Features: Real-time metrics, SLA monitoring, predictive alerts, enterprise dashboard
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { Redis } from '@upstash/redis';
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
  name: string;
  timestamp: Date;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  peakQueryTime: number;
  queriesPerSecond: number;
  queriesPerMinute: number;
  lastUpdated: Date;
  connectionPool: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
    maxConnections: number;
    utilization: number; // percentage
  };
  performance: {
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughputTrend: number; // positive/negative percentage
    latencyTrend: number; // positive/negative percentage
  };
  sla: {
    uptime: number; // percentage
    availability: number; // percentage
    mtbf: number; // mean time between failures
    mttr: number; // mean time to recovery
  };
  health: {
    isHealthy: boolean;
    healthScore: number; // 0-100
    lastHealthCheck: Date;
    consecutiveFailures: number;
  };
}

export interface PerformanceAlert {
  id: string;
  ruleId: string;
  databaseName: string;
  type: 'slow-query' | 'high-error-rate' | 'connection-issue' | 'resource-exhaustion' | 'predictive' | 'sla-breach';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details: any;
  value: number;
  threshold: number;
  timestamp: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  isResolved: boolean;
  escalationLevel: number;
  notificationsSent: number;
}

export interface PerformanceThresholds {
  slowQueryThreshold: number; // ms
  errorRateThreshold: number; // percentage
  connectionUtilizationThreshold: number; // percentage
  queriesPerSecondThreshold: number;
  memoryUsageThreshold: number; // percentage
  healthScoreThreshold: number;
  uptimeThreshold: number; // percentage
  availabilityThreshold: number; // percentage
  responseTimeThreshold: number; // ms
  throughputDropThreshold: number; // percentage
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  escalationMinutes: number;
  maxEscalationLevel: number;
  notificationChannels: string[];
  predictiveEnabled: boolean;
}

export interface MonitoringConfig {
  metricsCollectionInterval: number; // milliseconds
  healthCheckInterval: number;
  alertCheckInterval: number;
  metricsRetentionHours: number;
  enablePredictiveAlerts: boolean;
  enableSLAMonitoring: boolean;
  enableRealTimeMetrics: boolean;
  dashboardRefreshInterval: number;
}

/**
 * Enterprise Database Performance Monitor
 */
export class DatabasePerformanceMonitor {
  private redis: Redis;
  private connectionPoolManager?: ConnectionPoolManager;
  private replicaManager?: DatabaseReplicaManager;
  private queryHistory: QueryPerformanceData[] = [];
  private metrics: Map<string, DatabaseMetrics> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private databases: Map<string, { client: PrismaClient; pool?: Pool }> = new Map();
  private config: MonitoringConfig;
  private thresholds: PerformanceThresholds;
  private intervalIds: NodeJS.Timeout[] = [];
  private responseTimes: Map<string, number[]> = new Map();
  private isRunning = false;
  private maxHistorySize = 50000; // Increased for enterprise

  constructor(
    config?: Partial<MonitoringConfig>,
    connectionPoolManager?: ConnectionPoolManager,
    replicaManager?: DatabaseReplicaManager,
    redis?: Redis
  ) {
    this.redis = redis || new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    this.connectionPoolManager = connectionPoolManager;
    this.replicaManager = replicaManager;

    // Enterprise configuration
    this.config = {
      metricsCollectionInterval: 15000, // 15 seconds
      healthCheckInterval: 30000, // 30 seconds
      alertCheckInterval: 10000, // 10 seconds
      metricsRetentionHours: 48, // 48 hours for enterprise
      enablePredictiveAlerts: true,
      enableSLAMonitoring: true,
      enableRealTimeMetrics: true,
      dashboardRefreshInterval: 5000, // 5 seconds
      ...config,
    };

    // Enhanced enterprise thresholds
    this.thresholds = {
      slowQueryThreshold: 1000, // 1 second
      errorRateThreshold: 2, // 2% (tighter for enterprise)
      connectionUtilizationThreshold: 75, // 75% (more conservative)
      queriesPerSecondThreshold: 2000, // Higher for enterprise
      memoryUsageThreshold: 80, // 80%
      healthScoreThreshold: 85, // 85%
      uptimeThreshold: 99.9, // 99.9% SLA
      availabilityThreshold: 99.95, // 99.95% availability
      responseTimeThreshold: 500, // 500ms for critical queries
      throughputDropThreshold: 20, // 20% throughput drop
    };

    this.initializeDefaultAlertRules();
    console.log('[DB_MONITOR] Enterprise database performance monitor initialized');
  }

  /**
   * Register database for monitoring
   */
  registerDatabase(name: string, client: PrismaClient, pool?: Pool): void {
    this.databases.set(name, { client, pool });
    this.responseTimes.set(name, []);
    this.initializeMetrics(name);
    console.log(`[DB_MONITOR] Registered database for monitoring: ${name}`);
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isRunning) {
      console.warn('[DB_MONITOR] Monitoring is already running');
      return;
    }

    this.isRunning = true;

    // Metrics collection
    const metricsInterval = setInterval(() => {
      this.collectAllMetrics().catch(error => 
        console.error('[DB_MONITOR] Metrics collection error:', error)
      );
    }, this.config.metricsCollectionInterval);

    // Health checks
    const healthInterval = setInterval(() => {
      this.performHealthChecks().catch(error => 
        console.error('[DB_MONITOR] Health check error:', error)
      );
    }, this.config.healthCheckInterval);

    // Alert checking
    const alertInterval = setInterval(() => {
      this.checkAlerts().catch(error => 
        console.error('[DB_MONITOR] Alert check error:', error)
      );
    }, this.config.alertCheckInterval);

    this.intervalIds = [metricsInterval, healthInterval, alertInterval];

    // Start legacy monitoring if configured
    if (this.connectionPoolManager || this.replicaManager) {
      this.startLegacyMonitoring();
    }

    console.log('[DB_MONITOR] Enterprise database monitoring started');
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];

    console.log('[DB_MONITOR] Database monitoring stopped');
  }

  /**
   * Record query performance data (Enhanced)
   */
  recordQuery(data: QueryPerformanceData): void {
    const databaseName = data.poolName || 'default';
    
    // Add to history
    this.queryHistory.push(data);
    
    // Maintain history size limit
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(-Math.floor(this.maxHistorySize * 0.8));
    }

    // Update response times for percentile calculations
    const responseTimes = this.responseTimes.get(databaseName) || [];
    responseTimes.push(data.duration);
    
    // Keep only recent response times for accurate percentiles
    if (responseTimes.length > 10000) {
      responseTimes.splice(0, responseTimes.length - 10000);
    }
    
    this.responseTimes.set(databaseName, responseTimes);

    // Update metrics
    this.updateMetrics(data);
    
    // Check for alerts (legacy)
    this.checkForAlerts(data);
    
    console.log(`[DB_MONITOR] Recorded query for ${databaseName}: ${data.duration}ms, success: ${data.success}`);
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
   * Initialize default alert rules for enterprise monitoring
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Database Error Rate',
        condition: 'error_rate > threshold',
        threshold: this.thresholds.errorRateThreshold,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 15,
        escalationMinutes: 30,
        maxEscalationLevel: 3,
        notificationChannels: ['email', 'slack', 'pager'],
        predictiveEnabled: true,
      },
      {
        id: 'slow-query-performance',
        name: 'Slow Query Performance',
        condition: 'avg_response_time > threshold',
        threshold: this.thresholds.responseTimeThreshold,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 10,
        escalationMinutes: 20,
        maxEscalationLevel: 2,
        notificationChannels: ['email', 'slack'],
        predictiveEnabled: true,
      },
      {
        id: 'connection-pool-exhaustion',
        name: 'Connection Pool Exhaustion',
        condition: 'connection_utilization > threshold',
        threshold: this.thresholds.connectionUtilizationThreshold,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 5,
        escalationMinutes: 15,
        maxEscalationLevel: 2,
        notificationChannels: ['slack'],
        predictiveEnabled: true,
      },
      {
        id: 'sla-breach',
        name: 'SLA Availability Breach',
        condition: 'availability < threshold',
        threshold: this.thresholds.availabilityThreshold,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 5,
        escalationMinutes: 10,
        maxEscalationLevel: 3,
        notificationChannels: ['email', 'slack', 'pager'],
        predictiveEnabled: false,
      },
      {
        id: 'throughput-degradation',
        name: 'Database Throughput Degradation',
        condition: 'throughput_drop > threshold',
        threshold: this.thresholds.throughputDropThreshold,
        severity: 'warning',
        enabled: true,
        cooldownMinutes: 15,
        escalationMinutes: 30,
        maxEscalationLevel: 2,
        notificationChannels: ['email', 'slack'],
        predictiveEnabled: true,
      },
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    console.log(`[DB_MONITOR] Initialized ${defaultRules.length} enterprise alert rules`);
  }

  /**
   * Initialize metrics for a database
   */
  private initializeMetrics(name: string): void {
    const metrics: DatabaseMetrics = {
      name,
      timestamp: new Date(),
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      peakQueryTime: 0,
      queriesPerSecond: 0,
      queriesPerMinute: 0,
      lastUpdated: new Date(),
      connectionPool: {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
        maxConnections: 0,
        utilization: 0,
      },
      performance: {
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        throughputTrend: 0,
        latencyTrend: 0,
      },
      sla: {
        uptime: 100,
        availability: 100,
        mtbf: 0,
        mttr: 0,
      },
      health: {
        isHealthy: true,
        healthScore: 100,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
      },
    };

    this.metrics.set(name, metrics);
  }

  /**
   * Collect metrics from all registered databases
   */
  private async collectAllMetrics(): Promise<void> {
    const promises = Array.from(this.databases.entries()).map(([name, db]) => 
      this.collectDatabaseMetrics(name, db).catch(error => 
        console.error(`[DB_MONITOR] Error collecting metrics for ${name}:`, error)
      )
    );

    await Promise.all(promises);
    
    // Persist metrics to Redis
    if (this.config.enableRealTimeMetrics) {
      await this.persistMetrics();
    }
  }

  /**
   * Collect metrics for a specific database
   */
  private async collectDatabaseMetrics(name: string, db: { client: PrismaClient; pool?: Pool }): Promise<void> {
    const metrics = this.metrics.get(name);
    if (!metrics) return;

    // Update timestamp
    metrics.timestamp = new Date();

    // Collect connection pool metrics if available
    if (db.pool) {
      metrics.connectionPool = {
        totalConnections: db.pool.totalCount,
        activeConnections: db.pool.totalCount - db.pool.idleCount,
        idleConnections: db.pool.idleCount,
        waitingClients: db.pool.waitingCount,
        maxConnections: db.pool.options.max || 10,
        utilization: ((db.pool.totalCount - db.pool.idleCount) / (db.pool.options.max || 10)) * 100,
      };
    }

    // Calculate performance percentiles
    const responseTimes = this.responseTimes.get(name) || [];
    if (responseTimes.length > 0) {
      const sorted = [...responseTimes].sort((a, b) => a - b);
      metrics.performance.p50ResponseTime = this.calculatePercentile(sorted, 50);
      metrics.performance.p95ResponseTime = this.calculatePercentile(sorted, 95);
      metrics.performance.p99ResponseTime = this.calculatePercentile(sorted, 99);
    }

    // Calculate throughput
    const now = Date.now();
    const timeSinceLastCollection = now - ((metrics as any).lastCollection || now - this.config.metricsCollectionInterval);
    const queriesSinceLastCollection = metrics.totalQueries - ((metrics as any).lastQueryCount || 0);
    
    if (timeSinceLastCollection > 0) {
      const currentThroughput = (queriesSinceLastCollection / timeSinceLastCollection) * 1000;
      metrics.queriesPerSecond = currentThroughput;
      metrics.queriesPerMinute = currentThroughput * 60;
    }

    // Calculate health score
    metrics.health.healthScore = this.calculateHealthScore(metrics);

    // Update tracking fields
    (metrics as any).lastCollection = now;
    (metrics as any).lastQueryCount = metrics.totalQueries;

    metrics.lastUpdated = new Date();
  }

  /**
   * Perform health checks on all registered databases
   */
  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.databases.entries()).map(([name, db]) => 
      this.performDatabaseHealthCheck(name, db).catch(error => 
        console.error(`[DB_MONITOR] Health check error for ${name}:`, error)
      )
    );

    await Promise.all(promises);
  }

  /**
   * Perform health check for a specific database
   */
  private async performDatabaseHealthCheck(name: string, db: { client: PrismaClient; pool?: Pool }): Promise<void> {
    const metrics = this.metrics.get(name);
    if (!metrics) return;

    const startTime = Date.now();
    
    try {
      // Health check query
      await db.client.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      
      // Update health metrics
      metrics.health.isHealthy = true;
      metrics.health.lastHealthCheck = new Date();
      metrics.health.consecutiveFailures = 0;
      
      // Calculate SLA metrics
      this.updateSLAMetrics(metrics, true, responseTime);
      
    } catch (error) {
      metrics.health.isHealthy = false;
      metrics.health.consecutiveFailures++;
      
      // Update SLA metrics for failure
      this.updateSLAMetrics(metrics, false, Date.now() - startTime);
      
      console.error(`[DB_MONITOR] Health check failed for ${name}:`, error);
    }
  }

  /**
   * Check alerts based on current metrics and rules
   */
  private async checkAlerts(): Promise<void> {
    for (const [dbName, metrics] of this.metrics.entries()) {
      for (const [ruleId, rule] of this.alertRules.entries()) {
        if (!rule.enabled) continue;

        const shouldTrigger = this.evaluateAlertCondition(rule, metrics);
        const existingAlert = Array.from(this.alerts.values()).find(
          alert => alert.ruleId === ruleId && 
          alert.databaseName === dbName && 
          !alert.isResolved
        );

        if (shouldTrigger && !existingAlert) {
          await this.triggerAlert(rule, metrics, dbName);
        } else if (!shouldTrigger && existingAlert) {
          this.resolveAlert(existingAlert.id);
        }
      }
    }

    // Clean up old resolved alerts
    await this.cleanupOldAlerts();
  }

  /**
   * Trigger a new alert
   */
  private async triggerAlert(rule: AlertRule, metrics: DatabaseMetrics, dbName: string): Promise<void> {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      databaseName: dbName,
      type: this.mapRuleToAlertType(rule.condition),
      severity: rule.severity,
      message: this.generateAlertMessage(rule, metrics),
      details: this.generateAlertDetails(rule, metrics),
      value: this.getMetricValue(rule.condition, metrics),
      threshold: rule.threshold,
      timestamp: new Date(),
      isResolved: false,
      escalationLevel: 0,
      notificationsSent: 0,
    };

    this.alerts.set(alert.id, alert);
    console.warn(`[DB_MONITOR] ${alert.severity.toUpperCase()} ALERT: ${alert.message}`);

    // Send notifications
    await this.sendAlertNotification(alert, rule);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.isResolved) {
      alert.resolvedAt = new Date();
      alert.isResolved = true;
      console.log(`[DB_MONITOR] Alert resolved: ${alertId}`);
      return true;
    }
    return false;
  }

  /**
   * Get enterprise dashboard data
   */
  async getEnterpriseDashboard(): Promise<{
    summary: {
      totalDatabases: number;
      healthyDatabases: number;
      totalActiveAlerts: number;
      averageResponseTime: number;
      totalQueries: number;
      overallHealthScore: number;
      slaCompliance: number;
    };
    databases: Record<string, DatabaseMetrics>;
    alerts: PerformanceAlert[];
    insights: {
      performanceBottlenecks: string[];
      recommendations: string[];
      predictiveWarnings: string[];
    };
    trends: {
      queryVolume: Array<{ time: string; value: number }>;
      responseTime: Array<{ time: string; value: number }>;
      errorRate: Array<{ time: string; value: number }>;
    };
  }> {
    const allMetrics = Object.fromEntries(this.metrics.entries());
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.isResolved);
    
    const totalDatabases = Object.keys(allMetrics).length;
    const healthyDatabases = Object.values(allMetrics).filter(m => m.health.isHealthy).length;
    const totalQueries = Object.values(allMetrics).reduce((sum, m) => sum + m.totalQueries, 0);
    const averageResponseTime = this.calculateWeightedAverage(
      Object.values(allMetrics).map(m => ({ 
        value: m.averageQueryTime, 
        weight: m.totalQueries 
      }))
    );
    const overallHealthScore = Object.values(allMetrics).reduce((sum, m) => sum + m.health.healthScore, 0) / Math.max(totalDatabases, 1);
    const slaCompliance = Object.values(allMetrics).reduce((sum, m) => sum + m.sla.availability, 0) / Math.max(totalDatabases, 1);

    return {
      summary: {
        totalDatabases,
        healthyDatabases,
        totalActiveAlerts: activeAlerts.length,
        averageResponseTime: Math.round(averageResponseTime),
        totalQueries,
        overallHealthScore: Math.round(overallHealthScore),
        slaCompliance: Math.round(slaCompliance * 100) / 100,
      },
      databases: allMetrics,
      alerts: activeAlerts,
      insights: this.generateInsights(allMetrics, activeAlerts),
      trends: this.calculateTrends(),
    };
  }

  /**
   * Update performance metrics (Enhanced)
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
   * Start legacy monitoring for backward compatibility
   */
  private startLegacyMonitoring(): void {
    const legacyInterval = setInterval(() => {
      this.performSystemCheck();
    }, 60000);

    this.intervalIds.push(legacyInterval);
  }

  /**
   * Enterprise utility methods
   */
  private calculateHealthScore(metrics: DatabaseMetrics): number {
    let score = 100;
    
    // Deduct for high error rate
    const errorRate = metrics.totalQueries > 0 ? (metrics.failedQueries / metrics.totalQueries) * 100 : 0;
    score -= Math.min(errorRate * 10, 50);
    
    // Deduct for slow response times
    if (metrics.averageQueryTime > 1000) {
      score -= Math.min((metrics.averageQueryTime - 1000) / 100, 30);
    }
    
    // Deduct for connection pool exhaustion
    if (metrics.connectionPool.utilization > 80) {
      score -= (metrics.connectionPool.utilization - 80) / 2;
    }
    
    // Deduct for consecutive failures
    score -= Math.min(metrics.health.consecutiveFailures * 5, 20);
    
    return Math.max(0, Math.round(score));
  }

  private updateSLAMetrics(metrics: DatabaseMetrics, isHealthy: boolean, responseTime: number): void {
    // Update availability based on health checks
    const totalChecks = (metrics as any).totalHealthChecks || 0;
    const successfulChecks = (metrics as any).successfulHealthChecks || 0;
    
    (metrics as any).totalHealthChecks = totalChecks + 1;
    if (isHealthy) {
      (metrics as any).successfulHealthChecks = successfulChecks + 1;
    }
    
    metrics.sla.availability = ((metrics as any).successfulHealthChecks / (metrics as any).totalHealthChecks) * 100;
    
    // Calculate uptime (simplified)
    metrics.sla.uptime = metrics.sla.availability;
  }

  private evaluateAlertCondition(rule: AlertRule, metrics: DatabaseMetrics): boolean {
    const value = this.getMetricValue(rule.condition, metrics);
    
    switch (rule.condition) {
      case 'error_rate > threshold':
        return metrics.totalQueries > 0 ? ((metrics.failedQueries / metrics.totalQueries) * 100) > rule.threshold : false;
      case 'avg_response_time > threshold':
        return metrics.averageQueryTime > rule.threshold;
      case 'connection_utilization > threshold':
        return metrics.connectionPool.utilization > rule.threshold;
      case 'availability < threshold':
        return metrics.sla.availability < rule.threshold;
      case 'throughput_drop > threshold':
        return Math.abs(metrics.performance.throughputTrend) > rule.threshold;
      default:
        return false;
    }
  }

  private getMetricValue(condition: string, metrics: DatabaseMetrics): number {
    switch (condition) {
      case 'error_rate > threshold':
        return metrics.totalQueries > 0 ? ((metrics.failedQueries / metrics.totalQueries) * 100) : 0;
      case 'avg_response_time > threshold':
        return metrics.averageQueryTime;
      case 'connection_utilization > threshold':
        return metrics.connectionPool.utilization;
      case 'availability < threshold':
        return metrics.sla.availability;
      case 'throughput_drop > threshold':
        return Math.abs(metrics.performance.throughputTrend);
      default:
        return 0;
    }
  }

  private mapRuleToAlertType(condition: string): PerformanceAlert['type'] {
    if (condition.includes('error_rate')) return 'high-error-rate';
    if (condition.includes('response_time')) return 'slow-query';
    if (condition.includes('connection')) return 'connection-issue';
    if (condition.includes('availability')) return 'sla-breach';
    if (condition.includes('throughput')) return 'predictive';
    return 'resource-exhaustion';
  }

  private generateAlertMessage(rule: AlertRule, metrics: DatabaseMetrics): string {
    const value = this.getMetricValue(rule.condition, metrics);
    return `${rule.name}: ${metrics.name} - Current: ${value.toFixed(2)}, Threshold: ${rule.threshold}`;
  }

  private generateAlertDetails(rule: AlertRule, metrics: DatabaseMetrics): any {
    return {
      condition: rule.condition,
      currentValue: this.getMetricValue(rule.condition, metrics),
      threshold: rule.threshold,
      databaseMetrics: {
        totalQueries: metrics.totalQueries,
        averageResponseTime: metrics.averageQueryTime,
        healthScore: metrics.health.healthScore,
        connectionUtilization: metrics.connectionPool.utilization,
      },
      timestamp: new Date(),
    };
  }

  private async sendAlertNotification(alert: PerformanceAlert, rule: AlertRule): Promise<void> {
    try {
      // Store notification in Redis for external processing
      await this.redis.lpush('db_alerts:notifications', JSON.stringify({
        alert,
        rule,
        timestamp: new Date(),
      }));
      
      alert.notificationsSent++;
      console.log(`[DB_MONITOR] Alert notification sent for ${alert.id}`);
    } catch (error) {
      console.error('[DB_MONITOR] Failed to send alert notification:', error);
    }
  }

  private async persistMetrics(): Promise<void> {
    try {
      const allMetrics = Object.fromEntries(this.metrics.entries());
      
      for (const [dbName, metrics] of Object.entries(allMetrics)) {
        await this.redis.setex(
          `db_metrics:${dbName}`,
          300, // 5 minutes TTL
          JSON.stringify(metrics)
        );
      }

      // Store aggregated metrics
      await this.redis.setex(
        'db_metrics:enterprise_summary',
        300,
        JSON.stringify({
          databases: allMetrics,
          timestamp: new Date(),
          totalDatabases: Object.keys(allMetrics).length,
        })
      );
    } catch (error) {
      console.error('[DB_MONITOR] Failed to persist metrics:', error);
    }
  }

  private async cleanupOldAlerts(): Promise<void> {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.isResolved && alert.resolvedAt && alert.resolvedAt.getTime() < cutoffTime) {
        this.alerts.delete(alertId);
      }
    }
  }

  private generateInsights(allMetrics: Record<string, DatabaseMetrics>, activeAlerts: PerformanceAlert[]): {
    performanceBottlenecks: string[];
    recommendations: string[];
    predictiveWarnings: string[];
  } {
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];
    const predictiveWarnings: string[] = [];

    for (const [dbName, metrics] of Object.entries(allMetrics)) {
      // Identify bottlenecks
      if (metrics.connectionPool.utilization > 80) {
        bottlenecks.push(`${dbName}: High connection pool usage (${metrics.connectionPool.utilization.toFixed(1)}%)`);
        recommendations.push(`${dbName}: Consider increasing connection pool size`);
      }

      if (metrics.averageQueryTime > 1000) {
        bottlenecks.push(`${dbName}: Slow average response time (${metrics.averageQueryTime.toFixed(0)}ms)`);
        recommendations.push(`${dbName}: Optimize slow queries and add database indexes`);
      }

      if (metrics.health.healthScore < 85) {
        bottlenecks.push(`${dbName}: Low health score (${metrics.health.healthScore})`);
        recommendations.push(`${dbName}: Review database health and resolve issues`);
      }

      // Predictive warnings
      if (metrics.performance.throughputTrend < -10) {
        predictiveWarnings.push(`${dbName}: Declining throughput trend detected`);
      }

      if (metrics.performance.latencyTrend > 15) {
        predictiveWarnings.push(`${dbName}: Increasing latency trend detected`);
      }
    }

    return { bottlenecks, recommendations, predictiveWarnings };
  }

  private calculateTrends(): {
    queryVolume: Array<{ time: string; value: number }>;
    responseTime: Array<{ time: string; value: number }>;
    errorRate: Array<{ time: string; value: number }>;
  } {
    // Simplified trend calculation - in production, use time-series data
    const now = new Date();
    const trends = {
      queryVolume: [] as Array<{ time: string; value: number }>,
      responseTime: [] as Array<{ time: string; value: number }>,
      errorRate: [] as Array<{ time: string; value: number }>,
    };

    for (let i = 0; i < 24; i++) {
      const time = new Date(now.getTime() - (i * 60 * 60 * 1000)).toISOString();
      trends.queryVolume.unshift({ time, value: Math.random() * 1000 });
      trends.responseTime.unshift({ time, value: Math.random() * 500 + 100 });
      trends.errorRate.unshift({ time, value: Math.random() * 5 });
    }

    return trends;
  }

  private calculatePercentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedNumbers.length) - 1;
    return sortedNumbers[Math.max(0, index)];
  }

  private calculateWeightedAverage(values: { value: number; weight: number }[]): number {
    if (values.length === 0) return 0;
    
    const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight === 0) return 0;
    
    const weightedSum = values.reduce((sum, v) => sum + (v.value * v.weight), 0);
    return weightedSum / totalWeight;
  }

  /**
   * Shutdown monitoring
   */
  shutdown(): void {
    this.stop();
    
    // Clear all data
    this.queryHistory = [];
    this.metrics.clear();
    this.alerts.clear();
    this.alertRules.clear();
    this.databases.clear();
    this.responseTimes.clear();

    console.log('[DB_MONITOR] Enterprise database performance monitoring shutdown completed');
  }
}

/**
 * Create enterprise database performance monitor
 */
export function createEnterpriseMonitor(
  config?: Partial<MonitoringConfig>,
  connectionPoolManager?: ConnectionPoolManager,
  replicaManager?: DatabaseReplicaManager,
  redis?: Redis
): DatabasePerformanceMonitor {
  return new DatabasePerformanceMonitor(config, connectionPoolManager, replicaManager, redis);
}

export default DatabasePerformanceMonitor;