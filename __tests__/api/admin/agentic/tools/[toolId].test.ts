jest.mock('@/auth.admin', () => ({ adminAuth: jest.fn() }));

import { PATCH } from '@/app/api/admin/agentic/tools/[toolId]/route';
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

const agentTool = ensureModel('agentTool', ['update']);

describe('/api/admin/agentic/tools/[toolId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    agentTool.update.mockResolvedValue({ id: 't1', enabled: true, deprecated: false, deprecationMessage: null, confirmationType: 'none', requiredPermissions: [], updatedAt: new Date() });
  });

  it('returns 401 when not admin', async () => {
    mockAdminAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/admin/agentic/tools/t1', { method: 'PATCH', body: JSON.stringify({ enabled: true }) });
    const res = await PATCH(req, { params: { toolId: 't1' } });
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/agentic/tools/t1', { method: 'PATCH', body: JSON.stringify({ enabled: 'yes' }) });
    const res = await PATCH(req, { params: { toolId: 't1' } });
    expect(res.status).toBe(400);
  });

  it('updates tool settings', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/agentic/tools/t1', { method: 'PATCH', body: JSON.stringify({ enabled: true }) });
    const res = await PATCH(req, { params: { toolId: 't1' } });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(agentTool.update).toHaveBeenCalled();
  });
});
