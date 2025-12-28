import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import {
  SAMAgentOrchestrator,
  createAssessmentEngine,
  createContentEngine,
  createContextEngine,
  createDefaultContext,
  createPersonalizationEngine,
  createResponseEngine,
  type SAMContext,
} from '@sam-ai/core';
import { createUnifiedBloomsAdapterEngine } from '@sam-ai/educational';
import { getDatabaseAdapter, getSAMConfig } from '@/lib/adapters';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Enhanced SAM Chat API with Engine Integration
 * This shows how to integrate all 5 engines into SAM's chat functionality
 */
let orchestrator: SAMAgentOrchestrator | null = null;

function getOrchestrator() {
  if (orchestrator) return orchestrator;
  const config = getSAMConfig();
  const dbAdapter = getDatabaseAdapter();
  const instance = new SAMAgentOrchestrator(config);

  instance.registerEngine(createContextEngine(config));
  instance.registerEngine(createContentEngine(config));
  instance.registerEngine(createPersonalizationEngine(config));
  instance.registerEngine(createAssessmentEngine(config));
  instance.registerEngine(createResponseEngine(config));
  instance.registerEngine(
    createUnifiedBloomsAdapterEngine({
      samConfig: config,
      database: dbAdapter,
      defaultMode: 'standard',
      confidenceThreshold: 0.7,
      enableCache: true,
      cacheTTL: 3600,
    })
  );

  orchestrator = instance;
  return instance;
}

function buildContext(
  userId: string,
  courseId?: string | null,
  isTeacher?: boolean
): SAMContext {
  return createDefaultContext({
    user: {
      id: userId,
      role: isTeacher ? 'teacher' : 'student',
      preferences: {},
      capabilities: [],
    },
    page: {
      type: courseId ? 'course-detail' : 'dashboard',
      path: courseId ? `/courses/${courseId}` : '/dashboard',
      entityId: courseId ?? undefined,
      capabilities: [],
      breadcrumb: [],
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      message,
      courseId,
      conversationId,
      includeEngineInsights = true,
    } = await request.json();

    // Determine interaction type from message
    const interactionType = determineInteractionType(message);

    const samContext = buildContext(
      user.id,
      courseId,
      (user as { isTeacher?: boolean }).isTeacher
    );
    const result = await getOrchestrator().orchestrate(samContext, message, {
      parallel: true,
    });

    const samResponse = {
      message: result.response.message,
      suggestions: result.response.suggestions ?? [],
      actions: result.response.actions ?? [],
      insights: includeEngineInsights ? result.response.insights ?? {} : {},
    };

    // Store the interaction
    await storeInteraction(
      user.id,
      courseId,
      message,
      samResponse,
      interactionType,
      includeEngineInsights ? result : null
    );

    // Return the enhanced response
    return NextResponse.json({
      success: true,
      data: {
        message: samResponse.message,
        suggestions: samResponse.suggestions,
        actions: samResponse.actions,
        insights: samResponse.insights,
        engineData: includeEngineInsights ? result.results : undefined,
        conversationId,
      },
    });

  } catch (error) {
    logger.error('SAM chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

/**
 * Determine interaction type based on message content
 */
function determineInteractionType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Market-related queries
  if (
    lowerMessage.includes('market') || 
    lowerMessage.includes('competitor') ||
    lowerMessage.includes('pricing') ||
    lowerMessage.includes('position')
  ) {
    return 'MARKET_ANALYSIS';
  }
  
  // Progress and performance queries
  if (
    lowerMessage.includes('progress') || 
    lowerMessage.includes('how am i doing') ||
    lowerMessage.includes('performance') ||
    lowerMessage.includes('score')
  ) {
    return 'PROGRESS_CHECK';
  }
  
  // Exam and assessment queries
  if (
    lowerMessage.includes('exam') || 
    lowerMessage.includes('quiz') ||
    lowerMessage.includes('test') ||
    lowerMessage.includes('assessment')
  ) {
    return 'EXAM_HELP';
  }
  
  // Course improvement queries
  if (
    lowerMessage.includes('improve') || 
    lowerMessage.includes('guide') ||
    lowerMessage.includes('recommendation') ||
    lowerMessage.includes('suggest')
  ) {
    return 'COURSE_HELP';
  }
  
  // Content generation
  if (
    lowerMessage.includes('create') || 
    lowerMessage.includes('generate') ||
    lowerMessage.includes('make')
  ) {
    return 'CONTENT_GENERATE';
  }
  
  return 'QUESTION_ASKED';
}

/**
 * Store the interaction with engine data
 */
async function storeInteraction(
  userId: string,
  courseId: string | null,
  message: string,
  response: any,
  interactionType: string,
  engineResponse: any
): Promise<void> {
  try {
    await db.sAMInteraction.create({
      data: {
        userId,
        courseId,
        interactionType: mapInteractionType(interactionType),
        context: {
          message,
          engineIntegration: !!engineResponse,
          enginesUsed: engineResponse ? getUsedEngines(engineResponse.results) : [],
          result: {
            response: response.message,
            suggestions: response.suggestions,
            actions: response.actions,
            insights: response.insights,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error storing SAM interaction:', error);
  }
}

/**
 * Get list of engines used in the response
 */
function getUsedEngines(engineResults: Record<string, unknown> | undefined): string[] {
  const engines: string[] = [];

  if (!engineResults) return engines;

  if (engineResults.context) engines.push('context');
  if (engineResults.blooms) engines.push('blooms');
  if (engineResults.content) engines.push('content');
  if (engineResults.personalization) engines.push('personalization');
  if (engineResults.assessment) engines.push('assessment');
  if (engineResults.response) engines.push('response');
  
  return engines;
}

function mapInteractionType(value: string) {
  switch (value) {
    case 'CONTENT_GENERATE':
      return 'CONTENT_GENERATE';
    case 'MARKET_ANALYSIS':
    case 'PROGRESS_CHECK':
    case 'EXAM_HELP':
    case 'COURSE_HELP':
      return 'LEARNING_ASSISTANCE';
    case 'QUESTION_ASKED':
    default:
      return 'CHAT_MESSAGE';
  }
}

// GET endpoint to retrieve conversation history with engine insights
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const courseId = searchParams.get('courseId');

    // Get conversation history
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        ...(courseId && { courseId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Format for display
    const messages = interactions.map(interaction => ({
      id: interaction.id,
      role: 'assistant',
      content: (interaction.context as any)?.result?.response || '',
      suggestions: (interaction.context as any)?.result?.suggestions || [],
      actions: (interaction.context as any)?.result?.actions || [],
      timestamp: interaction.createdAt,
      enginePowered: (interaction.context as any)?.engineIntegration || false,
    }));

    return NextResponse.json({
      success: true,
      data: {
        messages: messages.reverse(),
        conversationId,
      },
    });

  } catch (error) {
    logger.error('Get SAM conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve conversation' },
      { status: 500 }
    );
  }
}
