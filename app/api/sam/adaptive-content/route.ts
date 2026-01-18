/**
 * SAM Adaptive Content Engine API
 *
 * Main route for the AdaptiveContentEngine from @sam-ai/educational.
 * Provides learning style detection, content adaptation, and personalization.
 *
 * Routes:
 * - GET /api/sam/adaptive-content - Get engine status
 * - POST /api/sam/adaptive-content - General actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createAdaptiveContentEngine } from '@sam-ai/educational';
import type {
  AdaptiveContentEngine,
  AdaptiveLearnerProfile,
  ContentToAdapt,
  AdaptationOptions,
} from '@sam-ai/educational';
import { getAdaptiveContentAdapter } from '@/lib/adapters';
import { getSAMConfig } from '@/lib/adapters';
import { logger } from '@/lib/logger';

// ============================================================================
// ENGINE SINGLETON
// ============================================================================

let engineInstance: AdaptiveContentEngine | null = null;

/**
 * Get or create the AdaptiveContentEngine instance
 */
function getAdaptiveContentEngine(): AdaptiveContentEngine {
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

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ContentToAdaptSchema = z.object({
  id: z.string(),
  type: z.enum(['lesson', 'section', 'concept', 'explanation', 'example']),
  content: z.string(),
  title: z.string().optional(),
  topic: z.string(),
  bloomsLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']).optional(),
  currentFormat: z.enum([
    'text', 'video', 'audio', 'diagram', 'infographic',
    'interactive', 'simulation', 'quiz', 'code_example', 'case_study'
  ]),
  concepts: z.array(z.string()),
  prerequisites: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
});

const AdaptationOptionsSchema = z.object({
  targetStyle: z.enum(['visual', 'auditory', 'reading', 'kinesthetic', 'multimodal']).optional(),
  targetComplexity: z.enum(['simplified', 'standard', 'detailed', 'expert']).optional(),
  targetFormat: z.enum([
    'text', 'video', 'audio', 'diagram', 'infographic',
    'interactive', 'simulation', 'quiz', 'code_example', 'case_study'
  ]).optional(),
  includeSupplementary: z.boolean().optional(),
  includeKnowledgeChecks: z.boolean().optional(),
  personalizeExamples: z.boolean().optional(),
  addScaffolding: z.boolean().optional(),
  maxLength: z.number().optional(),
});

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('get-profile'),
    userId: z.string().optional(),
    courseId: z.string().optional(),
  }),
  z.object({
    action: z.literal('detect-style'),
    userId: z.string().optional(),
    courseId: z.string().optional(),
  }),
  z.object({
    action: z.literal('adapt-content'),
    content: ContentToAdaptSchema,
    profile: z.record(z.unknown()).optional(),
    options: AdaptationOptionsSchema.optional(),
    userId: z.string().optional(),
    courseId: z.string().optional(),
  }),
  z.object({
    action: z.literal('get-recommendations'),
    topic: z.string(),
    count: z.number().optional(),
    userId: z.string().optional(),
  }),
  z.object({
    action: z.literal('get-tips'),
    style: z.enum(['visual', 'auditory', 'reading', 'kinesthetic', 'multimodal']).optional(),
  }),
]);

// ============================================================================
// HANDLERS
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const engine = getAdaptiveContentEngine();
    const profile = await engine.getLearnerProfile(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        engineStatus: 'active',
        profile,
        features: {
          styleDetection: true,
          contentAdaptation: true,
          interactionTracking: true,
          recommendations: true,
        },
      },
    });
  } catch (error) {
    logger.error('[AdaptiveContent API] GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get engine status' } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid request body',
            details: parsed.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const engine = getAdaptiveContentEngine();
    const userId = parsed.data.action === 'get-tips' ? session.user.id : (parsed.data.userId || session.user.id);

    switch (parsed.data.action) {
      case 'get-profile': {
        const profile = await engine.getLearnerProfile(userId);
        return NextResponse.json({ success: true, data: profile });
      }

      case 'detect-style': {
        const styleResult = await engine.detectLearningStyle(userId);
        const profile = await engine.getLearnerProfile(userId);
        return NextResponse.json({
          success: true,
          data: styleResult,
          profile,
        });
      }

      case 'adapt-content': {
        let profile: AdaptiveLearnerProfile | null = null;

        // Get or create profile
        if (parsed.data.profile) {
          profile = parsed.data.profile as AdaptiveLearnerProfile;
        } else {
          profile = await engine.getLearnerProfile(userId);
        }

        if (!profile) {
          return NextResponse.json(
            { success: false, error: { message: 'No learner profile found' } },
            { status: 400 }
          );
        }

        const adaptedContent = await engine.adaptContent(
          parsed.data.content as ContentToAdapt,
          profile,
          parsed.data.options as AdaptationOptions
        );

        return NextResponse.json({ success: true, data: adaptedContent });
      }

      case 'get-recommendations': {
        const profile = await engine.getLearnerProfile(userId);
        if (!profile) {
          return NextResponse.json({ success: true, data: [] });
        }

        const recommendations = await engine.getContentRecommendations(
          profile,
          parsed.data.topic,
          parsed.data.count
        );

        return NextResponse.json({ success: true, data: recommendations });
      }

      case 'get-tips': {
        const profile = await engine.getLearnerProfile(userId);
        const style = parsed.data.style || profile?.primaryStyle || 'multimodal';
        const tips = engine.getStyleTips(style);
        return NextResponse.json({ success: true, data: tips });
      }

      default:
        return NextResponse.json(
          { success: false, error: { message: 'Unknown action' } },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('[AdaptiveContent API] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
