/**
 * SAM Notification Preferences API
 * Manages SAM AI notification preferences for users
 *
 * Backed by UserNotificationPreferences model
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PreferencesSchema = z.object({
  // Category toggles
  studyReminders: z.boolean().optional(),
  goalProgress: z.boolean().optional(),
  checkIns: z.boolean().optional(),
  achievements: z.boolean().optional(),
  struggles: z.boolean().optional(),
  recommendations: z.boolean().optional(),

  // Global settings
  enabled: z.boolean().optional(),
  sound: z.boolean().optional(),

  // Quiet hours
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.number().int().min(0).max(23).optional(),
  quietHoursEnd: z.number().int().min(0).max(23).optional(),
});

const SavePreferencesSchema = z.object({
  userId: z.string().min(1).optional(), // Optional - can use session userId
  preferences: PreferencesSchema,
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface NotificationPrefs {
  studyReminders: boolean;
  goalProgress: boolean;
  checkIns: boolean;
  achievements: boolean;
  struggles: boolean;
  recommendations: boolean;
  enabled: boolean;
  sound: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map database fields to component-expected format
 */
function mapDbToPrefs(
  dbPrefs: {
    samEnabled: boolean;
    samStudyReminders: boolean;
    samGoalProgress: boolean;
    samCheckIns: boolean;
    samAchievements: boolean;
    samStruggles: boolean;
    samRecommendations: boolean;
    samSound: boolean;
    samQuietHoursEnabled: boolean;
    samQuietHoursStart: number;
    samQuietHoursEnd: number;
  } | null
): NotificationPrefs {
  if (!dbPrefs) {
    // Return defaults
    return {
      studyReminders: true,
      goalProgress: true,
      checkIns: true,
      achievements: true,
      struggles: true,
      recommendations: true,
      enabled: true,
      sound: true,
      quietHoursEnabled: false,
      quietHoursStart: 22,
      quietHoursEnd: 7,
    };
  }

  return {
    studyReminders: dbPrefs.samStudyReminders,
    goalProgress: dbPrefs.samGoalProgress,
    checkIns: dbPrefs.samCheckIns,
    achievements: dbPrefs.samAchievements,
    struggles: dbPrefs.samStruggles,
    recommendations: dbPrefs.samRecommendations,
    enabled: dbPrefs.samEnabled,
    sound: dbPrefs.samSound,
    quietHoursEnabled: dbPrefs.samQuietHoursEnabled,
    quietHoursStart: dbPrefs.samQuietHoursStart,
    quietHoursEnd: dbPrefs.samQuietHoursEnd,
  };
}

/**
 * Map component preferences to database fields
 */
function mapPrefsToDb(prefs: Partial<NotificationPrefs>): Record<string, boolean | number> {
  const dbFields: Record<string, boolean | number> = {};

  if (prefs.studyReminders !== undefined) dbFields.samStudyReminders = prefs.studyReminders;
  if (prefs.goalProgress !== undefined) dbFields.samGoalProgress = prefs.goalProgress;
  if (prefs.checkIns !== undefined) dbFields.samCheckIns = prefs.checkIns;
  if (prefs.achievements !== undefined) dbFields.samAchievements = prefs.achievements;
  if (prefs.struggles !== undefined) dbFields.samStruggles = prefs.struggles;
  if (prefs.recommendations !== undefined) dbFields.samRecommendations = prefs.recommendations;
  if (prefs.enabled !== undefined) dbFields.samEnabled = prefs.enabled;
  if (prefs.sound !== undefined) dbFields.samSound = prefs.sound;
  if (prefs.quietHoursEnabled !== undefined) dbFields.samQuietHoursEnabled = prefs.quietHoursEnabled;
  if (prefs.quietHoursStart !== undefined) dbFields.samQuietHoursStart = prefs.quietHoursStart;
  if (prefs.quietHoursEnd !== undefined) dbFields.samQuietHoursEnd = prefs.quietHoursEnd;

  return dbFields;
}

// ============================================================================
// GET - Get user's SAM notification preferences
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for userId query param (for admin access or explicit request)
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('userId');

    // Use session userId unless admin is requesting another user
    const userId = queryUserId && queryUserId === session.user.id
      ? queryUserId
      : session.user.id;

    // Get or create preferences
    let preferences = await db.userNotificationPreferences.findUnique({
      where: { userId },
      select: {
        samEnabled: true,
        samStudyReminders: true,
        samGoalProgress: true,
        samCheckIns: true,
        samAchievements: true,
        samStruggles: true,
        samRecommendations: true,
        samSound: true,
        samQuietHoursEnabled: true,
        samQuietHoursStart: true,
        samQuietHoursEnd: true,
      },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      const newPrefs = await db.userNotificationPreferences.create({
        data: { userId },
        select: {
          samEnabled: true,
          samStudyReminders: true,
          samGoalProgress: true,
          samCheckIns: true,
          samAchievements: true,
          samStruggles: true,
          samRecommendations: true,
          samSound: true,
          samQuietHoursEnabled: true,
          samQuietHoursStart: true,
          samQuietHoursEnd: true,
        },
      });
      preferences = newPrefs;
    }

    return NextResponse.json({
      success: true,
      data: mapDbToPrefs(preferences),
    });
  } catch (error) {
    logger.error('Error fetching SAM notification preferences:', error);

    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Save user's SAM notification preferences
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = SavePreferencesSchema.parse(body);

    // Use session userId if not provided
    const userId = validated.userId || session.user.id;

    // Security: Only allow users to update their own preferences
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Cannot update preferences for another user' },
        { status: 403 }
      );
    }

    // Map preferences to database fields
    const dbData = mapPrefsToDb(validated.preferences);

    // Upsert preferences
    const updated = await db.userNotificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...dbData,
      },
      update: dbData,
      select: {
        samEnabled: true,
        samStudyReminders: true,
        samGoalProgress: true,
        samCheckIns: true,
        samAchievements: true,
        samStruggles: true,
        samRecommendations: true,
        samSound: true,
        samQuietHoursEnabled: true,
        samQuietHoursStart: true,
        samQuietHoursEnd: true,
      },
    });

    logger.info(`Updated SAM notification preferences for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: mapDbToPrefs(updated),
    });
  } catch (error) {
    logger.error('Error saving SAM notification preferences:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preferences data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save notification preferences' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Partially update SAM notification preferences
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = PreferencesSchema.parse(body);

    const userId = session.user.id;

    // Map preferences to database fields
    const dbData = mapPrefsToDb(validated);

    if (Object.keys(dbData).length === 0) {
      return NextResponse.json(
        { error: 'No valid preferences to update' },
        { status: 400 }
      );
    }

    // Upsert preferences
    const updated = await db.userNotificationPreferences.upsert({
      where: { userId },
      create: {
        userId,
        ...dbData,
      },
      update: dbData,
      select: {
        samEnabled: true,
        samStudyReminders: true,
        samGoalProgress: true,
        samCheckIns: true,
        samAchievements: true,
        samStruggles: true,
        samRecommendations: true,
        samSound: true,
        samQuietHoursEnabled: true,
        samQuietHoursStart: true,
        samQuietHoursEnd: true,
      },
    });

    logger.info(`Partially updated SAM notification preferences for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: mapDbToPrefs(updated),
    });
  } catch (error) {
    logger.error('Error updating SAM notification preferences:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid preferences data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
