import { ErrorInfo, ErrorAlert, ErrorMetrics, ErrorSeverity, ErrorType } from './types';
import { db } from '@/lib/db';
import { errorLogger } from './error-logger';

export class ErrorMonitoring {
  private static instance: ErrorMonitoring;
  private alertThresholds = {
    errorSpike: 10, // errors per minute
    criticalErrors: 5, // critical errors per hour
    userImpact: 5, // unique users affected per hour
    componentFailure: 3 // errors from same component per 5 minutes
  };

  private constructor() {}

  static getInstance(): ErrorMonitoring {
    if (!ErrorMonitoring.instance) {
      ErrorMonitoring.instance = new ErrorMonitoring();
    }
    return ErrorMonitoring.instance;
  }

  async checkForAlerts(): Promise<void> {
    try {
      await Promise.all([
        this.checkErrorSpike(),
        this.checkCriticalErrors(),
        this.checkUserImpact(),
        this.checkComponentFailures()
      ]);
    } catch (error) {
      console.error('[ERROR_MONITORING] Alert check failed:', error);
    }
  }

  private async checkErrorSpike(): Promise<void> {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    const recentErrors = await db.errorLog.count({
      where: {
        timestamp: {
          gte: oneMinuteAgo
        }
      }
    });

    if (recentErrors >= this.alertThresholds.errorSpike) {
      await this.createAlert({
        type: 'SPIKE',
        message: `Error spike detected: ${recentErrors} errors in the last minute`,
        severity: ErrorSeverity.HIGH,
        metadata: {
          errorCount: recentErrors,
          timeWindow: '1 minute',
          threshold: this.alertThresholds.errorSpike
        }
      });
    }
  }

  private async checkCriticalErrors(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const criticalErrors = await db.errorLog.findMany({
      where: {
        severity: ErrorSeverity.CRITICAL,
        timestamp: {
          gte: oneHourAgo
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (criticalErrors.length >= this.alertThresholds.criticalErrors) {
      await this.createAlert({
        type: 'CRITICAL',
        message: `Multiple critical errors detected: ${criticalErrors.length} in the last hour`,
        severity: ErrorSeverity.CRITICAL,
        metadata: {
          errorCount: criticalErrors.length,
          timeWindow: '1 hour',
          threshold: this.alertThresholds.criticalErrors,
          affectedUsers: criticalErrors.map(e => e.user?.id).filter(Boolean)
        }
      });
    }
  }

  private async checkUserImpact(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const uniqueUsersAffected = await db.errorLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: oneHourAgo
        },
        userId: {
          not: null
        }
      },
      _count: {
        userId: true
      }
    });

    if (uniqueUsersAffected.length >= this.alertThresholds.userImpact) {
      await this.createAlert({
        type: 'USER_IMPACT',
        message: `High user impact detected: ${uniqueUsersAffected.length} unique users affected in the last hour`,
        severity: ErrorSeverity.HIGH,
        metadata: {
          affectedUsers: uniqueUsersAffected.length,
          timeWindow: '1 hour',
          threshold: this.alertThresholds.userImpact
        }
      });
    }
  }

