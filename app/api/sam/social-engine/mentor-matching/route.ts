/**
 * SAM Social Engine - Mentor Matching Route
 * POST /api/sam/social-engine/mentor-matching
 *
 * Match mentors with mentees based on expertise and learning goals
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createSocialEngine } from '@sam-ai/educational';
import type { SocialEngine, SocialUser } from '@sam-ai/educational';
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

const MentorMatchingSchema = z.object({
  groupId: z.string().optional(),
  courseId: z.string().optional(),
  limit: z.number().min(5).max(100).optional().default(50),
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
    const parsed = MentorMatchingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { groupId, courseId, limit } = parsed.data;

    // Build query conditions
    const userIds: string[] = [];

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

      // Get group members
      const members = await db.groupMember.findMany({
        where: { groupId },
        select: { userId: true },
        take: limit,
      });
      userIds.push(...members.map(m => m.userId));
    } else if (courseId) {
      // Verify enrollment
      const enrollment = await db.enrollment.findFirst({
        where: {
          courseId,
          userId: session.user.id,
        },
      });

      if (!enrollment) {
        return NextResponse.json(
          { success: false, error: { message: 'Not enrolled in this course' } },
          { status: 403 }
        );
      }

      // Get course enrollees
      const enrollments = await db.enrollment.findMany({
        where: { courseId },
        select: { userId: true },
        take: limit,
      });
      userIds.push(...enrollments.map(e => e.userId));
    } else {
      // Get random active users for broader matching
      const recentActivity = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const activeUsers = await db.user.findMany({
        where: {
          lastLoginAt: { gte: recentActivity },
        },
        select: { id: true },
        take: limit,
      });
      userIds.push(...activeUsers.map(u => u.id));
    }

    // Include current user
    if (!userIds.includes(session.user.id)) {
      userIds.push(session.user.id);
    }

    // Fetch user data - the engine uses the database adapter to get detailed profiles
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
      },
      take: 500,
    });

    // Build SocialUser array for matching (engine fetches detailed profiles via adapter)
    const socialUsers: SocialUser[] = users.map(user => ({
      id: user.id,
      name: user.name,
    }));

    const engine = getEngine();
    const results = await withRetryableTimeout(
      () => engine.matchMentorMentee(socialUsers),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'socialEngine-mentorMatching'
    );

    // Find matches relevant to the current user
    const userMatches = results.filter(
      r => r.mentorId === session.user.id || r.menteeId === session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        totalMatches: results.length,
        userMatches: userMatches.length,
        matches: userMatches.slice(0, 10),
        allMatches: results.slice(0, 20),
        context: { groupId, courseId, usersAnalyzed: socialUsers.length },
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[SocialEngine MentorMatching] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[SocialEngine MentorMatching] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to match mentors' } },
      { status: 500 }
    );
  }
}
