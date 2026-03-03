import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

// Validation schemas for preferences
const NotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  emailCourseUpdates: z.boolean().optional(),
  emailNewMessages: z.boolean().optional(),
  emailMarketingEmails: z.boolean().optional(),
  emailWeeklyDigest: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  pushCourseReminders: z.boolean().optional(),
  pushNewMessages: z.boolean().optional(),
  pushAchievements: z.boolean().optional(),
});

const PrivacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  showLearningProgress: z.boolean().optional(),
  allowDataCollection: z.boolean().optional(),
  allowPersonalization: z.boolean().optional(),
  cookieNecessary: z.boolean().optional(),
  cookieFunctional: z.boolean().optional(),
  cookieAnalytics: z.boolean().optional(),
  cookieMarketing: z.boolean().optional(),
});

const UserPreferencesSchema = z.object({
  notifications: NotificationPreferencesSchema.optional(),
  privacy: PrivacySettingsSchema.optional(),
});

// GET - Fetch user preferences
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch notification preferences
    let notificationPrefs = await db.userNotificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // Create default notification preferences if they don't exist
    if (!notificationPrefs) {
      notificationPrefs = await db.userNotificationPreferences.create({
        data: {
          userId: user.id,
        },
      });
    }

    // Fetch privacy settings
    let privacySettings = await db.userPrivacySettings.findUnique({
      where: { userId: user.id },
    });

    // Create default privacy settings if they don't exist
    if (!privacySettings) {
      privacySettings = await db.userPrivacySettings.create({
        data: {
          userId: user.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        notifications: {
          emailNotifications: notificationPrefs.emailNotifications,
          emailCourseUpdates: notificationPrefs.emailCourseUpdates,
          emailNewMessages: notificationPrefs.emailNewMessages,
          emailMarketingEmails: notificationPrefs.emailMarketingEmails,
          emailWeeklyDigest: notificationPrefs.emailWeeklyDigest,
          pushNotifications: notificationPrefs.pushNotifications,
          pushCourseReminders: notificationPrefs.pushCourseReminders,
          pushNewMessages: notificationPrefs.pushNewMessages,
          pushAchievements: notificationPrefs.pushAchievements,
        },
        privacy: {
          profileVisibility: privacySettings.profileVisibility,
          showEmail: privacySettings.showEmail,
          showPhone: privacySettings.showPhone,
          showLearningProgress: privacySettings.showLearningProgress,
          allowDataCollection: privacySettings.allowDataCollection,
          allowPersonalization: privacySettings.allowPersonalization,
          cookieNecessary: privacySettings.cookieNecessary,
          cookieFunctional: privacySettings.cookieFunctional,
          cookieAnalytics: privacySettings.cookieAnalytics,
          cookieMarketing: privacySettings.cookieMarketing,
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    }, {
      headers: { 'Cache-Control': 'private, no-cache' },
    });

  } catch (error) {
    logger.error("Preferences fetch error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update preferences",
      },
      { status: 500 }
    );
  }
}

// PUT - Update user preferences
export async function PUT(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = UserPreferencesSchema.parse(body);

    // Update notification preferences if provided
    if (validatedData.notifications) {
      await db.userNotificationPreferences.upsert({
        where: { userId: user.id },
        update: validatedData.notifications,
        create: {
          userId: user.id,
          ...validatedData.notifications,
        },
      });
    }

    // Update privacy settings if provided
    if (validatedData.privacy) {
      await db.userPrivacySettings.upsert({
        where: { userId: user.id },
        update: validatedData.privacy,
        create: {
          userId: user.id,
          ...validatedData.privacy,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Preferences updated successfully",
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid preference data",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error("Preferences update error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update preferences",
      },
      { status: 500 }
    );
  }
}
