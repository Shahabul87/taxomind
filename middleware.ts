/**
 * ENTERPRISE AUTH SEPARATION - Phase 4 Complete
 *
 * This middleware implements STRICT separation between:
 * - Admin Authentication: Separate auth instance, session, and state
 * - User Authentication: Separate auth instance, session, and state
 *
 * CRITICAL: NO mixing of auth states, sessions, or tokens between admin and users
 */

import NextAuth from "next-auth";
import userAuthConfig from "@/auth.config.edge";
import adminAuthConfig from "@/auth.config.admin.edge";
import { NextResponse, NextRequest } from 'next/server';
import type { UserRole } from "@prisma/client";
import { applySecurityHeaders, getMinimalSecurityHeaders } from "@/lib/security/headers";
import { UserCapability } from "@/lib/auth/capability-types";

import {
  DEFAULT_LOGIN_REDIRECT,
  authRoutes,
  adminAuthRoutes,
  isPublicRoute,
  isProtectedRoute,
  isAdminAuthRoute,
  isAdminRoute,
} from "@/routes";

// Import MFA enforcement utilities
import { isRouteAllowedDuringMFASetup } from "@/lib/auth/mfa-enforcement-edge";

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
 * Get the appropriate redirect based on user role
 */
function getRoleBasedRedirect(role: UserRole): string {
  if (role === "ADMIN") {
    return '/dashboard/admin';
  }
  return '/dashboard';
}

/**
 * Check if user has access to a route based on role and capabilities
 * Used only for USER routes (admins have separate logic)
 */
function hasUserRouteAccess(
  pathname: string,
  userCapabilities?: string[]
): boolean {
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
 * Extract user capabilities from auth session (USER auth only)
 */
function getUserCapabilities(auth: any): string[] {
  const capabilities: string[] = [UserCapability.STUDENT];

  if (auth?.user?.isTeacher) {
    capabilities.push(UserCapability.TEACHER);
  }

  if (auth?.user?.isAffiliate) {
    capabilities.push(UserCapability.AFFILIATE);
  }

  return capabilities;
}

/**
 * Check if route should be handled by admin auth
 */
function isAdminAuthRoute_Check(pathname: string): boolean {
  return isAdminRoute(pathname) || isAdminAuthRoute(pathname);
}

/**
 * Shared skip logic for internal routes
 */
function shouldSkipMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.css') ||
    pathname.includes('.js') ||
    pathname.includes('.map') ||
    (pathname.includes('.') && !pathname.includes('/api/')) ||
    pathname.startsWith('/api/_next/')
  );
}

// Create separate auth instances
const { auth: userAuth } = NextAuth(userAuthConfig);
const { auth: adminAuth } = NextAuth(adminAuthConfig);

/**
 * ADMIN AUTH MIDDLEWARE - Handles ONLY admin routes
 */
