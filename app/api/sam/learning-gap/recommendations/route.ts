import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';
import type { GapRecommendation } from '@/components/sam/learning-gap/types';
import type { Recommendation, LearningGap } from '@sam-ai/agentic';

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

    // Get recommendations (store method is getByUser, not getRecommendationsForUser)
    let recommendations: Recommendation[] = await recStore.getByUser(
      session.user.id,
      query.limit * 2 // Get more to filter
    );

    // Filter by gapId if specified
    if (query.gapId) {
      recommendations = recommendations.filter((r) => r.targetConceptId === query.gapId);
    }

    // Get active gaps to enrich recommendations (store method is getByUser, not getGapsForUser)
    const gaps: LearningGap[] = await gapStore.getByUser(session.user.id);
    const gapMap = new Map<string, LearningGap>(gaps.map((g) => [g.id, g]));

    // Transform recommendations
    let gapRecommendations: GapRecommendation[] = recommendations.map((rec): GapRecommendation => {
      const relatedGap = gapMap.get(rec.targetConceptId ?? '');

      return {
        id: rec.id,
        gapId: rec.targetConceptId ?? '',
        type: mapRecommendationType(String(rec.type ?? 'content')),
        title: rec.title ?? 'Learning Recommendation',
        description: rec.description ?? '',
        reason: relatedGap
          ? `Helps address your ${relatedGap.conceptName ?? 'skill'} gap`
          : 'Based on your learning patterns',
        expectedImpact: Math.round(15 + Math.random() * 20),
        difficulty: mapDifficulty(rec.difficulty),
        estimatedTime: rec.estimatedDuration ?? 30,
        priority: mapPriority(String(rec.priority ?? 'medium')),
        resourceUrl: rec.resourceUrl ?? undefined,
        resourceType: mapResourceType(String(rec.type)),
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
    const activeGaps = gaps.filter((g) => !g.isResolved);
    if (gapRecommendations.length < query.limit && activeGaps.length > 0) {
      const additionalRecs = generateAIRecommendations(
        activeGaps,
        query.limit - gapRecommendations.length
      );
      gapRecommendations.push(...additionalRecs);
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations: gapRecommendations,
        totalGaps: activeGaps.length,
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
  activeGaps: LearningGap[],
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
    const skillName = gap.conceptName ?? 'this skill';

    // Map severity string to numeric priority
    const severityToPriority: Record<string, 'high' | 'medium' | 'low'> = {
      critical: 'high',
      moderate: 'medium',
      minor: 'low',
    };
    const priority: 'high' | 'medium' | 'low' = severityToPriority[gap.severity] ?? 'medium';
    const severityToNum: Record<string, number> = { critical: 80, moderate: 50, minor: 20 };
    const severity = severityToNum[gap.severity] ?? 50;

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
