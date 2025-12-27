/**
 * Regression Test Runner
 *
 * Priority 9: Prevent Evaluation Drift
 * Runs regression tests against golden test cases
 */

import type {
  GoldenTestCase,
  TestCategory,
  RegressionTestResult,
  RegressionReport,
  RegressionStatistics,
  EvaluationConfig,
} from './types';
import {
  GoldenTestRepository,
  type GoldenTestRepositoryConfig,
} from './golden-test-repository';

// ============================================================================
// EVALUATOR INTERFACE
// ============================================================================

/**
 * Interface for the evaluation system
 * This allows the regression runner to work with different evaluators
 */
export interface EvaluationAdapter {
  /**
   * Evaluate a student response
   * @returns Score result with percentage, points, and confidence
   */
  evaluate(
    content: string,
    question: string,
    rubricId: string,
    maxPoints: number,
    expectedAnswer?: string
  ): Promise<EvaluationResult>;
}

/**
 * Evaluation result from adapter
 */
export interface EvaluationResult {
  /**
   * Score as percentage (0-100)
   */
  percentage: number;

  /**
   * Absolute score points
   */
  score: number;

  /**
   * Confidence in the evaluation (0-1)
   */
  confidence: number;

  /**
   * Feedback text
   */
  feedback?: string;

  /**
   * Identified strengths
   */
  strengths?: string[];

  /**
   * Suggested improvements
   */
  improvements?: string[];
}

// ============================================================================
// RUNNER CONFIGURATION
// ============================================================================

/**
 * Regression runner configuration
 */
export interface RegressionRunnerConfig {
  /**
   * Evaluation adapter
   */
  evaluator: EvaluationAdapter;

  /**
   * Golden test repository
   */
  repository?: GoldenTestRepository;

  /**
   * Repository configuration (if not providing repository)
   */
  repositoryConfig?: GoldenTestRepositoryConfig;

  /**
   * Logger
   */
  logger?: RegressionRunnerLogger;

  /**
   * Maximum concurrent evaluations
   */
  concurrency?: number;

  /**
   * Timeout per test in milliseconds
   */
  testTimeout?: number;

  /**
   * Drift threshold percentage (0-100)
   */
  driftThreshold?: number;

  /**
   * Regression failure rate threshold percentage (0-100)
   */
  regressionFailureThreshold?: number;
}

/**
 * Logger interface
 */
export interface RegressionRunnerLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/**
 * Default configuration
 */
export const DEFAULT_RUNNER_CONFIG: Required<
  Omit<RegressionRunnerConfig, 'evaluator' | 'repository' | 'repositoryConfig' | 'logger'>
> = {
  concurrency: 5,
  testTimeout: 30000,
  driftThreshold: 10,
  regressionFailureThreshold: 5,
};

// ============================================================================
// REGRESSION RUNNER IMPLEMENTATION
// ============================================================================

/**
 * Regression Test Runner
 * Executes golden test cases and generates regression reports
 */
export class RegressionRunner {
  private readonly evaluator: EvaluationAdapter;
  private readonly repository: GoldenTestRepository;
  private readonly logger?: RegressionRunnerLogger;
  private readonly config: Required<
    Omit<RegressionRunnerConfig, 'evaluator' | 'repository' | 'repositoryConfig' | 'logger'>
  >;
  private idCounter: number = 0;

  constructor(config: RegressionRunnerConfig) {
    this.evaluator = config.evaluator;
    this.repository = config.repository ?? new GoldenTestRepository(config.repositoryConfig);
    this.logger = config.logger;
    this.config = { ...DEFAULT_RUNNER_CONFIG, ...config };
  }

  // ==========================================================================
  // RUNNING TESTS
  // ==========================================================================

  /**
   * Run all active regression tests
   */
  async runAllTests(configId: string): Promise<RegressionReport> {
    const testCases = await this.repository.listActiveTestCases();
    return this.runTests(testCases, configId);
  }

