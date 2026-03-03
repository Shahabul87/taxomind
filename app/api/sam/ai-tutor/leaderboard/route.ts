import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'global'; // 'global' | 'class' | 'friends'
    const period = searchParams.get('period') || 'all_time'; // 'daily' | 'weekly' | 'monthly' | 'all_time'
    const limit = parseInt(searchParams.get('limit') || '50');
    const courseId = searchParams.get('courseId');

    let leaderboardData;
    let userRank;

    switch (type) {
      case 'global':
        leaderboardData = await getGlobalLeaderboard(period, limit);
        userRank = await getUserRank(user.id, 'global', period);
        break;
      case 'class':
        if (!courseId) {
          return NextResponse.json({ error: 'Course ID required for class leaderboard' }, { status: 400 });
        }
        leaderboardData = await getClassLeaderboard(courseId, period, limit);
        userRank = await getUserRank(user.id, 'class', period, courseId);
        break;
      case 'friends':
        leaderboardData = await getFriendsLeaderboard(user.id, period, limit);
        userRank = await getUserRank(user.id, 'friends', period);
        break;
      default:
        return NextResponse.json({ error: 'Invalid leaderboard type' }, { status: 400 });
    }

    return NextResponse.json({
      leaderboard: leaderboardData,
      userRank,
      meta: {
        type,
        period,
        total: leaderboardData.length,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

async function getGlobalLeaderboard(period: string, limit: number) {
  return buildLeaderboard({ period, limit });
}

async function getClassLeaderboard(courseId: string, period: string, limit: number) {
  const enrollments = await db.enrollment.findMany({
    where: { courseId },
    select: { userId: true, createdAt: true },
    take: 500,
  });

  const userIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.userId)));
  if (userIds.length === 0) return [];

  const leaderboard = await buildLeaderboard({
    period,
    limit,
    courseId,
    userIds,
    enrollmentMap: new Map(enrollments.map((item) => [item.userId, item.createdAt])),
  });

  return leaderboard;
}

async function getFriendsLeaderboard(userId: string, period: string, limit: number) {
  const friendGroups = await db.group.findMany({
    where: {
      tags: { has: 'sam-friends' },
      members: { some: { userId } },
    },
    select: { id: true },
    take: 100,
  });

  if (!friendGroups.length) return [];

  const groupIds = friendGroups.map((group) => group.id);
  const members = await db.groupMember.findMany({
    where: {
      groupId: { in: groupIds },
      userId: { not: userId },
      status: 'active',
    },
    select: { userId: true },
    take: 500,
  });

  const friendIds = Array.from(new Set(members.map((item) => item.userId)));
  if (friendIds.length === 0) return [];

  return buildLeaderboard({ period, limit, userIds: friendIds });
}

