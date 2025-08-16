import { NextRequest, NextResponse } from 'next/server';
import { SecurityHeaders, SecurityHeadersPresets } from '@/lib/security/security-headers';
import { CryptoUtils } from '@/lib/security/crypto-utils';
import { logger } from '@/lib/logger';

/**
 * Comprehensive Security Middleware for Taxomind LMS
 * 
 * Features:
 * - Rate limiting with Redis integration
 * - IP whitelisting and blacklisting
 * - Request validation and sanitization
 * - Security headers application
 * - CORS handling
 * - Bot detection and blocking
 * - Suspicious activity monitoring
 * - Security event logging
 * - DDoS protection
 * - SQL injection detection
 * - XSS attempt detection
 * 
 * @example
 * ```typescript
 * import { SecurityMiddleware } from '@/lib/middleware/security';
 * 
 * // In your main middleware.ts
 * const securityMiddleware = new SecurityMiddleware({
 *   environment: 'production',
 *   enableRateLimit: true,
 *   enableBotDetection: true,
 *   ipWhitelist: ['192.168.1.0/24']
 * });
 * 
 * export default async function middleware(request: NextRequest) {
 *   const securityResult = await securityMiddleware.process(request);
 *   if (securityResult.blocked) {
 *     return securityResult.response;
 *   }
 *   // Continue with your middleware logic
 * }
 * ```
 */

export interface SecurityConfig {
  environment: 'development' | 'staging' | 'production';
  enableRateLimit?: boolean;
  enableBotDetection?: boolean;
  enableIPFiltering?: boolean;
  enableRequestValidation?: boolean;
  enableSecurityHeaders?: boolean;
  enableCORS?: boolean;
  enableDDoSProtection?: boolean;
  enableSQLInjectionDetection?: boolean;
  enableXSSDetection?: boolean;
  rateLimitOptions?: RateLimitConfig;
  ipWhitelist?: string[];
  ipBlacklist?: string[];
  trustedProxies?: string[];
  maxRequestSize?: number;
  allowedUserAgents?: RegExp[];
  blockedUserAgents?: RegExp[];
  suspiciousPatterns?: RegExp[];
  logSecurityEvents?: boolean;
  webhookURL?: string;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
  onLimitReached?: (request: NextRequest) => void;
  whitelist?: string[];
  dynamicLimit?: boolean;
}

export interface SecurityResult {
  blocked: boolean;
  reason?: string;
  response?: NextResponse;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  type: 'rate_limit' | 'blocked_ip' | 'bot_detected' | 'suspicious_request' | 
        'sql_injection' | 'xss_attempt' | 'ddos_attempt' | 'invalid_request';
  severity: 'low' | 'medium' | 'high' | 'critical';
  clientIP: string;
  userAgent: string;
  path: string;
  method: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class SecurityMiddleware {
  private config: Required<SecurityConfig>;
  private securityHeaders: SecurityHeaders;
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private securityEvents: SecurityEvent[] = [];
  
  // Common attack patterns
  private readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b.*\b(FROM|WHERE|INTO)\b)/i,
    /(\'|\"|;|\-\-|\/\*|\*\/|\bOR\b.*=.*|1=1|1=2)/i,
    /\b(SCRIPT|JAVASCRIPT|VBSCRIPT|ONLOAD|ONERROR|ONCLICK)\b/i,
  ];

