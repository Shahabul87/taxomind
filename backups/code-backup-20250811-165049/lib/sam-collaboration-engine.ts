import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Real-Time Collaboration Analytics Engine
// Tracks and analyzes real-time collaborative learning activities

interface CollaborationSession {
  sessionId: string;
  participants: Participant[];
  startTime: Date;
  endTime?: Date;
  activities: CollaborationActivity[];
  metrics: SessionMetrics;
  insights: CollaborationInsights;
}

interface Participant {
  userId: string;
  userName: string;
  role: "leader" | "contributor" | "observer";
  joinTime: Date;
  leaveTime?: Date;
  contributions: Contribution[];
  engagementScore: number;
}

interface Contribution {
  type: "message" | "question" | "answer" | "resource" | "edit" | "reaction";
  content: any;
  timestamp: Date;
  impact: number; // 0-1 score
  reactions: Reaction[];
}

interface Reaction {
  userId: string;
  type: "like" | "helpful" | "insightful" | "question";
  timestamp: Date;
}

interface CollaborationActivity {
  activityId: string;
  type: ActivityType;
  participants: string[];
  timestamp: Date;
  duration?: number;
  content: any;
  outcome?: string;
}

type ActivityType = 
  | "discussion"
  | "co-creation"
  | "peer-review"
  | "brainstorming"
  | "problem-solving"
  | "presentation"
  | "q&a";

interface SessionMetrics {
  totalParticipants: number;
  activeParticipants: number;
  totalContributions: number;
  averageEngagement: number;
  collaborationIndex: number; // 0-1 score
  knowledgeExchange: number;
  problemSolvingEfficiency: number;
  creativityScore: number;
}

interface CollaborationInsights {
  dominantContributors: string[];
  quietParticipants: string[];
  keyTopics: Topic[];
  collaborationPattern: CollaborationPattern;
  recommendations: string[];
  strengths: string[];
  improvements: string[];
}

interface Topic {
  name: string;
  frequency: number;
  sentiment: number;
  contributors: string[];
}

interface CollaborationPattern {
  type: "balanced" | "leader-driven" | "peer-to-peer" | "fragmented";
  description: string;
  effectiveness: number;
}

interface RealTimeMetrics {
  currentSessions: number;
  activeUsers: number;
  messagesPerMinute: number;
  averageResponseTime: number;
  collaborationHotspots: Hotspot[];
}

interface Hotspot {
  location: string; // course/chapter/section
  activity: number;
  participants: number;
  type: ActivityType;
}

interface CollaborationAnalytics {
  sessionAnalytics: SessionAnalytics;
  participantAnalytics: ParticipantAnalytics;
  contentAnalytics: ContentAnalytics;
  networkAnalytics: NetworkAnalytics;
}

interface SessionAnalytics {
  totalSessions: number;
  averageDuration: number;
  averageParticipants: number;
  completionRate: number;
  satisfactionScore: number;
  outcomeAchievement: number;
}

interface ParticipantAnalytics {
  topContributors: ParticipantMetric[];
  engagementDistribution: EngagementBucket[];
  roleDistribution: RoleMetric[];
  participationTrends: TrendData[];
}

interface ParticipantMetric {
  userId: string;
  userName: string;
  contributionCount: number;
  impactScore: number;
  helpfulnessRating: number;
  peersHelped: number;
}

interface EngagementBucket {
  range: string;
  count: number;
  percentage: number;
}

interface RoleMetric {
  role: string;
  count: number;
  averageEngagement: number;
  effectiveness: number;
}

interface TrendData {
  period: string;
  value: number;
  change: number;
}

interface ContentAnalytics {
  mostDiscussedTopics: Topic[];
  questionAnswerRatio: number;
  knowledgeGapIdentified: string[];
  resourcesShared: SharedResource[];
  contentQuality: number;
}

interface SharedResource {
  resourceId: string;
  type: string;
  sharedBy: string;
  usageCount: number;
  helpfulnessRating: number;
}

interface NetworkAnalytics {
  collaborationGraph: CollaborationNode[];
  centralityScores: CentralityScore[];
  communities: Community[];
  bridgeUsers: string[]; // Users connecting different groups
}

interface CollaborationNode {
  userId: string;
  connections: Connection[];
  centrality: number;
  influence: number;
}

interface Connection {
  targetUserId: string;
  strength: number;
  interactions: number;
  lastInteraction: Date;
}

interface CentralityScore {
  userId: string;
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
}

interface Community {
  communityId: string;
  members: string[];
  cohesion: number;
  primaryTopic: string;
  activityLevel: number;
}

export class SAMCollaborationEngine {
  private activeSessions = new Map<string, CollaborationSession>();
  private metricsCache = new Map<string, RealTimeMetrics>();

