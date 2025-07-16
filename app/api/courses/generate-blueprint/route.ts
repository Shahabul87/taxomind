import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { generateCourseBlueprint, type CourseGenerationRequest } from "@/lib/anthropic-client";
import { AIErrorHandler } from "@/lib/error-handler";

// Force Node.js runtime
export const runtime = 'nodejs';

interface CourseBlueprint {
  id: string;
  course: {
    title: string;
    description: string;
    subtitle?: string;
    difficulty: string;
    duration: string;
    targetAudience: string;
    goals: string[];
    includeAssessments: boolean;
  };
  chapters: {
    title: string;
    description: string;
    position: number;
    bloomsLevel: string;
    sections: {
      title: string;
      description: string;
      position: number;
      contentType: string;
      estimatedDuration: string;
      bloomsLevel: string;
    }[];
  }[];
  metadata: {
    bloomsFocus: string[];
    preferredContentTypes: string[];
    aiGenerated: boolean;
    generatedAt: string;
    generatedBy: string;
    totalEstimatedHours?: number;
    bloomsDistribution?: Record<string, number>;
    contentTypeDistribution?: Record<string, number>;
  };
}

// Transform AI blueprint to legacy format for compatibility
async function transformToLegacyBlueprint(
  requirements: CourseGenerationRequest, 
  userId: string
): Promise<CourseBlueprint> {
  
  // Generate a unique blueprint ID
  const blueprintId = `blueprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const result = await AIErrorHandler.handleBlueprintGeneration(
    async () => {
      console.log("[BLUEPRINT] Generating AI-powered course blueprint...");
      
      // Use the new AI-powered generation
      const aiBlueprint = await generateCourseBlueprint(requirements);
      
      console.log("[BLUEPRINT] AI generation successful, transforming format...");
      
      // Transform to legacy format
      const blueprint: CourseBlueprint = {
        id: blueprintId,
        course: {
          title: aiBlueprint.course.title,
          description: aiBlueprint.course.description,
          subtitle: aiBlueprint.course.subtitle,
          difficulty: aiBlueprint.course.difficulty,
          duration: aiBlueprint.course.estimatedDuration,
          targetAudience: aiBlueprint.course.targetAudience,
          goals: aiBlueprint.course.learningOutcomes, // Map learning outcomes to goals
          includeAssessments: requirements.includeAssessments
        },
        chapters: aiBlueprint.chapters.map((chapter, index) => ({
          title: chapter.title,
          description: chapter.description,
          position: index + 1,
          bloomsLevel: chapter.bloomsLevel,
          sections: chapter.sections.map((section, sectionIndex) => ({
            title: section.title,
            description: section.description,
            position: sectionIndex + 1,
            contentType: section.contentType,
            estimatedDuration: section.estimatedDuration,
            bloomsLevel: section.bloomsLevel
          }))
        })),
        metadata: {
          bloomsFocus: requirements.bloomsFocus,
          preferredContentTypes: requirements.preferredContentTypes,
          aiGenerated: true,
          generatedAt: new Date().toISOString(),
          generatedBy: userId,
          totalEstimatedHours: aiBlueprint.metadata.totalEstimatedHours,
          bloomsDistribution: aiBlueprint.metadata.bloomsDistribution,
          contentTypeDistribution: aiBlueprint.metadata.contentTypeDistribution
        }
      };
      
      console.log("[BLUEPRINT] Transformation complete");
      return blueprint;
    },
    {
      operation: 'blueprint_generation',
      userId,
      endpoint: '/api/courses/generate-blueprint',
      additionalData: { 
        courseTitle: requirements.courseTitle,
        difficulty: requirements.difficulty,
        chapterCount: requirements.chapterCount
      }
    },
    // Fallback function
    async () => generateFallbackBlueprint(requirements, userId, blueprintId)
  );

  if (result.success) {
    return result.data;
  } else {
    console.error("[BLUEPRINT] All generation methods failed, throwing error");
    throw result.error || new Error('Blueprint generation failed');
  }
}

// Fallback template-based generation (simplified version of the original)
function generateFallbackBlueprint(
  requirements: CourseGenerationRequest,
  userId: string,
  blueprintId: string
): CourseBlueprint {
  console.log("[BLUEPRINT] Using fallback template-based generation");
  
  // Map difficulty to Bloom's levels
  const bloomsMapping = {
    'BEGINNER': ['REMEMBER', 'UNDERSTAND'],
    'INTERMEDIATE': ['UNDERSTAND', 'APPLY', 'ANALYZE'],
    'ADVANCED': ['APPLY', 'ANALYZE', 'EVALUATE', 'CREATE']
  };
  
  const availableBloomsLevels = bloomsMapping[requirements.difficulty];
  const selectedBloomsLevels = requirements.bloomsFocus.length > 0 
    ? requirements.bloomsFocus 
    : availableBloomsLevels;
  
  // Content type mapping
  const contentTypeMap: Record<string, string> = {
    'video': 'Video Lecture',
    'reading': 'Reading Material',
    'interactive': 'Interactive Exercise',
    'assessments': 'Quiz/Assessment',
    'projects': 'Hands-on Project',
    'discussions': 'Discussion Activity'
  };
  
  // Generate basic chapters
  const chapters: CourseBlueprint['chapters'] = [];
  
  for (let i = 1; i <= requirements.chapterCount; i++) {
    const chapterBloomsLevel = selectedBloomsLevels[
      Math.floor((i - 1) / requirements.chapterCount * selectedBloomsLevels.length)
    ] || selectedBloomsLevels[0];
    
    const sections: CourseBlueprint['chapters'][0]['sections'] = [];
    
    for (let j = 1; j <= requirements.sectionsPerChapter; j++) {
      const contentType = requirements.preferredContentTypes[
        Math.floor((j - 1) / requirements.sectionsPerChapter * requirements.preferredContentTypes.length)
      ] || requirements.preferredContentTypes[0];
      
      sections.push({
        title: `Section ${j}: ${requirements.courseTitle} Concepts ${j}`,
        description: `Learn key concepts and apply ${chapterBloomsLevel.toLowerCase()} skills in ${requirements.courseTitle.toLowerCase()}.`,
        position: j,
        contentType: contentTypeMap[contentType] || 'Mixed Content',
        estimatedDuration: '15-20 minutes',
        bloomsLevel: chapterBloomsLevel
      });
    }
    
    chapters.push({
      title: `Chapter ${i}: ${requirements.courseTitle} Fundamentals ${i}`,
      description: `Explore essential concepts in ${requirements.courseTitle.toLowerCase()} for ${requirements.targetAudience.toLowerCase()}.`,
      position: i,
      bloomsLevel: chapterBloomsLevel,
      sections
    });
  }
  
  return {
    id: blueprintId,
    course: {
      title: requirements.courseTitle,
      description: requirements.courseShortOverview || `A comprehensive course on ${requirements.courseTitle} designed for ${requirements.targetAudience}.`,
      subtitle: `${requirements.difficulty} Level Course`,
      difficulty: requirements.difficulty,
      duration: requirements.duration,
      targetAudience: requirements.targetAudience,
      goals: requirements.courseGoals,
      includeAssessments: requirements.includeAssessments
    },
    chapters,
    metadata: {
      bloomsFocus: requirements.bloomsFocus,
      preferredContentTypes: requirements.preferredContentTypes,
      aiGenerated: false, // Mark as template-based
      generatedAt: new Date().toISOString(),
      generatedBy: userId
    }
  };
}


export async function POST(req: Request) {
  try {
    console.log("[BLUEPRINT] Starting course blueprint generation");
    
    // Get current user
    const user = await currentUser();
    
    if (!user?.id) {
      console.log("[BLUEPRINT] No user found - unauthorized");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Check user role
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true }
    });
    
    const userRole = dbUser?.role;
    
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      console.log(`[BLUEPRINT] User role ${userRole} not authorized for blueprint generation`);
      return new NextResponse(`Forbidden - Teachers only. Your role: ${userRole}`, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const courseRequirements: CourseGenerationRequest = body;
    
    console.log("[BLUEPRINT] Course requirements:", courseRequirements);
    
    // Validate required fields
    if (!courseRequirements.courseTitle || !courseRequirements.courseShortOverview) {
      return new NextResponse("Course title and overview are required", { status: 400 });
    }
    
    if (!courseRequirements.targetAudience) {
      return new NextResponse("Target audience is required", { status: 400 });
    }
    
    if (courseRequirements.chapterCount < 1 || courseRequirements.sectionsPerChapter < 1) {
      return new NextResponse("Invalid chapter or section count", { status: 400 });
    }
    
    console.log(`[BLUEPRINT] Generating AI-powered blueprint for user ${user.id}`);
    
    // Generate course blueprint using enhanced error handling
    const blueprint = await transformToLegacyBlueprint(courseRequirements, user.id);
    
    // TODO: Store blueprint in database for future reference (requires CourseBlueprint model)
    // For now, we'll just return the generated blueprint without storing it
    
    console.log(`[BLUEPRINT] Blueprint generated successfully: ${blueprint.id}`);
    return NextResponse.json(blueprint);
    
  } catch (error) {
    console.error("[BLUEPRINT] Error generating course blueprint:", error);
    
    const errorMessage = AIErrorHandler.getUserFriendlyMessage(
      error as Error, 
      'blueprint_generation'
    );
    
    if (error instanceof Error) {
      console.error("[BLUEPRINT] Error message:", error.message);
      console.error("[BLUEPRINT] Error stack:", error.stack);
      
      // Return appropriate HTTP status based on error type
      if (error.message.includes('Rate limit') || error.message.includes('429')) {
        return new NextResponse(errorMessage, { status: 429 });
      }
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        return new NextResponse(errorMessage, { status: 401 });
      }
      if (error.message.includes('Network') || error.message.includes('timeout')) {
        return new NextResponse(errorMessage, { status: 503 });
      }
    }
    
    return new NextResponse(errorMessage, { status: 500 });
  }
}