  private async checkComponentFailures(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const componentErrors = await db.errorLog.groupBy({
      by: ['component'],
      where: {
        timestamp: {
          gte: fiveMinutesAgo
        },
        component: {
          not: null
        }
      },
      _count: {
        component: true
      },
      having: {
        component: {
          _count: {
            gte: this.alertThresholds.componentFailure
          }
        }
      }
    });

    for (const componentError of componentErrors) {
      await this.createAlert({
        type: 'NEW_ERROR',
        message: `Component failure detected: ${componentError.component} has ${componentError._count.component} errors in the last 5 minutes`,
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          component: componentError.component,
          errorCount: componentError._count.component,
          timeWindow: '5 minutes',
          threshold: this.alertThresholds.componentFailure
        }
      });
    }
  }

  private async createAlert(alertData: {
    type: 'SPIKE' | 'CRITICAL' | 'NEW_ERROR' | 'USER_IMPACT';
    message: string;
    severity: ErrorSeverity;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // Check if similar alert already exists (to avoid spam)
      const existingAlert = await db.errorAlert.findFirst({
        where: {
          type: alertData.type,
          acknowledged: false,
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // within last hour
          }
        }
      });

      if (existingAlert) {
        return; // Don't create duplicate alerts
      }

      // Create a mock error log for the alert (system-generated)
      const alertError = await db.errorLog.create({
        data: {
          message: alertData.message,
          errorType: ErrorType.UNKNOWN,
          severity: alertData.severity,
          component: 'ErrorMonitoring',
          metadata: JSON.stringify(alertData.metadata),
          resolved: false
        }
      });

      // Create the alert
      await db.errorAlert.create({
        data: {
          errorId: alertError.id,
          type: alertData.type,
          message: alertData.message,
          severity: alertData.severity,
          metadata: JSON.stringify(alertData.metadata)
        }
      });

      // Send notifications
      await this.sendAlertNotification(alertData);
    } catch (error) {
      console.error('[ERROR_MONITORING] Failed to create alert:', error);
    }
  }

  private async sendAlertNotification(alertData: {
    type: 'SPIKE' | 'CRITICAL' | 'NEW_ERROR' | 'USER_IMPACT';
    message: string;
    severity: ErrorSeverity;
    metadata?: Record<string, any>;
  }): Promise<void> {
    // Integration with notification services
    // This can be extended to integrate with Slack, Discord, email, etc.
    
    console.warn(`[ERROR_ALERT] ${alertData.type}: ${alertData.message}`);
    
    // Slack webhook integration
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: `🚨 Error Alert: ${alertData.type}`,
            attachments: [{
              color: alertData.severity === ErrorSeverity.CRITICAL ? 'danger' : 'warning',
              fields: [
                {
                  title: 'Message',
                  value: alertData.message,
                  short: false
                },
                {
                  title: 'Severity',
                  value: alertData.severity,
                  short: true
                },
                {
                  title: 'Time',
                  value: new Date().toISOString(),
                  short: true
                }
              ]
            }]
          })
        });
      } catch (error) {
        console.error('[ERROR_MONITORING] Slack notification failed:', error);
      }
    }

    // Email notification for critical errors
    if (alertData.severity === ErrorSeverity.CRITICAL && process.env.ALERT_EMAIL) {
      // Email integration would go here
      console.warn('[ERROR_MONITORING] Critical error notification should be sent via email');
    }
  }

  async getErrorMetrics(timeRange: '1h' | '1d' | '1w' = '1d'): Promise<ErrorMetrics | null> {
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
        },
        take: 1000 // Limit to prevent memory issues
      });

      const errorsByType = errors.reduce((acc, error) => {
        acc[error.errorType] = (acc[error.errorType] || 0) + 1;
        return acc;
      }, {} as Record<ErrorType, number>);

      const errorsBySeverity = errors.reduce((acc, error) => {
        acc[error.severity] = (acc[error.severity] || 0) + 1;
        return acc;
      }, {} as Record<ErrorSeverity, number>);

      const errorsByComponent = errors.reduce((acc, error) => {
        const component = error.component || 'unknown';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const errorsByUser = errors.reduce((acc, error) => {
        if (error.userId) {
          acc[error.userId] = (acc[error.userId] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const trends = this.calculateTrends(errors, timeRange);

      return {
        totalErrors: errors.length,
        errorsByType,
        errorsBySeverity,
        errorsByComponent,
        errorsByUser,
        recentErrors: errors.slice(0, 10).map(error => ({
          id: error.id,
          message: error.message,
          stack: error.stack,
          timestamp: error.timestamp,
          userId: error.userId,
          userAgent: error.userAgent,
          url: error.url,
          component: error.component,
          errorType: error.errorType,
          severity: error.severity,
          context: error.context ? JSON.parse(error.context) : undefined,
          metadata: error.metadata ? JSON.parse(error.metadata) : undefined
        })),
        trends
      };
    } catch (error) {
      console.error('[ERROR_MONITORING] Failed to get metrics:', error);
      return null;
    }
  }

  private calculateTrends(errors: any[], timeRange: '1h' | '1d' | '1w') {
    const now = new Date();
    const trends = {
      hourly: new Array(24).fill(0),
      daily: new Array(7).fill(0),
      weekly: new Array(4).fill(0)
    };

    for (const error of errors) {
      const errorTime = new Date(error.timestamp);
      const timeDiff = now.getTime() - errorTime.getTime();
      
      // Hourly trend (last 24 hours)
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      if (hoursAgo < 24) {
        trends.hourly[23 - hoursAgo]++;
      }
      
      // Daily trend (last 7 days)
      const daysAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      if (daysAgo < 7) {
        trends.daily[6 - daysAgo]++;
      }
      
      // Weekly trend (last 4 weeks)
      const weeksAgo = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
      if (weeksAgo < 4) {
        trends.weekly[3 - weeksAgo]++;
      }
    }

    return trends;
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      await db.errorAlert.update({
        where: { id: alertId },
        data: {
          acknowledged: true,
          acknowledgedBy: userId,
          acknowledgedAt: new Date()
        }
      });
    } catch (error) {
      console.error('[ERROR_MONITORING] Failed to acknowledge alert:', error);
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      await db.errorAlert.update({
        where: { id: alertId },
        data: {
          resolvedAt: new Date()
        }
      });
    } catch (error) {
      console.error('[ERROR_MONITORING] Failed to resolve alert:', error);
    }
  }

  async getActiveAlerts(): Promise<ErrorAlert[]> {
    try {
      const alerts = await db.errorAlert.findMany({
        where: {
          acknowledged: false,
          resolvedAt: null
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 50
      });

      return alerts.map(alert => ({
        id: alert.id,
        errorId: alert.errorId,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        timestamp: alert.timestamp,
        acknowledged: alert.acknowledged,
        resolvedAt: alert.resolvedAt,
        metadata: alert.metadata ? JSON.parse(alert.metadata) : undefined
      }));
    } catch (error) {
      console.error('[ERROR_MONITORING] Failed to get active alerts:', error);
      return [];
    }
  }

  // Start monitoring background process
  startMonitoring(): void {
    // Check for alerts every 5 minutes
    setInterval(() => {
      this.checkForAlerts();
    }, 5 * 60 * 1000);

    // Update daily metrics every hour
    setInterval(() => {
      this.updateDailyMetrics();
    }, 60 * 60 * 1000);

    console.log('[ERROR_MONITORING] Monitoring started');
  }

  private async updateDailyMetrics(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayErrors = await db.errorLog.findMany({
        where: {
          timestamp: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      const errorsByType = JSON.stringify(
        todayErrors.reduce((acc, error) => {
          acc[error.errorType] = (acc[error.errorType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );

      const errorsBySeverity = JSON.stringify(
        todayErrors.reduce((acc, error) => {
          acc[error.severity] = (acc[error.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );

      const errorsByComponent = JSON.stringify(
        todayErrors.reduce((acc, error) => {
          const component = error.component || 'unknown';
          acc[component] = (acc[component] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );

      const uniqueUsers = new Set(todayErrors.map(e => e.userId).filter(Boolean)).size;
      const resolvedErrors = todayErrors.filter(e => e.resolved).length;

      await db.errorMetrics.upsert({
        where: { date: today },
        update: {
          totalErrors: todayErrors.length,
          errorsByType,
          errorsBySeverity,
          errorsByComponent,
          uniqueUsers,
          resolvedErrors
        },
        create: {
          date: today,
          totalErrors: todayErrors.length,
          errorsByType,
          errorsBySeverity,
          errorsByComponent,
          uniqueUsers,
          resolvedErrors
        }
      });
    } catch (error) {
      console.error('[ERROR_MONITORING] Failed to update daily metrics:', error);
    }
  }
}

export const errorMonitoring = ErrorMonitoring.getInstance();