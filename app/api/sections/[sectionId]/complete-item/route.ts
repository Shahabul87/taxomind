import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { logger } from "@/lib/logger";

// Temporarily disabled - needs schema update for completedItems field
export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json(
      { error: "Feature temporarily disabled - under maintenance" },
      { status: 503 }
    );
  } catch (error) {
    logger.error('[SECTION_COMPLETE_ITEM] POST Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
