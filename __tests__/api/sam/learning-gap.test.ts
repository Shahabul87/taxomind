/**
 * Tests for SAM Learning Gap Route - app/api/sam/learning-gap/route.ts
 *
 * Covers: GET (aggregate learning gap dashboard data)
 * Auth: Uses auth() from @/auth (session-based)
 */

jest.mock('@/lib/sam/taxomind-context', () => ({
  getAnalyticsStores: jest.fn(() => ({
    learningGap: {
      getByUser: jest.fn().mockResolvedValue([]),
    },
    topicProgress: {
      getByUser: jest.fn().mockResolvedValue([]),
    },
    skillAssessment: {
      getByUser: jest.fn().mockResolvedValue([]),
    },
    recommendation: {
      getByUser: jest.fn().mockResolvedValue([]),
    },
  })),
  getStore: jest.fn(() => ({
    getUserSkillProfiles: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('@sam-ai/agentic', () => ({
  ContentType: {
    VIDEO: 'VIDEO', ARTICLE: 'ARTICLE', TUTORIAL: 'TUTORIAL',
    DOCUMENTATION: 'DOCUMENTATION', EXERCISE: 'EXERCISE',
    QUIZ: 'QUIZ', PROJECT: 'PROJECT',
  },
  RecommendationPriority: {
    CRITICAL: 'CRITICAL', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW',
  },
  RecommendationReason: {
    KNOWLEDGE_GAP: 'KNOWLEDGE_GAP', SKILL_DECAY: 'SKILL_DECAY',
    PREREQUISITE: 'PREREQUISITE', REINFORCEMENT: 'REINFORCEMENT',
    EXPLORATION: 'EXPLORATION', CHALLENGE: 'CHALLENGE', REVIEW: 'REVIEW',
  },
}));

// Add missing model mocks
import { db } from '@/lib/db';
if (!(db as Record<string, unknown>).sAMSkillAssessment) {
  (db as Record<string, unknown>).sAMSkillAssessment = {
    aggregate: jest.fn(() => Promise.resolve({ _avg: { score: null }, _count: { id: 0 } })),
    groupBy: jest.fn(() => Promise.resolve([])),
  };
}
if (!(db as Record<string, unknown>).sAMLearningGap) {
  (db as Record<string, unknown>).sAMLearningGap = {
    groupBy: jest.fn(() => Promise.resolve([])),
  };
}

import { GET } from '@/app/api/sam/learning-gap/route';
import { auth } from '@/auth';
import { getAnalyticsStores, getStore } from '@/lib/sam/taxomind-context';

const mockAuth = auth as jest.Mock;

describe('GET /api/sam/learning-gap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns learning gap dashboard data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.user.count as jest.Mock).mockResolvedValue(100);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.gaps).toBeDefined();
    expect(data.data.decayData).toBeDefined();
    expect(data.data.trends).toBeDefined();
    expect(data.data.summary).toBeDefined();
  });

  it('returns empty gaps when none found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.user.count as jest.Mock).mockResolvedValue(100);

    const res = await GET();
    const data = await res.json();

    expect(data.data.gaps).toHaveLength(0);
    expect(data.data.summary.total).toBe(0);
  });

  it('includes comparison data with peer metrics', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.user.count as jest.Mock).mockResolvedValue(50);

    const res = await GET();
    const data = await res.json();

    expect(data.data.comparison).toBeDefined();
    expect(data.data.comparison.peerGroupSize).toBeGreaterThan(0);
    expect(data.data.comparison.metrics).toBeDefined();
  });

  it('returns trend analysis data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.user.count as jest.Mock).mockResolvedValue(100);

    const res = await GET();
    const data = await res.json();

    expect(data.data.trends.period).toBe('week');
    expect(data.data.trends.metrics).toBeDefined();
    expect(data.data.trends.overallDirection).toBeDefined();
  });

  it('includes lastUpdated timestamp', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.user.count as jest.Mock).mockResolvedValue(100);

    const res = await GET();
    const data = await res.json();

    expect(data.data.lastUpdated).toBeDefined();
    expect(new Date(data.data.lastUpdated).getTime()).toBeGreaterThan(0);
  });

  it('returns 500 when store initialization fails', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (getAnalyticsStores as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Store init failed');
    });

    const res = await GET();
    expect(res.status).toBe(500);
  });

  it('handles partial data fetch failures gracefully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    const mockStores = {
      learningGap: { getByUser: jest.fn().mockRejectedValue(new Error('Gap fetch failed')) },
      topicProgress: { getByUser: jest.fn().mockResolvedValue([]) },
      skillAssessment: { getByUser: jest.fn().mockResolvedValue([]) },
      recommendation: { getByUser: jest.fn().mockResolvedValue([]) },
    };
    (getAnalyticsStores as jest.Mock).mockReturnValueOnce(mockStores);
    (db.user.count as jest.Mock).mockResolvedValue(100);

    const res = await GET();
    const data = await res.json();

    // Should still return 200 since individual fetch errors are handled
    expect(res.status).toBe(200);
    expect(data.data.gaps).toHaveLength(0);
  });
});
