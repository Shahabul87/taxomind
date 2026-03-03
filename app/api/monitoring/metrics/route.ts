/**
 * Monitoring Metrics API Route
 * Provides system metrics and performance data
 */

import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { safeErrorResponse } from '@/lib/api/safe-error';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') ?? '1h';
    
    // Mock metrics data
    const metrics = {
      period,
      timestamp: new Date().toISOString(),
      system: {
        cpu: {
          usage: 45,
          cores: 8,
          loadAverage: [1.2, 1.5, 1.8]
        },
        memory: {
          used: 62,
          total: 100,
          available: 38
        },
        disk: {
          used: 75,
          total: 500,
          available: 125
        }
      },
      application: {
        requests: {
          total: 10000,
          rate: 50,
          errors: 12
        },
        responseTime: {
          average: 250,
          p95: 500,
          p99: 1000
        }
      }
    };

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    return safeErrorResponse(error, 500, 'MONITORING_METRICS');
  }
}