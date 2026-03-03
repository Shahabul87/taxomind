import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { queueChapterReindex } from '@/lib/sam/memory-lifecycle-service';
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime to avoid Edge Runtime issues with bcrypt and database connections
export const runtime = 'nodejs';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return ApiResponses.unauthorized();
    }

    // Await params to get courseId and chapterId
    const { courseId, chapterId } = await params;

    // First check if the authenticated user owns the course
    const courseOwner = await db.course.findFirst({
      where: {
        id: courseId,
        userId,
      }
    });

    if (!courseOwner) {
      return ApiResponses.unauthorized();
    }

    // Find the chapter to be deleted
    const chapter = await db.chapter.findUnique({
      where: {
        id: chapterId,
        courseId,
      }
    });

    if (!chapter) {
      return ApiResponses.notFound("Chapter not found");
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
        courseId,
        position: {
          gt: chapter.position
        }
      },
      take: 200,
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

    // Queue memory lifecycle reindex for deleted chapter content
    await queueChapterReindex(chapterId, courseId, 'delete').catch(err => {
      logger.warn("[CHAPTER_DELETE] Memory reindex queue failed", { error: err });
    });

    return NextResponse.json(deletedChapter);
  } catch (error) {
    logger.error("[CHAPTER_ID_DELETE]", error);
    
    // Enhanced error handling for production
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return ApiResponses.serviceUnavailable("Database connection error");
      }
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return ApiResponses.unauthorized();
      }
    }
    
    return ApiResponses.internal();
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  try {
    const user = await currentUser();
    const userId = user?.id;

    if (!userId) {
      return ApiResponses.unauthorized();
    }

    const rawValues = await req.json();
    const { isPublished, ...values } = rawValues;

    // Await params to get courseId and chapterId
    const { courseId, chapterId } = await params;

    // First check if the authenticated user owns the course
    const courseOwner = await db.course.findFirst({
      where: {
        id: courseId,
        userId,
      }
    });

    if (!courseOwner) {
      return ApiResponses.unauthorized();
    }

    // Explicit field mapping to ensure all chapter fields are properly updated
    // This prevents mass assignment vulnerabilities and ensures field name compatibility
    const updateData: Record<string, unknown> = {};

    // Core content fields
    if (values.title !== undefined) updateData.title = values.title;
    if (values.description !== undefined) updateData.description = values.description;
    if (values.courseGoals !== undefined) updateData.courseGoals = values.courseGoals;
    if (values.learningOutcomes !== undefined) updateData.learningOutcomes = values.learningOutcomes;

    // Metadata fields
    if (values.position !== undefined) updateData.position = values.position;
    if (values.estimatedTime !== undefined) updateData.estimatedTime = values.estimatedTime;
    if (values.difficulty !== undefined) updateData.difficulty = values.difficulty;
    if (values.prerequisites !== undefined) updateData.prerequisites = values.prerequisites;
    if (values.resources !== undefined) updateData.resources = values.resources;
    if (values.status !== undefined) updateData.status = values.status;

    // Access control fields
    if (values.isFree !== undefined) updateData.isFree = values.isFree;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    // Numeric fields
    if (values.sectionCount !== undefined) updateData.sectionCount = values.sectionCount;
    if (values.totalDuration !== undefined) updateData.totalDuration = values.totalDuration;

    logger.info('[CHAPTER_UPDATE]', {
      chapterId,
      fieldsUpdated: Object.keys(updateData),
      hasDescription: !!updateData.description,
      hasLearningOutcomes: !!updateData.learningOutcomes,
    });

    // Update the chapter with explicitly mapped values
    const chapter = await db.chapter.update({
      where: {
        id: chapterId,
        courseId,
      },
      data: updateData,
    });

    // Queue memory lifecycle reindex for updated chapter content
    await queueChapterReindex(chapterId, courseId, 'update').catch(err => {
      logger.warn("[CHAPTER_PATCH] Memory reindex queue failed", { error: err });
    });

    return NextResponse.json({
      success: true,
      data: chapter,
      metadata: {
        timestamp: new Date().toISOString(),
        fieldsUpdated: Object.keys(updateData),
      },
    });
  } catch (error) {
    logger.error("[CHAPTER_ID_PATCH]", error);

    // Enhanced error handling for production
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        return ApiResponses.serviceUnavailable("Database connection error");
      }
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return ApiResponses.unauthorized();
      }
    }

    return ApiResponses.internal();
  }
}

