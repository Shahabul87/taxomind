// src/types.ts
import { z } from "zod";
var TestCaseStatusSchema = z.enum([
  "pending",
  "passed",
  "failed",
  "skipped",
  "error"
]);
var TestCaseCategorySchema = z.enum([
  "content_generation",
  "assessment",
  "tutoring",
  "feedback",
  "recommendation",
  "analysis",
  "safety",
  "quality"
]);
var GoldenTestCaseSchema = z.object({
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
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  timeout: z.number().default(3e4),
  retries: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: z.record(z.unknown()).optional()
});
var TestResultSchema = z.object({
  testCaseId: z.string(),
  runId: z.string(),
  status: TestCaseStatusSchema,
  actualOutput: z.record(z.unknown()).optional(),
  duration: z.number(),
  validationResults: z.array(
    z.object({
      rule: z.string(),
      passed: z.boolean(),
      message: z.string().optional()
    })
  ).default([]),
  error: z.string().optional(),
  diff: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional()
});
var TestRunSchema = z.object({
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
  metadata: z.record(z.unknown()).optional()
});
var CalibrationSampleSchema = z.object({
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
  metadata: z.record(z.unknown()).optional()
});
var CalibrationBucketSchema = z.object({
  confidenceRange: z.object({
    min: z.number(),
    max: z.number()
  }),
  sampleCount: z.number(),
  averageConfidence: z.number(),
  averageAccuracy: z.number(),
  calibrationError: z.number()
  // |avgConfidence - avgAccuracy|
});
var CalibrationReportSchema = z.object({
  id: z.string(),
  category: TestCaseCategorySchema.optional(),
  generatedAt: z.date(),
  sampleCount: z.number(),
  buckets: z.array(CalibrationBucketSchema),
  expectedCalibrationError: z.number(),
  maxCalibrationError: z.number(),
  overconfidenceRate: z.number(),
  underconfidenceRate: z.number(),
  recommendations: z.array(z.string())
});
var RegressionAlertSchema = z.object({
  id: z.string(),
  testCaseId: z.string(),
  severity: z.enum(["warning", "error", "critical"]),
  type: z.enum([
    "output_drift",
    "performance_degradation",
    "quality_drop",
    "error_rate_increase",
    "calibration_drift"
  ]),
  description: z.string(),
  previousValue: z.unknown(),
  currentValue: z.unknown(),
  threshold: z.number().optional(),
  detectedAt: z.date(),
  acknowledged: z.boolean().default(false),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional(),
  metadata: z.record(z.unknown()).optional()
});

