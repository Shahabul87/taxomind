/**
 * @sam-ai/educational - PersonalizationEngine
 * Advanced learning personalization engine with cognitive profiling
 */
import type { PersonalizationEngineConfig, LearningBehavior, LearningStyleProfile, OptimizedContent, EmotionalState, MotivationProfile, PersonalizedPath, PersonalizationContext, PersonalizationResult, StudentProfileInput, LearningHistory, Interaction, StudentInfo } from '../types';
export declare class PersonalizationEngine {
    private config;
    private database?;
    private logger;
    private learningStyleCache;
    private emotionalStateCache;
    constructor(engineConfig: PersonalizationEngineConfig);
    detectLearningStyle(behavior: LearningBehavior): Promise<LearningStyleProfile>;
    private analyzeStyleStrengths;
    private generateEvidenceFactors;
    private calculateConfidence;
    optimizeCognitiveLoad(content: unknown, student: StudentInfo): Promise<OptimizedContent>;
    recognizeEmotionalState(interactions: Interaction[]): Promise<EmotionalState>;
    private getDefaultEmotionalState;
    private inferEmotion;
    private calculateTrend;
    private generateEmotionalRecommendations;
    analyzeMotivationPatterns(history: LearningHistory): Promise<MotivationProfile>;
    private identifyIntrinsicFactors;
    private identifyExtrinsicFactors;
    private identifyMotivationTriggers;
    private identifyMotivationBarriers;
    generatePersonalizedPath(profile: StudentProfileInput): Promise<PersonalizedPath>;
    private createDefaultNode;
    private generateAlternativePaths;
    applyPersonalization(context: PersonalizationContext): Promise<PersonalizationResult>;
    private storeLearningStyleProfile;
    private storeEmotionalState;
    private storeMotivationProfile;
    private storeLearningPath;
    private storePersonalizationResult;
    private parseAIResponse;
}
export declare function createPersonalizationEngine(config: PersonalizationEngineConfig): PersonalizationEngine;
//# sourceMappingURL=personalization-engine.d.ts.map