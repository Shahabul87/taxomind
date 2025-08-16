import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    // Test if auth is working
    const session = await auth();
    
    // Test environment variables
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV || 'NOT_VERCEL',
    };

    // Test if we can access NextAuth providers
    let providersTest = 'UNKNOWN';
    try {
      // This should work if NextAuth is properly configured
      const response = await fetch(`${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/providers`, {
        method: 'GET',
      });
      providersTest = response.ok ? 'ACCESSIBLE' : `ERROR_${response.status}`;
    } catch (error) {
      providersTest = `FETCH_ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
    }

    return NextResponse.json({
      status: 'Auth Debug Test',
      timestamp: new Date().toISOString(),
      session: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        isOAuth: session.user?.isOAuth
      } : null,
      environment: envCheck,
      providersEndpoint: providersTest,
      recommendations: [
        !envCheck.GOOGLE_CLIENT_ID && 'Add GOOGLE_CLIENT_ID to environment variables',
        !envCheck.GOOGLE_CLIENT_SECRET && 'Add GOOGLE_CLIENT_SECRET to environment variables',
        !envCheck.AUTH_SECRET && 'Add AUTH_SECRET to environment variables',
        envCheck.NEXTAUTH_URL === 'NOT_SET' && 'Set NEXTAUTH_URL for production',
        envCheck.NEXT_PUBLIC_APP_URL === 'NOT_SET' && 'Set NEXT_PUBLIC_APP_URL for production',
      ].filter(Boolean)
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Auth test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 