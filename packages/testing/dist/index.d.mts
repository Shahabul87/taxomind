import { z } from 'zod';

/**
 * @sam-ai/testing - Type Definitions
 * Types for golden testing and calibration
 */

declare const TestCaseStatusSchema: z.ZodEnum<["pending", "passed", "failed", "skipped", "error"]>;
type TestCaseStatus = z.infer<typeof TestCaseStatusSchema>;
declare const TestCaseCategorySchema: z.ZodEnum<["content_generation", "assessment", "tutoring", "feedback", "recommendation", "analysis", "safety", "quality"]>;
type TestCaseCategory = z.infer<typeof TestCaseCategorySchema>;
declare const GoldenTestCaseSchema: z.ZodObject<{
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
    category: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality";
    id: string;
    name: string;
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
    category: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality";
    id: string;
    name: string;
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
type GoldenTestCase = z.infer<typeof GoldenTestCaseSchema>;
declare const TestResultSchema: z.ZodObject<{
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
    metadata?: Record<string, unknown> | undefined;
    error?: string | undefined;
    actualOutput?: Record<string, unknown> | undefined;
    diff?: string | undefined;
}, {
    status: "pending" | "passed" | "failed" | "skipped" | "error";
    testCaseId: string;
    runId: string;
    duration: number;
    timestamp: Date;
    metadata?: Record<string, unknown> | undefined;
    error?: string | undefined;
    actualOutput?: Record<string, unknown> | undefined;
    validationResults?: {
        passed: boolean;
        rule: string;
        message?: string | undefined;
    }[] | undefined;
    diff?: string | undefined;
}>;
type TestResult = z.infer<typeof TestResultSchema>;
declare const TestRunSchema: z.ZodObject<{
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
        metadata?: Record<string, unknown> | undefined;
        error?: string | undefined;
        actualOutput?: Record<string, unknown> | undefined;
        diff?: string | undefined;
    }, {
        status: "pending" | "passed" | "failed" | "skipped" | "error";
        testCaseId: string;
        runId: string;
        duration: number;
        timestamp: Date;
        metadata?: Record<string, unknown> | undefined;
        error?: string | undefined;
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
    id: string;
    passed: number;
    failed: number;
    skipped: number;
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
        metadata?: Record<string, unknown> | undefined;
        error?: string | undefined;
        actualOutput?: Record<string, unknown> | undefined;
        diff?: string | undefined;
    }[];
    name?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    duration?: number | undefined;
    completedAt?: Date | undefined;
}, {
    id: string;
    passed: number;
    failed: number;
    skipped: number;
    startedAt: Date;
    totalTests: number;
    errors: number;
    results: {
        status: "pending" | "passed" | "failed" | "skipped" | "error";
        testCaseId: string;
        runId: string;
        duration: number;
        timestamp: Date;
        metadata?: Record<string, unknown> | undefined;
        error?: string | undefined;
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
type TestRun = z.infer<typeof TestRunSchema>;
declare const CalibrationSampleSchema: z.ZodObject<{
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
    category: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality";
    id: string;
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
    category: "content_generation" | "assessment" | "tutoring" | "feedback" | "recommendation" | "analysis" | "safety" | "quality";
    id: string;
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
type CalibrationSample = z.infer<typeof CalibrationSampleSchema>;
declare const CalibrationBucketSchema: z.ZodObject<{
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
type CalibrationBucket = z.infer<typeof CalibrationBucketSchema>;
declare const CalibrationReportSchema: z.ZodObject<{
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
type CalibrationReport = z.infer<typeof CalibrationReportSchema>;
declare const RegressionAlertSchema: z.ZodObject<{
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
    id: string;
    description: string;
    type: "output_drift" | "performance_degradation" | "quality_drop" | "error_rate_increase" | "calibration_drift";
    testCaseId: string;
    severity: "critical" | "error" | "warning";
    detectedAt: Date;
    acknowledged: boolean;
    metadata?: Record<string, unknown> | undefined;
    previousValue?: unknown;
    currentValue?: unknown;
    threshold?: number | undefined;
    acknowledgedBy?: string | undefined;
    acknowledgedAt?: Date | undefined;
}, {
    id: string;
    description: string;
    type: "output_drift" | "performance_degradation" | "quality_drop" | "error_rate_increase" | "calibration_drift";
    testCaseId: string;
    severity: "critical" | "error" | "warning";
    detectedAt: Date;
    metadata?: Record<string, unknown> | undefined;
    previousValue?: unknown;
    currentValue?: unknown;
    threshold?: number | undefined;
    acknowledged?: boolean | undefined;
    acknowledgedBy?: string | undefined;
    acknowledgedAt?: Date | undefined;
}>;
type RegressionAlert = z.infer<typeof RegressionAlertSchema>;
interface GoldenTestStore {
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
interface TestResultStore {
    save(result: TestResult): Promise<void>;
    saveBatch(results: TestResult[]): Promise<void>;
    getByTestCase(testCaseId: string, limit?: number): Promise<TestResult[]>;
    getByRun(runId: string): Promise<TestResult[]>;
    getLatest(testCaseId: string): Promise<TestResult | null>;
}
interface TestRunStore {
    create(run: Omit<TestRun, 'id'>): Promise<TestRun>;
    update(id: string, updates: Partial<TestRun>): Promise<TestRun>;
    get(id: string): Promise<TestRun | null>;
    list(options?: {
        limit?: number;
        offset?: number;
    }): Promise<TestRun[]>;
}
interface CalibrationStore {
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
interface RegressionAlertStore {
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
interface ValidationRule {
    name: string;
    validate(actual: unknown, expected: unknown, context?: Record<string, unknown>): ValidationResult;
}
interface ValidationResult {
    passed: boolean;
    message?: string;
    details?: Record<string, unknown>;
}
type ValidatorFunction = (actual: unknown, expected: unknown, context?: Record<string, unknown>) => ValidationResult;
interface TestingLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
interface GoldenTestRunnerConfig {
    testStore?: GoldenTestStore;
    resultStore?: TestResultStore;
    runStore?: TestRunStore;
    validators?: ValidationRule[];
    logger?: TestingLogger;
    parallelism?: number;
    defaultTimeout?: number;
    stopOnFailure?: boolean;
}
interface CalibrationManagerConfig {
    store?: CalibrationStore;
    logger?: TestingLogger;
    bucketCount?: number;
    minSamplesPerBucket?: number;
    alertThreshold?: number;
}
interface RegressionDetectorConfig {
    alertStore?: RegressionAlertStore;
    resultStore?: TestResultStore;
    logger?: TestingLogger;
    driftThreshold?: number;
    performanceThreshold?: number;
    qualityThreshold?: number;
}

/**
 * @sam-ai/testing - In-Memory Stores
 * Default in-memory implementations for testing infrastructure
 */

declare class InMemoryGoldenTestStore implements GoldenTestStore {
    private tests;
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
declare class InMemoryTestResultStore implements TestResultStore {
    private results;
    private runResults;
    save(result: TestResult): Promise<void>;
    saveBatch(results: TestResult[]): Promise<void>;
    getByTestCase(testCaseId: string, limit?: number): Promise<TestResult[]>;
    getByRun(runId: string): Promise<TestResult[]>;
    getLatest(testCaseId: string): Promise<TestResult | null>;
}
declare class InMemoryTestRunStore implements TestRunStore {
    private runs;
    create(run: Omit<TestRun, 'id'>): Promise<TestRun>;
    update(id: string, updates: Partial<TestRun>): Promise<TestRun>;
    get(id: string): Promise<TestRun | null>;
    list(options?: {
        limit?: number;
        offset?: number;
    }): Promise<TestRun[]>;
}
declare class InMemoryCalibrationStore implements CalibrationStore {
    private samples;
    private reports;
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
declare class InMemoryRegressionAlertStore implements RegressionAlertStore {
    private alerts;
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
declare function createInMemoryGoldenTestStore(): InMemoryGoldenTestStore;
declare function createInMemoryTestResultStore(): InMemoryTestResultStore;
declare function createInMemoryTestRunStore(): InMemoryTestRunStore;
declare function createInMemoryCalibrationStore(): InMemoryCalibrationStore;
declare function createInMemoryRegressionAlertStore(): InMemoryRegressionAlertStore;

/**
 * @sam-ai/testing - Golden Test Runner
 * Executes golden tests and compares outputs
 */

type TestExecutor = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
declare class GoldenTestRunner {
    private testStore;
    private resultStore;
    private runStore;
    private validators;
    private logger;
    private parallelism;
    private defaultTimeout;
    private stopOnFailure;
    private executors;
    constructor(config?: GoldenTestRunnerConfig);
    /**
     * Register an executor for a test category
     */
    registerExecutor(category: TestCaseCategory, executor: TestExecutor): void;
    /**
     * Get registered executor
     */
    getExecutor(category: TestCaseCategory): TestExecutor | undefined;
    /**
     * Add a new golden test case
     */
    addTestCase(testCase: Omit<GoldenTestCase, 'id' | 'createdAt' | 'updatedAt'>): Promise<GoldenTestCase>;
    /**
     * Get a test case by ID
     */
    getTestCase(id: string): Promise<GoldenTestCase | null>;
    /**
     * List test cases
     */
    listTestCases(options?: {
        category?: TestCaseCategory;
        tags?: string[];
        priority?: string;
        limit?: number;
        offset?: number;
    }): Promise<GoldenTestCase[]>;
    /**
     * Run a single test case
     */
    runTest(testCase: GoldenTestCase): Promise<TestResult>;
    /**
     * Run multiple tests
     */
    runTests(options?: {
        category?: TestCaseCategory;
        tags?: string[];
        testIds?: string[];
        name?: string;
    }): Promise<TestRun>;
    /**
     * Get test run by ID
     */
    getTestRun(id: string): Promise<TestRun | null>;
    /**
     * Get recent test runs
     */
    getRecentRuns(limit?: number): Promise<TestRun[]>;
    /**
     * Get test history for a test case
     */
    getTestHistory(testCaseId: string, limit?: number): Promise<TestResult[]>;
    private executeWithTimeout;
    private validateOutput;
    private createResult;
}
declare function createGoldenTestRunner(config?: GoldenTestRunnerConfig): GoldenTestRunner;

/**
 * @sam-ai/testing - Validation Rules
 * Built-in validators for golden tests
 */

/**
 * Deep equality check
 */
declare const equalsValidator: ValidationRule;
/**
 * Check if actual contains expected keys
 */
declare const containsKeysValidator: ValidationRule;
/**
 * Check if actual is not null/undefined
 */
declare const notNullValidator: ValidationRule;
/**
 * Check if actual is an array with items
 */
declare const nonEmptyArrayValidator: ValidationRule;
/**
 * Check if string matches a pattern
 */
declare const matchesPatternValidator: ValidationRule;
/**
 * Check if number is within range
 */
declare const inRangeValidator: ValidationRule;
/**
 * Check if array length is within range
 */
declare const arrayLengthValidator: ValidationRule;
/**
 * Check if string length is within range
 */
declare const stringLengthValidator: ValidationRule;
/**
 * Check if object has required type
 */
declare const typeOfValidator: ValidationRule;
/**
 * Check if confidence score is above threshold
 */
declare const confidenceValidator: ValidationRule;
/**
 * Check if output passes quality gates
 */
declare const qualityGateValidator: ValidationRule;
/**
 * Check if response time is acceptable
 */
declare const responseTimeValidator: ValidationRule;
/**
 * Create all built-in validators
 */
declare function createBuiltInValidators(): ValidationRule[];
/**
 * Create a custom validator
 */
declare function createValidator(name: string, validate: (actual: unknown, expected: unknown, context?: Record<string, unknown>) => ValidationResult): ValidationRule;

/**
 * @sam-ai/testing - Golden Testing Framework
 * Comprehensive testing infrastructure for SAM AI Mentor
 */

/**
 * Configuration for the testing system
 */
interface TestingSystemConfig extends GoldenTestRunnerConfig {
    /** Executors for different test categories */
    executors?: Map<TestCaseCategory, TestExecutor>;
}
/**
 * Complete testing system with runner and stores
 */
interface TestingSystem {
    runner: GoldenTestRunner;
    addTestCase: GoldenTestRunner['addTestCase'];
    getTestCase: GoldenTestRunner['getTestCase'];
    listTestCases: GoldenTestRunner['listTestCases'];
    runTest: GoldenTestRunner['runTest'];
    runTests: GoldenTestRunner['runTests'];
    getTestRun: GoldenTestRunner['getTestRun'];
    getRecentRuns: GoldenTestRunner['getRecentRuns'];
    getTestHistory: GoldenTestRunner['getTestHistory'];
    registerExecutor: GoldenTestRunner['registerExecutor'];
}
/**
 * Create a complete testing system
 */
declare function createTestingSystem(config?: TestingSystemConfig): TestingSystem;
/**
 * Builder for creating golden test cases
 */
declare class GoldenTestCaseBuilder {
    private testCase;
    name(name: string): this;
    description(description: string): this;
    category(category: TestCaseCategory): this;
    version(version: string): this;
    input(input: Record<string, unknown>): this;
    expectedOutput(output: Record<string, unknown>): this;
    expectedBehavior(behavior: string): this;
    validationRules(rules: string[]): this;
    addValidationRule(rule: string): this;
    tags(tags: string[]): this;
    addTag(tag: string): this;
    priority(priority: 'low' | 'medium' | 'high' | 'critical'): this;
    timeout(ms: number): this;
    retries(count: number): this;
    metadata(metadata: Record<string, unknown>): this;
    build(): Omit<GoldenTestCase, 'id' | 'createdAt' | 'updatedAt'>;
}
/**
 * Create a new test case builder
 */
declare function testCase(): GoldenTestCaseBuilder;
/**
 * Run a suite of tests and get aggregated results
 */
declare function runTestSuite(runner: GoldenTestRunner, options: {
    name: string;
    category?: TestCaseCategory;
    tags?: string[];
    testIds?: string[];
}): Promise<{
    run: TestRun;
    passRate: number;
    failedTests: string[];
    summary: string;
}>;

export { type CalibrationBucket, CalibrationBucketSchema, type CalibrationManagerConfig, type CalibrationReport, CalibrationReportSchema, type CalibrationSample, CalibrationSampleSchema, type CalibrationStore, type GoldenTestCase, GoldenTestCaseBuilder, GoldenTestCaseSchema, GoldenTestRunner, type GoldenTestRunnerConfig, type GoldenTestStore, InMemoryCalibrationStore, InMemoryGoldenTestStore, InMemoryRegressionAlertStore, InMemoryTestResultStore, InMemoryTestRunStore, type RegressionAlert, RegressionAlertSchema, type RegressionAlertStore, type RegressionDetectorConfig, type TestCaseCategory, TestCaseCategorySchema, type TestCaseStatus, TestCaseStatusSchema, type TestExecutor, type TestResult, TestResultSchema, type TestResultStore, type TestRun, TestRunSchema, type TestRunStore, type TestingLogger, type TestingSystem, type TestingSystemConfig, type ValidationResult, type ValidationRule, type ValidatorFunction, arrayLengthValidator, confidenceValidator, containsKeysValidator, createBuiltInValidators, createGoldenTestRunner, createInMemoryCalibrationStore, createInMemoryGoldenTestStore, createInMemoryRegressionAlertStore, createInMemoryTestResultStore, createInMemoryTestRunStore, createTestingSystem, createValidator, equalsValidator, inRangeValidator, matchesPatternValidator, nonEmptyArrayValidator, notNullValidator, qualityGateValidator, responseTimeValidator, runTestSuite, stringLengthValidator, testCase, typeOfValidator };
