/**
 * @sam-ai/educational - Collaboration Engine
 *
 * Real-time collaboration analytics engine
 * Tracks and analyzes collaborative learning activities
 */

import type {
  CollaborationEngineConfig,
  CollaborationDatabaseAdapter,
  CollaborationSession,
  CollaborationParticipant,
  CollaborationContribution,
  CollaborationActivity,
  CollaborationActivityType,
  CollaborationSessionMetrics,
  CollaborationInsights,
  CollaborationTopic,
  CollaborationPattern,
  CollaborationRealTimeMetrics,
  CollaborationHotspot,
  CollaborationAnalytics,
  CollaborationSessionAnalytics,
  CollaborationParticipantAnalytics,
  CollaborationParticipantMetric,
  CollaborationEngagementBucket,
  CollaborationRoleMetric,
  CollaborationTrendData,
  CollaborationContentAnalytics,
  CollaborationSharedResource,
  CollaborationNetworkAnalytics,
  CollaborationNode,
  CollaborationConnection,
  CollaborationCentralityScore,
  CollaborationCommunity,
  CollaborationEngine as ICollaborationEngine,
} from '../types';

export class CollaborationEngine implements ICollaborationEngine {
  private databaseAdapter?: CollaborationDatabaseAdapter;
  private activeSessions = new Map<string, CollaborationSession>();
  private metricsCache = new Map<string, CollaborationRealTimeMetrics>();

  constructor(config: CollaborationEngineConfig = {}) {
    this.databaseAdapter = config.databaseAdapter;
  }

