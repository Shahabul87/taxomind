import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { pathId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if path exists and is active
    const path = await db.learningPath.findFirst({
      where: {
        id: params.pathId,
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
          pathId: params.pathId,
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
        pathId: params.pathId,
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
    console.error("Path enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to enroll in learning path" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { pathId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get enrollment status
    const enrollment = await db.pathEnrollment.findUnique({
      where: {
        userId_pathId: {
          userId: session.user.id,
          pathId: params.pathId,
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
    console.error("Get enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to get enrollment status" },
      { status: 500 }
    );
  }
}