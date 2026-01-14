/**
 * SAM Agentic Recommendations History API
 * Returns historical recommendation data for timeline visualization
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';
import type { PrismaRecommendationStore } from '@/lib/sam/stores/prisma-analytics-stores';
import type { SAMRecommendationType, SAMRecommendationReason } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

type TimelineRecommendationType = 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal';
type TimelineStatus = 'completed' | 'dismissed' | 'snoozed' | 'pending';

interface TimelineItem {
  id: string;
  type: TimelineRecommendationType;
  title: string;
  description: string;
  reason: string;
  status: TimelineStatus;
  createdAt: string;
  completedAt?: string;
  snoozedUntil?: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
  type: z.enum(['content', 'practice', 'review', 'assessment', 'break', 'goal', 'all']).optional().default('all'),
  status: z.enum(['completed', 'dismissed', 'snoozed', 'pending', 'all']).optional().default('all'),
});

// ============================================================================
// MAPPERS
// ============================================================================

function mapRecommendationType(type: SAMRecommendationType): TimelineRecommendationType {
  switch (type) {
    case 'VIDEO':
    case 'ARTICLE':
    case 'TUTORIAL':
    case 'DOCUMENTATION':
      return 'content';
    case 'EXERCISE':
    case 'PROJECT':
      return 'practice';
    case 'QUIZ':
      return 'assessment';
    default:
      return 'content';
  }
}

function mapRecommendationReason(reason: SAMRecommendationReason): string {
  switch (reason) {
    case 'KNOWLEDGE_GAP':
      return 'Fill knowledge gap';
    case 'SKILL_DECAY':
      return 'Prevent skill decay';
    case 'PREREQUISITE':
      return 'Complete prerequisite';
    case 'REINFORCEMENT':
      return 'Reinforce learning';
    case 'EXPLORATION':
      return 'Explore new topic';
    case 'CHALLENGE':
      return 'Challenge yourself';
    case 'REVIEW':
      return 'Review material';
    default:
      return 'Recommended for you';
  }
}

function mapStatus(isCompleted: boolean, isViewed: boolean, expiresAt: Date | null): TimelineStatus {
  if (isCompleted) {
    return 'completed';
  }
  if (expiresAt && expiresAt < new Date()) {
    return 'dismissed';
  }
  return 'pending';
}

function mapDbTypeToQueryType(type: TimelineRecommendationType): SAMRecommendationType[] {
  switch (type) {
    case 'content':
      return ['VIDEO', 'ARTICLE', 'TUTORIAL', 'DOCUMENTATION'];
    case 'practice':
      return ['EXERCISE', 'PROJECT'];
    case 'assessment':
      return ['QUIZ'];
    case 'review':
      return ['ARTICLE', 'VIDEO']; // Review-type recommendations
    default:
      return [];
  }
}

// ============================================================================
// GET /api/sam/agentic/recommendations/history
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { limit, offset, type, status } = parsed.data;

    // Use the recommendation store from TaxomindContext
    const recommendationStore = getStore('recommendation') as PrismaRecommendationStore;

    // Build type filter
    const dbTypes = type !== 'all' ? mapDbTypeToQueryType(type) : undefined;

    // Map status to store format
    const storeStatus = status === 'snoozed' ? 'pending' : status;

    // Fetch recommendations using store interface
    const recommendations = await recommendationStore.findHistory({
      userId: user.id,
      types: dbTypes,
      status: storeStatus as 'completed' | 'pending' | 'dismissed' | 'all',
      limit,
      offset,
    });

    // Get total count for pagination using store interface
    const total = await recommendationStore.countHistory({
      userId: user.id,
      types: dbTypes,
      status: storeStatus as 'completed' | 'pending' | 'dismissed' | 'all',
    });

    // Map to timeline items
    const items: TimelineItem[] = recommendations.map((rec) => ({
      id: rec.id,
      type: mapRecommendationType(rec.type as SAMRecommendationType),
      title: rec.title,
      description: rec.description ?? '',
      reason: mapRecommendationReason(rec.reason as SAMRecommendationReason),
      status: mapStatus(rec.isCompleted, rec.isViewed, rec.expiresAt),
      createdAt: rec.createdAt.toISOString(),
      completedAt: rec.isCompleted ? rec.createdAt.toISOString() : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    });
  } catch (error) {
    logger.error('Error fetching recommendation history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendation history' },
      { status: 500 }
    );
  }
}
