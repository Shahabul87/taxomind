/**
 * Unit Tests for Database Connection Pool
 * Tests the connection pool management functionality from Phase 3
 */

import { ConnectionPool } from '@/lib/database/connection-pool';

// Mock pg and other dependencies
const mockPool = {
  connect: jest.fn(),
  query: jest.fn(),
  end: jest.fn(),
  totalCount: 10,
  idleCount: 5,
  waitingCount: 0,
};

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => mockPool),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('DatabaseConnectionPool', () => {
  let pool: ConnectionPool;

  beforeEach(() => {
    jest.clearAllMocks();
    pool = ConnectionPool.getInstance();
    
    // Reset the pool state
    (pool as any).isInitialized = false;
    (pool as any).pool = null;

    // Setup mock behaviors
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  afterEach(async () => {
    try {
      await pool.shutdown();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('Initialization', () => {
    it('should initialize pool with default configuration', async () => {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';
      
      await pool.initialize();
      
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('should handle initialization with custom config', async () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        user: 'testuser',
        password: 'testpass',
        min: 2,
        max: 10,
      };

      await pool.initialize(config);
      
      expect(mockPool.connect).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      mockPool.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      await expect(pool.initialize()).rejects.toThrow('Connection failed');
      
      const metrics = pool.getMetrics();
      expect(metrics.connectionErrors).toBeGreaterThan(0);
    });
  });

  describe('Query Execution', () => {
    beforeEach(async () => {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';
      await pool.initialize();
    });

    it('should execute queries successfully', async () => {
      const mockRows = [{ id: 1, name: 'test' }];
      mockClient.query.mockResolvedValueOnce({ rows: mockRows, rowCount: 1 });

      const result = await pool.query('SELECT * FROM users WHERE id = $1', [1]);

      expect(result.rows).toEqual(mockRows);
      expect(result.rowCount).toBe(1);
      expect(result.fromPool).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle query errors', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Query failed'));

      await expect(
        pool.query('SELECT * FROM nonexistent')
      ).rejects.toThrow('Query failed');

      expect(mockClient.release).toHaveBeenCalled();
      
      const metrics = pool.getMetrics();
      expect(metrics.failedQueries).toBeGreaterThan(0);
    });

    it('should handle query timeout', async () => {
      const result = await pool.query('SELECT 1', [], 5000);
      
      expect(mockClient.query).toHaveBeenCalledWith('SET statement_timeout = 5000');
      expect(result).toBeDefined();
    });
  });

  describe('Transaction Handling', () => {
    beforeEach(async () => {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';
      await pool.initialize();
    });

    it('should execute transactions successfully', async () => {
      const mockResult = { rows: [{ count: 1 }], rowCount: 1 };
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      const result = await pool.transaction(async (client: any) => {
        await client.query('INSERT INTO users (name) VALUES ($1)', ['test']);
        return mockResult;
      });

      expect(result).toEqual(mockResult);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback failed transactions', async () => {
      mockClient.query.mockImplementation((sql) => {
        if (sql === 'BEGIN' || sql === 'ROLLBACK') {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        return Promise.reject(new Error('Transaction failed'));
      });

      await expect(pool.transaction(async (client: any) => {
        await client.query('INSERT INTO users (name) VALUES ($1)', ['test']);
      })).rejects.toThrow('Transaction failed');

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle transaction timeout', async () => {
      const result = await pool.transaction(async (client: any) => {
        return { success: true };
      }, 10000);

      expect(mockClient.query).toHaveBeenCalledWith('SET statement_timeout = 10000');
      expect(result).toEqual({ success: true });
    });
  });

  describe('Metrics and Monitoring', () => {
    beforeEach(async () => {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';
      await pool.initialize();
    });

    it('should track query metrics', async () => {
      const initialMetrics = pool.getMetrics();
      
      await pool.query('SELECT 1');
      
      const updatedMetrics = pool.getMetrics();
      expect(updatedMetrics.totalQueries).toBe(initialMetrics.totalQueries + 1);
      expect(updatedMetrics.successfulQueries).toBe(initialMetrics.successfulQueries + 1);
    });

    it('should track failed query metrics', async () => {
      mockClient.query.mockRejectedValueOnce(new Error('Query failed'));
      
      try {
        await pool.query('SELECT * FROM nonexistent');
      } catch (error) {
        // Expected to fail
      }
      
      const metrics = pool.getMetrics();
      expect(metrics.failedQueries).toBeGreaterThan(0);
    });

    it('should provide health status', () => {
      const health = pool.getHealthStatus();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('uptime');
      expect(health).toHaveProperty('connections');
    });
  });

  describe('Pool Lifecycle', () => {
    it('should shutdown gracefully', async () => {
      process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/testdb';
      await pool.initialize();
      
      await pool.shutdown();
      
      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle shutdown when not initialized', async () => {
      await expect(pool.shutdown()).resolves.not.toThrow();
    });
  });

  describe('Prisma Integration', () => {
    it('should create Prisma client with pool', () => {
      const prismaClient = pool.createPrismaClientWithPool();
      
      expect(prismaClient).toBeDefined();
    });
  });

  describe('Configuration Parsing', () => {
    it('should parse DATABASE_URL correctly', async () => {
      process.env.DATABASE_URL = 'postgres://testuser:testpass@testhost:5433/testdb?sslmode=require';
      
      await pool.initialize();
      
      // Verify pool was created with correct config
      expect(mockPool.connect).toHaveBeenCalled();
    });

    it('should handle missing DATABASE_URL', async () => {
      delete process.env.DATABASE_URL;
      
      await pool.initialize({
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        user: 'testuser',
        password: 'testpass',
      });
      
      expect(mockPool.connect).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle pool connection errors', async () => {
      mockPool.connect.mockRejectedValueOnce(new Error('Pool connection failed'));
      
      await pool.initialize();
      
      await expect(
        pool.query('SELECT 1')
      ).rejects.toThrow('Pool connection failed');
    });

    it('should handle uninitialized pool queries', async () => {
      await expect(
        pool.query('SELECT 1')
      ).rejects.toThrow('Connection pool not initialized');
    });

    it('should handle uninitialized pool transactions', async () => {
      await expect(
        pool.transaction(async () => {})
      ).rejects.toThrow('Connection pool not initialized');
    });
  });
});