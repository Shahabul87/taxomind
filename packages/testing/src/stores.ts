/**
 * @sam-ai/testing - In-Memory Stores
 * Default in-memory implementations for testing infrastructure
 */

import type {
  GoldenTestStore,
  GoldenTestCase,
  TestCaseCategory,
  TestResultStore,
  TestResult,
  TestRunStore,
  TestRun,
  CalibrationStore,
  CalibrationSample,
  CalibrationReport,
  RegressionAlertStore,
  RegressionAlert,
} from './types';

// ============================================================================
// IN-MEMORY GOLDEN TEST STORE
// ============================================================================

export class InMemoryGoldenTestStore implements GoldenTestStore {
  private tests = new Map<string, GoldenTestCase>();

  async create(
    testCase: Omit<GoldenTestCase, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GoldenTestCase> {
    const id = `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date();
    const full: GoldenTestCase = {
      id,
      createdAt: now,
      updatedAt: now,
      ...testCase,
    };
    this.tests.set(id, full);
    return full;
  }

  async get(id: string): Promise<GoldenTestCase | null> {
    return this.tests.get(id) ?? null;
  }

  async update(id: string, updates: Partial<GoldenTestCase>): Promise<GoldenTestCase> {
    const existing = this.tests.get(id);
    if (!existing) {
      throw new Error(`Test case not found: ${id}`);
    }
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.tests.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.tests.delete(id);
  }

  async list(options?: {
    category?: TestCaseCategory;
    tags?: string[];
    priority?: string;
    limit?: number;
    offset?: number;
  }): Promise<GoldenTestCase[]> {
    let tests = Array.from(this.tests.values());

    if (options?.category) {
      tests = tests.filter((t) => t.category === options.category);
    }
    if (options?.tags?.length) {
      tests = tests.filter((t) => options.tags!.some((tag) => t.tags.includes(tag)));
    }
    if (options?.priority) {
      tests = tests.filter((t) => t.priority === options.priority);
    }

    tests.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? tests.length;

    return tests.slice(offset, offset + limit);
  }

  async count(options?: { category?: TestCaseCategory; tags?: string[] }): Promise<number> {
    const tests = await this.list(options);
    return tests.length;
  }
}

// ============================================================================
// IN-MEMORY TEST RESULT STORE
// ============================================================================

export class InMemoryTestResultStore implements TestResultStore {
  private results = new Map<string, TestResult[]>(); // testCaseId -> results
  private runResults = new Map<string, TestResult[]>(); // runId -> results

  async save(result: TestResult): Promise<void> {
    // Index by test case
    const testResults = this.results.get(result.testCaseId) ?? [];
    testResults.push(result);
    this.results.set(result.testCaseId, testResults);

    // Index by run
    const runResults = this.runResults.get(result.runId) ?? [];
    runResults.push(result);
    this.runResults.set(result.runId, runResults);
  }

  async saveBatch(results: TestResult[]): Promise<void> {
    for (const result of results) {
      await this.save(result);
    }
  }

  async getByTestCase(testCaseId: string, limit?: number): Promise<TestResult[]> {
    const results = this.results.get(testCaseId) ?? [];
    const sorted = results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  }

  async getByRun(runId: string): Promise<TestResult[]> {
    return this.runResults.get(runId) ?? [];
  }

  async getLatest(testCaseId: string): Promise<TestResult | null> {
    const results = await this.getByTestCase(testCaseId, 1);
    return results[0] ?? null;
  }
}

// ============================================================================
// IN-MEMORY TEST RUN STORE
// ============================================================================

export class InMemoryTestRunStore implements TestRunStore {
  private runs = new Map<string, TestRun>();

  async create(run: Omit<TestRun, 'id'>): Promise<TestRun> {
    const id = `run_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const full: TestRun = { id, ...run };
    this.runs.set(id, full);
    return full;
  }

  async update(id: string, updates: Partial<TestRun>): Promise<TestRun> {
    const existing = this.runs.get(id);
    if (!existing) {
      throw new Error(`Test run not found: ${id}`);
    }
    const updated = { ...existing, ...updates };
    this.runs.set(id, updated);
    return updated;
  }

  async get(id: string): Promise<TestRun | null> {
    return this.runs.get(id) ?? null;
  }

  async list(options?: { limit?: number; offset?: number }): Promise<TestRun[]> {
    const runs = Array.from(this.runs.values());
    runs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? runs.length;

    return runs.slice(offset, offset + limit);
  }
}

// ============================================================================
// IN-MEMORY CALIBRATION STORE
// ============================================================================

export class InMemoryCalibrationStore implements CalibrationStore {
  private samples = new Map<string, CalibrationSample>();
  private reports = new Map<string, CalibrationReport>(); // category -> latest report

