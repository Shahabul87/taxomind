import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { samMultiMediaEngine } from "@/sam/engines/content/sam-multimedia-engine";
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, contentType, contentData } = body;

    if (!courseId || !contentType || !contentData) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user has access to the course
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        user: true,
        Enrollment: {
          where: { userId: session.user.id },
        },
        Purchase: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Check if user is teacher/owner or enrolled student
    const isTeacher = course.userId === session.user.id;
    const isEnrolled =
      course.Enrollment.length > 0 || course.Purchase.length > 0;
    const isAdmin = session.user.role === "ADMIN";

    if (!isTeacher && !isEnrolled && !isAdmin) {
      return NextResponse.json(
        { error: "Access denied to this course" },
        { status: 403 }
      );
    }

    let analysis;
    switch (contentType) {
      case "video":
        analysis = await samMultiMediaEngine.analyzeVideo({
          ...contentData,
          courseId,
        });
        break;

      case "audio":
        analysis = await samMultiMediaEngine.analyzeAudio({
          ...contentData,
          courseId,
        });
        break;

      case "interactive":
        analysis = await samMultiMediaEngine.analyzeInteractive({
          ...contentData,
          courseId,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid content type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      analysis,
      contentType,
    });
  } catch (error) {
    logger.error("Multi-modal analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze content" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");
    const reportType = searchParams.get("reportType") || "recommendations";

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Verify access
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        userId: true,
        Enrollment: {
          where: { userId: session.user.id },
        },
        Purchase: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const isTeacher = course.userId === session.user.id;
    const isEnrolled =
      course.Enrollment.length > 0 || course.Purchase.length > 0;
    const isAdmin = session.user.role === "ADMIN";

    if (!isTeacher && !isEnrolled && !isAdmin) {
      return NextResponse.json(
        { error: "Access denied to this course" },
        { status: 403 }
      );
    }

    let result;
    switch (reportType) {
      case "recommendations":
        result = await samMultiMediaEngine.getContentRecommendations(courseId);
        break;

      case "accessibility":
        result = await samMultiMediaEngine.getAccessibilityReport(courseId);
        break;

      case "comprehensive":
        // Get all analyses for the course
        const analyses = await db.multiMediaAnalysis.findMany({
          where: { courseId },
          orderBy: { createdAt: "desc" },
        });

        // Group by content type
        const videoAnalyses = analyses
          .filter((a) => a.contentType === "video")
          .map((a) => JSON.parse(a.analysis as string));
        const audioAnalyses = analyses
          .filter((a) => a.contentType === "audio")
          .map((a) => JSON.parse(a.analysis as string));
        const interactiveAnalyses = analyses
          .filter((a) => a.contentType === "interactive")
          .map((a) => JSON.parse(a.analysis as string));

        result = await samMultiMediaEngine.generateMultiModalInsights(
          courseId,
          {
            videos: videoAnalyses,
            audios: audioAnalyses,
            interactives: interactiveAnalyses,
          }
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      reportType,
      data: result,
    });
  } catch (error) {
    logger.error("Multi-modal report error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}