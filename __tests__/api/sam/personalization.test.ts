/**
 * Tests for SAM Personalization Route - app/api/sam/personalization/route.ts
 *
 * Covers: POST (personalization actions), GET (fetch personalization data)
 * Auth: Uses auth() from @/auth (session-based)
 */

jest.mock('@sam-ai/educational', () => ({
  createPersonalizationEngine: jest.fn(() => ({
    detectLearningStyle: jest.fn().mockResolvedValue({ primaryStyle: 'visual', confidence: 0.85 }),
    optimizeCognitiveLoad: jest.fn().mockResolvedValue({ optimized: true }),
    recognizeEmotionalState: jest.fn().mockResolvedValue({ emotion: 'engaged' }),
    analyzeMotivationPatterns: jest.fn().mockResolvedValue({ level: 'high' }),
    generatePersonalizedPath: jest.fn().mockResolvedValue({ steps: [] }),
    applyPersonalization: jest.fn().mockResolvedValue({ applied: true }),
  })),
}));

jest.mock('@/lib/adapters', () => ({
  getUserScopedSAMConfig: jest.fn().mockResolvedValue({ ai: {} }),
  getDatabaseAdapter: jest.fn(() => ({})),
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
  TIMEOUT_DEFAULTS: { AI_ANALYSIS: 30000 },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  handleAIAccessError: jest.fn(() => null),
}));

// Add missing model mocks not in global jest.setup.js
import { db } from '@/lib/db';
const mockModel = () => ({
  findMany: jest.fn(() => Promise.resolve([])),
  findUnique: jest.fn(),
  findFirst: jest.fn(() => Promise.resolve(null)),
  create: jest.fn(),
  count: jest.fn(() => Promise.resolve(0)),
  groupBy: jest.fn(() => Promise.resolve([])),
});
if (!(db as Record<string, unknown>).user_progress) {
  (db as Record<string, unknown>).user_progress = mockModel();
}
if (!(db as Record<string, unknown>).realtime_activities) {
  (db as Record<string, unknown>).realtime_activities = {
    findMany: jest.fn(() => Promise.resolve([])),
  };
}
if (!(db as Record<string, unknown>).user_achievements) {
  (db as Record<string, unknown>).user_achievements = {
    findMany: jest.fn(() => Promise.resolve([])),
  };
}
if (!(db as Record<string, unknown>).learningStyleAnalysis) {
  (db as Record<string, unknown>).learningStyleAnalysis = {
    findFirst: jest.fn(() => Promise.resolve(null)),
  };
}
if (!(db as Record<string, unknown>).emotionalStateAnalysis) {
  (db as Record<string, unknown>).emotionalStateAnalysis = {
    findFirst: jest.fn(() => Promise.resolve(null)),
  };
}
if (!(db as Record<string, unknown>).motivationProfile) {
  (db as Record<string, unknown>).motivationProfile = {
    findFirst: jest.fn(() => Promise.resolve(null)),
  };
}
if (!(db as Record<string, unknown>).personalizedLearningPath) {
  (db as Record<string, unknown>).personalizedLearningPath = {
    findFirst: jest.fn(() => Promise.resolve(null)),
  };
}

import { POST, GET } from '@/app/api/sam/personalization/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('POST /api/sam/personalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sam/personalization', {
      method: 'POST',
      body: JSON.stringify({ action: 'detect-learning-style', data: {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when action is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/personalization', {
      method: 'POST',
      body: JSON.stringify({ data: {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when data is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/personalization', {
      method: 'POST',
      body: JSON.stringify({ action: 'detect-learning-style' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('detects learning style', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    // Mock the DB calls that buildLearningBehavior makes
    ((db as Record<string, unknown>).realtime_activities as { findMany: jest.Mock }).findMany
      .mockResolvedValue([]);
    ((db as Record<string, unknown>).user_achievements as { findMany: jest.Mock }).findMany
      .mockResolvedValue([]);
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/sam/personalization', {
      method: 'POST',
      body: JSON.stringify({ action: 'detect-learning-style', data: {} }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.action).toBe('detect-learning-style');
  });

  it('returns 400 for invalid action', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/personalization', {
      method: 'POST',
      body: JSON.stringify({ action: 'invalid-action', data: {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid action');
  });

  it('returns 500 on engine error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const { withRetryableTimeout } = require('@/lib/sam/utils/timeout');
    withRetryableTimeout.mockRejectedValueOnce(new Error('Engine failure'));

    const req = new NextRequest('http://localhost:3000/api/sam/personalization', {
      method: 'POST',
      body: JSON.stringify({ action: 'detect-learning-style', data: {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/sam/personalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sam/personalization');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns overview data by default', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/personalization');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.type).toBe('overview');
  });
});
