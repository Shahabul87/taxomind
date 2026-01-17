/**
 * @sam-ai/testing - Golden Test Runner
 * Executes golden tests and compares outputs
 */
import type { GoldenTestRunnerConfig, GoldenTestCase, TestResult, TestRun, TestCaseCategory } from './types';
export type TestExecutor = (input: Record<string, unknown>) => Promise<Record<string, unknown>>;
export declare class GoldenTestRunner {
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
export declare function createGoldenTestRunner(config?: GoldenTestRunnerConfig): GoldenTestRunner;
//# sourceMappingURL=golden-runner.d.ts.map