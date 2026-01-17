/**
 * @sam-ai/agentic - Confidence Scorer
 * Calculates confidence scores for AI responses
 */
import { v4 as uuidv4 } from 'uuid';
import { ConfidenceInputSchema, ConfidenceFactorType, ConfidenceLevel, ComplexityLevel, SourceType, } from './types';
// ============================================================================
// IN-MEMORY STORE
// ============================================================================
/**
 * In-memory implementation of ConfidenceScoreStore
 */
export class InMemoryConfidenceScoreStore {
    scores = new Map();
    responseIndex = new Map(); // responseId -> scoreId
    async get(id) {
        return this.scores.get(id) ?? null;
    }
    async getByResponse(responseId) {
        const scoreId = this.responseIndex.get(responseId);
        if (!scoreId)
            return null;
        return this.scores.get(scoreId) ?? null;
    }
    async getByUser(userId, limit) {
        const userScores = Array.from(this.scores.values())
            .filter((score) => score.userId === userId)
            .sort((a, b) => b.scoredAt.getTime() - a.scoredAt.getTime());
        return limit ? userScores.slice(0, limit) : userScores;
    }
    async create(score) {
        const newScore = {
            ...score,
            id: uuidv4(),
        };
        this.scores.set(newScore.id, newScore);
        this.responseIndex.set(newScore.responseId, newScore.id);
        return newScore;
    }
    async getAverageByTopic(topic, since) {
        const topicScores = Array.from(this.scores.values()).filter((score) => score.topic === topic && (!since || score.scoredAt >= since));
        if (topicScores.length === 0)
            return 0;
        return topicScores.reduce((sum, s) => sum + s.overallScore, 0) / topicScores.length;
    }
    async getDistribution(userId) {
        const distribution = {
            [ConfidenceLevel.HIGH]: 0,
            [ConfidenceLevel.MEDIUM]: 0,
            [ConfidenceLevel.LOW]: 0,
            [ConfidenceLevel.UNCERTAIN]: 0,
        };
        const scores = userId
            ? Array.from(this.scores.values()).filter((s) => s.userId === userId)
            : Array.from(this.scores.values());
        for (const score of scores) {
            distribution[score.level]++;
        }
        return distribution;
    }
}
// ============================================================================
// DEFAULT LOGGER
// ============================================================================
const defaultLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
};
/**
 * Default factor weights
 */
const DEFAULT_FACTOR_WEIGHTS = {
    [ConfidenceFactorType.KNOWLEDGE_COVERAGE]: 0.20,
    [ConfidenceFactorType.SOURCE_RELIABILITY]: 0.18,
    [ConfidenceFactorType.COMPLEXITY_MATCH]: 0.15,
    [ConfidenceFactorType.CONTEXT_RELEVANCE]: 0.12,
    [ConfidenceFactorType.HISTORICAL_ACCURACY]: 0.12,
    [ConfidenceFactorType.CONCEPT_CLARITY]: 0.10,
    [ConfidenceFactorType.PREREQUISITE_KNOWLEDGE]: 0.08,
    [ConfidenceFactorType.AMBIGUITY_LEVEL]: 0.05,
};
/**
 * Confidence Scorer
 * Calculates confidence scores for AI responses based on multiple factors
 */
