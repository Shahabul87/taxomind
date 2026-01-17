/**
 * @sam-ai/educational - Collaboration Engine
 *
 * Real-time collaboration analytics engine
 * Tracks and analyzes collaborative learning activities
 */
import type { CollaborationEngineConfig, CollaborationSession, CollaborationContribution, CollaborationActivityType, CollaborationRealTimeMetrics, CollaborationAnalytics, CollaborationEngine as ICollaborationEngine } from '../types';
export declare class CollaborationEngine implements ICollaborationEngine {
    private databaseAdapter?;
    private activeSessions;
    private metricsCache;
    constructor(config?: CollaborationEngineConfig);
    startCollaborationSession(courseId: string, chapterId: string, initiatorId: string, type: CollaborationActivityType): Promise<CollaborationSession>;
    joinCollaborationSession(sessionId: string, userId: string): Promise<CollaborationSession>;
    recordContribution(sessionId: string, userId: string, contribution: Omit<CollaborationContribution, 'timestamp' | 'reactions'>): Promise<void>;
    analyzeCollaboration(sessionId: string): Promise<CollaborationAnalytics>;
    getRealTimeMetrics(courseId?: string): Promise<CollaborationRealTimeMetrics>;
    endCollaborationSession(sessionId: string): Promise<CollaborationSession>;
    getActiveSession(sessionId: string): CollaborationSession | undefined;
    private calculateEngagementScore;
    private calculateAverageEngagement;
    private calculateKnowledgeExchange;
    private mapContributionToActivity;
    private generateSessionInsights;
    private extractKeyTopics;
    private determineCollaborationPattern;
    private calculateEngagementVariance;
    private generateRecommendations;
    private identifyStrengths;
    private identifyImprovements;
    private calculateCollaborationIndex;
    private calculateInteractionScore;
    private calculateProblemSolvingEfficiency;
    private calculateCreativityScore;
    private calculateAverageResponseTime;
    private calculateAverageResponseTimeForSession;
    private analyzeSession;
    private calculateSatisfactionScore;
    private analyzeParticipants;
    private calculateHelpfulnessRating;
    private countPeersHelped;
    private calculateEngagementDistribution;
    private calculateRoleDistribution;
    private calculateRoleEffectiveness;
    private calculateParticipationTrends;
    private analyzeContent;
    private identifyKnowledgeGaps;
    private extractSharedResources;
    private calculateContentQuality;
    private analyzeNetwork;
    private buildCollaborationGraph;
    private addConnection;
    private calculateCentralityScores;
    private calculateBetweennessCentrality;
    private calculateClosenessCentrality;
    private calculateDistances;
    private detectCommunities;
    private identifyBridgeUsers;
}
/**
 * Factory function to create a CollaborationEngine instance
 */
export declare function createCollaborationEngine(config?: CollaborationEngineConfig): CollaborationEngine;
//# sourceMappingURL=collaboration-engine.d.ts.map