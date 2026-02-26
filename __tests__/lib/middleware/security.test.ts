/**
 * Tests for SecurityMiddleware - lib/middleware/security.ts
 *
 * Covers: IP filtering, bot detection, rate limiting, SQL injection,
 *         XSS detection, DDoS protection, suspicious paths, config validation
 */

jest.mock('@/lib/security/security-headers', () => {
  const mockApply = jest.fn();
  const mockApplyCORS = jest.fn();
  const mockHeaders = { apply: mockApply, applyCORS: mockApplyCORS };

  return {
    SecurityHeaders: jest.fn().mockImplementation(() => mockHeaders),
    SecurityHeadersPresets: {
      development: mockHeaders,
      staging: mockHeaders,
      production: mockHeaders,
    },
  };
});

jest.mock('@/lib/security/crypto-utils', () => ({
  CryptoUtils: {},
}));

// @/lib/logger is globally mocked

import { SecurityMiddleware } from '@/lib/middleware/security';
import { NextRequest } from 'next/server';

function createRequest(
  path = '/api/test',
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    searchParams?: Record<string, string>;
  } = {}
) {
  const url = new URL(path, 'http://localhost:3000');
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  return new NextRequest(url.toString(), {
    method: options.method || 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ...options.headers,
    },
    body: options.body,
  });
}

function createMiddleware(overrides: Partial<ConstructorParameters<typeof SecurityMiddleware>[0]> = {}) {
  return new SecurityMiddleware({
    environment: 'production',
    enableRateLimit: false, // Disable by default to isolate tests
    enableBotDetection: false,
    enableIPFiltering: false,
    enableDDoSProtection: false,
    enableSQLInjectionDetection: false,
    enableXSSDetection: false,
    enableRequestValidation: false,
    logSecurityEvents: false,
    ...overrides,
  });
}

