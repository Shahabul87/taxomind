import { db } from "@/lib/db";
import { openai } from "@/lib/openai";
import { anthropic } from "@/lib/anthropic";

// Types for Social Learning Analytics Engine
export interface LearningGroup {
  id: string;
  name: string;
  members: GroupMember[];
  purpose: string;
  createdAt: Date;
  activityLevel: number;
  collaborationScore: number;
}

export interface GroupMember {
  userId: string;
  role: 'leader' | 'contributor' | 'observer';
  joinedAt: Date;
  contributionScore: number;
  engagementLevel: number;
  helpfulnessRating: number;
}

export interface Community {
  id: string;
  name: string;
  memberCount: number;
  activeMembers: number;
  topics: string[];
  activityMetrics: ActivityMetrics;
}

export interface ActivityMetrics {
  postsPerDay: number;
  commentsPerPost: number;
  averageResponseTime: number;
  engagementRate: number;
  growthRate: number;
}

export interface Interaction {
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

export interface EffectivenessScore {
  overall: number;
  knowledgeSharing: number;
  peerSupport: number;
  collaborativeLearning: number;
  communityBuilding: number;
  factors: EffectivenessFactor[];
}

export interface EffectivenessFactor {
  name: string;
  score: number;
  evidence: string[];
  recommendations: string[];
}

export interface EngagementMetrics {
  participationRate: number;
  interactionFrequency: number;
  contentContribution: number;
  responseQuality: number;
  networkGrowth: number;
  trends: EngagementTrend[];
}

export interface EngagementTrend {
  period: string;
  metric: string;
  value: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
}

export interface SharingImpact {
  reach: number;
  engagement: number;
  knowledgeTransfer: number;
  learningOutcomes: LearningOutcome[];
  networkEffects: NetworkEffect[];
}

export interface LearningOutcome {
  userId: string;
  improvement: number;
  attributedTo: string[];
  confidence: number;
}

export interface NetworkEffect {
  type: 'direct' | 'indirect';
  magnitude: number;
  description: string;
  beneficiaries: number;
}

export interface MatchingResult {
  mentorId: string;
  menteeId: string;
  compatibilityScore: number;
  matchingFactors: MatchingFactor[];
  expectedOutcomes: string[];
  suggestedActivities: Activity[];
}

export interface MatchingFactor {
  factor: string;
  weight: number;
  score: number;
  rationale: string;
}

export interface Activity {
  type: string;
  description: string;
  duration: number;
  frequency: string;
  expectedBenefit: string;
}

export interface DynamicsAnalysis {
  healthScore: number;
  cohesion: number;
  productivity: number;
  inclusivity: number;
  leadership: LeadershipAnalysis;
  communication: CommunicationAnalysis;
  conflicts: ConflictAnalysis[];
  recommendations: DynamicsRecommendation[];
}

export interface LeadershipAnalysis {
  emergentLeaders: string[];
  leadershipStyle: string;
  effectiveness: number;
  distribution: 'centralized' | 'distributed' | 'absent';
}

export interface CommunicationAnalysis {
  patterns: CommunicationPattern[];
  quality: number;
  barriers: string[];
  strengths: string[];
}

export interface CommunicationPattern {
  type: string;
  frequency: number;
  participants: string[];
  effectiveness: number;
}

export interface ConflictAnalysis {
  type: string;
  severity: 'low' | 'medium' | 'high';
  participants: string[];
  impact: number;
  resolution: string;
}

export interface DynamicsRecommendation {
  area: string;
  issue: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
  expectedImpact: string;
}

export class SAMSocialEngine {
  private static instance: SAMSocialEngine;
  
  static getInstance(): SAMSocialEngine {
    if (!this.instance) {
      this.instance = new SAMSocialEngine();
    }
    return this.instance;
  }

  // Measure Collaboration Effectiveness
  async measureCollaborationEffectiveness(group: LearningGroup): Promise<EffectivenessScore> {
    try {
      // Analyze knowledge sharing
      const knowledgeSharing = await this.analyzeKnowledgeSharing(group);
      
      // Analyze peer support
      const peerSupport = await this.analyzePeerSupport(group);
      
      // Analyze collaborative learning
      const collaborativeLearning = await this.analyzeCollaborativeLearning(group);
      
      // Analyze community building
      const communityBuilding = await this.analyzeCommunityBuilding(group);
      
      // Calculate overall effectiveness
      const overall = this.calculateOverallEffectiveness({
        knowledgeSharing,
        peerSupport,
        collaborativeLearning,
        communityBuilding
      });
      
      // Identify factors and recommendations
      const factors = await this.identifyEffectivenessFactors(group, {
        knowledgeSharing,
        peerSupport,
        collaborativeLearning,
        communityBuilding
      });
      
      const score: EffectivenessScore = {
        overall,
        knowledgeSharing,
        peerSupport,
        collaborativeLearning,
        communityBuilding,
        factors
      };
      
      // Store effectiveness score
      await this.storeEffectivenessScore(group.id, score);
      
      return score;
    } catch (error) {
      console.error('Error measuring collaboration effectiveness:', error);
      throw new Error('Failed to measure collaboration effectiveness');
    }
  }

  // Analyze Engagement
  async analyzeEngagement(community: Community): Promise<EngagementMetrics> {
    try {
      // Calculate participation rate
      const participationRate = community.activeMembers / community.memberCount;
      
      // Analyze interaction frequency
      const interactionFrequency = await this.calculateInteractionFrequency(community);
      
      // Analyze content contribution
      const contentContribution = await this.analyzeContentContribution(community);
      
      // Analyze response quality
      const responseQuality = await this.analyzeResponseQuality(community);
      
      // Calculate network growth
      const networkGrowth = this.calculateNetworkGrowth(community);
      
      // Identify trends
      const trends = await this.identifyEngagementTrends(community);
      
      const metrics: EngagementMetrics = {
        participationRate,
        interactionFrequency,
        contentContribution,
        responseQuality,
        networkGrowth,
        trends
      };
      
      // Store engagement metrics
      await this.storeEngagementMetrics(community.id, metrics);
      
      return metrics;
    } catch (error) {
      console.error('Error analyzing engagement:', error);
      throw new Error('Failed to analyze engagement');
    }
  }