// src/stores.ts
var InMemoryGoldenTestStore = class {
  tests = /* @__PURE__ */ new Map();
  async create(testCase2) {
    const id = `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = /* @__PURE__ */ new Date();
    const full = {
      id,
      createdAt: now,
      updatedAt: now,
      ...testCase2
    };
    this.tests.set(id, full);
    return full;
  }
  async get(id) {
    return this.tests.get(id) ?? null;
  }
  async update(id, updates) {
    const existing = this.tests.get(id);
    if (!existing) {
      throw new Error(`Test case not found: ${id}`);
    }
    const updated = { ...existing, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.tests.set(id, updated);
    return updated;
  }
  async delete(id) {
    return this.tests.delete(id);
  }
  async list(options) {
    let tests = Array.from(this.tests.values());
    if (options?.category) {
      tests = tests.filter((t) => t.category === options.category);
    }
    if (options?.tags?.length) {
      tests = tests.filter((t) => options.tags.some((tag) => t.tags.includes(tag)));
    }
    if (options?.priority) {
      tests = tests.filter((t) => t.priority === options.priority);
    }
    tests.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? tests.length;
    return tests.slice(offset, offset + limit);
  }
  async count(options) {
    const tests = await this.list(options);
    return tests.length;
  }
};
var InMemoryTestResultStore = class {
  results = /* @__PURE__ */ new Map();
  // testCaseId -> results
  runResults = /* @__PURE__ */ new Map();
  // runId -> results
  async save(result) {
    const testResults = this.results.get(result.testCaseId) ?? [];
    testResults.push(result);
    this.results.set(result.testCaseId, testResults);
    const runResults = this.runResults.get(result.runId) ?? [];
    runResults.push(result);
    this.runResults.set(result.runId, runResults);
  }
  async saveBatch(results) {
    for (const result of results) {
      await this.save(result);
    }
  }
  async getByTestCase(testCaseId, limit) {
    const results = this.results.get(testCaseId) ?? [];
    const sorted = results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }
  async getByRun(runId) {
    return this.runResults.get(runId) ?? [];
  }
  async getLatest(testCaseId) {
    const results = await this.getByTestCase(testCaseId, 1);
    return results[0] ?? null;
  }
};
var InMemoryTestRunStore = class {
  runs = /* @__PURE__ */ new Map();
  async create(run) {
    const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const full = { id, ...run };
    this.runs.set(id, full);
    return full;
  }
  async update(id, updates) {
    const existing = this.runs.get(id);
    if (!existing) {
      throw new Error(`Test run not found: ${id}`);
    }
    const updated = { ...existing, ...updates };
    this.runs.set(id, updated);
    return updated;
  }
  async get(id) {
    return this.runs.get(id) ?? null;
  }
  async list(options) {
    const runs = Array.from(this.runs.values());
    runs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? runs.length;
    return runs.slice(offset, offset + limit);
  }
};
var InMemoryCalibrationStore = class {
  samples = /* @__PURE__ */ new Map();
  reports = /* @__PURE__ */ new Map();
  // category -> latest report
  async saveSample(sample) {
    const id = `cal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const full = {
      id,
      createdAt: /* @__PURE__ */ new Date(),
      ...sample
    };
    this.samples.set(id, full);
    return full;
  }
  async getSamples(options) {
    let samples = Array.from(this.samples.values());
    if (options?.category) {
      samples = samples.filter((s) => s.category === options.category);
    }
    if (options?.humanVerifiedOnly) {
      samples = samples.filter((s) => s.humanVerified);
    }
    samples.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? samples.length;
    return samples.slice(offset, offset + limit);
  }
  async updateSample(id, updates) {
    const existing = this.samples.get(id);
    if (!existing) {
      throw new Error(`Sample not found: ${id}`);
    }
    const updated = { ...existing, ...updates };
    this.samples.set(id, updated);
    return updated;
  }
  async saveReport(report) {
    const key = report.category ?? "all";
    this.reports.set(key, report);
  }
  async getLatestReport(category) {
    const key = category ?? "all";
    return this.reports.get(key) ?? null;
  }
};
var InMemoryRegressionAlertStore = class {
  alerts = /* @__PURE__ */ new Map();
  async create(alert) {
    const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const full = { id, ...alert };
    this.alerts.set(id, full);
    return full;
  }
  async get(id) {
    return this.alerts.get(id) ?? null;
  }
  async getUnacknowledged(options) {
    let alerts = Array.from(this.alerts.values()).filter((a) => !a.acknowledged);
    if (options?.severity) {
      alerts = alerts.filter((a) => a.severity === options.severity);
    }
    alerts.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
    return options?.limit ? alerts.slice(0, options.limit) : alerts;
  }
  async acknowledge(id, acknowledgedBy) {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error(`Alert not found: ${id}`);
    }
    const updated = {
      ...alert,
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: /* @__PURE__ */ new Date()
    };
    this.alerts.set(id, updated);
    return updated;
  }
  async list(options) {
    const alerts = Array.from(this.alerts.values());
    alerts.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? alerts.length;
    return alerts.slice(offset, offset + limit);
  }
};
function createInMemoryGoldenTestStore() {
  return new InMemoryGoldenTestStore();
}
function createInMemoryTestResultStore() {
  return new InMemoryTestResultStore();
}
function createInMemoryTestRunStore() {
  return new InMemoryTestRunStore();
}
function createInMemoryCalibrationStore() {
  return new InMemoryCalibrationStore();
}
function createInMemoryRegressionAlertStore() {
  return new InMemoryRegressionAlertStore();
}

