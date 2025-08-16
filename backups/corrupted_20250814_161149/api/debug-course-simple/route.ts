import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {

    // Get courseId from query params
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId') || undefined;
    
    if (!courseId) {
      return NextResponse.json({
        error: "Missing courseId parameter",
        usage: "Add ?courseId=your-course-id to the URL",
        example: "/api/debug-course-simple?courseId=bc037619-84dc-4ef9-b8c8-cfa3d059b7c7"
      }, { status: 400 });
    }
    
    const user = await currentUser();

    // Get course details
    const course = await db.course.findUnique({
      where: {
        id: courseId,
      },
      select: {
        id: true,
        title: true,
        userId: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // Get user's courses
    const userCourses = user?.id ? await db.course.findMany({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        title: true,
        isPublished: true,
      },
      take: 5, // Limit to avoid large responses
    }) : [];

    const debugInfo = {
      timestamp: new Date().toISOString(),
      requestedCourseId: courseId,
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
      } : null,
      course: course ? {
        id: course.id,
        title: course.title,
        userId: course.userId,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        userOwns: user?.id === course.userId,
      } : null,
      userCourses: userCourses.map(c => ({
        id: c.id,
        title: c.title,
        isPublished: c.isPublished,
      })),
      analysis: {
        courseExists: !!course,
        userAuthenticated: !!user,
        userOwnsCourse: !!(user && course && user.id === course.userId),
        canDelete: !!(user && course && user.id === course.userId),
      },
      instructions: {
        usage: "This endpoint helps debug course deletion issues",
        testDelete: course && user && user.id === course.userId 
          ? `You can delete this course. Try: DELETE /api/courses/${courseId}`
          : "You cannot delete this course (see analysis above)",
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    logger.error("[DEBUG_COURSE_SIMPLE] Error:", error);
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 