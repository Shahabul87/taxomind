/**
 * @sam-ai/testing - Type Definitions
 * Types for golden testing and calibration
 */
import { z } from 'zod';
// ============================================================================
// GOLDEN TEST TYPES
// ============================================================================
export const TestCaseStatusSchema = z.enum([
    'pending',
    'passed',
    'failed',
    'skipped',
    'error',
]);
export const TestCaseCategorySchema = z.enum([
    'content_generation',
    'assessment',
    'tutoring',
    'feedback',
    'recommendation',
    'analysis',
    'safety',
    'quality',
]);
export const GoldenTestCaseSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: TestCaseCategorySchema,
    version: z.string(),
    input: z.record(z.unknown()),
    expectedOutput: z.record(z.unknown()).optional(),
    expectedBehavior: z.string().optional(),
    validationRules: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    timeout: z.number().default(30000),
    retries: z.number().default(0),
    createdAt: z.date(),
    updatedAt: z.date(),
    metadata: z.record(z.unknown()).optional(),
});
export const TestResultSchema = z.object({
    testCaseId: z.string(),
    runId: z.string(),
    status: TestCaseStatusSchema,
    actualOutput: z.record(z.unknown()).optional(),
    duration: z.number(),
    validationResults: z.array(z.object({
        rule: z.string(),
        passed: z.boolean(),
        message: z.string().optional(),
    })).default([]),
    error: z.string().optional(),
    diff: z.string().optional(),
    timestamp: z.date(),
    metadata: z.record(z.unknown()).optional(),
});
export const TestRunSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    startedAt: z.date(),
    completedAt: z.date().optional(),
    totalTests: z.number(),
    passed: z.number(),
    failed: z.number(),
    skipped: z.number(),
    errors: z.number(),
    duration: z.number().optional(),
    results: z.array(TestResultSchema),
    metadata: z.record(z.unknown()).optional(),
});
// ============================================================================
// CALIBRATION TYPES
// ============================================================================
export const CalibrationSampleSchema = z.object({
    id: z.string(),
    category: TestCaseCategorySchema,
    input: z.record(z.unknown()),
    output: z.record(z.unknown()),
    predictedConfidence: z.number().min(0).max(1),
    actualAccuracy: z.number().min(0).max(1).optional(),
    humanVerified: z.boolean().default(false),
    humanScore: z.number().min(0).max(1).optional(),
    verifiedBy: z.string().optional(),
    verifiedAt: z.date().optional(),
    createdAt: z.date(),
    metadata: z.record(z.unknown()).optional(),
});
export const CalibrationBucketSchema = z.object({
    confidenceRange: z.object({
        min: z.number(),
        max: z.number(),
    }),
    sampleCount: z.number(),
    averageConfidence: z.number(),
    averageAccuracy: z.number(),
    calibrationError: z.number(), // |avgConfidence - avgAccuracy|
});
export const CalibrationReportSchema = z.object({
    id: z.string(),
    category: TestCaseCategorySchema.optional(),
    generatedAt: z.date(),
    sampleCount: z.number(),
    buckets: z.array(CalibrationBucketSchema),
    expectedCalibrationError: z.number(),
    maxCalibrationError: z.number(),
    overconfidenceRate: z.number(),
    underconfidenceRate: z.number(),
    recommendations: z.array(z.string()),
});
// ============================================================================
// REGRESSION TYPES
// ============================================================================
export const RegressionAlertSchema = z.object({
    id: z.string(),
    testCaseId: z.string(),
    severity: z.enum(['warning', 'error', 'critical']),
    type: z.enum([
        'output_drift',
        'performance_degradation',
        'quality_drop',
        'error_rate_increase',
        'calibration_drift',
    ]),
    description: z.string(),
    previousValue: z.unknown(),
    currentValue: z.unknown(),
    threshold: z.number().optional(),
    detectedAt: z.date(),
    acknowledged: z.boolean().default(false),
    acknowledgedBy: z.string().optional(),
    acknowledgedAt: z.date().optional(),
    metadata: z.record(z.unknown()).optional(),
});
//# sourceMappingURL=types.js.map