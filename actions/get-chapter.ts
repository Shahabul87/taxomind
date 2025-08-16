"use server";

import { db } from "@/lib/db";
import { Chapter, Section, Course } from "@prisma/client";
import { logger } from '@/lib/logger';

export type ChapterWithSectionsAndCourse = Chapter & {
  sections: (Section & {
    videos: any[];
    blogs: any[];
    articles: any[];
    notes: any[];
    codeExplanations: any[];
  })[];
  course: Course;
};

// Overload for test compatibility
export async function getChapter(params: {
  userId: string;
  courseId: string;
  chapterId: string;
}): Promise<{
  chapter: any;
  course?: any;
  muxData?: any;
  attachments?: any[];
  nextChapter?: any;
  userProgress?: any;
  purchase?: any;
}>;

// Original function signature
export async function getChapter(
  chapterId: string,
  courseId: string
): Promise<{
  chapter: ChapterWithSectionsAndCourse | null;
  error?: string;
}>;

// Implementation
export async function getChapter(
  ...args: any[]
): Promise<any> {
  // Handle object parameter (test format)
  if (args.length === 1 && typeof args[0] === 'object') {
    const { userId, courseId, chapterId } = args[0];
    
    try {
      // Check if user has purchased the course
      const purchase = await db.purchase.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });

      const chapter = await db.chapter.findUnique({
        where: { id: chapterId },
        include: {
          course: true,
          user_progress: {
            where: { userId }
          }
        }
      });

      if (!chapter) {
        return { chapter: null };
      }

      // Get next chapter
      const nextChapter = await db.chapter.findFirst({
        where: {
          courseId,
          position: {
            gt: chapter.position
          }
        },
        orderBy: {
          position: 'asc'
        }
      });

      return {
        chapter,
        course: chapter.course,
        muxData: null, // Chapter doesn't have muxData relation
        attachments: [], // Chapter doesn't have attachments relation
        nextChapter,
        userProgress: chapter.user_progress[0] || null,
        purchase
      };
    } catch (error) {
      return { chapter: null };
    }
  }
  
  // Handle original signature (chapterId, courseId)
  const [chapterId, courseId] = args as [string, string];
  try {
    if (!chapterId || !courseId) {
      return {
        chapter: null,
        error: "Chapter ID and Course ID are required"
      };
    }

    const chapter = await db.chapter.findUnique({
      where: {
        id: chapterId,
        courseId: courseId
      },
      include: {
        course: true,
        sections: {
          orderBy: {
            position: 'asc'
          },
          include: {
            videos: {
              orderBy: {
                createdAt: 'desc'
              }
            },
            blogs: {
              orderBy: {
                createdAt: 'desc'
              }
            },
            articles: {
              orderBy: {
                createdAt: 'desc'
              }
            },
            notes: {
              orderBy: {
                createdAt: 'desc'
              }
            },
            codeExplanations: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      }
    });

    if (!chapter) {
      return {
        chapter: null,
        error: "Chapter not found"
      };
    }

    return {
      chapter
    };

  } catch (error: any) {
    logger.error("[GET_CHAPTER]", error);
    return {
      chapter: null,
      error: "Failed to fetch chapter"
    };
  }
}