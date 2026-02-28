jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/search/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

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

const course = ensureModel('course', ['findMany']);
const blog = ensureModel('blog', ['findMany']);

describe('/api/search route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    course.findMany.mockResolvedValue([]);
    blog.findMany.mockResolvedValue([]);
  });

  it('returns 400 when query is too short', async () => {
    const req = new NextRequest('http://localhost:3000/api/search?q=a');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('at least 2 characters');
  });

  it('returns empty result set for unmatched query', async () => {
    const req = new NextRequest('http://localhost:3000/api/search?q=nomatch');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.totalResults).toBe(0);
    expect(Array.isArray(body.results)).toBe(true);
  });
});
