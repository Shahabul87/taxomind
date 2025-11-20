/**
 * Real analytics data fetcher using production API endpoints
 * Replaces mock data with actual database queries
 */

import { logger } from '@/lib/logger';

/**
 * API Response Types
 * Type definitions for API responses to ensure type safety
 */

/**
 * Learning pattern from API response
 */
interface LearningPatternApiResponse {
  progress?: number;
  status?: string;
  pathName?: string;
  engagementScore?: number;
  studyTime?: number;
}

/**
 * Recommendation from API response
 */
interface RecommendationApiResponse {
  priority?: 'high' | 'medium' | 'low';
  type?: string;
  message?: string;
}

/**
 * Analytics Dashboard API Response
 * Structure of the response from /api/analytics/dashboard
 */
interface AnalyticsDashboardApiResponse {
  overview?: {
    totalLearningTime?: number;
    averageEngagement?: number;
    currentStreak?: number;
    coursesEnrolled?: number;
  };
  courseStats?: {
    progress?: number;
    interactions?: number;
  };
  achievements?: Array<{
    id: string;
    title: string;
    [key: string]: unknown;
  }>;
  learningPatterns?: LearningPatternApiResponse[];
  recommendations?: RecommendationApiResponse[];
}

/**
 * Real-time Metrics API Response
 * Structure of the response from /api/analytics/real-time/metrics
 */
interface RealtimeMetricsApiResponse {
  todayStats?: {
    totalStudyTime?: number;
    sessionCount?: number;
    averageEngagement?: number;
  };
  weeklyMomentum?: {
    streak?: number;
  };
}

export interface AnalyticsData {
  summary: {
    totalLearningTime: number;
    averageEngagementScore: number;
    overallProgress: number;
    currentStreak: number;
    activeCourses: number;
    totalAchievements: number;
  };
  learningMetrics: {
    id: string;
    overallProgress: number;
    averageEngagementScore: number;
    totalStudyTime: number;
    riskScore: number;
    course?: {
      title: string;
      imageUrl?: string;
    };
  }[];
}

export interface PerformanceData {
  summary: {
    totalLearningTime: number;
    totalSessions: number;
    averageEngagementScore: number;
    averageQuizPerformance: number;
  };
  trends: {
    learningVelocity: 'IMPROVING' | 'STABLE' | 'DECLINING';
    engagement: 'IMPROVING' | 'STABLE' | 'DECLINING';
    performance: 'IMPROVING' | 'STABLE' | 'DECLINING';
    improvementRate: number;
  };
  insights: {
    type: 'success' | 'warning' | 'info';
    priority: 'high' | 'medium' | 'low';
    title: string;
    message: string;
  }[];
}

export interface PulseData {
  todayStats: {
    totalStudyTime: number;
    sessionCount: number;
    averageEngagement: number;
  };
  weeklyMomentum: {
    streak: number;
  };
}

/**
 * Fetch real analytics data from the API
 * Uses /api/analytics/dashboard endpoint with real database queries
 */
