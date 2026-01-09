import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { z } from "zod";

// Validation schema for notification preferences
const updatePreferencesSchema = z.object({
  enabled: z.boolean().optional(),
  quietHoursStart: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)")
    .nullable()
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)")
    .nullable()
    .optional(),
  timezone: z.string().max(100).optional(),
  remindersBefore: z.number().min(5).max(120).optional(),
  streakReminders: z.boolean().optional(),
  goalUpdates: z.boolean().optional(),
  weeklySummary: z.boolean().optional(),
  dailyDigest: z.boolean().optional(),
  breakReminders: z.boolean().optional(),
  studySuggestions: z.boolean().optional(),
  breakIntervalMinutes: z.number().min(15).max(180).optional(),
  breakDurationMinutes: z.number().min(1).max(30).optional(),
  channelPreferences: z.record(z.array(z.string())).nullable().optional(),
  digestTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)")
    .optional(),
  weeklyDigestDay: z.number().min(0).max(6).optional(),
});

/**
 * GET /api/dashboard/learning-notifications/preferences
 * Get user&apos;s learning notification preferences
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    // Get or create default preferences
    let preferences = await db.learningNotificationPreference.findUnique({
      where: { userId: user.id },
    });

    if (!preferences) {
      // Create default preferences
      preferences = await db.learningNotificationPreference.create({
        data: {
          userId: user.id,
          enabled: true,
          timezone: "UTC",
          remindersBefore: 15,
          streakReminders: true,
          goalUpdates: true,
          weeklySummary: true,
          dailyDigest: true,
          breakReminders: true,
          studySuggestions: true,
          breakIntervalMinutes: 60,
          breakDurationMinutes: 5,
          digestTime: "08:00",
          weeklyDigestDay: 1,
        },
      });
    }

    return successResponse(preferences);
  } catch (error) {
    console.error("[NOTIFICATION_PREFERENCES_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch notification preferences",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

/**
 * PATCH /api/dashboard/learning-notifications/preferences
 * Update user&apos;s learning notification preferences
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    const body = await req.json();
    const validatedData = updatePreferencesSchema.parse(body);

    // Validate quiet hours - both must be set or neither
    if (
      (validatedData.quietHoursStart && !validatedData.quietHoursEnd) ||
      (!validatedData.quietHoursStart && validatedData.quietHoursEnd)
    ) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        "Both quiet hours start and end must be provided together"
      );
    }

    // Prepare update data with proper JSON handling
    const updateData: Prisma.LearningNotificationPreferenceUpdateInput = {
      ...validatedData,
      channelPreferences: validatedData.channelPreferences === null
        ? Prisma.JsonNull
        : validatedData.channelPreferences,
    };

    // Upsert preferences
    const preferences = await db.learningNotificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        enabled: validatedData.enabled ?? true,
        quietHoursStart: validatedData.quietHoursStart,
        quietHoursEnd: validatedData.quietHoursEnd,
        timezone: validatedData.timezone ?? "UTC",
        remindersBefore: validatedData.remindersBefore ?? 15,
        streakReminders: validatedData.streakReminders ?? true,
        goalUpdates: validatedData.goalUpdates ?? true,
        weeklySummary: validatedData.weeklySummary ?? true,
        dailyDigest: validatedData.dailyDigest ?? true,
        breakReminders: validatedData.breakReminders ?? true,
        studySuggestions: validatedData.studySuggestions ?? true,
        breakIntervalMinutes: validatedData.breakIntervalMinutes ?? 60,
        breakDurationMinutes: validatedData.breakDurationMinutes ?? 5,
        channelPreferences: validatedData.channelPreferences ?? {},
        digestTime: validatedData.digestTime ?? "08:00",
        weeklyDigestDay: validatedData.weeklyDigestDay ?? 1,
      },
      update: updateData,
    });

    return successResponse(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    console.error("[NOTIFICATION_PREFERENCES_PATCH]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update notification preferences",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

/**
 * DELETE /api/dashboard/learning-notifications/preferences
 * Reset preferences to defaults
 */
export async function DELETE() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    // Delete existing preferences
    await db.learningNotificationPreference.deleteMany({
      where: { userId: user.id },
    });

    // Create default preferences
    const preferences = await db.learningNotificationPreference.create({
      data: {
        userId: user.id,
        enabled: true,
        timezone: "UTC",
        remindersBefore: 15,
        streakReminders: true,
        goalUpdates: true,
        weeklySummary: true,
        dailyDigest: true,
        breakReminders: true,
        studySuggestions: true,
        breakIntervalMinutes: 60,
        breakDurationMinutes: 5,
        digestTime: "08:00",
        weeklyDigestDay: 1,
      },
    });

    return successResponse(preferences, undefined, { reset: true });
  } catch (error) {
    console.error("[NOTIFICATION_PREFERENCES_DELETE]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to reset notification preferences",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
