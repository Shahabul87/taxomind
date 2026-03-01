/**
 * CSS Development Fix Utilities
 * Handles CSS loading issues in Next.js development environment
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Check if the request is for a CSS file
 */
export function isCSSRequest(pathname: string): boolean {
  return pathname.includes('.css') || 
         pathname.includes('/_next/static/css/') ||
         pathname.startsWith('/_next/static/chunks/app/layout');
}

/**
 * Handle CSS request with proper caching headers
 */
export function handleCSSRequest(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  
  if (!isCSSRequest(pathname)) {
    return null;
  }
  
  // For CSS files, always return with cache headers
  const response = NextResponse.next();
  
  // Set cache headers for CSS files in development
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  } else {
    // Production caching
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  return response;
}

/**
 * Clear CSS cache headers for hot reload
 */
export function clearCSSCache(response: NextResponse): void {
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-CSS-Reload', Date.now().toString());
    response.headers.set('Vary', 'X-CSS-Reload');
  }
}

/**
 * Check if running multiple dev servers
 */
export function checkForDuplicateServers(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check if another dev server is running
  const devServerKey = 'taxomind-dev-server';
  const currentTime = Date.now();
  const lastPing = localStorage.getItem(devServerKey);
  
  if (lastPing) {
    const lastPingTime = parseInt(lastPing, 10);
    // If last ping was within 5 seconds, another server might be running
    if (currentTime - lastPingTime < 5000) {
      console.warn('⚠️ Another development server might be running. This can cause CSS 404 errors.');
      console.warn('Run "npm run fix-css" to clean up and restart.');
      return true;
    }
  }
  
  // Update ping time
  localStorage.setItem(devServerKey, currentTime.toString());
  
  // Clean up old ping after 10 seconds
  setTimeout(() => {
    localStorage.removeItem(devServerKey);
  }, 10000);
  
  return false;
}

/**
 * Get CSS fix instructions for developers
 */
export function getCSSFixInstructions(): string {
  return `
CSS 404 Error Fix Instructions:
================================
1. Stop the development server (Ctrl+C)
2. Run: npm run fix-css
3. Start the server: npm run dev:clean
4. Clear browser cache: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)

Prevention Tips:
- Always stop dev server properly with Ctrl+C
- Use npm run dev:clean for a fresh start
- Clear browser cache if CSS changes don't appear
`;
}