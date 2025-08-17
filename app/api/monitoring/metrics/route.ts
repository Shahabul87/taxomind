/**
 * Metrics API Route
 * Provides access to application metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MetricsAggregator } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'admin';
    
    // Check permissions
    if (role === 'admin' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const metrics = await MetricsAggregator.getDashboardMetrics(role as any);
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Metrics API error: ', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}