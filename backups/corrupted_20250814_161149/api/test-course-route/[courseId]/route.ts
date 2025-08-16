import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';

// Force Node.js runtime for better compatibility
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const user = await currentUser();

    const testResult = {
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      courseId: courseId,
      userAuthenticated: !!user,
      userId: user?.id || null,
      routeWorking: true,
      message: "Dynamic course route is working correctly"
    };

    return NextResponse.json(testResult);
  } catch (error: any) {
    logger.error("[TEST_COURSE_ROUTE] Error:", error);
    
    return NextResponse.json({
      success: false,
      error: "Dynamic route test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 