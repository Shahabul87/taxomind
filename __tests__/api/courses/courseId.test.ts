/**
 * Tests for Course PATCH/DELETE Route - app/api/courses/[courseId]/route.ts
 *
 * Covers:
 *   DELETE - course deletion with ownership check, audit logging, memory reindex
 *   PATCH  - course update with Zod validation, category handling, audit logging
 */

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

jest.mock('@/lib/audit/course-audit', () => ({
  logCourseUpdate: jest.fn().mockResolvedValue(undefined),
  logCourseDeletion: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/sam/memory-lifecycle-service', () => ({
  queueCourseReindex: jest.fn().mockResolvedValue(undefined),
}));

import { DELETE, PATCH } from '@/app/api/courses/[courseId]/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logCourseUpdate, logCourseDeletion } from '@/lib/audit/course-audit';
import { queueCourseReindex } from '@/lib/sam/memory-lifecycle-service';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockLogCourseUpdate = logCourseUpdate as jest.Mock;
const mockLogCourseDeletion = logCourseDeletion as jest.Mock;
const mockQueueCourseReindex = queueCourseReindex as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createNextRequest(
  method: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>
): NextRequest {
  const allHeaders: Record<string, string> = {
    'content-type': 'application/json',
    'x-forwarded-for': '127.0.0.1',
    'user-agent': 'jest-test-agent',
    ...(headers ?? {}),
  };

  return new NextRequest('http://localhost:3000/api/courses/course-1', {
    method,
    headers: allHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

const MOCK_USER = { id: 'user-1', name: 'Test User' };

const MOCK_COURSE = {
  id: 'course-1',
  userId: 'user-1',
  title: 'Test Course',
  description: 'A test course',
  imageUrl: null,
  price: null,
  isPublished: false,
  isFeatured: false,
  subtitle: null,
  categoryId: null,
  subcategoryId: null,
  whatYouWillLearn: [],
};

// ===================================================================
// DELETE /api/courses/[courseId]
// ===================================================================
describe('DELETE /api/courses/[courseId]', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue(MOCK_USER);

    // First findUnique (existence check) returns id, userId, title
    // Second findUnique (ownership check) returns the full course
    (db.course.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'course-1', userId: 'user-1', title: 'Test Course' })
      .mockResolvedValueOnce(MOCK_COURSE);

    (db.course.delete as jest.Mock).mockResolvedValue(MOCK_COURSE);
  });

  // ----- Authentication -----
  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await DELETE(createNextRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID' });

    const res = await DELETE(createNextRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(body.details).toBe('No authenticated user');
  });

  // ----- Not Found -----
  it('returns 404 when course does not exist', async () => {
    (db.course.findUnique as jest.Mock).mockReset();
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const res = await DELETE(createNextRequest('DELETE'), createParams('non-existent'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Course not found');
    expect(body.courseId).toBe('non-existent');
  });

  // ----- Authorization (not owner) -----
  it('returns 403 when user does not own the course', async () => {
    (db.course.findUnique as jest.Mock).mockReset();
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'course-1',
      userId: 'other-user',
      title: 'Other Course',
    });

    const res = await DELETE(createNextRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Unauthorized');
    expect(body.details).toBe('You do not own this course');
    expect(body.courseOwner).toBe('other-user');
    expect(body.currentUser).toBe('user-1');
  });

  // ----- Successful Deletion -----
  it('deletes the course and returns success response', async () => {
    const res = await DELETE(createNextRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Course deleted successfully');
    expect(body.deletedCourse.id).toBe('course-1');
    expect(body.deletedCourse.title).toBe('Test Course');
  });

  it('calls db.course.delete with the correct courseId', async () => {
    await DELETE(createNextRequest('DELETE'), createParams());

    expect(db.course.delete).toHaveBeenCalledWith({
      where: { id: 'course-1' },
    });
  });

  // ----- Audit Logging -----
  it('calls logCourseDeletion with audit metadata after deletion', async () => {
    await DELETE(createNextRequest('DELETE'), createParams());

    expect(mockLogCourseDeletion).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'jest-test-agent',
      }),
      expect.objectContaining({
        deletedTitle: 'Test Course',
        deletedAt: expect.any(String),
      })
    );
  });

  it('does not fail if audit logging throws', async () => {
    mockLogCourseDeletion.mockRejectedValueOnce(new Error('Audit failure'));

    const res = await DELETE(createNextRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // ----- Memory Reindex -----
  it('calls queueCourseReindex with delete action', async () => {
    await DELETE(createNextRequest('DELETE'), createParams());

    expect(mockQueueCourseReindex).toHaveBeenCalledWith('course-1', 'delete');
  });

  it('does not fail if memory reindex throws', async () => {
    mockQueueCourseReindex.mockRejectedValueOnce(new Error('Reindex failure'));

    const res = await DELETE(createNextRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // ----- Request Metadata Extraction -----
  it('extracts IP from x-forwarded-for header (multiple IPs)', async () => {
    const req = createNextRequest('DELETE', undefined, {
      'x-forwarded-for': '10.0.0.1, 10.0.0.2',
    });

    await DELETE(req, createParams());

    expect(mockLogCourseDeletion).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ ipAddress: '10.0.0.1' }),
      expect.anything()
    );
  });

  it('falls back to x-real-ip when x-forwarded-for is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/course-1', {
      method: 'DELETE',
      headers: {
        'x-real-ip': '192.168.1.1',
        'user-agent': 'test',
      },
    });

    await DELETE(req, createParams());

    expect(mockLogCourseDeletion).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ ipAddress: '192.168.1.1' }),
      expect.anything()
    );
  });

  // ----- Internal Error -----
  it('returns 500 when db.course.findUnique throws', async () => {
    (db.course.findUnique as jest.Mock).mockReset();
    (db.course.findUnique as jest.Mock).mockRejectedValueOnce(new Error('Connection lost'));

    const res = await DELETE(createNextRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Error');
    expect(body.details).toBe('Connection lost');
    expect(body.timestamp).toBeDefined();
  });

  it('returns 500 when db.course.delete throws', async () => {
    (db.course.delete as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));

    const res = await DELETE(createNextRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal Error');
  });

  it('returns "Unknown error" detail when thrown error is not an Error instance', async () => {
    (db.course.findUnique as jest.Mock).mockReset();
    (db.course.findUnique as jest.Mock).mockRejectedValueOnce('string error');

    const res = await DELETE(createNextRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.details).toBe('Unknown error');
  });
});

