/**
 * Tests for POST /api/ai/advanced-exam-generator
 *
 * Source: app/api/ai/advanced-exam-generator/route.ts
 * Uses: getCombinedSession, handleAIAccessError, withRateLimit, withRetryableTimeout
 * Also uses: generateExamWithSAM from lib/sam/exam-generation
 * Has SAM integration path (default) and legacy fallback.
 * Rate limit key: 'heavy' (not 'ai')
 */

jest.mock('@/lib/auth/combined-session', () => ({
  getCombinedSession: jest.fn(),
}));
jest.mock('@/lib/sam/ai-provider', () => ({
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
jest.mock('@/lib/ai-question-generator', () => ({
  AdvancedQuestionGenerator: {
    getInstance: jest.fn(() => ({
      generateOptimalBloomsDistribution: jest.fn(() => ({
        REMEMBER: 2,
        UNDERSTAND: 3,
        APPLY: 2,
        ANALYZE: 1,
        EVALUATE: 1,
        CREATE: 1,
      })),
      validateQuestionAlignment: jest.fn(() => ({
        isValid: true,
        bloomsAlignment: 0.8,
        suggestions: [],
        pedagogicalWarnings: [],
      })),
    })),
  },
  EnhancedQuestion: {},
  ENHANCED_BLOOMS_FRAMEWORK: {
    REMEMBER: { questionStarters: ['What is'], verbs: ['Define', 'List'], assessmentFocus: 'Recall', cognitiveLoad: 1, typicalQuestionTypes: ['MULTIPLE_CHOICE'], prerequisites: [] },
    UNDERSTAND: { questionStarters: ['Explain'], verbs: ['Describe', 'Explain'], assessmentFocus: 'Comprehension', cognitiveLoad: 2, typicalQuestionTypes: ['SHORT_ANSWER'], prerequisites: [] },
    APPLY: { questionStarters: ['How would'], verbs: ['Apply', 'Solve'], assessmentFocus: 'Application', cognitiveLoad: 3, typicalQuestionTypes: ['MULTIPLE_CHOICE'], prerequisites: [] },
    ANALYZE: { questionStarters: ['Compare'], verbs: ['Analyze', 'Compare'], assessmentFocus: 'Analysis', cognitiveLoad: 4, typicalQuestionTypes: ['ESSAY'], prerequisites: [] },
    EVALUATE: { questionStarters: ['Judge'], verbs: ['Evaluate', 'Judge'], assessmentFocus: 'Evaluation', cognitiveLoad: 5, typicalQuestionTypes: ['ESSAY'], prerequisites: [] },
    CREATE: { questionStarters: ['Design'], verbs: ['Create', 'Design'], assessmentFocus: 'Synthesis', cognitiveLoad: 5, typicalQuestionTypes: ['ESSAY'], prerequisites: [] },
  },
}));
jest.mock('@/lib/sam/exam-generation/exam-generator-service', () => ({
  generateExamWithSAM: jest.fn(),
}));
jest.mock('@prisma/client', () => ({
  BloomsLevel: {
    REMEMBER: 'REMEMBER',
    UNDERSTAND: 'UNDERSTAND',
    APPLY: 'APPLY',
    ANALYZE: 'ANALYZE',
    EVALUATE: 'EVALUATE',
    CREATE: 'CREATE',
  },
  QuestionType: {
    MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
    TRUE_FALSE: 'TRUE_FALSE',
    SHORT_ANSWER: 'SHORT_ANSWER',
    ESSAY: 'ESSAY',
    FILL_IN_BLANK: 'FILL_IN_BLANK',
    MATCHING: 'MATCHING',
    ORDERING: 'ORDERING',
  },
}));

import { getCombinedSession } from '@/lib/auth/combined-session';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout } from '@/lib/sam/utils/timeout';
import { generateExamWithSAM } from '@/lib/sam/exam-generation/exam-generator-service';
import { POST } from '@/app/api/ai/advanced-exam-generator/route';
import {
  mockCombinedSession,
  mockRateLimit,
  mockTimeout,
  createAIRequest,
  assertUnauthorized,
  assertRateLimited,
  assertBadRequest,
  assertSuccess,
} from './_ai-route-helpers';

const BASE_URL = 'http://localhost:3000/api/ai/advanced-exam-generator';

const VALID_BODY = {
  sectionTitle: 'React Hooks',
  questionCount: 5,
  targetAudience: 'intermediate',
  assessmentPurpose: 'summative',
};

const MOCK_SAM_RESULT = {
  success: true,
  questions: [
    {
      id: 'q1',
      bloomsLevel: 'UNDERSTAND',
      questionType: 'MULTIPLE_CHOICE',
      questionText: 'What is useState?',
      options: ['A) State hook', 'B) Effect hook', 'C) Context hook', 'D) Ref hook'],
      correctAnswer: 'A',
      explanation: 'useState is a state hook.',
      cognitiveLoad: 2,
      difficulty: 'medium',
      points: 2,
      assessmentCriteria: ['Understanding'],
      prerequisites: [],
      learningObjective: 'Understand useState',
      timeEstimate: 5,
      tags: ['react', 'hooks'],
      bloomsAlignment: 0.9,
      safetyScore: 1.0,
      qualityScore: 0.85,
      hints: ['Think about state management'],
    },
  ],
  validation: {
    overall: { score: 85, grade: 'A' },
    quality: { score: 80 },
    safety: { score: 100 },
    pedagogical: { score: 85 },
  },
  metadata: {
    generatedAt: new Date().toISOString(),
    model: 'claude-sonnet-4-5-20250929',
  },
  warnings: [],
};

describe('POST /api/ai/advanced-exam-generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit(withRateLimit as jest.Mock);
    mockCombinedSession(getCombinedSession as jest.Mock);
    mockTimeout(withRetryableTimeout as jest.Mock);
  });

  it('returns 401 when not authenticated', async () => {
    mockCombinedSession(getCombinedSession as jest.Mock, null);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertUnauthorized(res);
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit(withRateLimit as jest.Mock, true);
    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertRateLimited(res);
  });

  it('returns 400 when sectionTitle is missing', async () => {
    const res = await POST(createAIRequest(BASE_URL, { questionCount: 5 }));
    await assertBadRequest(res);
  });

  it('returns 400 when questionCount exceeds 50', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, questionCount: 100 }));
    await assertBadRequest(res);
  });

  it('returns 400 when targetAudience is invalid', async () => {
    const res = await POST(createAIRequest(BASE_URL, { ...VALID_BODY, targetAudience: 'expert' }));
    await assertBadRequest(res);
  });

  // ----- SAM integration path -----

  it('returns 200 with SAM-generated questions on success', async () => {
    (generateExamWithSAM as jest.Mock).mockResolvedValue(MOCK_SAM_RESULT);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.questions).toHaveLength(1);
    expect(body.metadata.samIntegration).toBe(true);
  });

  it('includes validation scores in SAM response', async () => {
    (generateExamWithSAM as jest.Mock).mockResolvedValue(MOCK_SAM_RESULT);

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    const body = await res.json();
    expect(body.metadata.overallScore).toBe(85);
    expect(body.metadata.qualityScore).toBe(80);
    expect(body.metadata.safetyScore).toBe(100);
  });

  // ----- Legacy fallback -----

  it('falls back to legacy when SAM fails', async () => {
    (generateExamWithSAM as jest.Mock).mockRejectedValue(new Error('SAM failed'));
    (withRetryableTimeout as jest.Mock).mockImplementation(async (fn: () => Promise<unknown>) => fn());

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.metadata.samIntegration).toBe(false);
    expect(body.metadata.warning).toContain('legacy');
  });

  it('uses legacy path when useSAMIntegration is false', async () => {
    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_BODY,
      useSAMIntegration: false,
    }));
    await assertSuccess(res);
    const body = await res.json();
    expect(body.metadata.samIntegration).toBe(false);
  });

  // ----- Error handling -----

  it('returns 500 on unexpected errors', async () => {
    (getCombinedSession as jest.Mock).mockRejectedValue(new Error('Unexpected'));

    const res = await POST(createAIRequest(BASE_URL, VALID_BODY));
    expect(res.status).toBe(500);
  });

  it('accepts optional bloomsDistribution', async () => {
    (generateExamWithSAM as jest.Mock).mockResolvedValue(MOCK_SAM_RESULT);

    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_BODY,
      bloomsDistribution: { REMEMBER: 2, UNDERSTAND: 3 },
    }));
    await assertSuccess(res);
  });

  it('accepts optional learningObjectives and prerequisiteKnowledge', async () => {
    (generateExamWithSAM as jest.Mock).mockResolvedValue(MOCK_SAM_RESULT);

    const res = await POST(createAIRequest(BASE_URL, {
      ...VALID_BODY,
      learningObjectives: ['Understand hooks'],
      prerequisiteKnowledge: ['JavaScript basics'],
    }));
    await assertSuccess(res);
  });
});
