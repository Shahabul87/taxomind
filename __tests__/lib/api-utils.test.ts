/**
 * Tests for API utilities
 * Source: lib/api-utils.ts
 */

import { successResponse, errorResponse, ErrorCodes, HttpStatus } from '@/lib/api-utils';

describe('api-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successResponse', () => {
    it('should create a success response with data', async () => {
      const data = { id: 'user-1', name: 'Test User' };
      const response = successResponse(data);

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.pagination).toBeUndefined();
      expect(body.metadata).toBeUndefined();
    });

    it('should include pagination when provided', async () => {
      const data = [{ id: '1' }, { id: '2' }];
      const pagination = { page: 1, limit: 10, total: 50 };
      const response = successResponse(data, pagination);

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.pagination).toEqual(pagination);
    });

    it('should include metadata when provided', async () => {
      const data = { count: 5 };
      const metadata = { requestId: 'req-123', version: '1.0' };
      const response = successResponse(data, undefined, metadata);

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.metadata).toEqual(metadata);
    });

    it('should include both pagination and metadata', async () => {
      const data = ['item1', 'item2'];
      const pagination = { page: 2, limit: 20, total: 100 };
      const metadata = { cached: true };
      const response = successResponse(data, pagination, metadata);

      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.pagination).toEqual(pagination);
      expect(body.metadata).toEqual(metadata);
    });
  });

  describe('errorResponse', () => {
    it('should create an error response with default status 400', async () => {
      const response = errorResponse('VALIDATION_ERROR', 'Invalid input');

      const body = await response.json();

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Invalid input');
      expect(body.metadata?.timestamp).toBeDefined();
      expect(response.status).toBe(400);
    });

    it('should create an error response with custom status', async () => {
      const response = errorResponse('NOT_FOUND', 'Resource not found', 404);

      const body = await response.json();

      expect(body.success).toBe(false);
      expect(body.error.code).toBe('NOT_FOUND');
      expect(body.error.message).toBe('Resource not found');
      expect(response.status).toBe(404);
    });

    it('should include a timestamp in metadata', async () => {
      const before = new Date().toISOString();
      const response = errorResponse('INTERNAL_ERROR', 'Something broke', 500);
      const body = await response.json();

      expect(body.metadata).toBeDefined();
      expect(body.metadata.timestamp).toBeDefined();
      // Timestamp should be a valid ISO string
      expect(new Date(body.metadata.timestamp).toISOString()).toBe(body.metadata.timestamp);
    });
  });

  describe('ErrorCodes', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCodes.CONFLICT).toBe('CONFLICT');
      expect(ErrorCodes.BAD_REQUEST).toBe('BAD_REQUEST');
    });
  });

  describe('HttpStatus', () => {
    it('should have all expected HTTP status codes', () => {
      expect(HttpStatus.OK).toBe(200);
      expect(HttpStatus.CREATED).toBe(201);
      expect(HttpStatus.BAD_REQUEST).toBe(400);
      expect(HttpStatus.UNAUTHORIZED).toBe(401);
      expect(HttpStatus.FORBIDDEN).toBe(403);
      expect(HttpStatus.NOT_FOUND).toBe(404);
      expect(HttpStatus.CONFLICT).toBe(409);
      expect(HttpStatus.INTERNAL_ERROR).toBe(500);
    });
  });
});
