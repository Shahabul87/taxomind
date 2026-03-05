import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDbMetrics } from '@/lib/db-pooled';
import { enterpriseDataAPI } from '@/lib/data-fetching/enterprise-data-api';
import { shouldUseRealNews, isProductionEnvironment } from '@/lib/config/news-config';
import { getAdapterStatus } from '@/lib/sam/ai-provider';
import { adminAuth } from '@/auth.admin';
import { logger } from '@/lib/logger';
import { stageHealthTracker } from '@/lib/sam/pipeline/stage-health-tracker';

interface HealthStatus {
  [key: string]: unknown;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    redis?: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
  };
  environment: {
    NODE_ENV: string | undefined;
    isProduction: boolean;
    platform: {
      isRailway: boolean;
      railwayEnvironment: string;
      railwayDomain: string;
      isVercel: boolean;
      vercelEnv: string;
    };
  };
  version: string;
  enterpriseAPI?: Record<string, unknown>;
  aiNews?: {
    mode: string;
    willFetchRealNews: boolean;
    isProduction: boolean;
  };
}

export async function GET(req: NextRequest) {
  try {
    const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: { status: 'down' },
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      isProduction: isProductionEnvironment(),
      platform: {
        isRailway: !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID),
        railwayEnvironment: process.env.RAILWAY_ENVIRONMENT || 'not-set',
        railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN || 'not-set',
        isVercel: !!process.env.VERCEL_ENV,
        vercelEnv: process.env.VERCEL_ENV || 'not-set'
      }
    },
    version: process.env.npm_package_version || '1.0.0',
  };

  // Check database connection with Prisma (public - basic up/down)
  try {
    const dbStartTime = Date.now();
    await db.$queryRaw`SELECT 1`;
    health.services.database = {
      status: 'up',
      responseTime: Date.now() - dbStartTime,
    };
  } catch (error) {
    health.status = 'unhealthy';
    health.services.database = {
      status: 'down',
      error: 'Database connection failed',
    };
  }

  // --- Admin-only detailed health information ---
  // Gate sensitive operational details behind admin authentication
  let isAdmin = false;
  try {
    const adminSession = await adminAuth();
    isAdmin = !!adminSession?.user;
  } catch {
    // Admin auth not available - continue with public-only response
  }

  if (isAdmin) {
    // AI news config
    health.aiNews = {
      mode: shouldUseRealNews() ? 'real' : 'demo',
      willFetchRealNews: shouldUseRealNews(),
      isProduction: isProductionEnvironment()
    };

    // Additional health check using enterprise API
    try {
      const healthResult = await enterpriseDataAPI.healthCheck();
      if (healthResult.success) {
        health.enterpriseAPI = healthResult.data;
      }
    } catch (dbError) {
      logger.error('[HEALTH_CHECK] Enterprise API error:', dbError);
    }

    // SAM AI adapter status
    try {
      const samStatus = getAdapterStatus();
      (health as Record<string, unknown>).sam = {
        aiAdapter: samStatus.hasAIAdapter ? 'initialized' : 'not_initialized',
        embeddingProvider: samStatus.hasEmbeddingProvider ? 'initialized' : 'not_initialized',
        adapterSource: samStatus.adapterSource,
        circuitBreaker: samStatus.circuitBreakerState,
      };
    } catch (error) {
      logger.debug('[HEALTH_CHECK] SAM status unavailable:', error);
    }

    // AI Provider configuration status
    try {
      const { getAllProviders, getDefaultProvider } = await import('@/lib/sam/providers/ai-registry');
      const providers = getAllProviders();
      const defaultProvider = getDefaultProvider();
      (health as Record<string, unknown>).aiProviders = {
        configured: providers.filter(p => p.isConfigured()).map(p => p.id),
        unconfigured: providers.filter(p => !p.isConfigured()).map(p => p.id),
        default: defaultProvider?.id ?? 'none',
        envKeys: {
          DEEPSEEK_API_KEY: !!process.env.DEEPSEEK_API_KEY,
          ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
          OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
          GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
          MISTRAL_API_KEY: !!process.env.MISTRAL_API_KEY,
        },
      };
    } catch (error) {
      logger.debug('[HEALTH_CHECK] AI provider status unavailable:', error);
    }

    // Notification channel capabilities
    try {
      const { getNotificationCapabilities } = await import('@/lib/sam/agentic-notifications');
      const caps = getNotificationCapabilities();
      (health as Record<string, unknown>).notifications = {
        in_app: 'available',
        email: caps.email.enabled ? 'available' : caps.email.reason,
        push: caps.push.enabled ? 'available' : caps.push.reason,
        sms: caps.sms.enabled ? 'available' : caps.sms.reason,
      };
    } catch (error) {
      logger.debug('[HEALTH_CHECK] Notification capabilities unavailable:', error);
    }

    // Database pool metrics
    try {
      const dbPoolMetrics = getDbMetrics();
      (health as Record<string, unknown>).dbPool = {
        totalQueries: dbPoolMetrics.totalQueries,
        errorCount: dbPoolMetrics.errorCount,
        latency: {
          p50: `${Math.round(dbPoolMetrics.latency.p50)}ms`,
          p95: `${Math.round(dbPoolMetrics.latency.p95)}ms`,
          p99: `${Math.round(dbPoolMetrics.latency.p99)}ms`,
          avg: `${Math.round(dbPoolMetrics.latency.avg)}ms`,
        },
      };
    } catch (error) {
      logger.debug('[HEALTH_CHECK] DB pool metrics unavailable:', error);
    }

    // Check Redis connection if configured
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const redisStartTime = Date.now();
        const response = await fetch(
          `${process.env.UPSTASH_REDIS_REST_URL}/ping`,
          {
            headers: {
              Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
            },
          }
        );

        if (response.ok) {
          health.services.redis = {
            status: 'up',
            responseTime: Date.now() - redisStartTime,
          };
        } else {
          health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
          health.services.redis = {
            status: 'down',
            error: `HTTP ${response.status}`,
          };
        }
      } catch (error) {
        health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
        health.services.redis = {
          status: 'down',
          error: 'Redis connection failed',
        };
      }
    }

    // Rate limiter store info
    try {
      const { getRateLimitStoreInfo, getRateLimitStats } = await import('@/lib/sam/middleware/rate-limiter');
      const storeInfo = getRateLimitStoreInfo();
      const stats = getRateLimitStats();
      (health as Record<string, unknown>).rateLimiter = {
        storeType: storeInfo.type,
        isDistributed: storeInfo.isDistributed,
        totalBuckets: stats.totalBuckets,
        bucketsByPrefix: stats.bucketsByPrefix,
      };
      if (!storeInfo.isDistributed && process.env.NODE_ENV === 'production') {
        (health as Record<string, unknown>).rateLimiterWarning =
          'Non-distributed store in production — fail-closed categories (ai, tools, heavy) will be rejected';
        if (health.status === 'healthy') {
          health.status = 'degraded';
        }
      }
    } catch (error) {
      logger.debug('[HEALTH_CHECK] Rate limiter info unavailable:', error);
    }

    // SAM Pipeline Health
    try {
      const pipelineHealth = stageHealthTracker.getHealth();
      (health as Record<string, unknown>).samPipeline = {
        overallHealth: pipelineHealth.overallHealth,
        totalRequests: pipelineHealth.totalRequests,
        stages: Object.fromEntries(
          Object.entries(pipelineHealth.stages).map(([name, stage]) => [
            name,
            {
              successRate: Math.round(stage.successRate * 100) / 100,
              avgDurationMs: stage.avgDurationMs,
              totalRuns: stage.totalRuns,
              failureCount: stage.failureCount,
              timeoutCount: stage.timeoutCount,
            },
          ])
        ),
      };
      if (pipelineHealth.overallHealth === 'critical' && health.status === 'healthy') {
        health.status = 'degraded';
      }
    } catch (error) {
      logger.debug('[HEALTH_CHECK] SAM pipeline metrics unavailable:', error);
    }
  }

    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('[HEALTH_CHECK]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Liveness probe - simple check that the application is running
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}