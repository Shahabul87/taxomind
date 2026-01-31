import { NextResponse } from 'next/server';

/**
 * Development-only route guard.
 * Returns a 404 response in production, null in dev/staging.
 *
 * Usage:
 *   const blocked = devOnlyGuard();
 *   if (blocked) return blocked;
 */
export function devOnlyGuard(): NextResponse | null {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }
  return null;
}
