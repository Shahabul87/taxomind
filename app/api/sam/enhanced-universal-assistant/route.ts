import { NextResponse } from 'next/server';
import { z } from 'zod';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/api/with-api-auth';
import { db } from '@/lib/db';
import {
  getMemoryContext,
  formatMemoryForPrompt,
  processChatWithMemory,
} from '@/lib/sam/services/chat-memory-integration';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const CourseContextSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(500),
  chaptersCount: z.number().int().min(0),
  objectivesCount: z.number().int().min(0),
  isPublished: z.boolean(),
  healthScore: z.number().min(0).max(100),
  completionStatus: z.record(z.string(), z.boolean()),
});

const ConversationMessageSchema = z.object({
  type: z.enum(['user', 'sam']),
  content: z.string().max(5000),
});

const RequestBodySchema = z.object({
  message: z.string().min(1).max(5000),
  context: CourseContextSchema,
  conversationHistory: z.array(ConversationMessageSchema).max(50).optional(),
  action: z.enum(['structure', 'objectives', 'analytics', 'help', 'general']).optional(),
});

type ValidatedRequestBody = z.infer<typeof RequestBodySchema>;

// =============================================================================
// TYPES
// =============================================================================

interface SamResponse {
  response: string;
  suggestions?: string[];
  actionData?: Record<string, unknown>;
  success: boolean;
}

interface RetryableApiError {
  status?: number;
  message?: string;
}

// =============================================================================
// RETRY LOGIC
// =============================================================================

async function callWithRetry(
  userId: string,
  messageRequest: {
    max_tokens: number;
    temperature?: number;
    system?: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  },
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await runSAMChatWithPreference({
        userId,
        capability: 'chat',
        maxTokens: messageRequest.max_tokens,
        temperature: messageRequest.temperature,
        systemPrompt: messageRequest.system,
        messages: messageRequest.messages,
      });
    } catch (error: unknown) {
      const apiError = error as RetryableApiError;
      logger.error(`AI API attempt ${attempt} failed:`, error);

      if (apiError.status === 529 || apiError.status === 503 || apiError.status === 429) {
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      throw error;
    }
  }
  throw new Error('All retry attempts exhausted');
}

// =============================================================================
// ACTION-SPECIFIC PROMPT BUILDERS
// =============================================================================

type PromptBuilder = (context: ValidatedRequestBody['context']) => string;

const buildPrompts: Record<string, PromptBuilder> = {
  structure: (context) => `
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

  objectives: (context) => `
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

  analytics: (context) => `
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
  `,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const generateSuggestions = (
  action: string,
  context: ValidatedRequestBody['context']
): string[] => {
  const baseSuggestions: Record<string, string[]> = {
    structure: ['Add more chapters', 'Reorganize content flow', 'Review chapter balance'],
    objectives: ['Create SMART objectives', 'Add skill-based goals', "Review Bloom's levels"],
    analytics: ['Improve health score', 'Focus on completion', 'Review weak areas'],
    help: ['Show keyboard shortcuts', 'Explain quick actions', 'Course improvement tips'],
  };

  const contextualSuggestions: string[] = [];

  if (context.healthScore < 60) {
    contextualSuggestions.push('Fix critical issues');
  }
  if (context.chaptersCount < 3) {
    contextualSuggestions.push('Add more content');
  }
  if (!context.isPublished && context.healthScore > 80) {
    contextualSuggestions.push('Ready to publish');
  }

  return [...(baseSuggestions[action] ?? []), ...contextualSuggestions].slice(0, 3);
};

const detectAction = (message: string): string => {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('structure') ||
    lowerMessage.includes('chapter') ||
    lowerMessage.includes('organize')
  ) {
    return 'structure';
  }
  if (
    lowerMessage.includes('objective') ||
    lowerMessage.includes('goal') ||
    lowerMessage.includes('learn')
  ) {
    return 'objectives';
  }
  if (
    lowerMessage.includes('analytic') ||
    lowerMessage.includes('health') ||
    lowerMessage.includes('score')
  ) {
    return 'analytics';
  }
  if (
    lowerMessage.includes('help') ||
    lowerMessage.includes('how to') ||
    lowerMessage.includes('guide')
  ) {
    return 'help';
  }

  return 'general';
};

