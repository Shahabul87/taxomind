import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      // Don't expose actual values, just check their format
      googleClientIdFormat: process.env.GOOGLE_CLIENT_ID ? 
        (process.env.GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com') ? 'VALID' : 'INVALID') : 'MISSING',
      authSecretLength: process.env.AUTH_SECRET?.length || 0,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      status: 'OAuth Configuration Check',
      config,
      allRequiredPresent: config.hasGoogleClientId && 
                         config.hasGoogleClientSecret && 
                         (config.hasAuthSecret || config.hasNextAuthSecret)
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check OAuth configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 