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

    const enrollments = await db.pathEnrollment.findMany({
      where: {
        userId: session.user.id,
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
      },
      orderBy: [
        { status: "asc" }, // Active paths first
        { updatedAt: "desc" }
      ]
    });

    // Calculate progress percentage for each enrollment
    const enrichedEnrollments = enrollments.map(enrollment => {
      const totalNodes = enrollment.NodeProgress.length;
      const completedNodes = enrollment.NodeProgress.filter(
        np => np.status === "COMPLETED"
      ).length;
      
      const progressPercent = totalNodes > 0 
        ? (completedNodes / totalNodes) * 100 
        : 0;

      return {
        ...enrollment,
        progressPercent
      };
    });

    return NextResponse.json({
      success: true,
      enrollments: enrichedEnrollments
    });
  } catch (error: any) {
    logger.error("Fetch enrollments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}