-- SAM AI Observability Models Migration
-- Phase J: Observability System
-- This migration adds metrics tracking, tool telemetry, and confidence calibration

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Tool execution status for telemetry
CREATE TYPE "SAMToolExecutionStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'EXECUTING',
  'SUCCESS',
  'FAILED',
  'TIMEOUT',
  'CANCELLED'
);

-- Response types for confidence scoring
CREATE TYPE "SAMConfidenceResponseType" AS ENUM (
  'EXPLANATION',
  'ANSWER',
  'RECOMMENDATION',
  'ASSESSMENT',
  'INTERVENTION',
  'TOOL_RESULT'
);

-- Verification methods for confidence outcomes
CREATE TYPE "SAMVerificationMethod" AS ENUM (
  'USER_FEEDBACK',
  'EXPERT_REVIEW',
  'AUTOMATED_CHECK',
  'OUTCOME_TRACKING',
  'SELF_VERIFICATION'
);

-- Memory source types for retrieval tracking
CREATE TYPE "SAMMemorySourceType" AS ENUM (
  'VECTOR_SEARCH',
  'KNOWLEDGE_GRAPH',
  'SESSION_CONTEXT',
  'CROSS_SESSION',
  'CURRICULUM',
  'EXTERNAL'
);

-- Plan lifecycle event types
CREATE TYPE "SAMPlanEventType" AS ENUM (
  'CREATED',
  'ACTIVATED',
  'PAUSED',
  'RESUMED',
  'STEP_STARTED',
  'STEP_COMPLETED',
  'STEP_FAILED',
  'STEP_SKIPPED',
  'CHECKPOINT_REACHED',
  'COMPLETED',
  'ABANDONED'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- General metrics table for time-series data
CREATE TABLE "sam_metrics" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "labels" JSONB NOT NULL DEFAULT '{}',
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT,
  "sessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sam_metrics_pkey" PRIMARY KEY ("id")
);

-- Tool execution telemetry
CREATE TABLE "sam_tool_executions" (
  "id" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "toolId" TEXT,
  "planId" TEXT,
  "stepId" TEXT,
  "status" "SAMToolExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "durationMs" INTEGER,
  "inputHash" TEXT,
  "input" JSONB,
  "output" JSONB,
  "error" TEXT,
  "errorCode" TEXT,
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 3,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sam_tool_executions_pkey" PRIMARY KEY ("id")
);

-- Confidence calibration scores
CREATE TABLE "sam_confidence_scores" (
  "id" TEXT NOT NULL,
  "responseId" TEXT NOT NULL,
  "predicted" DOUBLE PRECISION NOT NULL,
  "actual" DOUBLE PRECISION,
  "responseType" "SAMConfidenceResponseType" NOT NULL,
  "factors" JSONB DEFAULT '{}',
  "verificationMethod" "SAMVerificationMethod",
  "verifiedAt" TIMESTAMP(3),
  "context" TEXT,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sam_confidence_scores_pkey" PRIMARY KEY ("id")
);

-- Memory retrieval quality tracking
CREATE TABLE "sam_memory_retrievals" (
  "id" TEXT NOT NULL,
  "retrievalId" TEXT NOT NULL,
  "source" "SAMMemorySourceType" NOT NULL,
  "query" TEXT NOT NULL,
  "queryEmbeddingId" TEXT,
  "resultsCount" INTEGER NOT NULL DEFAULT 0,
  "relevanceScores" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
  "avgRelevance" DOUBLE PRECISION,
  "latencyMs" INTEGER NOT NULL,
  "wasUseful" BOOLEAN,
  "feedbackScore" INTEGER,
  "feedbackText" TEXT,
  "userId" TEXT NOT NULL,
  "sessionId" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sam_memory_retrievals_pkey" PRIMARY KEY ("id")
);