  // Evaluate Knowledge Sharing
  async evaluateKnowledgeSharing(interactions: Interaction[]): Promise<SharingImpact> {
    try {
      // Calculate reach
      const reach = this.calculateKnowledgeReach(interactions);
      
      // Measure engagement with shared knowledge
      const engagement = await this.measureKnowledgeEngagement(interactions);
      
      // Assess knowledge transfer effectiveness
      const knowledgeTransfer = await this.assessKnowledgeTransfer(interactions);
      
      // Track learning outcomes
      const learningOutcomes = await this.trackLearningOutcomes(interactions);
      
      // Analyze network effects
      const networkEffects = await this.analyzeNetworkEffects(interactions);
      
      const impact: SharingImpact = {
        reach,
        engagement,
        knowledgeTransfer,
        learningOutcomes,
        networkEffects
      };
      
      // Store sharing impact
      await this.storeSharingImpact(impact);
      
      return impact;
    } catch (error) {
      console.error('Error evaluating knowledge sharing:', error);
      throw new Error('Failed to evaluate knowledge sharing');
    }
  }

  // Match Mentor-Mentee
  async matchMentorMentee(users: User[]): Promise<MatchingResult[]> {
    try {
      // Identify potential mentors and mentees
      const { mentors, mentees } = await this.categorizeMentorsMentees(users);
      
      const matchingResults: MatchingResult[] = [];
      
      // Match each mentee with best mentor
      for (const mentee of mentees) {
        const bestMatch = await this.findBestMentor(mentee, mentors);
        
        if (bestMatch) {
          // Calculate compatibility
          const compatibility = await this.calculateCompatibility(bestMatch.mentor, mentee);
          
          // Identify matching factors
          const matchingFactors = this.identifyMatchingFactors(bestMatch.mentor, mentee);
          
          // Predict expected outcomes
          const expectedOutcomes = await this.predictMatchingOutcomes(
            bestMatch.mentor,
            mentee,
            compatibility
          );
          
          // Suggest activities
          const suggestedActivities = this.suggestMentorshipActivities(
            bestMatch.mentor,
            mentee
          );
          
          matchingResults.push({
            mentorId: bestMatch.mentor.id,
            menteeId: mentee.id,
            compatibilityScore: compatibility,
            matchingFactors,
            expectedOutcomes,
            suggestedActivities
          });
        }
      }
      
      // Store matching results
      await this.storeMatchingResults(matchingResults);
      
      return matchingResults;
    } catch (error) {
      console.error('Error matching mentor-mentee:', error);
      throw new Error('Failed to match mentor-mentee');
    }
  }

