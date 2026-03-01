import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  getUserSAMStats,
  getSAMInteractions,
  getSAMAnalytics,
  recordSAMAnalytics,
  SAMAnalytics as SAMAnalyticsType
} from '@/lib/sam/utils/sam-database';
import { SAMInteractionType, SAMInteraction, SAMAnalytics as PrismaSAMAnalytics } from '@prisma/client';

// User stats type from getUserSAMStats
export interface UserSAMStats {
  points: number;
  level: number;
  badges: number;
  streak: number;
  streaks?: Array<{ currentStreak: number; longestStreak: number }>;
  totalPoints?: number;
}

// Analytics metrics and insights types
export interface LearningMetrics {
  totalInteractions: number;
  averageSessionDuration: number;
  mostActiveTime: string;
  preferredFeatures: string[];
  contentQuality: number;
  learningVelocity: number;
  engagementScore: number;
}

export interface ContentInsights {
  mostEditedSections: Array<{ sectionId: string; editCount: number; title?: string }>;
  averageContentLength: number;
  aiAssistanceRate: number;
  suggestionAcceptanceRate: number;
  contentCompletionRate: number;
  timeToComplete: number;
}

export interface BehaviorPatterns {
  workingHours: Array<{ hour: number; frequency: number }>;
  weeklyPattern: Array<{ day: string; activity: number }>;
  featureUsagePattern: Record<string, number>;
  learningPathProgression: Array<{ date: string; milestone: string }>;
}

export interface PersonalizedInsights {
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  predictedNextMilestone: string;
  estimatedTimeToGoal: number;
}

export interface ComprehensiveAnalytics {
  metrics: LearningMetrics;
  contentInsights: ContentInsights;
  behaviorPatterns: BehaviorPatterns;
  personalizedInsights: PersonalizedInsights;
  trends: {
    pointsTrend: Array<{ date: string; points: number }>;
    engagementTrend: Array<{ date: string; score: number }>;
    productivityTrend: Array<{ date: string; itemsCompleted: number }>;
  };
}

