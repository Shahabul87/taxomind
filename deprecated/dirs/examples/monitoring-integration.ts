/**
 * Monitoring System Integration Examples
 * Shows how to integrate monitoring throughout the application
 */

import { 
  monitoring,
  monitorDatabaseQuery,
  monitorCacheOperation,
  DatabaseTracer,
  CacheTracer,
  HttpTracer,
  AITracer,
  apmMiddleware
} from '@/lib/monitoring/init';
import { HealthCheckResult, HealthStatus } from '@/lib/monitoring/health';
import { RemediationAction } from '@/lib/monitoring/incident-response';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

/**
 * Example 1: Using APM middleware in API routes
 */
export async function exampleApiRoute(req: Request) {
  // Middleware automatically tracks request metrics
  // No additional code needed if apmMiddleware is applied
}

/**
 * Example 2: Monitoring database queries
 */
export async function getUserWithMonitoring(userId: string) {
  // Wrap database query with monitoring
  return await monitorDatabaseQuery('findUnique',
    'User',
    async () => {
      return await db.user.findUnique({
        where: { id: userId },
        include: {
          courses: true,
          Enrollment: true,
        },
      });
    }
  );
}

/**
 * Example 3: Using database tracer for complex operations
 */
export async function createCourseWithTracing(courseData: any) {
  return await DatabaseTracer.traceTransaction('create_course',
    async (tx) => {
      // All queries within this transaction are automatically traced
      const course = await db.course.create({
        data: courseData,
      });
      
      // Create chapters
      for (const chapterData of courseData.chapters) {
        await db.chapter.create({
          data: {
            ...chapterData,
            courseId: course.id,
          },
        });
      }
      
      return course;
    }
  );
}

/**
 * Example 4: Monitoring cache operations
 */
export async function getCachedUserWithMonitoring(userId: string) {
  const cacheKey = `user:${userId}`;
  
  // Check cache with monitoring
  const cached = await monitorCacheOperation('get',
    cacheKey,
    async () => {
      return await redis.get(cacheKey);
    }
  );
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const user = await getUserWithMonitoring(userId);
  
  // Store in cache with monitoring
  await monitorCacheOperation('set',
    cacheKey,
    async () => {
      return await redis.set(
        cacheKey,
        JSON.stringify(user)
      );
    }
  );
  
  return user;
}

/**
 * Example 5: Using the @Trace decorator for automatic tracing
 */
class CourseService {
  async getCourseProgress(courseId: string, userId: string): Promise<any> {
    // Method is automatically traced
    const enrollment = await db.enrollment.findFirst({
      where: {
        courseId,
        userId,
      },
    });
    
    return enrollment ? 100 : 0; // Simple progress indicator
  }
  
  async updateProgress(enrollmentId: string, progress: number) {
    // Method is automatically traced
    return await db.enrollment.update({
      where: { id: enrollmentId },
      data: { updatedAt: new Date() },
    });
  }
}

/**
 * Example 6: Tracing external API calls
 */
export async function callOpenAIWithTracing(prompt: string) {
  return await HttpTracer.traceRequest('POST',
    'https://api.openai.com/v1/completions',
    async () => {
      const response = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      
      return await response.json();
    }
  );
}

/**
 * Example 7: Tracing AI operations
 */
export async function generateCourseContentWithTracing(topic: string) {
  return await AITracer.traceOperation('generate_course_content',
    'gpt-4',
    async () => {
      // Your AI content generation logic here
      const response = await callOpenAIWithTracing(
        `Generate a course outline for: ${topic}`
      );
      
      return response;
    }
  );
}

/**
 * Example 8: Recording custom business metrics
 */
export async function recordUserEngagement(userId: string, action: string) {
  const metrics = monitoring.getComponents().metrics;
  
  // Record custom metric
  metrics.recordCustomMetric('user_engagement',
    1,
    'counter',
    {
      userId,
      action,
      timestamp: new Date().toISOString(),
    }
  );
}

/**
 * Example 9: Manual alert triggering
 */
export async function checkBusinessThreshold(value: number) {
  const alerts = monitoring.getComponents().alerts;
  
  // Evaluate metric against alert rules
  await alerts.evaluateMetric('business.custom_metric',
    value,
    {
      context: 'manual_check',
      source: 'business_logic',
    }
  );
}

/**
 * Example 10: Health check integration
 */
