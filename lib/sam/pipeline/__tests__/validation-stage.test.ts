/**
 * Validation Stage Tests
 *
 * Tests Zod request parsing, intent classification, and
 * PipelineContext initialization performed by runValidationStage.
 */

import { runValidationStage, UnifiedRequestSchema } from '../validation-stage';
import type { PipelineContext, StageResult } from '../types';
import type { AuthStageResult } from '../auth-stage';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), debug: jest.fn(), info: jest.fn() },
}));

jest.mock('@/lib/sam/session-utils', () => ({
  buildSAMSessionId: jest.fn(() => 'sam_user1_abc123'),
}));

jest.mock('@/lib/sam/agentic-bridge', () => ({
  createSAMAgenticBridge: jest.fn(() => ({
    getEnabledCapabilities: jest.fn(() => []),
  })),
}));

// Mock admin check — prevents loading auth.config.admin → Credentials() in test env
jest.mock('@/lib/admin/check-admin', () => ({
  getCurrentAdminSession: jest.fn().mockResolvedValue({ isAdmin: false }),
}));

jest.mock('@/lib/sam/integration-profile', () => ({
  getSAMIntegrationProfile: jest.fn(() => ({})),
  getSAMCapabilityRegistry: jest.fn(() => ({})),
}));

jest.mock('@/lib/sam/modes', () => ({
  SAM_MODE_IDS: [
    'general-assistant',
    'content-creator',
    'adaptive-content',
    'blooms-analyzer',
    'study-planner',
  ] as const,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAuth(overrides: Partial<AuthStageResult> = {}): AuthStageResult {
  return {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
    },
    rateLimitHeaders: {},
    ...overrides,
  };
}

function isErrorResponse(result: StageResult<PipelineContext>): result is { response: Response } {
  return 'response' in result;
}

function isSuccess(result: StageResult<PipelineContext>): result is { ctx: PipelineContext } {
  return 'ctx' in result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('runValidationStage', () => {
  const startTime = Date.now();
  const auth = makeAuth();

  // ---- Invalid requests ---------------------------------------------------

  describe('request validation failures', () => {
    it('returns 400 when body is null', async () => {
      const result = await runValidationStage(null, auth, startTime);

      expect(isErrorResponse(result)).toBe(true);
      if (!isErrorResponse(result)) return;

      expect(result.response.status).toBe(400);
    });

    it('returns 400 when body is undefined', async () => {
      const result = await runValidationStage(undefined, auth, startTime);

      expect(isErrorResponse(result)).toBe(true);
      if (!isErrorResponse(result)) return;

      expect(result.response.status).toBe(400);
    });

    it('returns 400 when message field is missing', async () => {
      const result = await runValidationStage({}, auth, startTime);

      expect(isErrorResponse(result)).toBe(true);
      if (!isErrorResponse(result)) return;

      expect(result.response.status).toBe(400);
    });

    it('returns 400 for empty message string', async () => {
      const result = await runValidationStage({ message: '' }, auth, startTime);

      expect(isErrorResponse(result)).toBe(true);
      if (!isErrorResponse(result)) return;

      expect(result.response.status).toBe(400);
    });

    it('returns 400 when message is not a string', async () => {
      const result = await runValidationStage({ message: 123 }, auth, startTime);

      expect(isErrorResponse(result)).toBe(true);
      if (!isErrorResponse(result)) return;

      expect(result.response.status).toBe(400);
    });

    it('includes validation error details in response body', async () => {
      const result = await runValidationStage({ message: '' }, auth, startTime);

      expect(isErrorResponse(result)).toBe(true);
      if (!isErrorResponse(result)) return;

      const body = await result.response.json();
      expect(body.error).toBe('Invalid request');
      expect(body.details).toBeDefined();
      expect(Array.isArray(body.details)).toBe(true);
    });
  });

  // ---- Valid requests -------------------------------------------------------

  describe('successful validation', () => {
    it('returns PipelineContext for a minimal valid body', async () => {
      const result = await runValidationStage({ message: 'Hello SAM' }, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.message).toBe('Hello SAM');
      expect(result.ctx.user.id).toBe('user-1');
    });

    it('uses the user provided by the auth stage', async () => {
      const customAuth = makeAuth({
        user: { id: 'custom-id', name: 'Custom', email: 'c@e.com', isTeacher: true, role: 'ADMIN' },
      });
      const result = await runValidationStage({ message: 'Hi' }, customAuth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.user.id).toBe('custom-id');
      expect(result.ctx.user.isTeacher).toBe(true);
      expect(result.ctx.user.role).toBe('ADMIN');
    });

    it('sets rateLimitHeaders from auth stage', async () => {
      const customAuth = makeAuth({
        rateLimitHeaders: { 'X-RateLimit-Remaining': '50' },
      });
      const result = await runValidationStage({ message: 'Hi' }, customAuth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.rateLimitHeaders).toEqual({ 'X-RateLimit-Remaining': '50' });
    });

    it('defaults modeId to general-assistant when mode is omitted', async () => {
      const result = await runValidationStage({ message: 'Hi' }, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.modeId).toBe('general-assistant');
    });

    it('preserves explicit mode from the request', async () => {
      const result = await runValidationStage(
        { message: 'Analyze this', mode: 'blooms-analyzer' },
        auth,
        startTime,
      );

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.modeId).toBe('blooms-analyzer');
    });
  });

  // ---- Page context ---------------------------------------------------------

  describe('pageContext parsing', () => {
    it('defaults pageContext to general type when omitted', async () => {
      const result = await runValidationStage({ message: 'Hi' }, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.pageContext.type).toBe('general');
      expect(result.ctx.pageContext.path).toBe('/unknown');
    });

    it('parses provided pageContext fields correctly', async () => {
      const body = {
        message: 'Help me with this course',
        pageContext: {
          type: 'course-detail',
          path: '/teacher/courses/abc',
          entityId: 'course-abc',
          parentEntityId: 'parent-123',
          capabilities: ['edit', 'publish'],
          breadcrumb: ['Dashboard', 'Courses', 'My Course'],
          entityType: 'course' as const,
        },
      };

      const result = await runValidationStage(body, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.pageContext.type).toBe('course-detail');
      expect(result.ctx.pageContext.path).toBe('/teacher/courses/abc');
      expect(result.ctx.pageContext.entityId).toBe('course-abc');
      expect(result.ctx.pageContext.parentEntityId).toBe('parent-123');
      expect(result.ctx.pageContext.capabilities).toEqual(['edit', 'publish']);
      expect(result.ctx.pageContext.breadcrumb).toEqual(['Dashboard', 'Courses', 'My Course']);
    });

    it('parses entityData within pageContext', async () => {
      const body = {
        message: 'Review course',
        pageContext: {
          type: 'course-detail',
          path: '/courses/abc',
          entityData: {
            title: 'Intro to TypeScript',
            description: 'A beginner course',
            isPublished: true,
            chapterCount: 5,
          },
          entityType: 'course' as const,
        },
      };

      const result = await runValidationStage(body, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      const entityData = result.ctx.pageContext.entityData as Record<string, unknown>;
      expect(entityData.title).toBe('Intro to TypeScript');
      expect(entityData.description).toBe('A beginner course');
      expect(entityData.isPublished).toBe(true);
      expect(entityData.chapterCount).toBe(5);
    });
  });

  // ---- Intent classification ------------------------------------------------

  describe('intent classification', () => {
    it('classifies a greeting message', async () => {
      const result = await runValidationStage({ message: 'Hello there!' }, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.classifiedIntent.intent).toBe('greeting');
      expect(result.ctx.classifiedIntent.shouldUseTool).toBe(false);
    });

    it('classifies a tool request message', async () => {
      const result = await runValidationStage(
        { message: 'Generate a quiz for chapter 1' },
        auth,
        startTime,
      );

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.classifiedIntent.intent).toBe('tool_request');
      expect(result.ctx.classifiedIntent.shouldUseTool).toBe(true);
      expect(result.ctx.classifiedIntent.toolHints.length).toBeGreaterThan(0);
    });

    it('classifies a goal query message', async () => {
      const result = await runValidationStage(
        { message: 'What is my goal progress?' },
        auth,
        startTime,
      );

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.classifiedIntent.intent).toBe('goal_query');
      expect(result.ctx.classifiedIntent.shouldCheckGoals).toBe(true);
    });

    it('defaults to question intent for unrecognized messages', async () => {
      const result = await runValidationStage(
        { message: 'Teach me about monads' },
        auth,
        startTime,
      );

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      // "Teach me" does not match any specific pattern first-pass;
      // the default fallback is "question"
      expect(result.ctx.classifiedIntent.intent).toBe('question');
      expect(result.ctx.classifiedIntent.confidence).toBe(0.5);
    });
  });

  // ---- Default context values -----------------------------------------------

  describe('default PipelineContext values', () => {
    it('sets empty defaults for gathered context fields', async () => {
      const result = await runValidationStage({ message: 'Hi' }, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      const ctx = result.ctx;
      expect(ctx.entityContext).toEqual({ type: 'none', summary: '' });
      expect(ctx.entitySummary).toBe('');
      expect(ctx.contextConfidence).toBe(0);
    });

    it('sets null defaults for orchestration and agentic fields', async () => {
      const result = await runValidationStage({ message: 'Hi' }, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      const ctx = result.ctx;
      expect(ctx.orchestrationResult).toBeNull();
      expect(ctx.bloomsAnalysis).toBeNull();
      expect(ctx.bloomsOutput).toBeNull();
      expect(ctx.qualityResult).toBeNull();
      expect(ctx.pedagogyResult).toBeNull();
      expect(ctx.memoryUpdate).toBeNull();
      expect(ctx.toolExecution).toBeNull();
      expect(ctx.agenticConfidence).toBeNull();
      expect(ctx.verificationResult).toBeNull();
      expect(ctx.safetyResult).toBeNull();
      expect(ctx.proactiveData).toBeNull();
    });

    it('sets empty arrays for list fields', async () => {
      const result = await runValidationStage({ message: 'Hi' }, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.enginesToRun).toEqual([]);
      expect(result.ctx.interventions).toEqual([]);
      expect(result.ctx.interventionResults).toEqual([]);
    });

    it('sets boolean defaults correctly', async () => {
      const result = await runValidationStage({ message: 'Hi' }, auth, startTime);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.responseGated).toBe(false);
      expect(result.ctx.sessionRecorded).toBe(false);
    });

    it('records the startTime that was passed in', async () => {
      const now = 1706000000000;
      const result = await runValidationStage({ message: 'Hi' }, auth, now);

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.startTime).toBe(now);
    });
  });

  // ---- Conversation history -------------------------------------------------

  describe('conversationHistory and options', () => {
    it('passes conversationHistory through to context', async () => {
      const history = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
      ];

      const result = await runValidationStage(
        { message: 'Follow up', conversationHistory: history },
        auth,
        startTime,
      );

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.conversationHistory).toEqual(history);
    });

    it('passes options through to context', async () => {
      const result = await runValidationStage(
        { message: 'Hi', options: { engines: ['blooms'], stream: false } },
        auth,
        startTime,
      );

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.options?.engines).toEqual(['blooms']);
      expect(result.ctx.options?.stream).toBe(false);
    });

    it('passes orchestrationContext through to context', async () => {
      const result = await runValidationStage(
        {
          message: 'Continue plan',
          orchestrationContext: { planId: 'plan-1', goalId: 'goal-1', autoDetectPlan: false },
        },
        auth,
        startTime,
      );

      expect(isSuccess(result)).toBe(true);
      if (!isSuccess(result)) return;

      expect(result.ctx.orchestrationContext?.planId).toBe('plan-1');
      expect(result.ctx.orchestrationContext?.goalId).toBe('goal-1');
      expect(result.ctx.orchestrationContext?.autoDetectPlan).toBe(false);
    });
  });

  // ---- Schema-level tests ---------------------------------------------------

  describe('UnifiedRequestSchema', () => {
    it('accepts a minimal valid payload', async () => {
      const result = UnifiedRequestSchema.safeParse({ message: 'Hello' });
      expect(result.success).toBe(true);
    });

    it('rejects payload without message', async () => {
      const result = UnifiedRequestSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects an empty message', async () => {
      const result = UnifiedRequestSchema.safeParse({ message: '' });
      expect(result.success).toBe(false);
    });

    it('accepts valid formContext', async () => {
      const result = UnifiedRequestSchema.safeParse({
        message: 'Help with form',
        formContext: {
          formId: 'course-edit',
          formName: 'Course Editor',
          fields: { title: 'My Course' },
          isDirty: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid conversationHistory', async () => {
      const result = UnifiedRequestSchema.safeParse({
        message: 'Continue',
        conversationHistory: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi!' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});
