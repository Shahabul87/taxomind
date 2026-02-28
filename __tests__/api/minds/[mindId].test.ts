jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { DELETE, PATCH } from '@/app/api/minds/[mindId]/route';
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

const mind = ensureModel('mind', ['update', 'delete']);

function params(mindId = 'mind-1') {
  return { params: Promise.resolve({ mindId }) };
}

describe('/api/minds/[mindId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mind.update.mockResolvedValue({
      id: 'mind-1',
      title: 'Updated title',
      userId: 'user-1',
    });
    mind.delete.mockResolvedValue({ id: 'mind-1' });
  });

  it('PATCH returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/minds/mind-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'x' }),
    });
    const res = await PATCH(req, params());

    expect(res.status).toBe(401);
  });

  it('PATCH returns 400 for empty update payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/minds/mind-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, params());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('PATCH updates mind for owner', async () => {
    const req = new NextRequest('http://localhost:3000/api/minds/mind-1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated title', status: 'PUBLISHED' }),
    });
    const res = await PATCH(req, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('mind-1');
    expect(mind.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'mind-1',
          userId: 'user-1',
        },
      })
    );
  });

  it('DELETE removes mind for owner', async () => {
    const req = new NextRequest('http://localhost:3000/api/minds/mind-1', { method: 'DELETE' });
    const res = await DELETE(req, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.deleted).toBe(true);
    expect(mind.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'mind-1',
          userId: 'user-1',
        },
      })
    );
  });

  it('DELETE returns 500 when delete fails', async () => {
    mind.delete.mockRejectedValueOnce(new Error('db failure'));
    const req = new NextRequest('http://localhost:3000/api/minds/mind-1', { method: 'DELETE' });
    const res = await DELETE(req, params());

    expect(res.status).toBe(500);
  });
});
