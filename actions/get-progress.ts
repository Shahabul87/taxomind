"use server";

import { db } from "@/lib/db";

export const getProgress = async (
  userId: string,
  courseId: string,
): Promise<number> => {
  try {
    const publishedChapters = await db.chapter.findMany({
      where: {
        courseId: courseId,
        isPublished: true,
      },
      select: {
        id: true,
      }
    });

    const publishedChapterIds = publishedChapters.map((chapter) => chapter.id);

    const validCompletedChapters = await db.user_progress.count({
      where: {
        userId: userId,
        chapterId: {
          in: publishedChapterIds,
        },
        isCompleted: true,
      }
    });

    const progressPercentage = publishedChapterIds.length > 0 
      ? (validCompletedChapters / publishedChapterIds.length) * 100
      : 0;

    return progressPercentage;
  } catch (error: any) {
    console.error('[GET_PROGRESS_ERROR]', error);
    return 0;
  }
}