/**
 * Tests for SAM Transaction Wrapper
 */

// Use factory functions for mocks to avoid hoisting issues
// Jest hoists jest.mock() calls, so we can't reference variables defined below

// Mock both db.ts and db-pooled.ts with factories
jest.mock('@/lib/db-pooled', () => {
  const mockFn = jest.fn();
  return {
    db: {
      $transaction: mockFn,
    },
    getDb: jest.fn(),
    getDbMetrics: jest.fn(),
    checkDatabaseHealth: jest.fn(),
    getBasePrismaClient: jest.fn(),
    __mockTransaction: mockFn, // Export for test access
  };
});

jest.mock('@/lib/db', () => {
  // Re-use the same mock from db-pooled
  return jest.requireMock('@/lib/db-pooled');
});

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import {
  withTransaction,
  withTransactionOrThrow,
  batchTransaction,
  getPrismaErrorDescription,
} from '../utils/transaction-wrapper';

// Get reference to mock after imports
const getMockTransaction = () => {
  // Dynamic require needed for Jest mock access
  const dbPooled = jest.requireMock('@/lib/db-pooled') as { __mockTransaction: jest.Mock };
  return dbPooled.__mockTransaction;
};

describe('Transaction Wrapper', () => {
  let mockTransaction: jest.Mock;

  beforeEach(() => {
    mockTransaction = getMockTransaction();
    jest.clearAllMocks();
  });

  describe('withTransaction', () => {
    it('returns success result on successful transaction', async () => {
      const mockResult = { id: '123', name: 'Test' };
      mockTransaction.mockResolvedValue(mockResult);

      const result = await withTransaction(async () => mockResult);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('returns error result on transaction failure', async () => {
      mockTransaction.mockRejectedValue(new Error('DB error'));

      const result = await withTransaction(async () => {
        throw new Error('Should not reach');
      });

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('DB error');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('passes transaction options to Prisma', async () => {
      mockTransaction.mockResolvedValue('result');

      await withTransaction(async () => 'result', {
        maxWait: 10000,
        timeout: 20000,
        component: 'TestComponent',
        operation: 'testOp',
      });

      expect(mockTransaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxWait: 10000,
          timeout: 20000,
        })
      );
    });

    it('handles Prisma errors with code', async () => {
      const prismaError = new Error('Unique constraint violation');
      (prismaError as unknown as { code: string }).code = 'P2002';
      mockTransaction.mockRejectedValue(prismaError);

      const result = await withTransaction(async () => 'result');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('P2002');
    });
  });

  describe('withTransactionOrThrow', () => {
    it('returns data on successful transaction', async () => {
      const mockResult = { id: '456', name: 'Test' };
      mockTransaction.mockResolvedValue(mockResult);

      const result = await withTransactionOrThrow(async () => mockResult);

      expect(result).toEqual(mockResult);
    });

    it('throws on transaction failure', async () => {
      mockTransaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(withTransactionOrThrow(async () => 'result')).rejects.toThrow(
        'Transaction failed'
      );
    });
  });

  describe('batchTransaction', () => {
    it('executes multiple operations in single transaction', async () => {
      const mockResults = [{ id: '1' }, { id: '2' }, { id: '3' }];
      mockTransaction.mockImplementation(async (fn) => {
        const tx = {}; // Mock transaction client
        return fn(tx);
      });

      const operations = [
        jest.fn().mockResolvedValue(mockResults[0]),
        jest.fn().mockResolvedValue(mockResults[1]),
        jest.fn().mockResolvedValue(mockResults[2]),
      ];

      const result = await batchTransaction(operations);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResults);
      expect(operations[0]).toHaveBeenCalled();
      expect(operations[1]).toHaveBeenCalled();
      expect(operations[2]).toHaveBeenCalled();
    });

    it('rolls back all operations if one fails', async () => {
      const error = new Error('Operation 2 failed');
      mockTransaction.mockRejectedValue(error);

      const operations = [
        jest.fn().mockResolvedValue({ id: '1' }),
        jest.fn().mockRejectedValue(error),
        jest.fn().mockResolvedValue({ id: '3' }),
      ];

      const result = await batchTransaction(operations);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Operation 2 failed');
    });
  });

  describe('getPrismaErrorDescription', () => {
    it('returns description for known error codes', () => {
      expect(getPrismaErrorDescription('P2002')).toBe('Unique constraint violation');
      expect(getPrismaErrorDescription('P2003')).toBe('Foreign key constraint violation');
      expect(getPrismaErrorDescription('P2025')).toBe('Record not found for operation');
      expect(getPrismaErrorDescription('P2024')).toBe('Timed out fetching connection');
    });

    it('returns unknown error for unrecognized codes', () => {
      expect(getPrismaErrorDescription('P9999')).toBe('Unknown error (P9999)');
      expect(getPrismaErrorDescription('INVALID')).toBe('Unknown error (INVALID)');
    });
  });
});
