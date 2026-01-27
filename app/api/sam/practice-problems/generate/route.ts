/**
 * SAM AI Practice Problems - Generate API
 *
 * Thin API layer that uses the portable PracticeProblemsEngine from @sam-ai/educational
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createPracticeProblemsEngine, type BloomsLevel } from '@sam-ai/educational';
import { runSAMChat } from '@/lib/sam/ai-provider';

const GenerateProblemsSchema = z.object({
  topic: z.string().min(1),
  bloomsLevel: z.string().optional().default('APPLY'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional().default('intermediate'),
  count: z.number().min(1).max(10).optional().default(5),
  problemTypes: z.array(z.string()).optional().default(['multiple_choice', 'short_answer']),
  learningObjectives: z.array(z.string()).optional().default([]),
  userId: z.string().optional(),
  courseId: z.string().optional(),
  sectionId: z.string().optional(),
  timeLimit: z.number().optional(),
});

// Create engine with AI adapter
const createEngineWithAI = () => {
  return createPracticeProblemsEngine({
    aiAdapter: {
      chat: async ({ messages }) => {
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const userMessage = messages.find(m => m.role === 'user')?.content || '';

        const response = await runSAMChat({
          maxTokens: 4000,
          temperature: 0.7,
          systemPrompt: systemMessage,
          messages: [{ role: 'user', content: userMessage }],
        });

        return { content: response };
      },
    },
  });
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
    const validatedData = GenerateProblemsSchema.parse(body);

    const {
      topic,
      bloomsLevel,
      difficulty,
      count,
      problemTypes,
      learningObjectives,
      timeLimit,
    } = validatedData;

    // Use the portable engine
    const engine = createEngineWithAI();

    const result = await engine.generateProblems({
      topic,
      bloomsLevel: bloomsLevel as BloomsLevel,
      difficulty,
      count,
      problemTypes: problemTypes as Array<'multiple_choice' | 'short_answer' | 'coding' | 'essay'>,
      learningObjectives,
      timeLimit,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    logger.error('Practice problems generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate practice problems' } },
      { status: 500 }
    );
  }
}
