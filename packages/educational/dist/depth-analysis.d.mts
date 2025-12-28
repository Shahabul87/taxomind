import { W as WebbDOKAnalysis, a as WebbDOKDistribution$1, b as WebbDOKLevel$1, A as AssessmentQualityMetrics, C as CourseType, c as CourseTypeProfile, B as BloomsDistribution$1, O as ObjectiveAnalysis, d as ObjectiveDeduplicationResult } from './enhanced-depth-engine-BTI0OOb5.mjs';
export { u as AnalysisMetadata, i as ChapterData, h as CourseData, j as CourseDepthAnalysisCacheEntry, k as CourseDepthAnalysisHistoryEntry, l as CourseDepthAnalysisSnapshotInput, m as CourseDepthAnalysisStore, D as DepthAnalysisLogger, p as EnhancedChapterAnalysis, E as EnhancedDepthAnalysisEngine, n as EnhancedDepthAnalysisEngineOptions, o as EnhancedDepthAnalysisResponse, r as EnhancedRecommendations, q as EnhancedSectionAnalysis, s as LearningGap, L as LearningPathway, R as Recommendation, S as SectionData, t as StudentImpactAnalysis, e as createEnhancedDepthAnalysisEngine, f as enhancedDepthEngine, g as generateCourseContentHash } from './enhanced-depth-engine-BTI0OOb5.mjs';
import { BloomsLevel } from '@sam-ai/core';
export { BloomsLevel } from '@sam-ai/core';

/**
 * Webb's Depth of Knowledge (DOK) Analyzer
 * Provides complementary cognitive depth analysis alongside Bloom's Taxonomy
 */

declare class WebbDOKAnalyzer {
    /**
     * Analyze content to determine Webb's DOK level
     */
    analyzeContent(content: string, bloomsLevel?: BloomsLevel): WebbDOKAnalysis;
    /**
     * Analyze multiple content pieces and return distribution
     */
    analyzeDistribution(contents: Array<{
        content: string;
        bloomsLevel?: BloomsLevel;
    }>): WebbDOKDistribution$1;
    /**
     * Calculate DOK depth score (0-100)
     */
    calculateDOKDepth(distribution: WebbDOKDistribution$1): number;
    /**
     * Determine DOK balance
     */
    determineDOKBalance(distribution: WebbDOKDistribution$1): 'recall-heavy' | 'skill-focused' | 'strategic' | 'well-balanced';
    /**
     * Get recommendations based on DOK analysis
     */
    getRecommendations(distribution: WebbDOKDistribution$1): string[];
    /**
     * Convert Bloom's distribution to estimated DOK distribution
     */
    bloomsToEstimatedDOK(bloomsDistribution: Record<string, number>): WebbDOKDistribution$1;
    /**
     * Validate alignment between Bloom's and DOK
     */
    validateBloomsDOKAlignment(bloomsLevel: BloomsLevel, dokLevel: WebbDOKLevel$1): {
        aligned: boolean;
        expectedDOK: WebbDOKLevel$1;
        message: string;
    };
    /**
     * Escape special regex characters
     */
    private escapeRegex;
}
declare const webbDOKAnalyzer: WebbDOKAnalyzer;

/**
 * Assessment Quality Analyzer
 * Evaluates the quality and effectiveness of course assessments
 */

interface ExamData {
    id: string;
    title: string;
    questions: QuestionData[];
}
interface QuestionData {
    id: string;
    text: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'coding' | 'matching';
    bloomsLevel?: BloomsLevel;
    difficulty?: number;
    options?: OptionData[];
    explanation?: string;
    feedback?: string;
    points?: number;
}
interface OptionData {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation?: string;
}
declare class AssessmentQualityAnalyzer {
    private readonly IDEAL_BLOOMS_COVERAGE;
    /**
     * Perform comprehensive assessment quality analysis
     */
    analyzeAssessments(exams: ExamData[]): AssessmentQualityMetrics;
    /**
     * Analyze variety of question types
     */
    private analyzeQuestionVariety;
    /**
     * Analyze difficulty progression across questions
     */
    private analyzeDifficultyProgression;
    /**
     * Analyze Bloom's Taxonomy coverage
     */
    private analyzeBloomsCoverage;
    /**
     * Analyze quality of feedback and explanations
     */
    private analyzeFeedbackQuality;
    /**
     * Analyze distractor quality for multiple choice questions
     */
    private analyzeDistractors;
    /**
     * Infer Bloom's level from question text
     */
    private inferBloomsLevel;
    /**
     * Determine difficulty pattern
     */
    private determineDifficultyPattern;
    /**
     * Calculate overall score
     */
    private calculateOverallScore;
    /**
     * Get empty metrics for courses without assessments
     */
    private getEmptyMetrics;
    /**
     * Recommendation generators
     */
    private getVarietyRecommendation;
    private getDifficultyRecommendation;
    private getBloomsCoverageRecommendation;
    private getFeedbackRecommendation;
    private getDistractorRecommendation;
}
declare const assessmentQualityAnalyzer: AssessmentQualityAnalyzer;

