/**
 * Deep Content Analyzer
 * Phase 4: Analyzes actual lesson content including transcripts, documents, and quiz text
 *
 * Key Features:
 * - Sentence-level Bloom's Taxonomy classification
 * - Webb's DOK correlation
 * - Context-aware pattern matching
 * - Confidence scoring for each classification
 *
 * Research Basis:
 * - Anderson & Krathwohl (2001): Revised Bloom's Taxonomy
 * - Webb (2002): Depth of Knowledge Framework
 * - Hess et al. (2009): Cognitive Rigor Matrix
 */
import type { BloomsLevel } from '@sam-ai/core';
export type { BloomsLevel };
export type ContentSourceType = 'video_transcript' | 'document' | 'quiz' | 'discussion' | 'assignment' | 'text' | 'lesson_content';
export type ContentContext = 'instructional' | 'assessment' | 'activity' | 'example' | 'introduction' | 'summary';
export type WebbDOKLevel = 1 | 2 | 3 | 4;
export interface ContentSource {
    type: ContentSourceType;
    content: string;
    metadata: {
        sourceId: string;
        sectionId?: string;
        chapterId?: string;
        title: string;
        wordCount: number;
        duration?: number;
    };
}
export interface SentenceLevelAnalysis {
    sentence: string;
    predictedBloomsLevel: BloomsLevel;
    predictedDOKLevel: WebbDOKLevel;
    confidence: number;
    triggerPatterns: string[];
    context: ContentContext;
    position: 'beginning' | 'middle' | 'end';
}
export interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
    [key: string]: number;
}
export interface WebbDOKDistribution {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
}
export interface VerbFrequencyEntry {
    verb: string;
    count: number;
    level: BloomsLevel;
    contexts: ContentContext[];
}
export interface ContentCoverage {
    totalSources: number;
    analyzedSources: number;
    skippedSources: number;
    totalWords: number;
    totalSentences: number;
    averageWordsPerSentence: number;
    contentTypes: Record<ContentSourceType, number>;
}
export interface ContentGap {
    type: 'missing_level' | 'underrepresented' | 'overrepresented' | 'context_imbalance';
    level?: BloomsLevel | WebbDOKLevel;
    context?: ContentContext;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
}
export interface DeepContentAnalysisResult {
    bloomsDistribution: BloomsDistribution;
    dokDistribution: WebbDOKDistribution;
    weightedBloomsDistribution: BloomsDistribution;
    overallConfidence: number;
    analysisMethod: 'keyword' | 'pattern' | 'hybrid';
    analysisVersion: string;
    timestamp: string;
    contentCoverage: ContentCoverage;
    sentenceAnalyses: SentenceLevelAnalysis[];
    verbFrequency: VerbFrequencyEntry[];
    contextDistribution: Record<ContentContext, number>;
    contentGaps: ContentGap[];
    recommendations: string[];
    researchBasis: {
        framework: string;
        citation: string;
        methodology: string;
    };
}
export declare class DeepContentAnalyzer {
    private readonly VERSION;
    private readonly MIN_SENTENCE_LENGTH;
    private readonly MIN_WORD_COUNT;
    private readonly MIN_CONTENT_LENGTH;
    /**
     * Analyze multiple content sources for cognitive depth
     */
    analyzeContent(sources: ContentSource[]): Promise<DeepContentAnalysisResult>;
    /**
     * Analyze a single content source
     */
    analyzeSingleSource(source: ContentSource): Promise<DeepContentAnalysisResult>;
    /**
     * Split text into analyzable sentences
     */
    private splitIntoSentences;
    /**
     * Determine base context from content type
     */
    private determineContext;
    /**
     * Refine context based on sentence content and position
     */
    private refineContext;
    /**
     * Determine sentence position in content
     */
    private determinePosition;
    /**
     * Analyze a single sentence for cognitive level
     */
    private analyzeSentence;
    /**
     * Calculate confidence score for a sentence analysis
     */
    private calculateSentenceConfidence;
    /**
     * Get Bloom's level weight
     */
    private getBloomsWeight;
    /**
     * Map Bloom's level to Webb's DOK
     */
    private bloomsToDOK;
    /**
     * Calculate Bloom's distribution from sentence analyses
     */
    private calculateBloomsDistribution;
    /**
     * Calculate weighted Bloom's distribution (by confidence)
     */
    private calculateWeightedBloomsDistribution;
    /**
     * Calculate DOK distribution from sentence analyses
     */
    private calculateDOKDistribution;
    /**
     * Calculate overall analysis confidence
     */
    private calculateOverallConfidence;
    /**
     * Identify content gaps based on distributions
     */
    private identifyContentGaps;
    /**
     * Generate actionable recommendations
     */
    private generateRecommendations;
    /**
     * Get a summary of the analysis
     */
    getSummary(result: DeepContentAnalysisResult): {
        overallRating: 'excellent' | 'good' | 'needs_improvement' | 'poor';
        keyStrengths: string[];
        keyWeaknesses: string[];
        priorityActions: string[];
    };
}
export declare const deepContentAnalyzer: DeepContentAnalyzer;
//# sourceMappingURL=deep-content-analyzer.d.ts.map