import { NextResponse } from "next/server";
import { adminAuth } from "@/auth.admin";
import { AdminRole } from "@/types/admin-role";
import { getDbMetrics, checkDatabaseHealth } from "@/lib/db-pooled";
import { perfMonitor } from "@/lib/monitoring/performance";
import { getAdapterStatus, getSAMAdapterSystem } from "@/lib/sam/ai-provider";
import { getRateLimitStats, RATE_LIMIT_CONFIGS } from "@/lib/sam/middleware/rate-limiter";
import { cache } from "@/lib/cache/simple-cache";
import { logger } from "@/lib/logger";
import { getSAMTelemetryService } from "@/lib/sam/telemetry";
import { enterpriseDataAPI } from "@/lib/data-fetching/enterprise-data-api";
import v8 from "v8";

export const dynamic = "force-dynamic";

interface ServiceStatus {
  status: "up" | "down" | "not_configured";
  responseTime?: number;
  error?: string;
}

interface SystemHealthData {
  status: "healthy" | "degraded" | "unhealthy";
  healthScore: number;
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    samAI: {
      status: "initialized" | "not_initialized";
      circuitBreaker: string;
      adapterSource: string | null;
    };
    embedding: {
      status: "initialized" | "not_initialized";
    };
  };
  database: {
    totalQueries: number;
    errorCount: number;
    errorRate: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
      avg: number;
      max: number;
    };
  };
  api: {
    stats: {
      count: number;
      min: number;
      max: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    } | null;
    slowOperations: Array<{
      name: string;
      duration: number;
      timestamp: string;
    }>;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    heapUsagePercent: number;
  };
  cache: {
    size: number;
    maxSize: number;
  };
  rateLimiting: {
    totalBuckets: number;
    bucketsByCategory: Record<string, number>;
  };
  environment: {
    nodeEnv: string;
    platform: string;
    version: string;
  };
  samHealth: {
    healthScore: number;
    components: Array<{
      name: string;
      status: "healthy" | "degraded" | "unhealthy";
      errorRate: number;
      latencyMs: number;
    }>;
    alerts: Array<{
      id: string;
      ruleName: string;
      severity: string;
      message: string;
      triggeredAt: string;
      acknowledgedAt: string | null;
    }>;
    metrics: {
      activeConnections: number;
      memoryUsageMb: number;
      errorRate: number;
      latencyP50Ms: number;
      latencyP95Ms: number;
    };
  } | null;
  syntheticMonitor: {
    status: "healthy" | "degraded" | "error";
    totalResponseTime: number;
    services: {
      database: { status: string; error: string | null };
      posts: { status: string; count: number; error: string | null };
      courses: { status: string; count: number; error: string | null };
    };
    performance: {
      averageResponseTime: number;
      status: "good" | "warning" | "poor";
    };
  } | null;
  recommendations: string[];
}

