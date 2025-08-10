import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

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
        nodes: {
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
        userId: session.user.id,
        pathId: pathId,
        status: "ACTIVE",
        // Create progress entries for each node
        nodeProgress: {
          create: path.nodes.map(node => ({
            nodeId: node.id,
            status: "NOT_STARTED",
          }))
        }
      },
      include: {
        path: {
          include: {
            nodes: true
          }
        },
        nodeProgress: true
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
        path: {
          include: {
            nodes: {
              orderBy: { order: "asc" }
            }
          }
        },
        nodeProgress: {
          include: {
            node: true
          },
          orderBy: {
            node: {
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