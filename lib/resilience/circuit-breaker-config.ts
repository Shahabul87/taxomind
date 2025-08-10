/**
 * Circuit Breaker Configuration
 * Configuration types and presets for different services
 */

export interface CircuitBreakerConfig {
  name: string;
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  rollingCountTimeout?: number;
  rollingCountBuckets?: number;
  volumeThreshold?: number;
  capacity?: number;
  fallbackEnabled?: boolean;
  monitoringEnabled?: boolean;
  alertingEnabled?: boolean;
}

export interface CircuitBreakerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  timeouts: number;
  circuitBreakerOpens: number;
  circuitBreakerCloses: number;
  averageResponseTime: number;
  lastFailureTime: Date | null;
  uptime: number;
  currentState?: string;
  isOpen?: boolean;
  isHalfOpen?: boolean;
  volumeThreshold?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
  rollingCountTimeout?: number;
  // Additional stats from opossum
  fires?: number;
  requests?: number;
  successes?: number;
  failures?: number;
  rejects?: number;
  semaphoreRejections?: number;
  fallbacks?: number;
}

export interface ServiceCallOptions {
  circuitBreakerOptions?: Partial<CircuitBreakerConfig>;
  fallback?: Function;
  retryOptions?: RetryOptions;
  timeoutMs?: number;
}

export interface RetryOptions {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  initialDelay: number;
  maxDelay: number;
  jitter?: boolean;
}

/**
 * Predefined circuit breaker configurations for different service types
 */
export class CircuitBreakerPresets {
  /**
   * Database service configuration
   * - Fast timeout for database queries
   * - Higher error threshold (databases can recover quickly)
   * - Quick reset timeout
   */
  static get DATABASE(): CircuitBreakerConfig {
    return {
      name: 'database',
      timeout: 5000,
      errorThresholdPercentage: 60,
      resetTimeout: 30000,
      rollingCountTimeout: 10000,
      rollingCountBuckets: 10,
      volumeThreshold: 10,
      capacity: 100,
      fallbackEnabled: true,
      monitoringEnabled: true,
      alertingEnabled: true,
    };
  }

  /**
   * External API service configuration
   * - Medium timeout for external calls
   * - Standard error threshold
   * - Medium reset timeout
   */
  static get EXTERNAL_API(): CircuitBreakerConfig {
    return {
      name: 'external-api',
      timeout: 10000,
      errorThresholdPercentage: 50,
      resetTimeout: 60000,
      rollingCountTimeout: 60000,
      rollingCountBuckets: 10,
      volumeThreshold: 5,
      capacity: 50,
      fallbackEnabled: true,
      monitoringEnabled: true,
      alertingEnabled: true,
    };
  }

  /**
   * AI/ML service configuration
   * - Long timeout for AI processing
   * - Lower error threshold (AI services are expensive)
   * - Longer reset timeout
   */
  static get AI_SERVICE(): CircuitBreakerConfig {
    return {
      name: 'ai-service',
      timeout: 30000,
      errorThresholdPercentage: 30,
      resetTimeout: 120000,
      rollingCountTimeout: 30000,
      rollingCountBuckets: 6,
      volumeThreshold: 3,
      capacity: 20,
      fallbackEnabled: true,
      monitoringEnabled: true,
      alertingEnabled: true,
    };
  }

  /**
   * Email service configuration
   * - Medium-long timeout
   * - Higher error threshold (emails can be retried)
   * - Medium reset timeout
   */
  static get EMAIL_SERVICE(): CircuitBreakerConfig {
    return {
      name: 'email-service',
      timeout: 15000,
      errorThresholdPercentage: 70,
      resetTimeout: 60000,
      rollingCountTimeout: 20000,
      rollingCountBuckets: 10,
      volumeThreshold: 5,
      capacity: 30,
      fallbackEnabled: true,
      monitoringEnabled: true,
      alertingEnabled: false, // Don't alert for email failures
    };
  }

