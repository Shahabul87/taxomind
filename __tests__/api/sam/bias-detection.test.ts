/**
 * Tests for SAM Bias Detection Route - app/api/sam/bias-detection/analyze/route.ts
 *
 * Covers: POST (analyze content for bias), GET (bias detection history)
 * Auth: Uses auth() from @/auth (session-based)
 */

jest.mock('@/lib/sam/ai-provider', () => ({
  withSubscriptionGate: jest.fn().mockResolvedValue({ allowed: true }),
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(() => null),
}));

// Add missing model mock
import { db } from '@/lib/db';
if (!(db as Record<string, unknown>).sAMIntegrityCheck) {
  (db as Record<string, unknown>).sAMIntegrityCheck = {
    create: jest.fn(() =>
      Promise.resolve({
        id: 'check-1',
        checkedAt: new Date(),
      })
    ),
    findMany: jest.fn(() => Promise.resolve([])),
    count: jest.fn(() => Promise.resolve(0)),
  };
}

import { POST, GET } from '@/app/api/sam/bias-detection/analyze/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('POST /api/sam/bias-detection/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ((db as Record<string, unknown>).sAMIntegrityCheck as { create: jest.Mock }).create
      .mockResolvedValue({ id: 'check-1', checkedAt: new Date() });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze', {
      method: 'POST',
      body: JSON.stringify({
        contentId: 'c1',
        contentType: 'lesson_content',
        content: 'This is a test content for bias analysis.',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('analyzes clean content and returns low bias', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze', {
      method: 'POST',
      body: JSON.stringify({
        contentId: 'content-1',
        contentType: 'lesson_content',
        content: 'Programming is about solving problems through logical thinking and practice. Everyone can learn these skills with dedication.',
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.overallSeverity).toBeDefined();
    expect(data.data.biasScores).toBeDefined();
    expect(data.data.passesThreshold).toBe(true);
  });

  it('detects gender bias in content', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze', {
      method: 'POST',
      body: JSON.stringify({
        contentId: 'content-2',
        contentType: 'lesson_content',
        content: 'Boys are naturally better at math. Girls are emotional women who prefer arts.',
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.biasScores.gender).toBeGreaterThan(0);
    expect(data.data.indicators.length).toBeGreaterThan(0);
  });

  it('returns severity scoring', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze', {
      method: 'POST',
      body: JSON.stringify({
        contentId: 'content-3',
        contentType: 'general',
        content: 'A simple and neutral educational text about mathematics and science for all learners.',
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(['none', 'low', 'medium', 'high', 'critical']).toContain(data.data.overallSeverity);
  });

  it('generates recommendations', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze', {
      method: 'POST',
      body: JSON.stringify({
        contentId: 'content-4',
        contentType: 'lesson_content',
        content: 'Everyone has easy access to computers. Simply buy the latest hardware to start learning programming.',
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.recommendations.length).toBeGreaterThan(0);
  });

  it('returns 400 for invalid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze', {
      method: 'POST',
      body: JSON.stringify({ contentId: '', content: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('supports custom threshold', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze', {
      method: 'POST',
      body: JSON.stringify({
        contentId: 'content-5',
        contentType: 'general',
        content: 'A neutral educational passage about learning strategies for diverse student populations.',
        threshold: 10,
      }),
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.metadata.threshold).toBe(10);
  });

  it('returns 500 on database error', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    ((db as Record<string, unknown>).sAMIntegrityCheck as { create: jest.Mock }).create
      .mockRejectedValueOnce(new Error('DB error'));

    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze', {
      method: 'POST',
      body: JSON.stringify({
        contentId: 'content-6',
        contentType: 'general',
        content: 'Test content for database error scenario in bias detection.',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/sam/bias-detection/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns bias detection history', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    ((db as Record<string, unknown>).sAMIntegrityCheck as { findMany: jest.Mock }).findMany
      .mockResolvedValue([]);
    ((db as Record<string, unknown>).sAMIntegrityCheck as { count: jest.Mock }).count
      .mockResolvedValue(0);

    const req = new NextRequest('http://localhost:3000/api/sam/bias-detection/analyze');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.history).toBeDefined();
    expect(data.data.pagination).toBeDefined();
  });
});
