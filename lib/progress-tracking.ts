import { db } from "@/lib/db";

export interface LearningSession {
  id: string;
  userId: string;
  courseId: string;
  chapterId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  activeDuration?: number; // actual engaged time
  completionPercentage: number;
  strugglingIndicators: string[];
  engagementScore: number; // 0-100
  interactionCount: number;
  pauseCount: number;
  seekCount: number;
  quizAttempts?: number;
  quizScore?: number;
  status: "ACTIVE" | "COMPLETED" | "ABANDONED" | "STRUGGLING";
}

export interface ProgressAlert {
  id: string;
  userId: string;
  courseId: string;
  alertType: "STRUGGLING" | "AT_RISK" | "INACTIVE" | "MILESTONE" | "ENCOURAGEMENT";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  aiSuggestion: string;
  actionRequired: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface LearningMetrics {
  userId: string;
  courseId: string;
  overallProgress: number;
  learningVelocity: number; // chapters per week
  engagementTrend: "IMPROVING" | "STABLE" | "DECLINING";
  strugglingAreas: string[];
  strengths: string[];
  predictedCompletionDate: Date;
  riskScore: number; // 0-100, higher = more at risk
  lastActivityDate: Date;
  averageSessionDuration: number;
  totalStudyTime: number;
}

export class ProgressTracker {
  
  static async startLearningSession(
    userId: string, 
    courseId: string, 
    chapterId?: string
  ): Promise<LearningSession> {
    const session: LearningSession = {
      id: `session_${Date.now()}_${userId}`,
      userId,
      courseId,
      chapterId,
      startTime: new Date(),
      completionPercentage: 0,
      strugglingIndicators: [],
      engagementScore: 100,
      interactionCount: 0,
      pauseCount: 0,
      seekCount: 0,
      status: "ACTIVE"
    };

    // Store in database (you'll need to create the sessions table)
    // await db.learningSession.create({ data: session });
    
    return session;
  }

  static async updateSessionProgress(
    sessionId: string,
    updates: Partial<LearningSession>
  ): Promise<void> {
    // Update session in database
    // await db.learningSession.update({
    //   where: { id: sessionId },
    //   data: updates
    // });

    // Check for intervention triggers
    if (updates.status === "STRUGGLING" || (updates.engagementScore && updates.engagementScore < 30)) {
      await this.triggerIntervention(sessionId, updates);
    }
  }

  static async endLearningSession(
    sessionId: string,
    finalData: Partial<LearningSession>
  ): Promise<void> {
    const endTime = new Date();
    const duration = finalData.duration || 0;
    
    const updates = {
      ...finalData,
      endTime,
      duration,
      status: finalData.status || "COMPLETED"
    };

    await this.updateSessionProgress(sessionId, updates);
    
    // Update overall learning metrics
    if (finalData.userId && finalData.courseId) {
      await this.updateLearningMetrics(finalData.userId, finalData.courseId);
    }
  }

  static async triggerIntervention(
    sessionId: string,
    sessionData: Partial<LearningSession>
  ): Promise<void> {
    if (!sessionData.userId || !sessionData.courseId) return;

    const alerts = await this.generateInterventionAlerts(sessionData);
    
    for (const alert of alerts) {
      // Store alert in database
      // await db.progressAlert.create({ data: alert });
      
      // Send real-time notification
      await this.sendRealtimeNotification(alert);
    }
  }

  static async generateInterventionAlerts(
    sessionData: Partial<LearningSession>
  ): Promise<ProgressAlert[]> {
    const alerts: ProgressAlert[] = [];
    
    // Struggling detection
    if (sessionData.engagementScore && sessionData.engagementScore < 30) {
      alerts.push({
        id: `alert_${Date.now()}`,
        userId: sessionData.userId!,
        courseId: sessionData.courseId!,
        alertType: "STRUGGLING",
        severity: "HIGH",
        message: "Student showing signs of struggle in current lesson",
        aiSuggestion: "Suggest taking a break or trying an alternative learning approach. Consider providing additional resources or connecting with a tutor.",
        actionRequired: true,
        createdAt: new Date(),
        metadata: {
          engagementScore: sessionData.engagementScore,
          strugglingIndicators: sessionData.strugglingIndicators || []
        }
      });
    }

    // High pause count
    if (sessionData.pauseCount && sessionData.pauseCount > 10) {
      alerts.push({
        id: `alert_${Date.now()}_pause`,
        userId: sessionData.userId!,
        courseId: sessionData.courseId!,
        alertType: "STRUGGLING",
        severity: "MEDIUM",
        message: "Excessive pausing detected - content may be too challenging",
        aiSuggestion: "Recommend reviewing prerequisite material or slowing down the pace. Consider offering simplified explanations.",
        actionRequired: false,
        createdAt: new Date(),
        metadata: {
          pauseCount: sessionData.pauseCount
        }
      });
    }

    return alerts;
  }

