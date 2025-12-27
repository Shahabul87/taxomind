/**
 * Social Engine Types
 */

// ============================================================================
// SOCIAL ENGINE TYPES
// ============================================================================

export interface SocialEngineConfig {
  databaseAdapter?: SocialDatabaseAdapter;
}

export interface SocialGroupMember {
  userId: string;
  role: 'leader' | 'contributor' | 'observer';
  joinedAt: Date;
  contributionScore: number;
  engagementLevel: number;
  helpfulnessRating: number;
}

export interface SocialLearningGroup {
  id: string;
  name: string;
  members: SocialGroupMember[];
  purpose: string;
  createdAt: Date;
  activityLevel: number;
  collaborationScore: number;
}

export interface SocialActivityMetrics {
  postsPerDay: number;
  commentsPerPost: number;
  averageResponseTime: number;
  engagementRate: number;
  growthRate: number;
}

export interface SocialCommunity {
  id: string;
  name: string;
  memberCount: number;
  activeMembers: number;
  topics: string[];
  activityMetrics: SocialActivityMetrics;
}

export interface SocialInteraction {
  id: string;
  type: 'post' | 'comment' | 'answer' | 'share' | 'reaction';
  userId: string;
  targetUserId?: string;
  contentId: string;
  timestamp: Date;
  sentiment?: 'positive' | 'neutral' | 'negative';
  helpfulness?: number;
  impact?: number;
}

export interface SocialEffectivenessFactor {
  name: string;
  score: number;
  evidence: string[];
  recommendations: string[];
}

export interface SocialEffectivenessScore {
  overall: number;
  knowledgeSharing: number;
  peerSupport: number;
  collaborativeLearning: number;
  communityBuilding: number;
  factors: SocialEffectivenessFactor[];
}

export interface SocialEngagementTrend {
  period: string;
  metric: string;
  value: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
}

export interface SocialEngagementMetrics {
  participationRate: number;
  interactionFrequency: number;
  contentContribution: number;
  responseQuality: number;
  networkGrowth: number;
  trends: SocialEngagementTrend[];
}

export interface SocialLearningOutcome {
  userId: string;
  improvement: number;
  attributedTo: string[];
  confidence: number;
}

export interface SocialNetworkEffect {
  type: 'direct' | 'indirect';
  magnitude: number;
  description: string;
  beneficiaries: number;
}

export interface SocialSharingImpact {
  reach: number;
  engagement: number;
  knowledgeTransfer: number;
  learningOutcomes: SocialLearningOutcome[];
  networkEffects: SocialNetworkEffect[];
}

export interface SocialMatchingFactor {
  factor: string;
  weight: number;
  score: number;
  rationale: string;
}

export interface SocialMentorshipActivity {
  type: string;
  description: string;
  duration: number;
  frequency: string;
  expectedBenefit: string;
}

export interface SocialMatchingResult {
  mentorId: string;
  menteeId: string;
  compatibilityScore: number;
  matchingFactors: SocialMatchingFactor[];
  expectedOutcomes: string[];
  suggestedActivities: SocialMentorshipActivity[];
}

export interface SocialLeadershipAnalysis {
  emergentLeaders: string[];
  leadershipStyle: string;
  effectiveness: number;
  distribution: 'centralized' | 'distributed' | 'absent';
}

export interface SocialCommunicationPattern {
  type: string;
  frequency: number;
  participants: string[];
  effectiveness: number;
}

export interface SocialCommunicationAnalysis {
  patterns: SocialCommunicationPattern[];
  quality: number;
  barriers: string[];
  strengths: string[];
}

export interface SocialConflictAnalysis {
  type: string;
  severity: 'low' | 'medium' | 'high';
  participants: string[];
  impact: number;
  resolution: string;
}

export interface SocialDynamicsRecommendation {
  area: string;
  issue: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  expectedImpact: string;
}

export interface SocialDynamicsAnalysis {
  healthScore: number;
  cohesion: number;
  productivity: number;
  inclusivity: number;
  leadership: SocialLeadershipAnalysis;
  communication: SocialCommunicationAnalysis;
  conflicts: SocialConflictAnalysis[];
  recommendations: SocialDynamicsRecommendation[];
}

export interface SocialUser {
  id: string;
  name?: string | null;
}

export interface SocialDatabaseAdapter {
  getGroupInteractions(groupId: string): Promise<SocialInteraction[]>;
  getUserLearningProfile(userId: string): Promise<{
    experience: number;
    averageScore: number;
    strengths: string[];
    skillGaps: string[];
    availableHours: number;
    requiredHours: number;
  }>;
  getLearningStyle(userId: string): Promise<{ primaryStyle: string } | null>;
  storeEffectivenessScore(groupId: string, score: SocialEffectivenessScore): Promise<void>;
  storeEngagementMetrics(communityId: string, metrics: SocialEngagementMetrics): Promise<void>;
  storeSharingImpact(impact: SocialSharingImpact): Promise<void>;
  storeMatchingResults(results: SocialMatchingResult[]): Promise<void>;
  storeDynamicsAnalysis(groupId: string, analysis: SocialDynamicsAnalysis): Promise<void>;
}

export interface SocialEngine {
  measureCollaborationEffectiveness(
    group: SocialLearningGroup
  ): Promise<SocialEffectivenessScore>;

  analyzeEngagement(community: SocialCommunity): Promise<SocialEngagementMetrics>;

  evaluateKnowledgeSharing(
    interactions: SocialInteraction[]
  ): Promise<SocialSharingImpact>;

  matchMentorMentee(users: SocialUser[]): Promise<SocialMatchingResult[]>;

  assessGroupDynamics(group: SocialLearningGroup): Promise<SocialDynamicsAnalysis>;
}
