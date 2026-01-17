/**
 * @sam-ai/agentic - Self-Evaluation Types
 * Types for confidence scoring, response verification, and quality tracking
 */
import { z } from 'zod';
/**
 * Confidence level categories
 */
export declare const ConfidenceLevel: {
    readonly HIGH: "high";
    readonly MEDIUM: "medium";
    readonly LOW: "low";
    readonly UNCERTAIN: "uncertain";
};
export type ConfidenceLevel = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];
/**
 * Confidence factor types
 */
export declare const ConfidenceFactorType: {
    readonly KNOWLEDGE_COVERAGE: "knowledge_coverage";
    readonly SOURCE_RELIABILITY: "source_reliability";
    readonly COMPLEXITY_MATCH: "complexity_match";
    readonly CONTEXT_RELEVANCE: "context_relevance";
    readonly HISTORICAL_ACCURACY: "historical_accuracy";
    readonly CONCEPT_CLARITY: "concept_clarity";
    readonly PREREQUISITE_KNOWLEDGE: "prerequisite_knowledge";
    readonly AMBIGUITY_LEVEL: "ambiguity_level";
};
export type ConfidenceFactorType = (typeof ConfidenceFactorType)[keyof typeof ConfidenceFactorType];
/**
 * Individual confidence factor
 */
export interface ConfidenceFactor {
    type: ConfidenceFactorType;
    score: number;
    weight: number;
    reasoning: string;
    metadata?: Record<string, unknown>;
}
/**
 * Confidence score result
 */
export interface ConfidenceScore {
    id: string;
    responseId: string;
    userId: string;
    sessionId: string;
    overallScore: number;
    level: ConfidenceLevel;
    factors: ConfidenceFactor[];
    responseType: ResponseType;
    topic?: string;
    complexity: ComplexityLevel;
    shouldVerify: boolean;
    suggestedDisclaimer?: string;
    alternativeApproaches?: string[];
    scoredAt: Date;
}
/**
 * Response types for scoring
 */
export declare const ResponseType: {
    readonly EXPLANATION: "explanation";
    readonly ANSWER: "answer";
    readonly HINT: "hint";
    readonly FEEDBACK: "feedback";
    readonly ASSESSMENT: "assessment";
    readonly RECOMMENDATION: "recommendation";
    readonly CLARIFICATION: "clarification";
};
export type ResponseType = (typeof ResponseType)[keyof typeof ResponseType];
/**
 * Complexity levels
 */
export declare const ComplexityLevel: {
    readonly BASIC: "basic";
    readonly INTERMEDIATE: "intermediate";
    readonly ADVANCED: "advanced";
    readonly EXPERT: "expert";
};
export type ComplexityLevel = (typeof ComplexityLevel)[keyof typeof ComplexityLevel];
/**
 * Input for confidence scoring
 */
export interface ConfidenceInput {
    responseId: string;
    userId: string;
    sessionId: string;
    responseText: string;
    responseType: ResponseType;
    topic?: string;
    context?: ResponseContext;
    sources?: SourceReference[];
}
/**
 * Response context for scoring
 */
export interface ResponseContext {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    questionText?: string;
    studentLevel?: string;
    previousAttempts?: number;
    relatedConcepts?: string[];
}
/**
 * Source reference for verification
 */
export interface SourceReference {
    id: string;
    type: SourceType;
    title: string;
    url?: string;
    reliability: number;
    lastVerified?: Date;
}
/**
 * Source types
 */
export declare const SourceType: {
    readonly COURSE_CONTENT: "course_content";
    readonly TEXTBOOK: "textbook";
    readonly DOCUMENTATION: "documentation";
    readonly ACADEMIC_PAPER: "academic_paper";
    readonly KNOWLEDGE_BASE: "knowledge_base";
    readonly EXPERT_REVIEW: "expert_review";
    readonly GENERATED: "generated";
};
export type SourceType = (typeof SourceType)[keyof typeof SourceType];
/**
 * Verification status
 */
export declare const VerificationStatus: {
    readonly VERIFIED: "verified";
    readonly PARTIALLY_VERIFIED: "partially_verified";
    readonly UNVERIFIED: "unverified";
    readonly CONTRADICTED: "contradicted";
    readonly PENDING: "pending";
};
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];
/**
 * Verification result
 */
