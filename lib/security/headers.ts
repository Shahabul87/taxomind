import { NextResponse } from 'next/server';

/**
 * Security Headers Configuration for Taxomind LMS
 * Environment-aware security headers implementation
 */

export interface SecurityHeadersOptions {
  environment?: 'development' | 'staging' | 'production';
  enableHSTS?: boolean;
  enableCSP?: boolean;
  strictCSP?: boolean;
  reportOnly?: boolean;
}

/**
 * Gets comprehensive security headers based on environment
 */
export function getSecurityHeaders(options: SecurityHeadersOptions = {}): Record<string, string> {
  const {
    environment = process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development',
    enableHSTS = environment === 'production',
    enableCSP = true,
    strictCSP = environment === 'production',
    reportOnly = environment !== 'production',
  } = options;

  const isDev = environment === 'development';
  const isProd = environment === 'production';

  const headers: Record<string, string> = {
    // Prevent page from being embedded in frames (clickjacking protection)
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Referrer policy for privacy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // XSS Protection for legacy browsers
    'X-XSS-Protection': '1; mode=block',

    // Remove server information
    'X-Powered-By': '',

    // Disable DNS prefetching for privacy
    'X-DNS-Prefetch-Control': 'off',

    // Prevent downloads from opening automatically
    'X-Download-Options': 'noopen',

    // Restrict cross-domain policies
    'X-Permitted-Cross-Domain-Policies': 'none',
  };

  // HTTP Strict Transport Security (HSTS) - Production only
  if (enableHSTS && isProd) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  // Content Security Policy
  if (enableCSP) {
    const cspDirectives = buildCSPDirectives({ isDev, strictCSP });
    const cspHeaderName = reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
    headers[cspHeaderName] = cspDirectives;
  }

  // Permissions Policy for modern browsers
  if (isProd) {
    headers['Permissions-Policy'] = [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()', // Disable FLoC
      'payment=(self)',
      'usb=()',
      'serial=()',
      'bluetooth=()',
    ].join(', ');
  }

  // Add environment indicator (non-sensitive)
  headers['X-Environment'] = environment;

  return headers;
}

/**
 * Builds Content Security Policy directives
 */
function buildCSPDirectives({ isDev, strictCSP }: { isDev: boolean; strictCSP: boolean }): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    
    'script-src': [
      "'self'",
      "'wasm-unsafe-eval'", // Required for WebAssembly
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://cdn.jsdelivr.net',
      ...(isDev ? ["'unsafe-eval'"] : []),
      ...(isDev || !strictCSP ? ["'unsafe-inline'"] : []),
    ],

    'style-src': [
      "'self'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net',
      ...(isDev || !strictCSP ? ["'unsafe-inline'"] : []),
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
      'https://res.cloudinary.com',
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
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://api.openai.com',
      'https://api.anthropic.com',
      ...(isDev ? ['ws://localhost:*', 'http://localhost:*'] : []),
      'wss://localhost:*',
    ],

    'media-src': ["'self'", 'https:', 'data:', 'blob:'],
    'object-src': ["'none'"],
    
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      'https://www.youtube.com',
      'https://player.vimeo.com',
    ],

    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
  };

  // Build CSP string
  const cspParts: string[] = [];
  
  Object.entries(directives).forEach(([directive, sources]) => {
    cspParts.push(`${directive} ${sources.join(' ')}`);
  });

  // Add boolean directives for production
  if (!isDev) {
    cspParts.push('upgrade-insecure-requests');
    cspParts.push('block-all-mixed-content');
  }

  // Add reporting endpoint
  const reportURI = process.env.CSP_REPORT_URI || '/api/security/csp-report';
  cspParts.push(`report-uri ${reportURI}`);

  return cspParts.join('; ');
}

/**
 * Applies security headers to NextResponse
 */
export function applySecurityHeaders(
  response: NextResponse, 
  options: SecurityHeadersOptions = {}
): NextResponse {
  const headers = getSecurityHeaders(options);
  
  Object.entries(headers).forEach(([name, value]) => {
    if (value) {
      response.headers.set(name, value);
    } else {
      response.headers.delete(name);
    }
  });

  return response;
}

/**
 * Creates a NextResponse with security headers applied
 */
export function createSecureResponse(
  body?: BodyInit | null, 
  init?: ResponseInit,
  options: SecurityHeadersOptions = {}
): NextResponse {
  const response = new NextResponse(body, init);
  return applySecurityHeaders(response, options);
}

/**
 * Environment-aware security headers presets
 */
export const SecurityHeadersPresets = {
  development: () => getSecurityHeaders({
    environment: 'development',
    enableHSTS: false,
    strictCSP: false,
    reportOnly: true,
  }),

  staging: () => getSecurityHeaders({
    environment: 'staging',
    enableHSTS: true,
    strictCSP: false,
    reportOnly: true,
  }),

  production: () => getSecurityHeaders({
    environment: 'production',
    enableHSTS: true,
    strictCSP: true,
    reportOnly: false,
  }),
};

/**
 * Utility to get minimal headers for API routes
 */
export function getMinimalSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'X-Powered-By': '',
  };
}

/**
 * Apply minimal security headers to API responses
 */
export function applyMinimalSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getMinimalSecurityHeaders();
  
  Object.entries(headers).forEach(([name, value]) => {
    if (value) {
      response.headers.set(name, value);
    } else {
      response.headers.delete(name);
    }
  });

  return response;
}