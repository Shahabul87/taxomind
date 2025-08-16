import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    
    // Test multiple NextAuth endpoints
    const endpoints = [
      '/api/auth/providers',
      '/api/auth/csrf',
      '/api/auth/session',
      '/api/auth/signin',
    ];

    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const testUrl = `${baseUrl}${endpoint}`;
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'NextAuth-Debug/1.0',
          },
        });
        
        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          accessible: response.ok,
          testUrl,
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'ERROR',
          error: error instanceof Error ? error.message : 'Unknown error',
          accessible: false,
        });
      }
    }

    return NextResponse.json({
      status: 'NextAuth Routes Test',
      timestamp: new Date().toISOString(),
      baseUrl,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      },
      results,
      summary: {
        totalEndpoints: endpoints.length,
        accessibleEndpoints: results.filter(r => r.accessible).length,
        failedEndpoints: results.filter(r => !r.accessible).length,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'NextAuth routes test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 