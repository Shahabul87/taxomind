/**
 * SAM AI Mentor - Remediation API
 *
 * Generates and manages remediation content for identified weaknesses.
 * Note: Uses SAMInteraction for storage until dedicated models are added.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { runSAMChat } from '@/lib/sam/ai-provider';

// Validation schemas
const GenerateRemediationSchema = z.object({
  topic: z.string().min(1).max(200),
  weaknessType: z.enum(['misconception', 'knowledge_gap', 'skill_gap', 'practice_needed']),
  currentMastery: z.number().min(0).max(100).optional().default(30),
  preferredStyle: z.enum(['visual', 'reading', 'practice', 'mixed']).optional().default('mixed'),
});

const UpdateRemediationSchema = z.object({
  remediationId: z.string(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
  effectiveness: z.number().min(1).max(5).optional(), // 1-5 rating
  feedback: z.string().max(500).optional(),
});

// Context type for remediation
interface RemediationContext {
  type: 'remediation';
  topic: string;
  weaknessType: 'misconception' | 'knowledge_gap' | 'skill_gap' | 'practice_needed';
  currentMastery: number;
  preferredStyle: 'visual' | 'reading' | 'practice' | 'mixed';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  content: {
    explanation: string;
    keyPoints: string[];
    examples: string[];
    practiceQuestions?: Array<{
      question: string;
      options?: string[];
      answer: string;
    }>;
  };
  effectiveness?: number;
  feedback?: string;
  completedAt?: string;
}

/**
 * POST - Generate remediation content
 */
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = GenerateRemediationSchema.parse(body);

    const { topic, weaknessType, currentMastery, preferredStyle } = validatedData;

    // Generate remediation content using AI
    const prompt = `Generate targeted remediation content for a student struggling with the topic: "${topic}"

Weakness type: ${weaknessType}
Current mastery level: ${currentMastery}%
Preferred learning style: ${preferredStyle}

Create content that:
1. Addresses the specific ${weaknessType} issue
2. Starts from fundamentals if mastery is low
3. Uses ${preferredStyle} approach when possible
4. Includes practical examples
5. Provides practice opportunities

Return valid JSON only:
{
  "explanation": "Clear, concise explanation addressing the weakness",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "examples": ["Example 1 with detailed walkthrough", "Example 2"],
  "practiceQuestions": [
    {
      "question": "Practice question text",
      "options": ["A", "B", "C", "D"],
      "answer": "B"
    }
  ]
}`;

    const response = await runSAMChat({
      maxTokens: 4000,
      temperature: 0.7,
      systemPrompt: 'You are an expert educational content creator specializing in remediation and personalized learning. Generate content in valid JSON format only.',
      messages: [{ role: 'user', content: prompt }],
    });

    // Parse the generated content
    let contentData: RemediationContext['content'];

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        contentData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch {
      logger.warn('[REMEDIATION] Failed to parse AI-generated content');
      // Provide fallback content
      contentData = {
        explanation: `Review the fundamentals of ${topic} to build a stronger foundation.`,
        keyPoints: [
          `Understanding the core concepts of ${topic}`,
          'Practicing with examples',
          'Building up from basics',
        ],
        examples: [
          `Example: Apply ${topic} concepts in a simple scenario`,
        ],
      };
    }

    // Create remediation context
    const remediationContext: RemediationContext = {
      type: 'remediation',
      topic,
      weaknessType,
      currentMastery,
      preferredStyle,
      status: 'PENDING',
      content: contentData,
    };

    const remediation = await db.sAMInteraction.create({
      data: {
        userId: user.id,
        interactionType: 'LEARNING_ASSISTANCE',
        context: remediationContext as unknown as Record<string, unknown>,
        actionTaken: 'remediation_generated',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: remediation.id,
        topic,
        weaknessType,
        currentMastery,
        status: 'PENDING',
        content: contentData,
        createdAt: remediation.createdAt.toISOString(),
      },
    });

  } catch (error) {
    logger.error('[REMEDIATION] Generate error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to generate remediation' } },
      { status: 500 }
    );
  }
}

/**
 * GET - Get remediation history
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const topic = searchParams.get('topic');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get remediations from SAMInteraction
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        interactionType: 'LEARNING_ASSISTANCE',
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Filter to remediations
    let remediations = interactions
      .filter(i => {
        const ctx = i.context as Record<string, unknown> | null;
        return ctx?.type === 'remediation';
      })
      .map(i => {
        const ctx = i.context as unknown as RemediationContext;
        return {
          id: i.id,
          topic: ctx.topic,
          weaknessType: ctx.weaknessType,
          currentMastery: ctx.currentMastery,
          status: ctx.status,
          effectiveness: ctx.effectiveness,
          completedAt: ctx.completedAt,
          createdAt: i.createdAt.toISOString(),
        };
      });

    // Apply filters
    if (status) {
      remediations = remediations.filter(r => r.status === status);
    }
    if (topic) {
      remediations = remediations.filter(r => r.topic.toLowerCase().includes(topic.toLowerCase()));
    }

    // Calculate stats
    const completed = remediations.filter(r => r.status === 'COMPLETED').length;
    const avgEffectiveness = remediations
      .filter(r => r.effectiveness !== undefined)
      .reduce((sum, r) => sum + (r.effectiveness || 0), 0) /
      (remediations.filter(r => r.effectiveness !== undefined).length || 1);

    return NextResponse.json({
      success: true,
      data: {
        remediations: remediations.slice(0, limit),
        stats: {
          total: remediations.length,
          completed,
          pending: remediations.filter(r => r.status === 'PENDING').length,
          avgEffectiveness: Math.round(avgEffectiveness * 10) / 10,
        },
      },
    });

  } catch (error) {
    logger.error('[REMEDIATION] Get error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get remediations' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update remediation status and effectiveness
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateRemediationSchema.parse(body);

    const existing = await db.sAMInteraction.findFirst({
      where: { id: validatedData.remediationId, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: { code: 'REMEDIATION_NOT_FOUND', message: 'Remediation not found' } },
        { status: 404 }
      );
    }

    const existingContext = existing.context as unknown as RemediationContext | null;
    if (!existingContext || existingContext.type !== 'remediation') {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_REMEDIATION', message: 'Invalid remediation' } },
        { status: 400 }
      );
    }

    // Update context
    const updatedContext: RemediationContext = {
      ...existingContext,
      status: validatedData.status,
      effectiveness: validatedData.effectiveness,
      feedback: validatedData.feedback,
      completedAt: validatedData.status === 'COMPLETED' ? new Date().toISOString() : undefined,
    };

    await db.sAMInteraction.update({
      where: { id: validatedData.remediationId },
      data: {
        context: updatedContext as unknown as Record<string, unknown>,
        actionTaken: `remediation_${validatedData.status.toLowerCase()}`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: validatedData.remediationId,
        status: validatedData.status,
        effectiveness: validatedData.effectiveness,
        message: validatedData.status === 'COMPLETED'
          ? 'Great job completing this remediation!'
          : 'Remediation status updated',
      },
    });

  } catch (error) {
    logger.error('[REMEDIATION] Update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update remediation' } },
      { status: 500 }
    );
  }
}
