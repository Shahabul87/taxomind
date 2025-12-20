/**
 * @sam-ai/api - Gamification Handler
 * Handles gamification-related requests (points, badges, streaks)
 */

import type { SAMConfig, StorageAdapter, GamificationData, BadgeData } from '@sam-ai/core';
import type {
  SAMApiRequest,
  SAMApiResponse,
  SAMHandler,
  SAMHandlerContext,
  GamificationRequest,
  GamificationResponse,
} from '../types';

/**
 * Create success response
 */
function createSuccessResponse<T>(data: T, status = 200): SAMApiResponse {
  return {
    status,
    body: {
      success: true,
      data,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Create error response
 */
function createErrorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): SAMApiResponse {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Default gamification data
 */
function getDefaultGamificationData(): GamificationResponse['data'] {
  return {
    points: 0,
    level: 1,
    badges: [],
    streak: {
      current: 0,
      longest: 0,
      lastActivity: new Date(),
    },
    achievements: [],
  };
}

/**
 * Convert storage data to response format
 */
function storageToResponseFormat(stored: GamificationData): GamificationResponse['data'] {
  return {
    points: stored.points,
    level: stored.level,
    badges: stored.badges.map((b: BadgeData) => ({
      id: b.id,
      name: b.name,
      earnedAt: b.earnedAt,
    })),
    streak: {
      current: stored.currentStreak,
      longest: stored.longestStreak,
      lastActivity: stored.lastActivityDate ?? new Date(),
    },
    achievements: [], // Storage doesn't have achievements in this structure
  };
}

/**
 * Calculate level from points
 */
function calculateLevel(points: number): number {
  // Simple level calculation: level = floor(sqrt(points / 100)) + 1
  return Math.floor(Math.sqrt(points / 100)) + 1;
}

/**
 * Create gamification handler
 */
export function createGamificationHandler(config: SAMConfig): SAMHandler {
  const storage: StorageAdapter | undefined = config.storage;

  return async (
    request: SAMApiRequest,
    _handlerContext: SAMHandlerContext
  ): Promise<SAMApiResponse> => {
    const body = request.body as GamificationRequest;

    // Validate user ID
    if (!body.userId) {
      return createErrorResponse(400, 'INVALID_REQUEST', 'User ID is required');
    }

    try {
      switch (body.action) {
        case 'get':
          return await handleGet(body.userId, storage);

        case 'update':
          return await handleUpdate(body.userId, body.payload, storage);

        case 'award-badge':
          return await handleAwardBadge(body.userId, body.payload, storage);

        case 'update-streak':
          return await handleUpdateStreak(body.userId, storage);

        default:
          return createErrorResponse(
            400,
            'INVALID_ACTION',
            `Unknown action: ${body.action}`
          );
      }
    } catch (error) {
      console.error('[SAM Gamification Handler] Error:', error);

      if (error instanceof Error) {
        return createErrorResponse(
          500,
          'GAMIFICATION_ERROR',
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'An error occurred processing gamification request'
        );
      }

      return createErrorResponse(
        500,
        'INTERNAL_ERROR',
        'An unexpected error occurred'
      );
    }
  };
}

/**
 * Handle get gamification data
 */
async function handleGet(
  userId: string,
  storage?: StorageAdapter
): Promise<SAMApiResponse> {
  let data = getDefaultGamificationData();

  if (storage?.getGamificationData) {
    const stored = await storage.getGamificationData(userId);
    if (stored) {
      data = storageToResponseFormat(stored);
    }
  }

  const response: GamificationResponse = {
    data,
  };

  return createSuccessResponse(response);
}

/**
 * Handle update points/activity
 */
async function handleUpdate(
  userId: string,
  payload?: GamificationRequest['payload'],
  storage?: StorageAdapter
): Promise<SAMApiResponse> {
  const pointsToAdd = payload?.points ?? 0;
  const activity = payload?.activity ?? 'unknown';

  // Get current data
  let currentData = getDefaultGamificationData();

  if (storage?.getGamificationData) {
    const stored = await storage.getGamificationData(userId);
    if (stored) {
      currentData = storageToResponseFormat(stored);
    }
  }

  // Update points and level
  const newPoints = currentData.points + pointsToAdd;
  const newLevel = calculateLevel(newPoints);

  const updatedData: GamificationResponse['data'] = {
    ...currentData,
    points: newPoints,
    level: newLevel,
  };

  // Save if storage available
  if (storage?.updateGamificationData) {
    await storage.updateGamificationData(userId, {
      points: newPoints,
      level: newLevel,
    });
  }

  const response: GamificationResponse = {
    data: updatedData,
    recentActivity: [
      {
        type: activity,
        points: pointsToAdd,
        timestamp: new Date(),
      },
    ],
  };

  return createSuccessResponse(response);
}

/**
 * Handle awarding a badge
 */
async function handleAwardBadge(
  userId: string,
  payload?: GamificationRequest['payload'],
  storage?: StorageAdapter
): Promise<SAMApiResponse> {
  if (!payload?.badgeId) {
    return createErrorResponse(400, 'INVALID_REQUEST', 'Badge ID is required');
  }

  // Get current data
  let currentData = getDefaultGamificationData();

  if (storage?.getGamificationData) {
    const stored = await storage.getGamificationData(userId);
    if (stored) {
      currentData = storageToResponseFormat(stored);
    }
  }

  // Check if badge already awarded
  if (currentData.badges.some((b) => b.id === payload.badgeId)) {
    return createErrorResponse(400, 'BADGE_EXISTS', 'Badge already awarded');
  }

  // Add new badge
  const newBadge = {
    id: payload.badgeId,
    name: payload.badgeId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    earnedAt: new Date(),
  };

  const updatedData: GamificationResponse['data'] = {
    ...currentData,
    badges: [...currentData.badges, newBadge],
  };

  // Save if storage available
  if (storage?.awardBadge) {
    const badgeData: BadgeData = {
      id: payload.badgeId,
      type: 'achievement',
      name: newBadge.name,
      level: 'bronze',
      earnedAt: new Date(),
    };
    await storage.awardBadge(userId, badgeData);
  }

  const response: GamificationResponse = {
    data: updatedData,
    recentActivity: [
      {
        type: 'badge-earned',
        points: 50, // Bonus points for badge
        timestamp: new Date(),
      },
    ],
  };

  return createSuccessResponse(response);
}

/**
 * Handle updating streak
 */
async function handleUpdateStreak(
  userId: string,
  storage?: StorageAdapter
): Promise<SAMApiResponse> {
  // Get current data
  let currentData = getDefaultGamificationData();

  if (storage?.getGamificationData) {
    const stored = await storage.getGamificationData(userId);
    if (stored) {
      currentData = storageToResponseFormat(stored);
    }
  }

  const now = new Date();
  const lastActivity = currentData.streak.lastActivity;
  const daysSinceLastActivity = Math.floor(
    (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
  );

  let newStreak: GamificationResponse['data']['streak'];

  if (daysSinceLastActivity <= 1) {
    // Continue streak
    const newCurrent =
      daysSinceLastActivity === 1
        ? currentData.streak.current + 1
        : currentData.streak.current;
    newStreak = {
      current: newCurrent,
      longest: Math.max(currentData.streak.longest, newCurrent),
      lastActivity: now,
    };
  } else {
    // Reset streak
    newStreak = {
      current: 1,
      longest: currentData.streak.longest,
      lastActivity: now,
    };
  }

  const updatedData: GamificationResponse['data'] = {
    ...currentData,
    streak: newStreak,
  };

  // Save if storage available
  if (storage?.updateGamificationData) {
    await storage.updateGamificationData(userId, {
      currentStreak: newStreak.current,
      longestStreak: newStreak.longest,
      lastActivityDate: now,
    });
  }

  const response: GamificationResponse = {
    data: updatedData,
    recentActivity: [
      {
        type: 'streak-update',
        points: newStreak.current * 5, // Bonus points per streak day
        timestamp: now,
      },
    ],
  };

  return createSuccessResponse(response);
}