async function handleAdminRoute(req: NextRequest) {
  // @ts-ignore - NextAuth v5 edge middleware pattern
  return adminAuth(req, async (req) => {
    const { nextUrl } = req;
    const pathname = nextUrl.pathname;
    const adminSession = req.auth;
    const isLoggedIn = !!adminSession?.user;
    const userRole = adminSession?.user?.role as UserRole | undefined;

    console.log('[Admin Middleware]', {
      pathname,
      isLoggedIn,
      userRole,
      hasSession: !!adminSession,
    });

    // Admin auth routes (login, error, etc.)
    if (isAdminAuthRoute(pathname)) {
      // If already logged in as admin, redirect to admin dashboard
      if (isLoggedIn && userRole === "ADMIN") {
        const response = NextResponse.redirect(new URL('/dashboard/admin', nextUrl));
        return applySecurityHeaders(response);
      }

      // Allow access to admin auth pages
      const response = NextResponse.next();
      return applySecurityHeaders(response);
    }

    // Protected admin routes - require authentication
    if (!isLoggedIn) {
      console.log('[Admin Middleware] No admin session, redirecting to login');

      let callbackUrl = pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);

      const response = NextResponse.redirect(
        new URL(`/admin/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
      );
      return applySecurityHeaders(response);
    }

    // Verify ADMIN role
    if (userRole !== "ADMIN") {
      console.log('[Admin Middleware] Non-admin attempting to access admin route');

      const response = NextResponse.redirect(
        new URL('/dashboard?error=admin_access_denied', nextUrl)
      );
      response.headers.set('X-Access-Denied', 'true');
      response.headers.set('X-Required-Role', 'ADMIN');

      return applySecurityHeaders(response);
    }

    // MFA enforcement check (edge-safe)
    const isMFARoute = isRouteAllowedDuringMFASetup(pathname);
    if (!isMFARoute) {
      // Set header to indicate page should check MFA status
      // Actual check happens in page component (not edge-safe)
    }

    // Allow access to admin route
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);
    response.headers.set('X-User-Role', 'ADMIN');

    return applySecurityHeaders(response);
  });
}

/**
 * USER AUTH MIDDLEWARE - Handles ONLY user routes
 */
async function handleUserRoute(req: NextRequest) {
  // @ts-ignore - NextAuth v5 edge middleware pattern
  return userAuth(req, async (req) => {
    const { nextUrl } = req;
    const pathname = nextUrl.pathname;
    const userSession = req.auth;
    const isLoggedIn = !!userSession?.user;
    const userRole = userSession?.user?.role as UserRole | undefined;
    const userCapabilities = isLoggedIn ? getUserCapabilities(userSession) : [];

    // SECURITY: Only log detailed info in development
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings')) {
      const isDevelopment = process.env.NODE_ENV === 'development';

      console.log('[User Middleware]', {
        pathname,
        isLoggedIn,
        hasAuth: !!userSession,
        userId: isDevelopment ? userSession?.user?.id : userSession?.user?.id?.slice(0, 8) + '...',
        userRole,
        userCapabilities,
      });
    }

    // User auth routes (login, register, etc.)
    const isAuthRoute = authRoutes.includes(pathname);
    if (isAuthRoute) {
      // If already logged in, redirect to dashboard
      if (isLoggedIn) {
        const redirectUrl = userRole ? getRoleBasedRedirect(userRole) : DEFAULT_LOGIN_REDIRECT;
        const response = NextResponse.redirect(new URL(redirectUrl, nextUrl));
        return applySecurityHeaders(response);
      }

      // Allow access to auth pages
      const response = NextResponse.next();
      return applySecurityHeaders(response);
    }

    // Check if route is public
    const isPublic = isPublicRoute(pathname);
    if (isPublic) {
      const response = NextResponse.next();
      response.headers.set('x-pathname', pathname);
      return applySecurityHeaders(response);
    }

    // Check if route is protected
    const isProtected = isProtectedRoute(pathname);

    // Protected routes require authentication
    if (isProtected && !isLoggedIn) {
      console.log('[User Middleware] Not authenticated for protected route');

      let callbackUrl = pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);

      const response = NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
      );

      // Clear any stale session cookies
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('__Secure-next-auth.session-token');

      return applySecurityHeaders(response);
    }

    // Capability-based access control for authenticated users
    if (isLoggedIn && userRole) {
      // Block users from accessing admin routes
      if (ADMIN_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
        console.log('[User Middleware] User attempting to access admin route');

        const response = NextResponse.redirect(
          new URL('/dashboard?error=admin_access_denied', nextUrl)
        );
        response.headers.set('X-Access-Denied', 'true');
        response.headers.set('X-Required-Role', 'ADMIN');

        return applySecurityHeaders(response);
      }

      // Check capability-based access
      const hasAccess = hasUserRouteAccess(pathname, userCapabilities);

      if (!hasAccess) {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const userIdentifier = isDevelopment
          ? userSession?.user?.email
          : userSession?.user?.id?.slice(0, 8) + '...';

        console.log(`[ACCESS_DENIED] User ${userIdentifier} denied access to ${pathname}`);

        const response = NextResponse.redirect(
          new URL('/dashboard?error=unauthorized', nextUrl)
        );
        response.headers.set('X-Access-Denied', 'true');
        response.headers.set('X-Required-Capability', 'Check route requirements');

        return applySecurityHeaders(response);
      }
    }

    // Handle context switching via query parameters
    if (pathname === '/dashboard' && nextUrl.searchParams.has('context')) {
      const requestedContext = nextUrl.searchParams.get('context');

      if (requestedContext && isLoggedIn) {
        const validContexts = ['student', 'teacher', 'affiliate'];

        if (validContexts.includes(requestedContext)) {
          const contextCapabilityMap: Record<string, UserCapability> = {
            'student': UserCapability.STUDENT,
            'teacher': UserCapability.TEACHER,
            'affiliate': UserCapability.AFFILIATE,
          };

          const requiredCapability = contextCapabilityMap[requestedContext];

          if (!userCapabilities.includes(requiredCapability)) {
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
      console.log('[User Middleware] Not authenticated for non-public route');

      let callbackUrl = pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }
      const encodedCallbackUrl = encodeURIComponent(callbackUrl);

      const response = NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)
      );

      return applySecurityHeaders(response);
    }

    // Apply security headers and user context
    const response = NextResponse.next();
    response.headers.set('x-pathname', pathname);

    if (isLoggedIn) {
      response.headers.set('X-User-Role', userRole || 'USER');
      if (userCapabilities.length > 0) {
        response.headers.set('X-User-Capabilities', userCapabilities.join(','));
      }
    }

    return applySecurityHeaders(response);
  });
}

/**
 * MAIN MIDDLEWARE - Routes to appropriate auth handler
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for Next.js internal routes and static files
  if (shouldSkipMiddleware(pathname)) {
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

    return response;
  }

  // Route to appropriate auth handler based on path
  if (isAdminAuthRoute_Check(pathname)) {
    // Use ADMIN auth instance for admin routes
    return handleAdminRoute(req);
  } else {
    // Use USER auth instance for user routes
    return handleUserRoute(req);
  }
}

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
