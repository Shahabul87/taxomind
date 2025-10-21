/**
 * Enterprise API Response Utility
 * Standardized API response format with request tracking, metadata, and monitoring
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

// Enterprise API Response Interface
export interface EnterpriseApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string; // Only in development
  };
  metadata: {
    timestamp: string;
    requestId: string;
    version: string;
    responseTime: number;
    cached?: boolean;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: string;
    };
  };
}

// Request context for tracking
export interface RequestContext {
  requestId: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  startTime: number;
  endpoint: string;
  method: string;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create enterprise success response
 */
export function createSuccessResponse<T>(
  data: T,
  context: RequestContext,
  additionalMetadata?: {
    cached?: boolean;
    rateLimit?: { limit: number; remaining: number; reset: Date };
  }
): NextResponse<EnterpriseApiResponse<T>> {
  const responseTime = Date.now() - context.startTime;

  const response: EnterpriseApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      version: '1.0.0',
      responseTime,
      ...(additionalMetadata?.cached && { cached: true }),
      ...(additionalMetadata?.rateLimit && {
        rateLimit: {
          limit: additionalMetadata.rateLimit.limit,
          remaining: additionalMetadata.rateLimit.remaining,
          reset: additionalMetadata.rateLimit.reset.toISOString(),
        },
      }),
    },
  };

  // Log successful request
  logger.info('API Request Success', {
    requestId: context.requestId,
    endpoint: context.endpoint,
    method: context.method,
    userId: context.userId,
    responseTime,
    cached: additionalMetadata?.cached || false,
  });

  // Track metrics
  trackApiMetrics(context, responseTime, 200);

  return NextResponse.json(response, {
    status: 200,
    headers: {
      'X-Request-ID': context.requestId,
      'X-Response-Time': `${responseTime}ms`,
      ...(additionalMetadata?.cached && { 'X-Cache': 'HIT' }),
      ...(additionalMetadata?.rateLimit && {
        'X-RateLimit-Limit': additionalMetadata.rateLimit.limit.toString(),
        'X-RateLimit-Remaining': additionalMetadata.rateLimit.remaining.toString(),
        'X-RateLimit-Reset': additionalMetadata.rateLimit.reset.toISOString(),
      }),
    },
  });
}

/**
 * Create enterprise error response
 */
export function createErrorResponse(
  error: Error | unknown,
  context: RequestContext,
  statusCode: number = 500,
  errorCode: string = 'INTERNAL_ERROR'
): NextResponse<EnterpriseApiResponse<never>> {
  const responseTime = Date.now() - context.startTime;
  const isDevelopment = process.env.NODE_ENV === 'development';

  let errorMessage = 'An unexpected error occurred';
  let errorDetails: Record<string, unknown> | undefined;
  let stack: string | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    if (isDevelopment) {
      stack = error.stack;
    }
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  }

  const response: EnterpriseApiResponse<never> = {
    success: false,
    error: {
      code: errorCode,
      message: isDevelopment ? errorMessage : 'An error occurred processing your request',
      details: isDevelopment ? errorDetails : undefined,
      stack: isDevelopment ? stack : undefined,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      version: '1.0.0',
      responseTime,
    },
  };

  // Log error with full context
  logger.error('API Request Error', {
    requestId: context.requestId,
    endpoint: context.endpoint,
    method: context.method,
    userId: context.userId,
    errorCode,
    errorMessage,
    statusCode,
    responseTime,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Track error metrics
  trackApiMetrics(context, responseTime, statusCode, errorCode);

  return NextResponse.json(response, {
    status: statusCode,
    headers: {
      'X-Request-ID': context.requestId,
      'X-Response-Time': `${responseTime}ms`,
      'X-Error-Code': errorCode,
    },
  });
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(
  validationErrors: Record<string, unknown>,
  context: RequestContext
): NextResponse<EnterpriseApiResponse<never>> {
  const responseTime = Date.now() - context.startTime;

  const response: EnterpriseApiResponse<never> = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data provided',
      details: validationErrors,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      version: '1.0.0',
      responseTime,
    },
  };

  logger.warn('API Validation Error', {
    requestId: context.requestId,
    endpoint: context.endpoint,
    userId: context.userId,
    validationErrors,
  });

  trackApiMetrics(context, responseTime, 400, 'VALIDATION_ERROR');

  return NextResponse.json(response, {
    status: 400,
    headers: {
      'X-Request-ID': context.requestId,
      'X-Response-Time': `${responseTime}ms`,
      'X-Error-Code': 'VALIDATION_ERROR',
    },
  });
}

/**
 * Create unauthorized response
 */
export function createUnauthorizedResponse(
  context: RequestContext,
  message: string = 'Authentication required'
): NextResponse<EnterpriseApiResponse<never>> {
  const responseTime = Date.now() - context.startTime;

  const response: EnterpriseApiResponse<never> = {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      version: '1.0.0',
      responseTime,
    },
  };

  logger.warn('API Unauthorized Access', {
    requestId: context.requestId,
    endpoint: context.endpoint,
    ipAddress: context.ipAddress,
  });

  trackApiMetrics(context, responseTime, 401, 'UNAUTHORIZED');

  return NextResponse.json(response, {
    status: 401,
    headers: {
      'X-Request-ID': context.requestId,
      'X-Response-Time': `${responseTime}ms`,
    },
  });
}