export class ConfidenceScorer {
    store;
    logger;
    highConfidenceThreshold;
    lowConfidenceThreshold;
    verificationThreshold;
    factorWeights;
    constructor(config = {}) {
        this.store = config.store ?? new InMemoryConfidenceScoreStore();
        this.logger = config.logger ?? defaultLogger;
        this.highConfidenceThreshold = config.highConfidenceThreshold ?? 0.8;
        this.lowConfidenceThreshold = config.lowConfidenceThreshold ?? 0.4;
        this.verificationThreshold = config.verificationThreshold ?? 0.6;
        this.factorWeights = { ...DEFAULT_FACTOR_WEIGHTS, ...config.factorWeights };
    }
    /**
     * Calculate confidence score for a response
     */
    async scoreResponse(input) {
        const validated = ConfidenceInputSchema.parse(input);
        this.logger.info('Scoring response confidence', {
            responseId: validated.responseId,
            responseType: validated.responseType,
        });
        // Cast sources to proper type after Zod validation
        const typedInput = {
            ...validated,
            responseType: validated.responseType,
            sources: validated.sources?.map((s) => ({
                ...s,
                type: s.type,
            })),
        };
        const factors = await this.calculateFactors(typedInput);
        const overallScore = this.calculateOverallScore(factors);
        const level = this.determineConfidenceLevel(overallScore);
        const complexity = this.assessComplexity(validated.responseText, typedInput.context);
        const score = {
            id: '',
            responseId: validated.responseId,
            userId: validated.userId,
            sessionId: validated.sessionId,
            overallScore,
            level,
            factors,
            responseType: validated.responseType,
            topic: validated.topic,
            complexity,
            shouldVerify: overallScore < this.verificationThreshold,
            suggestedDisclaimer: this.generateDisclaimer(level, factors),
            alternativeApproaches: this.suggestAlternatives(factors, typedInput),
            scoredAt: new Date(),
        };
        const savedScore = await this.store.create(score);
        this.logger.info('Confidence score calculated', {
            responseId: validated.responseId,
            overallScore,
            level,
            shouldVerify: score.shouldVerify,
        });
        return savedScore;
    }
    /**
     * Get confidence score for a response
     */
    async getScore(responseId) {
        return this.store.getByResponse(responseId);
    }
    /**
     * Get user's confidence history
     */
    async getUserHistory(userId, limit) {
        return this.store.getByUser(userId, limit);
    }
    /**
     * Get confidence distribution
     */
    async getDistribution(userId) {
        return this.store.getDistribution(userId);
    }
    /**
     * Get average confidence for a topic
     */
    async getTopicAverage(topic, since) {
        return this.store.getAverageByTopic(topic, since);
    }
    /**
     * Quick confidence check without storing
     */
    async quickCheck(responseText, responseType, sources) {
        const tempInput = {
            responseId: 'temp',
            userId: 'temp',
            sessionId: 'temp',
            responseText,
            responseType,
            sources,
        };
        const factors = await this.calculateFactors(tempInput);
        const score = this.calculateOverallScore(factors);
        const level = this.determineConfidenceLevel(score);
        return {
            score,
            level,
            shouldVerify: score < this.verificationThreshold,
        };
    }
    /**
     * Adjust confidence based on calibration data
     */
    adjustConfidence(score, adjustmentFactor) {
        const adjusted = score * adjustmentFactor;
        return Math.max(0, Math.min(1, adjusted));
    }
    // ============================================================================
    // PRIVATE METHODS
    // ============================================================================
    async calculateFactors(input) {
        const factors = [];
        // Knowledge coverage factor
        factors.push(this.calculateKnowledgeCoverage(input));
        // Source reliability factor
        factors.push(this.calculateSourceReliability(input.sources));
        // Complexity match factor
        factors.push(this.calculateComplexityMatch(input));
        // Context relevance factor
        factors.push(this.calculateContextRelevance(input));
        // Historical accuracy factor
        factors.push(await this.calculateHistoricalAccuracy(input));
        // Concept clarity factor
        factors.push(this.calculateConceptClarity(input.responseText));
        // Prerequisite knowledge factor
        factors.push(this.calculatePrerequisiteKnowledge(input));
        // Ambiguity level factor
        factors.push(this.calculateAmbiguityLevel(input.responseText));
        return factors;
    }
    calculateKnowledgeCoverage(input) {
        let score = 0.7; // Default moderate coverage
        const reasoning = [];
        // Check if topic is well-defined
        if (input.topic) {
            score += 0.1;
            reasoning.push('Topic is well-defined');
        }
        // Check for sources
        if (input.sources && input.sources.length > 0) {
            const avgReliability = input.sources.reduce((sum, s) => sum + s.reliability, 0) / input.sources.length;
            score = Math.min(1, score + avgReliability * 0.2);
            reasoning.push(`${input.sources.length} sources available`);
        }
        else {
            score -= 0.1;
            reasoning.push('No explicit sources provided');
        }
        // Check context depth
        if (input.context) {
            if (input.context.courseId)
                score += 0.05;
            if (input.context.relatedConcepts && input.context.relatedConcepts.length > 0) {
                score += 0.05;
                reasoning.push('Related concepts identified');
            }
        }
        return {
            type: ConfidenceFactorType.KNOWLEDGE_COVERAGE,
            score: Math.max(0, Math.min(1, score)),
            weight: this.factorWeights[ConfidenceFactorType.KNOWLEDGE_COVERAGE],
            reasoning: reasoning.join('; ') || 'Standard knowledge coverage',
        };
    }
    calculateSourceReliability(sources) {
        if (!sources || sources.length === 0) {
            return {
                type: ConfidenceFactorType.SOURCE_RELIABILITY,
                score: 0.5,
                weight: this.factorWeights[ConfidenceFactorType.SOURCE_RELIABILITY],
                reasoning: 'No explicit sources to verify',
            };
        }
        // Weight sources by type
        const typeWeights = {
            [SourceType.ACADEMIC_PAPER]: 1.0,
            [SourceType.TEXTBOOK]: 0.95,
            [SourceType.DOCUMENTATION]: 0.9,
            [SourceType.EXPERT_REVIEW]: 0.9,
            [SourceType.COURSE_CONTENT]: 0.85,
            [SourceType.KNOWLEDGE_BASE]: 0.8,
            [SourceType.GENERATED]: 0.5,
        };
        let totalWeight = 0;
        let weightedSum = 0;
        for (const source of sources) {
            const typeWeight = typeWeights[source.type] ?? 0.5;
            const sourceScore = source.reliability * typeWeight;
            weightedSum += sourceScore;
            totalWeight += typeWeight;
        }
        const score = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
        return {
            type: ConfidenceFactorType.SOURCE_RELIABILITY,
            score,
            weight: this.factorWeights[ConfidenceFactorType.SOURCE_RELIABILITY],
            reasoning: `${sources.length} sources with average reliability ${(score * 100).toFixed(0)}%`,
            metadata: { sourceCount: sources.length },
        };
    }
    calculateComplexityMatch(input) {
        const responseComplexity = this.assessComplexity(input.responseText, input.context);
        const studentLevel = input.context?.studentLevel ?? 'intermediate';
        const levelMap = {
            beginner: ComplexityLevel.BASIC,
            intermediate: ComplexityLevel.INTERMEDIATE,
            advanced: ComplexityLevel.ADVANCED,
            expert: ComplexityLevel.EXPERT,
        };
        const expectedComplexity = levelMap[studentLevel] ?? ComplexityLevel.INTERMEDIATE;
        const complexityOrder = [
            ComplexityLevel.BASIC,
            ComplexityLevel.INTERMEDIATE,
            ComplexityLevel.ADVANCED,
            ComplexityLevel.EXPERT,
        ];
        const expectedIndex = complexityOrder.indexOf(expectedComplexity);
        const actualIndex = complexityOrder.indexOf(responseComplexity);
        const diff = Math.abs(expectedIndex - actualIndex);
        // Perfect match = 1.0, one level off = 0.7, two levels = 0.4, three = 0.2
        const score = Math.max(0.2, 1 - diff * 0.3);
        let reasoning = '';
        if (diff === 0) {
            reasoning = 'Complexity matches student level';
        }
        else if (actualIndex > expectedIndex) {
            reasoning = 'Response may be too complex for student level';
        }
        else {
            reasoning = 'Response may be oversimplified for student level';
        }
        return {
            type: ConfidenceFactorType.COMPLEXITY_MATCH,
            score,
            weight: this.factorWeights[ConfidenceFactorType.COMPLEXITY_MATCH],
            reasoning,
            metadata: { responseComplexity, expectedComplexity },
        };
    }
    calculateContextRelevance(input) {
        let score = 0.6; // Base score
        const reasoning = [];
        if (input.context) {
            // Course context available
            if (input.context.courseId) {
                score += 0.15;
                reasoning.push('Course context available');
            }
            // Question context available
            if (input.context.questionText) {
                score += 0.1;
                reasoning.push('Original question context available');
            }
            // Previous attempts context
            if (input.context.previousAttempts !== undefined) {
                score += 0.05;
                reasoning.push('Student history considered');
            }
            // Related concepts available
            if (input.context.relatedConcepts && input.context.relatedConcepts.length > 0) {
                score += 0.1;
                reasoning.push('Related concepts identified');
            }
        }
        return {
            type: ConfidenceFactorType.CONTEXT_RELEVANCE,
            score: Math.min(1, score),
            weight: this.factorWeights[ConfidenceFactorType.CONTEXT_RELEVANCE],
            reasoning: reasoning.join('; ') || 'Limited context available',
        };
    }
    async calculateHistoricalAccuracy(input) {
        // Get historical scores for this topic
        if (input.topic) {
            const historicalAvg = await this.store.getAverageByTopic(input.topic);
            if (historicalAvg > 0) {
                return {
                    type: ConfidenceFactorType.HISTORICAL_ACCURACY,
                    score: historicalAvg,
                    weight: this.factorWeights[ConfidenceFactorType.HISTORICAL_ACCURACY],
                    reasoning: `Historical accuracy for topic: ${(historicalAvg * 100).toFixed(0)}%`,
                };
            }
        }
        // No historical data, use neutral score
        return {
            type: ConfidenceFactorType.HISTORICAL_ACCURACY,
            score: 0.7,
            weight: this.factorWeights[ConfidenceFactorType.HISTORICAL_ACCURACY],
            reasoning: 'No historical data for this topic',
        };
    }
    calculateConceptClarity(responseText) {
        let score = 0.7;
        const reasoning = [];
        // Check for clear structure indicators
        const hasStructure = responseText.includes('\n') ||
            responseText.includes(':') ||
            responseText.includes('-') ||
            responseText.includes('1.');
        if (hasStructure) {
            score += 0.1;
            reasoning.push('Well-structured response');
        }
        // Check for explanation markers
        const explanationMarkers = [
            'because',
            'therefore',
            'this means',
            'for example',
            'in other words',
        ];
        const hasExplanations = explanationMarkers.some((marker) => responseText.toLowerCase().includes(marker));
        if (hasExplanations) {
            score += 0.1;
            reasoning.push('Contains explanatory elements');
        }
        // Check for hedging language (reduces clarity)
        const hedgingWords = ['might', 'perhaps', 'possibly', 'maybe', 'could be', 'not sure'];
        const hedgingCount = hedgingWords.filter((word) => responseText.toLowerCase().includes(word)).length;
        if (hedgingCount > 2) {
            score -= 0.15;
            reasoning.push('Excessive hedging language');
        }
        else if (hedgingCount > 0) {
            score -= 0.05;
            reasoning.push('Some uncertainty expressed');
        }
        // Check response length (too short or too long affects clarity)
        const wordCount = responseText.split(/\s+/).length;
        if (wordCount < 10) {
            score -= 0.2;
            reasoning.push('Response may be too brief');
        }
        else if (wordCount > 500) {
            score -= 0.1;
            reasoning.push('Long response may reduce clarity');
        }
        return {
            type: ConfidenceFactorType.CONCEPT_CLARITY,
            score: Math.max(0, Math.min(1, score)),
            weight: this.factorWeights[ConfidenceFactorType.CONCEPT_CLARITY],
            reasoning: reasoning.join('; ') || 'Standard clarity',
            metadata: { wordCount },
        };
    }
    calculatePrerequisiteKnowledge(input) {
        let score = 0.7;
        const reasoning = [];
        if (input.context?.relatedConcepts && input.context.relatedConcepts.length > 0) {
            // More related concepts = more prerequisites to verify
            const conceptCount = input.context.relatedConcepts.length;
            if (conceptCount > 5) {
                score -= 0.1;
                reasoning.push('Many prerequisite concepts involved');
            }
            else if (conceptCount > 2) {
                score += 0.1;
                reasoning.push('Reasonable prerequisite coverage');
            }
            else {
                score += 0.15;
                reasoning.push('Few prerequisites needed');
            }
        }
        // Check student level vs topic complexity
        if (input.context?.studentLevel === 'beginner') {
            // Beginners need more careful prerequisite handling
            score -= 0.1;
            reasoning.push('Beginner level requires careful prerequisite consideration');
        }
        return {
            type: ConfidenceFactorType.PREREQUISITE_KNOWLEDGE,
            score: Math.max(0, Math.min(1, score)),
            weight: this.factorWeights[ConfidenceFactorType.PREREQUISITE_KNOWLEDGE],
            reasoning: reasoning.join('; ') || 'Standard prerequisite coverage',
        };
    }
    calculateAmbiguityLevel(responseText) {
        let score = 0.8; // Start high (low ambiguity)
        const reasoning = [];
        // Check for ambiguous phrases
        const ambiguousPatterns = [
            'it depends',
            'in some cases',
            'sometimes',
            'usually',
            'often',
            'typically',
            'generally',
            'in most cases',
        ];
        const ambiguityCount = ambiguousPatterns.filter((pattern) => responseText.toLowerCase().includes(pattern)).length;
        if (ambiguityCount > 3) {
            score -= 0.3;
            reasoning.push('High ambiguity in response');
        }
        else if (ambiguityCount > 1) {
            score -= 0.15;
            reasoning.push('Some ambiguous statements');
        }
        else if (ambiguityCount === 1) {
            score -= 0.05;
            reasoning.push('Minor ambiguity present');
        }
        // Check for contradictory statements
        const contradictionMarkers = ['however', 'but', 'although', 'on the other hand'];
        const contradictionCount = contradictionMarkers.filter((marker) => responseText.toLowerCase().includes(marker)).length;
        if (contradictionCount > 2) {
            score -= 0.15;
            reasoning.push('Multiple qualifying statements');
        }
        return {
            type: ConfidenceFactorType.AMBIGUITY_LEVEL,
            score: Math.max(0, Math.min(1, score)),
            weight: this.factorWeights[ConfidenceFactorType.AMBIGUITY_LEVEL],
            reasoning: reasoning.join('; ') || 'Low ambiguity',
        };
    }
    calculateOverallScore(factors) {
        let totalWeight = 0;
        let weightedSum = 0;
        for (const factor of factors) {
            weightedSum += factor.score * factor.weight;
            totalWeight += factor.weight;
        }
        return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    }
    determineConfidenceLevel(score) {
        if (score >= this.highConfidenceThreshold) {
            return ConfidenceLevel.HIGH;
        }
        else if (score >= this.lowConfidenceThreshold) {
            return ConfidenceLevel.MEDIUM;
        }
        else if (score >= 0.2) {
            return ConfidenceLevel.LOW;
        }
        else {
            return ConfidenceLevel.UNCERTAIN;
        }
    }
    assessComplexity(responseText, context) {
        // Simple heuristics for complexity assessment
        const wordCount = responseText.split(/\s+/).length;
        const avgWordLength = responseText.replace(/\s+/g, '').length / Math.max(1, wordCount);
        const technicalTermCount = this.countTechnicalTerms(responseText);
        let complexityScore = 0;
        // Word count factor
        if (wordCount > 200)
            complexityScore += 2;
        else if (wordCount > 100)
            complexityScore += 1;
        // Average word length factor
        if (avgWordLength > 7)
            complexityScore += 2;
        else if (avgWordLength > 5)
            complexityScore += 1;
        // Technical terms factor
        if (technicalTermCount > 10)
            complexityScore += 2;
        else if (technicalTermCount > 5)
            complexityScore += 1;
        // Context-based adjustment
        if (context?.studentLevel === 'advanced' || context?.studentLevel === 'expert') {
            complexityScore += 1;
        }
        if (complexityScore >= 5)
            return ComplexityLevel.EXPERT;
        if (complexityScore >= 3)
            return ComplexityLevel.ADVANCED;
        if (complexityScore >= 1)
            return ComplexityLevel.INTERMEDIATE;
        return ComplexityLevel.BASIC;
    }
    countTechnicalTerms(text) {
        // Simple heuristic: count words that are longer than 10 characters
        // In a real implementation, this would use a domain-specific dictionary
        const words = text.split(/\s+/);
        return words.filter((word) => word.length > 10).length;
    }
    generateDisclaimer(level, factors) {
        if (level === ConfidenceLevel.HIGH) {
            return undefined;
        }
        const lowFactors = factors.filter((f) => f.score < 0.5);
        if (level === ConfidenceLevel.UNCERTAIN) {
            return 'I am not confident in this response. Please verify with additional sources.';
        }
        if (level === ConfidenceLevel.LOW) {
            if (lowFactors.some((f) => f.type === ConfidenceFactorType.SOURCE_RELIABILITY)) {
                return 'This response is based on limited sources. Consider seeking additional verification.';
            }
            return 'I have some uncertainty about this response. Please review carefully.';
        }
        // Medium confidence
        if (lowFactors.length > 0) {
            const factorNames = lowFactors.map((f) => f.type.replace(/_/g, ' ')).slice(0, 2);
            return `Note: Lower confidence in ${factorNames.join(' and ')}.`;
        }
        return undefined;
    }
    suggestAlternatives(factors, _input) {
        const alternatives = [];
        // Check for low complexity match
        const complexityFactor = factors.find((f) => f.type === ConfidenceFactorType.COMPLEXITY_MATCH);
        if (complexityFactor && complexityFactor.score < 0.6) {
            alternatives.push('Consider adjusting explanation complexity for student level');
        }
        // Check for low source reliability
        const sourceFactor = factors.find((f) => f.type === ConfidenceFactorType.SOURCE_RELIABILITY);
        if (sourceFactor && sourceFactor.score < 0.6) {
            alternatives.push('Consider citing additional authoritative sources');
        }
        // Check for high ambiguity
        const ambiguityFactor = factors.find((f) => f.type === ConfidenceFactorType.AMBIGUITY_LEVEL);
        if (ambiguityFactor && ambiguityFactor.score < 0.5) {
            alternatives.push('Consider providing more specific, concrete examples');
        }
        // Check for low concept clarity
        const clarityFactor = factors.find((f) => f.type === ConfidenceFactorType.CONCEPT_CLARITY);
        if (clarityFactor && clarityFactor.score < 0.5) {
            alternatives.push('Consider breaking down the explanation into clearer steps');
        }
        return alternatives.length > 0 ? alternatives : undefined;
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create a new ConfidenceScorer instance
 */
export function createConfidenceScorer(config) {
    return new ConfidenceScorer(config);
}
//# sourceMappingURL=confidence-scorer.js.map