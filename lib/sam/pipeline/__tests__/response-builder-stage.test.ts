/**
 * Response Builder Stage Tests
 *
 * Tests the buildUnifiedResponse function that constructs the final
 * JSON response from a fully populated PipelineContext.
 */

import { buildUnifiedResponse } from '../response-builder-stage';
import type { PipelineContext } from '../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/ai/subscription-enforcement', () => ({
  recordAIUsage: jest.fn().mockResolvedValue(undefined),
}));

import { recordAIUsage } from '@/lib/ai/subscription-enforcement';

const mockedRecordAIUsage = recordAIUsage as jest.MockedFunction<typeof recordAIUsage>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMinimalContext(overrides: Partial<PipelineContext> = {}): PipelineContext {
  return {
    user: { id: 'user-1', name: 'Test', email: 'test@test.com' },
    rateLimitHeaders: {},
    message: 'Hello',
    sessionId: 'session-1',
    pageContext: { type: 'general', path: '/dashboard' },
    modeId: 'general-assistant',
    entityContext: { type: 'none', summary: '' },
    entitySummary: '',
    contextConfidence: 0,
    classifiedIntent: {
      intent: 'question',
      shouldUseTool: false,
      shouldCheckGoals: false,
      shouldCheckInterventions: false,
      toolHints: [],
      confidence: 0.5,
    },
    agenticBridge: {
      getEnabledCapabilities: jest.fn(() => []),
    } as unknown as PipelineContext['agenticBridge'],
    orchestrationResult: null,
    bloomsAnalysis: null,
    bloomsOutput: null,
    qualityResult: null,
    pedagogyResult: null,
    memoryUpdate: null,
    enginesToRun: [],
    tutoringContext: null,
    planContextInjection: null,
    orchestrationData: null,
    memorySessionContext: null,
    sessionResumptionContext: null,
    toolExecution: null,
    responseText: '',
    agenticConfidence: null,
    verificationResult: null,
    safetyResult: null,
    responseGated: false,
    sessionRecorded: false,
    agenticGoalContext: null,
    agenticSkillUpdate: null,
    agenticRecommendations: null,
    interventions: [],
    interventionResults: [],
    proactiveData: null,
    startTime: Date.now() - 150,
    ...overrides,
  };
}

