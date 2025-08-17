/**
 * Health Check API Route
 * Provides application health status
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleHealthCheck, handleLivenessProbe, handleReadinessProbe } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const detailed = searchParams.get('detailed') === 'true';
    
    let response;
    
    switch (type) {
      case 'liveness':
        response = await handleLivenessProbe();
        break;
        
      case 'readiness':
        response = await handleReadinessProbe();
        break;
        
      default:
        response = await handleHealthCheck(detailed);
        break;
    }
    
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    console.error('Health check error: ', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
        error: (error as Error).message,
      },
      { status: 503 }
    );
  }
}