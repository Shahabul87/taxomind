/**
 * Tests for Todo Detail Route - app/api/dashboard/todos/[id]/route.ts
 */

import { PATCH, DELETE } from '@/app/api/dashboard/todos/[id]/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardTodo) {
  (db as Record<string, unknown>).dashboardTodo = {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardTodo;
  if (!model.findUnique) model.findUnique = jest.fn();
  if (!model.update) model.update = jest.fn();
  if (!model.delete) model.delete = jest.fn();
}

const mockTodo = (db as Record<string, any>).dashboardTodo;
const params = { params: { id: 't1' } };

function patchReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/dashboard/todos/t1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function deleteReq() {
  return new NextRequest('http://localhost:3000/api/dashboard/todos/t1', {
    method: 'DELETE',
  });
}

describe('Todo detail route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockTodo.findUnique.mockResolvedValue({ id: 't1', userId: 'user-1', completed: false });
    mockTodo.update.mockResolvedValue({ id: 't1', userId: 'user-1', title: 'Updated' });
    mockTodo.delete.mockResolvedValue({ id: 't1' });
  });

  it('PATCH returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(patchReq({ title: 'x' }), params);
    expect(res.status).toBe(401);
  });

  it('PATCH returns 404 when todo not found', async () => {
    mockTodo.findUnique.mockResolvedValue(null);

    const res = await PATCH(patchReq({ title: 'x' }), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('PATCH returns 403 for non-owner', async () => {
    mockTodo.findUnique.mockResolvedValue({ id: 't1', userId: 'other-user' });

    const res = await PATCH(patchReq({ title: 'x' }), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('PATCH updates todo for owner', async () => {
    const res = await PATCH(patchReq({ title: 'Updated', progressPercent: 30 }), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockTodo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't1' },
        data: expect.objectContaining({
          title: 'Updated',
          progressPercent: 30,
        }),
      })
    );
  });

  it('DELETE removes owned todo', async () => {
    const res = await DELETE(deleteReq(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Todo deleted successfully');
  });
});

