/**
 * Unit Tests for Database Query Performance Monitor
 * Tests the query performance monitoring functionality from Phase 3
 */

import { QueryPerformanceMonitor, queryPerformanceMonitor } from '@/lib/database/query-performance-monitor';
import { Performance, MockData, Async, Database } from '@/__tests__/utils/test-utilities';

describe('QueryPerformanceMonitor', () => {
  let monitor: QueryPerformanceMonitor;
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    Performance.clearMeasurements();
    
    // Create mock Prisma client
    mockPrismaClient = Database.createMockPrismaClient();
    
    // Use singleton instance
    monitor = queryPerformanceMonitor;
  });

  afterEach(() => {
    monitor.clearMetrics();
  });

  describe('Query Tracking', () => {
    it('should track query execution through wrapped Prisma client', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock a query result
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: 'user-123', name: 'Test User' }]);
      
      // Execute query through wrapped client
      await wrappedClient.user.findMany();

      const stats = monitor.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalQueries).toBeGreaterThan(0);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should track multiple query executions', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      const iterations = 10;

      // Mock query result
      mockPrismaClient.course.findMany.mockResolvedValue([{ id: 'course-123', title: 'Test Course' }]);

      for (let i = 0; i < iterations; i++) {
        await wrappedClient.course.findMany({ where: { category: `category-${i}` } });
      }

      const stats = monitor.getStats();
      expect(stats.totalQueries).toBe(iterations);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should identify slow queries', async () => {
      // Set a low threshold for testing
      monitor.setSlowQueryThreshold(50);
      
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock slow query by adding delay
      mockPrismaClient.user.findMany.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate slow query
        return [{ id: 'user-123' }];
      });
      
      await wrappedClient.user.findMany();

      const slowQueries = monitor.getSlowQueries();
      expect(slowQueries.length).toBeGreaterThan(0);
      expect(slowQueries[0].slow).toBe(true);
      expect(slowQueries[0].duration).toBeGreaterThan(50);
    });
  });

  describe('Query Analysis', () => {
    it('should detect frequent query patterns', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock query result
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: 'user-123' }]);

      // Execute multiple findMany queries (potential N+1 pattern)
      for (let i = 0; i < 15; i++) {
        await wrappedClient.user.findMany({ where: { id: `user-${i}` } });
      }

      const insights = monitor.getPerformanceInsights();
      expect(insights.recommendations).toBeDefined();
      expect(insights.mostFrequentQueries).toBeDefined();
      expect(insights.mostFrequentQueries.length).toBeGreaterThan(0);
      
      // Should detect potential N+1 pattern
      const hasN1Warning = insights.recommendations.some(r => 
        r.includes('N+1') || r.includes('batch')
      );
      expect(hasN1Warning).toBe(true);
    });

    it('should track query frequency', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock query result
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

      // Execute same query multiple times
      for (let i = 0; i < 5; i++) {
        await wrappedClient.user.findUnique({ where: { email: 'test@example.com' } });
      }

      const frequency = monitor.getQueryFrequency();
      expect(frequency).toBeDefined();
      expect(Object.keys(frequency).length).toBeGreaterThan(0);
      
      const userFindUniqueCount = frequency['user.findUnique'];
      expect(userFindUniqueCount).toBe(5);
    });

    it('should analyze queries by model', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock query results
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: 'user-123' }]);
      mockPrismaClient.course.findMany.mockResolvedValue([{ id: 'course-123' }]);

      // Execute queries on different models
      await wrappedClient.user.findMany();
      await wrappedClient.user.findMany();
      await wrappedClient.course.findMany();

      const userQueries = monitor.getQueriesByModel('user');
      const courseQueries = monitor.getQueriesByModel('course');
      
      expect(userQueries.length).toBe(2);
      expect(courseQueries.length).toBe(1);
      expect(userQueries[0].model).toBe('user');
      expect(courseQueries[0].model).toBe('course');
    });
  });

  describe('Performance Insights', () => {
    it('should provide performance insights and recommendations', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock slow queries
      mockPrismaClient.user.findMany.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 600)); // Slow query
        return [{ id: 'user-123' }];
      });
      
      // Set low threshold to ensure we get slow queries
      monitor.setSlowQueryThreshold(100);
      
      // Execute multiple slow queries
      for (let i = 0; i < 5; i++) {
        await wrappedClient.user.findMany();
      }

      const insights = monitor.getPerformanceInsights();
      
      expect(insights).toBeDefined();
      expect(insights.recommendations).toBeDefined();
      expect(insights.topSlowQueries).toBeDefined();
      expect(insights.mostFrequentQueries).toBeDefined();
      
      expect(insights.recommendations.length).toBeGreaterThan(0);
      expect(insights.topSlowQueries.length).toBeGreaterThan(0);
    });

    it('should generate detailed performance report', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock query results
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: 'user-123' }]);
      mockPrismaClient.course.create.mockResolvedValue({ id: 'course-123', title: 'Test Course' });
      
      // Execute various queries
      await wrappedClient.user.findMany();
      await wrappedClient.course.create({ data: { title: 'Test Course' } });

      const report = monitor.generateReport();
      
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report).toContain('Database Query Performance Report');
      expect(report).toContain('Total Queries');
      expect(report).toContain('Average Duration');
    });
  });

  describe('Metrics Export', () => {
    it('should export query metrics', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock query result
      mockPrismaClient.course.findMany.mockResolvedValue([{ id: 'course-123' }]);
      
      await wrappedClient.course.findMany();

      const exportedMetrics = monitor.exportMetrics();
      
      expect(exportedMetrics).toBeDefined();
      expect(Array.isArray(exportedMetrics)).toBe(true);
      expect(exportedMetrics.length).toBeGreaterThan(0);
      
      const metric = exportedMetrics[0];
      expect(metric).toHaveProperty('query');
      expect(metric).toHaveProperty('duration');
      expect(metric).toHaveProperty('timestamp');
      expect(metric).toHaveProperty('model');
      expect(metric).toHaveProperty('operation');
    });

    it('should track statistics correctly', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock query result
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: 'user-123' }]);
      
      // Execute multiple queries
      for (let i = 0; i < 5; i++) {
        await wrappedClient.user.findMany();
      }

      const stats = monitor.getStats();
      
      expect(stats.totalQueries).toBe(5);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
      expect(stats.slowQueries).toBeGreaterThanOrEqual(0);
      expect(stats.slowQueryThreshold).toBeDefined();
    });
  });


  describe('Integration with Prisma', () => {
    it('should wrap Prisma client for automatic monitoring', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);

      // Test wrapped operations
      await wrappedClient.user.findMany();
      await wrappedClient.course.findUnique({ where: { id: 'course-123' } });
      await wrappedClient.$transaction([
        wrappedClient.user.create({ data: {} }),
        wrappedClient.course.update({ where: { id: '1' }, data: {} }),
      ]);

      const stats = monitor.getAllStats();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });

    it('should handle Prisma errors gracefully', async () => {
      mockPrismaClient.user.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      await expect(
        wrappedClient.user.findUnique({ where: { id: '1' } })
      ).rejects.toThrow('Database connection failed');

      const stats = monitor.getQueryStats('user.findUnique');
      expect(stats.errors).toBe(1);
    });
  });

  describe('Configuration', () => {
    it('should allow setting slow query threshold', () => {
      const newThreshold = 500;
      monitor.setSlowQueryThreshold(newThreshold);
      
      const stats = monitor.getStats();
      expect(stats.slowQueryThreshold).toBe(newThreshold);
    });

    it('should clear metrics when requested', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock and execute a query
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: 'user-123' }]);
      await wrappedClient.user.findMany();
      
      // Verify metrics exist
      expect(monitor.getStats().totalQueries).toBeGreaterThan(0);
      
      // Clear metrics
      monitor.clearMetrics();
      
      // Verify metrics are cleared
      expect(monitor.getStats().totalQueries).toBe(0);
    });
  });

  describe('Monitoring State', () => {
    it('should maintain metrics within size limits', async () => {
      const wrappedClient = monitor.wrapPrismaClient(mockPrismaClient);
      
      // Mock query result
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: 'user-123' }]);
      
      // Execute many queries to test memory management
      for (let i = 0; i < 50; i++) {
        await wrappedClient.user.findMany();
      }

      const exportedMetrics = monitor.exportMetrics();
      expect(exportedMetrics.length).toBeLessThanOrEqual(1000); // Default max size
    });
  });
});

