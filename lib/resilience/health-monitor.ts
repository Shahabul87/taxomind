/**
 * Health Monitor Implementation - Phase 3
 * Comprehensive service health monitoring with Redis persistence,
 * alerting, and integration with circuit breakers and API gateway
 */

import { Redis } from '@upstash/redis';
import { CircuitBreakerManager } from './circuit-breaker';
import { logger } from '@/lib/logger';

export interface ServiceHealthCheck {
  name: string;
  url: string;
  interval: number;
  timeout: number;
  path?: string;
  method?: 'GET' | 'POST' | 'HEAD';
  expectedStatus?: number[];
  headers?: Record<string, string>;
  retries?: number;
  alertThreshold?: number;
  critical?: boolean;
  tags?: string[];
  description?: string;
}

export interface HealthCheck {
  name: string;
  description: string;
  check: () => Promise<HealthCheckResult>;
  interval: number;
  timeout: number;
  retries?: number;
  critical?: boolean;
  tags?: string[];
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'warning' | 'degraded';
  message?: string;
  duration: number;
  timestamp: Date;
  details?: Record<string, any>;
  consecutiveFailures?: number;
  uptime?: number;
  downtime?: number;
}

export interface HealthStatus {
  healthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
  error?: string;
  consecutiveFailures: number;
  uptime: number;
  downtime: number;
}

export interface HealthMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  uptimePercentage: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
}

export interface HealthReport {
  overallStatus: 'healthy' | 'unhealthy' | 'warning';
  services: Record<string, HealthCheckResult>;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    warning: number;
  };
  timestamp: Date;
  uptime: number;
}

export interface AlertConfig {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  destination: string;
  threshold: 'unhealthy' | 'warning' | 'critical';
  cooldownMs: number;
  template?: string;
}

/**
 * Health Monitor Class
 */
export class HealthMonitor {
  private redis: Redis;
  private systemChecks: Map<string, HealthCheck> = new Map();
  private serviceChecks: Map<string, ServiceHealthCheck> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private lastResults: Map<string, HealthCheckResult> = new Map();
  private healthStatus: Map<string, HealthStatus> = new Map();
  private healthMetrics: Map<string, HealthMetrics> = new Map();
  private alerts: AlertConfig[] = [];
  private alertCooldowns: Map<string, number> = new Map();
  private startTime: number;
  private circuitBreakerManager?: CircuitBreakerManager;
  private isMonitoring = false;
  private notificationCallbacks: Array<(serviceName: string, status: HealthStatus) => void> = [];

  constructor(redis?: Redis, circuitBreakerManager?: CircuitBreakerManager) {
    this.redis = redis || new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    this.circuitBreakerManager = circuitBreakerManager;
    this.startTime = Date.now();
    this.initializeDefaultChecks();
  }

  /**
   * Initialize default health checks
   */
  private initializeDefaultChecks(): void {
    // Database health check
    this.addCheck({
      name: 'database',
      description: 'PostgreSQL database connectivity',
      check: this.checkDatabase.bind(this),
      interval: 30000,
      timeout: 5000,
      retries: 2,
      critical: true,
      tags: ['database', 'critical'],
    });

    // Redis health check
    this.addCheck({
      name: 'redis',
      description: 'Redis cache connectivity',
      check: this.checkRedis.bind(this),
      interval: 30000,
      timeout: 3000,
      retries: 1,
      critical: true,
      tags: ['cache', 'redis', 'critical'],
    });

    // External API health check (example)
    this.addCheck({
      name: 'external-api',
      description: 'External API service availability',
      check: this.checkExternalAPI.bind(this),
      interval: 60000,
      timeout: 10000,
      retries: 2,
      critical: false,
      tags: ['external', 'api'],
    });

    // File system health check
    this.addCheck({
      name: 'filesystem',
      description: 'File system disk space and write permissions',
      check: this.checkFileSystem.bind(this),
      interval: 120000,
      timeout: 5000,
      retries: 1,
      critical: true,
      tags: ['filesystem', 'storage'],
    });

    // Memory usage health check
    this.addCheck({
      name: 'memory',
      description: 'Memory usage monitoring',
      check: this.checkMemoryUsage.bind(this),
      interval: 60000,
      timeout: 1000,
      critical: false,
      tags: ['system', 'memory'],
    });

    // Circuit breaker health check
    if (this.circuitBreakerManager) {
      this.addCheck({
        name: 'circuit-breakers',
        description: 'Circuit breaker status monitoring',
        check: this.checkCircuitBreakers.bind(this),
        interval: 30000,
        timeout: 2000,
        critical: false,
        tags: ['resilience', 'circuit-breaker'],
      });
    }
  }

