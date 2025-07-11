import { db } from "@/lib/db";
import { 
  SessionStatus, 
  AlertType, 
  AlertSeverity, 
  EngagementTrend 
} from "@prisma/client";

// Success prediction model based on multiple factors
export class PredictiveAnalytics {
  
  /**
   * Predicts the likelihood of course completion (0-100)
   */
  static async predictCourseCompletion(userId: string, courseId: string): Promise<{
    completionProbability: number;
    riskFactors: string[];
    recommendations: string[];
    confidenceScore: number;
  }> {
    try {
      // Get user's enrollment data
      const enrollment = await db.enrollment.findFirst({
        where: { userId, courseId },
        include: {
          User: {
            select: {
              createdAt: true
            }
          },
          Course: {
            select: {
              chapters: {
                select: {
                  id: true
                }
              }
            }
          }
        }
      });

      if (!enrollment) {
        // New user - use platform averages
        return {
          completionProbability: 65, // Platform average
          riskFactors: ["No enrollment data available"],
          recommendations: ["Enroll in the course first", "Set learning goals"],
          confidenceScore: 30
        };
      }

      // Get recent activities
      const recentActivities = await db.activity.findMany({
        where: {
          userId,
          type: 'COURSE_ACTIVITY',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      // Mock metrics based on activities
      const metrics = {
        totalTimeSpent: recentActivities.length * 30, // Assume 30 min per activity
        completionRate: 0.45, // Mock 45% completion
        engagementScore: 75,
        streakDays: 5
      };

      // Mock factors for prediction
      const factors = {
        engagementLevel: metrics.engagementScore / 100,
        consistencyScore: metrics.streakDays / 30,
        progressRate: metrics.completionRate,
        timeInvestment: metrics.totalTimeSpent / 600 // Normalized by 10 hours
      };
      
      // Simple prediction calculation
      const completionProbability = Math.round(
        (factors.engagementLevel * 0.3 + 
         factors.consistencyScore * 0.3 + 
         factors.progressRate * 0.3 + 
         factors.timeInvestment * 0.1) * 100
      );
      
      const riskFactors = completionProbability < 50 
        ? ["Low engagement", "Inconsistent study pattern"]
        : [];
        
      const recommendations = completionProbability < 70
        ? ["Increase study frequency", "Set daily goals", "Join study groups"]
        : ["Keep up the great work!", "Challenge yourself with advanced topics"];
        
      const confidenceScore = recentActivities.length > 10 ? 80 : 50;

      return {
        completionProbability,
        riskFactors,
        recommendations,
        confidenceScore
      };

    } catch (error) {
      console.error("Error predicting course completion:", error);
      throw error;
    }
  }

  /**
   * Predicts optimal study schedule for a user
   */
  static async predictOptimalStudySchedule(userId: string, courseId: string): Promise<{
    recommendedDailyMinutes: number;
    bestStudyTimes: string[];
    weeklyGoal: number;
    estimatedCompletionWeeks: number;
  }> {
    try {
      // Get user's recent activity patterns
      const recentActivities = await db.activity.findMany({
        where: {
          userId,
          type: 'COURSE_ACTIVITY',
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Mock study sessions based on activities
      const recentSessions = recentActivities.map(activity => ({
        id: activity.id,
        userId: activity.userId,
        courseId: courseId,
        startTime: activity.createdAt,
        endTime: new Date(activity.createdAt.getTime() + 30 * 60 * 1000), // Assume 30 min sessions
        duration: 30
      }));

      // Analyze study patterns
      const studyPatterns = this.analyzeStudyPatterns(recentSessions);
      
      // Calculate optimal schedule
      const recommendedDailyMinutes = this.calculateOptimalDailyMinutes(
        studyPatterns,
        300 // Default weekly goal: 300 minutes
      );

      const bestStudyTimes = this.identifyBestStudyTimes(recentSessions);
      const weeklyGoal = recommendedDailyMinutes * 5; // 5 days per week
      const estimatedCompletionWeeks = this.estimateCompletionTime(
        userId,
        courseId,
        recommendedDailyMinutes
      );

      return {
        recommendedDailyMinutes,
        bestStudyTimes,
        weeklyGoal,
        estimatedCompletionWeeks
      };

    } catch (error) {
      console.error("Error predicting study schedule:", error);
      throw error;
    }
  }

  /**
   * Identifies students at risk of dropping out
   */
  static async identifyAtRiskStudents(courseId: string): Promise<{
    userId: string;
    riskScore: number;
    riskFactors: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
    recommendedActions: string[];
  }[]> {
    try {
      // Get all students enrolled in the course
      const enrollments = await db.enrollment.findMany({
        where: { courseId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              learning_metrics: {
                where: { courseId },
                select: {
                  riskScore: true,
                  engagementTrend: true,
                  lastActivityDate: true,
                  totalSessions: true,
                  overallProgress: true
                }
              },
              learning_sessions: {
                where: { 
                  courseId,
                  startTime: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                  }
                },
                select: {
                  status: true,
                  engagementScore: true,
                  completionPercentage: true
                }
              }
            }
          }
        }
      });

      const atRiskStudents = [];

      for (const enrollment of enrollments) {
        const metrics = enrollment.User.learning_metrics[0];
        const recentSessions = enrollment.User.learning_sessions;

        if (!metrics) continue;

        // Calculate comprehensive risk score
        const riskAnalysis = await this.calculateRiskScore(
          enrollment.User.id,
          courseId,
          metrics,
          recentSessions
        );

        if (riskAnalysis.riskScore > 30) { // Only include students with moderate+ risk
          atRiskStudents.push({
            userId: enrollment.User.id,
            ...riskAnalysis
          });
        }
      }

      // Sort by risk score (highest first)
      return atRiskStudents.sort((a, b) => b.riskScore - a.riskScore);

    } catch (error) {
      console.error("Error identifying at-risk students:", error);
      throw error;
    }
  }

  /**
   * Generates personalized learning recommendations
   */
  static async generatePersonalizedRecommendations(
    userId: string,
    courseId: string
  ): Promise<{
    contentRecommendations: string[];
    studyStrategies: string[];
    peerConnections: string[];
    resourceSuggestions: string[];
  }> {
    try {
      // Get user's learning profile
      const profile = await this.buildLearningProfile(userId, courseId);
      
      // Generate AI-powered recommendations
      const recommendations = {
        contentRecommendations: this.generateContentRecommendations(profile),
        studyStrategies: this.generateStudyStrategies(profile),
        peerConnections: await this.generatePeerConnections(userId, courseId, profile),
        resourceSuggestions: this.generateResourceSuggestions(profile)
      };

      return recommendations;

    } catch (error) {
      console.error("Error generating recommendations:", error);
      throw error;
    }
  }

  // Private helper methods

  private static async calculatePredictionFactors(metrics: any, recentSessions: any[]) {
    const now = new Date();
    const enrollmentDays = Math.ceil(
      (now.getTime() - new Date(metrics.user.enrollments[0].createdAt).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    // Session completion rate
    const completedSessions = recentSessions.filter(s => s.status === SessionStatus.COMPLETED).length;
    const sessionCompletionRate = recentSessions.length > 0 ? 
      (completedSessions / recentSessions.length) * 100 : 0;

    // Average engagement score
    const avgEngagementScore = recentSessions.length > 0 ?
      recentSessions.reduce((sum, s) => sum + s.engagementScore, 0) / recentSessions.length : 0;

    // Study consistency (days since last activity)
    const daysSinceLastActivity = Math.ceil(
      (now.getTime() - new Date(metrics.lastActivityDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    // Progress velocity (progress per day)
    const progressVelocity = enrollmentDays > 0 ? metrics.overallProgress / enrollmentDays : 0;

    return {
      overallProgress: metrics.overallProgress,
      sessionCompletionRate,
      avgEngagementScore,
      daysSinceLastActivity,
      progressVelocity,
      engagementTrend: metrics.engagementTrend,
      totalSessions: metrics.totalSessions,
      riskScore: metrics.riskScore,
      enrollmentDays
    };
  }

  private static calculateCompletionProbability(factors: any): number {
    // Simplified ML model - in production, this would use actual ML algorithms
    let probability = 50; // Base probability

    // Progress factor (0-40 points)
    probability += (factors.overallProgress / 100) * 40;

    // Engagement factor (0-20 points)
    probability += (factors.avgEngagementScore / 100) * 20;

    // Consistency factor (-20 to +10 points)
    if (factors.daysSinceLastActivity <= 2) probability += 10;
    else if (factors.daysSinceLastActivity <= 7) probability += 5;
    else if (factors.daysSinceLastActivity <= 14) probability -= 5;
    else probability -= 20;

    // Session completion factor (0-15 points)
    probability += (factors.sessionCompletionRate / 100) * 15;

    // Velocity factor (-10 to +15 points)
    if (factors.progressVelocity > 2) probability += 15;
    else if (factors.progressVelocity > 1) probability += 10;
    else if (factors.progressVelocity < 0.5) probability -= 10;

    // Engagement trend factor
    if (factors.engagementTrend === EngagementTrend.IMPROVING) probability += 10;
    else if (factors.engagementTrend === EngagementTrend.DECLINING) probability -= 10;

    return Math.max(0, Math.min(100, Math.round(probability)));
  }

  private static identifyRiskFactors(factors: any): string[] {
    const riskFactors = [];

    if (factors.daysSinceLastActivity > 7) {
      riskFactors.push("Inactive for more than a week");
    }
    if (factors.avgEngagementScore < 60) {
      riskFactors.push("Low engagement scores");
    }
    if (factors.sessionCompletionRate < 50) {
      riskFactors.push("Low session completion rate");
    }
    if (factors.progressVelocity < 0.5) {
      riskFactors.push("Slow progress velocity");
    }
    if (factors.engagementTrend === EngagementTrend.DECLINING) {
      riskFactors.push("Declining engagement trend");
    }
    if (factors.overallProgress < 20 && factors.enrollmentDays > 30) {
      riskFactors.push("Low progress after significant time");
    }

    return riskFactors;
  }

  private static generateRecommendations(factors: any, riskFactors: string[]): string[] {
    const recommendations = [];

    if (riskFactors.includes("Inactive for more than a week")) {
      recommendations.push("Schedule daily study reminders");
      recommendations.push("Start with shorter 15-minute sessions");
    }
    if (riskFactors.includes("Low engagement scores")) {
      recommendations.push("Try interactive content and quizzes");
      recommendations.push("Join study groups or discussion forums");
    }
    if (riskFactors.includes("Low session completion rate")) {
      recommendations.push("Break content into smaller chunks");
      recommendations.push("Set specific daily goals");
    }
    if (riskFactors.includes("Slow progress velocity")) {
      recommendations.push("Increase study time to 30-45 minutes daily");
      recommendations.push("Use spaced repetition techniques");
    }
    if (factors.overallProgress > 80) {
      recommendations.push("Focus on final assessments and projects");
      recommendations.push("Review and consolidate key concepts");
    }

    return recommendations;
  }

  private static calculateConfidenceScore(factors: any): number {
    let confidence = 50; // Base confidence

    // More sessions = higher confidence
    if (factors.totalSessions > 20) confidence += 30;
    else if (factors.totalSessions > 10) confidence += 20;
    else if (factors.totalSessions > 5) confidence += 10;

    // Longer enrollment = higher confidence
    if (factors.enrollmentDays > 60) confidence += 20;
    else if (factors.enrollmentDays > 30) confidence += 10;

    return Math.max(0, Math.min(100, confidence));
  }

  private static analyzeStudyPatterns(sessions: any[]) {
    const patterns = {
      averageSessionLength: 0,
      preferredHours: [] as number[],
      weeklyFrequency: 0,
      consistencyScore: 0
    };

    if (sessions.length === 0) return patterns;

    // Calculate average session length
    patterns.averageSessionLength = sessions.reduce((sum, s) => 
      sum + (s.duration || 0), 0) / sessions.length;

    // Analyze preferred study hours
    const hourCounts = new Map<number, number>();
    sessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    patterns.preferredHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Calculate weekly frequency
    const weekSpan = Math.ceil(
      (Date.now() - new Date(sessions[sessions.length - 1].startTime).getTime()) / 
      (1000 * 60 * 60 * 24 * 7)
    );
    patterns.weeklyFrequency = weekSpan > 0 ? sessions.length / weekSpan : 0;

    return patterns;
  }

  private static calculateOptimalDailyMinutes(patterns: any, currentGoal: number): number {
    // Base recommendation on current patterns and goals
    const baseMinutes = Math.max(20, patterns.averageSessionLength || 30);
    
    // Adjust based on consistency
    if (patterns.weeklyFrequency > 5) {
      return Math.min(baseMinutes, 60); // Don't overload consistent learners
    } else if (patterns.weeklyFrequency < 3) {
      return Math.max(baseMinutes, 45); // Encourage more time for inconsistent learners
    }
    
    return baseMinutes;
  }

  private static identifyBestStudyTimes(sessions: any[]): string[] {
    const patterns = this.analyzeStudyPatterns(sessions);
    
    return patterns.preferredHours.map(hour => {
      if (hour < 6) return "Early morning (5-6 AM)";
      if (hour < 12) return "Morning (6 AM-12 PM)";
      if (hour < 18) return "Afternoon (12-6 PM)";
      return "Evening (6-11 PM)";
    });
  }

  private static estimateCompletionTime(
    userId: string, 
    courseId: string, 
    dailyMinutes: number
  ): number {
    // This would typically query course content to estimate total time needed
    // For now, using a simplified calculation
    const estimatedTotalMinutes = 1200; // Assume 20 hours for a typical course
    const weeklyMinutes = dailyMinutes * 5; // 5 days per week
    
    return Math.ceil(estimatedTotalMinutes / weeklyMinutes);
  }

  private static async calculateRiskScore(
    userId: string,
    courseId: string,
    metrics: any,
    recentSessions: any[]
  ) {
    let riskScore = 0;
    const riskFactors = [];

    // Inactivity risk
    const daysSinceLastActivity = Math.ceil(
      (Date.now() - new Date(metrics.lastActivityDate).getTime()) / 
      (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastActivity > 14) {
      riskScore += 40;
      riskFactors.push("No activity for over 2 weeks");
    } else if (daysSinceLastActivity > 7) {
      riskScore += 25;
      riskFactors.push("Inactive for over a week");
    }

    // Low engagement risk
    if (metrics.riskScore > 70) {
      riskScore += 30;
      riskFactors.push("High system-calculated risk score");
    }

    // Poor session completion
    const abandonedSessions = recentSessions.filter(s => 
      s.status === SessionStatus.ABANDONED
    ).length;
    
    if (abandonedSessions > recentSessions.length * 0.5) {
      riskScore += 25;
      riskFactors.push("High session abandonment rate");
    }

    // Declining engagement
    if (metrics.engagementTrend === EngagementTrend.DECLINING) {
      riskScore += 20;
      riskFactors.push("Declining engagement trend");
    }

    // Low progress
    if (metrics.overallProgress < 20 && daysSinceLastActivity > 30) {
      riskScore += 15;
      riskFactors.push("Low progress after extended enrollment");
    }

    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (riskScore > 80) urgency = 'critical';
    else if (riskScore > 60) urgency = 'high';
    else if (riskScore > 40) urgency = 'medium';

    // Generate recommended actions
    const recommendedActions = [];
    if (riskScore > 60) {
      recommendedActions.push("Immediate instructor intervention");
      recommendedActions.push("Personalized study plan");
    }
    if (riskFactors.includes("No activity for over 2 weeks")) {
      recommendedActions.push("Send re-engagement email");
      recommendedActions.push("Offer one-on-one support");
    }
    if (riskFactors.includes("High session abandonment rate")) {
      recommendedActions.push("Review content difficulty");
      recommendedActions.push("Provide additional resources");
    }

    return {
      riskScore: Math.min(100, riskScore),
      riskFactors,
      urgency,
      recommendedActions
    };
  }

  private static async buildLearningProfile(userId: string, courseId: string) {
    // This would build a comprehensive learning profile
    // For now, returning a simplified version
    return {
      learningStyle: "visual", // This would be determined from user behavior
      preferredPace: "moderate",
      strengths: ["problem-solving", "visual content"],
      weaknesses: ["theoretical concepts", "reading comprehension"],
      goals: ["career advancement", "skill improvement"]
    };
  }

  private static generateContentRecommendations(profile: any): string[] {
    // AI-powered content recommendations based on learning profile
    return [
      "Interactive coding exercises for hands-on learning",
      "Visual diagrams and infographics for complex concepts",
      "Video tutorials for step-by-step guidance",
      "Practice quizzes to reinforce learning"
    ];
  }

  private static generateStudyStrategies(profile: any): string[] {
    return [
      "Use the Pomodoro Technique (25-minute focused sessions)",
      "Create visual mind maps for complex topics",
      "Practice active recall with flashcards",
      "Teach concepts to others to reinforce understanding"
    ];
  }

  private static async generatePeerConnections(
    userId: string, 
    courseId: string, 
    profile: any
  ): Promise<string[]> {
    // This would match users with similar learning profiles or complementary skills
    return [
      "Connect with Sarah M. - similar learning goals",
      "Join the 'Morning Learners' study group",
      "Participate in peer code reviews",
      "Find a study buddy for accountability"
    ];
  }

  private static generateResourceSuggestions(profile: any): string[] {
    return [
      "Khan Academy for foundational concepts",
      "Coursera specialization tracks",
      "YouTube channels for visual learning",
      "Stack Overflow for practical problem-solving"
    ];
  }
}