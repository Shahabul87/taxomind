/**
 * Unit Tests for Database Connection Pool
 * Tests the connection pool management functionality from Phase 3
 */

import { ConnectionPool } from '@/lib/database/connection-pool';
import { Async, Performance, Database, MockData } from '@/__tests__/utils/test-utilities';

describe('ConnectionPool', () => {
  let pool: ConnectionPool;
  let mockCreateConnection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    Performance.clearMeasurements();

    // Mock connection factory
    mockCreateConnection = jest.fn(async () => ({
      id: `conn-${Date.now()}-${Math.random()}`,
      query: jest.fn(async () => MockData.generateQueryResult(10)),
      execute: jest.fn(async () => ({ affectedRows: 1 })),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      ping: jest.fn(async () => true),
      end: jest.fn(),
    }));

    pool = new ConnectionPool({
      createConnection: mockCreateConnection,
      maxConnections: 10,
      minConnections: 2,
      acquireTimeout: 1000,
      idleTimeout: 30000,
      maxIdleTime: 60000,
    });
  });

  afterEach(async () => {
    await pool.drain();
    await pool.clear();
  });

  describe('Connection Lifecycle', () => {
    it('should create connections on demand', async () => {
      const connection = await pool.acquire();
      
      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(mockCreateConnection).toHaveBeenCalledTimes(1);
    });

    it('should reuse released connections', async () => {
      const conn1 = await pool.acquire();
      await pool.release(conn1);
      
      const conn2 = await pool.acquire();
      
      expect(conn2.id).toBe(conn1.id);
      expect(mockCreateConnection).toHaveBeenCalledTimes(1);
    });

    it('should maintain minimum connections', async () => {
      await pool.initialize();
      
      const stats = pool.getStats();
      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(mockCreateConnection).toHaveBeenCalledTimes(2);
    });

    it('should not exceed maximum connections', async () => {
      const promises = Array.from({ length: 15 }, () => pool.acquire());
      
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(successful.length).toBeLessThanOrEqual(10);
      expect(failed.length).toBeGreaterThan(0);
    });

    it('should handle connection errors gracefully', async () => {
      mockCreateConnection.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(pool.acquire()).rejects.toThrow('Connection failed');
      
      // Should still work with retry
      const connection = await pool.acquire();
      expect(connection).toBeDefined();
    });
  });

  describe('Connection Pooling Strategies', () => {
    it('should implement FIFO queue for waiting requests', async () => {
      const connections: any[] = [];
      const maxConnections = 3;
      
      const smallPool = new ConnectionPool({
        createConnection: mockCreateConnection,
        maxConnections,
        minConnections: 0,
      });

      // Acquire all connections
      for (let i = 0; i < maxConnections; i++) {
        connections.push(await smallPool.acquire());
      }

      // Queue additional requests
      const waitingPromises = [
        smallPool.acquire(),
        smallPool.acquire(),
        smallPool.acquire(),
      ];

      // Release connections in order
      for (let i = 0; i < maxConnections; i++) {
        await Async.waitForAsync(() => true, 50);
        await smallPool.release(connections[i]);
      }

      // Waiting requests should be fulfilled in FIFO order
      const acquired = await Promise.all(waitingPromises);
      expect(acquired).toHaveLength(3);
    });

    it('should handle acquire timeout', async () => {
      const fastPool = new ConnectionPool({
        createConnection: mockCreateConnection,
        maxConnections: 1,
        acquireTimeout: 100,
      });

      const conn1 = await fastPool.acquire();
      
      // Second acquire should timeout
      await expect(
        fastPool.acquire()
      ).rejects.toThrow(/timeout/i);
      
      await fastPool.release(conn1);
    });

    it('should remove idle connections', async () => {
      const idlePool = new ConnectionPool({
        createConnection: mockCreateConnection,
        maxConnections: 5,
        minConnections: 1,
        maxIdleTime: 100, // 100ms idle timeout
      });

      const conn1 = await idlePool.acquire();
      const conn2 = await idlePool.acquire();
      
      await idlePool.release(conn1);
      await idlePool.release(conn2);
      
      // Wait for idle timeout
      await Async.waitForAsync(() => true, 150);
      
      await idlePool.removeIdleConnections();
      
      const stats = idlePool.getStats();
      expect(stats.idle).toBeLessThanOrEqual(1); // Should keep minimum
    });

    it('should validate connections before reuse', async () => {
      const connection = await pool.acquire();
      connection.ping = jest.fn(async () => false); // Simulate dead connection
      
      await pool.release(connection);
      
      const newConnection = await pool.acquire();
      expect(newConnection.id).not.toBe(connection.id);
      expect(mockCreateConnection).toHaveBeenCalledTimes(2);
    });
  });

  describe('Load Balancing', () => {
    it('should distribute connections evenly', async () => {
      const connectionUsage = new Map<string, number>();
      const numRequests = 100;
      
      for (let i = 0; i < numRequests; i++) {
        const conn = await pool.acquire();
        const count = connectionUsage.get(conn.id) || 0;
        connectionUsage.set(conn.id, count + 1);
        await pool.release(conn);
      }
      
      // Check distribution
      const usageCounts = Array.from(connectionUsage.values());
      const avgUsage = numRequests / connectionUsage.size;
      const variance = usageCounts.reduce(
        (acc, count) => acc + Math.pow(count - avgUsage, 2),
        0
      ) / usageCounts.length;
      
      // Variance should be low for even distribution
      expect(variance).toBeLessThan(avgUsage * 2);
    });

    it('should implement connection affinity for transactions', async () => {
      const conn1 = await pool.acquireForTransaction();
      const conn2 = await pool.acquireForTransaction();
      
      expect(conn1.id).not.toBe(conn2.id);
      
      // Transaction connections should not be reused until committed
      await pool.release(conn1);
      const conn3 = await pool.acquire();
      expect(conn3.id).not.toBe(conn1.id);
      
      // After commit, connection can be reused
      await pool.commitTransaction(conn1);
      const conn4 = await pool.acquire();
      expect([conn1.id, conn2.id]).toContain(conn4.id);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track connection wait times', async () => {
      const metrics: number[] = [];
      pool.onMetrics((data) => {
        if (data.waitTime) metrics.push(data.waitTime);
      });

      for (let i = 0; i < 10; i++) {
        const conn = await pool.acquire();
        await Async.waitForAsync(() => true, Math.random() * 50);
        await pool.release(conn);
      }

      expect(metrics.length).toBeGreaterThan(0);
      expect(Math.max(...metrics)).toBeLessThan(100);
    });

    it('should track connection utilization', async () => {
      const connections = await Promise.all([
        pool.acquire(),
        pool.acquire(),
        pool.acquire(),
      ]);

      const stats = pool.getStats();
      expect(stats.active).toBe(3);
      expect(stats.utilization).toBe(0.3); // 3/10 = 30%

      await Promise.all(connections.map(c => pool.release(c)));

      const newStats = pool.getStats();
      expect(newStats.active).toBe(0);
      expect(newStats.idle).toBe(3);
    });

    it('should detect connection leaks', async () => {
      const leakDetector = jest.fn();
      pool.onConnectionLeak(leakDetector);

      const conn = await pool.acquire();
      
      // Simulate leak by not releasing for extended time
      await Async.waitForAsync(() => true, 2000);
      
      // Force leak detection
      pool.detectLeaks(1000); // 1 second threshold
      
      expect(leakDetector).toHaveBeenCalledWith(
        expect.objectContaining({
          connectionId: conn.id,
          duration: expect.any(Number),
        })
      );

      await pool.release(conn);
    });
  });

  describe('Resilience and Recovery', () => {
    it('should implement exponential backoff on failures', async () => {
      let attempts = 0;
      mockCreateConnection.mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Connection failed');
        }
        return {
          id: `conn-${attempts}`,
          query: jest.fn(),
          release: jest.fn(),
          ping: jest.fn(async () => true),
        };
      });

      const start = performance.now();
      const connection = await pool.acquire();
      const duration = performance.now() - start;

      expect(connection).toBeDefined();
      expect(attempts).toBe(3);
      expect(duration).toBeGreaterThan(100); // Backoff delays
    });

    it('should handle pool recovery after failure', async () => {
      // Simulate pool failure
      mockCreateConnection.mockRejectedValue(new Error('Database down'));
      
      await expect(pool.acquire()).rejects.toThrow('Database down');
      
      // Restore functionality
      mockCreateConnection.mockResolvedValue({
        id: 'recovered-conn',
        query: jest.fn(),
        release: jest.fn(),
        ping: jest.fn(async () => true),
      });

      // Pool should recover
      const connection = await pool.acquire();
      expect(connection).toBeDefined();
      expect(connection.id).toBe('recovered-conn');
    });

    it('should implement circuit breaker', async () => {
      const failureThreshold = 5;
      pool.setCircuitBreakerThreshold(failureThreshold);

      // Simulate consecutive failures
      mockCreateConnection.mockRejectedValue(new Error('DB Error'));
      
      for (let i = 0; i < failureThreshold; i++) {
        await expect(pool.acquire()).rejects.toThrow();
      }

      // Circuit should be open
      const start = performance.now();
      await expect(pool.acquire()).rejects.toThrow(/circuit.*open/i);
      const duration = performance.now() - start;
      
      // Should fail fast when circuit is open
      expect(duration).toBeLessThan(10);
    });

    it('should auto-recover closed connections', async () => {
      const conn = await pool.acquire();
      
      // Simulate connection closing unexpectedly
      conn.ping = jest.fn(async () => false);
      conn.end = jest.fn();
      
      await pool.release(conn);
      
      // Should detect and replace dead connection
      const healthCheck = await pool.healthCheck();
      expect(healthCheck.deadConnections).toBe(0);
      expect(healthCheck.replacedConnections).toBeGreaterThan(0);
    });
  });

  describe('Transaction Support', () => {
    it('should handle transaction lifecycle', async () => {
      const conn = await pool.acquireForTransaction();
      
      expect(conn.beginTransaction).toHaveBeenCalled();
      
      await conn.query('UPDATE users SET name = ?', ['Test']);
      await pool.commitTransaction(conn);
      
      expect(conn.commit).toHaveBeenCalled();
      
      const stats = pool.getStats();
      expect(stats.activeTransactions).toBe(0);
    });

    it('should rollback on transaction error', async () => {
      const conn = await pool.acquireForTransaction();
      
      conn.query.mockRejectedValueOnce(new Error('Query failed'));
      
      await expect(
        conn.query('INVALID SQL')
      ).rejects.toThrow();
      
      await pool.rollbackTransaction(conn);
      
      expect(conn.rollback).toHaveBeenCalled();
    });

    it('should isolate transaction connections', async () => {
      const txConn = await pool.acquireForTransaction();
      const regularConn = await pool.acquire();
      
      expect(txConn.id).not.toBe(regularConn.id);
      
      // Transaction connection should not be available for regular use
      await pool.release(txConn);
      const anotherConn = await pool.acquire();
      expect(anotherConn.id).toBe(regularConn.id);
      
      await pool.release(regularConn);
      await pool.release(anotherConn);
      await pool.commitTransaction(txConn);
    });
  });

  describe('Advanced Features', () => {
    it('should support connection warmup', async () => {
      await pool.warmup();
      
      const stats = pool.getStats();
      expect(stats.total).toBeGreaterThanOrEqual(2); // Min connections
      expect(stats.warmed).toBe(true);
      
      // Connections should be pre-validated
      const conn = await pool.acquire();
      expect(conn.ping).toHaveBeenCalled();
      await pool.release(conn);
    });

    it('should implement connection pooling strategies', async () => {
      pool.setStrategy('round-robin');
      
      const connections = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const conn = await pool.acquire();
        connections.add(conn.id);
        await pool.release(conn);
      }
      
      // Should cycle through available connections
      expect(connections.size).toBeGreaterThan(1);
    });

    it('should support query queueing', async () => {
      const queue = pool.getQueryQueue();
      
      // Fill pool
      const connections = await Promise.all(
        Array.from({ length: 10 }, () => pool.acquire())
      );
      
      // Queue queries
      const queuedPromises = [
        pool.queueQuery('SELECT * FROM users'),
        pool.queueQuery('SELECT * FROM courses'),
        pool.queueQuery('SELECT * FROM orders'),
      ];
      
      expect(queue.size).toBe(3);
      
      // Release connections to process queue
      await Promise.all(connections.map(c => pool.release(c)));
      
      const results = await Promise.all(queuedPromises);
      expect(results).toHaveLength(3);
      expect(queue.size).toBe(0);
    });

    it('should provide connection pool analytics', () => {
      const analytics = pool.getAnalytics();
      
      expect(analytics).toMatchObject({
        totalConnections: expect.any(Number),
        activeConnections: expect.any(Number),
        idleConnections: expect.any(Number),
        waitingRequests: expect.any(Number),
        averageWaitTime: expect.any(Number),
        averageActiveTime: expect.any(Number),
        connectionTurnover: expect.any(Number),
        errorRate: expect.any(Number),
      });
    });
  });

  describe('Benchmarks', () => {
    it('should handle high concurrency', async () => {
      const concurrentRequests = 100;
      const operationsPerRequest = 10;
      
      Performance.startMeasure('concurrency-test');
      
      const tasks = Array.from({ length: concurrentRequests }, async () => {
        for (let i = 0; i < operationsPerRequest; i++) {
          const conn = await pool.acquire();
          await conn.query('SELECT 1');
          await pool.release(conn);
        }
      });
      
      await Promise.all(tasks);
      
      const duration = Performance.endMeasure('concurrency-test');
      const totalOperations = concurrentRequests * operationsPerRequest;
      const opsPerSecond = (totalOperations / duration) * 1000;
      
      expect(opsPerSecond).toBeGreaterThan(100);
      
      const stats = pool.getStats();
      expect(stats.errors).toBe(0);
    });

    it('should minimize connection acquisition overhead', async () => {
      await pool.warmup();
      
      const iterations = 1000;
      const timings: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const conn = await pool.acquire();
        timings.push(performance.now() - start);
        await pool.release(conn);
      }
      
      const avgAcquisitionTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      const p95AcquisitionTime = timings.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];
      
      expect(avgAcquisitionTime).toBeLessThan(1); // Less than 1ms average
      expect(p95AcquisitionTime).toBeLessThan(5); // Less than 5ms for 95th percentile
    });

    it('should demonstrate performance improvement over no pooling', async () => {
      // Simulate no pooling
      const noPoolOperation = async () => {
        const conn = await mockCreateConnection();
        await conn.query('SELECT 1');
        await conn.end();
      };
      
      // Simulate with pooling
      const withPoolOperation = async () => {
        const conn = await pool.acquire();
        await conn.query('SELECT 1');
        await pool.release(conn);
      };
      
      const noPoolResult = await Async.measureAsyncPerformance(
        noPoolOperation,
        100
      );
      
      const withPoolResult = await Async.measureAsyncPerformance(
        withPoolOperation,
        100
      );
      
      // Pooling should be significantly faster
      Performance.assertPerformanceImprovement(
        noPoolResult.average,
        withPoolResult.average,
        0.5 // At least 50% improvement
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid acquire/release cycles', async () => {
      const cycles = 1000;
      
      for (let i = 0; i < cycles; i++) {
        const conn = await pool.acquire();
        // Immediately release
        await pool.release(conn);
      }
      
      const stats = pool.getStats();
      expect(stats.errors).toBe(0);
      expect(stats.total).toBeLessThanOrEqual(10);
    });

    it('should handle connection release after pool drain', async () => {
      const conn = await pool.acquire();
      
      await pool.drain();
      
      // Should not throw
      await expect(pool.release(conn)).resolves.not.toThrow();
    });

    it('should handle double release gracefully', async () => {
      const conn = await pool.acquire();
      
      await pool.release(conn);
      // Second release should not throw but log warning
      await expect(pool.release(conn)).resolves.not.toThrow();
      
      const stats = pool.getStats();
      expect(stats.warnings).toBeGreaterThan(0);
    });

    it('should recover from empty pool state', async () => {
      await pool.clear();
      
      const stats = pool.getStats();
      expect(stats.total).toBe(0);
      
      // Should still be able to acquire
      const conn = await pool.acquire();
      expect(conn).toBeDefined();
      
      await pool.release(conn);
    });
  });
});