import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/api/with-api-auth';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const runtime = 'nodejs';

interface SAMChatRequest {
  message: string;
  context?: any;
  contextualPrompt?: string;
  conversationHistory?: any[];
}

/**
 * SAM Contextual Chat API
 * Provides intelligent, context-aware responses based on current URL and data
 */
export const POST = withAuth(async (request, context) => {
  try {
    const body: SAMChatRequest = await request.json();
    
    if (!body.message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await generateContextualSAMResponse(body, context.user.id);

    return NextResponse.json({
      success: true,
      response: response.message,
      suggestions: response.suggestions,
      contextInsights: response.contextInsights,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    logger.error('[SAM-CHAT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate SAM response' },
      { status: 500 }
    );
  }
}, {
  rateLimit: { requests: 20, window: 60000 }, // 20 SAM queries per minute
  auditLog: true
});

/**
 * Generate intelligent, context-aware SAM response
 */
async function generateContextualSAMResponse(
  request: SAMChatRequest,
  userId: string
) {
  const { message, context, contextualPrompt, conversationHistory } = request;
  
  // Build comprehensive prompt with context awareness
  const samPrompt = buildEnhancedSAMPrompt(message, context, contextualPrompt, conversationHistory);
  
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      temperature: 0.7, // Balanced creativity and consistency
      messages: [{ role: "user", content: samPrompt }]
    });

    const contentResponse = response.content[0];
    if (contentResponse.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Try to parse structured response
    try {
      const result = JSON.parse(contentResponse.text);
      return {
        message: result.response || result.message,
        suggestions: result.suggestions || [],
        contextInsights: result.contextInsights || null
      };
    } catch (parseError) {
      // If not JSON, return the text with contextual enhancements
      return {
        message: contentResponse.text,
        suggestions: generateContextualSuggestions(context, message),
        contextInsights: null
      };
    }
  } catch (anthropicError) {
    logger.error('Anthropic API error:', anthropicError);
    
    // Intelligent fallback based on context
    return generateIntelligentFallback(message, context);
  }
}

/**
 * Build enhanced SAM prompt with full context awareness
 */
function buildEnhancedSAMPrompt(
  userMessage: string,
  context: any,
  contextualPrompt?: string,
  conversationHistory?: any[]
): string {
  const basePersonality = `You are SAM (Smart Adaptive Mentor), an advanced AI educational assistant with deep expertise in:

- Learning science and cognitive psychology
- Instructional design and curriculum development
- Student engagement and motivation
- Educational technology and best practices
- Course creation and content optimization
- Assessment design and learning analytics

Your communication style is:
- Encouraging and supportive while being expert-level
- Practical and actionable with specific examples
- Contextually aware and personalized
- Conversational yet professional
- Solution-focused and pedagogically sound`;

  let contextSection = '';
  if (context) {
    contextSection = `
CURRENT CONTEXT:
- Page Type: ${context.pageType || 'unknown'}
- Entity Type: ${context.entityType || 'none'}
- URL: ${context.url || 'unknown'}
- Entity ID: ${context.entityId || 'none'}
- Last Updated: ${context.lastUpdated || 'unknown'}`;

    if (context.entityData) {
      contextSection += `
- Entity Data Available: ${JSON.stringify(context.entityData, null, 2).slice(0, 500)}...`;
    }

    if (context.formData && Object.keys(context.formData).length > 0) {
      contextSection += `
- Current Form Data: ${JSON.stringify(context.formData, null, 2).slice(0, 300)}...`;
    }
  }

  let conversationSection = '';
  if (conversationHistory && conversationHistory.length > 0) {
    conversationSection = `
RECENT CONVERSATION:
${conversationHistory.map(msg => `${msg.type.toUpperCase()}: ${msg.content}`).join('\n')}`;
  }

  const enhancedPrompt = contextualPrompt || `User question: "${userMessage}"`;

  return `${basePersonality}

${contextSection}

${conversationSection}

CURRENT REQUEST:
${enhancedPrompt}

Please respond with a JSON object in this format:
{
  "response": "Your helpful, contextual response that directly addresses the user's question",
  "suggestions": [
    "Specific actionable suggestion 1",
    "Specific actionable suggestion 2", 
    "Specific actionable suggestion 3"
  ],
  "contextInsights": {
    "observation": "What you notice about their current context",
    "recommendation": "Specific recommendation based on their situation"
  }
}

Guidelines:
1. Be specific and actionable based on their current context
2. Reference the specific data/forms you can see when relevant
3. Provide practical next steps they can take immediately
4. Maintain encouraging, expert tone
5. Focus on educational effectiveness and student success
6. Use learning science principles in your recommendations
7. Keep responses concise but comprehensive (aim for 2-4 sentences)

Remember: You can see their current page, any forms they're working on, and the specific course/chapter/section data they're editing. Use this context to provide incredibly relevant and helpful guidance.`;
}

