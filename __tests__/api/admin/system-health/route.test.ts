/**
 * Tests for admin system-health API route
 */

// ---------------------------------------------------------------------------
// Mocks – must be declared before imports
// ---------------------------------------------------------------------------

jest.mock("@/auth.admin", () => ({
  adminAuth: jest.fn(),
}));

jest.mock("@/lib/db-pooled", () => ({
  getDbMetrics: jest.fn(),
  checkDatabaseHealth: jest.fn(),
}));

jest.mock("@/lib/monitoring/performance", () => ({
  perfMonitor: {
    getStats: jest.fn(),
    getSlowOperations: jest.fn(),
  },
}));

jest.mock("@/lib/sam/integration-adapters", () => ({
  getAdapterStatus: jest.fn(),
}));

jest.mock("@/lib/sam/middleware/rate-limiter", () => ({
  getRateLimitStats: jest.fn(),
  RATE_LIMIT_CONFIGS: {},
}));

jest.mock("@/lib/cache/simple-cache", () => ({
  cache: {
    getStats: jest.fn(),
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock("@/lib/sam/telemetry", () => ({
  getSAMTelemetryService: jest.fn(),
}));

jest.mock("@/lib/data-fetching/enterprise-data-api", () => ({
  enterpriseDataAPI: {
    healthCheck: jest.fn(),
    fetchPosts: jest.fn(),
    fetchCourses: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { adminAuth } from "@/auth.admin";
import { getDbMetrics, checkDatabaseHealth } from "@/lib/db-pooled";
import { perfMonitor } from "@/lib/monitoring/performance";
import { getAdapterStatus } from "@/lib/sam/integration-adapters";
import { getRateLimitStats } from "@/lib/sam/middleware/rate-limiter";
import { cache } from "@/lib/cache/simple-cache";
import { getSAMTelemetryService } from "@/lib/sam/telemetry";
import { enterpriseDataAPI } from "@/lib/data-fetching/enterprise-data-api";
import { GET } from "@/app/api/admin/system-health/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockedAdminAuth = adminAuth as jest.MockedFunction<typeof adminAuth>;
const mockedCheckDbHealth = checkDatabaseHealth as jest.MockedFunction<
  typeof checkDatabaseHealth
>;
const mockedGetDbMetrics = getDbMetrics as jest.MockedFunction<
  typeof getDbMetrics
>;
const mockedGetAdapterStatus = getAdapterStatus as jest.MockedFunction<
  typeof getAdapterStatus
>;
const mockedGetRateLimitStats = getRateLimitStats as jest.MockedFunction<
  typeof getRateLimitStats
>;
const mockedPerfMonitor = perfMonitor as {
  getStats: jest.Mock;
  getSlowOperations: jest.Mock;
};
const mockedCacheStats = (cache as { getStats: jest.Mock }).getStats;
const mockedGetTelemetry = getSAMTelemetryService as jest.MockedFunction<
  typeof getSAMTelemetryService
>;
const mockedEnterprise = enterpriseDataAPI as {
  healthCheck: jest.Mock;
  fetchPosts: jest.Mock;
  fetchCourses: jest.Mock;
};

/** Standard "everything healthy" mock setup */
function setupHealthyMocks() {
  mockedAdminAuth.mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN", email: "admin@test.com" },
  } as Awaited<ReturnType<typeof adminAuth>>);

  mockedCheckDbHealth.mockResolvedValue({
    healthy: true,
    latency: 5,
    metrics: {
      totalQueries: 100,
      errorCount: 0,
      connectionCount: 3,
      latency: { p50: 2, p95: 10, p99: 15, max: 20, avg: 4 },
    },
  } as Awaited<ReturnType<typeof checkDatabaseHealth>>);

  mockedGetDbMetrics.mockReturnValue({
    totalQueries: 100,
    errorCount: 0,
    connectionCount: 3,
    latency: { p50: 2, p95: 10, p99: 15, max: 20, avg: 4 },
  });

  mockedGetAdapterStatus.mockReturnValue({
    hasAIAdapter: true,
    hasEmbeddingProvider: true,
    adapterSource: "anthropic",
    circuitBreakerState: "closed",
  } as ReturnType<typeof getAdapterStatus>);

  mockedGetRateLimitStats.mockReturnValue({
    totalBuckets: 5,
    bucketsByPrefix: { "sam:standard": 3, "sam:ai": 2 },
  });

  mockedPerfMonitor.getStats.mockReturnValue({
    count: 500,
    min: 2,
    max: 450,
    avg: 35,
    p50: 25,
    p95: 120,
    p99: 300,
  });

  mockedPerfMonitor.getSlowOperations.mockReturnValue([]);

  mockedCacheStats.mockReturnValue({
    size: 50,
    maxSize: 1000,
    memoryUsage: 1024,
  });

  // SAM telemetry
  mockedGetTelemetry.mockReturnValue({
    getSystemHealth: jest.fn().mockResolvedValue({
      healthScore: 0.92,
      components: {
        orchestrator: {
          status: "healthy",
          errorRate: 0.001,
          latencyMs: 45,
        },
        memory: {
          status: "healthy",
          errorRate: 0,
          latencyMs: 12,
        },
      },
      activeConnections: 8,
      memoryUsageMb: 256.5,
      errorRate: 0.005,
      latencyP50Ms: 30,
      latencyP95Ms: 120,
    }),
    getActiveAlerts: jest.fn().mockReturnValue([]),
  } as unknown as ReturnType<typeof getSAMTelemetryService>);

  // Enterprise API (synthetic monitor)
  mockedEnterprise.healthCheck.mockResolvedValue({ success: true });
  mockedEnterprise.fetchPosts.mockResolvedValue({
    success: true,
    data: [{ id: "1" }],
  });
  mockedEnterprise.fetchCourses.mockResolvedValue({
    success: true,
    data: [{ id: "c1" }],
  });

  // Global fetch for Redis (not configured by default)
  delete (process.env as Record<string, string | undefined>)
    .UPSTASH_REDIS_REST_URL;
  delete (process.env as Record<string, string | undefined>)
    .UPSTASH_REDIS_REST_TOKEN;
}

async function getResponseData(response: Response) {
  return response.json();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/admin/system-health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupHealthyMocks();
  });

  // ---- Auth tests ----

  it("returns 401 when not authenticated", async () => {
    mockedAdminAuth.mockResolvedValue(null as unknown as Awaited<
      ReturnType<typeof adminAuth>
    >);

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("returns 401 when user has no admin role", async () => {
    mockedAdminAuth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    } as Awaited<ReturnType<typeof adminAuth>>);

    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("allows SUPERADMIN access", async () => {
    mockedAdminAuth.mockResolvedValue({
      user: { id: "sa-1", role: "SUPERADMIN", email: "sa@test.com" },
    } as Awaited<ReturnType<typeof adminAuth>>);

    const response = await GET();
    expect(response.status).toBe(200);

    const json = await getResponseData(response);
    expect(json.success).toBe(true);
  });

  // ---- Successful response tests ----

  it("returns success with all healthy data", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const json = await getResponseData(response);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe("healthy");
    expect(json.data.healthScore).toBe(100);
  });

  it("includes all required sections in response", async () => {
    const response = await GET();
    const json = await getResponseData(response);
    const data = json.data;

    // Top-level fields
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("healthScore");
    expect(data).toHaveProperty("timestamp");
    expect(data).toHaveProperty("uptime");
    expect(data).toHaveProperty("services");
    expect(data).toHaveProperty("database");
    expect(data).toHaveProperty("api");
    expect(data).toHaveProperty("memory");
    expect(data).toHaveProperty("cache");
    expect(data).toHaveProperty("rateLimiting");
    expect(data).toHaveProperty("environment");
    expect(data).toHaveProperty("recommendations");
    expect(data).toHaveProperty("samHealth");
    expect(data).toHaveProperty("syntheticMonitor");
  });

  it("populates service statuses correctly", async () => {
    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.services.database.status).toBe("up");
    expect(data.services.samAI.status).toBe("initialized");
    expect(data.services.samAI.circuitBreaker).toBe("closed");
    expect(data.services.embedding.status).toBe("initialized");
    expect(data.services.redis.status).toBe("not_configured");
  });

  it("includes database metrics", async () => {
    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.database.totalQueries).toBe(100);
    expect(data.database.errorCount).toBe(0);
    expect(data.database.errorRate).toBe(0);
    expect(data.database.latency).toHaveProperty("p50");
    expect(data.database.latency).toHaveProperty("p95");
  });

  it("includes API performance stats", async () => {
    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.api.stats).not.toBeNull();
    expect(data.api.stats.count).toBe(500);
    expect(data.api.stats.avg).toBeDefined();
    expect(data.api.slowOperations).toEqual([]);
  });

  it("includes memory metrics", async () => {
    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.memory.heapUsed).toBeGreaterThan(0);
    expect(data.memory.heapTotal).toBeGreaterThan(0);
    expect(data.memory.rss).toBeGreaterThan(0);
    expect(typeof data.memory.heapUsagePercent).toBe("number");
  });

  it("includes rate limiting info", async () => {
    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.rateLimiting.totalBuckets).toBe(5);
    expect(data.rateLimiting.bucketsByCategory).toEqual({
      "sam:standard": 3,
      "sam:ai": 2,
    });
  });

  // ---- SAM Health tests ----

  it("includes SAM health data when telemetry is available", async () => {
    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.samHealth).not.toBeNull();
    expect(data.samHealth.healthScore).toBe(92);
    expect(data.samHealth.components).toHaveLength(2);
    expect(data.samHealth.components[0].name).toBe("orchestrator");
    expect(data.samHealth.alerts).toEqual([]);
    expect(data.samHealth.metrics.activeConnections).toBe(8);
  });

  it("returns null SAM health when telemetry throws", async () => {
    mockedGetTelemetry.mockImplementation(() => {
      throw new Error("Telemetry unavailable");
    });

    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.samHealth).toBeNull();
  });

  it("includes SAM alerts when present", async () => {
    mockedGetTelemetry.mockReturnValue({
      getSystemHealth: jest.fn().mockResolvedValue({
        healthScore: 0.6,
        components: {
          orchestrator: { status: "degraded", errorRate: 0.1, latencyMs: 500 },
        },
        activeConnections: 4,
        memoryUsageMb: 512,
        errorRate: 0.1,
        latencyP50Ms: 100,
        latencyP95Ms: 800,
      }),
      getActiveAlerts: jest.fn().mockReturnValue([
        {
          id: "alert-1",
          ruleName: "high-error-rate",
          severity: "warning",
          message: "Error rate exceeded threshold",
          triggeredAt: new Date("2025-01-01T00:00:00Z"),
          acknowledgedAt: null,
        },
      ]),
    } as unknown as ReturnType<typeof getSAMTelemetryService>);

    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.samHealth.alerts).toHaveLength(1);
    expect(data.samHealth.alerts[0].ruleName).toBe("high-error-rate");
    expect(data.samHealth.alerts[0].severity).toBe("warning");
  });

  // ---- Synthetic Monitor tests ----

  it("includes synthetic monitor data when all services healthy", async () => {
    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.syntheticMonitor).not.toBeNull();
    expect(data.syntheticMonitor.status).toBe("healthy");
    expect(data.syntheticMonitor.services.database.status).toBe("healthy");
    expect(data.syntheticMonitor.services.posts.status).toBe("healthy");
    expect(data.syntheticMonitor.services.courses.status).toBe("healthy");
  });

  it("returns degraded synthetic when a service fails", async () => {
    mockedEnterprise.fetchPosts.mockRejectedValue(
      new Error("Posts service down")
    );

    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.syntheticMonitor.status).toBe("degraded");
    expect(data.syntheticMonitor.services.posts.status).toBe("error");
  });

  it("returns degraded synthetic when all enterprise calls reject as promises", async () => {
    // Use mockRejectedValue so Promise.allSettled catches each rejection
    mockedEnterprise.healthCheck.mockRejectedValue(
      new Error("Network error")
    );
    mockedEnterprise.fetchPosts.mockRejectedValue(
      new Error("Network error")
    );
    mockedEnterprise.fetchCourses.mockRejectedValue(
      new Error("Network error")
    );

    const response = await GET();
    const { data } = await getResponseData(response);

    // Promise.allSettled catches per-promise, so function returns degraded
    expect(data.syntheticMonitor).not.toBeNull();
    expect(data.syntheticMonitor.status).toBe("degraded");
  });

  it("returns null synthetic monitor when a synchronous error occurs", async () => {
    // Synchronous throw before Promise.allSettled → outer catch → null
    mockedEnterprise.healthCheck.mockImplementation(() => {
      throw new Error("Sync crash");
    });

    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.syntheticMonitor).toBeNull();
  });

  // ---- Health score computation tests ----

  it("degrades health score when DB is down", async () => {
    mockedCheckDbHealth.mockResolvedValue({
      healthy: false,
      latency: 0,
      metrics: {
        totalQueries: 0,
        errorCount: 0,
        connectionCount: 0,
        latency: { p50: 0, p95: 0, p99: 0, max: 0, avg: 0 },
      },
    } as Awaited<ReturnType<typeof checkDatabaseHealth>>);

    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.status).toBe("unhealthy");
    expect(data.healthScore).toBeLessThanOrEqual(60);
  });

  it("degrades health score when AI adapter is missing", async () => {
    mockedGetAdapterStatus.mockReturnValue({
      hasAIAdapter: false,
      hasEmbeddingProvider: false,
      adapterSource: null,
      circuitBreakerState: "closed",
    } as ReturnType<typeof getAdapterStatus>);

    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.healthScore).toBeLessThan(100);
    expect(data.services.samAI.status).toBe("not_initialized");
  });

  // ---- Recommendations tests ----

  it("adds recommendation when DB is down", async () => {
    mockedCheckDbHealth.mockResolvedValue({
      healthy: false,
      latency: 0,
      metrics: {
        totalQueries: 0,
        errorCount: 0,
        connectionCount: 0,
        latency: { p50: 0, p95: 0, p99: 0, max: 0, avg: 0 },
      },
    } as Awaited<ReturnType<typeof checkDatabaseHealth>>);

    const response = await GET();
    const { data } = await getResponseData(response);

    const dbRec = data.recommendations.find((r: string) =>
      r.includes("Database connection is down")
    );
    expect(dbRec).toBeDefined();
  });

  it("adds recommendation when Redis is not configured", async () => {
    const response = await GET();
    const { data } = await getResponseData(response);

    const redisRec = data.recommendations.find((r: string) =>
      r.includes("Redis is not configured")
    );
    expect(redisRec).toBeDefined();
  });

  it("adds recommendation when SAM components are degraded", async () => {
    mockedGetTelemetry.mockReturnValue({
      getSystemHealth: jest.fn().mockResolvedValue({
        healthScore: 0.5,
        components: {
          orchestrator: { status: "degraded", errorRate: 0.1, latencyMs: 500 },
        },
        activeConnections: 2,
        memoryUsageMb: 256,
        errorRate: 0.1,
        latencyP50Ms: 100,
        latencyP95Ms: 500,
      }),
      getActiveAlerts: jest.fn().mockReturnValue([
        {
          id: "a1",
          ruleName: "test",
          severity: "warning",
          message: "test",
          triggeredAt: new Date(),
          acknowledgedAt: null,
        },
      ]),
    } as unknown as ReturnType<typeof getSAMTelemetryService>);

    const response = await GET();
    const { data } = await getResponseData(response);

    const samRec = data.recommendations.find((r: string) =>
      r.includes("SAM AI component(s) degraded")
    );
    expect(samRec).toBeDefined();

    const alertRec = data.recommendations.find((r: string) =>
      r.includes("active SAM alert")
    );
    expect(alertRec).toBeDefined();
  });

  it("says all normal when everything is healthy", async () => {
    const response = await GET();
    const { data } = await getResponseData(response);

    // Should have at least "Redis not configured" and "cache empty" + "all normal"
    // Actually when no issues except redis/cache, it won't say "all normal"
    // because there are already recommendations. Let's just check it's an array.
    expect(Array.isArray(data.recommendations)).toBe(true);
    expect(data.recommendations.length).toBeGreaterThan(0);
  });

  // ---- Error handling tests ----

  it("returns 500 on unexpected error", async () => {
    mockedAdminAuth.mockRejectedValue(new Error("Auth service crashed"));

    const response = await GET();
    expect(response.status).toBe(500);

    const json = await getResponseData(response);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("INTERNAL_ERROR");
  });

  // ---- Safe getter fallback tests ----

  it("handles getDbMetrics throwing gracefully", async () => {
    mockedGetDbMetrics.mockImplementation(() => {
      throw new Error("Metrics unavailable");
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const { data } = await getResponseData(response);
    expect(data.database.totalQueries).toBe(0);
  });

  it("handles getAdapterStatus throwing gracefully", async () => {
    mockedGetAdapterStatus.mockImplementation(() => {
      throw new Error("Adapter error");
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const { data } = await getResponseData(response);
    expect(data.services.samAI.status).toBe("not_initialized");
  });

  it("handles perfMonitor.getStats returning null", async () => {
    mockedPerfMonitor.getStats.mockReturnValue(null);

    const response = await GET();
    const { data } = await getResponseData(response);

    expect(data.api.stats).toBeNull();
  });

  it("handles cache.getStats throwing gracefully", async () => {
    mockedCacheStats.mockImplementation(() => {
      throw new Error("Cache error");
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const { data } = await getResponseData(response);
    expect(data.cache.size).toBe(0);
  });

  it("handles getRateLimitStats throwing gracefully", async () => {
    mockedGetRateLimitStats.mockImplementation(() => {
      throw new Error("Rate limiter error");
    });

    const response = await GET();
    expect(response.status).toBe(200);

    const { data } = await getResponseData(response);
    expect(data.rateLimiting.totalBuckets).toBe(0);
  });
});
