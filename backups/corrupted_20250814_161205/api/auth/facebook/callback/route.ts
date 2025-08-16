import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import axios from 'axios';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    // Get the code from the callback URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    
    // Verify state to prevent CSRF
    if (!code || !state) {
      logger.error('Missing code or state parameter');
      return NextResponse.redirect(new URL('/profile?error=auth_callback_error', req.url));
    }
    
    // Get the current user session
    const session = await auth();
    if (!session?.user?.id) {
      logger.error('No authenticated user found');
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }
    
    // Exchange code for access token
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FACEBOOK_CLIENT_ID,
        client_secret: process.env.FACEBOOK_CLIENT_SECRET,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`,
        code
      }
    });
    
    const { access_token, expires_in } = tokenResponse.data;
    
    // Get user profile info
    const profileResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token,
        fields: 'id,name,email'
      }
    });
    
    const { id: facebookId, name } = profileResponse.data;
    
    // Check if this account already exists for this user
    const existingAccount = await db.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'facebook',
        providerAccountId: facebookId
      }
    });
    
    if (existingAccount) {
      // Update the existing account with new token
      await db.account.update({
        where: { id: existingAccount.id },
        data: {
          access_token,
          expires_at: Math.floor(Date.now() / 1000) + expires_in,
          token_type: 'bearer',
        }
      });
    } else {
      // Create a new account
      await db.account.create({
        data: {
          userId: session.user.id,
          type: 'oauth',
          provider: 'facebook',
          providerAccountId: facebookId,
          access_token,
          expires_at: Math.floor(Date.now() / 1000) + expires_in,
          token_type: 'bearer',
          scope: 'public_profile,email,pages_show_list,pages_read_engagement,read_insights',
        }
      });
      
      // Create a profile link for Facebook
      await db.profileLink.create({
        data: {
          userId: session.user.id,
          platform: 'Facebook',
          url: `https://facebook.com/${facebookId}`,
        }
      });
    }
    
    // Redirect back to the profile page
    return NextResponse.redirect(new URL('/profile?connected=facebook', req.url));
  } catch (error: any) {
    logger.error('Error in Facebook callback:', error);
    return NextResponse.redirect(new URL('/profile?error=facebook_connection_failed', req.url));
  }
} 