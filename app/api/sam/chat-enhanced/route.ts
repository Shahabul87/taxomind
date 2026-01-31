/**
 * DEPRECATED: /api/sam/chat-enhanced
 *
 * This route is a backward-compatible proxy. All new callers should use
 * /api/sam/unified directly. This proxy forwards to the unified route
 * and transforms the response back to the legacy format:
 *   POST → { success, data: { message, suggestions, actions, insights, engineData, agenticData, conversationId, memoryContext } }
 *   GET  → { success, data: { messages, conversationId, pagination } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  logger.warn('[SAM-CHAT-ENHANCED] Deprecated route called — forwarding to /api/sam/unified');

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

    // Map unified response → legacy chat-enhanced format
    const insights = data.insights ?? {};
    const metadata = data.metadata ?? {};
    const agentic = insights.agentic ?? {};

    const legacyResponse = {
      success: data.success ?? true,
      data: {
        message: data.response ?? '',
        suggestions: data.suggestions ?? [],
        actions: data.actions ?? [],
        insights: insights,
        engineData: {
          marketAnalysis: insights.content ?? null,
          bloomsAnalysis: insights.blooms ?? null,
          courseGuide: insights.context ?? null,
          learningProfile: insights.personalization ?? null,
        },
        agenticData: agentic.confidence
          ? {
              confidence: agentic.confidence,
              toolResults: metadata.toolExecution ? [metadata.toolExecution] : [],
              goalContext: null,
              interventionContext: agentic.interventions ?? null,
            }
          : null,
        conversationId: metadata.sessionId ?? `chat-${Date.now()}`,
        memoryContext: { hasMemory: !!insights.memoryContext },
      },
    };

    return NextResponse.json(legacyResponse, { status: response.status });
  } catch (error) {
    logger.error('[SAM-CHAT-ENHANCED] Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // GET endpoint for conversation history is not supported via unified route.
  // Return empty response for backward compatibility.
  logger.warn('[SAM-CHAT-ENHANCED] Deprecated GET route called');

  return NextResponse.json({
    success: true,
    data: {
      messages: [],
      conversationId: null,
      pagination: {
        hasMore: false,
        nextCursor: undefined,
        limit: 20,
      },
    },
  });
}
