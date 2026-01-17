import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';
import type { GapRecommendation } from '@/components/sam/learning-gap/types';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetRecommendationsQuerySchema = z.object({
  gapId: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low', 'all']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

// ============================================================================
// GET - Get gap-specific recommendations
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetRecommendationsQuerySchema.parse({
      gapId: searchParams.get('gapId') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const { recommendation: recStore, learningGap: gapStore } = getAnalyticsStores();

    // Get recommendations
    let recommendations = await recStore.getRecommendationsForUser(session.user.id, {
      limit: query.limit * 2, // Get more to filter
    });

    // Filter by gapId if specified
    if (query.gapId) {
      recommendations = recommendations.filter((r) => r.contextId === query.gapId);
    }

    // Get active gaps to enrich recommendations
    const gaps = await gapStore.getGapsForUser(session.user.id);
    const gapMap = new Map(gaps.map((g) => [g.id, g]));

    // Transform recommendations
    let gapRecommendations: GapRecommendation[] = recommendations.map((rec) => {
      const relatedGap = gapMap.get(rec.contextId ?? '');

      return {
        id: rec.id,
        gapId: rec.contextId ?? '',
        type: mapRecommendationType(rec.type ?? 'content'),
        title: rec.title ?? 'Learning Recommendation',
        description: rec.description ?? '',
        reason: rec.reason ?? (relatedGap
          ? `Helps address your ${relatedGap.skillName ?? 'skill'} gap`
          : 'Based on your learning patterns'),
        expectedImpact: rec.expectedImpact ?? Math.round(15 + Math.random() * 20),
        difficulty: mapDifficulty(rec.difficulty),
        estimatedTime: rec.estimatedTime ?? 30,
        priority: mapPriority(rec.priority ?? 0.5),
        resourceUrl: rec.resourceUrl ?? undefined,
        resourceType: mapResourceType(rec.resourceType),
        prerequisites: rec.prerequisites ?? [],
      };
    });

    // Filter by priority
    if (query.priority !== 'all') {
      gapRecommendations = gapRecommendations.filter((r) => r.priority === query.priority);
    }

    // Sort by priority then by expected impact
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    gapRecommendations.sort((a, b) => {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      return b.expectedImpact - a.expectedImpact;
    });

    // Limit results
    gapRecommendations = gapRecommendations.slice(0, query.limit);

    // Add AI-generated recommendations if we don&apos;t have enough
    if (gapRecommendations.length < query.limit && gaps.length > 0) {
      const additionalRecs = generateAIRecommendations(
        gaps.filter((g) => g.status === 'active'),
        query.limit - gapRecommendations.length
      );
      gapRecommendations.push(...additionalRecs);
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations: gapRecommendations,
        totalGaps: gaps.filter((g) => g.status === 'active').length,
      },
    });
  } catch (error) {
    logger.error('Error fetching gap recommendations:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapRecommendationType(type: string): GapRecommendation['type'] {
  const typeMap: Record<string, GapRecommendation['type']> = {
    content: 'content',
    practice: 'practice',
    review: 'review',
    assessment: 'assessment',
    tutor: 'tutor',
    video: 'content',
    article: 'content',
    exercise: 'practice',
    quiz: 'assessment',
  };
  return typeMap[type] ?? 'content';
}

function mapDifficulty(difficulty: number | string | undefined): 'easy' | 'medium' | 'hard' {
  if (typeof difficulty === 'string') {
    if (difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard') {
      return difficulty;
    }
    return 'medium';
  }
  if (typeof difficulty === 'number') {
    if (difficulty < 0.33) return 'easy';
    if (difficulty < 0.66) return 'medium';
    return 'hard';
  }
  return 'medium';
}

function mapPriority(priority: number | string): 'high' | 'medium' | 'low' {
  if (typeof priority === 'string') {
    if (priority === 'high' || priority === 'medium' || priority === 'low') {
      return priority;
    }
    return 'medium';
  }
  if (priority >= 0.7) return 'high';
  if (priority >= 0.4) return 'medium';
  return 'low';
}

function mapResourceType(type: string | undefined): GapRecommendation['resourceType'] {
  const typeMap: Record<string, GapRecommendation['resourceType']> = {
    video: 'video',
    article: 'article',
    quiz: 'quiz',
    exercise: 'exercise',
    session: 'session',
  };
  return type ? typeMap[type] : undefined;
}

function generateAIRecommendations(
  activeGaps: Array<{
    id: string;
    skillName?: string | null;
    severity?: number | string | null;
    currentMastery?: number | null;
    targetMastery?: number | null;
  }>,
  count: number
): GapRecommendation[] {
  const recommendations: GapRecommendation[] = [];

  const templates = [
    {
      type: 'practice' as const,
      titleTemplate: 'Practice {skill} Fundamentals',
      descTemplate: 'Complete targeted practice exercises to strengthen your {skill} knowledge.',
      resourceType: 'exercise' as const,
      estimatedTime: 20,
      expectedImpact: 15,
    },
    {
      type: 'review' as const,
      titleTemplate: 'Review {skill} Concepts',
      descTemplate: 'Go through the key concepts and principles of {skill} to reinforce your understanding.',
      resourceType: 'article' as const,
      estimatedTime: 15,
      expectedImpact: 12,
    },
    {
      type: 'content' as const,
      titleTemplate: 'Watch {skill} Tutorial',
      descTemplate: 'Learn from video explanations that break down complex {skill} topics.',
      resourceType: 'video' as const,
      estimatedTime: 25,
      expectedImpact: 18,
    },
    {
      type: 'assessment' as const,
      titleTemplate: 'Take {skill} Quiz',
      descTemplate: 'Test your knowledge with a quick quiz to identify remaining knowledge gaps.',
      resourceType: 'quiz' as const,
      estimatedTime: 10,
      expectedImpact: 8,
    },
  ];

  for (let i = 0; i < Math.min(count, activeGaps.length * templates.length); i++) {
    const gap = activeGaps[i % activeGaps.length];
    const template = templates[Math.floor(i / activeGaps.length) % templates.length];
    const skillName = gap.skillName ?? 'this skill';

    const severity = typeof gap.severity === 'number' ? gap.severity : 50;
    const priority: 'high' | 'medium' | 'low' = severity >= 70 ? 'high' : severity >= 40 ? 'medium' : 'low';

    recommendations.push({
      id: `ai-rec-${gap.id}-${i}`,
      gapId: gap.id,
      type: template.type,
      title: template.titleTemplate.replace('{skill}', skillName),
      description: template.descTemplate.replace('{skill}', skillName),
      reason: `AI-recommended to help close your ${skillName} knowledge gap`,
      expectedImpact: template.expectedImpact + Math.round(Math.random() * 10),
      difficulty: severity >= 60 ? 'hard' : severity >= 30 ? 'medium' : 'easy',
      estimatedTime: template.estimatedTime,
      priority,
      resourceType: template.resourceType,
      prerequisites: [],
    });
  }

  return recommendations.slice(0, count);
}
