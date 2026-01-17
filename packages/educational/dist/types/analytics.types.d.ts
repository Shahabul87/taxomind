/**
 * Analytics Engine Types
 */
import type { SAMConfig, SAMDatabaseAdapter } from '@sam-ai/core';
export interface AnalyticsEngineConfig {
    samConfig: SAMConfig;
    database?: SAMDatabaseAdapter;
}
export interface UserSAMStats {
    points: number;
    level: number;
    badges: number;
    streak: number;
    streaks?: Array<{
        currentStreak: number;
        longestStreak: number;
    }>;
    totalPoints?: number;
}
export interface AnalyticsLearningMetrics {
    totalInteractions: number;
    averageSessionDuration: number;
    mostActiveTime: string;
    preferredFeatures: string[];
    contentQuality: number;
    learningVelocity: number;
    engagementScore: number;
}
export interface AnalyticsContentInsights {
    mostEditedSections: Array<{
        sectionId: string;
        editCount: number;
        title?: string;
    }>;
    averageContentLength: number;
    aiAssistanceRate: number;
    suggestionAcceptanceRate: number;
    contentCompletionRate: number;
    timeToComplete: number;
}
export interface AnalyticsBehaviorPatterns {
    workingHours: Array<{
        hour: number;
        frequency: number;
    }>;
    weeklyPattern: Array<{
        day: string;
        activity: number;
    }>;
    featureUsagePattern: Record<string, number>;
    learningPathProgression: Array<{
        date: string;
        milestone: string;
    }>;
}
export interface AnalyticsPersonalizedInsights {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    predictedNextMilestone: string;
    estimatedTimeToGoal: number;
}
export interface AnalyticsTrends {
    pointsTrend: Array<{
        date: string;
        points: number;
    }>;
    engagementTrend: Array<{
        date: string;
        score: number;
    }>;
    productivityTrend: Array<{
        date: string;
        itemsCompleted: number;
    }>;
}
export interface ComprehensiveAnalytics {
    metrics: AnalyticsLearningMetrics;
    contentInsights: AnalyticsContentInsights;
    behaviorPatterns: AnalyticsBehaviorPatterns;
    personalizedInsights: AnalyticsPersonalizedInsights;
    trends: AnalyticsTrends;
}
export interface AnalyticsOptions {
    courseId?: string;
    dateRange?: {
        start: Date;
        end: Date;
    };
}
export interface AnalyticsSessionData {
    sessionId: string;
    interactionCount: number;
    responseTime: number;
    satisfactionScore?: number;
    completionRate?: number;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
}
export interface AnalyticsEngine {
    getComprehensiveAnalytics(userId: string, options?: AnalyticsOptions): Promise<ComprehensiveAnalytics>;
    recordAnalyticsSession(userId: string, sessionData: AnalyticsSessionData): Promise<void>;
}
//# sourceMappingURL=analytics.types.d.ts.map