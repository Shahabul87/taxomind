/**
 * Enterprise API Gateway Implementation
 * Provides centralized routing, authentication, rate limiting, and request/response transformation
 */

/**
 * Enterprise API Gateway Implementation - Phase 3
 * Provides centralized routing, authentication, rate limiting, circuit breakers,
 * service discovery, and comprehensive monitoring for Taxomind LMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { auth } from '@/auth';
import { GatewayConfig, RouteConfig } from './gateway-config';
import { GatewayMiddleware } from './gateway-middleware';
import { ServiceRegistry } from './service-registry';
import { CircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { HealthMonitor } from '@/lib/resilience/health-monitor';
import { logger } from '@/lib/logger';

export interface GatewayMetrics {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  successRate: number;
  lastUpdated: Date;
  circuitBreakerState?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface RequestContext {
  requestId: string;
  userId?: string;
  userRole?: string;
  startTime: number;
  route: RouteConfig;
  metadata: Record<string, any>;
  traceId?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  blocked?: boolean;
}

export class ApiGateway {
  private redis: Redis;
  private serviceRegistry: ServiceRegistry;
  private config: GatewayConfig;
  private middleware: GatewayMiddleware;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private healthMonitor: HealthMonitor;
  private metrics: Map<string, GatewayMetrics>;
  private rateLimitCache: Map<string, { count: number; resetTime: number }>;

  constructor() {
    this.config = GatewayConfig.getInstance();
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    this.serviceRegistry = new ServiceRegistry();
    this.middleware = new GatewayMiddleware();
    this.circuitBreakers = new Map();
    this.healthMonitor = new HealthMonitor();
    this.metrics = new Map();
    this.rateLimitCache = new Map();
    
    this.initializeCircuitBreakers();
    this.startHealthMonitoring();
  }

  /**
   * Initialize circuit breakers for all services
   */
  private initializeCircuitBreakers(): void {
    const services = new Set(this.config.routes.map(route => route.service));
    
    for (const service of services) {
      const route = this.config.routes.find(r => r.service === service);
      if (route?.circuitBreaker?.enabled) {
        this.circuitBreakers.set(service, new CircuitBreaker({
          name: service,
          failureThreshold: route.circuitBreaker.failureThreshold,
          resetTimeout: route.circuitBreaker.resetTimeout,
          monitoringPeriod: 60000, // 1 minute
        }));
      }
    }
  }

  /**
   * Start health monitoring for all services
   */
  private startHealthMonitoring(): void {
    this.healthMonitor.startMonitoring();
    
    // Update metrics every minute
    setInterval(() => {
      this.updateAggregatedMetrics();
    }, 60000);
  }

  /**
   * Main gateway handler - processes all incoming requests
   */
  async handleRequest(request: NextRequest): Promise<NextResponse> {
    const requestId = this.generateRequestId();
    const traceId = this.generateTraceId();
    const startTime = Date.now();

    try {
      // Find matching route configuration
      const route = this.matchRoute(request);
      if (!route) {
        await this.updateMetrics('unknown', startTime, true);
        return this.createErrorResponse(404, 'Route not found', requestId);
      }

      // Create request context
      const context: RequestContext = {
        requestId,
        traceId,
        startTime,
        route,
        metadata: {},
      };

      // Apply pre-processing middleware
      const preProcessResult = await this.middleware.preProcess(request, context);
      if (!preProcessResult.success) {
        await this.updateMetrics(route.name, startTime, true);
        return this.createErrorResponse(
          preProcessResult.statusCode || 400,
          preProcessResult.error || 'Pre-processing failed',
          requestId
        );
      }

      // Apply rate limiting
      const rateLimitResult = await this.applyRateLimit(request, route);
      if (!rateLimitResult.allowed) {
        await this.updateMetrics(route.name, startTime, true);
        return this.createErrorResponse(429, 'Rate limit exceeded', requestId, {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        });
      }

      // Apply authentication and authorization
      const authResult = await this.applyAuthentication(request, route);
      if (!authResult.success) {
        await this.updateMetrics(route.name, startTime, true);
        return this.createErrorResponse(
          authResult.statusCode || 401,
          authResult.error || 'Authentication failed',
          requestId
        );
      }

      context.userId = authResult.userId;
      context.userRole = authResult.userRole;

      // Check circuit breaker
      const circuitBreaker = this.circuitBreakers.get(route.service);
      if (circuitBreaker && !circuitBreaker.canExecute()) {
        await this.updateMetrics(route.name, startTime, true);
        return this.createErrorResponse(
          503,
          'Service temporarily unavailable',
          requestId,
          { 'X-Circuit-Breaker': 'OPEN' }
        );
      }

      // Route to appropriate service
      let serviceResponse: Response;
      try {
        serviceResponse = await this.routeToService(request, context);
        
        // Record successful circuit breaker execution
        if (circuitBreaker) {
          circuitBreaker.recordSuccess();
        }
      } catch (error) {
        // Record circuit breaker failure
        if (circuitBreaker) {
          circuitBreaker.recordFailure();
        }
        
        // Try fallback if configured
        if (route.fallback) {
          try {
            serviceResponse = await this.routeToFallback(request, context);
          } catch (fallbackError) {
            await this.updateMetrics(route.name, startTime, true);
            throw error; // Use original error
          }
        } else {
          await this.updateMetrics(route.name, startTime, true);
          throw error;
        }
      }

      // Apply post-processing middleware
      const postProcessResult = await this.middleware.postProcess(serviceResponse, context);

      // Update metrics
      await this.updateMetrics(route.name, startTime, serviceResponse.status >= 400);

      // Add gateway headers
      const headers = new Headers(postProcessResult.headers);
      headers.set('X-Request-ID', requestId);
      headers.set('X-Trace-ID', traceId);
      headers.set('X-Gateway-Version', '1.0.0');
      headers.set('X-Processing-Time', `${Date.now() - startTime}ms`);
      
      // Add circuit breaker state if applicable
      if (circuitBreaker) {
        headers.set('X-Circuit-Breaker-State', circuitBreaker.getState());
      }

      return new NextResponse(postProcessResult.body, {
        status: postProcessResult.status,
        headers,
      });

    } catch (error) {
      logger.error(`Gateway error for request ${requestId}:`, error);
      await this.updateMetrics('unknown', startTime, true);
      
      return this.createErrorResponse(
        500,
        'Internal gateway error',
        requestId,
        { 'X-Trace-ID': traceId }
      );
    }
  }

  /**
   * Match incoming request to configured route
   */
  private matchRoute(request: NextRequest): RouteConfig | null {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const routes = this.config.getRoutes();
    
    for (const route of routes) {
      if (this.matchesPath(path, route.path) && route.methods.includes(method as any)) {
        return route;
      }
    }

    return null;
  }

  /**
   * Check if request path matches route pattern
   */
  private matchesPath(requestPath: string, routePath: string | RegExp): boolean {
    if (routePath instanceof RegExp) {
      return routePath.test(requestPath);
    }
    
    // Convert route path to regex pattern for dynamic segments
    const pattern = routePath
      .replace(/\[([^\]]+)\]/g, '([^/]+)')  // Dynamic segments [id]
      .replace(/\*/g, '.*');  // Wildcards

    const regex = new RegExp(`^${pattern}$`);
    return regex.test(requestPath);
  }

  /**
   * Apply pre-request middleware
   */
  private async applyPreMiddleware(
    request: NextRequest,
    route: RouteConfig
  ): Promise<NextRequest | NextResponse> {
    if (!route.middleware?.pre) return request;

    for (const middleware of route.middleware.pre) {
      const result = await middleware(request);
      if (result instanceof NextResponse) {
        return result; // Middleware returned early response
      }
      request = result as NextRequest;
    }

    return request;
  }

  /**
   * Apply rate limiting based on route configuration
   */
  private async applyRateLimit(
    request: NextRequest,
    route: RouteConfig
  ): Promise<RateLimitResult> {
    if (!route.rateLimit || route.rateLimit.enabled === false) {
      return { allowed: true, limit: 0, remaining: 0, resetTime: 0 };
    }

    const clientId = this.getRateLimitIdentifier(request);
    const key = `rate_limit:${route.name}:${clientId}`;
    const window = route.rateLimit.duration || 60;
    const limit = route.rateLimit.points || 100;
    const blockDuration = route.rateLimit.blockDuration || 60;

    try {
      const currentTime = Math.floor(Date.now() / 1000);
      const windowStart = currentTime - (currentTime % window);
      const resetTime = windowStart + window;

      // Check if currently blocked
      const blockKey = `rate_limit_block:${route.name}:${clientId}`;
      const blocked = await this.redis.get<number>(blockKey);
      if (blocked && blocked > currentTime) {
        return {
          allowed: false,
          limit,
          remaining: 0,
          resetTime: blocked,
          blocked: true,
        };
      }

      // Get current count for this window
      const current = await this.redis.get<number>(key) || 0;

      if (current >= limit) {
        // Block for blockDuration
        const blockUntil = currentTime + blockDuration;
        await this.redis.setex(blockKey, blockDuration, blockUntil);
        
        return {
          allowed: false,
          limit,
          remaining: 0,
          resetTime: blockUntil,
          blocked: true,
        };
      }

      // Increment counter
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, window);
      await pipeline.exec();

      return {
        allowed: true,
        limit,
        remaining: limit - current - 1,
        resetTime,
      };

    } catch (error) {
      logger.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return { allowed: true, limit: 0, remaining: 0, resetTime: 0 };
    }
  }

  /**
   * Apply authentication and authorization
   */
  private async applyAuthentication(
    request: NextRequest,
    route: RouteConfig
  ): Promise<{
    success: boolean;
    userId?: string;
    userRole?: string;
    statusCode?: number;
    error?: string;
  }> {
    // Skip auth for public routes
    if (!route.auth?.required) {
      return { success: true };
    }

    try {
      const token = this.extractToken(request);
      if (!token) {
        return {
          success: false,
          statusCode: 401,
          error: 'Authentication token required',
        };
      }

      // Validate token
      const tokenPayload = await this.validateToken(token);
      if (!tokenPayload) {
        return {
          success: false,
          statusCode: 401,
          error: 'Invalid authentication token',
        };
      }

      // Check role-based access
      if (route.auth.roles && route.auth.roles.length > 0) {
        if (!route.auth.roles.includes(tokenPayload.role)) {
          return {
            success: false,
            statusCode: 403,
            error: 'Insufficient permissions',
          };
        }
      }

      return {
        success: true,
        userId: tokenPayload.userId,
        userRole: tokenPayload.role,
      };

    } catch (error) {
      logger.error('Authentication error:', error);
      return {
        success: false,
        statusCode: 500,
        error: 'Authentication service error',
      };
    }
  }

  /**
   * Route request to appropriate service
   */
  private async routeToService(
    request: NextRequest,
    context: RequestContext
  ): Promise<Response> {
    const { route } = context;

    try {
      // Get healthy service instance
      const serviceUrl = await this.serviceRegistry.getHealthyService(route.service);
      if (!serviceUrl) {
        throw new Error(`No healthy instance available for service: ${route.service}`);
      }

      // Build target URL
      const url = new URL(request.url);
      const targetPath = route.rewrite || url.pathname;
      const targetUrl = `${serviceUrl}${targetPath}${url.search}`;

      // Prepare headers
      const headers = new Headers(request.headers);
      headers.set('X-Request-ID', context.requestId);
      headers.set('X-Trace-ID', context.traceId || '');
      headers.set('X-User-ID', context.userId || '');
      headers.set('X-User-Role', context.userRole || '');
      headers.set('X-Forwarded-For', this.getClientIp(request));
      headers.set('X-Gateway-Version', '1.0.0');

      // Set timeout
      const controller = new AbortController();
      const timeout = route.timeout || 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // Forward request
        const response = await fetch(targetUrl, {
          method: request.method,
          headers,
          body: request.body,
          signal: controller.signal,
          // @ts-ignore
          duplex: 'half',
        });

        clearTimeout(timeoutId);
        return response;
      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      logger.error('Service routing error:', error);
      throw error;
    }
  }

  /**
   * Route to fallback service
   */
  private async routeToFallback(
    request: NextRequest,
    context: RequestContext
  ): Promise<Response> {
    const { route } = context;
    
    if (!route.fallback) {
      throw new Error('No fallback service configured');
    }

    const fallbackUrl = await this.serviceRegistry.getHealthyService(route.fallback);
    if (!fallbackUrl) {
      throw new Error(`No healthy fallback instance available: ${route.fallback}`);
    }

    const url = new URL(request.url);
    const targetUrl = `${fallbackUrl}${url.pathname}${url.search}`;

    const headers = new Headers(request.headers);
    headers.set('X-Request-ID', context.requestId);
    headers.set('X-Trace-ID', context.traceId || '');
    headers.set('X-Fallback-Mode', 'true');

    return await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body,
      // @ts-ignore
      duplex: 'half',
    });
  }

  /**
   * Extract authentication token from request
   */
  private extractToken(request: NextRequest): string | null {
    // Check Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check X-API-Key header
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey) {
      return apiKey;
    }

    // Check cookies
    const tokenCookie = request.cookies.get('auth-token');
    if (tokenCookie) {
      return tokenCookie.value;
    }

    return null;
  }

  /**
   * Validate authentication token
   */
  private async validateToken(token: string): Promise<{
    userId: string;
    role: string;
  } | null> {
    try {
      // For JWT tokens
      if (token.includes('.')) {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString()
        );
        
        // Check expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
          return null;
        }
        
        return {
          userId: payload.sub || payload.userId,
          role: payload.role || 'USER',
        };
      }
      
      // For API keys, look up in database/cache
      const userInfo = await this.redis.get(`api_key:${token}`);
      if (userInfo) {
        return JSON.parse(userInfo as string);
      }
      
      return null;
    } catch (error) {
      logger.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Get rate limit identifier for request
   */
  private getRateLimitIdentifier(request: NextRequest): string {
    // Priority: authenticated user > API key > IP address
    const userId = request.headers.get('X-User-ID');
    if (userId) return `user:${userId}`;

    const apiKey = request.headers.get('X-API-Key');
    if (apiKey) return `api:${apiKey}`;

    const forwarded = request.headers.get('X-Forwarded-For');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
    
    return `ip:${ip}`;
  }

  /**
   * Create standardized error response
   */
  private createErrorResponse(
    message: string,
    status: number,
    requestId: string,
    additionalHeaders: Record<string, string> = {
}
  ): NextResponse {
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Gateway-Error': 'true',
      ...additionalHeaders,
    };

    return NextResponse.json(
      {
        error: {
          message,
          status,
          requestId,
          timestamp: new Date().toISOString(),
        }
      },
      { status, headers }
    );
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `gw_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique trace ID for distributed tracing
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    return request.ip || 'unknown';
  }

  /**
   * Update gateway metrics
   */
  private async updateMetrics(
    routeName: string,
    startTime: number,
    isError: boolean
  ): Promise<void> {
    try {
      const latency = Date.now() - startTime;
      const key = `gateway_metrics:${routeName}`;

      const current = this.metrics.get(routeName) || {
        requestCount: 0,
        errorCount: 0,
        averageLatency: 0,
        successRate: 100,
        lastUpdated: new Date(),
      };

      const newCount = current.requestCount + 1;
      const newErrorCount = current.errorCount + (isError ? 1 : 0);
      const newAvgLatency = ((current.averageLatency * current.requestCount) + latency) / newCount;
      const newSuccessRate = ((newCount - newErrorCount) / newCount) * 100;

      const updated: GatewayMetrics = {
        requestCount: newCount,
        errorCount: newErrorCount,
        averageLatency: Math.round(newAvgLatency),
        successRate: Math.round(newSuccessRate * 100) / 100,
        lastUpdated: new Date(),
      };

      // Add circuit breaker state if available
      const circuitBreaker = this.circuitBreakers.get(routeName);
      if (circuitBreaker) {
        updated.circuitBreakerState = circuitBreaker.getState() as 'CLOSED' | 'OPEN' | 'HALF_OPEN';
      }

      this.metrics.set(routeName, updated);

      // Store in Redis for persistence (expire after 1 hour)
      await this.redis.setex(key, 3600, JSON.stringify(updated));

    } catch (error) {
      logger.error('Metrics update error:', error);
    }
  }

  /**
   * Update aggregated metrics across all routes
   */
  private updateAggregatedMetrics(): void {
    const allMetrics = Array.from(this.metrics.values());
    if (allMetrics.length === 0) return;

    const total = allMetrics.reduce(
      (acc, metric) => ({
        requestCount: acc.requestCount + metric.requestCount,
        errorCount: acc.errorCount + metric.errorCount,
        totalLatency: acc.totalLatency + (metric.averageLatency * metric.requestCount),
      }),
      { requestCount: 0, errorCount: 0, totalLatency: 0 }
    );

    const aggregated: GatewayMetrics = {
      requestCount: total.requestCount,
      errorCount: total.errorCount,
      averageLatency: total.requestCount > 0 ? Math.round(total.totalLatency / total.requestCount) : 0,
      successRate: total.requestCount > 0 ? ((total.requestCount - total.errorCount) / total.requestCount) * 100 : 100,
      lastUpdated: new Date(),
    };

    this.metrics.set('_aggregate', aggregated);
  }

  /**
   * Get gateway health status
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, any>;
    metrics: Record<string, GatewayMetrics>;
    circuitBreakers: Record<string, string>;
    uptime: number;
  }> {
    try {
      // Check Redis connection
      await this.redis.ping();
      
      const services = await this.serviceRegistry.getAllServiceHealth();
      const metrics = Object.fromEntries(this.metrics.entries());
      
      // Get circuit breaker states
      const circuitBreakers: Record<string, string> = {};
      for (const [service, breaker] of this.circuitBreakers.entries()) {
        circuitBreakers[service] = breaker.getState();
      }
      
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      const unhealthyServices = Object.values(services).filter(s => !s.healthy).length;
      const totalServices = Object.keys(services).length;
      const openCircuitBreakers = Object.values(circuitBreakers).filter(state => state === 'OPEN').length;
      
      if (unhealthyServices > 0 || openCircuitBreakers > 0) {
        status = (unhealthyServices === totalServices || openCircuitBreakers === this.circuitBreakers.size) 
          ? 'unhealthy' 
          : 'degraded';
      }

      return {
        status,
        services,
        metrics,
        circuitBreakers,
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {},
        metrics: {},
        circuitBreakers: {},
        uptime: process.uptime(),
      };
    }
  }

}

// Export singleton instance
export const apiGateway = new ApiGateway();

// Health check handler for Next.js API route
export async function GET() {
  try {
    const health = await apiGateway.getHealth();
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json({
      ...health,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}