  // Assess Group Dynamics
  async assessGroupDynamics(group: LearningGroup): Promise<DynamicsAnalysis> {
    try {
      // Calculate health score
      const healthScore = await this.calculateGroupHealth(group);
      
      // Measure cohesion
      const cohesion = await this.measureGroupCohesion(group);
      
      // Assess productivity
      const productivity = await this.assessGroupProductivity(group);
      
      // Evaluate inclusivity
      const inclusivity = await this.evaluateInclusivity(group);
      
      // Analyze leadership
      const leadership = await this.analyzeLeadership(group);
      
      // Analyze communication
      const communication = await this.analyzeCommunication(group);
      
      // Identify conflicts
      const conflicts = await this.identifyConflicts(group);
      
      // Generate recommendations
      const recommendations = await this.generateDynamicsRecommendations({
        healthScore,
        cohesion,
        productivity,
        inclusivity,
        leadership,
        communication,
        conflicts
      });
      
      const analysis: DynamicsAnalysis = {
        healthScore,
        cohesion,
        productivity,
        inclusivity,
        leadership,
        communication,
        conflicts,
        recommendations
      };
      
      // Store dynamics analysis
      await this.storeDynamicsAnalysis(group.id, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error assessing group dynamics:', error);
      throw new Error('Failed to assess group dynamics');
    }
  }

  // Helper Methods
  private async analyzeKnowledgeSharing(group: LearningGroup): Promise<number> {
    // Analyze how effectively knowledge is shared within the group
    const interactions = await this.getGroupInteractions(group.id);
    
    let sharingScore = 0;
    let totalWeight = 0;
    
    // Quality of shared content
    const contentQuality = await this.assessSharedContentQuality(interactions);
    sharingScore += contentQuality * 0.3;
    totalWeight += 0.3;
    
    // Frequency of sharing
    const sharingFrequency = interactions.filter(i => 
      i.type === 'post' || i.type === 'share'
    ).length / group.members.length;
    sharingScore += Math.min(1, sharingFrequency / 5) * 0.2;
    totalWeight += 0.2;
    
    // Diversity of contributors
    const uniqueContributors = new Set(interactions.map(i => i.userId)).size;
    const contributorDiversity = uniqueContributors / group.members.length;
    sharingScore += contributorDiversity * 0.25;
    totalWeight += 0.25;
    
    // Response and engagement
    const engagementRate = await this.calculateGroupEngagementRate(interactions);
    sharingScore += engagementRate * 0.25;
    totalWeight += 0.25;
    
    return sharingScore / totalWeight;
  }

  private async analyzePeerSupport(group: LearningGroup): Promise<number> {
    const interactions = await this.getGroupInteractions(group.id);
    
    let supportScore = 0;
    
    // Help-seeking and response rate
    const helpRequests = interactions.filter(i => 
      i.type === 'post' && i.sentiment === 'negative'
    );
    const responses = interactions.filter(i => 
      i.type === 'comment' && i.helpfulness && i.helpfulness > 0.5
    );
    
    const responseRate = helpRequests.length > 0 ? 
      responses.length / helpRequests.length : 0;
    supportScore += Math.min(1, responseRate) * 0.4;
    
    // Quality of support
    const avgHelpfulness = responses.length > 0 ?
      responses.reduce((sum, r) => sum + (r.helpfulness || 0), 0) / responses.length : 0;
    supportScore += avgHelpfulness * 0.3;
    
    // Speed of support
    const avgResponseTime = await this.calculateAverageResponseTime(helpRequests, responses);
    const speedScore = avgResponseTime < 60 ? 1 : // Less than 1 hour
                      avgResponseTime < 240 ? 0.7 : // Less than 4 hours
                      avgResponseTime < 1440 ? 0.4 : // Less than 24 hours
                      0.2;
    supportScore += speedScore * 0.3;
    
    return supportScore;
  }

  private async analyzeCollaborativeLearning(group: LearningGroup): Promise<number> {
    let collaborationScore = 0;
    
    // Joint problem-solving activities
    const collaborativeActivities = await this.getCollaborativeActivities(group.id);
    const activityRate = collaborativeActivities.length / group.members.length;
    collaborationScore += Math.min(1, activityRate / 3) * 0.3;
    
    // Peer teaching instances
    const peerTeaching = await this.identifyPeerTeaching(group);
    collaborationScore += Math.min(1, peerTeaching / group.members.length) * 0.3;
    
    // Knowledge co-creation
    const coCreatedContent = await this.identifyCoCreatedContent(group);
    collaborationScore += Math.min(1, coCreatedContent / 5) * 0.2;
    
    // Group achievement
    const groupAchievements = await this.getGroupAchievements(group.id);
    collaborationScore += Math.min(1, groupAchievements / 10) * 0.2;
    
    return collaborationScore;
  }

  private async analyzeCommunityBuilding(group: LearningGroup): Promise<number> {
    let communityScore = 0;
    
    // Social connections formed
    const connections = await this.analyzeSocialConnections(group);
    const connectionDensity = connections / (group.members.length * (group.members.length - 1) / 2);
    communityScore += connectionDensity * 0.3;
    
    // Inclusive participation
    const inclusivityScore = await this.measureInclusiveParticipation(group);
    communityScore += inclusivityScore * 0.3;
    
    // Shared values and goals
    const alignmentScore = await this.assessValueAlignment(group);
    communityScore += alignmentScore * 0.2;
    
    // Community rituals and traditions
    const ritualsScore = await this.identifyCommunityRituals(group);
    communityScore += ritualsScore * 0.2;
    
    return communityScore;
  }

  private calculateOverallEffectiveness(scores: {
    knowledgeSharing: number;
    peerSupport: number;
    collaborativeLearning: number;
    communityBuilding: number;
  }): number {
    // Weighted average with emphasis on learning outcomes
    return (
      scores.knowledgeSharing * 0.25 +
      scores.peerSupport * 0.25 +
      scores.collaborativeLearning * 0.35 +
      scores.communityBuilding * 0.15
    );
  }

  private async identifyEffectivenessFactors(
    group: LearningGroup,
    scores: any
  ): Promise<EffectivenessFactor[]> {
    const factors: EffectivenessFactor[] = [];
    
    // Knowledge sharing factors
    if (scores.knowledgeSharing < 0.6) {
      factors.push({
        name: 'Knowledge Sharing',
        score: scores.knowledgeSharing,
        evidence: [
          'Low content contribution rate',
          'Limited diversity in contributors'
        ],
        recommendations: [
          'Implement knowledge sharing incentives',
          'Create structured sharing opportunities',
          'Recognize top contributors'
        ]
      });
    }
    
    // Peer support factors
    if (scores.peerSupport < 0.7) {
      factors.push({
        name: 'Peer Support',
        score: scores.peerSupport,
        evidence: [
          'Slow response to help requests',
          'Low engagement with struggling peers'
        ],
        recommendations: [
          'Establish peer mentoring program',
          'Create help request channels',
          'Train members in supportive communication'
        ]
      });
    }
    
    // Collaborative learning factors
    if (scores.collaborativeLearning > 0.8) {
      factors.push({
        name: 'Collaborative Learning',
        score: scores.collaborativeLearning,
        evidence: [
          'High rate of joint activities',
          'Strong peer teaching culture'
        ],
        recommendations: [
          'Maintain current collaboration practices',
          'Document successful collaboration patterns',
          'Share best practices with other groups'
        ]
      });
    }
    
    return factors;
  }

  private async calculateInteractionFrequency(community: Community): Promise<number> {
    // Calculate average interactions per active member per day
    const dailyInteractions = community.activityMetrics.postsPerDay + 
      (community.activityMetrics.postsPerDay * community.activityMetrics.commentsPerPost);
    
    return dailyInteractions / community.activeMembers;
  }

  private async analyzeContentContribution(community: Community): Promise<number> {
    // Analyze quality and quantity of content contributions
    const contributionRate = community.activityMetrics.postsPerDay / community.activeMembers;
    const qualityFactor = 0.7; // Would be calculated from content analysis
    
    return Math.min(1, contributionRate * qualityFactor);
  }

  private async analyzeResponseQuality(community: Community): Promise<number> {
    // Analyze the quality of responses and discussions
    const avgResponseLength = 150; // Would be calculated from actual data
    const helpfulnessRating = 0.8; // Would be from user ratings
    const responseRelevance = 0.85; // Would be from NLP analysis
    
    return (helpfulnessRating * 0.5) + (responseRelevance * 0.3) + 
           (Math.min(1, avgResponseLength / 200) * 0.2);
  }

  private calculateNetworkGrowth(community: Community): number {
    // Calculate network growth rate
    return community.activityMetrics.growthRate;
  }

  private async identifyEngagementTrends(community: Community): Promise<EngagementTrend[]> {
    const trends: EngagementTrend[] = [];
    
    // Participation trend
    trends.push({
      period: 'weekly',
      metric: 'participation',
      value: community.activityMetrics.engagementRate,
      change: 0.05, // 5% increase
      direction: 'up'
    });
    
    // Content creation trend
    trends.push({
      period: 'monthly',
      metric: 'content-creation',
      value: community.activityMetrics.postsPerDay,
      change: -0.02, // 2% decrease
      direction: 'down'
    });
    
    // Response time trend
    trends.push({
      period: 'weekly',
      metric: 'response-time',
      value: community.activityMetrics.averageResponseTime,
      change: 0,
      direction: 'stable'
    });
    
    return trends;
  }

  private calculateKnowledgeReach(interactions: Interaction[]): number {
    // Calculate unique users reached
    const uniqueRecipients = new Set<string>();
    
    interactions.forEach(interaction => {
      if (interaction.targetUserId) {
        uniqueRecipients.add(interaction.targetUserId);
      }
    });
    
    return uniqueRecipients.size;
  }

  private async measureKnowledgeEngagement(interactions: Interaction[]): Promise<number> {
    // Measure engagement with shared knowledge
    const totalInteractions = interactions.length;
    const positiveInteractions = interactions.filter(i => 
      i.sentiment === 'positive' || (i.helpfulness && i.helpfulness > 0.5)
    ).length;
    
    return totalInteractions > 0 ? positiveInteractions / totalInteractions : 0;
  }

  private async assessKnowledgeTransfer(interactions: Interaction[]): Promise<number> {
    // Assess effectiveness of knowledge transfer
    let transferScore = 0;
    
    // Comprehension indicators
    const questions = interactions.filter(i => i.type === 'comment' && i.sentiment === 'neutral');
    const clarifications = interactions.filter(i => i.type === 'answer');
    
    const clarificationRate = questions.length > 0 ? clarifications.length / questions.length : 1;
    transferScore += clarificationRate * 0.4;
    
    // Application indicators
    const applications = interactions.filter(i => i.impact && i.impact > 0.5);
    const applicationRate = applications.length / Math.max(1, interactions.length);
    transferScore += applicationRate * 0.6;
    
    return transferScore;
  }

  private async trackLearningOutcomes(interactions: Interaction[]): Promise<LearningOutcome[]> {
    const outcomes: LearningOutcome[] = [];
    
    // Group interactions by user
    const userInteractions = new Map<string, Interaction[]>();
    interactions.forEach(interaction => {
      if (!userInteractions.has(interaction.userId)) {
        userInteractions.set(interaction.userId, []);
      }
      userInteractions.get(interaction.userId)!.push(interaction);
    });
    
    // Calculate learning outcomes for each user
    for (const [userId, userInts] of userInteractions) {
      const improvement = this.calculateUserImprovement(userInts);
      const attributedTo = this.identifyLearningAttributions(userInts);
      
      outcomes.push({
        userId,
        improvement,
        attributedTo,
        confidence: 0.75 // Would be calculated based on data quality
      });
    }
    
    return outcomes;
  }

  private calculateUserImprovement(interactions: Interaction[]): number {
    // Calculate improvement based on interaction quality over time
    if (interactions.length < 2) return 0;
    
    const sortedInteractions = interactions.sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    const earlyQuality = sortedInteractions
      .slice(0, Math.floor(interactions.length / 2))
      .reduce((sum, i) => sum + (i.helpfulness || 0.5), 0) / Math.floor(interactions.length / 2);
    
    const lateQuality = sortedInteractions
      .slice(Math.floor(interactions.length / 2))
      .reduce((sum, i) => sum + (i.helpfulness || 0.5), 0) / Math.ceil(interactions.length / 2);
    
    return (lateQuality - earlyQuality) / earlyQuality;
  }

  private identifyLearningAttributions(interactions: Interaction[]): string[] {
    const attributions: string[] = [];
    
    // Identify helpful interactions
    const helpfulInteractions = interactions.filter(i => 
      i.helpfulness && i.helpfulness > 0.7
    );
    
    helpfulInteractions.forEach(interaction => {
      if (interaction.targetUserId) {
        attributions.push(`peer-support-${interaction.targetUserId}`);
      }
      if (interaction.type === 'answer') {
        attributions.push('knowledge-sharing');
      }
    });
    
    return [...new Set(attributions)];
  }

  private async analyzeNetworkEffects(interactions: Interaction[]): Promise<NetworkEffect[]> {
    const effects: NetworkEffect[] = [];
    
    // Direct effects
    const directBeneficiaries = new Set(interactions.map(i => i.targetUserId).filter(id => id));
    effects.push({
      type: 'direct',
      magnitude: directBeneficiaries.size,
      description: 'Users directly helped through interactions',
      beneficiaries: directBeneficiaries.size
    });
    
    // Indirect effects (knowledge cascade)
    const indirectReach = directBeneficiaries.size * 2.5; // Estimate
    effects.push({
      type: 'indirect',
      magnitude: indirectReach,
      description: 'Extended reach through knowledge sharing',
      beneficiaries: Math.round(indirectReach)
    });
    
    return effects;
  }

  private async categorizeMentorsMentees(users: User[]): Promise<{
    mentors: User[];
    mentees: User[];
  }> {
    const mentors: User[] = [];
    const mentees: User[] = [];
    
    for (const user of users) {
      const profile = await this.getUserLearningProfile(user.id);
      
      // Simple categorization based on experience and performance
      if (profile.experience > 6 && profile.averageScore > 80) {
        mentors.push(user);
      } else if (profile.experience < 3 || profile.averageScore < 70) {
        mentees.push(user);
      }
    }
    
    return { mentors, mentees };
  }

  private async findBestMentor(mentee: User, mentors: User[]): Promise<{ mentor: User; score: number } | null> {
    if (mentors.length === 0) return null;
    
    let bestMatch = { mentor: mentors[0], score: 0 };
    
    for (const mentor of mentors) {
      const score = await this.calculateMentorMenteeScore(mentor, mentee);
      if (score > bestMatch.score) {
        bestMatch = { mentor, score };
      }
    }
    
    return bestMatch.score > 0.5 ? bestMatch : null;
  }

  private async calculateMentorMenteeScore(mentor: User, mentee: User): Promise<number> {
    let score = 0;
    
    // Get profiles
    const mentorProfile = await this.getUserLearningProfile(mentor.id);
    const menteeProfile = await this.getUserLearningProfile(mentee.id);
    
    // Skill gap alignment
    const skillAlignment = this.calculateSkillAlignment(mentorProfile, menteeProfile);
    score += skillAlignment * 0.3;
    
    // Learning style compatibility
    const styleCompatibility = await this.calculateStyleCompatibility(mentor.id, mentee.id);
    score += styleCompatibility * 0.25;
    
    // Availability matching
    const availabilityMatch = this.calculateAvailabilityMatch(mentorProfile, menteeProfile);
    score += availabilityMatch * 0.2;
    
    // Communication preference
    const communicationMatch = 0.8; // Would be calculated from preferences
    score += communicationMatch * 0.15;
    
    // Personality compatibility
    const personalityMatch = 0.7; // Would be calculated from assessments
    score += personalityMatch * 0.1;
    
    return score;
  }

  private calculateSkillAlignment(mentorProfile: any, menteeProfile: any): number {
    // Check if mentor has skills that mentee needs
    const menteeGaps = menteeProfile.skillGaps || [];
    const mentorStrengths = mentorProfile.strengths || [];
    
    if (menteeGaps.length === 0 || mentorStrengths.length === 0) return 0.5;
    
    const matches = menteeGaps.filter((gap: string) => 
      mentorStrengths.includes(gap)
    ).length;
    
    return matches / menteeGaps.length;
  }

  private async calculateStyleCompatibility(mentorId: string, menteeId: string): Promise<number> {
    // Get learning styles
    const mentorStyle = await db.learningStyleAnalysis.findFirst({
      where: { userId: mentorId },
      orderBy: { analyzedAt: 'desc' }
    });
    
    const menteeStyle = await db.learningStyleAnalysis.findFirst({
      where: { userId: menteeId },
      orderBy: { analyzedAt: 'desc' }
    });
    
    if (!mentorStyle || !menteeStyle) return 0.5;
    
    // Compatible if mentor can adapt to mentee's style
    return mentorStyle.primaryStyle === menteeStyle.primaryStyle ? 0.9 : 0.7;
  }

  private calculateAvailabilityMatch(mentorProfile: any, menteeProfile: any): number {
    // Simple overlap calculation
    const mentorHours = mentorProfile.availableHours || 5;
    const menteeHours = menteeProfile.requiredHours || 3;
    
    return menteeHours <= mentorHours ? 1 : menteeHours / mentorHours;
  }

  private async calculateCompatibility(mentor: User, mentee: User): Promise<number> {
    return await this.calculateMentorMenteeScore(mentor, mentee);
  }

  private identifyMatchingFactors(mentor: User, mentee: User): MatchingFactor[] {
    return [
      {
        factor: 'Skill Alignment',
        weight: 0.3,
        score: 0.85,
        rationale: 'Mentor has expertise in areas where mentee needs growth'
      },
      {
        factor: 'Learning Style',
        weight: 0.25,
        score: 0.9,
        rationale: 'Compatible learning and teaching styles'
      },
      {
        factor: 'Availability',
        weight: 0.2,
        score: 0.8,
        rationale: 'Good schedule overlap for regular sessions'
      },
      {
        factor: 'Communication',
        weight: 0.15,
        score: 0.75,
        rationale: 'Similar communication preferences'
      },
      {
        factor: 'Goals',
        weight: 0.1,
        score: 0.95,
        rationale: 'Aligned learning objectives'
      }
    ];
  }

  private async predictMatchingOutcomes(
    mentor: User,
    mentee: User,
    compatibility: number
  ): Promise<string[]> {
    const outcomes: string[] = [];
    
    if (compatibility > 0.8) {
      outcomes.push('90% likelihood of successful mentorship relationship');
      outcomes.push('Expected 30% improvement in mentee performance within 3 months');
      outcomes.push('High probability of long-term professional connection');
    } else if (compatibility > 0.6) {
      outcomes.push('75% likelihood of successful mentorship relationship');
      outcomes.push('Expected 20% improvement in mentee performance within 3 months');
      outcomes.push('Good potential for knowledge transfer');
    } else {
      outcomes.push('60% likelihood of successful mentorship relationship');
      outcomes.push('Expected 15% improvement in mentee performance within 3 months');
      outcomes.push('May require additional support for optimal results');
    }
    
    return outcomes;
  }

  private suggestMentorshipActivities(mentor: User, mentee: User): Activity[] {
    return [
      {
        type: 'one-on-one-session',
        description: 'Weekly 30-minute video call for guidance and Q&A',
        duration: 30,
        frequency: 'weekly',
        expectedBenefit: 'Direct knowledge transfer and personalized guidance'
      },
      {
        type: 'code-review',
        description: 'Bi-weekly code review sessions',
        duration: 45,
        frequency: 'bi-weekly',
        expectedBenefit: 'Practical skill improvement and best practices'
      },
      {
        type: 'project-collaboration',
        description: 'Monthly mini-project to work on together',
        duration: 120,
        frequency: 'monthly',
        expectedBenefit: 'Hands-on learning and portfolio building'
      },
      {
        type: 'resource-sharing',
        description: 'Weekly curated learning resources',
        duration: 15,
        frequency: 'weekly',
        expectedBenefit: 'Continuous learning and skill expansion'
      }
    ];
  }

  private async calculateGroupHealth(group: LearningGroup): Promise<number> {
    let healthScore = 0;
    
    // Activity level
    healthScore += Math.min(1, group.activityLevel / 10) * 0.3;
    
    // Member retention
    const retentionRate = await this.calculateRetentionRate(group);
    healthScore += retentionRate * 0.3;
    
    // Goal achievement
    const goalAchievement = await this.calculateGoalAchievement(group);
    healthScore += goalAchievement * 0.2;
    
    // Conflict level (inverse)
    const conflictLevel = await this.assessConflictLevel(group);
    healthScore += (1 - conflictLevel) * 0.2;
    
    return healthScore;
  }

  private async measureGroupCohesion(group: LearningGroup): Promise<number> {
    let cohesionScore = 0;
    
    // Interaction density
    const interactionDensity = await this.calculateInteractionDensity(group);
    cohesionScore += interactionDensity * 0.4;
    
    // Shared experiences
    const sharedExperiences = await this.countSharedExperiences(group);
    cohesionScore += Math.min(1, sharedExperiences / 20) * 0.3;
    
    // Mutual support
    const supportLevel = await this.measureMutualSupport(group);
    cohesionScore += supportLevel * 0.3;
    
    return cohesionScore;
  }

  private async assessGroupProductivity(group: LearningGroup): Promise<number> {
    let productivityScore = 0;
    
    // Task completion rate
    const taskCompletion = await this.calculateTaskCompletionRate(group);
    productivityScore += taskCompletion * 0.4;
    
    // Learning outcomes
    const learningOutcomes = await this.measureGroupLearningOutcomes(group);
    productivityScore += learningOutcomes * 0.4;
    
    // Time efficiency
    const timeEfficiency = await this.calculateTimeEfficiency(group);
    productivityScore += timeEfficiency * 0.2;
    
    return productivityScore;
  }

  private async evaluateInclusivity(group: LearningGroup): Promise<number> {
    let inclusivityScore = 0;
    
    // Participation equality
    const participationEquality = this.calculateParticipationEquality(group);
    inclusivityScore += participationEquality * 0.4;
    
    // Voice distribution
    const voiceDistribution = await this.analyzeVoiceDistribution(group);
    inclusivityScore += voiceDistribution * 0.3;
    
    // Accessibility
    const accessibilityScore = await this.assessAccessibility(group);
    inclusivityScore += accessibilityScore * 0.3;
    
    return inclusivityScore;
  }

  private async analyzeLeadership(group: LearningGroup): Promise<LeadershipAnalysis> {
    // Identify emergent leaders
    const emergentLeaders = await this.identifyEmergentLeaders(group);
    
    // Determine leadership style
    const leadershipStyle = await this.determineLeadershipStyle(emergentLeaders, group);
    
    // Assess effectiveness
    const effectiveness = await this.assessLeadershipEffectiveness(group);
    
    // Analyze distribution
    const distribution = this.analyzeLeadershipDistribution(emergentLeaders, group);
    
    return {
      emergentLeaders: emergentLeaders.map(l => l.userId),
      leadershipStyle,
      effectiveness,
      distribution
    };
  }

  private async analyzeCommunication(group: LearningGroup): Promise<CommunicationAnalysis> {
    // Identify communication patterns
    const patterns = await this.identifyCommunicationPatterns(group);
    
    // Assess quality
    const quality = await this.assessCommunicationQuality(group);
    
    // Identify barriers
    const barriers = await this.identifyCommunicationBarriers(group);
    
    // Identify strengths
    const strengths = await this.identifyCommunicationStrengths(group);
    
    return {
      patterns,
      quality,
      barriers,
      strengths
    };
  }

  private async identifyConflicts(group: LearningGroup): Promise<ConflictAnalysis[]> {
    const conflicts: ConflictAnalysis[] = [];
    
    // Analyze interactions for conflict indicators
    const interactions = await this.getGroupInteractions(group.id);
    
    // Task-related conflicts
    const taskConflicts = this.identifyTaskConflicts(interactions);
    conflicts.push(...taskConflicts);
    
    // Process conflicts
    const processConflicts = this.identifyProcessConflicts(interactions);
    conflicts.push(...processConflicts);
    
    // Relationship conflicts
    const relationshipConflicts = await this.identifyRelationshipConflicts(interactions, group);
    conflicts.push(...relationshipConflicts);
    
    return conflicts;
  }

  private async generateDynamicsRecommendations(analysis: any): Promise<DynamicsRecommendation[]> {
    const recommendations: DynamicsRecommendation[] = [];
    
    // Health recommendations
    if (analysis.healthScore < 0.6) {
      recommendations.push({
        area: 'Group Health',
        issue: 'Low overall group health score',
        recommendation: 'Schedule regular check-ins and team building activities',
        priority: 'high',
        expectedImpact: '25% improvement in engagement and retention'
      });
    }
    
    // Cohesion recommendations
    if (analysis.cohesion < 0.5) {
      recommendations.push({
        area: 'Group Cohesion',
        issue: 'Weak connections between members',
        recommendation: 'Implement pair programming and collaborative projects',
        priority: 'medium',
        expectedImpact: 'Stronger peer relationships and support network'
      });
    }
    
    // Leadership recommendations
    if (analysis.leadership.distribution === 'absent') {
      recommendations.push({
        area: 'Leadership',
        issue: 'Lack of clear leadership',
        recommendation: 'Rotate leadership roles for different activities',
        priority: 'high',
        expectedImpact: 'Better coordination and decision-making'
      });
    }
    
    // Conflict recommendations
    if (analysis.conflicts.some((c: ConflictAnalysis) => c.severity === 'high')) {
      recommendations.push({
        area: 'Conflict Resolution',
        issue: 'Unresolved high-severity conflicts',
        recommendation: 'Facilitate mediated discussion sessions',
        priority: 'high',
        expectedImpact: 'Improved collaboration and productivity'
      });
    }
    
    return recommendations;
  }

  // Helper methods for data retrieval and calculations
  private async getGroupInteractions(groupId: string): Promise<Interaction[]> {
    // Fetch group interactions from database
    const groupData = await db.group.findUnique({
      where: { id: groupId },
      include: {
        GroupDiscussion: {
          include: {
            GroupDiscussionComment: true,
            GroupDiscussionLike: true
          }
        }
      }
    });
    
    if (!groupData) return [];
    
    // Convert to Interaction format
    const interactions: Interaction[] = [];
    
    groupData.GroupDiscussion.forEach(discussion => {
      interactions.push({
        id: discussion.id,
        type: 'post',
        userId: discussion.userId,
        contentId: discussion.id,
        timestamp: discussion.createdAt,
        sentiment: 'neutral'
      });
      
      discussion.GroupDiscussionComment.forEach(comment => {
        interactions.push({
          id: comment.id,
          type: 'comment',
          userId: comment.userId,
          targetUserId: discussion.userId,
          contentId: comment.id,
          timestamp: comment.createdAt,
          sentiment: 'neutral'
        });
      });
    });
    
    return interactions;
  }

  private async assessSharedContentQuality(interactions: Interaction[]): Promise<number> {
    // Assess quality based on engagement and helpfulness
    const posts = interactions.filter(i => i.type === 'post');
    if (posts.length === 0) return 0;
    
    const avgHelpfulness = posts.reduce((sum, post) => 
      sum + (post.helpfulness || 0.5), 0
    ) / posts.length;
    
    return avgHelpfulness;
  }

  private async calculateGroupEngagementRate(interactions: Interaction[]): Promise<number> {
    const posts = interactions.filter(i => i.type === 'post');
    const engagements = interactions.filter(i => i.type !== 'post');
    
    return posts.length > 0 ? engagements.length / posts.length : 0;
  }

  private async calculateAverageResponseTime(
    requests: Interaction[],
    responses: Interaction[]
  ): Promise<number> {
    if (requests.length === 0 || responses.length === 0) return Infinity;
    
    let totalTime = 0;
    let matchedPairs = 0;
    
    requests.forEach(request => {
      const firstResponse = responses.find(r => 
        r.timestamp > request.timestamp && 
        r.targetUserId === request.userId
      );
      
      if (firstResponse) {
        const timeDiff = firstResponse.timestamp.getTime() - request.timestamp.getTime();
        totalTime += timeDiff / (1000 * 60); // Convert to minutes
        matchedPairs++;
      }
    });
    
    return matchedPairs > 0 ? totalTime / matchedPairs : Infinity;
  }

  private async getCollaborativeActivities(groupId: string): Promise<any[]> {
    // Would fetch actual collaborative activities
    return [];
  }

  private async identifyPeerTeaching(group: LearningGroup): Promise<number> {
    // Count instances of peer teaching
    const interactions = await this.getGroupInteractions(group.id);
    
    const teachingInteractions = interactions.filter(i => 
      i.type === 'answer' && i.helpfulness && i.helpfulness > 0.7
    );
    
    return teachingInteractions.length;
  }

  private async identifyCoCreatedContent(group: LearningGroup): Promise<number> {
    // Count co-created content items
    return 3; // Placeholder
  }

  private async getGroupAchievements(groupId: string): Promise<number> {
    // Count group achievements
    return 5; // Placeholder
  }

  private async analyzeSocialConnections(group: LearningGroup): Promise<number> {
    // Count meaningful connections formed
    const interactions = await this.getGroupInteractions(group.id);
    
    const connectionPairs = new Set<string>();
    interactions.forEach(interaction => {
      if (interaction.targetUserId) {
        const pair = [interaction.userId, interaction.targetUserId].sort().join('-');
        connectionPairs.add(pair);
      }
    });
    
    return connectionPairs.size;
  }

  private async measureInclusiveParticipation(group: LearningGroup): Promise<number> {
    const memberParticipation = new Map<string, number>();
    
    group.members.forEach(member => {
      memberParticipation.set(member.userId, member.contributionScore);
    });
    
    // Calculate Gini coefficient for participation equality
    const values = Array.from(memberParticipation.values()).sort((a, b) => a - b);
    const n = values.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / n;
    
    let giniSum = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        giniSum += Math.abs(values[i] - values[j]);
      }
    }
    
