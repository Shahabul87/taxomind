import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { 
  createSAMConversation, 
  getSAMConversations, 
  addSAMMessage 
} from '@/sam/utils/sam-database';
import { SAMMessageType } from '@prisma/client';

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

    const body = await req.json();
    const { type, data } = body;

    if (type === 'create_conversation') {
      const conversationId = await createSAMConversation(session.user.id, {
        courseId: data.courseId,
        chapterId: data.chapterId,
        sectionId: data.sectionId,
        title: data.title,
      });

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