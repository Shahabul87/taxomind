import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';
import type { LearningGapData, GapSeverity } from '@/components/sam/learning-gap/types';
import type { LearningGap } from '@sam-ai/agentic';

// ============================================================================
// STORE RETURN TYPES
// ============================================================================

/** Shape of a single gap record from the store */
type GapRecord = LearningGap;

/** Evidence entry as stored in the JSON evidence array */
interface GapEvidenceEntry {
  type?: string;
  score?: number;
  expectedScore?: number;
  date?: string;
  source?: string;
}

/** Suggested action entry from the store */
interface GapSuggestedAction {
  id?: string;
  type?: string;
  title?: string;
  description?: string;
  estimatedTime?: number;
  priority?: string;
  resourceUrl?: string;
}

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
    const rawGaps: GapRecord[] = await gapStore.getByUser(session.user.id, true);

    // Filter by status and severity
    let filteredGaps = rawGaps;

    if (query.status !== 'all') {
      filteredGaps = filteredGaps.filter((g) => {
        const status = g.isResolved ? 'resolved' : 'active';
        return status === query.status;
      });
    }

    if (query.severity !== 'all') {
      filteredGaps = filteredGaps.filter((g) => {
        return g.severity === query.severity;
      });
    }

    // Sort by severity (critical first) then by detection date (newest first)
    const severityOrder: Record<string, number> = { critical: 0, moderate: 1, minor: 2 };
    filteredGaps.sort((a, b) => {
      const sevA = severityOrder[a.severity] ?? 2;
      const sevB = severityOrder[b.severity] ?? 2;
      if (sevA !== sevB) return sevA - sevB;
      return new Date(b.detectedAt ?? 0).getTime() - new Date(a.detectedAt ?? 0).getTime();
    });

    // Paginate
    const total = filteredGaps.length;
    const paginatedGaps = filteredGaps.slice(query.offset, query.offset + query.limit);

    // Transform to response format
    // Note: LearningGap from @sam-ai/agentic uses conceptId/conceptName;
    // we map these to skillId/skillName for the dashboard response.
    const gaps: LearningGapData[] = paginatedGaps.map((gap) => {
      // Evidence is stored as GapEvidence[] but may contain extended fields at runtime
      const evidenceArray = (gap.evidence ?? []) as unknown as GapEvidenceEntry[];
      // suggestedActions is string[] in the store type but may contain objects at runtime
      const actionsArray = (gap.suggestedActions ?? []) as unknown as (string | GapSuggestedAction)[];

      return {
        id: gap.id,
        skillId: gap.conceptId ?? '',
        skillName: gap.conceptName ?? 'Unknown Skill',
        topicId: gap.topicId ?? undefined,
        topicName: undefined,
        severity: mapSeverity(gap.severity ?? 'moderate'),
        status: gap.isResolved ? 'resolved' as const : 'active' as const,
        gapScore: 50,
        masteryLevel: 0,
        targetMasteryLevel: 80,
        evidence: evidenceArray.map((e) => ({
          type: (e.type ?? 'assessment') as 'assessment' | 'practice' | 'quiz' | 'activity',
          score: e.score ?? 0,
          expectedScore: e.expectedScore ?? 0,
          date: e.date ?? new Date().toISOString(),
          source: e.source ?? 'Unknown',
        })),
        suggestedActions: actionsArray.map((a) => {
          if (typeof a === 'string') {
            return {
              id: crypto.randomUUID(),
              type: 'review' as const,
              title: a,
              description: '',
              estimatedTime: 30,
              priority: 'medium' as const,
            };
          }
          return {
            id: a.id ?? crypto.randomUUID(),
            type: (a.type ?? 'review') as 'review' | 'practice' | 'tutorial' | 'assessment',
            title: a.title ?? 'Review Material',
            description: a.description ?? '',
            estimatedTime: a.estimatedTime ?? 30,
            priority: (a.priority ?? 'medium') as 'high' | 'medium' | 'low',
            resourceUrl: a.resourceUrl,
          };
        }),
        detectedAt: gap.detectedAt instanceof Date ? gap.detectedAt.toISOString() : new Date().toISOString(),
        lastUpdated: gap.detectedAt instanceof Date ? gap.detectedAt.toISOString() : new Date().toISOString(),
        resolvedAt: gap.resolvedAt instanceof Date ? gap.resolvedAt.toISOString() : undefined,
      };
    });

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
