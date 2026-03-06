/**
 * Tests for lib/db/db-monitoring.ts
 *
 * Covers the DatabasePerformanceMonitor class: construction, query recording,
 * metric updates, alert lifecycle, performance reports, threshold management,
 * and the createEnterpriseMonitor factory.
 *
 * Phase 1.3 - Database Core Tests
 */

// Mock all heavy dependencies before imports
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    totalCount: 5,
    idleCount: 3,
    waitingCount: 0,
    options: { max: 10 },
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    lpush: jest.fn().mockResolvedValue(1),
  })),
}));

jest.mock('@/lib/db/connection-pool', () => ({
  ConnectionPoolManager: jest.fn().mockImplementation(() => ({
    getPoolSummary: jest.fn().mockReturnValue({
      totalPools: 0,
      totalConnections: 0,
      healthyPools: 0,
      degradedPools: 0,
      averageUtilization: 0,
    }),
  })),
}));

jest.mock('@/lib/db/db-replicas', () => ({
  DatabaseReplicaManager: jest.fn().mockImplementation(() => ({
    getDatabaseStatus: jest.fn().mockReturnValue({
      replicas: [],
      healthyReplicas: 0,
    }),
  })),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  DatabasePerformanceMonitor,
  createEnterpriseMonitor,
  type QueryPerformanceData,
  type DatabaseMetrics,
  type PerformanceAlert,
  type PerformanceThresholds,
  type AlertRule,
  type MonitoringConfig,
} from '@/lib/db/db-monitoring';

describe('DatabasePerformanceMonitor', () => {
  let monitor: DatabasePerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    // Use custom config to prevent real interval timers from running
    monitor = new DatabasePerformanceMonitor({
      metricsCollectionInterval: 999999,
      healthCheckInterval: 999999,
      alertCheckInterval: 999999,
    });
  });

  afterEach(() => {
    // Clean up any timers the monitor may have started
    monitor.shutdown();
  });

  // -------------------------------------------------------------------------
  // Construction & default configuration
  // -------------------------------------------------------------------------
  describe('construction', () => {
    it('creates a monitor instance with default config values', () => {
      const defaultMonitor = new DatabasePerformanceMonitor();
      expect(defaultMonitor).toBeInstanceOf(DatabasePerformanceMonitor);
      defaultMonitor.shutdown();
    });

    it('merges partial config with defaults', () => {
      const customMonitor = new DatabasePerformanceMonitor({
        metricsRetentionHours: 72,
        enablePredictiveAlerts: false,
      });

      // Verify the monitor was constructed - we can inspect behavior indirectly
      // by checking that exportData returns expected structure
      const data = customMonitor.exportData();
      expect(data).toHaveProperty('thresholds');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('recentQueries');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('exportedAt');

      customMonitor.shutdown();
    });

    it('initializes with enterprise-grade default thresholds', () => {
      const data = monitor.exportData();
      const thresholds = data.thresholds;

      expect(thresholds.slowQueryThreshold).toBe(1000);
      expect(thresholds.errorRateThreshold).toBe(2);
      expect(thresholds.connectionUtilizationThreshold).toBe(75);
      expect(thresholds.queriesPerSecondThreshold).toBe(2000);
      expect(thresholds.memoryUsageThreshold).toBe(80);
      expect(thresholds.healthScoreThreshold).toBe(85);
      expect(thresholds.uptimeThreshold).toBe(99.9);
      expect(thresholds.availabilityThreshold).toBe(99.95);
      expect(thresholds.responseTimeThreshold).toBe(500);
      expect(thresholds.throughputDropThreshold).toBe(20);
    });
  });

  // -------------------------------------------------------------------------
  // recordQuery
  // -------------------------------------------------------------------------
  describe('recordQuery', () => {
    it('records a successful query and updates metrics', () => {
      const queryData: QueryPerformanceData = {
        query: 'SELECT * FROM users',
        duration: 50,
        timestamp: new Date(),
        success: true,
        poolName: 'test-pool',
      };

      monitor.recordQuery(queryData);

      const report = monitor.getPerformanceReport();
      expect(report.summary.totalQueries).toBe(1);
    });

    it('records a failed query and increments error count', () => {
      const queryData: QueryPerformanceData = {
        query: 'SELECT * FROM missing_table',
        duration: 10,
        timestamp: new Date(),
        success: false,
        errorMessage: 'relation does not exist',
        poolName: 'test-pool',
      };

      monitor.recordQuery(queryData);

      const report = monitor.getPerformanceReport();
      expect(report.summary.totalQueries).toBe(1);
      expect(report.summary.errorRate).toBeGreaterThan(0);
    });

    it('tracks slow queries when duration exceeds threshold', () => {
      const slowQuery: QueryPerformanceData = {
        query: 'SELECT * FROM huge_table',
        duration: 1500, // Above the 1000ms default threshold
        timestamp: new Date(),
        success: true,
        poolName: 'test-pool',
      };

      monitor.recordQuery(slowQuery);

      const report = monitor.getPerformanceReport();
      expect(report.summary.slowQueries).toBeGreaterThanOrEqual(1);
    });

    it('updates peak query time when a slower query arrives', () => {
      monitor.recordQuery({
        query: 'query1',
        duration: 100,
        timestamp: new Date(),
        success: true,
        poolName: 'test-pool',
      });

      monitor.recordQuery({
        query: 'query2',
        duration: 500,
        timestamp: new Date(),
        success: true,
        poolName: 'test-pool',
      });

      const report = monitor.getPerformanceReport();
      expect(report.summary.peakQueryTime).toBeGreaterThanOrEqual(500);
    });

    it('uses default pool name when poolName is not provided', () => {
      monitor.recordQuery({
        query: 'SELECT 1',
        duration: 5,
        timestamp: new Date(),
        success: true,
      });

      const report = monitor.getPerformanceReport();
      expect(report.summary.totalQueries).toBe(1);
      // Metrics should exist under the 'default' pool name
      expect(report.metrics).toHaveProperty('default');
    });

    it('auto-initializes metrics for a new pool name', () => {
      monitor.recordQuery({
        query: 'SELECT 1',
        duration: 5,
        timestamp: new Date(),
        success: true,
        poolName: 'brand-new-pool',
      });

      const report = monitor.getPerformanceReport();
      expect(report.metrics).toHaveProperty('brand-new-pool');
    });
  });

  // -------------------------------------------------------------------------
  // getPerformanceReport
  // -------------------------------------------------------------------------
  describe('getPerformanceReport', () => {
    it('returns a report with all required sections', () => {
      const report = monitor.getPerformanceReport();

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('recentSlowQueries');
      expect(report).toHaveProperty('recentErrors');
      expect(report).toHaveProperty('activeAlerts');
    });

    it('returns zeroed summary when no queries have been recorded', () => {
      const report = monitor.getPerformanceReport();

      expect(report.summary.totalQueries).toBe(0);
      expect(report.summary.averageQueryTime).toBe(0);
      expect(report.summary.slowQueries).toBe(0);
      expect(report.summary.errorRate).toBe(0);
      expect(report.summary.peakQueryTime).toBe(0);
    });

    it('correctly calculates average query time across multiple queries', () => {
      const now = new Date();
      monitor.recordQuery({
        query: 'q1',
        duration: 100,
        timestamp: now,
        success: true,
        poolName: 'calc-pool',
      });
      monitor.recordQuery({
        query: 'q2',
        duration: 300,
        timestamp: now,
        success: true,
        poolName: 'calc-pool',
      });

      const report = monitor.getPerformanceReport();
      // The average of 100 and 300 is 200
      expect(report.metrics['calc-pool'].averageQueryTime).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // getQueryHistory
  // -------------------------------------------------------------------------
  describe('getQueryHistory', () => {
    it('returns an empty array when no queries recorded', () => {
      expect(monitor.getQueryHistory()).toEqual([]);
    });

    it('returns queries sorted by timestamp descending', () => {
      const older = new Date('2026-01-01T00:00:00Z');
      const newer = new Date('2026-01-02T00:00:00Z');

      monitor.recordQuery({
        query: 'old',
        duration: 10,
        timestamp: older,
        success: true,
      });
      monitor.recordQuery({
        query: 'new',
        duration: 20,
        timestamp: newer,
        success: true,
      });

      const history = monitor.getQueryHistory();
      expect(history[0].query).toBe('new');
      expect(history[1].query).toBe('old');
    });

    it('respects the limit parameter', () => {
      for (let i = 0; i < 5; i++) {
        monitor.recordQuery({
          query: `q${i}`,
          duration: 10,
          timestamp: new Date(),
          success: true,
        });
      }

      const limited = monitor.getQueryHistory(2);
      expect(limited).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Alert lifecycle
  // -------------------------------------------------------------------------
  describe('alert management', () => {
    it('creates alerts for slow queries exceeding the threshold', () => {
      monitor.recordQuery({
        query: 'slow query',
        duration: 2000, // Well above 1000ms threshold
        timestamp: new Date(),
        success: true,
        poolName: 'alert-pool',
      });

      const report = monitor.getPerformanceReport();
      expect(report.activeAlerts.length).toBeGreaterThanOrEqual(1);
    });

    it('creates alerts for failed queries', () => {
      monitor.recordQuery({
        query: 'bad query',
        duration: 10,
        timestamp: new Date(),
        success: false,
        errorMessage: 'syntax error',
        poolName: 'error-pool',
      });

      const report = monitor.getPerformanceReport();
      const errorAlerts = report.activeAlerts.filter(
        (a) => a.type === 'high-error-rate'
      );
      expect(errorAlerts.length).toBeGreaterThanOrEqual(1);
    });

    it('resolves an existing alert by ID', () => {
      // Create an alert by recording a slow query
      monitor.recordQuery({
        query: 'slow',
        duration: 5000,
        timestamp: new Date(),
        success: true,
        poolName: 'resolve-pool',
      });

      const report = monitor.getPerformanceReport();
      const alertId = report.activeAlerts[0]?.id;

      if (alertId) {
        const resolved = monitor.resolveAlert(alertId);
        expect(resolved).toBe(true);
      }
    });

    it('returns false when resolving a non-existent alert', () => {
      const result = monitor.resolveAlert('non-existent-alert-id');
      expect(result).toBe(false);
    });

    it('acknowledges an alert by ID', () => {
      monitor.recordQuery({
        query: 'slow',
        duration: 3000,
        timestamp: new Date(),
        success: true,
        poolName: 'ack-pool',
      });

      const report = monitor.getPerformanceReport();
      const alertId = report.activeAlerts[0]?.id;

      if (alertId) {
        const acked = monitor.acknowledgeAlert(alertId);
        expect(acked).toBe(true);
      }
    });

    it('returns false when acknowledging a non-existent alert', () => {
      expect(monitor.acknowledgeAlert('missing-id')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Threshold management
  // -------------------------------------------------------------------------
  describe('updateThresholds', () => {
    it('updates specific thresholds while preserving others', () => {
      monitor.updateThresholds({ slowQueryThreshold: 2000 });

      const data = monitor.exportData();
      expect(data.thresholds.slowQueryThreshold).toBe(2000);
      // Other thresholds remain at defaults
      expect(data.thresholds.errorRateThreshold).toBe(2);
    });

    it('applies multiple threshold changes in one call', () => {
      monitor.updateThresholds({
        slowQueryThreshold: 500,
        errorRateThreshold: 5,
        memoryUsageThreshold: 90,
      });

      const data = monitor.exportData();
      expect(data.thresholds.slowQueryThreshold).toBe(500);
      expect(data.thresholds.errorRateThreshold).toBe(5);
      expect(data.thresholds.memoryUsageThreshold).toBe(90);
    });
  });

  // -------------------------------------------------------------------------
  // start / stop lifecycle
  // -------------------------------------------------------------------------
  describe('start and stop', () => {
    it('can start monitoring without errors', () => {
      expect(() => monitor.start()).not.toThrow();
      monitor.stop();
    });

    it('does not throw when starting an already running monitor', () => {
      monitor.start();
      // Second start should be a no-op
      expect(() => monitor.start()).not.toThrow();
      monitor.stop();
    });

    it('does not throw when stopping an already stopped monitor', () => {
      expect(() => monitor.stop()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // clearHistory & shutdown
  // -------------------------------------------------------------------------
  describe('clearHistory', () => {
    it('removes all query history, metrics, and alerts', () => {
      monitor.recordQuery({
        query: 'SELECT 1',
        duration: 10,
        timestamp: new Date(),
        success: true,
      });

      monitor.clearHistory();

      const report = monitor.getPerformanceReport();
      expect(report.summary.totalQueries).toBe(0);
      expect(Object.keys(report.metrics)).toHaveLength(0);
      expect(report.activeAlerts).toHaveLength(0);
    });
  });

  describe('shutdown', () => {
    it('clears all internal state and stops the monitor', () => {
      monitor.start();
      monitor.recordQuery({
        query: 'SELECT 1',
        duration: 10,
        timestamp: new Date(),
        success: true,
      });

      monitor.shutdown();

      const report = monitor.getPerformanceReport();
      expect(report.summary.totalQueries).toBe(0);
      expect(monitor.getQueryHistory()).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // exportData
  // -------------------------------------------------------------------------
  describe('exportData', () => {
    it('returns structured data with all required fields', () => {
      const data = monitor.exportData();

      expect(data).toHaveProperty('thresholds');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('recentQueries');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('exportedAt');
      expect(data.exportedAt).toBeInstanceOf(Date);
    });

    it('includes recorded queries in the export', () => {
      monitor.recordQuery({
        query: 'SELECT * FROM courses',
        duration: 25,
        timestamp: new Date(),
        success: true,
      });

      const data = monitor.exportData();
      expect(data.recentQueries.length).toBeGreaterThanOrEqual(1);
    });

    it('caps exported queries at 1000 entries', () => {
      // Record more than 1000 queries
      for (let i = 0; i < 1050; i++) {
        monitor.recordQuery({
          query: `q${i}`,
          duration: 1,
          timestamp: new Date(),
          success: true,
        });
      }

      const data = monitor.exportData();
      expect(data.recentQueries.length).toBeLessThanOrEqual(1000);
    });
  });

  // -------------------------------------------------------------------------
  // getPerformanceTrends
  // -------------------------------------------------------------------------
  describe('getPerformanceTrends', () => {
    it('returns 24 data points for each trend category', () => {
      const trends = monitor.getPerformanceTrends(24);

      expect(trends.queryVolume).toHaveLength(24);
      expect(trends.averageLatency).toHaveLength(24);
      expect(trends.errorRate).toHaveLength(24);
    });

    it('each data point has a time field and a numeric value', () => {
      const trends = monitor.getPerformanceTrends(1);

      for (const point of trends.queryVolume) {
        expect(typeof point.time).toBe('string');
        expect(typeof point.count).toBe('number');
      }

      for (const point of trends.averageLatency) {
        expect(typeof point.time).toBe('string');
        expect(typeof point.latency).toBe('number');
      }

      for (const point of trends.errorRate) {
        expect(typeof point.time).toBe('string');
        expect(typeof point.rate).toBe('number');
      }
    });
  });

  // -------------------------------------------------------------------------
  // registerDatabase
  // -------------------------------------------------------------------------
  describe('registerDatabase', () => {
    it('registers a database and initializes its metrics', () => {
      const { PrismaClient } = require('@prisma/client');
      const mockClient = new PrismaClient();

      monitor.registerDatabase('test-db', mockClient);

      const report = monitor.getPerformanceReport();
      expect(report.metrics).toHaveProperty('test-db');
      expect(report.metrics['test-db'].totalQueries).toBe(0);
      expect(report.metrics['test-db'].health.isHealthy).toBe(true);
      expect(report.metrics['test-db'].health.healthScore).toBe(100);
    });

    it('initializes SLA metrics at 100% availability', () => {
      const { PrismaClient } = require('@prisma/client');
      const mockClient = new PrismaClient();

      monitor.registerDatabase('sla-db', mockClient);

      const report = monitor.getPerformanceReport();
      expect(report.metrics['sla-db'].sla.uptime).toBe(100);
      expect(report.metrics['sla-db'].sla.availability).toBe(100);
    });
  });

  // -------------------------------------------------------------------------
  // getEnterpriseDashboard
  // -------------------------------------------------------------------------
  describe('getEnterpriseDashboard', () => {
    it('returns a dashboard structure with all required sections', async () => {
      const dashboard = await monitor.getEnterpriseDashboard();

      expect(dashboard).toHaveProperty('summary');
      expect(dashboard).toHaveProperty('databases');
      expect(dashboard).toHaveProperty('alerts');
      expect(dashboard).toHaveProperty('insights');
      expect(dashboard).toHaveProperty('trends');

      expect(dashboard.summary).toHaveProperty('totalDatabases');
      expect(dashboard.summary).toHaveProperty('healthyDatabases');
      expect(dashboard.summary).toHaveProperty('totalActiveAlerts');
      expect(dashboard.summary).toHaveProperty('averageResponseTime');
      expect(dashboard.summary).toHaveProperty('totalQueries');
      expect(dashboard.summary).toHaveProperty('overallHealthScore');
      expect(dashboard.summary).toHaveProperty('slaCompliance');
    });

    it('returns zero counts when no databases are registered', async () => {
      const dashboard = await monitor.getEnterpriseDashboard();

      expect(dashboard.summary.totalDatabases).toBe(0);
      expect(dashboard.summary.totalQueries).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// createEnterpriseMonitor factory
// ---------------------------------------------------------------------------
describe('createEnterpriseMonitor', () => {
  it('returns a DatabasePerformanceMonitor instance', () => {
    const monitor = createEnterpriseMonitor({
      metricsCollectionInterval: 999999,
      healthCheckInterval: 999999,
      alertCheckInterval: 999999,
    });
    expect(monitor).toBeInstanceOf(DatabasePerformanceMonitor);
    monitor.shutdown();
  });

  it('accepts optional config parameter', () => {
    const monitor = createEnterpriseMonitor({
      metricsRetentionHours: 96,
      enablePredictiveAlerts: false,
      metricsCollectionInterval: 999999,
      healthCheckInterval: 999999,
      alertCheckInterval: 999999,
    });
    expect(monitor).toBeInstanceOf(DatabasePerformanceMonitor);
    monitor.shutdown();
  });

  it('creates a monitor without any arguments', () => {
    const monitor = createEnterpriseMonitor();
    expect(monitor).toBeInstanceOf(DatabasePerformanceMonitor);
    monitor.shutdown();
  });
});

// ---------------------------------------------------------------------------
// Type export verification
// ---------------------------------------------------------------------------
describe('type exports', () => {
  it('exports QueryPerformanceData interface shape', () => {
    const data: QueryPerformanceData = {
      query: 'SELECT 1',
      duration: 5,
      timestamp: new Date(),
      success: true,
    };
    expect(data.query).toBe('SELECT 1');
    expect(data.success).toBe(true);
  });

  it('exports DatabaseMetrics interface shape', () => {
    const metrics: Partial<DatabaseMetrics> = {
      name: 'test',
      totalQueries: 0,
      health: {
        isHealthy: true,
        healthScore: 100,
        lastHealthCheck: new Date(),
        consecutiveFailures: 0,
      },
    };
    expect(metrics.name).toBe('test');
  });

  it('exports PerformanceAlert interface shape', () => {
    const alert: Partial<PerformanceAlert> = {
      id: 'alert-1',
      type: 'slow-query',
      severity: 'warning',
      isResolved: false,
    };
    expect(alert.type).toBe('slow-query');
  });

  it('exports PerformanceThresholds interface shape', () => {
    const thresholds: Partial<PerformanceThresholds> = {
      slowQueryThreshold: 1000,
      errorRateThreshold: 2,
    };
    expect(thresholds.slowQueryThreshold).toBe(1000);
  });

  it('exports AlertRule interface shape', () => {
    const rule: Partial<AlertRule> = {
      id: 'rule-1',
      name: 'Test Rule',
      severity: 'critical',
      enabled: true,
    };
    expect(rule.enabled).toBe(true);
  });

  it('exports MonitoringConfig interface shape', () => {
    const config: Partial<MonitoringConfig> = {
      metricsCollectionInterval: 15000,
      enablePredictiveAlerts: true,
    };
    expect(config.metricsCollectionInterval).toBe(15000);
  });
});
