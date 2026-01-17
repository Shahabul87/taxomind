/**
 * @sam-ai/educational - Resource Engine
 * Portable resource discovery and recommendation engine
 */
import type { ResourceEngineConfig, TopicForResource, ExternalResource, QualityScore, LicenseStatus, ROIAnalysis, ResourceRecommendation, StudentResourceProfile, ResourceDiscoveryConfig, ResourceEngine as IResourceEngine } from '../types';
export declare class ResourceEngine implements IResourceEngine {
    private config;
    private resourceCache;
    private qualityCache;
    constructor(config: ResourceEngineConfig);
    /**
     * Discover external resources for a topic
     */
    discoverResources(topic: TopicForResource, discoveryConfig?: ResourceDiscoveryConfig): Promise<ExternalResource[]>;
    /**
     * Score resource quality
     */
    scoreResourceQuality(resource: ExternalResource): Promise<QualityScore>;
    /**
     * Check license compatibility
     */
    checkLicenseCompatibility(resource: ExternalResource, intendedUse?: string): Promise<LicenseStatus>;
    /**
     * Analyze resource ROI
     */
    analyzeResourceROI(resource: ExternalResource, learnerProfile?: StudentResourceProfile): Promise<ROIAnalysis>;
    /**
     * Personalize recommendations for a student
     */
    personalizeRecommendations(student: StudentResourceProfile, resources: ExternalResource[]): Promise<ResourceRecommendation[]>;
    /**
     * Get resource recommendations for a user
     */
    getResourceRecommendations(userId: string, topic: string): Promise<ResourceRecommendation[]>;
    private searchMultipleSources;
    private searchSource;
    private calculateRelevance;
    private calculateAuthority;
    private calculateRecency;
    private calculateCompleteness;
    private calculateClarity;
    private calculateEngagement;
    private suggestAlternativeLicenses;
    private calculateCostBenefitRatio;
    private estimateTimeToValue;
    private calculateLearningEfficiency;
    private findAlternatives;
    private compareAlternatives;
    private determineRecommendation;
    private generateROIJustification;
    private calculateMatchScore;
    private calculateGoalAlignment;
    private generateMatchReasons;
    private generatePersonalizedNotes;
    private suggestUsagePattern;
    private identifyPrerequisites;
    private suggestNextSteps;
    private generateCacheKey;
    private buildDefaultProfile;
}
/**
 * Factory function to create a ResourceEngine instance
 */
export declare function createResourceEngine(config: ResourceEngineConfig): ResourceEngine;
//# sourceMappingURL=resource-engine.d.ts.map