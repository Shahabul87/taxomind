/**
 * Tests for Dashboard Preferences Route - app/api/dashboard/preferences/route.ts
 */

import { GET, PUT } from '@/app/api/dashboard/preferences/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardPreferences) {
  (db as Record<string, unknown>).dashboardPreferences = {
    findUnique: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
  };
}

const mockDashboardPreferences = (db as Record<string, any>).dashboardPreferences;

function getReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/preferences');
}

function putReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/preferences', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard preferences route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockDashboardPreferences.findUnique.mockResolvedValue({
      userId: 'user-1',
      viewMode: 'LIST',
      gridColumns: 3,
      listDensity: 'COMFORTABLE',
      groupBy: 'DATE',
      sortBy: 'DUE_DATE',
      showCompleted: false,
      showCancelled: false,
      defaultDateRange: 14,
    });
    mockDashboardPreferences.create.mockResolvedValue({ userId: 'user-1' });
    mockDashboardPreferences.upsert.mockResolvedValue({ userId: 'user-1', viewMode: 'GRID' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET creates default preferences when missing', async () => {
    mockDashboardPreferences.findUnique.mockResolvedValue(null);

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDashboardPreferences.create).toHaveBeenCalledWith({
      data: { userId: 'user-1' },
    });
  });

  it('PUT returns 400 for invalid payload', async () => {
    const res = await PUT(putReq({ gridColumns: 99 }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PUT upserts preferences for authenticated user', async () => {
    const payload = {
      viewMode: 'GRID',
      gridColumns: 2,
      listDensity: 'COMPACT',
      groupBy: 'COURSE',
      sortBy: 'PRIORITY',
      showCompleted: true,
      showCancelled: false,
      defaultDateRange: 21,
    };

    const res = await PUT(putReq(payload));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDashboardPreferences.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: payload,
      create: { userId: 'user-1', ...payload },
    });
  });

  it('PUT returns 500 on unexpected db errors', async () => {
    mockDashboardPreferences.upsert.mockRejectedValue(new Error('db fail'));

    const res = await PUT(putReq({ viewMode: 'LIST' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

