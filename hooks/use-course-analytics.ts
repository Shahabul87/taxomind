"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  CourseWithRelations,
  SerializedCourseWithRelations,
  CourseEnhanced,
  AnalyticsMetrics,
  TimeSeriesData,
  CategoryRevenue,
  TrendData,
  CourseAnalytics,
  CoursePerformance,
  CourseProjections,
  RecentActivity,
  DashboardInsight,
  PerformanceIndicator,
  CourseReviewSummary
} from '@/types/course';

/**
 * Type for course data that can be either serialized or non-serialized
 */
type CourseData = CourseWithRelations | SerializedCourseWithRelations;

/**
 * Mock data generator for demo purposes
 * In production, this would fetch from API endpoints
 */
const generateMockAnalytics = (courses: CourseData[]): AnalyticsMetrics => {
  const now = new Date();
  const totalRevenue = courses.reduce((sum, c) => sum + ((c._count?.Purchase || 0) * (c.price || 0)), 0);
  const totalEnrollments = courses.reduce((sum, c) => sum + (c._count?.Purchase || 0), 0);

  // Generate time series data for revenue chart (last 30 days)
  const revenueChart: TimeSeriesData[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    return {
      timestamp: date,
      value: Math.floor(Math.random() * 5000) + 1000,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  // Generate category breakdown
  const categoryMap = new Map<string, CategoryRevenue>();
  courses.forEach(course => {
    const categoryName = course.category?.name || 'Uncategorized';
    const existing = categoryMap.get(categoryName) || {
      category: categoryName,
      revenue: 0,
      percentage: 0,
      courseCount: 0,
      enrollmentCount: 0
    };

    existing.revenue += (course._count?.Purchase || 0) * (course.price || 0);
    existing.courseCount += 1;
    existing.enrollmentCount += course._count?.Purchase || 0;

    categoryMap.set(categoryName, existing);
  });

  const categoryBreakdown = Array.from(categoryMap.values());
  categoryBreakdown.forEach(cat => {
    cat.percentage = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
  });

  // Generate engagement trend data
  const engagementTrend: TrendData[] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString(),
      value: Math.floor(Math.random() * 100) + 50,
      label: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  });

  // Generate satisfaction trend
  const satisfactionTrend: TrendData[] = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (11 - i));
    return {
      date: date.toISOString(),
      value: 3.5 + Math.random() * 1.5,
      label: date.toLocaleDateString('en-US', { month: 'short' })
    };
  });

  return {
    revenue: {
      total: totalRevenue,
      growth: 12.5,
      chart: revenueChart,
      breakdown: categoryBreakdown,
      trend: totalRevenue > 10000 ? 'up' : 'stable'
    },
    engagement: {
      activeStudents: totalEnrollments,
      avgCompletionRate: 68.5,
      topPerformingCourses: [],
      engagementTrend
    },
    performance: {
      avgRating: 4.3,
      totalReviews: Math.floor(totalEnrollments * 0.3),
      nps: 72,
      satisfactionTrend
    },
    growth: {
      newEnrollments: Math.floor(totalEnrollments * 0.15),
      churnRate: 5.2,
      retentionRate: 94.8,
      growthRate: 12.5
    }
  };
};

/**
 * Generate enhanced course data with analytics
 */
