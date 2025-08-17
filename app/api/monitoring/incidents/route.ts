/**
 * Monitoring Incidents API Route
 * Manages system incidents and resolutions
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

    // Mock incidents data
    const incidents = [
      {
        id: '1',
        title: 'Database Connection Timeout',
        description: 'Multiple timeouts observed in database connections',
        severity: 'high',
        status: 'investigating',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({ incidents }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch incidents',
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

    const body = await request.json() as { 
      incidentId: string;
      status: string;
      resolution?: string;
    };
    
    // Mock incident update
    const updatedIncident = {
      id: body.incidentId,
      status: body.status,
      resolution: body.resolution,
      updatedBy: session.user.id,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(
      { 
        success: true,
        incident: updatedIncident
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to update incident',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}