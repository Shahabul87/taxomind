import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPgVectorSearchService } from '@/lib/sam/services';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const StoreConversationRequestSchema = z.object({
  sessionId: z.string().min(1),
  role: z.enum(['USER', 'ASSISTANT', 'SYSTEM', 'TOOL']),
  content: z.string().min(1).max(32000),
  turnNumber: z.number().int().min(0),
  tokenCount: z.number().int().min(0).optional(),
  entities: z
    .array(
      z.object({
        type: z.string(),
        value: z.string(),
        confidence: z.number().min(0).max(1),
      })
    )
    .optional(),
  intent: z.string().optional(),
  sentiment: z.number().min(-1).max(1).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const GetContextRequestSchema = z.object({
  sessionId: z.string().min(1),
  maxTurns: z.number().int().min(1).max(100).optional().default(20),
});

// ============================================================================
// POST - Store a conversation turn
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const request = StoreConversationRequestSchema.parse(body);
    const searchService = getPgVectorSearchService();
    const userId = session.user.id;

    const id = await searchService.storeConversationMemory({
      userId,
      sessionId: request.sessionId,
      role: request.role,
      content: request.content,
      turnNumber: request.turnNumber,
      tokenCount: request.tokenCount,
      entities: request.entities,
      intent: request.intent,
      sentiment: request.sentiment,
      metadata: request.metadata,
    });

    logger.info('[Conversation Memory] Stored turn', {
      userId,
      sessionId: request.sessionId,
      role: request.role,
      turnNumber: request.turnNumber,
    });

    return NextResponse.json({
      success: true,
      data: { id, sessionId: request.sessionId, turnNumber: request.turnNumber },
    });
  } catch (error) {
    logger.error('[Conversation Memory] Error storing:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to store conversation turn' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get conversation context for a session
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const request = GetContextRequestSchema.parse({
      sessionId: searchParams.get('sessionId'),
      maxTurns: searchParams.get('maxTurns')
        ? parseInt(searchParams.get('maxTurns') ?? '20', 10)
        : undefined,
    });

    const searchService = getPgVectorSearchService();
    const context = await searchService.getConversationContext(
      request.sessionId,
      request.maxTurns
    );

    logger.debug('[Conversation Memory] Retrieved context', {
      sessionId: request.sessionId,
      turnCount: context.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: request.sessionId,
        turnCount: context.length,
        context,
      },
    });
  } catch (error) {
    logger.error('[Conversation Memory] Error getting context:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get conversation context' },
      { status: 500 }
    );
  }
}