// src/validators.ts
var equalsValidator = {
  name: "equals",
  validate(actual, expected) {
    const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
    return {
      passed: isEqual,
      message: isEqual ? void 0 : "Output does not match expected"
    };
  }
};
var containsKeysValidator = {
  name: "containsKeys",
  validate(actual, expected) {
    if (!actual || typeof actual !== "object" || !expected || typeof expected !== "object") {
      return { passed: false, message: "Both actual and expected must be objects" };
    }
    const expectedKeys = Object.keys(expected);
    const actualKeys = Object.keys(actual);
    const missingKeys = expectedKeys.filter((key) => !actualKeys.includes(key));
    return {
      passed: missingKeys.length === 0,
      message: missingKeys.length > 0 ? `Missing keys: ${missingKeys.join(", ")}` : void 0
    };
  }
};
var notNullValidator = {
  name: "notNull",
  validate(actual) {
    return {
      passed: actual !== null && actual !== void 0,
      message: actual === null || actual === void 0 ? "Output is null or undefined" : void 0
    };
  }
};
var nonEmptyArrayValidator = {
  name: "nonEmptyArray",
  validate(actual) {
    const isArray = Array.isArray(actual);
    const hasItems = isArray && actual.length > 0;
    return {
      passed: hasItems,
      message: !isArray ? "Output is not an array" : !hasItems ? "Array is empty" : void 0
    };
  }
};
var matchesPatternValidator = {
  name: "matchesPattern",
  validate(actual, _expected, context) {
    if (typeof actual !== "string") {
      return { passed: false, message: "Actual is not a string" };
    }
    const pattern = context?.pattern;
    if (!pattern) {
      return { passed: false, message: "No pattern provided in context" };
    }
    const regex = new RegExp(pattern);
    return {
      passed: regex.test(actual),
      message: !regex.test(actual) ? `String does not match pattern: ${pattern}` : void 0
    };
  }
};
var inRangeValidator = {
  name: "inRange",
  validate(actual, _expected, context) {
    if (typeof actual !== "number") {
      return { passed: false, message: "Actual is not a number" };
    }
    const min = context?.min;
    const max = context?.max;
    if (min !== void 0 && actual < min) {
      return { passed: false, message: `Value ${actual} is less than minimum ${min}` };
    }
    if (max !== void 0 && actual > max) {
      return { passed: false, message: `Value ${actual} is greater than maximum ${max}` };
    }
    return { passed: true };
  }
};
var arrayLengthValidator = {
  name: "arrayLength",
  validate(actual, _expected, context) {
    if (!Array.isArray(actual)) {
      return { passed: false, message: "Actual is not an array" };
    }
    const min = context?.min;
    const max = context?.max;
    const exact = context?.exact;
    if (exact !== void 0 && actual.length !== exact) {
      return { passed: false, message: `Array length ${actual.length} does not equal ${exact}` };
    }
    if (min !== void 0 && actual.length < min) {
      return { passed: false, message: `Array length ${actual.length} is less than minimum ${min}` };
    }
    if (max !== void 0 && actual.length > max) {
      return { passed: false, message: `Array length ${actual.length} is greater than maximum ${max}` };
    }
    return { passed: true };
  }
};
var stringLengthValidator = {
  name: "stringLength",
  validate(actual, _expected, context) {
    if (typeof actual !== "string") {
      return { passed: false, message: "Actual is not a string" };
    }
    const min = context?.min;
    const max = context?.max;
    if (min !== void 0 && actual.length < min) {
      return { passed: false, message: `String length ${actual.length} is less than minimum ${min}` };
    }
    if (max !== void 0 && actual.length > max) {
      return { passed: false, message: `String length ${actual.length} is greater than maximum ${max}` };
    }
    return { passed: true };
  }
};
var typeOfValidator = {
  name: "typeOf",
  validate(actual, _expected, context) {
    const expectedType = context?.type;
    if (!expectedType) {
      return { passed: false, message: "No type provided in context" };
    }
    const actualType = typeof actual;
    return {
      passed: actualType === expectedType,
      message: actualType !== expectedType ? `Expected type ${expectedType}, got ${actualType}` : void 0
    };
  }
};
var confidenceValidator = {
  name: "confidence",
  validate(actual, _expected, context) {
    const confidence = actual?.confidence;
    if (typeof confidence !== "number") {
      return { passed: false, message: "No confidence score found in output" };
    }
    const threshold = context?.threshold ?? 0.7;
    return {
      passed: confidence >= threshold,
      message: confidence < threshold ? `Confidence ${confidence} is below threshold ${threshold}` : void 0
    };
  }
};
var qualityGateValidator = {
  name: "qualityGate",
  validate(actual, _expected, context) {
    const output = actual;
    const requiredGates = context?.gates ?? ["completeness", "accuracy", "relevance"];
    const threshold = context?.threshold ?? 0.8;
    const failures = [];
    for (const gate of requiredGates) {
      const score = output?.[gate];
      if (typeof score !== "number") {
        failures.push(`Missing score for gate: ${gate}`);
      } else if (score < threshold) {
        failures.push(`${gate}: ${score} < ${threshold}`);
      }
    }
    return {
      passed: failures.length === 0,
      message: failures.length > 0 ? `Quality gate failures: ${failures.join(", ")}` : void 0
    };
  }
};
var responseTimeValidator = {
  name: "responseTime",
  validate(actual, _expected, context) {
    const duration = actual?.duration;
    if (typeof duration !== "number") {
      return { passed: true };
    }
    const maxMs = context?.maxMs ?? 5e3;
    return {
      passed: duration <= maxMs,
      message: duration > maxMs ? `Response time ${duration}ms exceeds maximum ${maxMs}ms` : void 0
    };
  }
};
function createBuiltInValidators() {
  return [
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
    responseTimeValidator
  ];
}
function createValidator(name, validate) {
  return { name, validate };
}

