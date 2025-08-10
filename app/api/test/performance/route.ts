import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCourses } from "@/actions/get-courses";
import { getDashboardCourses } from "@/actions/get-dashboard-courses";
import { QueryPerformanceMonitor } from "@/lib/database/query-optimizer";
import { ServerActionCache } from "@/lib/redis/server-action-cache";
import { redis } from "@/lib/redis/config";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const testType = url.searchParams.get('type') || 'all';

    const results: any = {};

    // Test course listing performance
    if (testType === 'all' || testType === 'courses') {
      const endCourseTimer = QueryPerformanceMonitor.startQuery('get-courses-optimized');
      const startTime = Date.now();
      
      const courses = await getCourses({
        userId: session.user.id,
        title: "",
        categoryId: undefined
      });
      
      const endTime = Date.now();
      endCourseTimer();

      results.coursesTest = {
        duration: endTime - startTime,
        courseCount: courses.length,
        hasProgress: courses.some(c => c.progress !== null),
        performanceRating: endTime - startTime < 500 ? 'Good' : endTime - startTime < 1000 ? 'Fair' : 'Poor'
      };
    }

    // Test dashboard performance
    if (testType === 'all' || testType === 'dashboard') {
      const endDashboardTimer = QueryPerformanceMonitor.startQuery('get-dashboard-courses-optimized');
      const startTime = Date.now();
      
      const dashboardCourses = await getDashboardCourses(session.user.id);
      
      const endTime = Date.now();
      endDashboardTimer();

      results.dashboardTest = {
        duration: endTime - startTime,
        completedCourses: dashboardCourses.completedCourses.length,
        inProgressCourses: dashboardCourses.coursesInProgress.length,
        performanceRating: endTime - startTime < 300 ? 'Good' : endTime - startTime < 600 ? 'Fair' : 'Poor'
      };
    }

    // Test cache performance
    if (testType === 'all' || testType === 'cache') {
      const cacheTest = await testCachePerformance(session.user.id);
      results.cacheTest = cacheTest;
    }

    // Get overall query statistics
    const queryStats = QueryPerformanceMonitor.getAllQueryStats();
    
    results.queryStats = queryStats.slice(0, 10); // Top 10 queries
    results.cacheStats = await ServerActionCache.getCacheStats();
    results.summary = {
      totalTests: Object.keys(results).length - 3,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(results)
    };

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    logger.error("Performance test API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function testCachePerformance(userId: string) {
  const testData = [];
  
  try {
    // Test 1: Cache miss (first call)
    const startMiss = Date.now();
    const missResult = await ServerActionCache.getCourseList(
      userId,
      { test: 'cache-performance-test' },
      async () => {
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, 100));
        return { mockData: 'test', timestamp: Date.now() };
      }
    );
    const missDuration = Date.now() - startMiss;
    
    testData.push({
      test: 'Cache Miss (First Call)',
      duration: missDuration,
      fromCache: missResult.fromCache,
      rating: missDuration < 200 ? 'Good' : 'Fair'
    });

    // Test 2: Cache hit (second call)
    const startHit = Date.now();
    const hitResult = await ServerActionCache.getCourseList(
      userId,
      { test: 'cache-performance-test' },
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { mockData: 'test', timestamp: Date.now() };
      }
    );
    const hitDuration = Date.now() - startHit;
    
    testData.push({
      test: 'Cache Hit (Second Call)',
      duration: hitDuration,
      fromCache: hitResult.fromCache,
      rating: hitDuration < 50 ? 'Excellent' : hitDuration < 100 ? 'Good' : 'Fair'
    });

    // Test 3: Cache health
    const cacheHealthy = redis ? await redis.ping() : 'No Redis';
    
    return {
      tests: testData,
      cacheHealthy: cacheHealthy === 'PONG' || cacheHealthy === 'PONG',
      speedImprovement: missDuration > 0 ? ((missDuration - hitDuration) / missDuration * 100).toFixed(1) + '%' : '0%',
      recommendation: hitResult.fromCache 
        ? 'Cache is working properly!' 
        : 'Cache may not be functioning - check Redis connection'
    };
  } catch (error) {
    return {
      tests: testData,
      error: error instanceof Error ? error.message : 'Unknown error',
      cacheHealthy: false,
      recommendation: 'Check cache configuration and Redis connection'
    };
  }
}

function generateRecommendations(results: any): string[] {
  const recommendations = [];

  if (results.coursesTest?.duration > 1000) {
    recommendations.push("Course listing is slow - consider implementing pagination or caching");
  }

  if (results.dashboardTest?.duration > 600) {
    recommendations.push("Dashboard loading is slow - optimize progress calculations");
  }

  if (results.queryStats?.some((stat: any) => stat?.averageTime > 500)) {
    recommendations.push("Some queries are slow - review and optimize database indexes");
  }

  if (results.cacheTest && !results.cacheTest.cacheHealthy) {
    recommendations.push("Redis cache is not working - check connection and configuration");
  }

  if (results.cacheTest?.tests?.some((test: any) => test.rating === 'Fair')) {
    recommendations.push("Cache performance could be improved - check Redis latency");
  }

  if (recommendations.length === 0) {
    recommendations.push("Performance looks good! Continue monitoring for optimization opportunities");
  }

  return recommendations;
}