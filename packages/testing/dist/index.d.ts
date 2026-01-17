/**
 * @sam-ai/testing - Golden Testing Framework
 * Comprehensive testing infrastructure for SAM AI Mentor
 */
export type { TestCaseStatus, TestCaseCategory, GoldenTestCase, TestResult, TestRun, CalibrationSample, CalibrationBucket, CalibrationReport, RegressionAlert, GoldenTestStore, TestResultStore, TestRunStore, CalibrationStore, RegressionAlertStore, ValidationRule, ValidationResult, ValidatorFunction, TestingLogger, GoldenTestRunnerConfig, CalibrationManagerConfig, RegressionDetectorConfig, } from './types';
export { TestCaseStatusSchema, TestCaseCategorySchema, GoldenTestCaseSchema, TestResultSchema, TestRunSchema, CalibrationSampleSchema, CalibrationBucketSchema, CalibrationReportSchema, RegressionAlertSchema, } from './types';
export { InMemoryGoldenTestStore, InMemoryTestResultStore, InMemoryTestRunStore, InMemoryCalibrationStore, InMemoryRegressionAlertStore, createInMemoryGoldenTestStore, createInMemoryTestResultStore, createInMemoryTestRunStore, createInMemoryCalibrationStore, createInMemoryRegressionAlertStore, } from './stores';
export { GoldenTestRunner, createGoldenTestRunner, type TestExecutor, } from './golden-runner';
export { equalsValidator, containsKeysValidator, notNullValidator, nonEmptyArrayValidator, matchesPatternValidator, inRangeValidator, arrayLengthValidator, stringLengthValidator, typeOfValidator, confidenceValidator, qualityGateValidator, responseTimeValidator, createBuiltInValidators, createValidator, } from './validators';
import type { GoldenTestRunnerConfig, TestCaseCategory, GoldenTestCase, TestRun } from './types';
import { GoldenTestRunner, type TestExecutor } from './golden-runner';
/**
 * Configuration for the testing system
 */
export interface TestingSystemConfig extends GoldenTestRunnerConfig {
    /** Executors for different test categories */
    executors?: Map<TestCaseCategory, TestExecutor>;
}
/**
 * Complete testing system with runner and stores
 */
export interface TestingSystem {
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
export declare function createTestingSystem(config?: TestingSystemConfig): TestingSystem;
/**
 * Builder for creating golden test cases
 */
export declare class GoldenTestCaseBuilder {
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
export declare function testCase(): GoldenTestCaseBuilder;
/**
 * Run a suite of tests and get aggregated results
 */
export declare function runTestSuite(runner: GoldenTestRunner, options: {
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
/**
 * @sam-ai/testing provides:
 *
 * ## Test Management
 * - GoldenTestRunner: Main test runner with parallel execution
 * - GoldenTestCaseBuilder: Fluent builder for test cases
 * - testCase(): Factory for creating test case builders
 *
 * ## Stores
 * - InMemoryGoldenTestStore: In-memory test case storage
 * - InMemoryTestResultStore: In-memory result storage
 * - InMemoryTestRunStore: In-memory run storage
 * - InMemoryCalibrationStore: In-memory calibration storage
 * - InMemoryRegressionAlertStore: In-memory alert storage
 *
 * ## Validators
 * - 12 built-in validators for common assertions
 * - createValidator(): Factory for custom validators
 *
 * ## Utilities
 * - createTestingSystem(): Complete system factory
 * - runTestSuite(): Suite runner with aggregated results
 */
//# sourceMappingURL=index.d.ts.map