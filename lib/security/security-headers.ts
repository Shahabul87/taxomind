import { NextRequest, NextResponse } from 'next/server';

/**
 * Enterprise Security Headers Configuration for Taxomind LMS
 * 
 * Features:
 * - Content Security Policy (CSP) with strict configuration
 * - HTTP Strict Transport Security (HSTS)
 * - X-Frame-Options protection
 * - X-Content-Type-Options protection
 * - XSS protection headers
 * - Referrer Policy configuration
 * - CORS configuration
 * - Permissions Policy for modern browsers
 * - Feature Policy for legacy browsers
 * 
 * @example
 * ```typescript
 * import { SecurityHeaders } from '@/lib/security/security-headers';
 * 
 * // In your middleware or API routes
 * const securityHeaders = new SecurityHeaders({
 *   environment: 'production',
 *   allowInlineStyles: false
 * });
 * 
 * const response = NextResponse.next();
 * securityHeaders.apply(response);
 * ```
 */

export interface CSPDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'frame-src'?: string[];
  'frame-ancestors'?: string[];
  'form-action'?: string[];
  'base-uri'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

export interface SecurityHeadersConfig {
  environment: 'development' | 'staging' | 'production';
  allowInlineStyles?: boolean;
  allowInlineScripts?: boolean;
  enableHSTS?: boolean;
  customCSP?: Partial<CSPDirectives>;
  trustedDomains?: string[];
  allowedOrigins?: string[];
  enableFeaturePolicy?: boolean;
  enablePermissionsPolicy?: boolean;
  reportURI?: string;
  reportOnly?: boolean;
}

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  allowCredentials: boolean;
  maxAge?: number;
  exposedHeaders?: string[];
}

export class SecurityHeaders {
  private config: Required<SecurityHeadersConfig>;
  private cspDirectives: CSPDirectives;
  private corsConfig: CORSConfig;

  constructor(config: SecurityHeadersConfig) {
    this.config = {
      environment: config.environment,
      allowInlineStyles: config.allowInlineStyles ?? config.environment === 'development',
      allowInlineScripts: config.allowInlineScripts ?? false,
      enableHSTS: config.enableHSTS ?? config.environment === 'production',
      customCSP: config.customCSP ?? {},
      trustedDomains: config.trustedDomains ?? [],
      allowedOrigins: config.allowedOrigins ?? [],
      enableFeaturePolicy: config.enableFeaturePolicy ?? true,
      enablePermissionsPolicy: config.enablePermissionsPolicy ?? true,
      reportURI: config.reportURI ?? '/api/security/csp-report',
      reportOnly: config.reportOnly ?? config.environment !== 'production',
    };

    this.cspDirectives = this.buildCSPDirectives();
    this.corsConfig = this.buildCORSConfig();
  }

