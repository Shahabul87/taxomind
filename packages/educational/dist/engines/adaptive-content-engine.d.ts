/**
 * @sam-ai/educational - Adaptive Content Engine
 * Personalizes content based on learning styles and user progress
 */
import type { AdaptiveContentConfig, AdaptiveLearnerProfile, ContentToAdapt, AdaptedContent, AdaptationOptions, StyleDetectionResult, ContentInteractionData, SupplementaryResource, AdaptiveLearningStyle } from '../types/adaptive-content.types';
/**
 * AdaptiveContentEngine - Personalizes content based on learning styles
 *
 * Features:
 * - Learning style detection from user interactions
 * - Content adaptation for different learning styles
 * - Complexity adjustment based on user level
 * - Scaffolding for prerequisite concepts
 * - Embedded knowledge checks
 * - Supplementary resource recommendations
 */
export declare class AdaptiveContentEngine {
    private config;
    private database?;
    private aiAdapter?;
    private cache;
    constructor(config?: AdaptiveContentConfig);
    /**
     * Adapt content for a specific learner profile
     */
    adaptContent(content: ContentToAdapt, profile: AdaptiveLearnerProfile, options?: AdaptationOptions): Promise<AdaptedContent>;
    /**
     * Adapt content using AI
     */
    private adaptWithAI;
    /**
     * Detect learning style from user interactions
     */
    detectLearningStyle(userId: string): Promise<StyleDetectionResult>;
    /**
     * Get or create learner profile
     */
    getLearnerProfile(userId: string): Promise<AdaptiveLearnerProfile>;
    /**
     * Update learner profile from recent interactions
     */
    updateProfileFromInteractions(userId: string): Promise<AdaptiveLearnerProfile>;
    /**
     * Record a content interaction
     */
    recordInteraction(interaction: Omit<ContentInteractionData, 'id'>): Promise<void>;
    /**
     * Get content recommendations based on profile
     */
    getContentRecommendations(profile: AdaptiveLearnerProfile, currentTopic: string, count?: number): Promise<SupplementaryResource[]>;
    /**
     * Get style-specific tips
     */
    getStyleTips(style: AdaptiveLearningStyle): string[];
    private createAdaptedChunks;
    private transformForStyle;
    private simplifyContent;
    private expandContent;
    private addTechnicalDetails;
    private addVisualCues;
    private addAuditoryGuidance;
    private addActionPoints;
    private generateSummary;
    private extractKeyTakeaways;
    private generateKnowledgeChecks;
    private generatePracticalExample;
    private generatePracticeActivity;
    private getSupplementaryForStyle;
    private createScaffolding;
    private analyzeFormatPreferences;
    private analyzeBehaviorIndicators;
    private calculateStyleScores;
    private generateStyleEvidence;
    private getFormatsForStyle;
    private getStyleRecommendations;
    private estimateReadingTime;
    private getDefaultStyleResult;
    private buildAdaptationPrompt;
    private parseAdaptedContent;
}
/**
 * Factory function to create an AdaptiveContentEngine instance
 */
export declare function createAdaptiveContentEngine(config?: AdaptiveContentConfig): AdaptiveContentEngine;
//# sourceMappingURL=adaptive-content-engine.d.ts.map