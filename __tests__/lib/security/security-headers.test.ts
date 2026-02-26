import { NextRequest, NextResponse } from 'next/server';
import {
  SecurityHeaders,
  SecurityHeadersPresets,
  SecurityHeadersUtils,
} from '@/lib/security/security-headers';

describe('lib/security/security-headers', () => {
  it('applies core security headers to response', () => {
    const security = new SecurityHeaders({ environment: 'production' });
    const response = NextResponse.next();

    security.apply(response);

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(response.headers.get('Strict-Transport-Security')).toContain('max-age=31536000');
  });

  it('uses report-only CSP header outside production by default', () => {
    const security = new SecurityHeaders({ environment: 'development' });
    const response = NextResponse.next();

    security.apply(response);

    expect(response.headers.get('Content-Security-Policy-Report-Only')).toBeTruthy();
    expect(response.headers.get('Content-Security-Policy')).toBeUndefined();
  });

  it('applies CORS headers for allowed origin', () => {
    const security = new SecurityHeaders({
      environment: 'production',
      allowedOrigins: ['https://app.example.com'],
    });
    const request = new NextRequest('http://localhost:3000/api/test', {
      headers: { origin: 'https://app.example.com' },
    });
    const response = NextResponse.next();

    security.applyCORS(request, response);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  it('handles preflight requests with 204', () => {
    const security = new SecurityHeaders({ environment: 'production' });
    const request = new NextRequest('http://localhost:3000/api/test', {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:3000' },
    });

    const response = security.handlePreflightRequest(request);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('validates insecure directives and malformed origins', () => {
    const security = new SecurityHeaders({
      environment: 'production',
      customCSP: { 'script-src': ["'unsafe-inline'"] },
      allowedOrigins: ['not-a-valid-origin'],
    });

    const result = security.validateConfiguration();

    expect(result.isValid).toBe(false);
    expect(result.errors.join(' ')).toContain('unsafe-inline');
    expect(result.errors.join(' ')).toContain('Invalid origin format');
  });

  it('provides working utility helpers and presets', () => {
    const nonce = SecurityHeadersUtils.generateNonce();
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(10);

    const parsed = SecurityHeadersUtils.parseCSPHeader("script-src 'self' 'unsafe-inline'; img-src https:");
    expect(parsed['script-src']).toContain("'self'");
    expect(SecurityHeadersUtils.hasUnsafeInline("script-src 'self' 'unsafe-inline'")).toBe(true);

    const config = SecurityHeadersPresets.production.getConfiguration();
    expect(config.environment).toBe('production');
    expect(config.enableHSTS).toBe(true);
  });
});