    const gini = giniSum / (2 * n * n * mean);
    return 1 - gini; // Convert to inclusivity score
  }

  private async assessValueAlignment(group: LearningGroup): Promise<number> {
    // Assess alignment on group purpose and values
    return 0.8; // Placeholder
  }

  private async identifyCommunityRituals(group: LearningGroup): Promise<number> {
    // Identify regular group activities and traditions
    return 0.7; // Placeholder
  }

  private async getUserLearningProfile(userId: string): Promise<any> {
    const [progress, achievements] = await Promise.all([
      db.user_progress.findMany({
        where: { userId },
        orderBy: { lastAccessedAt: 'desc' },
        take: 20
      }),
      db.user_achievements.findMany({
        where: { userId }
      })
    ]);
    
    const averageScore = progress.length > 0 ?
      progress.reduce((sum, p) => sum + (p.quizScore || 0), 0) / progress.length : 0;
    
    return {
      experience: achievements.length, // Simplified
      averageScore,
      strengths: [],
      skillGaps: [],
      availableHours: 5,
      requiredHours: 3
    };
  }

  private async calculateRetentionRate(group: LearningGroup): Promise<number> {
    // Calculate member retention over time
    const activeMembers = group.members.filter(m => m.engagementLevel > 0.1).length;
    return activeMembers / group.members.length;
  }

