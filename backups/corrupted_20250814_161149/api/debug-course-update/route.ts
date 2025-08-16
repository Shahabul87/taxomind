import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      runtime: 'nodejs',
      checks: {}
    };

    // Check 1: Authentication
    try {
      const session = await auth();
      diagnostics.checks.auth = {
        success: true,
        hasSession: !!session,
        hasUserId: !!session?.user?.id,
        userId: session?.user?.id || null
      };
    } catch (authError: any) {
      diagnostics.checks.auth = {
        success: false,
        error: authError.message
      };
    }

    // Check 2: Database connection
    try {
      await db.$connect();
      const courseCount = await db.course.count();
      diagnostics.checks.database = {
        success: true,
        connected: true,
        courseCount
      };
    } catch (dbError: any) {
      diagnostics.checks.database = {
        success: false,
        error: dbError.message
      };
    }

    // Check 3: Environment variables
    diagnostics.checks.environment = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      publicAppUrl: process.env.NEXT_PUBLIC_APP_URL
    };

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const courseId = body.courseId || '0de92129-c605-4d0e-80c3-2d44790a501b';
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      courseId,
      checks: {}
    };

    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      diagnostics.checks.auth = { success: false, message: 'No authentication' };
      return NextResponse.json(diagnostics, { status: 401 });
    }

    diagnostics.checks.auth = { success: true, userId: session.user.id };

    // Check if course exists
    try {
      const course = await db.course.findUnique({
        where: { id: courseId }
      });
      
      diagnostics.checks.courseExists = {
        success: !!course,
        found: !!course,
        belongsToUser: course?.userId === session.user.id
      };

      if (course) {
        diagnostics.checks.courseDetails = {
          id: course.id,
          title: course.title,
          userId: course.userId,
          createdAt: course.createdAt
        };
      }
    } catch (dbError: any) {
      diagnostics.checks.courseExists = {
        success: false,
        error: dbError.message
      };
    }

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 