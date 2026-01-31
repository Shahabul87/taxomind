import { NextResponse } from 'next/server';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

/**
 * Returns the last captured auth error from the NextAuth route
 * This bypasses the "Configuration" masking to show the actual error
 */
export async function GET() {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    // Try to import and get the last error
    const { getLastAuthError } = await import('@/app/api/auth/[...nextauth]/route');
    const lastError = getLastAuthError();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      lastAuthError: lastError || 'No error captured yet',
      note: 'Try triggering OAuth login first, then check this endpoint again',
    });
  } catch (error) {
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: 'Could not retrieve last auth error',
      importError: error instanceof Error ? error.message : String(error),
    });
  }
}
