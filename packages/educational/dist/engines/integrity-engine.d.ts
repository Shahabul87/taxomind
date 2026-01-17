/**
 * Portable Integrity Engine - Academic Integrity & Plagiarism Detection
 *
 * Provides comprehensive academic integrity checks including:
 * - Plagiarism detection using similarity analysis
 * - AI-generated content detection
 * - Writing style consistency checking
 * - Cross-submission comparison
 *
 * @version 1.0.0
 * @module @sam-ai/educational
 */
import type { IntegrityEngineConfig, IntegrityCheckConfig, PlagiarismResult, AIDetectionResult, ConsistencyResult, IntegrityReport, IntegrityCheckOptions, CorpusEntry, IntegritySubmission } from '../types';
export declare class IntegrityEngine {
    private config;
    private database?;
    constructor(engineConfig?: IntegrityEngineConfig);
    getConfig(): IntegrityCheckConfig;
    updateConfig(config: Partial<IntegrityCheckConfig>): void;
    /**
     * Check text for plagiarism against a corpus
     */
    checkPlagiarism(text: string, corpus: CorpusEntry[]): Promise<PlagiarismResult>;
    /**
     * Find matching text segments between two texts
     */
    private findMatchingSegments;
    /**
     * Calculate confidence in plagiarism detection
     */
    private calculatePlagiarismConfidence;
    /**
     * Detect if text is likely AI-generated
     */
    detectAIContent(text: string): Promise<AIDetectionResult>;
    private calculateAIDetectionConfidence;
    /**
     * Check writing style consistency against previous submissions
     */
    checkConsistency(currentText: string, previousSubmissions: string[]): Promise<ConsistencyResult>;
    private extractStyleMetrics;
    private calculateAverageMetrics;
    private detectAnomalies;
    private calculateConsistencyScore;
    private getRecommendation;
    /**
     * Run comprehensive integrity check
     */
    runIntegrityCheck(answerId: string, text: string, studentId: string, examId: string, options?: IntegrityCheckOptions): Promise<IntegrityReport>;
    private calculateOverallRisk;
    private generateRecommendations;
    private generateRequiredActions;
    /**
     * Run integrity checks on multiple submissions
     */
    runBatchIntegrityCheck(submissions: IntegritySubmission[]): Promise<IntegrityReport[]>;
}
export declare function createIntegrityEngine(config?: IntegrityEngineConfig): IntegrityEngine;
export default IntegrityEngine;
//# sourceMappingURL=integrity-engine.d.ts.map