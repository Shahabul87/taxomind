import NextAuth from "next-auth";
import authConfig from "@/auth.config.edge";
import { NextResponse } from 'next/server';
// Temporarily define UserRole to avoid Prisma import
enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER", 
  STUDENT = "STUDENT"
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
  [UserRole.ADMIN]: ['/admin', '/analytics/admin'],
  [UserRole.TEACHER]: ['/teacher', '/analytics/teacher'],
  [UserRole.STUDENT]: ['/analytics/student']
};

function getRoleBasedRedirect(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/analytics/admin';
    case UserRole.TEACHER:
      return '/analytics/teacher';
    case UserRole.STUDENT:
      return '/analytics/student';
    default:
      return DEFAULT_LOGIN_REDIRECT;
  }
}

function hasAccessToRoute(pathname: string, userRole: UserRole): boolean {
  // Admin has access to everything
  if (userRole === UserRole.ADMIN) return true;
  
  // Check role-specific routes
  for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
    if (routes.some(route => pathname.startsWith(route))) {
      return role === userRole;
    }
  }
  
  // Allow access to general routes
  return true;
}

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const pathname = nextUrl.pathname;
    const userRole = req.auth?.user?.role as UserRole | undefined;

    // Allow CSS files to be served normally - don't interfere with them

    // Skip middleware for Next.js internal routes and static files
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

    // CRITICAL: Skip middleware for ALL API routes to prevent 404s
    if (pathname.startsWith('/api/')) {
      return;
    }

    // Check if it's an auth route (login, register, etc.)
    const isAuthRoute = authRoutes.includes(pathname);
    
    // Check if it's a public route using the improved function
    const isPublic = isPublicRoute(pathname);
    
    // Check if it's a protected route using the improved function
    const isProtected = isProtectedRoute(pathname);

    // Reduced debug logging - only log when necessary
    if (process.env.NODE_ENV === 'development' && !isPublic && !pathname.startsWith('/_next')) {
      console.log(`[MIDDLEWARE] ${pathname} - Public: ${isPublic}, Protected: ${isProtected}, LoggedIn: ${isLoggedIn}`);
    }

    // Handle auth routes
    if (isAuthRoute) {
      if (isLoggedIn) {
        // Redirect to role-based route after login
        const redirectUrl = userRole ? getRoleBasedRedirect(userRole) : DEFAULT_LOGIN_REDIRECT;
        return NextResponse.redirect(new URL(redirectUrl, nextUrl));
      }
      return;
    }

    // Handle protected routes
    if (isProtected && !isLoggedIn) {
      let callbackUrl = pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }

      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return NextResponse.redirect(new URL(
        `/auth/login?callbackUrl=${encodedCallbackUrl}`,
        nextUrl
      ));
    }

    // Role-based access control
    if (isLoggedIn && userRole && !hasAccessToRoute(pathname, userRole)) {
      // Redirect unauthorized users to their appropriate dashboard
      const redirectUrl = getRoleBasedRedirect(userRole);
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }

    // Handle non-public routes that aren't explicitly protected
    if (!isPublic && !isProtected && !isLoggedIn) {
      let callbackUrl = pathname;
      if (nextUrl.search) {
        callbackUrl += nextUrl.search;
      }

      const encodedCallbackUrl = encodeURIComponent(callbackUrl);
      return NextResponse.redirect(new URL(
        `/auth/login?callbackUrl=${encodedCallbackUrl}`,
        nextUrl
      ));
    }

    return;
});

// CRITICAL FIX: More specific matcher to reduce middleware calls
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - CRITICAL FOR DYNAMIC ROUTES)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$|.*\\.css$|.*\\.js$|.*\\.map$).*)',
  ],
};