/**
 * Tests for SAM Competency Route - app/api/sam/competency/route.ts
 *
 * Covers: GET (retrieve competency profile), POST (action-based operations)
 * Auth: Uses auth() from @/auth (session-based)
 */

jest.mock('@sam-ai/core', () => ({
  createSAMConfig: jest.fn(() => ({ ai: {} })),
}));

jest.mock('@sam-ai/educational', () => ({
  createCompetencyEngine: jest.fn(() => ({
    getUserCompetency: jest.fn(() => ({ overallScore: 75, skills: [] })),
    getUserPortfolio: jest.fn(() => []),
    getSkillTree: jest.fn(() => ({ nodes: [], edges: [] })),
    getAllSkills: jest.fn(() => []),
    getAllJobRoles: jest.fn(() => []),
    getSkillGapAnalysis: jest.fn(() => ({ gaps: [] })),
    createSkillTree: jest.fn(() => ({ id: 'tree-1' })),
    matchJobRoles: jest.fn(() => []),
    analyzeCareerPath: jest.fn(() => ({ paths: [] })),
    addPortfolioItem: jest.fn(() => ({ id: 'item-1' })),
    updateProficiency: jest.fn(() => ({ updated: true })),
    extractSkills: jest.fn().mockResolvedValue({ skills: [] }),
    generateSkillTree: jest.fn().mockResolvedValue({ tree: {} }),
  })),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  getSAMAdapter: jest.fn().mockResolvedValue({}),
  handleAIAccessError: jest.fn(() => null),
  withSubscriptionGate: jest.fn().mockResolvedValue({ allowed: true }),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn((fn: () => Promise<unknown>) => fn()),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;
    constructor(op: string, ms: number) {
      super(`Timeout: ${op}`);
      this.operationName = op;
      this.timeoutMs = ms;
    }
  },
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000, AI_GENERATION: 60000 },
}));

jest.mock('@/lib/sam/pipeline/feature-enrichment', () => ({
  enrichFeatureResponse: jest.fn(),
}));

import { GET, POST } from '@/app/api/sam/competency/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('GET /api/sam/competency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sam/competency');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns competency profile by default', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/competency');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('returns portfolio when endpoint=portfolio', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/competency?endpoint=portfolio');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('returns 400 for unknown endpoint', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/competency?endpoint=unknown');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when skill-tree endpoint missing treeId', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/competency?endpoint=skill-tree');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns skills list', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/competency?endpoint=skills');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});

describe('POST /api/sam/competency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sam/competency', {
      method: 'POST',
      body: JSON.stringify({ action: 'get-user-competency' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when action is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/competency', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('BAD_REQUEST');
  });

  it('returns competency map', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/competency', {
      method: 'POST',
      body: JSON.stringify({ action: 'get-user-competency', data: {} }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.action).toBe('get-user-competency');
  });

  it('returns 400 for unknown action', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/competency', {
      method: 'POST',
      body: JSON.stringify({ action: 'nonexistent-action' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 500 on internal error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    // Force getSAMAdapter to reject so createCompetencyEngineForUser throws
    const { getSAMAdapter } = require('@/lib/sam/ai-provider');
    getSAMAdapter.mockRejectedValueOnce(new Error('AI adapter init failed'));

    const req = new NextRequest('http://localhost:3000/api/sam/competency', {
      method: 'POST',
      body: JSON.stringify({ action: 'get-user-competency', data: {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