  /**
   * Add system health check
   */
  addCheck(check: HealthCheck): void {
    this.systemChecks.set(check.name, check);
    this.startSystemHealthCheck(check);

  }

  /**
   * Add service health check
   */
  addService(config: ServiceHealthCheck): void {
    this.serviceChecks.set(config.name, config);
    
    // Initialize health status
    this.healthStatus.set(config.name, {
      healthy: true,
      status: 'unknown',
      lastCheck: new Date(),
      consecutiveFailures: 0,
      uptime: 0,
      downtime: 0,
    });

    // Initialize metrics
    this.healthMetrics.set(config.name, {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      uptimePercentage: 100,
    });

    // Start monitoring if already running
    if (this.isMonitoring) {
      this.startServiceMonitoring(config.name);
    }

  }

  /**
   * Remove health check
   */
  removeCheck(name: string): void {
    this.stopHealthCheck(name);
    this.systemChecks.delete(name);
    this.lastResults.delete(name);

  }

  /**
   * Remove service from monitoring
   */
  removeService(serviceName: string): void {
    this.stopServiceMonitoring(serviceName);
    this.serviceChecks.delete(serviceName);
    this.healthStatus.delete(serviceName);
    this.healthMetrics.delete(serviceName);

  }

  /**
   * Start monitoring all services and system checks
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    
    // Start system checks
    for (const check of this.systemChecks.values()) {
      this.startSystemHealthCheck(check);
    }
    
    // Start service checks
    for (const serviceName of this.serviceChecks.keys()) {
      this.startServiceMonitoring(serviceName);
    }

  }

  /**
   * Stop monitoring all services
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    for (const checkName of [...this.systemChecks.keys(), ...this.serviceChecks.keys()]) {
      this.stopHealthCheck(checkName);
    }

  }

  /**
   * Start system health check execution
   */
  private startSystemHealthCheck(check: HealthCheck): void {
    this.stopHealthCheck(check.name);

    // Start new interval
    const interval = setInterval(async () => {
      await this.executeSystemHealthCheck(check);
    }, check.interval);

    this.intervals.set(check.name, interval);
    
    // Execute immediately
    setTimeout(() => this.executeSystemHealthCheck(check), 1000);
  }

  /**
   * Start monitoring a specific service
   */
  private startServiceMonitoring(serviceName: string): void {
    const config = this.serviceChecks.get(serviceName);
    if (!config) return;

    this.stopHealthCheck(serviceName);

    // Perform initial check
    this.performServiceHealthCheck(serviceName);

    // Schedule periodic checks
    const interval = setInterval(() => {
      this.performServiceHealthCheck(serviceName);
    }, config.interval);

    this.intervals.set(serviceName, interval);
  }

  /**
   * Stop monitoring a specific check
   */
  private stopHealthCheck(name: string): void {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
  }

  /**
   * Stop monitoring a specific service
   */
  private stopServiceMonitoring(serviceName: string): void {
    this.stopHealthCheck(serviceName);
  }

