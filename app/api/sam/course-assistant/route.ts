/**
 * DEPRECATED: /api/sam/course-assistant
 *
 * This route is a backward-compatible proxy. All new callers should use
 * /api/sam/unified directly. This proxy forwards to the unified route
 * and transforms the response back to the legacy format:
 *   { response, suggestions, data, timestamp, isPremium }
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  logger.warn('[SAM-COURSE-ASSISTANT] Deprecated route called — forwarding to /api/sam/unified');

  try {
    const url = new URL('/api/sam/unified', request.nextUrl.origin);
    const body = await request.text();

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Map unified response → legacy course-assistant format
    const rawSuggestions: unknown[] = data.suggestions ?? [];
    const legacyResponse = {
      response: data.response ?? '',
      suggestions: rawSuggestions.map((s: unknown) =>
        typeof s === 'string' ? s : (s as { label?: string }).label ?? ''
      ).filter(Boolean),
      data: data.insights ?? null,
      timestamp: new Date().toISOString(),
      isPremium: true,
    };

    return NextResponse.json(legacyResponse, { status: response.status });
  } catch (error) {
    logger.error('[SAM-COURSE-ASSISTANT] Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
