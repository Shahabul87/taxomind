/**
 * EXAMPLE: Complete Security Middleware Integration for Taxomind LMS
 * 
 * This file demonstrates how to integrate the new security middleware
 * with the existing authentication middleware.
 * 
 * IMPORTANT: This is an EXAMPLE file showing integration patterns.
 * To use this, copy the relevant parts into your main middleware.ts file.
 * 
 * Features demonstrated:
 * - Security middleware integration with NextAuth
 * - Environment-based security configuration
 * - Proper error handling and logging
 * - Performance optimization
 * - Security headers application
 */

import NextAuth from "next-auth";
import authConfig from "@/auth.config.edge";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Import the new security middleware
import { SecurityMiddleware, SecurityMiddlewarePresets } from '@/lib/middleware/security';
import { SecurityHeaders, SecurityHeadersPresets } from '@/lib/security/security-headers';

// Existing imports
enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER"
}

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  isPublicRoute,
  isProtectedRoute,
} from "@/routes";

// Role-based route definitions
const ROLE_ROUTES = {
  [UserRole.ADMIN]: ['/admin', '/analytics/admin', '/dashboard/admin'],
  [UserRole.USER]: ['/analytics/user', '/dashboard/user']
};

/**
 * Initialize security middleware based on environment
 */
function getSecurityMiddleware(): SecurityMiddleware {
  const environment = (process.env.NODE_ENV as any) || 'development';
  
  // Use preset configurations for different environments
  switch (environment) {
    case 'production':
      return new SecurityMiddleware({
        environment: 'production',
        enableRateLimit: true,
        enableBotDetection: true,
        enableIPFiltering: true,
        enableDDoSProtection: true,
        enableSQLInjectionDetection: true,
        enableXSSDetection: true,
        rateLimitOptions: {
          windowMs: 60000, // 1 minute
          maxRequests: 100, // 100 requests per minute
          skipSuccessfulRequests: true,
        },
        ipWhitelist: process.env.SECURITY_IP_WHITELIST?.split(',') || [],
        ipBlacklist: process.env.SECURITY_IP_BLACKLIST?.split(',') || [],
        logSecurityEvents: true,
        webhookURL: process.env.SECURITY_WEBHOOK_URL,
      });
      
    case 'staging':
      return new SecurityMiddleware({
        environment: 'staging',
        enableRateLimit: true,
        enableBotDetection: true,
        enableIPFiltering: false,
        rateLimitOptions: {
          windowMs: 60000,
          maxRequests: 200, // More lenient for staging
        },
        logSecurityEvents: true,
      });
      
    default: // development
      return new SecurityMiddleware({
        environment: 'development',
        enableRateLimit: false,
        enableBotDetection: false,
        enableIPFiltering: false,
        logSecurityEvents: true,
      });
  }
}

/**
 * Initialize security headers based on environment
 */
function getSecurityHeaders(): SecurityHeaders {
  const environment = (process.env.NODE_ENV as any) || 'development';
  
  switch (environment) {
    case 'production':
      return SecurityHeadersPresets.production;
    case 'staging':
      return SecurityHeadersPresets.staging;
    default:
      return SecurityHeadersPresets.development;
  }
}

// Initialize security components
const securityMiddleware = getSecurityMiddleware();
const securityHeaders = getSecurityHeaders();

// Helper functions (existing)
function getRoleBasedRedirect(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/dashboard/admin';
    case UserRole.USER:
      return '/dashboard/user';
    default:
      return DEFAULT_LOGIN_REDIRECT;
  }
}

function hasAccessToRoute(pathname: string, userRole: UserRole): boolean {
  if (userRole === UserRole.ADMIN) return true;
  
  for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
    if (routes.some(route => pathname.startsWith(route))) {
      return role === userRole;
    }
  }
  
  return true;
}

// Initialize NextAuth
const { auth } = NextAuth(authConfig);

/**
 * Main middleware function with integrated security
 */
