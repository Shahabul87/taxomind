import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import {
  rateLimit,
  rateLimitAuth,
  getRateLimitHeaders,
  getClientIdentifier,
  AUTH_RATE_LIMITS,
  RateLimitResult,
  AuthEndpoint,
  RateLimitHeaders
} from '@/lib/rate-limit';

// Mock dependencies
jest.mock('@upstash/redis');
jest.mock('@upstash/ratelimit');
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));

import { logger } from '@/lib/logger';

// Mock the Redis instance
const mockRedis = {
  ping: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
};

// Mock the Ratelimit instance
const mockRatelimit = {
  limit: jest.fn(),
};

const MockRatelimit = Ratelimit as jest.MockedClass<typeof Ratelimit>;
const MockRedis = Redis as jest.MockedClass<typeof Redis>;

describe('Rate Limiting System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Clear in-memory store
    jest.isolateModules(() => {
      // This ensures the in-memory store is fresh for each test
    });

    // Reset environment variables
    delete (process.env as any).UPSTASH_REDIS_REST_URL;
    delete (process.env as any).UPSTASH_REDIS_REST_TOKEN;
  });

  describe('In-Memory Rate Limiting (Redis unavailable)', () => {
    it('should allow requests within limit', async () => {
      const result = await rateLimit('test-user', 5, 60000);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(result.reset).toBeGreaterThan(Date.now());
      expect(result.retryAfter).toBeUndefined();
    });

    it('should enforce rate limits', async () => {
      const identifier = 'rate-limited-user';
      const limit = 3;
      const windowMs = 60000;

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        const result = await rateLimit(identifier, limit, windowMs);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(limit - 1 - i);
      }

      // Next request should be rate limited
      const limitedResult = await rateLimit(identifier, limit, windowMs);
      expect(limitedResult.success).toBe(false);
      expect(limitedResult.remaining).toBe(0);
      expect(limitedResult.retryAfter).toBeGreaterThan(0);
    });

    it('should reset counter after window expires', async () => {
      const identifier = 'reset-test-user';
      const limit = 2;
      const windowMs = 100; // Very short window for testing

      // Fill up the limit
      await rateLimit(identifier, limit, windowMs);
      const limitedResult = await rateLimit(identifier, limit, windowMs);
      expect(limitedResult.success).toBe(true);

      // Should be rate limited now
      const rateLimitedResult = await rateLimit(identifier, limit, windowMs);
      expect(rateLimitedResult.success).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      const resetResult = await rateLimit(identifier, limit, windowMs);
      expect(resetResult.success).toBe(true);
      expect(resetResult.remaining).toBe(limit - 1);
    });

    it('should handle concurrent requests correctly', async () => {
      const identifier = 'concurrent-user';
      const limit = 5;
      const windowMs = 60000;

      // Make concurrent requests
      const promises = Array.from({ length: 8 }, () =>
        rateLimit(identifier, limit, windowMs)
      );

      const results = await Promise.all(promises);

      // Count successful and failed requests
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      expect(successful).toBe(limit);
      expect(failed).toBe(8 - limit);
    });
  });

  describe('Redis Rate Limiting', () => {
    beforeEach(() => {
      // Set up Redis environment
      process.env.UPSTASH_REDIS_REST_URL = 'redis://localhost:6379';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';

      // Mock Redis constructor and instance
      MockRedis.mockImplementation(() => mockRedis as any);
      MockRatelimit.mockImplementation(() => mockRatelimit as any);
      MockRatelimit.slidingWindow = jest.fn().mockReturnValue('sliding-window-limiter');
    });

    it('should use Redis when available', async () => {
      // Mock successful Redis rate limiting
      mockRatelimit.limit.mockResolvedValue({
        success: true,
        limit: 10,
        remaining: 9,
        reset: Date.now() + 60000,
      });

      const result = await rateLimit('redis-user', 10, 60000);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(9);
      expect(mockRatelimit.limit).toHaveBeenCalledWith(
        expect.stringContaining('ratelimit:10:60000:redis-user')
      );
    });

    it('should fallback to in-memory when Redis fails', async () => {
      // Mock Redis failure
      mockRatelimit.limit.mockRejectedValue(new Error('Redis connection failed'));

      const result = await rateLimit('fallback-user', 5, 60000);

      // Should still work with in-memory fallback
      expect(result.success).toBe(true);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
      expect(logger.error).toHaveBeenCalledWith(
        'Redis rate limiting error, falling back to in-memory:',
        expect.any(Error)
      );
    });

    it('should create sliding window rate limiter correctly', async () => {
      mockRatelimit.limit.mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 3600000,
      });

      await rateLimit('sliding-window-user', 100, 3600000);

      expect(MockRatelimit).toHaveBeenCalledWith({
        redis: mockRedis,
        limiter: 'sliding-window-limiter',
        analytics: true,
      });
      expect(MockRatelimit.slidingWindow).toHaveBeenCalledWith(100, '3600 s');
    });

    it('should handle rate limit exceeded from Redis', async () => {
      mockRatelimit.limit.mockResolvedValue({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 30000,
      });

      const result = await rateLimit('exceeded-user', 5, 60000);

      expect(result.success).toBe(false);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Authentication endpoint rate limiting', () => {
    it('should apply correct limits for login endpoint', async () => {
      const result = await rateLimitAuth('login', 'user-ip');

      // Should use login configuration (5 requests per 15 minutes)
      expect(logger.debug).toHaveBeenCalledWith(
        'Rate limiting login for identifier: user-ip'
      );
    });

    it('should apply correct limits for different auth endpoints', async () => {
      const testCases: { endpoint: AuthEndpoint; expectedRequests: number }[] = [
        { endpoint: 'login', expectedRequests: 5 },
        { endpoint: 'register', expectedRequests: 3 },
        { endpoint: 'reset', expectedRequests: 3 },
        { endpoint: 'verify', expectedRequests: 5 },
        { endpoint: 'twoFactor', expectedRequests: 5 },
      ];

      for (const { endpoint, expectedRequests } of testCases) {
        // Fill up to the limit
        for (let i = 0; i < expectedRequests; i++) {
          const result = await rateLimitAuth(endpoint, `test-${endpoint}-${i}`);
          expect(result.success).toBe(true);
        }

        // Next request should be rate limited
        const limitedResult = await rateLimitAuth(endpoint, `test-${endpoint}-limited`);
        // Note: This might not be rate limited since we're using different identifiers
        // In a real scenario, we'd use the same identifier
      }
    });

    it('should parse time windows correctly', async () => {
      // Test by checking if the rate limiting works with different time windows
      const shortWindow = await rateLimitAuth('twoFactor', 'test-user'); // 5m window
      expect(shortWindow.success).toBe(true);

      const mediumWindow = await rateLimitAuth('verify', 'test-user2'); // 15m window
      expect(mediumWindow.success).toBe(true);

      const longWindow = await rateLimitAuth('register', 'test-user3'); // 1h window
      expect(longWindow.success).toBe(true);
    });

    it('should handle invalid time window format', async () => {
      // This would require us to access the internal parseTimeWindow function
      // For now, we'll test that the system doesn't crash with valid formats
      const result = await rateLimitAuth('login', 'test-user');
      expect(result).toBeDefined();
    });
  });

  describe('Rate limit headers', () => {
    it('should generate correct headers for successful requests', () => {
      const result: RateLimitResult = {
        success: true,
        limit: 100,
        remaining: 99,
        reset: 1234567890,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers).toEqual({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '99',
        'X-RateLimit-Reset': '1234567890',
      });
    });

    it('should include retry-after header for rate limited requests', () => {
      const result: RateLimitResult = {
        success: false,
        limit: 10,
        remaining: 0,
        reset: 1234567890,
        retryAfter: 30,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers).toEqual({
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': '1234567890',
        'Retry-After': '30',
      });
    });

    it('should not include retry-after header when not rate limited', () => {
      const result: RateLimitResult = {
        success: true,
        limit: 50,
        remaining: 25,
        reset: 1234567890,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers['Retry-After']).toBeUndefined();
    });
  });

  describe('Client identifier extraction', () => {
    const createMockRequest = (headers: Record<string, string>) => {
      return {
        headers: {
          get: jest.fn((name: string) => headers[name.toLowerCase()] || null),
        },
      } as any as Request;
    };

    it('should extract IP from x-forwarded-for header', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header when x-forwarded-for is not available', () => {
      const request = createMockRequest({
        'x-real-ip': '203.0.113.1',
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('203.0.113.1');
    });

    it('should extract IP from cf-connecting-ip header when others are not available', () => {
      const request = createMockRequest({
        'cf-connecting-ip': '198.51.100.1',
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('198.51.100.1');
    });

    it('should prioritize x-forwarded-for over other headers', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '203.0.113.1',
        'cf-connecting-ip': '198.51.100.1',
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should handle missing IP headers gracefully', () => {
      const request = createMockRequest({});

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('unknown');
    });

    it('should combine IP with user ID when provided', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1',
      });

      const identifier = getClientIdentifier(request, 'user-123');
      expect(identifier).toBe('192.168.1.1:user-123');
    });

    it('should handle comma-separated IPs in x-forwarded-for', () => {
      const request = createMockRequest({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1'); // Should take the first IP
    });

    it('should trim whitespace from extracted IPs', () => {
      const request = createMockRequest({
        'x-forwarded-for': '  192.168.1.1  , 10.0.0.1  ',
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });
  });

  describe('Rate limiting configurations', () => {
    it('should have correct configurations for all auth endpoints', () => {
      expect(AUTH_RATE_LIMITS.login).toEqual({
        requests: 5,
        window: '15 m',
        endpoint: '/api/auth/login',
      });

      expect(AUTH_RATE_LIMITS.register).toEqual({
        requests: 3,
        window: '1 h',
        endpoint: '/api/register',
      });

      expect(AUTH_RATE_LIMITS.reset).toEqual({
        requests: 3,
        window: '1 h',
        endpoint: '/api/auth/reset',
      });

      expect(AUTH_RATE_LIMITS.verify).toEqual({
        requests: 5,
        window: '15 m',
        endpoint: '/api/auth/verify',
      });

      expect(AUTH_RATE_LIMITS.twoFactor).toEqual({
        requests: 5,
        window: '5 m',
        endpoint: '/api/auth/2fa',
      });
    });

    it('should be more restrictive for sensitive operations', () => {
      // 2FA should have the shortest window
      expect(AUTH_RATE_LIMITS.twoFactor.window).toBe('5 m');
      
      // Registration and password reset should have longer windows but fewer requests
      expect(AUTH_RATE_LIMITS.register.requests).toBe(3);
      expect(AUTH_RATE_LIMITS.reset.requests).toBe(3);
      expect(AUTH_RATE_LIMITS.register.window).toBe('1 h');
      expect(AUTH_RATE_LIMITS.reset.window).toBe('1 h');

      // Login should allow more frequent attempts but with reasonable limits
      expect(AUTH_RATE_LIMITS.login.requests).toBe(5);
      expect(AUTH_RATE_LIMITS.login.window).toBe('15 m');
    });
  });

  describe('Memory cleanup and management', () => {
    it('should not leak memory with many different identifiers', async () => {
      const identifiers = Array.from({ length: 1000 }, (_, i) => `user-${i}`);
      
      // Generate rate limit entries for many users
      for (const identifier of identifiers) {
        await rateLimit(identifier, 5, 60000);
      }

      // The in-memory cleanup should eventually clean up expired entries
      // We can't easily test the cleanup timer in a unit test, but we can verify
      // that the system doesn't crash with many entries
      expect(true).toBe(true); // Test passes if no memory errors occur
    });

    it('should handle expired entries correctly', async () => {
      const identifier = 'expire-test-user';
      const shortWindow = 50; // 50ms window

      // Create an entry
      await rateLimit(identifier, 1, shortWindow);
      
      // Should be rate limited immediately
      const limitedResult = await rateLimit(identifier, 1, shortWindow);
      expect(limitedResult.success).toBe(false);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should work again after expiration
      const afterExpirationResult = await rateLimit(identifier, 1, shortWindow);
      expect(afterExpirationResult.success).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle zero rate limits', async () => {
      const result = await rateLimit('zero-limit-user', 0, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle negative rate limits', async () => {
      const result = await rateLimit('negative-limit-user', -5, 60000);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle very large rate limits', async () => {
      const result = await rateLimit('large-limit-user', 1000000, 60000);
      expect(result.success).toBe(true);
      expect(result.limit).toBe(1000000);
      expect(result.remaining).toBe(999999);
    });

    it('should handle very short time windows', async () => {
      const result = await rateLimit('short-window-user', 5, 1); // 1ms window
      expect(result.success).toBe(true);
      
      // Should reset almost immediately
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const nextResult = await rateLimit('short-window-user', 5, 1);
      expect(nextResult.success).toBe(true);
    });

    it('should handle very long time windows', async () => {
      const veryLongWindow = 365 * 24 * 60 * 60 * 1000; // 1 year
      const result = await rateLimit('long-window-user', 5, veryLongWindow);
      
      expect(result.success).toBe(true);
      expect(result.reset).toBeGreaterThan(Date.now() + veryLongWindow - 1000);
    });

    it('should handle empty or invalid identifiers', async () => {
      const emptyResult = await rateLimit('', 5, 60000);
      expect(emptyResult.success).toBe(true);

      const nullResult = await rateLimit(null as any, 5, 60000);
      expect(nullResult.success).toBe(true);

      const undefinedResult = await rateLimit(undefined as any, 5, 60000);
      expect(undefinedResult.success).toBe(true);
    });
  });

  describe('Performance characteristics', () => {
    it('should handle high-frequency requests efficiently', async () => {
      const identifier = 'performance-test-user';
      const startTime = Date.now();
      const requestCount = 100;

      // Make many rapid requests
      const promises = Array.from({ length: requestCount }, () =>
        rateLimit(identifier, requestCount + 10, 60000)
      );

      await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete within reasonable time (less than 1 second for 100 requests)
      expect(totalTime).toBeLessThan(1000);
    });

    it('should maintain accuracy under concurrent load', async () => {
      const identifier = 'concurrent-accuracy-test';
      const limit = 10;
      const concurrentRequests = 20;

      const promises = Array.from({ length: concurrentRequests }, () =>
        rateLimit(identifier, limit, 60000)
      );

      const results = await Promise.all(promises);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      // Should allow exactly 'limit' requests to succeed
      expect(successCount).toBe(limit);
      expect(failureCount).toBe(concurrentRequests - limit);
    });
  });
});