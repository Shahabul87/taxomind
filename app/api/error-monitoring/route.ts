import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Log to database
    await db.errorLog.create({
      data: {
        message: errorData.message,
        stack: errorData.stack,
        componentStack: errorData.componentStack,
        level: errorData.level || 'error',
        timestamp: new Date(errorData.timestamp),
        userAgent: errorData.userAgent,
        url: errorData.url,
        userId: errorData.userId !== 'anonymous' ? errorData.userId : null,
        errorId: errorData.errorId,
        context: errorData.context,
        metadata: {
          retryCount: errorData.retryCount || 0,
          sessionId: errorData.sessionId,
          buildVersion: process.env.BUILD_VERSION || 'unknown'
        }
      }
    });

    // Create alert for critical errors
    if (errorData.level === 'critical') {
      await db.errorAlert.create({
        data: {
          type: 'CRITICAL_ERROR',
          message: `Critical error: ${errorData.message}`,
          isResolved: false,
          metadata: {
            errorId: errorData.errorId,
            url: errorData.url,
            userId: errorData.userId
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging failed:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}