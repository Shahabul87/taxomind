/**
 * Alerts API Route
 * Manage monitoring alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { monitoring } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const alertManager = monitoring.getComponents().alerts;
    
    if (status === 'active') {
      const alerts = alertManager.getActiveAlerts();
      return NextResponse.json(alerts);
    } else if (status === 'history') {
      const startTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      const endTime = new Date();
      const alerts = await alertManager.getAlertHistory(startTime, endTime);
      return NextResponse.json(alerts);
    } else {
      const stats = await alertManager.getAlertStatistics();
      return NextResponse.json(stats);
    }
  } catch (error) {
    console.error('Alerts API error: ', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { action, alertId } = body;
    
    const alertManager = monitoring.getComponents().alerts;
    const userId = session.user.id!;
    
    switch (action) {
      case 'acknowledge':
        await alertManager.acknowledgeAlert(alertId, userId);
        return NextResponse.json({ success: true, message: 'Alert acknowledged' });
        
      case 'resolve':
        await alertManager.resolveAlert(alertId, userId);
        return NextResponse.json({ success: true, message: 'Alert resolved' });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Alert action error: ', error);
    return NextResponse.json(
      {
        error: 'Failed to perform alert action',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}