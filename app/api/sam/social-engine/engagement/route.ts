/**
 * SAM Social Engine - Engagement Analytics Route
 * POST /api/sam/social-engine/engagement
 *
 * Analyze engagement metrics of a community/group
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createSocialEngine } from '@sam-ai/educational';
import type { SocialEngine, SocialCommunity } from '@sam-ai/educational';
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

const EngagementSchema = z.object({
  communityId: z.string(),
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
    const parsed = EngagementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    // Check user is a member
    const membership = await db.groupMember.findFirst({
      where: {
        groupId: parsed.data.communityId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: { message: 'Not a member of this community' } },
        { status: 403 }
      );
    }

    // Fetch community data with activity metrics
    const [group, discussions, recentMembers] = await Promise.all([
      db.group.findUnique({
        where: { id: parsed.data.communityId },
        include: {
          members: true,
        },
      }),
      db.groupDiscussion.findMany({
        where: { groupId: parsed.data.communityId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.groupMember.count({
        where: {
          groupId: parsed.data.communityId,
          joinedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    if (!group) {
      return NextResponse.json(
        { success: false, error: { message: 'Community not found' } },
        { status: 404 }
      );
    }

    // Calculate activity metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentDiscussions = discussions.filter(d => d.createdAt > thirtyDaysAgo);
    const postsPerDay = recentDiscussions.length / 30;
    const totalComments = discussions.reduce((sum, d) => sum + d.commentsCount, 0);
    const commentsPerPost = discussions.length > 0 ? totalComments / discussions.length : 0;

    // Estimate active members
    const activeMembers = Math.max(1, Math.ceil(group.members.length * 0.4) + recentMembers);

    // Build SocialCommunity object
    const community: SocialCommunity = {
      id: group.id,
      name: group.name,
      memberCount: group.members.length,
      activeMembers: Math.min(activeMembers, group.members.length),
      topics: ['learning', 'collaboration', 'study'],
      activityMetrics: {
        postsPerDay,
        commentsPerPost,
        averageResponseTime: 120, // Default 2 hours
        engagementRate: group.members.length > 0 ? activeMembers / group.members.length : 0,
        growthRate: recentMembers / Math.max(1, group.members.length - recentMembers),
      },
    };

    const engine = getEngine();
    const result = await withRetryableTimeout(
      () => engine.analyzeEngagement(community),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'socialEngine-analyzeEngagement'
    );

    return NextResponse.json({
      success: true,
      data: {
        communityId: group.id,
        communityName: group.name,
        memberCount: group.members.length,
        activeMembers: community.activeMembers,
        engagement: result,
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[SocialEngine Engagement] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[SocialEngine Engagement] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to analyze engagement' } },
      { status: 500 }
    );
  }
}
