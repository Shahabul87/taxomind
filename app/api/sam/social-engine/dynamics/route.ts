/**
 * SAM Social Engine - Group Dynamics Route
 * POST /api/sam/social-engine/dynamics
 *
 * Assess group dynamics and collaboration patterns
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

const DynamicsSchema = z.object({
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
    const parsed = DynamicsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    // Check user is a member
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

    // Fetch comprehensive group data
    const [group, discussionStats, recentActivity] = await Promise.all([
      db.group.findUnique({
        where: { id: parsed.data.groupId },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, createdAt: true } },
            },
          },
          discussions: {
            take: 100,
            orderBy: { createdAt: 'desc' },
            include: {
              User: { select: { id: true } },
              _count: { select: { comments: true } },
            },
          },
        },
      }),
      // Get discussion statistics
      db.groupDiscussion.groupBy({
        by: ['authorId'],
        where: { groupId: parsed.data.groupId },
        _count: true,
      }),
      // Get recent comment activity
      db.groupDiscussionComment.findMany({
        where: {
          discussion: { groupId: parsed.data.groupId },
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: {
          authorId: true,
          createdAt: true,
        },
      }),
    ]);

    if (!group) {
      return NextResponse.json(
        { success: false, error: { message: 'Group not found' } },
        { status: 404 }
      );
    }

    // Calculate activity metrics per member
    const memberActivityMap = new Map<string, number>();
    discussionStats.forEach(stat => {
      memberActivityMap.set(stat.authorId, (memberActivityMap.get(stat.authorId) || 0) + stat._count);
    });
    recentActivity.forEach(activity => {
      memberActivityMap.set(activity.authorId, (memberActivityMap.get(activity.authorId) || 0) + 0.5);
    });

    // Calculate total activity level
    const totalDiscussions = group.discussions.length;
    const totalComments = group.discussions.reduce((sum, d) => sum + d._count.comments, 0);
    const activityLevel = totalDiscussions + totalComments;

    // Calculate collaboration score based on participation distribution
    const activeMembers = memberActivityMap.size;
    const totalMembers = group.members.length;
    const participationRate = totalMembers > 0 ? activeMembers / totalMembers : 0;

    // Build SocialLearningGroup object with detailed member data
    const socialGroup: SocialLearningGroup = {
      id: group.id,
      name: group.name,
      purpose: group.description || 'Learning and collaboration',
      createdAt: group.createdAt,
      activityLevel,
      collaborationScore: Math.min(1, participationRate * 1.5), // Weighted participation
      members: group.members.map(m => {
        const memberActivity = memberActivityMap.get(m.userId) || 0;
        const maxActivity = Math.max(...Array.from(memberActivityMap.values()), 1);

        return {
          userId: m.userId,
          role: m.role === 'ADMIN' ? 'leader' as const : 'contributor' as const,
          joinedAt: m.joinedAt,
          contributionScore: Math.min(1, memberActivity / maxActivity),
          engagementLevel: memberActivity > 0 ? Math.min(1, 0.3 + memberActivity / (maxActivity * 2)) : 0.1,
          helpfulnessRating: 0.6 + (memberActivity > 0 ? 0.2 : 0), // Higher base for active members
        };
      }),
    };

    const engine = getEngine();
    const result = await withRetryableTimeout(
      () => engine.assessGroupDynamics(socialGroup),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'socialEngine-assessDynamics'
    );

    // Calculate additional insights
    const topContributors = group.members
      .map(m => ({
        userId: m.userId,
        name: m.user.name,
        activity: memberActivityMap.get(m.userId) || 0,
      }))
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        groupId: group.id,
        groupName: group.name,
        memberCount: group.members.length,
        activeMembers,
        participationRate: Math.round(participationRate * 100),
        dynamics: result,
        insights: {
          topContributors,
          totalDiscussions,
          totalComments,
          activityLevel,
        },
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[SocialEngine Dynamics] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[SocialEngine Dynamics] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to assess dynamics' } },
      { status: 500 }
    );
  }
}
