import { NextResponse } from 'next/server';
import { enterpriseDataAPI } from '@/lib/data-fetching/enterprise-data-api';
import { logger } from '@/lib/logger';
import { withAdminAuth } from '@/lib/api/with-api-auth';
import { safeErrorResponse } from '@/lib/api/safe-error';

export const GET = withAdminAuth(async (request, context) => {
  try {
    const startTime = Date.now();
    
    // Test all major data fetching operations
    const [healthResult, postsResult, coursesResult] = await Promise.allSettled([
      enterpriseDataAPI.healthCheck(),
      enterpriseDataAPI.fetchPosts({ published: true }, { page: 1, pageSize: 5 }),
      enterpriseDataAPI.fetchCourses({ isPublished: true }, { page: 1, pageSize: 5 })
    ]);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Analyze results
    const health = healthResult.status === 'fulfilled' && healthResult.value.success;
    const postsWorking = postsResult.status === 'fulfilled' && postsResult.value.success;
    const coursesWorking = coursesResult.status === 'fulfilled' && coursesResult.value.success;
    
    const postsCount = postsWorking ? postsResult.value.data?.length || 0 : 0;
    const coursesCount = coursesWorking ? coursesResult.value.data?.length || 0 : 0;
    
    // Calculate overall system health
    const systemHealth = health && postsWorking && coursesWorking ? 'healthy' : 'degraded';
    
    const report = {
      system: {
        status: systemHealth,
        responseTime: `${totalTime}ms`,
        timestamp: new Date().toISOString()
      },
      services: {
        database: {
          status: health ? 'healthy' : 'error',
          error: healthResult.status === 'rejected' ? healthResult.reason?.message : null
        },
        posts: {
          status: postsWorking ? 'healthy' : 'error',
          count: postsCount,
          error: postsResult.status === 'rejected' ? postsResult.reason?.message : 
                 (!postsWorking && postsResult.status === 'fulfilled') ? postsResult.value.error?.message : null
        },
        courses: {
          status: coursesWorking ? 'healthy' : 'error',
          count: coursesCount,
          error: coursesResult.status === 'rejected' ? coursesResult.reason?.message :
                 (!coursesWorking && coursesResult.status === 'fulfilled') ? coursesResult.value.error?.message : null
        }
      },
      performance: {
        totalResponseTime: `${totalTime}ms`,
        averageResponseTime: `${Math.round(totalTime / 3)}ms`,
        threshold: '500ms',
        status: totalTime < 500 ? 'good' : totalTime < 1000 ? 'warning' : 'poor'
      }
    };
    
    // Return appropriate status code
    const statusCode = systemHealth === 'healthy' ? 200 : 503;
    
    return NextResponse.json(report, { status: statusCode });
    
  } catch (error) {
    logger.error('[MONITOR] Error:', error);
    
    return safeErrorResponse(error, 500, 'MONITOR');
  }
}, { rateLimit: { requests: 20, window: 60000 }, auditLog: true });