/**
 * Create forbidden response
 */
export function createForbiddenResponse(
  context: RequestContext,
  message: string = 'Access forbidden'
): NextResponse<EnterpriseApiResponse<never>> {
  const responseTime = Date.now() - context.startTime;

  const response: EnterpriseApiResponse<never> = {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      version: '1.0.0',
      responseTime,
    },
  };

  logger.warn('API Forbidden Access', {
    requestId: context.requestId,
    endpoint: context.endpoint,
    userId: context.userId,
  });

  trackApiMetrics(context, responseTime, 403, 'FORBIDDEN');

  return NextResponse.json(response, {
    status: 403,
    headers: {
      'X-Request-ID': context.requestId,
      'X-Response-Time': `${responseTime}ms`,
    },
  });
}

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(
  context: RequestContext,
  rateLimit: { limit: number; remaining: number; reset: Date }
): NextResponse<EnterpriseApiResponse<never>> {
  const responseTime = Date.now() - context.startTime;
  const retryAfter = Math.ceil((rateLimit.reset.getTime() - Date.now()) / 1000);

  const response: EnterpriseApiResponse<never> = {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      details: {
        retryAfter,
      },
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: context.requestId,
      version: '1.0.0',
      responseTime,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.reset.toISOString(),
      },
    },
  };

  logger.warn('API Rate Limit Exceeded', {
    requestId: context.requestId,
    endpoint: context.endpoint,
    userId: context.userId,
    ipAddress: context.ipAddress,
  });

  trackApiMetrics(context, responseTime, 429, 'RATE_LIMIT_EXCEEDED');

  return NextResponse.json(response, {
    status: 429,
    headers: {
      'X-Request-ID': context.requestId,
      'X-Response-Time': `${responseTime}ms`,
      'X-RateLimit-Limit': rateLimit.limit.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.reset.toISOString(),
      'Retry-After': retryAfter.toString(),
    },
  });
}

/**
 * Track API metrics to Redis
 */
async function trackApiMetrics(
  context: RequestContext,
  responseTime: number,
  statusCode: number,
  errorCode?: string
): Promise<void> {
  try {
    const metricsKey = `metrics:api:${context.endpoint}:${new Date().toISOString().split('T')[0]}`;
    const timestamp = Date.now();

    // Increment request count
    await redis.hincrby(metricsKey, 'totalRequests', 1);

    // Increment status code count
    await redis.hincrby(metricsKey, `status_${statusCode}`, 1);

    // Track error codes
    if (errorCode) {
      await redis.hincrby(metricsKey, `error_${errorCode}`, 1);
    }

    // Track response times (store last 100 for percentile calculation)
    await redis.lpush(`${metricsKey}:responseTimes`, String(responseTime));
    await redis.ltrim(`${metricsKey}:responseTimes`, 0, 99);

    // Set expiration to 30 days
    await redis.expire(metricsKey, 30 * 24 * 60 * 60);

    // Track real-time metrics for monitoring
    const realtimeKey = `metrics:api:realtime`;
    await redis.setex(
      `${realtimeKey}:${context.requestId}`,
      300, // 5 minutes TTL
      String(JSON.stringify({
        endpoint: context.endpoint,
        method: context.method,
        statusCode,
        responseTime,
        timestamp,
        userId: context.userId,
        errorCode,
      }))
    );
  } catch (error) {
    // Don't fail the request if metrics tracking fails
    logger.error('Failed to track API metrics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: context.requestId,
    });
  }
}

/**
 * Get API metrics for endpoint
 */
export async function getApiMetrics(endpoint: string, date?: string): Promise<{
  totalRequests: number;
  statusCodes: Record<string, number>;
  errors: Record<string, number>;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}> {
  try {
    const dateKey = date || new Date().toISOString().split('T')[0];
    const metricsKey = `metrics:api:${endpoint}:${dateKey}`;

    const metrics = await redis.hgetall(metricsKey);
    const responseTimes = (await redis.lrange(`${metricsKey}:responseTimes`, 0, -1)).map(Number);

    // Parse status codes and errors
    const statusCodes: Record<string, number> = {};
    const errors: Record<string, number> = {};

    Object.entries(metrics).forEach(([key, value]) => {
      if (key.startsWith('status_')) {
        statusCodes[key.replace('status_', '')] = parseInt(value);
      } else if (key.startsWith('error_')) {
        errors[key.replace('error_', '')] = parseInt(value);
      }
    });

    // Calculate percentiles
    const sorted = responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      totalRequests: parseInt(metrics.totalRequests || '0'),
      statusCodes,
      errors,
      averageResponseTime:
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0,
      p95ResponseTime: sorted[p95Index] || 0,
      p99ResponseTime: sorted[p99Index] || 0,
    };
  } catch (error) {
    logger.error('Failed to get API metrics', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint,
    });
    return {
      totalRequests: 0,
      statusCodes: {},
      errors: {},
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
    };
  }
}
