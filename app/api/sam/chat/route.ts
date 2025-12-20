import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { processMessage, convertLegacyContext } from '@/lib/sam/migration-bridge';

export const runtime = 'nodejs';

interface SAMChatRequest {
  message: string;
  context?: {
    pageType?: string;
    entityType?: string;
    entityId?: string;
    entityData?: unknown;
    formData?: Record<string, unknown>;
    url?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  };
  contextualPrompt?: string;
  conversationHistory?: Array<{ type: string; content: string }>;
}

/**
 * SAM Contextual Chat API
 * Uses the new @sam-ai/core orchestrator for intelligent, context-aware responses
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SAMChatRequest = await req.json();

    if (!body.message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Build legacy context format for the migration bridge
    // Note: isTeacher may not be set in session, default to USER
    const userRole = (session.user as { isTeacher?: boolean }).isTeacher ? 'TEACHER' : 'USER';

    const legacyContext = {
      user: {
        id: session.user.id,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
        role: userRole,
      },
      courseId: body.context?.courseId,
      chapterId: body.context?.chapterId,
      sectionId: body.context?.sectionId,
      pageType: body.context?.pageType,
      entityType: body.context?.entityType,
      entityData: body.context?.entityData,
      formData: body.context?.formData,
      url: body.context?.url,
    };

    // Use the new orchestrator via migration bridge
    const response = await processMessage(legacyContext, body.message, {
      includeInsights: true,
    });

    return NextResponse.json({
      success: true,
      response: response.message,
      suggestions: response.suggestions,
      contextInsights: response.contextInsights,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[SAM-CHAT] Error:', error);

    // Return a helpful fallback response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate SAM response',
        response: generateFallbackMessage(),
        suggestions: [
          'Tell me more about your specific challenge',
          'What outcome are you trying to achieve?',
          'How can I help you with your current task?',
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a fallback message when the AI fails
 */
function generateFallbackMessage(): string {
  return "I'm here to help! While I'm having a moment of reflection, could you tell me more about what you're working on? I'd love to provide specific guidance once I understand your context better.";
}