  async startCollaborationSession(
    courseId: string,
    chapterId: string,
    initiatorId: string,
    type: ActivityType
  ): Promise<CollaborationSession> {
    try {
      const sessionId = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const initiator = await db.user.findUnique({
        where: { id: initiatorId },
      });

      if (!initiator) {
        throw new Error("Initiator not found");
      }

      const session: CollaborationSession = {
        sessionId,
        participants: [{
          userId: initiatorId,
          userName: initiator.name || "Unknown",
          role: "leader",
          joinTime: new Date(),
          contributions: [],
          engagementScore: 1.0,
        }],
        startTime: new Date(),
        activities: [{
          activityId: `act-${Date.now()}`,
          type,
          participants: [initiatorId],
          timestamp: new Date(),
          content: { action: "session_started", courseId, chapterId },
        }],
        metrics: {
          totalParticipants: 1,
          activeParticipants: 1,
          totalContributions: 0,
          averageEngagement: 1.0,
          collaborationIndex: 0,
          knowledgeExchange: 0,
          problemSolvingEfficiency: 0,
          creativityScore: 0,
        },
        insights: {
          dominantContributors: [],
          quietParticipants: [],
          keyTopics: [],
          collaborationPattern: {
            type: "leader-driven",
            description: "Session just started",
            effectiveness: 0,
          },
          recommendations: [],
          strengths: [],
          improvements: [],
        },
      };

      // Store in active sessions
      this.activeSessions.set(sessionId, session);

      // Store in database
      await db.collaborationSession.create({
        data: {
          sessionId,
          courseId,
          chapterId,
          initiatorId,
          sessionType: type,
          startTime: session.startTime,
          participants: JSON.stringify(session.participants),
          isActive: true,
        },
      });

      return session;
    } catch (error) {
      logger.error("Error starting collaboration session:", error);
      throw new Error("Failed to start collaboration session");
    }
  }

