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
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 