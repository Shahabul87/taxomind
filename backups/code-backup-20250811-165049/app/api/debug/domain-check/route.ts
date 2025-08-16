import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const currentDomain = `${url.protocol}//${url.host}`;
    
    // Check if we're accessing via the configured domain
    const configuredDomain = process.env.NEXTAUTH_URL;
    const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    const domainMatch = currentDomain === configuredDomain;
    const publicUrlMatch = currentDomain === publicAppUrl;
    
    // Test if we can access the configured domain
    let domainAccessible = false;
    let domainError = null;
    
    if (configuredDomain && configuredDomain !== currentDomain) {
      try {
        const response = await fetch(`${configuredDomain}/api/debug/oauth-config`, {
          method: 'GET',
          headers: {
            'User-Agent': 'Domain-Check/1.0',
          },
        });
        domainAccessible = response.ok;
        if (!response.ok) {
          domainError = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch (error) {
        domainError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return NextResponse.json({
      status: 'Domain Configuration Check',
      timestamp: new Date().toISOString(),
      currentRequest: {
        domain: currentDomain,
        host: url.host,
        protocol: url.protocol,
      },
      configuration: {
        NEXTAUTH_URL: configuredDomain,
        NEXT_PUBLIC_APP_URL: publicAppUrl,
      },
      domainMatching: {
        nextAuthUrlMatch: domainMatch,
        publicUrlMatch: publicUrlMatch,
        allMatch: domainMatch && publicUrlMatch,
      },
      domainAccessibility: {
        configuredDomainAccessible: domainAccessible,
        error: domainError,
        tested: configuredDomain !== currentDomain,
      },
      headers: {
        host: request.headers.get('host'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        'x-vercel-deployment-url': request.headers.get('x-vercel-deployment-url'),
      },
      recommendations: [
        !domainMatch && 'NEXTAUTH_URL does not match current domain',
        !publicUrlMatch && 'NEXT_PUBLIC_APP_URL does not match current domain',
        domainError && 'Configured domain is not accessible',
        !domainMatch && !publicUrlMatch && 'Update environment variables to match your actual domain',
      ].filter(Boolean)
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Domain check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 