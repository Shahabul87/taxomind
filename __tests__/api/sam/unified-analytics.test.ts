jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/sam/unified-analytics/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const typedDb = db as Record<string, unknown>;

typedDb.sAMLearningProfile = typedDb.sAMLearningProfile || { findUnique: jest.fn() };
typedDb.sAMConversation = typedDb.sAMConversation || { findMany: jest.fn() };
typedDb.sAMPoints = typedDb.sAMPoints || { findFirst: jest.fn() };
typedDb.learning_metrics = typedDb.learning_metrics || { findMany: jest.fn() };
typedDb.enrollment = typedDb.enrollment || { findMany: jest.fn() };
typedDb.sAMInteraction = typedDb.sAMInteraction || { findMany: jest.fn() };

const mockLearningProfileFindUnique = (typedDb.sAMLearningProfile as { findUnique: jest.Mock }).findUnique;
const mockConversationFindMany = (typedDb.sAMConversation as { findMany: jest.Mock }).findMany;
const mockPointsFindFirst = (typedDb.sAMPoints as { findFirst: jest.Mock }).findFirst;
const mockLearningMetricsFindMany = (typedDb.learning_metrics as { findMany: jest.Mock }).findMany;
const mockEnrollmentFindMany = (typedDb.enrollment as { findMany: jest.Mock }).findMany;
const mockInteractionFindMany = (typedDb.sAMInteraction as { findMany: jest.Mock }).findMany;

describe('/api/sam/unified-analytics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    mockLearningProfileFindUnique.mockResolvedValue(null);
    mockConversationFindMany.mockResolvedValue([]);
    mockPointsFindFirst.mockResolvedValue(null);
    mockLearningMetricsFindMany.mockResolvedValue([]);
    mockEnrollmentFindMany.mockResolvedValue([]);
    mockInteractionFindMany.mockResolvedValue([]);
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/unified-analytics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns unified analytics with default values when data is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/unified-analytics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.userId).toBe('user-1');
    expect(body.data.learningStyle.primaryStyle).toBe('multimodal');
    expect(body.data.socraticDialogue.totalDialogues).toBe(0);
    expect(body.data.achievements.level).toBe(1);
    expect(body.data.cognitiveProgress.currentLevel).toBe('REMEMBER');
  });

  it('continues successfully when non-critical DB sources reject', async () => {
    mockLearningProfileFindUnique.mockRejectedValueOnce(new Error('profile source down'));
    mockConversationFindMany.mockRejectedValueOnce(new Error('conversation source down'));
    mockPointsFindFirst.mockRejectedValueOnce(new Error('points source down'));
    mockLearningMetricsFindMany.mockRejectedValueOnce(new Error('metrics source down'));
    mockEnrollmentFindMany.mockRejectedValueOnce(new Error('enrollment source down'));
    mockInteractionFindMany.mockRejectedValueOnce(new Error('interaction source down'));

    const req = new NextRequest('http://localhost:3000/api/sam/unified-analytics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.learningStyle.primaryStyle).toBe('multimodal');
  });

  it('returns computed analytics when data is available', async () => {
    mockLearningProfileFindUnique.mockResolvedValueOnce({
      learningStyle: 'visual',
      preferredDifficulty: 'advanced',
      weaknesses: ['graphs', 'recall'],
      interactionPreferences: { preferredResponseLength: 'concise' },
    });

    mockConversationFindMany.mockResolvedValueOnce([
      {
        id: 'conv-1',
        title: 'Algebra session',
        messages: [{ id: 'm1', content: 'x', createdAt: new Date() }],
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      },
      {
        id: 'conv-2',
        title: 'Physics session',
        messages: [
          { id: 'm2', content: 'y', createdAt: new Date() },
          { id: 'm3', content: 'z', createdAt: new Date() },
        ],
        createdAt: new Date('2026-01-03T00:00:00.000Z'),
        updatedAt: new Date('2026-01-04T00:00:00.000Z'),
      },
    ]);

    mockPointsFindFirst.mockResolvedValueOnce({
      points: 250,
      streak: 4,
      level: 3,
      badges: ['Starter'],
      completedChallenges: ['Challenge A'],
      activeChallenges: ['Challenge B'],
    });

    mockLearningMetricsFindMany.mockResolvedValueOnce([
      {
        overallProgress: 80,
        totalStudyTime: 120,
        engagementScore: 90,
        course: { title: 'Algorithms 101' },
      },
    ]);

    mockEnrollmentFindMany.mockResolvedValueOnce([
      {
        progress: 55,
        course: {
          chapters: [{ sections: [{ id: 's1' }] }],
        },
      },
    ]);

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    mockInteractionFindMany.mockResolvedValueOnce([
      { createdAt: new Date(now - 1 * day), context: {} },
      { createdAt: new Date(now - 20 * day), context: {} },
      { createdAt: new Date(now - 21 * day), context: {} },
      { createdAt: new Date(now - 22 * day), context: {} },
      { createdAt: new Date(now - 23 * day), context: {} },
      { createdAt: new Date(now - 24 * day), context: {} },
      { createdAt: new Date(now - 25 * day), context: {} },
      { createdAt: new Date(now - 26 * day), context: {} },
    ]);

    const req = new NextRequest('http://localhost:3000/api/sam/unified-analytics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.learningStyle.primaryStyle).toBe('visual');
    expect(body.data.learningStyle.readingPace).toBe('fast');
    expect(body.data.socraticDialogue.totalDialogues).toBe(2);
    expect(body.data.achievements.level).toBe(3);
    expect(body.data.retention.overallRetention).toBe(50);
    expect(body.data.predictions.successProbability).toBeGreaterThan(0);
  });

  it('returns 500 when the handler throws unexpectedly', async () => {
    mockCurrentUser.mockRejectedValueOnce(new Error('unexpected failure'));

    const req = new NextRequest('http://localhost:3000/api/sam/unified-analytics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
