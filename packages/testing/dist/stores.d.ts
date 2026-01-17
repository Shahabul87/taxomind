/**
 * @sam-ai/testing - In-Memory Stores
 * Default in-memory implementations for testing infrastructure
 */
import type { GoldenTestStore, GoldenTestCase, TestCaseCategory, TestResultStore, TestResult, TestRunStore, TestRun, CalibrationStore, CalibrationSample, CalibrationReport, RegressionAlertStore, RegressionAlert } from './types';
export declare class InMemoryGoldenTestStore implements GoldenTestStore {
    private tests;
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
    count(options?: {
        category?: TestCaseCategory;
        tags?: string[];
    }): Promise<number>;
}
export declare class InMemoryTestResultStore implements TestResultStore {
    private results;
    private runResults;
    save(result: TestResult): Promise<void>;
    saveBatch(results: TestResult[]): Promise<void>;
    getByTestCase(testCaseId: string, limit?: number): Promise<TestResult[]>;
    getByRun(runId: string): Promise<TestResult[]>;
    getLatest(testCaseId: string): Promise<TestResult | null>;
}
export declare class InMemoryTestRunStore implements TestRunStore {
    private runs;
    create(run: Omit<TestRun, 'id'>): Promise<TestRun>;
    update(id: string, updates: Partial<TestRun>): Promise<TestRun>;
    get(id: string): Promise<TestRun | null>;
    list(options?: {
        limit?: number;
        offset?: number;
    }): Promise<TestRun[]>;
}
export declare class InMemoryCalibrationStore implements CalibrationStore {
    private samples;
    private reports;
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
export declare class InMemoryRegressionAlertStore implements RegressionAlertStore {
    private alerts;
    create(alert: Omit<RegressionAlert, 'id'>): Promise<RegressionAlert>;
    get(id: string): Promise<RegressionAlert | null>;
    getUnacknowledged(options?: {
        severity?: string;
        limit?: number;
    }): Promise<RegressionAlert[]>;
    acknowledge(id: string, acknowledgedBy: string): Promise<RegressionAlert>;
    list(options?: {
        limit?: number;
        offset?: number;
    }): Promise<RegressionAlert[]>;
}
export declare function createInMemoryGoldenTestStore(): InMemoryGoldenTestStore;
export declare function createInMemoryTestResultStore(): InMemoryTestResultStore;
export declare function createInMemoryTestRunStore(): InMemoryTestRunStore;
export declare function createInMemoryCalibrationStore(): InMemoryCalibrationStore;
export declare function createInMemoryRegressionAlertStore(): InMemoryRegressionAlertStore;
//# sourceMappingURL=stores.d.ts.map