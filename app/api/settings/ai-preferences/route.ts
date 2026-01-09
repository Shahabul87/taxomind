/**
 * AI Preferences API Route
 * GET: Returns user's AI provider preferences
 * PUT: Updates user's AI provider preferences
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Validation schema for AI preferences
const AIPreferencesSchema = z.object({
  preferredChatProvider: z.string().nullable().optional(),
  preferredCourseProvider: z.string().nullable().optional(),
  preferredAnalysisProvider: z.string().nullable().optional(),
  preferredCodeProvider: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's AI preferences
    const preferences = await db.userAIPreferences.findUnique({
      where: { userId: user.id },
      select: {
        preferredChatProvider: true,
        preferredCourseProvider: true,
        preferredAnalysisProvider: true,
        preferredCodeProvider: true,
      },
    });

    // Return defaults if no preferences exist
    if (!preferences) {
      return NextResponse.json({
        preferredChatProvider: "anthropic",
        preferredCourseProvider: "anthropic",
        preferredAnalysisProvider: "anthropic",
        preferredCodeProvider: "anthropic",
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[AI_PREFERENCES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  console.log("[AI_PREFERENCES_PUT] Request received");
  try {
    const user = await currentUser();
    console.log("[AI_PREFERENCES_PUT] User:", user?.id ? "authenticated" : "not authenticated");

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("[AI_PREFERENCES_PUT] Body:", body);
    const validatedData = AIPreferencesSchema.parse(body);
    console.log("[AI_PREFERENCES_PUT] Validated data:", validatedData);

    // Check if preferences exist
    console.log("[AI_PREFERENCES_PUT] Checking for existing preferences...");
    const existingPrefs = await db.userAIPreferences.findUnique({
      where: { userId: user.id },
    });
    console.log("[AI_PREFERENCES_PUT] Existing preferences:", existingPrefs ? "found" : "not found");

    let preferences;

    if (existingPrefs) {
      console.log("[AI_PREFERENCES_PUT] Updating existing preferences...");
      // Update existing preferences
      preferences = await db.userAIPreferences.update({
        where: { userId: user.id },
        data: {
          preferredChatProvider: validatedData.preferredChatProvider,
          preferredCourseProvider: validatedData.preferredCourseProvider,
          preferredAnalysisProvider: validatedData.preferredAnalysisProvider,
          preferredCodeProvider: validatedData.preferredCodeProvider,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new preferences with all required defaults
      console.log("[AI_PREFERENCES_PUT] Creating new preferences...");
      preferences = await db.userAIPreferences.create({
        data: {
          id: `ai_pref_${user.id}_${Date.now()}`,
          userId: user.id,
          defaultModel: "claude-3-5-sonnet-20241022",
          temperature: 0.7,
          maxTokens: 2000,
          tone: "professional",
          complexity: "intermediate",
          includeExamples: true,
          includeReferences: false,
          notifyOnCompletion: true,
          emailSummaries: false,
          preferredChatProvider: validatedData.preferredChatProvider ?? "anthropic",
          preferredCourseProvider: validatedData.preferredCourseProvider ?? "anthropic",
          preferredAnalysisProvider: validatedData.preferredAnalysisProvider ?? "anthropic",
          preferredCodeProvider: validatedData.preferredCodeProvider ?? "anthropic",
          updatedAt: new Date(),
        },
      });
    }

    console.log("[AI_PREFERENCES_PUT] Success! Preferences saved:", preferences.id);
    return NextResponse.json({
      success: true,
      preferences: {
        preferredChatProvider: preferences.preferredChatProvider,
        preferredCourseProvider: preferences.preferredCourseProvider,
        preferredAnalysisProvider: preferences.preferredAnalysisProvider,
        preferredCodeProvider: preferences.preferredCodeProvider,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("[AI_PREFERENCES_PUT] Full error:", error);
    if (error instanceof Error) {
      console.error("[AI_PREFERENCES_PUT] Stack:", error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
