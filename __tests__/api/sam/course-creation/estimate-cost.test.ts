jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/sam/course-creation/cost-estimator', () => ({
  estimateCourseCost: jest.fn(),
}));

jest.mock('@/lib/sam/course-creation/experiments', () => ({
  getActiveExperiments: jest.fn(),
  joinVariants: jest.fn(),
}));

jest.mock('@/lib/ai/platform-settings-cache', () => ({
  getCachedPlatformAISettings: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    userAIPreferences: {
      findUnique: jest.fn(),
    },
  },
}));

import { POST } from '@/app/api/sam/course-creation/estimate-cost/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { estimateCourseCost } from '@/lib/sam/course-creation/cost-estimator';
import { getActiveExperiments, joinVariants } from '@/lib/sam/course-creation/experiments';
import { getCachedPlatformAISettings } from '@/lib/ai/platform-settings-cache';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const mockEstimateCourseCost = estimateCourseCost as jest.Mock;
const mockGetActiveExperiments = getActiveExperiments as jest.Mock;
const mockJoinVariants = joinVariants as jest.Mock;
const mockGetCachedSettings = getCachedPlatformAISettings as jest.Mock;
const userAIPreferences = (db as any).userAIPreferences as Record<string, jest.Mock>;

function req(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/sam/course-creation/estimate-cost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validBody() {
  return {
    totalChapters: 4,
    sectionsPerChapter: 3,
    difficulty: 'intermediate',
    bloomsFocusCount: 3,
    learningObjectivesPerChapter: 5,
    learningObjectivesPerSection: 3,
  };
}

describe('POST /api/sam/course-creation/estimate-cost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    userAIPreferences.findUnique.mockResolvedValue({
      preferredGlobalProvider: 'openai',
      preferredCourseProvider: null,
    });
    mockGetCachedSettings.mockResolvedValue({
      defaultProvider: 'deepseek',
      anthropicEnabled: true,
      deepseekEnabled: true,
      openaiEnabled: true,
      geminiEnabled: true,
      mistralEnabled: true,
      anthropicInputPrice: 3,
      anthropicOutputPrice: 15,
      deepseekInputPrice: 0.27,
      deepseekOutputPrice: 1.1,
      openaiInputPrice: 5,
      openaiOutputPrice: 15,
      geminiInputPrice: 0.35,
      geminiOutputPrice: 0.53,
      mistralInputPrice: 2,
      mistralOutputPrice: 6,
    });
    mockGetActiveExperiments.mockResolvedValue([{ experiment: 'chapter_batching', variant: 'on' }]);
    mockJoinVariants.mockReturnValue('chapter_batching:on');
    mockEstimateCourseCost.mockReturnValue({
      provider: 'OpenAI (GPT)',
      totalCostUsd: 1.25,
      totalTokens: 30000,
      estimatedMinutes: 12,
    });
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));

    const res = await POST(req(validBody()));
    expect(res.status).toBe(429);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(req(validBody()));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 when payload validation fails', async () => {
    const res = await POST(req({ totalChapters: 0, sectionsPerChapter: 0, difficulty: 'bad' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Validation failed');
  });

  it('returns cost estimate payload', async () => {
    const res = await POST(req(validBody()));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.estimate.totalCostUsd).toBe(1.25);
    expect(mockEstimateCourseCost).toHaveBeenCalled();
    expect(mockGetActiveExperiments).toHaveBeenCalledWith('user-1');
  });

  it('returns 500 when estimation fails', async () => {
    mockEstimateCourseCost.mockImplementationOnce(() => {
      throw new Error('calc failed');
    });

    const res = await POST(req(validBody()));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
