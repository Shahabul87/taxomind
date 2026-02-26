jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { DELETE, PATCH } from '@/app/api/ideas/[ideaId]/route';
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

const idea = ensureModel('idea', ['update', 'delete']);

describe('/api/ideas/[ideaId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    idea.update.mockResolvedValue({ id: 'i1', title: 'Updated' });
    idea.delete.mockResolvedValue({ id: 'i1' });
  });

  it('PATCH returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/ideas/i1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'x' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ ideaId: 'i1' }) });
    expect(res.status).toBe(401);
  });

  it('PATCH updates idea for owner', async () => {
    const req = new NextRequest('http://localhost:3000/api/ideas/i1', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated' }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ ideaId: 'i1' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.id).toBe('i1');
  });

  it('DELETE removes idea for owner', async () => {
    const req = new NextRequest('http://localhost:3000/api/ideas/i1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ ideaId: 'i1' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.id).toBe('i1');
  });
});
