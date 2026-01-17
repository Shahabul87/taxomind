/**
 * Transcript Analyzer
 * Phase 4: Video transcript extraction and analysis for cognitive depth
 *
 * Key Features:
 * - Video transcript aggregation from multiple sources
 * - Integration with DeepContentAnalyzer for cognitive analysis
 * - Support for YouTube, Vimeo, and custom video platforms
 * - Transcript quality assessment
 *
 * Note: Actual transcript extraction requires external API integration
 * (YouTube Data API, Whisper API, etc.)
 */
import { DeepContentAnalyzer, type DeepContentAnalysisResult } from './deep-content-analyzer';
export type TranscriptSourceType = 'youtube' | 'vimeo' | 'mux' | 'cloudflare' | 'custom' | 'provided' | 'generated';
export interface TranscriptSource {
    videoUrl: string;
    transcript?: string;
    sectionId: string;
    chapterId: string;
    sectionTitle?: string;
    chapterTitle?: string;
    duration?: number;
    language?: string;
}
export interface TranscriptExtractionResult {
    success: boolean;
    transcript: string | null;
    source: TranscriptSourceType;
    language: string;
    wordCount: number;
    confidence: number;
    error?: string;
}
export interface TranscriptQualityMetrics {
    wordCount: number;
    averageSentenceLength: number;
    vocabularyRichness: number;
    readabilityScore: number;
    hasTimestamps: boolean;
    language: string;
    qualityRating: 'excellent' | 'good' | 'acceptable' | 'poor';
}
export interface TranscriptAnalysisResult {
    sectionId: string;
    chapterId: string;
    sectionTitle?: string;
    chapterTitle?: string;
    hasTranscript: boolean;
    transcriptSource: TranscriptSourceType;
    transcriptQuality: TranscriptQualityMetrics | null;
    wordCount: number;
    duration?: number;
    wordsPerMinute?: number;
    contentAnalysis: DeepContentAnalysisResult | null;
    confidence: number;
    error?: string;
}
export interface CourseTranscriptAnalysisResult {
    courseId: string;
    totalVideos: number;
    videosWithTranscripts: number;
    videosAnalyzed: number;
    videosMissingTranscripts: number;
    totalWordCount: number;
    totalDuration: number;
    averageWordsPerMinute: number;
    aggregatedAnalysis: DeepContentAnalysisResult | null;
    averageConfidence: number;
    videoResults: TranscriptAnalysisResult[];
    transcriptCoveragePercent: number;
    qualityDistribution: Record<TranscriptQualityMetrics['qualityRating'], number>;
    recommendations: string[];
}
export declare class TranscriptAnalyzer {
    private contentAnalyzer;
    private readonly MIN_TRANSCRIPT_LENGTH;
    private readonly WORDS_PER_MINUTE_THRESHOLD;
    constructor(contentAnalyzer?: DeepContentAnalyzer);
    /**
     * Analyze transcripts for an entire course
     */
    analyzeCourseTranscripts(courseId: string, sources: TranscriptSource[]): Promise<CourseTranscriptAnalysisResult>;
    /**
     * Analyze a single video transcript
     */
    analyzeTranscript(source: TranscriptSource): Promise<TranscriptAnalysisResult>;
    /**
     * Get transcript from various sources
     */
    private getTranscript;
    /**
     * Detect video platform from URL
     */
    private detectVideoPlatform;
    /**
     * Extract YouTube transcript
     * Note: Requires YouTube Data API integration
     */
    private extractYouTubeTranscript;
    /**
     * Extract Vimeo transcript
     * Note: Requires Vimeo API integration
     */
    private extractVimeoTranscript;
    /**
     * Extract Mux transcript
     * Note: Mux provides auto-generated captions
     */
    private extractMuxTranscript;
    /**
     * Assess transcript quality
     */
    private assessTranscriptQuality;
    /**
     * Estimate average syllables per word
     */
    private estimateAverageSyllables;
    /**
     * Count syllables in a word (English approximation)
     */
    private countSyllables;
    /**
     * Generate recommendations for course transcript coverage
     */
    private generateCourseRecommendations;
    /**
     * Get summary statistics for transcript analysis
     */
    getSummary(result: CourseTranscriptAnalysisResult): {
        status: 'complete' | 'partial' | 'minimal' | 'none';
        coverageGrade: 'A' | 'B' | 'C' | 'D' | 'F';
        keyMetrics: Record<string, string | number>;
        actionItems: string[];
    };
}
export declare const transcriptAnalyzer: TranscriptAnalyzer;
//# sourceMappingURL=transcript-analyzer.d.ts.map