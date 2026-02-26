/**
 * Tests for Settings Delete Account Route - app/api/settings/delete-account/route.ts
 */

import { DELETE, GET, POST } from '@/app/api/settings/delete-account/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).accountDeletionRequest) {
  (db as Record<string, unknown>).accountDeletionRequest = {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
}

const mockDeletion = (db as Record<string, any>).accountDeletionRequest;

function req(method: 'GET' | 'POST' | 'DELETE', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/settings/delete-account', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('Settings delete-account route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDeletion.findFirst.mockResolvedValue(null);
    mockDeletion.create.mockResolvedValue({
      id: 'del-1',
      status: 'pending',
      scheduledFor: new Date('2026-04-01T00:00:00.000Z'),
    });
    mockDeletion.update.mockResolvedValue({ id: 'del-1', status: 'cancelled' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(req('POST', { reason: 'privacy' }));
    expect(res.status).toBe(401);
  });

  it('POST returns 400 when there is already a pending request', async () => {
    mockDeletion.findFirst.mockResolvedValue({
      id: 'del-existing',
      status: 'pending',
      scheduledFor: new Date(),
    });

    const res = await POST(req('POST', { reason: 'privacy' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('POST creates a deletion request', async () => {
    const res = await POST(req('POST', { reason: 'privacy' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDeletion.create).toHaveBeenCalled();
  });

  it('GET returns null when no pending request exists', async () => {
    mockDeletion.findFirst.mockResolvedValue(null);

    const res = await GET(req('GET'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeNull();
  });

  it('DELETE returns 404 when no pending request is found', async () => {
    mockDeletion.findFirst.mockResolvedValue(null);

    const res = await DELETE(req('DELETE'));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('DELETE cancels pending deletion request', async () => {
    mockDeletion.findFirst.mockResolvedValue({ id: 'del-1', status: 'pending' });

    const res = await DELETE(req('DELETE'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDeletion.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'del-1' } })
    );
  });
});
