/**
 * Tests for Auth Sessions Route - app/api/auth/sessions/[sessionId]/route.ts
 *
 * Covers: session revocation via DELETE
 */

jest.mock('@/lib/auth/session-limiter', () => ({
  terminateSession: jest.fn(),
}));

// @/auth is globally mocked

import { DELETE } from '@/app/api/auth/sessions/[sessionId]/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { terminateSession } from '@/lib/auth/session-limiter';

const mockAuth = auth as jest.Mock;
const mockTerminate = terminateSession as jest.Mock;

function createRequest() {
  return new NextRequest('http://localhost:3000/api/auth/sessions/sess-abc-123', {
    method: 'DELETE',
  });
}

function createParams(sessionId: string) {
  return { params: Promise.resolve({ sessionId }) };
}

describe('DELETE /api/auth/sessions/[sessionId]', () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@test.com' },
    });
    mockTerminate.mockResolvedValue(true);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(createRequest(), createParams('sess-abc-123'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when sessionId is empty', async () => {
    const res = await DELETE(createRequest(), createParams(''));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Session ID required');
  });

  it('returns 404 when session is not found or already revoked', async () => {
    mockTerminate.mockResolvedValue(false);

    const res = await DELETE(createRequest(), createParams('sess-nonexistent'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('successfully revokes a session', async () => {
    const res = await DELETE(createRequest(), createParams('sess-abc-123'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain('revoked');

    expect(mockTerminate).toHaveBeenCalledWith('sess-abc-123', 'user-1');
  });

  it('returns 500 on unexpected errors', async () => {
    mockTerminate.mockRejectedValue(new Error('Database error'));

    const res = await DELETE(createRequest(), createParams('sess-abc-123'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed to revoke');
  });
});
