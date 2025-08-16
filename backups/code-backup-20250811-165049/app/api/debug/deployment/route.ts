import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if we can import NextAuth components
    let nextAuthImportStatus = 'UNKNOWN';
    let handlersStatus = 'UNKNOWN';
    let authFileStatus = 'UNKNOWN';
    
    try {
      // Test if we can import from auth.ts
      const { handlers, auth } = await import('@/auth');
      authFileStatus = 'IMPORTED_SUCCESS';
      handlersStatus = handlers ? 'AVAILABLE' : 'MISSING';
    } catch (importError) {
      authFileStatus = `IMPORT_ERROR: ${importError instanceof Error ? importError.message : 'Unknown'}`;
    }

    try {
      // Test if NextAuth is available
      const NextAuth = await import('next-auth');
      nextAuthImportStatus = NextAuth ? 'AVAILABLE' : 'MISSING';
    } catch (nextAuthError) {
      nextAuthImportStatus = `ERROR: ${nextAuthError instanceof Error ? nextAuthError.message : 'Unknown'}`;
    }

    // Check file system (if possible)
    let fileSystemCheck = 'UNKNOWN';
    try {
      const fs = await import('fs');
      const path = await import('path');
      const authRoutePath = path.join(process.cwd(), 'app/api/auth/[...nextauth]/route.ts');
      fileSystemCheck = fs.existsSync(authRoutePath) ? 'ROUTE_FILE_EXISTS' : 'ROUTE_FILE_MISSING';
    } catch (fsError) {
      fileSystemCheck = `FS_ERROR: ${fsError instanceof Error ? fsError.message : 'Unknown'}`;
    }

    // Runtime information
    const runtimeInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      vercelUrl: process.env.VERCEL_URL,
    };

    // Environment variables check
    const envCheck = {
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    };

    return NextResponse.json({
      status: 'Deployment Debug Check',
      timestamp: new Date().toISOString(),
      checks: {
        nextAuthImport: nextAuthImportStatus,
        authFileImport: authFileStatus,
        handlersAvailable: handlersStatus,
        fileSystem: fileSystemCheck,
      },
      runtime: runtimeInfo,
      environment: envCheck,
      recommendations: [
        ...(authFileStatus.includes('ERROR') ? ['Auth file import failed - check build process'] : []),
        ...(handlersStatus === 'MISSING' ? ['NextAuth handlers not available'] : []),
        ...(fileSystemCheck.includes('MISSING') ? ['Route file missing from build'] : []),
      ]
    });

  } catch (error) {
    return NextResponse.json({
      status: 'Deployment Debug Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 