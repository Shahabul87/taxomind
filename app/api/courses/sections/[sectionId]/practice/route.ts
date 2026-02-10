import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

/**
 * GET /api/courses/sections/[sectionId]/practice
 * List user's practice sets for a section with summary data
 */
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ sectionId: string }> }
) {
  const params = await props.params;

  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const sets = await db.practiceProblemSet.findMany({
      where: {
        userId: user.id,
        sectionId: params.sectionId,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    // Calculate aggregate stats
    const stats = {
      totalSets: sets.length,
      totalAttempts: sets.reduce((sum, s) => sum + s.totalAttempts, 0),
      avgScore:
        sets.length > 0
          ? sets.reduce((sum, s) => sum + (s.avgScore ?? 0), 0) / sets.filter(s => s.avgScore !== null).length || 0
          : 0,
      problemsSolved: sets.reduce((sum, s) => sum + s._count.questions * s.totalAttempts, 0),
    };

    return NextResponse.json({
      success: true,
      data: { sets, stats },
    });
  } catch (error) {
    logger.error("[Practice] List sets error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch practice sets" } },
      { status: 500 }
    );
  }
}
