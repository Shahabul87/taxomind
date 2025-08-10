/**
 * Gateway Middleware
 * Request/response transformations, logging, and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { logger } from '@/lib/logger';

export interface RequestLog {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  userId?: string;
  ip?: string;
  timestamp: string;
  headers: Record<string, string>;
}

export interface ResponseLog {
  requestId: string;
  status: number;
  duration: number;
  timestamp: string;
  size?: number;
}

export interface ErrorLog {
  requestId: string;
  error: string;
  stack?: string;
  timestamp: string;
  context?: any;
}

/**
 * Request logging middleware
 */
export function logRequest(request: NextRequest, requestId: string): void {
  const log: RequestLog = {
    requestId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    userId: request.headers.get('x-user-id') || undefined,
    ip: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
    timestamp: new Date().toISOString(),
    headers: Object.fromEntries(request.headers.entries()),
  };

  // Filter sensitive headers
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  sensitiveHeaders.forEach(header => {
    if (log.headers[header]) {
      log.headers[header] = '[REDACTED]';
    }
  });

  console.log('[REQUEST]', JSON.stringify(log));
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // sendToLoggingService('request', log);
  }
}

/**
 * Response logging middleware
 */
export function logResponse(response: Response, requestId: string, duration: number): void {
  const log: ResponseLog = {
    requestId,
    status: response.status,
    duration,
    timestamp: new Date().toISOString(),
    size: parseInt(response.headers.get('content-length') || '0', 10) || undefined,
  };

  console.log('[RESPONSE]', JSON.stringify(log));
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // sendToLoggingService('response', log);
  }
}

/**
 * Error logging middleware
 */
export function logError(error: Error, requestId: string, context?: any): void {
  const log: ErrorLog = {
    requestId,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  };

  logger.error('[ERROR]', JSON.stringify(log));
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // sendToErrorTrackingService(log);
  }
}

/**
 * Request transformation middleware
 */
