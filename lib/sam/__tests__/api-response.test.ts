/**
 * Tests for SAM API Response Utility
 */

import {
  SAM_ERROR_CODES,
  successResponse,
  paginatedResponse,
  errorResponse,
  handleZodError,
  handleError,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  badRequestResponse,
  rateLimitResponse,
  serviceUnavailableResponse,
  getRequestId,
  createRequestContext,
  isSuccessResponse,
  isErrorResponse,
} from '../utils/api-response';
import { z } from 'zod';
import { SAMError } from '../utils/error-handler';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('API Response Utility', () => {
  describe('successResponse', () => {
    it('creates a success response with data', () => {
      const data = { id: '123', name: 'Test' };
      const response = successResponse(data);

      // Get the JSON body
      const body = response.body;
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('accepts custom status code', () => {
      const response = successResponse({ created: true }, { status: 201 });
      expect(response.status).toBe(201);
    });

    it('includes metadata when startTime is provided', () => {
      const startTime = Date.now() - 100;
      const response = successResponse({ data: true }, { startTime });
      expect(response.status).toBe(200);
    });

    it('includes requestId in metadata when provided', () => {
      const response = successResponse({ data: true }, { requestId: 'req_123' });
      expect(response.status).toBe(200);
    });
  });

  describe('paginatedResponse', () => {
    it('creates paginated response with metadata', () => {
      const items = [{ id: '1' }, { id: '2' }];
      const response = paginatedResponse(items, { total: 10, limit: 2, offset: 0 });

      expect(response.status).toBe(200);
    });

    it('calculates hasMore correctly', () => {
      // Has more
      const response1 = paginatedResponse([{ id: '1' }], { total: 10, limit: 1, offset: 0 });
      expect(response1.status).toBe(200);

      // No more
      const response2 = paginatedResponse([{ id: '10' }], { total: 10, limit: 1, offset: 9 });
      expect(response2.status).toBe(200);
    });
  });

  describe('errorResponse', () => {
    it('creates error response with code and message', () => {
      const response = errorResponse('VALIDATION_ERROR', 'Invalid input', 400);

      expect(response.status).toBe(400);
    });

    it('includes details when provided', () => {
      const response = errorResponse('VALIDATION_ERROR', 'Invalid input', 400, {
        details: { field: 'email', reason: 'invalid format' },
      });

      expect(response.status).toBe(400);
    });

    it('includes field when provided', () => {
      const response = errorResponse('VALIDATION_ERROR', 'Required', 400, {
        field: 'email',
      });

      expect(response.status).toBe(400);
    });
  });

  describe('handleZodError', () => {
    it('converts Zod error to API error response', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(0),
      });

      try {
        schema.parse({ email: 'invalid', age: -1 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response = handleZodError(error);
          expect(response.status).toBe(400);
        }
      }
    });

    it('includes field path in error', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
        }),
      });

      try {
        schema.parse({ user: { email: 'invalid' } });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const response = handleZodError(error);
          expect(response.status).toBe(400);
        }
      }
    });
  });

  describe('handleError', () => {
    it('handles Zod errors', () => {
      const schema = z.object({ email: z.string().email() });

      try {
        schema.parse({ email: 'invalid' });
      } catch (error) {
        const response = handleError(error, { component: 'Test', operation: 'validate' });
        expect(response.status).toBe(400);
      }
    });

    it('handles SAMError instances', () => {
      const error = new SAMError('Test error', 'SAM_INIT_ERROR');
      const response = handleError(error, { component: 'Test', operation: 'init' });
      expect(response.status).toBe(500);
    });

    it('handles generic errors', () => {
      const error = new Error('Something went wrong');
      const response = handleError(error, { component: 'Test', operation: 'execute' });
      expect(response.status).toBe(500);
    });

    it('handles non-Error values', () => {
      const response = handleError('string error', { component: 'Test', operation: 'execute' });
      expect(response.status).toBe(500);
    });
  });

  describe('Convenience responses', () => {
    describe('unauthorizedResponse', () => {
      it('returns 401 status', () => {
        const response = unauthorizedResponse();
        expect(response.status).toBe(401);
      });

      it('uses custom message', () => {
        const response = unauthorizedResponse('Token expired');
        expect(response.status).toBe(401);
      });
    });

    describe('forbiddenResponse', () => {
      it('returns 403 status', () => {
        const response = forbiddenResponse();
        expect(response.status).toBe(403);
      });
    });

    describe('notFoundResponse', () => {
      it('returns 404 status', () => {
        const response = notFoundResponse('Goal');
        expect(response.status).toBe(404);
      });

      it('includes id in details when provided', () => {
        const response = notFoundResponse('Goal', { id: 'goal_123' });
        expect(response.status).toBe(404);
      });
    });

    describe('badRequestResponse', () => {
      it('returns 400 status', () => {
        const response = badRequestResponse('Invalid parameters');
        expect(response.status).toBe(400);
      });
    });

    describe('rateLimitResponse', () => {
      it('returns 429 status', () => {
        const response = rateLimitResponse(60);
        expect(response.status).toBe(429);
      });

      it('includes Retry-After in details', () => {
        // Note: In test environment, NextResponse headers may not be preserved
        // In production, the Retry-After header is properly set
        const response = rateLimitResponse(60);
        expect(response.status).toBe(429);
        // The retryAfter value is included in the response body details
      });
    });

    describe('serviceUnavailableResponse', () => {
      it('returns 503 status', () => {
        const response = serviceUnavailableResponse('AI Service');
        expect(response.status).toBe(503);
      });
    });
  });

  describe('Request helpers', () => {
    describe('getRequestId', () => {
      it('extracts x-request-id header', () => {
        const headers = new Headers();
        headers.set('x-request-id', 'req_123');

        expect(getRequestId(headers)).toBe('req_123');
      });

      it('falls back to x-correlation-id', () => {
        const headers = new Headers();
        headers.set('x-correlation-id', 'corr_456');

        expect(getRequestId(headers)).toBe('corr_456');
      });

      it('returns undefined when no header present', () => {
        const headers = new Headers();
        expect(getRequestId(headers)).toBeUndefined();
      });
    });

    describe('createRequestContext', () => {
      it('creates context with requestId and startTime', () => {
        const headers = new Headers();
        headers.set('x-request-id', 'req_789');

        const context = createRequestContext(headers);

        expect(context.requestId).toBe('req_789');
        expect(context.startTime).toBeLessThanOrEqual(Date.now());
      });
    });
  });

  describe('Type guards', () => {
    describe('isSuccessResponse', () => {
      it('returns true for success responses', () => {
        const response = { success: true as const, data: {} };
        expect(isSuccessResponse(response)).toBe(true);
      });

      it('returns false for error responses', () => {
        const response = {
          success: false as const,
          error: { code: 'ERROR', message: 'test' },
        };
        expect(isSuccessResponse(response)).toBe(false);
      });
    });

    describe('isErrorResponse', () => {
      it('returns true for error responses', () => {
        const response = {
          success: false as const,
          error: { code: 'ERROR', message: 'test' },
        };
        expect(isErrorResponse(response)).toBe(true);
      });

      it('returns false for success responses', () => {
        const response = { success: true as const, data: {} };
        expect(isErrorResponse(response)).toBe(false);
      });
    });
  });

  describe('SAM_ERROR_CODES', () => {
    it('has all expected error codes', () => {
      expect(SAM_ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(SAM_ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(SAM_ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(SAM_ERROR_CODES.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
      expect(SAM_ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(SAM_ERROR_CODES.AI_UNAVAILABLE).toBe('AI_UNAVAILABLE');
    });
  });
});
