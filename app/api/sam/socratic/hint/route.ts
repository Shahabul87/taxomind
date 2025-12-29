/**
 * SAM AI Socratic Dialogue - Hint API
 *
 * Thin API layer that uses the portable SocraticTeachingEngine from @sam-ai/educational
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createSocraticTeachingEngine } from '@sam-ai/educational';
import { runSAMChat } from '@/lib/sam/ai-provider';

const GetHintSchema = z.object({
  dialogueId: z.string(),
  hintIndex: z.number().optional().default(0),
});

// In-memory dialogue store (shared with continue endpoint)
const dialogueStore = new Map<string, ReturnType<typeof createSocraticTeachingEngine>>();

// Get existing engine for dialogue
const getEngine = (dialogueId: string) => {
  if (!dialogueStore.has(dialogueId)) {
    // Create a new engine if not found
    const engine = createSocraticTeachingEngine({
      aiAdapter: {
        chat: async ({ messages }) => {
          const systemMessage = messages.find(m => m.role === 'system')?.content || '';
          const userMessage = messages.find(m => m.role === 'user')?.content || '';

          const response = await runSAMChat({
            model: 'claude-sonnet-4-5-20250929',
            maxTokens: 1000,
            temperature: 0.5,
            systemPrompt: systemMessage,
            messages: [{ role: 'user', content: userMessage }],
          });

          return { content: response };
        },
      },
      encouragingMode: true,
    });
    dialogueStore.set(dialogueId, engine);
    return engine;
  }
  return dialogueStore.get(dialogueId)!;
};

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = GetHintSchema.parse(body);

    const { dialogueId, hintIndex } = validatedData;

    const engine = getEngine(dialogueId);

    try {
      const hint = await engine.getHint(dialogueId, hintIndex);

      return NextResponse.json({
        success: true,
        data: {
          hint,
          hintIndex,
        },
      });
    } catch (dialogueError) {
      // If dialogue not found, return a generic hint
      logger.warn('Dialogue not found for hint:', dialogueError);

      const genericHints = [
        'Think about the fundamental principles involved in this topic.',
        'Consider how this concept relates to what you already know.',
        'Try breaking down the problem into smaller, manageable parts.',
      ];

      return NextResponse.json({
        success: true,
        data: {
          hint: genericHints[hintIndex % genericHints.length],
          hintIndex,
          isGeneric: true,
        },
      });
    }

  } catch (error) {
    logger.error('Socratic dialogue hint error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to get hint' } },
      { status: 500 }
    );
  }
}
