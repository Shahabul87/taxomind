/**
 * Tests for Todo Toggle Route - app/api/dashboard/todos/[id]/toggle/route.ts
 */

import { PATCH } from '@/app/api/dashboard/todos/[id]/toggle/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).dashboardTodo) {
  (db as Record<string, unknown>).dashboardTodo = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
} else {
  const model = (db as Record<string, any>).dashboardTodo;
  if (!model.findUnique) model.findUnique = jest.fn();
  if (!model.update) model.update = jest.fn();
}

const mockTodo = (db as Record<string, any>).dashboardTodo;
const params = { params: { id: 't1' } };

function req() {
  return new NextRequest('http://localhost:3000/api/dashboard/todos/t1/toggle', {
    method: 'PATCH',
  });
}

describe('Todo toggle route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockTodo.findUnique.mockResolvedValue({ id: 't1', userId: 'user-1', completed: false });
    mockTodo.update.mockResolvedValue({ id: 't1', completed: true });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PATCH(req(), params);
    expect(res.status).toBe(401);
  });

  it('returns 404 when todo not found', async () => {
    mockTodo.findUnique.mockResolvedValue(null);

    const res = await PATCH(req(), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('returns 403 for non-owner', async () => {
    mockTodo.findUnique.mockResolvedValue({ id: 't1', userId: 'other-user', completed: false });

    const res = await PATCH(req(), params);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('toggles completed state for owner', async () => {
    const res = await PATCH(req(), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockTodo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 't1' },
        data: expect.objectContaining({
          completed: true,
          completedAt: expect.any(Date),
        }),
      })
    );
  });
});

