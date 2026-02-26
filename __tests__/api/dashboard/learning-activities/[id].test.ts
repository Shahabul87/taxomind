/**
 * Tests for Learning Activity Detail Route - app/api/dashboard/learning-activities/[id]/route.ts
 */

import { GET, PATCH, DELETE } from '@/app/api/dashboard/learning-activities/[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).learningActivity) {
  (db as Record<string, unknown>).learningActivity = {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).learningActivity;
  if (!model.findUnique) model.findUnique = jest.fn();
  if (!model.update) model.update = jest.fn();
  if (!model.delete) model.delete = jest.fn();
}

if (!(db as Record<string, unknown>).dailyLearningLog) {
  (db as Record<string, unknown>).dailyLearningLog = {
    upsert: jest.fn(),
    update: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dailyLearningLog;
  if (!model.upsert) model.upsert = jest.fn();
  if (!model.update) model.update = jest.fn();
}

if (!(db as Record<string, unknown>).learningStreak) {
  (db as Record<string, unknown>).learningStreak = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).learningStreak;
  if (!model.findUnique) model.findUnique = jest.fn();
  if (!model.create) model.create = jest.fn();
  if (!model.update) model.update = jest.fn();
}

const mockActivity = (db as Record<string, any>).learningActivity;
const mockDailyLog = (db as Record<string, any>).dailyLearningLog;
const params = { params: Promise.resolve({ id: 'a1' }) };

function getReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/learning-activities/a1');
}

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/learning-activities/a1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/learning-activities/a1', {
    method: 'DELETE',
  });
}

describe('Learning activity detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockActivity.findUnique.mockResolvedValue({
      id: 'a1',
      userId: 'user-1',
      status: 'NOT_STARTED',
      scheduledDate: new Date('2026-03-05T00:00:00.000Z'),
      estimatedDuration: 30,
      actualDuration: null,
    });
    mockActivity.update.mockResolvedValue({
      id: 'a1',
      userId: 'user-1',
      status: 'IN_PROGRESS',
      scheduledDate: new Date('2026-03-05T00:00:00.000Z'),
      estimatedDuration: 30,
      actualDuration: null,
    });
    mockActivity.delete.mockResolvedValue({ id: 'a1' });
    mockDailyLog.update.mockResolvedValue({});
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when activity not found', async () => {
    mockActivity.findUnique.mockResolvedValue(null);

    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('GET returns 403 for non-owner', async () => {
    mockActivity.findUnique.mockResolvedValue({ id: 'a1', userId: 'other-user' });

    const res = await GET(getReq(), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const res = await PATCH(patchReq({ startTime: 'nope' }), params);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates activity for owner', async () => {
    const res = await PATCH(patchReq({ status: 'IN_PROGRESS', progress: 40 }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockActivity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'a1' },
        data: expect.objectContaining({
          status: 'IN_PROGRESS',
          progress: 40,
        }),
      })
    );
  });

  it('DELETE removes activity and updates daily log', async () => {
    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
    expect(mockDailyLog.update).toHaveBeenCalled();
    expect(mockActivity.delete).toHaveBeenCalledWith({ where: { id: 'a1' } });
  });
});

