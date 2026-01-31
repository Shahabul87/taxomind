import { NextResponse } from 'next/server';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

export async function GET() {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    // Test if we can import the auth handlers
    let handlersStatus = 'UNKNOWN';
    let authStatus = 'UNKNOWN';
    let configStatus = 'UNKNOWN';
    
    try {
      const { handlers } = await import('@/auth');
      handlersStatus = handlers ? 'AVAILABLE' : 'MISSING';
    } catch (error) {
      handlersStatus = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    try {
      const { auth } = await import('@/auth');
      authStatus = typeof auth === 'function' ? 'AVAILABLE' : 'MISSING';
    } catch (error) {
      authStatus = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    try {
      const authConfig = await import('@/auth.config');
      configStatus = authConfig.default ? 'AVAILABLE' : 'MISSING';
    } catch (error) {
      configStatus = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    // Test if the NextAuth route file exists and is properly configured
    let routeFileStatus = 'UNKNOWN';
    try {
      const routeHandlers = await import('@/app/api/auth/[...nextauth]/route');
      routeFileStatus = (typeof routeHandlers.GET === 'function' && typeof routeHandlers.POST === 'function') ? 'AVAILABLE' : 'PARTIAL';
    } catch (error) {
      routeFileStatus = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    return NextResponse.json({
      status: 'NextAuth Handlers Test',
      timestamp: new Date().toISOString(),
      tests: {
        authHandlers: handlersStatus,
        authFunction: authStatus,
        authConfig: configStatus,
        routeFile: routeFileStatus,
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        runtime: process.env.VERCEL_FUNCTION_REGION || 'unknown',
      },
      recommendations: [
        handlersStatus.includes('ERROR') && 'Check auth.ts file for export issues',
        authStatus.includes('ERROR') && 'Check auth function export',
        configStatus.includes('ERROR') && 'Check auth.config.ts file',
        routeFileStatus.includes('ERROR') && 'Check /api/auth/[...nextauth]/route.ts file',
      ].filter(Boolean)
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Auth handlers test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 