  /**
   * Run tests by category
   */
  async runTestsByCategory(
    category: TestCategory,
    configId: string
  ): Promise<RegressionReport> {
    const testCases = await this.repository.listByCategory(category);
    const activeTestCases = testCases.filter((tc) => tc.active);
    return this.runTests(activeTestCases, configId);
  }

  /**
   * Run critical tests only
   */
  async runCriticalTests(configId: string): Promise<RegressionReport> {
    const testCases = await this.repository.getCriticalTestCases();
    return this.runTests(testCases, configId);
  }

  /**
   * Run tests by priority level or higher
   */
  async runTestsByMinPriority(
    minPriority: 'low' | 'medium' | 'high' | 'critical',
    configId: string
  ): Promise<RegressionReport> {
    const priorityOrder = ['low', 'medium', 'high', 'critical'];
    const minIndex = priorityOrder.indexOf(minPriority);

    const allTestCases = await this.repository.listActiveTestCases();
    const filteredTestCases = allTestCases.filter(
      (tc) => priorityOrder.indexOf(tc.priority) >= minIndex
    );

    return this.runTests(filteredTestCases, configId);
  }

  /**
   * Run specific tests
   */
  async runTests(
    testCases: GoldenTestCase[],
    configId: string,
    configVersion?: string
  ): Promise<RegressionReport> {
    const startTime = Date.now();

    this.logger?.info('Starting regression test run', {
      testCount: testCases.length,
      configId,
      configVersion,
    });

    const results: RegressionTestResult[] = [];

    // Run tests with concurrency control
    const chunks = this.chunkArray(testCases, this.config.concurrency);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((testCase) => this.runSingleTest(testCase, configId))
      );
      results.push(...chunkResults);
    }

    // Generate report
    const report = this.generateReport(
      results,
      configId,
      configVersion ?? '1.0.0',
      Date.now() - startTime
    );

    this.logger?.info('Regression test run complete', {
      totalTests: report.totalTests,
      passed: report.passed,
      failed: report.failed,
      passRate: report.passRate,
      driftScore: report.driftScore,
      executionTimeMs: report.totalExecutionTimeMs,
    });

    return report;
  }

  /**
   * Run a single test
   */
  async runSingleTest(
    testCase: GoldenTestCase,
    configId: string
  ): Promise<RegressionTestResult> {
    const startTime = Date.now();

    try {
      // Execute evaluation with timeout
      const evaluationPromise = this.evaluator.evaluate(
        testCase.input.content,
        testCase.input.question,
        testCase.input.rubric.id,
        testCase.input.maxPoints,
        testCase.input.expectedAnswer
      );

      const result = await Promise.race([
        evaluationPromise,
        this.timeout(this.config.testTimeout),
      ]);

      if (!result) {
        throw new Error('Evaluation timed out');
      }

      // Compare with expected
      return this.evaluateResult(testCase, result, configId, Date.now() - startTime);
    } catch (error) {
      // Return failed result
      return {
        testCase,
        passed: false,
        actualScore: 0,
        actualPercentage: 0,
        scoreDifference: testCase.expected.score,
        percentageDifference: testCase.expected.percentage,
        actualConfidence: 0,
        confidenceMet: false,
        feedbackKeywordsFound: [],
        feedbackKeywordsMissing: testCase.expected.feedbackKeywords ?? [],
        executionTimeMs: Date.now() - startTime,
        failureReasons: [
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        timestamp: new Date(),
        configId,
      };
    }
  }

  // ==========================================================================
  // RESULT EVALUATION
  // ==========================================================================

  /**
   * Evaluate test result against expected
   */
  private evaluateResult(
    testCase: GoldenTestCase,
    result: EvaluationResult,
    configId: string,
    executionTimeMs: number
  ): RegressionTestResult {
    const failureReasons: string[] = [];

    // Score comparison
    const scoreDifference = Math.abs(result.score - testCase.expected.score);
    const percentageDifference = Math.abs(result.percentage - testCase.expected.percentage);

    const scoreWithinTolerance = scoreDifference <= testCase.expected.scoreTolerance;
    const percentageWithinTolerance =
      percentageDifference <= testCase.expected.percentageTolerance;

    if (!scoreWithinTolerance) {
      failureReasons.push(
        `Score difference ${scoreDifference} exceeds tolerance ${testCase.expected.scoreTolerance}`
      );
    }

    if (!percentageWithinTolerance) {
      failureReasons.push(
        `Percentage difference ${percentageDifference} exceeds tolerance ${testCase.expected.percentageTolerance}`
      );
    }

    // Confidence check
    const confidenceMet = result.confidence >= testCase.expected.minConfidence;
    if (!confidenceMet) {
      failureReasons.push(
        `Confidence ${result.confidence} below minimum ${testCase.expected.minConfidence}`
      );
    }

    // Keyword checks
    const feedbackKeywordsFound: string[] = [];
    const feedbackKeywordsMissing: string[] = [];

    if (testCase.expected.feedbackKeywords && result.feedback) {
      for (const keyword of testCase.expected.feedbackKeywords) {
        if (result.feedback.toLowerCase().includes(keyword.toLowerCase())) {
          feedbackKeywordsFound.push(keyword);
        } else {
          feedbackKeywordsMissing.push(keyword);
        }
      }

      if (feedbackKeywordsMissing.length > 0) {
        failureReasons.push(
          `Missing feedback keywords: ${feedbackKeywordsMissing.join(', ')}`
        );
      }
    }

    // Human review check
    if (testCase.expected.shouldTriggerHumanReview !== undefined) {
      const shouldReview = result.confidence < 0.7 || scoreDifference > 15;
      if (shouldReview !== testCase.expected.shouldTriggerHumanReview) {
        failureReasons.push(
          `Human review flag mismatch: expected ${testCase.expected.shouldTriggerHumanReview}, got ${shouldReview}`
        );
      }
    }

    const passed = failureReasons.length === 0;

    return {
      testCase,
      passed,
      actualScore: result.score,
      actualPercentage: result.percentage,
      scoreDifference,
      percentageDifference,
      actualConfidence: result.confidence,
      confidenceMet,
      feedbackKeywordsFound,
      feedbackKeywordsMissing,
      executionTimeMs,
      failureReasons,
      timestamp: new Date(),
      configId,
    };
  }

  // ==========================================================================
  // REPORT GENERATION
  // ==========================================================================

  /**
   * Generate regression report
   */
  private generateReport(
    results: RegressionTestResult[],
    configId: string,
    configVersion: string,
    totalExecutionTimeMs: number
  ): RegressionReport {
    const passed = results.filter((r) => r.passed);
    const failed = results.filter((r) => !r.passed);
    const criticalFailures = failed.filter((r) => r.testCase.priority === 'critical');

    const passRate = results.length > 0 ? (passed.length / results.length) * 100 : 100;

    // Calculate statistics
    const statistics = this.calculateStatistics(results);

    // Calculate drift score
    const driftScore = this.calculateDriftScore(results);
    const driftExceedsThreshold = driftScore > this.config.driftThreshold;

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      results,
      driftScore,
      statistics
    );

    return {
      id: this.generateId(),
      configId,
      configVersion,
      totalTests: results.length,
      passed: passed.length,
      failed: failed.length,
      passRate,
      driftScore,
      driftExceedsThreshold,
      results,
      failedTests: failed,
      criticalFailures,
      statistics,
      recommendations,
      generatedAt: new Date(),
      totalExecutionTimeMs,
    };
  }

  /**
   * Calculate statistics from results
   */
  private calculateStatistics(results: RegressionTestResult[]): RegressionStatistics {
    // Score differences
    const scoreDifferences = results.map((r) => r.scoreDifference);
    const averageScoreDifference =
      scoreDifferences.length > 0
        ? scoreDifferences.reduce((a, b) => a + b, 0) / scoreDifferences.length
        : 0;
    const maxScoreDifference =
      scoreDifferences.length > 0 ? Math.max(...scoreDifferences) : 0;

    // Standard deviation
    const variance =
      scoreDifferences.length > 0
        ? scoreDifferences.reduce(
            (sum, diff) => sum + Math.pow(diff - averageScoreDifference, 2),
            0
          ) / scoreDifferences.length
        : 0;
    const stdDevDifference = Math.sqrt(variance);

    // Execution time
    const executionTimes = results.map((r) => r.executionTimeMs);
    const averageExecutionTimeMs =
      executionTimes.length > 0
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
        : 0;

    // Confidence met rate
    const confidenceMetCount = results.filter((r) => r.confidenceMet).length;
    const confidenceMetRate =
      results.length > 0 ? (confidenceMetCount / results.length) * 100 : 100;

    // By category
    const byCategory = this.groupByCategory(results);

    // By priority
    const byPriority = this.groupByPriority(results);

    return {
      averageScoreDifference,
      maxScoreDifference,
      stdDevDifference,
      averageExecutionTimeMs,
      confidenceMetRate,
      byCategory,
      byPriority,
    };
  }

  /**
   * Group results by category
   */
  private groupByCategory(
    results: RegressionTestResult[]
  ): Record<TestCategory, { total: number; passed: number; failed: number }> {
    const categories: TestCategory[] = [
      'scoring_accuracy',
      'feedback_quality',
      'edge_case',
      'boundary_condition',
      'consistency',
      'bias_detection',
      'performance',
      'regression',
    ];

    const grouped: Record<
      TestCategory,
      { total: number; passed: number; failed: number }
    > = {} as Record<TestCategory, { total: number; passed: number; failed: number }>;

    for (const category of categories) {
      const categoryResults = results.filter(
        (r) => r.testCase.category === category
      );
      grouped[category] = {
        total: categoryResults.length,
        passed: categoryResults.filter((r) => r.passed).length,
        failed: categoryResults.filter((r) => !r.passed).length,
      };
    }

    return grouped;
  }

  /**
   * Group results by priority
   */
  private groupByPriority(
    results: RegressionTestResult[]
  ): Record<string, { total: number; passed: number; failed: number }> {
    const priorities = ['low', 'medium', 'high', 'critical'];
    const grouped: Record<string, { total: number; passed: number; failed: number }> = {};

    for (const priority of priorities) {
      const priorityResults = results.filter(
        (r) => r.testCase.priority === priority
      );
      grouped[priority] = {
        total: priorityResults.length,
        passed: priorityResults.filter((r) => r.passed).length,
        failed: priorityResults.filter((r) => !r.passed).length,
      };
    }

    return grouped;
  }

  /**
   * Calculate overall drift score
   */
  private calculateDriftScore(results: RegressionTestResult[]): number {
    if (results.length === 0) return 0;

    // Weight factors
    const weights = {
      scoreDifference: 0.4,
      confidenceDegradation: 0.3,
      failureRate: 0.3,
    };

    // Average score difference (normalized to 0-100)
    const avgScoreDiff =
      results.reduce((sum, r) => sum + r.percentageDifference, 0) / results.length;
    const normalizedScoreDiff = Math.min(avgScoreDiff, 100);

    // Confidence degradation (0-100)
    const avgConfidenceGap =
      results.reduce((sum, r) => {
        const gap = r.testCase.expected.minConfidence - r.actualConfidence;
        return sum + Math.max(0, gap);
      }, 0) / results.length;
    const normalizedConfidenceGap = avgConfidenceGap * 100;

    // Failure rate (0-100)
    const failureRate = (results.filter((r) => !r.passed).length / results.length) * 100;

    // Weighted drift score
    const driftScore =
      normalizedScoreDiff * weights.scoreDifference +
      normalizedConfidenceGap * weights.confidenceDegradation +
      failureRate * weights.failureRate;

    return Math.round(driftScore * 100) / 100;
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(
    results: RegressionTestResult[],
    driftScore: number,
    statistics: RegressionStatistics
  ): string[] {
    const recommendations: string[] = [];

    // High drift
    if (driftScore > this.config.driftThreshold) {
      recommendations.push(
        `Drift score (${driftScore}) exceeds threshold (${this.config.driftThreshold}). Consider reviewing recent model or prompt changes.`
      );
    }

    // Critical failures
    const criticalFailures = results.filter(
      (r) => !r.passed && r.testCase.priority === 'critical'
    );
    if (criticalFailures.length > 0) {
      recommendations.push(
        `${criticalFailures.length} critical test(s) failed. Immediate investigation recommended.`
      );
    }

    // Category-specific issues
    for (const [category, stats] of Object.entries(statistics.byCategory)) {
      if (stats.total > 0 && stats.failed / stats.total > 0.5) {
        recommendations.push(
          `High failure rate in '${category}' category (${stats.failed}/${stats.total}). Review ${category} evaluation logic.`
        );
      }
    }

    // Confidence issues
    if (statistics.confidenceMetRate < 80) {
      recommendations.push(
        `Low confidence met rate (${statistics.confidenceMetRate.toFixed(1)}%). Consider calibrating confidence thresholds or reviewing model outputs.`
      );
    }

    // Score variability
    if (statistics.stdDevDifference > 10) {
      recommendations.push(
        `High score variability (std dev: ${statistics.stdDevDifference.toFixed(2)}). Evaluation consistency may need improvement.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('All tests within acceptable parameters. No immediate action required.');
    }

    return recommendations;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Create timeout promise
   */
  private timeout(ms: number): Promise<null> {
    return new Promise((resolve) => setTimeout(() => resolve(null), ms));
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `report-${++this.idCounter}-${Date.now().toString(36)}`;
  }

  /**
   * Get the repository
   */
  getRepository(): GoldenTestRepository {
    return this.repository;
  }
}

// ============================================================================
// MOCK EVALUATOR FOR TESTING
// ============================================================================

/**
 * Mock evaluator for testing the regression runner
 */
export class MockEvaluationAdapter implements EvaluationAdapter {
  private readonly scoreVariance: number;
  private readonly baseConfidence: number;

  constructor(options?: { scoreVariance?: number; baseConfidence?: number }) {
    this.scoreVariance = options?.scoreVariance ?? 5;
    this.baseConfidence = options?.baseConfidence ?? 0.85;
  }

  async evaluate(
    content: string,
    _question: string,
    _rubricId: string,
    maxPoints: number,
    _expectedAnswer?: string
  ): Promise<EvaluationResult> {
    // Simple scoring based on content length
    let baseScore: number;

    if (content.length === 0) {
      baseScore = 0;
    } else if (content.length < 50) {
      baseScore = 30 + Math.random() * 20;
    } else if (content.length < 200) {
      baseScore = 50 + Math.random() * 25;
    } else {
      baseScore = 75 + Math.random() * 20;
    }

    // Add variance
    const variance = (Math.random() - 0.5) * this.scoreVariance * 2;
    const percentage = Math.max(0, Math.min(100, baseScore + variance));
    const score = (percentage / 100) * maxPoints;

    return {
      percentage,
      score,
      confidence: this.baseConfidence + (Math.random() - 0.5) * 0.2,
      feedback: content.length === 0
        ? 'No response submitted. Please provide an answer.'
        : 'Your response has been evaluated.',
      strengths: content.length > 100 ? ['Detail provided'] : [],
      improvements: content.length < 100 ? ['Add more detail'] : [],
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create regression runner
 */
export function createRegressionRunner(
  config: RegressionRunnerConfig
): RegressionRunner {
  return new RegressionRunner(config);
}

/**
 * Create regression runner with mock evaluator (for testing)
 */
export function createMockRegressionRunner(
  config?: Omit<RegressionRunnerConfig, 'evaluator'>
): RegressionRunner {
  return new RegressionRunner({
    ...config,
    evaluator: new MockEvaluationAdapter(),
  });
}
