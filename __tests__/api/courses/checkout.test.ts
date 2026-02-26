/**
 * Tests for Course Checkout Route - app/api/courses/[courseId]/checkout/route.ts
 *
 * Covers: POST (Stripe checkout session creation for paid course enrollment)
 *
 * Test scenarios:
 * - Stripe not configured (503)
 * - Unauthenticated user (401)
 * - Rate limiting (429)
 * - Missing email (400)
 * - Course not found (404)
 * - Free course rejection (400)
 * - Already enrolled (409)
 * - Fraud check blocked (403)
 * - Successful checkout with existing Stripe customer
 * - Successful checkout creating new Stripe customer
 * - Internal server error (500)
 */

// Must mock server-only before any imports that use @/lib/stripe
jest.mock('server-only', () => ({}));

// Mock the stripe module before importing the route
jest.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  },
  isStripeConfigured: jest.fn(),
}));

// Mock payment rate-limit module
jest.mock('@/lib/payment/rate-limit', () => ({
  checkAndEnforceRateLimit: jest.fn(),
  paymentRateLimitPresets: {
    courseCheckout: {
      maxRequests: 20,
      windowMs: 60000,
      message: 'Too many checkout attempts.',
      includeHeaders: true,
    },
  },
  createRateLimitHeaders: jest.fn(),
  checkPaymentRateLimit: jest.fn(),
}));

// Mock fraud detection module
jest.mock('@/lib/payment/fraud-detection', () => ({
  checkPaymentFraud: jest.fn(),
}));

import { POST } from '@/app/api/courses/[courseId]/checkout/route';
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import {
  checkAndEnforceRateLimit,
  createRateLimitHeaders,
  checkPaymentRateLimit,
} from '@/lib/payment/rate-limit';
import { checkPaymentFraud } from '@/lib/payment/fraud-detection';

const mockCurrentUser = currentUser as jest.Mock;
const mockIsStripeConfigured = isStripeConfigured as jest.Mock;
const mockCheckAndEnforceRateLimit = checkAndEnforceRateLimit as jest.Mock;
const mockCheckPaymentFraud = checkPaymentFraud as jest.Mock;
const mockCreateRateLimitHeaders = createRateLimitHeaders as jest.Mock;
const mockCheckPaymentRateLimit = checkPaymentRateLimit as jest.Mock;

/**
 * Create a NextRequest for checkout endpoint
 */