export default auth(async (req: NextRequest & { auth?: any }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;
  const userRole = req.auth?.user?.role as UserRole | undefined;

  try {
    // 1. Skip middleware for static files and Next.js internals
    if (
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/api/auth/') ||
      pathname.includes('.') && !pathname.includes('/api/') ||
      pathname.startsWith('/api/_next/') ||
      pathname.startsWith('/__nextjs_original-stack-frame') ||
      pathname.startsWith('/minimal-') ||
      pathname.startsWith('/test-') ||
      pathname.startsWith('/css-') ||
      pathname.startsWith('/pure-') ||
      pathname.startsWith('/simple-')
    ) {
      return;
    }

    // 2. Skip security middleware for API routes but apply minimal security
    if (pathname.startsWith('/api/')) {
      // Apply security headers only for API routes
      const response = NextResponse.next();
      return securityHeaders.apply(response);
    }

    // 3. Apply comprehensive security middleware for web routes
    const securityResult = await securityMiddleware.process(req);
    
    if (securityResult.blocked) {
      // Security middleware blocked the request
      console.warn(`[SECURITY] Request blocked: ${securityResult.reason}`, {
        path: pathname,
        clientIP: securityResult.metadata?.clientIP,
        timestamp: new Date().toISOString(),
      });
      
      return securityResult.response;
    }

    // 4. Continue with existing authentication logic
    const isAuthRoute = authRoutes.includes(pathname);
    const isPublic = isPublicRoute(pathname);
    const isProtected = isProtectedRoute(pathname);

    // Log security processing in development
    if (process.env.NODE_ENV === 'development' && !isPublic) {
      console.log(`[MIDDLEWARE] ${pathname} - Public: ${isPublic}, Protected: ${isProtected}, LoggedIn: ${isLoggedIn}`);
    }

    // Handle auth routes
    if (isAuthRoute) {
      if (isLoggedIn) {
        const redirectUrl = userRole ? getRoleBasedRedirect(userRole) : DEFAULT_LOGIN_REDIRECT;
        const response = NextResponse.redirect(new URL(redirectUrl, nextUrl));
        return securityHeaders.apply(response);
      }
      const response = NextResponse.next();
      return securityHeaders.apply(response);
    }

    // Handle protected routes
    if (isProtected && !isLoggedIn) {
      let callbackUrl = pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }

      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      const response = NextResponse.redirect(new URL(
        `/auth/login?callbackUrl=${encodedCallbackUrl}`,
        nextUrl
      ));
      return securityHeaders.apply(response);
    }

    // Role-based access control
    if (isLoggedIn && userRole && !hasAccessToRoute(pathname, userRole)) {
      const redirectUrl = getRoleBasedRedirect(userRole);
      const response = NextResponse.redirect(new URL(redirectUrl, nextUrl));
      return securityHeaders.apply(response);
    }

    // Handle non-public routes that aren't explicitly protected
    if (!isPublic && !isProtected && !isLoggedIn) {
      let callbackUrl = pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }

      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      const response = NextResponse.redirect(new URL(
        `/auth/login?callbackUrl=${encodedCallbackUrl}`,
        nextUrl
      ));
      return securityHeaders.apply(response);
    }

    // 5. Apply security headers to successful responses
    const response = NextResponse.next();
    return securityHeaders.apply(response);

  } catch (error: any) {
    // Log middleware errors
    console.error('[MIDDLEWARE ERROR]', {
      pathname,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    // In case of error, apply basic security headers and continue
    const response = NextResponse.next();
    return securityHeaders.apply(response);
  }
});

/**
 * Middleware matcher configuration
 * 
 * IMPORTANT: Keep this synchronized with security requirements
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes are handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.css$|.*\\.js$|.*\\.map$).*)',
  ],
};

/**
 * INTEGRATION INSTRUCTIONS:
 * 
 * 1. Install Required Dependencies:
 *    - Ensure all security dependencies are installed
 *    - Add environment variables (see below)
 * 
 * 2. Environment Variables (.env.local):
 *    ```
 *    # Security Configuration
 *    ENCRYPTION_MASTER_KEY=your-256-bit-encryption-key-here
 *    SECURITY_ENVIRONMENT=production
 *    SECURITY_RATE_LIMIT_ENABLED=true
 *    SECURITY_RATE_LIMIT_MAX_REQUESTS=100
 *    SECURITY_RATE_LIMIT_WINDOW_MS=60000
 *    SECURITY_IP_WHITELIST=10.0.0.0/8,172.16.0.0/12
 *    SECURITY_IP_BLACKLIST=
 *    SECURITY_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
 *    SECURITY_MAX_REQUEST_SIZE=10485760
 *    CSP_REPORT_URI=/api/security/csp-report
 *    ```
 * 
 * 3. Update Main Middleware:
 *    - Copy the relevant parts of this example into your main middleware.ts
 *    - Ensure proper import paths
 *    - Test thoroughly in development before deploying
 * 
 * 4. Testing:
 *    - Test rate limiting with rapid requests
 *    - Test IP filtering if configured
 *    - Verify CSP headers in browser developer tools
 *    - Check security event logging
 * 
 * 5. Monitoring:
 *    - Set up webhook notifications for critical security events
 *    - Monitor CSP violations at /api/security/csp-report
 *    - Review security event logs regularly
 * 
 * 6. Performance Considerations:
 *    - Security middleware adds ~2-5ms per request
 *    - Rate limiting uses in-memory storage (consider Redis for production)
 *    - Adjust rate limits based on your application needs
 * 
 * SECURITY NOTES:
 * - Always test security changes in staging environment first
 * - Monitor for false positives in bot detection
 * - Review and update IP whitelists/blacklists regularly
 * - Keep security patterns and rules updated
 * - Implement proper logging and alerting for security events
 */

/**
 * PRODUCTION DEPLOYMENT CHECKLIST:
 * 
 * □ Environment variables configured
 * □ Rate limiting tested and tuned
 * □ Security headers validated
 * □ CSP policy tested
 * □ IP filtering configured (if needed)
 * □ Webhook notifications configured
 * □ Security event logging enabled
 * □ Performance impact measured
 * □ Backup and rollback plan ready
 * □ Monitoring and alerting configured
 */