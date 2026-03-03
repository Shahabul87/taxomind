jest.mock('@/lib/api/dev-only-guard', () => ({
  devOnlyGuard: jest.fn(),
}));

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/db-check/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';
import { NextRequest, NextResponse } from 'next/server';

const mockAdminAuth = adminAuth as jest.Mock;
const mockDevOnlyGuard = devOnlyGuard as jest.Mock;

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

const course = ensureModel('course', ['count']);
const blog = ensureModel('blog', ['count']);
const user = ensureModel('user', ['count']);
const chapter = ensureModel('chapter', ['count']);

describe('/api/db-check route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDevOnlyGuard.mockReturnValue(null);
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    course.count.mockResolvedValue(5);
    blog.count.mockResolvedValue(2);
    user.count.mockResolvedValue(10);
    chapter.count.mockResolvedValue(20);
  });

  it('returns blocked response when dev guard blocks', async () => {
    mockDevOnlyGuard.mockReturnValue(new NextResponse('blocked', { status: 403 }));
    const req = new NextRequest('http://localhost:3000/api/db-check');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('returns 401 for non-admin', async () => {
    mockAdminAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/db-check');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns table counts for admin', async () => {
    const req = new NextRequest('http://localhost:3000/api/db-check');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.connected).toBe(true);
    expect(body.counts).toEqual({
      courses: 5,
      blogs: 2,
      users: 10,
      chapters: 20,
    });
  });

  it('returns 500 when db query fails', async () => {
    course.count.mockRejectedValueOnce(new Error('db failure'));
    const req = new NextRequest('http://localhost:3000/api/db-check');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.connected).toBe(false);
  });
});