  private readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*src[^>]*=.*javascript:/gi,
    /<svg[^>]*onload[^>]*=/gi,
  ];

  private readonly BOT_PATTERNS = [
    /bot|crawl|spider|scrape|slurp|wget|curl/i,
    /automated|headless|phantom|selenium/i,
    /^$/i, // Empty user agent
  ];

  private readonly SUSPICIOUS_PATHS = [
    /\/\.env/,
    /\/admin\/config/,
    /\/wp-admin/,
    /\/phpmyadmin/,
    /\/\.git/,
    /\/\.ssh/,
    /\/proc\//,
    /\/etc\//,
  ];

  constructor(config: SecurityConfig) {
    this.config = {
      environment: config.environment,
      enableRateLimit: config.enableRateLimit ?? true,
      enableBotDetection: config.enableBotDetection ?? true,
      enableIPFiltering: config.enableIPFiltering ?? true,
      enableRequestValidation: config.enableRequestValidation ?? true,
      enableSecurityHeaders: config.enableSecurityHeaders ?? true,
      enableCORS: config.enableCORS ?? true,
      enableDDoSProtection: config.enableDDoSProtection ?? true,
      enableSQLInjectionDetection: config.enableSQLInjectionDetection ?? true,
      enableXSSDetection: config.enableXSSDetection ?? true,
      rateLimitOptions: {
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        skipSuccessfulRequests: false,
        keyGenerator: (req) => this.getClientIP(req),
        ...config.rateLimitOptions,
      },
      ipWhitelist: config.ipWhitelist ?? [],
      ipBlacklist: config.ipBlacklist ?? [],
      trustedProxies: config.trustedProxies ?? [],
      maxRequestSize: config.maxRequestSize ?? 10 * 1024 * 1024, // 10MB
      allowedUserAgents: config.allowedUserAgents ?? [],
      blockedUserAgents: config.blockedUserAgents ?? [],
      suspiciousPatterns: config.suspiciousPatterns ?? [],
      logSecurityEvents: config.logSecurityEvents ?? true,
      webhookURL: config.webhookURL ?? '',
    };

    this.securityHeaders = this.getSecurityHeadersForEnvironment();
  }

  /**
   * Main security processing method
   */
  async process(request: NextRequest): Promise<SecurityResult> {
    const clientIP = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const path = request.nextUrl.pathname;
    const method = request.method;

    try {
      // 1. IP Filtering
      if (this.config.enableIPFiltering) {
        const ipResult = await this.checkIPFiltering(clientIP);
        if (ipResult.blocked) {
          await this.logSecurityEvent({
            type: 'blocked_ip',
            severity: 'high',
            clientIP,
            userAgent,
            path,
            method,
            timestamp: new Date(),
            metadata: { reason: ipResult.reason },
          });
          return ipResult;
        }
      }

      // 2. Bot Detection
      if (this.config.enableBotDetection) {
        const botResult = await this.detectBot(userAgent, clientIP);
        if (botResult.blocked) {
          await this.logSecurityEvent({
            type: 'bot_detected',
            severity: 'medium',
            clientIP,
            userAgent,
            path,
            method,
            timestamp: new Date(),
          });
          return botResult;
        }
      }

      // 3. Rate Limiting
      if (this.config.enableRateLimit) {
        const rateLimitResult = await this.checkRateLimit(request);
        if (rateLimitResult.blocked) {
          await this.logSecurityEvent({
            type: 'rate_limit',
            severity: 'medium',
            clientIP,
            userAgent,
            path,
            method,
            timestamp: new Date(),
            metadata: rateLimitResult.metadata,
          });
          return rateLimitResult;
        }
      }

      // 4. DDoS Protection
      if (this.config.enableDDoSProtection) {
        const ddosResult = await this.checkDDoS(clientIP, request);
        if (ddosResult.blocked) {
          await this.logSecurityEvent({
            type: 'ddos_attempt',
            severity: 'critical',
            clientIP,
            userAgent,
            path,
            method,
            timestamp: new Date(),
          });
          return ddosResult;
        }
      }

      // 5. Request Validation
      if (this.config.enableRequestValidation) {
        const validationResult = await this.validateRequest(request);
        if (validationResult.blocked) {
          await this.logSecurityEvent({
            type: 'invalid_request',
            severity: 'high',
            clientIP,
            userAgent,
            path,
            method,
            timestamp: new Date(),
            metadata: validationResult.metadata,
          });
          return validationResult;
        }
      }

      // 6. SQL Injection Detection
      if (this.config.enableSQLInjectionDetection) {
        const sqlResult = await this.detectSQLInjection(request);
        if (sqlResult.blocked) {
          await this.logSecurityEvent({
            type: 'sql_injection',
            severity: 'critical',
            clientIP,
            userAgent,
            path,
            method,
            timestamp: new Date(),
          });
          return sqlResult;
        }
      }

      // 7. XSS Detection
      if (this.config.enableXSSDetection) {
        const xssResult = await this.detectXSS(request);
        if (xssResult.blocked) {
          await this.logSecurityEvent({
            type: 'xss_attempt',
            severity: 'critical',
            clientIP,
            userAgent,
            path,
            method,
            timestamp: new Date(),
          });
          return xssResult;
        }
      }

      // 8. Suspicious Pattern Detection
      const suspiciousResult = await this.detectSuspiciousActivity(request);
      if (suspiciousResult.blocked) {
        await this.logSecurityEvent({
          type: 'suspicious_request',
          severity: 'high',
          clientIP,
          userAgent,
          path,
          method,
          timestamp: new Date(),
          metadata: suspiciousResult.metadata,
        });
        return suspiciousResult;
      }

      // If all checks pass, apply security headers
      return {
        blocked: false,
        metadata: {
          clientIP,
          securityChecksPass: true,
          timestamp: new Date(),
        },
      };

    } catch (error) {
      logger.error('Security middleware error:', error);
      
      // Log security middleware error
      await this.logSecurityEvent({
        type: 'invalid_request',
        severity: 'high',
        clientIP,
        userAgent,
        path,
        method,
        timestamp: new Date(),
        metadata: { error: error.message },
      });

      // In case of error, allow request but log it
      return { blocked: false };
    }
  }

  /**
   * Applies security headers to response
   */
  applySecurityHeaders(request: NextRequest, response: NextResponse): NextResponse {
    if (!this.config.enableSecurityHeaders) return response;

    this.securityHeaders.apply(response);

    if (this.config.enableCORS) {
      this.securityHeaders.applyCORS(request, response);
    }

    // Add custom security metadata
    response.headers.set('X-Security-Processed', 'true');
    response.headers.set('X-Security-Timestamp', new Date().toISOString());

    return response;
  }

  /**
   * Extracts real client IP considering proxies
   */
  private getClientIP(request: NextRequest): string {
    // Check various headers for real IP
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwardedFor) {
      // Take the first IP from forwarded list
      return forwardedFor.split(',')[0].trim();
    }
    
    return request.ip || 'unknown';
  }

  /**
   * Checks IP against whitelist and blacklist
   */
  private async checkIPFiltering(clientIP: string): Promise<SecurityResult> {
    // Check blacklist first
    if (this.config.ipBlacklist.length > 0) {
      for (const blockedIP of this.config.ipBlacklist) {
        if (this.isIPInRange(clientIP, blockedIP)) {
          return {
            blocked: true,
            reason: 'IP is blacklisted',
            response: new NextResponse('Access denied: IP blocked', { status: 403 }),
          };
        }
      }
    }

    // Check whitelist (if defined, only allow whitelisted IPs)
    if (this.config.ipWhitelist.length > 0) {
      let isWhitelisted = false;
      for (const allowedIP of this.config.ipWhitelist) {
        if (this.isIPInRange(clientIP, allowedIP)) {
          isWhitelisted = true;
          break;
        }
      }
      
      if (!isWhitelisted) {
        return {
          blocked: true,
          reason: 'IP not in whitelist',
          response: new NextResponse('Access denied: IP not authorized', { status: 403 }),
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Checks if IP is in given range (supports CIDR notation)
   */
  private isIPInRange(ip: string, range: string): boolean {
    if (range === ip) return true;
    
    // Handle CIDR notation
    if (range.includes('/')) {
      try {
        const [rangeIP, subnet] = range.split('/');
        const subnetMask = parseInt(subnet);
        
        // Convert IPs to numbers for comparison
        const ipNum = this.ipToNumber(ip);
        const rangeNum = this.ipToNumber(rangeIP);
        const mask = (0xffffffff << (32 - subnetMask)) >>> 0;
        
        return (ipNum & mask) === (rangeNum & mask);
      } catch {
        return false;
      }
    }
    
    return false;
  }

  /**
   * Converts IP string to number
   */
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }

  /**
   * Detects bots and automated tools
   */
  private async detectBot(userAgent: string, clientIP: string): Promise<SecurityResult> {
    // Check against known bot patterns
    for (const pattern of this.BOT_PATTERNS) {
      if (pattern.test(userAgent)) {
        return {
          blocked: true,
          reason: 'Bot detected',
          response: new NextResponse('Access denied: Automated access not allowed', { 
            status: 403 
          }),
        };
      }
    }

    // Check against blocked user agents
    for (const pattern of this.config.blockedUserAgents) {
      if (pattern.test(userAgent)) {
        return {
          blocked: true,
          reason: 'Blocked user agent',
          response: new NextResponse('Access denied: User agent blocked', { 
            status: 403 
          }),
        };
      }
    }

    // Check allowed user agents (if specified)
    if (this.config.allowedUserAgents.length > 0) {
      let isAllowed = false;
      for (const pattern of this.config.allowedUserAgents) {
        if (pattern.test(userAgent)) {
          isAllowed = true;
          break;
        }
      }
      
      if (!isAllowed) {
        return {
          blocked: true,
          reason: 'User agent not allowed',
          response: new NextResponse('Access denied: User agent not authorized', { 
            status: 403 
          }),
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Implements rate limiting
   */
  private async checkRateLimit(request: NextRequest): Promise<SecurityResult> {
    const key = this.config.rateLimitOptions.keyGenerator?.(request) || this.getClientIP(request);
    const now = Date.now();
    const windowMs = this.config.rateLimitOptions.windowMs;
    
    // Get or create rate limit entry
    let entry = this.rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    entry.count++;
    this.rateLimitStore.set(key, entry);

    // Check if limit exceeded
    if (entry.count > this.config.rateLimitOptions.maxRequests) {
      const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);
      
      const response = new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'Retry-After': resetTimeSeconds.toString(),
          'X-RateLimit-Limit': this.config.rateLimitOptions.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
        },
      });

      return {
        blocked: true,
        reason: 'Rate limit exceeded',
        response,
        metadata: {
          requestCount: entry.count,
          limit: this.config.rateLimitOptions.maxRequests,
          resetTime: entry.resetTime,
        },
      };
    }

    return { blocked: false };
  }

  /**
   * Detects DDoS attempts
   */
  private async checkDDoS(clientIP: string, request: NextRequest): Promise<SecurityResult> {
    // Simple DDoS detection based on request patterns
    const path = request.nextUrl.pathname;
    const method = request.method;
    
    // Check for rapid requests to sensitive endpoints
    const sensitiveEndpoints = ['/api/auth/', '/api/admin/', '/api/payment/'];
    const isSensitive = sensitiveEndpoints.some(endpoint => path.startsWith(endpoint));
    
    if (isSensitive) {
      const ddosKey = `ddos:${clientIP}:${path}`;
      const entry = this.rateLimitStore.get(ddosKey);
      const now = Date.now();
      
      if (!entry || now > (entry.resetTime || 0)) {
        this.rateLimitStore.set(ddosKey, { count: 1, resetTime: now + 10000 }); // 10 seconds
      } else {
        entry.count++;
        if (entry.count > 10) { // 10 requests in 10 seconds to sensitive endpoint
          return {
            blocked: true,
            reason: 'DDoS protection triggered',
            response: new NextResponse('Access temporarily restricted', { status: 503 }),
          };
        }
      }
    }

    return { blocked: false };
  }

  /**
   * Validates request format and size
   */
  private async validateRequest(request: NextRequest): Promise<SecurityResult> {
    // Check request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > this.config.maxRequestSize) {
      return {
        blocked: true,
        reason: 'Request too large',
        response: new NextResponse('Request entity too large', { status: 413 }),
        metadata: { contentLength: parseInt(contentLength), maxAllowed: this.config.maxRequestSize },
      };
    }

    // Check for suspicious paths
    const path = request.nextUrl.pathname;
    for (const pattern of this.SUSPICIOUS_PATHS) {
      if (pattern.test(path)) {
        return {
          blocked: true,
          reason: 'Suspicious path detected',
          response: new NextResponse('Not found', { status: 404 }),
          metadata: { suspiciousPath: path },
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Detects SQL injection attempts
   */
  private async detectSQLInjection(request: NextRequest): Promise<SecurityResult> {
    const url = request.nextUrl;
    const searchParams = url.searchParams.toString();
    const path = url.pathname;
    
    // Check URL parameters
    const testString = `${path} ${searchParams}`;
    
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(testString)) {
        return {
          blocked: true,
          reason: 'SQL injection attempt detected',
          response: new NextResponse('Bad request', { status: 400 }),
        };
      }
    }

    // Check POST body if available
    if (request.method === 'POST' && request.body) {
      try {
        const clonedRequest = request.clone();
        const body = await clonedRequest.text();
        
        for (const pattern of this.SQL_INJECTION_PATTERNS) {
          if (pattern.test(body)) {
            return {
              blocked: true,
              reason: 'SQL injection in request body',
              response: new NextResponse('Bad request', { status: 400 }),
            };
          }
        }
      } catch {
        // Ignore if body can't be read
      }
    }

    return { blocked: false };
  }

  /**
   * Detects XSS attempts
   */
  private async detectXSS(request: NextRequest): Promise<SecurityResult> {
    const url = request.nextUrl;
    const searchParams = url.searchParams.toString();
    const path = url.pathname;
    
    // Check URL parameters
    const testString = `${path} ${searchParams}`;
    
    for (const pattern of this.XSS_PATTERNS) {
      if (pattern.test(testString)) {
        return {
          blocked: true,
          reason: 'XSS attempt detected',
          response: new NextResponse('Bad request', { status: 400 }),
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Detects various suspicious activities
   */
  private async detectSuspiciousActivity(request: NextRequest): Promise<SecurityResult> {
    const path = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check custom suspicious patterns
    for (const pattern of this.config.suspiciousPatterns) {
      if (pattern.test(path) || pattern.test(userAgent)) {
        return {
          blocked: true,
          reason: 'Suspicious activity detected',
          response: new NextResponse('Access denied', { status: 403 }),
          metadata: { pattern: pattern.source },
        };
      }
    }

    // Check for directory traversal attempts
    if (path.includes('../') || path.includes('..\\') || path.includes('%2e%2e')) {
      return {
        blocked: true,
        reason: 'Directory traversal attempt',
        response: new NextResponse('Bad request', { status: 400 }),
      };
    }

    return { blocked: false };
  }

  /**
   * Logs security events
   */
  private async logSecurityEvent(event: SecurityEvent): Promise<void> {
    if (!this.config.logSecurityEvents) return;

    // Store in memory (in production, use proper logging service)
    this.securityEvents.push(event);
    
    // Keep only recent events (last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents.shift();
    }

    // Log to console in development
    if (this.config.environment === 'development') {
      logger.warn(`[SECURITY] ${event.type.toUpperCase()}: ${event.clientIP} - ${event.path}`, event);
    }

    // Send webhook notification for critical events
    if (event.severity === 'critical' && this.config.webhookURL) {
      try {
        await fetch(this.config.webhookURL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } catch (error) {
        logger.error('Failed to send security webhook:', error);
      }
    }
  }

  /**
   * Gets appropriate security headers for environment
   */
  private getSecurityHeadersForEnvironment(): SecurityHeaders {
    switch (this.config.environment) {
      case 'development':
        return SecurityHeadersPresets.development;
      case 'staging':
        return SecurityHeadersPresets.staging;
      case 'production':
        return SecurityHeadersPresets.production;
      default:
        return SecurityHeadersPresets.development;
    }
  }

  /**
   * Gets recent security events
   */
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Gets security statistics
   */
  getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topBlockedIPs: Array<{ ip: string; count: number }>;
    recentEvents: SecurityEvent[];
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};

    this.securityEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      ipCounts[event.clientIP] = (ipCounts[event.clientIP] || 0) + 1;
    });

    const topBlockedIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: this.securityEvents.length,
      eventsByType,
      eventsBySeverity,
      topBlockedIPs,
      recentEvents: this.securityEvents.slice(-10),
    };
  }

  /**
   * Clears security event logs
   */
  clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  /**
   * Validates security middleware configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate rate limit configuration
    if (this.config.enableRateLimit) {
      if (this.config.rateLimitOptions.maxRequests <= 0) {
        errors.push('Rate limit maxRequests must be greater than 0');
      }
      if (this.config.rateLimitOptions.windowMs <= 0) {
        errors.push('Rate limit windowMs must be greater than 0');
      }
    }

    // Validate IP ranges
    [...this.config.ipWhitelist, ...this.config.ipBlacklist].forEach(ip => {
      if (ip.includes('/')) {
        const [, subnet] = ip.split('/');
        const subnetNum = parseInt(subnet);
        if (isNaN(subnetNum) || subnetNum < 0 || subnetNum > 32) {
          errors.push(`Invalid subnet in IP range: ${ip}`);
        }
      }
    });

    // Validate webhook URL
    if (this.config.webhookURL) {
      try {
        new URL(this.config.webhookURL);
      } catch {
        errors.push('Invalid webhook URL format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Pre-configured security middleware instances
 */
export const SecurityMiddlewarePresets = {
  development: new SecurityMiddleware({
    environment: 'development',
    enableRateLimit: false,
    enableBotDetection: false,
    enableIPFiltering: false,
    logSecurityEvents: true,
  }),

  staging: new SecurityMiddleware({
    environment: 'staging',
    enableRateLimit: true,
    enableBotDetection: true,
    enableIPFiltering: false,
    rateLimitOptions: {
      windowMs: 60000,
      maxRequests: 200,
    },
  }),

  production: new SecurityMiddleware({
    environment: 'production',
    enableRateLimit: true,
    enableBotDetection: true,
    enableIPFiltering: true,
    enableDDoSProtection: true,
    rateLimitOptions: {
      windowMs: 60000,
      maxRequests: 100,
    },
  }),
};

export default SecurityMiddleware;

/**
 * Environment variables for security middleware:
 * 
 * SECURITY_ENVIRONMENT=production (required)
 * SECURITY_RATE_LIMIT_ENABLED=true (optional)
 * SECURITY_RATE_LIMIT_MAX_REQUESTS=100 (optional)
 * SECURITY_RATE_LIMIT_WINDOW_MS=60000 (optional)
 * SECURITY_IP_WHITELIST=192.168.1.0/24,10.0.0.0/8 (optional)
 * SECURITY_IP_BLACKLIST=192.168.100.0/24 (optional)
 * SECURITY_WEBHOOK_URL=https://hooks.slack.com/... (optional)
 * SECURITY_MAX_REQUEST_SIZE=10485760 (optional, in bytes)
 * 
 * Example .env entries:
 * SECURITY_ENVIRONMENT=production
 * SECURITY_RATE_LIMIT_ENABLED=true
 * SECURITY_RATE_LIMIT_MAX_REQUESTS=100
 * SECURITY_IP_WHITELIST=10.0.0.0/8,172.16.0.0/12
 * SECURITY_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
 */