export interface VerificationResult {
    id: string;
    responseId: string;
    userId: string;
    status: VerificationStatus;
    overallAccuracy: number;
    factChecks: FactCheck[];
    totalClaims: number;
    verifiedClaims: number;
    contradictedClaims: number;
    sourceValidations: SourceValidation[];
    issues: VerificationIssue[];
    corrections?: CorrectionSuggestion[];
    verifiedAt: Date;
    expiresAt?: Date;
}
/**
 * Individual fact check
 */
export interface FactCheck {
    id: string;
    claim: string;
    status: FactCheckStatus;
    confidence: number;
    supportingEvidence?: string[];
    contradictingEvidence?: string[];
    sources: string[];
    notes?: string;
}
/**
 * Fact check status
 */
export declare const FactCheckStatus: {
    readonly CONFIRMED: "confirmed";
    readonly LIKELY_CORRECT: "likely_correct";
    readonly UNCERTAIN: "uncertain";
    readonly LIKELY_INCORRECT: "likely_incorrect";
    readonly INCORRECT: "incorrect";
    readonly NOT_VERIFIABLE: "not_verifiable";
};
export type FactCheckStatus = (typeof FactCheckStatus)[keyof typeof FactCheckStatus];
/**
 * Source validation result
 */
export interface SourceValidation {
    sourceId: string;
    isValid: boolean;
    reliability: number;
    lastChecked: Date;
    issues?: string[];
}
/**
 * Verification issue
 */
export interface VerificationIssue {
    id: string;
    type: IssueType;
    severity: IssueSeverity;
    description: string;
    location?: string;
    relatedClaims?: string[];
    suggestedFix?: string;
}
/**
 * Issue types
 */
export declare const IssueType: {
    readonly FACTUAL_ERROR: "factual_error";
    readonly OUTDATED_INFORMATION: "outdated_information";
    readonly OVERSIMPLIFICATION: "oversimplification";
    readonly MISSING_CONTEXT: "missing_context";
    readonly AMBIGUOUS_STATEMENT: "ambiguous_statement";
    readonly POTENTIAL_MISCONCEPTION: "potential_misconception";
    readonly INCOMPLETE_EXPLANATION: "incomplete_explanation";
    readonly TERMINOLOGY_ERROR: "terminology_error";
    readonly LOGICAL_INCONSISTENCY: "logical_inconsistency";
};
export type IssueType = (typeof IssueType)[keyof typeof IssueType];
/**
 * Issue severity
 */
export declare const IssueSeverity: {
    readonly CRITICAL: "critical";
    readonly HIGH: "high";
    readonly MEDIUM: "medium";
    readonly LOW: "low";
    readonly INFO: "info";
};
export type IssueSeverity = (typeof IssueSeverity)[keyof typeof IssueSeverity];
/**
 * Correction suggestion
 */
export interface CorrectionSuggestion {
    id: string;
    issueId: string;
    originalText: string;
    suggestedText: string;
    reasoning: string;
    confidence: number;
    sources?: string[];
}
/**
 * Verification input
 */
export interface VerificationInput {
    responseId: string;
    userId: string;
    responseText: string;
    claims?: string[];
    sources?: SourceReference[];
    context?: ResponseContext;
    strictMode?: boolean;
}
/**
 * Quality metric types
 */
export declare const QualityMetricType: {
    readonly ACCURACY: "accuracy";
    readonly HELPFULNESS: "helpfulness";
    readonly CLARITY: "clarity";
    readonly RELEVANCE: "relevance";
    readonly COMPLETENESS: "completeness";
    readonly ENGAGEMENT: "engagement";
    readonly PEDAGOGICAL_EFFECTIVENESS: "pedagogical_effectiveness";
};
export type QualityMetricType = (typeof QualityMetricType)[keyof typeof QualityMetricType];
/**
 * Quality record for a response
 */
export interface QualityRecord {
    id: string;
    responseId: string;
    userId: string;
    sessionId: string;
    metrics: QualityMetric[];
    overallQuality: number;
    confidenceScore?: number;
    confidenceAccuracy?: number;
    studentFeedback?: StudentFeedback;
    expertReview?: ExpertReview;
    learningOutcome?: LearningOutcome;
    recordedAt: Date;
    updatedAt: Date;
}
/**
 * Individual quality metric
 */
export interface QualityMetric {
    type: QualityMetricType;
    score: number;
    source: MetricSource;
    confidence: number;
    notes?: string;
}
/**
 * Metric source
 */
export declare const MetricSource: {
    readonly AUTOMATED: "automated";
    readonly STUDENT_FEEDBACK: "student_feedback";
    readonly EXPERT_REVIEW: "expert_review";
    readonly OUTCOME_BASED: "outcome_based";
    readonly COMPARATIVE: "comparative";
};
export type MetricSource = (typeof MetricSource)[keyof typeof MetricSource];
/**
 * Student feedback on response
 */
