import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAuth, AuthEndpoint, getRateLimitHeaders, getClientIdentifier, RateLimitHeaders, RateLimitResult } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Rate limiting middleware for authentication endpoints
 * @param endpoint - The authentication endpoint type
 * @param userId - Optional user ID for user-specific rate limiting
 */
export async function withAuthRateLimit(
  request: NextRequest,
  endpoint: AuthEndpoint,
  userId?: string
): Promise<NextResponse | { success: true; headers: RateLimitHeaders; rateLimitResult: RateLimitResult }> {
  const identifier = getClientIdentifier(request, userId);
  
  try {
    const result = await rateLimitAuth(endpoint, identifier);
    const headers = getRateLimitHeaders(result);
    
    if (!result.success) {
      logger.warn(`Rate limit exceeded for ${endpoint}`, {
        identifier,
        endpoint,
        limit: result.limit,
        remaining: result.remaining,
        reset: new Date(result.reset).toISOString()
      });
      
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter
        },
        { 
          status: 429,
          headers: headers as Record<string, string>
        }
      );
    }
    
    logger.debug(`Rate limit check passed for ${endpoint}`, {
      identifier,
      remaining: result.remaining,
      limit: result.limit
    });
    
    return { success: true, headers, rateLimitResult: result };
  } catch (error: any) {
    logger.error(`Rate limiting error for ${endpoint}:`, error);
    // If rate limiting fails, allow the request to proceed
    const fallbackHeaders: RateLimitHeaders = {
      'X-RateLimit-Limit': '999',
      'X-RateLimit-Remaining': '999',
      'X-RateLimit-Reset': (Date.now() + 3600000).toString()
    };
    const fallbackResult: RateLimitResult = {
      success: true,
      limit: 999,
      remaining: 999,
      reset: Date.now() + 3600000
    };
    return { success: true, headers: fallbackHeaders, rateLimitResult: fallbackResult };
  }
}

/**
 * HOC for wrapping API route handlers with rate limiting
 * @param endpoint - The authentication endpoint type
 * @param handler - The original API route handler
 */
export function withRateLimit<T extends any[]>(
  endpoint: AuthEndpoint,
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Extract user ID from request body if available for user-specific rate limiting
    let userId: string | undefined;
    
    try {
      if (request.method === 'POST') {
        const body = await request.clone().json();
        userId = body.email || body.userId;
      }
    } catch {
      // Ignore JSON parsing errors
    }
    
    const rateLimitResult = await withAuthRateLimit(request, endpoint, userId);
    
    // If rateLimitResult is a NextResponse (rate limit exceeded), return it
    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult;
    }
    
    // Call the original handler
    const response = await handler(request, ...args);
    
    // Add rate limit headers to successful responses
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, String(value));
      });
    }
    
    return response;
  };
}

/**
 * Server action rate limiting wrapper
 * @param endpoint - The authentication endpoint type
 * @param action - The server action function
 * @param getIdentifier - Function to extract identifier from action parameters
 */
export function withServerActionRateLimit<TInput, TOutput>(
  endpoint: AuthEndpoint,
  action: (input: TInput) => Promise<TOutput>,
  getIdentifier: (input: TInput) => { ip: string; userId?: string }
) {
  return async (input: TInput): Promise<TOutput | { error: string; retryAfter?: number }> => {
    const { ip, userId } = getIdentifier(input);
    const identifier = userId ? `${ip}:${userId}` : ip;
    
    try {
      const result = await rateLimitAuth(endpoint, identifier);
      
      if (!result.success) {
        logger.warn(`Rate limit exceeded for server action ${endpoint}`, {
          identifier,
          endpoint,
          limit: result.limit,
          remaining: result.remaining
        });
        
        return {
          error: `Too many ${endpoint} attempts. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter
        };
      }
      
      logger.debug(`Server action rate limit check passed for ${endpoint}`, {
        identifier,
        remaining: result.remaining
      });
      
      return await action(input);
    } catch (error: any) {
      logger.error(`Server action rate limiting error for ${endpoint}:`, error);
      // If rate limiting fails, allow the action to proceed
      return await action(input);
    }
  };
}