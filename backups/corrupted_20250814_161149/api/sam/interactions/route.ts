import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { recordSAMInteraction } from '@/lib/sam-database';
import { SAMInteractionType } from '@prisma/client';
import { logger } from '@/lib/logger';


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { interactionType, context, result, courseId, chapterId, sectionId, conversationId } = body;

    if (!interactionType || !context) {
      return NextResponse.json(
        { error: 'Missing required fields: interactionType, context' },
        { status: 400 }
      );
    }

    const interaction = await recordSAMInteraction({
      userId: session.user.id,
      interactionType: interactionType as SAMInteractionType,
      context,
      result,
      courseId,
      chapterId,
      sectionId,
    });

    return NextResponse.json({
      success: true,
      data: interaction,
    });
  } catch (error: any) {
    logger.error('Error recording SAM interaction:', error);
    return NextResponse.json(
      { error: 'Failed to record SAM interaction' },
      { status: 500 }
    );
  }
}