export const fetchStableAnalytics = async (
  period: string,
  course?: string
): Promise<AnalyticsData> => {
  try {
    const params = new URLSearchParams({
      view: 'student',
      timeframe: period === 'DAILY' ? '1d' : period === 'WEEKLY' ? '7d' : '30d',
    });

    if (course) {
      params.append('courseId', course);
    }

    const response = await fetch(`/api/analytics/dashboard?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }

    const data = await response.json() as AnalyticsDashboardApiResponse;

    // Transform API response to match AnalyticsData interface
    return {
      summary: {
        totalLearningTime: data.overview?.totalLearningTime || 0,
        averageEngagementScore: data.overview?.averageEngagement || 0,
        overallProgress: data.courseStats?.progress || 0,
        currentStreak: data.overview?.currentStreak || 0,
        activeCourses: data.overview?.coursesEnrolled || 0,
        totalAchievements: data.achievements?.length || 0,
      },
      learningMetrics: data.learningPatterns?.map((pattern: LearningPatternApiResponse, index: number) => ({
        id: `${index + 1}`,
        overallProgress: pattern.progress || 0,
        averageEngagementScore: pattern.engagementScore || 75, // Use actual data if available
        totalStudyTime: pattern.studyTime || 0, // Use actual data if available
        riskScore: pattern.status === 'AT_RISK' ? 75 : 25,
        course: {
          title: pattern.pathName || 'Unknown Course',
          imageUrl: '/placeholder.svg',
        },
      })) || [],
    };
  } catch (error) {
    logger.error('[ANALYTICS_FETCH] Error fetching analytics:', error);
    // Return empty/default data on error to prevent UI crashes
    return {
      summary: {
        totalLearningTime: 0,
        averageEngagementScore: 0,
        overallProgress: 0,
        currentStreak: 0,
        activeCourses: 0,
        totalAchievements: 0,
      },
      learningMetrics: [],
    };
  }
};

/**
 * Fetch real performance metrics from the API
 * Uses /api/analytics/dashboard endpoint with real database queries
 */
export const fetchStablePerformance = async (
  period: string,
  days: number
): Promise<PerformanceData> => {
  try {
    const params = new URLSearchParams({
      view: 'student',
      timeframe: period === 'DAILY' ? '1d' : period === 'WEEKLY' ? '7d' : '30d',
    });

    const response = await fetch(`/api/analytics/dashboard?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Performance API error: ${response.status}`);
    }

    const data = await response.json() as AnalyticsDashboardApiResponse;

    // Transform recommendations into insights
    const insights = (data.recommendations || []).map((rec: RecommendationApiResponse) => ({
      type: (rec.priority === 'high' ? 'warning' : rec.priority === 'medium' ? 'info' : 'success') as 'success' | 'warning' | 'info',
      priority: (rec.priority || 'medium') as 'high' | 'medium' | 'low',
      title: rec.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Insight',
      message: rec.message || '',
    }));

    return {
      summary: {
        totalLearningTime: data.overview?.totalLearningTime || 0,
        totalSessions: data.courseStats?.interactions || 0,
        averageEngagementScore: data.overview?.averageEngagement || 0,
        averageQuizPerformance: 0, // Will be added when quiz data is available
      },
      trends: {
        learningVelocity: 'STABLE',
        engagement: 'STABLE',
        performance: 'STABLE',
        improvementRate: 0,
      },
      insights: insights.length > 0 ? insights : [
        {
          type: 'info',
          priority: 'low',
          title: 'Keep Learning',
          message: 'Continue your learning journey to unlock more insights.',
        },
      ],
    };
  } catch (error) {
    logger.error('[PERFORMANCE_FETCH] Error fetching performance:', error);
    return {
      summary: {
        totalLearningTime: 0,
        totalSessions: 0,
        averageEngagementScore: 0,
        averageQuizPerformance: 0,
      },
      trends: {
        learningVelocity: 'STABLE',
        engagement: 'STABLE',
        performance: 'STABLE',
        improvementRate: 0,
      },
      insights: [],
    };
  }
};

/**
 * Fetch real-time pulse data from the API
 * Uses /api/analytics/real-time/metrics endpoint
 */
export const fetchStablePulse = async (): Promise<PulseData> => {
  try {
    const response = await fetch('/api/analytics/real-time/metrics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Pulse API error: ${response.status}`);
    }

    const data = await response.json() as RealtimeMetricsApiResponse;

    return {
      todayStats: {
        totalStudyTime: data.todayStats?.totalStudyTime || 0,
        sessionCount: data.todayStats?.sessionCount || 0,
        averageEngagement: data.todayStats?.averageEngagement || 0,
      },
      weeklyMomentum: {
        streak: data.weeklyMomentum?.streak || 0,
      },
    };
  } catch (error) {
    logger.error('[PULSE_FETCH] Error fetching pulse:', error);
    // Return empty data on error
    return {
      todayStats: {
        totalStudyTime: 0,
        sessionCount: 0,
        averageEngagement: 0,
      },
      weeklyMomentum: {
        streak: 0,
      },
    };
  }
};