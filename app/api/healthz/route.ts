import { NextResponse } from 'next/server';

/**
 * Simple liveness probe - confirms the application is running
 * Does NOT check database or external services
 * Use for Railway/Kubernetes healthchecks during startup
 */
export async function GET() {
  try {
    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[HEALTHZ] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function HEAD() {
  try {
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('[HEALTHZ] HEAD Error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