async function parseJsonResponse(response: Response): Promise<Record<string, unknown>> {
  return response.json() as Promise<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildUnifiedResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Basic response shape -------------------------------------------------

  describe('basic response shape', () => {
    it('returns a Response object with json method', async () => {
      const response = await buildUnifiedResponse(makeMinimalContext());
      expect(typeof response.json).toBe('function');
      expect(typeof response.status).toBe('number');
      expect(typeof response.headers).toBe('object');
    });

    it('includes success, response, mode, suggestions, and actions at top level', async () => {
      const ctx = makeMinimalContext({ responseText: 'Hello there!' });
      const response = await buildUnifiedResponse(ctx);
      const body = await parseJsonResponse(response);

      expect(body.success).toBe(true);
      expect(body.response).toBe('Hello there!');
      expect(body.mode).toBe('general-assistant');
      expect(body.suggestions).toEqual([]);
      expect(body.actions).toEqual([]);
    });

    it('sets the mode from PipelineContext', async () => {
      const ctx = makeMinimalContext({ modeId: 'blooms-analyzer' });
      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));

      expect(body.mode).toBe('blooms-analyzer');
    });
  });

  // ---- Metadata -------------------------------------------------------------

  describe('metadata', () => {
    it('includes metadata with timing and subsystem flags', async () => {
      const body = await parseJsonResponse(
        await buildUnifiedResponse(makeMinimalContext()),
      );

      const metadata = body.metadata as Record<string, unknown>;
      expect(metadata).toBeDefined();
      expect(metadata.enginesRun).toEqual([]);
      expect(metadata.enginesFailed).toEqual([]);
      expect(metadata.enginesCached).toEqual([]);
      expect(typeof metadata.requestTime).toBe('number');
    });

    it('includes subsystem status booleans in metadata', async () => {
      const body = await parseJsonResponse(
        await buildUnifiedResponse(makeMinimalContext()),
      );

      const metadata = body.metadata as Record<string, unknown>;
      const subsystems = metadata.subsystems as Record<string, unknown>;

      expect(subsystems.agenticBridge).toBe(true);
      expect(subsystems.intentClassified).toBe(true);
      expect(subsystems.unifiedBlooms).toBe(false);
      expect(subsystems.qualityGates).toBe(false);
      expect(subsystems.pedagogyPipeline).toBe(false);
      expect(subsystems.memoryTracking).toBe(false);
      expect(subsystems.safetyValidation).toBe(false);
    });

    it('extracts engine metadata from orchestration result', async () => {
      const ctx = makeMinimalContext({
        orchestrationResult: {
          success: true,
          metadata: {
            enginesExecuted: ['context', 'content'],
            enginesFailed: ['personalization'],
            enginesCached: ['context'],
            totalExecutionTime: 1200,
          },
          results: {},
          response: {},
        },
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const metadata = body.metadata as Record<string, unknown>;

      expect(metadata.enginesRun).toEqual(['context', 'content']);
      expect(metadata.enginesFailed).toEqual(['personalization']);
      expect(metadata.enginesCached).toEqual(['context']);
      expect(metadata.totalTime).toBe(1200);
    });
  });

  // ---- Quality insights -----------------------------------------------------

  describe('quality insights', () => {
    it('includes quality metrics when qualityResult is present', async () => {
      const ctx = makeMinimalContext({
        qualityResult: {
          passed: true,
          overallScore: 0.92,
          failedGates: [],
          allSuggestions: ['Consider adding examples'],
          criticalIssues: [],
          gateResults: [],
        } as Record<string, unknown>,
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const insights = body.insights as Record<string, unknown>;
      const quality = insights.quality as Record<string, unknown>;

      expect(quality).toBeDefined();
      expect(quality.passed).toBe(true);
      expect(quality.score).toBe(0.92);
      expect(quality.suggestions).toEqual(['Consider adding examples']);
    });

    it('omits quality insights when qualityResult is null', async () => {
      const body = await parseJsonResponse(
        await buildUnifiedResponse(makeMinimalContext()),
      );
      const insights = body.insights as Record<string, unknown>;

      expect(insights.quality).toBeUndefined();
    });
  });

  // ---- Pedagogy insights ----------------------------------------------------

  describe('pedagogy insights', () => {
    it('includes pedagogy data when pedagogyResult is present', async () => {
      const ctx = makeMinimalContext({
        pedagogyResult: {
          passed: true,
          overallScore: 0.85,
          evaluatorResults: {
            blooms: { passed: true, score: 0.9 },
            scaffolding: { passed: true, score: 0.8 },
            zpd: { passed: false, score: 0.7 },
          },
        } as unknown as Record<string, unknown>,
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const insights = body.insights as Record<string, unknown>;
      const pedagogy = insights.pedagogy as Record<string, unknown>;

      expect(pedagogy).toBeDefined();
      expect(pedagogy.passed).toBe(true);
      expect(pedagogy.score).toBe(0.85);

      const evaluators = pedagogy.evaluators as Record<string, unknown>;
      expect((evaluators.blooms as Record<string, unknown>).passed).toBe(true);
      expect((evaluators.scaffolding as Record<string, unknown>).score).toBe(0.8);
      expect((evaluators.zpd as Record<string, unknown>).passed).toBe(false);
    });

    it('omits pedagogy insights when pedagogyResult is null', async () => {
      const body = await parseJsonResponse(
        await buildUnifiedResponse(makeMinimalContext()),
      );
      const insights = body.insights as Record<string, unknown>;

      expect(insights.pedagogy).toBeUndefined();
    });
  });

  // ---- Blooms insights ------------------------------------------------------

  describe('blooms insights', () => {
    it('includes blooms analysis when present', async () => {
      const ctx = makeMinimalContext({
        bloomsAnalysis: {
          distribution: { remember: 0.3, understand: 0.5 },
          dominantLevel: 'understand',
          confidence: 0.88,
          cognitiveDepth: 2,
          balance: 0.6,
          gaps: ['apply', 'analyze'],
          recommendations: ['Add application exercises'],
          method: 'semantic',
        },
        bloomsOutput: {
          sectionAnalysis: [{ id: 's1', level: 'understand' }],
          actionItems: ['Improve analysis coverage'],
        },
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const insights = body.insights as Record<string, unknown>;
      const blooms = insights.blooms as Record<string, unknown>;

      expect(blooms).toBeDefined();
      expect(blooms.dominantLevel).toBe('understand');
      expect(blooms.confidence).toBe(0.88);
      expect(blooms.method).toBe('semantic');
      expect(blooms.sectionAnalysis).toEqual([{ id: 's1', level: 'understand' }]);
      expect(blooms.actionItems).toEqual(['Improve analysis coverage']);
    });
  });

  // ---- Safety insights ------------------------------------------------------

  describe('safety insights', () => {
    it('includes safety data when safetyResult is present', async () => {
      const ctx = makeMinimalContext({
        safetyResult: { passed: true, suggestions: [] },
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const insights = body.insights as Record<string, unknown>;
      const safety = insights.safety as Record<string, unknown>;

      expect(safety).toBeDefined();
      expect(safety.passed).toBe(true);
    });

    it('omits safety insights when safetyResult is null', async () => {
      const body = await parseJsonResponse(
        await buildUnifiedResponse(makeMinimalContext()),
      );
      const insights = body.insights as Record<string, unknown>;

      expect(insights.safety).toBeUndefined();
    });
  });

  // ---- Agentic insights -----------------------------------------------------

  describe('agentic insights', () => {
    it('always includes intent classification', async () => {
      const body = await parseJsonResponse(
        await buildUnifiedResponse(makeMinimalContext()),
      );
      const insights = body.insights as Record<string, unknown>;
      const agentic = insights.agentic as Record<string, unknown>;

      expect(agentic.intent).toBeDefined();
      expect((agentic.intent as Record<string, unknown>).intent).toBe('question');
    });

    it('includes confidence data when agenticConfidence is present', async () => {
      const ctx = makeMinimalContext({
        agenticConfidence: {
          level: 'high',
          score: 0.95,
          factors: [{ name: 'context', score: 0.9, weight: 0.5 }],
        },
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const agentic = (body.insights as Record<string, unknown>).agentic as Record<string, unknown>;
      const confidence = agentic.confidence as Record<string, unknown>;

      expect(confidence.level).toBe('high');
      expect(confidence.score).toBe(0.95);
    });

    it('includes verification data when verificationResult is present', async () => {
      const ctx = makeMinimalContext({
        verificationResult: {
          status: 'verified',
          overallAccuracy: 0.98,
          issues: [
            { severity: 'critical', description: 'Factual error detected', type: 'accuracy' },
            { severity: 'low', description: 'Minor formatting issue', type: 'style' },
          ],
        } as PipelineContext['verificationResult'],
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const agentic = (body.insights as Record<string, unknown>).agentic as Record<string, unknown>;
      const verification = agentic.verification as Record<string, unknown>;

      expect(verification.status).toBe('verified');
      expect(verification.accuracy).toBe(0.98);
      expect(verification.issueCount).toBe(2);
      expect(verification.criticalIssues).toEqual(['Factual error detected']);
    });

    it('includes tool execution data when present', async () => {
      const ctx = makeMinimalContext({
        toolExecution: {
          toolId: 'quiz-gen',
          toolName: 'Quiz Generator',
          status: 'success',
          awaitingConfirmation: false,
          result: { quizId: 'q1' },
        },
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const agentic = (body.insights as Record<string, unknown>).agentic as Record<string, unknown>;

      expect(agentic.toolExecution).toBeDefined();
      expect((agentic.toolExecution as Record<string, unknown>).toolId).toBe('quiz-gen');
    });

    it('includes interventions when present', async () => {
      const ctx = makeMinimalContext({
        interventions: [
          { type: 'encouragement', reason: 'Low engagement', priority: 'high' },
        ],
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const agentic = (body.insights as Record<string, unknown>).agentic as Record<string, unknown>;

      expect(agentic.interventions).toHaveLength(1);
    });

    it('omits interventions when array is empty', async () => {
      const body = await parseJsonResponse(
        await buildUnifiedResponse(makeMinimalContext()),
      );
      const agentic = (body.insights as Record<string, unknown>).agentic as Record<string, unknown>;

      expect(agentic.interventions).toBeUndefined();
    });
  });

  // ---- Memory insights ------------------------------------------------------

  describe('memory insights', () => {
    it('includes memory update when present', async () => {
      const ctx = makeMinimalContext({
        memoryUpdate: { masteryUpdated: true, spacedRepScheduled: false },
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const insights = body.insights as Record<string, unknown>;

      expect(insights.memory).toEqual({
        masteryUpdated: true,
        spacedRepScheduled: false,
      });
    });

    it('includes memoryContext when memorySummary is present', async () => {
      const ctx = makeMinimalContext({
        memorySummary: 'User mastered 3 concepts',
        reviewSummary: '2 items due for review',
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const insights = body.insights as Record<string, unknown>;
      const memoryContext = insights.memoryContext as Record<string, unknown>;

      expect(memoryContext.summary).toBe('User mastered 3 concepts');
      expect(memoryContext.reviewSummary).toBe('2 items due for review');
    });
  });

  // ---- Orchestration insights -----------------------------------------------

  describe('orchestration insights', () => {
    it('includes orchestration data when present', async () => {
      const ctx = makeMinimalContext({
        orchestrationData: {
          hasActivePlan: true,
          currentStep: {
            title: 'Learn Components',
            description: 'React components basics',
            order: 2,
            totalSteps: 5,
          },
          stepProgress: {
            completedSteps: 1,
            totalSteps: 5,
            percentComplete: 20,
          },
          transition: null,
          pendingConfirmations: [],
          metadata: {},
        },
      });

      const body = await parseJsonResponse(await buildUnifiedResponse(ctx));
      const insights = body.insights as Record<string, unknown>;
      const orchestration = insights.orchestration as Record<string, unknown>;

      expect(orchestration.hasActivePlan).toBe(true);
      expect((orchestration.currentStep as Record<string, unknown>).title).toBe('Learn Components');
    });
  });

  // ---- Rate limit headers ---------------------------------------------------

  describe('rate limit headers', () => {
    it('passes rateLimitHeaders to the response', async () => {
      const ctx = makeMinimalContext({
        rateLimitHeaders: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '99',
        },
      });

      const response = await buildUnifiedResponse(ctx);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('99');
    });
  });

  // ---- AI usage recording ---------------------------------------------------

  describe('AI usage recording', () => {
    it('records AI usage after building the response', async () => {
      const ctx = makeMinimalContext();
      await buildUnifiedResponse(ctx);

      expect(mockedRecordAIUsage).toHaveBeenCalledWith('user-1', 'chat', 1);
    });
  });

  // ---- Empty / minimal context ----------------------------------------------

  describe('minimal PipelineContext', () => {
    it('handles a completely minimal context without errors', async () => {
      const response = await buildUnifiedResponse(makeMinimalContext());
      const body = await parseJsonResponse(response);

      expect(body.success).toBe(true);
      expect(body.response).toBe('');
      expect(body.suggestions).toEqual([]);
      expect(body.actions).toEqual([]);
      expect(body.insights).toBeDefined();
      expect(body.metadata).toBeDefined();
    });
  });
});
