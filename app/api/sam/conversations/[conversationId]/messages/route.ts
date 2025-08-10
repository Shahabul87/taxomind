import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for path parameters
const paramsSchema = z.object({
  conversationId: z.string().uuid({
    message: 'Invalid conversation ID format',
  }),
});

// Validation schema for query parameters
const querySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 200, {
    message: 'Limit must be between 1 and 200',
  }).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, {
    message: 'Offset must be non-negative',
  }).optional(),
  includeMetadata: z.string().toLowerCase().transform(val => val === 'true').optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
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

    // Validate query parameters
    const { searchParams } = new URL(req.url);
    const rawQuery = {
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      includeMetadata: searchParams.get('includeMetadata') || undefined,
    };

    const queryValidation = querySchema.safeParse(rawQuery);
    
    if (!queryValidation.success) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        details: queryValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      }, { status: 400 });
    }

    const { conversationId } = paramsValidation.data;
    const { limit = 100, offset = 0, includeMetadata = false } = queryValidation.data;

    // Verify conversation exists and belongs to user
    const conversation = await db.sAMConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
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

    // Fetch messages with pagination
    const messages = await db.sAMMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        ...(includeMetadata && { metadata: true }),
      },
    });

    // Format response data
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt,
      ...(includeMetadata && msg.metadata && { metadata: msg.metadata }),
    }));

    // Calculate pagination metadata
    const totalMessages = conversation._count.messages;
    const hasMore = offset + messages.length < totalMessages;
    const nextOffset = hasMore ? offset + messages.length : null;

    return NextResponse.json({
      success: true,
      data: formattedMessages,
      metadata: {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        },
        pagination: {
          total: totalMessages,
          limit,
          offset,
          count: messages.length,
          hasMore,
          nextOffset,
        },
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Error fetching conversation messages:', error);
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      }, { status: 400 });
    }

    if (error instanceof Error) {
      // Database connection errors
      if (error.message.includes('ECONNREFUSED')) {
        return NextResponse.json({
          error: 'Database connection failed',
          code: 'DATABASE_ERROR',
        }, { status: 503 });
      }

      // Prisma errors
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({
          error: 'Data integrity error',
          code: 'DATABASE_CONSTRAINT_ERROR',
        }, { status: 409 });
      }
    }

    // Generic error response
    return NextResponse.json({
      error: 'Failed to fetch conversation messages',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}