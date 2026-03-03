import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    
    return NextResponse.json({
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userId: session?.user?.id || null,
      userEmail: session?.user?.email || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AUTH_TEST]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({
      error: true,
      message: 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 