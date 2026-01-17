/**
 * Integrity Engine Types
 */
import type { SAMConfig } from '@sam-ai/core';
export interface IntegrityEngineConfig {
    samConfig?: SAMConfig;
    database?: IntegrityDatabaseAdapter;
    checkConfig?: Partial<IntegrityCheckConfig>;
}
export interface IntegrityCheckConfig {
    enablePlagiarismCheck: boolean;
    enableAIDetection: boolean;
    enableConsistencyCheck: boolean;
    plagiarismThreshold: number;
    aiProbabilityThreshold: number;
    minTextLength: number;
    compareWithCourseContent: boolean;
    compareWithOtherStudents: boolean;
    compareWithExternalSources: boolean;
}
export interface PlagiarismResult {
    isPlagiarized: boolean;
    overallSimilarity: number;
    matches: SimilarityMatch[];
    confidence: number;
    analysisMethod: 'cosine' | 'jaccard' | 'levenshtein' | 'ngram' | 'semantic';
    timestamp: string;
}
export interface SimilarityMatch {
    sourceId: string;
    sourceType: 'student_answer' | 'external_source' | 'course_content';
    matchedText: string;
    originalText: string;
    similarity: number;
    startPosition: number;
    endPosition: number;
}
export interface AIDetectionResult {
    isAIGenerated: boolean;
    probability: number;
    confidence: number;
    indicators: AIIndicator[];
    perplexityScore: number;
    burstinessScore: number;
    analysisDetails: AIAnalysisDetails;
}
export interface AIAnalysisDetails {
    averageSentenceLength: number;
    vocabularyDiversity: number;
    repetitivePatterns: number;
    formalityScore: number;
}
export interface AIIndicator {
    type: 'perplexity' | 'burstiness' | 'vocabulary' | 'structure' | 'repetition';
    score: number;
    description: string;
    weight: number;
}
export interface ConsistencyResult {
    isConsistent: boolean;
    consistencyScore: number;
    styleMetrics: StyleMetrics;
    anomalies: StyleAnomaly[];
    recommendation: 'pass' | 'review' | 'flag';
}
export interface StyleMetrics {
    vocabularyLevel: number;
    sentenceComplexity: number;
    writingPatterns: string[];
    commonPhrases: string[];
    punctuationStyle: Record<string, number>;
    averageWordLength: number;
    uniqueWordRatio: number;
}
export interface StyleAnomaly {
    type: 'vocabulary_shift' | 'complexity_change' | 'style_break' | 'quality_jump';
    severity: 'low' | 'medium' | 'high';
    description: string;
    evidence: string;
    location?: {
        start: number;
        end: number;
    };
}
export type IntegrityRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export interface IntegrityReport {
    id: string;
    answerId: string;
    studentId: string;
    examId: string;
    timestamp: string;
    plagiarism: PlagiarismResult | null;
    aiDetection: AIDetectionResult | null;
    consistency: ConsistencyResult | null;
    overallRisk: IntegrityRiskLevel;
    flaggedForReview: boolean;
    autoApproved: boolean;
    recommendations: string[];
    requiredActions: string[];
}
export interface IntegrityCheckOptions {
    corpus?: CorpusEntry[];
    previousSubmissions?: string[];
}
export interface CorpusEntry {
    id: string;
    content: string;
    type: 'student_answer' | 'external_source' | 'course_content';
}
export interface IntegritySubmission {
    answerId: string;
    text: string;
    studentId: string;
    examId: string;
}
export interface IntegrityDatabaseAdapter {
    storeIntegrityReport(report: IntegrityReport): Promise<void>;
    getIntegrityReport(reportId: string): Promise<IntegrityReport | null>;
    getStudentReports(studentId: string): Promise<IntegrityReport[]>;
    getExamReports(examId: string): Promise<IntegrityReport[]>;
}
export interface IntegrityEngine {
    checkPlagiarism(text: string, corpus: CorpusEntry[]): Promise<PlagiarismResult>;
    detectAIContent(text: string): Promise<AIDetectionResult>;
    checkConsistency(currentText: string, previousSubmissions: string[]): Promise<ConsistencyResult>;
    runIntegrityCheck(answerId: string, text: string, studentId: string, examId: string, options?: IntegrityCheckOptions): Promise<IntegrityReport>;
    runBatchIntegrityCheck(submissions: IntegritySubmission[]): Promise<IntegrityReport[]>;
    getConfig(): IntegrityCheckConfig;
    updateConfig(config: Partial<IntegrityCheckConfig>): void;
}
//# sourceMappingURL=integrity.types.d.ts.map