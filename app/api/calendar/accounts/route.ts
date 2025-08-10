import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check for Google account connection
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        accounts: {
          where: { provider: "google" },
          select: { id: true, provider: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const hasGoogleAccount = user.accounts.some(acc => acc.provider === "google");

    return NextResponse.json({
      hasGoogleAccount,
    });
  } catch (error) {
    logger.error("[CALENDAR_ACCOUNTS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 