  private async calculateGoalAchievement(group: LearningGroup): Promise<number> {
    // Calculate group goal achievement rate
    return 0.75; // Placeholder
  }

  private async assessConflictLevel(group: LearningGroup): Promise<number> {
    const conflicts = await this.identifyConflicts(group);
    const highSeverityCount = conflicts.filter(c => c.severity === 'high').length;
    const mediumSeverityCount = conflicts.filter(c => c.severity === 'medium').length;
    
    const conflictScore = (highSeverityCount * 1 + mediumSeverityCount * 0.5) / 
                         Math.max(1, group.members.length);
    
    return Math.min(1, conflictScore);
  }

  private async calculateInteractionDensity(group: LearningGroup): Promise<number> {
    const interactions = await this.getGroupInteractions(group.id);
    const possiblePairs = group.members.length * (group.members.length - 1) / 2;
    
    const actualPairs = new Set<string>();
    interactions.forEach(i => {
      if (i.targetUserId) {
        const pair = [i.userId, i.targetUserId].sort().join('-');
        actualPairs.add(pair);
      }
    });
    
    return possiblePairs > 0 ? actualPairs.size / possiblePairs : 0;
  }

  private async countSharedExperiences(group: LearningGroup): Promise<number> {
    // Count shared learning experiences
    return 15; // Placeholder
  }