/**
 * Generate contextual suggestions based on current context
 */
function generateContextualSuggestions(context: any, userMessage: string): string[] {
  if (!context) {
    return [
      'Tell me more about your specific challenge',
      'What outcome are you trying to achieve?',
      'How can I help you with your current task?'
    ];
  }

  const { pageType, entityType } = context;
  
  switch (pageType) {
    case 'course-edit':
      return [
        'Help me improve course structure',
        'Suggest engagement strategies',
        'Review my learning objectives',
        'Optimize for student success'
      ];
      
    case 'chapter-edit':
      return [
        'Plan this chapter\'s content',
        'Create learning activities',
        'Design assessments',
        'Improve content flow'
      ];
      
    case 'section-edit':
      return [
        'Make this content more interactive',
        'Add practical examples',
        'Create knowledge checks',
        'Improve clarity'
      ];
      
    case 'revolutionary-architect':
      return [
        'Help me refine my course idea',
        'Analyze my target audience',
        'Optimize course structure',
        'Improve market positioning'
      ];
      
    case 'course-create':
      return [
        'Brainstorm course topics',
        'Define target audience',
        'Plan learning outcomes',
        'Structure course content'
      ];
      
    default:
      return [
        'Explain this concept clearly',
        'Provide specific examples',
        'Suggest best practices',
        'Help me improve this'
      ];
  }
}

/**
 * Generate intelligent fallback response when AI fails
 */
function generateIntelligentFallback(userMessage: string, context: any) {
  let fallbackMessage = "I understand your question! ";
  
  if (context) {
    const { pageType, entityType, entityData } = context;
    
    switch (pageType) {
      case 'course-edit':
        const courseName = entityData?.title || 'your course';
        fallbackMessage += `I can see you're working on "${courseName}". I'm here to help with course development, content planning, student engagement, or any pedagogical questions you have.`;
        break;
        
      case 'chapter-edit':
        const chapterName = entityData?.chapter?.title || 'this chapter';
        fallbackMessage += `I notice you're developing "${chapterName}". I can assist with chapter structure, learning objectives, content creation, or assessment design.`;
        break;
        
      case 'section-edit':
        fallbackMessage += `I can see you're working on a course section. I'm ready to help with content creation, interactive elements, assessments, or improving learning effectiveness.`;
        break;
        
      case 'revolutionary-architect':
        fallbackMessage += `Welcome to the Revolutionary Course Architect! I'm here to help you design an amazing course using learning science and market intelligence. What aspect would you like to explore?`;
        break;
        
      default:
        fallbackMessage += `I can help with educational guidance, course development, learning optimization, and teaching strategies. What specific challenge are you facing?`;
    }
  } else {
    fallbackMessage += "I'm your AI learning assistant and I'm ready to help! Could you tell me more about what you're working on so I can provide more specific guidance?";
  }

  return {
    message: fallbackMessage,
    suggestions: generateContextualSuggestions(context, userMessage),
    contextInsights: null
  };
}