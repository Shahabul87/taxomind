import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

// Platform OAuth configurations
const PLATFORM_CONFIGS = {
  twitter: {
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    scope: 'tweet.read users.read follows.read like.read offline.access',
    responseType: 'code',
    codeChallenge: 'challenge' // Twitter requires PKCE
  },
  instagram: {
    clientId: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    authUrl: 'https://api.instagram.com/oauth/authorize',
    scope: 'user_profile,user_media',
    responseType: 'code'
  },
  linkedin: {
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scope: 'r_liteprofile r_emailaddress w_member_social',
    responseType: 'code'
  },
  youtube: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.channel-memberships.creator',
    responseType: 'code'
  },
  tiktok: {
    clientId: process.env.TIKTOK_CLIENT_ID,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    scope: 'user.info.basic,video.list',
    responseType: 'code'
  },
  facebook: {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'email,public_profile',
    responseType: 'code'
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'user:email,read:user,repo',
    responseType: 'code'
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    authUrl: 'https://discord.com/api/oauth2/authorize',
    scope: 'identify guilds',
    responseType: 'code'
  },
  twitch: {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
    scope: 'user:read:email channel:read:subscriptions analytics:read:games',
    responseType: 'code'
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const { platform: platformParam } = await params;
    const platform = platformParam.toLowerCase();
    const config = PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS];
    
    if (!config) {
      return NextResponse.json(
        { error: 'Platform not supported' },
        { status: 400 }
      );
    }

    if (!config.clientId || !config.clientSecret) {
      return NextResponse.json(
        { error: 'Platform not configured' },
        { status: 500 }
      );
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      platform,
      timestamp: Date.now()
    })).toString('base64');

    // Build redirect URL
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/${platform}/callback`;
    
    const authParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: config.responseType,
      scope: config.scope,
      state,
      ...('codeChallenge' in config && config.codeChallenge && { 
        code_challenge: config.codeChallenge,
        code_challenge_method: 'S256'
      })
    });

    const authUrl = `${config.authUrl}?${authParams.toString()}`;
    
    return NextResponse.redirect(authUrl);
    
  } catch (error: any) {
    logger.error('OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 