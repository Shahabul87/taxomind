import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
    const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    // Create debug info (hide sensitive data)
    const debugInfo = {
      facebook_client_id: facebookClientId ? {
        exists: true,
        length: facebookClientId.length,
        first_4_chars: facebookClientId.substring(0, 4),
        is_numeric: /^\d+$/.test(facebookClientId),
        value: facebookClientId // Remove this in production!
      } : { exists: false },
      
      facebook_client_secret: facebookClientSecret ? {
        exists: true,
        length: facebookClientSecret.length,
        first_4_chars: facebookClientSecret.substring(0, 4),
      } : { exists: false },
      
      nextauth_url: nextAuthUrl || 'Not set',
      
      computed_redirect_uri: nextAuthUrl ? `${nextAuthUrl}/api/auth/facebook/callback` : 'Cannot compute - NEXTAUTH_URL not set',
      
      facebook_auth_url: 'https://www.facebook.com/v18.0/dialog/oauth',
      
      required_format: {
        app_id_should_be: 'Numeric string (e.g., "1234567890123456")',
        redirect_uri_should_match: 'Exact URL set in Facebook App settings'
      }
    };
    
    return NextResponse.json(debugInfo, { status: 200 });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
} 