import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { samResourceEngine } from "@/lib/sam-resource-engine";
import {
  Topic,
  ResourceDiscoveryConfig,
  StudentResourceProfile,
  ResourceType,
} from "@/lib/sam-resource-engine";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!action || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let result;
    switch (action) {
      case "discover":
        result = await handleDiscoverResources(data);
        break;

      case "quality-score":
        result = await handleQualityScore(data);
        break;

      case "license-check":
        result = await handleLicenseCheck(data);
        break;

      case "roi-analysis":
        result = await handleROIAnalysis(data, session.user.id);
        break;

      case "personalize":
        result = await handlePersonalize(data, session.user.id);
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
    });
  } catch (error) {
    console.error("Resource intelligence error:", error);
    return NextResponse.json(
      { error: "Failed to process resource request" },
      { status: 500 }
    );
  }
}

async function handleDiscoverResources(data: any) {
  const { topic, config } = data;

  if (!topic || !topic.name) {
    throw new Error("Topic name is required");
  }

  const topicObj: Topic = {
    id: topic.id || `topic-${Date.now()}`,
    name: topic.name,
    category: topic.category || "general",
    keywords: topic.keywords || topic.name.split(" "),
    difficulty: topic.difficulty || "medium",
    courseId: topic.courseId,
    chapterId: topic.chapterId,
  };

  const discoveryConfig: ResourceDiscoveryConfig = {
    sources: config?.sources || ["youtube", "coursera", "medium", "github"],
    maxResults: config?.maxResults || 20,
    qualityThreshold: config?.qualityThreshold || 0.7,
    includeTypes: config?.includeTypes || [
      "article",
      "video",
      "course",
      "tutorial",
    ],
    excludeTypes: config?.excludeTypes,
    languages: config?.languages || ["en"],
    maxAge: config?.maxAge,
    costFilter: config?.costFilter,
  };

  return await samResourceEngine.discoverResources(topicObj, discoveryConfig);
}

async function handleQualityScore(data: any) {
  const { resource } = data;

  if (!resource || !resource.url) {
    throw new Error("Resource URL is required");
  }

  return await samResourceEngine.scoreResourceQuality(resource);
}

async function handleLicenseCheck(data: any) {
  const { resource, intendedUse } = data;

  if (!resource) {
    throw new Error("Resource is required");
  }

  return await samResourceEngine.checkLicenseCompatibility(
    resource,
    intendedUse
  );
}

async function handleROIAnalysis(data: any, userId: string) {
  const { resource } = data;

  if (!resource) {
    throw new Error("Resource is required");
  }

  // Build learner profile
  const profile = await buildLearnerProfile(userId);

  return await samResourceEngine.analyzeResourceROI(resource, profile);
}

async function handlePersonalize(data: any, userId: string) {
  const { resources } = data;

  if (!resources || !Array.isArray(resources)) {
    throw new Error("Resources array is required");
  }

  // Build learner profile
  const profile = await buildLearnerProfile(userId);

  return await samResourceEngine.personalizeRecommendations(
    profile,
    resources
  );
}

async function buildLearnerProfile(userId: string): Promise<StudentResourceProfile> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      samLearningProfile: true,
      Enrollment: {
        include: {
          course: {
            select: {
              title: true,
              category: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Analyze user preferences from activity
  const activities = await db.realtime_activities.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  // Determine preferred types from activity
  const preferredTypes: ResourceType[] = ["article", "video", "tutorial"];
  const videoCount = activities.filter((a) => a.contentType === "VIDEO").length;
  const articleCount = activities.filter(
    (a) => a.contentType === "ARTICLE"
  ).length;

  if (videoCount > articleCount) {
    preferredTypes.unshift("video");
  }

  // Determine learning goals from enrolled courses
  const learningGoals = user.Enrollment.map(
    (e) => e.course.title || "General learning"
  ).slice(0, 3);

  return {
    userId,
    preferredTypes,
    preferredFormats: ["interactive", "visual", "text"],
    preferredDuration: { min: 10, max: 60 },
    languagePreferences: ["en"],
    budgetConstraints: { max: 50, currency: "USD" },
    learningGoals,
    skillLevel: determineSkillLevel(user),
  };
}

function determineSkillLevel(user: any): string {
  const completedCourses = user.Enrollment.filter(
    (e: any) => e.completedAt
  ).length;

  if (completedCourses === 0) return "beginner";
  if (completedCourses < 5) return "intermediate";
  return "advanced";
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const topic = searchParams.get("topic");
    const type = searchParams.get("type") || "recommendations";

    if (type === "recommendations" && topic) {
      const recommendations = await samResourceEngine.getResourceRecommendations(
        session.user.id,
        topic
      );

      return NextResponse.json({
        success: true,
        recommendations,
      });
    }

    if (type === "history") {
      // Get recent resource recommendations
      const history = await db.personalizedResourceRecommendation.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return NextResponse.json({
        success: true,
        history: history.map((h) => ({
          id: h.id,
          topRecommendation: h.topRecommendation,
          avgMatchScore: h.avgMatchScore,
          createdAt: h.createdAt,
          recommendations: JSON.parse(h.recommendations as string),
        })),
      });
    }

    if (type === "discoveries") {
      // Get recent discoveries
      const discoveries = await db.resourceDiscovery.findMany({
        orderBy: { discoveredAt: "desc" },
        take: 20,
      });

      return NextResponse.json({
        success: true,
        discoveries: discoveries.map((d) => ({
          id: d.id,
          topicName: d.topicName,
          resourceCount: d.resourceCount,
          avgQualityScore: d.avgQualityScore,
          discoveredAt: d.discoveredAt,
          resources: JSON.parse(d.resources as string),
        })),
      });
    }

    return NextResponse.json(
      { error: "Invalid request type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching resource data:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource data" },
      { status: 500 }
    );
  }
}