-- Plan lifecycle events
CREATE TABLE "sam_plan_lifecycle_events" (
  "id" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "eventType" "SAMPlanEventType" NOT NULL,
  "stepId" TEXT,
  "stepIndex" INTEGER,
  "previousState" TEXT,
  "newState" TEXT,
  "reason" TEXT,
  "checkpoint" JSONB,
  "metrics" JSONB DEFAULT '{}',
  "userId" TEXT NOT NULL,
  "sessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sam_plan_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- Aggregated metrics for dashboards
CREATE TABLE "sam_aggregated_metrics" (
  "id" TEXT NOT NULL,
  "metricName" TEXT NOT NULL,
  "aggregationType" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "periodType" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "min" DOUBLE PRECISION,
  "max" DOUBLE PRECISION,
  "avg" DOUBLE PRECISION,
  "p50" DOUBLE PRECISION,
  "p95" DOUBLE PRECISION,
  "p99" DOUBLE PRECISION,
  "labels" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "sam_aggregated_metrics_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Metrics indexes
CREATE INDEX "sam_metrics_name_timestamp_idx" ON "sam_metrics"("name", "timestamp");
CREATE INDEX "sam_metrics_userId_timestamp_idx" ON "sam_metrics"("userId", "timestamp");
CREATE INDEX "sam_metrics_sessionId_idx" ON "sam_metrics"("sessionId");
CREATE INDEX "sam_metrics_timestamp_idx" ON "sam_metrics"("timestamp");

-- Tool executions indexes
CREATE INDEX "sam_tool_executions_toolName_createdAt_idx" ON "sam_tool_executions"("toolName", "createdAt");
CREATE INDEX "sam_tool_executions_userId_createdAt_idx" ON "sam_tool_executions"("userId", "createdAt");
CREATE INDEX "sam_tool_executions_planId_idx" ON "sam_tool_executions"("planId");
CREATE INDEX "sam_tool_executions_status_idx" ON "sam_tool_executions"("status");
CREATE INDEX "sam_tool_executions_sessionId_idx" ON "sam_tool_executions"("sessionId");

-- Confidence scores indexes
CREATE INDEX "sam_confidence_scores_responseType_createdAt_idx" ON "sam_confidence_scores"("responseType", "createdAt");
CREATE INDEX "sam_confidence_scores_userId_createdAt_idx" ON "sam_confidence_scores"("userId", "createdAt");
CREATE INDEX "sam_confidence_scores_responseId_idx" ON "sam_confidence_scores"("responseId");
CREATE UNIQUE INDEX "sam_confidence_scores_responseId_key" ON "sam_confidence_scores"("responseId");

-- Memory retrievals indexes
CREATE INDEX "sam_memory_retrievals_source_createdAt_idx" ON "sam_memory_retrievals"("source", "createdAt");
CREATE INDEX "sam_memory_retrievals_userId_createdAt_idx" ON "sam_memory_retrievals"("userId", "createdAt");
CREATE INDEX "sam_memory_retrievals_retrievalId_idx" ON "sam_memory_retrievals"("retrievalId");
CREATE UNIQUE INDEX "sam_memory_retrievals_retrievalId_key" ON "sam_memory_retrievals"("retrievalId");

-- Plan lifecycle events indexes
CREATE INDEX "sam_plan_lifecycle_events_planId_createdAt_idx" ON "sam_plan_lifecycle_events"("planId", "createdAt");
CREATE INDEX "sam_plan_lifecycle_events_eventType_idx" ON "sam_plan_lifecycle_events"("eventType");
CREATE INDEX "sam_plan_lifecycle_events_userId_idx" ON "sam_plan_lifecycle_events"("userId");

-- Aggregated metrics indexes
CREATE INDEX "sam_aggregated_metrics_metricName_periodStart_idx" ON "sam_aggregated_metrics"("metricName", "periodStart");
CREATE INDEX "sam_aggregated_metrics_periodType_periodStart_idx" ON "sam_aggregated_metrics"("periodType", "periodStart");
CREATE UNIQUE INDEX "sam_aggregated_metrics_unique_idx" ON "sam_aggregated_metrics"("metricName", "aggregationType", "periodType", "periodStart", "labels");

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

-- Metrics foreign keys
ALTER TABLE "sam_metrics" ADD CONSTRAINT "sam_metrics_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tool executions foreign keys
ALTER TABLE "sam_tool_executions" ADD CONSTRAINT "sam_tool_executions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sam_tool_executions" ADD CONSTRAINT "sam_tool_executions_toolId_fkey"
  FOREIGN KEY ("toolId") REFERENCES "agent_tools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sam_tool_executions" ADD CONSTRAINT "sam_tool_executions_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "sam_execution_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Confidence scores foreign keys
ALTER TABLE "sam_confidence_scores" ADD CONSTRAINT "sam_confidence_scores_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Memory retrievals foreign keys
ALTER TABLE "sam_memory_retrievals" ADD CONSTRAINT "sam_memory_retrievals_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Plan lifecycle events foreign keys
ALTER TABLE "sam_plan_lifecycle_events" ADD CONSTRAINT "sam_plan_lifecycle_events_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sam_plan_lifecycle_events" ADD CONSTRAINT "sam_plan_lifecycle_events_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "sam_execution_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
