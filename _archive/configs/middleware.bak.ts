import NextAuth from "next-auth";
import authConfig from "@/auth.config.edge";
import { NextResponse } from 'next/server';
import type { UserRole } from "@prisma/client";
import { applySecurityHeaders, getMinimalSecurityHeaders } from "@/lib/security/headers";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  isPublicRoute,
  isProtectedRoute,
} from "@/routes";

// Import MFA enforcement utilities
import { shouldBlockAdminAccess, isRouteAllowedDuringMFASetup } from "@/lib/auth/mfa-enforcement";

// Simplified role-based routes
const ADMIN_ROUTES = ['/admin', '/dashboard/admin'];

function getRoleBasedRedirect(role: UserRole): string {
  return role === "ADMIN" ? '/dashboard/admin' : '/dashboard';
}

function hasAccessToRoute(pathname: string, userRole: UserRole): boolean {
  // Admin has access to everything
  if (userRole === "ADMIN") return true;
  
  // Check if user is trying to access admin routes
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    return false; // Only admins can access admin routes
  }
  
  // Users can access all other authenticated routes
  return true;
}

const { auth } = NextAuth(authConfig);

export const middleware = auth(async (req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;
  const userRole = req.auth?.user?.role as UserRole | undefined;

  // Skip middleware for Next.js internal routes and static files
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth/') ||
    pathname.includes('.') && !pathname.includes('/api/') ||
    pathname.startsWith('/api/_next/')
  ) {
    return;
  }

  // Apply minimal security headers to API routes and return
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
      const redirectUrl = userRole ? getRoleBasedRedirect(userRole) : DEFAULT_LOGIN_REDIRECT;
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
      
      // In case of error, log the incident but allow access to prevent lockout
      // You might want to implement a fallback strategy here
    }
  }

  // Simple role-based access control
  if (isLoggedIn && userRole && !hasAccessToRoute(pathname, userRole)) {
    // Redirect unauthorized users to their dashboard
    const redirectUrl = getRoleBasedRedirect(userRole);
    const response = NextResponse.redirect(new URL(redirectUrl, nextUrl));
    return applySecurityHeaders(response);
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

  // Apply security headers to all other routes
  const response = NextResponse.next();
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