  /**
   * Builds Content Security Policy directives based on configuration
   */
  private buildCSPDirectives(): CSPDirectives {
    const isDev = this.config.environment === 'development';
    const trustedDomains = ["'self'", ...this.config.trustedDomains];

    const baseDirectives: CSPDirectives = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'wasm-unsafe-eval'", // Required for WebAssembly
        'https://js.stripe.com',
        'https://checkout.stripe.com',
        'https://maps.googleapis.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com',
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        ...(isDev ? ["'unsafe-eval'"] : []),
        ...(this.config.allowInlineScripts ? ["'unsafe-inline'"] : []),
      ],
      'style-src': [
        "'self'",
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        ...(this.config.allowInlineStyles ? ["'unsafe-inline'"] : []),
      ],
      'img-src': [
        "'self'",
        'data:',
        'https:',
        'blob:',
        'https://*.stripe.com',
        'https://images.unsplash.com',
        'https://avatars.githubusercontent.com',
        'https://lh3.googleusercontent.com',
        'https://platform-lookaside.fbsbx.com',
        'https://res.cloudinary.com',
        'https://*.cdninstagram.com',
        'https://www.google-analytics.com',
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net',
        'data:',
      ],
      'connect-src': [
        "'self'",
        'https://api.stripe.com',
        'https://maps.googleapis.com',
        'https://www.google-analytics.com',
        'https://analytics.google.com',
        'https://api.openai.com',
        'https://api.anthropic.com',
        'wss://localhost:*', // WebSocket for development
        ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : []),
        ...(this.config.allowedOrigins || []),
      ],
      'media-src': ["'self'", 'https:', 'data:', 'blob:'],
      'object-src': ["'none'"],
      'frame-src': [
        "'self'",
        'https://js.stripe.com',
        'https://checkout.stripe.com',
        'https://www.youtube.com',
        'https://www.vimeo.com',
        'https://player.vimeo.com',
      ],
      'frame-ancestors': ["'none'"], // Prevents embedding in frames
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'upgrade-insecure-requests': !isDev,
      'block-all-mixed-content': !isDev,
    };

    // Merge with custom CSP directives
    const mergedDirectives: CSPDirectives = { ...baseDirectives };
    Object.entries(this.config.customCSP).forEach(([key, value]) => {
      if (value === undefined) return;
      const k = key as keyof CSPDirectives;
      if (typeof value === 'boolean') {
        (mergedDirectives as any)[k] = value;
      } else if (Array.isArray(value)) {
        const existing = (mergedDirectives as any)[k];
        const existingArr: string[] = Array.isArray(existing) ? existing : [];
        (mergedDirectives as any)[k] = [...existingArr, ...value];
      }
    });

    return mergedDirectives;
  }

  /**
   * Builds CORS configuration
   */
  private buildCORSConfig(): CORSConfig {
    const isDev = this.config.environment === 'development';
    
    return {
      allowedOrigins: [
        ...(isDev ? ['http://localhost:3000', 'http://127.0.0.1:3000'] : []),
        ...this.config.allowedOrigins,
      ],
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers',
        'X-CSRF-Token',
        'X-API-Key',
      ],
      allowCredentials: true,
      maxAge: 86400, // 24 hours
      exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    };
  }

  /**
   * Converts CSP directives object to header string
   */
  private buildCSPHeaderValue(): string {
    const directives: string[] = [];

    Object.entries(this.cspDirectives).forEach(([directive, value]) => {
      if (typeof value === 'boolean' && value) {
        directives.push(directive);
      } else if (Array.isArray(value) && value.length > 0) {
        directives.push(`${directive} ${value.join(' ')}`);
      }
    });

    // Add report URI if configured
    if (this.config.reportURI) {
      directives.push(`report-uri ${this.config.reportURI}`);
      directives.push(`report-to csp-endpoint`);
    }

    return directives.join('; ');
  }

  /**
   * Applies security headers to a NextResponse object
   */
  apply(response: NextResponse): NextResponse {
    // Content Security Policy
    const cspHeaderName = this.config.reportOnly 
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
    response.headers.set(cspHeaderName, this.buildCSPHeaderValue());

    // HTTP Strict Transport Security
    if (this.config.enableHSTS && this.config.environment === 'production') {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    }

    // X-Frame-Options
    response.headers.set('X-Frame-Options', 'DENY');

    // X-Content-Type-Options
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // X-XSS-Protection (legacy browsers)
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy (modern browsers)
    if (this.config.enablePermissionsPolicy) {
      const permissionsPolicy = [
        'camera=()', 
        'microphone=()', 
        'geolocation=()',
        'interest-cohort=()', // Disable FLoC
        'payment=(self)',
        'usb=()',
        'serial=()',
        'bluetooth=()',
      ].join(', ');
      response.headers.set('Permissions-Policy', permissionsPolicy);
    }

    // Feature Policy (legacy browsers)
    if (this.config.enableFeaturePolicy) {
      const featurePolicy = [
        "camera 'none'",
        "microphone 'none'",
        "geolocation 'none'",
        "payment 'self'",
      ].join('; ');
      response.headers.set('Feature-Policy', featurePolicy);
    }

    // Remove potentially sensitive headers
    response.headers.set('X-Powered-By', ''); // Remove Express/Node.js info
    response.headers.delete('Server');

    // Security-focused headers
    response.headers.set('X-DNS-Prefetch-Control', 'off');
    response.headers.set('X-Download-Options', 'noopen');
    response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Add custom security headers
    response.headers.set('X-Security-Headers', 'applied');

    return response;
  }

  /**
   * Applies CORS headers to a response
   */
  applyCORS(request: NextRequest, response: NextResponse): NextResponse {
    const origin = request.headers.get('origin');
    const isAllowedOrigin = !origin || 
      this.corsConfig.allowedOrigins.includes('*') || 
      this.corsConfig.allowedOrigins.includes(origin);

    if (isAllowedOrigin && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (this.corsConfig.allowCredentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    response.headers.set(
      'Access-Control-Allow-Methods',
      this.corsConfig.allowedMethods.join(', ')
    );

    response.headers.set(
      'Access-Control-Allow-Headers',
      this.corsConfig.allowedHeaders.join(', ')
    );

    if (this.corsConfig.maxAge) {
      response.headers.set('Access-Control-Max-Age', this.corsConfig.maxAge.toString());
    }

    if (this.corsConfig.exposedHeaders && this.corsConfig.exposedHeaders.length > 0) {
      response.headers.set(
        'Access-Control-Expose-Headers',
        this.corsConfig.exposedHeaders.join(', ')
      );
    }

    return response;
  }

  /**
   * Handles CORS preflight requests
   */
  handlePreflightRequest(request: NextRequest): NextResponse {
    const response = new NextResponse(null, { status: 204 });
    return this.applyCORS(request, response);
  }

  /**
   * Validates if request origin is allowed
   */
  isOriginAllowed(origin: string | null): boolean {
    if (!origin) return true; // Same-origin requests
    return this.corsConfig.allowedOrigins.includes('*') || 
           this.corsConfig.allowedOrigins.includes(origin);
  }

  /**
   * Creates a report endpoint configuration for CSP violations
   */
  getReportToHeader(): string {
    if (!this.config.reportURI) return '';
    
    return JSON.stringify({
      group: 'csp-endpoint',
      max_age: 10886400, // 126 days
      endpoints: [{
        url: this.config.reportURI,
      }],
    });
  }

  /**
   * Validates security configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for insecure CSP directives in production
    if (this.config.environment === 'production') {
      const scriptSrc = this.cspDirectives['script-src'] || [];
      if (scriptSrc.includes("'unsafe-inline'")) {
        errors.push("'unsafe-inline' in script-src is not recommended for production");
      }
      if (scriptSrc.includes("'unsafe-eval'")) {
        errors.push("'unsafe-eval' in script-src is not recommended for production");
      }
    }

    // Validate allowed origins format
    this.config.allowedOrigins.forEach(origin => {
      try {
        if (origin !== '*') {
          new URL(origin);
        }
      } catch {
        errors.push(`Invalid origin format: ${origin}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Gets current configuration
   */
  getConfiguration() {
    return {
      ...this.config,
      cspDirectives: this.cspDirectives,
      corsConfig: this.corsConfig,
    };
  }
}

/**
 * Pre-configured security headers for different environments
 */
export const SecurityHeadersPresets = {
  /**
   * Development configuration with relaxed policies
   */
  development: new SecurityHeaders({
    environment: 'development',
    allowInlineStyles: true,
    allowInlineScripts: false,
    enableHSTS: false,
    reportOnly: true,
  }),

  /**
   * Staging configuration with moderate security
   */
  staging: new SecurityHeaders({
    environment: 'staging',
    allowInlineStyles: false,
    allowInlineScripts: false,
    enableHSTS: true,
    reportOnly: true,
  }),

  /**
   * Production configuration with strict security
   */
  production: new SecurityHeaders({
    environment: 'production',
    allowInlineStyles: false,
    allowInlineScripts: false,
    enableHSTS: true,
    reportOnly: false,
  }),
};

/**
 * Utility functions for security headers
 */
export const SecurityHeadersUtils = {
  /**
   * Creates nonce for inline scripts and styles
   */
  generateNonce(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Validates CSP directive format
   */
  validateCSPDirective(directive: string): boolean {
    const validDirectives = [
      'default-src', 'script-src', 'style-src', 'img-src', 'font-src',
      'connect-src', 'media-src', 'object-src', 'frame-src', 'frame-ancestors',
      'form-action', 'base-uri', 'upgrade-insecure-requests', 'block-all-mixed-content'
    ];
    return validDirectives.includes(directive);
  },

  /**
   * Parses CSP header value into directives object
   */
  parseCSPHeader(headerValue: string): Record<string, string[]> {
    const directives: Record<string, string[]> = {};
    const parts = headerValue.split(';').map(part => part.trim());
    
    parts.forEach(part => {
      const [directive, ...values] = part.split(' ');
      if (directive && values.length > 0) {
        directives[directive] = values;
      }
    });
    
    return directives;
  },

  /**
   * Checks if CSP allows unsafe inline content
   */
  hasUnsafeInline(cspHeader: string, directive: string = 'script-src'): boolean {
    const directives = this.parseCSPHeader(cspHeader);
    const sources = directives[directive] || [];
    return sources.includes("'unsafe-inline'");
  },
};

export default SecurityHeaders;

/**
 * Environment variables for security headers:
 * 
 * SECURITY_ENVIRONMENT=production (required)
 * CSP_REPORT_URI=/api/security/csp-report (optional)
 * CSP_REPORT_ONLY=false (optional, defaults based on environment)
 * TRUSTED_DOMAINS=domain1.com,domain2.com (optional)
 * ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com (optional)
 * 
 * Example .env entries:
 * SECURITY_ENVIRONMENT=production
 * CSP_REPORT_URI=/api/security/csp-violations
 * TRUSTED_DOMAINS=taxomind.com,api.taxomind.com
 * ALLOWED_ORIGINS=https://app.taxomind.com,https://admin.taxomind.com
 */