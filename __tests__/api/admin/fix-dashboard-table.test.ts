jest.mock('@/lib/api/with-api-auth', () => ({
  withAdminAuth: (handler: any) => async (...args: any[]) => handler(...args),
}));

jest.mock('@/lib/api-utils', () => ({
  successResponse: (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 }),
  errorResponse: (_code: string, message: string, status: number) => new Response(JSON.stringify({ success: false, error: message }), { status }),
  ErrorCodes: { INTERNAL_ERROR: 'INTERNAL_ERROR' },
  HttpStatus: { INTERNAL_ERROR: 500 },
}));

import { GET, POST } from '@/app/api/admin/fix-dashboard-table/route';
import { db } from '@/lib/db';

let tableExists = false;

beforeEach(() => {
  jest.clearAllMocks();
  tableExists = false;
  (db.$queryRaw as jest.Mock).mockImplementation(async (query: TemplateStringsArray) => {
    const sql = String(query[0] || '');
    if (sql.includes('information_schema.tables')) return [{ exists: tableExists }];
    if (sql.includes('COUNT(*) as count FROM dashboard_activities')) return [{ count: 0n }];
    return [];
  });
  (db.$executeRaw as jest.Mock).mockResolvedValue(1);
});

describe('/api/admin/fix-dashboard-table route', () => {
  it('GET reports missing table when not present', async () => {
    const res = await GET(new Request('http://localhost') as never, {} as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('POST returns no_action_needed when table exists', async () => {
    tableExists = true;
    const res = await POST(new Request('http://localhost', { method: 'POST' }) as never, {} as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.status).toBe('no_action_needed');
  });

  it('POST creates table when missing', async () => {
    const res = await POST(new Request('http://localhost', { method: 'POST' }) as never, {} as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.status).toBe('table_created');
    expect(db.$executeRaw).toHaveBeenCalled();
  });
});
