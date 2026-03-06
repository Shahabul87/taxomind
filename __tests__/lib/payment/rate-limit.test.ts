/**
 * Tests for lib/payment/rate-limit.ts - Payment Rate Limiting
 *
 * Covers: paymentRateLimitPresets, checkPaymentRateLimit,
 *         createRateLimitHeaders, createRateLimitErrorResponse,
 *         checkAndEnforceRateLimit, getRateLimitStatus
 *
 * Security-critical: These tests verify that rate limiting correctly
 * prevents abuse of payment endpoints while allowing legitimate users
 * to complete purchases.
 */

import { NextRequest, NextResponse } from "next/server";

import {
  checkPaymentRateLimit,
  createRateLimitHeaders,
  createRateLimitErrorResponse,
  checkAndEnforceRateLimit,
  getRateLimitStatus,
  paymentRateLimitPresets,
  type PaymentRateLimitConfig,
  type RateLimitResult,
} from "@/lib/payment/rate-limit";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Counter used to generate unique keys per test so that the module-level
 * in-memory Map does not cause cross-test pollution.
 */
let testIdCounter = 0;

function uniqueUserId(): string {
  testIdCounter += 1;
  return `test-user-${testIdCounter}-${Date.now()}`;
}

function uniqueIp(): string {
  testIdCounter += 1;
  // Generate IPs in the 10.x.y.z range using the counter to avoid collisions
  const a = (testIdCounter >> 16) & 255;
  const b = (testIdCounter >> 8) & 255;
  const c = testIdCounter & 255;
  return `10.${a}.${b}.${c}`;
}

/**
 * Create a NextRequest suitable for rate-limit testing.
 * The jest.setup.js mock provides a custom NextRequest class that stores
 * headers in a Map.
 */
function createTestRequest(
  url = "http://localhost:3000/api/payment/checkout",
  options: {
    ip?: string;
    method?: string;
  } = {}
): NextRequest {
  const ip = options.ip ?? uniqueIp();
  return new NextRequest(url, {
    method: options.method ?? "POST",
    headers: { "x-forwarded-for": ip },
  }) as NextRequest;
}

/**
 * Create a config with a unique keyGenerator to isolate each test from others
 * that might share the same module-level Map.
 */