export interface StudentFeedback {
    id: string;
    responseId: string;
    userId: string;
    helpful: boolean;
    rating?: number;
    clarity?: number;
    comment?: string;
    didUnderstand: boolean;
    needMoreHelp: boolean;
    askedFollowUp?: boolean;
    triedAgain?: boolean;
    succeededAfter?: boolean;
    submittedAt: Date;
}
/**
 * Expert review of response
 */
export interface ExpertReview {
    id: string;
    responseId: string;
    reviewerId: string;
    accuracyScore: number;
    pedagogyScore: number;
    appropriatenessScore: number;
    issuesFound: VerificationIssue[];
    suggestedImprovements: string[];
    approved: boolean;
    requiresRevision: boolean;
    reviewedAt: Date;
}
/**
 * Learning outcome tracking
 */
export interface LearningOutcome {
    id: string;
    responseId: string;
    userId: string;
    subsequentAttempts: number;
    successfulAttempts: number;
    masteryImprovement: number;
    timeSpentLearning: number;
    additionalResourcesUsed: number;
    retentionScore?: number;
    transferScore?: number;
    measuredAt: Date;
}
/**
 * Calibration data for confidence adjustment
 */
export interface CalibrationData {
    id: string;
    userId?: string;
    topic?: string;
    totalResponses: number;
    expectedAccuracy: number;
    actualAccuracy: number;
    calibrationError: number;
    byConfidenceLevel: CalibrationBucket[];
    adjustmentFactor: number;
    adjustmentDirection: 'increase' | 'decrease' | 'none';
    periodStart: Date;
    periodEnd: Date;
    calculatedAt: Date;
}
/**
 * Calibration bucket for a confidence level
 */
export interface CalibrationBucket {
    level: ConfidenceLevel;
    count: number;
    expectedAccuracy: number;
    actualAccuracy: number;
    isOverconfident: boolean;
    isUnderconfident: boolean;
}
/**
 * Quality summary for a time period
 */
export interface QualitySummary {
    userId?: string;
    periodStart: Date;
    periodEnd: Date;
    totalResponses: number;
    averageQuality: number;
    averageConfidence: number;
    calibrationScore: number;
    byResponseType: Record<ResponseType, QualityAggregate>;
    byTopic: Record<string, QualityAggregate>;
    byComplexity: Record<ComplexityLevel, QualityAggregate>;
    qualityTrend: 'improving' | 'stable' | 'declining';
    confidenceTrend: 'improving' | 'stable' | 'declining';
    improvementAreas: string[];
    strengths: string[];
}
/**
 * Aggregated quality data
 */
export interface QualityAggregate {
    count: number;
    averageQuality: number;
    averageConfidence: number;
    verificationRate: number;
    issueRate: number;
}
/**
 * Confidence score store
 */
export interface ConfidenceScoreStore {
    get(id: string): Promise<ConfidenceScore | null>;
    getByResponse(responseId: string): Promise<ConfidenceScore | null>;
    getByUser(userId: string, limit?: number): Promise<ConfidenceScore[]>;
    create(score: Omit<ConfidenceScore, 'id'>): Promise<ConfidenceScore>;
    getAverageByTopic(topic: string, since?: Date): Promise<number>;
    getDistribution(userId?: string): Promise<Record<ConfidenceLevel, number>>;
}
/**
 * Verification result store
 */
export interface VerificationResultStore {
    get(id: string): Promise<VerificationResult | null>;
    getByResponse(responseId: string): Promise<VerificationResult | null>;
    getByUser(userId: string, limit?: number): Promise<VerificationResult[]>;
    create(result: Omit<VerificationResult, 'id'>): Promise<VerificationResult>;
    update(id: string, updates: Partial<VerificationResult>): Promise<VerificationResult>;
    getIssuesByType(type: IssueType, since?: Date): Promise<VerificationIssue[]>;
}
/**
 * Quality record store
 */
export interface QualityRecordStore {
    get(id: string): Promise<QualityRecord | null>;
    getByResponse(responseId: string): Promise<QualityRecord | null>;
    getByUser(userId: string, limit?: number): Promise<QualityRecord[]>;
    create(record: Omit<QualityRecord, 'id'>): Promise<QualityRecord>;
    update(id: string, updates: Partial<QualityRecord>): Promise<QualityRecord>;
    recordFeedback(responseId: string, feedback: StudentFeedback): Promise<void>;
    recordOutcome(responseId: string, outcome: LearningOutcome): Promise<void>;
    getSummary(userId?: string, periodStart?: Date, periodEnd?: Date): Promise<QualitySummary>;
}
/**
 * Calibration store
 */
