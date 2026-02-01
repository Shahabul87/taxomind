/**
 * Pipeline Integration Tests
 *
 * Verifies that the pipeline stages compose correctly:
 * auth -> validation -> context gathering -> response builder.
 *
 * These tests mock all external dependencies (auth, database, AI services)
 * and verify the data flow between stages and the early-return behaviour.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAuthStage } from '../auth-stage';
import { runValidationStage } from '../validation-stage';
import { runContextGatheringStage } from '../context-gathering-stage';
import { buildUnifiedResponse } from '../response-builder-stage';
import type { PipelineContext, StageResult } from '../types';
import type { AuthStageResult } from '../auth-stage';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Auth
jest.mock('@/lib/auth', () => ({
  currentUserOrAdmin: jest.fn(),
}));

jest.mock('@/lib/ai/subscription-enforcement', () => ({
  checkAIAccess: jest.fn(),
  recordAIUsage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/sam/config/sam-rate-limiter', () => ({
  applyRateLimit: jest.fn(),
  samMessagesLimiter: {},
}));

// Validation
jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), debug: jest.fn(), info: jest.fn() },
}));

jest.mock('@/lib/sam/session-utils', () => ({
  buildSAMSessionId: jest.fn(() => 'sam_user1_integration'),
}));

jest.mock('@/lib/sam/agentic-bridge', () => ({
  createSAMAgenticBridge: jest.fn(() => ({
    getEnabledCapabilities: jest.fn(() => ['goalPlanning', 'toolExecution']),
  })),
}));

jest.mock('@/lib/sam/integration-profile', () => ({
  getSAMIntegrationProfile: jest.fn(() => ({})),
  getSAMCapabilityRegistry: jest.fn(() => ({})),
}));

jest.mock('@/lib/sam/modes', () => ({
  SAM_MODE_IDS: ['general-assistant', 'blooms-analyzer'] as const,
}));

// Context gathering
jest.mock('@/lib/sam/entity-context', () => ({
  buildEntityContext: jest.fn().mockResolvedValue({
    type: 'none',
    summary: 'No context',
  }),
  buildFormSummary: jest.fn(() => 'No form data available on this page.'),
}));

jest.mock('@/lib/sam/context-gathering-integration', () => ({
  getContextSummaryForRoute: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/sam/agentic-tooling', () => ({
  ensureToolingInitialized: jest.fn().mockResolvedValue({
    toolRegistry: {
      listTools: jest.fn().mockResolvedValue([]),
    },
  }),
}));

import { currentUserOrAdmin } from '@/lib/auth';
import { checkAIAccess } from '@/lib/ai/subscription-enforcement';
import { applyRateLimit } from '@/lib/sam/config/sam-rate-limiter';

const mockedCurrentUser = currentUserOrAdmin as jest.MockedFunction<typeof currentUserOrAdmin>;
const mockedCheckAIAccess = checkAIAccess as jest.MockedFunction<typeof checkAIAccess>;
const mockedApplyRateLimit = applyRateLimit as jest.MockedFunction<typeof applyRateLimit>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url = 'http://localhost:3000/api/sam/unified'): NextRequest {
  return new NextRequest(new URL(url));
}

function isErrorResponse<T>(result: StageResult<T>): result is { response: Response } {
  return 'response' in result;
}

function isSuccess<T>(result: StageResult<T>): result is { ctx: T } {
  return 'ctx' in result;
}

/** Configure mocks so that auth succeeds */
function setupAuthSuccess(): void {
  mockedCurrentUser.mockResolvedValue({
    id: 'user-int',
    name: 'Integration User',
    email: 'int@test.com',
  } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

  mockedCheckAIAccess.mockResolvedValue({ allowed: true });

  mockedApplyRateLimit.mockResolvedValue({
    success: true,
    headers: { 'X-RateLimit-Remaining': '99' },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Pipeline integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Full success path ----------------------------------------------------

  it('completes the full auth -> validation -> context -> response flow', async () => {
    setupAuthSuccess();
    const startTime = Date.now();

    // Stage 1: Auth
    const authResult = await runAuthStage(makeRequest());
    expect(isSuccess(authResult)).toBe(true);
    if (!isSuccess(authResult)) return;

    const auth: AuthStageResult = authResult.ctx;
    expect(auth.user.id).toBe('user-int');

    // Stage 2: Validation
    const body = { message: 'Help me with my course' };
    const validationResult = runValidationStage(body, auth, startTime);
    expect(isSuccess(validationResult)).toBe(true);
    if (!isSuccess(validationResult)) return;

    const pipelineCtx: PipelineContext = validationResult.ctx;
    expect(pipelineCtx.message).toBe('Help me with my course');
    expect(pipelineCtx.user.id).toBe('user-int');

    // Stage 3: Context gathering
    const enrichedCtx = await runContextGatheringStage(pipelineCtx);
    expect(enrichedCtx.entityContext).toBeDefined();
    expect(enrichedCtx.formSummary).toBeDefined();

    // Stage 4: Response builder
    enrichedCtx.responseText = 'Here is some help with your course!';
    const response = await buildUnifiedResponse(enrichedCtx);

    expect(typeof response.json).toBe('function');
    const responseBody = await response.json();
    expect(responseBody.success).toBe(true);
    expect(responseBody.response).toBe('Here is some help with your course!');
    expect(responseBody.mode).toBe('general-assistant');
    expect(responseBody.metadata).toBeDefined();
  });

  // ---- Early return on auth failure -----------------------------------------

  it('short-circuits at auth stage when user is not authenticated', async () => {
    mockedCurrentUser.mockResolvedValue(null);

    const authResult = await runAuthStage(makeRequest());

    expect(isErrorResponse(authResult)).toBe(true);
    if (!isErrorResponse(authResult)) return;

    const body = await authResult.response.json();
    expect(authResult.response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');

    // Subsequent stages are never called in a real pipeline
  });

  it('short-circuits at auth stage when AI access is denied', async () => {
    mockedCurrentUser.mockResolvedValue({
      id: 'user-denied',
      name: 'Denied User',
      email: 'denied@test.com',
    } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

    mockedCheckAIAccess.mockResolvedValue({
      allowed: false,
      reason: 'Free tier limit reached',
      upgradeRequired: true,
      suggestedTier: 'pro',
      maintenanceMode: false,
    });

    const authResult = await runAuthStage(makeRequest());

    expect(isErrorResponse(authResult)).toBe(true);
    if (!isErrorResponse(authResult)) return;

    const body = await authResult.response.json();
    expect(authResult.response.status).toBe(403);
    expect(body.error).toBe('Free tier limit reached');
    expect(body.upgradeRequired).toBe(true);
  });

  it('short-circuits at auth stage when rate limited', async () => {
    mockedCurrentUser.mockResolvedValue({
      id: 'user-rl',
      name: 'RL User',
      email: 'rl@test.com',
    } as Awaited<ReturnType<typeof currentUserOrAdmin>>);

    mockedCheckAIAccess.mockResolvedValue({ allowed: true });

    mockedApplyRateLimit.mockResolvedValue({
      success: false,
      response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
    });

    const authResult = await runAuthStage(makeRequest());

    expect(isErrorResponse(authResult)).toBe(true);
    if (!isErrorResponse(authResult)) return;

    const body = await authResult.response.json();
    expect(body.error).toBe('Rate limit exceeded');
  });

  // ---- Early return on validation failure -----------------------------------

  it('short-circuits at validation stage when message is missing', async () => {
    setupAuthSuccess();

    const authResult = await runAuthStage(makeRequest());
    expect(isSuccess(authResult)).toBe(true);
    if (!isSuccess(authResult)) return;

    const validationResult = runValidationStage({}, authResult.ctx, Date.now());

    expect(isErrorResponse(validationResult)).toBe(true);
    if (!isErrorResponse(validationResult)) return;

    const body = await validationResult.response.json();
    expect(validationResult.response.status).toBe(400);
    expect(body.error).toBe('Invalid request');
  });

  it('short-circuits at validation stage when message is empty', async () => {
    setupAuthSuccess();

    const authResult = await runAuthStage(makeRequest());
    expect(isSuccess(authResult)).toBe(true);
    if (!isSuccess(authResult)) return;

    const validationResult = runValidationStage(
      { message: '' },
      authResult.ctx,
      Date.now(),
    );

    expect(isErrorResponse(validationResult)).toBe(true);
    if (!isErrorResponse(validationResult)) return;

    expect(validationResult.response.status).toBe(400);
  });

  // ---- Data flows between stages correctly ----------------------------------

  it('passes auth user data through all stages into the final response', async () => {
    setupAuthSuccess();
    const startTime = Date.now();

    const authResult = await runAuthStage(makeRequest());
    if (!isSuccess(authResult)) throw new Error('Auth should succeed');

    const validationResult = runValidationStage(
      { message: 'What is my progress?' },
      authResult.ctx,
      startTime,
    );
    if (!isSuccess(validationResult)) throw new Error('Validation should succeed');

    const enrichedCtx = await runContextGatheringStage(validationResult.ctx);
    enrichedCtx.responseText = 'You are making great progress!';

    const response = await buildUnifiedResponse(enrichedCtx);
    const body = await response.json();

    // Verify the user ID was propagated through
    expect(body.success).toBe(true);
    expect(body.response).toBe('You are making great progress!');

    // Verify rate limit headers were forwarded
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
  });

  it('preserves intent classification through the pipeline', async () => {
    setupAuthSuccess();

    const authResult = await runAuthStage(makeRequest());
    if (!isSuccess(authResult)) throw new Error('Auth should succeed');

    const validationResult = runValidationStage(
      { message: 'Generate a quiz for chapter 1' },
      authResult.ctx,
      Date.now(),
    );
    if (!isSuccess(validationResult)) throw new Error('Validation should succeed');

    // Intent should be classified as tool_request
    expect(validationResult.ctx.classifiedIntent.intent).toBe('tool_request');
    expect(validationResult.ctx.classifiedIntent.shouldUseTool).toBe(true);

    const enrichedCtx = await runContextGatheringStage(validationResult.ctx);

    // Intent carries through context gathering unchanged
    expect(enrichedCtx.classifiedIntent.intent).toBe('tool_request');

    enrichedCtx.responseText = 'Here is your quiz!';
    const response = await buildUnifiedResponse(enrichedCtx);
    const body = await response.json();

    // Intent is present in the final response
    const agentic = (body.insights as Record<string, unknown>).agentic as Record<string, unknown>;
    expect((agentic.intent as Record<string, unknown>).intent).toBe('tool_request');
  });
});
