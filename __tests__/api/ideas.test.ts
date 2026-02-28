jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, POST } from '@/app/api/ideas/route';
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

const idea = ensureModel('idea', ['create', 'findMany']);

describe('/api/ideas route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/ideas', {
      method: 'POST',
      body: JSON.stringify({ title: 'Idea' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST creates idea for authenticated user', async () => {
    idea.create.mockResolvedValueOnce({
      id: 'idea-1',
      title: 'Workflow automation',
      userId: 'user-1',
    });

    const req = new NextRequest('http://localhost:3000/api/ideas', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Workflow automation',
        description: 'Automate intake pipeline',
        category: 'Productivity',
        visibility: 'PRIVATE',
        tags: ['ops', 'ai'],
        status: 'DRAFT',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('idea-1');
    expect(idea.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Workflow automation',
          userId: 'user-1',
        }),
      })
    );
  });

  it('GET applies optional filters for authenticated user', async () => {
    idea.findMany.mockResolvedValueOnce([{ id: 'idea-1' }]);

    const req = new NextRequest(
      'http://localhost:3000/api/ideas?status=DRAFT&category=Productivity&visibility=PRIVATE'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(idea.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user-1',
          status: 'DRAFT',
          category: 'Productivity',
          visibility: 'PRIVATE',
        },
      })
    );
  });

  it('GET returns 500 on query error', async () => {
    idea.findMany.mockRejectedValueOnce(new Error('db failure'));

    const req = new NextRequest('http://localhost:3000/api/ideas');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
