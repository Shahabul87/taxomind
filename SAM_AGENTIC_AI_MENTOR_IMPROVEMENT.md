# SAM Agentic AI Mentor - Improvement Plan

**Version**: 1.0.0
**Created**: January 2026
**Status**: Core Integration Complete - Remaining Gaps Tracked
**Authors**: AI-Assisted Analysis

---

## Executive Summary

This document provides an evidence-based assessment of the SAM Agentic AI Mentor system, identifying critical gaps between documented capabilities and actual implementation. The analysis reveals that while the `@sam-ai/agentic` package is substantially built, **it is NOT integrated** into the application runtime.

### Key Finding

> **The `@sam-ai/agentic` package is now partially integrated (unified routes + agentic APIs). Remaining gaps are tool execution wiring, persistent analytics stores, and external memory integrations.**

---

## Table of Contents

1. [Current State Assessment](#1-current-state-assessment)
2. [Evidence-Based Gap Analysis](#2-evidence-based-gap-analysis)
3. [Critical Integration Gaps](#3-critical-integration-gaps)
4. [Feature Utilization Matrix](#4-feature-utilization-matrix)
5. [Improvement Roadmap](#5-improvement-roadmap)
6. [Implementation Phases](#6-implementation-phases)
7. [Success Criteria](#7-success-criteria)
8. [Risk Mitigation](#8-risk-mitigation)

---

## 1. Current State Assessment

### 1.1 Package Inventory

| Package | Lines of Code | Test Coverage | Integration Status |
|---------|---------------|---------------|-------------------|
| `@sam-ai/core` | ~16,000 | 86+ files | **Fully Integrated** |
| `@sam-ai/educational` | ~25,000 | Comprehensive | **Fully Integrated** |
| `@sam-ai/memory` | ~8,000 | Good | **Partially Integrated** |
| `@sam-ai/pedagogy` | ~5,000 | Good | **Fully Integrated** |
| `@sam-ai/safety` | ~4,000 | Good | **Fully Integrated** |
| `@sam-ai/quality` | ~3,000 | Good | **Fully Integrated** |
| `@sam-ai/react` | ~6,000 | Good | **Partially Integrated** |
| `@sam-ai/api` | ~5,000 | Good | **Fully Integrated** |
| `@sam-ai/adapter-prisma` | ~4,000 | 5 test files | **Fully Integrated** |
| `@sam-ai/agentic` | **~15,000** | 22 test files | **PARTIALLY INTEGRATED** |

### 1.2 Agentic Package - Subsystem Status

The `packages/agentic/` directory contains 6 fully-implemented subsystems:

| Subsystem | Files | Status | Used in App |
|-----------|-------|--------|-------------|
| Goal Planning | 6 files | Built | **YES** (goals + plans + state machine routes) |
| Tool Registry | 8 files | Built | **NO** |
| Long-Term Memory | 5 files | Built | **NO** |
| Proactive Interventions | 4 files | Built | **YES** (behavior + check-ins) |
| Self-Evaluation | 4 files | Built | **YES** (confidence scoring in unified routes) |
| Learning Analytics | 3 files | Built | **PARTIAL** (session recording, analytics endpoints use DB) |

---

## 2. Evidence-Based Gap Analysis

### 2.1 Documentation vs Reality

| Documented Claim | Evidence Found | Reality |
|------------------|----------------|---------|
| "Agentic bridge provides unified interface" | `app/api/sam/unified/route.ts` + `app/api/sam/unified/stream/route.ts` import `createSAMAgenticBridge` | **Integrated in unified routes** |
| "Goal decomposition endpoint" | `app/api/sam/agentic/goals/[goalId]/decompose/route.ts` uses `createGoalDecomposer` | **Uses agentic GoalDecomposer** |
| "Tool execution with permissions" | `packages/agentic/src/tool-registry/` exists | **ToolRegistry not wired to API/runtime yet** |
| "Behavior monitoring" | `app/api/sam/agentic/behavior/*` + `app/api/sam/agentic/events/route.ts` | **BehaviorMonitor wired with Prisma stores** |
| "Confidence scoring on responses" | `app/api/sam/unified/route.ts` and `/stream` call `scoreConfidence()` | **Confidence included in unified response flow** |

### 2.2 Code Search Evidence

```bash
# Search: @sam-ai/agentic imports in app/
rg -n "from.*@sam-ai/agentic" app/
# Result: Matches in unified routes and agentic APIs (e.g. app/api/sam/unified/route.ts)

# Search: Bridge usage in API routes
rg -n "SAMAgenticBridge|createSAMAgenticBridge" app/
# Result: Matches in app/api/sam/unified/route.ts and app/api/sam/unified/stream/route.ts

# Search: Agentic components in frontend
rg -n "agentic|goal|behavior" components/sam/
# Result: Matches in components/sam/SAMAssistant.tsx (agentic insights + event tracking)
```

### 2.3 Route Implementation Analysis

**File**: `app/api/sam/agentic/goals/[goalId]/decompose/route.ts`

```typescript
import { createGoalDecomposer } from '@sam-ai/agentic';

const decomposer = getGoalDecomposer();
const decomposition = await decomposer.decompose(goal, options);
```

**Verdict**: Goal decomposition uses agentic logic; persistence for sub-goals is still pending.

---

## 3. Critical Integration Gaps

### 3.1 Gap Priority Matrix

| Gap ID | Gap Description | Severity | Effort | Impact |
|--------|-----------------|----------|--------|--------|
| **G-01** | Agentic bridge not imported in unified API (RESOLVED) | CRITICAL | Medium | High |
| **G-02** | ConfidenceScorer not in response pipeline (RESOLVED) | CRITICAL | Low | High |
| **G-03** | BehaviorMonitor has no event sources (RESOLVED) | CRITICAL | Medium | High |
| **G-04** | ToolRegistry not wired to any actions | HIGH | Medium | Medium |
| **G-05** | VectorStore using InMemory only (no Pinecone) | HIGH | High | High |
| **G-06** | KnowledgeGraph not connected to content | HIGH | High | High |
| **G-07** | Goal routes use Prisma, not GoalManager (RESOLVED via GoalStore) | MEDIUM | Low | Medium |
| **G-08** | Plan routes use Prisma, not PlanExecutor (RESOLVED via PlanBuilder/StateMachine) | MEDIUM | Low | Medium |
| **G-09** | Frontend has no agentic hooks (PARTIAL: `useAgentic` + SAMAssistant) | MEDIUM | Medium | Medium |
| **G-10** | No WebSocket/real-time integration | LOW | High | Medium |

### 3.2 Dependency Chain

```
Current Flow:
SAMAssistant.tsx → /api/sam/unified → SAMOrchestrator → 6 Core Engines
                                    ↳ Quality Gates
                                    ↳ Pedagogy Pipeline
                                    ↳ Memory Tracking
                                    ↳ Safety Validation
                                    ↳ AgenticBridge.scoreConfidence()
                                    ↳ AgenticBridge.recordSession()
                                    ↳ AgenticBridge.checkForInterventions()

Required Flow:
SAMAssistant.tsx → /api/sam/unified → SAMOrchestrator → 6 Core Engines
                                    ↳ ToolRegistry.execute()
                                    ↳ VectorStore.retrieve()
                                    ↳ KnowledgeGraph.expand()
                                    ↳ RecommendationEngine.suggest()
```

---

## 4. Feature Utilization Matrix

### 4.1 Agentic Capability → Integration Status

| Capability | Package Export | API Endpoint | Route Uses Package | UI Component | Overall |
|------------|----------------|--------------|-------------------|--------------|---------|
| **Goal Creation** | `GoalStore` | `/agentic/goals` POST | ✅ GoalStore adapter | ✅ GoalPlanner/useAgentic | **70%** |
| **Goal Decomposition** | `GoalDecomposer` | `/agentic/goals/[id]/decompose` | ✅ GoalDecomposer | ✅ GoalPlanner/useAgentic | **70%** |
| **Plan Creation** | `PlanBuilder` | `/agentic/plans` POST | ✅ PlanBuilder | PARTIAL (hooks) | **50%** |
| **Plan Start/Pause/Resume** | `AgentStateMachine` | `/agentic/plans/[id]/*` | ✅ State machine | PARTIAL (hooks) | **50%** |
| **Tool Registry** | `ToolRegistry` | ❌ None | ❌ Not wired | ❌ None | **0%** |
| **Tool Execution** | `ToolExecutor` | ❌ None | ❌ Not wired | ❌ None | **0%** |
| **Permission Manager** | `PermissionManager` | ❌ None | ❌ Not wired | ❌ None | **0%** |
| **Audit Logging** | `AuditLogger` | ❌ None | ❌ Not wired | ❌ None | **0%** |
| **Vector Store** | `VectorStore` | ❌ None | ❌ InMemory only | ❌ None | **0%** |
| **Knowledge Graph** | `KnowledgeGraph` | ❌ None | ❌ Not wired | ❌ None | **0%** |
| **Cross-Session Context** | `CrossSessionContext` | ❌ None | ❌ Not wired | ❌ None | **0%** |
| **Behavior Monitor** | `BehaviorMonitor` | `/agentic/behavior` + `/agentic/events` | ✅ Prisma stores | ✅ SAMAssistant events | **60%** |
| **Check-In Scheduler** | `CheckInScheduler` | `/agentic/checkins` | ✅ Prisma store | ✅ SAMAssistant check-ins | **60%** |
| **Intervention Trigger** | `MultiSessionPlanTracker` | ❌ None | PARTIAL (BehaviorMonitor only) | ✅ SAMAssistant display | **40%** |
| **Confidence Scorer** | `ConfidenceScorer` | ❌ None | ✅ Unified routes | ✅ SAMAssistant display | **70%** |
| **Response Verifier** | `ResponseVerifier` | ❌ None | ❌ Not wired | ❌ None | **0%** |
| **Quality Tracker** | `QualityTracker` | ❌ None | ❌ Not wired | ❌ None | **0%** |
| **Progress Analyzer** | `ProgressAnalyzer` | `/agentic/analytics/progress` (custom) | PARTIAL (in-memory sessions) | PARTIAL (hooks + dashboard) | **30%** |
| **Skill Assessor** | `SkillAssessor` | `/agentic/skills` (custom) | ❌ Not wired | ✅ Hook + UI | **30%** |
| **Recommendation Engine** | `RecommendationEngine` | `/agentic/recommendations` (custom) | ❌ Not wired | ✅ RecommendationWidget | **30%** |

### 4.2 Overall Utilization Score

| Category | Available Features | Features Used | Utilization |
|----------|-------------------|---------------|-------------|
| Core SAM | 6 engines | 6 engines | **100%** |
| Educational | 40+ engines | ~25 engines | **60%** |
| Quality/Safety | 12 validators | 12 validators | **100%** |
| Agentic | 20 capabilities | ~8 partial/complete | **~40%** |

**Overall Agentic Utilization: ~40%**

---

## 5. Improvement Roadmap

### 5.1 Phase Overview

```
Phase 1: Core Integration (COMPLETED)
└── ConfidenceScorer wired into unified response flow
└── BehaviorMonitor event tracking in agentic APIs
└── AgenticBridge integrated in unified + stream routes

Phase 2: Goal & Plan Integration (COMPLETED)
└── Goal routes use GoalStore + GoalDecomposer
└── Plan routes use PlanBuilder + AgentStateMachine
└── Resumable execution endpoints live

Phase 3: Memory Integration (IN PROGRESS)
└── Add Pinecone/Weaviate adapter for VectorStore
└── Wire KnowledgeGraph to course content
└── Implement CrossSessionContext persistence

Phase 4: Proactive Features (MOSTLY COMPLETE)
└── BehaviorMonitor wired to frontend events
└── CheckInScheduler cron job implemented
└── Notification APIs integrated

Phase 5: Frontend Integration (COMPLETED)
└── useAgentic() hook available
└── Goal planning UI exists
└── Recommendation widget exists
```

---

## 6. Implementation Phases

**Note**: Phase 1/2/4/5 items below are already implemented in the current codebase. The remaining work is primarily Phase 3 (memory integrations) and tool execution wiring.

### 6.1 Phase 1: Core Integration (HIGH PRIORITY)

**Objective**: Wire the agentic bridge into the main SAM response flow.

#### Task 1.1: Import AgenticBridge in Unified API

**File**: `app/api/sam/unified/route.ts`

```typescript
// ADD at top of file:
import { createSAMAgenticBridge } from '@/lib/sam/agentic-bridge';

// ADD in POST handler:
const agenticBridge = createSAMAgenticBridge({
  userId: session.user.id,
  courseId: pageContext?.entityId,
  enableSelfEvaluation: true,
  enableLearningAnalytics: true,
});

// ADD after response generation:
const confidence = await agenticBridge.scoreConfidence(response);
const analysis = await agenticBridge.analyzeResponse(response, {
  userId: session.user.id,
  currentTopic: pageContext?.entityData?.title,
});

// INCLUDE in response:
return NextResponse.json({
  success: true,
  response,
  insights: {
    ...existingInsights,
    confidence: confidence.level,
    verification: analysis.verification,
    recommendations: analysis.recommendations,
  }
});
```

**Acceptance Criteria**:
- [ ] AgenticBridge imported and instantiated
- [ ] ConfidenceScorer.score() called on every response
- [ ] Confidence level included in API response
- [ ] No performance degradation >100ms

#### Task 1.2: Add Behavior Event Tracking

**File**: `app/api/sam/unified/route.ts`

```typescript
// ADD behavior tracking:
await agenticBridge.recordSession({
  topicId: pageContext?.entityId ?? 'unknown',
  duration: metadata.totalTime / 1000,
  questionsAnswered: 1,
  correctAnswers: 1, // Assume correct for now
  conceptsCovered: [pageContext?.entityData?.title].filter(Boolean),
});
```

**Acceptance Criteria**:
- [ ] Every SAM interaction logged to ProgressAnalyzer
- [ ] Session data persisted (InMemory initially, then DB)
- [ ] Metrics visible in debug logs

#### Task 1.3: Add Frontend Event Source

**File**: `components/sam/SAMAssistant.tsx`

```typescript
// ADD event tracking hook:
useEffect(() => {
  const trackEvent = async (type: string, data: object) => {
    await fetch('/api/sam/agentic/events', {
      method: 'POST',
      body: JSON.stringify({ type, data, timestamp: new Date() }),
    });
  };

  // Track session start
  trackEvent('session_start', { pageContext });

  return () => {
    // Track session end
    trackEvent('session_end', { pageContext, duration: Date.now() - sessionStart });
  };
}, [pageContext]);
```

### 6.2 Phase 2: Goal & Plan Integration (MEDIUM PRIORITY)

**Objective**: Refactor API routes to use agentic package classes.

#### Task 2.1: Refactor Goals Route

**Current** (`app/api/sam/agentic/goals/route.ts`):
```typescript
const goal = await db.sAMLearningGoal.create({ data: { ... } });
```

**Target**:
```typescript
import { createGoalManager } from '@sam-ai/agentic';

const goalManager = createGoalManager({ store: new PrismaGoalStore() });
const goal = await goalManager.createGoal({ ... });
```

#### Task 2.2: Refactor Decompose Route

**Current** (`app/api/sam/agentic/goals/[goalId]/decompose/route.ts`):
```typescript
const subGoals = await generateSubGoals(goal, options); // Local helper
```

**Target**:
```typescript
import { GoalDecomposer, createGoalDecomposer } from '@sam-ai/agentic';

const decomposer = createGoalDecomposer({ aiProvider: anthropicProvider });
const decomposed = await decomposer.decompose(goalId, {
  maxSubGoals: options.maxSubGoals,
  context: { courseStructure: goal.course },
});
```

#### Task 2.3: Wire State Machine for Plans

**File**: `app/api/sam/agentic/plans/[planId]/start/route.ts`

```typescript
import { AgentStateMachine, createAgentStateMachine } from '@sam-ai/agentic';

const stateMachine = createAgentStateMachine({ store: new PrismaPlanStateStore() });
await stateMachine.transition(planId, 'START');
```

### 6.3 Phase 3: Memory Integration (HIGH COMPLEXITY)

**Objective**: Add persistent vector store and knowledge graph.

#### Task 3.1: Pinecone Adapter

**File**: `packages/agentic/src/memory/adapters/pinecone-adapter.ts`

```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import type { VectorStoreAdapter } from '../vector-store';

export class PineconeVectorAdapter implements VectorStoreAdapter {
  private client: Pinecone;
  private indexName: string;

  constructor(config: { apiKey: string; indexName: string }) {
    this.client = new Pinecone({ apiKey: config.apiKey });
    this.indexName = config.indexName;
  }

  async addVector(id: string, vector: number[], metadata: Record<string, unknown>) {
    const index = this.client.Index(this.indexName);
    await index.upsert([{ id, values: vector, metadata }]);
  }

  async search(vector: number[], topK: number) {
    const index = this.client.Index(this.indexName);
    const results = await index.query({ vector, topK, includeMetadata: true });
    return results.matches ?? [];
  }
}
```

#### Task 3.2: Knowledge Graph to Course Content

```typescript
// Wire knowledge graph to extract concepts from course content
const knowledgeGraph = createKnowledgeGraph();

// On course creation/update:
const concepts = await extractConceptsFromContent(course.description);
for (const concept of concepts) {
  await knowledgeGraph.addConcept(concept);
}

// On section creation:
const prerequisites = await identifyPrerequisites(section.content);
for (const prereq of prerequisites) {
  await knowledgeGraph.addRelation(prereq, section.id, 'prerequisite_of');
}
```

### 6.4 Phase 4: Proactive Features (MEDIUM COMPLEXITY)

#### Task 4.1: Cron Job for Check-Ins

**File**: `app/api/cron/sam-checkins/route.ts`

```typescript
import { createCheckInScheduler } from '@sam-ai/agentic';

export async function GET() {
  const scheduler = createCheckInScheduler({ store: new PrismaCheckInStore() });

  // Get all pending check-ins
  const pending = await scheduler.getPendingCheckIns();

  for (const checkIn of pending) {
    // Send notification
    await sendNotification(checkIn.userId, {
      type: 'check_in',
      message: checkIn.message,
      actionUrl: `/dashboard/learning?checkin=${checkIn.id}`,
    });

    // Mark as sent
    await scheduler.markSent(checkIn.id);
  }

  return NextResponse.json({ processed: pending.length });
}
```

#### Task 4.2: Intervention Triggers

```typescript
// In unified API, after response:
const interventions = await agenticBridge.checkForInterventions({
  userId: session.user.id,
  currentTopic: pageContext?.entityData?.title,
  sessionStartTime: new Date(),
});

if (interventions.length > 0) {
  // Add to response as suggestions
  suggestions.push(...interventions.map(i => ({
    type: 'intervention',
    title: i.reason,
    action: i.recommendedAction,
  })));
}
```

### 6.5 Phase 5: Frontend Integration (MEDIUM PRIORITY)

#### Task 5.1: Create useAgentic Hook

**File**: `packages/react/src/hooks/use-agentic.ts`

```typescript
import { useState, useCallback } from 'react';

export function useAgentic(userId: string) {
  const [goals, setGoals] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [progress, setProgress] = useState(null);

  const fetchGoals = useCallback(async () => {
    const res = await fetch('/api/sam/agentic/goals');
    const data = await res.json();
    if (data.success) setGoals(data.data);
  }, []);

  const createGoal = useCallback(async (title: string, options?: object) => {
    const res = await fetch('/api/sam/agentic/goals', {
      method: 'POST',
      body: JSON.stringify({ title, ...options }),
    });
    const data = await res.json();
    if (data.success) {
      setGoals(prev => [...prev, data.data]);
      return data.data;
    }
  }, []);

  const fetchRecommendations = useCallback(async (time = 60) => {
    const res = await fetch(`/api/sam/agentic/recommendations?time=${time}`);
    const data = await res.json();
    if (data.success) setRecommendations(data.data.recommendations);
  }, []);

  return {
    goals,
    recommendations,
    progress,
    fetchGoals,
    createGoal,
    fetchRecommendations,
  };
}
```

#### Task 5.2: Goal Planning UI Component

**File**: `components/sam/goal-planner.tsx`

```typescript
'use client';

import { useAgentic } from '@sam-ai/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function GoalPlanner() {
  const { goals, createGoal, fetchGoals } = useAgentic();

  const handleCreateGoal = async () => {
    const goal = await createGoal('Master React Hooks', {
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      priority: 'high',
    });
    // Decompose immediately
    await fetch(`/api/sam/agentic/goals/${goal.id}/decompose`, { method: 'POST' });
  };

  return (
    <Card>
      <CardHeader>Learning Goals</CardHeader>
      <CardContent>
        <ul>
          {goals.map(goal => (
            <li key={goal.id}>{goal.title} - {goal.status}</li>
          ))}
        </ul>
        <Button onClick={handleCreateGoal}>Create New Goal</Button>
      </CardContent>
    </Card>
  );
}
```

---

## 7. Success Criteria

### 7.1 Integration Metrics

| Metric | Current | Target | Deadline |
|--------|---------|--------|----------|
| Agentic package imports in app/ | 0 | 10+ | Phase 1 |
| ConfidenceScorer invocations/day | 0 | 1000+ | Phase 1 |
| BehaviorMonitor events/day | 0 | 5000+ | Phase 1 |
| Goals using GoalManager | 0% | 100% | Phase 2 |
| Plans using StateMachine | 0% | 100% | Phase 2 |
| VectorStore with Pinecone | No | Yes | Phase 3 |
| Proactive check-ins sent/week | 0 | 100+ | Phase 4 |
| Frontend agentic hooks usage | 0 | 3+ pages | Phase 5 |

### 7.2 Quality Gates

- [ ] All agentic routes use package classes (not raw Prisma)
- [ ] ConfidenceScorer runs on 100% of responses
- [ ] BehaviorMonitor tracks all SAM interactions
- [ ] VectorStore persists to external provider
- [ ] Check-in cron job runs every hour
- [ ] Frontend has goal management UI
- [ ] Documentation matches implementation

---

## 8. Risk Mitigation

### 8.1 Performance Risk

**Risk**: Adding agentic analysis increases response latency.

**Mitigation**:
- Run ConfidenceScorer in parallel with response generation
- Use caching for frequently accessed data
- Set timeout limits (100ms max for confidence scoring)
- Add feature flags to disable in case of issues

### 8.2 Data Migration Risk

**Risk**: Refactoring routes may break existing data.

**Mitigation**:
- Keep Prisma stores as fallback
- Implement adapter pattern for gradual migration
- Add comprehensive integration tests before refactoring
- Use feature flags for gradual rollout

### 8.3 External Service Risk

**Risk**: Pinecone/external services may have outages.

**Mitigation**:
- Implement circuit breaker pattern
- Fall back to InMemory store on failures
- Add health checks and monitoring
- Use multiple providers if budget allows

---

## Appendix A: File Changes Required

### New Files

```
app/api/sam/agentic/analytics/route.ts
app/api/sam/agentic/skills/route.ts
app/api/sam/agentic/recommendations/route.ts
app/api/sam/agentic/events/route.ts
app/api/cron/sam-checkins/route.ts
packages/agentic/src/memory/adapters/pinecone-adapter.ts
packages/agentic/src/stores/prisma-goal-store.ts
packages/react/src/hooks/use-agentic.ts
components/sam/goal-planner.tsx
components/sam/recommendation-widget.tsx
```

### Modified Files

```
app/api/sam/unified/route.ts                    # Add agentic bridge
app/api/sam/unified/stream/route.ts             # Add agentic bridge
app/api/sam/agentic/goals/route.ts              # Use GoalManager
app/api/sam/agentic/goals/[goalId]/route.ts     # Use GoalManager
app/api/sam/agentic/goals/[goalId]/decompose/route.ts  # Use GoalDecomposer
app/api/sam/agentic/plans/route.ts              # Use PlanExecutor
app/api/sam/agentic/plans/[planId]/route.ts     # Use StateMachine
app/api/sam/agentic/plans/[planId]/start/route.ts     # Use StateMachine
app/api/sam/agentic/plans/[planId]/pause/route.ts     # Use StateMachine
app/api/sam/agentic/plans/[planId]/resume/route.ts    # Use StateMachine
components/sam/SAMAssistant.tsx                 # Add event tracking
packages/agentic/src/index.ts                   # Export adapters
```

---

## Appendix B: Quick Win Checklist

**Week 1 Quick Wins** (Highest ROI):

- [x] Import `createSAMAgenticBridge` in `/api/sam/unified/route.ts`
- [x] Call `agenticBridge.scoreConfidence()` on every response
- [x] Include confidence level in API response JSON
- [x] Add `confidence` field to frontend response display
- [x] Log all interactions to ProgressAnalyzer

**Week 2 Quick Wins**:

- [x] Add `/api/sam/agentic/events` endpoint for frontend events
- [x] Track session start/end in SAMAssistant component
- [x] Create `useAgentic` hook with basic goal fetching
- [ ] Add recommendations to SAMAssistant suggestions

---

## Appendix C: Documentation Fixes Required

The following documentation files contain outdated or aspirational claims:

| Document | Issue | Fix Required |
|----------|-------|--------------|
| `packages/agentic/docs/INTEGRATION.md` | Needs updates for tool execution + memory integrations | Document remaining gaps |
| `SAM_AGENTIC_AI_MENTOR_MASTER_PLAN.md` | Outdated status | Updated in current repo |
| `docs/features/sam-ai-system/guides/SAM_AI_ASSISTANT_DOCUMENTATION.md` | Likely outdated integration status | Review and align with current capabilities |

---

**Document Version**: 1.0.0
**Last Updated**: January 2026
**Status**: Partially Implemented
**Next Review**: After Phase 3 completion
