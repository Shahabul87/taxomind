import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Input validation schema
const CompleteSectionSchema = z.object({
  userId: z.string().uuid(),
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

    // Check if user is enrolled
    const isEnrolled = section.chapter.course.Enrollment.length > 0;
    const isTeacher = section.chapter.course.userId === user.id;

    if (!isEnrolled && !isTeacher) {
      return NextResponse.json(
        { error: "Access denied - enrollment required" },
        { status: 403 }
      );
    }

    // Don't track completion for teachers in preview mode
    if (isTeacher) {
      return NextResponse.json({
        success: true,
        message: "Preview mode - completion not tracked",
      });
    }

    // Create composite ID for user_progress
    const progressId = `${user.id}-${section.chapter.courseId}-${section.chapterId}-${params.sectionId}`;

    // Mark section as complete
    const userProgress = await db.user_progress.upsert({
      where: { id: progressId },
      update: {
        isCompleted: true,
        completedAt: new Date(),
        progressPercent: 100,
        lastAccessedAt: new Date(),
      },
      create: {
        id: progressId,
        userId: user.id,
        courseId: section.chapter.courseId,
        chapterId: section.chapterId,
        sectionId: params.sectionId,
        isCompleted: true,
        completedAt: new Date(),
        progressPercent: 100,
        timeSpent: 0,
        lastAccessedAt: new Date(),
      },
    });

    // Check if all sections in the chapter are complete
    const chapterSections = await db.section.findMany({
      where: { chapterId: section.chapterId },
      select: { id: true },
    });

    const completedSections = await db.user_progress.count({
      where: {
        userId: user.id,
        chapterId: section.chapterId,
        isCompleted: true,
      },
    });

    const chapterCompleted = completedSections === chapterSections.length;

    // Calculate course progress
    const totalCourseSections = await db.section.count({
      where: {
        chapter: {
          courseId: section.chapter.course.id,
        },
        isPublished: true,
      },
    });

    const completedCourseSections = await db.user_progress.count({
      where: {
        userId: user.id,
        courseId: section.chapter.course.id,
        isCompleted: true,
      },
    });

    const courseProgress = totalCourseSections > 0
      ? Math.round((completedCourseSections / totalCourseSections) * 100)
      : 0;

    const courseCompleted = courseProgress === 100;

    return NextResponse.json({
      success: true,
      progress: userProgress,
      chapterCompleted,
      courseCompleted,
      courseProgress,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error completing section:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