// Additional integration test
describe('QueryPerformanceMonitor Integration', () => {
  it('should work end-to-end with real Prisma operations', async () => {
    const mockClient = Database.createMockPrismaClient();
    const wrappedClient = queryPerformanceMonitor.wrapPrismaClient(mockClient);
    
    // Clear any previous metrics
    queryPerformanceMonitor.clearMetrics();
    
    // Mock various operations
    mockClient.user.findMany.mockResolvedValue([{ id: 'user-1' }, { id: 'user-2' }]);
    mockClient.user.create.mockResolvedValue({ id: 'new-user', name: 'Test User' });
    mockClient.course.findUnique.mockResolvedValue({ id: 'course-1', title: 'Test Course' });
    
    // Perform operations
    await wrappedClient.user.findMany();
    await wrappedClient.user.create({ data: { name: 'Test User' } });
    await wrappedClient.course.findUnique({ where: { id: 'course-1' } });
    
    // Verify monitoring worked
    const stats = queryPerformanceMonitor.getStats();
    expect(stats.totalQueries).toBe(3);
    
    const frequency = queryPerformanceMonitor.getQueryFrequency();
    expect(frequency['user.findMany']).toBe(1);
    expect(frequency['user.create']).toBe(1);
    expect(frequency['course.findUnique']).toBe(1);
    
    const userQueries = queryPerformanceMonitor.getQueriesByModel('user');
    expect(userQueries.length).toBe(2);
    
    const report = queryPerformanceMonitor.generateReport();
    expect(report).toContain('Total Queries: 3');
  });
});