async function getUserRank(userId: string, type: string, period: string, courseId?: string) {
  const periodStart = getPeriodStart(period);
  const pointsWhere: Prisma.SAMPointsWhereInput = {
    ...(periodStart ? { awardedAt: { gte: periodStart } } : {}),
  };

  if (courseId) {
    pointsWhere.courseId = courseId;
  }

  let scopedUserIds: string[] | null = null;
  if (type === 'class' && courseId) {
    const enrollments = await db.enrollment.findMany({
      where: { courseId },
      select: { userId: true },
      take: 500,
    });
    scopedUserIds = enrollments.map((item) => item.userId);
  } else if (type === 'friends') {
    const friendGroups = await db.group.findMany({
      where: {
        tags: { has: 'sam-friends' },
        members: { some: { userId } },
      },
      select: { id: true },
      take: 100,
    });
    if (friendGroups.length) {
      const groupIds = friendGroups.map((group) => group.id);
      const members = await db.groupMember.findMany({
        where: {
          groupId: { in: groupIds },
          userId: { not: userId },
          status: 'active',
        },
        select: { userId: true },
        take: 500,
      });
      scopedUserIds = Array.from(new Set(members.map((item) => item.userId)));
    } else {
      scopedUserIds = [];
    }
  }

  if (scopedUserIds && scopedUserIds.length === 0) {
    return {
      rank: null,
      totalUsers: 0,
      percentile: 0,
      points: 0,
      level: 1,
      streak: 0,
      change: 0,
      nextRankPoints: 0,
      stats: {
        coursesCompleted: 0,
        timeStudied: 0,
        badges: 0,
        achievements: 0,
        questionsAsked: 0,
        helpfulAnswers: 0,
        averageScore: 0,
      },
    };
  }

  if (scopedUserIds) {
    pointsWhere.userId = { in: scopedUserIds };
  }

  // Efficient rank calculation: aggregate user's points, then count users with more points
  const userPointsAgg = await db.sAMPoints.aggregate({
    where: { ...pointsWhere, userId },
    _sum: { points: true },
  });
  const points = userPointsAgg._sum.points ?? 0;

  // Count distinct users and users with more points for rank
  const allUsersAgg = await db.sAMPoints.groupBy({
    by: ['userId'],
    where: pointsWhere,
    _sum: { points: true },
  });
  const totalUsers = allUsersAgg.length;
  const usersAbove = allUsersAgg.filter((entry) => (entry._sum.points ?? 0) > points).length;
  const rank = points > 0 ? usersAbove + 1 : null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { samLevel: true },
  });

  const streak = await db.sAMStreak.findUnique({
    where: { userId },
    select: { currentStreak: true },
  });

  return {
    rank,
    totalUsers,
    percentile: totalUsers > 0 && rank ? Math.round(((totalUsers - rank) / totalUsers) * 100) : 0,
    points,
    level: user?.samLevel ?? 1,
    streak: streak?.currentStreak ?? 0,
    change: 0,
    nextRankPoints: 0,
    stats: {
      coursesCompleted: 0,
      timeStudied: 0,
      badges: 0,
      achievements: 0,
      questionsAsked: 0,
      helpfulAnswers: 0,
      averageScore: 0,
    },
  };
}

function getPeriodStart(period: string): Date | null {
  const now = new Date();
  switch (period) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'weekly':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return startOfWeek;
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'all_time':
    default:
      return null;
  }
}