export interface CalibrationStore {
    get(id: string): Promise<CalibrationData | null>;
    getLatest(userId?: string, topic?: string): Promise<CalibrationData | null>;
    create(data: Omit<CalibrationData, 'id'>): Promise<CalibrationData>;
    getHistory(userId?: string, limit?: number): Promise<CalibrationData[]>;
}
export declare const ConfidenceInputSchema: z.ZodObject<{
    responseId: z.ZodString;
    userId: z.ZodString;
    sessionId: z.ZodString;
    responseText: z.ZodString;
    responseType: z.ZodEnum<["explanation", "answer", "hint", "feedback", "assessment", "recommendation", "clarification"]>;
    topic: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        questionText: z.ZodOptional<z.ZodString>;
        studentLevel: z.ZodOptional<z.ZodString>;
        previousAttempts: z.ZodOptional<z.ZodNumber>;
        relatedConcepts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }>>;
    sources: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        title: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        reliability: z.ZodNumber;
        lastVerified: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }, {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    sessionId: string;
    responseId: string;
    responseType: "feedback" | "assessment" | "explanation" | "hint" | "recommendation" | "answer" | "clarification";
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    topic?: string | undefined;
    sources?: {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }[] | undefined;
}, {
    userId: string;
    sessionId: string;
    responseId: string;
    responseType: "feedback" | "assessment" | "explanation" | "hint" | "recommendation" | "answer" | "clarification";
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    topic?: string | undefined;
    sources?: {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }[] | undefined;
}>;
export declare const VerificationInputSchema: z.ZodObject<{
    responseId: z.ZodString;
    userId: z.ZodString;
    responseText: z.ZodString;
    claims: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sources: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        title: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
        reliability: z.ZodNumber;
        lastVerified: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }, {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }>, "many">>;
    context: z.ZodOptional<z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        questionText: z.ZodOptional<z.ZodString>;
        studentLevel: z.ZodOptional<z.ZodString>;
        previousAttempts: z.ZodOptional<z.ZodNumber>;
        relatedConcepts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    }>>;
    strictMode: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    responseId: string;
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    sources?: {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }[] | undefined;
    claims?: string[] | undefined;
    strictMode?: boolean | undefined;
}, {
    userId: string;
    responseId: string;
    responseText: string;
    context?: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        questionText?: string | undefined;
        studentLevel?: string | undefined;
        previousAttempts?: number | undefined;
        relatedConcepts?: string[] | undefined;
    } | undefined;
    sources?: {
        type: string;
        title: string;
        id: string;
        reliability: number;
        url?: string | undefined;
        lastVerified?: Date | undefined;
    }[] | undefined;
    claims?: string[] | undefined;
    strictMode?: boolean | undefined;
}>;
export declare const StudentFeedbackSchema: z.ZodObject<{
    responseId: z.ZodString;
    userId: z.ZodString;
    helpful: z.ZodBoolean;
    rating: z.ZodOptional<z.ZodNumber>;
    clarity: z.ZodOptional<z.ZodNumber>;
    comment: z.ZodOptional<z.ZodString>;
    didUnderstand: z.ZodBoolean;
    needMoreHelp: z.ZodBoolean;
    askedFollowUp: z.ZodOptional<z.ZodBoolean>;
    triedAgain: z.ZodOptional<z.ZodBoolean>;
    succeededAfter: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    responseId: string;
    helpful: boolean;
    didUnderstand: boolean;
    needMoreHelp: boolean;
    clarity?: number | undefined;
    rating?: number | undefined;
    comment?: string | undefined;
    askedFollowUp?: boolean | undefined;
    triedAgain?: boolean | undefined;
    succeededAfter?: boolean | undefined;
}, {
    userId: string;
    responseId: string;
    helpful: boolean;
    didUnderstand: boolean;
    needMoreHelp: boolean;
    clarity?: number | undefined;
    rating?: number | undefined;
    comment?: string | undefined;
    askedFollowUp?: boolean | undefined;
    triedAgain?: boolean | undefined;
    succeededAfter?: boolean | undefined;
}>;
export interface SelfEvaluationLogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}
//# sourceMappingURL=types.d.ts.map