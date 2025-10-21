/**
 * Middleware Monitoring Enhancement
 * Adds monitoring capabilities to track redirects and 404s
 */

import { NextRequest, NextResponse } from 'next/server';
import { redirectMonitor } from './redirect-monitor';

// Old post routes that have been migrated
const MIGRATED_POST_ROUTES = [
  '/post/all-posts',
  '/post/create-post',
];

// Pattern matching for dynamic routes
const MIGRATED_POST_PATTERNS = [
  /^\/post\/[a-zA-Z0-9-]+$/, // /post/[postId]
  /^\/post\/[a-zA-Z0-9-]+\/postchapters\/[a-zA-Z0-9-]+$/, // /post/[postId]/postchapters/[postchapterId]
];

/**
 * Check if a path matches any migrated post route
 */
function isMigratedPostRoute(pathname: string): boolean {
  // Check exact matches
  if (MIGRATED_POST_ROUTES.includes(pathname)) {
    return true;
  }

  // Check pattern matches
  return MIGRATED_POST_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Get the new teacher route for an old post route
 */
function getNewTeacherRoute(pathname: string): string {
  // Map old routes to new routes
  const routeMap: Record<string, string> = {
    '/post/all-posts': '/teacher/posts/all-posts',
    '/post/create-post': '/teacher/posts/create-post',
  };

  // Check exact matches first
  if (routeMap[pathname]) {
    return routeMap[pathname];
  }

  // Handle dynamic routes
  if (pathname.match(/^\/post\/[a-zA-Z0-9-]+$/)) {
    // /post/[postId] -> /teacher/posts/[postId]
    return pathname.replace('/post/', '/teacher/posts/');
  }

  if (pathname.match(/^\/post\/[a-zA-Z0-9-]+\/postchapters\/[a-zA-Z0-9-]+$/)) {
    // /post/[postId]/postchapters/[postchapterId] -> /teacher/posts/[postId]/postchapters/[postchapterId]
    return pathname.replace('/post/', '/teacher/posts/');
  }

  return pathname;
}

/**
 * Monitor redirect access and log for analysis
 */
export async function monitorRedirect(
  request: NextRequest,
  response: NextResponse
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Check if this is a migrated post route
  if (isMigratedPostRoute(pathname)) {
    const newRoute = getNewTeacherRoute(pathname);

    // Log the redirect access
    await redirectMonitor.logRedirectAccess(pathname, newRoute, request);

    // Add monitoring headers
    response.headers.set('X-Redirect-From', pathname);
    response.headers.set('X-Redirect-To', newRoute);
    response.headers.set('X-Redirect-Monitored', 'true');
  }

  return response;
}

/**
 * Monitor 404 errors for old routes
 */
export async function monitor404(
  request: NextRequest,
  response: NextResponse
): Promise<void> {
  // Only monitor if it's a 404 response
  if (response.status === 404) {
    const pathname = request.nextUrl.pathname;

    // Check if it's an old post route that should have been redirected
    if (pathname.startsWith('/post/') && !pathname.startsWith('/post/api/')) {
      await redirectMonitor.log404Error(pathname, request);
    }
  }
}

/**
 * Get monitoring statistics for dashboard display
 */
export async function getMonitoringStats() {
  return await redirectMonitor.getRedirectStats();
}

/**
 * Check if any redirects can be safely removed
 */
export async function checkRedirectSafety() {
  return await redirectMonitor.checkRedirectRemoval();
}