export async function performCustomHealthCheck() {
  const health = monitoring.getComponents().health;
  
  // Register custom health check
  health.registerCheck({
    name: 'custom_service',
    checkFn: async (): Promise<HealthCheckResult> => {
      try {
        // Your health check logic
        const isHealthy = await checkServiceHealth();
        
        return {
          name: 'custom_service',
          status: isHealthy ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
          message: isHealthy ? 'Service is healthy' : 'Service is unhealthy',
          responseTime: 100,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          name: 'custom_service',
          status: HealthStatus.UNHEALTHY,
          message: 'Health check failed',
          responseTime: 0,
          timestamp: new Date(),
          error: (error as Error).message,
        };
      }
    },
    critical: false,
    timeout: 5000,
    retries: 2,
    interval: 60000,
  });
}

async function checkServiceHealth(): Promise<boolean> {
  // Implementation of service health check
  return true;
}

/**
 * Example 11: Creating a transaction with multiple spans
 */
export async function complexOperationWithTracing(userId: string, courseId: string) {
  const { TransactionTracer } = await import('@/lib/monitoring/tracing');
  
  const transaction = new TransactionTracer('complex_operation', {
    userId,
    courseId,
  });
  
  try {
    // Start child span for database operation
    const dbSpan = transaction.startChildSpan('fetch_user_data');
    const user = await getUserWithMonitoring(userId);
    dbSpan.end();
    
    // Start child span for cache operation
    const cacheSpan = transaction.startChildSpan('cache_lookup');
    const cachedData = await getCachedUserWithMonitoring(userId);
    cacheSpan.end();
    
    // Start child span for AI operation
    const aiSpan = transaction.startChildSpan('generate_content');
    const content = await generateCourseContentWithTracing('Advanced Mathematics');
    aiSpan.end();
    
    // Add event to transaction
    transaction.addEvent('all_operations_completed', {
      userFound: !!user,
      cacheHit: !!cachedData,
      contentGenerated: !!content,
    });
    
    transaction.end({ code: 0 }); // Success
    
    return { user, cachedData, content };
  } catch (error) {
    transaction.recordException(error as Error);
    transaction.end({ code: 1, message: (error as Error).message }); // Error
    throw error;
  }
}

/**
 * Example 12: Dashboard data access
 */
export async function getDashboardData(dashboardId: string) {
  const dashboards = monitoring.getComponents().dashboards;
  
  const dashboard = dashboards.getDashboard(dashboardId);
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }
  
  // Get real-time widget data
  const widgetData: Record<string, any> = {};
  for (const widget of dashboard.widgets) {
    widgetData[widget.id] = dashboards.getWidgetData(widget.id);
  }
  
  return {
    config: dashboard,
    data: widgetData,
  };
}

/**
 * Example 13: Incident response integration
 */
export async function handleCriticalError(error: Error, context: any) {
  const incidents = monitoring.getComponents().incidents;
  
  // Register custom remediation rule
  incidents.registerRemediationRule({
    id: 'custom_error_handler',
    name: 'Custom Error Handler',
    description: 'Handle application-specific errors',
    condition: {
      alertPattern: {
        messagePattern: error.message,
      },
    },
    actions: [RemediationAction.RESTART_SERVICE, RemediationAction.CLEAR_CACHE],
    cooldown: 30,
    maxRetries: 2,
    enabled: true,
  });
}

/**
 * Example 14: Real-time monitoring data subscription
 */
export function subscribeToMonitoringEvents() {
  const components = monitoring.getComponents();
  
  // Subscribe to alert events
  components.alerts.getEmitter().on('alert', (alert) => {
    console.log('New alert: ', alert);
    // Handle alert (e.g., send to UI via WebSocket)
  });
  
  // Subscribe to health status changes
  components.health.getEmitter().on('status_changed', (event) => {
    console.log('Health status changed: ', event);
    // Handle health change
  });
  
  // Subscribe to incident events
  components.incidents.getEmitter().on('incident_created', (incident) => {
    console.log('Incident created: ', incident);
    // Handle incident creation
  });
  
  // Subscribe to dashboard data updates
  components.dashboards.getDataEmitter().on('widget_data_updated', (event) => {
    console.log('Widget data updated: ', event);
    // Push update to connected clients
  });
}

/**
 * Example 15: Export monitoring data
 */
export async function exportMonitoringData(dashboardId: string, format: 'json' | 'csv') {
  const dashboards = monitoring.getComponents().dashboards;
  
  const data = await dashboards.exportDashboardData(dashboardId, format);
  
  return data;
}

// Export all examples for use in application
export const MonitoringExamples = {
  getUserWithMonitoring,
  createCourseWithTracing,
  getCachedUserWithMonitoring,
  callOpenAIWithTracing,
  generateCourseContentWithTracing,
  recordUserEngagement,
  checkBusinessThreshold,
  performCustomHealthCheck,
  complexOperationWithTracing,
  getDashboardData,
  handleCriticalError,
  subscribeToMonitoringEvents,
  exportMonitoringData,
};