export class RequestTransformer {
  /**
   * Add correlation ID to request
   */
  static addCorrelationId(request: NextRequest): NextRequest {
    const correlationId = request.headers.get('x-correlation-id') || 
                         `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const headers = new Headers(request.headers);
    headers.set('x-correlation-id', correlationId);
    
    return new NextRequest(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });
  }

  /**
   * Add request timestamp
   */
  static addTimestamp(request: NextRequest): NextRequest {
    const headers = new Headers(request.headers);
    headers.set('x-request-timestamp', new Date().toISOString());
    
    return new NextRequest(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });
  }

  /**
   * Validate request content type
   */
  static validateContentType(allowedTypes: string[]) {
    return (request: NextRequest): NextRequest | NextResponse => {
      const contentType = request.headers.get('content-type');
      
      if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
        if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
          return NextResponse.json(
            { error: 'Invalid content type' },
            { status: 415 }
          );
        }
      }
      
      return request;
    };
  }

  /**
   * Add security headers
   */
  static addSecurityHeaders(request: NextRequest): NextRequest {
    const headers = new Headers(request.headers);
    headers.set('x-content-type-options', 'nosniff');
    headers.set('x-frame-options', 'DENY');
    headers.set('x-xss-protection', '1; mode=block');
    headers.set('referrer-policy', 'strict-origin-when-cross-origin');
    
    return new NextRequest(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });
  }

  /**
   * Request size validation
   */
  static validateRequestSize(maxSize: number) {
    return (request: NextRequest): NextRequest | NextResponse => {
      const contentLength = request.headers.get('content-length');
      
      if (contentLength && parseInt(contentLength, 10) > maxSize) {
        return NextResponse.json(
          { error: 'Request too large' },
          { status: 413 }
        );
      }
      
      return request;
    };
  }
}

/**
 * Response transformation middleware
 */
export class ResponseTransformer {
  /**
   * Add CORS headers
   */
  static addCORSHeaders(allowedOrigins: string[] = ['*']): (response: NextResponse) => NextResponse {
    return (response: NextResponse): NextResponse => {
      const headers = new Headers(response.headers);
      
      headers.set('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : allowedOrigins[0]);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      headers.set('Access-Control-Max-Age', '86400');
      
      return NextResponse.json(
        response.body,
        { status: response.status, headers }
      );
    };
  }

  /**
   * Add cache headers
   */
  static addCacheHeaders(maxAge: number, isPublic: boolean = false): (response: NextResponse) => NextResponse {
    return (response: NextResponse): NextResponse => {
      const headers = new Headers(response.headers);
      
      const cacheControl = isPublic 
        ? `public, max-age=${maxAge}, s-maxage=${maxAge}`
        : `private, max-age=${maxAge}`;
      
      headers.set('Cache-Control', cacheControl);
      headers.set('ETag', generateETag(response));
      
      return NextResponse.json(
        response.body,
        { status: response.status, headers }
      );
    };
  }

  /**
   * Add security headers to response
   */
  static addSecurityHeaders(response: NextResponse): NextResponse {
    const headers = new Headers(response.headers);
    
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    headers.set('Content-Security-Policy', "default-src 'self'");
    
    return NextResponse.json(
      response.body,
      { status: response.status, headers }
    );
  }

  /**
   * Add rate limit headers
   */
  static addRateLimitHeaders(
    limit: number,
    remaining: number,
    resetTime: Date
  ): (response: NextResponse) => NextResponse {
    return (response: NextResponse): NextResponse => {
      const headers = new Headers(response.headers);
      
      headers.set('X-RateLimit-Limit', limit.toString());
      headers.set('X-RateLimit-Remaining', remaining.toString());
      headers.set('X-RateLimit-Reset', resetTime.toISOString());
      
      return NextResponse.json(
        response.body,
        { status: response.status, headers }
      );
    };
  }

  /**
   * Compress response data
   */
  static compressResponse(response: NextResponse): NextResponse {
    const headers = new Headers(response.headers);
    headers.set('Content-Encoding', 'gzip');
    
    // In a real implementation, you would compress the response body
    // For now, just add the header to indicate compression support
    
    return NextResponse.json(
      response.body,
      { status: response.status, headers }
    );
  }

  /**
   * Add pagination metadata
   */
  static addPaginationMetadata(
    page: number,
    limit: number,
    total: number
  ): (response: NextResponse) => NextResponse {
    return async (response: NextResponse): Promise<NextResponse> => {
      const data = await response.json();
      const totalPages = Math.ceil(total / limit);
      
      const enhancedData = {
        ...data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
      
      return NextResponse.json(enhancedData, {
        status: response.status,
        headers: response.headers,
      });
    };
  }
}

/**
 * Monitoring middleware
 */
export class MonitoringMiddleware {
  private static metrics = new Map<string, any>();

  /**
   * Track request metrics
   */
  static trackRequestMetrics(request: NextRequest): NextRequest {
    const path = new URL(request.url).pathname;
    const key = `${request.method}:${path}`;
    
    const current = this.metrics.get(key) || { count: 0, errors: 0, totalTime: 0 };
    current.count += 1;
    current.lastRequest = new Date().toISOString();
    
    this.metrics.set(key, current);
    
    // Store start time for duration calculation
    const headers = new Headers(request.headers);
    headers.set('x-request-start', Date.now().toString());
    
    return new NextRequest(request.url, {
      method: request.method,
      headers,
      body: request.body,
    });
  }

  /**
   * Track response metrics
   */
  static trackResponseMetrics(request: NextRequest): (response: NextResponse) => NextResponse {
    return (response: NextResponse): NextResponse => {
      const startTime = parseInt(request.headers.get('x-request-start') || '0', 10);
      const duration = Date.now() - startTime;
      
      const path = new URL(request.url).pathname;
      const key = `${request.method}:${path}`;
      
      const current = this.metrics.get(key) || { count: 0, errors: 0, totalTime: 0 };
      current.totalTime += duration;
      current.avgTime = current.totalTime / current.count;
      
      if (response.status >= 400) {
        current.errors += 1;
        current.errorRate = current.errors / current.count;
      }
      
      this.metrics.set(key, current);
      
      const headers = new Headers(response.headers);
      headers.set('x-response-time', duration.toString());
      
      return NextResponse.json(
        response.body,
        { status: response.status, headers }
      );
    };
  }

  /**
   * Get metrics data
   */
  static getMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics.entries());
  }

  /**
   * Reset metrics
   */
  static resetMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * Utility functions
 */

/**
 * Generate ETag for response
 */
function generateETag(response: NextResponse): string {
  const content = JSON.stringify(response.body);
  return `"${createHash('md5').update(content).digest('hex')}"`;
}

/**
 * Sanitize sensitive data from logs
 */
export function sanitizeLogData(data: any): any {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
  ];
  
  if (typeof data === 'string') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    
    return sanitized;
  }
  
  return data;
}

/**
 * Format log message
 */
export function formatLogMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  
  return JSON.stringify({
    timestamp,
    level,
    message,
    data: sanitizedData,
  });
}

const GatewayMiddleware = {
  RequestTransformer,
  ResponseTransformer,
  MonitoringMiddleware,
  logRequest,
  logResponse,
  logError,
};

export default GatewayMiddleware;