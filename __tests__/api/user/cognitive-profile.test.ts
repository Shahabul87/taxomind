jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, POST } from '@/app/api/user/cognitive-profile/route';
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
  return model;
}

const userCognitiveProfile = ensureModel('userCognitiveProfile', ['findUnique', 'create']);
const userExamAttempt = ensureModel('userExamAttempt', ['findMany']);
const studentBloomsProgress = ensureModel('studentBloomsProgress', ['findMany']);
const bloomsPerformanceMetric = ensureModel('bloomsPerformanceMetric', ['findMany']);

describe('/api/user/cognitive-profile route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    userCognitiveProfile.findUnique.mockResolvedValue(null);
    userCognitiveProfile.create.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      overallLevel: 1,
      levelName: 'REMEMBERER',
      rememberScore: 100,
      understandScore: 0,
      applyScore: 0,
      analyzeScore: 0,
      evaluateScore: 0,
      createScore: 0,
      rememberXP: 0,
      understandXP: 0,
      applyXP: 0,
      analyzeXP: 0,
      evaluateXP: 0,
      createXP: 0,
      rememberLevel: 1,
      understandLevel: 0,
      applyLevel: 0,
      analyzeLevel: 0,
      evaluateLevel: 0,
      createLevel: 0,
      startingLevel: 1,
      peakLevel: null,
      totalGrowth: 0,
      primaryGrowthArea: null,
      topStrengths: ['remember'],
      totalActivities: 0,
      lastActivityAt: null,
      milestones: [],
    });

    userExamAttempt.findMany.mockResolvedValue([]);
    studentBloomsProgress.findMany.mockResolvedValue([]);
    bloomsPerformanceMetric.findMany.mockResolvedValue([]);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/user/cognitive-profile');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET creates and returns default cognitive profile when none exists', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/cognitive-profile', {
      headers: { 'x-request-id': 'req-cog-1' },
    });
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('user-1');
    expect(body.data.levelName).toBe('Rememberer');
    expect(body.metadata.requestId).toBe('req-cog-1');
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/user/cognitive-profile', {
      method: 'POST',
      body: JSON.stringify({ force: true }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
