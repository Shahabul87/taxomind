import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { enterpriseDataAPI } from '@/lib/data-fetching/enterprise-data-api';
import { shouldUseRealNews, isProductionEnvironment } from '@/lib/config/news-config';
import { logger } from '@/lib/logger';

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
  } catch (error: any) {
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
    } catch (error: any) {
      health.status = health.status === 'unhealthy' ? 'unhealthy' : 'degraded';
      health.services.redis = {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  
  return NextResponse.json(health, { status: statusCode });
}

// Liveness probe - simple check that the application is running
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}