// Get comprehensive analytics for a user
export async function getComprehensiveAnalytics(
  userId: string,
  options?: {
    courseId?: string;
    dateRange?: { start: Date; end: Date };
  }
): Promise<ComprehensiveAnalytics> {
  try {
    // Get basic stats
    const userStats = await getUserSAMStats(userId, options?.courseId);
    
    // Get interactions for analysis
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId,
        courseId: options?.courseId,
        createdAt: options?.dateRange ? {
          gte: options.dateRange.start,
          lte: options.dateRange.end,
        } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Analyze last 1000 interactions
    });

    // Get analytics records
    const analyticsRecords = await getSAMAnalytics(userId, {
      courseId: options?.courseId,
      startDate: options?.dateRange?.start,
      endDate: options?.dateRange?.end,
    });

    // Calculate metrics
    const metrics = calculateLearningMetrics(interactions, analyticsRecords);
    const contentInsights = await calculateContentInsights(userId, interactions, options?.courseId);
    const behaviorPatterns = analyzeBehaviorPatterns(interactions);
    const personalizedInsights = generatePersonalizedInsights(metrics, contentInsights, behaviorPatterns, userStats);
    const trends = await calculateTrends(userId, options?.courseId);

    return {
      metrics,
      contentInsights,
      behaviorPatterns,
      personalizedInsights,
      trends,
    };
  } catch (error) {
    logger.error('Error getting comprehensive analytics:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Calculate learning metrics from interactions
function calculateLearningMetrics(
  interactions: SAMInteraction[],
  analyticsRecords: SAMAnalyticsType[]
): LearningMetrics {
  const totalInteractions = interactions.length;
  
  // Calculate average session duration from analytics
  const avgSessionDuration = analyticsRecords.length > 0
    ? analyticsRecords.reduce((sum, record) => sum + (record.responseTime || 0), 0) / analyticsRecords.length
    : 0;

  // Find most active hour
  const hourCounts: Record<number, number> = {};
  interactions.forEach(interaction => {
    const hour = new Date(interaction.createdAt).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const mostActiveHour = Object.entries(hourCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';
  const mostActiveTime = `${mostActiveHour}:00 - ${parseInt(mostActiveHour) + 1}:00`;

  // Calculate preferred features
  const featureCounts: Record<string, number> = {};
  interactions.forEach(interaction => {
    const type = interaction.interactionType;
    featureCounts[type] = (featureCounts[type] || 0) + 1;
  });
  
  const preferredFeatures = Object.entries(featureCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([feature]) => feature);

  // Calculate content quality (based on completion rates and feedback)
  const contentQuality = calculateContentQuality(analyticsRecords);
  
  // Calculate learning velocity (interactions per day)
  const daySpan = interactions.length > 0
    ? Math.max(1, Math.ceil((new Date().getTime() - new Date(interactions[interactions.length - 1].createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const learningVelocity = totalInteractions / daySpan;

  // Calculate engagement score
  const engagementScore = calculateEngagementScore(interactions, analyticsRecords);

  return {
    totalInteractions,
    averageSessionDuration: avgSessionDuration,
    mostActiveTime,
    preferredFeatures,
    contentQuality,
    learningVelocity,
    engagementScore,
  };
}

// Calculate content insights
async function calculateContentInsights(
  userId: string,
  interactions: SAMInteraction[],
  courseId?: string
): Promise<ContentInsights> {
  // Get content-related interactions
  const contentInteractions = interactions.filter(i => 
    ['CONTENT_GENERATE', 'FORM_SUBMIT', 'QUICK_ACTION'].includes(i.interactionType)
  );

  // Calculate most edited sections
  const sectionEdits: Record<string, number> = {};
  interactions.forEach(interaction => {
    if (interaction.sectionId) {
      sectionEdits[interaction.sectionId] = (sectionEdits[interaction.sectionId] || 0) + 1;
    }
  });
  
  const mostEditedSections = Object.entries(sectionEdits)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([sectionId, editCount]) => ({ sectionId, editCount }));

  // Calculate average content length (from generated content)
  // Note: SAMInteraction stores result data in context field as JSON
  const contentLengths = contentInteractions
    .filter(i => {
      if (typeof i.context === 'object' && i.context !== null && 'contentLength' in i.context) {
        return typeof i.context.contentLength === 'number';
      }
      return false;
    })
    .map(i => {
      const context = i.context as { contentLength: number };
      return context.contentLength;
    });
  const averageContentLength = contentLengths.length > 0
    ? contentLengths.reduce((sum, len) => sum + len, 0) / contentLengths.length
    : 0;

  // Calculate AI assistance rate
  const totalContentActions = interactions.filter(i => 
    i.interactionType.includes('CONTENT') || i.interactionType === 'FORM_SUBMIT'
  ).length;
  const aiAssistedActions = interactions.filter(i =>
    ['CONTENT_GENERATE', 'LEARNING_ASSISTANCE', 'QUICK_ACTION'].includes(i.interactionType)
  ).length;
  const aiAssistanceRate = totalContentActions > 0 ? (aiAssistedActions / totalContentActions) * 100 : 0;

  // Calculate suggestion acceptance rate
  const suggestionsGiven = interactions.filter(i => i.interactionType === 'LEARNING_ASSISTANCE').length;
  const suggestionsApplied = interactions.filter(i => i.interactionType === 'QUICK_ACTION').length;
  const suggestionAcceptanceRate = suggestionsGiven > 0 ? (suggestionsApplied / suggestionsGiven) * 100 : 0;

  // Get content completion data
  const completedContent = await db.course.count({
    where: {
      userId,
      isPublished: true,
      ...(courseId && { id: courseId }),
    },
  });
  const totalContent = await db.course.count({
    where: {
      userId,
      ...(courseId && { id: courseId }),
    },
  });
  const contentCompletionRate = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;

  // Calculate average time to complete (in hours)
  const completedCourses = await db.course.findMany({
    where: {
      userId,
      isPublished: true,
      ...(courseId && { id: courseId }),
    },
    select: {
      createdAt: true,
      updatedAt: true,
    },
  });
  
  const completionTimes = completedCourses.map(course => 
    (course.updatedAt.getTime() - course.createdAt.getTime()) / (1000 * 60 * 60)
  );
  const timeToComplete = completionTimes.length > 0
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    : 0;

  return {
    mostEditedSections,
    averageContentLength,
    aiAssistanceRate,
    suggestionAcceptanceRate,
    contentCompletionRate,
    timeToComplete,
  };
}

// Analyze behavior patterns
function analyzeBehaviorPatterns(interactions: SAMInteraction[]): BehaviorPatterns {
  // Working hours analysis
  const hourlyActivity: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    hourlyActivity[i] = 0;
  }
  
  interactions.forEach(interaction => {
    const hour = new Date(interaction.createdAt).getHours();
    hourlyActivity[hour]++;
  });
  
  const workingHours = Object.entries(hourlyActivity)
    .map(([hour, frequency]) => ({ hour: parseInt(hour), frequency }))
    .sort((a, b) => a.hour - b.hour);

  // Weekly pattern analysis
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyActivity: Record<string, number> = {};
  daysOfWeek.forEach(day => { weeklyActivity[day] = 0; });
  
  interactions.forEach(interaction => {
    const day = daysOfWeek[new Date(interaction.createdAt).getDay()];
    weeklyActivity[day]++;
  });
  
  const weeklyPattern = daysOfWeek.map(day => ({
    day,
    activity: weeklyActivity[day],
  }));

  // Feature usage pattern
  const featureUsage: Record<string, number> = {};
  interactions.forEach(interaction => {
    const feature = mapInteractionToFeature(interaction.interactionType);
    featureUsage[feature] = (featureUsage[feature] || 0) + 1;
  });

  // Learning path progression (simplified)
  const milestones = extractMilestones(interactions);
  const learningPathProgression = milestones.map(m => ({
    date: m.date.toISOString().split('T')[0],
    milestone: m.description,
  }));

  return {
    workingHours,
    weeklyPattern,
    featureUsagePattern: featureUsage,
    learningPathProgression,
  };
}

// Generate personalized insights
function generatePersonalizedInsights(
  metrics: LearningMetrics,
  contentInsights: ContentInsights,
  behaviorPatterns: BehaviorPatterns,
  userStats: UserSAMStats
): PersonalizedInsights {
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const recommendations: string[] = [];

  // Analyze strengths
  if (metrics.engagementScore > 80) {
    strengths.push('Highly engaged learner with consistent activity');
  }
  if (contentInsights.aiAssistanceRate > 70) {
    strengths.push('Excellent use of AI assistance for content creation');
  }
  if (metrics.learningVelocity > 10) {
    strengths.push('Fast-paced learner with high productivity');
  }
  if (contentInsights.contentCompletionRate > 80) {
    strengths.push('Strong course completion rate');
  }
  if (userStats.streaks && userStats.streaks.length > 0 && userStats.streaks[0].currentStreak > 7) {
    strengths.push('Maintaining excellent learning consistency');
  }

  // Identify areas for improvement
  if (metrics.engagementScore < 50) {
    areasForImprovement.push('Increase daily engagement with the platform');
    recommendations.push('Try setting a daily reminder to work on your courses');
  }
  if (contentInsights.suggestionAcceptanceRate < 30) {
    areasForImprovement.push('Consider applying more AI suggestions');
    recommendations.push('AI suggestions can significantly improve content quality');
  }
  if (contentInsights.averageContentLength < 200) {
    areasForImprovement.push('Create more detailed content');
    recommendations.push('Use the "Expand" feature to add more depth to your content');
  }
  if (behaviorPatterns.workingHours.filter(h => h.frequency > 0).length < 3) {
    areasForImprovement.push('Spread learning across more hours');
    recommendations.push('Distributed practice leads to better retention');
  }

  // Generate recommendations based on patterns
  const peakHour = behaviorPatterns.workingHours.sort((a, b) => b.frequency - a.frequency)[0];
  recommendations.push(`Your peak productivity is at ${peakHour.hour}:00 - schedule important tasks then`);

  const leastUsedFeature = Object.entries(behaviorPatterns.featureUsagePattern)
    .sort(([, a], [, b]) => a - b)[0];
  if (leastUsedFeature) {
    recommendations.push(`Try using the ${leastUsedFeature[0]} feature more often`);
  }

  // Predict next milestone
  const predictedNextMilestone = predictNextMilestone(userStats, metrics);
  
  // Estimate time to goal (in days)
  const estimatedTimeToGoal = estimateTimeToNextLevel(userStats.totalPoints ?? userStats.points, metrics.learningVelocity);

  return {
    strengths,
    areasForImprovement,
    recommendations,
    predictedNextMilestone,
    estimatedTimeToGoal,
  };
}

// Calculate trends over time
async function calculateTrends(userId: string, courseId?: string): Promise<any> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get daily points  
  const pointsHistory = await db.sAMPoints.findMany({
    where: {
      userId,
      courseId,
      awardedAt: { gte: thirtyDaysAgo },
    },
    select: {
      awardedAt: true,
      points: true,
    },
  });

  // Group points by date
  const pointsByDate: Record<string, number> = {};
  pointsHistory.forEach(point => {
    const date = point.awardedAt.toISOString().split('T')[0];
    pointsByDate[date] = (pointsByDate[date] || 0) + point.points;
  });

  const pointsTrend = Object.entries(pointsByDate).map(([date, points]) => ({
    date,
    points,
  }));

  // Get engagement trend (simplified - based on interaction count)
  const interactions = await db.sAMInteraction.findMany({
    where: {
      userId,
      courseId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      createdAt: true,
    },
  });

  // Group interactions by date
  const interactionsByDate: Record<string, number> = {};
  interactions.forEach(interaction => {
    const date = interaction.createdAt.toISOString().split('T')[0];
    interactionsByDate[date] = (interactionsByDate[date] || 0) + 1;
  });

  const engagementTrend = Object.entries(interactionsByDate).map(([date, count]) => ({
    date,
    score: Math.min(100, count * 10), // Simple scoring
  }));

  // Get productivity trend
  const productivityInteractions = await db.sAMInteraction.findMany({
    where: {
      userId,
      courseId,
      createdAt: { gte: thirtyDaysAgo },
      interactionType: { in: ['CONTENT_GENERATE', 'FORM_SUBMIT', 'QUICK_ACTION'] },
    },
    select: {
      createdAt: true,
    },
  });

  // Group productivity interactions by date
  const productivityByDate: Record<string, number> = {};
  productivityInteractions.forEach(interaction => {
    const date = interaction.createdAt.toISOString().split('T')[0];
    productivityByDate[date] = (productivityByDate[date] || 0) + 1;
  });

  const productivityTrend = Object.entries(productivityByDate).map(([date, count]) => ({
    date,
    itemsCompleted: count,
  }));

  return {
    pointsTrend,
    engagementTrend,
    productivityTrend,
  };
}

// Helper functions
function calculateContentQuality(analyticsRecords: SAMAnalyticsType[]): number {
  if (analyticsRecords.length === 0) return 0;
  
  const avgSatisfaction = analyticsRecords
    .filter(r => r.satisfactionScore !== null)
    .reduce((sum, r) => sum + (r.satisfactionScore || 0), 0) / analyticsRecords.length;
  
  const avgCompletion = analyticsRecords
    .filter(r => r.completionRate !== null)
    .reduce((sum, r) => sum + (r.completionRate || 0), 0) / analyticsRecords.length;
  
  return (avgSatisfaction * 0.6 + avgCompletion * 0.4) / 10;
}

function calculateEngagementScore(interactions: SAMInteraction[], analyticsRecords: SAMAnalyticsType[]): number {
  const recencyScore = calculateRecencyScore(interactions);
  const frequencyScore = calculateFrequencyScore(interactions);
  const diversityScore = calculateDiversityScore(interactions);
  const completionScore = analyticsRecords.length > 0
    ? analyticsRecords.reduce((sum, r) => sum + (r.completionRate || 0), 0) / analyticsRecords.length
    : 0;

  return (recencyScore * 0.3 + frequencyScore * 0.3 + diversityScore * 0.2 + completionScore * 0.2);
}

function calculateRecencyScore(interactions: SAMInteraction[]): number {
  if (interactions.length === 0) return 0;
  
  const mostRecent = new Date(interactions[0].createdAt);
  const daysSinceLastInteraction = Math.floor((new Date().getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastInteraction === 0) return 100;
  if (daysSinceLastInteraction <= 1) return 90;
  if (daysSinceLastInteraction <= 3) return 70;
  if (daysSinceLastInteraction <= 7) return 50;
  if (daysSinceLastInteraction <= 14) return 30;
  return 10;
}

function calculateFrequencyScore(interactions: SAMInteraction[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentInteractions = interactions.filter(i => 
    new Date(i.createdAt) > thirtyDaysAgo
  ).length;
  
  return Math.min(100, (recentInteractions / 30) * 20);
}

function calculateDiversityScore(interactions: SAMInteraction[]): number {
  const uniqueTypes = new Set(interactions.map(i => i.interactionType)).size;
  const possibleTypes = 15; // Approximate number of interaction types
  return (uniqueTypes / possibleTypes) * 100;
}

function mapInteractionToFeature(interactionType: string): string {
  const featureMap: Record<string, string> = {
    'CONTENT_GENERATE': 'AI Content Generation',
    'LEARNING_ASSISTANCE': 'Learning Assistance',
    'QUICK_ACTION': 'Quick Actions',
    'FORM_SUBMIT': 'Form Submission',
    'CHAT_MESSAGE': 'Chat System',
    'FORM_POPULATE': 'Form Population',
    'NAVIGATION': 'Navigation',
    'ANALYTICS_VIEW': 'Analytics',
    'GAMIFICATION_ACTION': 'Gamification',
  };
  
  return featureMap[interactionType] || 'Other';
}

function extractMilestones(interactions: SAMInteraction[]): Array<{ date: Date; description: string }> {
  const milestones: Array<{ date: Date; description: string }> = [];
  
  // Find first interactions of each type
  const firstOfType: Record<string, Date> = {};
  interactions.forEach(interaction => {
    if (!firstOfType[interaction.interactionType]) {
      firstOfType[interaction.interactionType] = new Date(interaction.createdAt);
    }
  });
  
  // Convert to milestones
  Object.entries(firstOfType).forEach(([type, date]) => {
    milestones.push({
      date,
      description: `First ${mapInteractionToFeature(type)}`,
    });
  });
  
  return milestones.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function predictNextMilestone(userStats: UserSAMStats, metrics: LearningMetrics): string {
  const totalPoints = userStats.totalPoints ?? userStats.points;
  const velocity = metrics.learningVelocity;
  
  if (totalPoints < 100) return 'Reach 100 points - SAM Beginner';
  if (totalPoints < 500) return 'Reach 500 points - SAM Enthusiast';
  if (totalPoints < 1000) return 'Reach 1000 points - SAM Expert';
  if (totalPoints < 2500) return 'Reach 2500 points - SAM Master';
  if (velocity < 5) return 'Increase daily activity to 5+ interactions';
  if (userStats.badges < 5) return 'Unlock 5 achievement badges';
  
  return 'Continue your excellent progress!';
}

function estimateTimeToNextLevel(currentPoints: number, velocity: number): number {
  const levelThresholds = [100, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 15000];
  const nextThreshold = levelThresholds.find(t => t > currentPoints) || 15000;
  const pointsNeeded = nextThreshold - currentPoints;
  const pointsPerDay = velocity * 5; // Rough estimate
  
  return Math.ceil(pointsNeeded / Math.max(1, pointsPerDay));
}

// Record analytics session
export async function recordAnalyticsSession(
  userId: string,
  sessionData: {
    sessionId: string;
    interactionCount: number;
    responseTime: number;
    satisfactionScore?: number;
    completionRate?: number;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }
): Promise<void> {
  try {
    await recordSAMAnalytics({
      userId,
      interactionCount: sessionData.interactionCount,
      responseTime: sessionData.responseTime,
      satisfactionScore: sessionData.satisfactionScore,
      completionRate: sessionData.completionRate,
      courseId: sessionData.courseId,
      chapterId: sessionData.chapterId,
      sectionId: sessionData.sectionId,
    });
  } catch (error) {
    logger.error('Error recording analytics session:', error instanceof Error ? error.message : String(error));
  }
}