  /**
   * File upload service configuration
   * - Very long timeout for large files
   * - Medium error threshold
   * - Long reset timeout
   */
  static get UPLOAD_SERVICE(): CircuitBreakerConfig {
    return {
      name: 'upload-service',
      timeout: 120000, // 2 minutes
      errorThresholdPercentage: 50,
      resetTimeout: 180000, // 3 minutes
      rollingCountTimeout: 60000,
      rollingCountBuckets: 5,
      volumeThreshold: 3,
      capacity: 10,
      fallbackEnabled: false, // No fallback for uploads
      monitoringEnabled: true,
      alertingEnabled: true,
    };
  }

  /**
   * Payment service configuration
   * - Short timeout (payments should be fast)
   * - Very low error threshold (payments are critical)
   * - Short reset timeout
   */
  static get PAYMENT_SERVICE(): CircuitBreakerConfig {
    return {
      name: 'payment-service',
      timeout: 8000,
      errorThresholdPercentage: 20,
      resetTimeout: 45000,
      rollingCountTimeout: 15000,
      rollingCountBuckets: 15,
      volumeThreshold: 5,
      capacity: 50,
      fallbackEnabled: false, // No fallback for payments
      monitoringEnabled: true,
      alertingEnabled: true,
    };
  }

  /**
   * Analytics service configuration
   * - Medium timeout
   * - Higher error threshold (analytics can be delayed)
   * - Medium reset timeout
   */
  static get ANALYTICS_SERVICE(): CircuitBreakerConfig {
    return {
      name: 'analytics-service',
      timeout: 12000,
      errorThresholdPercentage: 65,
      resetTimeout: 90000,
      rollingCountTimeout: 30000,
      rollingCountBuckets: 10,
      volumeThreshold: 10,
      capacity: 100,
      fallbackEnabled: true,
      monitoringEnabled: true,
      alertingEnabled: false, // Don't alert for analytics failures
    };
  }

  /**
   * Search service configuration
   * - Fast timeout (search should be responsive)
   * - Medium error threshold
   * - Quick reset timeout
   */
  static get SEARCH_SERVICE(): CircuitBreakerConfig {
    return {
      name: 'search-service',
      timeout: 3000,
      errorThresholdPercentage: 45,
      resetTimeout: 30000,
      rollingCountTimeout: 15000,
      rollingCountBuckets: 10,
      volumeThreshold: 5,
      capacity: 200,
      fallbackEnabled: true,
      monitoringEnabled: true,
      alertingEnabled: false,
    };
  }

  /**
   * Notification service configuration
   * - Medium timeout
   * - High error threshold (notifications can be retried)
   * - Medium reset timeout
   */
  static get NOTIFICATION_SERVICE(): CircuitBreakerConfig {
    return {
      name: 'notification-service',
      timeout: 10000,
      errorThresholdPercentage: 75,
      resetTimeout: 60000,
      rollingCountTimeout: 20000,
      rollingCountBuckets: 10,
      volumeThreshold: 8,
      capacity: 100,
      fallbackEnabled: true,
      monitoringEnabled: true,
      alertingEnabled: false,
    };
  }

  /**
   * Cache service configuration
   * - Very fast timeout (cache should be instant)
   * - Low error threshold (cache is critical for performance)
   * - Quick reset timeout
   */
  static get CACHE_SERVICE(): CircuitBreakerConfig {
    return {
      name: 'cache-service',
      timeout: 1000,
      errorThresholdPercentage: 30,
      resetTimeout: 15000,
      rollingCountTimeout: 5000,
      rollingCountBuckets: 10,
      volumeThreshold: 20,
      capacity: 500,
      fallbackEnabled: true,
      monitoringEnabled: true,
      alertingEnabled: true,
    };
  }
}

/**
 * Environment-specific configuration overrides
 */
export class EnvironmentConfig {
  static getConfigForEnvironment(
    baseConfig: CircuitBreakerConfig,
    environment: 'development' | 'staging' | 'production'
  ): CircuitBreakerConfig {
    switch (environment) {
      case 'development':
        return {
          ...baseConfig,
          timeout: baseConfig.timeout! * 2, // Longer timeouts in dev
          errorThresholdPercentage: 80, // More lenient in dev
          resetTimeout: 10000, // Quick reset in dev
          alertingEnabled: false, // No alerts in dev
        };

      case 'staging':
        return {
          ...baseConfig,
          timeout: baseConfig.timeout! * 1.5, // Slightly longer timeouts
          errorThresholdPercentage: Math.min((baseConfig.errorThresholdPercentage || 50) + 10, 80),
          alertingEnabled: false, // No alerts in staging
        };

      case 'production':
        return baseConfig; // Use base config as-is for production

      default:
        return baseConfig;
    }
  }
}

