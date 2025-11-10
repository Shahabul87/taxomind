import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  HttpStatus,
} from "@/lib/api-utils";
import { z } from "zod";

const preferencesSchema = z.object({
  viewMode: z.enum(["GRID", "LIST"]).default("LIST"),
  gridColumns: z.number().int().min(1).max(4).default(3),
  listDensity: z.enum(["COMPACT", "COMFORTABLE", "SPACIOUS"]).default("COMFORTABLE"),
  groupBy: z.enum(["DATE", "COURSE", "TYPE", "PRIORITY"]).default("DATE"),
  sortBy: z.enum(["DUE_DATE", "CREATED_DATE", "PRIORITY", "POINTS"]).default("DUE_DATE"),
  showCompleted: z.boolean().default(false),
  showCancelled: z.boolean().default(false),
  defaultDateRange: z.number().int().min(1).max(90).default(14),
});

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return errorResponse(
        ErrorCodes.UNAUTHORIZED,
        "Authentication required",
        HttpStatus.UNAUTHORIZED
      );
    }

    let preferences = await db.dashboardPreferences.findUnique({
      where: { userId: user.id },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await db.dashboardPreferences.create({
        data: { userId: user.id },
      });
    }

    return successResponse(preferences);
  } catch (error) {
    console.error("[PREFERENCES_GET]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to fetch preferences",
      HttpStatus.INTERNAL_ERROR
    );
  }
}

export async function PUT(req: NextRequest) {
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
    const validatedData = preferencesSchema.parse(body);

    const preferences = await db.dashboardPreferences.upsert({
      where: { userId: user.id },
      update: validatedData,
      create: {
        userId: user.id,
        ...validatedData,
      },
    });

    return successResponse(preferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        error.errors[0].message
      );
    }
    console.error("[PREFERENCES_PUT]", error);
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      "Failed to update preferences",
      HttpStatus.INTERNAL_ERROR
    );
  }
}
