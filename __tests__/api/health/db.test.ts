jest.mock('@/lib/api/with-api-auth', () => ({
  withAdminAuth: jest.fn((handler: (request: any, context: any) => Promise<any>) => {
    return async (request: any) =>
      handler(request, {
        user: { id: 'admin-1', role: 'ADMIN' },
      });
  }),
}));

import { GET } from '@/app/api/health/db/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('/api/health/db route', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://masked';

    (db.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([{ test: 1 }])
      .mockResolvedValueOnce([{ table_name: 'User' }, { table_name: 'Course' }])
      .mockResolvedValueOnce([{ database: 'taxomind' }]);
    (db.user.count as jest.Mock).mockResolvedValue(7);
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns database connectivity summary', async () => {
    const req = new NextRequest('http://localhost:3000/api/health/db');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.database.connected).toBe(true);
    expect(body.database.tables.userTableExists).toBe(true);
    expect(body.database.userCount).toBe(7);
  });

  it('returns 500 on query failure', async () => {
    (db.$queryRaw as jest.Mock).mockReset().mockRejectedValueOnce(new Error('db down'));
    const req = new NextRequest('http://localhost:3000/api/health/db');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
  });
});
