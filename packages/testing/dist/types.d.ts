/**
 * @sam-ai/testing - Type Definitions
 * Types for golden testing and calibration
 */
import { z } from 'zod';
export declare const TestCaseStatusSchema: z.ZodEnum<["pending", "passed", "failed", "skipped", "error"]>;
export type TestCaseStatus = z.infer<typeof TestCaseStatusSchema>;
export declare const TestCaseCategorySchema: z.ZodEnum<["content_generation", "assessment", "tutoring", "feedback", "recommendation", "analysis", "safety", "quality"]>;
export type TestCaseCategory = z.infer<typeof TestCaseCategorySchema>;
export declare const GoldenTestCaseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<["content_generation", "assessment", "tutoring", "feedback", "recommendation", "analysis", "safety", "quality"]>;
    version: z.ZodString;
    input: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    expectedOutput: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    expectedBehavior: z.ZodOptional<z.ZodString>;
    validationRules: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retries: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    category: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality";
    version: string;
    input: Record<string, unknown>;
    validationRules: string[];
    tags: string[];
    priority: "low" | "medium" | "high" | "critical";
    timeout: number;
    retries: number;
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    expectedOutput?: Record<string, unknown> | undefined;
    expectedBehavior?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    name: string;
    category: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality";
    version: string;
    input: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    description?: string | undefined;
    expectedOutput?: Record<string, unknown> | undefined;
    expectedBehavior?: string | undefined;
    validationRules?: string[] | undefined;
    tags?: string[] | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    timeout?: number | undefined;
    retries?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type GoldenTestCase = z.infer<typeof GoldenTestCaseSchema>;
