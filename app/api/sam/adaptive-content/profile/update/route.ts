/**
 * SAM Adaptive Content - Profile Update Route
 * POST /api/sam/adaptive-content/profile/update
 *
 * Update learner profile with new preferences.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createAdaptiveContentEngine } from '@sam-ai/educational';
import type { AdaptiveContentEngine, AdaptiveLearnerProfile } from '@sam-ai/educational';
import { getAdaptiveContentAdapter, getSAMConfig } from '@/lib/adapters';
import { logger } from '@/lib/logger';

// Engine singleton
let engineInstance: AdaptiveContentEngine | null = null;

function getEngine(): AdaptiveContentEngine {
  if (!engineInstance) {
    const samConfig = getSAMConfig();
    engineInstance = createAdaptiveContentEngine({
      database: getAdaptiveContentAdapter(),
      aiAdapter: samConfig.ai,
      enableCaching: true,
      minInteractionsForAdaptation: 5,
    });
  }
  return engineInstance;
}

const ProfileUpdateSchema = z.object({
  userId: z.string().optional(),
  updates: z.object({
    primaryStyle: z.enum(['visual', 'auditory', 'reading', 'kinesthetic', 'multimodal']).optional(),
    secondaryStyle: z.enum(['visual', 'auditory', 'reading', 'kinesthetic', 'multimodal']).optional(),
    preferredComplexity: z.enum(['simplified', 'standard', 'detailed', 'expert']).optional(),
    readingPace: z.enum(['slow', 'moderate', 'fast']).optional(),
    preferredSessionDuration: z.number().min(5).max(120).optional(),
    bestLearningTime: z.number().min(0).max(23).optional(),
    preferredFormats: z.array(z.enum([
      'text', 'video', 'audio', 'diagram', 'infographic',
      'interactive', 'simulation', 'quiz', 'code_example', 'case_study'
    ])).optional(),
    knownConcepts: z.array(z.string()).optional(),
    conceptsInProgress: z.array(z.string()).optional(),
    strugglingAreas: z.array(z.string()).optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const userId = parsed.data.userId || session.user.id;
    const engine = getEngine();
    const adapter = getAdaptiveContentAdapter();

    // Get current profile
    let profile = await engine.getLearnerProfile(userId);

    if (!profile) {
      // Create a default profile if none exists
      await engine.detectLearningStyle(userId);
      profile = await engine.getLearnerProfile(userId);

      if (!profile) {
        return NextResponse.json(
          { success: false, error: { message: 'Failed to create profile' } },
          { status: 500 }
        );
      }
    }

    // Merge updates with existing profile
    const updatedProfile: AdaptiveLearnerProfile = {
      ...profile,
      ...parsed.data.updates,
      styleScores: parsed.data.updates.primaryStyle
        ? calculateStyleScores(parsed.data.updates.primaryStyle, parsed.data.updates.secondaryStyle)
        : profile.styleScores,
      lastUpdated: new Date(),
    };

    // Save the updated profile
    await adapter.saveLearnerProfile(updatedProfile);

    return NextResponse.json({
      success: true,
      data: updatedProfile,
    });
  } catch (error) {
    logger.error('[AdaptiveContent ProfileUpdate] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update profile' } },
      { status: 500 }
    );
  }
}

/**
 * Calculate style scores based on primary and secondary styles
 */
function calculateStyleScores(
  primaryStyle: string,
  secondaryStyle?: string
): { visual: number; auditory: number; reading: number; kinesthetic: number } {
  const scores = { visual: 15, auditory: 15, reading: 15, kinesthetic: 15 };

  // Primary style gets 40%
  if (primaryStyle in scores) {
    scores[primaryStyle as keyof typeof scores] = 40;
  }

  // Secondary style gets 25%
  if (secondaryStyle && secondaryStyle in scores) {
    scores[secondaryStyle as keyof typeof scores] = 25;
  }

  // Normalize remaining to 100
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const scale = 100 / total;

  return {
    visual: Math.round(scores.visual * scale),
    auditory: Math.round(scores.auditory * scale),
    reading: Math.round(scores.reading * scale),
    kinesthetic: Math.round(scores.kinesthetic * scale),
  };
}
