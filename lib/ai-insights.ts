import { User } from "@prisma/client";
import { logger } from '@/lib/logger';

export interface AIInsight {
  id: string;
  type: 'achievement' | 'recommendation' | 'trend' | 'alert' | 'milestone';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'learning' | 'engagement' | 'performance' | 'social' | 'goals';
  confidence: number; // 0-100
  actionable: boolean;
  suggestedAction?: string;
  actionUrl?: string;
  createdAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface AIInsightsContext {
  analytics: any[];
  activities: any[];
  courses: any[];
  goals: any[];
}

export async function generateAIInsights(
  userData: any,
  context: AIInsightsContext
): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];

  try {
    // Generate learning progress insights
    const learningInsights = generateLearningInsights(userData, context);
    insights.push(...learningInsights);

    // Generate engagement insights
    const engagementInsights = generateEngagementInsights(userData, context);
    insights.push(...engagementInsights);

    // Generate goal-related insights
    const goalInsights = generateGoalInsights(userData, context);
    insights.push(...goalInsights);

    // Generate performance insights
    const performanceInsights = generatePerformanceInsights(userData, context);
    insights.push(...performanceInsights);

    // Generate social insights
    const socialInsights = generateSocialInsights(userData, context);
    insights.push(...socialInsights);

    // Sort insights by priority and confidence
    insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : b.confidence - a.confidence;
    });

    return insights.slice(0, 10); // Return top 10 insights
  } catch (error) {
    logger.error("Error generating AI insights:", error);
    return [];
  }
}

