/**
 * Comprehensive Health Check System
 * Application, database, cache, and external service health monitoring
 */

import { db } from '@/lib/db';
import { redis } from '@/lib/redis';
import axios from 'axios';
import dns from 'dns/promises';
import { performance } from 'perf_hooks';
import * as os from 'os';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';

/**
 * Health status levels
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message: string;
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
  error?: string;
}

/**
 * System health summary
 */
export interface SystemHealth {
  status: HealthStatus;
  timestamp: Date;
  version: string;
  uptime: number;
  checks: HealthCheckResult[];
  resources: ResourceHealth;
  dependencies: DependencyHealth[];
  metrics: HealthMetrics;
}

/**
 * Resource health
 */
export interface ResourceHealth {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    interfaces: number;
    active: boolean;
  };
}

/**
 * Dependency health
 */
export interface DependencyHealth {
  name: string;
  type: 'database' | 'cache' | 'api' | 'service';
  status: HealthStatus;
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

/**
 * Health metrics
 */
export interface HealthMetrics {
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  activeConnections: number;
  queueSize: number;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  name: string;
  checkFn: () => Promise<HealthCheckResult>;
  critical: boolean;
  timeout: number;
  retries: number;
  interval: number;
}

/**
 * Health monitor
 */
export class HealthMonitor {
  private static instance: HealthMonitor;
  private checks: Map<string, HealthCheckConfig> = new Map();
  private results: Map<string, HealthCheckResult> = new Map();
  private healthEmitter = new EventEmitter();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private systemHealth: SystemHealth | null = null;
  
  private constructor() {
    this.registerDefaultChecks();
    this.startHealthChecks();
  }
  
  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }
  
  /**
   * Register default health checks
   */
  private registerDefaultChecks(): void {
    // Database health check
    this.registerCheck({
      name: 'database',
      checkFn: this.checkDatabase.bind(this),
      critical: true,
      timeout: 5000,
      retries: 3,
      interval: 30000, // 30 seconds
    });
    
    // Redis cache health check
    this.registerCheck({
      name: 'redis',
      checkFn: this.checkRedis.bind(this),
      critical: true,
      timeout: 3000,
      retries: 2,
      interval: 30000,
    });
    
    // Application health check
    this.registerCheck({
      name: 'application',
      checkFn: this.checkApplication.bind(this),
      critical: true,
      timeout: 1000,
      retries: 1,
      interval: 10000, // 10 seconds
    });
    
    // External API health check
    this.registerCheck({
      name: 'external_apis',
      checkFn: this.checkExternalAPIs.bind(this),
      critical: false,
      timeout: 10000,
      retries: 2,
      interval: 60000, // 1 minute
    });
    
    // File system health check
    this.registerCheck({
      name: 'filesystem',
      checkFn: this.checkFileSystem.bind(this),
      critical: false,
      timeout: 2000,
      retries: 1,
      interval: 60000,
    });
    
    // Network connectivity check
    this.registerCheck({
      name: 'network',
      checkFn: this.checkNetwork.bind(this),
      critical: false,
      timeout: 5000,
      retries: 2,
      interval: 60000,
    });
    
    // Memory health check
    this.registerCheck({
      name: 'memory',
      checkFn: this.checkMemory.bind(this),
      critical: true,
      timeout: 1000,
      retries: 1,
      interval: 30000,
    });
    
    // CPU health check
    this.registerCheck({
      name: 'cpu',
      checkFn: this.checkCPU.bind(this),
      critical: false,
      timeout: 1000,
      retries: 1,
      interval: 30000,
    });
  }
  
  /**
   * Register a health check
   */
  public registerCheck(config: HealthCheckConfig): void {
    this.checks.set(config.name, config);
    
    // Start check interval
    if (this.checkIntervals.has(config.name)) {
      clearInterval(this.checkIntervals.get(config.name)!);
    }
    
    const interval = setInterval(async () => {
      await this.runCheck(config.name);
    }, config.interval);
    
    this.checkIntervals.set(config.name, interval);
    
    // Run initial check
    this.runCheck(config.name);
  }
  
  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    // Run all checks immediately
    this.checks.forEach((_, name) => {
      this.runCheck(name);
    });
    
