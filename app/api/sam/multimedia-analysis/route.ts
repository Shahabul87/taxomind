import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createMultimediaEngine } from "@sam-ai/educational";
import type {
  VideoContent,
  AudioContent,
  InteractiveContent,
} from "@sam-ai/educational";
import { getSAMConfig, getDatabaseAdapter } from "@/lib/adapters";
import { logger } from '@/lib/logger';
import type { SAMInteractionType } from '@prisma/client';

// Create multimedia engine singleton with portable package
let multimediaEngine: ReturnType<typeof createMultimediaEngine> | null = null;

function getMultimediaEngine() {
  if (!multimediaEngine) {
    multimediaEngine = createMultimediaEngine({
      samConfig: getSAMConfig(),
      database: getDatabaseAdapter(),
    });
  }
  return multimediaEngine;
}

function normalizeAnalysis(analysis: unknown) {
  if (typeof analysis === "string") {
    try {
      return JSON.parse(analysis);
    } catch {
      return analysis;
    }
  }
  return analysis;
}

function extractScores(
  contentType: string,
  analysis: any
): { engagementScore?: number; accessibilityScore?: number; effectivenessScore?: number } {
  if (!analysis) {
    return {};
  }

  switch (contentType) {
    case "video":
      return {
        engagementScore: analysis.engagementScore,
        accessibilityScore: analysis.accessibilityScore,
        effectivenessScore: analysis.engagementScore,
      };
    case "audio":
      return {
        engagementScore: analysis.engagement,
        effectivenessScore: analysis.clarity,
      };
    case "interactive":
      return {
        engagementScore: analysis.userEngagement,
        accessibilityScore: analysis.accessibilityCompliance?.score,
        effectivenessScore: analysis.learningEffectiveness,
      };
    default:
      return {};
  }
}

async function recordSAMInteraction(
  userId: string,
  courseId: string,
  interactionType: SAMInteractionType,
  context: Record<string, unknown>
) {
  try {
    await db.sAMInteraction.create({
      data: {
        userId,
        courseId,
        interactionType,
        context,
      },
    });
  } catch (error) {
    logger.warn("Failed to record SAM interaction for multimedia:", error);
  }
}

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

    const engine = getMultimediaEngine();
    let analysis;
    switch (contentType) {
      case "video":
        analysis = await engine.analyzeVideo({
          ...contentData,
          courseId,
        } as VideoContent);
        break;

      case "audio":
        analysis = await engine.analyzeAudio({
          ...contentData,
          courseId,
        } as AudioContent);
        break;

      case "interactive":
        analysis = await engine.analyzeInteractive({
          ...contentData,
          courseId,
        } as InteractiveContent);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid content type" },
          { status: 400 }
        );
    }

    const normalizedAnalysis = normalizeAnalysis(analysis);
    const { engagementScore, accessibilityScore, effectivenessScore } =
      extractScores(contentType, normalizedAnalysis);

    const metadata: Record<string, unknown> = {
      format: contentData.format,
      duration: contentData.duration,
    };

    if (contentType === "interactive") {
      metadata.interactiveType = contentData.type;
      metadata.elements = Array.isArray(contentData.elements)
        ? contentData.elements.length
        : undefined;
    }

    const storedAnalysis = await db.multiMediaAnalysis.create({
      data: {
        courseId,
        chapterId: contentData.chapterId ?? null,
        contentType,
        contentUrl: contentData.url ?? null,
        analysis: normalizedAnalysis,
        engagementScore,
        accessibilityScore,
        effectivenessScore,
        metadata,
      },
    });

    await recordSAMInteraction(session.user.id, courseId, "ANALYTICS_VIEW", {
      type: "MULTIMEDIA_ANALYSIS",
      contentType,
      analysisId: storedAnalysis.id,
    });

    return NextResponse.json({
      success: true,
      analysis,
      contentType,
      analysisId: storedAnalysis.id,
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

    const engine = getMultimediaEngine();
    let result;
    switch (reportType) {
      case "recommendations":
        result = await engine.getContentRecommendations(courseId);
        break;

      case "accessibility":
        result = await engine.getAccessibilityReport(courseId);
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
          .map((a) => normalizeAnalysis(a.analysis));
        const audioAnalyses = analyses
          .filter((a) => a.contentType === "audio")
          .map((a) => normalizeAnalysis(a.analysis));
        const interactiveAnalyses = analyses
          .filter((a) => a.contentType === "interactive")
          .map((a) => normalizeAnalysis(a.analysis));

        result = await engine.generateMultiModalInsights(
          courseId,
          {
            videos: videoAnalyses,
            audios: audioAnalyses,
            interactives: interactiveAnalyses,
          }
        );
        break;
      case "library":
        result = await db.multiMediaAnalysis.findMany({
          where: { courseId },
          orderBy: { createdAt: "desc" },
          take: 200,
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    await recordSAMInteraction(session.user.id, courseId, "ANALYTICS_VIEW", {
      type: "MULTIMEDIA_REPORT",
      reportType,
    });

    return NextResponse.json({
      success: true,
      reportType,
      data: reportType === "library"
        ? (result as Array<any>).map((item) => ({
            ...item,
            analysis: normalizeAnalysis(item.analysis),
          }))
        : result,
    });
  } catch (error) {
    logger.error("Multi-modal report error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
