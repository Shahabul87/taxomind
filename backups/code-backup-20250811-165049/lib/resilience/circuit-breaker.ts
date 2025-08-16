/**
 * Circuit Breaker Implementation - Phase 3
 * Prevents cascading failures by monitoring service health and failing fast
 * Enterprise-grade circuit breaker with Redis persistence and comprehensive monitoring
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  timeout?: number;
  volumeThreshold?: number;
}

export interface CircuitBreakerStats {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  totalRequests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  resetTime?: Date;
  uptime: number;
}

type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  name: string;
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  timeout?: number;
  volumeThreshold?: number;
  redis?: Redis;
  persistState?: boolean;
  notificationCallback?: (state: string, serviceName: string) => Promise<void>;
}

/**
 * Circuit Breaker Implementation
 * Prevents cascading failures by monitoring service health and failing fast
 */
export class CircuitBreaker {
  private name: string;
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private resetTime?: Date;
  private config: CircuitBreakerConfig;
  private redis?: Redis;
  private persistState: boolean;
  private notificationCallback?: (state: string, serviceName: string) => Promise<void>;
  private monitoringTimer?: NodeJS.Timeout;
  private uptime: number;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.config = {
      name: options.name,
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000,
      monitoringPeriod: options.monitoringPeriod || 60000,
      timeout: options.timeout,
      volumeThreshold: options.volumeThreshold || 10,
    };
    
    this.redis = options.redis;
    this.persistState = options.persistState || false;
    this.notificationCallback = options.notificationCallback;
    this.uptime = Date.now();

