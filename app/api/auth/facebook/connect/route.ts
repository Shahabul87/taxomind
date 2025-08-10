import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Generate a random state parameter to prevent CSRF attacks
    const state = crypto.randomBytes(16).toString('hex');
    
    // Store the state in a cookie
    const cookieExpires = new Date();
    cookieExpires.setMinutes(cookieExpires.getMinutes() + 30);
    
    // Prepare redirect URL to Facebook OAuth
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    
    authUrl.searchParams.append('client_id', process.env.FACEBOOK_CLIENT_ID || '');
    authUrl.searchParams.append('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', 'public_profile,email,pages_show_list,pages_read_engagement,read_insights');
    authUrl.searchParams.append('response_type', 'code');
    
    // Set cookie and redirect to Facebook auth URL
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('facebook_oauth_state', state, {
      expires: cookieExpires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    return response;
  } catch (error) {
    logger.error('Error initiating Facebook OAuth:', error);
    return NextResponse.redirect(new URL('/profile?error=facebook_connection_failed', req.url));
  }
} 