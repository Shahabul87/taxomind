import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ==========================================
// Zod Validation Schemas
// ==========================================

const ProfileResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  website: z.union([z.string().url(), z.literal(''), z.null()]).optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  createdAt: z.string(),
  coursesEnrolled: z.number(),
  coursesCompleted: z.number(),
  certificatesEarned: z.number(),
  totalLearningHours: z.number(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  achievements: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    icon: z.string(),
    earnedAt: z.string(),
    rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
  })),
  recentActivity: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    timestamp: z.string(),
    progress: z.number().optional(),
  })),
  skills: z.array(z.object({
    name: z.string(),
    level: z.number(),
    progress: z.number(),
  })),
  courses: z.array(z.object({
    id: z.string(),
    title: z.string(),
    instructor: z.string(),
    progress: z.number(),
    thumbnail: z.string(),
    lastAccessed: z.string(),
    totalChapters: z.number(),
    completedChapters: z.number(),
  })),
});

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional().nullable(),
  twitter: z.string().max(50).optional(),
  linkedin: z.string().max(100).optional(),
  github: z.string().max(100).optional(),
});

// ==========================================
// API Response Interface
// ==========================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

// ==========================================
// Helper Functions
// ==========================================

function mapBadgeLevelToRarity(badgeLevel: string): 'common' | 'rare' | 'epic' | 'legendary' {
  switch (badgeLevel) {
    case 'BRONZE':
      return 'common';
    case 'SILVER':
      return 'rare';
    case 'GOLD':
    case 'PLATINUM':
      return 'epic';
    case 'DIAMOND':
      return 'legendary';
    default:
      return 'common';
  }
}

function getAchievementIcon(achievementType: string): string {
  const iconMap: Record<string, string> = {
    FIRST_COURSE: '🎓',
    COURSE_COMPLETION: '✅',
    CHAPTER_COMPLETION: '📖',
    PERFECT_QUIZ: '💯',
    STUDY_STREAK: '🔥',
    TIME_MILESTONE: '⏰',
    SKILL_MASTERY: '🏆',
    PEER_HELPER: '🤝',
    EARLY_BIRD: '🌅',
    NIGHT_OWL: '🦉',
    CONSISTENT_LEARNER: '📚',
    FAST_LEARNER: '🚀',
    THOROUGH_LEARNER: '🔍',
    QUESTION_MASTER: '❓',
    DISCUSSION_CONTRIBUTOR: '💬',
  };
  return iconMap[achievementType] || '🏅';
}

// ==========================================
// GET - Fetch User Profile
// ==========================================

