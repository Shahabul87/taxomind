jest.mock('@/auth.admin', () => ({ adminAuth: jest.fn() }));

import { GET } from '@/app/api/admin/agentic/tools/audit/route';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAdminAuth = adminAuth as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model as Record<string, jest.Mock>;
}

const agentAuditLog = ensureModel('agentAuditLog', ['findMany', 'count']);

describe('/api/admin/agentic/tools/audit route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    agentAuditLog.findMany.mockResolvedValue([
      { id: 'a1', timestamp: new Date(), level: 'INFO', action: 'RUN', userId: 'u1', sessionId: 's1', toolId: 't1', invocationId: 'i1', error: null, metadata: null },
    ]);
    agentAuditLog.count.mockResolvedValue(1);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/agentic/tools/audit'));
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid query', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/agentic/tools/audit?limit=0'));
    expect(res.status).toBe(400);
  });

  it('returns paginated audit entries', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/agentic/tools/audit?limit=10&offset=0'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.total).toBe(1);
    expect(body.data.entries).toHaveLength(1);
  });
});
