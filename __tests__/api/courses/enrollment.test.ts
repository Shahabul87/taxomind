/**
 * Tests for Course Enrollment Route - app/api/courses/[courseId]/enrollment/route.ts
 *
 * Covers: GET (check enrollment status, retry logic, fallback enrollment via Stripe session)
 *
 * Test scenarios:
 * - Unauthenticated user (401)
 * - Enrollment found on first attempt (200)
 * - Enrollment found after retry (200)
 * - Enrollment not found without session_id (404)
 * - Fallback enrollment creation via Stripe session_id
 * - Fallback with existing PaymentTransaction
 * - Fallback with invalid Stripe payment status
 * - Fallback with mismatched courseId in session metadata
 * - Fallback when course not found in DB
 * - Stripe session retrieval error in fallback
 * - Internal server error (500)
 */

// Must mock server-only before any imports that use @/lib/stripe
jest.mock('server-only', () => ({}));

// Mock the stripe module before importing the route
jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: jest.fn(),
      },
    },
  },
}));

import { GET } from '@/app/api/courses/[courseId]/enrollment/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

const mockCurrentUser = currentUser as jest.Mock;

// Ensure the models needed by the enrollment route exist on the db mock
function ensureModelsExist() {
  const mockMethods = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(() => Promise.resolve([])),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(() => Promise.resolve(0)),
    aggregate: jest.fn(),
    groupBy: jest.fn(() => Promise.resolve([])),
  };

  if (!(db as Record<string, unknown>).paymentTransaction) {
    (db as Record<string, unknown>).paymentTransaction = { ...mockMethods };
  }
}

/**
 * Create a NextRequest for enrollment endpoint
 */
function createRequest(courseId = 'course-1', sessionId?: string) {
  let url = `http://localhost:3000/api/courses/${courseId}/enrollment`;
  if (sessionId) {
    url += `?session_id=${sessionId}`;
  }
  return new NextRequest(url, {
    method: 'GET',
  });
}

/**
 * Create route params
 */
function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

/** Standard enrollment with Course include */
const mockEnrollmentWithCourse = {
  id: 'enroll-1',
  userId: 'user-1',
  courseId: 'course-1',
  status: 'ACTIVE',
  enrollmentType: 'PAID',
  Course: {
    id: 'course-1',
    title: 'Test Course',
    chapters: [
      {
        id: 'ch-1',
        isPublished: true,
        position: 1,
        sections: [{ id: 'sec-1' }],
      },
    ],
    user: { name: 'Instructor', image: null },
    _count: { Enrollment: 5 },
  },
};

