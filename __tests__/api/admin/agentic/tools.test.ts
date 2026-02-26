jest.mock('@/auth.admin', () => ({ adminAuth: jest.fn() }));

import { GET } from '@/app/api/admin/agentic/tools/route';
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

const agentTool = ensureModel('agentTool', ['findMany']);

describe('/api/admin/agentic/tools route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    agentTool.findMany.mockResolvedValue([
      { id: 't1', name: 'Tool 1', description: 'd', category: 'cat', version: '1', requiredPermissions: ['execute'], confirmationType: 'none', timeoutMs: 1000, maxRetries: 1, tags: [], enabled: true, deprecated: false, deprecationMessage: null, updatedAt: new Date() },
    ]);
  });

  it('returns 401 when not admin', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/agentic/tools'));
    expect(res.status).toBe(401);
  });

  it('returns tools list', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/admin/agentic/tools'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tools).toHaveLength(1);
  });

  it('applies includeDisabled query', async () => {
    await GET(new NextRequest('http://localhost:3000/api/admin/agentic/tools?includeDisabled=true'));
    expect(agentTool.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: undefined }));
  });
});
