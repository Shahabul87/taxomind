import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { getConversationThreadingService } from '@/lib/sam/services/conversation-threading';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

/**
 * GET /api/sam/conversations/[conversationId]/summary
 * Get or generate a conversation summary
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'readonly');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify ownership
    const conversation = await db.sAMConversation.findFirst({
      where: { id: conversationId, userId: user.id },
      select: { id: true, summary: true, topic: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Return existing summary if available
    if (conversation.summary) {
      return NextResponse.json({
        success: true,
        data: { summary: conversation.summary, topic: conversation.topic, cached: true },
      });
    }

    // Generate new summary
    const service = getConversationThreadingService();
    const summary = await service.autoSummarize(conversationId, user.id);

    return NextResponse.json({
      success: true,
      data: { summary, topic: conversation.topic, cached: false },
    });
  } catch (error) {
    logger.error('[Summary API] GET error:', error);
    return NextResponse.json({ error: 'Failed to get summary' }, { status: 500 });
  }
}

/**
 * POST /api/sam/conversations/[conversationId]/summary
 * Trigger re-summarization
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify ownership
    const conversation = await db.sAMConversation.findFirst({
      where: { id: conversationId, userId: user.id },
      select: { id: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Clear existing summary and regenerate
    await db.sAMConversation.update({
      where: { id: conversationId },
      data: { summary: null },
    });

    const service = getConversationThreadingService();
    const summary = await service.autoSummarize(conversationId, user.id);

    return NextResponse.json({
      success: true,
      data: { summary, regenerated: true },
    });
  } catch (error) {
    logger.error('[Summary API] POST error:', error);
    return NextResponse.json({ error: 'Failed to regenerate summary' }, { status: 500 });
  }
}
