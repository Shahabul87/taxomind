/**
 * Pipeline Tracing — OpenTelemetry instrumentation for the course creation pipeline
 *
 * Wraps the existing TransactionTracer / AITracer from lib/monitoring/tracing.ts
 * to provide structured span hierarchies for the 3-stage course creation pipeline.
 *
 * Span hierarchy:
 *   course-creation.orchestrate (root)
 *     ├── course-creation.chapter.{n} (per chapter)
 *     │   ├── course-creation.phase.{name} (8 phases per chapter)
 *     │   │   └── ai.chat (AI calls within phases)
 *     │   └── ...
 *     └── ...
 *
 * Gated by ENABLE_OTEL=true. When disabled, all functions are safe no-ops.
 */

import 'server-only';

import { trace, context, SpanStatusCode, type Span, type Attributes, SpanKind } from '@opentelemetry/api';
import { logger } from '@/lib/logger';

const OTEL_ENABLED = process.env.ENABLE_OTEL === 'true';
const tracer = trace.getTracer('taxomind-course-creation', '1.0.0');

// ============================================================================
// Types
// ============================================================================

export interface PipelineSpanAttributes {
  userId?: string;
  runId?: string;
  requestId?: string;
  courseId?: string;
  chapterCount?: number;
  model?: string;
  provider?: string;
}

export interface ChapterSpanAttributes {
  chapterIndex: number;
  chapterTitle: string;
  bloomsLevel?: string;
}

export interface PhaseSpanAttributes {
  phaseName: string;
  chapterIndex: number;
  chapterTitle?: string;
  qualityScore?: number;
  durationMs?: number;
}

export interface AICallSpanAttributes {
  model: string;
  provider: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  stage?: number;
  capability?: string;
}

// ============================================================================
// Pipeline Root Span
// ============================================================================

/**
 * A handle to the root pipeline span. Callers hold this to create child spans
 * and to end the root span when the pipeline completes.
 */
export interface PipelineTrace {
  /** Create a chapter-level child span */
  startChapterSpan(attrs: ChapterSpanAttributes): ChapterTrace;
  /** Record a pipeline-level event */
  addEvent(name: string, attrs?: Attributes): void;
  /** Set an attribute on the root span */
  setAttribute(key: string, value: string | number | boolean): void;
  /** End the root span (success) */
  end(): void;
  /** End the root span (error) */
  endWithError(error: Error): void;
  /** Get the runId for correlation */
  runId: string;
}

/**
 * A handle to a chapter-level span.
 */
export interface ChapterTrace {
  /** Create a phase-level child span */
  startPhaseSpan(attrs: PhaseSpanAttributes): PhaseTrace;
  /** Record a chapter-level event */
  addEvent(name: string, attrs?: Attributes): void;
  /** Set an attribute on the chapter span */
  setAttribute(key: string, value: string | number | boolean): void;
  /** End the chapter span (success) */
  end(): void;
  /** End the chapter span (error) */
  endWithError(error: Error): void;
}

/**
 * A handle to a phase-level span.
 */
export interface PhaseTrace {
  /** Create an AI call child span */
  startAICallSpan(attrs: AICallSpanAttributes): AICallTrace;
  /** Record a phase-level event */
  addEvent(name: string, attrs?: Attributes): void;
  /** Set an attribute */
  setAttribute(key: string, value: string | number | boolean): void;
  /** End the phase span (success) */
  end(): void;
  /** End the phase span (error) */
  endWithError(error: Error): void;
}

/**
 * A handle to an AI call span.
 */
export interface AICallTrace {
  /** Set usage attributes after the call completes */
  setUsage(inputTokens: number, outputTokens: number): void;
  /** End the AI call span (success) */
  end(): void;
  /** End the AI call span (error) */
  endWithError(error: Error): void;
}

// ============================================================================
// No-op implementations (when OTEL is disabled)
// ============================================================================

const noopAICallTrace: AICallTrace = {
  setUsage: () => {},
  end: () => {},
  endWithError: () => {},
};

const noopPhaseTrace: PhaseTrace = {
  startAICallSpan: () => noopAICallTrace,
  addEvent: () => {},
  setAttribute: () => {},
  end: () => {},
  endWithError: () => {},
};

const noopChapterTrace: ChapterTrace = {
  startPhaseSpan: () => noopPhaseTrace,
  addEvent: () => {},
  setAttribute: () => {},
  end: () => {},
  endWithError: () => {},
};

const noopPipelineTrace: PipelineTrace = {
  startChapterSpan: () => noopChapterTrace,
  addEvent: () => {},
  setAttribute: () => {},
  end: () => {},
  endWithError: () => {},
  runId: '',
};

// ============================================================================
// Real implementations
// ============================================================================

function createAICallTrace(parentSpan: Span, attrs: AICallSpanAttributes): AICallTrace {
  const span = tracer.startSpan(
    'ai.chat',
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'ai.model': attrs.model,
        'ai.provider': attrs.provider,
        ...(attrs.stage !== undefined && { 'ai.pipeline_stage': attrs.stage }),
        ...(attrs.capability && { 'ai.capability': attrs.capability }),
      },
    },
    trace.setSpan(context.active(), parentSpan),
  );

  return {
    setUsage(inputTokens: number, outputTokens: number) {
      span.setAttributes({
        'ai.tokens.input': inputTokens,
        'ai.tokens.output': outputTokens,
        'ai.tokens.total': inputTokens + outputTokens,
      });
    },
    end() {
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    },
    endWithError(error: Error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
    },
  };
}

