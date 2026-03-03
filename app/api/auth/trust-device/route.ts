import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SessionManager } from '@/lib/security/session-manager';
import { headers } from 'next/headers';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

/**
 * Trust the current device for the authenticated user
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'heavy');
    if (rateLimitResponse) return rateLimitResponse;

    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const body = await req.json();
    const { deviceName } = body;

    // Get the session token from the request
    // This is a simplified approach - in a real implementation you might need to
    // extract the session token from the JWT or session store
    // Auth.js v5 uses 'authjs' prefix (with fallback for legacy)
    const sessionToken = req.cookies.get('authjs.session-token')?.value ||
                         req.cookies.get('__Secure-authjs.session-token')?.value ||
                         req.cookies.get('next-auth.session-token')?.value ||
                         req.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: 'Session token not found' }, 
        { status: 400 }
      );
    }

    // Trust the device
    const result = await SessionManager.trustDevice(
      sessionToken, 
      session.user.id,
      deviceName
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message || 'Failed to trust device' }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Device trusted successfully',
    });

  } catch (error) {
    console.error('Error trusting device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to trust device' }, 
      { status: 500 }
    );
  }
}