  private async measureMutualSupport(group: LearningGroup): Promise<number> {
    const interactions = await this.getGroupInteractions(group.id);
    const supportiveInteractions = interactions.filter(i => 
      i.type === 'comment' && i.helpfulness && i.helpfulness > 0.6
    );
    
    return Math.min(1, supportiveInteractions.length / (group.members.length * 5));
  }

  private async calculateTaskCompletionRate(group: LearningGroup): Promise<number> {
    // Calculate group task completion rate
    return 0.82; // Placeholder
  }

  private async measureGroupLearningOutcomes(group: LearningGroup): Promise<number> {
    // Measure collective learning outcomes
    return 0.78; // Placeholder
  }

  private async calculateTimeEfficiency(group: LearningGroup): Promise<number> {
    // Calculate time efficiency in achieving goals
    return 0.85; // Placeholder
  }

  private calculateParticipationEquality(group: LearningGroup): number {
    const participationScores = group.members.map(m => m.contributionScore);
    const mean = participationScores.reduce((sum, s) => sum + s, 0) / participationScores.length;
    const variance = participationScores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / participationScores.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation means more equality
    return Math.max(0, 1 - (stdDev / mean));
  }

  private async analyzeVoiceDistribution(group: LearningGroup): Promise<number> {
    // Analyze how evenly voice/influence is distributed
    return 0.75; // Placeholder
  }

