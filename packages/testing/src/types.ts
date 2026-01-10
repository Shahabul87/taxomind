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
export type TestCaseStatus = z.infer<typeof TestCaseStatusSchema>;

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
export type TestCaseCategory = z.infer<typeof TestCaseCategorySchema>;

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

export type GoldenTestCase = z.infer<typeof GoldenTestCaseSchema>;

export const TestResultSchema = z.object({
  testCaseId: z.string(),
  runId: z.string(),
  status: TestCaseStatusSchema,
  actualOutput: z.record(z.unknown()).optional(),
  duration: z.number(),
  validationResults: z.array(
    z.object({
      rule: z.string(),
      passed: z.boolean(),
      message: z.string().optional(),
    })
  ).default([]),
  error: z.string().optional(),
  diff: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional(),
});

export type TestResult = z.infer<typeof TestResultSchema>;

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

export type TestRun = z.infer<typeof TestRunSchema>;

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

export type CalibrationSample = z.infer<typeof CalibrationSampleSchema>;

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

export type CalibrationBucket = z.infer<typeof CalibrationBucketSchema>;

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

export type CalibrationReport = z.infer<typeof CalibrationReportSchema>;

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

export type RegressionAlert = z.infer<typeof RegressionAlertSchema>;

// ============================================================================
// STORE INTERFACES
// ============================================================================

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
  count(options?: { category?: TestCaseCategory; tags?: string[] }): Promise<number>;
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
  list(options?: { limit?: number; offset?: number }): Promise<TestRun[]>;
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
  getUnacknowledged(options?: { severity?: string; limit?: number }): Promise<RegressionAlert[]>;
  acknowledge(id: string, acknowledgedBy: string): Promise<RegressionAlert>;
  list(options?: { limit?: number; offset?: number }): Promise<RegressionAlert[]>;
}

// ============================================================================
// VALIDATOR TYPES
// ============================================================================

export interface ValidationRule {
  name: string;
  validate(actual: unknown, expected: unknown, context?: Record<string, unknown>): ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  message?: string;
  details?: Record<string, unknown>;
}

export type ValidatorFunction = (
  actual: unknown,
  expected: unknown,
  context?: Record<string, unknown>
) => ValidationResult;

// ============================================================================
// LOGGER INTERFACE
// ============================================================================

export interface TestingLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

// ============================================================================
// CONFIG TYPES
// ============================================================================

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
