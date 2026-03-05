import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
// UserRole removed - users no longer have roles

/**
 * Get security alerts for the authenticated user (or admin)
 */
export async function GET(req: NextRequest) {
  try {
    // Get current session
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');

    // Build where condition
    let whereCondition: any = {};

    // For regular users, only show their own security events
    // For admins, show all events
    // Check if user is admin - admins are now in AdminAccount table
    const adminAccount = await db.adminAccount.findUnique({
      where: { id: session.user.id },
    });
    const isAdmin = adminAccount?.role === 'ADMIN' || adminAccount?.role === 'SUPERADMIN';

    if (!isAdmin) {
      whereCondition.affectedUsers = {
        has: session.user.id,
      };
    }

    if (severity) {
      whereCondition.severity = severity;
    }

    if (status) {
      whereCondition.status = status;
    }

    if (eventType) {
      whereCondition.eventType = eventType;
    }

    // Get security events
    const events = await db.securityEvent.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        eventType: true,
        severity: true,
        source: true,
        description: true,
        details: true,
        affectedUsers: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
    });

    // Get total count for pagination
    const total = await db.securityEvent.count({
      where: whereCondition,
    });

    // Filter sensitive information for non-admin users
    const filteredEvents = events.map(event => {
      if (!isAdmin) {
        return {
          ...event,
          affectedUsers: undefined, // Hide other affected users
          details: {
            ...(event.details as Record<string, any>),
            sessionId: undefined, // Hide session IDs
            fingerprintHash: undefined, // Hide fingerprint details
          },
        };
      }
      return event;
    });

    return NextResponse.json({
      success: true,
      events: filteredEvents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    logger.error('Error getting security alerts', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get security alerts' }, 
      { status: 500 }
    );
  }
}

/**
 * Create a new security alert (internal use)
 */
export async function POST(req: NextRequest) {
  try {
    // Get current session - only admins can create security events manually
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is admin - admins are now in AdminAccount table
    const adminAccount = await db.adminAccount.findUnique({
      where: { id: session.user.id },
    });

    if (!adminAccount || (adminAccount.role !== 'ADMIN' && adminAccount.role !== 'SUPERADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { 
      eventType, 
      severity, 
      source, 
      description, 
      details, 
      affectedUsers 
    } = body;

    if (!eventType || !severity || !description) {
      return NextResponse.json(
        { success: false, error: 'Event type, severity, and description are required' }, 
        { status: 400 }
      );
    }

    // Create security event
    const securityEvent = await db.securityEvent.create({
      data: {
        eventType,
        severity,
        source: source || 'MANUAL',
        description,
        details: details || {},
        affectedUsers: affectedUsers || [],
        status: 'OPEN',
      },
    });

    return NextResponse.json({
      success: true,
      event: securityEvent,
    });

  } catch (error) {
    logger.error('Error creating security alert', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create security alert' }, 
      { status: 500 }
    );
  }
}