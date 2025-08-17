/**
 * Enhanced Middleware with Clean Role + Capability System
 * 
 * This middleware implements a Google-style authentication system where:
 * - Roles: ADMIN (platform management) and USER (everyone else)
 * - Capabilities: STUDENT, TEACHER, AFFILIATE (user contexts)
 * - Context switching: Users can switch between different capabilities
 */

import NextAuth from "next-auth";
import authConfig from "@/auth.config.edge";
import { NextResponse } from 'next/server';
import type { UserRole } from "@prisma/client";
import { applySecurityHeaders, getMinimalSecurityHeaders } from "@/lib/security/headers";
import { UserCapability } from "@/lib/auth/capabilities";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  isPublicRoute,
  isProtectedRoute,
} from "@/routes";

// Import MFA enforcement utilities
import { shouldBlockAdminAccess, isRouteAllowedDuringMFASetup } from "@/lib/auth/mfa-enforcement";

// Admin-only routes (platform management)
const ADMIN_ONLY_ROUTES = [
  '/admin',
  '/dashboard/admin',
  '/admin/users',
  '/admin/settings',
  '/admin/audit',
  '/admin/mfa-setup',
  '/admin/mfa-warning',
];

// Capability-based routes (user contexts)
const CAPABILITY_ROUTES: Record<string, UserCapability[]> = {
  '/teacher': [UserCapability.TEACHER],
  '/instructor': [UserCapability.TEACHER],
  '/affiliate': [UserCapability.AFFILIATE],
  '/content': [UserCapability.CONTENT_CREATOR],
  '/moderate': [UserCapability.MODERATOR],
  '/review': [UserCapability.REVIEWER],
};

/**
 * Get the appropriate redirect based on user role and capabilities
 */
function getContextBasedRedirect(
  role: UserRole,
  capabilities?: string[]
): string {
  // Admins go to admin dashboard
  if (role === "ADMIN") {
    return '/dashboard/admin';
  }

  // Users go to appropriate dashboard based on capabilities
  if (capabilities?.includes(UserCapability.TEACHER)) {
    return '/dashboard?context=teacher';
  } else if (capabilities?.includes(UserCapability.AFFILIATE)) {
    return '/dashboard?context=affiliate';
  } else {
    return '/dashboard?context=student';
  }
}

/**
 * Check if user has access to a route based on role and capabilities
 */
function hasRouteAccess(
  pathname: string,
  userRole: UserRole,
  userCapabilities?: string[]
): boolean {
  // Admins have access to everything
  if (userRole === "ADMIN") {
    return true;
  }

  // Check admin-only routes
  if (ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    return false; // Only admins can access these
  }

  // Check capability-based routes
  for (const [routePattern, requiredCapabilities] of Object.entries(CAPABILITY_ROUTES)) {
    if (pathname.startsWith(routePattern)) {
      // User must have at least one of the required capabilities
      return requiredCapabilities.some(cap => 
        userCapabilities?.includes(cap)
      );
    }
  }

  // All other authenticated routes are accessible to users
  return true;
}

/**
 * Extract user capabilities from auth session
 * In production, this would come from the JWT token or database
 */
function getUserCapabilities(auth: any): string[] {
  const capabilities: string[] = [UserCapability.STUDENT]; // Everyone is a student

  // Check for teacher capability
  if (auth?.user?.isTeacher) {
    capabilities.push(UserCapability.TEACHER);
  }

  // Check for affiliate capability
  if (auth?.user?.isAffiliate) {
    capabilities.push(UserCapability.AFFILIATE);
  }

  return capabilities;
}

const { auth } = NextAuth(authConfig);

