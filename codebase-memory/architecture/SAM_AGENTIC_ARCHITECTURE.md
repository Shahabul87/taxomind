# SAM Agentic AI Architecture

> **MANDATORY READING**: This document describes the complete SAM Agentic AI system architecture. When generating code that integrates with SAM, you MUST follow the patterns and guidelines documented here.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Package Structure](#package-structure)
3. [Integration Layer](#integration-layer)
4. [TaxomindContext - The Single Entry Point](#taxomindcontext---the-single-entry-point)
5. [Store Categories](#store-categories)
6. [API Routes Structure](#api-routes-structure)
7. [Code Integration Guidelines](#code-integration-guidelines)
8. [Common Patterns](#common-patterns)
9. [File Reference Map](#file-reference-map)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TAXOMIND APPLICATION                              │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         API ROUTES (app/api/sam/*)                     │  │
│  │  • unified/route.ts       • agentic/goals/*    • agentic/tools/*      │  │
│  │  • agentic/events/*       • agentic/plans/*    • feedback/*           │  │
│  └─────────────────────────────────────┬─────────────────────────────────┘  │
│                                        │                                     │
│  ┌─────────────────────────────────────▼─────────────────────────────────┐  │
│  │                     lib/sam/ INTEGRATION LAYER                         │  │
│  │                                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    taxomind-context.ts                            │ │  │
│  │  │              (SINGLE ENTRY POINT FOR ALL STORES)                  │ │  │
│  │  │                                                                   │ │  │
│  │  │  getTaxomindContext() → TaxomindIntegrationContext                │ │  │
│  │  │  integration: AdapterFactory + Profile + Registry                │ │  │
│  │  │  getStore('goal')     → PrismaGoalStore                           │ │  │
│  │  │  getGoalStores()      → { goal, subGoal, plan }                   │ │  │
│  │  │  getProactiveStores() → { behaviorEvent, pattern, intervention }  │ │  │
│  │  │  getMemoryStores()    → { vector, knowledgeGraph, sessionContext }│ │  │
│  │  └──────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                        │  │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────┐  │  │
│  │  │  agentic-bridge.ts │  │ proactive-*.ts     │  │ orchestration-  │  │  │
│  │  │  (Main Bridge)     │  │ (Interventions)    │  │ integration.ts  │  │  │
│  │  └────────────────────┘  └────────────────────┘  └─────────────────┘  │  │
│  │                                                                        │  │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────┐  │  │
│  │  │  agentic-memory.ts │  │ agentic-tooling.ts │  │ journey-*.ts    │  │  │
│  │  │  (Memory System)   │  │ (Tool Registry)    │  │ (Timeline)      │  │  │
│  │  └────────────────────┘  └────────────────────┘  └─────────────────┘  │  │
│  │                                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │  │                       stores/ (Prisma Adapters)                   │ │  │
│  │  │  prisma-goal-store.ts    prisma-plan-store.ts   prisma-*-store.ts │ │  │
│  │  └──────────────────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                     │
│  ┌─────────────────────────────────────▼─────────────────────────────────┐  │
│  │                         packages/ (SAM AI SDK)                         │  │
│  │                                                                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │  │
│  │  │ @sam-ai/    │ │ @sam-ai/    │ │ @sam-ai/    │ │ @sam-ai/        │  │  │
│  │  │ agentic     │ │ core        │ │ educational │ │ react           │  │  │
│  │  │             │ │             │ │             │ │                 │  │  │
│  │  │ Goal Plan   │ │ Orchestrator│ │ 40+ Engines │ │ 11+ Hooks       │  │  │
│  │  │ Tool Exec   │ │ StateMachine│ │ Standards   │ │ Provider        │  │  │
│  │  │ Proactive   │ │ AI Adapters │ │ Analyzers   │ │ Context         │  │  │
│  │  │ Memory      │ │             │ │             │ │                 │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘  │  │
│  │                                                                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │  │
│  │  │ @sam-ai/    │ │ @sam-ai/    │ │ @sam-ai/    │ │ @sam-ai/        │  │  │
│  │  │ pedagogy    │ │ memory      │ │ safety      │ │ quality         │  │  │
│  │  │             │ │             │ │             │ │                 │  │  │
│  │  │ Bloom's     │ │ Mastery     │ │ Bias        │ │ 6 Quality Gates │  │  │
│  │  │ Scaffolding │ │ SpacedRep   │ │ Fairness    │ │ Validation      │  │  │
│  │  │ ZPD         │ │ Pathways    │ │ Accessibility│ │                │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                     │
│  ┌─────────────────────────────────────▼─────────────────────────────────┐  │
│  │                         PRISMA / DATABASE                              │  │
│  │                     prisma/schema.prisma                               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Package Structure

### 1. `@sam-ai/agentic` - Autonomous Agentic Capabilities
**Location**: `packages/agentic/src/`

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `goal-planning/` | Goal tracking, decomposition, planning | `createGoalDecomposer`, `createAgentStateMachine`, `GoalStore`, `PlanStore` |
| `tool-registry/` | Permissioned tool execution | `createToolRegistry`, `createToolExecutor`, `createPermissionManager` |
| `tool-execution/` | Tool execution with audit logging | `createToolExecutor`, `createAuditLogger` |
| `proactive-intervention/` | Behavior monitoring, check-ins | `createBehaviorMonitor`, `createCheckInScheduler` |
| `memory/` | Long-term memory system | `createMemorySystem`, `VectorStore`, `KnowledgeGraph` |
| `learning-analytics/` | Progress analysis, recommendations | `createProgressAnalyzer`, `createRecommendationEngine` |
| `orchestration/` | Tutoring loop controller | `createTutoringLoopController` |

### 2. `@sam-ai/core` - Core AI Orchestration
**Location**: `packages/core/src/`

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `orchestrator.ts` | Main orchestration logic | `Orchestrator`, `createOrchestrator` |
| `state-machine.ts` | State management | `StateMachine`, `createStateMachine` |
| `adapters/` | AI provider adapters | `AnthropicAdapter`, `OpenAIAdapter`, `createAnthropicAdapter` |
| `engines/` | Core processing engines | Various engine factories |

### 3. `@sam-ai/integration` + Adapters - Portability Layer
**Location**: `packages/integration/src/`, `packages/adapter-taxomind/src/`, `packages/adapter-prisma/src/`

Provides a host-agnostic capability profile, adapter registry/factory, and bridge helpers:
- `IntegrationProfile`, `AdapterFactory`, `CapabilityRegistry`
- AI, embedding, database, auth, vector adapters
- Bridges for Core AI + Embedding provider integration

### 4. `@sam-ai/educational` - Educational Engines
**Location**: `packages/educational/src/`

Contains 40+ specialized educational engines for:
- Content generation
- Assessment creation
- Adaptive learning
- Skill development

### 5. `@sam-ai/react` - React Integration
**Location**: `packages/react/src/`

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `hooks/` | React hooks for SAM | `useSAM`, `useSAMChat`, `useGoals`, `useInterventions` |
| `context/` | React context providers | `SAMProvider`, `SAMContext` |

---

## Integration Layer

### Critical Files in `lib/sam/`

```
lib/sam/
├── taxomind-context.ts      # SINGLE ENTRY POINT - All stores
├── integration-adapters.ts  # Adapter bridge (Core AI + Embeddings)
├── index.ts                 # Main export file
├── agentic-bridge.ts        # Main integration bridge
├── agentic-tooling.ts       # Tool registry integration
├── agentic-memory.ts        # Memory system integration
├── agentic-proactive-scheduler.ts  # Proactive interventions
├── orchestration-integration.ts    # Tutoring orchestration
├── proactive-intervention-integration.ts  # Intervention system
├── journey-timeline-service.ts     # Learning journey tracking
└── stores/                  # Prisma store adapters
    ├── index.ts             # Store exports
    ├── prisma-goal-store.ts
    ├── prisma-plan-store.ts
    ├── prisma-subgoal-store.ts
    ├── prisma-behavior-store.ts
    ├── prisma-pattern-store.ts
    ├── prisma-intervention-store.ts
    ├── prisma-checkin-store.ts
    ├── prisma-tool-store.ts
    ├── prisma-memory-stores.ts
    ├── prisma-analytics-stores.ts
    ├── prisma-skill-store.ts
    ├── prisma-learning-path-store.ts
    ├── prisma-course-graph-store.ts
    ├── prisma-learning-plan-store.ts
    ├── prisma-tutoring-session-store.ts
    └── prisma-skill-build-track-store.ts
```

**Integration Adapters**

Use `lib/sam/integration-adapters.ts` to access the integration AI + embedding adapters. This is the
portable bridge that keeps LMS code from hard-coding provider SDKs. It relies on:
- `packages/integration/src/bridges/*` (Core AI + Embedding provider bridges)
- `packages/adapter-taxomind` (Taxomind profile + adapter registrations)

---

## TaxomindContext - The Single Entry Point

> **CRITICAL**: All SAM store access MUST go through `TaxomindContext`. Never create stores directly.

### File: `lib/sam/taxomind-context.ts`

```typescript
// ✅ CORRECT - Always use TaxomindContext
import {
  getTaxomindContext,
  getIntegrationProfile,
  getAdapterFactory,
  getStore,
  getGoalStores,
  getProactiveStores,
  getMemoryStores,
  getObservabilityStores,
  getAnalyticsStores,
  getLearningPathStores,
  getMultiSessionStores,
  getPresenceStore,
  getStudentProfileStore,
  getReviewScheduleStore,
} from '@/lib/sam/taxomind-context';

// Get full context
const context = getTaxomindContext();
const goalStore = context.stores.goal;
const profile = getIntegrationProfile();
const adapterFactory = getAdapterFactory();

// Get specific store
const toolStore = getStore('tool');

// Get store groups
const { goal, subGoal, plan } = getGoalStores();
const { behaviorEvent, pattern, intervention, checkIn } = getProactiveStores();
const { vector, knowledgeGraph, sessionContext } = getMemoryStores();
const { skill, learningPath, courseGraph } = getLearningPathStores();
const { toolTelemetry, confidenceCalibration, memoryQuality, planLifecycle, metrics } = getObservabilityStores();
const { learningSession, topicProgress, learningGap, skillAssessment, recommendation, content } = getAnalyticsStores();
const { learningPlan, tutoringSession, skillBuildTrack } = getMultiSessionStores();
const presenceStore = getPresenceStore();
const studentProfileStore = getStudentProfileStore();
const reviewScheduleStore = getReviewScheduleStore();

// ❌ NEVER DO THIS - Direct store creation
import { createPrismaGoalStore } from '@/lib/sam/stores';
const goalStore = createPrismaGoalStore(); // WRONG!
```

### Available Store Groups

| Function | Returns | Use Case |
|----------|---------|----------|
| `getTaxomindContext()` | Full context with all stores | When you need multiple store types |
| `getStore('storeName')` | Single store by name | Quick access to one store |
| `getGoalStores()` | `{ goal, subGoal, plan }` | Goal/plan management |
| `getProactiveStores()` | `{ behaviorEvent, pattern, intervention, checkIn }` | Proactive interventions |
| `getMemoryStores()` | `{ vector, knowledgeGraph, sessionContext }` | Memory/knowledge operations |
| `getLearningPathStores()` | `{ skill, learningPath, courseGraph }` | Learning path management |
| `getObservabilityStores()` | `{ toolTelemetry, confidenceCalibration, memoryQuality, planLifecycle, metrics }` | Telemetry and quality metrics |
| `getAnalyticsStores()` | `{ learningSession, topicProgress, learningGap, skillAssessment, recommendation, content }` | Learning analytics |
| `getStore('qualityRecord')` | `PrismaQualityRecordStore` | Response quality tracking |
| `getStore('confidenceScore')` | `PrismaConfidenceScoreStore` | Confidence scoring history |
| `getStore('verificationResult')` | `PrismaVerificationResultStore` | Verification outcomes |
| `getStore('calibration')` | `PrismaCalibrationStore` | Calibration data |
| `getStore('selfCritique')` | `PrismaSelfCritiqueStore` | Self-critique records |
| `getStore('learningPattern')` | `PrismaLearningPatternStore` | Meta-learning patterns |
| `getStore('metaLearningInsight')` | `PrismaMetaLearningInsightStore` | Meta-learning insights |
| `getStore('learningStrategy')` | `PrismaLearningStrategyStore` | Adaptive learning strategies |
| `getStore('learningEvent')` | `PrismaLearningEventStore` | Learning event history |
| `getStore('journeyTimeline')` | `PrismaJourneyTimelineStore` | Learning journey timeline |
| `getMultiSessionStores()` | `{ learningPlan, tutoringSession, skillBuildTrack }` | Cross-session continuity |
| `getPresenceStore()` | `PrismaPresenceStore` | Realtime user presence tracking |
| `getStudentProfileStore()` | `PrismaStudentProfileStore` | Student mastery and profiles |
| `getReviewScheduleStore()` | `PrismaReviewScheduleStore` | Spaced repetition scheduling |

---

## Store Categories

### 1. Goal Planning Stores

| Store | Interface | Purpose |
|-------|-----------|---------|
| `goal` | `PrismaGoalStore` | User learning goals |
| `subGoal` | `PrismaSubGoalStore` | Decomposed sub-goals |
| `plan` | `PrismaPlanStore` | Execution plans for goals |

**Schema References**: `prisma/domains/17-sam-agentic.prisma`
- `SAMGoal`
- `SAMSubGoal`
- `SAMPlan`
- `SAMPlanStep`

### 2. Proactive Intervention Stores

| Store | Interface | Purpose |
|-------|-----------|---------|
| `behaviorEvent` | `BehaviorEventStore` | Track user behavior events |
| `pattern` | `PatternStore` | Detected behavior patterns |
| `intervention` | `InterventionStore` | Triggered interventions |
| `checkIn` | `CheckInStore` | Scheduled check-ins |

**Schema References**: `prisma/domains/17-sam-agentic.prisma`
- `SAMBehaviorEvent`
- `SAMBehaviorPattern`
- `SAMIntervention`
- `SAMCheckIn`

### 3. Memory Stores

| Store | Interface | Purpose |
|-------|-----------|---------|
| `vector` | `PrismaVectorAdapter` | Vector embeddings for semantic search |
| `knowledgeGraph` | `PrismaKnowledgeGraphStore` | Knowledge graph entities/relationships |
| `sessionContext` | `PrismaSessionContextStore` | Session-specific context |

**Schema References**: `prisma/domains/17-sam-agentic.prisma`
- `SAMVectorEmbedding`
- `SAMLongTermMemory`
- `SAMConversationMemory`
- `SAMKnowledgeEntity`
- `SAMKnowledgeRelationship`
- `SAMSessionContext`

### 4. Tool Registry Store

| Store | Interface | Purpose |
|-------|-----------|---------|
| `tool` | `PrismaToolStore` | Registered tools and their definitions |

**Schema References**: `prisma/domains/17-sam-agentic.prisma`
- `SAMTool`
- `SAMToolInvocation`
- `SAMToolPermission`

### 5. Analytics Stores

| Store | Interface | Purpose |
|-------|-----------|---------|
| `learningSession` | `PrismaLearningSessionStore` | Learning session data |
| `topicProgress` | `PrismaTopicProgressStore` | Topic-level progress |
| `learningGap` | `PrismaLearningGapStore` | Identified knowledge gaps |
| `skillAssessment` | `PrismaSkillAssessmentStore` | Skill assessments |
| `recommendation` | `PrismaRecommendationStore` | Learning recommendations |
| `content` | `PrismaContentStore` | Content metadata |

### 6. Learning Path Stores

| Store | Interface | Purpose |
|-------|-----------|---------|
| `skill` | `PrismaSkillStore` | Skill definitions |
| `learningPath` | `PrismaLearningPathStore` | Learning path structures |
| `courseGraph` | `PrismaCourseGraphStore` | Course prerequisite graphs |

### 7. Multi-Session Stores

| Store | Interface | Purpose |
|-------|-----------|---------|
| `learningPlan` | `PrismaLearningPlanStore` | Multi-session learning plans |
| `tutoringSession` | `PrismaTutoringSessionStore` | Cross-session tutoring continuity |
| `skillBuildTrack` | `PrismaSkillBuildTrackStore` | Skill development tracking |

### 8. Observability Stores (NEW)

| Store | Interface | Purpose |
|-------|-----------|---------|
| `toolTelemetry` | `PrismaToolTelemetryStore` | Tool execution metrics and latencies |
| `confidenceCalibration` | `PrismaConfidenceCalibrationStore` | AI confidence predictions and outcomes |
| `memoryQuality` | `PrismaMemoryQualityStore` | Memory retrieval quality tracking |
| `planLifecycle` | `PrismaPlanLifecycleStore` | Plan state transitions and events |
| `metrics` | `PrismaMetricsStore` | General metrics recording |

**Schema References**: `prisma/migrations/20260106_add_sam_observability/migration.sql`
- `SAMMetric`
- `SAMToolExecution`
- `SAMConfidenceScore`
- `SAMMemoryRetrieval`
- `SAMPlanLifecycleEvent`
- `SAMAggregatedMetrics`

### 9. Self-Evaluation Stores (NEW)

| Store | Interface | Purpose |
|-------|-----------|---------|
| `confidenceScore` | `PrismaConfidenceScoreStore` | Confidence scoring records |
| `verificationResult` | `PrismaVerificationResultStore` | Verification outcomes |
| `qualityRecord` | `PrismaQualityRecordStore` | Quality metrics and scoring |
| `calibration` | `PrismaCalibrationStore` | Calibration data |
| `selfCritique` | `PrismaSelfCritiqueStore` | Self-critique iterations |

**Schema References**: `prisma/domains/17-sam-agentic.prisma`
- `SAMSelfEvaluationScore`
- `SAMVerificationResult`
- `SAMQualityRecord`
- `SAMCalibrationData`
- `SAMSelfCritique`

### 10. Meta-Learning Stores (NEW)

| Store | Interface | Purpose |
|-------|-----------|---------|
| `learningPattern` | `PrismaLearningPatternStore` | Detected learning patterns |
| `metaLearningInsight` | `PrismaMetaLearningInsightStore` | Meta-learning insights |
| `learningStrategy` | `PrismaLearningStrategyStore` | Learning strategy recommendations |
| `learningEvent` | `PrismaLearningEventStore` | Learning event history |

**Schema References**: `prisma/domains/17-sam-agentic.prisma`
- `SAMLearningPattern`
- `SAMMetaLearningInsight`
- `SAMLearningStrategy`
- `SAMLearningEvent`

### 11. Journey Timeline Store (NEW)

| Store | Interface | Purpose |
|-------|-----------|---------|
| `journeyTimeline` | `PrismaJourneyTimelineStore` | Learning journey timeline and milestones |

**Schema References**: `prisma/domains/17-sam-agentic.prisma`
- `SAMJourneyTimeline`
- `SAMJourneyEvent`
- `SAMJourneyMilestone`

### 12. Presence Store (NEW)

| Store | Interface | Purpose |
|-------|-----------|---------|
| `presence` | `PrismaPresenceStore` | Realtime user presence and location |

**Schema References**: `prisma/domains/17-sam-agentic.prisma`
- `SAMUserPresence`

### 13. Student Profile Store (NEW)

| Store | Interface | Purpose |
|-------|-----------|---------|
| `studentProfile` | `PrismaStudentProfileStore` | Student mastery profiles and cognitive preferences |

**Schema References**: Uses configurable table names
- Student profiles with mastery records
- Learning pathways with step tracking
- Topic mastery with Bloom&apos;s level tracking

### 14. Review Schedule Store (NEW)

| Store | Interface | Purpose |
|-------|-----------|---------|
| `reviewSchedule` | `PrismaReviewScheduleStore` | Spaced repetition review scheduling |

**Features**:
- SM-2 algorithm support (interval, ease factor, repetitions)
- Due review tracking
- Per-topic scheduling

---

## API Routes Structure

### SAM API Routes Map

```
app/api/sam/
├── unified/
│   ├── route.ts              # Main unified SAM endpoint
│   └── stream/route.ts       # Streaming responses
├── agentic/
│   ├── goals/
│   │   ├── route.ts          # CRUD for goals
│   │   └── [goalId]/
│   │       ├── route.ts      # Single goal operations
│   │       └── decompose/route.ts  # Goal decomposition
│   ├── plans/
│   │   └── [planId]/
│   │       └── start/route.ts  # Start plan execution
│   ├── tools/
│   │   ├── route.ts          # Tool listing/registration
│   │   └── confirmations/route.ts  # Tool confirmations
│   ├── events/route.ts       # Behavior events
│   ├── behavior/
│   │   └── track/route.ts    # Behavior tracking
│   └── journey/route.ts      # Learning journey
├── feedback/route.ts         # User feedback
├── knowledge/route.ts        # Knowledge graph
├── wizard-memory/route.ts    # Wizard context memory
└── skill-build-track/route.ts  # Skill tracking
```

### Route Pattern

```typescript
// app/api/sam/agentic/goals/route.ts
import { getStore } from '@/lib/sam/taxomind-context';

// Get the Goal Store from TaxomindContext singleton
const goalStore = getStore('goal');

export async function GET(req: NextRequest) {
  // Use goalStore...
}

export async function POST(req: NextRequest) {
  // Use goalStore...
}
```

### Cron Routes Map

SAM uses scheduled cron jobs for maintenance, analytics, and proactive interventions:

```
app/api/cron/
├── sam-memory-lifecycle/route.ts  # Memory reindexing and cleanup
├── sam-checkins/route.ts          # Scheduled check-in processing
├── sam-analytics-rollups/route.ts # Analytics aggregation
└── sam-proactive/route.ts         # Proactive intervention scheduling
```

| Cron Route | Schedule | Purpose |
|------------|----------|---------|
| `sam-memory-lifecycle` | Every 6 hours | Processes reindex jobs, cleans stale embeddings |
| `sam-checkins` | Every hour | Processes pending check-ins |
| `sam-analytics-rollups` | Daily | Aggregates analytics data |
| `sam-proactive` | Every 15 min | Schedules proactive interventions |

**Security**: All cron routes require `CRON_SECRET` authorization header.

```bash
# Example: Trigger memory lifecycle manually
curl -X POST http://localhost:3000/api/cron/sam-memory-lifecycle \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"action": "process"}'
```

---

## Code Integration Guidelines

### Rule 1: Always Use TaxomindContext for Store Access

```typescript
// ✅ CORRECT
import { getGoalStores } from '@/lib/sam/taxomind-context';
const { goal: goalStore, plan: planStore } = getGoalStores();

// ❌ WRONG - Never create stores directly
import { createPrismaGoalStore } from '@/lib/sam/stores';
const goalStore = createPrismaGoalStore();
```

### Rule 2: Import Types from @sam-ai/agentic

```typescript
// ✅ CORRECT - Import types from package
import {
  type Goal,
  type GoalStatus,
  type GoalPriority,
  type Plan,
  type PlanStep,
} from '@sam-ai/agentic';

// ✅ CORRECT - Import store types from taxomind-context
import {
  type PrismaGoalStore,
  type PrismaPlanStore,
} from '@/lib/sam/taxomind-context';
```

### Rule 3: Use Agentic Package Factories for Business Logic

```typescript
// ✅ CORRECT - Use package factories for components
import {
  createGoalDecomposer,
  createAgentStateMachine,
  createBehaviorMonitor,
  createCheckInScheduler,
} from '@sam-ai/agentic';

// Then pass stores from TaxomindContext
const proactiveStores = getProactiveStores();
const behaviorMonitor = createBehaviorMonitor({
  eventStore: proactiveStores.behaviorEvent,
  patternStore: proactiveStores.pattern,
  interventionStore: proactiveStores.intervention,
  logger,
});
```

### Rule 4: Follow the Integration Bridge Pattern

When creating new integration functionality:

```typescript
// lib/sam/my-new-integration.ts
import { logger } from '@/lib/logger';
import { getTaxomindContext } from '@/lib/sam/taxomind-context';
import { createSomeComponent } from '@sam-ai/agentic';

let componentInstance: SomeComponent | null = null;

export function getMyComponent(): SomeComponent {
  if (componentInstance) {
    return componentInstance;
  }

  // Get stores from context
  const { stores } = getTaxomindContext();

  // Create component with stores
  componentInstance = createSomeComponent({
    store: stores.someStore,
    logger,
  });

  return componentInstance;
}

export function resetMyComponent(): void {
  componentInstance = null;
}
```

### Rule 5: Use Integration Adapters for AI + Embeddings

```typescript
import { getCoreAIAdapter, getEmbeddingProvider } from '@/lib/sam/integration-adapters';

const aiAdapter = await getCoreAIAdapter();
const embeddingProvider = await getEmbeddingProvider();
```

### Rule 6: Export from lib/sam/index.ts

When adding new integration functionality, always export from the main index:

```typescript
// lib/sam/index.ts
export {
  getMyComponent,
  resetMyComponent,
} from './my-new-integration';
```

---

## Common Patterns

### Pattern 1: API Route with Store Access

```typescript
// app/api/sam/agentic/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';

const ExampleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = ExampleSchema.parse(body);

    // Get store from TaxomindContext
    const exampleStore = getStore('goal'); // or appropriate store

    const result = await exampleStore.create({
      userId: session.user.id,
      ...validated,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error('[API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Pattern 2: Integration Service with Lazy Initialization

```typescript
// lib/sam/example-service.ts
import { logger } from '@/lib/logger';
import { getTaxomindContext } from '@/lib/sam/taxomind-context';
import { createSomeFeature, type SomeFeature } from '@sam-ai/agentic';

let featureInstance: SomeFeature | null = null;

export function getExampleFeature(): SomeFeature {
  if (featureInstance) {
    return featureInstance;
  }

  const { stores } = getTaxomindContext();

  featureInstance = createSomeFeature({
    store: stores.relevantStore,
    logger,
  });

  logger.info('[ExampleService] Feature initialized');
  return featureInstance;
}

export function resetExampleFeature(): void {
  logger.info('[ExampleService] Resetting feature');
  featureInstance = null;
}
```

### Pattern 3: React Hook Integration

```typescript
// components/hooks/use-example.ts
import { useSAM } from '@sam-ai/react';
import { useCallback } from 'react';

export function useExample() {
  const { goals, createGoal, isLoading } = useSAM();

  const handleCreateGoal = useCallback(async (title: string) => {
    try {
      await createGoal({ title, priority: 'high' });
    } catch (error) {
      console.error('Failed to create goal:', error);
    }
  }, [createGoal]);

  return {
    goals,
    handleCreateGoal,
    isLoading,
  };
}
```

---

## File Reference Map

### Core Integration Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `lib/sam/taxomind-context.ts` | **SINGLE ENTRY POINT** for all stores | `getTaxomindContext()`, `getStore()`, `getGoalStores()` |
| `lib/sam/index.ts` | Main export aggregator | All SAM exports |
| `lib/sam/agentic-bridge.ts` | Main integration bridge | `getSAMAgenticBridge()`, `initGoalPlanning()` |
| `lib/sam/agentic-tooling.ts` | Tool registry integration | `getToolingSystem()`, `ensureToolingInitialized()` |
| `lib/sam/agentic-memory.ts` | Memory system integration | `getAgenticMemorySystem()` |
| `lib/sam/integration-adapters.ts` | AI + embedding adapter bridge | `getCoreAIAdapter()`, `getEmbeddingProvider()` |
| `lib/sam/orchestration-integration.ts` | Tutoring orchestration | `initializeOrchestration()`, `getTutoringController()` |
| `lib/sam/proactive-intervention-integration.ts` | Proactive interventions | `initializeProactiveInterventions()` |
| `lib/sam/agentic-proactive-scheduler.ts` | Check-in scheduling | `ProactiveScheduler` class |
| `lib/sam/journey-timeline-service.ts` | Learning journey tracking | `recordGoalCreated()`, `recordPlanStarted()` |
| `lib/sam/memory-lifecycle-service.ts` | Memory reindexing and cleanup | `getMemoryLifecycleManager()`, `queueCourseReindex()` |

### Store Files

| File | Stores Provided |
|------|-----------------|
| `lib/sam/stores/prisma-goal-store.ts` | `PrismaGoalStore` |
| `lib/sam/stores/prisma-subgoal-store.ts` | `PrismaSubGoalStore` |
| `lib/sam/stores/prisma-plan-store.ts` | `PrismaPlanStore` |
| `lib/sam/stores/prisma-behavior-store.ts` | `PrismaBehaviorEventStore` |
| `lib/sam/stores/prisma-pattern-store.ts` | `PrismaPatternStore` |
| `lib/sam/stores/prisma-intervention-store.ts` | `PrismaInterventionStore` |
| `lib/sam/stores/prisma-checkin-store.ts` | `PrismaCheckInStore` |
| `lib/sam/stores/prisma-tool-store.ts` | `PrismaToolStore` |
| `lib/sam/stores/prisma-memory-stores.ts` | `PrismaVectorAdapter`, `PrismaKnowledgeGraphStore`, `PrismaSessionContextStore` |
| `lib/sam/stores/prisma-analytics-stores.ts` | 6 analytics stores |
| `lib/sam/stores/prisma-skill-store.ts` | `PrismaSkillStore` |
| `lib/sam/stores/prisma-learning-path-store.ts` | `PrismaLearningPathStore` |
| `lib/sam/stores/prisma-course-graph-store.ts` | `PrismaCourseGraphStore` |
| `lib/sam/stores/prisma-learning-plan-store.ts` | `PrismaLearningPlanStore` |
| `lib/sam/stores/prisma-tutoring-session-store.ts` | `PrismaTutoringSessionStore` |
| `lib/sam/stores/prisma-skill-build-track-store.ts` | `PrismaSkillBuildTrackStore` |

### Package Index Files

| Package | Main Export | Key Capabilities |
|---------|-------------|------------------|
| `packages/agentic/src/index.ts` | `@sam-ai/agentic` | Goal planning, tools, proactive, memory |
| `packages/core/src/index.ts` | `@sam-ai/core` | Orchestrator, state machine, AI adapters |
| `packages/integration/src/index.ts` | `@sam-ai/integration` | Capability profiles, adapter factory, bridges |
| `packages/adapter-taxomind/src/index.ts` | `@sam-ai/adapter-taxomind` | Taxomind adapters + profile bootstrap |
| `packages/adapter-prisma/src/index.ts` | `@sam-ai/adapter-prisma` | Prisma-backed stores |
| `packages/educational/src/index.ts` | `@sam-ai/educational` | 40+ educational engines |
| `packages/react/src/index.ts` | `@sam-ai/react` | React hooks and providers |
| `packages/pedagogy/src/index.ts` | `@sam-ai/pedagogy` | Bloom's, scaffolding, ZPD |
| `packages/safety/src/index.ts` | `@sam-ai/safety` | Bias detection, fairness |
| `packages/quality/src/index.ts` | `@sam-ai/quality` | Quality gates |
| `packages/memory/src/index.ts` | `@sam-ai/memory` | Mastery tracking, spaced repetition |

---

## Quick Reference Checklist

When integrating with SAM:

- [ ] Use `getTaxomindContext()` or specific getters for store access
- [ ] Never import `create*Store` functions directly in API routes or integration files
- [ ] Import types from `@sam-ai/agentic` package
- [ ] Import business logic factories from `@sam-ai/agentic`
- [ ] Use lazy initialization pattern for singleton instances
- [ ] Export new functionality from `lib/sam/index.ts`
- [ ] Validate input with Zod schemas
- [ ] Handle errors with proper logging
- [ ] Check Prisma schema before adding new database operations

---

## Realtime Infrastructure

### Overview

SAM provides real-time communication infrastructure for:
- **Presence Tracking**: User online/offline/idle status
- **Push Delivery**: Real-time intervention and notification delivery
- **SSE Fallback**: Server-Sent Events for environments without WebSocket support

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│                                                                      │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐ │
│  │  SAMRealtimeClient  │    │  EventSource (SSE)                  │ │
│  │  - WebSocket        │    │  - /api/sam/realtime/events         │ │
│  │  - Presence         │    │  - Automatic reconnection           │ │
│  │  - Interventions    │    │  - Presence updates                 │ │
│  └─────────────────────┘    └─────────────────────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVER (Next.js)                              │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    SAMRealtimeServer                             ││
│  │                                                                  ││
│  │  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────┐ ││
│  │  │  Presence   │  │  Push           │  │  Connection         │ ││
│  │  │  Tracker    │  │  Dispatcher     │  │  Manager            │ ││
│  │  └─────────────┘  └─────────────────┘  └─────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    API Routes                                    ││
│  │  • /api/sam/realtime/events (SSE)                               ││
│  │  • /api/sam/realtime/status (Health check)                      ││
│  │  • /api/sam/realtime/push (Internal push)                       ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### Configuration

Enable realtime features via environment variables:

```bash
# .env.local
SAM_WEBSOCKET_ENABLED=true
NEXT_PUBLIC_WS_URL=wss://your-domain.com/ws  # Optional for WebSocket
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/sam/realtime/events` | GET | SSE endpoint for real-time event streaming |
| `/api/sam/realtime/status` | GET | Server status and health check |
| `/api/sam/realtime/push` | POST | Push event to specific user |
| `/api/sam/realtime/push` | PUT | Broadcast event to all users (admin only) |

### Integration Files

| File | Purpose |
|------|---------|
| `lib/sam/realtime/index.ts` | Main realtime module with client/server classes |
| `instrumentation.ts` | Server bootstrap on application start |
| `infrastructure/kubernetes/sam-agentic-cronjob.yaml` | Kubernetes deployment for realtime server |

---

## External Knowledge Integration

### Overview

SAM integrates external knowledge sources for enriching educational content:
- **News**: Real-time AI/education news from NewsAPI.org
- **Research**: Academic papers from Semantic Scholar
- **Documentation**: Technical docs from DevDocs and MDN

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    External Knowledge Aggregator                     │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  News Provider  │  │  Research       │  │  Documentation      │ │
│  │  (NewsAPI.org)  │  │  (Semantic      │  │  (DevDocs/MDN)      │ │
│  │                 │  │  Scholar)       │  │                     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘ │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    lib/sam/external-knowledge-integration.ts        │
│                                                                      │
│  • getExternalKnowledgeAggregator() - Singleton access              │
│  • searchNews(topic, limit) - Search news articles                  │
│  • searchResearch(topic, limit) - Search academic papers            │
│  • searchDocumentation(topic, limit) - Search technical docs        │
│  • enrichTopicContext(topic) - Enrich learning topics               │
└─────────────────────────────────────────────────────────────────────┘
```

### Configuration

```bash
# .env.local
NEWS_API_KEY=your-newsapi-key  # Optional, enables real news
# Semantic Scholar - No key required (free API)
# DevDocs - No key required (free API)
```

### API Route

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/sam/ai-news` | GET | Fetch AI/education news |

Query parameters:
- `realtime=true` - Use real external APIs (requires NEWS_API_KEY)
- `topic=string` - Search topic
- `limit=number` - Max results (1-50)
- `category=string` - Filter by category

### Integration Example

```typescript
import {
  getExternalKnowledgeAggregator,
  searchNews,
  enrichTopicContext,
} from '@/lib/sam/external-knowledge-integration';

// Search for news
const news = await searchNews('machine learning', 10);

// Enrich a learning topic
const context = await enrichTopicContext('React hooks', {
  includeLatestNews: true,
  includeResearch: true,
  maxItems: 5,
});
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-08 | Initial architecture documentation |
| 1.1.0 | 2025-01-10 | Added observability, presence, student profile, and review schedule stores |
| 1.2.0 | 2026-01-10 | Added realtime infrastructure and external knowledge integration documentation |

---

**Last Updated**: January 2026
**Maintainer**: Taxomind Development Team
