import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from '@/lib/logger';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface RequestBody {
  message: string;
  context: {
    courseId: string;
    title: string;
    chaptersCount: number;
    objectivesCount: number;
    isPublished: boolean;
    healthScore: number;
    completionStatus: Record<string, boolean>;
  };
  conversationHistory?: Array<{
    type: 'user' | 'sam';
    content: string;
  }>;
  action?: 'structure' | 'objectives' | 'analytics' | 'help' | 'general';
}

interface SamResponse {
  response: string;
  suggestions?: string[];
  actionData?: any;
  success: boolean;
}

// Retry logic for Anthropic API calls
async function callAnthropicWithRetry(
  messageRequest: any, 
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await anthropic.messages.create(messageRequest);
    } catch (error: any) {
      logger.error(`Anthropic API attempt ${attempt} failed:`, error);
      
      // Check if it's a rate limit or overload error
      if (error.status === 529 || error.status === 503 || error.status === 429) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff

          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // If it's not a retryable error or we've exhausted retries, throw
      throw error;
    }
  }
}

// Action-specific prompt builders
const buildPrompts = {
  structure: (context: RequestBody['context']) => `
    Analyze the course structure for "${context.title}":
    - Current chapters: ${context.chaptersCount}
    - Published: ${context.isPublished ? 'Yes' : 'No'}
    - Health score: ${context.healthScore}%
    
    Provide specific recommendations for improving the course structure. Focus on:
    1. Optimal number of chapters for the content
    2. Chapter organization and flow
    3. Missing content areas
    4. Publishing readiness
    
    Keep your response concise and actionable.
  `,
  
  objectives: (context: RequestBody['context']) => `
    Review the learning objectives for "${context.title}":
    - Current objectives: ${context.objectivesCount}
    - Course health: ${context.healthScore}%
    
    Provide recommendations for:
    1. Improving existing objectives (if any)
    2. Adding missing key objectives
    3. Making objectives more measurable
    4. Aligning with Bloom's taxonomy
    
    Suggest 3-5 specific, actionable learning objectives.
  `,
  
  analytics: (context: RequestBody['context']) => `
    Analyze course performance for "${context.title}":
    - Health score: ${context.healthScore}%
    - Chapters: ${context.chaptersCount}
    - Objectives: ${context.objectivesCount}
    - Status: ${context.isPublished ? 'Published' : 'Draft'}
    
    Provide insights on:
    1. What's driving the current health score
    2. Key areas for improvement
    3. Publishing readiness assessment
    4. Next priority actions
    
    Be specific about what to focus on next.
  `,
  
  help: () => `
    Help the user understand how to use SAM effectively:
    
    1. Quick Actions: Use the contextual buttons for common tasks
    2. Keyboard Shortcuts: Alt+S (structure), Alt+G (goals), Alt+A (analytics)
    3. Natural Language: Ask questions in plain English
    4. Specific Requests: Be specific about what you want help with
    
    Common helpful commands:
    - "Analyze my course structure"
    - "Suggest better learning objectives"
    - "What should I focus on next?"
    - "Help me improve my health score"
    
    What would you like help with specifically?
  `
};

// Generate contextual suggestions based on action and context
const generateSuggestions = (action: string, context: RequestBody['context']): string[] => {
  const baseSuggestions = {
    structure: [
      "Add more chapters",
      "Reorganize content flow", 
      "Review chapter balance"
    ],
    objectives: [
      "Create SMART objectives",
      "Add skill-based goals",
      "Review Bloom's levels"
    ],
    analytics: [
      "Improve health score",
      "Focus on completion", 
      "Review weak areas"
    ],
    help: [
      "Show keyboard shortcuts",
      "Explain quick actions",
      "Course improvement tips"
    ]
  };

  // Add contextual suggestions based on course state
  const contextualSuggestions: string[] = [];
  
  if (context.healthScore < 60) {
    contextualSuggestions.push("Fix critical issues");
  }
  if (context.chaptersCount < 3) {
    contextualSuggestions.push("Add more content");
  }
  if (!context.isPublished && context.healthScore > 80) {
    contextualSuggestions.push("Ready to publish");
  }

  return [
    ...(baseSuggestions[action as keyof typeof baseSuggestions] || []),
    ...contextualSuggestions
  ].slice(0, 3);
};

// Determine action from message content
const detectAction = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('structure') || lowerMessage.includes('chapter') || lowerMessage.includes('organize')) {
    return 'structure';
  }
  if (lowerMessage.includes('objective') || lowerMessage.includes('goal') || lowerMessage.includes('learn')) {
    return 'objectives';  
  }
  if (lowerMessage.includes('analytic') || lowerMessage.includes('health') || lowerMessage.includes('score')) {
    return 'analytics';
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('how to') || lowerMessage.includes('guide')) {
    return 'help';
  }
  
  return 'general';
};

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    
    // Validate required fields
    if (!body.message || !body.context) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Detect action from message if not provided
    const action = body.action || detectAction(body.message);
    
    // Build conversation context
    const conversationContext = body.conversationHistory
      ?.slice(-3) // Last 3 messages for context
      ?.map(msg => `${msg.type}: ${msg.content}`)
      ?.join('\n') || '';

    // Build system prompt based on action
    let systemPrompt: string;
    
    if (action === 'general') {
      systemPrompt = `You are SAM, an AI course assistant. Help the teacher improve their course "${body.context.title}".
      
      Current context:
      - Health score: ${body.context.healthScore}%
      - Chapters: ${body.context.chaptersCount}
      - Learning objectives: ${body.context.objectivesCount}
      - Published: ${body.context.isPublished ? 'Yes' : 'No'}
      
      Recent conversation:
      ${conversationContext}
      
      User message: ${body.message}
      
      Provide helpful, specific advice for improving this course. Keep responses concise and actionable.`;
    } else {
      systemPrompt = buildPrompts[action as keyof typeof buildPrompts](body.context);
    }

    // Call Anthropic API with retry logic
    const completion = await callAnthropicWithRetry({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: body.message
        }
      ]
    });

    const responseContent = completion.content[0];
    let responseText = '';
    
    if (responseContent.type === 'text') {
      responseText = responseContent.text;
    }

    // Generate suggestions
    const suggestions = generateSuggestions(action, body.context);

    const response: SamResponse = {
      response: responseText,
      suggestions,
      success: true
    };

    return NextResponse.json(response);

  } catch (error: any) {
    logger.error('SAM Enhanced Universal Assistant Error:', error);
    
    // Handle specific error types
    let errorMessage = "I'm experiencing technical difficulties. Please try again in a moment.";
    let errorSuggestions = ["Try again", "Refresh page", "Contact support"];
    
    if (error.status === 529) {
      errorMessage = "I'm currently overloaded with requests. Please wait a moment and try again.";
      errorSuggestions = ["Wait 30 seconds", "Try again", "Use simpler requests"];
    } else if (error.status === 429) {
      errorMessage = "Too many requests. Please wait a moment before trying again.";
      errorSuggestions = ["Wait 1 minute", "Try again", "Reduce request frequency"];
    } else if (error.status === 503) {
      errorMessage = "Service is temporarily unavailable. Please try again in a few minutes.";
      errorSuggestions = ["Wait 2 minutes", "Try again", "Check status page"];
    }
    
    const errorResponse: SamResponse = {
      response: errorMessage,
      suggestions: errorSuggestions,
      success: false
    };
    
    return NextResponse.json(errorResponse, { status: 200 }); // Return 200 to avoid frontend errors
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not supported. Use POST to interact with SAM.' },
    { status: 405 }
  );
}