function createIsolatedConfig(
  overrides: Partial<PaymentRateLimitConfig> = {}
): PaymentRateLimitConfig {
  const baseKey = uniqueUserId();
  return {
    maxRequests: 5,
    windowMs: 60000,
    message: "Rate limited",
    includeHeaders: true,
    keyGenerator: (_req: NextRequest, userId?: string) =>
      `isolated:${baseKey}:${userId ?? "anon"}`,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Payment Rate Limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Preset configurations
  // =========================================================================

  describe("paymentRateLimitPresets", () => {
    describe("courseCheckout preset", () => {
      it("allows 20 requests per minute", () => {
        expect(paymentRateLimitPresets.courseCheckout.maxRequests).toBe(20);
      });

      it("uses a 60-second (1 minute) window", () => {
        expect(paymentRateLimitPresets.courseCheckout.windowMs).toBe(60000);
      });

      it("includes a human-readable error message", () => {
        expect(paymentRateLimitPresets.courseCheckout.message).toBeDefined();
        expect(
          typeof paymentRateLimitPresets.courseCheckout.message
        ).toBe("string");
        expect(
          paymentRateLimitPresets.courseCheckout.message!.length
        ).toBeGreaterThan(0);
      });

      it("has includeHeaders set to true", () => {
        expect(paymentRateLimitPresets.courseCheckout.includeHeaders).toBe(
          true
        );
      });
    });

    describe("subscriptionCheckout preset", () => {
      it("allows 15 requests per minute", () => {
        expect(paymentRateLimitPresets.subscriptionCheckout.maxRequests).toBe(
          15
        );
      });

      it("uses a 60-second window", () => {
        expect(paymentRateLimitPresets.subscriptionCheckout.windowMs).toBe(
          60000
        );
      });

      it("includes a human-readable error message", () => {
        expect(
          paymentRateLimitPresets.subscriptionCheckout.message
        ).toBeDefined();
        expect(
          paymentRateLimitPresets.subscriptionCheckout.message!.length
        ).toBeGreaterThan(0);
      });

      it("has includeHeaders set to true", () => {
        expect(
          paymentRateLimitPresets.subscriptionCheckout.includeHeaders
        ).toBe(true);
      });
    });

    describe("freeEnrollment preset", () => {
      it("allows 30 requests per minute (more lenient for free actions)", () => {
        expect(paymentRateLimitPresets.freeEnrollment.maxRequests).toBe(30);
      });

      it("uses a 60-second window", () => {
        expect(paymentRateLimitPresets.freeEnrollment.windowMs).toBe(60000);
      });

      it("includes a human-readable error message", () => {
        expect(paymentRateLimitPresets.freeEnrollment.message).toBeDefined();
        expect(
          paymentRateLimitPresets.freeEnrollment.message!.length
        ).toBeGreaterThan(0);
      });

      it("has includeHeaders set to true", () => {
        expect(paymentRateLimitPresets.freeEnrollment.includeHeaders).toBe(
          true
        );
      });
    });

    describe("subscriptionManagement preset", () => {
      it("allows 20 requests per minute", () => {
        expect(
          paymentRateLimitPresets.subscriptionManagement.maxRequests
        ).toBe(20);
      });

      it("has includeHeaders set to true", () => {
        expect(
          paymentRateLimitPresets.subscriptionManagement.includeHeaders
        ).toBe(true);
      });
    });

    describe("security ordering", () => {
      it("subscriptionCheckout is more restrictive than courseCheckout", () => {
        expect(
          paymentRateLimitPresets.subscriptionCheckout.maxRequests
        ).toBeLessThan(paymentRateLimitPresets.courseCheckout.maxRequests);
      });

      it("freeEnrollment is more lenient than courseCheckout", () => {
        expect(
          paymentRateLimitPresets.freeEnrollment.maxRequests
        ).toBeGreaterThan(paymentRateLimitPresets.courseCheckout.maxRequests);
      });
    });
  });

  // =========================================================================
  // checkPaymentRateLimit
  // =========================================================================

  describe("checkPaymentRateLimit", () => {
    describe("basic request counting", () => {
      it("allows the first request and returns correct remaining count", () => {
        const config = createIsolatedConfig({ maxRequests: 5 });
        const req = createTestRequest();

        const result = checkPaymentRateLimit(req, config, uniqueUserId());

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4); // maxRequests - 1
        expect(result.limit).toBe(5);
      });

      it("allows requests up to the maxRequests limit", () => {
        const userId = uniqueUserId();
        const config = createIsolatedConfig({ maxRequests: 3 });
        const req = createTestRequest();

        // First 3 requests should all be allowed
        for (let i = 0; i < 3; i++) {
          const result = checkPaymentRateLimit(req, config, userId);
          expect(result.allowed).toBe(true);
          expect(result.remaining).toBe(2 - i);
        }
      });

      it("blocks the request that exceeds maxRequests", () => {
        const userId = uniqueUserId();
        const config = createIsolatedConfig({ maxRequests: 3 });
        const req = createTestRequest();

        // Consume all 3 allowed requests
        for (let i = 0; i < 3; i++) {
          checkPaymentRateLimit(req, config, userId);
        }

        // 4th request should be blocked (count 4 > maxRequests 3)
        const blocked = checkPaymentRateLimit(req, config, userId);
        expect(blocked.allowed).toBe(false);
        expect(blocked.remaining).toBe(0);
      });

      it("returns remaining=0 when blocked (never negative)", () => {
        const userId = uniqueUserId();
        const config = createIsolatedConfig({ maxRequests: 1 });
        const req = createTestRequest();

        // Use the single allowed request
        checkPaymentRateLimit(req, config, userId);

        // Blocked request
        const blocked = checkPaymentRateLimit(req, config, userId);
        expect(blocked.remaining).toBe(0);

        // Even more requests still show 0 remaining
        const moreBlocked = checkPaymentRateLimit(req, config, userId);
        expect(moreBlocked.remaining).toBe(0);
      });
    });

    describe("rate limit headers", () => {
      it("returns the correct limit value in the result", () => {
        const config = createIsolatedConfig({ maxRequests: 20 });
        const req = createTestRequest();

        const result = checkPaymentRateLimit(req, config, uniqueUserId());

        expect(result.limit).toBe(20);
      });

      it("returns a resetTime in the future", () => {
        const config = createIsolatedConfig({ windowMs: 60000 });
        const req = createTestRequest();
        const before = Date.now();

        const result = checkPaymentRateLimit(req, config, uniqueUserId());

        expect(result.resetTime.getTime()).toBeGreaterThanOrEqual(before);
        expect(result.resetTime.getTime()).toBeLessThanOrEqual(
          Date.now() + 60000 + 100 // small tolerance
        );
      });

      it("includes retryAfter when request is blocked", () => {
        const userId = uniqueUserId();
        const config = createIsolatedConfig({
          maxRequests: 1,
          windowMs: 60000,
        });
        const req = createTestRequest();

        // Use the one allowed request
        checkPaymentRateLimit(req, config, userId);

        // Blocked
        const blocked = checkPaymentRateLimit(req, config, userId);
        expect(blocked.retryAfter).toBeDefined();
        expect(blocked.retryAfter).toBeGreaterThan(0);
      });

      it("does not include retryAfter for allowed requests", () => {
        const config = createIsolatedConfig({ maxRequests: 10 });
        const req = createTestRequest();

        const result = checkPaymentRateLimit(req, config, uniqueUserId());

        expect(result.retryAfter).toBeUndefined();
      });
    });

    describe("window expiration", () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it("resets the count after the window expires", () => {
        const userId = uniqueUserId();
        const config = createIsolatedConfig({
          maxRequests: 2,
          windowMs: 5000,
        });
        const req = createTestRequest();

        // Use both allowed requests
        checkPaymentRateLimit(req, config, userId);
        checkPaymentRateLimit(req, config, userId);

        // Should be blocked now
        const blocked = checkPaymentRateLimit(req, config, userId);
        expect(blocked.allowed).toBe(false);

        // Advance time past the window
        jest.advanceTimersByTime(6000);

        // Should be allowed again
        const afterReset = checkPaymentRateLimit(req, config, userId);
        expect(afterReset.allowed).toBe(true);
        expect(afterReset.remaining).toBe(1); // maxRequests - 1
      });
    });

    describe("key generation", () => {
      it("uses userId + IP as default key (different users are independent)", () => {
        const config: PaymentRateLimitConfig = {
          maxRequests: 1,
          windowMs: 60000,
        };
        const ip = uniqueIp();
        const req = createTestRequest("http://localhost:3000/api/checkout", {
          ip,
        });

        const user1 = uniqueUserId();
        const user2 = uniqueUserId();

        // User 1 uses their single request
        checkPaymentRateLimit(req, config, user1);

        // User 2 should still be allowed (different key)
        const result = checkPaymentRateLimit(req, config, user2);
        expect(result.allowed).toBe(true);
      });

      it("uses custom keyGenerator when provided in config", () => {
        const customKey = `custom-key-${Date.now()}`;
        const config: PaymentRateLimitConfig = {
          maxRequests: 1,
          windowMs: 60000,
          keyGenerator: () => customKey,
        };
        const req = createTestRequest();

        // First request allowed
        const first = checkPaymentRateLimit(req, config, uniqueUserId());
        expect(first.allowed).toBe(true);

        // Second request with DIFFERENT userId but same custom key should be blocked
        const second = checkPaymentRateLimit(req, config, uniqueUserId());
        expect(second.allowed).toBe(false);
      });
    });

    describe("logging", () => {
      it("logs a warning when a request is blocked", () => {
        const userId = uniqueUserId();
        const config = createIsolatedConfig({ maxRequests: 1 });
        const req = createTestRequest();

        // Use the one allowed request
        checkPaymentRateLimit(req, config, userId);

        // Blocked request triggers logging
        checkPaymentRateLimit(req, config, userId);

        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining("PAYMENT_RATE_LIMIT")
        );
      });

      it("does not log for allowed requests", () => {
        const config = createIsolatedConfig({ maxRequests: 10 });
        const req = createTestRequest();

        checkPaymentRateLimit(req, config, uniqueUserId());

        expect(logger.warn).not.toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // createRateLimitHeaders
  // =========================================================================

  describe("createRateLimitHeaders", () => {
    it("returns X-RateLimit-Limit header with the limit value", () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 9,
        limit: 10,
        resetTime: new Date(1700000000000),
      };

      const headers = createRateLimitHeaders(result);

      expect(headers["X-RateLimit-Limit"]).toBe("10");
    });

    it("returns X-RateLimit-Remaining header with the remaining count", () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 5,
        limit: 10,
        resetTime: new Date(1700000000000),
      };

      const headers = createRateLimitHeaders(result);

      expect(headers["X-RateLimit-Remaining"]).toBe("5");
    });

    it("returns X-RateLimit-Reset header as Unix timestamp in seconds", () => {
      const resetTime = new Date(1700000000000); // Known timestamp
      const result: RateLimitResult = {
        allowed: true,
        remaining: 5,
        limit: 10,
        resetTime,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers["X-RateLimit-Reset"]).toBe(
        Math.ceil(resetTime.getTime() / 1000).toString()
      );
    });

    it("includes Retry-After header when retryAfter is present", () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: 10,
        resetTime: new Date(),
        retryAfter: 45,
      };

      const headers = createRateLimitHeaders(result);

      expect(headers["Retry-After"]).toBe("45");
    });

    it("does not include Retry-After header when retryAfter is undefined", () => {
      const result: RateLimitResult = {
        allowed: true,
        remaining: 5,
        limit: 10,
        resetTime: new Date(),
      };

      const headers = createRateLimitHeaders(result);

      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("returns string values for all headers (HTTP compliance)", () => {
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: 100,
        resetTime: new Date(),
        retryAfter: 30,
      };

      const headers = createRateLimitHeaders(result);

      for (const [, value] of Object.entries(headers)) {
        expect(typeof value).toBe("string");
      }
    });
  });

  // =========================================================================
  // createRateLimitErrorResponse
  // =========================================================================

  describe("createRateLimitErrorResponse", () => {
    const blockedResult: RateLimitResult = {
      allowed: false,
      remaining: 0,
      limit: 20,
      resetTime: new Date(Date.now() + 30000),
      retryAfter: 30,
    };

    it("returns a response with 429 status code", () => {
      const config = paymentRateLimitPresets.courseCheckout;
      const response = createRateLimitErrorResponse(config, blockedResult);

      expect(response.status).toBe(429);
    });

    it("includes the custom error message from config", async () => {
      const config: PaymentRateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
        message: "Custom rate limit message",
        includeHeaders: true,
      };

      const response = createRateLimitErrorResponse(config, blockedResult);
      const body = await response.json();

      expect(body.error.message).toBe("Custom rate limit message");
    });

    it("uses a default message when config message is undefined", async () => {
      const config: PaymentRateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
        includeHeaders: true,
      };

      const response = createRateLimitErrorResponse(config, blockedResult);
      const body = await response.json();

      expect(body.error.message).toBe(
        "Too many requests. Please try again later."
      );
    });

    it("returns success=false in the response body", async () => {
      const config = paymentRateLimitPresets.courseCheckout;
      const response = createRateLimitErrorResponse(config, blockedResult);
      const body = await response.json();

      expect(body.success).toBe(false);
    });

    it("includes RATE_LIMIT_EXCEEDED error code", async () => {
      const config = paymentRateLimitPresets.courseCheckout;
      const response = createRateLimitErrorResponse(config, blockedResult);
      const body = await response.json();

      expect(body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("includes retryAfter in the response body", async () => {
      const config = paymentRateLimitPresets.courseCheckout;
      const response = createRateLimitErrorResponse(config, blockedResult);
      const body = await response.json();

      expect(body.error.retryAfter).toBe(30);
    });

    it("includes rate limit headers when config.includeHeaders is true", () => {
      const config: PaymentRateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
        includeHeaders: true,
      };

      const response = createRateLimitErrorResponse(config, blockedResult);

      // The mock NextResponse stores headers in a Map
      expect(response.headers.get("X-RateLimit-Limit")).toBe("20");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();
      expect(response.headers.get("Retry-After")).toBe("30");
    });

    it("omits rate limit headers when config.includeHeaders is false", () => {
      const config: PaymentRateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
        includeHeaders: false,
      };

      const response = createRateLimitErrorResponse(config, blockedResult);

      expect(response.headers.get("X-RateLimit-Limit")).toBeUndefined();
      expect(response.headers.get("Retry-After")).toBeUndefined();
    });
  });

  // =========================================================================
  // checkAndEnforceRateLimit
  // =========================================================================

  describe("checkAndEnforceRateLimit", () => {
    it("returns null when the request is allowed", () => {
      const config = createIsolatedConfig({ maxRequests: 10 });
      const req = createTestRequest();

      const result = checkAndEnforceRateLimit(req, config, uniqueUserId());

      expect(result).toBeNull();
    });

    it("returns a NextResponse with status 429 when rate limited", () => {
      const userId = uniqueUserId();
      const config = createIsolatedConfig({ maxRequests: 1 });
      const req = createTestRequest();

      // Use the one allowed request
      checkAndEnforceRateLimit(req, config, userId);

      // Should return a 429 response now
      const response = checkAndEnforceRateLimit(req, config, userId);

      expect(response).not.toBeNull();
      expect(response!.status).toBe(429);
    });

    it("can be used in a guard clause pattern (early return on rate limit)", () => {
      const userId = uniqueUserId();
      const config = createIsolatedConfig({ maxRequests: 1 });
      const req = createTestRequest();

      // Simulate the guard clause pattern:
      // const rateLimitResult = checkAndEnforceRateLimit(req, config, userId);
      // if (rateLimitResult) return rateLimitResult;

      // First call - allowed
      const firstCheck = checkAndEnforceRateLimit(req, config, userId);
      expect(firstCheck).toBeNull(); // No early return needed

      // Second call - blocked
      const secondCheck = checkAndEnforceRateLimit(req, config, userId);
      expect(secondCheck).not.toBeNull(); // Would trigger early return
    });
  });

  // =========================================================================
  // getRateLimitStatus
  // =========================================================================

  describe("getRateLimitStatus", () => {
    it("returns full quota for a user with no prior requests", () => {
      const config = createIsolatedConfig({ maxRequests: 10, windowMs: 60000 });
      const req = createTestRequest();
      const userId = uniqueUserId();

      const status = getRateLimitStatus(req, config, userId);

      expect(status.allowed).toBe(true);
      expect(status.remaining).toBe(10);
      expect(status.limit).toBe(10);
      expect(status.key).toBeDefined();
    });

    it("reflects the correct remaining count after some requests", () => {
      const userId = uniqueUserId();
      const config = createIsolatedConfig({ maxRequests: 5 });
      const req = createTestRequest();

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        checkPaymentRateLimit(req, config, userId);
      }

      const status = getRateLimitStatus(req, config, userId);

      // getRateLimitStatus uses >= for blocked check, while checkPaymentRateLimit
      // uses > for blocked check. After 3 requests with maxRequests=5:
      // count=3, remaining = max(0, 5-3) = 2
      expect(status.remaining).toBe(2);
      expect(status.allowed).toBe(true);
    });

    it("returns the key used for rate limiting", () => {
      const userId = uniqueUserId();
      const config = createIsolatedConfig({ maxRequests: 5 });
      const req = createTestRequest();

      const status = getRateLimitStatus(req, config, userId);

      expect(typeof status.key).toBe("string");
      expect(status.key.length).toBeGreaterThan(0);
    });

    it("includes retryAfter when the user is rate limited", () => {
      const userId = uniqueUserId();
      const config = createIsolatedConfig({
        maxRequests: 1,
        windowMs: 60000,
      });
      const req = createTestRequest();

      // Use the one allowed request
      checkPaymentRateLimit(req, config, userId);

      // getRateLimitStatus should show blocked state
      // Note: getRateLimitStatus uses count >= maxRequests for blocked,
      // while checkPaymentRateLimit uses count > maxRequests.
      // After 1 request with maxRequests=1: count=1, 1 >= 1 = blocked in getRateLimitStatus
      const status = getRateLimitStatus(req, config, userId);

      expect(status.allowed).toBe(false);
      expect(status.retryAfter).toBeDefined();
      expect(status.retryAfter).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Security invariants
  // =========================================================================

  describe("security invariants", () => {
    it("remaining count is never negative in RateLimitResult", () => {
      const userId = uniqueUserId();
      const config = createIsolatedConfig({ maxRequests: 1 });
      const req = createTestRequest();

      // Exceed the limit
      checkPaymentRateLimit(req, config, userId);
      checkPaymentRateLimit(req, config, userId);
      checkPaymentRateLimit(req, config, userId);

      const result = checkPaymentRateLimit(req, config, userId);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it("blocked requests always have retryAfter > 0", () => {
      const userId = uniqueUserId();
      const config = createIsolatedConfig({
        maxRequests: 1,
        windowMs: 60000,
      });
      const req = createTestRequest();

      // Use allowed request
      checkPaymentRateLimit(req, config, userId);

      // Blocked
      const blocked = checkPaymentRateLimit(req, config, userId);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfter).toBeGreaterThan(0);
    });

    it("rate limit applies consistently regardless of request headers variation", () => {
      const userId = uniqueUserId();
      const config = createIsolatedConfig({ maxRequests: 2 });

      // Different request objects but same key (via custom keyGenerator)
      const req1 = createTestRequest(
        "http://localhost:3000/api/checkout",
        { ip: "1.1.1.1" }
      );
      const req2 = createTestRequest(
        "http://localhost:3000/api/checkout",
        { ip: "2.2.2.2" }
      );

      // Both requests use the same isolated key (via keyGenerator)
      checkPaymentRateLimit(req1, config, userId);
      checkPaymentRateLimit(req2, config, userId);

      // Third request should be blocked regardless of IP
      const blocked = checkPaymentRateLimit(req1, config, userId);
      expect(blocked.allowed).toBe(false);
    });

    it("result always contains well-formed fields", () => {
      const config = createIsolatedConfig({ maxRequests: 5 });
      const req = createTestRequest();

      const result = checkPaymentRateLimit(req, config, uniqueUserId());

      expect(typeof result.allowed).toBe("boolean");
      expect(typeof result.remaining).toBe("number");
      expect(typeof result.limit).toBe("number");
      expect(result.resetTime).toBeInstanceOf(Date);
      expect(Number.isFinite(result.remaining)).toBe(true);
      expect(Number.isFinite(result.limit)).toBe(true);
    });

    it("error response always returns valid JSON with required fields", async () => {
      const config = paymentRateLimitPresets.subscriptionCheckout;
      const result: RateLimitResult = {
        allowed: false,
        remaining: 0,
        limit: 15,
        resetTime: new Date(),
        retryAfter: 55,
      };

      const response = createRateLimitErrorResponse(config, result);
      const body = await response.json();

      // Verify response structure matches ApiResponse contract
      expect(body).toHaveProperty("success", false);
      expect(body).toHaveProperty("error");
      expect(body.error).toHaveProperty("code");
      expect(body.error).toHaveProperty("message");
      expect(typeof body.error.code).toBe("string");
      expect(typeof body.error.message).toBe("string");
    });
  });

  // =========================================================================
  // Edge cases
  // =========================================================================

  describe("edge cases", () => {
    it("handles maxRequests of 0 (blocks immediately on second request)", () => {
      const userId = uniqueUserId();
      const config = createIsolatedConfig({ maxRequests: 0 });
      const req = createTestRequest();

      // First request creates the entry with count=1
      // count(1) > maxRequests(0) is true only after the first request
      // Actually, first request: count=1, entry is new so it returns allowed
      const first = checkPaymentRateLimit(req, config, userId);
      // First request always passes as it initializes the entry
      expect(first.allowed).toBe(true);

      // Second request: count=2 > 0, blocked
      const second = checkPaymentRateLimit(req, config, userId);
      expect(second.allowed).toBe(false);
    });

    it("handles very large maxRequests value", () => {
      const config = createIsolatedConfig({ maxRequests: 1000000 });
      const req = createTestRequest();

      const result = checkPaymentRateLimit(req, config, uniqueUserId());

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999999);
      expect(result.limit).toBe(1000000);
    });

    it("handles anonymous requests (no userId)", () => {
      const config: PaymentRateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
      };
      const ip = uniqueIp();
      const req = createTestRequest("http://localhost:3000/api/checkout", {
        ip,
      });

      // No userId provided
      const result = checkPaymentRateLimit(req, config);

      expect(result.allowed).toBe(true);
      // The default key generator should use "payment:anon:<ip>"
    });

    it("handles requests without x-forwarded-for header", () => {
      const config: PaymentRateLimitConfig = {
        maxRequests: 5,
        windowMs: 60000,
      };

      // Create request without IP headers
      const req = new NextRequest(
        "http://localhost:3000/api/checkout",
        {
          method: "POST",
          headers: {},
        }
      ) as NextRequest;

      // Should not throw even without IP headers
      const result = checkPaymentRateLimit(req, config, uniqueUserId());
      expect(result.allowed).toBe(true);
    });
  });

  // =========================================================================
  // Integration: presets with checkPaymentRateLimit
  // =========================================================================

  describe("presets used with checkPaymentRateLimit", () => {
    it("courseCheckout preset allows 20 requests before blocking", () => {
      const userId = uniqueUserId();
      const ip = uniqueIp();
      // Use a custom keyGenerator to isolate from other tests
      const config: PaymentRateLimitConfig = {
        ...paymentRateLimitPresets.courseCheckout,
        keyGenerator: () => `preset-test-course-${userId}`,
      };
      const req = createTestRequest(
        "http://localhost:3000/api/courses/checkout",
        { ip }
      );

      // Make 20 allowed requests
      for (let i = 0; i < 20; i++) {
        const result = checkPaymentRateLimit(req, config, userId);
        expect(result.allowed).toBe(true);
      }

      // 21st should be blocked
      const blocked = checkPaymentRateLimit(req, config, userId);
      expect(blocked.allowed).toBe(false);
    });

    it("subscriptionCheckout preset allows 15 requests before blocking", () => {
      const userId = uniqueUserId();
      const config: PaymentRateLimitConfig = {
        ...paymentRateLimitPresets.subscriptionCheckout,
        keyGenerator: () => `preset-test-sub-${userId}`,
      };
      const req = createTestRequest(
        "http://localhost:3000/api/subscription/checkout"
      );

      for (let i = 0; i < 15; i++) {
        const result = checkPaymentRateLimit(req, config, userId);
        expect(result.allowed).toBe(true);
      }

      const blocked = checkPaymentRateLimit(req, config, userId);
      expect(blocked.allowed).toBe(false);
    });

    it("freeEnrollment preset allows 30 requests before blocking", () => {
      const userId = uniqueUserId();
      const config: PaymentRateLimitConfig = {
        ...paymentRateLimitPresets.freeEnrollment,
        keyGenerator: () => `preset-test-free-${userId}`,
      };
      const req = createTestRequest(
        "http://localhost:3000/api/courses/enroll"
      );

      for (let i = 0; i < 30; i++) {
        const result = checkPaymentRateLimit(req, config, userId);
        expect(result.allowed).toBe(true);
      }

      const blocked = checkPaymentRateLimit(req, config, userId);
      expect(blocked.allowed).toBe(false);
    });
  });
});
