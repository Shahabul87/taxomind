/**
 * SAM Presence API Route
 *
 * Handles user presence tracking for real-time features.
 * Used by:
 * - usePresence hook to update user presence status
 * - ActiveLearnersWidget to fetch active learners
 *
 * Endpoints:
 * - GET: Fetch active learners (optionally filtered by courseId/topicId)
 * - POST: Update current user's presence status
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getPresenceStore } from '@/lib/sam/taxomind-context';
import type { PresenceStatus, PresenceMetadata } from '@sam-ai/agentic';

// ============================================================================
// SCHEMAS
// ============================================================================

const UpdatePresenceSchema = z.object({
  status: z.enum(['online', 'away', 'idle', 'studying', 'on_break', 'offline', 'do_not_disturb']),
  metadata: z.object({
    deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    location: z.object({
      courseId: z.string().optional(),
      chapterId: z.string().optional(),
      sectionId: z.string().optional(),
      pageUrl: z.string().optional(),
    }).optional(),
    sessionContext: z.object({
      planId: z.string().optional(),
      stepId: z.string().optional(),
      goalId: z.string().optional(),
    }).optional(),
  }).optional(),
});

const QueryParamsSchema = z.object({
  courseId: z.string().optional(),
  topicId: z.string().optional(),
  status: z.enum(['online', 'away', 'idle', 'studying', 'on_break', 'offline', 'do_not_disturb']).optional(),
});

// ============================================================================
// GET - Fetch active learners
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const queryValidation = QueryParamsSchema.safeParse({
      courseId: searchParams.get('courseId') ?? undefined,
      topicId: searchParams.get('topicId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    if (!queryValidation.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: queryValidation.error.flatten(),
        },
      }, { status: 400 });
    }

    const { courseId, status } = queryValidation.data;
    const presenceStore = getPresenceStore();

    // Fetch users based on filters
    let users;
    if (status) {
      users = await presenceStore.getByStatus(status as PresenceStatus);
    } else {
      users = await presenceStore.getOnline();
    }

    // Filter by courseId if provided
    if (courseId && users) {
      users = users.filter(user =>
        user.metadata?.location?.courseId === courseId
      );
    }

    // Exclude current user from list
    const otherUsers = users?.filter(user => user.userId !== session.user.id) ?? [];

    // Transform to ActiveLearner format for the widget
    const activeLearners = otherUsers.map(user => ({
      id: user.userId,
      name: user.metadata?.browser ?? 'Anonymous Learner', // Placeholder - would need user lookup
      avatar: undefined,
      status: user.status,
      currentActivity: getActivityDescription(user.status, user.metadata),
      lastActivityAt: user.lastActivityAt.toISOString(),
    }));

    logger.debug('[SAM_PRESENCE] Fetched active learners', {
      userId: session.user.id,
      totalUsers: users?.length ?? 0,
      filteredUsers: activeLearners.length,
      courseId,
    });

    return NextResponse.json({
      success: true,
      data: {
        users: activeLearners,
        total: activeLearners.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[SAM_PRESENCE] Error fetching presence', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch presence data',
      },
    }, { status: 500 });
  }
}

// ============================================================================
// POST - Update current user's presence
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = UpdatePresenceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid presence data',
          details: validation.error.flatten(),
        },
      }, { status: 400 });
    }

    const { status, metadata } = validation.data;
    const presenceStore = getPresenceStore();

    // Check if user already has a presence record
    const existingPresence = await presenceStore.get(session.user.id);

    if (existingPresence) {
      // Update existing presence
      const updatedPresence = await presenceStore.update(session.user.id, {
        status: status as PresenceStatus,
        lastActivityAt: new Date(),
        metadata: metadata ? {
          ...existingPresence.metadata,
          ...metadata,
        } as PresenceMetadata : existingPresence.metadata,
      });

      logger.debug('[SAM_PRESENCE] Updated user presence', {
        userId: session.user.id,
        status,
        previousStatus: existingPresence.status,
      });

      return NextResponse.json({
        success: true,
        data: {
          presence: updatedPresence,
        },
        timestamp: new Date().toISOString(),
      });
    } else {
      // Create new presence record
      const newPresence = {
        userId: session.user.id,
        connectionId: `http-${session.user.id}-${Date.now()}`, // HTTP-based connection ID
        status: status as PresenceStatus,
        lastActivityAt: new Date(),
        connectedAt: new Date(),
        metadata: (metadata ?? {
          deviceType: 'desktop',
        }) as PresenceMetadata,
        subscriptions: [],
      };

      await presenceStore.set(newPresence);

      logger.debug('[SAM_PRESENCE] Created user presence', {
        userId: session.user.id,
        status,
      });

      return NextResponse.json({
        success: true,
        data: {
          presence: newPresence,
        },
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('[SAM_PRESENCE] Error updating presence', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update presence',
      },
    }, { status: 500 });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getActivityDescription(
  status: PresenceStatus,
  metadata?: PresenceMetadata
): string {
  if (metadata?.location?.courseId) {
    switch (status) {
      case 'studying':
        return 'Studying course content';
      case 'idle':
        return 'In course (idle)';
      case 'on_break':
        return 'Taking a break';
      default:
        return 'Browsing course';
    }
  }

  switch (status) {
    case 'studying':
      return 'Actively studying';
    case 'idle':
      return 'Idle';
    case 'on_break':
      return 'On break';
    case 'away':
      return 'Away';
    case 'online':
      return 'Online';
    default:
      return 'Unknown';
  }
}

export const runtime = 'nodejs';