    // Update system health every 10 seconds
    setInterval(() => {
      this.updateSystemHealth();
    }, 10000);
  }
  
  /**
   * Run a specific health check
   */
  private async runCheck(name: string): Promise<void> {
    const config = this.checks.get(name);
    if (!config) return;
    
    let result: HealthCheckResult | null = null;
    let retries = config.retries;
    
    while (retries >= 0 && !result) {
      try {
        const startTime = performance.now();
        
        // Run check with timeout
        result = await Promise.race([
          config.checkFn(),
          new Promise<HealthCheckResult>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), config.timeout)
          ),
        ]);
        
        result.responseTime = performance.now() - startTime;
        result.timestamp = new Date();
        
      } catch (error) {
        if (retries > 0) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        } else {
          result = {
            name: config.name,
            status: HealthStatus.UNHEALTHY,
            message: `Health check failed: ${(error as Error).message}`,
            responseTime: config.timeout,
            timestamp: new Date(),
            error: (error as Error).message,
          };
        }
      }
    }
    
    if (result) {
      const previousResult = this.results.get(name);
      this.results.set(name, result);
      
      // Emit status change event
      if (previousResult && previousResult.status !== result.status) {
        this.healthEmitter.emit('status_changed', {
          check: name,
          previousStatus: previousResult.status,
          currentStatus: result.status,
          timestamp: new Date(),
        });
        
        // Emit critical failure if critical check failed
        if (config.critical && result.status === HealthStatus.UNHEALTHY) {
          this.healthEmitter.emit('critical_failure', {
            check: name,
            error: result.error,
            timestamp: new Date(),
          });
        }
      }
    }
  }
  
  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now();
      
      // Test database connection with a simple query
      await db.$queryRaw`SELECT 1`;
      
      // Check connection pool
      const poolStats = await db.$metrics.json();
      const metrics = JSON.parse(poolStats);
      
      const responseTime = performance.now() - startTime;
      
      // Determine health status based on pool metrics
      let status = HealthStatus.HEALTHY;
      let message = 'Database is healthy';
      
      if (metrics.counters.find((c: any) => c.key === 'prisma_pool_connections_open')?.value > 80) {
        status = HealthStatus.DEGRADED;
        message = 'Database connection pool is near capacity';
      }
      
      return {
        name: 'database',
        status,
        message,
        responseTime,
        timestamp: new Date(),
        details: {
          pool: metrics.counters.find((c: any) => c.key === 'prisma_pool_connections_open')?.value || 0,
          idle: metrics.counters.find((c: any) => c.key === 'prisma_pool_connections_idle')?.value || 0,
        },
      };
    } catch (error) {
      return {
        name: 'database',
        status: HealthStatus.UNHEALTHY,
        message: 'Database connection failed',
        responseTime: 0,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }
  
  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now();
      
      // Test Redis connection
      await redis.ping();
      
      // Get Redis info
      const info = await redis.info();
      const responseTime = performance.now() - startTime;
      
      // Parse Redis info
      const lines = info.split('\r\n');
      const stats: any = {};
      lines.forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      });
      
      // Determine health status
      let status = HealthStatus.HEALTHY;
      let message = 'Redis is healthy';
      
      const usedMemory = parseInt(stats.used_memory || '0');
      const maxMemory = parseInt(stats.maxmemory || '0');
      
      if (maxMemory > 0 && usedMemory / maxMemory > 0.9) {
        status = HealthStatus.DEGRADED;
        message = 'Redis memory usage is high';
      }
      
      return {
        name: 'redis',
        status,
        message,
        responseTime,
        timestamp: new Date(),
        details: {
          version: stats.redis_version,
          connected_clients: parseInt(stats.connected_clients || '0'),
          used_memory: usedMemory,
          uptime_in_seconds: parseInt(stats.uptime_in_seconds || '0'),
        },
      };
    } catch (error) {
      return {
        name: 'redis',
        status: HealthStatus.UNHEALTHY,
        message: 'Redis connection failed',
        responseTime: 0,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }
  
  /**
   * Check application health
   */
  private async checkApplication(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now();
      
      // Check process health
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      const responseTime = performance.now() - startTime;
      
      // Determine health status
      let status = HealthStatus.HEALTHY;
      let message = 'Application is healthy';
      
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (heapUsedPercent > 90) {
        status = HealthStatus.UNHEALTHY;
        message = 'Application memory usage is critical';
      } else if (heapUsedPercent > 75) {
        status = HealthStatus.DEGRADED;
        message = 'Application memory usage is high';
      }
      
      return {
        name: 'application',
        status,
        message,
        responseTime,
        timestamp: new Date(),
        details: {
          uptime,
          memory: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
            heapUsedPercent,
          },
          pid: process.pid,
          version: process.version,
        },
      };
    } catch (error) {
      return {
        name: 'application',
        status: HealthStatus.UNHEALTHY,
        message: 'Application health check failed',
        responseTime: 0,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }
  
  /**
   * Check external APIs
   */
  private async checkExternalAPIs(): Promise<HealthCheckResult> {
    const apis = [
      { name: 'OpenAI', url: 'https://api.openai.com/v1/models', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } },
      { name: 'Stripe', url: 'https://api.stripe.com/v1/charges', headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` } },
      { name: 'Cloudinary', url: `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/resources/image` },
    ];
    
    const results: any[] = [];
    let overallStatus = HealthStatus.HEALTHY;
    let failedAPIs: string[] = [];
    
    for (const api of apis) {
      try {
        const startTime = performance.now();
        const response = await axios.get(api.url, {
          headers: api.headers,
          timeout: 5000,
        });
        const responseTime = performance.now() - startTime;
        
        results.push({
          name: api.name,
          status: response.status < 400 ? 'healthy' : 'unhealthy',
          responseTime,
        });
        
        if (response.status >= 400) {
          failedAPIs.push(api.name);
          overallStatus = HealthStatus.DEGRADED;
        }
      } catch (error) {
        results.push({
          name: api.name,
          status: 'unhealthy',
          error: (error as Error).message,
        });
        failedAPIs.push(api.name);
        overallStatus = HealthStatus.DEGRADED;
      }
    }
    
    return {
      name: 'external_apis',
      status: overallStatus,
      message: failedAPIs.length > 0 ? `Some APIs are unavailable: ${failedAPIs.join(', ')}` : 'All external APIs are healthy',
      responseTime: Math.max(...results.map(r => r.responseTime || 0)),
      timestamp: new Date(),
      details: { apis: results },
    };
  }
  
  /**
   * Check file system
   */
  private async checkFileSystem(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now();
      
      // Check temp directory is writable
      const tempDir = os.tmpdir();
      const testFile = `${tempDir}/health_check_${Date.now()}.txt`;
      
      await fs.writeFile(testFile, 'health check');
      await fs.unlink(testFile);
      
      // Check disk space
      const stats = await fs.stat('/');
      
      const responseTime = performance.now() - startTime;
      
      return {
        name: 'filesystem',
        status: HealthStatus.HEALTHY,
        message: 'File system is healthy',
        responseTime,
        timestamp: new Date(),
        details: {
          tempDir,
          writable: true,
        },
      };
    } catch (error) {
      return {
        name: 'filesystem',
        status: HealthStatus.UNHEALTHY,
        message: 'File system check failed',
        responseTime: 0,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }
  
  /**
   * Check network connectivity
   */
  private async checkNetwork(): Promise<HealthCheckResult> {
    try {
      const startTime = performance.now();
      
      // Check DNS resolution
      await dns.resolve4('google.com');
      
      // Check external connectivity
      await axios.get('https://www.google.com', { timeout: 5000 });
      
      const responseTime = performance.now() - startTime;
      
      return {
        name: 'network',
        status: HealthStatus.HEALTHY,
        message: 'Network connectivity is healthy',
        responseTime,
        timestamp: new Date(),
        details: {
          dns: 'working',
          external: 'reachable',
        },
      };
    } catch (error) {
      return {
        name: 'network',
        status: HealthStatus.DEGRADED,
        message: 'Network connectivity issues detected',
        responseTime: 0,
        timestamp: new Date(),
        error: (error as Error).message,
      };
    }
  }
  
  /**
   * Check memory health
   */
  private async checkMemory(): Promise<HealthCheckResult> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    let status = HealthStatus.HEALTHY;
    let message = 'Memory usage is healthy';
    
    if (memoryUsagePercent > 95) {
      status = HealthStatus.UNHEALTHY;
      message = 'Memory usage is critical';
    } else if (memoryUsagePercent > 85) {
      status = HealthStatus.DEGRADED;
      message = 'Memory usage is high';
    }
    
    return {
      name: 'memory',
      status,
      message,
      responseTime: 0,
      timestamp: new Date(),
      details: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        percentage: memoryUsagePercent,
      },
    };
  }
  
  /**
   * Check CPU health
   */
  private async checkCPU(): Promise<HealthCheckResult> {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    const cpuCount = cpus.length;
    
    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    let status = HealthStatus.HEALTHY;
    let message = 'CPU usage is healthy';
    
    // Check load average (1 minute)
    const loadPerCpu = loadAverage[0] / cpuCount;
    
    if (loadPerCpu > 2) {
      status = HealthStatus.UNHEALTHY;
      message = 'CPU load is critical';
    } else if (loadPerCpu > 1) {
      status = HealthStatus.DEGRADED;
      message = 'CPU load is high';
    }
    
    return {
      name: 'cpu',
      status,
      message,
      responseTime: 0,
      timestamp: new Date(),
      details: {
        cores: cpuCount,
        usage,
        loadAverage,
        loadPerCpu,
      },
    };
  }
  
  /**
   * Update system health
   */
  private async updateSystemHealth(): Promise<void> {
    const checks = Array.from(this.results.values());
    
    // Determine overall status
    let overallStatus = HealthStatus.HEALTHY;
    
    const criticalChecks = Array.from(this.checks.entries())
      .filter(([_, config]) => config.critical)
      .map(([name, _]) => name);
    
    for (const checkName of criticalChecks) {
      const result = this.results.get(checkName);
      if (result?.status === HealthStatus.UNHEALTHY) {
        overallStatus = HealthStatus.UNHEALTHY;
        break;
      } else if (result?.status === HealthStatus.DEGRADED) {
        overallStatus = HealthStatus.DEGRADED;
      }
    }
    
    // Get resource health
    const resourceHealth = await this.getResourceHealth();
    
    // Get dependency health
    const dependencyHealth = await this.getDependencyHealth();
    
    // Get health metrics
    const healthMetrics = await this.getHealthMetrics();
    
    this.systemHealth = {
      status: overallStatus,
      timestamp: new Date(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      checks,
      resources: resourceHealth,
      dependencies: dependencyHealth,
      metrics: healthMetrics,
    };
    
    // Emit system health update
    this.healthEmitter.emit('system_health_updated', this.systemHealth);
  }
  
  /**
   * Get resource health
   */
  private async getResourceHealth(): Promise<ResourceHealth> {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Calculate CPU usage
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const cpuUsage = 100 - ~~(100 * idle / total);
    
    return {
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        loadAverage: os.loadavg(),
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      disk: {
        total: 1000000000000, // 1TB placeholder
        used: 500000000000, // 500GB placeholder
        free: 500000000000, // 500GB placeholder
        percentage: 50,
      },
      network: {
        interfaces: os.networkInterfaces() ? Object.keys(os.networkInterfaces()).length : 0,
        active: true,
      },
    };
  }
  
  /**
   * Get dependency health
   */
  private async getDependencyHealth(): Promise<DependencyHealth[]> {
    const dependencies: DependencyHealth[] = [];
    
    // Database dependency
    const dbResult = this.results.get('database');
    if (dbResult) {
      dependencies.push({
        name: 'PostgreSQL',
        type: 'database',
        status: dbResult.status,
        responseTime: dbResult.responseTime,
        lastChecked: dbResult.timestamp,
        error: dbResult.error,
      });
    }
    
    // Cache dependency
    const redisResult = this.results.get('redis');
    if (redisResult) {
      dependencies.push({
        name: 'Redis',
        type: 'cache',
        status: redisResult.status,
        responseTime: redisResult.responseTime,
        lastChecked: redisResult.timestamp,
        error: redisResult.error,
      });
    }
    
    // External API dependencies
    const apiResult = this.results.get('external_apis');
    if (apiResult && apiResult.details?.apis) {
      apiResult.details.apis.forEach((api: any) => {
        dependencies.push({
          name: api.name,
          type: 'api',
          status: api.status === 'healthy' ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
          responseTime: api.responseTime || 0,
          lastChecked: apiResult.timestamp,
          error: api.error,
        });
      });
    }
    
    return dependencies;
  }
  
  /**
   * Get health metrics
   */
  private async getHealthMetrics(): Promise<HealthMetrics> {
    // These would come from actual metrics collection
    return {
      requestsPerMinute: 1000,
      averageResponseTime: 150,
      errorRate: 0.5,
      activeConnections: 50,
      queueSize: 10,
    };
  }
  
  /**
   * Get current system health
   */
  public getSystemHealth(): SystemHealth | null {
    return this.systemHealth;
  }
  
  /**
   * Get specific health check result
   */
  public getCheckResult(name: string): HealthCheckResult | undefined {
    return this.results.get(name);
  }
  
  /**
   * Perform manual health check
   */
  public async performHealthCheck(name?: string): Promise<HealthCheckResult | SystemHealth> {
    if (name) {
      await this.runCheck(name);
      return this.results.get(name)!;
    } else {
      // Run all checks
      await Promise.all(Array.from(this.checks.keys()).map(name => this.runCheck(name)));
      await this.updateSystemHealth();
      return this.systemHealth!;
    }
  }
  
  /**
   * Get health emitter for external listeners
   */
  public getEmitter(): EventEmitter {
    return this.healthEmitter;
  }
  
  /**
   * Stop health monitoring
   */
  public stop(): void {
    this.checkIntervals.forEach(interval => clearInterval(interval));
    this.checkIntervals.clear();
  }
}

/**
 * Health check endpoint handler
 */
export async function handleHealthCheck(
  detailed: boolean = false
): Promise<{ status: number; body: any }> {
  const monitor = HealthMonitor.getInstance();
  const health = monitor.getSystemHealth();
  
  if (!health) {
    return {
      status: 503,
      body: {
        status: 'initializing',
        message: 'Health checks are still initializing',
      },
    };
  }
  
  const statusCode = 
    health.status === HealthStatus.HEALTHY ? 200 :
    health.status === HealthStatus.DEGRADED ? 200 :
    503;
  
  if (detailed) {
    return {
      status: statusCode,
      body: health,
    };
  } else {
    return {
      status: statusCode,
      body: {
        status: health.status,
        timestamp: health.timestamp,
        version: health.version,
        uptime: health.uptime,
      },
    };
  }
}

/**
 * Liveness probe handler
 */
export async function handleLivenessProbe(): Promise<{ status: number; body: any }> {
  return {
    status: 200,
    body: {
      status: 'alive',
      timestamp: new Date(),
      pid: process.pid,
    },
  };
}

/**
 * Readiness probe handler
 */
export async function handleReadinessProbe(): Promise<{ status: number; body: any }> {
  const monitor = HealthMonitor.getInstance();
  const dbHealth = monitor.getCheckResult('database');
  const redisHealth = monitor.getCheckResult('redis');
  
  const ready = 
    dbHealth?.status === HealthStatus.HEALTHY &&
    redisHealth?.status === HealthStatus.HEALTHY;
  
  return {
    status: ready ? 200 : 503,
    body: {
      ready,
      timestamp: new Date(),
      checks: {
        database: dbHealth?.status || 'unknown',
        redis: redisHealth?.status || 'unknown',
      },
    },
  };
}