/**
 * Tests for Security CSP Report Route - app/api/security/csp-report/route.ts
 */

jest.mock('@/lib/security/crypto-utils', () => ({
  CryptoUtils: {
    generateSecureToken: jest.fn(() => Promise.resolve('sec-token-1')),
  },
}));

import { GET, OPTIONS, POST } from '@/app/api/security/csp-report/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';

const mockCurrentUser = currentUser as jest.Mock;

function postReq(body: Record<string, unknown>, contentType = 'application/csp-report') {
  return new NextRequest('http://localhost:3000/api/security/csp-report', {
    method: 'POST',
    headers: { 'content-type': contentType, 'user-agent': 'jest' },
    body: JSON.stringify(body),
  });
}

describe('Security csp-report route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
  });

  it('POST returns 400 for invalid content type', async () => {
    const res = await POST(postReq({}, 'text/plain'));
    expect(res.status).toBe(400);
  });

  it('POST returns 400 for invalid CSP report format', async () => {
    const res = await POST(postReq({ nope: true }));
    expect(res.status).toBe(400);
  });

  it('POST accepts valid CSP report', async () => {
    const res = await POST(postReq({
      'csp-report': {
        'blocked-uri': 'http://evil.com/script.js',
        'document-uri': 'https://taxomind.com/course',
        'violated-directive': 'script-src',
        'effective-directive': 'script-src',
        'original-policy': "default-src 'self'",
        'referrer': '',
        'script-sample': '',
        'source-file': 'https://taxomind.com/app.js',
        'status-code': 200,
        'line-number': 1,
        'column-number': 1,
      },
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('received');
    expect(body.id).toBe('sec-token-1');
  });

  it('GET returns 401 for non-admin user', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', role: 'USER' });

    const res = await GET(new NextRequest('http://localhost:3000/api/security/csp-report'));
    expect(res.status).toBe(401);
  });

  it('GET returns configuration for admin', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/security/csp-report'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.configuration.reportURI).toBe('/api/security/csp-report');
  });

  it('OPTIONS returns CORS headers', async () => {
    const res = await OPTIONS(new NextRequest('http://localhost:3000/api/security/csp-report'));

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});
