import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';

/**
 * GET /api/messages/unread/count
 * Get count of unread messages for the current user
 */
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unreadCount = await db.message.count({
      where: {
        recipientId: session.user.id,
        read: false,
      },
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    logger.error("[MESSAGES_UNREAD_COUNT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
