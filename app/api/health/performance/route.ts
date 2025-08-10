import { NextResponse } from "next/server";
import { perfMonitor } from "@/lib/monitoring/performance";
import { cache } from "@/lib/cache/simple-cache";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    const dbStartTime = Date.now();
    const userCount = await db.user.count();
    const dbResponseTime = Date.now() - dbStartTime;
    
    // Get performance stats
    const apiStats = perfMonitor.getStats();
    const slowOps = perfMonitor.getSlowOperations();
    const cacheStats = cache.getStats();
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    // Health score calculation
    const avgResponseTime = apiStats?.avg || 0;
    const healthScore = calculateHealthScore(avgResponseTime, dbResponseTime);
    
    return NextResponse.json({
      status: healthScore > 80 ? 'healthy' : healthScore > 50 ? 'degraded' : 'unhealthy',
      healthScore,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      metrics: {
        database: {
          responseTime: `${dbResponseTime}ms`,
          userCount,
          status: dbResponseTime < 100 ? 'healthy' : 'slow',
        },
        api: {
          stats: apiStats,
          slowOperations: slowOps,
        },
        cache: {
          ...cacheStats,
          hitRate: 'N/A', // Would need to track hits/misses
        },
        memory: {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        },
      },
      recommendations: getRecommendations(avgResponseTime, dbResponseTime, cacheStats.size),
    });
  } catch (error) {
    console.error("[HEALTH_PERFORMANCE]", error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to get performance metrics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function calculateHealthScore(avgResponseTime: number, dbResponseTime: number): number {
  let score = 100;
  
  // Deduct points for slow response times
  if (avgResponseTime > 1000) score -= 30;
  else if (avgResponseTime > 500) score -= 15;
  else if (avgResponseTime > 200) score -= 5;
  
  // Deduct points for slow database
  if (dbResponseTime > 200) score -= 20;
  else if (dbResponseTime > 100) score -= 10;
  else if (dbResponseTime > 50) score -= 5;
  
  return Math.max(0, score);
}

function getRecommendations(
  avgResponseTime: number,
  dbResponseTime: number,
  cacheSize: number
): string[] {
  const recommendations = [];
  
  if (avgResponseTime > 500) {
    recommendations.push("⚠️ API response time is high. Consider optimizing heavy queries.");
  }
  
  if (dbResponseTime > 100) {
    recommendations.push("⚠️ Database response is slow. Check connection pool and query optimization.");
  }
  
  if (cacheSize < 100) {
    recommendations.push("💡 Cache utilization is low. Consider caching more frequently accessed data.");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("✅ System is performing well!");
  }
  
  return recommendations;
}