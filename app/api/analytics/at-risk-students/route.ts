import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PredictiveAnalytics } from "@/lib/predictive-analytics";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // Check if user has instructor/admin access to this course
    const userId = session.user.id;
    const userRole = session.user.role;
    
    // Allow admin access to all courses
    if (userRole !== 'ADMIN') {
      // For teachers, verify they own the course
      const course = await db.course.findUnique({
        where: { 
          id: courseId,
          userId: userId 
        }
      });
      
      if (!course) {
        return NextResponse.json(
          { error: "Forbidden - You don't have access to this course" },
          { status: 403 }
        );
      }
    }

    const atRiskStudents = await PredictiveAnalytics.identifyAtRiskStudents(courseId);

    return NextResponse.json({
      success: true,
      atRiskStudents
    });

  } catch (error) {
    logger.error("Identify at-risk students error:", error);
    return NextResponse.json(
      { error: "Failed to identify at-risk students" },
      { status: 500 }
    );
  }
}