  async startCollaborationSession(
    courseId: string,
    chapterId: string,
    initiatorId: string,
    type: CollaborationActivityType
  ): Promise<CollaborationSession> {
    if (!this.databaseAdapter) {
      throw new Error('Database adapter is required');
    }

    const user = await this.databaseAdapter.getUser(initiatorId);
    if (!user) {
      throw new Error('Initiator not found');
    }

    const sessionId = `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: CollaborationSession = {
      sessionId,
      participants: [
        {
          userId: initiatorId,
          userName: user.name || 'Unknown',
          role: 'leader',
          joinTime: new Date(),
          contributions: [],
          engagementScore: 1.0,
        },
      ],
      startTime: new Date(),
      activities: [
        {
          activityId: `act-${Date.now()}`,
          type,
          participants: [initiatorId],
          timestamp: new Date(),
          content: { action: 'session_started', courseId, chapterId },
        },
      ],
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
          type: 'leader-driven',
          description: 'Session just started',
          effectiveness: 0,
        },
        recommendations: [],
        strengths: [],
        improvements: [],
      },
    };

    this.activeSessions.set(sessionId, session);

    await this.databaseAdapter.createSession(session);

    return session;
  }

  async joinCollaborationSession(
    sessionId: string,
    userId: string
  ): Promise<CollaborationSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found or inactive');
    }

    if (!this.databaseAdapter) {
      throw new Error('Database adapter is required');
    }

    const user = await this.databaseAdapter.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const existingParticipant = session.participants.find(
      (p) => p.userId === userId
    );

    if (!existingParticipant) {
      const role = session.participants.length === 0 ? 'leader' : 'contributor';

      session.participants.push({
        userId,
        userName: user.name || 'Unknown',
        role,
        joinTime: new Date(),
        contributions: [],
        engagementScore: 0,
      });

      session.activities.push({
        activityId: `act-${Date.now()}`,
        type: 'discussion',
        participants: [userId],
        timestamp: new Date(),
        content: { action: 'user_joined' },
      });

      session.metrics.totalParticipants++;
      session.metrics.activeParticipants++;

      await this.databaseAdapter.updateSession(sessionId, {
        participants: session.participants,
        metrics: session.metrics,
      });
    }

    return session;
  }

  async recordContribution(
    sessionId: string,
    userId: string,
    contribution: Omit<CollaborationContribution, 'timestamp' | 'reactions'>
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const participant = session.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new Error('Participant not in session');
    }

    const fullContribution: CollaborationContribution = {
      ...contribution,
      timestamp: new Date(),
      reactions: [],
    };

    participant.contributions.push(fullContribution);
    participant.engagementScore = this.calculateEngagementScore(participant);

    session.activities.push({
      activityId: `act-${Date.now()}`,
      type: this.mapContributionToActivity(contribution.type),
      participants: [userId],
      timestamp: new Date(),
      content: contribution.content,
    });

    session.metrics.totalContributions++;
    session.metrics.averageEngagement = this.calculateAverageEngagement(session);
    session.metrics.knowledgeExchange = this.calculateKnowledgeExchange(session);

    session.insights = this.generateSessionInsights(session);

    if (this.databaseAdapter) {
      await this.databaseAdapter.recordContribution(sessionId, userId, contribution);
      await this.databaseAdapter.updateSession(sessionId, {
        participants: session.participants,
        metrics: session.metrics,
        insights: session.insights,
      });
    }
  }

  async analyzeCollaboration(sessionId: string): Promise<CollaborationAnalytics> {
    let session = this.activeSessions.get(sessionId);

    if (!session && this.databaseAdapter) {
      session = await this.databaseAdapter.getSession(sessionId) || undefined;
    }

    if (!session) {
      throw new Error('Session not found');
    }

    const sessionAnalytics = await this.analyzeSession(session);
    const participantAnalytics = this.analyzeParticipants(session);
    const contentAnalytics = this.analyzeContent(session);
    const networkAnalytics = this.analyzeNetwork(session);

    return {
      sessionAnalytics,
      participantAnalytics,
      contentAnalytics,
      networkAnalytics,
    };
  }

  async getRealTimeMetrics(courseId?: string): Promise<CollaborationRealTimeMetrics> {
    const cacheKey = courseId || 'global';
    const cached = this.metricsCache.get(cacheKey);

    if (cached && Date.now() - cached.messagesPerMinute < 10000) {
      return cached;
    }

    const activeSessions = courseId
      ? Array.from(this.activeSessions.values()).filter((s) =>
          s.activities.some((a) => (a.content as Record<string, unknown>)?.courseId === courseId)
        )
      : Array.from(this.activeSessions.values());

    const activeUsers = new Set<string>();
    let recentMessages = 0;
    const hotspots: CollaborationHotspot[] = [];

    activeSessions.forEach((session) => {
      session.participants.forEach((p) => {
        if (!p.leaveTime) {
          activeUsers.add(p.userId);
        }
      });

      const oneMinuteAgo = new Date(Date.now() - 60000);
      recentMessages += session.activities.filter(
        (a) => a.timestamp > oneMinuteAgo
      ).length;

      if (session.metrics.activeParticipants >= 3) {
        const content = session.activities[0]?.content as Record<string, unknown>;
        const location = `${content?.courseId || 'unknown'}/${content?.chapterId || 'unknown'}`;

        hotspots.push({
          location,
          activity: session.metrics.totalContributions,
          participants: session.metrics.activeParticipants,
          type: session.activities[0]?.type || 'discussion',
        });
      }
    });

    const metrics: CollaborationRealTimeMetrics = {
      currentSessions: activeSessions.length,
      activeUsers: activeUsers.size,
      messagesPerMinute: recentMessages,
      averageResponseTime: this.calculateAverageResponseTime(activeSessions),
      collaborationHotspots: hotspots.sort((a, b) => b.activity - a.activity).slice(0, 5),
    };

    this.metricsCache.set(cacheKey, metrics);

    return metrics;
  }

  async endCollaborationSession(sessionId: string): Promise<CollaborationSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found or already ended');
    }

    session.endTime = new Date();

    session.metrics.collaborationIndex = this.calculateCollaborationIndex(session);
    session.metrics.problemSolvingEfficiency = this.calculateProblemSolvingEfficiency(session);
    session.metrics.creativityScore = this.calculateCreativityScore(session);

    session.insights = this.generateSessionInsights(session);

    if (this.databaseAdapter) {
      await this.databaseAdapter.updateSession(sessionId, session);

      const analytics = await this.analyzeCollaboration(sessionId);
      await this.databaseAdapter.storeAnalytics(sessionId, analytics);
    }

    this.activeSessions.delete(sessionId);

    return session;
  }

  getActiveSession(sessionId: string): CollaborationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  private calculateEngagementScore(participant: CollaborationParticipant): number {
    const contributionScore = Math.min(1, participant.contributions.length / 10);
    const impactScore =
      participant.contributions.reduce((sum, c) => sum + c.impact, 0) /
      Math.max(1, participant.contributions.length);
    const reactionScore =
      participant.contributions.reduce((sum, c) => sum + c.reactions.length * 0.1, 0) /
      Math.max(1, participant.contributions.length);

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
        if (contribution.type === 'answer' || contribution.type === 'resource') {
          knowledgeScore += contribution.impact;
        }
        if (contribution.type === 'question') {
          knowledgeScore += 0.5;
        }
      });
    });

    return Math.min(1, knowledgeScore / Math.max(1, session.participants.length));
  }

  private mapContributionToActivity(
    contributionType: CollaborationContribution['type']
  ): CollaborationActivityType {
    const mapping: Record<CollaborationContribution['type'], CollaborationActivityType> = {
      message: 'discussion',
      question: 'q&a',
      answer: 'q&a',
      resource: 'discussion',
      edit: 'co-creation',
      reaction: 'discussion',
    };
    return mapping[contributionType];
  }

  private generateSessionInsights(session: CollaborationSession): CollaborationInsights {
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
      .filter(([, count]) => count > dominantThreshold)
      .map(([userId]) => userId);

    const quietParticipants = sortedContributors
      .filter(([, count]) => count < quietThreshold)
      .map(([userId]) => userId);

    const keyTopics = this.extractKeyTopics(session);
    const collaborationPattern = this.determineCollaborationPattern(
      session,
      dominantContributors.length,
      quietParticipants.length
    );

    const recommendations = this.generateRecommendations(
      collaborationPattern,
      dominantContributors.length,
      quietParticipants.length
    );

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

  private extractKeyTopics(session: CollaborationSession): CollaborationTopic[] {
    const topics = new Map<string, CollaborationTopic>();

    session.activities.forEach((activity) => {
      const content = activity.content as Record<string, unknown>;
      if (content?.topic) {
        const topicName = content.topic as string;
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
        type: 'leader-driven',
        description: 'One participant dominates the discussion',
        effectiveness: 0.6,
      };
    }

    if (engagementVariance < 0.2) {
      return {
        type: 'balanced',
        description: 'All participants contribute equally',
        effectiveness: 0.9,
      };
    }

    if (dominantCount === 0 && quietCount === 0) {
      return {
        type: 'peer-to-peer',
        description: 'Collaborative peer-based interaction',
        effectiveness: 0.8,
      };
    }

    return {
      type: 'fragmented',
      description: 'Uneven participation with multiple quiet members',
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

    if (pattern.type === 'leader-driven') {
      recommendations.push('Encourage more balanced participation');
      recommendations.push('Use structured turn-taking for discussions');
    }

    if (quietCount > 0) {
      recommendations.push('Engage quiet participants with direct questions');
      recommendations.push('Create smaller breakout groups');
    }

    if (pattern.effectiveness < 0.7) {
      recommendations.push('Consider using collaboration tools or frameworks');
      recommendations.push('Set clear collaboration goals and roles');
    }

    return recommendations;
  }

  private identifyStrengths(session: CollaborationSession): string[] {
    const strengths: string[] = [];

    if (session.metrics.knowledgeExchange > 0.7) {
      strengths.push('High knowledge sharing and exchange');
    }

    if (session.metrics.averageEngagement > 0.8) {
      strengths.push('Strong overall engagement');
    }

    if (session.metrics.totalContributions > session.participants.length * 5) {
      strengths.push('Active and dynamic discussion');
    }

    return strengths;
  }

  private identifyImprovements(session: CollaborationSession): string[] {
    const improvements: string[] = [];

    if (session.metrics.collaborationIndex < 0.5) {
      improvements.push('Increase collaborative activities');
    }

    if (session.metrics.problemSolvingEfficiency < 0.6) {
      improvements.push('Structure problem-solving approach');
    }

    if (
      session.insights.quietParticipants.length >
      session.participants.length / 3
    ) {
      improvements.push('Improve participant inclusion');
    }

    return improvements;
  }

  private calculateCollaborationIndex(session: CollaborationSession): number {
    let collaborationScore = 0;

    const contributionTypes = new Set<string>();
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => contributionTypes.add(c.type));
    });
    collaborationScore += Math.min(0.3, contributionTypes.size * 0.1);

    const interactionScore = this.calculateInteractionScore(session);
    collaborationScore += interactionScore * 0.4;

    const balanceScore = 1 - this.calculateEngagementVariance(session);
    collaborationScore += balanceScore * 0.3;

    return Math.min(1, collaborationScore);
  }

  private calculateInteractionScore(session: CollaborationSession): number {
    let interactions = 0;

    session.activities.forEach((activity) => {
      if (activity.participants.length > 1) {
        interactions++;
      }
    });

    return Math.min(1, interactions / Math.max(1, session.activities.length));
  }

  private calculateProblemSolvingEfficiency(session: CollaborationSession): number {
    const problemActivities = session.activities.filter(
      (a) => a.type === 'problem-solving' || a.type === 'q&a'
    );

    if (problemActivities.length === 0) return 0;

    let efficiency = 0;

    const solvedProblems = problemActivities.filter((a) => a.outcome).length;
    efficiency += (solvedProblems / problemActivities.length) * 0.5;

    const avgResponseTime = this.calculateAverageResponseTimeForSession(session);
    const responseScore = Math.max(0, 1 - avgResponseTime / 300);
    efficiency += responseScore * 0.5;

    return efficiency;
  }

  private calculateCreativityScore(session: CollaborationSession): number {
    let creativityScore = 0;

    const uniqueContributions = new Set<string>();
    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        if (c.type === 'message' || c.type === 'edit') {
          uniqueContributions.add(JSON.stringify(c.content));
        }
      });
    });
    creativityScore += Math.min(0.4, (uniqueContributions.size / 20) * 0.4);

    const brainstormingCount = session.activities.filter(
      (a) => a.type === 'brainstorming'
    ).length;
    creativityScore += Math.min(0.3, (brainstormingCount / 5) * 0.3);

    const resourceCount = session.participants.reduce(
      (sum, p) =>
        sum + p.contributions.filter((c) => c.type === 'resource').length,
      0
    );
    creativityScore += Math.min(0.3, (resourceCount / 10) * 0.3);

    return creativityScore;
  }

  private calculateAverageResponseTime(sessions: CollaborationSession[]): number {
    let totalResponseTime = 0;
    let responseCount = 0;

    sessions.forEach((session) => {
      const questions = session.activities.filter(
        (a) => (a.content as Record<string, unknown>)?.type === 'question'
      );

      questions.forEach((question) => {
        const answer = session.activities.find(
          (a) =>
            (a.content as Record<string, unknown>)?.type === 'answer' &&
            (a.content as Record<string, unknown>)?.questionId === question.activityId &&
            a.timestamp > question.timestamp
        );

        if (answer) {
          const responseTime =
            (answer.timestamp.getTime() - question.timestamp.getTime()) / 1000;
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

  private async analyzeSession(
    session: CollaborationSession
  ): Promise<CollaborationSessionAnalytics> {
    const duration = session.endTime
      ? (session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60
      : 0;

    return {
      totalSessions: 1,
      averageDuration: duration,
      averageParticipants: session.participants.length,
      completionRate: session.endTime ? 1 : 0,
      satisfactionScore: this.calculateSatisfactionScore(session),
      outcomeAchievement: session.metrics.problemSolvingEfficiency,
    };
  }

  private calculateSatisfactionScore(session: CollaborationSession): number {
    let satisfaction = session.metrics.averageEngagement * 0.5;

    let totalReactions = 0;
    let positiveReactions = 0;

    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        totalReactions += c.reactions.length;
        positiveReactions += c.reactions.filter(
          (r) => r.type === 'like' || r.type === 'helpful'
        ).length;
      });
    });

    if (totalReactions > 0) {
      satisfaction += (positiveReactions / totalReactions) * 0.5;
    }

    return satisfaction;
  }

  private analyzeParticipants(
    session: CollaborationSession
  ): CollaborationParticipantAnalytics {
    const topContributors = session.participants
      .map((p) => ({
        userId: p.userId,
        userName: p.userName,
        contributionCount: p.contributions.length,
        impactScore:
          p.contributions.reduce((sum, c) => sum + c.impact, 0) /
          Math.max(1, p.contributions.length),
        helpfulnessRating: this.calculateHelpfulnessRating(p),
        peersHelped: this.countPeersHelped(p),
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

  private calculateHelpfulnessRating(participant: CollaborationParticipant): number {
    let helpfulness = 0;
    let ratedContributions = 0;

    participant.contributions.forEach((c) => {
      if (c.reactions.length > 0) {
        const helpfulReactions = c.reactions.filter(
          (r) => r.type === 'helpful' || r.type === 'insightful'
        ).length;
        helpfulness += helpfulReactions / c.reactions.length;
        ratedContributions++;
      }
    });

    return ratedContributions > 0 ? helpfulness / ratedContributions : 0;
  }

  private countPeersHelped(participant: CollaborationParticipant): number {
    const helpedPeers = new Set<string>();

    participant.contributions.forEach((c) => {
      c.reactions
        .filter((r) => r.type === 'helpful' || r.type === 'insightful')
        .forEach((r) => helpedPeers.add(r.userId));
    });

    return helpedPeers.size;
  }

  private calculateEngagementDistribution(
    session: CollaborationSession
  ): CollaborationEngagementBucket[] {
    const buckets: CollaborationEngagementBucket[] = [
      { range: '0-25%', count: 0, percentage: 0 },
      { range: '26-50%', count: 0, percentage: 0 },
      { range: '51-75%', count: 0, percentage: 0 },
      { range: '76-100%', count: 0, percentage: 0 },
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
  ): CollaborationRoleMetric[] {
    const roles = new Map<string, CollaborationRoleMetric>();

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

  private calculateParticipationTrends(
    session: CollaborationSession
  ): CollaborationTrendData[] {
    return [
      {
        period: 'Current Session',
        value: session.metrics.averageEngagement * 100,
        change: 0,
      },
    ];
  }

  private analyzeContent(
    session: CollaborationSession
  ): CollaborationContentAnalytics {
    const mostDiscussedTopics = session.insights.keyTopics.slice(0, 5);

    const questions = session.participants.reduce(
      (sum, p) =>
        sum + p.contributions.filter((c) => c.type === 'question').length,
      0
    );

    const answers = session.participants.reduce(
      (sum, p) =>
        sum + p.contributions.filter((c) => c.type === 'answer').length,
      0
    );

    const questionAnswerRatio = questions > 0 ? answers / questions : 0;

    const knowledgeGapIdentified = this.identifyKnowledgeGaps(session);
    const resourcesShared = this.extractSharedResources(session);
    const contentQuality = this.calculateContentQuality(session);

    return {
      mostDiscussedTopics,
      questionAnswerRatio,
      knowledgeGapIdentified,
      resourcesShared,
      contentQuality,
    };
  }

  private identifyKnowledgeGaps(session: CollaborationSession): string[] {
    const gaps: string[] = [];

    const unansweredQuestions = session.activities
      .filter(
        (a) =>
          (a.content as Record<string, unknown>)?.type === 'question' && !a.outcome
      )
      .map(
        (a) =>
          ((a.content as Record<string, unknown>)?.topic as string) || 'Unknown topic'
      );

    gaps.push(...new Set(unansweredQuestions));

    session.participants.forEach((p) => {
      p.contributions
        .filter(
          (c) =>
            c.type === 'question' &&
            (c.content as Record<string, unknown>)?.confusion
        )
        .forEach((c) => {
          const topic = (c.content as Record<string, unknown>)?.topic as string;
          if (topic && !gaps.includes(topic)) {
            gaps.push(topic);
          }
        });
    });

    return gaps;
  }

  private extractSharedResources(
    session: CollaborationSession
  ): CollaborationSharedResource[] {
    const resources: CollaborationSharedResource[] = [];

    session.participants.forEach((p) => {
      p.contributions
        .filter((c) => c.type === 'resource')
        .forEach((c) => {
          const content = c.content as Record<string, unknown>;
          resources.push({
            resourceId: (content?.resourceId as string) || `res-${Date.now()}`,
            type: (content?.resourceType as string) || 'link',
            sharedBy: p.userId,
            usageCount: (content?.usageCount as number) || 0,
            helpfulnessRating:
              c.reactions.filter((r) => r.type === 'helpful').length /
              Math.max(1, c.reactions.length),
          });
        });
    });

    return resources;
  }

  private calculateContentQuality(session: CollaborationSession): number {
    let qualityScore = 0;

    const avgImpact =
      session.participants.reduce(
        (sum, p) =>
          sum +
          p.contributions.reduce((s, c) => s + c.impact, 0) /
            Math.max(1, p.contributions.length),
        0
      ) / Math.max(1, session.participants.length);
    qualityScore += avgImpact * 0.4;

    let totalReactions = 0;
    let positiveReactions = 0;

    session.participants.forEach((p) => {
      p.contributions.forEach((c) => {
        totalReactions += c.reactions.length;
        positiveReactions += c.reactions.filter(
          (r) => r.type === 'helpful' || r.type === 'insightful'
        ).length;
      });
    });

    if (totalReactions > 0) {
      qualityScore += (positiveReactions / totalReactions) * 0.3;
    }

    qualityScore += session.metrics.knowledgeExchange * 0.3;

    return qualityScore;
  }

  private analyzeNetwork(
    session: CollaborationSession
  ): CollaborationNetworkAnalytics {
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

    session.participants.forEach((p) => {
      nodes.set(p.userId, {
        userId: p.userId,
        connections: [],
        centrality: 0,
        influence: p.engagementScore,
      });
    });

    session.activities.forEach((activity) => {
      if (activity.participants.length > 1) {
        for (let i = 0; i < activity.participants.length; i++) {
          for (let j = i + 1; j < activity.participants.length; j++) {
            this.addConnection(
              nodes,
              activity.participants[i],
              activity.participants[j],
              activity.timestamp
            );
          }
        }
      }
    });

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
  ): CollaborationCentralityScore[] {
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
    let betweenness = 0;

    for (const source of graph) {
      if (source.userId === node.userId) continue;

      for (const target of graph) {
        if (target.userId === node.userId || target.userId === source.userId)
          continue;

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

  private detectCommunities(graph: CollaborationNode[]): CollaborationCommunity[] {
    const communities: CollaborationCommunity[] = [];
    const assigned = new Set<string>();

    graph.forEach((node) => {
      if (assigned.has(node.userId)) return;

      const community: CollaborationCommunity = {
        communityId: `comm-${communities.length}`,
        members: [node.userId],
        cohesion: 0,
        primaryTopic: 'General',
        activityLevel: node.influence,
      };

      assigned.add(node.userId);

      node.connections
        .filter((c) => c.strength > 0.5)
        .forEach((conn) => {
          if (!assigned.has(conn.targetUserId)) {
            community.members.push(conn.targetUserId);
            assigned.add(conn.targetUserId);
          }
        });

      let internalConnections = 0;
      const possibleConnections =
        community.members.length * (community.members.length - 1);

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

      community.cohesion =
        possibleConnections > 0 ? internalConnections / possibleConnections : 0;

      communities.push(community);
    });

    return communities;
  }

  private identifyBridgeUsers(
    graph: CollaborationNode[],
    communities: CollaborationCommunity[]
  ): string[] {
    const bridgeUsers: string[] = [];

    graph.forEach((node) => {
      const connectedCommunities = new Set<string>();

      node.connections.forEach((conn) => {
        communities.forEach((community) => {
          if (community.members.includes(conn.targetUserId)) {
            connectedCommunities.add(community.communityId);
          }
        });
      });

      if (connectedCommunities.size >= 2) {
        bridgeUsers.push(node.userId);
      }
    });

    return bridgeUsers;
  }
}

/**
 * Factory function to create a CollaborationEngine instance
 */
export function createCollaborationEngine(
  config: CollaborationEngineConfig = {}
): CollaborationEngine {
  return new CollaborationEngine(config);
}
