/**
 * SAM Presence Buddies API Route
 *
 * Finds potential study buddies based on shared courses, topics,
 * and learning goals. Uses presence data to show online status.
 *
 * Features:
 * - Course/topic matching
 * - Compatibility scoring
 * - Status filtering
 * - Real-time availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

type BuddyStatus = 'online' | 'studying' | 'away' | 'offline';
type MatchReason = 'same_course' | 'similar_goal' | 'same_topic' | 'complementary_skills';

interface StudyBuddy {
  id: string;
  name: string;
  avatar?: string;
  status: BuddyStatus;
  currentActivity?: string;
  sharedCourses: string[];
  sharedTopics: string[];
  compatibilityScore: number;
  matchReasons: MatchReason[];
  lastActive?: string;
  studyStreak?: number;
}

// ============================================================================
// SCHEMAS
// ============================================================================

const QueryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  minCompatibility: z.coerce.number().min(0).max(100).default(30),
  status: z.enum(['online', 'studying', 'away', 'offline', 'all']).optional(),
});

// ============================================================================
// HELPERS
// ============================================================================

function calculateCompatibilityScore(
  sharedCourses: string[],
  sharedTopics: string[],
  matchReasons: MatchReason[]
): number {
  let score = 0;

  // Base score from shared courses (max 40 points)
  score += Math.min(sharedCourses.length * 15, 40);

  // Score from shared topics (max 30 points)
  score += Math.min(sharedTopics.length * 10, 30);

  // Bonus for match reasons (max 30 points)
  score += Math.min(matchReasons.length * 10, 30);

  return Math.min(score, 100);
}

function mapPresenceStatus(lastSeen: Date | null, isActive: boolean): BuddyStatus {
  if (!lastSeen) return 'offline';

  const now = new Date();
  const minutesAgo = (now.getTime() - lastSeen.getTime()) / (1000 * 60);

  if (isActive || minutesAgo < 5) return 'online';
  if (minutesAgo < 15) return 'studying';
  if (minutesAgo < 60) return 'away';
  return 'offline';
}

// ============================================================================
// GET - Fetch study buddies
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryValidation = QueryParamsSchema.safeParse({
      limit: searchParams.get('limit') ?? 10,
      minCompatibility: searchParams.get('minCompatibility') ?? 30,
      status: searchParams.get('status') ?? undefined,
    });

    if (!queryValidation.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryValidation.error.flatten(),
        },
      }, { status: 400 });
    }

    const { limit, minCompatibility, status } = queryValidation.data;
    const userId = session.user.id;

    logger.debug('[SAM_BUDDIES] Finding study buddies', {
      userId,
      limit,
      minCompatibility,
      status,
    });

    // Get current user's enrolled courses
    const userEnrollments = await db.enrollment.findMany({
      where: { userId },
      select: {
        courseId: true,
        Course: {
          select: {
            title: true,
            categoryId: true,
          }
        }
      },
    });

    const userCourseIds = userEnrollments.map(e => e.courseId);
    const userCategories = userEnrollments
      .map(e => e.Course?.categoryId)
      .filter((id): id is string => id != null);

    if (userCourseIds.length === 0) {
      // User has no enrollments - return empty list
      return NextResponse.json({
        success: true,
        data: {
          buddies: [],
          meta: {
            total: 0,
            filtered: 0,
            message: 'Enroll in courses to find study buddies',
          },
        },
      });
    }

    // Find other users enrolled in the same courses
    const potentialBuddies = await db.enrollment.findMany({
      where: {
        courseId: { in: userCourseIds },
        userId: { not: userId },
      },
      select: {
        userId: true,
        courseId: true,
        Course: {
          select: {
            title: true,
          }
        },
        User: {
          select: {
            id: true,
            name: true,
            image: true,
            lastLoginAt: true,
          }
        }
      },
      distinct: ['userId'],
      take: limit * 3, // Get more to allow filtering
    });

    // Group enrollments by user
    const userEnrollmentMap = new Map<string, {
      user: { id: string; name: string | null; image: string | null; lastLoginAt: Date | null };
      courses: string[];
      courseIds: string[];
    }>();

    for (const enrollment of potentialBuddies) {
      if (!enrollment.User) continue;

      const existing = userEnrollmentMap.get(enrollment.userId);
      if (existing) {
        existing.courses.push(enrollment.Course?.title ?? 'Unknown Course');
        existing.courseIds.push(enrollment.courseId);
      } else {
        userEnrollmentMap.set(enrollment.userId, {
          user: enrollment.User,
          courses: [enrollment.Course?.title ?? 'Unknown Course'],
          courseIds: [enrollment.courseId],
        });
      }
    }

    // Build buddy list with compatibility scores
    const buddies: StudyBuddy[] = [];

    for (const [buddyId, data] of userEnrollmentMap) {
      const matchReasons: MatchReason[] = [];
      const sharedCourses = data.courses;
      const sharedTopics: string[] = []; // Could be enhanced with actual topic data

      // Determine match reasons
      if (sharedCourses.length > 0) {
        matchReasons.push('same_course');
      }
      if (sharedCourses.length >= 2) {
        matchReasons.push('similar_goal');
      }

      const compatibilityScore = calculateCompatibilityScore(
        sharedCourses,
        sharedTopics,
        matchReasons
      );

      // Skip if below minimum compatibility
      if (compatibilityScore < minCompatibility) continue;

      const buddyStatus = mapPresenceStatus(
        data.user.lastLoginAt,
        false // Could be enhanced with real-time presence data
      );

      // Filter by status if specified
      if (status && status !== 'all' && buddyStatus !== status) continue;

      buddies.push({
        id: buddyId,
        name: data.user.name ?? 'Anonymous Learner',
        avatar: data.user.image ?? undefined,
        status: buddyStatus,
        currentActivity: sharedCourses[0] ? `Studying ${sharedCourses[0]}` : undefined,
        sharedCourses,
        sharedTopics,
        compatibilityScore,
        matchReasons,
        lastActive: data.user.lastLoginAt?.toISOString(),
        studyStreak: 0, // Could be enhanced with streak data
      });
    }

    // Sort by compatibility score (descending) then by status
    const statusOrder: Record<BuddyStatus, number> = {
      online: 0,
      studying: 1,
      away: 2,
      offline: 3,
    };

    buddies.sort((a, b) => {
      if (b.compatibilityScore !== a.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }
      return statusOrder[a.status] - statusOrder[b.status];
    });

    // Limit results
    const limitedBuddies = buddies.slice(0, limit);

    logger.debug('[SAM_BUDDIES] Found study buddies', {
      userId,
      total: buddies.length,
      returned: limitedBuddies.length,
      onlineCount: limitedBuddies.filter(b => b.status === 'online').length,
      highMatchCount: limitedBuddies.filter(b => b.compatibilityScore >= 70).length,
    });

    return NextResponse.json({
      success: true,
      data: {
        buddies: limitedBuddies,
        meta: {
          total: buddies.length,
          returned: limitedBuddies.length,
          onlineCount: limitedBuddies.filter(b => b.status === 'online').length,
          highMatchCount: limitedBuddies.filter(b => b.compatibilityScore >= 70).length,
        },
      },
    });
  } catch (error) {
    logger.error('[SAM_BUDDIES] Error fetching buddies', { error });
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch study buddies',
      },
    }, { status: 500 });
  }
}
