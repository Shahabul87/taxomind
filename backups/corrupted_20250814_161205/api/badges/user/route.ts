import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { badgeService } from "@/lib/badge/service";
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const badges = await badgeService.getUserBadges(session.user.id);

    return NextResponse.json({
      success: true,
      badges
    });

  } catch (error: any) {
    logger.error("Get user badges API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}