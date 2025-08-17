/**
 * Incidents API Route
 * Manage monitoring incidents
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
    const incidentId = searchParams.get('id');
    const status = searchParams.get('status');
    
    const incidentManager = monitoring.getComponents().incidents;
    
    if (incidentId) {
      const incident = incidentManager.getIncident(incidentId);
      
      if (!incident) {
        return NextResponse.json(
          { error: 'Incident not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(incident);
    } else if (status === 'active') {
      const incidents = incidentManager.getActiveIncidents();
      return NextResponse.json(incidents);
    } else {
      const stats = incidentManager.getIncidentStatistics();
      return NextResponse.json(stats);
    }
  } catch (error) {
    console.error('Incidents API error: ', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch incidents',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}