// ===================================================================
// PATCH /api/courses/[courseId]
// ===================================================================
describe('PATCH /api/courses/[courseId]', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue(MOCK_USER);

    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.course.update as jest.Mock).mockResolvedValue({
      ...MOCK_COURSE,
      title: 'Updated Title',
    });
  });

  // ----- Authentication -----
  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(createNextRequest('PATCH', { title: 'New' }), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID' });

    const res = await PATCH(createNextRequest('PATCH', { title: 'New' }), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  // ----- Validation -----
  it('returns 400 for title shorter than 3 characters', async () => {
    const res = await PATCH(createNextRequest('PATCH', { title: 'ab' }), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
    expect(body.details.title).toBeDefined();
  });

  it('returns 400 for title longer than 200 characters', async () => {
    const res = await PATCH(
      createNextRequest('PATCH', { title: 'x'.repeat(201) }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for negative price', async () => {
    const res = await PATCH(createNextRequest('PATCH', { price: -5 }), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for price exceeding 10000', async () => {
    const res = await PATCH(createNextRequest('PATCH', { price: 10001 }), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for invalid imageUrl', async () => {
    const res = await PATCH(
      createNextRequest('PATCH', { imageUrl: 'not-a-url' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for unknown fields (strict schema)', async () => {
    const res = await PATCH(
      createNextRequest('PATCH', { title: 'Valid', unknownField: 'nope' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for too many learning objectives', async () => {
    const objectives = Array.from({ length: 21 }, (_, i) => `Objective ${i}`);
    const res = await PATCH(
      createNextRequest('PATCH', { whatYouWillLearn: objectives }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  it('returns 400 for subtitle exceeding 500 characters', async () => {
    const res = await PATCH(
      createNextRequest('PATCH', { subtitle: 's'.repeat(501) }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Validation failed');
  });

  // ----- No Fields to Update -----
  it('returns 400 when body has no recognized update fields', async () => {
    // An empty body after validation yields no updateData keys
    const res = await PATCH(createNextRequest('PATCH', {}), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('No fields to update');
  });

  // ----- Course Not Found -----
  it('returns 404 when course is not found for the user', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(createNextRequest('PATCH', { title: 'Updated' }), createParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Course not found');
  });

  // ----- Successful Updates -----
  it('updates title successfully', async () => {
    const res = await PATCH(createNextRequest('PATCH', { title: 'Updated Title' }), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'course-1', userId: 'user-1' },
        data: { title: 'Updated Title' },
      })
    );
  });

  it('updates description to null', async () => {
    await PATCH(createNextRequest('PATCH', { description: null }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { description: null },
      })
    );
  });

  it('updates price', async () => {
    await PATCH(createNextRequest('PATCH', { price: 29.99 }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { price: 29.99 },
      })
    );
  });

  it('updates isPublished boolean', async () => {
    await PATCH(createNextRequest('PATCH', { isPublished: true }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isPublished: true },
      })
    );
  });

  it('updates isFeatured boolean', async () => {
    await PATCH(createNextRequest('PATCH', { isFeatured: true }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isFeatured: true },
      })
    );
  });

  it('updates whatYouWillLearn array', async () => {
    const objectives = ['Learn A', 'Learn B'];
    await PATCH(createNextRequest('PATCH', { whatYouWillLearn: objectives }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { whatYouWillLearn: objectives },
      })
    );
  });

  it('updates subtitle', async () => {
    await PATCH(createNextRequest('PATCH', { subtitle: 'A subtitle' }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { subtitle: 'A subtitle' },
      })
    );
  });

  it('updates imageUrl with a valid URL', async () => {
    await PATCH(
      createNextRequest('PATCH', { imageUrl: 'https://example.com/image.png' }),
      createParams()
    );

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { imageUrl: 'https://example.com/image.png' },
      })
    );
  });

  it('updates multiple fields at once', async () => {
    await PATCH(
      createNextRequest('PATCH', { title: 'New Title', price: 10, isPublished: true }),
      createParams()
    );

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { title: 'New Title', price: 10, isPublished: true },
      })
    );
  });

  // ----- Category Handling -----
  it('sets categoryId to null when sent as null', async () => {
    await PATCH(createNextRequest('PATCH', { categoryId: null }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ categoryId: null }),
      })
    );
  });

  it('looks up category by id and uses it', async () => {
    (db.category.findUnique as jest.Mock).mockResolvedValue({
      id: 'cat-1',
      name: 'Programming',
    });

    await PATCH(createNextRequest('PATCH', { categoryId: 'cat-1' }), createParams());

    expect(db.category.findUnique).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ categoryId: 'cat-1' }),
      })
    );
  });

  it('creates a new category when id is not found and name lookup fails', async () => {
    (db.category.findUnique as jest.Mock).mockResolvedValue(null);
    (db.category.findFirst as jest.Mock).mockResolvedValue(null);
    (db.category.create as jest.Mock).mockResolvedValue({
      id: 'web-development',
      name: 'Web Development',
    });

    await PATCH(createNextRequest('PATCH', { categoryId: 'web-development' }), createParams());

    expect(db.category.create).toHaveBeenCalledWith({
      data: { id: 'web-development', name: 'Web Development' },
    });
    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ categoryId: 'web-development' }),
      })
    );
  });

  it('uses existing category found by name (case insensitive)', async () => {
    (db.category.findUnique as jest.Mock).mockResolvedValue(null);
    (db.category.findFirst as jest.Mock).mockResolvedValue({
      id: 'existing-cat',
      name: 'Web Development',
    });

    await PATCH(createNextRequest('PATCH', { categoryId: 'web-development' }), createParams());

    expect(db.category.findFirst).toHaveBeenCalledWith({
      where: { name: { equals: 'Web Development', mode: 'insensitive' } },
    });
    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ categoryId: 'existing-cat' }),
      })
    );
  });

  it('handles category lookup error gracefully', async () => {
    (db.category.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    // The route catches this and continues - categoryId not added to updateData
    // We need another field so the update still proceeds
    const res = await PATCH(
      createNextRequest('PATCH', { categoryId: 'cat-1', title: 'Still works' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
  });

  // ----- Subcategory Handling -----
  it('sets subcategoryId to null when sent as null', async () => {
    await PATCH(createNextRequest('PATCH', { subcategoryId: null }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subcategoryId: null }),
      })
    );
  });

  it('uses subcategory if found in database', async () => {
    // First call is for findUnique for the course, second for subcategory
    (db.category.findUnique as jest.Mock).mockResolvedValue({
      id: 'subcat-1',
      name: 'React',
    });

    await PATCH(createNextRequest('PATCH', { subcategoryId: 'subcat-1' }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ subcategoryId: 'subcat-1' }),
      })
    );
  });

  it('does not set subcategoryId when subcategory is not found', async () => {
    (db.category.findUnique as jest.Mock).mockResolvedValue(null);

    // Need another field to avoid "No fields to update"
    await PATCH(
      createNextRequest('PATCH', { subcategoryId: 'missing-subcat', title: 'Hello World' }),
      createParams()
    );

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ subcategoryId: 'missing-subcat' }),
      })
    );
  });

  it('handles subcategory lookup error gracefully', async () => {
    (db.category.findUnique as jest.Mock).mockRejectedValue(new Error('Subcat DB error'));

    const res = await PATCH(
      createNextRequest('PATCH', { subcategoryId: 'subcat-1', title: 'Works' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
  });

  // ----- Audit Logging -----
  it('calls logCourseUpdate after successful update', async () => {
    await PATCH(createNextRequest('PATCH', { title: 'Audited Title' }), createParams());

    expect(mockLogCourseUpdate).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({
        userId: 'user-1',
        ipAddress: '127.0.0.1',
        userAgent: 'jest-test-agent',
      }),
      expect.objectContaining({
        fieldsUpdated: ['title'],
      })
    );
  });

  it('does not fail if audit logging throws', async () => {
    mockLogCourseUpdate.mockRejectedValueOnce(new Error('Audit boom'));

    const res = await PATCH(createNextRequest('PATCH', { title: 'Still OK' }), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
  });

  // ----- Memory Reindex -----
  it('calls queueCourseReindex with update action', async () => {
    await PATCH(createNextRequest('PATCH', { title: 'Reindexed' }), createParams());

    expect(mockQueueCourseReindex).toHaveBeenCalledWith('course-1', 'update');
  });

  it('does not fail if memory reindex throws', async () => {
    mockQueueCourseReindex.mockRejectedValueOnce(new Error('Reindex boom'));

    const res = await PATCH(createNextRequest('PATCH', { title: 'Still OK' }), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
  });

  // ----- Database Error During Update -----
  it('returns 500 when db.course.update throws', async () => {
    (db.course.update as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

    const res = await PATCH(createNextRequest('PATCH', { title: 'Fail' }), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Database error');
  });

  // ----- Invalid JSON -----
  it('returns 400 for invalid JSON in request body', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/course-1', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: 'not json {{{',
    });

    const res = await PATCH(req, createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid JSON in request body');
  });

  // ----- Unexpected Error -----
  it('returns 500 for unexpected non-SyntaxError errors', async () => {
    mockCurrentUser.mockRejectedValueOnce(new Error('Unexpected'));

    const res = await PATCH(createNextRequest('PATCH', { title: 'X' }), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal error');
  });

  // ----- Nullable fields accept null -----
  it('accepts null for price', async () => {
    await PATCH(createNextRequest('PATCH', { price: null }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { price: null },
      })
    );
  });

  it('accepts null for imageUrl', async () => {
    await PATCH(createNextRequest('PATCH', { imageUrl: null }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { imageUrl: null },
      })
    );
  });

  it('accepts null for description', async () => {
    await PATCH(createNextRequest('PATCH', { description: null }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { description: null },
      })
    );
  });

  it('accepts null for subtitle', async () => {
    await PATCH(createNextRequest('PATCH', { subtitle: null }), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { subtitle: null },
      })
    );
  });

  // ----- Boundary: price at exactly 0 and exactly 10000 -----
  it('accepts price at exactly 0', async () => {
    const res = await PATCH(createNextRequest('PATCH', { price: 0 }), createParams());

    expect(res.status).toBe(200);
    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { price: 0 },
      })
    );
  });

  it('accepts price at exactly 10000', async () => {
    const res = await PATCH(createNextRequest('PATCH', { price: 10000 }), createParams());

    expect(res.status).toBe(200);
    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { price: 10000 },
      })
    );
  });

  // ----- Boundary: title at exactly 3 and exactly 200 characters -----
  it('accepts title with exactly 3 characters', async () => {
    const res = await PATCH(createNextRequest('PATCH', { title: 'abc' }), createParams());

    expect(res.status).toBe(200);
  });

  it('accepts title with exactly 200 characters', async () => {
    const res = await PATCH(
      createNextRequest('PATCH', { title: 'a'.repeat(200) }),
      createParams()
    );

    expect(res.status).toBe(200);
  });

  // ----- Boundary: exactly 20 learning objectives -----
  it('accepts exactly 20 learning objectives', async () => {
    const objectives = Array.from({ length: 20 }, (_, i) => `Objective ${i + 1}`);
    const res = await PATCH(
      createNextRequest('PATCH', { whatYouWillLearn: objectives }),
      createParams()
    );

    expect(res.status).toBe(200);
  });
});
