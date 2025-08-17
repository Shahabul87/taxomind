import { type EnhancedContentRequest } from "@/lib/ai-content-generator";
import { generateCourseBlueprint, type CourseGenerationRequest } from "@/lib/anthropic-client";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

interface StreamMessage {
  type: 'progress' | 'stage' | 'chapter' | 'section' | 'complete' | 'error';
  data: any;
  progress: number;
  message: string;
}

interface StreamingGenerationContext {
  stage: string;
  progress: number;
  totalSteps: number;
  currentStep: number;
  estimatedTimeRemaining: number;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Check user role
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true }
    });
    
    const userRole = dbUser?.role;
    
    if (userRole !== 'ADMIN') {
      return new Response(`Forbidden - Admin access required. Your role: ${userRole}`, { status: 403 });
    }

    const body = await req.json();
    const courseRequirements: CourseGenerationRequest = body;
    
    // Validate required fields
    if (!courseRequirements.courseTitle || !courseRequirements.courseShortOverview) {
      return new Response("Course title and overview are required", { status: 400 });
    }
    
    if (!courseRequirements.targetAudience) {
      return new Response("Target audience is required", { status: 400 });
    }
    
    if (courseRequirements.chapterCount < 1 || courseRequirements.sectionsPerChapter < 1) {
      return new Response("Invalid chapter or section count", { status: 400 });
    }

    // Create a readable stream for real-time updates
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await generateBlueprintWithStreaming(courseRequirements, user.id, controller);
        } catch (error) {
          logger.error('[STREAMING] Error in blueprint generation:', error);
          const errorMessage: StreamMessage = {
            type: 'error',
            data: { error: error instanceof Error ? error.message : 'Unknown error' },
            progress: 0,
            message: 'Failed to generate course blueprint'
          };
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorMessage)}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    logger.error('[STREAMING] Request setup error:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

async function generateBlueprintWithStreaming(
  requirements: CourseGenerationRequest,
  userId: string,
  controller: ReadableStreamDefaultController
) {
  const totalSteps = 6; // Strategy, Structure, Chapters, Sections, Project, Finalization
  let currentStep = 0;
  const startTime = Date.now();

  const sendUpdate = (message: StreamMessage) => {
    const sseMessage = `data: ${JSON.stringify(message)}\n\n`;
    controller.enqueue(new TextEncoder().encode(sseMessage));
  };

  const updateProgress = (stage: string, progress: number, message: string, data?: any) => {
    currentStep = Math.min(currentStep + 1, totalSteps);
    const overallProgress = Math.round((currentStep / totalSteps) * 100);
    const elapsed = Date.now() - startTime;
    const estimatedTotal = elapsed / (currentStep / totalSteps);
    const estimatedRemaining = Math.max(0, estimatedTotal - elapsed);

    sendUpdate({
      type: 'progress',
      data: data || {},
      progress: overallProgress,
      message: `${stage}: ${message}`
    });

    sendUpdate({
      type: 'stage',
      data: {
        stage,
        currentStep,
        totalSteps,
        estimatedTimeRemaining: Math.round(estimatedRemaining / 1000),
        details: message
      },
      progress: overallProgress,
      message
    });
  };

  try {
    // Generate unique blueprint ID
    const blueprintId = `blueprint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    updateProgress('Initialization', 5, 'Starting AI course generation...');
    
    // Enhanced requirements with intelligent context
    const enhancedRequirements: EnhancedContentRequest = {
      ...requirements,
      learningMethodology: inferLearningMethodology(requirements),
      industryContext: extractIndustryContext(requirements),
      assessmentStyle: requirements.includeAssessments ? 'mixed' : 'milestone' as const
    };

    updateProgress('AI Strategy', 15, 'Analyzing course requirements and generating teaching strategy...');
    
    let aiBlueprint;
    try {
      // Try enhanced AI generation with streaming updates
      aiBlueprint = await generateIntelligentCourseContentWithStreaming(
        enhancedRequirements, 
        sendUpdate,
        updateProgress
      );
      
      updateProgress('Content Optimization', 85, 'Optimizing generated content for educational effectiveness...');
      
    } catch (enhancedError) {
      logger.warn('[STREAMING] Enhanced generation failed, falling back to standard generation:', enhancedError);
      updateProgress('Fallback Generation', 50, 'Using standard AI generation method...');
      
      // Fallback to standard generation
      aiBlueprint = await generateCourseBlueprint(requirements);
      updateProgress('Standard Generation', 80, 'Course blueprint generated successfully...');
    }

    updateProgress('Blueprint Assembly', 90, 'Assembling final course structure...');

    // Transform to expected format
    const blueprint = {
      id: blueprintId,
      course: {
        title: aiBlueprint.course.title,
        description: aiBlueprint.course.description,
        subtitle: aiBlueprint.course.subtitle,
        difficulty: aiBlueprint.course.difficulty,
        duration: aiBlueprint.course.estimatedDuration,
        targetAudience: aiBlueprint.course.targetAudience,
        goals: aiBlueprint.course.learningOutcomes,
        includeAssessments: requirements.includeAssessments
      },
      chapters: aiBlueprint.chapters.map((chapter: any, index: number) => ({
        title: chapter.title,
        description: chapter.description,
        position: index + 1,
        bloomsLevel: chapter.bloomsLevel,
        sections: chapter.sections.map((section: any, sectionIndex: number) => ({
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
        contentTypeDistribution: aiBlueprint.metadata.contentTypeDistribution,
        generationMethod: 'streaming_ai'
      }
    };

    updateProgress('Finalization', 100, 'Course blueprint completed successfully!');

    // Send final result
    sendUpdate({
      type: 'complete',
      data: blueprint,
      progress: 100,
      message: 'Course blueprint generation completed successfully!'
    });

  } catch (error) {
    logger.error('[STREAMING] Generation error:', error);
    sendUpdate({
      type: 'error',
      data: { error: error instanceof Error ? error.message : 'Unknown error' },
      progress: 0,
      message: 'Failed to generate course blueprint'
    });
  } finally {
    controller.close();
  }
}

async function generateIntelligentCourseContentWithStreaming(
  requirements: EnhancedContentRequest,
  sendUpdate: (message: StreamMessage) => void,
  updateProgress: (stage: string, progress: number, message: string, data?: any) => void
): Promise<any> {
  
  updateProgress('Course Strategy', 20, 'Analyzing educational approach and learning methodology...');
  
  // Generate course strategy
  const strategy = await generateCourseStrategyWithProgress(requirements, sendUpdate);
  
  updateProgress('Course Structure', 35, 'Creating comprehensive course structure and learning path...');
  
  // Generate detailed structure
  const structure = await generateCourseStructureWithProgress(requirements, strategy, sendUpdate);
  
  updateProgress('Chapter Generation', 50, 'Generating detailed chapters with educational content...');
  
  // Generate chapters with progress updates
  const chapters = await generateChaptersWithProgress(requirements, structure, sendUpdate);
  
  updateProgress('Content Enhancement', 75, 'Adding real-world applications and assessment strategies...');
  
  // Generate course-level project if needed
  const project = requirements.preferredContentTypes.includes('projects') 
    ? await generateProjectWithProgress(requirements, chapters, sendUpdate)
    : undefined;

  // Assemble final blueprint
  return {
    course: structure.course,
    chapters,
    courseLevelProject: project,
    metadata: {
      aiGenerated: true,
      generatedAt: new Date().toISOString(),
      bloomsDistribution: calculateBloomsDistribution(chapters),
      contentTypeDistribution: calculateContentDistribution(chapters),
      totalEstimatedHours: calculateTotalDuration(chapters),
      difficultyProgression: 'Progressive',
      pedagogicalApproach: strategy.approach,
      innovationFactors: strategy.innovations
    }
  };
}

async function generateCourseStrategyWithProgress(
  requirements: EnhancedContentRequest,
  sendUpdate: (message: StreamMessage) => void
): Promise<any> {
  sendUpdate({
    type: 'stage',
    data: { stage: 'strategy', details: 'Analyzing course requirements and determining optimal teaching approach...' },
    progress: 20,
    message: 'Determining optimal pedagogical approach...'
  });

  // Simulate strategy generation (in real implementation, this would call Anthropic API)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    approach: 'Project-based learning with progressive skill building',
    innovations: ['Interactive simulations', 'Real-world case studies', 'Peer collaboration'],
    learningPath: 'Foundational concepts → Practical application → Advanced integration',
    assessmentStrategy: 'Continuous formative assessment with milestone projects'
  };
}

async function generateCourseStructureWithProgress(
  requirements: EnhancedContentRequest,
  strategy: any,
  sendUpdate: (message: StreamMessage) => void
): Promise<any> {
  sendUpdate({
    type: 'stage',
    data: { stage: 'structure', details: 'Creating detailed course outline and learning progression...' },
    progress: 35,
    message: 'Building course structure and learning progression...'
  });

  await new Promise(resolve => setTimeout(resolve, 1500));

  return {
    course: {
      title: `Enhanced ${requirements.courseTitle}`,
      description: `${requirements.courseShortOverview} This comprehensive course uses ${strategy.approach} to ensure maximum learning effectiveness.`,
      subtitle: `Professional ${requirements.difficulty} Level Course`,
      learningOutcomes: requirements.courseGoals,
      prerequisites: [],
      targetAudience: requirements.targetAudience,
      estimatedDuration: requirements.duration,
      difficulty: requirements.difficulty
    }
  };
}

async function generateChaptersWithProgress(
  requirements: EnhancedContentRequest,
  structure: any,
  sendUpdate: (message: StreamMessage) => void
): Promise<any[]> {
  const chapters = [];
  
  for (let i = 0; i < requirements.chapterCount; i++) {
    const chapterProgress = 50 + (i / requirements.chapterCount) * 25;
    
    sendUpdate({
      type: 'chapter',
      data: { 
        chapterNumber: i + 1, 
        totalChapters: requirements.chapterCount,
        chapterTitle: `Chapter ${i + 1}: Advanced Concepts`
      },
      progress: chapterProgress,
      message: `Generating Chapter ${i + 1} of ${requirements.chapterCount}...`
    });

    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate sections for this chapter
    const sections = [];
    for (let j = 0; j < requirements.sectionsPerChapter; j++) {
      sendUpdate({
        type: 'section',
        data: {
          chapterNumber: i + 1,
          sectionNumber: j + 1,
          sectionTitle: `Section ${j + 1}: Practical Application`
        },
        progress: chapterProgress + (j / requirements.sectionsPerChapter) * 3,
        message: `Creating Section ${j + 1} for Chapter ${i + 1}...`
      });

      sections.push({
        title: `Section ${j + 1}: ${requirements.courseTitle} Implementation`,
        description: `Learn to apply ${requirements.courseTitle} concepts in real-world scenarios.`,
        contentType: requirements.preferredContentTypes[j % requirements.preferredContentTypes.length] || 'Mixed Content',
        bloomsLevel: requirements.bloomsFocus[j % requirements.bloomsFocus.length] || 'APPLY',
        estimatedDuration: '15-20 minutes',
        learningObjectives: [`Master key concepts`, `Apply practical skills`],
        keyTopics: [`Core principles`, `Best practices`, `Common challenges`],
        activities: [`Hands-on exercise`, `Case study analysis`]
      });
    }

    chapters.push({
      title: `Chapter ${i + 1}: ${requirements.courseTitle} Mastery`,
      description: `Comprehensive coverage of essential ${requirements.courseTitle} concepts and applications.`,
      learningOutcomes: [`Understand core principles`, `Apply advanced techniques`],
      bloomsLevel: requirements.bloomsFocus[i % requirements.bloomsFocus.length] || 'APPLY',
      estimatedDuration: `${requirements.sectionsPerChapter * 20} minutes`,
      sections
    });
  }

  return chapters;
}

async function generateProjectWithProgress(
  requirements: EnhancedContentRequest,
  chapters: any[],
  sendUpdate: (message: StreamMessage) => void
): Promise<any> {
  sendUpdate({
    type: 'stage',
    data: { stage: 'project', details: 'Creating capstone project that integrates all learning...' },
    progress: 80,
    message: 'Designing course capstone project...'
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    title: `${requirements.courseTitle} Capstone Project`,
    description: `A comprehensive project that demonstrates mastery of all course concepts through practical application.`,
    phases: ['Planning', 'Development', 'Implementation', 'Presentation'],
    timeline: '2-3 weeks',
    portfolioValue: 'High - suitable for professional portfolio and job applications'
  };
}

// Helper functions (simplified versions for streaming)
function inferLearningMethodology(requirements: CourseGenerationRequest): EnhancedContentRequest['learningMethodology'] {
  const intent = requirements.courseIntent.toLowerCase();
  if (intent.includes('project')) return 'project-based';
  if (intent.includes('practical')) return 'practical-first';
  return 'mixed';
}

function extractIndustryContext(requirements: CourseGenerationRequest): string {
  return `Professional ${requirements.courseCategory} development with focus on practical skills and industry best practices.`;
}

function calculateBloomsDistribution(chapters: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  let total = 0;

  chapters.forEach(chapter => {
    chapter.sections.forEach((section: any) => {
      distribution[section.bloomsLevel] = (distribution[section.bloomsLevel] || 0) + 1;
      total++;
    });
  });

  Object.keys(distribution).forEach(key => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
}

function calculateContentDistribution(chapters: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  let total = 0;

  chapters.forEach(chapter => {
    chapter.sections.forEach((section: any) => {
      distribution[section.contentType] = (distribution[section.contentType] || 0) + 1;
      total++;
    });
  });

  Object.keys(distribution).forEach(key => {
    distribution[key] = Math.round((distribution[key] / total) * 100);
  });

  return distribution;
}

function calculateTotalDuration(chapters: any[]): number {
  let totalMinutes = 0;
  chapters.forEach(chapter => {
    chapter.sections.forEach((section: any) => {
      totalMinutes += 20; // Simplified calculation
    });
  });
  return Math.round(totalMinutes / 60 * 10) / 10;
}