/**
 * Circuit breaker configuration validator
 */
export class ConfigValidator {
  static validate(config: CircuitBreakerConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate name
    if (!config.name || config.name.trim().length === 0) {
      errors.push('Name is required');
    }

    // Validate timeout
    if (config.timeout !== undefined) {
      if (config.timeout <= 0) {
        errors.push('Timeout must be positive');
      }
      if (config.timeout > 300000) { // 5 minutes
        errors.push('Timeout should not exceed 5 minutes');
      }
    }

    // Validate error threshold
    if (config.errorThresholdPercentage !== undefined) {
      if (config.errorThresholdPercentage < 0 || config.errorThresholdPercentage > 100) {
        errors.push('Error threshold percentage must be between 0 and 100');
      }
    }

    // Validate reset timeout
    if (config.resetTimeout !== undefined) {
      if (config.resetTimeout <= 0) {
        errors.push('Reset timeout must be positive');
      }
    }

    // Validate rolling count timeout
    if (config.rollingCountTimeout !== undefined) {
      if (config.rollingCountTimeout <= 0) {
        errors.push('Rolling count timeout must be positive');
      }
    }

    // Validate volume threshold
    if (config.volumeThreshold !== undefined) {
      if (config.volumeThreshold <= 0) {
        errors.push('Volume threshold must be positive');
      }
    }

    // Validate capacity
    if (config.capacity !== undefined) {
      if (config.capacity <= 0) {
        errors.push('Capacity must be positive');
      }
    }

    // Logical validations
    if (config.resetTimeout !== undefined && config.timeout !== undefined) {
      if (config.resetTimeout < config.timeout) {
        errors.push('Reset timeout should be greater than or equal to timeout');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Configuration builder for fluent API
 */
export class CircuitBreakerConfigBuilder {
  private config: Partial<CircuitBreakerConfig> = {};

  constructor(name: string) {
    this.config.name = name;
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  errorThreshold(percentage: number): this {
    this.config.errorThresholdPercentage = percentage;
    return this;
  }

  resetTimeout(ms: number): this {
    this.config.resetTimeout = ms;
    return this;
  }

  rollingWindow(timeoutMs: number, buckets?: number): this {
    this.config.rollingCountTimeout = timeoutMs;
    if (buckets) {
      this.config.rollingCountBuckets = buckets;
    }
    return this;
  }

  volumeThreshold(requests: number): this {
    this.config.volumeThreshold = requests;
    return this;
  }

  capacity(maxConcurrent: number): this {
    this.config.capacity = maxConcurrent;
    return this;
  }

  enableFallback(): this {
    this.config.fallbackEnabled = true;
    return this;
  }

  disableFallback(): this {
    this.config.fallbackEnabled = false;
    return this;
  }

  enableMonitoring(): this {
    this.config.monitoringEnabled = true;
    return this;
  }

  enableAlerting(): this {
    this.config.alertingEnabled = true;
    return this;
  }

  disableAlerting(): this {
    this.config.alertingEnabled = false;
    return this;
  }

  build(): CircuitBreakerConfig {
    const validation = ConfigValidator.validate(this.config as CircuitBreakerConfig);
    if (!validation.valid) {
      throw new Error(`Invalid circuit breaker configuration: ${validation.errors.join(', ')}`);
    }
    return this.config as CircuitBreakerConfig;
  }

  static create(name: string): CircuitBreakerConfigBuilder {
    return new CircuitBreakerConfigBuilder(name);
  }
}

export default {
  CircuitBreakerPresets,
  EnvironmentConfig,
  ConfigValidator,
  CircuitBreakerConfigBuilder,
};