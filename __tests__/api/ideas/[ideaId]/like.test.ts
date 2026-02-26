jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { POST } from '@/app/api/ideas/[ideaId]/like/route';
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

const ideaLike = ensureModel('ideaLike', ['findUnique', 'delete', 'create', 'count']);
const idea = ensureModel('idea', ['update']);

describe('/api/ideas/[ideaId]/like route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    ideaLike.findUnique.mockResolvedValue(null);
    ideaLike.create.mockResolvedValue({ id: 'like-1' });
    ideaLike.count.mockResolvedValue(3);
    idea.update.mockResolvedValue({ id: 'i1', likes: 3 });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/ideas/i1/like', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ ideaId: 'i1' }) });
    expect(res.status).toBe(401);
  });

  it('creates like when user has not liked yet', async () => {
    const req = new NextRequest('http://localhost:3000/api/ideas/i1/like', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ ideaId: 'i1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(ideaLike.create).toHaveBeenCalled();
  });

  it('removes existing like when user already liked', async () => {
    ideaLike.findUnique.mockResolvedValueOnce({ id: 'like-1' });
    ideaLike.delete.mockResolvedValueOnce({ id: 'like-1' });
    const req = new NextRequest('http://localhost:3000/api/ideas/i1/like', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ ideaId: 'i1' }) });

    expect(res.status).toBe(200);
    expect(ideaLike.delete).toHaveBeenCalledWith({ where: { id: 'like-1' } });
  });
});
