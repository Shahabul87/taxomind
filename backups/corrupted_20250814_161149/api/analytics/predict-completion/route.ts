import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PredictiveAnalytics } from "@/lib/predictive-analytics";
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

    const prediction = await PredictiveAnalytics.predictCourseCompletion(
      session.user.id,
      courseId
    );

    return NextResponse.json({
      success: true,
      prediction
    });

  } catch (error: any) {
    logger.error("Predict completion error:", error);
    return NextResponse.json(
      { error: "Failed to predict course completion" },
      { status: 500 }
    );
  }
}