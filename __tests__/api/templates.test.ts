jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, POST } from '@/app/api/templates/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

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

const template = ensureModel('aIContentTemplate', ['findMany', 'count', 'create']);

describe('/api/templates route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    template.findMany.mockResolvedValue([]);
    template.count.mockResolvedValue(0);
    template.create.mockResolvedValue({ id: 't1', name: 'Template A' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/templates');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('GET returns paginated templates payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/templates?page=1&limit=20');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.pagination.total).toBe(0);
  });

  it('POST returns 400 when required template fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/templates', {
      method: 'POST',
      body: JSON.stringify({ name: 'Template A' }),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});
