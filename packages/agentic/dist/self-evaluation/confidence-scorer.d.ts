/**
 * @sam-ai/agentic - Confidence Scorer
 * Calculates confidence scores for AI responses
 */
import { ConfidenceScore, ConfidenceScoreStore, ConfidenceInput, ConfidenceFactorType, ConfidenceLevel, ResponseType, SourceReference, SelfEvaluationLogger } from './types';
/**
 * In-memory implementation of ConfidenceScoreStore
 */
export declare class InMemoryConfidenceScoreStore implements ConfidenceScoreStore {
    private scores;
    private responseIndex;
    get(id: string): Promise<ConfidenceScore | null>;
    getByResponse(responseId: string): Promise<ConfidenceScore | null>;
    getByUser(userId: string, limit?: number): Promise<ConfidenceScore[]>;
    create(score: Omit<ConfidenceScore, 'id'>): Promise<ConfidenceScore>;
    getAverageByTopic(topic: string, since?: Date): Promise<number>;
    getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>>;
}
/**
 * Configuration for ConfidenceScorer
 */
export interface ConfidenceScorerConfig {
    store?: ConfidenceScoreStore;
    logger?: SelfEvaluationLogger;
    highConfidenceThreshold?: number;
    lowConfidenceThreshold?: number;
    verificationThreshold?: number;
    factorWeights?: Partial<Record<ConfidenceFactorType, number>>;
}
/**
 * Confidence Scorer
 * Calculates confidence scores for AI responses based on multiple factors
 */
export declare class ConfidenceScorer {
    private store;
    private logger;
    private highConfidenceThreshold;
    private lowConfidenceThreshold;
    private verificationThreshold;
    private factorWeights;
    constructor(config?: ConfidenceScorerConfig);
    /**
     * Calculate confidence score for a response
     */
    scoreResponse(input: ConfidenceInput): Promise<ConfidenceScore>;
    /**
     * Get confidence score for a response
     */
    getScore(responseId: string): Promise<ConfidenceScore | null>;
    /**
     * Get user's confidence history
     */
    getUserHistory(userId: string, limit?: number): Promise<ConfidenceScore[]>;
    /**
     * Get confidence distribution
     */
    getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>>;
    /**
     * Get average confidence for a topic
     */
    getTopicAverage(topic: string, since?: Date): Promise<number>;
    /**
     * Quick confidence check without storing
     */
    quickCheck(responseText: string, responseType: ResponseType, sources?: SourceReference[]): Promise<{
        score: number;
        level: ConfidenceLevel;
        shouldVerify: boolean;
    }>;
    /**
     * Adjust confidence based on calibration data
     */
    adjustConfidence(score: number, adjustmentFactor: number): number;
    private calculateFactors;
    private calculateKnowledgeCoverage;
    private calculateSourceReliability;
    private calculateComplexityMatch;
    private calculateContextRelevance;
    private calculateHistoricalAccuracy;
    private calculateConceptClarity;
    private calculatePrerequisiteKnowledge;
    private calculateAmbiguityLevel;
    private calculateOverallScore;
    private determineConfidenceLevel;
    private assessComplexity;
    private countTechnicalTerms;
    private generateDisclaimer;
    private suggestAlternatives;
}
/**
 * Create a new ConfidenceScorer instance
 */
export declare function createConfidenceScorer(config?: ConfidenceScorerConfig): ConfidenceScorer;
//# sourceMappingURL=confidence-scorer.d.ts.map