/**
 * SAM AI Socratic Dialogue - Start API
 *
 * Thin API layer that uses the portable SocraticTeachingEngine from @sam-ai/educational
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createSocraticTeachingEngine, type BloomsLevel } from '@sam-ai/educational';
import { runSAMChatWithPreference, handleAIAccessError, withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const StartDialogueSchema = z.object({
  userId: z.string(),
  topic: z.string().min(1),
  courseId: z.string().optional(),
  sectionId: z.string().optional(),
  learningObjective: z.string().optional(),
  targetBloomsLevel: z.string().optional().default('ANALYZE'),
  preferredStyle: z.enum(['gentle', 'challenging', 'balanced']).optional().default('balanced'),
  priorKnowledge: z.string().optional(),
});

// Create engine with AI adapter
const createEngineWithAI = (userId: string) => {
  return createSocraticTeachingEngine({
    aiAdapter: {
      chat: async ({ messages }) => {
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const userMessage = messages.find(m => m.role === 'user')?.content || '';

        const response = await runSAMChatWithPreference({
          userId,
          capability: 'chat',
          maxTokens: 2000,
          temperature: 0.8,
          systemPrompt: systemMessage,
          messages: [{ role: 'user', content: userMessage }],
        });

        return { content: response };
      },
    },
    maxQuestions: 10,
    encouragingMode: true,
  });
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
    const validatedData = StartDialogueSchema.parse(body);

    const {
      userId,
      topic,
      learningObjective,
      targetBloomsLevel,
      preferredStyle,
      priorKnowledge,
    } = validatedData;

    // Use the portable engine
    const engine = createEngineWithAI(user.id);

    const result = await withRetryableTimeout(
      () => engine.startDialogue({
        userId,
        topic,
        learningObjective,
        targetBloomsLevel: targetBloomsLevel as BloomsLevel,
        preferredStyle,
        priorKnowledge,
      }),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'socratic-start'
    );

    // Get the dialogue for returning dialogue ID
    const dialogue = await engine.getDialogue(result.question?.id?.split('_')[1] || '');

    return NextResponse.json({
      success: true,
      data: result,
      dialogueId: dialogue?.id || `dialogue_${Date.now()}`,
    });

  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('Socratic dialogue start error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to start Socratic dialogue' } },
      { status: 500 }
    );
  }
}
