/**
 * SAM Knowledge Graph Engine - Mastery Route
 * GET/POST /api/sam/knowledge-graph-engine/mastery
 *
 * Track and update concept mastery for users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { createEngineForUser } from '../route';
import { getKnowledgeGraphEngineAdapter } from '@/lib/adapters';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { handleAIAccessError } from '@/lib/sam/ai-provider';

const GetMasterySchema = z.object({
  conceptId: z.string().optional(),
  conceptIds: z.array(z.string()).optional(),
  courseId: z.string().optional(),
});

const UpdateMasterySchema = z.object({
  conceptId: z.string(),
  score: z.number().min(0).max(100),
  evidenceType: z.enum(['QUIZ', 'ASSIGNMENT', 'PRACTICE', 'INTERACTION']),
});

/**
 * GET - Get user's concept mastery
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'readonly');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetMasterySchema.parse({
      conceptId: searchParams.get('conceptId') ?? undefined,
      conceptIds: searchParams.get('conceptIds')?.split(',').filter(Boolean) ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
    });

    const adapter = getKnowledgeGraphEngineAdapter();

    // Get single concept mastery
    if (query.conceptId) {
      const mastery = await adapter.getMastery(session.user.id, query.conceptId);
      return NextResponse.json({
        success: true,
        data: mastery ?? {
          userId: session.user.id,
          conceptId: query.conceptId,
          masteryLevel: 'NOT_STARTED',
          score: 0,
          practiceCount: 0,
          evidence: [],
        },
      });
    }

    // Get multiple concept masteries
    if (query.conceptIds) {
      const masteries = await adapter.getUserMasteries(session.user.id, query.conceptIds);

      // Fill in missing concepts with default mastery
      const masteryMap = new Map(masteries.map(m => [m.conceptId, m]));
      const result = query.conceptIds.map(conceptId =>
        masteryMap.get(conceptId) ?? {
          userId: session.user.id,
          conceptId,
          masteryLevel: 'NOT_STARTED',
          score: 0,
          practiceCount: 0,
          evidence: [],
        }
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Get all masteries for a course
    if (query.courseId) {
      const concepts = await adapter.getConceptsByCourse(query.courseId);
      const conceptIds = concepts.map(c => c.id);
      const masteries = await adapter.getUserMasteries(session.user.id, conceptIds);

      // Calculate summary stats
      const masteredCount = masteries.filter(m => m.masteryLevel === 'MASTERED').length;
      const proficientCount = masteries.filter(m => m.masteryLevel === 'PROFICIENT').length;
      const practicingCount = masteries.filter(m => m.masteryLevel === 'PRACTICING').length;
      const introducedCount = masteries.filter(m => m.masteryLevel === 'INTRODUCED').length;
      const notStartedCount = conceptIds.length - masteries.length;

      const overallScore = masteries.length > 0
        ? Math.round(masteries.reduce((sum, m) => sum + m.score, 0) / masteries.length)
        : 0;

      return NextResponse.json({
        success: true,
        data: {
          courseId: query.courseId,
          totalConcepts: conceptIds.length,
          masteries,
          summary: {
            mastered: masteredCount,
            proficient: proficientCount,
            practicing: practicingCount,
            introduced: introducedCount,
            notStarted: notStartedCount,
            overallScore,
          },
        },
      });
    }

    // Get all masteries for user
    const masteries = await adapter.getUserMasteries(session.user.id);
    return NextResponse.json({
      success: true,
      data: masteries,
    });
  } catch (error) {
    logger.error('[KnowledgeGraphEngine Mastery] GET error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to get mastery data' } },
      { status: 500 }
    );
  }
}

/**
 * POST - Update concept mastery
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = UpdateMasterySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request', details: parsed.error.errors } },
        { status: 400 }
      );
    }

    const { conceptId, score, evidenceType } = parsed.data;

    const engine = await createEngineForUser(session.user.id);
    const adapter = getKnowledgeGraphEngineAdapter();

    // Update mastery using the engine
    const updatedMastery = await withRetryableTimeout(
      () => engine.updateConceptMastery(
        session.user.id,
        conceptId,
        score,
        evidenceType
      ),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'knowledgeGraph-updateMastery'
    );

    // Persist to database
    await adapter.saveMastery(updatedMastery);

    return NextResponse.json({
      success: true,
      data: {
        conceptId: updatedMastery.conceptId,
        masteryLevel: updatedMastery.masteryLevel,
        score: updatedMastery.score,
        practiceCount: updatedMastery.practiceCount,
        lastPracticedAt: updatedMastery.lastPracticedAt,
        updatedAt: updatedMastery.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[KnowledgeGraphEngine Mastery] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { success: false, error: { message: 'Operation timed out. Please try again.' } },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('[KnowledgeGraphEngine Mastery] POST error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to update mastery' } },
      { status: 500 }
    );
  }
}
