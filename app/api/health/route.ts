import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getDbMetrics } from '@/lib/db-pooled';
import { enterpriseDataAPI } from '@/lib/data-fetching/enterprise-data-api';
import { shouldUseRealNews, isProductionEnvironment } from '@/lib/config/news-config';
import { getAdapterStatus } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { stageHealthTracker } from '@/lib/sam/pipeline/stage-health-tracker';

interface HealthStatus {
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
  enterpriseAPI?: any;
  aiNews?: {
    mode: string;
    willFetchRealNews: boolean;
    isProduction: boolean;
  };
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
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
    aiNews: {
      mode: shouldUseRealNews() ? 'real' : 'demo',
      willFetchRealNews: shouldUseRealNews(),
      isProduction: isProductionEnvironment()
    }
  };

  // Check database connection with Prisma
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

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
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
    // If pipeline is critical, degrade overall health
    if (pipelineHealth.overallHealth === 'critical' && health.status === 'healthy') {
      health.status = 'degraded';
    }
  } catch (error) {
    logger.debug('[HEALTH_CHECK] SAM pipeline metrics unavailable:', error);
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}

// Liveness probe - simple check that the application is running
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}