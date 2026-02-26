import { GET, OPTIONS } from '@/app/api/production-test/route';
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

const course = ensureModel('course', ['count', 'create', 'delete']);
const user = ensureModel('user', ['count']);

describe('/api/production-test route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    course.count.mockResolvedValue(12);
    user.count.mockResolvedValue(5);
    course.create.mockResolvedValue({ id: 'test-course-1' });
    course.delete.mockResolvedValue({ id: 'test-course-1' });
    mockCurrentUser.mockResolvedValue(null);
  });

  it('GET returns diagnostic report with skipped write test when unauthenticated', async () => {
    const req = new NextRequest('http://localhost:3000/api/production-test', {
      headers: { origin: 'http://localhost:3000', host: 'localhost:3000' },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overallStatus).toBe('success');
    expect(body.tests.databaseConnection.status).toBe('success');
    expect(body.tests.databaseWrite.status).toBe('skipped');
    expect(body.tests.authentication.data.userAuthenticated).toBe(false);
    expect(body.totalTestsCount).toBe(5);
  });

  it('GET performs write test when authenticated user exists', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', email: 'user@test.com' });

    const req = new NextRequest('http://localhost:3000/api/production-test');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tests.databaseWrite.status).toBe('success');
    expect(body.tests.databaseWrite.data.canWrite).toBe(true);
    expect(course.create).toHaveBeenCalled();
    expect(course.delete).toHaveBeenCalled();
  });

  it('GET reports partial failure when database connection check fails', async () => {
    course.count.mockRejectedValueOnce(new Error('db unavailable'));

    const req = new NextRequest('http://localhost:3000/api/production-test');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.overallStatus).toBe('partial_failure');
    expect(body.tests.databaseConnection.status).toBe('error');
  });

  it('OPTIONS returns CORS headers', async () => {
    const req = new NextRequest('http://localhost:3000/api/production-test', {
      method: 'OPTIONS',
    });
    const res = await OPTIONS(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('GET, OPTIONS');
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
  });
});
