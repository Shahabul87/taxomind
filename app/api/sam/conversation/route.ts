import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import {
  createSAMConversation,
  getSAMConversations,
  addSAMMessage
} from '@/lib/sam/utils/sam-database';
import { SAMMessageType } from '@prisma/client';
import { checkAIAccess, recordAIUsage } from "@/lib/ai/subscription-enforcement";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || undefined;
    const chapterId = searchParams.get('chapterId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');

    const conversations = await getSAMConversations(session.user.id, {
      courseId,
      chapterId,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    logger.error('Error fetching SAM conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription tier and usage limits for chat
    const accessCheck = await checkAIAccess(session.user.id, "chat");
    if (!accessCheck.allowed) {
      return NextResponse.json(
        {
          error: accessCheck.reason || "AI access denied",
          upgradeRequired: accessCheck.upgradeRequired,
          suggestedTier: accessCheck.suggestedTier,
          remainingDaily: accessCheck.remainingDaily,
          remainingMonthly: accessCheck.remainingMonthly,
          maintenanceMode: accessCheck.maintenanceMode,
        },
        { status: accessCheck.maintenanceMode ? 503 : 403 }
      );
    }

    const body = await req.json();
    const { type, data } = body;

    if (type === 'create_conversation') {
      const conversationId = await createSAMConversation(session.user.id, {
        courseId: data.courseId,
        chapterId: data.chapterId,
        sectionId: data.sectionId,
        title: data.title,
      });

      // Record chat usage
      await recordAIUsage(session.user.id, "chat", 1);

      return NextResponse.json({
        success: true,
        data: { id: conversationId },
      });
    }

    if (type === 'add_message') {
      const message = await addSAMMessage(data.conversationId, {
        role: data.role as SAMMessageType,
        content: data.content,
        metadata: data.metadata,
        parentMessageId: data.parentMessageId,
      });

      // Record chat usage
      await recordAIUsage(session.user.id, "chat", 1);

      return NextResponse.json({
        success: true,
        data: message,
      });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    logger.error('Error handling SAM conversation request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}