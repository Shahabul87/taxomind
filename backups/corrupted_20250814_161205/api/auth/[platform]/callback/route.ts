import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

// Platform token exchange configurations
const TOKEN_CONFIGS = {
  twitter: {
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url',
  },
  instagram: {
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    userInfoUrl: 'https://graph.instagram.com/me?fields=id,username,account_type,media_count',
  },
  linkedin: {
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    userInfoUrl: 'https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
  },
  youtube: {
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
  },
  tiktok: {
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
    userInfoUrl: 'https://open-api.tiktok.com/user/info/',
  },
  facebook: {
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userInfoUrl: 'https://graph.facebook.com/me?fields=id,name,picture',
  },
  github: {
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
  },
  discord: {
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
  },
  twitch: {
    tokenUrl: 'https://id.twitch.tv/oauth2/token',
    userInfoUrl: 'https://api.twitch.tv/helix/users',
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      logger.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/profile?error=oauth_cancelled', request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/profile?error=missing_params', request.url)
      );
    }

    // Decode and validate state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(
        new URL('/profile?error=invalid_state', request.url)
      );
    }

    const { platform: platformParam } = await params;
    const platform = platformParam.toLowerCase();
    const config = TOKEN_CONFIGS[platform as keyof typeof TOKEN_CONFIGS];
    
    if (!config) {
      return NextResponse.redirect(
        new URL('/profile?error=platform_not_supported', request.url)
      );
    }

    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(platform, code, config);
    if (!tokenResponse.success) {
      return NextResponse.redirect(
        new URL('/profile?error=token_exchange_failed', request.url)
      );
    }

    // Fetch user info from platform
    const userInfo = await fetchPlatformUserInfo(platform, tokenResponse.data, config);
    if (!userInfo.success) {
      return NextResponse.redirect(
        new URL('/profile?error=user_info_failed', request.url)
      );
    }

    // Save to database
    await saveSocialAccount(stateData.userId, platform, {
      ...tokenResponse.data,
      ...userInfo.data
    });

    // Trigger initial data sync
    await triggerDataSync(stateData.userId, platform);

    return NextResponse.redirect(
      new URL('/profile?success=platform_connected', request.url)
    );

  } catch (error: any) {
    logger.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/profile?error=callback_failed', request.url)
    );
  }
}

async function exchangeCodeForToken(
  platform: string,
  code: string,
  config: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const platformConfig = {
      twitter: process.env.TWITTER_CLIENT_ID,
      instagram: process.env.INSTAGRAM_CLIENT_ID,
      linkedin: process.env.LINKEDIN_CLIENT_ID,
      youtube: process.env.GOOGLE_CLIENT_ID,
      tiktok: process.env.TIKTOK_CLIENT_ID,
      facebook: process.env.FACEBOOK_CLIENT_ID,
      github: process.env.GITHUB_CLIENT_ID,
      discord: process.env.DISCORD_CLIENT_ID,
      twitch: process.env.TWITCH_CLIENT_ID,
    };

    const clientId = platformConfig[platform as keyof typeof platformConfig];
    const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`];
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/${platform}/callback`;

    const tokenData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId!,
      client_secret: clientSecret!,
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: tokenData.toString(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error_description || data.error };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: 'Token exchange failed' };
  }
}

async function fetchPlatformUserInfo(
  platform: string,
  tokenData: any,
  config: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const headers: any = {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Accept': 'application/json',
    };

    // Platform-specific headers
    if (platform === 'twitch') {
      headers['Client-ID'] = process.env.TWITCH_CLIENT_ID;
    }

    const response = await fetch(config.userInfoUrl, {
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: 'Failed to fetch user info' };
    }

    // Normalize user data across platforms
    const normalizedData = normalizeUserData(platform, data);
    
    return { success: true, data: normalizedData };
  } catch (error: any) {
    return { success: false, error: 'User info fetch failed' };
  }
}

function normalizeUserData(platform: string, rawData: any) {
  const normalizers = {
    twitter: (data: any) => ({
      platformUserId: data.data?.id,
      username: data.data?.username,
      displayName: data.data?.name,
      profileImageUrl: data.data?.profile_image_url,
      followerCount: data.data?.public_metrics?.followers_count || 0,
      followingCount: data.data?.public_metrics?.following_count || 0,
    }),
    instagram: (data: any) => ({
      platformUserId: data.id,
      username: data.username,
      displayName: data.username,
      followerCount: 0, // Basic display API doesn't provide follower count
      mediaCount: data.media_count || 0,
    }),
    github: (data: any) => ({
      platformUserId: data.id.toString(),
      username: data.login,
      displayName: data.name || data.login,
      profileImageUrl: data.avatar_url,
      followerCount: data.followers || 0,
      followingCount: data.following || 0,
      publicRepos: data.public_repos || 0,
    }),
    // Add more normalizers for other platforms
    default: (data: any) => ({
      platformUserId: data.id?.toString(),
      username: data.username || data.login || data.name,
      displayName: data.display_name || data.name || data.username,
      profileImageUrl: data.profile_image_url || data.avatar_url,
      followerCount: 0,
    }),
  };

  const normalizer = normalizers[platform as keyof typeof normalizers] || normalizers.default;
  return normalizer(rawData);
}

async function saveSocialAccount(userId: string, platform: string, accountData: any) {
  try {
    await prisma.socialMediaAccount.upsert({
      where: {
        userId_platform_platformUserId: {
          userId,
          platform: platform.toUpperCase() as any,
          platformUserId: accountData.id || accountData.platformUserId || 'unknown',
        },
      },
      update: {
        accessToken: accountData.access_token,
        refreshToken: accountData.refresh_token,
        tokenExpiresAt: accountData.expires_in 
          ? new Date(Date.now() + accountData.expires_in * 1000)
          : null,
        username: accountData.username,
        displayName: accountData.displayName,
        profileImageUrl: accountData.profileImageUrl,
        followerCount: accountData.followerCount,
        lastSyncAt: new Date(),
      },
      create: {
        id: `${userId}-${platform}`,
        userId,
        platform: platform.toUpperCase() as any,
        platformUserId: accountData.platformUserId || accountData.id || 'unknown',
        username: accountData.username || '',
        accessToken: accountData.access_token,
        refreshToken: accountData.refresh_token,
        tokenExpiresAt: accountData.expires_in 
          ? new Date(Date.now() + accountData.expires_in * 1000)
          : null,
        displayName: accountData.displayName,
        profileImageUrl: accountData.profileImageUrl,
        followerCount: accountData.followerCount || 0,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error: any) {
    logger.error('Error saving social account:', error);
    throw error;
  }
}

async function triggerDataSync(userId: string, platform: string) {
  try {
    // Trigger background sync job
    await fetch(`${process.env.NEXTAUTH_URL}/api/platforms/${platform}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
  } catch (error: any) {
    logger.error('Error triggering data sync:', error);
    // Don't throw - this is non-critical
  }
} 