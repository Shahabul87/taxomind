/**
 * Collaboration Engine Types
 */

// ============================================================================
// COLLABORATION ENGINE TYPES
// ============================================================================

export interface CollaborationEngineConfig {
  databaseAdapter?: CollaborationDatabaseAdapter;
}

export type CollaborationActivityType =
  | 'discussion'
  | 'co-creation'
  | 'peer-review'
  | 'brainstorming'
  | 'problem-solving'
  | 'presentation'
  | 'q&a';

export type CollaborationContributionType =
  | 'message'
  | 'question'
  | 'answer'
  | 'resource'
  | 'edit'
  | 'reaction';

export type CollaborationReactionType = 'like' | 'helpful' | 'insightful' | 'question';

export interface CollaborationReaction {
  userId: string;
  type: CollaborationReactionType;
  timestamp: Date;
}

export interface CollaborationContribution {
  type: CollaborationContributionType;
  content: Record<string, unknown>;
  timestamp: Date;
  impact: number;
  reactions: CollaborationReaction[];
}

export interface CollaborationParticipant {
  userId: string;
  userName: string;
  role: 'leader' | 'contributor' | 'observer';
  joinTime: Date;
  leaveTime?: Date;
  contributions: CollaborationContribution[];
  engagementScore: number;
}

export interface CollaborationActivity {
  activityId: string;
  type: CollaborationActivityType;
  participants: string[];
  timestamp: Date;
  duration?: number;
  content: Record<string, unknown>;
  outcome?: string;
}

export interface CollaborationSessionMetrics {
  totalParticipants: number;
  activeParticipants: number;
  totalContributions: number;
  averageEngagement: number;
  collaborationIndex: number;
  knowledgeExchange: number;
  problemSolvingEfficiency: number;
  creativityScore: number;
}

export interface CollaborationTopic {
  name: string;
  frequency: number;
  sentiment: number;
  contributors: string[];
}

export interface CollaborationPattern {
  type: 'balanced' | 'leader-driven' | 'peer-to-peer' | 'fragmented';
  description: string;
  effectiveness: number;
}

export interface CollaborationInsights {
  dominantContributors: string[];
  quietParticipants: string[];
  keyTopics: CollaborationTopic[];
  collaborationPattern: CollaborationPattern;
  recommendations: string[];
  strengths: string[];
  improvements: string[];
}

export interface CollaborationSession {
  sessionId: string;
  participants: CollaborationParticipant[];
  startTime: Date;
  endTime?: Date;
  activities: CollaborationActivity[];
  metrics: CollaborationSessionMetrics;
  insights: CollaborationInsights;
}

export interface CollaborationHotspot {
  location: string;
  activity: number;
  participants: number;
  type: CollaborationActivityType;
}

export interface CollaborationRealTimeMetrics {
  currentSessions: number;
  activeUsers: number;
  messagesPerMinute: number;
  averageResponseTime: number;
  collaborationHotspots: CollaborationHotspot[];
}

export interface CollaborationSessionAnalytics {
  totalSessions: number;
  averageDuration: number;
  averageParticipants: number;
  completionRate: number;
  satisfactionScore: number;
  outcomeAchievement: number;
}

export interface CollaborationParticipantMetric {
  userId: string;
  userName: string;
  contributionCount: number;
  impactScore: number;
  helpfulnessRating: number;
  peersHelped: number;
}

export interface CollaborationEngagementBucket {
  range: string;
  count: number;
  percentage: number;
}

export interface CollaborationRoleMetric {
  role: string;
  count: number;
  averageEngagement: number;
  effectiveness: number;
}

export interface CollaborationTrendData {
  period: string;
  value: number;
  change: number;
}

export interface CollaborationParticipantAnalytics {
  topContributors: CollaborationParticipantMetric[];
  engagementDistribution: CollaborationEngagementBucket[];
  roleDistribution: CollaborationRoleMetric[];
  participationTrends: CollaborationTrendData[];
}

export interface CollaborationSharedResource {
  resourceId: string;
  type: string;
  sharedBy: string;
  usageCount: number;
  helpfulnessRating: number;
}

export interface CollaborationContentAnalytics {
  mostDiscussedTopics: CollaborationTopic[];
  questionAnswerRatio: number;
  knowledgeGapIdentified: string[];
  resourcesShared: CollaborationSharedResource[];
  contentQuality: number;
}

export interface CollaborationConnection {
  targetUserId: string;
  strength: number;
  interactions: number;
  lastInteraction: Date;
}

export interface CollaborationNode {
  userId: string;
  connections: CollaborationConnection[];
  centrality: number;
  influence: number;
}

export interface CollaborationCentralityScore {
  userId: string;
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
}

export interface CollaborationCommunity {
  communityId: string;
  members: string[];
  cohesion: number;
  primaryTopic: string;
  activityLevel: number;
}

export interface CollaborationNetworkAnalytics {
  collaborationGraph: CollaborationNode[];
  centralityScores: CollaborationCentralityScore[];
  communities: CollaborationCommunity[];
  bridgeUsers: string[];
}

export interface CollaborationAnalytics {
  sessionAnalytics: CollaborationSessionAnalytics;
  participantAnalytics: CollaborationParticipantAnalytics;
  contentAnalytics: CollaborationContentAnalytics;
  networkAnalytics: CollaborationNetworkAnalytics;
}

export interface CollaborationDatabaseAdapter {
  createSession(session: CollaborationSession): Promise<void>;
  updateSession(sessionId: string, session: Partial<CollaborationSession>): Promise<void>;
  getSession(sessionId: string): Promise<CollaborationSession | null>;
  getUser(userId: string): Promise<{ id: string; name: string | null } | null>;
  recordContribution(
    sessionId: string,
    userId: string,
    contribution: Omit<CollaborationContribution, 'timestamp' | 'reactions'>
  ): Promise<void>;
  storeAnalytics(sessionId: string, analytics: CollaborationAnalytics): Promise<void>;
}

export interface CollaborationEngine {
  startCollaborationSession(
    courseId: string,
    chapterId: string,
    initiatorId: string,
    type: CollaborationActivityType
  ): Promise<CollaborationSession>;

  joinCollaborationSession(
    sessionId: string,
    userId: string
  ): Promise<CollaborationSession>;

  recordContribution(
    sessionId: string,
    userId: string,
    contribution: Omit<CollaborationContribution, 'timestamp' | 'reactions'>
  ): Promise<void>;

  analyzeCollaboration(sessionId: string): Promise<CollaborationAnalytics>;

  getRealTimeMetrics(courseId?: string): Promise<CollaborationRealTimeMetrics>;

  endCollaborationSession(sessionId: string): Promise<CollaborationSession>;

  getActiveSession(sessionId: string): CollaborationSession | undefined;
}
