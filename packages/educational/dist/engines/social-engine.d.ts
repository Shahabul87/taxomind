/**
 * @sam-ai/educational - Social Engine
 *
 * Social learning analytics engine
 * Measures collaboration effectiveness, engagement, and group dynamics
 */
import type { SocialEngineConfig, SocialLearningGroup, SocialCommunity, SocialInteraction, SocialEffectivenessScore, SocialEngagementMetrics, SocialSharingImpact, SocialMatchingResult, SocialDynamicsAnalysis, SocialUser, SocialEngine as ISocialEngine } from '../types';
export declare class SocialEngine implements ISocialEngine {
    private databaseAdapter?;
    constructor(config?: SocialEngineConfig);
    measureCollaborationEffectiveness(group: SocialLearningGroup): Promise<SocialEffectivenessScore>;
    analyzeEngagement(community: SocialCommunity): Promise<SocialEngagementMetrics>;
    evaluateKnowledgeSharing(interactions: SocialInteraction[]): Promise<SocialSharingImpact>;
    matchMentorMentee(users: SocialUser[]): Promise<SocialMatchingResult[]>;
    assessGroupDynamics(group: SocialLearningGroup): Promise<SocialDynamicsAnalysis>;
    private analyzeKnowledgeSharing;
    private analyzePeerSupport;
    private analyzeCollaborativeLearning;
    private analyzeCommunityBuilding;
    private calculateOverallEffectiveness;
    private identifyEffectivenessFactors;
    private calculateInteractionFrequency;
    private analyzeContentContribution;
    private analyzeResponseQuality;
    private identifyEngagementTrends;
    private calculateKnowledgeReach;
    private measureKnowledgeEngagement;
    private assessKnowledgeTransfer;
    private trackLearningOutcomes;
    private calculateUserImprovement;
    private identifyLearningAttributions;
    private analyzeNetworkEffects;
    private categorizeMentorsMentees;
    private findBestMentor;
    private calculateMentorMenteeScore;
    private calculateSkillAlignment;
    private calculateStyleCompatibility;
    private calculateAvailabilityMatch;
    private calculateCompatibility;
    private identifyMatchingFactors;
    private predictMatchingOutcomes;
    private suggestMentorshipActivities;
    private calculateGroupHealth;
    private measureGroupCohesion;
    private assessGroupProductivity;
    private evaluateInclusivity;
    private analyzeLeadership;
    private determineLeadershipStyle;
    private analyzeLeadershipDistribution;
    private analyzeCommunication;
    private identifyCommunicationPatterns;
    private identifyConflicts;
    private generateDynamicsRecommendations;
    private assessSharedContentQuality;
    private calculateGroupEngagementRate;
    private calculateAverageResponseTime;
    private estimatePeerTeaching;
    private measureInclusiveParticipation;
    private calculateRetentionRate;
    private calculateParticipationEquality;
}
/**
 * Factory function to create a SocialEngine instance
 */
export declare function createSocialEngine(config?: SocialEngineConfig): SocialEngine;
//# sourceMappingURL=social-engine.d.ts.map