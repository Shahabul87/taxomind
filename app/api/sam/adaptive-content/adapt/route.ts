/**
 * SAM Adaptive Content - Adapt Route
 * POST /api/sam/adaptive-content/adapt
 *
 * Adapt content for a user's learning style.
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
import { getSAMAdapter } from '@/lib/sam/ai-provider';
import { logger } from '@/lib/logger';

/**
 * Create a user-scoped AdaptiveContentEngine instance.
 */
async function createEngine(userId: string): Promise<AdaptiveContentEngine> {
  const aiAdapter = await getSAMAdapter({ userId, capability: 'analysis' });

  return createAdaptiveContentEngine({
    database: getAdaptiveContentAdapter(),
    aiAdapter,
    enableCaching: true,
    minInteractionsForAdaptation: 5,
  });
}

const ContentSchema = z.object({
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

const OptionsSchema = z.object({
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

const AdaptRequestSchema = z.object({
  content: ContentSchema,
  profile: z.record(z.unknown()).optional(),
  options: OptionsSchema.optional(),
  userId: z.string().optional(),
  courseId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = AdaptRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const userId = parsed.data.userId || session.user.id;
    const engine = await createEngine(userId);

    // Get or use provided profile
    let profile: AdaptiveLearnerProfile;
    if (parsed.data.profile) {
      profile = parsed.data.profile as AdaptiveLearnerProfile;
    } else {
      const fetchedProfile = await engine.getLearnerProfile(userId);
      if (!fetchedProfile) {
        // Create default profile if none exists
        await engine.detectLearningStyle(userId);
        const newProfile = await engine.getLearnerProfile(userId);
        if (!newProfile) {
          return NextResponse.json(
            { success: false, error: { message: 'Failed to create learner profile' } },
            { status: 500 }
          );
        }
        profile = newProfile;
      } else {
        profile = fetchedProfile;
      }
    }

    // Adapt the content
    const adaptedContent = await engine.adaptContent(
      parsed.data.content as ContentToAdapt,
      profile,
      parsed.data.options as AdaptationOptions
    );

    return NextResponse.json({
      success: true,
      data: adaptedContent,
    });
  } catch (error) {
    logger.error('[AdaptiveContent Adapt] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to adapt content' } },
      { status: 500 }
    );
  }
}
