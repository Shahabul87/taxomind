/**
 * Tests for POST /api/ai/unified-generate
 *
 * Source: app/api/ai/unified-generate/route.ts (997 lines)
 * Uses: getCombinedSession, runSAMChatWithMetadata, withRateLimit, withRetryableTimeout, db
 * Largest AI route - supports multiple contentTypes:
 *   description, learningObjectives, content, chapters, sections,
 *   questions, codeExplanation, mathExplanation, creatorGuidelines
 * Also records tool invocations and generation history (fire-and-forget).
 */

jest.mock('@/lib/auth/combined-session', () => ({
  getCombinedSession: jest.fn(),
}));
jest.mock('@/lib/sam/ai-provider', () => ({
  runSAMChatWithMetadata: jest.fn(),
  handleAIAccessError: jest.fn(() => null),
}));
jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));
jest.mock('@/lib/sam/utils/timeout', () => ({
  withRetryableTimeout: jest.fn(),
  OperationTimeoutError: class OperationTimeoutError extends Error {
    operationName: string;
    timeoutMs: number;
    constructor(op: string, ms: number) {
      super(`Timeout: ${op}`);
      this.operationName = op;
      this.timeoutMs = ms;
    }
  },
  TIMEOUT_DEFAULTS: { AI_GENERATION: 30000 },
}));
jest.mock('@/lib/sam/tools/content-generator', () => ({
  validateContentQuality: jest.fn(() => ({
    score: 85,
    feedback: ['Good quality'],
  })),
}));
jest.mock('@prisma/client', () => ({
  AIGenerationRequest: {
    CONTENT_CREATION: 'CONTENT_CREATION',
    CURRICULUM_DESIGN: 'CURRICULUM_DESIGN',
    ASSESSMENT_DESIGN: 'ASSESSMENT_DESIGN',
    EXPLANATION_CREATION: 'EXPLANATION_CREATION',
  },
  GenerationStatus: {
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
}));

import { getCombinedSession } from '@/lib/auth/combined-session';
import { runSAMChatWithMetadata } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { db } from '@/lib/db';
import { POST } from '@/app/api/ai/unified-generate/route';
import {
  MOCK_USER_ID,
  mockCombinedSession,
  mockRateLimit,
  mockAIMetadata,
  mockTimeout,
  createAIRequest,
  assertUnauthorized,
  assertRateLimited,
  assertBadRequest,
  assertSuccess,
} from './_ai-route-helpers';

const BASE_URL = 'http://localhost:3000/api/ai/unified-generate';

// Ensure fire-and-forget DB models exist on the mock
beforeAll(() => {
  const mockModel = {
    create: jest.fn().mockResolvedValue({}),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
  };
  if (!(db as Record<string, unknown>).agentToolInvocation) {
    (db as Record<string, unknown>).agentToolInvocation = { ...mockModel };
  }
  if (!(db as Record<string, unknown>).aIContentGeneration) {
    (db as Record<string, unknown>).aIContentGeneration = { ...mockModel };
  }
});

const VALID_DESCRIPTION_BODY = {
  contentType: 'description',
  entityLevel: 'course',
  entityTitle: 'React Masterclass',
  context: {},
};

const VALID_OBJECTIVES_BODY = {
  contentType: 'learningObjectives',
  entityLevel: 'section',
  entityTitle: 'Understanding Hooks',
  context: {},
};

const VALID_CHAPTERS_BODY = {
  contentType: 'chapters',
  entityLevel: 'course',
  entityTitle: 'Node.js Course',
  context: { course: { title: 'Node.js Course' } },
  chapterSettings: {
    chapterCount: 3,
    difficulty: 'intermediate',
    targetDuration: '3 hours',
    focusAreas: [],
    includeKeywords: '',
    additionalInstructions: '',
  },
};

const VALID_SECTIONS_BODY = {
  contentType: 'sections',
  entityLevel: 'chapter',
  entityTitle: 'React State Management',
  context: { chapter: { title: 'React State Management' } },
  sectionSettings: {
    sectionCount: 4,
    contentType: 'mixed',
    includeAssessment: true,
    focusAreas: [],
    additionalInstructions: '',
  },
};

describe('POST /api/ai/unified-generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock);
    mockTimeout(withRetryableTimeout as jest.Mock);
    if ((db as Record<string, unknown>).agentToolInvocation) {
      ((db as Record<string, unknown>).agentToolInvocation as Record<string, jest.Mock>).create.mockResolvedValue({});
    }
    if ((db as Record<string, unknown>).aIContentGeneration) {
      ((db as Record<string, unknown>).aIContentGeneration as Record<string, jest.Mock>).create.mockResolvedValue({});
    }
  });

  // ----- Auth -----

  it('returns 401 when not authenticated', async () => {
    mockCombinedSession(getCombinedSession as jest.Mock, null);
    const res = await POST(createAIRequest(BASE_URL, VALID_DESCRIPTION_BODY));
    await assertUnauthorized(res);
  });

  // ----- Rate limit -----

  it('returns 429 when rate limited', async () => {
    mockRateLimit(withRateLimit as jest.Mock, true);
    const res = await POST(createAIRequest(BASE_URL, VALID_DESCRIPTION_BODY));
    await assertRateLimited(res);
  });

  // ----- Validation -----

  it('returns 400 when entityTitle is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, {
      contentType: 'description',
      entityLevel: 'course',
      context: {},
    }));
    await assertBadRequest(res);
  });

  it('returns 400 when contentType is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_DESCRIPTION_BODY,
      contentType: 'unknown',
    }));
    await assertBadRequest(res);
  });

  it('returns 400 when entityLevel is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_DESCRIPTION_BODY,
      entityLevel: 'module',
    }));
    await assertBadRequest(res);
  });

  it('returns 400 when context is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, {
      contentType: 'description',
      entityLevel: 'course',
      entityTitle: 'Test',
    }));
    await assertBadRequest(res);
  });

  // ----- Description generation -----

  it('returns 200 with description on success', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: 'A comprehensive React course for developers.',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_DESCRIPTION_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.content).toContain('React');
  });

  // ----- Learning objectives -----

  it('returns 200 with learning objectives on success', async () => {
    const objectives = '<ul><li>Understand React hooks</li></ul>';
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: objectives,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_OBJECTIVES_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.content).toContain('<ul>');
  });

  // ----- Chapters generation -----

  it('returns 200 with chapters JSON array on success', async () => {
    const chapters = JSON.stringify(['Intro to Node.js', 'Express Basics', 'Databases']);
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: chapters,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_CHAPTERS_BODY));
    await assertSuccess(res);
    const body = await res.json();
    const parsed = JSON.parse(body.content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(3);
  });

  it('handles chapters with object items by extracting titles', async () => {
    const chapters = JSON.stringify([
      { title: 'Intro' },
      { title: 'Core' },
      { title: 'Advanced' },
    ]);
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: chapters,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_CHAPTERS_BODY));
    await assertSuccess(res);
    const body = await res.json();
    const parsed = JSON.parse(body.content);
    expect(parsed[0]).toBe('Intro');
  });

  // ----- Sections generation -----

  it('returns 200 with sections JSON array on success', async () => {
    const sections = JSON.stringify(['Intro', 'useState', 'useEffect', 'Quiz']);
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: sections,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_SECTIONS_BODY));
    await assertSuccess(res);
    const body = await res.json();
    const parsed = JSON.parse(body.content);
    expect(Array.isArray(parsed)).toBe(true);
  });

  // ----- Creator guidelines -----

  it('returns 200 with creator guidelines on success', async () => {
    const guidelines = '<h3>Video Production Guide</h3><p>Record a 10-min video</p>';
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: guidelines,
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, {
      contentType: 'creatorGuidelines',
      entityLevel: 'section',
      entityTitle: 'React Hooks Overview',
      context: { section: { title: 'React Hooks Overview' } },
    }));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.content).toContain('Video Production');
  });

  // ----- Blooms taxonomy -----

  it('includes blooms levels in metadata when enabled', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: '<ul><li>Analyze patterns</li></ul>',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_OBJECTIVES_BODY,
      bloomsEnabled: true,
      bloomsLevels: { analyze: true, evaluate: true },
    }));
    const body = await res.json();
    expect(body.metadata.bloomsLevels).toBeDefined();
  });

  // ----- Advanced mode -----

  it('accepts advanced settings', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: 'Advanced content.',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_DESCRIPTION_BODY,
      advancedMode: true,
      advancedSettings: {
        targetAudience: 'seniors',
        difficulty: 'advanced',
        tone: 'academic',
        creativity: 8,
        detailLevel: 9,
      },
    }));
    await assertSuccess(res);
  });

  // ----- Quality score -----

  it('includes quality score in metadata', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: 'Generated content here.',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    const res = await POST(createAIRequest(BASE_URL, VALID_DESCRIPTION_BODY));
    const body = await res.json();
    expect(body.metadata.qualityScore).toBe(85);
  });

  // ----- Error handling -----

  it('falls back to mock on AI error', async () => {
    (runSAMChatWithMetadata as jest.Mock).mockRejectedValue(new Error('API error'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_DESCRIPTION_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.warning).toContain('unavailable');
  });

  it('returns 504 on inner OperationTimeoutError', async () => {
    (withRetryableTimeout as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('unified-generate', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_DESCRIPTION_BODY));
    expect(res.status).toBe(504);
  });

  it('returns 504 on outer OperationTimeoutError', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(
      new OperationTimeoutError('unified-generate', 30000),
    );

    const res = await POST(createAIRequest(BASE_URL, VALID_DESCRIPTION_BODY));
    expect(res.status).toBe(504);
  });

  it('returns 500 on unexpected errors', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(new Error('Unexpected'));

    const res = await POST(createAIRequest(BASE_URL, VALID_DESCRIPTION_BODY));
    expect(res.status).toBe(500);
  });

  // ----- Fire-and-forget tracking -----

  it('records tool invocation on success', async () => {
    mockAIMetadata(runSAMChatWithMetadata as jest.Mock, {
      content: 'Content',
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
    });

    await POST(createAIRequest(BASE_URL, VALID_DESCRIPTION_BODY));

    // Fire-and-forget call should have been made
    const invocationModel = (db as Record<string, unknown>).agentToolInvocation as Record<string, jest.Mock>;
    expect(invocationModel.create).toHaveBeenCalled();
  });
});
