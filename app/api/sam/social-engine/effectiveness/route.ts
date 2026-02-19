/**
 * SAM Social Engine - Collaboration Effectiveness Route
 * POST /api/sam/social-engine/effectiveness
 *
 * Measure collaboration effectiveness of a learning group
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createSocialEngine } from '@sam-ai/educational';
import type { SocialEngine, SocialLearningGroup } from '@sam-ai/educational';
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

const EffectivenessSchema = z.object({
  groupId: z.string(),
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
    const parsed = EffectivenessSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    // Check user is a member of the group
    const membership = await db.groupMember.findFirst({
      where: {
        groupId: parsed.data.groupId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { message: 'Not a member of this group' } },
        { status: 403 }
      );
    }

    // Fetch group data
    const group = await db.group.findUnique({
      where: { id: parsed.data.groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        GroupDiscussion: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { GroupDiscussionComment: true } },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: { message: 'Group not found' } },
        { status: 404 }
      );
    }

    // Calculate activity metrics
    const totalDiscussions = group.GroupDiscussion.length;
    const totalComments = group.GroupDiscussion.reduce((sum, d) => sum + d._count.GroupDiscussionComment, 0);
    const activityLevel = totalDiscussions + totalComments;

    // Build SocialLearningGroup object
    const socialGroup: SocialLearningGroup = {
      id: group.id,
      name: group.name,
      purpose: group.description || 'Learning and collaboration',
      createdAt: group.createdAt,
      activityLevel,
      collaborationScore: Math.min(1, activityLevel / (group.members.length * 5)),
      members: group.members.map(m => ({
        userId: m.userId,
        role: m.role === 'ADMIN' ? 'leader' as const : 'contributor' as const,
        joinedAt: m.joinedAt,
        contributionScore: 0.5,
        engagementLevel: 0.6,
        helpfulnessRating: 0.7,
      })),
    };

    const engine = getEngine();
    const result = await withRetryableTimeout(
      () => engine.measureCollaborationEffectiveness(socialGroup),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'socialEngine-measureEffectiveness'
    );

    return NextResponse.json({
      success: true,
      data: {
        groupId: group.id,
        groupName: group.name,
        memberCount: group.members.length,
        effectiveness: result,
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[SocialEngine Effectiveness] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[SocialEngine Effectiveness] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to measure effectiveness' } },
      { status: 500 }
    );
  }
}
