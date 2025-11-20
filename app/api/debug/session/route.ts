import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { currentUser } from '@/lib/auth';

export async function GET() {
  try {
    // Check raw auth session
    const session = await auth();

    // Check currentUser function
    const user = await currentUser();

    return NextResponse.json({
      hasRawSession: !!session,
      hasSessionUser: !!session?.user,
      sessionUserId: session?.user?.id || null,
      hasCurrentUser: !!user,
      currentUserId: user?.id || null,
      currentUserEmail: user?.email || null,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
