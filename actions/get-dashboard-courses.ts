"use server";

import { Category, Chapter, Course } from "@prisma/client";

import { db } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";
import { BatchQueryOptimizer } from "@/lib/database/query-optimizer";
import { ServerActionCache } from "@/lib/redis/server-action-cache";

type CourseWithProgressWithCategory = Course & {
  category: Category;
  chapters: Chapter[];
  progress: number | null;
};

type DashboardCourses = {
  completedCourses: CourseWithProgressWithCategory[];
  coursesInProgress: CourseWithProgressWithCategory[];
}

export const getDashboardCourses = async (userId: string): Promise<DashboardCourses> => {
  // Use cache for dashboard data
  const cacheResult = await ServerActionCache.getDashboardData(
    userId,
    async () => {
      return await fetchDashboardCoursesFromDatabase(userId);
    }
  );

  return cacheResult.data;
};

// Extracted database logic for caching
async function fetchDashboardCoursesFromDatabase(userId: string): Promise<DashboardCourses> {
  try {
    const purchasedCourses = await db.purchase.findMany({
      where: {
        userId: userId,
      },
      select: {
        Course: {
          include: {
            category: true,
            chapters: {
              where: {
                isPublished: true,
              }
            }
          }
        }
      }
    });

    const courses = purchasedCourses.map((purchase) => purchase.Course) as CourseWithProgressWithCategory[];

    // Optimize: Batch load progress for all courses instead of individual calls
    const courseIds = courses.map(course => course.id);
    const progressMap = await BatchQueryOptimizer.batchLoadUserProgress(userId, courseIds);

    for (let course of courses) {
      const progressData = progressMap.get(course.id);
      let progressPercentage = 0;

      if (progressData?.courseProgress) {
        progressPercentage = progressData.courseProgress.progressPercentage || 0;
      } else if (progressData?.chapterProgress && course.chapters.length > 0) {
        // Calculate progress from chapter completions if course progress not available
        const completedChapters = progressData.chapterProgress.filter((cp: any) => cp.isCompleted).length;
        progressPercentage = (completedChapters / course.chapters.length) * 100;
      }

      course["progress"] = Math.round(progressPercentage);
    }

    const completedCourses = courses.filter((course) => course.progress === 100);
    const coursesInProgress = courses.filter((course) => (course.progress ?? 0) < 100);

    return {
      completedCourses,
      coursesInProgress,
    }
  } catch (error: any) {
    console.error('[GET_DASHBOARD_COURSES_ERROR]', error);
    return {
      completedCourses: [],
      coursesInProgress: [],
    }
  }
}