export declare const TestResultSchema: z.ZodObject<{
    testCaseId: z.ZodString;
    runId: z.ZodString;
    status: z.ZodEnum<["pending", "passed", "failed", "skipped", "error"]>;
    actualOutput: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    duration: z.ZodNumber;
    validationResults: z.ZodDefault<z.ZodArray<z.ZodObject<{
        rule: z.ZodString;
        passed: z.ZodBoolean;
        message: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        passed: boolean;
        rule: string;
        message?: string | undefined;
    }, {
        passed: boolean;
        rule: string;
        message?: string | undefined;
    }>, "many">>;
    error: z.ZodOptional<z.ZodString>;
    diff: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "passed" | "failed" | "skipped" | "error";
    testCaseId: string;
    runId: string;
    duration: number;
    validationResults: {
        passed: boolean;
        rule: string;
        message?: string | undefined;
    }[];
    timestamp: Date;
    error?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    actualOutput?: Record<string, unknown> | undefined;
    diff?: string | undefined;
}, {
    status: "pending" | "passed" | "failed" | "skipped" | "error";
    testCaseId: string;
    runId: string;
    duration: number;
    timestamp: Date;
    error?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    actualOutput?: Record<string, unknown> | undefined;
    validationResults?: {
        passed: boolean;
        rule: string;
        message?: string | undefined;
    }[] | undefined;
    diff?: string | undefined;
}>;
export type TestResult = z.infer<typeof TestResultSchema>;
export declare const TestRunSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    startedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
    totalTests: z.ZodNumber;
    passed: z.ZodNumber;
    failed: z.ZodNumber;
    skipped: z.ZodNumber;
    errors: z.ZodNumber;
    duration: z.ZodOptional<z.ZodNumber>;
    results: z.ZodArray<z.ZodObject<{
        testCaseId: z.ZodString;
        runId: z.ZodString;
        status: z.ZodEnum<["pending", "passed", "failed", "skipped", "error"]>;
        actualOutput: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        duration: z.ZodNumber;
        validationResults: z.ZodDefault<z.ZodArray<z.ZodObject<{
            rule: z.ZodString;
            passed: z.ZodBoolean;
            message: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            passed: boolean;
            rule: string;
            message?: string | undefined;
        }, {
            passed: boolean;
            rule: string;
            message?: string | undefined;
        }>, "many">>;
        error: z.ZodOptional<z.ZodString>;
        diff: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodDate;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "passed" | "failed" | "skipped" | "error";
        testCaseId: string;
        runId: string;
        duration: number;
        validationResults: {
            passed: boolean;
            rule: string;
            message?: string | undefined;
        }[];
        timestamp: Date;
        error?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        actualOutput?: Record<string, unknown> | undefined;
        diff?: string | undefined;
    }, {
        status: "pending" | "passed" | "failed" | "skipped" | "error";
        testCaseId: string;
        runId: string;
        duration: number;
        timestamp: Date;
        error?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        actualOutput?: Record<string, unknown> | undefined;
        validationResults?: {
            passed: boolean;
            rule: string;
            message?: string | undefined;
        }[] | undefined;
        diff?: string | undefined;
    }>, "many">;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    passed: number;
    failed: number;
    skipped: number;
    id: string;
    startedAt: Date;
    totalTests: number;
    errors: number;
    results: {
        status: "pending" | "passed" | "failed" | "skipped" | "error";
        testCaseId: string;
        runId: string;
        duration: number;
        validationResults: {
            passed: boolean;
            rule: string;
            message?: string | undefined;
        }[];
        timestamp: Date;
        error?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        actualOutput?: Record<string, unknown> | undefined;
        diff?: string | undefined;
    }[];
    name?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    duration?: number | undefined;
    completedAt?: Date | undefined;
}, {
    passed: number;
    failed: number;
    skipped: number;
    id: string;
    startedAt: Date;
    totalTests: number;
    errors: number;
    results: {
        status: "pending" | "passed" | "failed" | "skipped" | "error";
        testCaseId: string;
        runId: string;
        duration: number;
        timestamp: Date;
        error?: string | undefined;
        metadata?: Record<string, unknown> | undefined;
        actualOutput?: Record<string, unknown> | undefined;
        validationResults?: {
            passed: boolean;
            rule: string;
            message?: string | undefined;
        }[] | undefined;
        diff?: string | undefined;
    }[];
    name?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    duration?: number | undefined;
    completedAt?: Date | undefined;
}>;
export type TestRun = z.infer<typeof TestRunSchema>;
export declare const CalibrationSampleSchema: z.ZodObject<{
    id: z.ZodString;
    category: z.ZodEnum<["content_generation", "assessment", "tutoring", "feedback", "recommendation", "analysis", "safety", "quality"]>;
    input: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    output: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    predictedConfidence: z.ZodNumber;
    actualAccuracy: z.ZodOptional<z.ZodNumber>;
    humanVerified: z.ZodDefault<z.ZodBoolean>;
    humanScore: z.ZodOptional<z.ZodNumber>;
    verifiedBy: z.ZodOptional<z.ZodString>;
    verifiedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    category: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality";
    input: Record<string, unknown>;
    createdAt: Date;
    output: Record<string, unknown>;
    predictedConfidence: number;
    humanVerified: boolean;
    metadata?: Record<string, unknown> | undefined;
    actualAccuracy?: number | undefined;
    humanScore?: number | undefined;
    verifiedBy?: string | undefined;
    verifiedAt?: Date | undefined;
}, {
    id: string;
    category: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality";
    input: Record<string, unknown>;
    createdAt: Date;
    output: Record<string, unknown>;
    predictedConfidence: number;
    metadata?: Record<string, unknown> | undefined;
    actualAccuracy?: number | undefined;
    humanVerified?: boolean | undefined;
    humanScore?: number | undefined;
    verifiedBy?: string | undefined;
    verifiedAt?: Date | undefined;
}>;
export type CalibrationSample = z.infer<typeof CalibrationSampleSchema>;
export declare const CalibrationBucketSchema: z.ZodObject<{
    confidenceRange: z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        min: number;
        max: number;
    }, {
        min: number;
        max: number;
    }>;
    sampleCount: z.ZodNumber;
    averageConfidence: z.ZodNumber;
    averageAccuracy: z.ZodNumber;
    calibrationError: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    confidenceRange: {
        min: number;
        max: number;
    };
    sampleCount: number;
    averageConfidence: number;
    averageAccuracy: number;
    calibrationError: number;
}, {
    confidenceRange: {
        min: number;
        max: number;
    };
    sampleCount: number;
    averageConfidence: number;
    averageAccuracy: number;
    calibrationError: number;
}>;
export type CalibrationBucket = z.infer<typeof CalibrationBucketSchema>;
export declare const CalibrationReportSchema: z.ZodObject<{
    id: z.ZodString;
    category: z.ZodOptional<z.ZodEnum<["content_generation", "assessment", "tutoring", "feedback", "recommendation", "analysis", "safety", "quality"]>>;
    generatedAt: z.ZodDate;
    sampleCount: z.ZodNumber;
    buckets: z.ZodArray<z.ZodObject<{
        confidenceRange: z.ZodObject<{
            min: z.ZodNumber;
            max: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            min: number;
            max: number;
        }, {
            min: number;
            max: number;
        }>;
        sampleCount: z.ZodNumber;
        averageConfidence: z.ZodNumber;
        averageAccuracy: z.ZodNumber;
        calibrationError: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        confidenceRange: {
            min: number;
            max: number;
        };
        sampleCount: number;
        averageConfidence: number;
        averageAccuracy: number;
        calibrationError: number;
    }, {
        confidenceRange: {
            min: number;
            max: number;
        };
        sampleCount: number;
        averageConfidence: number;
        averageAccuracy: number;
        calibrationError: number;
    }>, "many">;
    expectedCalibrationError: z.ZodNumber;
    maxCalibrationError: z.ZodNumber;
    overconfidenceRate: z.ZodNumber;
    underconfidenceRate: z.ZodNumber;
    recommendations: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    sampleCount: number;
    generatedAt: Date;
    buckets: {
        confidenceRange: {
            min: number;
            max: number;
        };
        sampleCount: number;
        averageConfidence: number;
        averageAccuracy: number;
        calibrationError: number;
    }[];
    expectedCalibrationError: number;
    maxCalibrationError: number;
    overconfidenceRate: number;
    underconfidenceRate: number;
    recommendations: string[];
    category?: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality" | undefined;
}, {
    id: string;
    sampleCount: number;
    generatedAt: Date;
    buckets: {
        confidenceRange: {
            min: number;
            max: number;
        };
        sampleCount: number;
        averageConfidence: number;
        averageAccuracy: number;
        calibrationError: number;
    }[];
    expectedCalibrationError: number;
    maxCalibrationError: number;
    overconfidenceRate: number;
    underconfidenceRate: number;
    recommendations: string[];
    category?: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality" | undefined;
}>;
export type CalibrationReport = z.infer<typeof CalibrationReportSchema>;
export declare const RegressionAlertSchema: z.ZodObject<{
    id: z.ZodString;
    testCaseId: z.ZodString;
    severity: z.ZodEnum<["warning", "error", "critical"]>;
    type: z.ZodEnum<["output_drift", "performance_degradation", "quality_drop", "error_rate_increase", "calibration_drift"]>;
    description: z.ZodString;
    previousValue: z.ZodUnknown;
    currentValue: z.ZodUnknown;
    threshold: z.ZodOptional<z.ZodNumber>;
    detectedAt: z.ZodDate;
    acknowledged: z.ZodDefault<z.ZodBoolean>;
    acknowledgedBy: z.ZodOptional<z.ZodString>;
    acknowledgedAt: z.ZodOptional<z.ZodDate>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "output_drift" | "performance_degradation" | "quality_drop" | "error_rate_increase" | "calibration_drift";
    id: string;
    description: string;
    testCaseId: string;
    severity: "error" | "critical" | "warning";
    detectedAt: Date;
    acknowledged: boolean;
    metadata?: Record<string, unknown> | undefined;
    previousValue?: unknown;
    currentValue?: unknown;
    threshold?: number | undefined;
    acknowledgedBy?: string | undefined;
    acknowledgedAt?: Date | undefined;
}, {
    type: "output_drift" | "performance_degradation" | "quality_drop" | "error_rate_increase" | "calibration_drift";
    id: string;
    description: string;
    testCaseId: string;
    severity: "error" | "critical" | "warning";
    detectedAt: Date;
    metadata?: Record<string, unknown> | undefined;
    previousValue?: unknown;
    currentValue?: unknown;
    threshold?: number | undefined;
    acknowledged?: boolean | undefined;
    acknowledgedBy?: string | undefined;
    acknowledgedAt?: Date | undefined;
}>;
export type RegressionAlert = z.infer<typeof RegressionAlertSchema>;
export interface GoldenTestStore {
    create(testCase: Omit<GoldenTestCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<GoldenTestCase>;
    get(id: string): Promise<GoldenTestCase | null>;
    update(id: string, updates: Partial<GoldenTestCase>): Promise<GoldenTestCase>;
    delete(id: string): Promise<boolean>;
    list(options?: {
        category?: TestCaseCategory;
        tags?: string[];
        priority?: string;
        limit?: number;
        offset?: number;
    }): Promise<GoldenTestCase[]>;
    count(options?: {
        category?: TestCaseCategory;
        tags?: string[];
    }): Promise<number>;
}
export interface TestResultStore {
    save(result: TestResult): Promise<void>;
    saveBatch(results: TestResult[]): Promise<void>;
    getByTestCase(testCaseId: string, limit?: number): Promise<TestResult[]>;
    getByRun(runId: string): Promise<TestResult[]>;
    getLatest(testCaseId: string): Promise<TestResult | null>;
}
export interface TestRunStore {
    create(run: Omit<TestRun, 'id'>): Promise<TestRun>;
    update(id: string, updates: Partial<TestRun>): Promise<TestRun>;
    get(id: string): Promise<TestRun | null>;
    list(options?: {
        limit?: number;
        offset?: number;
    }): Promise<TestRun[]>;
}
export interface CalibrationStore {
    saveSample(sample: Omit<CalibrationSample, 'id' | 'createdAt'>): Promise<CalibrationSample>;
    getSamples(options?: {
        category?: TestCaseCategory;
        humanVerifiedOnly?: boolean;
        limit?: number;
        offset?: number;
    }): Promise<CalibrationSample[]>;
    updateSample(id: string, updates: Partial<CalibrationSample>): Promise<CalibrationSample>;
    saveReport(report: CalibrationReport): Promise<void>;
    getLatestReport(category?: TestCaseCategory): Promise<CalibrationReport | null>;
}
export interface RegressionAlertStore {
    create(alert: Omit<RegressionAlert, 'id'>): Promise<RegressionAlert>;
    get(id: string): Promise<RegressionAlert | null>;
    getUnacknowledged(options?: {
        severity?: string;
        limit?: number;
    }): Promise<RegressionAlert[]>;
    acknowledge(id: string, acknowledgedBy: string): Promise<RegressionAlert>;
    list(options?: {
        limit?: number;
        offset?: number;
    }): Promise<RegressionAlert[]>;
}
export interface ValidationRule {
    name: string;
    validate(actual: unknown, expected: unknown, context?: Record<string, unknown>): ValidationResult;
}
export interface ValidationResult {
    passed: boolean;
    message?: string;
    details?: Record<string, unknown>;
}
export type ValidatorFunction = (actual: unknown, expected: unknown, context?: Record<string, unknown>) => ValidationResult;
export interface TestingLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
export interface GoldenTestRunnerConfig {
    testStore?: GoldenTestStore;
    resultStore?: TestResultStore;
    runStore?: TestRunStore;
    validators?: ValidationRule[];
    logger?: TestingLogger;
    parallelism?: number;
    defaultTimeout?: number;
    stopOnFailure?: boolean;
}
export interface CalibrationManagerConfig {
    store?: CalibrationStore;
    logger?: TestingLogger;
    bucketCount?: number;
    minSamplesPerBucket?: number;
    alertThreshold?: number;
}
export interface RegressionDetectorConfig {
    alertStore?: RegressionAlertStore;
    resultStore?: TestResultStore;
    logger?: TestingLogger;
    driftThreshold?: number;
    performanceThreshold?: number;
    qualityThreshold?: number;
}
//# sourceMappingURL=types.d.ts.map