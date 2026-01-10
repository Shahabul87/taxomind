/**
 * @sam-ai/testing - Golden Testing Framework
 * Comprehensive testing infrastructure for SAM AI Mentor
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Test case types
  TestCaseStatus,
  TestCaseCategory,
  GoldenTestCase,
  TestResult,
  TestRun,
  // Calibration types
  CalibrationSample,
  CalibrationBucket,
  CalibrationReport,
  // Regression types
  RegressionAlert,
  // Store interfaces
  GoldenTestStore,
  TestResultStore,
  TestRunStore,
  CalibrationStore,
  RegressionAlertStore,
  // Validator types
  ValidationRule,
  ValidationResult,
  ValidatorFunction,
  // Logger
  TestingLogger,
  // Config types
  GoldenTestRunnerConfig,
  CalibrationManagerConfig,
  RegressionDetectorConfig,
} from './types';

// Schema exports for runtime validation
export {
  TestCaseStatusSchema,
  TestCaseCategorySchema,
  GoldenTestCaseSchema,
  TestResultSchema,
  TestRunSchema,
  CalibrationSampleSchema,
  CalibrationBucketSchema,
  CalibrationReportSchema,
  RegressionAlertSchema,
} from './types';

// ============================================================================
// STORE EXPORTS
// ============================================================================

export {
  // In-memory implementations
  InMemoryGoldenTestStore,
  InMemoryTestResultStore,
  InMemoryTestRunStore,
  InMemoryCalibrationStore,
  InMemoryRegressionAlertStore,
  // Factory functions
  createInMemoryGoldenTestStore,
  createInMemoryTestResultStore,
  createInMemoryTestRunStore,
  createInMemoryCalibrationStore,
  createInMemoryRegressionAlertStore,
} from './stores';

// ============================================================================
// RUNNER EXPORTS
// ============================================================================

export {
  GoldenTestRunner,
  createGoldenTestRunner,
  type TestExecutor,
} from './golden-runner';

// ============================================================================
// VALIDATOR EXPORTS
// ============================================================================

export {
  // Built-in validators
  equalsValidator,
  containsKeysValidator,
  notNullValidator,
  nonEmptyArrayValidator,
  matchesPatternValidator,
  inRangeValidator,
  arrayLengthValidator,
  stringLengthValidator,
  typeOfValidator,
  confidenceValidator,
  qualityGateValidator,
  responseTimeValidator,
  // Factory functions
  createBuiltInValidators,
  createValidator,
} from './validators';

// ============================================================================
// CONVENIENCE FACTORY
// ============================================================================

import type {
  GoldenTestRunnerConfig,
  TestCaseCategory,
  GoldenTestCase,
  TestRun,
} from './types';
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
export function createTestingSystem(config?: TestingSystemConfig): TestingSystem {
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
  private testCase: Partial<Omit<GoldenTestCase, 'id' | 'createdAt' | 'updatedAt'>> = {
    validationRules: [],
    tags: [],
    priority: 'medium',
    timeout: 30000,
    retries: 0,
  };

  name(name: string): this {
    this.testCase.name = name;
    return this;
  }

  description(description: string): this {
    this.testCase.description = description;
    return this;
  }

  category(category: TestCaseCategory): this {
    this.testCase.category = category;
    return this;
  }

  version(version: string): this {
    this.testCase.version = version;
    return this;
  }

  input(input: Record<string, unknown>): this {
    this.testCase.input = input;
    return this;
  }

  expectedOutput(output: Record<string, unknown>): this {
    this.testCase.expectedOutput = output;
    return this;
  }

  expectedBehavior(behavior: string): this {
    this.testCase.expectedBehavior = behavior;
    return this;
  }

  validationRules(rules: string[]): this {
    this.testCase.validationRules = rules;
    return this;
  }

  addValidationRule(rule: string): this {
    this.testCase.validationRules = [...(this.testCase.validationRules ?? []), rule];
    return this;
  }

  tags(tags: string[]): this {
    this.testCase.tags = tags;
    return this;
  }

  addTag(tag: string): this {
    this.testCase.tags = [...(this.testCase.tags ?? []), tag];
    return this;
  }

  priority(priority: 'low' | 'medium' | 'high' | 'critical'): this {
    this.testCase.priority = priority;
    return this;
  }

  timeout(ms: number): this {
    this.testCase.timeout = ms;
    return this;
  }

  retries(count: number): this {
    this.testCase.retries = count;
    return this;
  }

  metadata(metadata: Record<string, unknown>): this {
    this.testCase.metadata = metadata;
    return this;
  }

  build(): Omit<GoldenTestCase, 'id' | 'createdAt' | 'updatedAt'> {
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

    return this.testCase as Omit<GoldenTestCase, 'id' | 'createdAt' | 'updatedAt'>;
  }
}

/**
 * Create a new test case builder
 */
export function testCase(): GoldenTestCaseBuilder {
  return new GoldenTestCaseBuilder();
}

// ============================================================================
// TEST SUITE HELPERS
// ============================================================================

/**
 * Run a suite of tests and get aggregated results
 */
export async function runTestSuite(
  runner: GoldenTestRunner,
  options: {
    name: string;
    category?: TestCaseCategory;
    tags?: string[];
    testIds?: string[];
  }
): Promise<{
  run: TestRun;
  passRate: number;
  failedTests: string[];
  summary: string;
}> {
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
