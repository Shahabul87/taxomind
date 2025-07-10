import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ProgressTracker } from "@/lib/progress-tracking";

// Start a new learning session
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, chapterId } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Check if user has access to the course (skip for demo courses)
    if (!courseId.includes('demo')) {
      const enrollment = await db.enrollment.findFirst({
        where: {
          userId: session.user.id,
          courseId: courseId
        }
      });

      if (!enrollment) {
        return NextResponse.json({ error: "Not enrolled in this course" }, { status: 403 });
      }
    }

    // Create new learning session
    const learningSession = await db.learningSession.create({
      data: {
        userId: session.user.id,
        courseId,
        chapterId: chapterId || null,
        startTime: new Date(),
        completionPercentage: 0,
        strugglingIndicators: [],
        engagementScore: 100,
        interactionCount: 0,
        pauseCount: 0,
        seekCount: 0,
        status: "ACTIVE"
      }
    });

    return NextResponse.json({
      success: true,
      session: learningSession
    });

  } catch (error) {
    console.error("Start learning session error:", error);
    return NextResponse.json(
      { error: "Failed to start learning session" },
      { status: 500 }
    );
  }
}

// Get user's learning sessions
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {
      userId: session.user.id
    };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    const sessions = await db.learningSession.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        chapter: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        startTime: 'desc'
      },
      take: limit,
      skip: offset
    });

    const totalSessions = await db.learningSession.count({
      where: whereClause
    });

    return NextResponse.json({
      success: true,
      sessions,
      total: totalSessions,
      hasMore: offset + limit < totalSessions
    });

  } catch (error) {
    console.error("Get learning sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning sessions" },
      { status: 500 }
    );
  }
}