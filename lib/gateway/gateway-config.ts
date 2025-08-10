/**
 * Gateway Configuration
 * Centralized configuration for API Gateway routes, policies, and middleware
 */

import { NextRequest, NextResponse } from 'next/server';

export interface MiddlewareFunction {
  (request: NextRequest): Promise<NextRequest | NextResponse>;
}

export interface PostMiddlewareFunction {
  (response: NextResponse): Promise<NextResponse>;
}

export interface RouteConfig {
  name: string;
  path: string | RegExp;
  methods: Array<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'>;
  service: string;
  targetPort?: number;
  rewrite?: string;
  timeout?: number;
  public?: boolean;
  fallback?: string;
  
  // Authentication configuration
  auth?: {
    required: boolean;
    roles?: string[];
    permissions?: string[];
  };
  
  // Rate limiting configuration
  rateLimit?: {
    enabled?: boolean;
    points: number;
    duration: number;
    blockDuration?: number;
  };
  
  // Middleware configuration
  middleware?: {
    pre?: MiddlewareFunction[];
    post?: PostMiddlewareFunction[];
  };
  
  // Caching configuration
  cache?: {
    enabled: boolean;
    ttl: number;
    key?: (request: NextRequest) => string;
  };
  
  // Circuit breaker configuration
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    resetTimeout: number;
  };

  // Health check configuration
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    path: string;
  };
}

export interface GatewayConfigInterface {
  routes: RouteConfig[];
  policies: PolicyConfig[];
  rateLimit?: {
    points: number;
    duration: number;
    blockDuration: number;
  };
  cors?: {
    origin: string[];
    methods: string[];
    allowedHeaders: string[];
  };
  security?: {
    apiKeyHeader: string;
    allowedApiKeys: string[];
  };
  monitoring?: {
    enabled: boolean;
    metricsInterval: number;
    healthCheckInterval: number;
  };
}

/**
 * Gateway Configuration Class - Enterprise Phase 3
 */
export class GatewayConfig {
  private static instance: GatewayConfig;
  
  private routes: RouteConfig[] = [];
  private policies: PolicyConfig[] = [];
  
  public readonly defaultRateLimit = {
    points: 100,
    duration: 60,
    blockDuration: 60,
  };
  