  private async assessAccessibility(group: LearningGroup): Promise<number> {
    // Assess accessibility of group activities
    return 0.9; // Placeholder
  }

  private async identifyEmergentLeaders(group: LearningGroup): Promise<GroupMember[]> {
    return group.members
      .filter(m => m.contributionScore > 0.7 && m.helpfulnessRating > 0.8)
      .sort((a, b) => b.contributionScore - a.contributionScore)
      .slice(0, 3);
  }

  private async determineLeadershipStyle(leaders: GroupMember[], group: LearningGroup): Promise<string> {
    if (leaders.length === 0) return 'absent';
    if (leaders[0].contributionScore > 0.9 && leaders[0].role === 'leader') return 'directive';
    if (leaders.length > 2) return 'collaborative';
    return 'facilitative';
  }

  private async assessLeadershipEffectiveness(group: LearningGroup): Promise<number> {
    return group.collaborationScore * 0.6 + group.activityLevel * 0.4;
  }

  private analyzeLeadershipDistribution(leaders: GroupMember[], group: LearningGroup): 'centralized' | 'distributed' | 'absent' {
    if (leaders.length === 0) return 'absent';
    if (leaders.length === 1) return 'centralized';
    return 'distributed';
  }

  private async identifyCommunicationPatterns(group: LearningGroup): Promise<CommunicationPattern[]> {
    return [
      {
        type: 'hub-and-spoke',
        frequency: 0.4,
        participants: group.members.slice(0, 3).map(m => m.userId),
        effectiveness: 0.7
      },
      {
        type: 'all-to-all',
        frequency: 0.3,
        participants: group.members.map(m => m.userId),
        effectiveness: 0.85
      }
    ];
  }

