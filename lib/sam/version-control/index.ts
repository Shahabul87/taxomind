/**
 * Version Control Module
 *
 * Priority 9: Prevent Evaluation Drift
 * Exports for version control, regression testing, and drift alerting
 */

// Types
export type {
  // Evaluation Configuration
  EvaluationConfig,
  EvaluationParameters,
  // Prompt Templates
  PromptTemplate,
  PromptType,
  // Golden Test Cases
  GoldenTestCase,
  TestCategory,
  TestInput,
  TestRubric,
  ExpectedResult,
  // Regression Testing
  RegressionTestResult,
  RegressionReport,
  RegressionStatistics,
  // Drift Analysis
  DriftAnalysisResult,
  DriftDimension,
  DriftTrend,
  RootCause,
  DriftRecommendation,
  // Alerts
  DriftAlert,
  AlertType,
  AlertConfiguration,
  AlertChannel,
} from './types';

// Default Configurations
export {
  DEFAULT_EVALUATION_PARAMETERS,
  DEFAULT_DRIFT_THRESHOLDS,
  DEFAULT_ALERT_CONFIGURATION,
} from './types';

// Version Controller
export {
  EvaluationVersionController,
  InMemoryConfigStore,
  InMemoryPromptStore,
  createVersionController,
  createVersionControllerWithLogging,
  getDefaultVersionController,
  resetDefaultVersionController,
  type EvaluationConfigStore,
  type PromptTemplateStore,
  type VersionControllerConfig,
  type VersionControllerLogger,
} from './version-controller';

// Golden Test Repository
export {
  GoldenTestRepository,
  GoldenTestCaseBuilder,
  InMemoryGoldenTestStore,
  createGoldenTestRepository,
  getDefaultGoldenTestRepository,
  resetDefaultGoldenTestRepository,
  createSampleRubric,
  createSampleTestCases,
  DEFAULT_REPOSITORY_CONFIG,
  type GoldenTestStore,
  type GoldenTestRepositoryConfig,
  type GoldenTestRepositoryLogger,
  type GoldenTestStatistics,
  type ImportResult,
} from './golden-test-repository';

// Regression Runner
export {
  RegressionRunner,
  MockEvaluationAdapter,
  createRegressionRunner,
  createMockRegressionRunner,
  DEFAULT_RUNNER_CONFIG,
  type EvaluationAdapter,
  type EvaluationResult,
  type RegressionRunnerConfig,
  type RegressionRunnerLogger,
} from './regression-runner';

// Drift Alerting
export {
  DriftAlerter,
  InMemoryAlertStore,
  LogChannelHandler,
  WebhookChannelHandler,
  createDriftAlerter,
  createDriftAlerterWithWebhook,
  getDefaultDriftAlerter,
  resetDefaultDriftAlerter,
  type DriftAlertStore,
  type AlertChannelHandler,
  type DriftAlerterConfig,
  type DriftAlerterLogger,
} from './drift-alerting';
