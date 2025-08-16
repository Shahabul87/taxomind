"use server";

import { Category, Course } from "@prisma/client";

import { getProgress } from "@/actions/get-progress";
import { db } from "@/lib/db";
import { BatchQueryOptimizer } from "@/lib/database/query-optimizer";
import { ServerActionCache } from "@/lib/redis/server-action-cache";

type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: { id: string }[];
  progress: number | null;
};

type GetCourses = {
  userId: string;
  title?: string;
  categoryId?: string;
};

export const getCourses = async ({
  userId,
  title,
  categoryId
}: GetCourses): Promise<CourseWithProgressWithCategory[]> => {

  // Use cache for course listing
  const cacheResult = await ServerActionCache.getCourseList(
    userId,
    { title, categoryId },
    async () => {
      return await fetchCoursesFromDatabase(userId, title, categoryId);
    }
  );

  return cacheResult.data;
};

// Extracted database logic for caching
async function fetchCoursesFromDatabase(
  userId: string,
  title?: string,
  categoryId?: string
): Promise<CourseWithProgressWithCategory[]> {
  try {
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        title: {
          contains: title,
        },
        categoryId,
      },
      include: {
        category: true,
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
        Enrollment: {
          where: {
            userId,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      }
    });

    // Optimize: Batch load progress for all courses instead of individual calls
    const courseIds = courses.map(course => course.id);
    const progressMap = await BatchQueryOptimizer.batchLoadUserProgress(userId, courseIds);

    const coursesWithProgress: CourseWithProgressWithCategory[] = courses.map(course => {
      if (course.Enrollment.length === 0) {
        return {
          ...course,
          progress: null,
        }
      }

      const progressData = progressMap.get(course.id);
      let progressPercentage = 0;

      if (progressData?.courseProgress) {
        progressPercentage = progressData.courseProgress.progressPercentage || 0;
      } else if (progressData?.chapterProgress && course.chapters.length > 0) {
        // Calculate progress from chapter completions if course progress not available
        const completedChapters = progressData.chapterProgress.filter((cp: any) => cp.isCompleted).length;
        progressPercentage = (completedChapters / course.chapters.length) * 100;
      }

      return {
        ...course,
        progress: Math.round(progressPercentage),
      };
    });

    return coursesWithProgress;
  } catch (error: any) {
    console.error('[GET_COURSES_ERROR]', error);
    return [];
  }
}