    this.startMonitoring();
    this.restoreState();
  }

  /**
   * Start monitoring circuit breaker state
   */
  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.checkStateTransition();
      this.persistStats();
    }, this.config.monitoringPeriod);
  }

  /**
   * Check if state transition is needed
   */
  private checkStateTransition(): void {
    const now = Date.now();
    
    switch (this.state) {
      case 'CLOSED':
        if (this.failureCount >= this.config.failureThreshold && 
            this.totalRequests >= (this.config.volumeThreshold || 0)) {
          this.openCircuit();
        }
        break;
        
      case 'OPEN':
        if (this.resetTime && now >= this.resetTime.getTime()) {
          this.halfOpenCircuit();
        }
        break;
        
      case 'HALF_OPEN':
        // Half-open state is handled in recordSuccess/recordFailure
        break;
    }
  }

  /**
   * Open the circuit breaker
   */
  private openCircuit(): void {
    this.state = 'OPEN';
    this.resetTime = new Date(Date.now() + this.config.resetTimeout);
    
    logger.error(`[CIRCUIT_BREAKER] Circuit breaker OPENED for ${this.name}`);
    this.sendNotification('OPEN');
    this.persistStats();
  }

  /**
   * Half-open the circuit breaker
   */
  private halfOpenCircuit(): void {
    this.state = 'HALF_OPEN';
    this.resetTime = undefined;
    
    logger.warn(`[CIRCUIT_BREAKER] Circuit breaker HALF-OPEN for ${this.name}`);
    this.sendNotification('HALF_OPEN');
    this.persistStats();
  }

  /**
   * Close the circuit breaker
   */
  private closeCircuit(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.resetTime = undefined;

    this.sendNotification('CLOSE');
    this.persistStats();
  }

  /**
   * Check if execution can proceed
   */
  canExecute(): boolean {
    return this.state !== 'OPEN';
  }

  /**
   * Record a successful execution
   */
  recordSuccess(): void {
    this.totalRequests++;
    this.successCount++;
    this.lastSuccessTime = new Date();

    if (this.state === 'HALF_OPEN') {
      // If we're half-open and got a success, close the circuit
      this.closeCircuit();
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success when closed
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  /**
   * Record a failed execution
   */
  recordFailure(): void {
    this.totalRequests++;
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'HALF_OPEN') {
      // If we're half-open and got a failure, open the circuit
      this.openCircuit();
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): string {
    return this.state;
  }

  /**
   * Get circuit breaker statistics
   */
  getStatistics(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      resetTime: this.resetTime,
      uptime: Date.now() - this.uptime,
    };
  }

  /**
   * Reset circuit breaker statistics
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.resetTime = undefined;
    this.uptime = Date.now();
    
    this.persistStats();
  }

  /**
   * Manually open the circuit breaker
   */
  open(): void {
    this.openCircuit();
  }

  /**
   * Manually close the circuit breaker
   */
  close(): void {
    this.closeCircuit();
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    const errorRate = this.totalRequests > 0 ? 
      (this.failureCount / this.totalRequests) * 100 : 0;
    
    return this.state === 'CLOSED' && errorRate < 50;
  }

  /**
   * Send notification about state changes
   */
  private async sendNotification(state: string): Promise<void> {
    if (this.notificationCallback) {
      try {
        await this.notificationCallback(state, this.name);
      } catch (error) {
        logger.error(`[CIRCUIT_BREAKER] Failed to send notification:`, error);
      }
    }
  }

  /**
   * Persist circuit breaker state to Redis
   */
  private async persistState(): Promise<void> {
    if (!this.persistState || !this.redis) return;

    try {
      const stateData = {
        state: this.state,
        stats: this.statistics,
        timestamp: Date.now(),
      };

      await this.redis.set(
        `circuit_breaker:${this.name}:state`,
        JSON.stringify(stateData),
        'EX',
        3600 // Expire in 1 hour
      );
    } catch (error) {
      logger.error(`[CIRCUIT_BREAKER] Failed to persist state for ${this.name}:`, error);
    }
  }

  /**
   * Persist statistics to Redis
   */
  private async persistStats(): Promise<void> {
    if (!this.persistState || !this.redis) return;

    try {
      const stats = this.getStatistics();
      await this.redis.setex(
        `circuit_breaker:${this.name}:stats`,
        3600, // Expire in 1 hour
        JSON.stringify({
          ...stats,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      logger.error(`[CIRCUIT_BREAKER] Failed to persist stats for ${this.name}:`, error);
    }
  }

  /**
   * Restore circuit breaker state from Redis
   */
  private async restoreState(): Promise<void> {
    if (!this.persistState || !this.redis) return;

    try {
      const statsData = await this.redis.get(`circuit_breaker:${this.name}:stats`);
      if (statsData) {
        const parsed = JSON.parse(statsData as string);
        
        // Restore state if it was recently persisted (within reset timeout)
        const age = Date.now() - parsed.timestamp;
        if (age < this.config.resetTimeout) {
          this.state = parsed.state || 'CLOSED';
          this.failureCount = parsed.failureCount || 0;
          this.successCount = parsed.successCount || 0;
          this.totalRequests = parsed.totalRequests || 0;
          
          if (parsed.lastFailureTime) {
            this.lastFailureTime = new Date(parsed.lastFailureTime);
          }
          if (parsed.lastSuccessTime) {
            this.lastSuccessTime = new Date(parsed.lastSuccessTime);
          }
          if (parsed.resetTime) {
            this.resetTime = new Date(parsed.resetTime);
          }
        }
      }
    } catch (error) {
      logger.error(`[CIRCUIT_BREAKER] Failed to restore state for ${this.name}:`, error);
    }
  }

  /**
   * Shutdown circuit breaker
   */
  async shutdown(): Promise<void> {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }
    
    await this.persistStats();

  }
}

/**
 * Circuit Breaker Manager - Enterprise Phase 3
 */
export class CircuitBreakerManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private redis?: Redis;
  private configs: Map<string, CircuitBreakerConfig> = new Map();

  constructor(redis?: Redis) {
    this.redis = redis;
    this.loadDefaultConfigs();
  }

  /**
   * Load default circuit breaker configurations
   */
  private loadDefaultConfigs(): void {
    const defaultConfigs: CircuitBreakerConfig[] = [
      {
        name: 'auth-service',
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 30000,
        timeout: 5000,
        volumeThreshold: 10,
      },
      {
        name: 'course-service',
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 30000,
        timeout: 10000,
        volumeThreshold: 10,
      },
      {
        name: 'sam-service',
        failureThreshold: 3,
        resetTimeout: 120000,
        monitoringPeriod: 60000,
        timeout: 30000,
        volumeThreshold: 5,
      },
      {
        name: 'analytics-service',
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 30000,
        timeout: 10000,
        volumeThreshold: 10,
      },
      {
        name: 'upload-service',
        failureThreshold: 3,
        resetTimeout: 30000,
        monitoringPeriod: 30000,
        timeout: 60000,
        volumeThreshold: 5,
      },
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.name, config);
    });
  }

  /**
   * Create or get circuit breaker
   */
  getCircuitBreaker(
    name: string,
    options?: Partial<CircuitBreakerOptions>
  ): CircuitBreaker {
    if (this.circuitBreakers.has(name)) {
      return this.circuitBreakers.get(name)!;
    }

    const config = this.configs.get(name) || {
      name,
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 30000,
    };
    
    const circuitBreaker = new CircuitBreaker({
      ...config,
      redis: this.redis,
      persistState: true,
      notificationCallback: this.handleStateChange.bind(this),
      ...options,
    });

    this.circuitBreakers.set(name, circuitBreaker);
    return circuitBreaker;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStatistics(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      stats[name] = circuitBreaker.getStatistics();
    }

    return stats;
  }

  /**
   * Get circuit breaker health status
   */
  getHealthStatus(): Record<string, { healthy: boolean; state: string }> {
    const health: Record<string, { healthy: boolean; state: string }> = {};
    
    for (const [name, circuitBreaker] of this.circuitBreakers.entries()) {
      health[name] = {
        healthy: circuitBreaker.isHealthy(),
        state: circuitBreaker.getState(),
      };
    }

    return health;
  }

  /**
   * Handle circuit breaker state changes
   */
  private async handleStateChange(state: string, serviceName: string): Promise<void> {

    // In production, you could send alerts, update monitoring dashboards, etc.
    if (state === 'OPEN') {
      // Send critical alert
      logger.error(`[ALERT] Circuit breaker for ${serviceName} is now OPEN`);
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }

  }

  /**
   * Shutdown all circuit breakers
   */
  async shutdown(): Promise<void> {
    const shutdownPromises = Array.from(this.circuitBreakers.values()).map(cb => cb.shutdown());
    await Promise.all(shutdownPromises);
    this.circuitBreakers.clear();

  }
}

// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();

export default CircuitBreaker;