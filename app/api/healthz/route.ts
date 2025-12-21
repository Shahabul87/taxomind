import { NextResponse } from 'next/server';

/**
 * Simple liveness probe - confirms the application is running
 * Does NOT check database or external services
 * Use for Railway/Kubernetes healthchecks during startup
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 }
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
