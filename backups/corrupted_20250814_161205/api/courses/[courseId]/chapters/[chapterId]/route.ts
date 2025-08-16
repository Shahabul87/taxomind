import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';

// Force Node.js runtime to export const DELETE = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
});: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await params to get courseId and chapterId
    const { courseId, chapterId } = await params;

    // First check if the authenticated user owns the course
    const courseOwner = await db.course.findFirst({
      where: {
        id: courseId,
        userId: userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Find the chapter to be deleted
    const chapter = await db.chapter.findUnique({
      where: {
        id: chapterId,
        courseId: courseId,
      }
    });

    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    // Delete the chapter
    const deletedChapter = await db.chapter.delete({
      where: {
        id: chapterId
      }
    });

    // Reorder the remaining chapters
    const remainingChapters = await db.chapter.findMany({
      where: {
        courseId: courseId,
        position: {
          gt: chapter.position
        }
      },
      orderBy: {
        position: "asc"
      }
    });

    // Optimize: Bulk update chapter positions instead of individual updates
    if (remainingChapters.length > 0) {
      const updatePromises = remainingChapters.map((item) =>
        db.chapter.update({
          where: { id: item.id },
          data: { position: item.position - 1 }
        })
      );
      
      await db.$transaction(updatePromises);
    }

    return NextResponse.json(deletedChapter);
  } catch (error: any) {
    logger.error("[CHAPTER_ID_DELETE]", error);
    
    // Enhanced error handling for production
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return new NextResponse("Database connection error", { status: 503 });
      }
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return new NextResponse("Authentication error", { status: 4export const PATCH = withAuth(async (request, context, params) => {
  
}, {
  rateLimit: { requests: 5, window: 60000 },
  auditLog: false
});01 });
      }
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;
    const { isPublished, ...values } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Await params to get courseId and chapterId
    const { courseId, chapterId } = await params;

    // First check if the authenticated user owns the course
    const courseOwner = await db.course.findFirst({
      where: {
        id: courseId,
        userId: userId,
      }
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update the chapter with the provided values
    const chapter = await db.chapter.update({
      where: {
        id: chapterId,
        courseId: courseId,
      },
      data: {
        ...values,
      }
    });

    // If the publishing status was provided, handle that separately
    if (isPublished !== undefined) {
      await db.chapter.update({
        where: {
          id: chapterId,
          courseId: courseId,
        },
        data: {
          isPublished
        }
      });
    }

    return NextResponse.json(chapter);
  } catch (error: any) {
    logger.error("[CHAPTER_ID_PATCH]", error);
    
    // Enhanced error handling for production
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return new NextResponse("Database connection error", { status: 503 });
      }
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return new NextResponse("Authentication error", { status: 401 });
      }
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}

