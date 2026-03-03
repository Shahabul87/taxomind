import { NextRequest, NextResponse } from 'next/server';
import { getValidationSummary } from '@/lib/startup-validation';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

/**
 * Environment Health Check API Endpoint
 * GET /api/health/env
 * 
 * Provides environment validation status for monitoring and health checks
 * Protected by basic authentication in production environments
 */

export async function GET(request: NextRequest) {
  try {
    // Basic authentication for production environments  
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === 'production' || (nodeEnv as string) === 'staging') {
      const headersList = await headers();
      const authorization = headersList.get('authorization');
      
      if (!authorization) {
        return NextResponse.json(
          { error: 'Authorization required' },
          { status: 401, headers: { 'WWW-Authenticate': 'Basic' } }
        );
      }

      // Simple bearer token or basic auth check
      const expectedToken = process.env.HEALTH_CHECK_TOKEN || process.env.METRICS_AUTH_TOKEN;
      if (expectedToken) {
        const token = authorization.replace('Bearer ', '').replace('Basic ', '');
        if (token !== expectedToken) {
          return NextResponse.json(
            { error: 'Invalid authorization' },
            { status: 401 }
          );
        }
      }
    }

    // Get comprehensive validation summary
    const summary = getValidationSummary();
    
    // Determine overall health status
    const status = summary.isValid ? 'healthy' : 'unhealthy';
    const statusCode = summary.isValid ? 200 : 503;
    
    // Calculate feature availability score
    const features = Object.values(summary.features);
    const availableFeatures = features.filter(Boolean).length;
    const featureScore = Math.round((availableFeatures / features.length) * 100);
    
    // Prepare response
    const response = {
      status,
      timestamp: new Date().toISOString(),
      environment: summary.environment,
      
      // Core validation results
      validation: {
        isValid: summary.isValid,
        errorCount: summary.errors.length,
        warningCount: summary.warnings.length,
      },
      
      // Feature availability
      features: {
        ai: summary.features.ai,
        oauth: summary.features.oauth,
        media: summary.features.media,
        caching: summary.features.caching,
        monitoring: summary.features.monitoring,
        availabilityScore: featureScore,
      },
      
      // System information
      system: {
        nodeEnv: process.env.NODE_ENV,
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      
      // Include errors in non-production or if requested
      ...(process.env.NODE_ENV !== 'production' || request.nextUrl.searchParams.has('details')) && {
        details: {
          errors: summary.errors,
          warnings: summary.warnings,
        }
      },
    };
    
    return NextResponse.json(response, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error) {
    logger.error('Environment health check failed', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    const summary = getValidationSummary();
    const statusCode = summary.isValid ? 200 : 503;
    
    return new NextResponse(null, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
    
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}