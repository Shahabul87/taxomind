import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enrollments = await db.learningPathEnrollment.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        learningPath: {
          include: {
            courses: true
          }
        }
      },
      orderBy: [
        { status: "asc" }, // Active paths first
        { startedAt: "desc" }
      ]
    });

    return NextResponse.json({
      success: true,
      enrollments
    });
  } catch (error) {
    logger.error("Fetch enrollments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}