function mapActionToInteractionType(action: string): 'CHAT_MESSAGE' | 'LEARNING_ASSISTANCE' {
  if (action === 'structure' || action === 'objectives' || action === 'analytics') {
    return 'LEARNING_ASSISTANCE';
  }
  return 'CHAT_MESSAGE';
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

export const POST = withAuth(
  async (request, authContext) => {
    try {
      // Validate request body with Zod
      const rawBody: unknown = await request.json();
      const parseResult = RequestBodySchema.safeParse(rawBody);

      if (!parseResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request body',
            details: parseResult.error.flatten().fieldErrors,
          },
          { status: 400 }
        );
      }

      const body = parseResult.data;
      const userId = authContext.user.id;

      // Detect action from message if not provided
      const action = body.action ?? detectAction(body.message);

      // Retrieve memory context for personalization
      const memoryContext = await getMemoryContext(userId, body.message, {
        courseId: body.context.courseId,
        maxMemories: 3,
        maxConversations: 2,
      });
      const memoryPromptSection = formatMemoryForPrompt(memoryContext);

      // Build conversation context from recent history
      const conversationContext =
        body.conversationHistory
          ?.slice(-3)
          ?.map((msg) => `${msg.type}: ${msg.content}`)
          ?.join('\n') ?? '';

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
      ${memoryPromptSection}

      Provide helpful, specific advice for improving this course. Keep responses concise and actionable.`;
      } else {
        const promptBuilder = buildPrompts[action];
        const basePrompt = promptBuilder
          ? promptBuilder(body.context)
          : buildPrompts.help(body.context);
        systemPrompt = basePrompt + memoryPromptSection;
      }

      const responseText = await withRetryableTimeout(
        () => callWithRetry(userId, {
          max_tokens: 500,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: body.message,
            },
          ],
        }),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'enhancedUniversalAssistant-chat'
      );

      // Generate suggestions
      const suggestions = generateSuggestions(action, body.context);

      const response: SamResponse = {
        response: responseText,
        suggestions,
        success: true,
      };

      // Store interaction and memory in parallel (fire-and-forget)
      const sessionId = `universal-${userId}-${Date.now()}`;

      Promise.all([
        db.sAMInteraction.create({
          data: {
            userId,
            courseId: body.context.courseId,
            interactionType: mapActionToInteractionType(action),
            context: {
              message: body.message,
              action,
              courseTitle: body.context.title,
              result: {
                response: responseText,
                suggestions,
              },
            },
          },
        }),
        processChatWithMemory(userId, sessionId, body.message, responseText, 1, {
          courseId: body.context.courseId,
        }),
      ]).catch((err: unknown) => {
        logger.error('Failed to store SAM interaction/memory:', err);
      });

      return NextResponse.json(response);
    } catch (error: unknown) {
      if (error instanceof OperationTimeoutError) {
        logger.error('Enhanced universal assistant timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
        const samTimeoutResponse: SamResponse = {
          response: 'The request took too long to process. Please try again with a simpler question.',
          suggestions: ['Try again', 'Use simpler requests', 'Contact support'],
          success: false,
        };
        return NextResponse.json(samTimeoutResponse, { status: 200 });
      }
      const accessResponse = handleAIAccessError(error);
      if (accessResponse) return accessResponse;
      const apiError = error as RetryableApiError;
      logger.error('SAM Enhanced Universal Assistant Error:', error);

      let errorMessage = "I'm experiencing technical difficulties. Please try again in a moment.";
      let errorSuggestions = ['Try again', 'Refresh page', 'Contact support'];

      if (apiError.status === 529) {
        errorMessage =
          "I'm currently overloaded with requests. Please wait a moment and try again.";
        errorSuggestions = ['Wait 30 seconds', 'Try again', 'Use simpler requests'];
      } else if (apiError.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
        errorSuggestions = ['Wait 1 minute', 'Try again', 'Reduce request frequency'];
      } else if (apiError.status === 503) {
        errorMessage = 'Service is temporarily unavailable. Please try again in a few minutes.';
        errorSuggestions = ['Wait 2 minutes', 'Try again', 'Check status page'];
      }

      const samErrorResponse: SamResponse = {
        response: errorMessage,
        suggestions: errorSuggestions,
        success: false,
      };

      return NextResponse.json(samErrorResponse, { status: 200 });
    }
  },
  { rateLimit: { requests: 30, window: 60000 } }
);

// Handle unsupported methods
export const GET = withAuth(
  async () => {
    return NextResponse.json(
      { error: 'Method not supported. Use POST to interact with SAM.' },
      { status: 405 }
    );
  },
  { rateLimit: { requests: 30, window: 60000 } }
);
