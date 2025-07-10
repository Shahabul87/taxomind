import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { badgeService } from "@/lib/badge/service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { triggerEvent } = await request.json();

    if (!triggerEvent) {
      return NextResponse.json(
        { error: "Trigger event is required" },
        { status: 400 }
      );
    }

    const awardedBadges = await badgeService.checkAndAwardBadges(
      session.user.id,
      triggerEvent
    );

    return NextResponse.json({
      success: true,
      awardedBadges,
      count: awardedBadges.length
    });

  } catch (error) {
    console.error("Badge check API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}