import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    auth: {
      status: "unknown",
      hasSession: false,
      userId: null as string | null,
      error: null as string | null,
    },
    database: {
      status: "unknown",
      connectionTest: false,
      eventCount: 0,
      error: null as string | null,
    },
    environment: {
      nodejs: process.version,
      nextjs: process.env.NEXT_RUNTIME || "unknown",
    }
  };

  // Check auth
  try {
    const session = await auth();
    debugInfo.auth.status = "success";
    debugInfo.auth.hasSession = !!session;
    debugInfo.auth.userId = session?.user?.id || null;
  } catch (error: any) {
    debugInfo.auth.status = "error";
    debugInfo.auth.error = error instanceof Error ? error.message : "Unknown auth error";
  }

  // Check database
  try {
    // Test basic connectivity
    await db.$queryRaw`SELECT 1 as test`;
    debugInfo.database.connectionTest = true;
    debugInfo.database.status = "connected";

    // If auth succeeded, check events
    if (debugInfo.auth.userId) {
      const eventCount = await db.calendarEvent.count({
        where: {
          userId: debugInfo.auth.userId as string,
        },
      });
      debugInfo.database.eventCount = eventCount;
    }
  } catch (error: any) {
    debugInfo.database.status = "error";
    debugInfo.database.error = error instanceof Error ? error.message : "Unknown database error";
  }

  return NextResponse.json(debugInfo);
} 