describe('GET /api/courses/[courseId]/enrollment', () => {
  beforeAll(() => {
    ensureModelsExist();
  });

  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: true });
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ----------------------------
  // 1. Authentication
  // ----------------------------

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  // ----------------------------
  // 2. Enrollment found immediately
  // ----------------------------

  it('returns enrollment data when found on first attempt', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollmentWithCourse);

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('enroll-1');
    expect(body.Course.title).toBe('Test Course');
    expect(body.Course.chapters).toHaveLength(1);
    expect(body.Course.user.name).toBe('Instructor');
  });

  it('queries enrollment with correct userId and courseId', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollmentWithCourse);

    await GET(createRequest('course-xyz'), createParams('course-xyz'));

    expect(db.enrollment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_courseId: {
            userId: 'user-1',
            courseId: 'course-xyz',
          },
        },
      })
    );
  });

  it('includes published chapters and sections in query', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(mockEnrollmentWithCourse);

    await GET(createRequest(), createParams());

    expect(db.enrollment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          Course: expect.objectContaining({
            include: expect.objectContaining({
              chapters: expect.objectContaining({
                where: { isPublished: true },
              }),
            }),
          }),
        }),
      })
    );
  });

  // ----------------------------
  // 3. Retry logic
  // ----------------------------

  it('retries up to 5 times with 1s delays when enrollment not found', async () => {
    // Enrollment never found, no session_id
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    const promise = GET(createRequest(), createParams());

    // Advance through all retry delays (4 delays of 1000ms between attempts)
    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Enrollment not found');
    // Should have been called 5 times (maxRetries)
    expect(db.enrollment.findUnique).toHaveBeenCalledTimes(5);
  });

  it('returns enrollment on second retry attempt', async () => {
    (db.enrollment.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockEnrollmentWithCourse);

    const promise = GET(createRequest(), createParams());
    await jest.advanceTimersByTimeAsync(1000);

    const res = await promise;
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('enroll-1');
    expect(db.enrollment.findUnique).toHaveBeenCalledTimes(2);
  });

  // ----------------------------
  // 4. Enrollment not found (no session_id)
  // ----------------------------

  it('returns 404 when enrollment not found and no session_id provided', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    const promise = GET(createRequest(), createParams());

    // Advance through all retries
    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Enrollment not found');
  });

  // ----------------------------
  // 5. Fallback enrollment via Stripe session_id
  // ----------------------------

  it('creates fallback enrollment when session_id is valid and payment is paid', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    // Stripe session retrieval
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      metadata: { courseId: 'course-1' },
      amount_total: 4999,
      currency: 'usd',
      payment_intent: 'pi_test_123',
    });

    // Course exists
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      price: 49.99,
    });

    // No existing payment transaction
    const paymentTx = (db as Record<string, unknown>).paymentTransaction as Record<string, jest.Mock>;
    paymentTx.findUnique.mockResolvedValue(null);

    // Transaction creates enrollment - the route uses db.$transaction
    const createdEnrollment = {
      ...mockEnrollmentWithCourse,
      id: 'enroll-fallback',
      enrollmentType: 'PAID',
      status: 'ACTIVE',
    };

    (db.$transaction as jest.Mock).mockResolvedValue(createdEnrollment);

    const promise = GET(
      createRequest('course-1', 'cs_test_123'),
      createParams('course-1')
    );

    // Advance through all retries
    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('enroll-fallback');
    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_test_123');
  });

  it('creates fallback enrollment when PaymentTransaction already exists', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      id: 'cs_test_123',
      payment_status: 'paid',
      metadata: { courseId: 'course-1' },
      amount_total: 4999,
      currency: 'usd',
      payment_intent: 'pi_test_123',
    });

    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      price: 49.99,
    });

    // Existing payment transaction
    const paymentTx = (db as Record<string, unknown>).paymentTransaction as Record<string, jest.Mock>;
    paymentTx.findUnique.mockResolvedValue({
      id: 'tx-existing',
      providerSessionId: 'cs_test_123',
    });

    const createdEnrollment = {
      ...mockEnrollmentWithCourse,
      id: 'enroll-fallback-2',
    };
    (db.$transaction as jest.Mock).mockResolvedValue(createdEnrollment);

    const promise = GET(
      createRequest('course-1', 'cs_test_123'),
      createParams('course-1')
    );

    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('enroll-fallback-2');
  });

  // ----------------------------
  // 6. Fallback failure scenarios
  // ----------------------------

  it('returns 404 when Stripe session payment_status is not paid', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      id: 'cs_test_unpaid',
      payment_status: 'unpaid',
      metadata: { courseId: 'course-1' },
      amount_total: 4999,
      currency: 'usd',
    });

    const promise = GET(
      createRequest('course-1', 'cs_test_unpaid'),
      createParams('course-1')
    );

    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Enrollment not found');
  });

  it('returns 404 when Stripe session courseId does not match route courseId', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      id: 'cs_test_mismatch',
      payment_status: 'paid',
      metadata: { courseId: 'course-different' },
      amount_total: 4999,
      currency: 'usd',
    });

    const promise = GET(
      createRequest('course-1', 'cs_test_mismatch'),
      createParams('course-1')
    );

    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Enrollment not found');
  });

  it('returns 404 when course not found in DB during fallback', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      id: 'cs_test_no_course',
      payment_status: 'paid',
      metadata: { courseId: 'course-1' },
      amount_total: 4999,
      currency: 'usd',
    });

    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const promise = GET(
      createRequest('course-1', 'cs_test_no_course'),
      createParams('course-1')
    );

    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Enrollment not found');
  });

  it('returns 404 when Stripe session retrieval throws an error', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    (stripe.checkout.sessions.retrieve as jest.Mock).mockRejectedValue(
      new Error('Stripe API error')
    );

    const promise = GET(
      createRequest('course-1', 'cs_test_error'),
      createParams('course-1')
    );

    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;
    const body = await res.json();

    // Stripe error is caught in fallback, enrollment still not found => 404
    expect(res.status).toBe(404);
    expect(body.error).toBe('Enrollment not found');
  });

  // ----------------------------
  // 7. Internal server error
  // ----------------------------

  it('returns 500 on unexpected database error', async () => {
    (db.enrollment.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database connection lost')
    );

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });

  it('returns 500 when currentUser throws', async () => {
    mockCurrentUser.mockRejectedValue(new Error('Auth service down'));

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Internal server error');
  });

  // ----------------------------
  // 8. Edge cases
  // ----------------------------

  it('handles enrollment found on the last retry attempt', async () => {
    (db.enrollment.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockEnrollmentWithCourse);

    const promise = GET(createRequest(), createParams());

    // Advance through 4 retry delays
    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('enroll-1');
    expect(db.enrollment.findUnique).toHaveBeenCalledTimes(5);
  });

  it('parses session_id from query parameters correctly', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      id: 'cs_special_session',
      payment_status: 'paid',
      metadata: { courseId: 'course-1' },
      amount_total: 2999,
      currency: 'usd',
      payment_intent: 'pi_special',
    });

    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      price: 29.99,
    });

    const paymentTx = (db as Record<string, unknown>).paymentTransaction as Record<string, jest.Mock>;
    paymentTx.findUnique.mockResolvedValue(null);

    const createdEnrollment = {
      ...mockEnrollmentWithCourse,
      id: 'enroll-session-parsed',
    };
    (db.$transaction as jest.Mock).mockResolvedValue(createdEnrollment);

    const promise = GET(
      createRequest('course-1', 'cs_special_session'),
      createParams('course-1')
    );

    for (let i = 0; i < 4; i++) {
      await jest.advanceTimersByTimeAsync(1000);
    }

    const res = await promise;

    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_special_session');
    expect(res.status).toBe(200);
  });
});
