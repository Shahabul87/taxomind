/**
 * @sam-ai/educational - Validation Schemas
 * Zod schemas for strict AI response validation
 */
import { z } from 'zod';
export declare const BloomsLevelSchema: z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>;
export type BloomsLevel = z.infer<typeof BloomsLevelSchema>;
export declare const SubjectiveEvaluationResponseSchema: z.ZodEffects<z.ZodObject<{
    score: z.ZodNumber;
    accuracy: z.ZodOptional<z.ZodNumber>;
    completeness: z.ZodOptional<z.ZodNumber>;
    relevance: z.ZodOptional<z.ZodNumber>;
    depth: z.ZodOptional<z.ZodNumber>;
    feedback: z.ZodOptional<z.ZodString>;
    strengths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    improvements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    nextSteps: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    demonstratedBloomsLevel: z.ZodOptional<z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>>;
    misconceptions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    score: number;
    strengths?: string[] | undefined;
    relevance?: number | undefined;
    depth?: number | undefined;
    feedback?: string | undefined;
    accuracy?: number | undefined;
    completeness?: number | undefined;
    improvements?: string[] | undefined;
    nextSteps?: string[] | undefined;
    demonstratedBloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    misconceptions?: string[] | undefined;
}, {
    score: number;
    strengths?: string[] | undefined;
    relevance?: number | undefined;
    depth?: number | undefined;
    feedback?: string | undefined;
    accuracy?: number | undefined;
    completeness?: number | undefined;
    improvements?: string[] | undefined;
    nextSteps?: string[] | undefined;
    demonstratedBloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    misconceptions?: string[] | undefined;
}>, {
    score: number;
    accuracy: number;
    completeness: number;
    relevance: number;
    depth: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
    demonstratedBloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    misconceptions: string[] | undefined;
}, {
    score: number;
    strengths?: string[] | undefined;
    relevance?: number | undefined;
    depth?: number | undefined;
    feedback?: string | undefined;
    accuracy?: number | undefined;
    completeness?: number | undefined;
    improvements?: string[] | undefined;
    nextSteps?: string[] | undefined;
    demonstratedBloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    misconceptions?: string[] | undefined;
}>;
export type SubjectiveEvaluationResponse = z.output<typeof SubjectiveEvaluationResponseSchema>;
export declare const GradingAssistanceResponseSchema: z.ZodEffects<z.ZodObject<{
    suggestedScore: z.ZodNumber;
    maxScore: z.ZodNumber;
    confidence: z.ZodOptional<z.ZodNumber>;
    reasoning: z.ZodOptional<z.ZodString>;
    rubricAlignment: z.ZodOptional<z.ZodArray<z.ZodObject<{
        criterionName: z.ZodString;
        score: z.ZodNumber;
        maxScore: z.ZodNumber;
        justification: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }, {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }>, "many">>;
    keyStrengths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    keyWeaknesses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    suggestedFeedback: z.ZodOptional<z.ZodString>;
    flaggedIssues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    comparisonToExpected: z.ZodOptional<z.ZodObject<{
        coveragePercentage: z.ZodOptional<z.ZodNumber>;
        missingKeyPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        extraneousPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        accuracyScore: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    }, {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    }>>;
    teacherTips: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    maxScore: number;
    suggestedScore: number;
    confidence?: number | undefined;
    reasoning?: string | undefined;
    rubricAlignment?: {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }[] | undefined;
    keyStrengths?: string[] | undefined;
    keyWeaknesses?: string[] | undefined;
    suggestedFeedback?: string | undefined;
    flaggedIssues?: string[] | undefined;
    comparisonToExpected?: {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    } | undefined;
    teacherTips?: string[] | undefined;
}, {
    maxScore: number;
    suggestedScore: number;
    confidence?: number | undefined;
    reasoning?: string | undefined;
    rubricAlignment?: {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }[] | undefined;
    keyStrengths?: string[] | undefined;
    keyWeaknesses?: string[] | undefined;
    suggestedFeedback?: string | undefined;
    flaggedIssues?: string[] | undefined;
    comparisonToExpected?: {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    } | undefined;
    teacherTips?: string[] | undefined;
}>, {
    suggestedScore: number;
    maxScore: number;
    confidence: number;
    reasoning: string;
    rubricAlignment: {
        criterionName: string;
        score: number;
        maxScore: number;
        justification: string;
    }[];
    keyStrengths: string[];
    keyWeaknesses: string[];
    suggestedFeedback: string;
    flaggedIssues: string[];
    comparisonToExpected: {
        coveragePercentage: number;
        missingKeyPoints: string[];
        extraneousPoints: string[];
        accuracyScore: number;
    };
    teacherTips: string[];
}, {
    maxScore: number;
    suggestedScore: number;
    confidence?: number | undefined;
    reasoning?: string | undefined;
    rubricAlignment?: {
        score: number;
        criterionName: string;
        maxScore: number;
        justification?: string | undefined;
    }[] | undefined;
    keyStrengths?: string[] | undefined;
    keyWeaknesses?: string[] | undefined;
    suggestedFeedback?: string | undefined;
    flaggedIssues?: string[] | undefined;
    comparisonToExpected?: {
        coveragePercentage?: number | undefined;
        missingKeyPoints?: string[] | undefined;
        extraneousPoints?: string[] | undefined;
        accuracyScore?: number | undefined;
    } | undefined;
    teacherTips?: string[] | undefined;
}>;
export type GradingAssistanceResponse = z.output<typeof GradingAssistanceResponseSchema>;
export declare const AdaptiveQuestionResponseSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    questionType: z.ZodOptional<z.ZodString>;
    bloomsLevel: z.ZodOptional<z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>>;
    difficulty: z.ZodOptional<z.ZodEnum<["EASY", "MEDIUM", "HARD"]>>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }>, "many">>;
    correctAnswer: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    explanation: z.ZodOptional<z.ZodString>;
    hints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeEstimate: z.ZodOptional<z.ZodNumber>;
    points: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    text: string;
    id?: string | undefined;
    explanation?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    questionType?: string | undefined;
    bloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}, {
    text: string;
    id?: string | undefined;
    explanation?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    questionType?: string | undefined;
    bloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}>, {
    id: string | undefined;
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    options: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[] | undefined;
    correctAnswer: string | string[] | undefined;
    explanation: string;
    hints: string[];
    timeEstimate: number;
    points: number;
    tags: string[];
}, {
    text: string;
    id?: string | undefined;
    explanation?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    questionType?: string | undefined;
    bloomsLevel?: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE" | undefined;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}>;
export type AdaptiveQuestionResponse = z.output<typeof AdaptiveQuestionResponseSchema>;
export declare const AssessmentQuestionsResponseSchema: z.ZodEffects<z.ZodArray<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    questionType: z.ZodString;
    bloomsLevel: z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>;
    difficulty: z.ZodEnum<["EASY", "MEDIUM", "HARD"]>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }>, "many">>;
    correctAnswer: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    explanation: z.ZodOptional<z.ZodString>;
    hints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeEstimate: z.ZodOptional<z.ZodNumber>;
    points: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    learningObjective: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}>, "many">, {
    id: string | undefined;
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    options: {
        id: string;
        text: string;
        isCorrect: boolean;
    }[] | undefined;
    correctAnswer: string | string[] | undefined;
    explanation: string;
    hints: string[];
    timeEstimate: number;
    points: number;
    tags: string[];
    learningObjective: string | undefined;
}[], {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}[]>;
export type AssessmentQuestionsResponse = z.output<typeof AssessmentQuestionsResponseSchema>;
export declare const ContentAnalysisResponseSchema: z.ZodEffects<z.ZodObject<{
    primaryLevel: z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>;
    distribution: z.ZodOptional<z.ZodObject<{
        REMEMBER: z.ZodOptional<z.ZodNumber>;
        UNDERSTAND: z.ZodOptional<z.ZodNumber>;
        APPLY: z.ZodOptional<z.ZodNumber>;
        ANALYZE: z.ZodOptional<z.ZodNumber>;
        EVALUATE: z.ZodOptional<z.ZodNumber>;
        CREATE: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    }, {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    }>>;
    confidence: z.ZodOptional<z.ZodNumber>;
    cognitiveDepth: z.ZodOptional<z.ZodNumber>;
    keyVerbs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    recommendations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    primaryLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    recommendations?: string[] | undefined;
    confidence?: number | undefined;
    cognitiveDepth?: number | undefined;
    distribution?: {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    } | undefined;
    keyVerbs?: string[] | undefined;
}, {
    primaryLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    recommendations?: string[] | undefined;
    confidence?: number | undefined;
    cognitiveDepth?: number | undefined;
    distribution?: {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    } | undefined;
    keyVerbs?: string[] | undefined;
}>, {
    primaryLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    distribution: {
        REMEMBER: number;
        UNDERSTAND: number;
        APPLY: number;
        ANALYZE: number;
        EVALUATE: number;
        CREATE: number;
    };
    confidence: number;
    cognitiveDepth: number;
    keyVerbs: string[];
    recommendations: string[];
}, {
    primaryLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    recommendations?: string[] | undefined;
    confidence?: number | undefined;
    cognitiveDepth?: number | undefined;
    distribution?: {
        REMEMBER?: number | undefined;
        UNDERSTAND?: number | undefined;
        APPLY?: number | undefined;
        ANALYZE?: number | undefined;
        EVALUATE?: number | undefined;
        CREATE?: number | undefined;
    } | undefined;
    keyVerbs?: string[] | undefined;
}>;
export type ContentAnalysisResponse = z.output<typeof ContentAnalysisResponseSchema>;
export declare const RubricAlignmentSchema: z.ZodObject<{
    criterionName: z.ZodString;
    score: z.ZodNumber;
    maxScore: z.ZodNumber;
    justification: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    score: number;
    criterionName: string;
    maxScore: number;
    justification?: string | undefined;
}, {
    score: number;
    criterionName: string;
    maxScore: number;
    justification?: string | undefined;
}>;
export declare const ComparisonToExpectedSchema: z.ZodObject<{
    coveragePercentage: z.ZodOptional<z.ZodNumber>;
    missingKeyPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    extraneousPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    accuracyScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    coveragePercentage?: number | undefined;
    missingKeyPoints?: string[] | undefined;
    extraneousPoints?: string[] | undefined;
    accuracyScore?: number | undefined;
}, {
    coveragePercentage?: number | undefined;
    missingKeyPoints?: string[] | undefined;
    extraneousPoints?: string[] | undefined;
    accuracyScore?: number | undefined;
}>;
export declare const QuestionOptionSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    isCorrect: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    text: string;
    isCorrect?: boolean | undefined;
}, {
    id: string;
    text: string;
    isCorrect?: boolean | undefined;
}>;
export declare const AssessmentQuestionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    text: z.ZodString;
    questionType: z.ZodString;
    bloomsLevel: z.ZodEnum<["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"]>;
    difficulty: z.ZodEnum<["EASY", "MEDIUM", "HARD"]>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        isCorrect: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }, {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }>, "many">>;
    correctAnswer: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    explanation: z.ZodOptional<z.ZodString>;
    hints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    timeEstimate: z.ZodOptional<z.ZodNumber>;
    points: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    learningObjective: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}, {
    text: string;
    questionType: string;
    bloomsLevel: "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE" | "EVALUATE" | "CREATE";
    difficulty: "EASY" | "MEDIUM" | "HARD";
    id?: string | undefined;
    explanation?: string | undefined;
    learningObjective?: string | undefined;
    points?: number | undefined;
    options?: {
        id: string;
        text: string;
        isCorrect?: boolean | undefined;
    }[] | undefined;
    tags?: string[] | undefined;
    correctAnswer?: string | string[] | undefined;
    hints?: string[] | undefined;
    timeEstimate?: number | undefined;
}>;
export declare const BloomsDistributionSchema: z.ZodObject<{
    REMEMBER: z.ZodOptional<z.ZodNumber>;
    UNDERSTAND: z.ZodOptional<z.ZodNumber>;
    APPLY: z.ZodOptional<z.ZodNumber>;
    ANALYZE: z.ZodOptional<z.ZodNumber>;
    EVALUATE: z.ZodOptional<z.ZodNumber>;
    CREATE: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    REMEMBER?: number | undefined;
    UNDERSTAND?: number | undefined;
    APPLY?: number | undefined;
    ANALYZE?: number | undefined;
    EVALUATE?: number | undefined;
    CREATE?: number | undefined;
}, {
    REMEMBER?: number | undefined;
    UNDERSTAND?: number | undefined;
    APPLY?: number | undefined;
    ANALYZE?: number | undefined;
    EVALUATE?: number | undefined;
    CREATE?: number | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map