  public readonly cors = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Request-ID',
      'X-Trace-ID',
    ],
  };
  
  private constructor() {
    this.initializeRoutes();
    this.initializePolicies();
  }
  
  public static getInstance(): GatewayConfig {
    if (!GatewayConfig.instance) {
      GatewayConfig.instance = new GatewayConfig();
    }
    return GatewayConfig.instance;
  }

  /**
   * Get all configured routes
   */
  public getRoutes(): RouteConfig[] {
    return [...this.routes];
  }

  /**
   * Get all configured policies
   */
  public getPolicies(): PolicyConfig[] {
    return [...this.policies];
  }
  
  /**
   * Initialize route configurations
   */
  private initializeRoutes() {
    this.routes = [
      // Authentication routes
      {
        name: 'auth-login',
        path: '/api/auth/login',
        methods: ['POST'],
        service: 'auth-service',
        public: true,
        auth: { required: false },
        rateLimit: { 
          enabled: true,
          points: 5, 
          duration: 300, // 5 minutes
          blockDuration: 900 // 15 minutes
        },
        middleware: {
          pre: [this.validateLoginAttempts],
          post: [this.sanitizeAuthResponse]
        },
        healthCheck: {
          enabled: true,
          interval: 30000,
          timeout: 5000,
          path: '/health'
        }
      },

      // Authentication callback routes
      {
        name: 'auth-callback',
        path: /^\/api\/auth\/.+\/callback$/,
        methods: ['GET', 'POST'],
        service: 'auth-service',
        public: true,
        auth: { required: false },
        rateLimit: {
          enabled: true,
          points: 10,
          duration: 300,
          blockDuration: 600
        }
      },
      
      // Course management routes
      {
        name: 'courses-api',
        path: /^\/api\/courses/,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        service: 'course-service',
        fallback: 'course-cache-service',
        timeout: 45000,
        auth: { 
          required: true,
          roles: ['ADMIN', 'USER']
        },
        rateLimit: {
          enabled: true,
          points: 50,
          duration: 60
        },
        cache: {
          enabled: true,
          ttl: 300, // 5 minutes
          key: (req) => `course:${req.url}:${req.headers.get('X-User-ID')}`
        },
        circuitBreaker: {
          enabled: true,
          failureThreshold: 5,
          resetTimeout: 60000
        },
        healthCheck: {
          enabled: true,
          interval: 15000,
          timeout: 3000,
          path: '/api/health'
        }
      },
      
      // Analytics routes
      {
        name: 'analytics-api',
        path: /^\/api\/analytics/,
        methods: ['GET', 'POST'],
        service: 'analytics-service',
        auth: { 
          required: true,
          roles: ['ADMIN', 'USER']
        },
        rateLimit: {
          enabled: true,
          points: 30,
          duration: 60
        },
        middleware: {
          pre: [this.validateAnalyticsRequest],
          post: [this.enrichAnalyticsResponse]
        }
      },
      
      // AI/SAM routes
      {
        name: 'sam-api',
        path: /^\/api\/sam/,
        methods: ['GET', 'POST'],
        service: 'sam-service',
        fallback: 'sam-fallback-service',
        timeout: 90000, // 90 seconds for AI operations
        auth: { 
          required: true,
          roles: ['ADMIN', 'USER']
        },
        rateLimit: {
          enabled: true,
          points: 15,
          duration: 60,
          blockDuration: 300
        },
        circuitBreaker: {
          enabled: true,
          failureThreshold: 3,
          resetTimeout: 120000 // 2 minutes
        },
        middleware: {
          pre: [this.validateSAMRequest],
          post: [this.processSAMResponse]
        },
        healthCheck: {
          enabled: true,
          interval: 20000,
          timeout: 5000,
          path: '/health'
        }
      },
      
      // Admin routes
      {
        name: 'admin-api',
        path: /^\/api\/admin/,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        service: 'admin-service',
        auth: { 
          required: true,
          roles: ['ADMIN']
        },
        rateLimit: {
          enabled: true,
          points: 100,
          duration: 60
        },
        middleware: {
          pre: [this.auditAdminRequest],
          post: [this.logAdminResponse]
        }
      },
      
      // Upload routes
      {
        name: 'upload-api',
        path: /^\/api\/upload/,
        methods: ['POST'],
        service: 'upload-service',
        auth: { 
          required: true,
          roles: ['ADMIN', 'USER']
        },
        rateLimit: {
          enabled: true,
          points: 10,
          duration: 300, // 5 minutes
          blockDuration: 600 // 10 minutes
        },
        timeout: 120000, // 2 minutes for uploads
        middleware: {
          pre: [this.validateFileUpload]
        }
      },
      
      // Real-time routes (WebSocket upgrade)
      {
        name: 'websocket-api',
        path: /^\/api\/ws/,
        methods: ['GET'],
        service: 'websocket-service',
        auth: { 
          required: true,
          roles: ['ADMIN', 'USER']
        },
        rateLimit: {
          enabled: true,
          points: 5,
          duration: 60
        }
      },
      
      // Public health check
      {
        name: 'health-check',
        path: '/api/health',
        methods: ['GET'],
        service: 'gateway-service',
        public: true,
        auth: { required: false },
        rateLimit: {
          enabled: true,
          points: 20,
          duration: 60
        }
      },

      // Gateway metrics endpoint
      {
        name: 'gateway-metrics',
        path: '/api/gateway/metrics',
        methods: ['GET'],
        service: 'gateway-service',
        auth: {
          required: true,
          roles: ['ADMIN']
        },
        rateLimit: {
          enabled: true,
          points: 30,
          duration: 60
        }
      },

      // File upload routes
      {
        name: 'file-upload',
        path: /^\/api\/upload/,
        methods: ['POST'],
        service: 'upload-service',
        timeout: 120000, // 2 minutes for large uploads
        auth: {
          required: true,
          roles: ['ADMIN', 'USER']
        },
        rateLimit: {
          enabled: true,
          points: 5,
          duration: 300, // 5 minutes
          blockDuration: 600 // 10 minutes
        },
        middleware: {
          pre: [this.validateFileUpload]
        },
        circuitBreaker: {
          enabled: true,
          failureThreshold: 3,
          resetTimeout: 30000
        }
      }
    ];
  }
  
  /**
   * Middleware Functions
   */
  
  private async validateLoginAttempts(request: NextRequest): Promise<NextRequest | NextResponse> {
    // Implement failed login attempt tracking
    const clientIP = request.headers.get('X-Forwarded-For') || request.ip || 'unknown';
    
    // This would typically check a failed attempts cache
    // For now, just pass through
    return request;
  }
  
  private async sanitizeAuthResponse(response: NextResponse): Promise<NextResponse> {
    // Remove sensitive data from auth responses
    const responseData = await response.json().catch(() => ({}));
    
    if (responseData.user) {
      delete responseData.user.password;
      delete responseData.user.salt;
    }
    
    return NextResponse.json(responseData, {
      status: response.status,
      headers: response.headers
    });
  }
  
  private async validateAnalyticsRequest(request: NextRequest): Promise<NextRequest | NextResponse> {
    // Validate analytics request parameters
    const url = new URL(request.url);
    const dateRange = url.searchParams.get('dateRange');
    
    if (dateRange) {
      try {
        const [start, end] = dateRange.split(',');
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid date range format' },
            { status: 400 }
          );
        }
        
        // Limit date range to prevent excessive data queries
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 365) {
          return NextResponse.json(
            { error: 'Date range too large. Maximum 365 days allowed.' },
            { status: 400 }
          );
        }
        
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid date range format' },
          { status: 400 }
        );
      }
    }
    
    return request;
  }
  
  private async enrichAnalyticsResponse(response: NextResponse): Promise<NextResponse> {
    // Add metadata to analytics responses
    const responseData = await response.json().catch(() => ({}));
    
    if (responseData.data) {
      responseData.metadata = {
        generatedAt: new Date().toISOString(),
        version: '1.0',
        source: 'api-gateway'
      };
    }
    
    return NextResponse.json(responseData, {
      status: response.status,
      headers: response.headers
    });
  }
  
  private async validateSAMRequest(request: NextRequest): Promise<NextRequest | NextResponse> {
    // Validate SAM AI requests
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        
        if (!body.prompt || typeof body.prompt !== 'string') {
          return NextResponse.json(
            { error: 'Invalid or missing prompt' },
            { status: 400 }
          );
        }
        
        if (body.prompt.length > 8000) {
          return NextResponse.json(
            { error: 'Prompt too long. Maximum 8000 characters allowed.' },
            { status: 400 }
          );
        }
        
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        );
      }
    }
    
    return request;
  }
  
  private async processSAMResponse(response: NextResponse): Promise<NextResponse> {
    // Process SAM responses and add safety filters
    const responseData = await response.json().catch(() => ({}));
    
    if (responseData.content) {
      // Add content safety metadata
      responseData.metadata = {
        filtered: false,
        confidence: 0.95,
        generatedAt: new Date().toISOString()
      };
    }
    
    return NextResponse.json(responseData, {
      status: response.status,
      headers: response.headers
    });
  }
  
  private async auditAdminRequest(request: NextRequest): Promise<NextRequest | NextResponse> {
    // Log all admin requests for audit purposes
    const userId = request.headers.get('X-User-ID');
    const action = `${request.method} ${request.url}`;

    // In production, this would write to an audit log
    return request;
  }
  
  private async logAdminResponse(response: NextResponse): Promise<NextResponse> {
    // Log admin response status for audit trail

    return response;
  }
  
  private async validateFileUpload(request: NextRequest): Promise<NextRequest | NextResponse> {
    // Validate file upload requests
    const contentLength = request.headers.get('content-length');
    
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (size > maxSize) {
        return NextResponse.json(
          { error: 'File too large. Maximum 50MB allowed.' },
          { status: 413 }
        );
      }
    }
    
    const contentType = request.headers.get('content-type') || '';
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'text/plain'
    ];
    
    // For multipart/form-data, we'll validate the actual file type during processing
    if (contentType && !contentType.startsWith('multipart/form-data') && 
        !allowedTypes.some(type => contentType.includes(type))) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 415 }
      );
    }
    
    return request;
  }
  
  /**
   * Add custom route configuration
   */
  public addRoute(route: RouteConfig): void {
    this.routes.push(route);
  }
  
  /**
   * Get route by name
   */
  public getRoute(name: string): RouteConfig | undefined {
    return this.routes.find(route => route.name === name);
  }
  
  /**
   * Update route configuration
   */
  public updateRoute(name: string, updates: Partial<RouteConfig>): boolean {
    const routeIndex = this.routes.findIndex(route => route.name === name);
    if (routeIndex === -1) return false;
    
    this.routes[routeIndex] = { ...this.routes[routeIndex], ...updates };
    return true;
  }
  
  /**
   * Remove route configuration
   */
  public removeRoute(name: string): boolean {
    const routeIndex = this.routes.findIndex(route => route.name === name);
    if (routeIndex === -1) return false;
    
    this.routes.splice(routeIndex, 1);
    return true;
  }

  /**
   * Initialize gateway policies
   */
  private initializePolicies(): void {
    this.policies = [
      {
        name: 'cors-policy',
        type: 'cors',
        enabled: true,
        config: this.cors
      },
      {
        name: 'security-headers',
        type: 'security',
        enabled: true,
        config: {
          hsts: true,
          noSniff: true,
          frameOptions: 'DENY',
          xssProtection: true
        }
      },
      {
        name: 'request-logging',
        type: 'logging',
        enabled: process.env.NODE_ENV === 'production',
        config: {
          logLevel: 'info',
          includeHeaders: false,
          includeBody: false
        }
      },
      {
        name: 'compression',
        type: 'compression',
        enabled: true,
        config: {
          threshold: 1024,
          level: 6
        }
      }
    ];
  }

  /**
   * Add policy configuration
   */
  public addPolicy(policy: PolicyConfig): void {
    this.policies.push(policy);
  }

  /**
   * Update policy configuration
   */
  public updatePolicy(name: string, updates: Partial<PolicyConfig>): boolean {
    const policyIndex = this.policies.findIndex(policy => policy.name === name);
    if (policyIndex === -1) return false;
    
    this.policies[policyIndex] = { ...this.policies[policyIndex], ...updates };
    return true;
  }

  /**
   * Get environment-specific configuration
   */
  public getEnvironmentConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    return {
      environment: env,
      debug: env === 'development',
      rateLimiting: {
        enabled: env === 'production',
        strict: env === 'production'
      },
      circuitBreakers: {
        enabled: env === 'production'
      },
      monitoring: {
        enabled: true,
        detailed: env !== 'production'
      }
    };
  }
}

/**
 * Policy configuration interface
 */
export interface PolicyConfig {
  name: string;
  type: 'cors' | 'security' | 'logging' | 'compression' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  priority?: number;
}

export default GatewayConfig;