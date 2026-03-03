import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SessionManager } from '@/lib/security/session-manager';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

interface RouteParams {
  params: {
    deviceId: string;
  };
}

/**
 * Revoke trust for a specific device
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const { deviceId } = params;

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID required' }, 
        { status: 400 }
      );
    }

    // Revoke device trust
    const result = await SessionManager.revokeTrustedDevice(session.user.id, deviceId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message || 'Failed to revoke device trust' }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Device trust revoked successfully',
    });

  } catch (error) {
    console.error('Error revoking device trust:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke device trust' }, 
      { status: 500 }
    );
  }
}

/**
 * Update device information (name, etc.)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const { deviceId } = params;
    const body = await req.json();
    const { name } = body;

    if (!deviceId || !name) {
      return NextResponse.json(
        { success: false, error: 'Device ID and name required' }, 
        { status: 400 }
      );
    }

    // Update device name in the database
    // This is a simplified implementation - you might want to add more validation
    const { db } = await import('@/lib/db');
    
    const updateResult = await db.authSession.updateMany({
      where: {
        userId: session.user.id,
        deviceId,
        isTrustedDevice: true,
      },
      data: {
        deviceName: name,
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Device not found or not trusted' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Device name updated successfully',
    });

  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update device' }, 
      { status: 500 }
    );
  }
}