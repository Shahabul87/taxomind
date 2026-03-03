/**
 * Tests for Course Attachments Route - app/api/courses/[courseId]/attachments/route.ts
 *
 * Covers:
 *   POST - Create a new attachment for a course
 *
 * Tests auth checks, course ownership, Zod validation (url, name, fileId, etc.),
 * default name derivation from URL, default storageProvider, and error handling.
 */

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { POST } from '@/app/api/courses/[courseId]/attachments/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPostRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/attachments', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

// ---------------------------------------------------------------------------
// POST /api/courses/[courseId]/attachments
// ---------------------------------------------------------------------------

describe('POST /api/courses/[courseId]/attachments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Authentication
  // =========================================================================

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockCurrentUser.mockResolvedValue(null);

      const res = await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams()
      );
      const text = await res.json();

      expect(res.status).toBe(401);
      expect(text.error?.message ?? text.message ?? text).toBe('Unauthorized');
    });

    it('returns 401 when user has no id', async () => {
      mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

      const res = await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams()
      );
      const text = await res.json();

      expect(res.status).toBe(401);
      expect(text.error?.message ?? text.message ?? text).toBe('Unauthorized');
    });
  });

  // =========================================================================
  // Authorization (Course Ownership)
  // =========================================================================

  describe('Authorization', () => {
    it('returns 401 when user does not own the course', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'user-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams()
      );
      const text = await res.json();

      expect(res.status).toBe(401);
      expect(text.error?.message ?? text.message ?? text).toBe('Unauthorized');
    });

    it('checks course ownership with correct courseId and userId', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'my-course',
        userId: 'owner-1',
      });
      (db.attachment.create as jest.Mock).mockResolvedValue({
        id: 'att-1',
        url: 'https://example.com/file.pdf',
        name: 'file.pdf',
        courseId: 'my-course',
      });

      await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams('my-course')
      );

      expect(db.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'my-course', userId: 'owner-1' },
      });
    });
  });

  // =========================================================================
  // Zod Validation
  // =========================================================================

  describe('Validation', () => {
    it('returns 400 when url is missing', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });

      const res = await POST(
        createPostRequest({}),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request data');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when url is empty string', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });

      const res = await POST(
        createPostRequest({ url: '' }),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request data');
    });

    it('returns 400 when url is not a string', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });

      const res = await POST(
        createPostRequest({ url: 123 }),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request data');
    });

    it('returns 400 when fileSize is negative', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });

      const res = await POST(
        createPostRequest({ url: 'https://example.com/file.pdf', fileSize: -5 }),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request data');
    });

    it('returns 400 when fileSize is not an integer', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });

      const res = await POST(
        createPostRequest({ url: 'https://example.com/file.pdf', fileSize: 1.5 }),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request data');
    });

    it('returns 400 when fileSize is zero', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });

      const res = await POST(
        createPostRequest({ url: 'https://example.com/file.pdf', fileSize: 0 }),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid request data');
    });
  });

  // =========================================================================
  // Happy Path - Creating Attachments
  // =========================================================================

  describe('Successful creation', () => {
    it('creates an attachment with all fields provided', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'course-1',
        userId: 'owner-1',
      });

      const createdAttachment = {
        id: 'att-1',
        url: 'https://example.com/file.pdf',
        name: 'My Document',
        courseId: 'course-1',
        fileId: 'file-abc',
        fileSize: 1024,
        mimeType: 'application/pdf',
        storageProvider: 'aws-s3',
      };
      (db.attachment.create as jest.Mock).mockResolvedValue(createdAttachment);

      const res = await POST(
        createPostRequest({
          url: 'https://example.com/file.pdf',
          name: 'My Document',
          fileId: 'file-abc',
          fileSize: 1024,
          mimeType: 'application/pdf',
          storageProvider: 'aws-s3',
        }),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(createdAttachment);

      expect(db.attachment.create).toHaveBeenCalledWith({
        data: {
          url: 'https://example.com/file.pdf',
          name: 'My Document',
          courseId: 'course-1',
          fileId: 'file-abc',
          fileSize: 1024,
          mimeType: 'application/pdf',
          storageProvider: 'aws-s3',
        },
      });
    });

    it('derives name from URL when name is not provided', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'course-1',
        userId: 'owner-1',
      });
      (db.attachment.create as jest.Mock).mockResolvedValue({
        id: 'att-2',
        url: 'https://example.com/path/to/document.pdf',
        name: 'document.pdf',
        courseId: 'course-1',
      });

      await POST(
        createPostRequest({ url: 'https://example.com/path/to/document.pdf' }),
        createParams()
      );

      expect(db.attachment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'document.pdf',
        }),
      });
    });

    it('uses empty string as name when URL ends with trailing slash', async () => {
      // url.split("/").pop() returns "" for trailing slash.
      // The ?? operator does NOT treat "" as nullish, so "" is kept as-is.
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'course-1',
        userId: 'owner-1',
      });
      (db.attachment.create as jest.Mock).mockResolvedValue({
        id: 'att-3',
        url: 'https://example.com/',
        name: '',
        courseId: 'course-1',
      });

      await POST(
        createPostRequest({ url: 'https://example.com/' }),
        createParams()
      );

      expect(db.attachment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '',
        }),
      });
    });

    it('defaults storageProvider to "google-drive" when not provided', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'course-1',
        userId: 'owner-1',
      });
      (db.attachment.create as jest.Mock).mockResolvedValue({
        id: 'att-4',
        url: 'https://example.com/file.pdf',
        name: 'file.pdf',
        courseId: 'course-1',
        storageProvider: 'google-drive',
      });

      await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams()
      );

      expect(db.attachment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storageProvider: 'google-drive',
        }),
      });
    });

    it('uses explicit storageProvider when provided', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'course-1',
        userId: 'owner-1',
      });
      (db.attachment.create as jest.Mock).mockResolvedValue({
        id: 'att-5',
        url: 'https://example.com/file.pdf',
        name: 'file.pdf',
        courseId: 'course-1',
        storageProvider: 'cloudinary',
      });

      await POST(
        createPostRequest({ url: 'https://example.com/file.pdf', storageProvider: 'cloudinary' }),
        createParams()
      );

      expect(db.attachment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          storageProvider: 'cloudinary',
        }),
      });
    });

    it('passes optional fields as undefined when not provided', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'course-1',
        userId: 'owner-1',
      });
      (db.attachment.create as jest.Mock).mockResolvedValue({
        id: 'att-6',
        url: 'https://example.com/file.pdf',
        name: 'file.pdf',
        courseId: 'course-1',
      });

      await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams()
      );

      const createCall = (db.attachment.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.fileId).toBeUndefined();
      expect(createCall.data.fileSize).toBeUndefined();
      expect(createCall.data.mimeType).toBeUndefined();
    });

    it('uses the correct courseId from route params', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'other-course',
        userId: 'owner-1',
      });
      (db.attachment.create as jest.Mock).mockResolvedValue({
        id: 'att-7',
        url: 'https://example.com/file.pdf',
        name: 'file.pdf',
        courseId: 'other-course',
      });

      await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams('other-course')
      );

      expect(db.attachment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ courseId: 'other-course' }),
      });
    });

    it('returns the created attachment object as JSON', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'course-1',
        userId: 'owner-1',
      });

      const fullAttachment = {
        id: 'att-full',
        url: 'https://example.com/full.pdf',
        name: 'Full Attachment',
        courseId: 'course-1',
        fileId: 'fid-123',
        fileSize: 2048,
        mimeType: 'application/pdf',
        storageProvider: 'aws-s3',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      };
      (db.attachment.create as jest.Mock).mockResolvedValue(fullAttachment);

      const res = await POST(
        createPostRequest({
          url: 'https://example.com/full.pdf',
          name: 'Full Attachment',
          fileId: 'fid-123',
          fileSize: 2048,
          mimeType: 'application/pdf',
          storageProvider: 'aws-s3',
        }),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual(fullAttachment);
    });
  });

  // =========================================================================
  // Error Handling
  // =========================================================================

  describe('Error handling', () => {
    it('returns 500 on unexpected database error during ownership check', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection lost')
      );

      const res = await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams()
      );
      const text = await res.json();

      expect(res.status).toBe(500);
      expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
    });

    it('returns 500 on unexpected database error during attachment creation', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'course-1',
        userId: 'owner-1',
      });
      (db.attachment.create as jest.Mock).mockRejectedValue(
        new Error('Insert failed')
      );

      const res = await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams()
      );
      const text = await res.json();

      expect(res.status).toBe(500);
      expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
    });

    it('returns 500 on non-Error thrown values', async () => {
      mockCurrentUser.mockResolvedValue({ id: 'owner-1' });
      (db.course.findUnique as jest.Mock).mockRejectedValue('string error');

      const res = await POST(
        createPostRequest({ url: 'https://example.com/file.pdf' }),
        createParams()
      );
      const text = await res.json();

      expect(res.status).toBe(500);
      expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
    });
  });
});
