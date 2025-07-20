import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { BloomsAnalysisEngine } from '@/lib/sam-blooms-engine';
import { db } from '@/lib/db';

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

    // Check if user has access to the course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { 
        userId: true, 
        organizationId: true,
        title: true,
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

    // Perform Bloom's Taxonomy analysis
    const engine = new BloomsAnalysisEngine();
    const analysis = await engine.analyzeCourse(courseId, depth, includeRecommendations);

    // Record the analysis as a SAM interaction
    await recordSAMInteraction(user.id, courseId, 'BLOOMS_ANALYSIS', {
      depth,
      cognitiveDepth: analysis.courseLevel.cognitiveDepth,
      balance: analysis.courseLevel.balance,
    });

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        courseId,
        courseTitle: course.title,
        analysisDepth: depth,
        timestamp: new Date().toISOString(),
        userId: user.id,
      },
    });

  } catch (error) {
    console.error('Blooms analysis error:', error);
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
    console.error('Get Blooms analysis error:', error);
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
      role: { in: ['OWNER', 'ADMIN', 'INSTRUCTOR'] },
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
        interactionType: 'CONTENT_GENERATED', // Using existing enum value
        context: { type: interactionType },
        result,
      },
    });
  } catch (error) {
    console.error('Error recording SAM interaction:', error);
  }
}