/**
 * SAM Social Engine - Knowledge Sharing Impact Route
 * POST /api/sam/social-engine/knowledge-sharing
 *
 * Evaluate knowledge sharing impact from interactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createSocialEngine } from '@sam-ai/educational';
import type { SocialEngine, SocialInteraction } from '@sam-ai/educational';
import { getSocialEngineAdapter } from '@/lib/adapters';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { handleAIAccessError } from '@/lib/sam/ai-provider';

// Engine singleton
let engineInstance: SocialEngine | null = null;

function getEngine(): SocialEngine {
  if (!engineInstance) {
    engineInstance = createSocialEngine({
      databaseAdapter: getSocialEngineAdapter(),
    });
  }
  return engineInstance;
}

const KnowledgeSharingSchema = z.object({
  groupId: z.string().optional(),
  userId: z.string().optional(),
  limit: z.number().min(10).max(500).optional().default(100),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = KnowledgeSharingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { groupId, userId, limit } = parsed.data;

    // Build where clause
    const discussionWhere: Record<string, unknown> = {};
    if (groupId) {
      // Verify membership
      const membership = await db.groupMember.findFirst({
        where: {
          groupId,
          userId: session.user.id,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { success: false, error: { message: 'Not a member of this group' } },
          { status: 403 }
        );
      }

      discussionWhere.groupId = groupId;
    }

    if (userId) {
      discussionWhere.authorId = userId;
    }

    // Fetch discussions and comments
    const [discussions, comments] = await Promise.all([
      db.groupDiscussion.findMany({
        where: discussionWhere,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          User: { select: { id: true } },
        },
      }),
      db.groupDiscussionComment.findMany({
        where: groupId ? {
          discussion: { groupId },
        } : userId ? {
          authorId: userId,
        } : {},
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
        include: {
          User: { select: { id: true } },
          discussion: { select: { authorId: true } },
        },
      }),
    ]);

    // Convert to SocialInteraction format
    const interactions: SocialInteraction[] = [];

    // Add discussions as posts
    for (const discussion of discussions) {
      const sentiment = analyzeSentiment(discussion.content);
      interactions.push({
        id: discussion.id,
        type: 'post',
        userId: discussion.authorId,
        contentId: discussion.id,
        timestamp: discussion.createdAt,
        sentiment,
        helpfulness: discussion.likesCount > 0 ? Math.min(1, discussion.likesCount / 10) : 0.5,
        impact: discussion.likesCount > 5 ? 0.8 : 0.4,
      });
    }

    // Add comments
    for (const comment of comments) {
      const sentiment = analyzeSentiment(comment.content);
      interactions.push({
        id: comment.id,
        type: 'comment',
        userId: comment.authorId,
        targetUserId: comment.discussion?.authorId,
        contentId: comment.discussionId,
        timestamp: comment.createdAt,
        sentiment,
        helpfulness: 0.6,
        impact: 0.5,
      });
    }

    const engine = getEngine();
    const result = await withRetryableTimeout(
      () => engine.evaluateKnowledgeSharing(interactions),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'socialEngine-evaluateKnowledgeSharing'
    );

    return NextResponse.json({
      success: true,
      data: {
        interactionCount: interactions.length,
        groupId,
        userId,
        impact: result,
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[SocialEngine KnowledgeSharing] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[SocialEngine KnowledgeSharing] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to evaluate knowledge sharing' } },
      { status: 500 }
    );
  }
}

// Helper function for basic sentiment analysis
function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lowerText = text.toLowerCase();

  const positiveWords = ['thanks', 'great', 'awesome', 'helpful', 'excellent', 'amazing', 'good', 'love', 'perfect'];
  const negativeWords = ['bad', 'wrong', 'terrible', 'hate', 'awful', 'poor', 'issue', 'problem', 'stuck', 'help'];

  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}