function createPhaseTrace(parentSpan: Span, attrs: PhaseSpanAttributes): PhaseTrace {
  const span = tracer.startSpan(
    `course-creation.phase.${attrs.phaseName}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'phase.name': attrs.phaseName,
        'chapter.index': attrs.chapterIndex,
        ...(attrs.chapterTitle && { 'chapter.title': attrs.chapterTitle }),
      },
    },
    trace.setSpan(context.active(), parentSpan),
  );

  return {
    startAICallSpan(aiAttrs: AICallSpanAttributes) {
      return createAICallTrace(span, aiAttrs);
    },
    addEvent(name: string, eventAttrs?: Attributes) {
      span.addEvent(name, eventAttrs);
    },
    setAttribute(key: string, value: string | number | boolean) {
      span.setAttribute(key, value);
    },
    end() {
      if (attrs.qualityScore !== undefined) {
        span.setAttribute('quality.score', attrs.qualityScore);
      }
      if (attrs.durationMs !== undefined) {
        span.setAttribute('phase.duration_ms', attrs.durationMs);
      }
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    },
    endWithError(error: Error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
    },
  };
}

function createChapterTrace(parentSpan: Span, attrs: ChapterSpanAttributes): ChapterTrace {
  const span = tracer.startSpan(
    `course-creation.chapter.${attrs.chapterIndex}`,
    {
      kind: SpanKind.INTERNAL,
      attributes: {
        'chapter.index': attrs.chapterIndex,
        'chapter.title': attrs.chapterTitle,
        ...(attrs.bloomsLevel && { 'chapter.blooms_level': attrs.bloomsLevel }),
      },
    },
    trace.setSpan(context.active(), parentSpan),
  );

  return {
    startPhaseSpan(phaseAttrs: PhaseSpanAttributes) {
      return createPhaseTrace(span, phaseAttrs);
    },
    addEvent(name: string, eventAttrs?: Attributes) {
      span.addEvent(name, eventAttrs);
    },
    setAttribute(key: string, value: string | number | boolean) {
      span.setAttribute(key, value);
    },
    end() {
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    },
    endWithError(error: Error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
    },
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Start a root pipeline trace for a course creation run.
 *
 * Returns a PipelineTrace handle that the orchestrator uses to create
 * chapter and phase spans throughout the pipeline lifecycle.
 *
 * When ENABLE_OTEL is false, returns a no-op trace that has zero overhead.
 */
export function startPipelineTrace(attrs: PipelineSpanAttributes): PipelineTrace {
  if (!OTEL_ENABLED) {
    return { ...noopPipelineTrace, runId: attrs.runId ?? '' };
  }

  const span = tracer.startSpan('course-creation.orchestrate', {
    kind: SpanKind.SERVER,
    attributes: {
      ...(attrs.userId && { 'user.id': attrs.userId }),
      ...(attrs.runId && { 'pipeline.run_id': attrs.runId }),
      ...(attrs.requestId && { 'pipeline.request_id': attrs.requestId }),
      ...(attrs.courseId && { 'course.id': attrs.courseId }),
      ...(attrs.chapterCount !== undefined && { 'pipeline.chapter_count': attrs.chapterCount }),
      ...(attrs.model && { 'ai.model': attrs.model }),
      ...(attrs.provider && { 'ai.provider': attrs.provider }),
    },
  });

  logger.debug('[PIPELINE_TRACING] Root span started', { runId: attrs.runId });

  return {
    runId: attrs.runId ?? '',

    startChapterSpan(chapterAttrs: ChapterSpanAttributes) {
      return createChapterTrace(span, chapterAttrs);
    },

    addEvent(name: string, eventAttrs?: Attributes) {
      span.addEvent(name, eventAttrs);
    },

    setAttribute(key: string, value: string | number | boolean) {
      span.setAttribute(key, value);
    },

    end() {
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      logger.debug('[PIPELINE_TRACING] Root span ended (success)');
    },

    endWithError(error: Error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      logger.debug('[PIPELINE_TRACING] Root span ended (error)', { error: error.message });
    },
  };
}

/**
 * Wrap an AI provider call with an OTel span. Used by ai-provider.ts to
 * automatically instrument all AI calls flowing through the unified provider.
 *
 * When ENABLE_OTEL is false, simply executes the function with zero overhead.
 */
export async function traceAICall<T>(
  attrs: { model: string; provider: string; capability?: string },
  fn: () => Promise<T>,
): Promise<T & { _traceSpanId?: string }> {
  if (!OTEL_ENABLED) {
    return fn();
  }

  const span = tracer.startSpan('ai.chat', {
    kind: SpanKind.CLIENT,
    attributes: {
      'ai.model': attrs.model,
      'ai.provider': attrs.provider,
      ...(attrs.capability && { 'ai.capability': attrs.capability }),
    },
  });

  const startTime = Date.now();

  try {
    const result = await context.with(
      trace.setSpan(context.active(), span),
      () => fn(),
    );

    const latencyMs = Date.now() - startTime;
    span.setAttribute('ai.latency_ms', latencyMs);

    // Extract token usage from common response shapes
    if (result && typeof result === 'object') {
      const r = result as Record<string, unknown>;
      if (r.usage && typeof r.usage === 'object') {
        const usage = r.usage as Record<string, unknown>;
        if (typeof usage.inputTokens === 'number') {
          span.setAttribute('ai.tokens.input', usage.inputTokens);
        }
        if (typeof usage.outputTokens === 'number') {
          span.setAttribute('ai.tokens.output', usage.outputTokens);
        }
        if (typeof usage.totalTokens === 'number') {
          span.setAttribute('ai.tokens.total', usage.totalTokens);
        }
      }
    }

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
    throw error;
  } finally {
    span.end();
  }
}
