/**
 * @sam-ai/testing - Golden Testing Framework
 * Comprehensive testing infrastructure for SAM AI Mentor
 */
// Schema exports for runtime validation
export { TestCaseStatusSchema, TestCaseCategorySchema, GoldenTestCaseSchema, TestResultSchema, TestRunSchema, CalibrationSampleSchema, CalibrationBucketSchema, CalibrationReportSchema, RegressionAlertSchema, } from './types';
// ============================================================================
// STORE EXPORTS
// ============================================================================
export { 
// In-memory implementations
InMemoryGoldenTestStore, InMemoryTestResultStore, InMemoryTestRunStore, InMemoryCalibrationStore, InMemoryRegressionAlertStore, 
// Factory functions
createInMemoryGoldenTestStore, createInMemoryTestResultStore, createInMemoryTestRunStore, createInMemoryCalibrationStore, createInMemoryRegressionAlertStore, } from './stores';
// ============================================================================
// RUNNER EXPORTS
// ============================================================================
export { GoldenTestRunner, createGoldenTestRunner, } from './golden-runner';
// ============================================================================
// VALIDATOR EXPORTS
// ============================================================================
export { 
// Built-in validators
equalsValidator, containsKeysValidator, notNullValidator, nonEmptyArrayValidator, matchesPatternValidator, inRangeValidator, arrayLengthValidator, stringLengthValidator, typeOfValidator, confidenceValidator, qualityGateValidator, responseTimeValidator, 
// Factory functions
createBuiltInValidators, createValidator, } from './validators';
import { GoldenTestRunner } from './golden-runner';
/**
 * Create a complete testing system
 */
export function createTestingSystem(config) {
    const runner = new GoldenTestRunner(config);
    // Register any provided executors
    if (config?.executors) {
        for (const [category, executor] of config.executors) {
            runner.registerExecutor(category, executor);
        }
    }
    return {
        runner,
        addTestCase: runner.addTestCase.bind(runner),
        getTestCase: runner.getTestCase.bind(runner),
        listTestCases: runner.listTestCases.bind(runner),
        runTest: runner.runTest.bind(runner),
        runTests: runner.runTests.bind(runner),
        getTestRun: runner.getTestRun.bind(runner),
        getRecentRuns: runner.getRecentRuns.bind(runner),
        getTestHistory: runner.getTestHistory.bind(runner),
        registerExecutor: runner.registerExecutor.bind(runner),
    };
}
// ============================================================================
// TEST CASE BUILDERS
// ============================================================================
/**
 * Builder for creating golden test cases
 */
export class GoldenTestCaseBuilder {
    testCase = {
        validationRules: [],
        tags: [],
        priority: 'medium',
        timeout: 30000,
        retries: 0,
    };
    name(name) {
        this.testCase.name = name;
        return this;
    }
    description(description) {
        this.testCase.description = description;
        return this;
    }
    category(category) {
        this.testCase.category = category;
        return this;
    }
    version(version) {
        this.testCase.version = version;
        return this;
    }
    input(input) {
        this.testCase.input = input;
        return this;
    }
    expectedOutput(output) {
        this.testCase.expectedOutput = output;
        return this;
    }
    expectedBehavior(behavior) {
        this.testCase.expectedBehavior = behavior;
        return this;
    }
    validationRules(rules) {
        this.testCase.validationRules = rules;
        return this;
    }
    addValidationRule(rule) {
        this.testCase.validationRules = [...(this.testCase.validationRules ?? []), rule];
        return this;
    }
    tags(tags) {
        this.testCase.tags = tags;
        return this;
    }
    addTag(tag) {
        this.testCase.tags = [...(this.testCase.tags ?? []), tag];
        return this;
    }
    priority(priority) {
        this.testCase.priority = priority;
        return this;
    }
    timeout(ms) {
        this.testCase.timeout = ms;
        return this;
    }
    retries(count) {
        this.testCase.retries = count;
        return this;
    }
    metadata(metadata) {
        this.testCase.metadata = metadata;
        return this;
    }
    build() {
        if (!this.testCase.name) {
            throw new Error('Test case name is required');
        }
        if (!this.testCase.category) {
            throw new Error('Test case category is required');
        }
        if (!this.testCase.version) {
            throw new Error('Test case version is required');
        }
        if (!this.testCase.input) {
            throw new Error('Test case input is required');
        }
        return this.testCase;
    }
}
/**
 * Create a new test case builder
 */
export function testCase() {
    return new GoldenTestCaseBuilder();
}
// ============================================================================
// TEST SUITE HELPERS
// ============================================================================
/**
 * Run a suite of tests and get aggregated results
 */
export async function runTestSuite(runner, options) {
    const run = await runner.runTests({
        name: options.name,
        category: options.category,
        tags: options.tags,
        testIds: options.testIds,
    });
    const passRate = run.totalTests > 0 ? (run.passed / run.totalTests) * 100 : 0;
    const failedTests = run.results
        .filter((r) => r.status === 'failed' || r.status === 'error')
        .map((r) => r.testCaseId);
    const summary = [
        `Test Suite: ${options.name}`,
        `Total: ${run.totalTests}`,
        `Passed: ${run.passed}`,
        `Failed: ${run.failed}`,
        `Errors: ${run.errors}`,
        `Skipped: ${run.skipped}`,
        `Pass Rate: ${passRate.toFixed(1)}%`,
        `Duration: ${run.duration}ms`,
    ].join(' | ');
    return { run, passRate, failedTests, summary };
}
// ============================================================================
// EXPORTS SUMMARY
// ============================================================================
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
//# sourceMappingURL=index.js.map