/**
 * @sam-ai/agentic - Self-Evaluation Types
 * Types for confidence scoring, response verification, and quality tracking
 */
import { z } from 'zod';
// ============================================================================
// CONFIDENCE SCORING TYPES
// ============================================================================
/**
 * Confidence level categories
 */
export const ConfidenceLevel = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    UNCERTAIN: 'uncertain',
};
/**
 * Confidence factor types
 */
export const ConfidenceFactorType = {
    KNOWLEDGE_COVERAGE: 'knowledge_coverage',
    SOURCE_RELIABILITY: 'source_reliability',
    COMPLEXITY_MATCH: 'complexity_match',
    CONTEXT_RELEVANCE: 'context_relevance',
    HISTORICAL_ACCURACY: 'historical_accuracy',
    CONCEPT_CLARITY: 'concept_clarity',
    PREREQUISITE_KNOWLEDGE: 'prerequisite_knowledge',
    AMBIGUITY_LEVEL: 'ambiguity_level',
};
/**
 * Response types for scoring
 */
export const ResponseType = {
    EXPLANATION: 'explanation',
    ANSWER: 'answer',
    HINT: 'hint',
    FEEDBACK: 'feedback',
    ASSESSMENT: 'assessment',
    RECOMMENDATION: 'recommendation',
    CLARIFICATION: 'clarification',
};
/**
 * Complexity levels
 */
export const ComplexityLevel = {
    BASIC: 'basic',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    EXPERT: 'expert',
};
/**
 * Source types
 */
export const SourceType = {
    COURSE_CONTENT: 'course_content',
    TEXTBOOK: 'textbook',
    DOCUMENTATION: 'documentation',
    ACADEMIC_PAPER: 'academic_paper',
    KNOWLEDGE_BASE: 'knowledge_base',
    EXPERT_REVIEW: 'expert_review',
    GENERATED: 'generated',
};
// ============================================================================
// RESPONSE VERIFICATION TYPES
// ============================================================================
/**
 * Verification status
 */
export const VerificationStatus = {
    VERIFIED: 'verified',
    PARTIALLY_VERIFIED: 'partially_verified',
    UNVERIFIED: 'unverified',
    CONTRADICTED: 'contradicted',
    PENDING: 'pending',
};
/**
 * Fact check status
 */
export const FactCheckStatus = {
    CONFIRMED: 'confirmed',
    LIKELY_CORRECT: 'likely_correct',
    UNCERTAIN: 'uncertain',
    LIKELY_INCORRECT: 'likely_incorrect',
    INCORRECT: 'incorrect',
    NOT_VERIFIABLE: 'not_verifiable',
};
/**
 * Issue types
 */
export const IssueType = {
    FACTUAL_ERROR: 'factual_error',
    OUTDATED_INFORMATION: 'outdated_information',
    OVERSIMPLIFICATION: 'oversimplification',
    MISSING_CONTEXT: 'missing_context',
    AMBIGUOUS_STATEMENT: 'ambiguous_statement',
    POTENTIAL_MISCONCEPTION: 'potential_misconception',
    INCOMPLETE_EXPLANATION: 'incomplete_explanation',
    TERMINOLOGY_ERROR: 'terminology_error',
    LOGICAL_INCONSISTENCY: 'logical_inconsistency',
};
/**
 * Issue severity
 */
export const IssueSeverity = {
    CRITICAL: 'critical',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    INFO: 'info',
};
// ============================================================================
// QUALITY TRACKING TYPES
// ============================================================================
/**
 * Quality metric types
 */
export const QualityMetricType = {
    ACCURACY: 'accuracy',
    HELPFULNESS: 'helpfulness',
    CLARITY: 'clarity',
    RELEVANCE: 'relevance',
    COMPLETENESS: 'completeness',
    ENGAGEMENT: 'engagement',
    PEDAGOGICAL_EFFECTIVENESS: 'pedagogical_effectiveness',
};
/**
 * Metric source
 */
export const MetricSource = {
    AUTOMATED: 'automated',
    STUDENT_FEEDBACK: 'student_feedback',
    EXPERT_REVIEW: 'expert_review',
    OUTCOME_BASED: 'outcome_based',
    COMPARATIVE: 'comparative',
};
// ============================================================================
// ZOD SCHEMAS
// ============================================================================
export const ConfidenceInputSchema = z.object({
    responseId: z.string().min(1),
    userId: z.string().min(1),
    sessionId: z.string().min(1),
    responseText: z.string().min(1),
    responseType: z.enum([
        'explanation',
        'answer',
        'hint',
        'feedback',
        'assessment',
        'recommendation',
        'clarification',
    ]),
    topic: z.string().optional(),
    context: z
        .object({
        courseId: z.string().optional(),
        chapterId: z.string().optional(),
        sectionId: z.string().optional(),
        questionText: z.string().optional(),
        studentLevel: z.string().optional(),
        previousAttempts: z.number().optional(),
        relatedConcepts: z.array(z.string()).optional(),
    })
        .optional(),
    sources: z
        .array(z.object({
        id: z.string(),
        type: z.string(),
        title: z.string(),
        url: z.string().optional(),
        reliability: z.number().min(0).max(1),
        lastVerified: z.date().optional(),
    }))
        .optional(),
});
export const VerificationInputSchema = z.object({
    responseId: z.string().min(1),
    userId: z.string().min(1),
    responseText: z.string().min(1),
    claims: z.array(z.string()).optional(),
    sources: z
        .array(z.object({
        id: z.string(),
        type: z.string(),
        title: z.string(),
        url: z.string().optional(),
        reliability: z.number().min(0).max(1),
        lastVerified: z.date().optional(),
    }))
        .optional(),
    context: z
        .object({
        courseId: z.string().optional(),
        chapterId: z.string().optional(),
        sectionId: z.string().optional(),
        questionText: z.string().optional(),
        studentLevel: z.string().optional(),
        previousAttempts: z.number().optional(),
        relatedConcepts: z.array(z.string()).optional(),
    })
        .optional(),
    strictMode: z.boolean().optional(),
});
export const StudentFeedbackSchema = z.object({
    responseId: z.string().min(1),
    userId: z.string().min(1),
    helpful: z.boolean(),
    rating: z.number().min(1).max(5).optional(),
    clarity: z.number().min(1).max(5).optional(),
    comment: z.string().max(1000).optional(),
    didUnderstand: z.boolean(),
    needMoreHelp: z.boolean(),
    askedFollowUp: z.boolean().optional(),
    triedAgain: z.boolean().optional(),
    succeededAfter: z.boolean().optional(),
});
//# sourceMappingURL=types.js.map