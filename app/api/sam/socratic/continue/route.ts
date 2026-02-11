/**
 * SAM AI Socratic Dialogue - Continue API
 *
 * Thin API layer that uses the portable SocraticTeachingEngine from @sam-ai/educational
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createSocraticTeachingEngine } from '@sam-ai/educational';
import { runSAMChatWithPreference, handleAIAccessError, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const ContinueDialogueSchema = z.object({
  dialogueId: z.string(),
  response: z.string().min(1),
  skipQuestion: z.boolean().optional().default(false),
});

// In-memory dialogue store (in production, use database)
const dialogueStore = new Map<string, ReturnType<typeof createSocraticTeachingEngine>>();

// Create or get engine for dialogue
const getOrCreateEngine = (dialogueId: string, userId: string) => {
  if (!dialogueStore.has(dialogueId)) {
    const engine = createSocraticTeachingEngine({
      aiAdapter: {
        chat: async ({ messages }) => {
          const systemMessage = messages.find(m => m.role === 'system')?.content || '';
          const userMessage = messages.find(m => m.role === 'user')?.content || '';

          const response = await runSAMChatWithPreference({
            userId,
            capability: 'chat',
            maxTokens: 2000,
            temperature: 0.7,
            systemPrompt: systemMessage,
            messages: [{ role: 'user', content: userMessage }],
          });

          return { content: response };
        },
      },
      maxQuestions: 10,
      encouragingMode: true,
    });
    dialogueStore.set(dialogueId, engine);
  }
  return dialogueStore.get(dialogueId)!;
};

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const gateResult = await withSubscriptionGate(user.id, { category: 'chat' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await request.json();
    const validatedData = ContinueDialogueSchema.parse(body);

    const { dialogueId, response, skipQuestion } = validatedData;

    // Get or create the engine
    const engine = getOrCreateEngine(dialogueId, user.id);

    try {
      const result = await withRetryableTimeout(
        () => engine.continueDialogue({
          dialogueId,
          response,
          skipQuestion,
        }),
        TIMEOUT_DEFAULTS.AI_ANALYSIS,
        'socratic-continue'
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (dialogueError) {
      // If dialogue not found, return a helpful message
      logger.warn('Dialogue not found, may need to start new:', dialogueError);

      return NextResponse.json({
        success: false,
        error: {
          message: 'Dialogue not found or expired. Please start a new dialogue.',
          code: 'DIALOGUE_NOT_FOUND',
        },
      }, { status: 404 });
    }

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('Socratic dialogue continue error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to continue Socratic dialogue' } },
      { status: 500 }
    );
  }
}
