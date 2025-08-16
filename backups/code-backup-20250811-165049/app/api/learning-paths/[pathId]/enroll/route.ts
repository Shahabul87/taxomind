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
    // Check if path exists and is active
    const path = await db.learningPath.findFirst({
      where: {
        id: pathId,
        isActive: true,
      },
      include: {
        LearningPathNode: {
          orderBy: { order: "asc" }
        }
      }
    });

    if (!path) {
      return NextResponse.json(
        { error: "Learning path not found" },
        { status: 404 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await db.pathEnrollment.findUnique({
      where: {
        userId_pathId: {
          userId: session.user.id,
          pathId,
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
    const enrollment = await db.pathEnrollment.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        pathId: pathId,
        status: "ACTIVE",
        updatedAt: new Date(),
        // Create progress entries for each node
        NodeProgress: {
          create: path.LearningPathNode.map(node => ({
            id: randomUUID(),
            nodeId: node.id,
            status: "NOT_STARTED",
            updatedAt: new Date(),
          }))
        }
      },
      include: {
        LearningPath: {
          include: {
            LearningPathNode: true
          }
        },
        NodeProgress: true
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
    const enrollment = await db.pathEnrollment.findUnique({
      where: {
        userId_pathId: {
          userId: session.user.id,
          pathId,
        }
      },
      include: {
        LearningPath: {
          include: {
            LearningPathNode: {
              orderBy: { order: "asc" }
            }
          }
        },
        NodeProgress: {
          include: {
            LearningPathNode: true
          },
          orderBy: {
            LearningPathNode: {
              order: "asc"
            }
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