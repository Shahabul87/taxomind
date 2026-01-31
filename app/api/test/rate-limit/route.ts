import { NextRequest, NextResponse } from "next/server";
import { rateLimitAuth, AuthEndpoint, AUTH_RATE_LIMITS } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get('endpoint') as AuthEndpoint;
  const testId = searchParams.get('testId') || 'default-test';
  
  if (!endpoint || !AUTH_RATE_LIMITS[endpoint]) {
    return NextResponse.json(
      { 
        error: "Invalid or missing endpoint parameter",
        validEndpoints: Object.keys(AUTH_RATE_LIMITS)
      },
      { status: 400 }
    );
  }
  
  try {
    const identifier = getClientIdentifier(req, testId);
    const result = await rateLimitAuth(endpoint, identifier);
    
    const config = AUTH_RATE_LIMITS[endpoint];
    
    logger.debug(`Rate limit test for ${endpoint}`, {
      identifier,
      result,
      config
    });
    
    const response = {
      endpoint,
      identifier,
      config: {
        requests: config.requests,
        window: config.window,
        endpoint: config.endpoint
      },
      result: {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.retryAfter
      },
      resetTime: new Date(result.reset).toISOString(),
      message: result.success 
        ? `Request allowed. ${result.remaining} requests remaining.`
        : `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`
    };
    
    const status = result.success ? 200 : 429;
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString()
    };
    
    if (result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString();
    }
    
    return NextResponse.json(response, { status, headers });
    
  } catch (error: any) {
    logger.error(`Rate limiting test error for ${endpoint}:`, error);
    return NextResponse.json(
      { 
        error: "Internal server error during rate limiting test",
        details: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const { endpoint, identifier, requests } = body;
    
    if (!endpoint || !AUTH_RATE_LIMITS[endpoint as AuthEndpoint]) {
      return NextResponse.json(
        { 
          error: "Invalid or missing endpoint parameter",
          validEndpoints: Object.keys(AUTH_RATE_LIMITS)
        },
        { status: 400 }
      );
    }
    
    const testIdentifier = identifier || getClientIdentifier(req, 'batch-test');
    const requestCount = requests || 5;
    const results = [];
    
    logger.info(`Running batch rate limit test for ${endpoint}`, {
      identifier: testIdentifier,
      requestCount
    });
    
    for (let i = 1; i <= requestCount; i++) {
      const result = await rateLimitAuth(endpoint, testIdentifier);
      results.push({
        requestNumber: i,
        success: result.success,
        remaining: result.remaining,
        retryAfter: result.retryAfter,
        timestamp: new Date().toISOString()
      });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const config = AUTH_RATE_LIMITS[endpoint as AuthEndpoint];
    const successCount = results.filter(r => r.success).length;
    
    return NextResponse.json({
      endpoint,
      config: {
        requests: config.requests,
        window: config.window
      },
      testSummary: {
        totalRequests: requestCount,
        successful: successCount,
        failed: requestCount - successCount,
        identifier: testIdentifier
      },
      results
    });
    
  } catch (error: any) {
    logger.error("Batch rate limiting test error:", error);
    return NextResponse.json(
      { 
        error: "Internal server error during batch rate limiting test",
        details: error.message
      },
      { status: 500 }
    );
  }
}