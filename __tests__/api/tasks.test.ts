jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { DELETE, GET, PATCH, POST } from '@/app/api/tasks/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const task = ensureModel('task', ['findMany', 'create', 'findUnique', 'delete', 'update']);

describe('/api/tasks route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    task.findMany.mockResolvedValue([]);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns tasks for the current user', async () => {
    task.findMany.mockResolvedValueOnce([{ id: 'task-1', title: 'Review notes' }]);
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
        orderBy: { dueDate: 'asc' },
      })
    );
  });

  it('POST returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Incomplete task' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST creates a task when payload is valid', async () => {
    task.create.mockResolvedValueOnce({ id: 'task-1', title: 'Write tests' });

    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Write tests',
        description: 'Cover API edge cases',
        dueDate: '2026-03-10T10:00:00.000Z',
        priority: 'HIGH',
        category: 'Work',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('task-1');
    expect(task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Write tests',
          userId: 'user-1',
          dueDate: expect.any(Date),
        }),
      })
    );
  });

  it('DELETE returns 404 when task is not owned by the user', async () => {
    task.findUnique.mockResolvedValueOnce({ id: 'task-1', userId: 'user-2' });
    const req = new NextRequest('http://localhost:3000/api/tasks?taskId=task-1', {
      method: 'DELETE',
    });

    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });

  it('PATCH updates a task owned by the user', async () => {
    task.findUnique.mockResolvedValueOnce({ id: 'task-1', userId: 'user-1' });
    task.update.mockResolvedValueOnce({ id: 'task-1', title: 'Updated title' });

    const req = new NextRequest('http://localhost:3000/api/tasks', {
      method: 'PATCH',
      body: JSON.stringify({
        id: 'task-1',
        title: 'Updated title',
      }),
    });

    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('task-1');
    expect(task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
      })
    );
  });
});
