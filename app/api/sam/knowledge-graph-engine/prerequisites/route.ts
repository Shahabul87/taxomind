/**
 * SAM Knowledge Graph Engine - Prerequisites Route
 * POST /api/sam/knowledge-graph-engine/prerequisites
 *
 * Analyze prerequisites for a concept.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createEngineForUser } from '../route';
import { logger } from '@/lib/logger';

const PrerequisitesSchema = z.object({
  conceptId: z.string(),
  includeMastery: z.boolean().optional().default(true),
  maxDepth: z.number().min(1).max(20).optional().default(10),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = PrerequisitesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { conceptId, includeMastery, maxDepth } = parsed.data;

    const engine = await createEngineForUser(session.user.id);

    // Check if concept exists
    const concept = engine.getConcept(conceptId);
    if (!concept) {
      return NextResponse.json(
        { success: false, error: { message: 'Concept not found. Ensure the course has been analyzed first.' } },
        { status: 404 }
      );
    }

    const result = await engine.analyzePrerequisites({
      conceptId,
      userId: session.user.id,
      includeMastery,
      maxDepth,
    });

    return NextResponse.json({
      success: true,
      data: {
        concept: {
          id: result.concept.id,
          name: result.concept.name,
          type: result.concept.type,
          bloomsLevel: result.concept.bloomsLevel,
        },
        directPrerequisites: result.directPrerequisites.map(p => ({
          id: p.concept.id,
          name: p.concept.name,
          type: p.concept.type,
          depth: p.depth,
          relationStrength: p.relationStrength,
          isBottleneck: p.isBottleneck,
        })),
        prerequisiteChain: result.prerequisiteChain.map(p => ({
          id: p.concept.id,
          name: p.concept.name,
          type: p.concept.type,
          depth: p.depth,
          isBottleneck: p.isBottleneck,
        })),
        estimatedLearningTime: result.estimatedLearningTime,
        dependentConcepts: result.dependentConcepts.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
        })),
        gapAnalysis: result.gapAnalysis ? {
          gaps: result.gapAnalysis.gaps.map(g => ({
            conceptId: g.concept.id,
            conceptName: g.concept.name,
            currentMastery: g.currentMastery,
            requiredMastery: g.requiredMastery,
            priority: g.priority,
            suggestions: g.suggestions,
          })),
          recommendedSequence: result.gapAnalysis.recommendedSequence,
          readyToLearn: result.gapAnalysis.readyToLearn,
          readinessScore: result.gapAnalysis.readinessScore,
        } : null,
      },
    });
  } catch (error) {
    logger.error('[KnowledgeGraphEngine Prerequisites] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to analyze prerequisites' } },
      { status: 500 }
    );
  }
}
