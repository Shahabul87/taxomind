/**
 * DEPRECATED: /api/sam/chat
 * All SAM chat traffic now routes through /api/sam/unified.
 * This proxy exists for backwards compatibility and will be removed in a future release.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  logger.warn('[SAM-CHAT] Deprecated route called — forwarding to /api/sam/unified');

  try {
    // Build the internal URL for the unified endpoint
    const url = new URL('/api/sam/unified', request.nextUrl.origin);

    // Forward the request with cookie passthrough for auth
    const body = await request.text();
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body,
    });

    // Parse the unified response
    const data = await response.json();

    // Transform into the legacy { success, data: { message, suggestions, actions } } format
    // that SAMProvider's defaultParseResponse expects
    const legacyResponse = {
      success: data.success ?? true,
      data: {
        message: data.response ?? '',
        suggestions: data.suggestions ?? [],
        actions: data.actions ?? [],
      },
    };

    return NextResponse.json(legacyResponse, { status: response.status });
  } catch (error) {
    logger.error('[SAM-CHAT] Proxy error:', error);
    return NextResponse.json(
      {
        success: false,
        data: {
          message: 'Failed to process request. Please try again.',
          suggestions: [],
          actions: [],
        },
      },
      { status: 500 }
    );
  }
}
