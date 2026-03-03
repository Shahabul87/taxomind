/**
 * Monitoring Dashboards API Route
 * Provides dashboard configurations and data
 */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { safeErrorResponse } from '@/lib/api/safe-error';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock dashboard data
    const dashboards = [
      {
        id: '1',
        name: 'System Overview',
        widgets: [
          { id: 'w1', type: 'metric', title: 'CPU Usage', value: 45 },
          { id: 'w2', type: 'metric', title: 'Memory Usage', value: 62 },
          { id: 'w3', type: 'chart', title: 'Request Rate', data: [] }
        ]
      }
    ];

    return NextResponse.json({ dashboards }, { status: 200 });
  } catch (error) {
    return safeErrorResponse(error, 500, 'MONITORING_DASHBOARDS_GET');
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

    const body = await request.json() as { name: string; widgets: unknown[] };
    
    // Mock dashboard creation
    const newDashboard = {
      id: Date.now().toString(),
      name: body.name,
      widgets: body.widgets,
      createdBy: session.user.id,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(
      { 
        success: true,
        dashboard: newDashboard
      },
      { status: 201 }
    );
  } catch (error) {
    return safeErrorResponse(error, 500, 'MONITORING_DASHBOARDS_POST');
  }
}