// src/golden-runner.ts
var defaultLogger = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
var GoldenTestRunner = class {
  testStore;
  resultStore;
  runStore;
  validators;
  logger;
  parallelism;
  defaultTimeout;
  stopOnFailure;
  executors = /* @__PURE__ */ new Map();
  constructor(config = {}) {
    this.testStore = config.testStore ?? new InMemoryGoldenTestStore();
    this.resultStore = config.resultStore ?? new InMemoryTestResultStore();
    this.runStore = config.runStore ?? new InMemoryTestRunStore();
    this.logger = config.logger ?? defaultLogger;
    this.parallelism = config.parallelism ?? 5;
    this.defaultTimeout = config.defaultTimeout ?? 3e4;
    this.stopOnFailure = config.stopOnFailure ?? false;
    this.validators = /* @__PURE__ */ new Map();
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
    this.logger.info("[GoldenTestRunner] Executor registered", { category });
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
  async addTestCase(testCase2) {
    const created = await this.testStore.create(testCase2);
    this.logger.info("[GoldenTestRunner] Test case added", {
      id: created.id,
      name: created.name,
      category: created.category
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
  async runTest(testCase2) {
    const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const startTime = Date.now();
    this.logger.debug("[GoldenTestRunner] Running test", {
      id: testCase2.id,
      name: testCase2.name
    });
    try {
      const executor = this.executors.get(testCase2.category);
      if (!executor) {
        return this.createResult(testCase2, runId, "error", startTime, void 0, {
          error: `No executor registered for category: ${testCase2.category}`
        });
      }
      const timeout = testCase2.timeout ?? this.defaultTimeout;
      const actualOutput = await this.executeWithTimeout(
        () => executor(testCase2.input),
        timeout
      );
      const validationResults = this.validateOutput(
        actualOutput,
        testCase2.expectedOutput,
        testCase2.validationRules
      );
      const passed = validationResults.every((r) => r.passed);
      const status = passed ? "passed" : "failed";
      const result = this.createResult(testCase2, runId, status, startTime, actualOutput, {
        validationResults
      });
      await this.resultStore.save(result);
      this.logger.info("[GoldenTestRunner] Test completed", {
        id: testCase2.id,
        status,
        duration: result.duration
      });
      return result;
    } catch (error) {
      const result = this.createResult(testCase2, runId, "error", startTime, void 0, {
        error: error instanceof Error ? error.message : String(error)
      });
      await this.resultStore.save(result);
      this.logger.error("[GoldenTestRunner] Test error", {
        id: testCase2.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return result;
    }
  }
  /**
   * Run multiple tests
   */
  async runTests(options) {
    const startTime = Date.now();
    let testCases;
    if (options?.testIds) {
      testCases = (await Promise.all(
        options.testIds.map((id) => this.testStore.get(id))
      )).filter((t) => t !== null);
    } else {
      testCases = await this.testStore.list({
        category: options?.category,
        tags: options?.tags
      });
    }
    let run = await this.runStore.create({
      name: options?.name,
      startedAt: /* @__PURE__ */ new Date(),
      totalTests: testCases.length,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: 0,
      results: []
    });
    this.logger.info("[GoldenTestRunner] Starting test run", {
      runId: run.id,
      totalTests: testCases.length
    });
    const results = [];
    let stopped = false;
    for (let i = 0; i < testCases.length; i += this.parallelism) {
      if (stopped) break;
      const batch = testCases.slice(i, i + this.parallelism);
      const batchResults = await Promise.all(
        batch.map(async (testCase2) => {
          if (stopped) {
            return this.createResult(testCase2, run.id, "skipped", Date.now());
          }
          const result = await this.runTest(testCase2);
          result.runId = run.id;
          if (this.stopOnFailure && result.status === "failed") {
            stopped = true;
          }
          return result;
        })
      );
      results.push(...batchResults);
    }
    const passed = results.filter((r) => r.status === "passed").length;
    const failed = results.filter((r) => r.status === "failed").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;
    run = await this.runStore.update(run.id, {
      completedAt: /* @__PURE__ */ new Date(),
      passed,
      failed,
      skipped,
      errors,
      duration: Date.now() - startTime,
      results
    });
    this.logger.info("[GoldenTestRunner] Test run completed", {
      runId: run.id,
      passed,
      failed,
      skipped,
      errors,
      duration: run.duration
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
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      )
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
          message: `Unknown validation rule: ${ruleName}`
        });
        continue;
      }
      const result = validator.validate(actual, expected);
      results.push({
        rule: ruleName,
        passed: result.passed,
        message: result.message
      });
    }
    if (rules.length === 0 && expected) {
      const equalsValidator2 = this.validators.get("equals");
      if (equalsValidator2) {
        const result = equalsValidator2.validate(actual, expected);
        results.push({
          rule: "equals",
          passed: result.passed,
          message: result.message
        });
      }
    }
    return results;
  }
  createResult(testCase2, runId, status, startTime, actualOutput, extra) {
    return {
      testCaseId: testCase2.id,
      runId,
      status,
      actualOutput,
      duration: Date.now() - startTime,
      validationResults: extra?.validationResults ?? [],
      error: extra?.error,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
};
function createGoldenTestRunner(config) {
  return new GoldenTestRunner(config);
}

// src/index.ts
function createTestingSystem(config) {
  const runner = new GoldenTestRunner(config);
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
    registerExecutor: runner.registerExecutor.bind(runner)
  };
}
var GoldenTestCaseBuilder = class {
  testCase = {
    validationRules: [],
    tags: [],
    priority: "medium",
    timeout: 3e4,
    retries: 0
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
    this.testCase.validationRules = [...this.testCase.validationRules ?? [], rule];
    return this;
  }
  tags(tags) {
    this.testCase.tags = tags;
    return this;
  }
  addTag(tag) {
    this.testCase.tags = [...this.testCase.tags ?? [], tag];
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
      throw new Error("Test case name is required");
    }
    if (!this.testCase.category) {
      throw new Error("Test case category is required");
    }
    if (!this.testCase.version) {
      throw new Error("Test case version is required");
    }
    if (!this.testCase.input) {
      throw new Error("Test case input is required");
    }
    return this.testCase;
  }
};
function testCase() {
  return new GoldenTestCaseBuilder();
}
async function runTestSuite(runner, options) {
  const run = await runner.runTests({
    name: options.name,
    category: options.category,
    tags: options.tags,
    testIds: options.testIds
  });
  const passRate = run.totalTests > 0 ? run.passed / run.totalTests * 100 : 0;
  const failedTests = run.results.filter((r) => r.status === "failed" || r.status === "error").map((r) => r.testCaseId);
  const summary = [
    `Test Suite: ${options.name}`,
    `Total: ${run.totalTests}`,
    `Passed: ${run.passed}`,
    `Failed: ${run.failed}`,
    `Errors: ${run.errors}`,
    `Skipped: ${run.skipped}`,
    `Pass Rate: ${passRate.toFixed(1)}%`,
    `Duration: ${run.duration}ms`
  ].join(" | ");
  return { run, passRate, failedTests, summary };
}
export {
  CalibrationBucketSchema,
  CalibrationReportSchema,
  CalibrationSampleSchema,
  GoldenTestCaseBuilder,
  GoldenTestCaseSchema,
  GoldenTestRunner,
  InMemoryCalibrationStore,
  InMemoryGoldenTestStore,
  InMemoryRegressionAlertStore,
  InMemoryTestResultStore,
  InMemoryTestRunStore,
  RegressionAlertSchema,
  TestCaseCategorySchema,
  TestCaseStatusSchema,
  TestResultSchema,
  TestRunSchema,
  arrayLengthValidator,
  confidenceValidator,
  containsKeysValidator,
  createBuiltInValidators,
  createGoldenTestRunner,
  createInMemoryCalibrationStore,
  createInMemoryGoldenTestStore,
  createInMemoryRegressionAlertStore,
  createInMemoryTestResultStore,
  createInMemoryTestRunStore,
  createTestingSystem,
  createValidator,
  equalsValidator,
  inRangeValidator,
  matchesPatternValidator,
  nonEmptyArrayValidator,
  notNullValidator,
  qualityGateValidator,
  responseTimeValidator,
  runTestSuite,
  stringLengthValidator,
  testCase,
  typeOfValidator
};
