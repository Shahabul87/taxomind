import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const { courseId } = await params;

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
      take: 10, // Limit to avoid large responses
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
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    logger.error("[DEBUG_COURSE] Error:", error);
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 