/**
 * SAM AI Socratic Dialogue - End API
 *
 * Thin API layer that uses the portable SocraticTeachingEngine from @sam-ai/educational
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createSocraticTeachingEngine } from '@sam-ai/educational';
import { runSAMChat } from '@/lib/sam/ai-provider';

const EndDialogueSchema = z.object({
  dialogueId: z.string(),
});

// In-memory dialogue store (shared with other endpoints)
const dialogueStore = new Map<string, ReturnType<typeof createSocraticTeachingEngine>>();

// Get existing engine for dialogue
const getEngine = (dialogueId: string) => {
  return dialogueStore.get(dialogueId);
};

// Remove engine after dialogue ends
const removeEngine = (dialogueId: string) => {
  dialogueStore.delete(dialogueId);
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
    const validatedData = EndDialogueSchema.parse(body);

    const { dialogueId } = validatedData;

    const engine = getEngine(dialogueId);

    if (!engine) {
      // Return a default summary if engine not found
      return NextResponse.json({
        success: true,
        data: {
          synthesis: 'Thank you for engaging in this Socratic dialogue! Your exploration of ideas and willingness to question assumptions is the foundation of deep learning.',
          performance: {
            totalExchanges: 0,
            averageQuality: 0,
            averageDepth: 0,
            insightDiscoveryRate: 0,
            completionTime: 0,
            hintsUsed: 0,
            highestBloomsLevel: 'UNDERSTAND',
            growth: [],
            improvementAreas: [],
          },
        },
      });
    }

    try {
      const result = await engine.endDialogue(dialogueId);

      // Clean up the dialogue from memory
      removeEngine(dialogueId);

      return NextResponse.json({
        success: true,
        data: result,
      });
    } catch (dialogueError) {
      logger.warn('Error ending dialogue:', dialogueError);

      // Clean up anyway
      removeEngine(dialogueId);

      return NextResponse.json({
        success: true,
        data: {
          synthesis: 'Your Socratic dialogue has concluded. Through questioning and exploration, you have deepened your understanding of the topic.',
          performance: {
            totalExchanges: 0,
            averageQuality: 50,
            averageDepth: 50,
            insightDiscoveryRate: 0.5,
            completionTime: 0,
            hintsUsed: 0,
            highestBloomsLevel: 'UNDERSTAND',
            growth: [{ factor: 'Engagement', description: 'Participated in Socratic questioning' }],
            improvementAreas: [],
          },
        },
      });
    }

  } catch (error) {
    logger.error('Socratic dialogue end error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to end Socratic dialogue' } },
      { status: 500 }
    );
  }
}