export async function GET() {
  try {
    const session = await adminAuth();

    if (
      !session?.user ||
      (session.user.role !== AdminRole.ADMIN &&
        session.user.role !== AdminRole.SUPERADMIN)
    ) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Gather all metrics in parallel where possible
    const [dbHealth, dbMetrics, samStatus, rateLimitInfo, cacheStats, samHealthData, syntheticData] =
      await Promise.all([
        checkDatabaseHealth().catch(() => ({
          healthy: false,
          latency: 0,
          metrics: {
            totalQueries: 0,
            errorCount: 0,
            connectionCount: 0,
            latency: { p50: 0, p95: 0, p99: 0, max: 0, avg: 0 },
          },
        })),
        Promise.resolve(safeGetDbMetrics()),
        safeGetAdapterStatus(),
        Promise.resolve(safeGetRateLimitStats()),
        Promise.resolve(safeGetCacheStats()),
        safeGetSAMHealth(),
        safeRunSyntheticMonitor(),
      ]);

    // API performance stats
    const apiStats = safeGetApiStats();
    const slowOps = safeGetSlowOperations();

    // Memory usage
    const mem = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    const heapUsedMB = Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100;
    const heapTotalMB =
      Math.round((heapStats.heap_size_limit / 1024 / 1024) * 100) / 100;
    const rssMB = Math.round((mem.rss / 1024 / 1024) * 100) / 100;
    const heapUsagePercent =
      heapTotalMB > 0
        ? Math.round((heapUsedMB / heapTotalMB) * 10000) / 100
        : 0;

    // Redis check
    const redisStatus = await checkRedisHealth();

    // Compute error rate
    const errorRate =
      dbMetrics.totalQueries > 0
        ? Math.round(
            (dbMetrics.errorCount / dbMetrics.totalQueries) * 10000
          ) / 100
        : 0;

    // Determine overall status
    const overallStatus = computeOverallStatus(
      dbHealth.healthy,
      redisStatus.status,
      samStatus.circuitBreakerState,
      errorRate,
      heapUsagePercent
    );

    // Compute health score
    const healthScore = computeHealthScore(
      dbHealth.healthy,
      redisStatus.status,
      samStatus.hasAIAdapter,
      errorRate,
      heapUsagePercent,
      dbMetrics.latency.p95
    );

    // Generate recommendations
    const recommendations = generateRecommendations(
      dbHealth.healthy,
      redisStatus.status,
      samStatus,
      errorRate,
      heapUsagePercent,
      dbMetrics.latency.p95
    );

    // SAM health recommendations
    if (samHealthData) {
      const degradedComponents = samHealthData.components.filter(
        (c) => c.status !== "healthy"
      );
      if (degradedComponents.length > 0) {
        recommendations.push(
          `${degradedComponents.length} SAM AI component(s) degraded: ${degradedComponents.map((c) => c.name).join(", ")}. Check SAM Health tab.`
        );
      }
      if (samHealthData.alerts.length > 0) {
        recommendations.push(
          `${samHealthData.alerts.length} active SAM alert(s). Review the SAM Health tab for details.`
        );
      }
    }

    // Synthetic monitor recommendations
    if (syntheticData && syntheticData.status !== "healthy") {
      const failedServices = Object.entries(syntheticData.services)
        .filter(([, svc]) => svc.status !== "healthy")
        .map(([name]) => name);
      if (failedServices.length > 0) {
        recommendations.push(
          `Synthetic monitor issues in: ${failedServices.join(", ")}. Check the Synthetic Monitor tab.`
        );
      }
    }
    if (syntheticData?.performance.status === "poor") {
      recommendations.push(
        `Synthetic monitor response time is ${syntheticData.totalResponseTime}ms (poor). Investigate data path performance.`
      );
    }

    const data: SystemHealthData = {
      status: overallStatus,
      healthScore,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: dbHealth.healthy ? "up" : "down",
          responseTime: dbHealth.latency,
        },
        redis: redisStatus,
        samAI: {
          status: samStatus.hasAIAdapter ? "initialized" : "not_initialized",
          circuitBreaker: samStatus.circuitBreakerState,
          adapterSource: samStatus.adapterSource,
        },
        embedding: {
          status: samStatus.hasEmbeddingProvider
            ? "initialized"
            : "not_initialized",
        },
      },
      database: {
        totalQueries: dbMetrics.totalQueries,
        errorCount: dbMetrics.errorCount,
        errorRate,
        latency: {
          p50: Math.round(dbMetrics.latency.p50 * 100) / 100,
          p95: Math.round(dbMetrics.latency.p95 * 100) / 100,
          p99: Math.round(dbMetrics.latency.p99 * 100) / 100,
          avg: Math.round(dbMetrics.latency.avg * 100) / 100,
          max: Math.round(dbMetrics.latency.max * 100) / 100,
        },
      },
      api: {
        stats: apiStats,
        slowOperations: slowOps,
      },
      memory: {
        heapUsed: heapUsedMB,
        heapTotal: heapTotalMB,
        rss: rssMB,
        heapUsagePercent,
      },
      cache: {
        size: cacheStats.size,
        maxSize: cacheStats.maxSize,
      },
      rateLimiting: {
        totalBuckets: rateLimitInfo.totalBuckets,
        bucketsByCategory: rateLimitInfo.bucketsByPrefix,
      },
      environment: {
        nodeEnv: process.env.NODE_ENV ?? "unknown",
        platform: process.platform,
        version: process.env.npm_package_version ?? "1.0.0",
      },
      samHealth: samHealthData,
      syntheticMonitor: syntheticData,
      recommendations,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error("[SYSTEM_HEALTH_API_ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch system health data",
        },
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Safe getters that never throw
// ---------------------------------------------------------------------------

function safeGetDbMetrics() {
  try {
    return getDbMetrics();
  } catch {
    return {
      totalQueries: 0,
      errorCount: 0,
      connectionCount: 0,
      latency: { p50: 0, p95: 0, p99: 0, max: 0, avg: 0 },
    };
  }
}

async function safeGetAdapterStatus() {
  try {
    // Eagerly initialize the adapter so the health check reflects real status
    await getSAMAdapterSystem();
    return getAdapterStatus();
  } catch {
    return {
      hasAIAdapter: false,
      hasEmbeddingProvider: false,
      adapterSource: null,
      circuitBreakerState: "unknown",
    };
  }
}

function safeGetRateLimitStats() {
  try {
    return getRateLimitStats();
  } catch {
    return { totalBuckets: 0, bucketsByPrefix: {} };
  }
}

function safeGetCacheStats() {
  try {
    return cache.getStats();
  } catch {
    return { size: 0, maxSize: 1000, memoryUsage: 0 };
  }
}

function safeGetApiStats(): SystemHealthData["api"]["stats"] {
  try {
    const stats = perfMonitor.getStats();
    if (!stats) return null;
    return {
      count: stats.count ?? 0,
      min: Math.round((stats.min ?? 0) * 100) / 100,
      max: Math.round((stats.max ?? 0) * 100) / 100,
      avg: Math.round((stats.avg ?? 0) * 100) / 100,
      p50: Math.round((stats.p50 ?? 0) * 100) / 100,
      p95: Math.round((stats.p95 ?? 0) * 100) / 100,
      p99: Math.round((stats.p99 ?? 0) * 100) / 100,
    };
  } catch {
    return null;
  }
}

function safeGetSlowOperations(): SystemHealthData["api"]["slowOperations"] {
  try {
    return perfMonitor.getSlowOperations(500).map((op) => ({
      name: op.name,
      duration: Math.round(op.duration),
      timestamp: op.timestamp.toISOString(),
    }));
  } catch {
    return [];
  }
}

async function safeGetSAMHealth(): Promise<SystemHealthData["samHealth"]> {
  try {
    const telemetry = getSAMTelemetryService();
    const [health, alerts] = await Promise.all([
      telemetry.getSystemHealth(),
      Promise.resolve(telemetry.getActiveAlerts()),
    ]);

	    const components = Object.entries(health.components).map(
	      ([name, comp]) => ({
	        name,
	        status: (comp.status ?? "unhealthy") as "healthy" | "degraded" | "unhealthy",
	        errorRate: Math.round((((comp as { errorRate?: number }).errorRate ?? 0) * 10000)) / 100,
	        latencyMs: Math.round(comp.latencyMs ?? 0),
	      })
	    );

    return {
      healthScore: Math.round(health.healthScore * 100),
      components,
      alerts: alerts.map((a) => ({
        id: a.id,
        ruleName: a.ruleName,
        severity: String(a.severity),
        message: a.message,
        triggeredAt:
          a.triggeredAt instanceof Date
            ? a.triggeredAt.toISOString()
            : String(a.triggeredAt),
        acknowledgedAt: a.acknowledgedAt
          ? a.acknowledgedAt instanceof Date
            ? a.acknowledgedAt.toISOString()
            : String(a.acknowledgedAt)
          : null,
      })),
      metrics: {
        activeConnections: health.activeConnections,
        memoryUsageMb: Math.round(health.memoryUsageMb * 100) / 100,
        errorRate: Math.round(health.errorRate * 10000) / 100,
        latencyP50Ms: Math.round(health.latencyP50Ms),
        latencyP95Ms: Math.round(health.latencyP95Ms),
      },
    };
  } catch {
    return null;
  }
}

async function safeRunSyntheticMonitor(): Promise<
  SystemHealthData["syntheticMonitor"]
> {
  try {
    const start = Date.now();
    const [healthResult, postsResult, coursesResult] =
      await Promise.allSettled([
        enterpriseDataAPI.healthCheck(),
        enterpriseDataAPI.fetchPosts(
          { published: true },
          { page: 1, pageSize: 1 }
        ),
        enterpriseDataAPI.fetchCourses(
          { isPublished: true },
          { page: 1, pageSize: 1 }
        ),
      ]);
    const totalTime = Date.now() - start;

    const dbOk =
      healthResult.status === "fulfilled" && healthResult.value.success;
    const postsOk =
      postsResult.status === "fulfilled" && postsResult.value.success;
    const coursesOk =
      coursesResult.status === "fulfilled" && coursesResult.value.success;

    const postsCount =
      postsOk && postsResult.status === "fulfilled"
        ? (postsResult.value.data?.length ?? 0)
        : 0;
    const coursesCount =
      coursesOk && coursesResult.status === "fulfilled"
        ? (coursesResult.value.data?.length ?? 0)
        : 0;

    const allOk = dbOk && postsOk && coursesOk;
    const avgTime = Math.round(totalTime / 3);

    return {
      status: allOk ? "healthy" : "degraded",
      totalResponseTime: totalTime,
      services: {
        database: {
          status: dbOk ? "healthy" : "error",
          error:
            healthResult.status === "rejected"
              ? (healthResult.reason?.message ?? "Failed")
              : null,
        },
        posts: {
          status: postsOk ? "healthy" : "error",
          count: postsCount,
          error:
            postsResult.status === "rejected"
              ? (postsResult.reason?.message ?? "Failed")
              : null,
        },
        courses: {
          status: coursesOk ? "healthy" : "error",
          count: coursesCount,
          error:
            coursesResult.status === "rejected"
              ? (coursesResult.reason?.message ?? "Failed")
              : null,
        },
      },
      performance: {
        averageResponseTime: avgTime,
        status:
          totalTime < 500 ? "good" : totalTime < 1000 ? "warning" : "poor",
      },
    };
  } catch {
    return null;
  }
}

async function checkRedisHealth(): Promise<ServiceStatus> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    return { status: "not_configured" };
  }

  try {
    const start = Date.now();
    const response = await fetch(`${redisUrl}/ping`, {
      headers: { Authorization: `Bearer ${redisToken}` },
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return { status: "up", responseTime: Date.now() - start };
    }
    return {
      status: "down",
      responseTime: Date.now() - start,
      error: `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      status: "down",
      error: "Connection failed",
    };
  }
}

// ---------------------------------------------------------------------------
// Status computation
// ---------------------------------------------------------------------------

function computeOverallStatus(
  dbHealthy: boolean,
  redisStatus: string,
  circuitBreakerState: string,
  errorRate: number,
  heapUsagePercent: number
): "healthy" | "degraded" | "unhealthy" {
  if (!dbHealthy) return "unhealthy";
  if (circuitBreakerState === "open") return "degraded";
  if (redisStatus === "down") return "degraded";
  if (errorRate > 5) return "degraded";
  if (heapUsagePercent > 90) return "degraded";
  return "healthy";
}

function computeHealthScore(
  dbHealthy: boolean,
  redisStatus: string,
  hasAIAdapter: boolean,
  errorRate: number,
  heapUsagePercent: number,
  p95Latency: number
): number {
  let score = 100;

  // Database (most critical)
  if (!dbHealthy) score -= 40;

  // Redis
  if (redisStatus === "down") score -= 10;

  // AI adapter
  if (!hasAIAdapter) score -= 10;

  // Error rate
  if (errorRate > 5) score -= 15;
  else if (errorRate > 1) score -= 5;

  // Memory pressure
  if (heapUsagePercent > 90) score -= 15;
  else if (heapUsagePercent > 75) score -= 5;

  // Latency
  if (p95Latency > 1000) score -= 10;
  else if (p95Latency > 500) score -= 5;

  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(
  dbHealthy: boolean,
  redisStatus: string,
  samStatus: ReturnType<typeof getAdapterStatus>,
  errorRate: number,
  heapUsagePercent: number,
  p95Latency: number
): string[] {
  const recommendations: string[] = [];

  if (!dbHealthy) {
    recommendations.push(
      "Database connection is down. Check DATABASE_URL configuration and PostgreSQL availability."
    );
  }

  if (redisStatus === "not_configured") {
    recommendations.push(
      "Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed caching."
    );
  } else if (redisStatus === "down") {
    recommendations.push(
      "Redis is unreachable. Verify Upstash credentials and network connectivity."
    );
  }

  if (!samStatus.hasAIAdapter) {
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
    if (hasAnthropicKey || hasOpenAIKey) {
      recommendations.push(
        "SAM AI adapter is not yet initialized (lazy-loaded on first request). API keys are configured. Make any SAM request to activate."
      );
    } else {
      recommendations.push(
        "SAM AI adapter is not initialized. Ensure AI provider API keys (ANTHROPIC_API_KEY or OPENAI_API_KEY) are configured."
      );
    }
  }

  if (samStatus.circuitBreakerState === "open") {
    recommendations.push(
      "SAM AI circuit breaker is open due to repeated failures. The adapter will auto-recover after the cooldown period."
    );
  }

  if (errorRate > 5) {
    recommendations.push(
      `Database error rate is ${errorRate}% (threshold: 5%). Investigate query failures and connection issues.`
    );
  } else if (errorRate > 1) {
    recommendations.push(
      `Database error rate is ${errorRate}%. Monitor for upward trends.`
    );
  }

  if (heapUsagePercent > 90) {
    recommendations.push(
      `Heap memory usage is at ${heapUsagePercent}%. Consider increasing server memory or investigating memory leaks.`
    );
  } else if (heapUsagePercent > 75) {
    recommendations.push(
      `Heap memory usage is ${heapUsagePercent}%. Approaching high usage threshold.`
    );
  }

  if (p95Latency > 1000) {
    recommendations.push(
      `P95 database latency is ${Math.round(p95Latency)}ms. Investigate slow queries and consider adding indexes.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("All systems are operating normally.");
  }

  return recommendations;
}