/**
 * Course Type Detector
 * Automatically detects course type and provides adaptive Bloom's targets
 */

interface CourseMetadata {
    title: string;
    description: string;
    category: string;
    learningObjectives: string[];
    prerequisites: string[];
    targetAudience: string;
    chaptersCount: number;
    averageSectionDuration: number;
    hasProjects: boolean;
    hasAssessments: boolean;
    hasCodingExercises: boolean;
}
interface CourseTypeDetectionResult {
    detectedType: CourseType;
    confidence: number;
    alternativeTypes: Array<{
        type: CourseType;
        confidence: number;
    }>;
    profile: CourseTypeProfile;
    idealDistribution: BloomsDistribution$1;
    idealDOKDistribution: WebbDOKDistribution$1;
    recommendations: string[];
}
interface DistributionComparison {
    currentDistribution: BloomsDistribution$1;
    idealDistribution: BloomsDistribution$1;
    gapAnalysis: Record<BloomsLevel, {
        current: number;
        ideal: number;
        gap: number;
        action: string;
    }>;
    alignmentScore: number;
    priority: BloomsLevel[];
}
declare class CourseTypeDetector {
    private readonly TYPE_KEYWORDS;
    private readonly CATEGORY_TYPE_MAPPING;
    /**
     * Detect course type based on metadata
     */
    detectCourseType(metadata: CourseMetadata): CourseTypeDetectionResult;
    /**
     * Compare current distribution with ideal for course type
     */
    compareWithIdeal(currentDistribution: BloomsDistribution$1, courseType: CourseType): DistributionComparison;
    /**
     * Get adaptive targets based on current state and course type
     */
    getAdaptiveTargets(currentDistribution: BloomsDistribution$1, courseType: CourseType, improvementRate?: number): BloomsDistribution$1;
    /**
     * Analyze text for type keywords
     */
    private analyzeText;
    /**
     * Score based on category mapping
     */
    private scoreByCategoryMapping;
    /**
     * Score based on course structure
     */
    private scoreByStructure;
    /**
     * Score based on action verbs in objectives
     */
    private scoreByActionVerbs;
    /**
     * Generate recommendations based on detected type
     */
    private generateTypeRecommendations;
}
declare const courseTypeDetector: CourseTypeDetector;

/**
 * Learning Objective Analyzer
 * Comprehensive analysis of learning objectives with SMART criteria and deduplication
 */

interface ActionVerbAnalysis {
    verb: string;
    bloomsLevel: BloomsLevel;
    strength: 'weak' | 'moderate' | 'strong';
    alternatives: string[];
}
declare class ObjectiveAnalyzer {
    private readonly STRONG_VERBS;
    private readonly WEAK_VERBS;
    private readonly MEASURABLE_INDICATORS;
    private readonly TIME_INDICATORS;
    /**
     * Analyze a single learning objective
     */
    analyzeObjective(objective: string): ObjectiveAnalysis;
    /**
     * Analyze multiple objectives and detect duplicates
     */
    analyzeAndDeduplicate(objectives: string[]): ObjectiveDeduplicationResult;
    /**
     * Analyze the action verb in an objective
     */
    private analyzeActionVerb;
    /**
     * Determine Webb's DOK level
     */
    private determineDOKLevel;
    /**
     * Analyze SMART criteria compliance
     */
    private analyzeSMARTCriteria;
    private analyzeSpecific;
    private analyzeMeasurable;
    private analyzeAchievable;
    private analyzeRelevant;
    private analyzeTimeBound;
    /**
     * Analyze measurability in detail
     */
    private analyzeMeasurability;
    /**
     * Calculate clarity score
     */
    private calculateClarityScore;
    /**
     * Generate improvement suggestions
     */
    private generateSuggestions;
    /**
     * Generate improved version of objective
     */
    private generateImprovedVersion;
    /**
     * Cluster similar objectives for deduplication
     */
    private clusterSimilarObjectives;
    /**
     * Calculate similarity between two objectives
     */
    private calculateSimilarity;
    /**
     * Generate merged objective from similar ones
     */
    private generateMergedObjective;
    /**
     * Generate recommendations for deduplication
     */
    private generateDeduplicationRecommendations;
    /**
     * Generate optimized list of objectives
     */
    private generateOptimizedObjectives;
}
declare const objectiveAnalyzer: ObjectiveAnalyzer;

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

