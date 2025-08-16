import { ErrorInfo, ErrorSeverity, ErrorType } from './types';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export class ErrorLogger {
  private static instance: ErrorLogger;
  private isClient = typeof window !== 'undefined';

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCurrentUser() {
    try {
      return await currentUser();
    } catch {
      return null;
    }
  }

  private getUserAgent(): string {
    if (this.isClient) {
      return navigator.userAgent;
    }
    return 'server';
  }

  private getCurrentUrl(): string {
    if (this.isClient) {
      return window.location.href;
    }
    return 'server';
  }

  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('unauthorized') || message.includes('auth')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION;
    }
    if (message.includes('database') || message.includes('prisma')) {
      return ErrorType.DATABASE;
    }
    if (message.includes('api') || message.includes('request')) {
      return ErrorType.API;
    }
    if (message.includes('component') || message.includes('render')) {
      return ErrorType.COMPONENT;
    }
    
    return ErrorType.RUNTIME;
  }

  private determineSeverity(error: Error, errorType: ErrorType): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal') || 
        errorType === ErrorType.DATABASE) {
      return ErrorSeverity.CRITICAL;
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.LOW;
    }
    if (errorType === ErrorType.NETWORK || errorType === ErrorType.API) {
      return ErrorSeverity.HIGH;
    }
    
    return ErrorSeverity.MEDIUM;
  }

  async logError(
    error: Error,
    context?: Record<string, any>,
    component?: string
  ): Promise<ErrorInfo> {
    const user = await this.getCurrentUser();
    const errorType = this.determineErrorType(error);
    const severity = this.determineSeverity(error, errorType);
    const traceId = this.generateTraceId();

    const errorInfo: ErrorInfo = {
      id: traceId,
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      userId: user?.id,
      userAgent: this.getUserAgent(),
      url: this.getCurrentUrl(),
      component,
      errorType,
      severity,
      context,
      metadata: {
        name: error.name,
        traceId,
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      }
    };

    // Log to console with structured format
    const logLevel = severity === ErrorSeverity.CRITICAL ? 'error' : 
                    severity === ErrorSeverity.HIGH ? 'error' : 
                    severity === ErrorSeverity.MEDIUM ? 'warn' : 'info';
    
    console[logLevel](`[ERROR_LOGGER] ${errorType}:${severity}`, {
      id: errorInfo.id,
      message: errorInfo.message,
      component: errorInfo.component,
      userId: errorInfo.userId,
      timestamp: errorInfo.timestamp,
      context: errorInfo.context
    });

    // Store in database (async, non-blocking)
    this.persistError(errorInfo).catch(persistError => {
      console.error('[ERROR_LOGGER] Failed to persist error:', persistError);
    });

    // Send to external monitoring services
    this.sendToMonitoring(errorInfo).catch(monitoringError => {
      console.error('[ERROR_LOGGER] Failed to send to monitoring:', monitoringError);
    });

    return errorInfo;
  }

  private async persistError(errorInfo: ErrorInfo): Promise<void> {
    try {
      await db.errorLog.create({
        data: {
          id: errorInfo.id,
          message: errorInfo.message,
          stack: errorInfo.stack || '',
          timestamp: errorInfo.timestamp,
          userId: errorInfo.userId,
          userAgent: errorInfo.userAgent || '',
          url: errorInfo.url || '',
          component: errorInfo.component || '',
          errorType: errorInfo.errorType,
          severity: errorInfo.severity,
          context: errorInfo.context ? JSON.stringify(errorInfo.context) : null,
          metadata: errorInfo.metadata ? JSON.stringify(errorInfo.metadata) : null,
          resolved: false
        }
      });
    } catch (dbError) {
      console.error('[ERROR_LOGGER] Database persist failed:', dbError);
    }
  }

  private async sendToMonitoring(errorInfo: ErrorInfo): Promise<void> {
    // Integration with external monitoring services
    // This can be extended to integrate with Sentry, LogRocket, etc.
    
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
    }
    
    if (process.env.LOGROCKET_APP_ID) {
      // LogRocket integration would go here
    }
    
    // For now, we'll use a simple webhook if configured
    if (process.env.ERROR_WEBHOOK_URL) {
      try {
        await fetch(process.env.ERROR_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...errorInfo,
            timestamp: errorInfo.timestamp.toISOString()
          })
        });
      } catch (webhookError) {
        console.error('[ERROR_LOGGER] Webhook failed:', webhookError);
      }
    }
  }

  async getErrorMetrics(timeRange: '1h' | '1d' | '1w' = '1d') {
    const since = new Date();
    switch (timeRange) {
      case '1h':
        since.setHours(since.getHours() - 1);
        break;
      case '1d':
        since.setDate(since.getDate() - 1);
        break;
      case '1w':
        since.setDate(since.getDate() - 7);
        break;
    }

    try {
      const errors = await db.errorLog.findMany({
        where: {
          timestamp: {
            gte: since
          }
        },
        orderBy: {
          timestamp: 'desc'
        }
      });

      const metrics = {
        totalErrors: errors.length,
        errorsByType: errors.reduce((acc, error) => {
          acc[error.errorType] = (acc[error.errorType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        errorsBySeverity: errors.reduce((acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        errorsByComponent: errors.reduce((acc, error) => {
          const component = error.component || 'unknown';
          acc[component] = (acc[component] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        recentErrors: errors.slice(0, 10)
      };

      return metrics;
    } catch (dbError) {
      console.error('[ERROR_LOGGER] Failed to get metrics:', dbError);
      return null;
    }
  }
}

export const errorLogger = ErrorLogger.getInstance();