function createCheckoutRequest(courseId = 'course-1') {
  return new NextRequest(
    `http://localhost:3000/api/courses/${courseId}/checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.1',
      },
    }
  );
}

/**
 * Create route params
 */
function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

describe('POST /api/courses/[courseId]/checkout', () => {
  beforeEach(() => {
    // Default: Stripe is configured
    mockIsStripeConfigured.mockReturnValue(true);

    // Default: authenticated user with email
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    });

    // Default: no rate limiting
    mockCheckAndEnforceRateLimit.mockReturnValue(null);

    // Default: course exists and is paid
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Advanced TypeScript',
      description: 'Learn TypeScript deeply',
      price: 49.99,
      isFree: false,
    });

    // Default: user not enrolled
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue(null);

    // Default: fraud check passes
    mockCheckPaymentFraud.mockResolvedValue({
      allowed: true,
      riskScore: 5,
      flags: [],
      details: {},
    });

    // Default: no existing Stripe customer
    (db.stripeCustomer.findUnique as jest.Mock).mockResolvedValue(null);

    // Default: Stripe customer creation
    (stripe.customers.create as jest.Mock).mockResolvedValue({
      id: 'cus_new_123',
    });

    // Default: Stripe customer DB record creation
    (db.stripeCustomer.create as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      stripeCustomerId: 'cus_new_123',
    });

    // Default: Stripe checkout session creation
    (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
      id: 'cs_test_session_123',
      url: 'https://checkout.stripe.com/pay/cs_test_session_123',
    });

    // Default: rate limit headers
    mockCheckPaymentRateLimit.mockReturnValue({
      allowed: true,
      remaining: 19,
      limit: 20,
      resetTime: new Date(Date.now() + 60000),
    });

    mockCreateRateLimitHeaders.mockReturnValue({
      'X-RateLimit-Limit': '20',
      'X-RateLimit-Remaining': '19',
      'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 60),
    });
  });

  // ----------------------------
  // 1. Stripe configuration
  // ----------------------------

  it('returns 503 when Stripe is not configured', async () => {
    mockIsStripeConfigured.mockReturnValue(false);

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('PAYMENT_UNAVAILABLE');
  });

  // ----------------------------
  // 2. Authentication
  // ----------------------------

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ email: 'test@example.com' });

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  // ----------------------------
  // 3. Rate limiting
  // ----------------------------

  it('returns rate limit response when rate limit is exceeded', async () => {
    const rateLimitResponse = NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many checkout attempts.',
        },
      },
      { status: 429 }
    );
    mockCheckAndEnforceRateLimit.mockReturnValue(rateLimitResponse);

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  // ----------------------------
  // 4. Email validation
  // ----------------------------

  it('returns 400 when user has no email', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: null,
    });

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('EMAIL_REQUIRED');
  });

  it('returns 400 when user email is empty string', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: '',
    });

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('EMAIL_REQUIRED');
  });

  // ----------------------------
  // 5. Course validation
  // ----------------------------

  it('returns 404 when course does not exist', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('queries only published courses', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    await POST(createCheckoutRequest(), createParams('course-abc'));

    expect(db.course.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'course-abc',
          isPublished: true,
        },
      })
    );
  });

  // ----------------------------
  // 6. Free course rejection
  // ----------------------------

  it('returns 400 when course is free (isFree flag)', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Free Course',
      description: 'A free course',
      price: 0,
      isFree: true,
    });

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('FREE_COURSE');
    expect(body.error.message).toContain('enroll endpoint');
  });

  it('returns 400 when course has no price', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'No Price Course',
      description: null,
      price: null,
      isFree: false,
    });

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('FREE_COURSE');
  });

  it('returns 400 when course price is zero', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Zero Price',
      description: 'A course',
      price: 0,
      isFree: false,
    });

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('FREE_COURSE');
  });

  it('returns 400 when course price is negative', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Negative Price',
      description: 'A course',
      price: -10,
      isFree: false,
    });

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('FREE_COURSE');
  });

  // ----------------------------
  // 7. Duplicate enrollment
  // ----------------------------

  it('returns 409 when user is already enrolled', async () => {
    (db.enrollment.findUnique as jest.Mock).mockResolvedValue({
      id: 'enroll-existing',
      userId: 'user-1',
      courseId: 'course-1',
    });

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe('ALREADY_ENROLLED');
  });

  it('checks enrollment with correct userId and courseId', async () => {
    await POST(createCheckoutRequest('course-xyz'), createParams('course-xyz'));

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

  // ----------------------------
  // 8. Fraud detection
  // ----------------------------

  it('returns 403 when fraud check fails', async () => {
    mockCheckPaymentFraud.mockResolvedValue({
      allowed: false,
      riskScore: 75,
      flags: ['HIGH_FAILURE_RATE', 'NEW_ACCOUNT'],
      details: {},
    });

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('CHECKOUT_BLOCKED');
  });

  it('passes IP address to fraud check from x-forwarded-for', async () => {
    await POST(createCheckoutRequest(), createParams());

    expect(mockCheckPaymentFraud).toHaveBeenCalledWith(
      'user-1',
      'course-1',
      '127.0.0.1'
    );
  });

  // ----------------------------
  // 9. Stripe customer handling
  // ----------------------------

  it('creates new Stripe customer when none exists', async () => {
    (db.stripeCustomer.findUnique as jest.Mock).mockResolvedValue(null);

    await POST(createCheckoutRequest(), createParams());

    expect(stripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        metadata: { userId: 'user-1' },
      })
    );

    expect(db.stripeCustomer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: 'user-1',
          stripeCustomerId: 'cus_new_123',
        },
      })
    );
  });

  it('uses existing Stripe customer when one exists', async () => {
    (db.stripeCustomer.findUnique as jest.Mock).mockResolvedValue({
      stripeCustomerId: 'cus_existing_456',
    });

    await POST(createCheckoutRequest(), createParams());

    expect(stripe.customers.create).not.toHaveBeenCalled();
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing_456',
      })
    );
  });

  // ----------------------------
  // 10. Checkout session creation
  // ----------------------------

  it('creates checkout session with correct line items', async () => {
    await POST(createCheckoutRequest(), createParams());

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'USD',
              product_data: {
                name: 'Advanced TypeScript',
                description: 'Learn TypeScript deeply',
              },
              unit_amount: 4999, // 49.99 * 100
            },
          },
        ],
      })
    );
  });

  it('uses course title as fallback description when description is null', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'My Course',
      description: null,
      price: 29.99,
      isFree: false,
    });

    await POST(createCheckoutRequest(), createParams());

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              product_data: expect.objectContaining({
                description: 'Access to My Course',
              }),
            }),
          }),
        ],
      })
    );
  });

  it('includes metadata in checkout session', async () => {
    await POST(createCheckoutRequest(), createParams());

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          courseId: 'course-1',
          userId: 'user-1',
          courseTitle: 'Advanced TypeScript',
        }),
      })
    );
  });

  it('includes payment_intent_data metadata', async () => {
    await POST(createCheckoutRequest(), createParams());

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent_data: {
          metadata: {
            courseId: 'course-1',
            userId: 'user-1',
          },
        },
      })
    );
  });

  it('sets correct success and cancel URLs', async () => {
    await POST(createCheckoutRequest(), createParams());

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        success_url: expect.stringContaining('/courses/course-1/success'),
        cancel_url: expect.stringContaining('/courses/course-1?canceled=1'),
      })
    );
  });

  // ----------------------------
  // 11. Successful response
  // ----------------------------

  it('returns success response with session url and id', async () => {
    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.url).toBe(
      'https://checkout.stripe.com/pay/cs_test_session_123'
    );
    expect(body.data.sessionId).toBe('cs_test_session_123');
  });

  it('includes rate limit headers in successful response', async () => {
    const res = await POST(createCheckoutRequest(), createParams());

    // Verify createRateLimitHeaders was called
    expect(mockCheckPaymentRateLimit).toHaveBeenCalled();
    expect(mockCreateRateLimitHeaders).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  // ----------------------------
  // 12. Error handling
  // ----------------------------

  it('returns 500 on unexpected database error', async () => {
    (db.course.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database connection lost')
    );

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('returns 500 on Stripe API error', async () => {
    (stripe.checkout.sessions.create as jest.Mock).mockRejectedValue(
      new Error('Stripe API down')
    );

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('returns 500 when Stripe customer creation fails', async () => {
    (stripe.customers.create as jest.Mock).mockRejectedValue(
      new Error('Invalid customer data')
    );

    const res = await POST(createCheckoutRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  // ----------------------------
  // 13. Edge cases
  // ----------------------------

  it('rounds price correctly to cents for Stripe', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Rounding Course',
      description: 'Test rounding',
      price: 19.995,
      isFree: false,
    });

    await POST(createCheckoutRequest(), createParams());

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 2000, // Math.round(19.995 * 100)
            }),
          }),
        ],
      })
    );
  });

  it('passes user name to Stripe customer when available', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    });

    await POST(createCheckoutRequest(), createParams());

    expect(stripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John Doe',
      })
    );
  });

  it('passes undefined for name when user name is null', async () => {
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: null,
      email: 'noname@example.com',
    });

    await POST(createCheckoutRequest(), createParams());

    expect(stripe.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: undefined,
      })
    );
  });
});
