/**
 * Tests for Course Image Upload Route - app/api/courses/[courseId]/image/route.ts
 *
 * Covers:
 *   POST - Upload a course image via multipart/form-data to Cloudinary
 *
 * Tests auth checks (session-based via @/auth), courseId format validation,
 * rate limiting, course ownership (403 vs 404), file validation (size, type, name),
 * Cloudinary upload, database update, audit logging, and error handling.
 */

// @/lib/db, @/lib/auth, @/lib/logger, @/auth, cloudinary are globally mocked in jest.setup.js

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(),
  getClientIdentifier: jest.fn(() => 'test-client-id'),
}));

jest.mock('@/lib/audit/course-audit', () => ({
  logCourseImageUpload: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/lib/api/api-responses', () => {
  // Use the real implementations for type-accurate responses
  class MockApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: unknown;

    constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.statusCode = statusCode;
      this.code = code;
      this.details = details;
    }

    static badRequest(message = 'Bad Request', details?: unknown) {
      return new MockApiError(message, 400, 'BAD_REQUEST', details);
    }
    static unauthorized(message = 'Unauthorized', details?: unknown) {
      return new MockApiError(message, 401, 'UNAUTHORIZED', details);
    }
    static forbidden(message = 'Forbidden', details?: unknown) {
      return new MockApiError(message, 403, 'FORBIDDEN', details);
    }
    static notFound(message = 'Not Found', details?: unknown) {
      return new MockApiError(message, 404, 'NOT_FOUND', details);
    }
    static tooManyRequests(message = 'Too Many Requests', details?: unknown) {
      return new MockApiError(message, 429, 'TOO_MANY_REQUESTS', details);
    }
    static internal(message = 'Internal Server Error', details?: unknown) {
      return new MockApiError(message, 500, 'INTERNAL_ERROR', details);
    }
  }

  function createSuccessResponse(
    data: unknown,
    status = 200,
    meta?: unknown,
    headers?: Record<string, string>
  ) {
    const response = {
      success: true,
      data,
      meta: { timestamp: new Date().toISOString(), ...((meta as Record<string, unknown>) || {}) },
    };
    return new Response(JSON.stringify(response), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  }

  function createErrorResponse(
    error: MockApiError | string,
    headers?: Record<string, string>
  ) {
    const apiError = error instanceof MockApiError
      ? error
      : new MockApiError(String(error), 500, 'INTERNAL_ERROR');
    const response = {
      success: false,
      error: { message: apiError.message, code: apiError.code, details: apiError.details },
      meta: { timestamp: new Date().toISOString() },
    };
    return new Response(JSON.stringify(response), {
      status: apiError.statusCode,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  }

  return {
    ApiError: MockApiError,
    createSuccessResponse: createSuccessResponse,
    createErrorResponse: createErrorResponse,
  };
});

import { POST } from '@/app/api/courses/[courseId]/image/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { logCourseImageUpload } from '@/lib/audit/course-audit';
import { v2 as cloudinary } from 'cloudinary';

const mockAuth = auth as jest.Mock;
const mockRateLimit = rateLimit as jest.Mock;
const mockGetClientIdentifier = getClientIdentifier as jest.Mock;
const mockLogCourseImageUpload = logCourseImageUpload as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_COURSE_ID = '12345678-1234-1234-1234-123456789012';

/**
 * Create a File-like object that supports all the methods the route uses:
 * .size, .type, .name, .arrayBuffer()
 *
 * Using a plain object avoids jsdom's incomplete File polyfill.
 */
function createMockFile(
  name = 'test.jpg',
  type = 'image/jpeg',
  sizeInBytes = 1024
): File {
  const buffer = Buffer.alloc(sizeInBytes);
  return {
    name,
    type,
    size: sizeInBytes,
    lastModified: Date.now(),
    arrayBuffer: jest.fn().mockResolvedValue(buffer.buffer),
    text: jest.fn().mockResolvedValue(''),
    slice: jest.fn(),
    stream: jest.fn(),
    webkitRelativePath: '',
    bytes: jest.fn(),
  } as unknown as File;
}

/**
 * Create a plain object that quacks like a Request for the route handler.
 * We manually supply formData(), headers.get(), and the url property
 * so we bypass jsdom multipart body parsing entirely.
 */
function createFormDataRequest(
  file: File | null,
  courseId: string = VALID_COURSE_ID
): Request {
  const url = `http://localhost:3000/api/courses/${courseId}/image`;

  // Build a FormData mock. We can't use real FormData.append with our
  // mock File in jsdom, so we mock FormData.get() directly.
  const mockFormData = {
    get: jest.fn((key: string) => {
      if (key === 'file') return file;
      return null;
    }),
    append: jest.fn(),
    has: jest.fn((key: string) => key === 'file' && file !== null),
  };

  const headersMap: Record<string, string> = {
    'x-forwarded-for': '127.0.0.1',
    'x-real-ip': '127.0.0.1',
    'user-agent': 'jest-test-agent',
  };

  const fakeReq = {
    method: 'POST',
    url,
    formData: jest.fn().mockResolvedValue(mockFormData),
    headers: {
      get: jest.fn((key: string) => headersMap[key.toLowerCase()] ?? null),
    },
  } as unknown as Request;

  return fakeReq;
}

function createValidFile(
  name = 'test.jpg',
  type = 'image/jpeg',
  sizeInBytes = 1024
): File {
  return createMockFile(name, type, sizeInBytes);
}

function createParams(courseId = VALID_COURSE_ID) {
  return { params: Promise.resolve({ courseId }) };
}

function setupAuthenticatedOwner() {
  mockAuth.mockResolvedValue({ user: { id: 'owner-1' } });
  mockRateLimit.mockResolvedValue({
    success: true,
    limit: 50,
    remaining: 49,
    reset: Date.now() + 3600000,
  });
  (db.course.findUnique as jest.Mock).mockResolvedValue({
    id: VALID_COURSE_ID,
    userId: 'owner-1',
    imageUrl: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/courses/[courseId]/image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetClientIdentifier.mockReturnValue('test-client-id');
  });

  // =========================================================================
  // Authentication
  // =========================================================================

  describe('Authentication', () => {
    it('returns 401 when session is null', async () => {
      mockAuth.mockResolvedValue(null);

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 when session has no user', async () => {
      mockAuth.mockResolvedValue({ user: null });

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it('returns 401 when user has no id', async () => {
      mockAuth.mockResolvedValue({ user: { name: 'No ID' } });

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  // =========================================================================
  // CourseId Validation
  // =========================================================================

  describe('CourseId format validation', () => {
    it('returns 400 for invalid courseId format (not UUID)', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file, 'invalid-id'),
        createParams('invalid-id')
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toContain('Invalid course ID format');
    });

    it('accepts valid UUID courseId', async () => {
      setupAuthenticatedOwner();

      // Mock cloudinary upload
      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, {
            secure_url: 'https://cloudinary.com/image.jpg',
            public_id: 'course-images/abc',
            format: 'jpg',
            width: 800,
            height: 600,
            bytes: 1024,
          });
        }
      );
      (db.course.update as jest.Mock).mockResolvedValue({});

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );

      // Should not be 400 for valid UUID
      expect(res.status).not.toBe(400);
    });
  });

  // =========================================================================
  // Rate Limiting
  // =========================================================================

  describe('Rate limiting', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockRateLimit.mockResolvedValue({
        success: false,
        limit: 50,
        remaining: 0,
        reset: Date.now() + 3600000,
        retryAfter: 3600,
      });

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(429);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('TOO_MANY_REQUESTS');
    });

    it('passes through when rate limit is not exceeded', async () => {
      setupAuthenticatedOwner();

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, {
            secure_url: 'https://cloudinary.com/image.jpg',
            public_id: 'course-images/abc',
            format: 'jpg',
            width: 800,
            height: 600,
            bytes: 1024,
          });
        }
      );
      (db.course.update as jest.Mock).mockResolvedValue({});

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      expect(res.status).toBe(200);
    });
  });

  // =========================================================================
  // Course Ownership
  // =========================================================================

  describe('Course ownership', () => {
    it('returns 404 when course does not exist', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockRateLimit.mockResolvedValue({
        success: true,
        limit: 50,
        remaining: 49,
        reset: Date.now() + 3600000,
      });
      (db.course.findUnique as jest.Mock).mockResolvedValue(null);

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns 403 when user is not the course owner', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
      mockRateLimit.mockResolvedValue({
        success: true,
        limit: 50,
        remaining: 49,
        reset: Date.now() + 3600000,
      });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: VALID_COURSE_ID,
        userId: 'different-owner',
        imageUrl: null,
      });

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
    });
  });

  // =========================================================================
  // File Validation
  // =========================================================================

  describe('File validation', () => {
    it('returns 400 when no file is uploaded', async () => {
      setupAuthenticatedOwner();

      const res = await POST(
        createFormDataRequest(null),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toContain('No file uploaded');
    });

    it('returns 400 when file exceeds 10MB', async () => {
      setupAuthenticatedOwner();

      const largeFile = createValidFile('large.jpg', 'image/jpeg', 11 * 1024 * 1024);
      const res = await POST(
        createFormDataRequest(largeFile),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toContain('10MB');
    });

    it('returns 400 for invalid MIME type', async () => {
      setupAuthenticatedOwner();

      const invalidFile = createValidFile('document.pdf', 'application/pdf', 1024);
      const res = await POST(
        createFormDataRequest(invalidFile),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toContain('Invalid file type');
    });

    it('returns 400 for file with suspicious name containing ".."', async () => {
      setupAuthenticatedOwner();

      const suspiciousFile = createValidFile('../../../etc/passwd.jpg', 'image/jpeg', 1024);
      const res = await POST(
        createFormDataRequest(suspiciousFile),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.error.message).toContain('Invalid file name');
    });

    it('returns 400 for file with suspicious name containing "/"', async () => {
      setupAuthenticatedOwner();

      const suspiciousFile = createValidFile('path/traversal.jpg', 'image/jpeg', 1024);
      const res = await POST(
        createFormDataRequest(suspiciousFile),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('accepts image/jpeg files', async () => {
      setupAuthenticatedOwner();
      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, {
            secure_url: 'https://cloudinary.com/image.jpg',
            public_id: 'test',
            format: 'jpg',
            width: 800,
            height: 600,
            bytes: 1024,
          });
        }
      );
      (db.course.update as jest.Mock).mockResolvedValue({});

      const file = createValidFile('test.jpg', 'image/jpeg');
      const res = await POST(createFormDataRequest(file), createParams());
      expect(res.status).toBe(200);
    });

    it('accepts image/png files', async () => {
      setupAuthenticatedOwner();
      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, {
            secure_url: 'https://cloudinary.com/image.png',
            public_id: 'test',
            format: 'png',
            width: 800,
            height: 600,
            bytes: 1024,
          });
        }
      );
      (db.course.update as jest.Mock).mockResolvedValue({});

      const file = createValidFile('test.png', 'image/png');
      const res = await POST(createFormDataRequest(file), createParams());
      expect(res.status).toBe(200);
    });

    it('accepts image/webp files', async () => {
      setupAuthenticatedOwner();
      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, {
            secure_url: 'https://cloudinary.com/image.webp',
            public_id: 'test',
            format: 'webp',
            width: 800,
            height: 600,
            bytes: 1024,
          });
        }
      );
      (db.course.update as jest.Mock).mockResolvedValue({});

      const file = createValidFile('test.webp', 'image/webp');
      const res = await POST(createFormDataRequest(file), createParams());
      expect(res.status).toBe(200);
    });

    it('accepts image/gif files', async () => {
      setupAuthenticatedOwner();
      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, {
            secure_url: 'https://cloudinary.com/image.gif',
            public_id: 'test',
            format: 'gif',
            width: 800,
            height: 600,
            bytes: 1024,
          });
        }
      );
      (db.course.update as jest.Mock).mockResolvedValue({});

      const file = createValidFile('test.gif', 'image/gif');
      const res = await POST(createFormDataRequest(file), createParams());
      expect(res.status).toBe(200);
    });
  });

  // =========================================================================
  // Successful Upload
  // =========================================================================

  describe('Successful upload', () => {
    it('uploads to Cloudinary and updates the course image URL', async () => {
      setupAuthenticatedOwner();

      const cloudinaryResult = {
        secure_url: 'https://res.cloudinary.com/test/image.jpg',
        public_id: 'course-images/abc123',
        format: 'jpg',
        width: 1920,
        height: 1080,
        bytes: 2048,
      };

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, cloudinaryResult);
        }
      );
      (db.course.update as jest.Mock).mockResolvedValue({});

      const file = createValidFile('course-cover.jpg', 'image/jpeg', 2048);
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.url).toBe('https://res.cloudinary.com/test/image.jpg');
      expect(body.data.secure_url).toBe('https://res.cloudinary.com/test/image.jpg');
      expect(body.data.public_id).toBe('course-images/abc123');
      expect(body.data.format).toBe('jpg');
      expect(body.data.width).toBe(1920);
      expect(body.data.height).toBe(1080);

      // Verify course was updated
      expect(db.course.update).toHaveBeenCalledWith({
        where: { id: VALID_COURSE_ID },
        data: { imageUrl: 'https://res.cloudinary.com/test/image.jpg' },
      });
    });

    it('calls audit logging after successful upload', async () => {
      setupAuthenticatedOwner();

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, {
            secure_url: 'https://cloudinary.com/image.jpg',
            public_id: 'test-id',
            format: 'jpg',
            width: 800,
            height: 600,
            bytes: 1024,
          });
        }
      );
      (db.course.update as jest.Mock).mockResolvedValue({});

      const file = createValidFile('test.jpg', 'image/jpeg', 1024);
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );

      expect(res.status).toBe(200);
      expect(mockLogCourseImageUpload).toHaveBeenCalledWith(
        VALID_COURSE_ID,
        expect.objectContaining({
          userId: 'owner-1',
        }),
        expect.objectContaining({
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
          fileSize: 1024,
          cloudinaryPublicId: 'test-id',
        })
      );
    });

    it('does not fail if audit logging fails', async () => {
      setupAuthenticatedOwner();
      mockLogCourseImageUpload.mockRejectedValue(new Error('Audit log failed'));

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, {
            secure_url: 'https://cloudinary.com/image.jpg',
            public_id: 'test',
            format: 'jpg',
            width: 800,
            height: 600,
            bytes: 1024,
          });
        }
      );
      (db.course.update as jest.Mock).mockResolvedValue({});

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );

      // Should still succeed
      expect(res.status).toBe(200);
    });
  });

  // =========================================================================
  // Cloudinary Errors
  // =========================================================================

  describe('Cloudinary errors', () => {
    it('returns 500 when Cloudinary upload fails', async () => {
      setupAuthenticatedOwner();

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(new Error('Cloudinary service unavailable'), null);
        }
      );

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('Failed to upload image');
    });

    it('returns 500 when Cloudinary returns no result', async () => {
      setupAuthenticatedOwner();

      (cloudinary.uploader.upload as jest.Mock).mockImplementation(
        (_data: string, _opts: unknown, callback: (err: unknown, res: unknown) => void) => {
          callback(null, null);
        }
      );

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
    });
  });

  // =========================================================================
  // General Error Handling
  // =========================================================================

  describe('General error handling', () => {
    it('returns 500 on unexpected errors', async () => {
      mockAuth.mockRejectedValue(new Error('Unexpected failure'));

      const file = createValidFile();
      const res = await POST(
        createFormDataRequest(file),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain('Failed to upload image');
    });
  });
});
