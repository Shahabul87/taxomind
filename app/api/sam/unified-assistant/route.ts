/**
 * DEPRECATED: /api/sam/unified-assistant
 * All SAM chat traffic now routes through /api/sam/unified.
 * This proxy exists for backwards compatibility and will be removed in a future release.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  logger.warn('[SAM-UNIFIED-ASSISTANT] Deprecated route called — forwarding to /api/sam/unified');

  try {
    const body = await request.json();

    // Map teacher assistant request shape into unified shape
    // The unified route's normalizeRequest() handles `context` → `pageContext` conversion
    const unifiedBody = {
      message: body.message,
      context: body.context,
      action: body.action,
      // Normalize conversationHistory from { type: 'user'|'sam' } to { role: 'user'|'assistant' }
      conversationHistory: body.conversationHistory?.map((msg: { type?: string; role?: string; content: string }) => ({
        role: msg.type === 'user' || msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    };

    // Forward to unified endpoint
    const url = new URL('/api/sam/unified', request.nextUrl.origin);
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(unifiedBody),
    });

    const data = await response.json();

    // Transform back into the legacy { response, suggestions: string[], success } format
    const suggestions: string[] = (data.suggestions ?? []).map((s: unknown) =>
      typeof s === 'string' ? s : (s as { label?: string }).label ?? ''
    ).filter(Boolean);

    const legacyResponse = {
      response: data.response ?? '',
      suggestions,
      success: data.success ?? true,
    };

    return NextResponse.json(legacyResponse, { status: response.status });
  } catch (error) {
    logger.error('[SAM-UNIFIED-ASSISTANT] Proxy error:', error);
    return NextResponse.json(
      {
        response: "I'm experiencing technical difficulties. Please try again in a moment.",
        suggestions: ['Try again', 'Refresh page', 'Contact support'],
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not supported. Use POST to interact with SAM.' },
    { status: 405 }
  );
}