async function buildLeaderboard(options: {
  period: string;
  limit: number;
  courseId?: string;
  userIds?: string[];
  enrollmentMap?: Map<string, Date>;
}) {
  const { period, limit, courseId, userIds, enrollmentMap } = options;
  const periodStart = getPeriodStart(period);

  const pointsWhere: Prisma.SAMPointsWhereInput = {
    ...(periodStart ? { awardedAt: { gte: periodStart } } : {}),
    ...(courseId ? { courseId } : {}),
    ...(userIds ? { userId: { in: userIds } } : {}),
  };

  const pointsAgg = await db.sAMPoints.groupBy({
    by: ['userId'],
    where: pointsWhere,
    _sum: { points: true },
    orderBy: { _sum: { points: 'desc' } },
    take: limit,
  });

  if (!pointsAgg.length) return [];

  const ids = pointsAgg.map((row) => row.userId);

  // Parallelize independent queries for performance
  const activityWhere: Prisma.LearningActivityLogWhereInput = {
    userId: { in: ids },
    ...(courseId ? { courseId } : {}),
    ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
  };

  const [users, streaks, badgesAgg, activityAgg, chatAgg, contentAgg, examAttempts] = await Promise.all([
    db.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        image: true,
        samLevel: true,
      },
      take: 500,
    }),
    db.sAMStreak.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, currentStreak: true },
      take: 500,
    }),
    db.sAMBadge.groupBy({
      by: ['userId'],
      where: { userId: { in: ids } },
      _count: { _all: true },
    }),
    db.learningActivityLog.groupBy({
      by: ['userId'],
      where: activityWhere,
      _sum: { duration: true },
    }),
    db.sAMInteraction.groupBy({
      by: ['userId'],
      where: {
        userId: { in: ids },
        interactionType: 'CHAT_MESSAGE',
        ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
        ...(courseId ? { courseId } : {}),
      },
      _count: { _all: true },
    }),
    db.sAMPoints.groupBy({
      by: ['userId'],
      where: {
        userId: { in: ids },
        category: 'CONTENT_CREATION',
        ...(periodStart ? { awardedAt: { gte: periodStart } } : {}),
        ...(courseId ? { courseId } : {}),
      },
      _count: { _all: true },
    }),
    db.userExamAttempt.findMany({
    where: {
      userId: { in: ids },
      ...(periodStart ? { createdAt: { gte: periodStart } } : {}),
      ...(courseId
        ? {
            Exam: {
              is: {
                section: {
                  is: {
                    chapter: {
                      is: { courseId },
                    },
                  },
                },
              },
            },
          }
        : {}),
    },
    select: {
      userId: true,
      scorePercentage: true,
      isPassed: true,
      Exam: {
        select: {
          section: {
            select: {
              chapter: {
                select: { courseId: true },
              },
            },
          },
        },
      },
    },
    take: 500,
  }),
  ]);

  const userMap = new Map(users.map((user) => [user.id, user]));
  const streakMap = new Map(streaks.map((item) => [item.userId, item.currentStreak]));
  const badgeMap = new Map(badgesAgg.map((item) => [item.userId, item._count._all]));
  const activityMap = new Map(activityAgg.map((item) => [item.userId, item._sum.duration ?? 0]));
  const chatMap = new Map(chatAgg.map((item) => [item.userId, item._count._all]));
  const contentMap = new Map(contentAgg.map((item) => [item.userId, item._count._all]));

  const courseCompletionByUser = new Map<string, Set<string>>();
  const scoreBuckets = new Map<string, number[]>();

  examAttempts.forEach((attempt) => {
    if (attempt.scorePercentage != null) {
      const scores = scoreBuckets.get(attempt.userId) ?? [];
      scores.push(attempt.scorePercentage);
      scoreBuckets.set(attempt.userId, scores);
    }
    if (attempt.isPassed && attempt.Exam?.section?.chapter?.courseId) {
      const set = courseCompletionByUser.get(attempt.userId) ?? new Set<string>();
      set.add(attempt.Exam.section.chapter.courseId);
      courseCompletionByUser.set(attempt.userId, set);
    }
  });

  let sectionCountsByUser: Map<string, number> | null = null;
  let chapterCountsByUser: Map<string, number> | null = null;

  if (courseId) {
    const logs = await db.learningActivityLog.findMany({
      where: {
        courseId,
        userId: { in: ids },
      },
      select: { userId: true, sectionId: true },
      take: 500,
    });

    const sectionIds = Array.from(new Set(logs.map((log) => log.sectionId).filter(Boolean))) as string[];
    const sections = sectionIds.length
      ? await db.section.findMany({
          where: { id: { in: sectionIds } },
          select: { id: true, chapterId: true },
          take: 500,
        })
      : [];

    const sectionToChapter = new Map(sections.map((section) => [section.id, section.chapterId]));
    const sectionMap = new Map<string, Set<string>>();
    const chapterMap = new Map<string, Set<string>>();

    logs.forEach((log) => {
      if (!log.sectionId) return;
      const sectionSet = sectionMap.get(log.userId) ?? new Set<string>();
      sectionSet.add(log.sectionId);
      sectionMap.set(log.userId, sectionSet);

      const chapterId = sectionToChapter.get(log.sectionId);
      if (chapterId) {
        const chapterSet = chapterMap.get(log.userId) ?? new Set<string>();
        chapterSet.add(chapterId);
        chapterMap.set(log.userId, chapterSet);
      }
    });

    sectionCountsByUser = new Map(
      Array.from(sectionMap.entries()).map(([id, set]) => [id, set.size])
    );
    chapterCountsByUser = new Map(
      Array.from(chapterMap.entries()).map(([id, set]) => [id, set.size])
    );
  }

  const totalSections = courseId
    ? await db.section.count({ where: { chapter: { courseId } } })
    : 0;

  return pointsAgg.map((row, index) => {
    const user = userMap.get(row.userId);
    const points = row._sum.points ?? 0;
    const scores = scoreBuckets.get(row.userId) ?? [];
    const avgScore = scores.length ? Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length) : 0;
    const timeStudiedMinutes = Math.round((activityMap.get(row.userId) ?? 0) / 60);
    const courseCompletedCount = courseCompletionByUser.get(row.userId)?.size ?? 0;

    const sectionCount = sectionCountsByUser?.get(row.userId) ?? 0;
    const courseProgress = totalSections > 0 ? Math.round((sectionCount / totalSections) * 100) : 0;

    return {
      rank: index + 1,
      userId: row.userId,
      name: user?.name ?? 'Unknown',
      image: user?.image ?? null,
      points,
      level: user?.samLevel ?? 1,
      streak: streakMap.get(row.userId) ?? 0,
      coursesCompleted: courseCompletedCount,
      timeStudied: timeStudiedMinutes,
      badges: badgeMap.get(row.userId) ?? 0,
      achievements: badgeMap.get(row.userId) ?? 0,
      change: 0,
      stats: {
        questionsAsked: chatMap.get(row.userId) ?? 0,
        helpfulAnswers: 0,
        contentCreated: contentMap.get(row.userId) ?? 0,
        averageScore: avgScore,
      },
      ...(courseId
        ? {
            courseProgress,
            courseScore: avgScore,
            chaptersCompleted: chapterCountsByUser?.get(row.userId) ?? 0,
            enrolledAt: enrollmentMap?.get(row.userId) ?? null,
          }
        : {}),
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, targetUserId, courseId } = await request.json();

    switch (action) {
      case 'add_friend':
        if (!targetUserId) {
          return NextResponse.json({ error: 'Target user required' }, { status: 400 });
        }

        const friendGroup = await db.group.findFirst({
          where: {
            creatorId: user.id,
            tags: { has: 'sam-friends' },
          },
        });

        const group =
          friendGroup ??
          (await db.group.create({
            data: {
              name: 'SAM Friends',
              description: 'SAM friend connections',
              creatorId: user.id,
              isPrivate: true,
              tags: ['sam-friends'],
            },
          }));

        await db.groupMember.upsert({
          where: { userId_groupId: { userId: user.id, groupId: group.id } },
          update: { status: 'active' },
          create: {
            id: randomUUID(),
            userId: user.id,
            groupId: group.id,
            role: 'owner',
            status: 'active',
          },
        });

        await db.groupMember.upsert({
          where: { userId_groupId: { userId: targetUserId, groupId: group.id } },
          update: { status: 'active' },
          create: {
            id: randomUUID(),
            userId: targetUserId,
            groupId: group.id,
            role: 'member',
            status: 'active',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Friend added successfully',
          friendRequest: {
            id: group.id,
            fromUserId: user.id,
            toUserId: targetUserId,
            status: 'active',
            sentAt: new Date().toISOString(),
          },
        });

      case 'challenge_friend':
        if (!targetUserId) {
          return NextResponse.json({ error: 'Target user required' }, { status: 400 });
        }

        const challengeId = randomUUID();
        const challengePayload = {
          id: challengeId,
          type: 'points_race',
          duration: '7_days',
          startDate: new Date().toISOString(),
          status: 'pending',
          fromUserId: user.id,
          toUserId: targetUserId,
        };

        await db.$transaction(async (tx) => {
          const [fromUser, toUser] = await Promise.all([
            tx.user.findUnique({ where: { id: user.id }, select: { samActiveChallenges: true } }),
            tx.user.findUnique({ where: { id: targetUserId }, select: { samActiveChallenges: true } }),
          ]);

          await tx.user.update({
            where: { id: user.id },
            data: {
              samActiveChallenges: [...(Array.isArray(fromUser?.samActiveChallenges) ? fromUser?.samActiveChallenges : []), challengePayload],
            },
          });

          if (toUser) {
            await tx.user.update({
              where: { id: targetUserId },
              data: {
                samActiveChallenges: [...(Array.isArray(toUser.samActiveChallenges) ? toUser.samActiveChallenges : []), challengePayload],
              },
            });
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Challenge sent successfully',
          challenge: challengePayload,
        });

      case 'join_class_leaderboard':
        if (!courseId) {
          return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
        }

        const enrollment = await db.enrollment.upsert({
          where: { userId_courseId: { userId: user.id, courseId } },
          update: { updatedAt: new Date() },
          create: {
            id: randomUUID(),
            userId: user.id,
            courseId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'ACTIVE',
            enrollmentType: 'FREE',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Successfully joined class leaderboard',
          enrollment,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error handling leaderboard action:', error);
    return NextResponse.json(
      { error: 'Failed to process leaderboard action' },
      { status: 500 }
    );
  }
}