  async saveSample(
    sample: Omit<CalibrationSample, 'id' | 'createdAt'>
  ): Promise<CalibrationSample> {
    const id = `cal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const full: CalibrationSample = {
      id,
      createdAt: new Date(),
      ...sample,
    };
    this.samples.set(id, full);
    return full;
  }

  async getSamples(options?: {
    category?: TestCaseCategory;
    humanVerifiedOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<CalibrationSample[]> {
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

  async updateSample(
    id: string,
    updates: Partial<CalibrationSample>
  ): Promise<CalibrationSample> {
    const existing = this.samples.get(id);
    if (!existing) {
      throw new Error(`Sample not found: ${id}`);
    }
    const updated = { ...existing, ...updates };
    this.samples.set(id, updated);
    return updated;
  }

  async saveReport(report: CalibrationReport): Promise<void> {
    const key = report.category ?? 'all';
    this.reports.set(key, report);
  }

  async getLatestReport(category?: TestCaseCategory): Promise<CalibrationReport | null> {
    const key = category ?? 'all';
    return this.reports.get(key) ?? null;
  }
}

// ============================================================================
// IN-MEMORY REGRESSION ALERT STORE
// ============================================================================

export class InMemoryRegressionAlertStore implements RegressionAlertStore {
  private alerts = new Map<string, RegressionAlert>();

  async create(alert: Omit<RegressionAlert, 'id'>): Promise<RegressionAlert> {
    const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const full: RegressionAlert = { id, ...alert };
    this.alerts.set(id, full);
    return full;
  }

  async get(id: string): Promise<RegressionAlert | null> {
    return this.alerts.get(id) ?? null;
  }

  async getUnacknowledged(options?: {
    severity?: string;
    limit?: number;
  }): Promise<RegressionAlert[]> {
    let alerts = Array.from(this.alerts.values()).filter((a) => !a.acknowledged);

    if (options?.severity) {
      alerts = alerts.filter((a) => a.severity === options.severity);
    }

    alerts.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());

    return options?.limit ? alerts.slice(0, options.limit) : alerts;
  }

  async acknowledge(id: string, acknowledgedBy: string): Promise<RegressionAlert> {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error(`Alert not found: ${id}`);
    }
    const updated = {
      ...alert,
      acknowledged: true,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    };
    this.alerts.set(id, updated);
    return updated;
  }

  async list(options?: { limit?: number; offset?: number }): Promise<RegressionAlert[]> {
    const alerts = Array.from(this.alerts.values());
    alerts.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? alerts.length;

    return alerts.slice(offset, offset + limit);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createInMemoryGoldenTestStore(): InMemoryGoldenTestStore {
  return new InMemoryGoldenTestStore();
}

export function createInMemoryTestResultStore(): InMemoryTestResultStore {
  return new InMemoryTestResultStore();
}

export function createInMemoryTestRunStore(): InMemoryTestRunStore {
  return new InMemoryTestRunStore();
}

export function createInMemoryCalibrationStore(): InMemoryCalibrationStore {
  return new InMemoryCalibrationStore();
}

export function createInMemoryRegressionAlertStore(): InMemoryRegressionAlertStore {
  return new InMemoryRegressionAlertStore();
}