const enhanceCourseWithAnalytics = (course: CourseData): CourseEnhanced => {
  const revenue = (course._count?.Purchase || 0) * (course.price || 0);
  const previousRevenue = revenue * 0.85; // Mock previous period

  const analytics: CourseAnalytics = {
    enrollmentTrend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 20) + 5,
      label: `Day ${i + 1}`
    })),
    completionRate: 65 + Math.random() * 30,
    avgTimeToComplete: Math.floor(Math.random() * 30) + 10,
    studentSatisfaction: 3.5 + Math.random() * 1.5,
    revenueMetrics: {
      total: revenue,
      monthly: revenue / 3,
      weekly: revenue / 12,
      daily: revenue / 90,
      perStudent: course.price || 0,
      growth: ((revenue - previousRevenue) / previousRevenue) * 100,
      projectedMonthly: revenue * 1.1
    },
    engagementScore: 70 + Math.random() * 30,
    retentionRate: 85 + Math.random() * 15
  };

  const performance: CoursePerformance = {
    currentRevenue: revenue,
    previousRevenue,
    growthRate: ((revenue - previousRevenue) / previousRevenue) * 100,
    averageRating: 3.5 + Math.random() * 1.5,
    totalReviews: Math.floor((course._count?.Purchase || 0) * 0.3),
    completionTrend: Math.random() > 0.5 ? 'up' : 'stable',
    enrollmentVelocity: Math.random() * 10
  };

  const projections: CourseProjections = {
    estimatedRevenue30Days: revenue * 1.15,
    estimatedEnrollments30Days: Math.floor((course._count?.Purchase || 0) * 1.15),
    growthPotentialScore: 60 + Math.random() * 40,
    marketDemandScore: 70 + Math.random() * 30
  };

  const reviews: CourseReviewSummary = {
    averageRating: performance.averageRating,
    totalReviews: performance.totalReviews,
    ratingDistribution: {
      1: Math.floor(performance.totalReviews * 0.02),
      2: Math.floor(performance.totalReviews * 0.05),
      3: Math.floor(performance.totalReviews * 0.15),
      4: Math.floor(performance.totalReviews * 0.38),
      5: Math.floor(performance.totalReviews * 0.40)
    },
    recentReviews: []
  };

  return {
    ...course,
    analytics,
    performance,
    projections,
    reviews
  } as CourseEnhanced;
};

/**
 * Generate recent activity items
 */
