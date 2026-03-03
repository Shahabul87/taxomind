import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

// Input validation schema
const ProgressUpdateSchema = z.object({
  progress: z.number().min(0).max(100),
  watchTime: z.number().min(0).optional(), // seconds watched
});

export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = ProgressUpdateSchema.parse(body);

    // Verify user has access to this section
    const section = await db.section.findUnique({
      where: { id: params.sectionId },
      include: {
        chapter: {
          include: {
            course: {
              include: {
                Enrollment: {
                  where: { userId: user.id },
                },
              },
            },
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section not found" },
        { status: 404 }
      );
    }

    // Check if user is enrolled or is the teacher
    const isTeacher = section.chapter.course.userId === user.id;
    const isEnrolled = section.chapter.course.Enrollment.length > 0;

    if (!isTeacher && !isEnrolled) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Don't track progress for teachers in preview mode
    if (isTeacher) {
      return NextResponse.json({
        success: true,
        message: "Preview mode - progress not tracked",
      });
    }

    // Generate unique ID for user_progress (userId-courseId-chapterId-sectionId)
    const progressId = `${user.id}-${section.chapter.courseId}-${section.chapterId}-${params.sectionId}`;

    // Update or create user progress
    const userProgress = await db.user_progress.upsert({
      where: {
        id: progressId,
      },
      update: {
        progressPercent: validatedData.progress,
        timeSpent: validatedData.watchTime || 0,
        lastAccessedAt: new Date(),
        updatedAt: new Date(),
        isCompleted: validatedData.progress >= 90,
        completedAt: validatedData.progress >= 90 ? new Date() : null,
      },
      create: {
        id: progressId,
        userId: user.id,
        courseId: section.chapter.courseId,
        chapterId: section.chapterId,
        sectionId: params.sectionId,
        progressPercent: validatedData.progress,
        timeSpent: validatedData.watchTime || 0,
        isCompleted: validatedData.progress >= 90,
        completedAt: validatedData.progress >= 90 ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    // Check if section is complete (90% or more)
    if (validatedData.progress >= 90) {
      // Create section completion record
      await db.userSectionCompletion.upsert({
        where: {
          userId_sectionId: {
            userId: user.id,
            sectionId: params.sectionId,
          },
        },
        update: {
          completedAt: new Date(),
        },
        create: {
          userId: user.id,
          sectionId: params.sectionId,
          completedAt: new Date(),
        },
      });

      // Check if chapter is complete
      const chapterSections = await db.section.findMany({
        where: { chapterId: section.chapterId },
        select: { id: true },
        take: 200,
      });

      const completedSections = await db.userSectionCompletion.findMany({
        where: {
          userId: user.id,
          sectionId: { in: chapterSections.map((s) => s.id) },
        },
        take: 500,
      });

      if (completedSections.length === chapterSections.length) {
        // Mark chapter as complete
        await db.userChapterCompletion.upsert({
          where: {
            userId_chapterId: {
              userId: user.id,
              chapterId: section.chapterId,
            },
          },
          update: {
            completedAt: new Date(),
          },
          create: {
            userId: user.id,
            chapterId: section.chapterId,
            completedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      progress: userProgress,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Error updating progress", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get progress for a section
export async function GET(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userProgress = await db.user_progress.findFirst({
      where: {
        userId: user.id,
        sectionId: params.sectionId,
      },
    });

    return NextResponse.json({
      success: true,
      progress: userProgress || {
        progressPercent: 0,
        timeSpent: 0,
        isCompleted: false,
      },
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    logger.error("Error fetching progress", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}