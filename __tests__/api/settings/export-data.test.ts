/**
 * Tests for Settings Export Data Route - app/api/settings/export-data/route.ts
 */

import { GET, POST } from '@/app/api/settings/export-data/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dataExportRequest) {
  (db as Record<string, unknown>).dataExportRequest = {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };
}

const mockExport = (db as Record<string, any>).dataExportRequest;

function req(method: 'GET' | 'POST', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/settings/export-data', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('Settings export-data route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockExport.findFirst.mockResolvedValue(null);
    mockExport.create.mockResolvedValue({
      id: 'exp-1',
      format: 'json',
      status: 'pending',
      expiresAt: new Date('2026-03-05T00:00:00.000Z'),
    });
    mockExport.findMany.mockResolvedValue([
      {
        id: 'exp-1',
        format: 'json',
        status: 'completed',
        downloadUrl: 'https://example.com/export.json',
        createdAt: new Date('2026-02-20T00:00:00.000Z'),
        completedAt: new Date('2026-02-20T01:00:00.000Z'),
        expiresAt: new Date('2026-03-05T00:00:00.000Z'),
      },
    ]);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(req('POST', { format: 'json' }));
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for invalid export format', async () => {
    const res = await POST(req('POST', { format: 'xml' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('POST returns 400 when request is already pending', async () => {
    mockExport.findFirst.mockResolvedValue({ id: 'exp-existing', status: 'pending' });

    const res = await POST(req('POST', { format: 'json' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('POST creates export request', async () => {
    const res = await POST(req('POST', { format: 'csv' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockExport.create).toHaveBeenCalled();
  });

  it('GET returns export request history', async () => {
    const res = await GET(req('GET'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('exp-1');
  });
});
