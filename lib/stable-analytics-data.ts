// Stable mock data provider for analytics to prevent API errors and auto-reloads

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

export const getStableAnalyticsData = (): AnalyticsData => ({
  summary: {
    totalLearningTime: 1847, // ~30 hours
    averageEngagementScore: 78,
    overallProgress: 65,
    currentStreak: 7,
    activeCourses: 4,
    totalAchievements: 12
  },
  learningMetrics: [
    {
      id: '1',
      overallProgress: 85,
      averageEngagementScore: 82,
      totalStudyTime: 720, // 12 hours
      riskScore: 25,
      course: {
        title: 'Advanced JavaScript Concepts',
        imageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=100&h=100&fit=crop&crop=center'
      }
    },
    {
      id: '2',
      overallProgress: 45,
      averageEngagementScore: 75,
      totalStudyTime: 480, // 8 hours
      riskScore: 55,
      course: {
        title: 'React & Next.js Development',
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop&crop=center'
      }
    },
    {
      id: '3',
      overallProgress: 92,
      averageEngagementScore: 88,
      totalStudyTime: 420, // 7 hours
      riskScore: 15,
      course: {
        title: 'Database Design & SQL',
        imageUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=100&h=100&fit=crop&crop=center'
      }
    },
    {
      id: '4',
      overallProgress: 23,
      averageEngagementScore: 65,
      totalStudyTime: 227, // ~4 hours
      riskScore: 78,
      course: {
        title: 'Machine Learning Fundamentals',
        imageUrl: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100&h=100&fit=crop&crop=center'
      }
    }
  ]
});

export const getStablePerformanceData = (): PerformanceData => ({
  summary: {
    totalLearningTime: 1847,
    totalSessions: 42,
    averageEngagementScore: 78,
    averageQuizPerformance: 82
  },
  trends: {
    learningVelocity: 'IMPROVING',
    engagement: 'STABLE',
    performance: 'IMPROVING',
    improvementRate: 15
  },
  insights: [
    {
      type: 'success',
      priority: 'low',
      title: 'Consistent Learning Pattern',
      message: 'You\'ve maintained a steady learning schedule for the past 2 weeks. This consistency is helping improve your retention rate.'
    },
    {
      type: 'warning',
      priority: 'medium',
      title: 'Quiz Performance Variance',
      message: 'Your quiz scores have been inconsistent in React concepts. Consider reviewing the fundamentals before moving to advanced topics.'
    },
    {
      type: 'info',
      priority: 'high',
      title: 'Optimal Study Time',
      message: 'Your engagement is highest during morning sessions (9-11 AM). Try scheduling more challenging topics during this time.'
    }
  ]
});

export const getStablePulseData = (): PulseData => ({
  todayStats: {
    totalStudyTime: 127, // ~2 hours today
    sessionCount: 3,
    averageEngagement: 84
  },
  weeklyMomentum: {
    streak: 7
  }
});

// Simulate async data loading with stable results
export const fetchStableAnalytics = async (period: string, course?: string): Promise<AnalyticsData> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return getStableAnalyticsData();
};

export const fetchStablePerformance = async (period: string, days: number): Promise<PerformanceData> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return getStablePerformanceData();
};

export const fetchStablePulse = async (): Promise<PulseData> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return getStablePulseData();
};