import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check exact env var values (lengths, not values for security)
    const envVarDetails = {
      GOOGLE_CLIENT_ID: {
        exists: !!process.env.GOOGLE_CLIENT_ID,
        length: process.env.GOOGLE_CLIENT_ID?.length || 0,
        isEmpty: process.env.GOOGLE_CLIENT_ID === '',
        startsWithCorrectPrefix: process.env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com') || false,
      },
      GOOGLE_CLIENT_SECRET: {
        exists: !!process.env.GOOGLE_CLIENT_SECRET,
        length: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
        isEmpty: process.env.GOOGLE_CLIENT_SECRET === '',
      },
      GITHUB_CLIENT_ID: {
        exists: !!process.env.GITHUB_CLIENT_ID,
        length: process.env.GITHUB_CLIENT_ID?.length || 0,
        isEmpty: process.env.GITHUB_CLIENT_ID === '',
      },
      GITHUB_CLIENT_SECRET: {
        exists: !!process.env.GITHUB_CLIENT_SECRET,
        length: process.env.GITHUB_CLIENT_SECRET?.length || 0,
        isEmpty: process.env.GITHUB_CLIENT_SECRET === '',
      },
      AUTH_SECRET: {
        exists: !!process.env.AUTH_SECRET,
        length: process.env.AUTH_SECRET?.length || 0,
        isEmpty: process.env.AUTH_SECRET === '',
      },
      NEXTAUTH_SECRET: {
        exists: !!process.env.NEXTAUTH_SECRET,
        length: process.env.NEXTAUTH_SECRET?.length || 0,
        isEmpty: process.env.NEXTAUTH_SECRET === '',
      },
    };

    // Check next-auth version
    let nextAuthVersion = 'UNKNOWN';
    try {
      const nextAuthPackage = await import('next-auth/package.json');
      nextAuthVersion = nextAuthPackage.version || 'UNKNOWN';
    } catch {
      try {
        // Alternative way to check version
        const fs = await import('fs');
        const path = await import('path');
        const packagePath = path.join(process.cwd(), 'node_modules/next-auth/package.json');
        if (fs.existsSync(packagePath)) {
          const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
          nextAuthVersion = pkg.version;
        }
      } catch {
        nextAuthVersion = 'COULD_NOT_DETERMINE';
      }
    }

    // Test provider initialization
    let providerTest = {
      google: 'UNKNOWN',
      github: 'UNKNOWN',
    };

    try {
      const Google = (await import('next-auth/providers/google')).default;
      const googleProvider = Google({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      });
      providerTest.google = googleProvider ? 'INITIALIZED' : 'FAILED';
    } catch (error) {
      providerTest.google = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    try {
      const Github = (await import('next-auth/providers/github')).default;
      const githubProvider = Github({
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      });
      providerTest.github = githubProvider ? 'INITIALIZED' : 'FAILED';
    } catch (error) {
      providerTest.github = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    // Check auth.config.ts import
    let authConfigTest = 'UNKNOWN';
    try {
      const authConfig = await import('@/auth.config');
      const providersCount = authConfig.default?.providers?.length || 0;
      authConfigTest = `LOADED_WITH_${providersCount}_PROVIDERS`;
    } catch (error) {
      authConfigTest = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    // Check the auth.ts full configuration
    let authTest = 'UNKNOWN';
    try {
      const auth = await import('@/auth');
      authTest = auth.handlers ? 'HANDLERS_AVAILABLE' : 'HANDLERS_MISSING';
    } catch (error) {
      authTest = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    return NextResponse.json({
      status: 'Deep Auth Configuration Check',
      timestamp: new Date().toISOString(),
      nextAuthVersion,
      envVarDetails,
      providerTest,
      authConfigTest,
      authTest,
      diagnosis: {
        hasValidGoogleConfig:
          envVarDetails.GOOGLE_CLIENT_ID.exists &&
          !envVarDetails.GOOGLE_CLIENT_ID.isEmpty &&
          envVarDetails.GOOGLE_CLIENT_ID.length > 10 &&
          envVarDetails.GOOGLE_CLIENT_SECRET.exists &&
          !envVarDetails.GOOGLE_CLIENT_SECRET.isEmpty &&
          envVarDetails.GOOGLE_CLIENT_SECRET.length > 10,
        hasValidGithubConfig:
          envVarDetails.GITHUB_CLIENT_ID.exists &&
          !envVarDetails.GITHUB_CLIENT_ID.isEmpty &&
          envVarDetails.GITHUB_CLIENT_ID.length > 10 &&
          envVarDetails.GITHUB_CLIENT_SECRET.exists &&
          !envVarDetails.GITHUB_CLIENT_SECRET.isEmpty &&
          envVarDetails.GITHUB_CLIENT_SECRET.length > 10,
        hasValidAuthSecret:
          (envVarDetails.AUTH_SECRET.exists && !envVarDetails.AUTH_SECRET.isEmpty) ||
          (envVarDetails.NEXTAUTH_SECRET.exists && !envVarDetails.NEXTAUTH_SECRET.isEmpty),
        versionMismatch: nextAuthVersion !== '5.0.0-beta.25',
        recommendedVersion: '5.0.0-beta.25',
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'Deep Auth Config Error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
