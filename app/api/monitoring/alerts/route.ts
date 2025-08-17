/**
 * Monitoring Alerts API Route
 * Manages system alerts and notifications
 */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock alerts data
    const alerts = [
      {
        id: '1',
        type: 'warning',
        title: 'High Memory Usage',
        message: 'Server memory usage above 80%',
        timestamp: new Date().toISOString(),
        severity: 'medium',
        resolved: false
      },
      {
        id: '2',
        type: 'info',
        title: 'Scheduled Maintenance',
        message: 'System maintenance scheduled for tonight',
        timestamp: new Date().toISOString(),
        severity: 'low',
        resolved: false
      }
    ];

    return NextResponse.json({ alerts }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as { alertId: string };
    const { alertId } = body;

    // Mock alert resolution
    const resolvedAlert = {
      id: alertId,
      resolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy: session.user.id
    };

    return NextResponse.json(
      { 
        success: true,
        alert: resolvedAlert
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to resolve alert',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}