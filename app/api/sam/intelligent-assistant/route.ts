/**
 * DEPRECATED: /api/sam/intelligent-assistant
 *
 * This route is a backward-compatible proxy. All new callers should use
 * /api/sam/unified directly. This proxy forwards to the unified route
 * and transforms the response back to the legacy format:
 *   { response, suggestions, action, metadata }
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  logger.warn('[SAM-INTELLIGENT-ASSISTANT] Deprecated route called — forwarding to /api/sam/unified');

  try {
    const url = new URL('/api/sam/unified', request.nextUrl.origin);

    // Read and transform the request body
    const rawBody = await request.json();
    // Legacy callers send { message, intent, context, conversationHistory }
    // Map 'context' to 'courseContext' for unified route
    const unifiedBody = {
      message: rawBody.message,
      courseContext: rawBody.context ?? undefined,
      conversationHistory: Array.isArray(rawBody.conversationHistory)
        ? rawBody.conversationHistory.map((m: { type?: string; role?: string; content: string }) => ({
            role: m.type === 'user' || m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
          }))
        : undefined,
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(unifiedBody),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Map unified response → legacy intelligent-assistant format
    const rawSuggestions: unknown[] = data.suggestions ?? [];
    const legacyResponse = {
      response: data.response ?? '',
      suggestions: rawSuggestions.map((s: unknown) =>
        typeof s === 'string' ? s : (s as { label?: string }).label ?? ''
      ).filter(Boolean),
      action: null, // Unified route does not produce form actions
      metadata: {
        intent: rawBody.intent ?? 'general_help',
        processingTime: Date.now(),
        confidence: 0.95,
      },
    };

    return NextResponse.json(legacyResponse, { status: response.status });
  } catch (error) {
    logger.error('[SAM-INTELLIGENT-ASSISTANT] Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