function generateLearningInsights(userData: any, context: AIInsightsContext): AIInsight[] {
  const insights: AIInsight[] = [];

  // Check for learning streak
  const learningStreak = calculateLearningStreak(context.activities);
  if (learningStreak >= 7) {
    insights.push({
      id: `learning-streak-${Date.now()}`,
      type: 'achievement',
      title: `🔥 ${learningStreak} Day Learning Streak!`,
      description: `You've been consistently learning for ${learningStreak} days. Keep up the great momentum!`,
      priority: 'high',
      category: 'learning',
      confidence: 95,
      actionable: true,
      suggestedAction: "Continue your streak with today's learning session",
      actionUrl: "/discover",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      metadata: { streak: learningStreak }
    });
  }

  // Check for course completion patterns
  const enrollments = userData.enrollments || [];
  const completionRate = calculateAverageCompletionRate(enrollments);
  
  if (completionRate > 80) {
    insights.push({
      id: `high-completion-${Date.now()}`,
      type: 'achievement',
      title: '🎯 High Course Completion Rate',
      description: `Your ${Math.round(completionRate)}% completion rate shows excellent dedication to learning!`,
      priority: 'medium',
      category: 'performance',
      confidence: 90,
      actionable: true,
      suggestedAction: "Challenge yourself with an advanced course",
      actionUrl: "/discover?level=advanced",
      createdAt: new Date(),
      metadata: { completionRate }
    });
  } else if (completionRate < 30 && enrollments.length > 0) {
    insights.push({
      id: `low-completion-${Date.now()}`,
      type: 'alert',
      title: '📚 Focus on Course Completion',
      description: `Your ${Math.round(completionRate)}% completion rate could be improved. Consider focusing on fewer courses.`,
      priority: 'high',
      category: 'learning',
      confidence: 85,
      actionable: true,
      suggestedAction: "Review and prioritize your enrolled courses",
      actionUrl: "/dashboard/user",
      createdAt: new Date(),
      metadata: { completionRate }
    });
  }

  // Check for learning velocity
  const recentLearningActivity = context.activities.filter(
    activity => activity.type === 'learning' && 
    new Date(activity.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ).length;

  if (recentLearningActivity === 0) {
    insights.push({
      id: `inactive-learning-${Date.now()}`,
      type: 'recommendation',
      title: '⏰ Time to Resume Learning',
      description: "You haven't had any learning activities this week. A quick 15-minute session can help maintain momentum.",
      priority: 'medium',
      category: 'engagement',
      confidence: 80,
      actionable: true,
      suggestedAction: "Start a quick learning session",
      actionUrl: "/discover",
      createdAt: new Date(),
      metadata: { daysInactive: 7 }
    });
  }

  return insights;
}

function generateEngagementInsights(userData: any, context: AIInsightsContext): AIInsight[] {
  const insights: AIInsight[] = [];

  const engagementScore = calculateEngagementScore(userData);
  
  if (engagementScore < 20) {
    insights.push({
      id: `low-engagement-${Date.now()}`,
      type: 'recommendation',
      title: '🚀 Boost Your Engagement',
      description: 'Try creating content or joining discussions to enhance your learning experience.',
      priority: 'medium',
      category: 'engagement',
      confidence: 75,
      actionable: true,
      suggestedAction: "Create your first blog post or idea",
      actionUrl: "/blog/create",
      createdAt: new Date(),
      metadata: { engagementScore }
    });
  }

  // Check for social interaction patterns
  const socialInteractions = (userData.posts?.length || 0) + (userData.ideas?.length || 0);
  if (socialInteractions > 10) {
    insights.push({
      id: `active-contributor-${Date.now()}`,
      type: 'achievement',
      title: '🌟 Active Community Contributor',
      description: `You've shared ${socialInteractions} posts and ideas. Your contributions help others learn!`,
      priority: 'medium',
      category: 'social',
      confidence: 90,
      actionable: false,
      createdAt: new Date(),
      metadata: { contributions: socialInteractions }
    });
  }

  return insights;
}

function generateGoalInsights(userData: any, context: AIInsightsContext): AIInsight[] {
  const insights: AIInsight[] = [];

  const goals = userData.goals || [];
  
  if (goals.length === 0) {
    insights.push({
      id: `no-goals-${Date.now()}`,
      type: 'recommendation',
      title: '🎯 Set Your Learning Goals',
      description: 'Setting clear goals can increase your learning success by 42%. Start with 1-2 achievable objectives.',
      priority: 'high',
      category: 'goals',
      confidence: 85,
      actionable: true,
      suggestedAction: "Create your first learning goal",
      actionUrl: "/goals/create",
      createdAt: new Date(),
      metadata: { goalCount: 0 }
    });
  } else {
    // Analyze goal completion patterns
    const completedGoals = goals.filter(goal => goal.status === 'COMPLETED').length;
    const completionRate = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

    if (completionRate > 70) {
      insights.push({
        id: `goal-achiever-${Date.now()}`,
        type: 'achievement',
        title: '🏆 Goal Achiever',
        description: `Impressive! You've completed ${Math.round(completionRate)}% of your goals. Time to set new challenges!`,
        priority: 'medium',
        category: 'goals',
        confidence: 95,
        actionable: true,
        suggestedAction: "Set more ambitious goals",
        actionUrl: "/goals/create",
        createdAt: new Date(),
        metadata: { completionRate, completedGoals }
      });
    }
  }

  return insights;
}

function generatePerformanceInsights(userData: any, context: AIInsightsContext): AIInsight[] {
  const insights: AIInsight[] = [];

  // Analyze learning patterns
  const timeOfDayPattern = analyzeTimeOfDayPattern(context.activities);
  if (timeOfDayPattern.peak) {
    insights.push({
      id: `peak-learning-time-${Date.now()}`,
      type: 'trend',
      title: '📊 Your Peak Learning Time',
      description: `You're most active during ${timeOfDayPattern.peak}. Consider scheduling important learning sessions then.`,
      priority: 'low',
      category: 'performance',
      confidence: 70,
      actionable: true,
      suggestedAction: "Schedule learning during your peak hours",
      createdAt: new Date(),
      metadata: timeOfDayPattern
    });
  }

  return insights;
}

function generateSocialInsights(userData: any, context: AIInsightsContext): AIInsight[] {
  const insights: AIInsight[] = [];

  const socialAccounts = userData.socialMediaAccounts || [];
  if (socialAccounts.length === 0) {
    insights.push({
      id: `connect-social-${Date.now()}`,
      type: 'recommendation',
      title: '🔗 Connect Your Social Profiles',
      description: 'Connecting social accounts helps showcase your learning journey and build professional networks.',
      priority: 'low',
      category: 'social',
      confidence: 60,
      actionable: true,
      suggestedAction: "Connect your LinkedIn profile",
      actionUrl: "/profile/settings",
      createdAt: new Date(),
      metadata: { socialAccountCount: 0 }
    });
  }

  return insights;
}

// Helper functions
function calculateLearningStreak(activities: any[]): number {
  // Simplified streak calculation
  const learningActivities = activities.filter(a => a.type === 'learning');
  if (learningActivities.length === 0) return 0;
  
  // In a real implementation, this would calculate consecutive days
  return Math.min(learningActivities.length, 30); // Cap at 30 days
}

function calculateAverageCompletionRate(enrollments: any[]): number {
  if (enrollments.length === 0) return 0;
  
  const totalRate = enrollments.reduce((sum: number, enrollment: any) => {
    const course = enrollment.course;
    if (!course || !course.chapters) return sum;
    
    const totalSections = course.chapters.reduce(
      (total: number, chapter: any) => total + (chapter.sections?.length || 0), 0
    );
    const completedSections = course.chapters.reduce(
      (total: number, chapter: any) => total + (chapter.sections?.filter(
        (section: any) => section.userProgress?.some((progress: any) => progress.isCompleted)
      ).length || 0), 0
    );
    
    return sum + (totalSections > 0 ? (completedSections / totalSections) * 100 : 0);
  }, 0);
  
  return totalRate / enrollments.length;
}

function calculateEngagementScore(userData: any): number {
  let score = 0;
  score += (userData.posts?.length || 0) * 2;
  score += (userData.ideas?.length || 0) * 3;
  score += (userData.courses?.length || 0) * 5;
  score += (userData.enrollments?.length || 0) * 4;
  return Math.min(score, 100);
}

function analyzeTimeOfDayPattern(activities: any[]): { peak: string | null; distribution: Record<string, number> } {
  const timeSlots = {
    'Morning (6-12)': 0,
    'Afternoon (12-18)': 0,
    'Evening (18-22)': 0,
    'Night (22-6)': 0
  };

  activities.forEach(activity => {
    const hour = new Date(activity.createdAt).getHours();
    if (hour >= 6 && hour < 12) timeSlots['Morning (6-12)']++;
    else if (hour >= 12 && hour < 18) timeSlots['Afternoon (12-18)']++;
    else if (hour >= 18 && hour < 22) timeSlots['Evening (18-22)']++;
    else timeSlots['Night (22-6)']++;
  });

  const peak = Object.entries(timeSlots).reduce((max, [time, count]) => 
    count > (timeSlots[max] || 0) ? time : max, null
  );

  return { peak, distribution: timeSlots };
} 