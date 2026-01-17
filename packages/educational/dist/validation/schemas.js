/**
 * @sam-ai/educational - Validation Schemas
 * Zod schemas for strict AI response validation
 */
import { z } from 'zod';
// ============================================================================
// BLOOM'S TAXONOMY
// ============================================================================
export const BloomsLevelSchema = z.enum([
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
]);
// ============================================================================
// SUBJECTIVE EVALUATION RESPONSE
// ============================================================================
export const SubjectiveEvaluationResponseSchema = z
    .object({
    score: z.number().min(0),
    accuracy: z.number().min(0).max(100).optional(),
    completeness: z.number().min(0).max(100).optional(),
    relevance: z.number().min(0).max(100).optional(),
    depth: z.number().min(0).max(100).optional(),
    feedback: z.string().optional(),
    strengths: z.array(z.string()).optional(),
    improvements: z.array(z.string()).optional(),
    nextSteps: z.array(z.string()).optional(),
    demonstratedBloomsLevel: BloomsLevelSchema.optional(),
    misconceptions: z.array(z.string()).optional(),
})
    .transform((data) => ({
    score: data.score,
    accuracy: data.accuracy ?? 0,
    completeness: data.completeness ?? 0,
    relevance: data.relevance ?? 0,
    depth: data.depth ?? 0,
    feedback: data.feedback ?? 'Evaluation complete.',
    strengths: data.strengths ?? [],
    improvements: data.improvements ?? [],
    nextSteps: data.nextSteps ?? [],
    demonstratedBloomsLevel: data.demonstratedBloomsLevel,
    misconceptions: data.misconceptions,
}));
// ============================================================================
// GRADING ASSISTANCE RESPONSE
// ============================================================================
const RubricAlignmentInputSchema = z.object({
    criterionName: z.string(),
    score: z.number().min(0),
    maxScore: z.number().min(0),
    justification: z.string().optional(),
});
const ComparisonToExpectedInputSchema = z.object({
    coveragePercentage: z.number().min(0).max(100).optional(),
    missingKeyPoints: z.array(z.string()).optional(),
    extraneousPoints: z.array(z.string()).optional(),
    accuracyScore: z.number().min(0).max(100).optional(),
});
export const GradingAssistanceResponseSchema = z
    .object({
    suggestedScore: z.number().min(0),
    maxScore: z.number().min(0),
    confidence: z.number().min(0).max(1).optional(),
    reasoning: z.string().optional(),
    rubricAlignment: z.array(RubricAlignmentInputSchema).optional(),
    keyStrengths: z.array(z.string()).optional(),
    keyWeaknesses: z.array(z.string()).optional(),
    suggestedFeedback: z.string().optional(),
    flaggedIssues: z.array(z.string()).optional(),
    comparisonToExpected: ComparisonToExpectedInputSchema.optional(),
    teacherTips: z.array(z.string()).optional(),
})
    .transform((data) => ({
    suggestedScore: data.suggestedScore,
    maxScore: data.maxScore,
    confidence: data.confidence ?? 0.5,
    reasoning: data.reasoning ?? '',
    rubricAlignment: (data.rubricAlignment ?? []).map((r) => ({
        criterionName: r.criterionName,
        score: r.score,
        maxScore: r.maxScore,
        justification: r.justification ?? '',
    })),
    keyStrengths: data.keyStrengths ?? [],
    keyWeaknesses: data.keyWeaknesses ?? [],
    suggestedFeedback: data.suggestedFeedback ?? '',
    flaggedIssues: data.flaggedIssues ?? [],
    comparisonToExpected: {
        coveragePercentage: data.comparisonToExpected?.coveragePercentage ?? 0,
        missingKeyPoints: data.comparisonToExpected?.missingKeyPoints ?? [],
        extraneousPoints: data.comparisonToExpected?.extraneousPoints ?? [],
        accuracyScore: data.comparisonToExpected?.accuracyScore ?? 0,
    },
    teacherTips: data.teacherTips ?? [],
}));
// ============================================================================
// ADAPTIVE QUESTION RESPONSE
// ============================================================================
const QuestionOptionInputSchema = z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean().optional(),
});
export const AdaptiveQuestionResponseSchema = z
    .object({
    id: z.string().optional(),
    text: z.string().min(1),
    questionType: z.string().optional(),
    bloomsLevel: BloomsLevelSchema.optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
    options: z.array(QuestionOptionInputSchema).optional(),
    correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
    explanation: z.string().optional(),
    hints: z.array(z.string()).optional(),
    timeEstimate: z.number().min(0).optional(),
    points: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
})
    .transform((data) => ({
    id: data.id,
    text: data.text,
    questionType: data.questionType ?? 'MULTIPLE_CHOICE',
    bloomsLevel: data.bloomsLevel ?? 'UNDERSTAND',
    difficulty: data.difficulty ?? 'MEDIUM',
    options: data.options?.map((o) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect ?? false,
    })),
    correctAnswer: data.correctAnswer,
    explanation: data.explanation ?? '',
    hints: data.hints ?? [],
    timeEstimate: data.timeEstimate ?? 60,
    points: data.points ?? 10,
    tags: data.tags ?? [],
}));
// ============================================================================
// ASSESSMENT QUESTIONS RESPONSE
// ============================================================================
const AssessmentQuestionInputSchema = z.object({
    id: z.string().optional(),
    text: z.string().min(1),
    questionType: z.string(),
    bloomsLevel: BloomsLevelSchema,
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    options: z.array(QuestionOptionInputSchema).optional(),
    correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
    explanation: z.string().optional(),
    hints: z.array(z.string()).optional(),
    timeEstimate: z.number().min(0).optional(),
    points: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
    learningObjective: z.string().optional(),
});
export const AssessmentQuestionsResponseSchema = z.array(AssessmentQuestionInputSchema).transform((questions) => questions.map((q) => ({
    id: q.id,
    text: q.text,
    questionType: q.questionType,
    bloomsLevel: q.bloomsLevel,
    difficulty: q.difficulty,
    options: q.options?.map((o) => ({
        id: o.id,
        text: o.text,
        isCorrect: o.isCorrect ?? false,
    })),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation ?? '',
    hints: q.hints ?? [],
    timeEstimate: q.timeEstimate ?? 60,
    points: q.points ?? 10,
    tags: q.tags ?? [],
    learningObjective: q.learningObjective,
})));
// ============================================================================
// CONTENT ANALYSIS RESPONSE
// ============================================================================
const BloomsDistributionInputSchema = z.object({
    REMEMBER: z.number().min(0).optional(),
    UNDERSTAND: z.number().min(0).optional(),
    APPLY: z.number().min(0).optional(),
    ANALYZE: z.number().min(0).optional(),
    EVALUATE: z.number().min(0).optional(),
    CREATE: z.number().min(0).optional(),
});
export const ContentAnalysisResponseSchema = z
    .object({
    primaryLevel: BloomsLevelSchema,
    distribution: BloomsDistributionInputSchema.optional(),
    confidence: z.number().min(0).max(1).optional(),
    cognitiveDepth: z.number().min(0).max(100).optional(),
    keyVerbs: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
})
    .transform((data) => ({
    primaryLevel: data.primaryLevel,
    distribution: {
        REMEMBER: data.distribution?.REMEMBER ?? 0,
        UNDERSTAND: data.distribution?.UNDERSTAND ?? 0,
        APPLY: data.distribution?.APPLY ?? 0,
        ANALYZE: data.distribution?.ANALYZE ?? 0,
        EVALUATE: data.distribution?.EVALUATE ?? 0,
        CREATE: data.distribution?.CREATE ?? 0,
    },
    confidence: data.confidence ?? 0.7,
    cognitiveDepth: data.cognitiveDepth ?? 50,
    keyVerbs: data.keyVerbs ?? [],
    recommendations: data.recommendations ?? [],
}));
// Re-export internal schemas for external use
export const RubricAlignmentSchema = RubricAlignmentInputSchema;
export const ComparisonToExpectedSchema = ComparisonToExpectedInputSchema;
export const QuestionOptionSchema = QuestionOptionInputSchema;
export const AssessmentQuestionSchema = AssessmentQuestionInputSchema;
export const BloomsDistributionSchema = BloomsDistributionInputSchema;