  /**
   * Execute system health check
   */
  private async executeSystemHealthCheck(check: HealthCheck): Promise<void> {
    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      // Execute with timeout
      const checkPromise = check.check();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
      });

      await Promise.race([checkPromise, timeoutPromise]);
      result = await checkPromise;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      result = {
        status: 'unhealthy',
        message: (error as Error).message,
        duration,
        timestamp: new Date(),
        details: {
        
          error: (error as Error).name,
          stack: (error as Error).stack,
        },
      };

      // Retry if configured
      if (check.retries && check.retries > 0) {
        logger.warn(`[HEALTH_MONITOR] Health check ${check.name} failed, retrying...`);
        for (let retry = 1; retry <= check.retries; retry++) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000 * retry));
            result = await check.check();
            break; // Success, exit retry loop
          } catch (retryError) {
            if (retry === check.retries) {
              // Last retry failed
              result = {
                status: 'unhealthy',
                message: `Failed after ${check.retries + 1} attempts: ${(retryError as Error).message}`,
                duration: Date.now() - startTime,
                timestamp: new Date(),
                details: {
                  error: (retryError as Error).name,
                  attempts: retry + 1,
                },
              };
            }
          }
        }
      }
    }

    // Update result duration if not set
    if (!result.duration) {
      result.duration = Date.now() - startTime;
    }

    // Store result
    this.lastResults.set(check.name, result);

    // Store in Redis
    await this.storeHealthCheckResult(check.name, result);

    // Check for alerts
    await this.checkAlertsForSystemCheck(check, result);

    // Log result
    if (result.status === 'unhealthy') {
      logger.error(`[HEALTH_MONITOR] Health check ${check.name} failed: ${result.message}`);
    } else if (result.status === 'warning') {
      logger.warn(`[HEALTH_MONITOR] Health check ${check.name} warning: ${result.message}`);
    }
  }

  /**
   * Perform health check for a service
   */
  private async performServiceHealthCheck(serviceName: string): Promise<void> {
    const config = this.serviceChecks.get(serviceName);
    const currentStatus = this.healthStatus.get(serviceName);
    const metrics = this.healthMetrics.get(serviceName);

    if (!config || !currentStatus || !metrics) {
      return;
    }

    const startTime = Date.now();
    let isHealthy = false;
    let responseTime = 0;
    let error: string | undefined;

    try {
      // Perform the health check with retries
      const result = await this.performServiceHealthCheckWithRetries(config);
      isHealthy = result.healthy;
      responseTime = result.responseTime;
      error = result.error;

    } catch (err) {
      isHealthy = false;
      error = err instanceof Error ? err.message : 'Unknown error';
      responseTime = Date.now() - startTime;
    }

    // Update metrics
    metrics.totalChecks++;
    if (isHealthy) {
      metrics.successfulChecks++;
      metrics.lastSuccessTime = new Date();
    } else {
      metrics.failedChecks++;
      metrics.lastFailureTime = new Date();
    }

    // Update average response time
    metrics.averageResponseTime = 
      ((metrics.averageResponseTime * (metrics.totalChecks - 1)) + responseTime) / metrics.totalChecks;

    // Update uptime percentage
    metrics.uptimePercentage = (metrics.successfulChecks / metrics.totalChecks) * 100;

    // Update health status
    const wasHealthy = currentStatus.healthy;
    currentStatus.healthy = isHealthy;
    currentStatus.lastCheck = new Date();
    currentStatus.responseTime = responseTime;
    currentStatus.error = error;

    if (isHealthy) {
      currentStatus.consecutiveFailures = 0;
      currentStatus.status = 'healthy';
    } else {
      currentStatus.consecutiveFailures++;
      
      // Determine status based on consecutive failures
      if (currentStatus.consecutiveFailures >= (config.alertThreshold || 3)) {
        currentStatus.status = 'unhealthy';
      } else {
        currentStatus.status = 'degraded';
      }
    }

    // Update uptime/downtime tracking
    if (isHealthy && !wasHealthy) {
      currentStatus.downtime = 0;
    } else if (!isHealthy && wasHealthy) {
      currentStatus.uptime = 0;
    }

    if (isHealthy) {
      currentStatus.uptime += config.interval;
    } else {
      currentStatus.downtime += config.interval;
    }

    // Persist to Redis
    await this.persistServiceHealthData(serviceName, currentStatus, metrics);

    // Notify if status changed
    if (wasHealthy !== isHealthy) {

      this.notifyStatusChange(serviceName, currentStatus);
    }

    // Log degraded status
    if (currentStatus.status === 'degraded') {
      logger.warn(`[HEALTH_MONITOR] Service ${serviceName} is degraded (${currentStatus.consecutiveFailures} consecutive failures)`);
    }
  }

  /**
   * Perform service health check with retries
   */
  private async performServiceHealthCheckWithRetries(
    config: ServiceHealthCheck
  ): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
    const retries = config.retries || 1;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= retries; attempt++) {
      const startTime = Date.now();
      
      try {
        const url = config.url + (config.path || '/health');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(url, {
          method: config.method || 'GET',
          headers: config.headers,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const responseTime = Date.now() - startTime;

        const expectedStatus = config.expectedStatus || [200, 201, 202, 204];
        const isHealthy = expectedStatus.includes(response.status);

        if (isHealthy) {
          return { healthy: true, responseTime };
        } else {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
        }

      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        // If this is the last attempt, return the failure
        if (attempt === retries) {
          return { healthy: false, responseTime, error: lastError };
        }
        
        // Wait a bit before retrying (exponential backoff)
        if (attempt < retries) {
          await this.delay(Math.min(1000 * Math.pow(2, attempt - 1), 5000));
        }
      }
    }

    return { healthy: false, responseTime: config.timeout, error: lastError };
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current health report
   */
  async getHealthReport(): Promise<HealthReport> {
    const services: Record<string, HealthCheckResult> = {};
    let healthy = 0;
    let unhealthy = 0;
    let warning = 0;
    let degraded = 0;

    // Include system check results
    for (const [name, result] of this.lastResults.entries()) {
      services[name] = result;
      
      switch (result.status) {
        case 'healthy':
          healthy++;
          break;
        case 'unhealthy':
          unhealthy++;
          break;
        case 'warning':
          warning++;
          break;
        case 'degraded':
          degraded++;
          break;
      }
    }

    // Include service health status
    for (const [serviceName, status] of this.healthStatus.entries()) {
      const result: HealthCheckResult = {
        status: status.status === 'unknown' ? 'warning' : status.status as any,
        message: status.error || (status.healthy ? 'Service healthy' : 'Service unhealthy'),
        duration: status.responseTime || 0,
        timestamp: status.lastCheck,
        consecutiveFailures: status.consecutiveFailures,
        uptime: status.uptime,
        downtime: status.downtime,
      };
      
      services[serviceName] = result;
      
      switch (result.status) {
        case 'healthy':
          healthy++;
          break;
        case 'unhealthy':
          unhealthy++;
          break;
        case 'warning':
          warning++;
          break;
        case 'degraded':
          degraded++;
          break;
      }
    }

    const total = healthy + unhealthy + warning + degraded;
    let overallStatus: 'healthy' | 'unhealthy' | 'warning';

    if (unhealthy > 0) {
      // Check if any critical services are unhealthy
      const criticalUnhealthy = Array.from(this.systemChecks.entries())
        .filter(([name, check]) => check.critical && services[name]?.status === 'unhealthy')
        .length > 0;
      
      const criticalServiceUnhealthy = Array.from(this.serviceChecks.entries())
        .filter(([name, config]) => config.critical && services[name]?.status === 'unhealthy')
        .length > 0;
      
      overallStatus = (criticalUnhealthy || criticalServiceUnhealthy) ? 'unhealthy' : 'warning';
    } else if (warning > 0 || degraded > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'healthy';
    }

    return {
      overallStatus,
      services,
      summary: {
        total,
        healthy,
        unhealthy,
        warning,
      },
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get health status for all services (API Gateway compatible)
   */
  getAllServiceHealth(): Record<string, any> {
    const health: Record<string, any> = {};
    
    for (const [serviceName, status] of this.healthStatus.entries()) {
      health[serviceName] = {
        healthy: status.healthy,
        status: status.status,
        lastCheck: status.lastCheck,
        responseTime: status.responseTime,
        consecutiveFailures: status.consecutiveFailures,
        uptime: status.uptime,
        downtime: status.downtime,
        error: status.error,
      };
    }

    return health;
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName: string): HealthStatus | undefined {
    return this.healthStatus.get(serviceName);
  }

  /**
   * Get service health metrics
   */
  getServiceMetrics(serviceName: string): HealthMetrics | undefined {
    return this.healthMetrics.get(serviceName);
  }

  /**
   * Get health check history
   */
  async getHealthHistory(
    checkName: string,
    hours: number = 24
  ): Promise<HealthCheckResult[]> {
    const key = `health_check:${checkName}:history`;
    const since = Date.now() - (hours * 60 * 60 * 1000);
    
    // Fallback: retrieve all then filter by score using zscore
    const members = await this.redis.zrange(key, 0, -1);
    const entries: Array<{ member: string; score: number }> = [];
    for (const m of members as string[]) {
      const scoreStr = await this.redis.zscore(key, m);
      const score = scoreStr !== null ? Number(scoreStr) : 0;
      if (score >= since) {
        entries.push({ member: m, score });
      }
    }
    // Sort ascending by score
    entries.sort((a, b) => a.score - b.score);

    const history: HealthCheckResult[] = [];
    for (const item of entries) {
      try {
        const result = JSON.parse(item.member) as HealthCheckResult;
        result.timestamp = new Date(item.score);
        history.push(result);
      } catch (error: any) {
        logger.warn(`[HEALTH_MONITOR] Failed to parse history entry:`, error);
      }
    }

    return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Add alert configuration
   */
  addAlert(alert: AlertConfig): void {
    this.alerts.push(alert);

  }

  /**
   * Default health check implementations
   */

  private async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // This would use your actual database connection
      // For now, simulating with a simple check
      const testQuery = "SELECT 1 as test";
      // await db.query(testQuery);
      
      const duration = Date.now() - startTime;
      return {
        status: 'healthy',
        message: 'Database connection successful',
        duration,
        timestamp: new Date(),
        details: {
          query: testQuery,
          connectionPool: 'active',
        },
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      await this.redis.ping();
      const duration = Date.now() - startTime;
      
      return {
        status: 'healthy',
        message: 'Redis connection successful',
        duration,
        timestamp: new Date(),
        details: {
          ping: 'PONG',
        },
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `Redis connection failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkExternalAPI(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Example external API check
      const response = await fetch('https://api.github.com/zen', {
        method: 'GET',
        timeout: 5000,
      } as any);
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        return {
          status: 'healthy',
          message: 'External API accessible',
          duration,
          timestamp: new Date(),
          details: {
            status: response.status,
            url: 'https://api.github.com/zen',
          },
        };
      } else {
        return {
          status: 'warning',
          message: `External API returned ${response.status}`,
          duration,
          timestamp: new Date(),
        };
      }
    } catch (error: any) {
      return {
        status: 'warning', // Not critical for our app
        message: `External API check failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkFileSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      // Check write permissions
      const testFile = path.join(process.cwd(), 'tmp', 'health-check.txt');
      await fs.writeFile(testFile, 'health check test');
      await fs.unlink(testFile);
      
      const duration = Date.now() - startTime;
      return {
        status: 'healthy',
        message: 'File system accessible',
        duration,
        timestamp: new Date(),
        details: {
          writeable: true,
          testPath: testFile,
        },
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: `File system check failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      const usedPercent = ((totalMem - freeMem) / totalMem) * 100;
      
      const duration = Date.now() - startTime;
      let status: 'healthy' | 'warning' | 'unhealthy' = 'healthy';
      let message = 'Memory usage normal';
      
      if (usedPercent > 90) {
        status = 'unhealthy';
        message = `High memory usage: ${usedPercent.toFixed(1)}%`;
      } else if (usedPercent > 80) {
        status = 'warning';
        message = `Elevated memory usage: ${usedPercent.toFixed(1)}%`;
      }
      
      return {
        status,
        message,
        duration,
        timestamp: new Date(),
        details: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          systemUsedPercent: Math.round(usedPercent),
        },
      };
    } catch (error: any) {
      return {
        status: 'warning',
        message: `Memory check failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  private async checkCircuitBreakers(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      if (!this.circuitBreakerManager) {
        return {
          status: 'warning',
          message: 'Circuit breaker manager not available',
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      }
      
      const health = this.circuitBreakerManager.getHealthStatus();
      const stats = this.circuitBreakerManager.getAllStatistics();
      
      const openCircuits = Object.entries(health).filter(([_, h]) => h.state === 'OPEN');
      const duration = Date.now() - startTime;
      
      let status: 'healthy' | 'warning' | 'unhealthy' = 'healthy';
      let message = 'All circuit breakers healthy';
      
      if (openCircuits.length > 0) {
        status = 'warning';
        message = `${openCircuits.length} circuit breaker(s) open: ${openCircuits.map(([name]) => name).join(', ')}`;
      }
      
      return {
        status,
        message,
        duration,
        timestamp: new Date(),
        details: {
          health,
          openCircuits: openCircuits.length,
          totalCircuits: Object.keys(health).length,
          stats,
        },
      };
    } catch (error: any) {
      return {
        status: 'warning',
        message: `Circuit breaker check failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Store health check result in Redis
   */
  private async storeHealthCheckResult(
    checkName: string,
    result: HealthCheckResult
  ): Promise<void> {
    try {
      const key = `health_check:${checkName}:history`;
      const score = result.timestamp.getTime();
      
      await this.redis.zadd(key, { score, member: JSON.stringify(result) });
      
      // Keep only last 1000 entries
      await this.redis.zremrangebyrank(key, 0, -1001);
      
      // Set expiration
      await this.redis.expire(key, 7 * 24 * 60 * 60); // 7 days
    } catch (error: any) {
      logger.error(`[HEALTH_MONITOR] Failed to store health check result:`, error);
    }
  }

  /**
   * Check and send alerts for system checks
   */
  private async checkAlertsForSystemCheck(check: HealthCheck, result: HealthCheckResult): Promise<void> {
    for (const alert of this.alerts) {
      const shouldAlert = this.shouldSendSystemAlert(alert, check, result);
      
      if (shouldAlert) {
        await this.sendSystemAlert(alert, check, result);
      }
    }
  }

  /**
   * Persist service health data to Redis
   */
  private async persistServiceHealthData(
    serviceName: string,
    status: HealthStatus,
    metrics: HealthMetrics
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const healthData = {
        status: {
          ...status,
          lastCheck: status.lastCheck.toISOString(),
        },
        metrics: {
          ...metrics,
          lastFailureTime: metrics.lastFailureTime?.toISOString(),
          lastSuccessTime: metrics.lastSuccessTime?.toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      await this.redis.setex(
        `health:${serviceName}`,
        300, // 5 minutes TTL
        JSON.stringify(healthData)
      );

      // Also maintain a rolling history
      await this.redis.lpush(
        `health_history:${serviceName}`,
        JSON.stringify({
          healthy: status.healthy,
          responseTime: status.responseTime,
          timestamp: status.lastCheck.toISOString(),
        })
      );

      // Trim history to last 100 entries
      await this.redis.ltrim(`health_history:${serviceName}`, 0, 99);

    } catch (error: any) {
      logger.error(`[HEALTH_MONITOR] Failed to persist health data for ${serviceName}:`, error);
    }
  }

  /**
   * Notify about status changes
   */
  private notifyStatusChange(serviceName: string, status: HealthStatus): void {
    for (const callback of this.notificationCallbacks) {
      try {
        callback(serviceName, status);
      } catch (error: any) {
        logger.error(`[HEALTH_MONITOR] Notification callback failed for ${serviceName}:`, error);
      }
    }
  }

  /**
   * Add notification callback
   */
  onStatusChange(callback: (serviceName: string, status: HealthStatus) => void): void {
    this.notificationCallbacks.push(callback);
  }

  /**
   * Determine if system alert should be sent
   */
  private shouldSendSystemAlert(
    alert: AlertConfig,
    check: HealthCheck,
    result: HealthCheckResult
  ): boolean {
    // Check threshold
    if (alert.threshold === 'critical' && !check.critical) {
      return false;
    }
    
    if (alert.threshold === 'unhealthy' && result.status !== 'unhealthy') {
      return false;
    }
    
    if (alert.threshold === 'warning' && 
        result.status !== 'unhealthy' && result.status !== 'warning') {
      return false;
    }
    
    // Check cooldown
    const cooldownKey = `${alert.destination}:${check.name}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey) || 0;
    
    if (Date.now() - lastAlert < alert.cooldownMs) {
      return false;
    }
    
    return true;
  }

  /**
   * Send system alert
   */
  private async sendSystemAlert(
    alert: AlertConfig,
    check: HealthCheck,
    result: HealthCheckResult
  ): Promise<void> {
    try {
      logger.warn(`[HEALTH_MONITOR] Sending ${alert.type} alert for ${check.name}`);
      
      // Update cooldown
      const cooldownKey = `${alert.destination}:${check.name}`;
      this.alertCooldowns.set(cooldownKey, Date.now());
      
      const alertData = {
        type: alert.type,
        destination: alert.destination,
        service: check.name,
        status: result.status,
        message: result.message,
        timestamp: result.timestamp.toISOString(),
        duration: result.duration,
        details: result.details,
        category: 'system',
      };
      
      logger.info('[SYSTEM_ALERT]', JSON.stringify(alertData, null, 2));
      
    } catch (error: any) {
      logger.error(`[HEALTH_MONITOR] Failed to send system alert:`, error);
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<Record<string, any>> {
    return {
      uptime: Date.now() - this.startTime,
      healthChecks: {
        total: this.systemChecks.size + this.serviceChecks.size,
        active: this.intervals.size,
      },
      alerts: {
        configured: this.alerts.length,
        cooldowns: this.alertCooldowns.size,
      },
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Load default service configurations for Taxomind LMS
   */
  loadDefaultServices(): void {
    const defaultServices: ServiceHealthCheck[] = [
      {
        name: 'auth-service',
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3000',
        interval: 30000, // 30 seconds
        timeout: 5000,
        path: '/api/auth/health',
        expectedStatus: [200],
        retries: 2,
        alertThreshold: 3,
        critical: true,
        description: 'Authentication service health',
      },
      {
        name: 'course-service',
        url: process.env.COURSE_SERVICE_URL || 'http://localhost:3000',
        interval: 30000,
        timeout: 10000,
        path: '/api/courses/health',
        expectedStatus: [200],
        retries: 2,
        alertThreshold: 3,
        critical: true,
        description: 'Course management service health',
      },
      {
        name: 'sam-service',
        url: process.env.SAM_SERVICE_URL || 'http://localhost:3000',
        interval: 60000, // 1 minute
        timeout: 30000,
        path: '/api/sam/health',
        expectedStatus: [200],
        retries: 1,
        alertThreshold: 2,
        critical: false,
        description: 'SAM AI service health',
      },
      {
        name: 'analytics-service',
        url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3000',
        interval: 30000,
        timeout: 10000,
        path: '/api/analytics/health',
        expectedStatus: [200],
        retries: 2,
        alertThreshold: 3,
        critical: false,
        description: 'Analytics service health',
      },
      {
        name: 'upload-service',
        url: process.env.UPLOAD_SERVICE_URL || 'http://localhost:3000',
        interval: 45000,
        timeout: 15000,
        path: '/api/upload/health',
        expectedStatus: [200],
        retries: 2,
        alertThreshold: 3,
        critical: false,
        description: 'File upload service health',
      },
    ];

    defaultServices.forEach(service => this.addService(service));
  }

  /**
   * Trigger immediate health check for a service
   */
  async triggerHealthCheck(serviceName: string): Promise<HealthStatus | undefined> {
    await this.performServiceHealthCheck(serviceName);
    return this.getServiceHealth(serviceName);
  }

  /**
   * Get service health history
   */
  async getServiceHistory(serviceName: string, limit = 50): Promise<Array<{
    healthy: boolean;
    responseTime?: number;
    timestamp: string;
  }>> {
    if (!this.redis) return [];

    try {
      const history = await this.redis.lrange(`health_history:${serviceName}`, 0, limit - 1);
      return history.map(entry => JSON.parse(entry as string));
    } catch (error: any) {
      logger.error(`[HEALTH_MONITOR] Failed to get history for ${serviceName}:`, error);
      return [];
    }
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    overallUptime: number;
  } {
    const allHealth = this.getAllServiceHealth();
    const services = Object.values(allHealth);
    
    const totalServices = services.length;
    const healthyServices = services.filter(s => s.status === 'healthy').length;
    const degradedServices = services.filter(s => s.status === 'degraded').length;
    const unhealthyServices = services.filter(s => s.status === 'unhealthy').length;
    
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (unhealthyServices > 0) {
      overallStatus = unhealthyServices === totalServices ? 'unhealthy' : 'degraded';
    } else if (degradedServices > 0) {
      overallStatus = 'degraded';
    }

    // Calculate overall uptime percentage
    const allMetrics = Object.values(this.healthMetrics.values());
    const overallUptime = allMetrics.reduce(
      (sum, metrics) => sum + metrics.uptimePercentage,
      0
    ) / totalServices;

    return {
      status: overallStatus,
      totalServices,
      healthyServices,
      degradedServices,
      unhealthyServices,
      overallUptime: Math.round(overallUptime * 100) / 100,
    };
  }

  /**
   * Shutdown health monitor
   */
  async shutdown(): Promise<void> {
    this.stopMonitoring();
    
    // Persist final health data
    const promises: Promise<void>[] = [];
    for (const [serviceName, status] of this.healthStatus.entries()) {
      const metrics = this.healthMetrics.get(serviceName);
      if (metrics) {
        promises.push(this.persistServiceHealthData(serviceName, status, metrics));
      }
    }

    await Promise.all(promises);
    
    this.systemChecks.clear();
    this.serviceChecks.clear();
    this.lastResults.clear();
    this.healthStatus.clear();
    this.healthMetrics.clear();
    this.alertCooldowns.clear();

  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();

export default HealthMonitor;