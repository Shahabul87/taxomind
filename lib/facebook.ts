import axios from 'axios';
import { logger } from '@/lib/logger';

// Facebook API configuration
const FACEBOOK_GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

// Facebook API client
export const facebookClient = {
  // Fetch user profile data from Facebook
  getUserProfile: async (accessToken: string) => {
    try {
      const response = await axios.get(`${FACEBOOK_GRAPH_API_URL}/me`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,email,picture'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching Facebook user profile:', error);
      throw error;
    }
  },

  // Fetch user's Facebook pages
  getUserPages: async (accessToken: string) => {
    try {
      const response = await axios.get(`${FACEBOOK_GRAPH_API_URL}/me/accounts`, {
        params: {
          access_token: accessToken
        }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching Facebook pages:', error);
      throw error;
    }
  },

  // Fetch page insights
  getPageInsights: async (pageId: string, accessToken: string) => {
    try {
      const response = await axios.get(`${FACEBOOK_GRAPH_API_URL}/${pageId}/insights`, {
        params: {
          access_token: accessToken,
          metric: 'page_impressions,page_impressions_unique,page_engaged_users,page_post_engagements',
          period: 'day',
          date_preset: 'last_30_days'
        }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching Facebook page insights:', error);
      throw error;
    }
  },

  // Fetch page followers count
  getPageFollowers: async (pageId: string, accessToken: string) => {
    try {
      const response = await axios.get(`${FACEBOOK_GRAPH_API_URL}/${pageId}`, {
        params: {
          access_token: accessToken,
          fields: 'fan_count,followers_count'
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Error fetching Facebook page followers:', error);
      throw error;
    }
  },

  // Fetch recent posts
  getPagePosts: async (pageId: string, accessToken: string, limit = 10) => {
    try {
      const response = await axios.get(`${FACEBOOK_GRAPH_API_URL}/${pageId}/posts`, {
        params: {
          access_token: accessToken,
          fields: 'id,message,created_time,insights.metric(post_impressions,post_engagements)',
          limit
        }
      });
      return response.data.data;
    } catch (error) {
      logger.error('Error fetching Facebook page posts:', error);
      throw error;
    }
  }
};

// Transform Facebook data to our app format
export function transformFacebookData(pageData: any, insightsData: any, postsData: any) {
  // Parse followers count
  const followers = pageData.followers_count || pageData.fan_count || 0;
  
  // Calculate engagement rate
  let engagement = 0;
  const engagementMetric = insightsData.find((m: any) => m.name === 'page_engaged_users');
  const impressionsMetric = insightsData.find((m: any) => m.name === 'page_impressions_unique');
  
  if (engagementMetric && impressionsMetric && impressionsMetric.values[0].value > 0) {
    engagement = (engagementMetric.values[0].value / impressionsMetric.values[0].value) * 100;
  }
  
  // Calculate growth (mock data - in a real app you would compare with historical data)
  const growth = 2.4; // This would be calculated based on historical data
  
  // Format posts data
  const posts = postsData?.length || 0;
  
  // Calculate likes, shares, comments (mock data - in a real app you would sum these from posts)
  let likes = 0;
  let shares = 0;
  let comments = 0;
  
  // Parse recent activity for chart visualization
  const recentActivity = insightsData
    .find((m: any) => m.name === 'page_impressions')?.values
    .map((v: any) => v.value / 100) || Array(12).fill(50);

  // Format top posts
  const topPosts = postsData?.slice(0, 3).map((post: any) => {
    // Extract engagement metrics
    const postEngagement = post.insights?.data?.[0]?.values?.[0]?.value || 0;
    const postImpressions = post.insights?.data?.[1]?.values?.[0]?.value || 1;
    const engagementRate = (postEngagement / postImpressions) * 100;
    
    return {
      title: post.message?.substring(0, 30) || 'Facebook Post',
      engagement: parseFloat(engagementRate.toFixed(1)),
      date: new Date(post.created_time).toISOString().substring(0, 10)
    };
  }) || [];

  // Return formatted data
  return {
    name: "Facebook",
    followers,
    engagement: parseFloat(engagement.toFixed(1)),
    growth,
    posts,
    likes,
    shares,
    comments,
    recentActivity: recentActivity.length > 12 ? recentActivity.slice(0, 12) : recentActivity,
    audienceDemo: { male: 45, female: 55 }, // Mock data - Graph API requires special permissions for demographics
    topPosts
  };
}

// Format error messages
export function formatFacebookError(error: any) {
  if (error.response?.data?.error) {
    const fbError = error.response.data.error;
    return `Facebook API Error (${fbError.code}): ${fbError.message}`;
  }
  return error.message || 'An error occurred with the Facebook API';
} 