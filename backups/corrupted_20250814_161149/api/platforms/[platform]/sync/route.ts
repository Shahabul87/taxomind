import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

// Platform API configurations for data fetching
const PLATFORM_APIS = {
  twitter: {
    baseUrl: 'https://api.twitter.com/2',
    endpoints: {
      tweets: '/users/{user_id}/tweets?tweet.fields=public_metrics,created_at&max_results=100',
      metrics: '/users/{user_id}?user.fields=public_metrics',
    },
  },
  instagram: {
    baseUrl: 'https://graph.instagram.com',
    endpoints: {
      media: '/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count',
      insights: '/{media_id}/insights?metric=impressions,reach,engagement',
    },
  },
  youtube: {
    baseUrl: 'https://www.googleapis.com/youtube/v3',
    endpoints: {
      channels: '/channels?part=statistics&mine=true',
      videos: '/search?part=snippet&forMine=true&type=video&maxResults=50',
      analytics: '/channels?part=statistics&mine=true',
    },
  },
  github: {
    baseUrl: 'https://api.github.com',
    endpoints: {
      repos: '/user/repos?sort=updated&per_page=100',
      events: '/users/{username}/events/public',
      stats: '/users/{username}',
    },
  },
  linkedin: {
    baseUrl: 'https://api.linkedin.com/v2',
    endpoints: {
      profile: '/people/~?projection=(id,firstName,lastName,headline)',
      shares: '/shares?q=owners&owners=urn:li:person:{person_id}&count=50',
    },
  },
  // Add more platforms as needed
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await request.json();
    
    // Validate user authorization
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { platform: platformParam } = await params;
    const platform = platformParam.toLowerCase();
    
    // Get social account for the platform
    const socialAccount = await prisma.socialMediaAccount.findFirst({
      where: {
        userId,
        platform: platform.toUpperCase() as any,
      },
    });

    if (!socialAccount) {
      return NextResponse.json(
        { error: 'Platform not connected' },
        { status: 404 }
      );
    }

    // Check if token is expired and refresh if needed
    if (socialAccount.tokenExpiresAt && socialAccount.tokenExpiresAt < new Date()) {
      const refreshResult = await refreshAccessToken(socialAccount);
      if (!refreshResult.success) {
        return NextResponse.json(
          { error: 'Token refresh failed' },
          { status: 401 }
        );
      }
    }

    // Sync platform data
    const syncResult = await syncPlatformData(platform, socialAccount);
    
    if (!syncResult.success) {
      return NextResponse.json(
        { error: syncResult.error },
        { status: 500 }
      );
    }

    // Update last sync time
    await prisma.socialMediaAccount.update({
      where: { id: socialAccount.id },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({
      message: 'Sync completed successfully',
      data: syncResult.data,
    });

  } catch (error: any) {
    logger.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}

async function refreshAccessToken(socialAccount: any): Promise<{ success: boolean; error?: string }> {
  if (!socialAccount.refreshToken) {
    return { success: false, error: 'No refresh token available' };
  }

  const platform = socialAccount.platform.toLowerCase();
  
  try {
    // Platform-specific token refresh logic
    const refreshConfigs = {
      twitter: {
        url: 'https://api.twitter.com/2/oauth2/token',
        params: {
          grant_type: 'refresh_token',
          refresh_token: socialAccount.refreshToken,
          client_id: process.env.TWITTER_CLIENT_ID || '',
        },
      },
      // Add other platforms as needed
    };

    const config = refreshConfigs[platform as keyof typeof refreshConfigs];
    if (!config) {
      return { success: false, error: 'Refresh not supported for this platform' };
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env[`${platform.toUpperCase()}_CLIENT_ID`]}:${process.env[`${platform.toUpperCase()}_CLIENT_SECRET`]}`).toString('base64')}`,
      },
      body: new URLSearchParams(config.params).toString(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error_description || 'Token refresh failed' };
    }

    // Update token in database
    await prisma.socialMediaAccount.update({
      where: { id: socialAccount.id },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || socialAccount.refreshToken,
        tokenExpiresAt: data.expires_in 
          ? new Date(Date.now() + data.expires_in * 1000)
          : null,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Token refresh failed' };
  }
}

async function syncPlatformData(
  platform: string,
  socialAccount: any
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const syncer = platformSyncers[platform as keyof typeof platformSyncers];
    if (!syncer) {
      return { success: false, error: 'Platform syncer not implemented' };
    }

    return await syncer(socialAccount);
  } catch (error: any) {
    return { success: false, error: 'Sync failed' };
  }
}

const platformSyncers = {
  twitter: async (socialAccount: any) => {
    try {
      const config = PLATFORM_APIS.twitter;
      const headers = {
        'Authorization': `Bearer ${socialAccount.accessToken}`,
        'Content-Type': 'application/json',
      };

      // Fetch user metrics
      const userResponse = await fetch(
        `${config.baseUrl}${config.endpoints.metrics.replace('{user_id}', socialAccount.platformUserId)}`,
        { headers }
      );
      const userData = await userResponse.json();

      // Fetch recent tweets
      const tweetsResponse = await fetch(
        `${config.baseUrl}${config.endpoints.tweets.replace('{user_id}', socialAccount.platformUserId)}`,
        { headers }
      );
      const tweetsData = await tweetsResponse.json();

      // Store analytics data
      const analyticsData = {
        followerCount: userData.data?.public_metrics?.followers_count || 0,
        followingCount: userData.data?.public_metrics?.following_count || 0,
        tweetCount: userData.data?.public_metrics?.tweet_count || 0,
        likeCount: userData.data?.public_metrics?.like_count || 0,
        recentTweets: tweetsData.data || [],
      };

      // Save to analytics table
      await prisma.socialMetric.create({
        data: {
          id: randomUUID(),
          socialMediaAccountId: socialAccount.id,
          platform: socialAccount.platform,
          metricType: 'FOLLOWERS',
          value: analyticsData.followerCount,
          recordedAt: new Date(),
        },
      });

      await prisma.socialMetric.create({
        data: {
          id: randomUUID(),
          socialMediaAccountId: socialAccount.id,
          platform: socialAccount.platform,
          metricType: 'ENGAGEMENT_RATE',
          value: Math.round(calculateEngagementRate(tweetsData.data || [])),
          percentage: calculateEngagementRate(tweetsData.data || []),
          recordedAt: new Date(),
        },
      });

      // Update account with latest metrics
      await prisma.socialMediaAccount.update({
        where: { id: socialAccount.id },
        data: {
          followerCount: analyticsData.followerCount,
          lastSyncAt: new Date(),
        },
      });

      return { success: true, data: analyticsData };
    } catch (error: any) {
      return { success: false, error: 'Twitter sync failed' };
    }
  },

  github: async (socialAccount: any) => {
    try {
      const config = PLATFORM_APIS.github;
      const headers = {
        'Authorization': `Bearer ${socialAccount.accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'YourApp/1.0',
      };

      // Fetch user stats
      const userResponse = await fetch(
        `${config.baseUrl}${config.endpoints.stats.replace('{username}', socialAccount.username)}`,
        { headers }
      );
      const userData = await userResponse.json();

      // Fetch repositories
      const reposResponse = await fetch(
        `${config.baseUrl}${config.endpoints.repos}`,
        { headers }
      );
      const reposData = await reposResponse.json();

      const analyticsData = {
        followerCount: userData.followers || 0,
        followingCount: userData.following || 0,
        publicRepos: userData.public_repos || 0,
        totalStars: reposData.reduce((sum: number, repo: any) => sum + (repo.stargazers_count || 0), 0),
        totalForks: reposData.reduce((sum: number, repo: any) => sum + (repo.forks_count || 0), 0),
        repositories: reposData.slice(0, 10), // Store top 10 repos
      };

      // Save analytics
      await prisma.socialMetric.create({
        data: {
          id: randomUUID(),
          socialMediaAccountId: socialAccount.id,
          platform: socialAccount.platform,
          metricType: 'FOLLOWERS',
          value: analyticsData.followerCount,
          recordedAt: new Date(),
        },
      });

      await prisma.socialMetric.create({
        data: {
          id: randomUUID(),
          socialMediaAccountId: socialAccount.id,
          platform: socialAccount.platform,
          metricType: 'POSTS',
          value: analyticsData.publicRepos,
          recordedAt: new Date(),
        },
      });

      // Update account
      await prisma.socialMediaAccount.update({
        where: { id: socialAccount.id },
        data: {
          followerCount: analyticsData.followerCount,
          lastSyncAt: new Date(),
        },
      });

      return { success: true, data: analyticsData };
    } catch (error: any) {
      return { success: false, error: 'GitHub sync failed' };
    }
  },

  // Add more platform syncers
  instagram: async (socialAccount: any) => {
    // Instagram sync implementation
    return { success: true, data: {} };
  },

  youtube: async (socialAccount: any) => {
    // YouTube sync implementation
    return { success: true, data: {} };
  },

  linkedin: async (socialAccount: any) => {
    // LinkedIn sync implementation
    return { success: true, data: {} };
  },
};

function calculateEngagementRate(tweets: any[]): number {
  if (!tweets || tweets.length === 0) return 0;
  
  const totalEngagements = tweets.reduce((sum, tweet) => {
    const metrics = tweet.public_metrics || {};
    return sum + (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0);
  }, 0);
  
  const totalImpressions = tweets.reduce((sum, tweet) => {
    return sum + (tweet.public_metrics?.impression_count || 1000); // Fallback estimate
  }, 0);
  
  return totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;
} 