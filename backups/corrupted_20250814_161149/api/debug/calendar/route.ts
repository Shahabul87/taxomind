import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    const isAuthenticated = !!session?.user?.id;
    
    // Test database connection by getting the count of calendar events
    let dbConnected = false;
    let eventCount = 0;
    let errorMessage = null;
    
    try {
      if (isAuthenticated) {
        const count = await db.calendarEvent.count({
          where: {
            userId: session.user.id,
          },
        });
        eventCount = count;
        dbConnected = true;
      } else {
        // Check DB connection without using the user session
        await db.$queryRaw`SELECT 1`;
        dbConnected = true;
      }
    } catch (dbError) {
      logger.error("Database connection error:", dbError);
      errorMessage = dbError instanceof Error ? dbError.message : "Unknown database error";
      dbConnected = false;
    }

    return NextResponse.json({
      success: true,
      status: {
        isAuthenticated,
        sessionUserId: session?.user?.id || null,
        dbConnected,
        eventCount: isAuthenticated ? eventCount : null,
        prismaVersion: "unknown",
      },
      error: errorMessage,
    });

  } catch (error: any) {
    logger.error("Debug route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 