import { NextResponse } from 'next/server';

/**
 * Apply Cache-Control headers to a NextResponse.
 * Use for public GET endpoints that benefit from CDN/browser caching.
 */
export function withCacheControl(
  response: NextResponse,
  options: {
    sMaxAge: number;
    maxAge?: number;
    staleWhileRevalidate?: number;
  }
): NextResponse {
  const { sMaxAge, maxAge = 0, staleWhileRevalidate = 60 } = options;
  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  );
  return response;
}