export const middleware = auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;
  const userRole = req.auth?.user?.role as UserRole | undefined;
  const userCapabilities = isLoggedIn ? getUserCapabilities(req.auth) : [];

  // Skip middleware for Next.js internal routes and static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.css') ||
    pathname.includes('.js') ||
    pathname.includes('.map') ||
    pathname.includes('.') && !pathname.includes('/api/') ||
    pathname.startsWith('/api/_next/')
  ) {
    return;
  }

  // Apply minimal security headers to API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    const minimalHeaders = getMinimalSecurityHeaders();
    
    Object.entries(minimalHeaders).forEach(([name, value]) => {
      if (value) {
        response.headers.set(name, value);
      } else {
        response.headers.delete(name);
      }
    });
    
    // Add capability headers for API routes
    if (isLoggedIn && userCapabilities.length > 0) {
      response.headers.set('X-User-Capabilities', userCapabilities.join(','));
    }
    
    return response;
  }

  // Check if it's an auth route (login, register, etc.)
  const isAuthRoute = authRoutes.includes(pathname);
  
  // Check if it's a public route
  const isPublic = isPublicRoute(pathname);
  
  // Check if it's a protected route
  const isProtected = isProtectedRoute(pathname);

  // Handle auth routes
  if (isAuthRoute) {
    if (isLoggedIn) {
      // Redirect to appropriate dashboard after login
      const redirectUrl = userRole 
        ? getContextBasedRedirect(userRole, userCapabilities) 
        : DEFAULT_LOGIN_REDIRECT;
      const response = NextResponse.redirect(new URL(redirectUrl, nextUrl));
      return applySecurityHeaders(response);
    }
    // Apply security headers to auth pages
    const response = NextResponse.next();
    return applySecurityHeaders(response);
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
    return applySecurityHeaders(response);
  }

  // MFA Enforcement for Admin Users
  if (isLoggedIn && userRole === "ADMIN" && req.auth?.user?.id) {
    try {
      // Check if admin should be blocked due to MFA requirements
      const mfaCheck = await shouldBlockAdminAccess(req.auth.user.id, pathname);
      
      if (mfaCheck.shouldBlock) {
        console.log(`[MFA_ENFORCEMENT] Blocking admin access to ${pathname}:`, mfaCheck.reason);
        
        // Redirect to MFA setup or warning page
        const redirectUrl = mfaCheck.redirectUrl || '/admin/mfa-setup';
        const response = NextResponse.redirect(new URL(redirectUrl, nextUrl));
        
        // Add MFA enforcement headers
        response.headers.set('X-MFA-Required', 'true');
        response.headers.set('X-MFA-Reason', mfaCheck.reason || 'MFA setup required');
        
        return applySecurityHeaders(response);
      }
    } catch (error) {
      // Log error but don't break authentication flow
      console.error('[MFA_ENFORCEMENT] Error checking admin MFA status:', error);
    }
  }

  // Enhanced role and capability-based access control
  if (isLoggedIn && userRole) {
    const hasAccess = hasRouteAccess(pathname, userRole, userCapabilities);
    
    if (!hasAccess) {
      // Log unauthorized access attempt
      console.log(`[ACCESS_DENIED] User ${req.auth?.user?.email} denied access to ${pathname}`);
      
      // Redirect to appropriate dashboard with error message
      const redirectUrl = getContextBasedRedirect(userRole, userCapabilities);
      const response = NextResponse.redirect(
        new URL(`${redirectUrl}?error=unauthorized`, nextUrl)
      );
      
      // Add access denied headers
      response.headers.set('X-Access-Denied', 'true');
      response.headers.set('X-Required-Capability', 'Check route requirements');
      
      return applySecurityHeaders(response);
    }
  }

  // Handle context switching via query parameters
  if (pathname === '/dashboard' && nextUrl.searchParams.has('context')) {
    const requestedContext = nextUrl.searchParams.get('context');
    
    // Validate requested context
    if (requestedContext && isLoggedIn) {
      const validContexts = ['student', 'teacher', 'affiliate'];
      
      if (validContexts.includes(requestedContext)) {
        // Check if user has the capability for requested context
        const contextCapabilityMap: Record<string, UserCapability> = {
          'student': UserCapability.STUDENT,
          'teacher': UserCapability.TEACHER,
          'affiliate': UserCapability.AFFILIATE,
        };
        
        const requiredCapability = contextCapabilityMap[requestedContext];
        
        if (!userCapabilities.includes(requiredCapability)) {
          // Redirect to default context with error
          const defaultContext = userCapabilities.includes(UserCapability.TEACHER) 
            ? 'teacher' 
            : userCapabilities.includes(UserCapability.AFFILIATE) 
            ? 'affiliate' 
            : 'student';
          
          const response = NextResponse.redirect(
            new URL(`/dashboard?context=${defaultContext}&error=capability_required`, nextUrl)
          );
          
          return applySecurityHeaders(response);
        }
      }
    }
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
    return applySecurityHeaders(response);
  }

  // Apply security headers and capability information to all other routes
  const response = NextResponse.next();
  
  // Add user context headers for client-side access
  if (isLoggedIn) {
    response.headers.set('X-User-Role', userRole || 'USER');
    if (userCapabilities.length > 0) {
      response.headers.set('X-User-Capabilities', userCapabilities.join(','));
    }
  }
  
  return applySecurityHeaders(response);
});

export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.css$|.*\\.js$|.*\\.map$).*)',
  ],
};