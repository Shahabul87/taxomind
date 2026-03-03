/**
 * Monitoring Incidents API Route
 * Manages system incidents and resolutions
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { safeErrorResponse } from '@/lib/api/safe-error';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResponse = await withRateLimit(request, 'readonly');
    if (rateLimitResponse) return rateLimitResponse;

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
    return safeErrorResponse(error, 500, 'MONITORING_INCIDENTS_GET');
  }
}

const UpdateIncidentSchema = z.object({
  incidentId: z.string().min(1, "Incident ID is required").max(100),
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved', 'acknowledged']),
  resolution: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const rateLimitResponse = await withRateLimit(request, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rawBody = await request.json();
    const validated = UpdateIncidentSchema.safeParse(rawBody);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { incidentId, status, resolution } = validated.data;

    // Mock incident update
    const updatedIncident = {
      id: incidentId,
      status,
      resolution,
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
    return safeErrorResponse(error, 500, 'MONITORING_INCIDENTS_POST');
  }
}