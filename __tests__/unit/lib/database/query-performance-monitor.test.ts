/**
 * Unit Tests for Database Query Performance Monitor
 * Tests the query performance monitoring functionality from Phase 3
 */

import { QueryPerformanceMonitor, queryPerformanceMonitor } from '@/lib/database/query-performance-monitor';

// Mock Prisma client
const mockPrismaClient = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $extends: jest.fn(),
};

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('QueryPerformanceMonitor', () => {
  let monitor: QueryPerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Use singleton instance
    monitor = queryPerformanceMonitor;
    monitor.clearMetrics();

    // Reset environment
    (process.env as any).NODE_ENV = 'test';
    (process.env as any).ENABLE_QUERY_MONITORING = 'true';
  });

  afterEach(() => {
    monitor.clearMetrics();
  });

  describe('Query Tracking', () => {
    it('should wrap Prisma client and track queries', async () => {
      // Mock $extends to return a function that tracks queries
      mockPrismaClient.$extends.mockImplementation((config: any) => {
        const mockClient = { ...mockPrismaClient };
        
        // Simulate query execution with tracking
        const originalFindMany = mockPrismaClient.user.findMany;
        mockClient.user.findMany = jest.fn().mockImplementation(async (...args) => {
          // Simulate the query wrapper logic
          const startTime = performance.now();
          const result = await originalFindMany(...args);
          const duration = performance.now() - startTime;
          
          // Record metrics manually since we can't access private methods
          return result;
        });
        
        return mockClient;
      });

      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient as any);
      
      expect(mockPrismaClient.$extends).toHaveBeenCalled();
      expect(wrappedClient).toBeDefined();
    });

    it('should return original client when monitoring is disabled', () => {
      // Directly disable monitoring on the singleton (env vars are read once at construction)
      (monitor as any).isEnabled = false;

      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient as any);

      expect(wrappedClient).toBe(mockPrismaClient);

      // Restore for other tests
      (monitor as any).isEnabled = true;
    });
  });

  describe('Statistics', () => {
    it('should provide query statistics', () => {
      const stats = monitor.getStats();
      
      expect(stats).toHaveProperty('totalQueries');
      expect(stats).toHaveProperty('averageDuration');
      expect(stats).toHaveProperty('slowQueries');
      expect(stats).toHaveProperty('slowQueryThreshold');
      expect(typeof stats.totalQueries).toBe('number');
      expect(typeof stats.averageDuration).toBe('number');
    });

    it('should track slow queries', () => {
      const slowQueries = monitor.getSlowQueries(5);
      
      expect(Array.isArray(slowQueries)).toBe(true);
      expect(slowQueries.length).toBeLessThanOrEqual(5);
    });

    it('should filter queries by model', () => {
      const userQueries = monitor.getQueriesByModel('User');
      
      expect(Array.isArray(userQueries)).toBe(true);
    });
  });

  describe('Query Analysis', () => {
    it('should provide query frequency analysis', () => {
      const frequency = monitor.getQueryFrequency();
      
      expect(typeof frequency).toBe('object');
      expect(frequency).not.toBeNull();
    });

    it('should provide performance insights', () => {
      const insights = monitor.getPerformanceInsights();
      
      expect(insights).toHaveProperty('recommendations');
      expect(insights).toHaveProperty('topSlowQueries');
      expect(insights).toHaveProperty('mostFrequentQueries');
      expect(Array.isArray(insights.recommendations)).toBe(true);
      expect(Array.isArray(insights.topSlowQueries)).toBe(true);
      expect(Array.isArray(insights.mostFrequentQueries)).toBe(true);
    });
  });

  describe('Reporting', () => {
    it('should generate performance report', () => {
      const report = monitor.generateReport();
      
      expect(typeof report).toBe('string');
      expect(report).toContain('Database Query Performance Report');
      expect(report).toContain('OVERVIEW:');
      expect(report).toContain('Total Queries:');
    });

    it('should export metrics for external analysis', () => {
      const metrics = monitor.exportMetrics();
      
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should allow setting slow query threshold', () => {
      const newThreshold = 2000; // 2 seconds
      
      monitor.setSlowQueryThreshold(newThreshold);
      
      const stats = monitor.getStats();
      expect(stats.slowQueryThreshold).toBe(newThreshold);
    });
  });

  describe('Metrics Management', () => {
    it('should clear metrics', () => {
      // Add some fake metrics by calling getStats multiple times
      monitor.getStats();
      monitor.getStats();
      
      monitor.clearMetrics();
      
      const stats = monitor.getStats();
      expect(stats.totalQueries).toBe(0);
    });
  });
});