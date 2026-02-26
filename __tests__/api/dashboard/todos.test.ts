/**
 * Tests for Dashboard Todos Route - app/api/dashboard/todos/route.ts
 */

import { GET, POST } from '@/app/api/dashboard/todos/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardTodo) {
  (db as Record<string, unknown>).dashboardTodo = {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardTodo;
  if (!model.count) model.count = jest.fn();
  if (!model.findMany) model.findMany = jest.fn();
  if (!model.create) model.create = jest.fn();
  if (!model.findUnique) model.findUnique = jest.fn();
}

const mockTodo = (db as Record<string, any>).dashboardTodo;

function getReq(query = '') {
  return new NextRequest(`http://localhost:3000/api/dashboard/todos${query ? `?${query}` : ''}`);
}

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Dashboard todos route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockTodo.count.mockResolvedValue(7);
    mockTodo.findMany.mockResolvedValue([{ id: 't1', userId: 'user-1', title: 'Todo A' }]);
    mockTodo.create.mockResolvedValue({ id: 't2', userId: 'user-1', title: 'Todo B' });
    mockTodo.findUnique.mockResolvedValue({ id: 't2', userId: 'user-1', title: 'Todo B' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(getReq());
    expect(res.status).toBe(401);
  });

  it('GET returns paginated todos', async () => {
    const res = await GET(getReq('page=2&limit=3'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagination).toEqual({ page: 2, limit: 3, total: 7 });
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postReq({ title: '' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates todo and returns created record', async () => {
    const res = await POST(postReq({
      title: 'Todo B',
      taskType: 'STUDY',
      priority: 'HIGH',
    }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockTodo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Todo B',
        }),
      })
    );
  });

  it('GET handles db errors in outer block', async () => {
    mockTodo.findMany.mockRejectedValue(new Error('query fail'));

    const res = await GET(getReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });
});

