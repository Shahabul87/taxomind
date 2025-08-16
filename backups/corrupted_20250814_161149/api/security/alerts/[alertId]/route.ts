import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

interface RouteParams {
  params: {
    alertId: string;
  };
}

/**
 * Mark a security alert as resolved
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const { alertId } = params;
    const body = await req.json();
    const { status, resolution } = body;

    if (!alertId || !status) {
      return NextResponse.json(
        { success: false, error: 'Alert ID and status are required' }, 
        { status: 400 }
      );
    }

    // Get the alert first to check permissions
    const alert = await db.securityEvent.findUnique({
      where: { id: alertId },
      select: {
        id: true,
        affectedUsers: true,
        status: true,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' }, 
        { status: 404 }
      );
    }

    // Check permissions - users can only resolve their own alerts, admins can resolve any
    const affectedUsers = Array.isArray(alert.affectedUsers) ? alert.affectedUsers : [];
    const canResolve = session.user.role === UserRole.ADMIN || 
                      affectedUsers.includes(session.user.id);

    if (!canResolve) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' }, 
        { status: 403 }
      );
    }

    // Update the alert
    const updatedAlert = await db.securityEvent.update({
      where: { id: alertId },
      data: {
        status,
        resolvedAt: status === 'RESOLVED' ? new Date() : null,
        details: {
          ...(alert as any).details,
          resolution: resolution || null,
          resolvedBy: session.user.id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      alert: updatedAlert,
    });

  } catch (error) {
    console.error('Error resolving security alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve security alert' }, 
      { status: 500 }
    );
  }
}

/**
 * Get details of a specific security alert
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const { alertId } = params;

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: 'Alert ID required' }, 
        { status: 400 }
      );
    }

    // Get the alert
    const alert = await db.securityEvent.findUnique({
      where: { id: alertId },
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Alert not found' }, 
        { status: 404 }
      );
    }

    // Check permissions
    const affectedUsers = Array.isArray(alert.affectedUsers) ? alert.affectedUsers : [];
    const canView = session.user.role === UserRole.ADMIN || 
                   affectedUsers.includes(session.user.id);

    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' }, 
        { status: 403 }
      );
    }

    // Filter sensitive information for non-admin users
    let filteredAlert = alert;
    if (session.user.role !== UserRole.ADMIN) {
      filteredAlert = {
        ...alert,
        affectedUsers: [session.user.id], // Only show self
        details: {
          ...alert.details,
          sessionId: undefined,
          fingerprintHash: undefined,
        },
      };
    }

    return NextResponse.json({
      success: true,
      alert: filteredAlert,
    });

  } catch (error) {
    console.error('Error getting security alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get security alert' }, 
      { status: 500 }
    );
  }
}