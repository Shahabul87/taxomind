import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

// Input validation schema
const CompleteItemSchema = z.object({
  itemId: z.string(),
  itemType: z.enum(["video", "blog", "math", "code", "exam"]),
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
    const validatedData = CompleteItemSchema.parse(body);

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
        videos: true,
        blogs: true,
        mathExplanations: true,
        codeExplanations: true,
        exams: true,
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

    // Don't track for teachers in preview mode
    if (isTeacher) {
      return NextResponse.json({
        success: true,
        message: "Preview mode - progress not tracked",
      });
    }

    // Get current user progress
    let userProgress = await db.user_progress.findUnique({
      where: {
        userId_courseId_chapterId_sectionId: {
          userId: user.id,
          courseId: section.chapter.course.id,
          chapterId: section.chapterId,
          sectionId: params.sectionId,
        },
      },
    });

    // Initialize completedItems if not exists
    let completedItems: any = userProgress?.completedItems || {
      videos: [],
      blogs: [],
      math: [],
      code: [],
      exams: [],
    };

    // Add item to completed list if not already there
    const itemTypeKey = validatedData.itemType === "math" ? "math" :
                        validatedData.itemType === "code" ? "code" :
                        `${validatedData.itemType}s`;

    if (!completedItems[itemTypeKey]) {
      completedItems[itemTypeKey] = [];
    }

    if (!completedItems[itemTypeKey].includes(validatedData.itemId)) {
      completedItems[itemTypeKey].push(validatedData.itemId);
    }

    // Calculate overall progress
    let totalItems = 0;
    let completedCount = 0;

    // Count total items
    totalItems += section.videos?.length || 0;
    totalItems += section.blogs?.length || 0;
    totalItems += section.mathExplanations?.length || 0;
    totalItems += section.codeExplanations?.length || 0;
    totalItems += section.exams?.length || 0;

    // Count completed items
    completedCount += completedItems.videos?.length || 0;
    completedCount += completedItems.blogs?.length || 0;
    completedCount += completedItems.math?.length || 0;
    completedCount += completedItems.code?.length || 0;
    completedCount += completedItems.exams?.length || 0;

    const overallProgress = totalItems > 0
      ? Math.round((completedCount / totalItems) * 100)
      : 0;

    // Update user progress
    userProgress = await db.user_progress.upsert({
      where: {
        userId_courseId_chapterId_sectionId: {
          userId: user.id,
          courseId: section.chapter.course.id,
          chapterId: section.chapterId,
          sectionId: params.sectionId,
        },
      },
      update: {
        completedItems,
        overallProgress,
        lastAccessedAt: new Date(),
      },
      create: {
        userId: user.id,
        courseId: section.chapter.course.id,
        chapterId: section.chapterId,
        sectionId: params.sectionId,
        completedItems,
        overallProgress,
      },
    });

    // Check if section is complete
    if (overallProgress === 100) {
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
    }

    return NextResponse.json({
      success: true,
      progress: userProgress,
      overallProgress,
      sectionComplete: overallProgress === 100,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error completing item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}