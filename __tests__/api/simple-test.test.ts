jest.mock('@/lib/debug-guard', () => ({
  debugGuard: jest.fn(),
}));

import { GET, POST } from '@/app/api/simple-test/route';
import { debugGuard } from '@/lib/debug-guard';
import { NextRequest, NextResponse } from 'next/server';

const mockDebugGuard = debugGuard as jest.Mock;

describe('/api/simple-test route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDebugGuard.mockResolvedValue(null);
  });

  it('GET returns guard response when blocked', async () => {
    mockDebugGuard.mockResolvedValueOnce(
      NextResponse.json({ error: 'blocked' }, { status: 403 })
    );

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('blocked');
  });

  it('GET returns endpoint data when guard allows', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Simple test endpoint working');
    expect(body.runtime).toBe('nodejs');
  });

  it('POST echoes received payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/simple-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('POST request received');
    expect(body.receivedData).toEqual({ key: 'value' });
  });

  it('POST returns 400 for invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/simple-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Failed to parse JSON');
  });
});
