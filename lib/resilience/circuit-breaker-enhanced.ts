/**
 * Enhanced Circuit Breaker Pattern
 *
 * Prevents cascading failures by failing fast when external services are down.
 * Implements the Circuit Breaker pattern with three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is down, requests fail immediately
 * - HALF_OPEN: Testing if service has recovered
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;      // Number of failures before opening circuit
  resetTimeout: number;           // Time in ms before attempting to close circuit
  requestTimeout: number;         // Max time in ms for a single request
  volumeThreshold: number;        // Minimum number of requests before circuit can open
  errorFilter?: (error: Error) => boolean; // Custom error filter
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  totalRequests: number;
  consecutiveFailures: number;
}

export class CircuitBreaker<T = unknown> {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private consecutiveFailures = 0;
  private lastFailureTime: number | null = null;
  private totalRequests = 0;
  private halfOpenRequests = 0;

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<R>(fn: () => Promise<R>): Promise<R> {
    // Check if circuit should be opened
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.halfOpenRequests = 0;
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker is OPEN for ${this.config.name}`,
          this.config.name
        );
      }
    }

    // Limit requests in half-open state
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequests++;
      if (this.halfOpenRequests > 1) {
        throw new CircuitBreakerError(
          `Circuit breaker is testing recovery for ${this.config.name}`,
          this.config.name
        );
      }
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<R>(fn: () => Promise<R>): Promise<R> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${this.config.requestTimeout}ms`)),
          this.config.requestTimeout
        )
      ),
    ]);
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.totalRequests++;
    this.successes++;
    this.consecutiveFailures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      // Service has recovered, close the circuit
      this.state = CircuitState.CLOSED;
      this.failures = 0;
      console.log(`Circuit breaker ${this.config.name} is now CLOSED (recovered)`);
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(error: Error): void {
    this.totalRequests++;

    // Check if error should be counted
    if (this.config.errorFilter && !this.config.errorFilter(error)) {
      return; // Don't count this error
    }

    this.failures++;
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();

    // Check if circuit should open
    if (this.state === CircuitState.HALF_OPEN) {
      // Service still failing, reopen circuit
      this.state = CircuitState.OPEN;
      console.error(`Circuit breaker ${this.config.name} is OPEN (test failed)`);
    } else if (
      this.state === CircuitState.CLOSED &&
      this.totalRequests >= this.config.volumeThreshold &&
      this.consecutiveFailures >= this.config.failureThreshold
    ) {
      // Too many failures, open circuit
      this.state = CircuitState.OPEN;
      console.error(`Circuit breaker ${this.config.name} is OPEN (threshold exceeded)`);
    }
  }

  /**
   * Check if circuit should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.config.resetTimeout
    );
  }

  /**
   * Get current metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      totalRequests: this.totalRequests,
      consecutiveFailures: this.consecutiveFailures,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
    this.totalRequests = 0;
    this.halfOpenRequests = 0;
    console.log(`Circuit breaker ${this.config.name} manually reset`);
  }
}

/**
 * Circuit Breaker Error
 */
export class CircuitBreakerError extends Error {
  constructor(message: string, public readonly serviceName: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

/**
 * Circuit Breaker Manager for managing multiple circuit breakers
 */
export class CircuitBreakerManager {
  private static instance: CircuitBreakerManager;
  private breakers = new Map<string, CircuitBreaker>();

  private constructor() {}

  static getInstance(): CircuitBreakerManager {
    if (!CircuitBreakerManager.instance) {
      CircuitBreakerManager.instance = new CircuitBreakerManager();
    }
    return CircuitBreakerManager.instance;
  }

  /**
   * Get or create a circuit breaker
   */
  getBreaker(config: CircuitBreakerConfig): CircuitBreaker {
    if (!this.breakers.has(config.name)) {
      this.breakers.set(config.name, new CircuitBreaker(config));
    }
    return this.breakers.get(config.name)!;
  }

  /**
   * Get all circuit breaker metrics
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    this.breakers.forEach((breaker, name) => {
      metrics[name] = breaker.getMetrics();
    });
    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Reset specific circuit breaker
   */
  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }
}

/**
 * Pre-configured circuit breakers for common services
 */
export const ServiceCircuitBreakers = {
  OpenAI: {
    name: 'OpenAI',
    failureThreshold: 3,
    resetTimeout: 30000, // 30 seconds
    requestTimeout: 30000, // 30 seconds
    volumeThreshold: 5,
    errorFilter: (error: Error) => {
      // Don't count rate limit errors as failures
      return !error.message.includes('rate limit');
    },
  },
  Anthropic: {
    name: 'Anthropic',
    failureThreshold: 3,
    resetTimeout: 30000,
    requestTimeout: 30000,
    volumeThreshold: 5,
  },
  Stripe: {
    name: 'Stripe',
    failureThreshold: 2,
    resetTimeout: 60000, // 1 minute
    requestTimeout: 10000, // 10 seconds
    volumeThreshold: 3,
    errorFilter: (error: Error) => {
      // Don't count validation errors as circuit failures
      return !error.message.includes('validation');
    },
  },
  Redis: {
    name: 'Redis',
    failureThreshold: 5,
    resetTimeout: 10000, // 10 seconds
    requestTimeout: 5000, // 5 seconds
    volumeThreshold: 10,
  },
  Database: {
    name: 'Database',
    failureThreshold: 3,
    resetTimeout: 20000, // 20 seconds
    requestTimeout: 15000, // 15 seconds
    volumeThreshold: 5,
    errorFilter: (error: Error) => {
      // Don't count constraint violations as circuit failures
      return !error.message.includes('constraint') && !error.message.includes('duplicate');
    },
  },
};