interface ResearchCitation$1 {
    standard: 'QM' | 'OLC' | 'Research' | 'ISTE';
    id: string;
    description: string;
    fullCitation?: string;
}
type RubricCategory = 'LearningObjectives' | 'Assessment' | 'ContentStructure' | 'CognitiveDepth' | 'Accessibility' | 'Engagement';
interface RubricRule {
    id: string;
    category: RubricCategory;
    name: string;
    condition: (data: CourseAnalysisInput) => boolean;
    score: number;
    maxScore: number;
    weight: number;
    evidence: string;
    recommendation: string;
    source?: ResearchCitation$1;
}
interface CourseAnalysisInput {
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
interface ChapterInput {
    id: string;
    title: string;
    position: number;
    learningOutcome?: string;
    sections?: SectionInput[];
}
interface SectionInput {
    id: string;
    title: string;
    position: number;
    videoUrl?: string;
    description?: string;
}
interface AssessmentInput {
    id: string;
    title?: string;
    type: 'quiz' | 'exam' | 'assignment' | 'project' | 'practice' | 'other';
    questions?: QuestionInput[];
}
interface QuestionInput {
    id: string;
    text: string;
    type?: string;
    difficulty?: number;
    bloomsLevel?: BloomsLevel;
    explanation?: string;
    feedback?: string;
    options?: OptionInput[];
}
interface OptionInput {
    id: string;
    text: string;
    isCorrect: boolean;
}
interface AttachmentInput {
    id: string;
    name: string;
    url: string;
}
interface ContentAnalysisInput {
    bloomsDistribution: BloomsDistribution$1;
    dokDistribution?: WebbDOKDistribution$1;
}
interface DeterministicAnalysisResult {
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
interface CategoryScore {
    earned: number;
    max: number;
    percentage: number;
    rules: RuleResult[];
}
interface RuleResult {
    ruleId: string;
    ruleName: string;
    category: RubricCategory;
    passed: boolean;
    score: number;
    maxScore: number;
    evidence: string;
    details?: string;
    source?: ResearchCitation$1;
}
interface PrioritizedRecommendation {
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: RubricCategory;
    title: string;
    description: string;
    actionSteps: string[];
    estimatedImpact: number;
    effort: 'low' | 'medium' | 'high';
    source?: ResearchCitation$1;
}
interface AnalysisMetadata {
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
declare class DeterministicRubricEngine {
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
declare function serializeAnalysisResult(result: DeterministicAnalysisResult): Record<string, unknown>;
/**
 * Calculate course type alignment score
 */
declare function calculateCourseTypeAlignment(actual: BloomsDistribution$1, courseType: CourseType): number;
declare const deterministicRubricEngine: DeterministicRubricEngine;

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

type ContentSourceType = 'video_transcript' | 'document' | 'quiz' | 'discussion' | 'assignment' | 'text' | 'lesson_content';
type ContentContext = 'instructional' | 'assessment' | 'activity' | 'example' | 'introduction' | 'summary';
type WebbDOKLevel = 1 | 2 | 3 | 4;
interface ContentSource {
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
interface SentenceLevelAnalysis {
    sentence: string;
    predictedBloomsLevel: BloomsLevel;
    predictedDOKLevel: WebbDOKLevel;
    confidence: number;
    triggerPatterns: string[];
    context: ContentContext;
    position: 'beginning' | 'middle' | 'end';
}
interface BloomsDistribution {
    REMEMBER: number;
    UNDERSTAND: number;
    APPLY: number;
    ANALYZE: number;
    EVALUATE: number;
    CREATE: number;
    [key: string]: number;
}
interface WebbDOKDistribution {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
}
interface VerbFrequencyEntry {
    verb: string;
    count: number;
    level: BloomsLevel;
    contexts: ContentContext[];
}
interface ContentCoverage {
    totalSources: number;
    analyzedSources: number;
    skippedSources: number;
    totalWords: number;
    totalSentences: number;
    averageWordsPerSentence: number;
    contentTypes: Record<ContentSourceType, number>;
}
interface ContentGap {
    type: 'missing_level' | 'underrepresented' | 'overrepresented' | 'context_imbalance';
    level?: BloomsLevel | WebbDOKLevel;
    context?: ContentContext;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
}
interface DeepContentAnalysisResult {
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
declare class DeepContentAnalyzer {
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
declare const deepContentAnalyzer: DeepContentAnalyzer;

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

type TranscriptSourceType = 'youtube' | 'vimeo' | 'mux' | 'cloudflare' | 'custom' | 'provided' | 'generated';
interface TranscriptSource {
    videoUrl: string;
    transcript?: string;
    sectionId: string;
    chapterId: string;
    sectionTitle?: string;
    chapterTitle?: string;
    duration?: number;
    language?: string;
}
interface TranscriptExtractionResult {
    success: boolean;
    transcript: string | null;
    source: TranscriptSourceType;
    language: string;
    wordCount: number;
    confidence: number;
    error?: string;
}
interface TranscriptQualityMetrics {
    wordCount: number;
    averageSentenceLength: number;
    vocabularyRichness: number;
    readabilityScore: number;
    hasTimestamps: boolean;
    language: string;
    qualityRating: 'excellent' | 'good' | 'acceptable' | 'poor';
}
interface TranscriptAnalysisResult {
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
interface CourseTranscriptAnalysisResult {
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
declare class TranscriptAnalyzer {
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
declare const transcriptAnalyzer: TranscriptAnalyzer;

/**
 * Research-Validated Bloom's Taxonomy Distributions
 * All distributions backed by peer-reviewed research
 *
 * This module provides evidence-based target distributions for different
 * course types, replacing arbitrary heuristics with research-cited values.
 */

interface ResearchCitation {
    authors: string[];
    year: number;
    title: string;
    journal: string;
    doi?: string;
    url?: string;
    peerReviewed: boolean;
}
interface ValidatedDistribution {
    id: string;
    name: string;
    courseType: CourseType | 'general' | 'STEM';
    distribution: BloomsDistribution$1;
    dokDistribution: WebbDOKDistribution$1;
    source: ResearchCitation;
    sampleSize?: number;
    effectSize?: number;
    confidenceInterval?: {
        lower: number;
        upper: number;
    };
    applicability: string;
}
declare const VALIDATED_DISTRIBUTIONS: ValidatedDistribution[];
/**
 * Get appropriate distribution for course type
 */
declare function getValidatedDistribution(courseType: CourseType | string): ValidatedDistribution;
/**
 * Get citation string in APA format
 */
declare function getCitationString(distribution: ValidatedDistribution): string;
/**
 * Get all citations used in the system
 */
declare function getAllCitations(): ResearchCitation[];
/**
 * Calculate alignment score between actual and target distribution
 */
declare function calculateDistributionAlignment(actual: BloomsDistribution$1, target: BloomsDistribution$1): {
    alignmentScore: number;
    deviations: Record<string, number>;
    recommendations: string[];
};
/**
 * Get distribution recommendation based on course metadata
 */
declare function recommendDistribution(metadata: {
    title: string;
    description?: string;
    targetAudience?: string;
    keywords?: string[];
}): {
    recommended: ValidatedDistribution;
    confidence: number;
    reasoning: string;
};

/**
 * Quality Matters (QM) Higher Education Rubric Evaluator
 * 7th Edition Standards Implementation
 *
 * Citation: Quality Matters. (2023). Higher Education Rubric, 7th Edition.
 * URL: https://www.qualitymatters.org/qa-resources/rubric-standards/higher-ed-rubric
 *
 * QM Scoring System:
 * - 3 points: Met (meets standard)
 * - 2 points: Minor issues (meets with minor concerns)
 * - 1 point: Significant issues (does not meet)
 * - 0 points: Not applicable or not evaluated
 *
 * Essential Standards must score 3 to achieve QM certification
 */

type QMGeneralStandard = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
interface QMStandard {
    id: string;
    generalStandard: QMGeneralStandard;
    description: string;
    points: 3 | 2 | 1;
    essential: boolean;
    annotation: string;
    checkCriteria: string[];
    automatedCheckPossible: boolean;
}
interface QMStandardResult {
    standardId: string;
    status: 'met' | 'partially_met' | 'not_met' | 'manual_review_required' | 'not_evaluated';
    score: 0 | 1 | 2 | 3;
    maxScore: number;
    notes?: string;
    evidence?: string[];
    recommendations?: string[];
}
interface QMEvaluationResult {
    overallScore: number;
    maxPossibleScore: number;
    percentageScore: number;
    essentialsMet: boolean;
    essentialsCount: {
        met: number;
        total: number;
    };
    qmCertifiable: boolean;
    standardResults: QMStandardResult[];
    categoryScores: Record<QMGeneralStandard, {
        earned: number;
        max: number;
        percentage: number;
    }>;
    recommendations: QMRecommendation[];
    timestamp: string;
}
interface QMRecommendation {
    standardId: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionSteps: string[];
    isEssential: boolean;
}
declare const QM_STANDARDS: QMStandard[];
declare class QMEvaluator {
    private readonly VERSION;
    /**
     * Evaluate course against QM Higher Education Rubric (7th Edition)
     */
    evaluate(courseData: CourseAnalysisInput): QMEvaluationResult;
    /**
     * Get the QM evaluator version
     */
    getVersion(): string;
    /**
     * Get all QM standards for reference
     */
    getStandards(): QMStandard[];
    /**
     * Get essential standards only
     */
    getEssentialStandards(): QMStandard[];
    private evaluateStandard;
    private evaluate1_1_CourseNavigation;
    private evaluate1_2_CourseIntroduction;
    private evaluate1_7_Prerequisites;
    private evaluate1_8_InstructorIntro;
    private evaluate2_1_MeasurableObjectives;
    private evaluate2_2_ModuleObjectives;
    private evaluate2_3_LearnerCenteredObjectives;
    private evaluate2_4_ObjectiveActivityAlignment;
    private evaluate2_5_ObjectiveLevel;
    private evaluate3_1_AssessmentAlignment;
    private evaluate3_3_EvaluationCriteria;
    private evaluate3_4_AssessmentVariety;
    private evaluate3_5_ProgressTracking;
    private evaluate4_1_MaterialsAlignment;
    private evaluate4_5_MaterialVariety;
    private evaluate5_1_ActivityAlignment;
    private evaluate5_2_ActiveLearning;
    private evaluate8_1_Navigation;
    private evaluate8_2_Readability;
    private evaluate8_3_AccessibleContent;
    private evaluate8_4_AccessibleMultimedia;
    private evaluate8_5_MultimediaUsability;
    private generateRecommendations;
}
declare const qmEvaluator: QMEvaluator;

/**
 * OLC Quality Scorecard for Online Programs
 * Online Learning Consortium Standards Implementation
 *
 * Citation: Online Learning Consortium. (2020). OLC Quality Scorecard Suite.
 * URL: https://onlinelearningconsortium.org/consult/olc-quality-scorecard-suite/
 *
 * Scoring Levels:
 * - 0: Deficient - No evidence
 * - 1: Developing - Minimal evidence
 * - 2: Accomplished - Adequate evidence
 * - 3: Exemplary - Comprehensive evidence
 */

type OLCCategory = 'CourseDevelopment' | 'CourseStructure' | 'TeachingAndLearning' | 'LearnerSupport' | 'EvaluationAndAssessment' | 'AccessibilityAndUsability';
interface OLCIndicator {
    id: string;
    category: OLCCategory;
    indicator: string;
    scoringLevels: {
        0: string;
        1: string;
        2: string;
        3: string;
    };
    evidence: string[];
    automatedEvaluation: boolean;
}
interface OLCIndicatorResult {
    indicatorId: string;
    category: OLCCategory;
    score: 0 | 1 | 2 | 3;
    levelDescription: string;
    notes?: string;
    evidence?: string[];
}
interface OLCEvaluationResult {
    overallScore: number;
    maxPossibleScore: number;
    percentageScore: number;
    qualityLevel: 'Deficient' | 'Developing' | 'Accomplished' | 'Exemplary';
    categoryScores: Record<OLCCategory, {
        earned: number;
        max: number;
        percentage: number;
    }>;
    indicatorResults: OLCIndicatorResult[];
    strengths: string[];
    areasForImprovement: string[];
    recommendations: OLCRecommendation[];
    timestamp: string;
}
interface OLCRecommendation {
    indicatorId: string;
    category: OLCCategory;
    priority: 'critical' | 'high' | 'medium' | 'low';
    currentLevel: string;
    targetLevel: string;
    actionSteps: string[];
}
declare const OLC_INDICATORS: OLCIndicator[];
declare class OLCEvaluator {
    private readonly VERSION;
    /**
     * Evaluate course against OLC Quality Scorecard
     */
    evaluate(courseData: CourseAnalysisInput): OLCEvaluationResult;
    /**
     * Get OLC evaluator version
     */
    getVersion(): string;
    /**
     * Get all OLC indicators
     */
    getIndicators(): OLCIndicator[];
    private evaluateIndicator;
    private evaluateCD1_InstructionalDesign;
    private evaluateCD2_MeasurableObjectives;
    private evaluateCD3_ActiveLearning;
    private evaluateCD4_MaterialVariety;
    private evaluateCD5_CognitiveLoad;
    private evaluateCS1_LogicalOrganization;
    private evaluateCS2_ContentChunking;
    private evaluateCS3_Consistency;
    private evaluateCS4_Introduction;
    private evaluateTL1_ObjectiveLevel;
    private evaluateTL2_InstructionalMethods;
    private evaluateTL3_PracticeOpportunities;
    private evaluateEA1_AssessmentAlignment;
    private evaluateEA2_AssessmentVariety;
    private evaluateEA3_FormativeAssessment;
    private evaluateEA4_ClearCriteria;
    private evaluateAU1_Navigation;
    private evaluateAU2_AccessibleMultimedia;
    private evaluateAU3_Readability;
    private createResult;
    private createManualReviewResult;
    private determineQualityLevel;
    private identifyStrengths;
    private identifyAreasForImprovement;
    private generateRecommendations;
}
declare const olcEvaluator: OLCEvaluator;

/**
 * Distribution Analyzer
 * Comprehensive analysis of Bloom's Taxonomy distributions
 * with research-backed validation and cognitive rigor assessment
 *
 * Based on:
 * - Hess Cognitive Rigor Matrix (2009)
 * - Anderson & Krathwohl's Revised Taxonomy (2001)
 * - Webb's Depth of Knowledge (2002)
 */

type DOKLevel = 1 | 2 | 3 | 4;
interface DistributionAnalysisResult {
    courseType: CourseType | 'general' | 'STEM';
    detectedType: CourseType | 'general' | 'STEM';
    typeConfidence: number;
    actualDistribution: BloomsDistribution$1;
    targetDistribution: BloomsDistribution$1;
    alignmentScore: number;
    cognitiveRigorScore: number;
    cognitiveRigorMatrix: CognitiveRigorMatrix;
    balanceAssessment: BalanceAssessment;
    levelAnalysis: LevelAnalysis[];
    dokAnalysis: DOKAnalysis;
    statisticalConfidence: StatisticalConfidence;
    recommendations: DistributionRecommendation[];
    researchBasis: ResearchBasis;
    timestamp: string;
}
interface CognitiveRigorMatrix {
    cells: CognitiveRigorCell[][];
    dominantQuadrant: 'recall' | 'skills' | 'strategic' | 'extended';
    coverage: number;
    balance: number;
    recommendations: string[];
}
interface CognitiveRigorCell {
    bloomsLevel: BloomsLevel;
    dokLevel: DOKLevel;
    percentage: number;
    expected: number;
    status: 'under' | 'optimal' | 'over';
    examples: string[];
}
interface BalanceAssessment {
    type: 'well-balanced' | 'bottom-heavy' | 'top-heavy' | 'application-focused' | 'analysis-focused';
    lowerOrder: number;
    middleOrder: number;
    higherOrder: number;
    idealRatio: {
        lower: number;
        middle: number;
        higher: number;
    };
    deviation: number;
    recommendation: string;
}
interface LevelAnalysis {
    level: BloomsLevel;
    actual: number;
    target: number;
    deviation: number;
    status: 'significantly_under' | 'under' | 'optimal' | 'over' | 'significantly_over';
    percentile: number;
    researchContext: string;
    actionRequired: boolean;
    suggestedActions: string[];
}
interface DOKAnalysis {
    distribution: WebbDOKDistribution$1;
    targetDistribution: WebbDOKDistribution$1;
    alignmentScore: number;
    dominantLevel: DOKLevel;
    strategicThinkingPercent: number;
    recommendations: string[];
}
interface StatisticalConfidence {
    sampleBasis: string;
    confidenceLevel: number;
    marginOfError: number;
    effectSize?: number;
    pValue?: number;
    interpretation: string;
}
interface DistributionRecommendation {
    priority: 'critical' | 'high' | 'medium' | 'low';
    level: BloomsLevel | 'overall';
    type: 'increase' | 'decrease' | 'rebalance' | 'maintain';
    currentValue: number;
    targetValue: number;
    change: number;
    description: string;
    actionSteps: string[];
    researchSupport: string;
    estimatedImpact: 'high' | 'medium' | 'low';
}
interface ResearchBasis {
    primarySource: ValidatedDistribution;
    citation: string;
    applicability: string;
    limitations: string[];
    alternativeSources: Array<{
        name: string;
        citation: string;
    }>;
}
declare class DistributionAnalyzer {
    private readonly VERSION;
    /**
     * Perform comprehensive distribution analysis
     */
    analyze(actualDistribution: BloomsDistribution$1, courseType?: CourseType | string, dokDistribution?: WebbDOKDistribution$1): DistributionAnalysisResult;
    /**
     * Get analyzer version
     */
    getVersion(): string;
    private normalizeType;
    private detectCourseType;
    private calculateTypeConfidence;
    private calculateAlignment;
    private analyzeCognitiveRigor;
    private inferDOKFromBlooms;
    private getDOKPercent;
    private getCellStatus;
    private getDominantQuadrant;
    private calculateMatrixBalance;
    private generateMatrixRecommendations;
    private calculateCognitiveRigorScore;
    private assessBalance;
    private getBalanceRecommendation;
    private analyzeLevels;
    private getLevelActions;
    private calculatePercentile;
    private analyzeDOK;
    private calculateDOKAlignment;
    private calculateStatisticalConfidence;
    private generateRecommendations;
    private compileResearchBasis;
}
declare const distributionAnalyzer: DistributionAnalyzer;

export { type ActionVerbAnalysis, type AssessmentInput, AssessmentQualityAnalyzer, AssessmentQualityMetrics, type AttachmentInput, type BalanceAssessment, BloomsDistribution$1 as BloomsDistribution, type CategoryScore, type ChapterInput, type CognitiveRigorCell, type CognitiveRigorMatrix, type ContentAnalysisInput, type ContentContext, type ContentCoverage, type ContentGap, type ContentSource, type ContentSourceType, type CourseAnalysisInput, type CourseMetadata, type CourseTranscriptAnalysisResult, CourseType, type CourseTypeDetectionResult, CourseTypeDetector, type DOKAnalysis, type DOKLevel, type DeepContentAnalysisResult, DeepContentAnalyzer, type DeterministicAnalysisResult, DeterministicRubricEngine, type DistributionAnalysisResult, DistributionAnalyzer, type DistributionComparison, type DistributionRecommendation, type ExamData, type LevelAnalysis, type OLCCategory, type OLCEvaluationResult, OLCEvaluator, type OLCIndicator, type OLCIndicatorResult, type OLCRecommendation, OLC_INDICATORS, ObjectiveAnalysis, ObjectiveAnalyzer, ObjectiveDeduplicationResult, type OptionData, type OptionInput, type PrioritizedRecommendation, type QMEvaluationResult, QMEvaluator, type QMGeneralStandard, type QMRecommendation, type QMStandard, type QMStandardResult, QM_STANDARDS, type QuestionData, type QuestionInput, type ResearchBasis, type ResearchCitation, type RubricCategory, type RubricRule, type RuleResult, type SectionInput, type SentenceLevelAnalysis, type StatisticalConfidence, type TranscriptAnalysisResult, TranscriptAnalyzer, type TranscriptExtractionResult, type TranscriptQualityMetrics, type TranscriptSource, type TranscriptSourceType, VALIDATED_DISTRIBUTIONS, type ValidatedDistribution, type VerbFrequencyEntry, WebbDOKAnalyzer, WebbDOKDistribution$1 as WebbDOKDistribution, WebbDOKLevel$1 as WebbDOKLevel, assessmentQualityAnalyzer, calculateCourseTypeAlignment, calculateDistributionAlignment, courseTypeDetector, deepContentAnalyzer, deterministicRubricEngine, distributionAnalyzer, getAllCitations, getCitationString, getValidatedDistribution, objectiveAnalyzer, olcEvaluator, qmEvaluator, recommendDistribution, serializeAnalysisResult, transcriptAnalyzer, webbDOKAnalyzer };
