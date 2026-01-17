/**
 * @sam-ai/testing - In-Memory Stores
 * Default in-memory implementations for testing infrastructure
 */
// ============================================================================
// IN-MEMORY GOLDEN TEST STORE
// ============================================================================
export class InMemoryGoldenTestStore {
    tests = new Map();
    async create(testCase) {
        const id = `test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const now = new Date();
        const full = {
            id,
            createdAt: now,
            updatedAt: now,
            ...testCase,
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
        const updated = { ...existing, ...updates, updatedAt: new Date() };
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
}
// ============================================================================
// IN-MEMORY TEST RESULT STORE
// ============================================================================
export class InMemoryTestResultStore {
    results = new Map(); // testCaseId -> results
    runResults = new Map(); // runId -> results
    async save(result) {
        // Index by test case
        const testResults = this.results.get(result.testCaseId) ?? [];
        testResults.push(result);
        this.results.set(result.testCaseId, testResults);
        // Index by run
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
}
// ============================================================================
// IN-MEMORY TEST RUN STORE
// ============================================================================
export class InMemoryTestRunStore {
    runs = new Map();
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
}
// ============================================================================
// IN-MEMORY CALIBRATION STORE
// ============================================================================
export class InMemoryCalibrationStore {
    samples = new Map();
    reports = new Map(); // category -> latest report
    async saveSample(sample) {
        const id = `cal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const full = {
            id,
            createdAt: new Date(),
            ...sample,
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
        const key = report.category ?? 'all';
        this.reports.set(key, report);
    }
    async getLatestReport(category) {
        const key = category ?? 'all';
        return this.reports.get(key) ?? null;
    }
}
// ============================================================================
// IN-MEMORY REGRESSION ALERT STORE
// ============================================================================
export class InMemoryRegressionAlertStore {
    alerts = new Map();
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
            acknowledgedAt: new Date(),
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
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
export function createInMemoryGoldenTestStore() {
    return new InMemoryGoldenTestStore();
}
export function createInMemoryTestResultStore() {
    return new InMemoryTestResultStore();
}
export function createInMemoryTestRunStore() {
    return new InMemoryTestRunStore();
}
export function createInMemoryCalibrationStore() {
    return new InMemoryCalibrationStore();
}
export function createInMemoryRegressionAlertStore() {
    return new InMemoryRegressionAlertStore();
}
//# sourceMappingURL=stores.js.map