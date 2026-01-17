/**
 * Deterministic Rubric Engine
 * Primary analysis engine - replaces LLM-first approach
 *
 * Design Principles:
 * - 100% reproducible results for same input
 * - Explicit rules with documented rationale
 * - Audit trail for every score component
 * - Research-backed scoring criteria
 *
 * Standards Alignment:
 * - Quality Matters Higher Education Rubric (7th Edition)
 * - OLC Quality Scorecard for Online Programs
 * - Bloom's Taxonomy (Anderson & Krathwohl, 2001)
 * - Webb's Depth of Knowledge (Webb, 2002)
 */
import { BloomsDistribution, WebbDOKDistribution, CourseType } from '../types/depth-analysis.types';
import type { BloomsLevel } from '@sam-ai/core';
export interface ResearchCitation {
    standard: 'QM' | 'OLC' | 'Research' | 'ISTE';
    id: string;
    description: string;
    fullCitation?: string;
}
export type RubricCategory = 'LearningObjectives' | 'Assessment' | 'ContentStructure' | 'CognitiveDepth' | 'Accessibility' | 'Engagement';
export interface RubricRule {
    id: string;
    category: RubricCategory;
    name: string;
    condition: (data: CourseAnalysisInput) => boolean;
    score: number;
    maxScore: number;
    weight: number;
    evidence: string;
    recommendation: string;
    source?: ResearchCitation;
}
export interface CourseAnalysisInput {
    courseId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    objectives: string[];
    chapters: ChapterInput[];
    assessments: AssessmentInput[];
    attachments?: AttachmentInput[];
    contentAnalysis?: ContentAnalysisInput;
    courseType?: CourseType;
}
export interface ChapterInput {
    id: string;
    title: string;
    position: number;
    learningOutcome?: string;
    sections?: SectionInput[];
}
export interface SectionInput {
    id: string;
    title: string;
    position: number;
    videoUrl?: string;
    description?: string;
}
export interface AssessmentInput {
    id: string;
    title?: string;
    type: 'quiz' | 'exam' | 'assignment' | 'project' | 'practice' | 'other';
    questions?: QuestionInput[];
}
export interface QuestionInput {
    id: string;
    text: string;
    type?: string;
    difficulty?: number;
    bloomsLevel?: BloomsLevel;
    explanation?: string;
    feedback?: string;
    options?: OptionInput[];
}
export interface OptionInput {
    id: string;
    text: string;
    isCorrect: boolean;
}
export interface AttachmentInput {
    id: string;
    name: string;
    url: string;
}
export interface ContentAnalysisInput {
    bloomsDistribution: BloomsDistribution;
    dokDistribution?: WebbDOKDistribution;
}
export interface DeterministicAnalysisResult {
    totalScore: number;
    maxPossibleScore: number;
    percentageScore: number;
    categoryScores: Map<RubricCategory, CategoryScore>;
    rulesApplied: RuleResult[];
    analysisMethod: 'deterministic';
    timestamp: string;
    engineVersion: string;
    recommendations: PrioritizedRecommendation[];
    llmEnhanced: boolean;
    llmSuggestions?: string[];
    metadata: AnalysisMetadata;
}
export interface CategoryScore {
    earned: number;
    max: number;
    percentage: number;
    rules: RuleResult[];
}
export interface RuleResult {
    ruleId: string;
    ruleName: string;
    category: RubricCategory;
    passed: boolean;
    score: number;
    maxScore: number;
    evidence: string;
    details?: string;
    source?: ResearchCitation;
}
export interface PrioritizedRecommendation {
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: RubricCategory;
    title: string;
    description: string;
    actionSteps: string[];
    estimatedImpact: number;
    effort: 'low' | 'medium' | 'high';
    source?: ResearchCitation;
}
export interface AnalysisMetadata {
    courseId: string;
    analyzedAt: string;
    objectivesCount: number;
    chaptersCount: number;
    assessmentsCount: number;
    questionsCount: number;
    rulesEvaluated: number;
    rulesPassed: number;
    rulesFailed: number;
}
export declare class DeterministicRubricEngine {
    private readonly VERSION;
    private rules;
    constructor();
    /**
     * Primary analysis method - fully deterministic
     */
    analyze(input: CourseAnalysisInput): DeterministicAnalysisResult;
    /**
     * Get the engine version
     */
    getVersion(): string;
    /**
     * Get all rules for inspection/audit
     */
    getRules(): RubricRule[];
    /**
     * Initialize all rubric rules
     */
    private initializeRules;
    private getPriorityFromWeight;
    private estimateEffort;
    private generateActionSteps;
}
/**
 * Convert DeterministicAnalysisResult to a serializable object
 */
export declare function serializeAnalysisResult(result: DeterministicAnalysisResult): Record<string, unknown>;
/**
 * Calculate course type alignment score
 */
export declare function calculateCourseTypeAlignment(actual: BloomsDistribution, courseType: CourseType): number;
export declare const deterministicRubricEngine: DeterministicRubricEngine;
//# sourceMappingURL=deterministic-rubric-engine.d.ts.map