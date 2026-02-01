/**
 * SAM AI Tutor Chat Route - Proxy to Unified Pipeline
 *
 * This route now proxies all requests to /api/sam/unified to ensure
 * all agentic capabilities (confidence, goals, skills, recommendations,
 * interventions) are available to AI Tutor clients.
 *
 * The request format is mapped from the legacy AI Tutor shape to the
 * unified request shape, and the response is mapped back for backward
 * compatibility.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

interface AiTutorContext {
  pageData?: Record<string, unknown>;
  learningContext?: Record<string, unknown>;
  gamificationState?: Record<string, unknown>;
  tutorPersonality?: {
    tone?: string;
    teachingMethod?: string;
    responseStyle?: string;
  };
  emotion?: string;
}

interface AiTutorRequestBody {
  message: string;
  context?: AiTutorContext;
  conversationHistory?: Array<{ type: string; content: string }>;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AiTutorRequestBody = await request.json();
    const { message, context, conversationHistory, sessionId } = body;

    const pageData = context?.pageData ?? {};
    const learningContext = context?.learningContext ?? {};
    const courseContext = learningContext.currentCourse as Record<string, unknown> | undefined;
    const chapterContext = learningContext.currentChapter as Record<string, unknown> | undefined;

    // Map AI Tutor request to unified request format
    const unifiedBody = {
      message,
      sessionId,
      pageContext: {
        type: (pageData.pageType as string) ?? 'course-detail',
        path: (pageData.pageUrl as string) ?? '/courses',
        entityId: (courseContext?.id as string) ?? undefined,
        entityType: 'course' as const,
        entityData: {
          title: (courseContext?.title as string) ?? undefined,
        },
      },
      conversationHistory: conversationHistory?.slice(-5).map((msg) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
    };

    // Forward to unified endpoint (internal fetch)
    const protocol = request.headers.get('x-forwarded-proto') ?? 'http';
    const host = request.headers.get('host') ?? 'localhost:3000';
    const unifiedUrl = `${protocol}://${host}/api/sam/unified`;

    const unifiedResponse = await fetch(unifiedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') ?? '',
        authorization: request.headers.get('authorization') ?? '',
      },
      body: JSON.stringify(unifiedBody),
    });

    if (!unifiedResponse.ok) {
      const errorData = await unifiedResponse.json().catch(() => ({}));
      logger.warn('[AI_TUTOR_PROXY] Unified endpoint returned error:', {
        status: unifiedResponse.status,
        error: errorData,
      });
      return NextResponse.json(
        { error: (errorData as Record<string, unknown>).error ?? 'Failed to process request' },
        { status: unifiedResponse.status }
      );
    }

    const unified = await unifiedResponse.json();
    const insights = unified.insights ?? {};
    const agentic = insights.agentic ?? {};
    const bloomsData = insights.blooms ?? null;

    // Map Bloom's data to legacy format
    const bloomsInsights = bloomsData
      ? {
          dominantLevel: bloomsData.dominantLevel,
          distribution: bloomsData.distribution,
          cognitiveDepth: bloomsData.cognitiveDepth,
          balance: bloomsData.balance,
          confidence: bloomsData.confidence,
          gaps: bloomsData.gaps,
          recommendations: bloomsData.recommendations ?? [],
        }
      : null;

    // Determine emotion from confidence
    const emotion = context?.emotion ?? 'neutral';
    const responseEmotion = mapConfidenceToEmotion(
      emotion,
      agentic.confidence?.level
    );

    // Map unified response back to AI Tutor response format
    return NextResponse.json({
      response: unified.response ?? '',
      emotion: responseEmotion,
      suggestions: unified.suggestions ?? [],
      action: null,
      blooms: bloomsInsights,
      insights: bloomsInsights ? { blooms: bloomsInsights } : undefined,
      sessionId: unified.metadata?.sessionId ?? sessionId ?? `session_${Date.now()}`,
      // Forward agentic data for clients that support it
      agentic: Object.keys(agentic).length > 0 ? agentic : undefined,
      metadata: {
        processingTime: unified.metadata?.requestTime ?? 0,
        contextUsed: {
          userRole: learningContext.userRole,
          pageType: pageData.pageType,
          emotionDetected: emotion,
          bloomsAnalyzed: !!bloomsData,
          memoryContextUsed: !!insights.memoryContext,
          memoriesRetrieved: 0,
        },
        proxiedToUnified: true,
      },
    });
  } catch (error) {
    logger.error('[AI_TUTOR_PROXY] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function mapConfidenceToEmotion(
  userEmotion: string,
  confidenceLevel?: string
): string {
  // If the user shows frustration and we have low confidence, be extra supportive
  if (userEmotion === 'frustrated' || confidenceLevel === 'LOW') {
    return 'supportive';
  }
  if (userEmotion === 'confused') return 'thoughtful';
  if (userEmotion === 'confident' || confidenceLevel === 'HIGH') return 'encouraging';
  if (userEmotion === 'bored') return 'excited';
  if (userEmotion === 'engaged') return 'encouraging';
  return 'supportive';
}
