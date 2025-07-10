"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AnalyticsSummary {
  totalLearningTime: number;
  averageEngagementScore: number;
  overallProgress: number;
  currentStreak: number;
  totalAchievements: number;
  activeCourses: number;
}

interface LearningMetric {
  id: string;
  courseId?: string;
  course?: {
    id: string;
    title: string;
    imageUrl?: string;
  };
  overallProgress: number;
  learningVelocity: number;
  engagementTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  riskScore: number;
  averageEngagementScore: number;
  totalStudyTime: number;
  lastActivityDate: Date;
}

interface PerformanceMetric {
  date: Date;
  learningVelocity: number;
  retentionRate: number;
  engagementScore: number;
  quizPerformance: number;
  totalLearningTime: number;
  activeTime: number;
  sessionsCount: number;
  averageSessionLength: number;
  velocityTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  engagementTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  performanceTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  improvementRate: number;
}

interface LearningSession {
  id: string;
  startTime: Date;
  duration?: number;
  engagementScore: number;
  course?: {
    id: string;
    title: string;
  };
  chapter?: {
    id: string;
    title: string;
  };
}

interface StudyStreak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Date;
  course?: {
    id: string;
    title: string;
  };
}

interface UserProgress {
  id: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  isCompleted: boolean;
  progressPercent: number;
  timeSpent: number;
  lastAccessedAt: Date;
  course?: {
    id: string;
    title: string;
    imageUrl?: string;
  };
  chapter?: {
    id: string;
    title: string;
  };
  section?: {
    id: string;
    title: string;
  };
}

interface UserAchievement {
  id: string;
  achievementType: string;
  title: string;
  description: string;
  pointsEarned: number;
  badgeLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  unlockedAt: Date;
  course?: {
    id: string;
    title: string;
  };
}

interface WeeklyActivity {
  date: string;
  duration: number;
  engagementScore: number;
}

interface Trends {
  weeklyActivity: WeeklyActivity[];
  learningVelocityTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  engagementTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  performanceTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

interface Insights {
  strongestSubjects: string[];
  areasForImprovement: string[];
  recommendedStudyTime: number;
}

interface DashboardAnalytics {
  summary: AnalyticsSummary;
  learningMetrics: LearningMetric[];
  performanceMetrics: PerformanceMetric[];
  learningSessions: LearningSession[];
  studyStreaks: StudyStreak[];
  userProgress: UserProgress[];
  achievements: UserAchievement[];
  trends: Trends;
  insights: Insights;
}

export function useDashboardAnalytics(
  period?: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  courseId?: string
) {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (courseId) params.append('courseId', courseId);

      const response = await fetch(`/api/dashboard/user/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Dashboard analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period, courseId]);

  const refreshAnalytics = () => {
    fetchAnalytics();
  };

  return {
    data,
    loading,
    error,
    refreshAnalytics
  };
}

export function useRealtimeActivity(
  limit?: number,
  activityType?: string,
  courseId?: string
) {
  const [activities, setActivities] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [patterns, setPatterns] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (activityType) params.append('type', activityType);
      if (courseId) params.append('courseId', courseId);

      const response = await fetch(`/api/dashboard/user/activity?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch activity: ${response.statusText}`);
      }

      const data = await response.json();
      setActivities(data.activities);
      setStatistics(data.statistics);
      setPatterns(data.patterns);
      setInsights(data.insights);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Activity tracking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const trackActivity = async (activityData: {
    activityType: string;
    action: string;
    entityType?: string;
    entityId?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    duration?: number;
    progress?: number;
    score?: number;
    metadata?: any;
    sessionId?: string;
  }) => {
    try {
      const response = await fetch('/api/dashboard/user/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      if (!response.ok) {
        throw new Error(`Failed to track activity: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Refresh activities after tracking
      fetchActivity();
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track activity';
      console.error('Activity tracking error:', err);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [limit, activityType, courseId]);

  return {
    activities,
    statistics,
    patterns,
    insights,
    loading,
    error,
    refreshActivity: fetchActivity,
    trackActivity
  };
}

export function usePerformanceMetrics(
  period?: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  days?: number
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (days) params.append('days', days.toString());

      const response = await fetch(`/api/dashboard/user/performance?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance metrics: ${response.statusText}`);
      }

      const performanceData = await response.json();
      setData(performanceData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch performance metrics';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Performance metrics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [period, days]);

  return {
    data,
    loading,
    error,
    refreshPerformance: fetchPerformance
  };
}

export function useRealtimePulse() {
  const [pulse, setPulse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPulse = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/user/pulse');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch real-time pulse: ${response.statusText}`);
      }

      const pulseData = await response.json();
      setPulse(pulseData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch real-time pulse';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Real-time pulse error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchPulse();

    // Set up polling for real-time updates
    const interval = setInterval(fetchPulse, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    pulse,
    loading,
    error,
    refreshPulse: fetchPulse
  };
}