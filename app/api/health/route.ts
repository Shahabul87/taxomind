import { NextResponse } from 'next/server';
import { enterpriseDataAPI } from '@/lib/data-fetching/enterprise-data-api';

export async function GET() {
  try {
    // Perform health check using enterprise API
    const healthResult = await enterpriseDataAPI.healthCheck();
    
    if (!healthResult.success) {
      return NextResponse.json({
        status: 'error',
        message: 'Health check failed',
        error: healthResult.error,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'healthy',
      data: healthResult.data,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[HEALTH_CHECK] Error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}