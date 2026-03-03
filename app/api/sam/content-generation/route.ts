import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createContentGenerationEngine } from "@sam-ai/educational";
import type { LearningObjectiveInput, GenerationConfig } from "@sam-ai/educational";
import { getUserScopedSAMConfig, getDatabaseAdapter } from "@/lib/adapters";
import { logger } from '@/lib/logger';
import { SAMGuards } from '@/lib/premium';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { handleAIAccessError } from '@/lib/sam/ai-provider';

// Create a user-scoped content generation engine instance
async function createContentEngineForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'course');
  return createContentGenerationEngine({
    samConfig,
    database: getDatabaseAdapter(),
  });
}

// Content Generation is a premium-only feature
export const POST = SAMGuards.contentGeneration(async (req, context) => {
  const rateLimitResponse = await withRateLimit(req, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const engine = await createContentEngineForUser(context.userId);

    let result;
    switch (action) {
      case "generate-course":
        result = await withRetryableTimeout(
          () => handleGenerateCourse(engine, data),
          TIMEOUT_DEFAULTS.AI_GENERATION,
          'generateCourse'
        );
        break;

      case "create-assessments":
        result = await withRetryableTimeout(
          () => handleCreateAssessments(engine, data),
          TIMEOUT_DEFAULTS.AI_GENERATION,
          'createAssessments'
        );
        break;

      case "generate-study-guide":
        result = await withRetryableTimeout(
          () => handleGenerateStudyGuide(engine, data, context.userId),
          TIMEOUT_DEFAULTS.AI_GENERATION,
          'generateStudyGuide'
        );
        break;

      case "create-exercises":
        result = await withRetryableTimeout(
          () => handleCreateExercises(engine, data),
          TIMEOUT_DEFAULTS.AI_GENERATION,
          'createExercises'
        );
        break;

      case "translate-content":
        result = await withRetryableTimeout(
          () => handleTranslateContent(engine, data),
          TIMEOUT_DEFAULTS.AI_GENERATION,
          'translateContent'
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      data: result,
      isPremium: context.isPremium
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Content generation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { error: 'Content generation timed out. Please try again.' },
        { status: 504 }
      );
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
});

async function handleGenerateCourse(engine: ReturnType<typeof createContentGenerationEngine>, data: any) {
  const { objectives, config } = data;

  if (!objectives || !Array.isArray(objectives)) {
    throw new Error("Learning objectives are required");
  }

  const learningObjectives: LearningObjectiveInput[] = objectives.map((obj: any) => ({
    id: obj.id || `obj-${Date.now()}-${Math.random()}`,
    objective: obj.objective,
    bloomsLevel: obj.bloomsLevel || "understand",
    skills: obj.skills || [],
    assessmentCriteria: obj.assessmentCriteria || [],
  }));

  const generationConfig: GenerationConfig = {
    style: config?.style || "formal",
    depth: config?.depth || "intermediate",
    includeExamples: config?.includeExamples ?? true,
    includeVisuals: config?.includeVisuals ?? false,
    includeActivities: config?.includeActivities ?? true,
    targetAudience: config?.targetAudience,
    constraints: config?.constraints,
  };

  return await engine.generateCourseContent(
    learningObjectives,
    generationConfig
  );
}

async function handleCreateAssessments(engine: ReturnType<typeof createContentGenerationEngine>, data: any) {
  const { topics, assessmentType, config } = data;

  if (!topics || !Array.isArray(topics)) {
    throw new Error("Topics are required");
  }

  if (!assessmentType) {
    throw new Error("Assessment type is required");
  }

  const topicObjects = topics.map((topic: any) => ({
    id: topic.id || `topic-${Date.now()}`,
    name: topic.name || topic,
    keywords: topic.keywords || [],
  }));

  return await engine.createAssessments(
    topicObjects,
    assessmentType,
    config
  );
}

async function handleGenerateStudyGuide(engine: ReturnType<typeof createContentGenerationEngine>, data: any, userId: string) {
  const { courseId } = data;

  if (!courseId) {
    throw new Error("Course ID is required");
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        include: {
          sections: true,
        },
      },
      user: true,
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  // Check if user has access to the course
  const isOwner = course.userId === userId;
  const isEnrolled = await db.enrollment.findFirst({
    where: {
      courseId,
      userId,
    },
  });

  if (!isOwner && !isEnrolled) {
    throw new Error("Access denied to this course");
  }

  // Convert PathDifficulty to string for SAM engine compatibility
  const courseForSAM = {
    ...course,
    difficulty: course.difficulty?.toString() as string | undefined,
  };

  return await engine.generateStudyGuides(courseForSAM as any);
}

async function handleCreateExercises(engine: ReturnType<typeof createContentGenerationEngine>, data: any) {
  const { concepts, exerciseType } = data;

  if (!concepts || !Array.isArray(concepts)) {
    throw new Error("Concepts are required");
  }

  if (!exerciseType) {
    throw new Error("Exercise type is required");
  }

  const conceptObjects = concepts.map((concept: any) => ({
    id: concept.id || `concept-${Date.now()}`,
    name: concept.name,
    description: concept.description || "",
    skills: concept.skills || [],
  }));

  return await engine.createInteractiveExercises(
    conceptObjects,
    exerciseType
  );
}

async function handleTranslateContent(engine: ReturnType<typeof createContentGenerationEngine>, data: any) {
  const { content, targetLanguage } = data;

  if (!content || !content.title || !content.body) {
    throw new Error("Content with title and body is required");
  }

  if (!targetLanguage || !targetLanguage.code) {
    throw new Error("Target language is required");
  }

  return await engine.adaptContentLanguage(
    content,
    targetLanguage
  );
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const contentType = searchParams.get("type");
    const quality = searchParams.get("quality");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10), 100);

    // Build query
    const where: any = {};
    if (contentType) {
      where.contentType = contentType;
    }
    if (quality) {
      where.quality = {
        gte: parseFloat(quality),
      };
    }

    // Get generated content
    const generatedContent = await db.generatedContent.findMany({
      where,
      orderBy: [
        { quality: "desc" },
        { usage: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
    });

    // Format response
    const formattedContent = generatedContent.map((item) => ({
      id: item.id,
      type: item.contentType,
      content: JSON.parse(item.content as string),
      metadata: item.metadata ? JSON.parse(item.metadata as string) : null,
      quality: item.quality,
      usage: item.usage,
      feedback: item.feedback ? JSON.parse(item.feedback as string) : null,
      createdAt: item.createdAt,
    }));

    return NextResponse.json({
      success: true,
      content: formattedContent,
      total: formattedContent.length,
    });
  } catch (error) {
    logger.error("Error fetching generated content:", error);
    return NextResponse.json(
      { error: "Failed to fetch generated content" },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating content feedback
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contentId, feedback, quality } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: "Content ID is required" },
        { status: 400 }
      );
    }

    // Update content with feedback
    const updateData: any = {
      usage: {
        increment: 1,
      },
    };

    if (feedback) {
      updateData.feedback = JSON.stringify(feedback);
    }

    if (quality !== undefined) {
      updateData.quality = quality;
    }

    const updated = await db.generatedContent.update({
      where: { id: contentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      content: {
        id: updated.id,
        usage: updated.usage,
        quality: updated.quality,
        feedback: updated.feedback ? JSON.parse(updated.feedback as string) : null,
      },
    });
  } catch (error) {
    logger.error("Error updating content feedback:", error);
    return NextResponse.json(
      { error: "Failed to update content feedback" },
      { status: 500 }
    );
  }
}