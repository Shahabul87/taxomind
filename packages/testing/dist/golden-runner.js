/**
 * @sam-ai/testing - Golden Test Runner
 * Executes golden tests and compares outputs
 */
import { InMemoryGoldenTestStore, InMemoryTestResultStore, InMemoryTestRunStore, } from './stores';
import { createBuiltInValidators } from './validators';
// ============================================================================
// DEFAULT LOGGER
// ============================================================================
const defaultLogger = {
    debug: () => { },
    info: () => { },
    warn: () => { },
    error: () => { },
};
// ============================================================================
// GOLDEN TEST RUNNER
// ============================================================================
export class GoldenTestRunner {
    testStore;
    resultStore;
    runStore;
    validators;
    logger;
    parallelism;
    defaultTimeout;
    stopOnFailure;
    executors = new Map();
    constructor(config = {}) {
        this.testStore = config.testStore ?? new InMemoryGoldenTestStore();
        this.resultStore = config.resultStore ?? new InMemoryTestResultStore();
        this.runStore = config.runStore ?? new InMemoryTestRunStore();
        this.logger = config.logger ?? defaultLogger;
        this.parallelism = config.parallelism ?? 5;
        this.defaultTimeout = config.defaultTimeout ?? 30000;
        this.stopOnFailure = config.stopOnFailure ?? false;
        // Initialize validators
        this.validators = new Map();
        const builtIn = createBuiltInValidators();
        for (const validator of builtIn) {
            this.validators.set(validator.name, validator);
        }
        for (const validator of config.validators ?? []) {
            this.validators.set(validator.name, validator);
        }
    }
    // ============================================================================
    // EXECUTOR REGISTRATION
    // ============================================================================
    /**
     * Register an executor for a test category
     */
    registerExecutor(category, executor) {
        this.executors.set(category, executor);
        this.logger.info('[GoldenTestRunner] Executor registered', { category });
    }
    /**
     * Get registered executor
     */
    getExecutor(category) {
        return this.executors.get(category);
    }
    // ============================================================================
    // TEST MANAGEMENT
    // ============================================================================
    /**
     * Add a new golden test case
     */
    async addTestCase(testCase) {
        const created = await this.testStore.create(testCase);
        this.logger.info('[GoldenTestRunner] Test case added', {
            id: created.id,
            name: created.name,
            category: created.category,
        });
        return created;
    }
    /**
     * Get a test case by ID
     */
    async getTestCase(id) {
        return this.testStore.get(id);
    }
    /**
     * List test cases
     */
    async listTestCases(options) {
        return this.testStore.list(options);
    }
    // ============================================================================
    // TEST EXECUTION
    // ============================================================================
    /**
     * Run a single test case
     */
    async runTest(testCase) {
        const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const startTime = Date.now();
        this.logger.debug('[GoldenTestRunner] Running test', {
            id: testCase.id,
            name: testCase.name,
        });
        try {
            // Get executor for category
            const executor = this.executors.get(testCase.category);
            if (!executor) {
                return this.createResult(testCase, runId, 'error', startTime, undefined, {
                    error: `No executor registered for category: ${testCase.category}`,
                });
            }
            // Execute with timeout
            const timeout = testCase.timeout ?? this.defaultTimeout;
            const actualOutput = await this.executeWithTimeout(() => executor(testCase.input), timeout);
            // Validate output
            const validationResults = this.validateOutput(actualOutput, testCase.expectedOutput, testCase.validationRules);
            const passed = validationResults.every((r) => r.passed);
            const status = passed ? 'passed' : 'failed';
            const result = this.createResult(testCase, runId, status, startTime, actualOutput, {
                validationResults,
            });
            await this.resultStore.save(result);
            this.logger.info('[GoldenTestRunner] Test completed', {
                id: testCase.id,
                status,
                duration: result.duration,
            });
            return result;
        }
        catch (error) {
            const result = this.createResult(testCase, runId, 'error', startTime, undefined, {
                error: error instanceof Error ? error.message : String(error),
            });
            await this.resultStore.save(result);
            this.logger.error('[GoldenTestRunner] Test error', {
                id: testCase.id,
                error: error instanceof Error ? error.message : String(error),
            });
            return result;
        }
    }
    /**
     * Run multiple tests
     */
    async runTests(options) {
        const startTime = Date.now();
        // Get test cases to run
        let testCases;
        if (options?.testIds) {
            testCases = (await Promise.all(options.testIds.map((id) => this.testStore.get(id)))).filter((t) => t !== null);
        }
        else {
            testCases = await this.testStore.list({
                category: options?.category,
                tags: options?.tags,
            });
        }
        // Create test run
        let run = await this.runStore.create({
            name: options?.name,
            startedAt: new Date(),
            totalTests: testCases.length,
            passed: 0,
            failed: 0,
            skipped: 0,
            errors: 0,
            results: [],
        });
        this.logger.info('[GoldenTestRunner] Starting test run', {
            runId: run.id,
            totalTests: testCases.length,
        });
        // Run tests with parallelism
        const results = [];
        let stopped = false;
        for (let i = 0; i < testCases.length; i += this.parallelism) {
            if (stopped)
                break;
            const batch = testCases.slice(i, i + this.parallelism);
            const batchResults = await Promise.all(batch.map(async (testCase) => {
                if (stopped) {
                    return this.createResult(testCase, run.id, 'skipped', Date.now());
                }
                const result = await this.runTest(testCase);
                result.runId = run.id;
                if (this.stopOnFailure && result.status === 'failed') {
                    stopped = true;
                }
                return result;
            }));
            results.push(...batchResults);
        }
        // Calculate stats
        const passed = results.filter((r) => r.status === 'passed').length;
        const failed = results.filter((r) => r.status === 'failed').length;
        const skipped = results.filter((r) => r.status === 'skipped').length;
        const errors = results.filter((r) => r.status === 'error').length;
        // Update run
        run = await this.runStore.update(run.id, {
            completedAt: new Date(),
            passed,
            failed,
            skipped,
            errors,
            duration: Date.now() - startTime,
            results,
        });
        this.logger.info('[GoldenTestRunner] Test run completed', {
            runId: run.id,
            passed,
            failed,
            skipped,
            errors,
            duration: run.duration,
        });
        return run;
    }
    /**
     * Get test run by ID
     */
    async getTestRun(id) {
        return this.runStore.get(id);
    }
    /**
     * Get recent test runs
     */
    async getRecentRuns(limit) {
        return this.runStore.list({ limit });
    }
    /**
     * Get test history for a test case
     */
    async getTestHistory(testCaseId, limit) {
        return this.resultStore.getByTestCase(testCaseId, limit);
    }
    // ============================================================================
    // INTERNAL METHODS
    // ============================================================================
    async executeWithTimeout(fn, timeout) {
        return Promise.race([
            fn(),
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)),
        ]);
    }
    validateOutput(actual, expected, rules) {
        const results = [];
        for (const ruleName of rules) {
            const validator = this.validators.get(ruleName);
            if (!validator) {
                results.push({
                    rule: ruleName,
                    passed: false,
                    message: `Unknown validation rule: ${ruleName}`,
                });
                continue;
            }
            const result = validator.validate(actual, expected);
            results.push({
                rule: ruleName,
                passed: result.passed,
                message: result.message,
            });
        }
        // If no rules specified, do basic equality check
        if (rules.length === 0 && expected) {
            const equalsValidator = this.validators.get('equals');
            if (equalsValidator) {
                const result = equalsValidator.validate(actual, expected);
                results.push({
                    rule: 'equals',
                    passed: result.passed,
                    message: result.message,
                });
            }
        }
        return results;
    }
    createResult(testCase, runId, status, startTime, actualOutput, extra) {
        return {
            testCaseId: testCase.id,
            runId,
            status,
            actualOutput,
            duration: Date.now() - startTime,
            validationResults: extra?.validationResults ?? [],
            error: extra?.error,
            timestamp: new Date(),
        };
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createGoldenTestRunner(config) {
    return new GoldenTestRunner(config);
}
//# sourceMappingURL=golden-runner.js.map