  private async assessCommunicationQuality(group: LearningGroup): Promise<number> {
    return 0.8; // Placeholder
  }

  private async identifyCommunicationBarriers(group: LearningGroup): Promise<string[]> {
    return [
      'Time zone differences',
      'Language barriers for some members',
      'Technical issues with collaboration tools'
    ];
  }

  private async identifyCommunicationStrengths(group: LearningGroup): Promise<string[]> {
    return [
      'Clear and respectful communication',
      'Active listening demonstrated',
      'Constructive feedback culture'
    ];
  }

  private identifyTaskConflicts(interactions: Interaction[]): ConflictAnalysis[] {
    // Identify conflicts related to task approach
    return [];
  }

  private identifyProcessConflicts(interactions: Interaction[]): ConflictAnalysis[] {
    // Identify conflicts related to processes
    return [];
  }

  private async identifyRelationshipConflicts(
    interactions: Interaction[],
    group: LearningGroup
  ): Promise<ConflictAnalysis[]> {
    // Identify interpersonal conflicts
    return [];
  }

  // Database storage methods
  private async storeEffectivenessScore(groupId: string, score: EffectivenessScore) {
    await db.socialLearningAnalysis.create({
      data: {
        groupId,
        analysisType: 'effectiveness',
        metrics: JSON.stringify(score),
        overallScore: score.overall,
        analyzedAt: new Date()
      }
    });
  }

  private async storeEngagementMetrics(communityId: string, metrics: EngagementMetrics) {
    await db.socialLearningAnalysis.create({
      data: {
        communityId,
        analysisType: 'engagement',
        metrics: JSON.stringify(metrics),
        overallScore: metrics.participationRate,
        analyzedAt: new Date()
      }
    });
  }

  private async storeSharingImpact(impact: SharingImpact) {
    await db.socialLearningAnalysis.create({
      data: {
        analysisType: 'knowledge-sharing',
        metrics: JSON.stringify(impact),
        overallScore: impact.knowledgeTransfer,
        analyzedAt: new Date()
      }
    });
  }

  private async storeMatchingResults(results: MatchingResult[]) {
    for (const result of results) {
      await db.mentorMenteeMatch.create({
        data: {
          mentorId: result.mentorId,
          menteeId: result.menteeId,
          compatibilityScore: result.compatibilityScore,
          matchingFactors: JSON.stringify(result.matchingFactors),
          suggestedActivities: JSON.stringify(result.suggestedActivities),
          status: 'proposed',
          createdAt: new Date()
        }
      });
    }
  }

  private async storeDynamicsAnalysis(groupId: string, analysis: DynamicsAnalysis) {
    await db.socialLearningAnalysis.create({
      data: {
        groupId,
        analysisType: 'group-dynamics',
        metrics: JSON.stringify(analysis),
        overallScore: analysis.healthScore,
        analyzedAt: new Date()
      }
    });
  }
}

// Type definition
interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

// Export singleton instance
export const samSocialEngine = SAMSocialEngine.getInstance();