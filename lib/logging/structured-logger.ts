/**
 * Structured Logger with Correlation IDs
 *
 * Enterprise-grade structured logging for distributed tracing and debugging.
 * Features:
 * - Correlation IDs for request tracking across services
 * - Structured JSON output for log aggregation
 * - Performance metrics
 * - Security masking for sensitive data
 */

import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Log context interface
export interface LogContext {
  correlationId: string;
  userId?: string;
  sessionId?: string;
  requestPath?: string;
  requestMethod?: string;
  userAgent?: string;
  ip?: string;
}

// Async context storage for correlation IDs
const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

/**
 * Structured Logger Class
 */
export class StructuredLogger {
  private serviceName: string;
  private environment: string;
  private minLevel: LogLevel;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.environment = process.env.NODE_ENV || 'development';
    this.minLevel = this.getMinLogLevel();
  }

  /**
   * Get minimum log level from environment
   */
  private getMinLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    switch (envLevel) {
      case 'debug':
        return LogLevel.DEBUG;
      case 'warn':
        return LogLevel.WARN;
      case 'error':
        return LogLevel.ERROR;
      case 'fatal':
        return LogLevel.FATAL;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * Check if should log based on level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const currentIndex = levels.indexOf(level);
    const minIndex = levels.indexOf(this.minLevel);
    return currentIndex >= minIndex;
  }

  /**
   * Mask sensitive data in logs
   */
  private maskSensitiveData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sensitive = ['password', 'token', 'secret', 'apiKey', 'creditCard', 'ssn'];
    const masked = { ...data } as Record<string, unknown>;

    for (const key in masked) {
      const lowerKey = key.toLowerCase();
      if (sensitive.some(s => lowerKey.includes(s))) {
        masked[key] = '[REDACTED]';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }

    return masked;
  }

  /**
   * Format log entry as structured JSON
   */
  private formatLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
  ): string {
    const context = asyncLocalStorage.getStore();
    const timestamp = new Date().toISOString();

    const logEntry = {
      timestamp,
      level,
      service: this.serviceName,
      environment: this.environment,
      correlationId: context?.correlationId || 'no-correlation-id',
      userId: context?.userId,
      sessionId: context?.sessionId,
      request: context?.requestPath
        ? {
            path: context.requestPath,
            method: context.requestMethod,
            userAgent: context.userAgent,
            ip: context.ip,
          }
        : undefined,
      message,
      data: data ? this.maskSensitiveData(data) : undefined,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      performance: {
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        uptime: process.uptime(), // seconds
      },
    };

    return JSON.stringify(logEntry);
  }

  /**
   * Log methods
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatLogEntry(LogLevel.DEBUG, message, data));
    }
  }

  info(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatLogEntry(LogLevel.INFO, message, data));
    }
  }

  warn(message: string, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatLogEntry(LogLevel.WARN, message, data));
    }
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatLogEntry(LogLevel.ERROR, message, data, error));
    }
  }

  fatal(message: string, error?: Error, data?: Record<string, unknown>): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      console.error(this.formatLogEntry(LogLevel.FATAL, message, data, error));
      // In production, might trigger alerts or emergency procedures
    }
  }

  /**
   * Create child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): StructuredLogger {
    const childLogger = new StructuredLogger(this.serviceName);
    const currentContext = asyncLocalStorage.getStore();
    const mergedContext = { ...currentContext, ...additionalContext };

    // Run the child logger with merged context
    asyncLocalStorage.run(mergedContext as LogContext, () => {
      // Child logger will use this context
    });

    return childLogger;
  }
}

/**
 * Logger Manager - Singleton for managing loggers
 */
export class LoggerManager {
  private static instance: LoggerManager;
  private loggers = new Map<string, StructuredLogger>();

  private constructor() {}

  static getInstance(): LoggerManager {
    if (!LoggerManager.instance) {
      LoggerManager.instance = new LoggerManager();
    }
    return LoggerManager.instance;
  }

  /**
   * Get or create a logger for a service
   */
  getLogger(serviceName: string): StructuredLogger {
    if (!this.loggers.has(serviceName)) {
      this.loggers.set(serviceName, new StructuredLogger(serviceName));
    }
    return this.loggers.get(serviceName)!;
  }

  /**
   * Run code with logging context
   */
  static runWithContext<T>(
    context: LogContext,
    fn: () => T | Promise<T>
  ): T | Promise<T> {
    return asyncLocalStorage.run(context, fn);
  }

  /**
   * Create a new correlation ID
   */
  static createCorrelationId(): string {
    return randomUUID();
  }

  /**
   * Get current context
   */
  static getCurrentContext(): LogContext | undefined {
    return asyncLocalStorage.getStore();
  }

  /**
   * Express/Next.js middleware for adding correlation IDs
   */
  static middleware() {
    return (req: any, res: any, next: any) => {
      const correlationId =
        req.headers['x-correlation-id'] ||
        req.headers['x-request-id'] ||
        LoggerManager.createCorrelationId();

      const context: LogContext = {
        correlationId,
        userId: req.user?.id,
        sessionId: req.session?.id,
        requestPath: req.path || req.url,
        requestMethod: req.method,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
      };

      // Add correlation ID to response headers
      res.setHeader('X-Correlation-Id', correlationId);

      // Run the rest of the request with context
      asyncLocalStorage.run(context, () => {
        next();
      });
    };
  }
}

// Default logger instances for common services
export const AppLogger = LoggerManager.getInstance().getLogger('app');
export const ApiLogger = LoggerManager.getInstance().getLogger('api');
export const AuthLogger = LoggerManager.getInstance().getLogger('auth');
export const DbLogger = LoggerManager.getInstance().getLogger('database');
export const AILogger = LoggerManager.getInstance().getLogger('ai-services');

// Convenience function for logging with correlation ID
export function logWithCorrelation<T>(
  fn: () => T | Promise<T>,
  context?: Partial<LogContext>
): T | Promise<T> {
  const correlationId = LoggerManager.createCorrelationId();
  const fullContext: LogContext = {
    correlationId,
    ...context,
  };

  return LoggerManager.runWithContext(fullContext, fn);
}