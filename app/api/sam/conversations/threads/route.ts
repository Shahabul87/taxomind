import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { getConversationThreadingService } from '@/lib/sam/services/conversation-threading';
import { logger } from '@/lib/logger';
import { safeErrorResponse } from '@/lib/api/safe-error';

// =============================================================================
// VALIDATION
// =============================================================================

const CreateThreadSchema = z.object({
  parentConversationId: z.string().min(1),
  topic: z.string().max(200).optional(),
  threadType: z.enum(['MAIN', 'BRANCH', 'FOLLOW_UP']).optional(),
  courseId: z.string().optional(),
});

const ListThreadsSchema = z.object({
  conversationId: z.string().min(1),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// =============================================================================
// HANDLERS
// =============================================================================

/**
 * GET /api/sam/conversations/threads
 * List threads for a conversation
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'readonly');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parseResult = ListThreadsSchema.safeParse({
      conversationId: searchParams.get('conversationId'),
      cursor: searchParams.get('cursor') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { conversationId, cursor, limit } = parseResult.data;
    const service = getConversationThreadingService();
    const result = await service.getThreads(conversationId, user.id, { cursor, limit });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('[Threads API] GET error:', error);
    return NextResponse.json({ error: 'Failed to list threads' }, { status: 500 });
  }
}

/**
 * POST /api/sam/conversations/threads
 * Create a new thread/branch
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rawBody: unknown = await request.json();
    const parseResult = CreateThreadSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { parentConversationId, topic, threadType, courseId } = parseResult.data;
    const service = getConversationThreadingService();

    const thread = await service.createThread(parentConversationId, user.id, {
      topic,
      threadType,
      courseId,
    });

    return NextResponse.json({
      success: true,
      data: thread,
    });
  } catch (error) {
    return safeErrorResponse(error, 500, 'SAM_CONVERSATIONS_THREADS_CREATE');
  }
}