  static async updateLearningMetrics(
    userId: string,
    courseId: string
  ): Promise<LearningMetrics> {
    // Calculate comprehensive learning metrics
    const sessions = await this.getUserCourseSessions(userId, courseId);
    const progress = await this.calculateOverallProgress(userId, courseId);
    
    const metrics: LearningMetrics = {
      userId,
      courseId,
      overallProgress: progress.percentage,
      learningVelocity: this.calculateLearningVelocity(sessions),
      engagementTrend: this.determineEngagementTrend(sessions),
      strugglingAreas: this.identifyStrugglingAreas(sessions),
      strengths: this.identifyStrengths(sessions),
      predictedCompletionDate: this.predictCompletionDate(sessions, progress),
      riskScore: this.calculateRiskScore(sessions, progress),
      lastActivityDate: new Date(),
      averageSessionDuration: this.calculateAverageSessionDuration(sessions),
      totalStudyTime: sessions.reduce((total, s) => total + (s.duration || 0), 0)
    };

    // Store metrics in database
    // await db.learningMetrics.upsert({
    //   where: { userId_courseId: { userId, courseId } },
    //   create: metrics,
    //   update: metrics
    // });

    return metrics;
  }

  // Helper methods
  static async getUserCourseSessions(userId: string, courseId: string): Promise<LearningSession[]> {
    // Mock data for now - replace with actual database query
    return [];
  }

  static async calculateOverallProgress(userId: string, courseId: string): Promise<{percentage: number, completedChapters: number, totalChapters: number}> {
    // Mock calculation - replace with actual progress calculation
    return { percentage: 65, completedChapters: 13, totalChapters: 20 };
  }

  static calculateLearningVelocity(sessions: LearningSession[]): number {
    // Calculate chapters completed per week
    const recentSessions = sessions.filter(s => 
      new Date(s.startTime).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000)
    );
    
    const uniqueChapters = new Set(recentSessions.map(s => s.chapterId).filter(Boolean));
    return uniqueChapters.size;
  }

  static determineEngagementTrend(sessions: LearningSession[]): "IMPROVING" | "STABLE" | "DECLINING" {
    if (sessions.length < 3) return "STABLE";
    
    const recent = sessions.slice(-3);
    const older = sessions.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, s) => sum + s.engagementScore, 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + s.engagementScore, 0) / older.length;
    
    if (recentAvg > olderAvg + 10) return "IMPROVING";
    if (recentAvg < olderAvg - 10) return "DECLINING";
    return "STABLE";
  }

  static identifyStrugglingAreas(sessions: LearningSession[]): string[] {
    const strugglingChapters = sessions
      .filter(s => s.engagementScore < 50 || s.strugglingIndicators.length > 0)
      .map(s => s.chapterId)
      .filter(Boolean);
    
    return [...new Set(strugglingChapters)] as string[];
  }

  static identifyStrengths(sessions: LearningSession[]): string[] {
    const strongChapters = sessions
      .filter(s => s.engagementScore > 80 && s.completionPercentage > 90)
      .map(s => s.chapterId)
      .filter(Boolean);
    
    return [...new Set(strongChapters)] as string[];
  }

  static predictCompletionDate(sessions: LearningSession[], progress: any): Date {
    const velocity = this.calculateLearningVelocity(sessions);
    const remainingChapters = progress.totalChapters - progress.completedChapters;
    const weeksToComplete = velocity > 0 ? remainingChapters / velocity : 4;
    
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + (weeksToComplete * 7));
    return completionDate;
  }

  static calculateRiskScore(sessions: LearningSession[], progress: any): number {
    let riskScore = 0;
    
    // Low engagement increases risk
    const avgEngagement = sessions.reduce((sum, s) => sum + s.engagementScore, 0) / sessions.length;
    if (avgEngagement < 50) riskScore += 30;
    else if (avgEngagement < 70) riskScore += 15;
    
    // Slow progress increases risk
    if (progress.percentage < 30 && sessions.length > 5) riskScore += 25;
    
    // Long gaps between sessions increase risk
    const lastSession = sessions[sessions.length - 1];
    if (lastSession) {
      const daysSinceLastSession = (Date.now() - new Date(lastSession.startTime).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastSession > 7) riskScore += 20;
      else if (daysSinceLastSession > 3) riskScore += 10;
    }
    
    return Math.min(riskScore, 100);
  }

  static calculateAverageSessionDuration(sessions: LearningSession[]): number {
    const validSessions = sessions.filter(s => s.duration && s.duration > 0);
    if (validSessions.length === 0) return 0;
    
    return validSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / validSessions.length;
  }

  static async sendRealtimeNotification(alert: ProgressAlert): Promise<void> {
    // Implement WebSocket or Server-Sent Events for real-time notifications

    // For now, we'll integrate with the dashboard's notification system
    // This will be implemented in the next step
  }

  // Real-time monitoring method
  static async monitorActiveSession(sessionId: string): Promise<void> {
    // This would be called periodically to check session health
    setInterval(async () => {
      // Check if session is still active
      // Analyze engagement patterns
      // Trigger interventions if needed
    }, 30000); // Check every 30 seconds
  }
}