  async joinCollaborationSession(
    sessionId: string,
    userId: string
  ): Promise<CollaborationSession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error("Session not found or inactive");
      }

      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Check if user already in session
      const existingParticipant = session.participants.find(
        (p) => p.userId === userId
      );

      if (!existingParticipant) {
        // Determine role based on participation order and pattern
        const role = session.participants.length === 0 ? "leader" : "contributor";

        session.participants.push({
          userId,
          userName: user.name || "Unknown",
          role,
          joinTime: new Date(),
          contributions: [],
          engagementScore: 0,
        });

        // Add join activity
        session.activities.push({
          activityId: `act-${Date.now()}`,
          type: "discussion",
          participants: [userId],
          timestamp: new Date(),
          content: { action: "user_joined" },
        });

        // Update metrics
        session.metrics.totalParticipants++;
        session.metrics.activeParticipants++;

        // Update database
        await db.collaborationSession.update({
          where: { sessionId },
          data: {
            participants: JSON.stringify(session.participants),
            metrics: JSON.stringify(session.metrics),
          },
        });
      }

      return session;
    } catch (error) {
      logger.error("Error joining collaboration session:", error);
      throw new Error("Failed to join collaboration session");
    }
  }

  async recordContribution(
    sessionId: string,
    userId: string,
    contribution: Omit<Contribution, "timestamp" | "reactions">
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      const participant = session.participants.find((p) => p.userId === userId);
      if (!participant) {
        throw new Error("Participant not in session");
      }

      // Create contribution
      const fullContribution: Contribution = {
        ...contribution,
        timestamp: new Date(),
        reactions: [],
      };

      participant.contributions.push(fullContribution);

      // Update engagement score
      participant.engagementScore = this.calculateEngagementScore(participant);

      // Add activity
      session.activities.push({
        activityId: `act-${Date.now()}`,
        type: this.mapContributionToActivity(contribution.type),
        participants: [userId],
        timestamp: new Date(),
        content: contribution.content,
      });

      // Update session metrics
      session.metrics.totalContributions++;
      session.metrics.averageEngagement = this.calculateAverageEngagement(session);
      session.metrics.knowledgeExchange = this.calculateKnowledgeExchange(session);

      // Update insights
      session.insights = await this.generateSessionInsights(session);

      // Store contribution in database
      await db.collaborationContribution.create({
        data: {
          sessionId,
          userId,
          contributionType: contribution.type,
          content: JSON.stringify(contribution.content),
          impact: contribution.impact,
        },
      });

      // Update session in database
      await db.collaborationSession.update({
        where: { sessionId },
        data: {
          participants: JSON.stringify(session.participants),
          metrics: JSON.stringify(session.metrics),
          insights: JSON.stringify(session.insights),
        },
      });
    } catch (error) {
      logger.error("Error recording contribution:", error);
      throw new Error("Failed to record contribution");
    }
  }

  async analyzeCollaboration(
    sessionId: string
  ): Promise<CollaborationAnalytics> {
    try {
      const session = this.activeSessions.get(sessionId) || 
        await this.loadSessionFromDatabase(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      const [
        sessionAnalytics,
        participantAnalytics,
        contentAnalytics,
        networkAnalytics,
      ] = await Promise.all([
        this.analyzeSession(session),
        this.analyzeParticipants(session),
        this.analyzeContent(session),
        this.analyzeNetwork(session),
      ]);

      return {
        sessionAnalytics,
        participantAnalytics,
        contentAnalytics,
        networkAnalytics,
      };
    } catch (error) {
      logger.error("Error analyzing collaboration:", error);
      throw new Error("Failed to analyze collaboration");
    }
  }

  async getRealTimeMetrics(courseId?: string): Promise<RealTimeMetrics> {
    try {
      const cacheKey = courseId || "global";
      const cached = this.metricsCache.get(cacheKey);
      
      // Return cached if recent (within 10 seconds)
      if (cached && Date.now() - cached.messagesPerMinute < 10000) {
        return cached;
      }

      // Calculate real-time metrics
      const activeSessions = courseId
        ? Array.from(this.activeSessions.values()).filter((s) =>
            s.activities.some((a) => a.content?.courseId === courseId)
          )
        : Array.from(this.activeSessions.values());

      const activeUsers = new Set<string>();
      let recentMessages = 0;
      const hotspots: Hotspot[] = [];

      activeSessions.forEach((session) => {
        session.participants.forEach((p) => {
          if (!p.leaveTime) {
            activeUsers.add(p.userId);
          }
        });

        // Count recent messages (last minute)
        const oneMinuteAgo = new Date(Date.now() - 60000);
        recentMessages += session.activities.filter(
          (a) => a.timestamp > oneMinuteAgo
        ).length;

        // Identify hotspots
        if (session.metrics.activeParticipants >= 3) {
          const location = `${session.activities[0]?.content?.courseId || "unknown"}/${
            session.activities[0]?.content?.chapterId || "unknown"
          }`;
          
          hotspots.push({
            location,
            activity: session.metrics.totalContributions,
            participants: session.metrics.activeParticipants,
            type: session.activities[0]?.type || "discussion",
          });
        }
      });

      const metrics: RealTimeMetrics = {
        currentSessions: activeSessions.length,
        activeUsers: activeUsers.size,
        messagesPerMinute: recentMessages,
        averageResponseTime: await this.calculateAverageResponseTime(activeSessions),
        collaborationHotspots: hotspots.sort((a, b) => b.activity - a.activity).slice(0, 5),
      };

      // Cache metrics
      this.metricsCache.set(cacheKey, metrics);

      return metrics;
    } catch (error) {
      logger.error("Error getting real-time metrics:", error);
      throw new Error("Failed to get real-time metrics");
    }
  }

  async endCollaborationSession(
    sessionId: string
  ): Promise<CollaborationSession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error("Session not found or already ended");
      }

      session.endTime = new Date();

      // Calculate final metrics
      const duration = (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60; // minutes
      session.metrics.collaborationIndex = this.calculateCollaborationIndex(session);
      session.metrics.problemSolvingEfficiency = this.calculateProblemSolvingEfficiency(session);
      session.metrics.creativityScore = this.calculateCreativityScore(session);

      // Generate final insights
      session.insights = await this.generateSessionInsights(session);

      // Store final session state
      await db.collaborationSession.update({
        where: { sessionId },
        data: {
          endTime: session.endTime,
          duration,
          isActive: false,
          participants: JSON.stringify(session.participants),
          activities: JSON.stringify(session.activities),
          metrics: JSON.stringify(session.metrics),
          insights: JSON.stringify(session.insights),
        },
      });

      // Generate analytics
      const analytics = await this.analyzeCollaboration(sessionId);
      await db.collaborationAnalytics.create({
        data: {
          sessionId,
          sessionAnalytics: JSON.stringify(analytics.sessionAnalytics),
          participantAnalytics: JSON.stringify(analytics.participantAnalytics),
          contentAnalytics: JSON.stringify(analytics.contentAnalytics),
          networkAnalytics: JSON.stringify(analytics.networkAnalytics),
        },
      });

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      return session;
    } catch (error) {
      logger.error("Error ending collaboration session:", error);
      throw new Error("Failed to end collaboration session");
    }
  }

  private calculateEngagementScore(participant: Participant): number {
    const contributionScore = Math.min(1, participant.contributions.length / 10);
    const impactScore = participant.contributions.reduce(
      (sum, c) => sum + c.impact,
      0
    ) / Math.max(1, participant.contributions.length);
    const reactionScore = participant.contributions.reduce(
      (sum, c) => sum + c.reactions.length * 0.1,
      0
    ) / Math.max(1, participant.contributions.length);

    return (contributionScore + impactScore + reactionScore) / 3;
  }

  private calculateAverageEngagement(session: CollaborationSession): number {
    const totalEngagement = session.participants.reduce(
      (sum, p) => sum + p.engagementScore,
      0
    );
    return totalEngagement / Math.max(1, session.participants.length);
  }

  private calculateKnowledgeExchange(session: CollaborationSession): number {
    let knowledgeScore = 0;
    
    session.participants.forEach((participant) => {
      participant.contributions.forEach((contribution) => {
        if (contribution.type === "answer" || contribution.type === "resource") {
          knowledgeScore += contribution.impact;
        }
        if (contribution.type === "question") {
          knowledgeScore += 0.5; // Questions facilitate knowledge exchange
        }
      });
    });

    return Math.min(1, knowledgeScore / Math.max(1, session.participants.length));
  }

  private mapContributionToActivity(
    contributionType: Contribution["type"]
  ): ActivityType {
    const mapping: Record<Contribution["type"], ActivityType> = {
      message: "discussion",
      question: "q&a",
      answer: "q&a",
      resource: "discussion",
      edit: "co-creation",
      reaction: "discussion",
    };
    return mapping[contributionType];
  }

  private async generateSessionInsights(
    session: CollaborationSession
  ): Promise<CollaborationInsights> {
    // Identify dominant contributors
    const contributionCounts = new Map<string, number>();
    session.participants.forEach((p) => {
      contributionCounts.set(p.userId, p.contributions.length);
    });

    const sortedContributors = Array.from(contributionCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    const totalContributions = session.metrics.totalContributions;
    const dominantThreshold = totalContributions * 0.3;
    const quietThreshold = totalContributions * 0.05;

    const dominantContributors = sortedContributors
      .filter(([_, count]) => count > dominantThreshold)
      .map(([userId]) => userId);

    const quietParticipants = sortedContributors
      .filter(([_, count]) => count < quietThreshold)
      .map(([userId]) => userId);

    // Extract key topics (simplified)
    const keyTopics = this.extractKeyTopics(session);

    // Determine collaboration pattern
    const collaborationPattern = this.determineCollaborationPattern(
      session,
      dominantContributors.length,
      quietParticipants.length
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      collaborationPattern,
      dominantContributors.length,
      quietParticipants.length
    );

    // Identify strengths and improvements
    const strengths = this.identifyStrengths(session);
    const improvements = this.identifyImprovements(session);

    return {
      dominantContributors,
      quietParticipants,
      keyTopics,
      collaborationPattern,
      recommendations,
      strengths,
      improvements,
    };
  }

  private extractKeyTopics(session: CollaborationSession): Topic[] {
    // Simplified topic extraction
    const topics = new Map<string, Topic>();

    session.activities.forEach((activity) => {
      if (activity.content?.topic) {
        const topicName = activity.content.topic;
        const existing = topics.get(topicName) || {
          name: topicName,
          frequency: 0,
          sentiment: 0,
          contributors: [],
        };

        existing.frequency++;
        if (!existing.contributors.includes(activity.participants[0])) {
          existing.contributors.push(activity.participants[0]);
        }

        topics.set(topicName, existing);
      }
    });

    return Array.from(topics.values()).sort((a, b) => b.frequency - a.frequency);
  }

  private determineCollaborationPattern(
    session: CollaborationSession,
    dominantCount: number,
    quietCount: number
  ): CollaborationPattern {
    const participantCount = session.participants.length;
    const engagementVariance = this.calculateEngagementVariance(session);

    if (dominantCount === 1 && quietCount > participantCount / 2) {
      return {
        type: "leader-driven",
        description: "One participant dominates the discussion",
        effectiveness: 0.6,
      };
    }

    if (engagementVariance < 0.2) {
      return {
        type: "balanced",
        description: "All participants contribute equally",
        effectiveness: 0.9,
      };
    }

    if (dominantCount === 0 && quietCount === 0) {
      return {
        type: "peer-to-peer",
        description: "Collaborative peer-based interaction",
        effectiveness: 0.8,
      };
    }

    return {
      type: "fragmented",
      description: "Uneven participation with multiple quiet members",
      effectiveness: 0.5,
    };
  }

  private calculateEngagementVariance(session: CollaborationSession): number {
    const engagements = session.participants.map((p) => p.engagementScore);
    const mean = engagements.reduce((a, b) => a + b, 0) / engagements.length;
    const variance =
      engagements.reduce((sum, e) => sum + Math.pow(e - mean, 2), 0) /
      engagements.length;
    return Math.sqrt(variance);
  }

  private generateRecommendations(
    pattern: CollaborationPattern,
    dominantCount: number,
    quietCount: number
  ): string[] {
    const recommendations: string[] = [];

    if (pattern.type === "leader-driven") {
      recommendations.push("Encourage more balanced participation");
      recommendations.push("Use structured turn-taking for discussions");
    }

    if (quietCount > 0) {
      recommendations.push("Engage quiet participants with direct questions");
      recommendations.push("Create smaller breakout groups");
    }

    if (pattern.effectiveness < 0.7) {
      recommendations.push("Consider using collaboration tools or frameworks");
      recommendations.push("Set clear collaboration goals and roles");
    }

    return recommendations;
  }

  private identifyStrengths(session: CollaborationSession): string[] {
    const strengths: string[] = [];

    if (session.metrics.knowledgeExchange > 0.7) {
      strengths.push("High knowledge sharing and exchange");
    }

    if (session.metrics.averageEngagement > 0.8) {
      strengths.push("Strong overall engagement");
    }

    if (session.metrics.totalContributions > session.participants.length * 5) {
      strengths.push("Active and dynamic discussion");
    }

    return strengths;
  }

  private identifyImprovements(session: CollaborationSession): string[] {
    const improvements: string[] = [];

    if (session.metrics.collaborationIndex < 0.5) {
      improvements.push("Increase collaborative activities");
    }

    if (session.metrics.problemSolvingEfficiency < 0.6) {
      improvements.push("Structure problem-solving approach");
    }

    if (session.insights.quietParticipants.length > session.participants.length / 3) {
      improvements.push("Improve participant inclusion");
    }

    return improvements;
  }

  private calculateCollaborationIndex(session: CollaborationSession): number {
    // Measure how well participants work together
    let collaborationScore = 0;

    // Check for diverse contribution types
    const contributionTypes = new Set<string>();
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => contributionTypes.add(c.type));
    });
    collaborationScore += Math.min(0.3, contributionTypes.size * 0.1);

    // Check for interactions between participants
    const interactionScore = this.calculateInteractionScore(session);
    collaborationScore += interactionScore * 0.4;

    // Check for balanced participation
    const balanceScore = 1 - this.calculateEngagementVariance(session);
    collaborationScore += balanceScore * 0.3;

    return Math.min(1, collaborationScore);
  }

  private calculateInteractionScore(session: CollaborationSession): number {
    // Simplified interaction scoring
    let interactions = 0;
    
    session.activities.forEach((activity) => {
      if (activity.participants.length > 1) {
        interactions++;
      }
    });

    return Math.min(1, interactions / Math.max(1, session.activities.length));
  }

  private calculateProblemSolvingEfficiency(
    session: CollaborationSession
  ): number {
    // Measure how efficiently problems are solved
    const problemActivities = session.activities.filter(
      (a) => a.type === "problem-solving" || a.type === "q&a"
    );

    if (problemActivities.length === 0) return 0;

    let efficiency = 0;
    
    // Check if problems have outcomes/solutions
    const solvedProblems = problemActivities.filter((a) => a.outcome).length;
    efficiency += (solvedProblems / problemActivities.length) * 0.5;

    // Check response time for questions
    const avgResponseTime = this.calculateAverageResponseTimeForSession(session);
    const responseScore = Math.max(0, 1 - avgResponseTime / 300); // 5 minutes baseline
    efficiency += responseScore * 0.5;

    return efficiency;
  }

  private calculateCreativityScore(session: CollaborationSession): number {
    // Measure creative collaboration
    let creativityScore = 0;

    // Diversity of ideas (unique contributions)
    const uniqueContributions = new Set<string>();
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        if (c.type === "message" || c.type === "edit") {
          uniqueContributions.add(JSON.stringify(c.content));
        }
      });
    });
    creativityScore += Math.min(0.4, uniqueContributions.size / 20 * 0.4);

    // Brainstorming activities
    const brainstormingCount = session.activities.filter(
      (a) => a.type === "brainstorming"
    ).length;
    creativityScore += Math.min(0.3, brainstormingCount / 5 * 0.3);

    // Resource sharing
    const resourceCount = session.participants.reduce(
      (sum, p) => sum + p.contributions.filter((c) => c.type === "resource").length,
      0
    );
    creativityScore += Math.min(0.3, resourceCount / 10 * 0.3);

    return creativityScore;
  }

  private async calculateAverageResponseTime(
    sessions: CollaborationSession[]
  ): Promise<number> {
    let totalResponseTime = 0;
    let responseCount = 0;

    sessions.forEach((session) => {
      const questions = session.activities.filter((a) =>
        a.content?.type === "question"
      );

      questions.forEach((question) => {
        const answer = session.activities.find(
          (a) =>
            a.content?.type === "answer" &&
            a.content?.questionId === question.activityId &&
            a.timestamp > question.timestamp
        );

        if (answer) {
          const responseTime =
            (answer.timestamp.getTime() - question.timestamp.getTime()) / 1000; // seconds
          totalResponseTime += responseTime;
          responseCount++;
        }
      });
    });

    return responseCount > 0 ? totalResponseTime / responseCount : 0;
  }

  private calculateAverageResponseTimeForSession(
    session: CollaborationSession
  ): number {
    return this.calculateAverageResponseTime([session]);
  }

  private async loadSessionFromDatabase(
    sessionId: string
  ): Promise<CollaborationSession | null> {
    const dbSession = await db.collaborationSession.findUnique({
      where: { sessionId },
    });

    if (!dbSession) return null;

    return {
      sessionId: dbSession.sessionId,
      participants: JSON.parse(dbSession.participants as string),
      startTime: dbSession.startTime,
      endTime: dbSession.endTime || undefined,
      activities: JSON.parse(dbSession.activities as string),
      metrics: JSON.parse(dbSession.metrics as string),
      insights: JSON.parse(dbSession.insights as string),
    };
  }

  private async analyzeSession(
    session: CollaborationSession
  ): Promise<SessionAnalytics> {
    const duration = session.endTime
      ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60
      : 0;

    return {
      totalSessions: 1, // Single session analysis
      averageDuration: duration,
      averageParticipants: session.participants.length,
      completionRate: session.endTime ? 1 : 0,
      satisfactionScore: await this.calculateSatisfactionScore(session),
      outcomeAchievement: session.metrics.problemSolvingEfficiency,
    };
  }

  private async calculateSatisfactionScore(
    session: CollaborationSession
  ): Promise<number> {
    // Base satisfaction on engagement and positive reactions
    let satisfaction = session.metrics.averageEngagement * 0.5;

    // Add score based on positive reactions
    let totalReactions = 0;
    let positiveReactions = 0;

    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        totalReactions += c.reactions.length;
        positiveReactions += c.reactions.filter(
          (r) => r.type === "like" || r.type === "helpful"
        ).length;
      });
    });

    if (totalReactions > 0) {
      satisfaction += (positiveReactions / totalReactions) * 0.5;
    }

    return satisfaction;
  }

  private async analyzeParticipants(
    session: CollaborationSession
  ): Promise<ParticipantAnalytics> {
    const topContributors = session.participants
      .map((p) => ({
        userId: p.userId,
        userName: p.userName,
        contributionCount: p.contributions.length,
        impactScore: p.contributions.reduce((sum, c) => sum + c.impact, 0) /
          Math.max(1, p.contributions.length),
        helpfulnessRating: this.calculateHelpfulnessRating(p),
        peersHelped: this.countPeersHelped(p, session),
      }))
      .sort((a, b) => b.impactScore - a.impactScore)
      .slice(0, 5);

    const engagementDistribution = this.calculateEngagementDistribution(session);
    const roleDistribution = this.calculateRoleDistribution(session);
    const participationTrends = this.calculateParticipationTrends(session);

    return {
      topContributors,
      engagementDistribution,
      roleDistribution,
      participationTrends,
    };
  }

  private calculateHelpfulnessRating(participant: Participant): number {
    let helpfulness = 0;
    let ratedContributions = 0;

    participant.contributions.forEach((c) => {
      if (c.reactions.length > 0) {
        const helpfulReactions = c.reactions.filter(
          (r) => r.type === "helpful" || r.type === "insightful"
        ).length;
        helpfulness += helpfulReactions / c.reactions.length;
        ratedContributions++;
      }
    });

    return ratedContributions > 0 ? helpfulness / ratedContributions : 0;
  }

  private countPeersHelped(
    participant: Participant,
    session: CollaborationSession
  ): number {
    // Count unique users who reacted positively to this participant's contributions
    const helpedPeers = new Set<string>();

    participant.contributions.forEach((c) => {
      c.reactions
        .filter((r) => r.type === "helpful" || r.type === "insightful")
        .forEach((r) => helpedPeers.add(r.userId));
    });

    return helpedPeers.size;
  }

  private calculateEngagementDistribution(
    session: CollaborationSession
  ): EngagementBucket[] {
    const buckets: EngagementBucket[] = [
      { range: "0-25%", count: 0, percentage: 0 },
      { range: "26-50%", count: 0, percentage: 0 },
      { range: "51-75%", count: 0, percentage: 0 },
      { range: "76-100%", count: 0, percentage: 0 },
    ];

    session.participants.forEach((p) => {
      const score = p.engagementScore;
      if (score <= 0.25) buckets[0].count++;
      else if (score <= 0.5) buckets[1].count++;
      else if (score <= 0.75) buckets[2].count++;
      else buckets[3].count++;
    });

    const total = session.participants.length;
    buckets.forEach((b) => {
      b.percentage = (b.count / total) * 100;
    });

    return buckets;
  }

  private calculateRoleDistribution(
    session: CollaborationSession
  ): RoleMetric[] {
    const roles = new Map<string, RoleMetric>();

    session.participants.forEach((p) => {
      const existing = roles.get(p.role) || {
        role: p.role,
        count: 0,
        averageEngagement: 0,
        effectiveness: 0,
      };

      existing.count++;
      existing.averageEngagement += p.engagementScore;
      
      roles.set(p.role, existing);
    });

    return Array.from(roles.values()).map((r) => ({
      ...r,
      averageEngagement: r.averageEngagement / r.count,
      effectiveness: this.calculateRoleEffectiveness(r.role, session),
    }));
  }

  private calculateRoleEffectiveness(
    role: string,
    session: CollaborationSession
  ): number {
    // Simplified role effectiveness calculation
    const roleParticipants = session.participants.filter((p) => p.role === role);
    
    if (roleParticipants.length === 0) return 0;

    const avgContributions =
      roleParticipants.reduce((sum, p) => sum + p.contributions.length, 0) /
      roleParticipants.length;

    const avgImpact =
      roleParticipants.reduce(
        (sum, p) =>
          sum +
          p.contributions.reduce((s, c) => s + c.impact, 0) /
            Math.max(1, p.contributions.length),
        0
      ) / roleParticipants.length;

    return (avgContributions / 10) * 0.5 + avgImpact * 0.5;
  }

  private calculateParticipationTrends(session: CollaborationSession): TrendData[] {
    // Simplified trend calculation - would normally compare across multiple sessions
    return [
      {
        period: "Current Session",
        value: session.metrics.averageEngagement * 100,
        change: 0,
      },
    ];
  }

  private async analyzeContent(
    session: CollaborationSession
  ): Promise<ContentAnalytics> {
    const mostDiscussedTopics = session.insights.keyTopics.slice(0, 5);
    
    const questions = session.participants.reduce(
      (sum, p) => sum + p.contributions.filter((c) => c.type === "question").length,
      0
    );
    
    const answers = session.participants.reduce(
      (sum, p) => sum + p.contributions.filter((c) => c.type === "answer").length,
      0
    );
    
    const questionAnswerRatio = questions > 0 ? answers / questions : 0;

    const knowledgeGapsIdentified = this.identifyKnowledgeGaps(session);
    const resourcesShared = this.extractSharedResources(session);
    const contentQuality = this.calculateContentQuality(session);

    return {
      mostDiscussedTopics,
      questionAnswerRatio,
      knowledgeGapIdentified: knowledgeGapsIdentified,
      resourcesShared,
      contentQuality,
    };
  }

  private identifyKnowledgeGaps(session: CollaborationSession): string[] {
    const gaps: string[] = [];
    
    // Identify unanswered questions
    const unansweredQuestions = session.activities
      .filter((a) => a.content?.type === "question" && !a.outcome)
      .map((a) => a.content?.topic || "Unknown topic");

    gaps.push(...new Set(unansweredQuestions));

    // Identify topics with low understanding indicators
    session.participants.forEach((p) => {
      p.contributions
        .filter((c) => c.type === "question" && c.content?.confusion)
        .forEach((c) => {
          if (c.content?.topic && !gaps.includes(c.content.topic)) {
            gaps.push(c.content.topic);
          }
        });
    });

    return gaps;
  }

  private extractSharedResources(session: CollaborationSession): SharedResource[] {
    const resources: SharedResource[] = [];

    session.participants.forEach((p) => {
      p.contributions
        .filter((c) => c.type === "resource")
        .forEach((c) => {
          resources.push({
            resourceId: c.content?.resourceId || `res-${Date.now()}`,
            type: c.content?.resourceType || "link",
            sharedBy: p.userId,
            usageCount: c.content?.usageCount || 0,
            helpfulnessRating: c.reactions.filter((r) => r.type === "helpful").length /
              Math.max(1, c.reactions.length),
          });
        });
    });

    return resources;
  }

  private calculateContentQuality(session: CollaborationSession): number {
    let qualityScore = 0;

    // Factor 1: Contribution impact scores
    const avgImpact = session.participants.reduce(
      (sum, p) =>
        sum +
        p.contributions.reduce((s, c) => s + c.impact, 0) /
          Math.max(1, p.contributions.length),
      0
    ) / Math.max(1, session.participants.length);
    qualityScore += avgImpact * 0.4;

    // Factor 2: Positive reaction ratio
    let totalReactions = 0;
    let positiveReactions = 0;
    
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        totalReactions += c.reactions.length;
        positiveReactions += c.reactions.filter(
          (r) => r.type === "helpful" || r.type === "insightful"
        ).length;
      });
    });

    if (totalReactions > 0) {
      qualityScore += (positiveReactions / totalReactions) * 0.3;
    }

    // Factor 3: Knowledge exchange effectiveness
    qualityScore += session.metrics.knowledgeExchange * 0.3;

    return qualityScore;
  }

  private async analyzeNetwork(
    session: CollaborationSession
  ): Promise<NetworkAnalytics> {
    const collaborationGraph = this.buildCollaborationGraph(session);
    const centralityScores = this.calculateCentralityScores(collaborationGraph);
    const communities = this.detectCommunities(collaborationGraph);
    const bridgeUsers = this.identifyBridgeUsers(collaborationGraph, communities);

    return {
      collaborationGraph,
      centralityScores,
      communities,
      bridgeUsers,
    };
  }

  private buildCollaborationGraph(
    session: CollaborationSession
  ): CollaborationNode[] {
    const nodes = new Map<string, CollaborationNode>();

    // Initialize nodes
    session.participants.forEach((p) => {
      nodes.set(p.userId, {
        userId: p.userId,
        connections: [],
        centrality: 0,
        influence: p.engagementScore,
      });
    });

    // Build connections based on interactions
    session.activities.forEach((activity) => {
      if (activity.participants.length > 1) {
        // Create connections between all participants in the activity
        for (let i = 0; i < activity.participants.length; i++) {
          for (let j = i + 1; j < activity.participants.length; j++) {
            const user1 = activity.participants[i];
            const user2 = activity.participants[j];

            this.addConnection(nodes, user1, user2, activity.timestamp);
          }
        }
      }
    });

    // Also create connections based on reactions
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        c.reactions.forEach((r) => {
          this.addConnection(nodes, p.userId, r.userId, r.timestamp);
        });
      });
    });

    return Array.from(nodes.values());
  }

  private addConnection(
    nodes: Map<string, CollaborationNode>,
    user1: string,
    user2: string,
    timestamp: Date
  ): void {
    const node1 = nodes.get(user1);
    const node2 = nodes.get(user2);

    if (!node1 || !node2) return;

    // Update connection for user1
    let conn1 = node1.connections.find((c) => c.targetUserId === user2);
    if (!conn1) {
      conn1 = {
        targetUserId: user2,
        strength: 0,
        interactions: 0,
        lastInteraction: timestamp,
      };
      node1.connections.push(conn1);
    }
    conn1.interactions++;
    conn1.strength = Math.min(1, conn1.interactions / 10);
    conn1.lastInteraction = timestamp;

    // Update connection for user2
    let conn2 = node2.connections.find((c) => c.targetUserId === user1);
    if (!conn2) {
      conn2 = {
        targetUserId: user1,
        strength: 0,
        interactions: 0,
        lastInteraction: timestamp,
      };
      node2.connections.push(conn2);
    }
    conn2.interactions++;
    conn2.strength = Math.min(1, conn2.interactions / 10);
    conn2.lastInteraction = timestamp;
  }

  private calculateCentralityScores(
    graph: CollaborationNode[]
  ): CentralityScore[] {
    return graph.map((node) => ({
      userId: node.userId,
      degreeCentrality: node.connections.length / Math.max(1, graph.length - 1),
      betweennessCentrality: this.calculateBetweennessCentrality(node, graph),
      closenessCentrality: this.calculateClosenessCentrality(node, graph),
    }));
  }

  private calculateBetweennessCentrality(
    node: CollaborationNode,
    graph: CollaborationNode[]
  ): number {
    // Simplified betweenness centrality
    // Count how many shortest paths between other nodes go through this node
    let betweenness = 0;
    const nodeMap = new Map(graph.map((n) => [n.userId, n]));

    for (const source of graph) {
      if (source.userId === node.userId) continue;
      
      for (const target of graph) {
        if (target.userId === node.userId || target.userId === source.userId) continue;
        
        // Check if node is on a path between source and target
        const sourceConnected = source.connections.some(
          (c) => c.targetUserId === node.userId
        );
        const targetConnected = node.connections.some(
          (c) => c.targetUserId === target.userId
        );
        
        if (sourceConnected && targetConnected) {
          betweenness += 0.1;
        }
      }
    }

    return Math.min(1, betweenness);
  }

  private calculateClosenessCentrality(
    node: CollaborationNode,
    graph: CollaborationNode[]
  ): number {
    // Simplified closeness centrality
    // Based on average distance to all other nodes
    const distances = this.calculateDistances(node, graph);
    const totalDistance = Array.from(distances.values()).reduce((a, b) => a + b, 0);
    const avgDistance = totalDistance / Math.max(1, graph.length - 1);
    
    return avgDistance > 0 ? 1 / avgDistance : 0;
  }

  private calculateDistances(
    source: CollaborationNode,
    graph: CollaborationNode[]
  ): Map<string, number> {
    const distances = new Map<string, number>();
    const visited = new Set<string>();
    const queue: { node: CollaborationNode; distance: number }[] = [
      { node: source, distance: 0 },
    ];

    while (queue.length > 0) {
      const { node, distance } = queue.shift()!;
      
      if (visited.has(node.userId)) continue;
      visited.add(node.userId);
      distances.set(node.userId, distance);

      node.connections.forEach((conn) => {
        if (!visited.has(conn.targetUserId)) {
          const targetNode = graph.find((n) => n.userId === conn.targetUserId);
          if (targetNode) {
            queue.push({ node: targetNode, distance: distance + 1 });
          }
        }
      });
    }

    return distances;
  }

  private detectCommunities(graph: CollaborationNode[]): Community[] {
    // Simplified community detection
    const communities: Community[] = [];
    const assigned = new Set<string>();

    graph.forEach((node) => {
      if (assigned.has(node.userId)) return;

      // Create a new community starting from this node
      const community: Community = {
        communityId: `comm-${communities.length}`,
        members: [node.userId],
        cohesion: 0,
        primaryTopic: "General",
        activityLevel: node.influence,
      };

      assigned.add(node.userId);

      // Add strongly connected nodes to the community
      node.connections
        .filter((c) => c.strength > 0.5)
        .forEach((conn) => {
          if (!assigned.has(conn.targetUserId)) {
            community.members.push(conn.targetUserId);
            assigned.add(conn.targetUserId);
          }
        });

      // Calculate cohesion
      let internalConnections = 0;
      let possibleConnections = community.members.length * (community.members.length - 1);

      community.members.forEach((member) => {
        const memberNode = graph.find((n) => n.userId === member);
        if (memberNode) {
          memberNode.connections.forEach((conn) => {
            if (community.members.includes(conn.targetUserId)) {
              internalConnections++;
            }
          });
        }
      });

      community.cohesion = possibleConnections > 0
        ? internalConnections / possibleConnections
        : 0;

      communities.push(community);
    });

    return communities;
  }

  private identifyBridgeUsers(
    graph: CollaborationNode[],
    communities: Community[]
  ): string[] {
    const bridgeUsers: string[] = [];

    graph.forEach((node) => {
      // Find which communities this user connects
      const connectedCommunities = new Set<string>();

      node.connections.forEach((conn) => {
        communities.forEach((community) => {
          if (community.members.includes(conn.targetUserId)) {
            connectedCommunities.add(community.communityId);
          }
        });
      });

      // If user connects 2 or more communities, they're a bridge
      if (connectedCommunities.size >= 2) {
        bridgeUsers.push(node.userId);
      }
    });

    return bridgeUsers;
  }
}

// Export singleton instance
export const samCollaborationEngine = new SAMCollaborationEngine();