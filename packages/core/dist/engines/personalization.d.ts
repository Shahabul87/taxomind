/**
 * @sam-ai/core - Personalization Engine
 * Handles learning style detection, emotional state, and adaptive personalization
 */
import type { SAMConfig, EngineInput, SAMLearningStyle, SAMTone } from '../types';
import { BaseEngine } from './base';
export type EmotionalState = 'motivated' | 'frustrated' | 'confused' | 'confident' | 'anxious' | 'neutral' | 'curious' | 'bored';
export type CognitiveLoad = 'low' | 'optimal' | 'high' | 'overloaded';
export interface LearningStyleProfile {
    primary: SAMLearningStyle;
    secondary: SAMLearningStyle | null;
    confidence: number;
    indicators: {
        style: SAMLearningStyle;
        score: number;
        evidence: string[];
    }[];
    recommendations: string[];
}
export interface EmotionalProfile {
    currentState: EmotionalState;
    confidence: number;
    trajectory: 'improving' | 'stable' | 'declining';
    triggers: string[];
    recommendedTone: SAMTone;
    interventions: string[];
}
export interface CognitiveLoadProfile {
    currentLoad: CognitiveLoad;
    capacity: number;
    factors: {
        contentComplexity: number;
        sessionDuration: number;
        recentErrors: number;
        helpSeekingFrequency: number;
    };
    adaptations: ContentAdaptation[];
}
export interface ContentAdaptation {
    type: 'simplify' | 'enrich' | 'chunk' | 'visualize' | 'slow-down' | 'speed-up';
    priority: 'high' | 'medium' | 'low';
    description: string;
    implementation: string;
}
export interface MotivationProfile {
    level: number;
    type: 'intrinsic' | 'extrinsic' | 'mixed';
    drivers: string[];
    barriers: string[];
    sustainability: 'high' | 'medium' | 'low';
    boostStrategies: string[];
}
export interface LearningPathNode {
    id: string;
    title: string;
    type: 'lesson' | 'exercise' | 'assessment' | 'review' | 'break';
    estimatedDuration: number;
    difficulty: 'easy' | 'medium' | 'hard';
    prerequisites: string[];
    isOptional: boolean;
    adaptedFor: SAMLearningStyle;
}
export interface PersonalizedLearningPath {
    nodes: LearningPathNode[];
    totalDuration: number;
    alternativeRoutes: string[][];
    adaptationLevel: 'minimal' | 'moderate' | 'significant';
    confidenceScore: number;
}
export interface PersonalizationEngineOutput {
    learningStyle: LearningStyleProfile;
    emotional: EmotionalProfile;
    cognitiveLoad: CognitiveLoadProfile;
    motivation: MotivationProfile;
    learningPath?: PersonalizedLearningPath;
    overallProfile: {
        strengths: string[];
        challenges: string[];
        recommendations: string[];
        nextBestAction: string;
    };
}
export declare class PersonalizationEngine extends BaseEngine<PersonalizationEngineOutput> {
    constructor(config: SAMConfig);
    protected performInitialization(): Promise<void>;
    protected process(input: EngineInput): Promise<PersonalizationEngineOutput>;
    private analyzeLearningStyle;
    private detectLearningStyleIndicators;
    private calculateStyleScore;
    private generateStyleRecommendations;
    private analyzeEmotionalState;
    private detectEmotionalState;
    private calculateEmotionalTrajectory;
    private getRecommendedTone;
    private generateInterventions;
    private analyzeCognitiveLoad;
    private estimateContentComplexity;
    private countRecentErrors;
    private calculateHelpSeekingFrequency;
    private generateCognitiveAdaptations;
    private analyzeMotivation;
    private generateMotivationStrategies;
    private generateLearningPath;
    private buildOverallProfile;
    protected getCacheKey(input: EngineInput): string;
}
export declare function createPersonalizationEngine(config: SAMConfig): PersonalizationEngine;
//# sourceMappingURL=personalization.d.ts.map