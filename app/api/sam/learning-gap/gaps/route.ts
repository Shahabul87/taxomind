// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';
import type { LearningGapData, GapSeverity } from '@/components/sam/learning-gap/types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetGapsQuerySchema = z.object({
  status: z.enum(['active', 'resolving', 'resolved', 'all']).optional().default('all'),
  severity: z.enum(['critical', 'moderate', 'minor', 'all']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================================
// GET - List all learning gaps
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetGapsQuerySchema.parse({
      status: searchParams.get('status') ?? undefined,
      severity: searchParams.get('severity') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    const { learningGap: gapStore } = getAnalyticsStores();

    // Fetch gaps from store
    const rawGaps = await gapStore.getByUser(session.user.id, true);

    // Filter by status and severity
    let filteredGaps = rawGaps;

    if (query.status !== 'all') {
      filteredGaps = filteredGaps.filter((g: typeof rawGaps[number]) => {
        const status = g.isResolved ? 'resolved' : 'active';
        return status === query.status;
      });
    }

    if (query.severity !== 'all') {
      filteredGaps = filteredGaps.filter((g: typeof rawGaps[number]) => {
        return g.severity === query.severity;
      });
    }

    // Sort by severity (critical first) then by detection date (newest first)
    const severityOrder: Record<string, number> = { critical: 0, moderate: 1, minor: 2 };
    filteredGaps.sort((a: typeof rawGaps[number], b: typeof rawGaps[number]) => {
      const sevA = severityOrder[a.severity] ?? 2;
      const sevB = severityOrder[b.severity] ?? 2;
      if (sevA !== sevB) return sevA - sevB;
      return new Date(b.detectedAt ?? 0).getTime() - new Date(a.detectedAt ?? 0).getTime();
    });

    // Paginate
    const total = filteredGaps.length;
    const paginatedGaps = filteredGaps.slice(query.offset, query.offset + query.limit);

    // Transform to response format
    const gaps: LearningGapData[] = paginatedGaps.map((gap: typeof rawGaps[number]) => ({
      id: gap.id,
      skillId: gap.skillId ?? '',
      skillName: gap.skillName ?? 'Unknown Skill',
      topicId: gap.topicId ?? undefined,
      topicName: gap.topicName ?? undefined,
      severity: mapSeverity(gap.severity ?? 0),
      status: gap.status === 'resolved' ? 'resolved' : gap.status === 'resolving' ? 'resolving' : 'active',
      gapScore: gap.gapScore ?? 50,
      masteryLevel: gap.currentMastery ?? 0,
      targetMasteryLevel: gap.targetMastery ?? 80,
      evidence: (gap.evidence ?? []).map((e: Record<string, unknown>) => ({
        type: (e.type as string) ?? 'assessment',
        score: (e.score as number) ?? 0,
        expectedScore: (e.expectedScore as number) ?? 0,
        date: (e.date as string) ?? new Date().toISOString(),
        source: (e.source as string) ?? 'Unknown',
      })),
      suggestedActions: (gap.suggestedActions ?? []).map((a: Record<string, unknown>) => ({
        id: (a.id as string) ?? crypto.randomUUID(),
        type: (a.type as string) ?? 'review',
        title: (a.title as string) ?? 'Review Material',
        description: (a.description as string) ?? '',
        estimatedTime: (a.estimatedTime as number) ?? 30,
        priority: (a.priority as string) ?? 'medium',
        resourceUrl: a.resourceUrl as string | undefined,
      })),
      detectedAt: gap.detectedAt?.toISOString() ?? new Date().toISOString(),
      lastUpdated: gap.updatedAt?.toISOString() ?? new Date().toISOString(),
      resolvedAt: gap.resolvedAt?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        gaps,
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < total,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching learning gaps:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch learning gaps' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapSeverity(severity: number | string): GapSeverity {
  if (typeof severity === 'string') {
    if (severity === 'critical' || severity === 'moderate' || severity === 'minor') {
      return severity;
    }
    return 'moderate';
  }
  if (severity >= 70) return 'critical';
  if (severity >= 40) return 'moderate';
  return 'minor';
}
