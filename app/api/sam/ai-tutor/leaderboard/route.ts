import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

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
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

async function getGlobalLeaderboard(period: string, limit: number) {
  const periodFilter = getPeriodFilter(period);
  
  // Mock data for now - in production, this would query actual user statistics
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true
    },
    take: limit,
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Generate mock leaderboard data
  const leaderboard = users.map((user, index) => ({
    rank: index + 1,
    userId: user.id,
    name: user.name,
    image: user.image,
    points: Math.floor(Math.random() * 5000) + 1000,
    level: Math.floor(Math.random() * 20) + 1,
    streak: Math.floor(Math.random() * 100) + 1,
    coursesCompleted: Math.floor(Math.random() * 10) + 1,
    timeStudied: Math.floor(Math.random() * 1000) + 100, // minutes
    badges: Math.floor(Math.random() * 15) + 1,
    achievements: Math.floor(Math.random() * 25) + 5,
    change: Math.floor(Math.random() * 21) - 10, // -10 to +10
    stats: {
      questionsAsked: Math.floor(Math.random() * 200) + 50,
      helpfulAnswers: Math.floor(Math.random() * 50) + 10,
      contentCreated: Math.floor(Math.random() * 20) + 1,
      averageScore: Math.floor(Math.random() * 30) + 70 // 70-100%
    }
  }));

  // Sort by points
  return leaderboard.sort((a, b) => b.points - a.points).map((user, index) => ({
    ...user,
    rank: index + 1
  }));
}

async function getClassLeaderboard(courseId: string, period: string, limit: number) {
  const periodFilter = getPeriodFilter(period);
  
  // Get enrolled students in the course
  const enrollments = await db.enrollment.findMany({
    where: {
      courseId: courseId,
      ...periodFilter
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    },
    take: limit
  });

  // Generate mock class leaderboard
  const classLeaderboard = enrollments.map((enrollment, index) => ({
    rank: index + 1,
    userId: enrollment.user.id,
    name: enrollment.user.name,
    image: enrollment.user.image,
    points: Math.floor(Math.random() * 3000) + 500,
    level: Math.floor(Math.random() * 15) + 1,
    streak: Math.floor(Math.random() * 50) + 1,
    coursesCompleted: Math.floor(Math.random() * 5) + 1,
    timeStudied: Math.floor(Math.random() * 500) + 50,
    badges: Math.floor(Math.random() * 10) + 1,
    achievements: Math.floor(Math.random() * 15) + 3,
    change: Math.floor(Math.random() * 11) - 5,
    courseProgress: Math.floor(Math.random() * 100) + 1,
    courseScore: Math.floor(Math.random() * 30) + 70,
    chaptersCompleted: Math.floor(Math.random() * 10) + 1,
    enrolledAt: enrollment.createdAt
  }));

  return classLeaderboard.sort((a, b) => b.points - a.points).map((user, index) => ({
    ...user,
    rank: index + 1
  }));
}

async function getFriendsLeaderboard(userId: string, period: string, limit: number) {
  // Mock friends leaderboard - in production, this would query user's friends
  const mockFriends = [
    {
      rank: 1,
      userId: 'friend1',
      name: 'Alex Chen',
      image: null,
      points: 2800,
      level: 12,
      streak: 45,
      coursesCompleted: 3,
      timeStudied: 420,
      badges: 8,
      achievements: 12,
      change: 5,
      relationship: 'friend',
      friendsSince: '2024-01-15',
      mutualFriends: 3
    },
    {
      rank: 2,
      userId: 'friend2',
      name: 'Sarah Johnson',
      image: null,
      points: 2650,
      level: 11,
      streak: 32,
      coursesCompleted: 4,
      timeStudied: 380,
      badges: 7,
      achievements: 15,
      change: -2,
      relationship: 'friend',
      friendsSince: '2024-02-01',
      mutualFriends: 5
    },
    {
      rank: 3,
      userId: 'friend3',
      name: 'Mike Rodriguez',
      image: null,
      points: 2400,
      level: 10,
      streak: 28,
      coursesCompleted: 2,
      timeStudied: 350,
      badges: 6,
      achievements: 10,
      change: 3,
      relationship: 'friend',
      friendsSince: '2024-01-20',
      mutualFriends: 2
    }
  ];

  return mockFriends.slice(0, limit);
}

async function getUserRank(userId: string, type: string, period: string, courseId?: string) {
  // Mock user rank data
  return {
    rank: Math.floor(Math.random() * 50) + 1,
    totalUsers: Math.floor(Math.random() * 1000) + 100,
    percentile: Math.floor(Math.random() * 100) + 1,
    points: Math.floor(Math.random() * 3000) + 500,
    level: Math.floor(Math.random() * 15) + 1,
    streak: Math.floor(Math.random() * 60) + 1,
    change: Math.floor(Math.random() * 21) - 10,
    nextRankPoints: Math.floor(Math.random() * 500) + 100,
    stats: {
      coursesCompleted: Math.floor(Math.random() * 8) + 1,
      timeStudied: Math.floor(Math.random() * 800) + 100,
      badges: Math.floor(Math.random() * 12) + 1,
      achievements: Math.floor(Math.random() * 20) + 5,
      questionsAsked: Math.floor(Math.random() * 150) + 25,
      helpfulAnswers: Math.floor(Math.random() * 40) + 5,
      averageScore: Math.floor(Math.random() * 25) + 75
    }
  };
}

function getPeriodFilter(period: string) {
  const now = new Date();
  switch (period) {
    case 'daily':
      return {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      };
    case 'weekly':
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      return {
        createdAt: {
          gte: startOfWeek
        }
      };
    case 'monthly':
      return {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
    case 'all_time':
    default:
      return {};
  }
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
        // Mock friend addition
        return NextResponse.json({
          success: true,
          message: 'Friend request sent successfully',
          friendRequest: {
            id: 'mock-request-id',
            fromUserId: user.id,
            toUserId: targetUserId,
            status: 'pending',
            sentAt: new Date().toISOString()
          }
        });

      case 'challenge_friend':
        // Mock challenge creation
        return NextResponse.json({
          success: true,
          message: 'Challenge sent successfully',
          challenge: {
            id: 'mock-challenge-id',
            fromUserId: user.id,
            toUserId: targetUserId,
            type: 'points_race',
            duration: '7_days',
            startDate: new Date().toISOString(),
            status: 'pending'
          }
        });

      case 'join_class_leaderboard':
        // Mock class leaderboard join
        return NextResponse.json({
          success: true,
          message: 'Successfully joined class leaderboard',
          enrollment: {
            courseId,
            userId: user.id,
            joinedAt: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error handling leaderboard action:', error);
    return NextResponse.json(
      { error: 'Failed to process leaderboard action' },
      { status: 500 }
    );
  }
}