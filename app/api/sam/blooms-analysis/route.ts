import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { createUnifiedBloomsEngine } from '@sam-ai/educational';
import type { UnifiedCourseInput, UnifiedCourseOptions } from '@sam-ai/educational';
import { getSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Create Unified Blooms engine singleton (Priority 1: Unified Bloom's Engine)
let unifiedBloomsEngine: ReturnType<typeof createUnifiedBloomsEngine> | null = null;

function getUnifiedBloomsEngine() {
  if (!unifiedBloomsEngine) {
    unifiedBloomsEngine = createUnifiedBloomsEngine({
      samConfig: getSAMConfig(),
      database: getDatabaseAdapter(),
      defaultMode: 'standard', // Keyword + AI validation when confidence low
      confidenceThreshold: 0.7,
      enableCache: true,
      cacheTTL: 3600, // 1 hour cache
    });
  }
  return unifiedBloomsEngine;
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      courseId,
      depth = 'detailed',
      includeRecommendations = true
    } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Fetch full course data for portable engine
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { position: 'asc' },
          include: {
            sections: {
              orderBy: { position: 'asc' },
              include: {
                exams: {
                  include: {
                    enhancedQuestions: {
                      select: {
                        id: true,
                        question: true,
                        bloomsLevel: true,
                      },
                    },
                  },
                },
                learningObjectiveItems: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess = course.userId === user.id ||
      (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

    if (!hasAccess && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build UnifiedCourseInput for unified Blooms engine
    const courseData: UnifiedCourseInput = {
      id: course.id,
      title: course.title || 'Untitled Course',
      description: course.description || undefined,
      chapters: course.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        position: chapter.position,
        sections: chapter.sections.map((section) => ({
          id: section.id,
          title: section.title,
          content: section.description || undefined,
          description: section.description || undefined,
          learningObjectives: section.learningObjectiveItems?.map((obj) => obj.objective) || [],
        })),
      })),
    };

    // Configure analysis options
    const options: UnifiedCourseOptions = {
      depth: depth as 'basic' | 'detailed' | 'comprehensive',
      includeRecommendations,
      mode: depth === 'comprehensive' ? 'comprehensive' : 'standard',
    };

    // Perform Bloom's Taxonomy analysis using unified engine
    const engine = getUnifiedBloomsEngine();
    const analysis = await engine.analyzeCourse(courseData, options);

    // Record the analysis as a SAM interaction
    await recordSAMInteraction(user.id, courseId, 'BLOOMS_ANALYSIS', {
      depth,
      cognitiveDepth: analysis.courseLevel.cognitiveDepth,
      balance: analysis.courseLevel.balance,
    });

    return NextResponse.json({
      success: true,
      data: {
        courseLevel: analysis.courseLevel,
        chapters: analysis.chapters,
        learningPathway: analysis.learningPathway,
        recommendations: analysis.recommendations,
        analyzedAt: analysis.analyzedAt,
      },
      metadata: {
        courseId,
        courseTitle: course.title,
        analysisDepth: depth,
        timestamp: new Date().toISOString(),
        userId: user.id,
        engine: '@sam-ai/educational (unified)',
        processingTimeMs: analysis.metadata.processingTimeMs,
        fromCache: analysis.metadata.fromCache,
      },
    });

  } catch (error) {
    logger.error('Blooms analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform Blooms analysis' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if user has access to the course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true, organizationId: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const hasAccess = course.userId === user.id || 
      (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

    if (!hasAccess && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get stored analysis
    const analysis = await db.courseBloomsAnalysis.findUnique({
      where: { courseId },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'No analysis found for this course' }, { status: 404 });
    }

    // Get section mappings
    const sectionMappings = await db.sectionBloomsMapping.findMany({
      where: {
        section: {
          chapter: {
            courseId,
          },
        },
      },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            chapterId: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        bloomsDistribution: analysis.bloomsDistribution,
        cognitiveDepth: analysis.cognitiveDepth,
        learningPathway: analysis.learningPathway,
        skillsMatrix: analysis.skillsMatrix,
        gapAnalysis: analysis.gapAnalysis,
        recommendations: analysis.recommendations,
        analyzedAt: analysis.analyzedAt,
        sectionMappings: sectionMappings.map(mapping => ({
          sectionId: mapping.sectionId,
          sectionTitle: mapping.section.title,
          bloomsLevel: mapping.bloomsLevel,
          primaryLevel: mapping.primaryLevel,
          activities: mapping.activities,
          learningObjectives: mapping.learningObjectives,
        })),
      },
    });

  } catch (error) {
    logger.error('Get Blooms analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve Blooms analysis' },
      { status: 500 }
    );
  }
}

async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const membership = await db.organizationUser.findFirst({
    where: {
      userId,
      organizationId,
      role: 'ADMIN',
    },
  });
  
  return !!membership;
}

async function recordSAMInteraction(
  userId: string,
  courseId: string,
  interactionType: string,
  result: any
): Promise<void> {
  try {
    await db.sAMInteraction.create({
      data: {
        userId,
        courseId,
        interactionType: 'CONTENT_GENERATE', // Using existing enum value
        context: { type: interactionType, result },
      },
    });
  } catch (error) {
    logger.error('Error recording SAM interaction:', error);
  }
}