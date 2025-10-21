import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { samMasterIntegration } from '@/sam/engines/core/sam-master-integration';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Enhanced SAM Chat API with Engine Integration
 * This shows how to integrate all 5 engines into SAM's chat functionality
 */
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

    // Get enhanced response from SAM with engine integration
    const enhancedResponse = includeEngineInsights
      ? await samMasterIntegration.processSAMQuery(
          user.id,
          courseId,
          message,
          interactionType
        )
      : null;

    // Generate SAM's conversational response
    const samResponse = await generateSAMResponse(
      message,
      user,
      courseId,
      enhancedResponse
    );

    // Store the interaction
    await storeInteraction(
      user.id,
      courseId,
      message,
      samResponse,
      interactionType,
      enhancedResponse
    );

    // Return the enhanced response
    return NextResponse.json({
      success: true,
      data: {
        message: samResponse.message,
        suggestions: samResponse.suggestions,
        actions: samResponse.actions,
        insights: samResponse.insights,
        engineData: enhancedResponse?.context?.engineData,
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
 * Generate SAM's conversational response with engine insights
 */
async function generateSAMResponse(
  message: string,
  user: any,
  courseId: string | null,
  engineResponse: any
): Promise<any> {
  const response: any = {
    message: '',
    suggestions: [],
    actions: [],
    insights: [],
  };

  // Base response generation (your existing SAM logic)
  // This is where you'd integrate with your existing SAM response generation
  
  // Enhance with engine insights
  if (engineResponse) {
    // Add engine-based message enhancement
    response.message = enhanceMessageWithEngineData(
      message,
      engineResponse,
      user.role
    );
    
    // Add engine suggestions
    response.suggestions = engineResponse.suggestions || [];
    
    // Add actionable items
    response.actions = engineResponse.actions || [];
    
    // Add insights
    response.insights = engineResponse.insights || [];
  } else {
    // Fallback to basic response
    response.message = "I'm here to help! What would you like to know?";
  }

  return response;
}

/**
 * Enhance message with engine data
 */
function enhanceMessageWithEngineData(
  originalMessage: string,
  engineResponse: any,
  userRole: string
): string {
  let enhancedMessage = engineResponse.message || '';
  
  // Add role-specific enhancements
  if (userRole === 'USER') {
    // Student-specific enhancements
    const progress = engineResponse.context?.engineData?.bloomsAnalysis?.studentProgress;
    if (progress && progress.weaknessAreas.length > 0) {
      enhancedMessage += ` I notice you could use some practice with ${progress.weaknessAreas[0]} skills.`;
    }
  } else if (userRole === 'ADMIN') {
    // Teacher-specific enhancements
    const courseGuide = engineResponse.context?.engineData?.courseGuide;
    if (courseGuide && courseGuide.criticalActions > 0) {
      enhancedMessage += ` You have ${courseGuide.criticalActions} critical actions that need attention.`;
    }
  }
  
  return enhancedMessage;
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
        interactionType: interactionType as any, // Map to your enum
        context: {
          message,
          engineIntegration: !!engineResponse,
          enginesUsed: engineResponse ? getUsedEngines(engineResponse) : [],
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
function getUsedEngines(engineResponse: any): string[] {
  const engines = [];
  const engineData = engineResponse.context?.engineData;
  
  if (engineData?.marketAnalysis) engines.push('market');
  if (engineData?.bloomsAnalysis) engines.push('blooms');
  if (engineData?.examInsights) engines.push('exam');
  if (engineData?.courseGuide) engines.push('guide');
  if (engineData?.learningProfile) engines.push('profile');
  
  return engines;
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