const generateRecentActivity = (courses: CourseData[]): RecentActivity[] => {
  const activities: RecentActivity[] = [];
  const types: RecentActivity['type'][] = ['enrollment', 'review', 'completion', 'payment'];

  for (let i = 0; i < 10; i++) {
    const course = courses[Math.floor(Math.random() * courses.length)];
    if (course) {
      const type = types[Math.floor(Math.random() * types.length)];
      const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

      activities.push({
        id: `activity-${i}`,
        type,
        message: generateActivityMessage(type, course.title),
        timestamp,
        metadata: { courseId: course.id, courseTitle: course.title }
      });
    }
  }

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

/**
 * Generate activity message based on type
 */
const generateActivityMessage = (type: RecentActivity['type'], courseTitle: string): string => {
  const messages = {
    enrollment: `New student enrolled in "${courseTitle}"`,
    review: `New review posted for "${courseTitle}"`,
    completion: `Student completed "${courseTitle}"`,
    payment: `Payment received for "${courseTitle}"`
  };
  return messages[type];
};

/**
 * Generate dashboard insights
 */
const generateInsights = (courses: CourseData[], analytics: AnalyticsMetrics): DashboardInsight[] => {
  const insights: DashboardInsight[] = [];

  // Revenue insight
  if (analytics.revenue.trend === 'up') {
    insights.push({
      id: 'revenue-growth',
      type: 'success',
      title: 'Revenue Growth',
      description: `Your revenue has increased by ${analytics.revenue.growth.toFixed(1)}% compared to last period`,
      priority: 1
    });
  }

  // Course performance insight
  const draftCourses = courses.filter(c => !c.isPublished);
  if (draftCourses.length > 0) {
    insights.push({
      id: 'draft-courses',
      type: 'info',
      title: 'Unpublished Courses',
      description: `You have ${draftCourses.length} draft course${draftCourses.length > 1 ? 's' : ''} ready to publish`,
      actionLabel: 'Review Drafts',
      actionUrl: '/teacher/courses?status=draft',
      priority: 2
    });
  }

  // Engagement insight
  if (analytics.engagement.avgCompletionRate < 60) {
    insights.push({
      id: 'low-completion',
      type: 'warning',
      title: 'Low Completion Rate',
      description: 'Average completion rate is below 60%. Consider reviewing course content and engagement strategies',
      actionLabel: 'View Analytics',
      actionUrl: '/teacher/analytics',
      priority: 3
    });
  }

  return insights.sort((a, b) => a.priority - b.priority);
};

/**
 * Generate performance indicators
 */
const generatePerformanceIndicators = (analytics: AnalyticsMetrics): PerformanceIndicator[] => {
  return [
    {
      id: 'revenue-target',
      label: 'Revenue Target',
      value: analytics.revenue.total,
      target: 50000,
      unit: '$',
      status: analytics.revenue.total >= 50000 ? 'excellent' :
              analytics.revenue.total >= 30000 ? 'good' : 'needs-attention',
      trend: analytics.revenue.trend
    },
    {
      id: 'completion-rate',
      label: 'Completion Rate',
      value: analytics.engagement.avgCompletionRate,
      target: 80,
      unit: '%',
      status: analytics.engagement.avgCompletionRate >= 80 ? 'excellent' :
              analytics.engagement.avgCompletionRate >= 60 ? 'good' : 'needs-attention',
      trend: 'stable'
    },
    {
      id: 'student-satisfaction',
      label: 'Student Satisfaction',
      value: analytics.performance.avgRating,
      target: 4.5,
      unit: '★',
      status: analytics.performance.avgRating >= 4.5 ? 'excellent' :
              analytics.performance.avgRating >= 4.0 ? 'good' : 'needs-attention',
      trend: 'up'
    },
    {
      id: 'retention-rate',
      label: 'Retention Rate',
      value: analytics.growth.retentionRate,
      target: 90,
      unit: '%',
      status: analytics.growth.retentionRate >= 90 ? 'excellent' :
              analytics.growth.retentionRate >= 80 ? 'good' : 'needs-attention',
      trend: 'stable'
    }
  ];
};

/**
 * Custom hook for course analytics
 */
export const useCourseAnalytics = (courses: CourseData[]) => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsMetrics | null>(null);
  const [enhancedCourses, setEnhancedCourses] = useState<CourseEnhanced[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [performanceIndicators, setPerformanceIndicators] = useState<PerformanceIndicator[]>([]);

  // Generate analytics data
  useEffect(() => {
    const generateData = async () => {
      setIsLoading(true);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate mock analytics
      const analyticsData = generateMockAnalytics(courses);
      setAnalytics(analyticsData);

      // Enhance courses with analytics
      const enhanced = courses.map(enhanceCourseWithAnalytics);
      setEnhancedCourses(enhanced);

      // Update top performing courses in analytics
      const topCourses = enhanced
        .sort((a, b) => b.performance.currentRevenue - a.performance.currentRevenue)
        .slice(0, 5);

      if (analyticsData) {
        analyticsData.engagement.topPerformingCourses = topCourses;
      }

      // Generate other data
      setRecentActivity(generateRecentActivity(courses));
      setInsights(generateInsights(courses, analyticsData));
      setPerformanceIndicators(generatePerformanceIndicators(analyticsData));

      setIsLoading(false);
    };

    if (courses.length > 0) {
      generateData();
    } else {
      setIsLoading(false);
    }
  }, [courses]);

  // Refresh analytics data
  const refreshAnalytics = useCallback(async () => {
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (courses.length > 0) {
      const analyticsData = generateMockAnalytics(courses);
      setAnalytics(analyticsData);
      setRecentActivity(generateRecentActivity(courses));
      setInsights(generateInsights(courses, analyticsData));
      setPerformanceIndicators(generatePerformanceIndicators(analyticsData));
    }

    setIsLoading(false);
  }, [courses]);

  // Get course by ID with analytics
  const getCourseById = useCallback((courseId: string): CourseEnhanced | undefined => {
    return enhancedCourses.find(c => c.id === courseId);
  }, [enhancedCourses]);

  // Calculate aggregate metrics
  const aggregateMetrics = useMemo(() => {
    if (!analytics) return null;

    return {
      totalRevenue: analytics.revenue.total,
      totalStudents: analytics.engagement.activeStudents,
      avgRating: analytics.performance.avgRating,
      growthRate: analytics.growth.growthRate,
      topCategory: analytics.revenue.breakdown[0]?.category || 'N/A'
    };
  }, [analytics]);

  return {
    isLoading,
    analytics,
    enhancedCourses,
    recentActivity,
    insights,
    performanceIndicators,
    aggregateMetrics,
    refreshAnalytics,
    getCourseById
  };
};

/**
 * Hook for real-time updates (WebSocket simulation)
 */
export const useRealtimeUpdates = (onUpdate: (event: any) => void) => {
  useEffect(() => {
    // Simulate WebSocket connection
    const interval = setInterval(() => {
      // Generate random update event
      const events = ['enrollment', 'review', 'payment'];
      const eventType = events[Math.floor(Math.random() * events.length)];

      onUpdate({
        type: eventType,
        data: {
          courseId: `course-${Math.floor(Math.random() * 10)}`,
          timestamp: new Date()
        }
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [onUpdate]);
};