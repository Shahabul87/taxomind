import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/error-handling/api-error-handler';
import { errorMonitoring } from '@/lib/error-handling/error-monitoring';

export const runtime = 'nodejs';

// GET /api/error-management/metrics - Get error metrics and analytics
export const GET = withErrorHandling(async (request: Request) => {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  const timeRange = searchParams.get('timeRange') as '1h' | '1d' | '1w' || '1d';
  const includeDetails = searchParams.get('includeDetails') === 'true';

  // Get comprehensive metrics
  const metrics = await errorMonitoring.getErrorMetrics(timeRange);
  
  if (!metrics) {
    throw new Error('Failed to retrieve error metrics');
  }

  // Get additional analytics
  const [
    activeAlerts,
    recentTrends,
    topComponents,
    topUsers,
    resolutionStats
  ] = await Promise.all([
    // Active alerts count
    db.errorAlert.count({
      where: {
        acknowledged: false,
        resolvedAt: null
      }
    }),
    
    // Recent trends (last 7 days)
    db.errorLog.groupBy({
      by: ['timestamp'],
      where: {
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _count: {
        _all: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    }),
    
    // Top error-prone components
    db.errorLog.groupBy({
      by: ['component'],
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        component: {
          not: null
        }
      },
      _count: {
        component: true
      },
      orderBy: {
        _count: {
          component: 'desc'
        }
      },
      take: 10
    }),
    
    // Top users with errors
    db.errorLog.groupBy({
      by: ['userId'],
      where: {
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        userId: {
          not: null
        }
      },
      _count: {
        userId: true
      },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: 10
    }),
    
    // Resolution statistics
    db.errorLog.aggregate({
      where: {
        resolved: true,
        resolvedAt: {
          not: null
        },
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      _avg: {
        updatedAt: true
      },
      _count: {
        _all: true
      }
    })
  ]);

  // Calculate error rate (errors per hour)
  const timeWindow = timeRange === '1h' ? 1 : timeRange === '1d' ? 24 : 168;
  const errorRate = metrics.totalErrors / timeWindow;

  // Calculate resolution rate
  const resolvedCount = await db.errorLog.count({
    where: {
      resolved: true,
      timestamp: {
        gte: new Date(Date.now() - (timeRange === '1h' ? 60 * 60 * 1000 : timeRange === '1d' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000))
      }
    }
  });

  const resolutionRate = metrics.totalErrors > 0 ? (resolvedCount / metrics.totalErrors) * 100 : 0;

  // Get user details for top users if requested
  let topUsersWithDetails = [];
  if (includeDetails && topUsers.length > 0) {
    const userIds = topUsers.map(u => u.userId).filter(Boolean);
    const users = await db.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    topUsersWithDetails = topUsers.map(tu => ({
      ...tu,
      user: users.find(u => u.id === tu.userId)
    }));
  }

  const response = {
    summary: {
      totalErrors: metrics.totalErrors,
      activeAlerts,
      errorRate: Math.round(errorRate * 100) / 100,
      resolutionRate: Math.round(resolutionRate * 100) / 100,
      timeRange
    },
    
    errorsByType: metrics.errorsByType,
    errorsBySeverity: metrics.errorsBySeverity,
    errorsByComponent: metrics.errorsByComponent,
    trends: metrics.trends,
    
    analytics: {
      topComponents: topComponents.map(tc => ({
        component: tc.component,
        count: tc._count.component
      })),
      topUsers: includeDetails ? topUsersWithDetails : topUsers,
      resolutionStats: {
        totalResolved: resolutionStats._count._all,
        avgResolutionTime: resolutionStats._avg.updatedAt
      }
    }
  };

  if (includeDetails) {
    response.recentErrors = metrics.recentErrors;
  }

  return response;
});

// GET /api/error-management/metrics/health - Get system health status
export const POST = withErrorHandling(async (request: Request) => {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    criticalErrorsLastHour,
    totalErrorsLastHour,
    totalErrorsLastDay,
    activeAlerts,
    systemErrors
  ] = await Promise.all([
    db.errorLog.count({
      where: {
        severity: 'CRITICAL',
        timestamp: { gte: oneHourAgo }
      }
    }),
    db.errorLog.count({
      where: {
        timestamp: { gte: oneHourAgo }
      }
    }),
    db.errorLog.count({
      where: {
        timestamp: { gte: oneDayAgo }
      }
    }),
    db.errorAlert.count({
      where: {
        acknowledged: false,
        resolvedAt: null
      }
    }),
    db.errorLog.count({
      where: {
        errorType: 'DATABASE',
        timestamp: { gte: oneHourAgo }
      }
    })
  ]);

  // Determine health status
  let healthStatus = 'healthy';
  let healthScore = 100;
  const issues = [];

  if (criticalErrorsLastHour > 0) {
    healthStatus = 'critical';
    healthScore -= 50;
    issues.push(`${criticalErrorsLastHour} critical errors in the last hour`);
  }

  if (totalErrorsLastHour > 50) {
    healthStatus = healthStatus === 'critical' ? 'critical' : 'warning';
    healthScore -= 30;
    issues.push(`High error rate: ${totalErrorsLastHour} errors in the last hour`);
  }

  if (activeAlerts > 10) {
    healthStatus = healthStatus === 'critical' ? 'critical' : 'warning';
    healthScore -= 20;
    issues.push(`${activeAlerts} active alerts requiring attention`);
  }

  if (systemErrors > 5) {
    healthStatus = healthStatus === 'critical' ? 'critical' : 'warning';
    healthScore -= 15;
    issues.push(`${systemErrors} system/database errors in the last hour`);
  }

  return {
    healthStatus,
    healthScore: Math.max(0, healthScore),
    timestamp: now,
    metrics: {
      criticalErrorsLastHour,
      totalErrorsLastHour,
      totalErrorsLastDay,
      activeAlerts,
      systemErrors
    },
    issues
  };
});