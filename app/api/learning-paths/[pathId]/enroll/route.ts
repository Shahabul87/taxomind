import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pathId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathId } = await params;
    // Check if path exists and is published
    const path = await db.learningPath.findFirst({
      where: {
        id: pathId,
        isPublished: true,
      },
      include: {
        courses: true
      }
    });

    if (!path) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await db.learningPathEnrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId: session.user.id,
          learningPathId: pathId,
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled in this path" },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await db.learningPathEnrollment.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        learningPathId: pathId,
        status: "ACTIVE"
      },
      include: {
        learningPath: {
          include: {
            courses: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      enrollment,
    });
  } catch (error) {
    logger.error("Path enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to enroll in learning path" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pathId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pathId } = await params;
    // Get enrollment status
    const enrollment = await db.learningPathEnrollment.findUnique({
      where: {
        userId_learningPathId: {
          userId: session.user.id,
          learningPathId: pathId,
        }
      },
      include: {
        learningPath: {
          include: {
            courses: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      enrollment,
    });
  } catch (error) {
    logger.error("Get enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to get enrollment status" },
      { status: 500 }
    );
  }
}