jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/messages/upload/route';
import { auth } from '@/auth';

const mockAuth = auth as jest.Mock;

describe('GET/POST /api/messages/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await POST(
      new NextRequest('http://localhost:3000/api/messages/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/messages/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messageId: 'm1',
          fileName: 'a.txt',
          fileUrl: 'not-url',
          fileType: 'text/plain',
          fileSize: 12,
        }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('POST returns 501 for validated request (feature not implemented)', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/messages/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          messageId: 'm1',
          fileName: 'a.txt',
          fileUrl: 'https://example.com/a.txt',
          fileType: 'text/plain',
          fileSize: 1200,
        }),
      })
    );
    expect(res.status).toBe(501);
  });

  it('GET returns 400 when messageId is missing', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/messages/upload'));
    expect(res.status).toBe(400);
  });

  it('GET returns 501 when messageId is provided', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/messages/upload?messageId=m1')
    );
    expect(res.status).toBe(501);
  });
});
