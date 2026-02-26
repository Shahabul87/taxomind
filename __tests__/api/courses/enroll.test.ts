/**
 * Tests for Course Enrollment Route - app/api/courses/[courseId]/enroll/route.ts
 *
 * Covers: POST (free course enrollment), GET (enrollment status check)
 */

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { POST, GET } from '@/app/api/courses/[courseId]/enroll/route';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

function createRequest(body?: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/enroll', {
    method: body ? 'POST' : 'GET',
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  });
}

function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

describe('POST /api/courses/[courseId]/enroll', () => {
  beforeAll(() => {
    // Polyfill crypto.randomUUID for jsdom
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      const nodeCrypto = require('crypto');
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => nodeCrypto.randomUUID(),
        configurable: true,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Test Course',
      isFree: true,
      price: null,
      isPublished: true,
    });
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
    (db.enrollment.create as jest.Mock).mockResolvedValue({
      id: 'enroll-1',
      userId: 'user-1',
      courseId: 'course-1',
      status: 'ACTIVE',
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when course does not exist', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 when course is not published', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Draft Course',
      isFree: true,
      price: null,
      isPublished: false,
    });

    const res = await POST(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('returns 402 when course requires payment', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Paid Course',
      isFree: false,
      price: 29.99,
      isPublished: true,
    });

    const res = await POST(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.error.code).toBe('PAYMENT_REQUIRED');
    expect(body.error.details.price).toBe(29.99);
  });

  it('returns 409 when user is already enrolled', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-enroll',
      userId: 'user-1',
      courseId: 'course-1',
    });

    const res = await POST(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('ALREADY_ENROLLED');
    expect(body.error.details.enrollmentId).toBe('existing-enroll');
  });

  it('successfully enrolls user in a free course', async () => {
    const res = await POST(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.enrollmentId).toBe('enroll-1');
    expect(body.data.courseTitle).toBe('Test Course');
    expect(body.data.userId).toBe('user-1');

    expect(db.enrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          courseId: 'course-1',
          status: 'ACTIVE',
          enrollmentType: 'FREE',
        }),
      })
    );
  });

  it('includes metadata in success response', async () => {
    const res = await POST(createRequest({}), createParams());
    const body = await res.json();

    expect(body.metadata).toBeDefined();
    expect(body.metadata.timestamp).toBeDefined();
    expect(body.metadata.version).toBe('1.0.0');
  });

  it('returns 500 on unexpected database errors', async () => {
    (db.course.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await POST(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('GET /api/courses/[courseId]/enroll', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns isEnrolled: false when not enrolled', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isEnrolled).toBe(false);
    expect(body.data.courseId).toBe('course-1');
  });

  it('returns enrollment data when enrolled', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue({
      id: 'enroll-1',
      status: 'ACTIVE',
      enrollmentType: 'FREE',
      createdAt: new Date('2026-01-01'),
      Course: { id: 'course-1', title: 'Test Course', isFree: true },
    });

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isEnrolled).toBe(true);
    expect(body.data.enrollment.id).toBe('enroll-1');
    expect(body.data.enrollment.status).toBe('ACTIVE');
    expect(body.data.enrollment.course.title).toBe('Test Course');
  });

  it('returns 500 on unexpected errors', async () => {
    (db.enrollment.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
