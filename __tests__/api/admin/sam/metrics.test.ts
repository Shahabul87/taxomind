import { POST } from '@/app/api/admin/sam/metrics/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

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

const samToolExecution = ensureModel('sAMToolExecution', ['findMany']);
const samConfidenceScore = ensureModel('sAMConfidenceScore', ['findMany']);
const samMemoryRetrieval = ensureModel('sAMMemoryRetrieval', ['findMany']);
const samPlanLifecycleEvent = ensureModel('sAMPlanLifecycleEvent', ['findMany']);

describe('/api/admin/sam/metrics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    samToolExecution.findMany.mockResolvedValue([{ id: 'e1', toolName: 'toolA', status: 'SUCCESS', durationMs: 120, confirmationRequired: false, createdAt: new Date() }]);
    samConfidenceScore.findMany.mockResolvedValue([{ responseType: 'chat', predictedConfidence: 0.9, accurate: true }]);
    samMemoryRetrieval.findMany.mockResolvedValue([{ source: 'vector', resultCount: 2, avgRelevanceScore: 0.8, cacheHit: true, latencyMs: 15 }]);
    samPlanLifecycleEvent.findMany.mockResolvedValue([{ planId: 'p1', eventType: 'STARTED' }]);
  });

  it('returns 401 when not admin', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/admin/sam/metrics', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns aggregated metrics payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/sam/metrics', { method: 'POST', body: JSON.stringify({ timeRange: '24h' }) });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.toolMetrics.totalExecutions).toBeGreaterThanOrEqual(1);
  });

  it('returns 500 when metrics query fails', async () => {
    samToolExecution.findMany.mockRejectedValueOnce(new Error('db down'));
    const req = new NextRequest('http://localhost:3000/api/admin/sam/metrics', { method: 'POST', body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