describe('SecurityMiddleware', () => {
  describe('IP Filtering', () => {
    it('blocks a blacklisted IP', async () => {
      const mw = createMiddleware({
        enableIPFiltering: true,
        ipBlacklist: ['1.2.3.4'],
      });

      const req = createRequest('/api/test', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('blacklisted');
    });

    it('blocks IP not in whitelist when whitelist is defined', async () => {
      const mw = createMiddleware({
        enableIPFiltering: true,
        ipWhitelist: ['10.0.0.1'],
      });

      const req = createRequest('/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('not in whitelist');
    });

    it('allows whitelisted IP', async () => {
      const mw = createMiddleware({
        enableIPFiltering: true,
        ipWhitelist: ['10.0.0.1'],
      });

      const req = createRequest('/api/test', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(false);
    });

    it('supports CIDR notation in blacklist', async () => {
      const mw = createMiddleware({
        enableIPFiltering: true,
        ipBlacklist: ['192.168.1.0/24'],
      });

      const req = createRequest('/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.50' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
    });
  });

  describe('Bot Detection', () => {
    it('blocks known bot user agents', async () => {
      const mw = createMiddleware({ enableBotDetection: true });

      const req = createRequest('/api/test', {
        headers: { 'user-agent': 'Googlebot/2.1' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('Bot detected');
    });

    it('blocks empty user agent', async () => {
      const mw = createMiddleware({ enableBotDetection: true });

      const req = createRequest('/api/test', {
        headers: { 'user-agent': '' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
    });

    it('allows normal browser user agents', async () => {
      const mw = createMiddleware({ enableBotDetection: true });

      const req = createRequest('/api/test', {
        headers: { 'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('allows requests under the limit', async () => {
      const mw = createMiddleware({
        enableRateLimit: true,
        rateLimitOptions: { windowMs: 60000, maxRequests: 5 },
      });

      const req = createRequest('/api/test', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(false);
    });

    it('blocks requests exceeding the limit', async () => {
      const mw = createMiddleware({
        enableRateLimit: true,
        rateLimitOptions: { windowMs: 60000, maxRequests: 2 },
      });

      const req = createRequest('/api/test', {
        headers: { 'x-forwarded-for': '10.0.0.99' },
      });

      // First 2 requests pass
      await mw.process(req);
      await mw.process(req);

      // Third should be blocked
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('Rate limit');
    });
  });

  describe('SQL Injection Detection', () => {
    it('blocks SQL injection in URL params', async () => {
      const mw = createMiddleware({ enableSQLInjectionDetection: true });

      const req = createRequest('/api/users', {
        searchParams: { id: "1' OR 1=1 --" },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('SQL injection');
    });

    it('blocks UNION SELECT attack', async () => {
      const mw = createMiddleware({ enableSQLInjectionDetection: true });

      const req = createRequest('/api/users', {
        searchParams: { q: 'test UNION SELECT * FROM users' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
    });

    it('allows normal query parameters', async () => {
      const mw = createMiddleware({ enableSQLInjectionDetection: true });

      const req = createRequest('/api/users', {
        searchParams: { search: 'John Doe', page: '1' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(false);
    });
  });

  describe('XSS Detection', () => {
    it('blocks script tags in path', async () => {
      const mw = createMiddleware({ enableXSSDetection: true });

      // Use a path that contains the XSS pattern directly (not URL-encoded via searchParams)
      const req = createRequest('/api/test');
      // Override searchParams to return raw XSS payload (simulating decoded input)
      (req as any).nextUrl = {
        ...req.nextUrl,
        pathname: req.nextUrl.pathname,
        searchParams: {
          toString: () => 'q=<script>alert("xss")</script>',
        },
      };
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('XSS');
    });

    it('blocks javascript: protocol in params', async () => {
      const mw = createMiddleware({ enableXSSDetection: true });

      const req = createRequest('/api/test');
      (req as any).nextUrl = {
        ...req.nextUrl,
        pathname: req.nextUrl.pathname,
        searchParams: {
          toString: () => 'url=javascript:alert(1)',
        },
      };
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
    });

    it('allows normal content', async () => {
      const mw = createMiddleware({ enableXSSDetection: true });

      const req = createRequest('/api/search', {
        searchParams: { q: 'react tutorial' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(false);
    });
  });

  describe('Request Validation', () => {
    it('blocks oversized requests', async () => {
      const mw = createMiddleware({
        enableRequestValidation: true,
        maxRequestSize: 1024,
      });

      const req = createRequest('/api/upload', {
        headers: { 'content-length': '999999' },
      });
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('too large');
    });

    it('blocks suspicious paths (.env)', async () => {
      const mw = createMiddleware({ enableRequestValidation: true });

      const req = createRequest('/.env');
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('Suspicious path');
    });

    it('blocks wp-admin access', async () => {
      const mw = createMiddleware({ enableRequestValidation: true });

      const req = createRequest('/wp-admin/login.php');
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
    });

    it('blocks .git access', async () => {
      const mw = createMiddleware({ enableRequestValidation: true });

      const req = createRequest('/.git/config');
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
    });
  });

  describe('Directory Traversal Detection', () => {
    it('blocks ../ traversal in path', async () => {
      const mw = createMiddleware({});

      // Override nextUrl.pathname so it contains ../
      const req = createRequest('/api/test');
      (req as any).nextUrl = {
        ...req.nextUrl,
        pathname: '/api/../../../etc/passwd',
        searchParams: req.nextUrl.searchParams,
      };
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
      expect(result.reason).toContain('Directory traversal');
    });

    it('blocks %2e%2e encoded traversal in path', async () => {
      const mw = createMiddleware({});

      const req = createRequest('/api/test');
      (req as any).nextUrl = {
        ...req.nextUrl,
        pathname: '/api/%2e%2e/secret',
        searchParams: req.nextUrl.searchParams,
      };
      const result = await mw.process(req);

      expect(result.blocked).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('validates correct configuration', () => {
      const mw = createMiddleware({
        enableRateLimit: true,
        rateLimitOptions: { windowMs: 60000, maxRequests: 100 },
      });

      const { isValid, errors } = mw.validateConfiguration();

      expect(isValid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('catches invalid rate limit config', () => {
      const mw = createMiddleware({
        enableRateLimit: true,
        rateLimitOptions: { windowMs: 0, maxRequests: -1 },
      });

      const { isValid, errors } = mw.validateConfiguration();

      expect(isValid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('catches invalid webhook URL', () => {
      const mw = createMiddleware({
        webhookURL: 'not-a-url',
      });

      const { isValid, errors } = mw.validateConfiguration();

      expect(isValid).toBe(false);
      expect(errors.some(e => e.includes('webhook URL'))).toBe(true);
    });
  });

  describe('Security Stats', () => {
    it('tracks security events and provides stats', async () => {
      const mw = createMiddleware({
        enableIPFiltering: true,
        ipBlacklist: ['1.2.3.4'],
        logSecurityEvents: true,
      });

      const req = createRequest('/api/test', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      await mw.process(req);
      await mw.process(req);

      const stats = mw.getSecurityStats();

      expect(stats.totalEvents).toBe(2);
      expect(stats.eventsByType['blocked_ip']).toBe(2);
      expect(stats.topBlockedIPs[0].ip).toBe('1.2.3.4');
    });

    it('clears security events', async () => {
      const mw = createMiddleware({
        enableIPFiltering: true,
        ipBlacklist: ['1.2.3.4'],
        logSecurityEvents: true,
      });

      const req = createRequest('/api/test', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      await mw.process(req);
      mw.clearSecurityEvents();

      expect(mw.getSecurityEvents()).toHaveLength(0);
    });
  });

  describe('Security Headers', () => {
    it('applies security headers to response', () => {
      const mw = createMiddleware({ enableSecurityHeaders: true });
      const { NextResponse } = require('next/server');

      const req = createRequest('/api/test');
      const response = NextResponse.json({ ok: true });
      const result = mw.applySecurityHeaders(req, response);

      expect(result.headers.get('X-Security-Processed')).toBe('true');
      expect(result.headers.get('X-Security-Timestamp')).toBeDefined();
    });

    it('skips headers when disabled', () => {
      const mw = createMiddleware({ enableSecurityHeaders: false });
      const { NextResponse } = require('next/server');

      const req = createRequest('/api/test');
      const response = NextResponse.json({ ok: true });
      const result = mw.applySecurityHeaders(req, response);

      // When disabled, the header is not set, so get() returns undefined on the Map mock
      expect(result.headers.get('X-Security-Processed')).toBeFalsy();
    });
  });
});
