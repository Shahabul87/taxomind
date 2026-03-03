import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  createMultimediaEngine,
  createUnifiedBloomsEngine,
  MultimediaBloomsEngine,
} from "@sam-ai/educational";
import type {
  VideoContent,
  AudioContent,
  InteractiveContent,
  MultimediaContent,
  MultimediaAnalysisOptions,
} from "@sam-ai/educational";
import { getUserScopedSAMConfig, getDatabaseAdapter } from "@/lib/adapters";
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError, withSubscriptionGate } from '@/lib/sam/ai-provider';
import type { SAMInteractionType } from '@prisma/client';

// Per-request engine factory (user-scoped AI provider)
async function createMultimediaEngineForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createMultimediaEngine({
    samConfig,
    database: getDatabaseAdapter(),
  });
}

// Per-request Multimedia Bloom's Engine factory (Phase 4: Multimedia Content Analysis)
async function createMultimediaBloomsEngineForUser(userId: string): Promise<MultimediaBloomsEngine> {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');

  // Create content analyzer adapter using unified blooms engine
  const unifiedEngine = createUnifiedBloomsEngine({
    samConfig,
    database: getDatabaseAdapter(),
    defaultMode: 'standard',
    confidenceThreshold: 0.7,
    enableCache: true,
    cacheTTL: 3600,
  });

  // Create adapter for the content analyzer interface
  const contentAnalyzer = {
    async analyze(content: string, options?: { includeSubLevel?: boolean }) {
      const result = await unifiedEngine.analyze(content, {
        mode: 'standard',
        includeSubLevel: options?.includeSubLevel,
      });
      return {
        dominantLevel: result.dominantLevel,
        distribution: result.distribution,
        confidence: result.confidence,
        cognitiveDepth: result.cognitiveDepth,
        subLevel: result.subLevel,
      };
    },
  };

  return new MultimediaBloomsEngine(contentAnalyzer, {
    enableParallelAnalysis: true,
    maxParallelImages: 5,
    logger: {
      debug: (msg: string, ...args: unknown[]) => logger.debug(msg, ...args),
      warn: (msg: string, ...args: unknown[]) => logger.warn(msg, ...args),
      error: (msg: string, ...args: unknown[]) => logger.error(msg, ...args),
    },
  });
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
  // Rate limit AI analysis requests
  const rateLimitResponse = await withRateLimit(req, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, contentType, contentData } = body;

    // Subscription gate: analysis with enrollment bypass
    const gateResult = await withSubscriptionGate(session.user.id!, { category: 'analysis', courseId });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

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

    const engine = await createMultimediaEngineForUser(session.user.id);
    let analysis;
    switch (contentType) {
      case "video":
        analysis = await withRetryableTimeout(
          () => engine.analyzeVideo({ ...contentData, courseId } as VideoContent),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'analyzeVideo'
        );
        break;

      case "audio":
        analysis = await withRetryableTimeout(
          () => engine.analyzeAudio({ ...contentData, courseId } as AudioContent),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'analyzeAudio'
        );
        break;

      case "interactive":
        analysis = await withRetryableTimeout(
          () => engine.analyzeInteractive({ ...contentData, courseId } as InteractiveContent),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'analyzeInteractive'
        );
        break;

      // Phase 4: Bloom's Taxonomy Analysis for Multimedia Content
      case "blooms-video": {
        const bloomsEngine = await createMultimediaBloomsEngineForUser(session.user.id);
        const videoContent: MultimediaContent = {
          type: 'video',
          id: contentData.videoId ?? `video-${Date.now()}`,
          title: contentData.title,
          video: {
            source: contentData.source ?? 'youtube',
            videoId: contentData.videoId,
            url: contentData.url,
            transcript: contentData.transcript,
          },
          textContext: contentData.textContext,
        };
        const options: MultimediaAnalysisOptions = {
          includeChunkAnalysis: contentData.includeChunkAnalysis ?? true,
          includeSubLevel: contentData.includeSubLevel ?? true,
        };
        analysis = await withRetryableTimeout(
          () => bloomsEngine.analyze(videoContent, options),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'bloomsAnalyzeVideo'
        );
        break;
      }

      case "blooms-image": {
        const bloomsEngine = await createMultimediaBloomsEngineForUser(session.user.id);
        const imageContent: MultimediaContent = {
          type: 'image',
          id: contentData.imageId ?? `image-${Date.now()}`,
          title: contentData.title,
          image: {
            data: contentData.imageData,
            metadata: {
              mimeType: contentData.mimeType ?? 'image/jpeg',
              altText: contentData.altText,
            },
          },
          textContext: contentData.textContext,
        };
        const options: MultimediaAnalysisOptions = {
          includeAccessibility: contentData.includeAccessibility ?? true,
          includeSubLevel: contentData.includeSubLevel ?? true,
        };
        analysis = await withRetryableTimeout(
          () => bloomsEngine.analyze(imageContent, options),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'bloomsAnalyzeImage'
        );
        break;
      }

      case "blooms-mixed": {
        const bloomsEngine = await createMultimediaBloomsEngineForUser(session.user.id);
        const mixedContent: MultimediaContent = {
          type: 'mixed',
          id: contentData.contentId ?? `mixed-${Date.now()}`,
          title: contentData.title,
          video: contentData.video ? {
            source: contentData.video.source ?? 'youtube',
            videoId: contentData.video.videoId,
            url: contentData.video.url,
          } : undefined,
          images: contentData.images?.map((img: { data: string; mimeType?: string; altText?: string }) => ({
            data: img.data,
            metadata: {
              mimeType: img.mimeType ?? 'image/jpeg',
              altText: img.altText,
            },
          })),
          textContext: contentData.textContext,
        };
        const options: MultimediaAnalysisOptions = {
          includeChunkAnalysis: contentData.includeChunkAnalysis ?? true,
          includeAccessibility: contentData.includeAccessibility ?? true,
          includeSubLevel: contentData.includeSubLevel ?? true,
        };
        analysis = await withRetryableTimeout(
          () => bloomsEngine.analyze(mixedContent, options),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'bloomsAnalyzeMixed'
        );
        break;
      }

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
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    if (error instanceof OperationTimeoutError) {
      logger.error("Multi-modal analysis timed out:", { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { error: "Analysis timed out. Please try again with smaller content." },
        { status: 504 }
      );
    }
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

    const engine = await createMultimediaEngineForUser(session.user.id);
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
          take: 500,
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
