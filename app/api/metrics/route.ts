import { NextRequest, NextResponse } from 'next/server';
import { metricsRegistry } from '@/lib/observability/metrics';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  // Check for metrics authorization token if in production
  if (process.env.NODE_ENV === 'production') {
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.METRICS_AUTH_TOKEN;
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  try {
    // Get metrics in Prometheus format
    const metrics = await metricsRegistry.metrics();
    
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': metricsRegistry.contentType,
      },
    });
  } catch (error) {
    logger.error('Error collecting metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}