export async function GET(request: NextRequest) {
  let session;
  try {
    session = await auth();

    if (!session?.user?.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      return NextResponse.json(response, { status: 401 });
    }

    const userId = session.user.id;

    // ==========================================
    // Fetch User Data with Relations
    // ==========================================

    // ==========================================
    // Fetch Basic User Data (without relations to avoid cascading failures)
    // ==========================================
    let user;
    try {
      user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          bio: true,
          location: true,
          createdAt: true,
        },
      });
    } catch (error) {
      logger.error('[PROFILE_GET] Failed to fetch basic user data:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error('Database query failed');
    }

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    // ==========================================
    // Fetch all profile data in PARALLEL (with individual fallbacks)
    // ==========================================
    const [
      enrollmentsResult,
      certificationsResult,
      learningMetricsResult,
      streaksResult,
      achievementsResult,
      recentProgressResult,
    ] = await Promise.allSettled([
      db.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        take: 100,
        include: {
          Course: {
            include: {
              user: { select: { name: true } },
              chapters: { where: { isPublished: true }, select: { id: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      db.certification.findMany({
        where: { userId, isRevoked: false },
        take: 100,
        select: { id: true, issuedAt: true, courseId: true },
      }),
      db.learning_metrics.findMany({
        where: { userId },
        take: 100,
        select: { totalStudyTime: true, totalSessions: true, averageSessionDuration: true },
      }),
      db.study_streaks.findMany({
        where: { userId },
        take: 100,
        select: { currentStreak: true, longestStreak: true },
      }),
      db.user_achievements.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' },
        take: 20,
        select: { id: true, achievementType: true, title: true, description: true, iconUrl: true, badgeLevel: true, unlockedAt: true },
      }),
      db.user_progress.findMany({
        where: { userId, courseId: { not: null } },
        orderBy: { lastAccessedAt: 'desc' },
        take: 10,
        include: { Course: { select: { title: true } }, Chapter: { select: { title: true } } },
      }),
    ]);

    // Extract results with fallbacks
    const enrolledCourses = enrollmentsResult.status === 'fulfilled' ? enrollmentsResult.value : (() => { logger.warn('[PROFILE_GET] Failed to fetch enrollments'); return [] as Awaited<typeof enrollmentsResult extends PromiseFulfilledResult<infer T> ? T : never>[]; })();
    const certifications = certificationsResult.status === 'fulfilled' ? certificationsResult.value : (() => { logger.warn('[PROFILE_GET] Failed to fetch certifications'); return [] as Array<{ id: string; issuedAt: Date; courseId: string | null }>; })();

    let totalLearningHours = 0;
    if (learningMetricsResult.status === 'fulfilled') {
      const totalLearningMinutes = learningMetricsResult.value.reduce((sum, metric) => sum + (metric.totalStudyTime || 0), 0);
      totalLearningHours = Math.floor(totalLearningMinutes / 60);
    } else {
      logger.warn('[PROFILE_GET] Failed to fetch learning metrics');
    }

    let currentStreak = 0;
    let longestStreak = 0;
    if (streaksResult.status === 'fulfilled') {
      currentStreak = streaksResult.value.reduce((max, streak) => Math.max(max, streak.currentStreak || 0), 0);
      longestStreak = streaksResult.value.reduce((max, streak) => Math.max(max, streak.longestStreak || 0), 0);
    } else {
      logger.warn('[PROFILE_GET] Failed to fetch study streaks');
    }

    let achievements: Array<{ id: string; title: string; description: string; icon: string; earnedAt: string; rarity: 'common' | 'rare' | 'epic' | 'legendary' }> = [];
    if (achievementsResult.status === 'fulfilled') {
      achievements = achievementsResult.value.map((achievement) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.iconUrl || getAchievementIcon(achievement.achievementType),
        earnedAt: achievement.unlockedAt.toISOString(),
        rarity: mapBadgeLevelToRarity(achievement.badgeLevel),
      }));
    } else {
      logger.warn('[PROFILE_GET] Failed to fetch achievements');
    }

    let recentActivity: Array<{ id: string; type: string; title: string; timestamp: string; progress?: number }> = [];
    if (recentProgressResult.status === 'fulfilled') {
      recentActivity = recentProgressResult.value.map((progress) => {
        const timeDiff = Date.now() - progress.lastAccessedAt.getTime();
        const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysAgo = Math.floor(hoursAgo / 24);

        let timestamp: string;
        if (hoursAgo < 1) {
          timestamp = 'Just now';
        } else if (hoursAgo < 24) {
          timestamp = `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
        } else {
          timestamp = `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
        }

        let type: string;
        let title: string;

        if (progress.isCompleted) {
          type = progress.chapterId ? 'chapter_completed' : 'course_completed';
          title = progress.chapterId
            ? `Completed "${progress.Chapter?.title || 'Chapter'}" in "${progress.Course?.title || 'Course'}"`
            : `Completed "${progress.Course?.title || 'Course'}"`;
        } else {
          type = 'course_progress';
          title = progress.Chapter
            ? `Continued "${progress.Chapter.title}" in "${progress.Course?.title || 'Course'}"`
            : `Continued "${progress.Course?.title || 'Course'}"`;
        }

        return {
          id: progress.id,
          type,
          title,
          timestamp,
          progress: progress.progressPercent,
        };
      });
    } else {
      logger.warn('[PROFILE_GET] Failed to fetch recent activity');
    }

    // ==========================================
    // Calculate Course Statistics
    // ==========================================

    const coursesEnrolled = enrolledCourses.length;

    // Calculate completed courses
    const courseProgressMap = new Map<string, number>();
    const courseCompletionMap = new Map<string, { completed: number; total: number }>();

    for (const enrollment of enrolledCourses) {
      const courseId = enrollment.Course.id;
      const totalChapters = enrollment.Course.chapters.length;

      courseCompletionMap.set(courseId, { completed: 0, total: totalChapters });
    }

    let allProgress: Array<{
      courseId: string | null;
      chapterId: string | null;
      isCompleted: boolean;
      progressPercent: number;
    }> = [];

    try {
      allProgress = await db.user_progress.findMany({
        where: {
          userId,
          courseId: { in: enrolledCourses.map((e) => e.Course.id) },
          chapterId: { not: null },
        },
        select: {
          courseId: true,
          chapterId: true,
          isCompleted: true,
          progressPercent: true,
        },
        take: 200,
      });
    } catch (error) {
      logger.warn('[PROFILE_GET] Failed to fetch user progress:', error);
      // Continue with empty progress array
    }

    // Group progress by course
    for (const progress of allProgress) {
      if (!progress.courseId) continue;

      const courseStats = courseCompletionMap.get(progress.courseId);
      if (courseStats && progress.chapterId && progress.isCompleted) {
        courseStats.completed += 1;
      }

      // Calculate average progress for the course
      const currentProgress = courseProgressMap.get(progress.courseId) || 0;
      courseProgressMap.set(
        progress.courseId,
        currentProgress + progress.progressPercent
      );
    }

    // Count completed courses (100% progress)
    let coursesCompleted = 0;
    for (const [courseId, stats] of courseCompletionMap.entries()) {
      if (stats.total > 0 && stats.completed === stats.total) {
        coursesCompleted += 1;
      }
    }

    // ==========================================
    // Transform Enrolled Courses
    // ==========================================

    const courses = enrolledCourses.map((enrollment) => {
      const courseId = enrollment.Course.id;
      const totalChapters = enrollment.Course.chapters.length;
      const completionStats = courseCompletionMap.get(courseId) || { completed: 0, total: totalChapters };
      const completedChapters = completionStats.completed;

      // Calculate overall progress
      const progress = totalChapters > 0
        ? Math.round((completedChapters / totalChapters) * 100)
        : 0;

      // Format last accessed time
      const timeDiff = Date.now() - enrollment.updatedAt.getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      const daysAgo = Math.floor(hoursAgo / 24);

      let lastAccessed: string;
      if (hoursAgo < 1) {
        lastAccessed = 'Just now';
      } else if (hoursAgo < 24) {
        lastAccessed = `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
      } else if (daysAgo < 30) {
        lastAccessed = `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`;
      } else {
        const monthsAgo = Math.floor(daysAgo / 30);
        lastAccessed = `${monthsAgo} ${monthsAgo === 1 ? 'month' : 'months'} ago`;
      }

      return {
        id: enrollment.Course.id,
        title: enrollment.Course.title,
        instructor: enrollment.Course.user?.name || 'Unknown Instructor',
        progress,
        thumbnail: enrollment.Course.imageUrl || '/api/placeholder/400/225',
        lastAccessed,
        totalChapters,
        completedChapters,
      };
    });

    // ==========================================
    // Calculate Skills from Course Categories
    // ==========================================

    const skills: Array<{ name: string; level: number; progress: number }> = [];

    // Extract unique categories from enrolled courses and calculate proficiency
    const categoryMap = new Map<string, { totalProgress: number; count: number }>();

    for (const enrollment of enrolledCourses) {
      const category = enrollment.Course.categoryId || 'General';
      const courseId = enrollment.Course.id;
      const progress = courseProgressMap.get(courseId) || 0;

      const totalChapters = enrollment.Course.chapters.length;
      const avgProgress = totalChapters > 0 ? progress / totalChapters : 0;

      const existing = categoryMap.get(category) || { totalProgress: 0, count: 0 };
      categoryMap.set(category, {
        totalProgress: existing.totalProgress + avgProgress,
        count: existing.count + 1,
      });
    }

    // Convert categories to skills with calculated levels
    for (const [categoryId, stats] of categoryMap.entries()) {
      const avgLevel = Math.round(stats.totalProgress / stats.count);

      // Fetch category name (in a real scenario, you'd have a categories table)
      skills.push({
        name: categoryId,
        level: avgLevel,
        progress: avgLevel,
      });
    }

    // Sort skills by level
    skills.sort((a, b) => b.level - a.level);

    // ==========================================
    // Fetch Profile Links (with fallback)
    // ==========================================

    let profileLinks: Array<{ platform: string; url: string }> = [];
    try {
      profileLinks = await db.profileLink.findMany({
        where: { userId },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          platform: true,
          url: true,
        },
        take: 500,
      });
    } catch (error) {
      logger.warn('[PROFILE_GET] Failed to fetch profile links (table may not exist):', error);
      // Continue with empty array
    }

    // ==========================================
    // Extract Social Links from ProfileLink
    // ==========================================

    const twitter = profileLinks.find((link) => link.platform === 'TWITTER')?.url || '';
    const linkedin = profileLinks.find((link) => link.platform === 'LINKEDIN')?.url || '';
    const github = profileLinks.find((link) => link.platform === 'GITHUB')?.url || '';
    const websiteRaw = profileLinks.find((link) => link.platform === 'WEBSITE')?.url;
    // Sanitize website URL - ensure it's either a valid URL or null
    const website = websiteRaw && websiteRaw.trim() !== '' ? websiteRaw : null;

    // ==========================================
    // Build Profile Response
    // ==========================================

    const profile = {
      id: user.id,
      name: user.name || 'User',
      email: user.email || '',
      image: user.image || '',
      bio: user.bio || '',
      location: user.location || '',
      website, // Already sanitized to be valid URL or null
      twitter: twitter || '',
      linkedin: linkedin || '',
      github: github || '',
      createdAt: user.createdAt.toISOString(),
      coursesEnrolled,
      coursesCompleted,
      certificatesEarned: certifications.length,
      totalLearningHours,
      currentStreak,
      longestStreak,
      achievements,
      recentActivity,
      skills: skills.slice(0, 10), // Top 10 skills
      courses,
    };

    // ✅ Validate response before sending
    const validatedProfile = ProfileResponseSchema.parse(profile);

    const response: ApiResponse<typeof validatedProfile> = {
      success: true,
      data: validatedProfile,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || 'unknown',
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[PROFILE_GET] Validation error:', { error: error.errors });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile data structure',
          details: { errors: error.errors },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Enhanced error logging for production debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('[PROFILE_GET] Unexpected error:', {
      message: errorMessage,
      stack: errorStack,
      error,
      userId: session?.user?.id,
      timestamp: new Date().toISOString(),
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to load profile. Please try again or contact support if the issue persists.',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// ==========================================
// PATCH - Update User Profile
// ==========================================

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      return NextResponse.json(response, { status: 401 });
    }

    const body = await request.json();

    // ✅ Validate input with Zod
    const validatedData = ProfileUpdateSchema.parse(body);

    // Update user profile
    const updatedUser = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
        bio: validatedData.bio,
        location: validatedData.location,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        createdAt: true,
      },
    });

    // Handle social links separately
    if (validatedData.twitter || validatedData.linkedin || validatedData.github || validatedData.website) {
      // Find existing profile links
      const existingLinks = await db.profileLink.findMany({
        where: {
          userId: session.user.id,
          platform: {
            in: ['TWITTER', 'LINKEDIN', 'GITHUB', 'WEBSITE'],
          },
        },
        take: 200,
      });

      const linkUpdates = [];

      const updateOrCreateLink = async (platform: string, url: string) => {
        const existingLink = existingLinks.find((link) => link.platform === platform);

        if (existingLink) {
          return db.profileLink.update({
            where: { id: existingLink.id },
            data: { url },
          });
        } else {
          return db.profileLink.create({
            data: {
              userId: session.user.id,
              platform,
              url,
            },
          });
        }
      };

      if (validatedData.twitter) {
        linkUpdates.push(updateOrCreateLink('TWITTER', validatedData.twitter));
      }

      if (validatedData.linkedin) {
        linkUpdates.push(updateOrCreateLink('LINKEDIN', validatedData.linkedin));
      }

      if (validatedData.github) {
        linkUpdates.push(updateOrCreateLink('GITHUB', validatedData.github));
      }

      if (validatedData.website) {
        linkUpdates.push(updateOrCreateLink('WEBSITE', validatedData.website));
      }

      await Promise.all(linkUpdates);
    }

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      data: updatedUser,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || 'unknown',
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[PROFILE_PATCH] Validation error:', { error: error.errors });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update data',
          details: { errors: error.errors },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    logger.error('[PROFILE_PATCH] Unexpected error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while updating profile',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
