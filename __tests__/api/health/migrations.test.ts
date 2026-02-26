jest.mock('@/lib/api/with-api-auth', () => ({
  withAdminAuth: jest.fn((handler: (request: any, context: any) => Promise<any>) => {
    return async (request: any) =>
      handler(request, {
        user: { id: 'admin-1', role: 'ADMIN' },
      });
  }),
}));

import { GET } from '@/app/api/health/migrations/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('/api/health/migrations route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns needsMigration when migration table is missing', async () => {
    (db.$queryRaw as jest.Mock).mockResolvedValueOnce([{ exists: false }]);

    const req = new NextRequest('http://localhost:3000/api/health/migrations');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.needsMigration).toBe(true);
  });

  it('returns migration summary when table exists', async () => {
    (db.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([
        {
          id: 'm1',
          migration_name: '202602260000_init',
          applied_steps_count: 3,
          finished_at: new Date('2026-02-26T00:00:00.000Z'),
          started_at: new Date('2026-02-25T23:59:00.000Z'),
        },
        {
          id: 'm2',
          migration_name: '202602260100_pending',
          applied_steps_count: 0,
          finished_at: null,
          started_at: new Date('2026-02-26T01:00:00.000Z'),
        },
      ]);

    const req = new NextRequest('http://localhost:3000/api/health/migrations');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.migrations.total).toBe(2);
    expect(body.migrations.pending).toBe(1);
  });

  it('returns 500 when migration check fails', async () => {
    (db.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('query failed'));
    const req = new NextRequest('http://localhost:3000/api/health/migrations');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.hint).toContain('prisma migrate deploy');
  });
});
