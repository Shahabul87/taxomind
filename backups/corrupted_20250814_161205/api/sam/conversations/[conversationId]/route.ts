import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';

// Validation schema for path parameters
const paramsSchema = z.object({
  conversationId: z.string().uuid({
    message: 'Invalid conversation ID format',
  }),
});

// Validation schema for PATCH request body
const updateConversationSchema = z.object({
  isActive: z.boolean().optional(),
  tutorMode: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
});

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    // Authentication check
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    // Resolve params Promise
    const params = await context.params;
    
    // Validate path parameters
    const paramsValidation = paramsSchema.safeParse(params);
    
    if (!paramsValidation.success) {
      return NextResponse.json({
        error: 'Invalid conversation ID',
        code: 'VALIDATION_ERROR',
        details: paramsValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      }, { status: 400 });
    }

    const { conversationId } = paramsValidation.data;

    // Fetch conversation with detailed information
    const conversation = await db.sAMConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: conversation.id,
        sessionId: conversation.sessionId,
        courseId: conversation.courseId,
        chapterId: conversation.chapterId,
        sectionId: conversation.sectionId,
        startedAt: conversation.startedAt,
        endedAt: conversation.endedAt,
        isActive: conversation.isActive,
        tutorMode: conversation.tutorMode,
        context: conversation.context,
        messageCount: conversation._count.messages,
      },
    });

  } catch (error: any) {
    logger.error('Error fetching conversation:', error);
    
    return NextResponse.json({
      error: 'Failed to fetch conversation',
      coexport const PATCH = withAuth(async (request, context, params) => {
  export async function PATCH(
  req: NextRequest,
    // Authentication check
    
    
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
}, {
  rateLimit: { requests: 25, window: 60000 },
  auditLog: false
});, { status: 401 });
    }

    // Resolve params Promise
    const params = await context.params;
    
    // Validate path parameters
    const paramsValidation = paramsSchema.safeParse(params);
    
    if (!paramsValidation.success) {
      return NextResponse.json({
        error: 'Invalid conversation ID',
        code: 'VALIDATION_ERROR',
        details: paramsValidation.error.issues,
      }, { status: 400 });
    }

    // Parse and validate request body
    const body = await req.json();
    const bodyValidation = updateConversationSchema.safeParse(body);
    
    if (!bodyValidation.success) {
      return NextResponse.json({
        error: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: bodyValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      }, { status: 400 });
    }

    const { conversationId } = paramsValidation.data;
    const updateData = bodyValidation.data;

    // Verify ownership before updating
    const existingConversation = await db.sAMConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!existingConversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Update conversation
    const updatedConversation = await db.sAMConversation.update({
      where: { id: conversationId },
      data: {
        ...updateData,
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedConversation.id,
        sessionId: updatedConversation.sessionId,
        courseId: updatedConversation.courseId,
        chapterId: updatedConversation.chapterId,
        sectionId: updatedConversation.sectionId,
        isActive: updatedConversation.isActive,
        tutorMode: updatedConversation.tutorMode,
        startedAt: updatedConversation.startedAt,
        endedAt: updatedConversation.endedAt,
        messageCount: updatedConversation._count.messages,
      },
    });

  } catch (error: any) {
    logger.error('Error updating conversation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to update conversation',
      coexport const DELETE = withAuth(async (request, context, params) => {
  export async function DELETE(
  req: NextRequest,
    // Authentication check
    
    
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
}, {
  rateLimit: { requests: 25, window: 60000 },
  auditLog: false
});, { status: 401 });
    }

    // Resolve params Promise
    const params = await context.params;
    
    // Validate path parameters
    const paramsValidation = paramsSchema.safeParse(params);
    
    if (!paramsValidation.success) {
      return NextResponse.json({
        error: 'Invalid conversation ID',
        code: 'VALIDATION_ERROR',
        details: paramsValidation.error.issues,
      }, { status: 400 });
    }

    const { conversationId } = paramsValidation.data;

    // Verify ownership before deletion
    const existingConversation = await db.sAMConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!existingConversation) {
      return NextResponse.json({ 
        error: 'Conversation not found or access denied',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete conversation and its messages (cascade delete)
    await db.sAMConversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
    });

  } catch (error: any) {
    logger.error('Error deleting conversation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Failed to delete conversation',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}