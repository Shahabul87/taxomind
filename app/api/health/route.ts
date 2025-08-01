import { NextResponse } from 'next/server';
import { enterpriseDataAPI } from '@/lib/data-fetching/enterprise-data-api';
import { shouldUseRealNews, isProductionEnvironment } from '@/lib/config/news-config';

export async function GET() {
  try {
    // Prepare comprehensive health check data
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
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
      services: {
        database: false,
        anthropicApiKey: !!process.env.ANTHROPIC_API_KEY,
        aiNews: {
          mode: shouldUseRealNews() ? 'real' : 'demo',
          willFetchRealNews: shouldUseRealNews(),
          isProduction: isProductionEnvironment()
        }
      },
      version: process.env.npm_package_version || '1.0.0'
    };

    // Perform health check using enterprise API
    try {
      const healthResult = await enterpriseDataAPI.healthCheck();
      
      if (healthResult.success) {
        healthData.services.database = true;
        healthData['enterpriseAPI'] = healthResult.data;
      }
    } catch (dbError) {
      console.error('[HEALTH_CHECK] Database error:', dbError);
      healthData.services.database = false;
    }

    // Determine overall health status
    const isHealthy = healthData.services.database;
    healthData.status = isHealthy ? 'healthy' : 'degraded';

    return NextResponse.json(healthData, { 
      status: isHealthy ? 200 : 503 
    });
    
  } catch (error) {
    console.error('[HEALTH_CHECK] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}