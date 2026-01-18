/**
 * SAM Knowledge Graph Engine - Learning Path Route
 * POST /api/sam/knowledge-graph-engine/learning-path
 *
 * Generate optimal learning paths to target concepts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { getEngine } from '../route';
import { logger } from '@/lib/logger';

const LearningPathSchema = z.object({
  targetConceptIds: z.array(z.string()).min(1).max(20),
  strategy: z.enum(['FASTEST', 'THOROUGH', 'BALANCED']).optional().default('BALANCED'),
  skipMastered: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = LearningPathSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { targetConceptIds, strategy, skipMastered } = parsed.data;

    const engine = getEngine();

    // Verify at least one concept exists
    const existingConcepts = targetConceptIds
      .map(id => engine.getConcept(id))
      .filter(Boolean);

    if (existingConcepts.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'No valid concepts found. Ensure the course has been analyzed first.' } },
        { status: 404 }
      );
    }

    const result = await engine.generateLearningPath({
      userId: session.user.id,
      targetConceptIds,
      strategy,
      skipMastered,
    });

    return NextResponse.json({
      success: true,
      data: {
        pathId: result.id,
        targetConcepts: result.targetConcepts.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          bloomsLevel: c.bloomsLevel,
        })),
        sequence: result.sequence.map(node => ({
          position: node.position,
          concept: {
            id: node.concept.id,
            name: node.concept.name,
            type: node.concept.type,
            bloomsLevel: node.concept.bloomsLevel,
          },
          estimatedTimeMinutes: node.estimatedTimeMinutes,
          reason: node.reason,
          activities: node.activities,
          completed: node.completed,
        })),
        totalEstimatedTime: result.totalEstimatedTime,
        progress: result.progress,
        strategy,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    logger.error('[KnowledgeGraphEngine LearningPath] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate learning path' } },
      { status: 500 }
    );
  }
}
