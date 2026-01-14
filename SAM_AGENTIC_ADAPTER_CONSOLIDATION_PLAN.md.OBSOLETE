# SAM Agentic Adapter Consolidation Plan

**Goal:** Make `@sam-ai/adapter-taxomind` the single integration entrypoint, eliminating direct connections from `lib/sam/*` to `packages/agentic`.

**Date:** January 2025
**Status:** Planning

---

## Table of Contents

1. [Current Architecture Problem](#1-current-architecture-problem)
2. [Target Architecture](#2-target-architecture)
3. [Complete File Connection Map](#3-complete-file-connection-map)
4. [Store Migration Map](#4-store-migration-map)
5. [Implementation Phases](#5-implementation-phases)
6. [Detailed File Changes](#6-detailed-file-changes)
7. [Testing Strategy](#7-testing-strategy)
8. [Rollback Plan](#8-rollback-plan)

---

## 1. Current Architecture Problem

### The Dual-Path Issue

Currently, SAM Agentic has **two ways** to connect to the portable package:

```
WAY 1 (Current - PROBLEMATIC):
┌──────────────┐                      ┌───────────────────┐
│  lib/sam/*   │ ──── DIRECT ────────▶│ packages/agentic  │
└──────────────┘                      └───────────────────┘
       │
       │ Creates its own Prisma stores
       ▼
┌──────────────────────┐
│ lib/sam/stores/*.ts  │  ← 20+ store files duplicating adapter
└──────────────────────┘


WAY 2 (Desired - CORRECT):
┌──────────────┐     ┌─────────────────────┐     ┌───────────────────┐
│  lib/sam/*   │ ──▶ │  adapter-taxomind   │ ──▶ │ packages/agentic  │
└──────────────┘     └─────────────────────┘     └───────────────────┘
                              │
                              │ Provides all stores via
                              ▼
                     ┌─────────────────────┐
                     │ TaxomindIntegration │
                     │ Context (singleton) │
                     └─────────────────────┘
```

### Problems This Causes

| Problem | Impact |
|---------|--------|
| **Inconsistent Storage** | Some features use Prisma, some use in-memory (data lost on restart) |
| **Duplicate Code** | 20+ store files in `lib/sam/stores/` duplicate adapter capability |
| **Hard to Maintain** | Changes must be made in multiple places |
| **Not Portable** | The "portable" package is bypassed, defeating its purpose |
| **Configuration Drift** | Different initialization paths can have different configs |

---

## 2. Target Architecture

### Single Entry Point

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
│                                                                         │
│  app/api/sam/unified/route.ts                                          │
│  app/api/sam/agentic/**/*.ts                                           │
│  components/sam/*.tsx                                                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     │ imports
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        LIB/SAM LAYER (Thin Wrappers)                    │
│                                                                         │
│  lib/sam/agentic-bridge.ts      → Uses TaxomindIntegrationContext      │
│  lib/sam/orchestration-*.ts     → Uses context.adapters.*              │
│  lib/sam/integration-profile.ts → Already correct ✅                    │
│                                                                         │
│  ❌ lib/sam/stores/ → REMOVED (moved to adapter)                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     │ imports (SINGLE ENTRY POINT)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   ADAPTER-TAXOMIND LAYER                                │
│                   packages/adapter-taxomind/                            │
│                                                                         │
│  TaxomindIntegrationContext {                                          │
│    profile: IntegrationProfile,                                        │
│    registry: CapabilityRegistry,                                       │
│    factory: AdapterFactory,                                            │
│    adapters: {                                                         │
│      database: PrismaDatabaseAdapter,    ← All entity repositories     │
│      auth: NextAuthAdapter,                                            │
│      ai: AnthropicAIAdapter,                                           │
│      vector: TaxomindVectorService,                                    │
│    },                                                                  │
│    stores: {                              ← NEW: Agentic-specific      │
│      goal: GoalStore,                                                  │
│      plan: PlanStore,                                                  │
│      behavior: BehaviorEventStore,                                     │
│      pattern: PatternStore,                                            │
│      intervention: InterventionStore,                                  │
│      checkIn: CheckInStore,                                            │
│      tool: ToolStore,                                                  │
│      analytics: AnalyticsStores,                                       │
│      memory: MemoryStores,                                             │
│    }                                                                   │
│  }                                                                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     │ implements interfaces from
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER (Abstract Interfaces)               │
│                   packages/integration/                                 │
│                                                                         │
│  DatabaseAdapter, AIAdapter, VectorAdapter, AuthAdapter                │
│  GoalStore, PlanStore, BehaviorEventStore (interface definitions)      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     │ used by
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   AGENTIC LAYER (Pure Portable Logic)                   │
│                   packages/agentic/                                     │
│                                                                         │
│  GoalDecomposer, PlanBuilder, BehaviorMonitor, ToolRegistry, etc.      │
│  (No database knowledge - receives stores via dependency injection)    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Complete File Connection Map

### Current Connections (What Exists Today)

#### 🔴 DIRECT CONNECTIONS (To Be Changed)

| Source File | Imports From | What It Imports |
|-------------|--------------|-----------------|
| `lib/sam/agentic-bridge.ts` | `@sam-ai/agentic` | GoalDecomposer, PlanBuilder, BehaviorMonitor, etc. |
| `lib/sam/agentic-bridge.ts` | `@sam-ai/core` | AnthropicAdapter |
| `lib/sam/agentic-bridge.ts` | `./stores` | All Prisma store factories |
| `lib/sam/orchestration-integration.ts` | `@sam-ai/agentic` | TutoringLoopController, etc. |
| `lib/sam/orchestration-integration.ts` | `./stores` | createPrismaGoalStore, createPrismaPlanStore |
| `lib/sam/proactive-intervention-integration.ts` | `@sam-ai/agentic` | BehaviorMonitor, CheckInScheduler |
| `lib/sam/proactive-intervention-integration.ts` | (none) | ⚠️ NO STORES INJECTED (in-memory!) |
| `lib/sam/agentic-tooling.ts` | `@sam-ai/agentic` | ToolRegistry, ToolExecutor |
| `lib/sam/agentic-tooling.ts` | `./stores` | createPrismaToolStore |
| `lib/sam/agentic-memory.ts` | `@sam-ai/agentic` | Memory components |
| `lib/sam/agentic-memory.ts` | `./stores` | Memory stores |
| `app/api/sam/unified/route.ts` | `./stores` | createPrismaGoalStore, etc. |
| `app/api/sam/agentic/goals/route.ts` | `../../stores` | createPrismaGoalStore |
| `app/api/sam/agentic/tools/route.ts` | `../../stores` | createPrismaToolStore |

#### 🟢 ADAPTER CONNECTIONS (Already Correct)

| Source File | Imports From | What It Imports |
|-------------|--------------|-----------------|
| `lib/sam/integration-profile.ts` | `@sam-ai/adapter-taxomind` | createTaxomindIntegrationProfile |
| `lib/sam/integration-profile.ts` | `@sam-ai/integration` | createCapabilityRegistry |
| `lib/sam/agentic-bridge.ts` | `@sam-ai/integration` | IntegrationProfile, CapabilityRegistry |
| `app/api/sam/unified/route.ts` | `@sam-ai/adapter-prisma` | createPrismaSAMAdapter |

#### ⚪ ADAPTER EXISTS BUT NOT USED

| Adapter Component | Location | Currently Used By |
|-------------------|----------|-------------------|
| `initializeTaxomindIntegration()` | `adapter-taxomind/src/index.ts` | Nothing |
| `bootstrapTaxomindIntegration()` | `adapter-taxomind/src/index.ts` | Nothing |
| `TaxomindIntegrationContext` | `adapter-taxomind/src/index.ts` | Nothing |
| `PrismaDatabaseAdapter` | `adapter-taxomind/src/adapters/` | Nothing (lib/sam has own) |
| `AnthropicAIAdapter` | `adapter-taxomind/src/adapters/` | Nothing (lib/sam creates own) |
| `NextAuthAdapter` | `adapter-taxomind/src/adapters/` | Nothing |
| `TaxomindVectorService` | `adapter-taxomind/src/adapters/` | Nothing |

---

## 4. Store Migration Map

### Stores to Move from `lib/sam/stores/` to `adapter-taxomind`

| Current Location | Target Location | Store Interface |
|------------------|-----------------|-----------------|
| `lib/sam/stores/prisma-goal-store.ts` | `adapter-taxomind/src/stores/goal-store.ts` | `GoalStore` |
| `lib/sam/stores/prisma-subgoal-store.ts` | `adapter-taxomind/src/stores/subgoal-store.ts` | `SubGoalStore` |
| `lib/sam/stores/prisma-plan-store.ts` | `adapter-taxomind/src/stores/plan-store.ts` | `PlanStore` |
| `lib/sam/stores/prisma-behavior-store.ts` | `adapter-taxomind/src/stores/behavior-store.ts` | `BehaviorEventStore` |
| `lib/sam/stores/prisma-pattern-store.ts` | `adapter-taxomind/src/stores/pattern-store.ts` | `PatternStore` |
| `lib/sam/stores/prisma-intervention-store.ts` | `adapter-taxomind/src/stores/intervention-store.ts` | `InterventionStore` |
| `lib/sam/stores/prisma-checkin-store.ts` | `adapter-taxomind/src/stores/checkin-store.ts` | `CheckInStore` |
| `lib/sam/stores/prisma-tool-store.ts` | `adapter-taxomind/src/stores/tool-store.ts` | `ToolStore` |
| `lib/sam/stores/prisma-analytics-stores.ts` | `adapter-taxomind/src/stores/analytics-stores.ts` | `AnalyticsStores` |
| `lib/sam/stores/prisma-memory-stores.ts` | `adapter-taxomind/src/stores/memory-stores.ts` | `MemoryStores` |
| `lib/sam/stores/prisma-learning-plan-store.ts` | `adapter-taxomind/src/stores/learning-plan-store.ts` | `LearningPlanStore` |
| `lib/sam/stores/prisma-tutoring-session-store.ts` | `adapter-taxomind/src/stores/tutoring-session-store.ts` | `TutoringSessionStore` |
| `lib/sam/stores/prisma-skill-store.ts` | `adapter-taxomind/src/stores/skill-store.ts` | `SkillStore` |
| `lib/sam/stores/prisma-learning-path-store.ts` | `adapter-taxomind/src/stores/learning-path-store.ts` | `LearningPathStore` |
| `lib/sam/stores/prisma-course-graph-store.ts` | `adapter-taxomind/src/stores/course-graph-store.ts` | `CourseGraphStore` |
| `lib/sam/stores/prisma-skill-build-track-store.ts` | `adapter-taxomind/src/stores/skill-build-track-store.ts` | `SkillBuildTrackStore` |

---

## 5. Implementation Phases

### Phase 1: Extend Adapter-Taxomind (Week 1)

**Goal:** Add all store interfaces and implementations to adapter-taxomind.

```
packages/adapter-taxomind/
├── src/
│   ├── index.ts                    ← Update exports
│   ├── profile/
│   │   └── taxomind-profile.ts     ← Already exists ✅
│   ├── adapters/
│   │   ├── prisma-database-adapter.ts  ← Already exists ✅
│   │   ├── anthropic-ai-adapter.ts     ← Already exists ✅
│   │   └── ...
│   └── stores/                     ← NEW DIRECTORY
│       ├── index.ts                ← Export all stores
│       ├── goal-store.ts           ← Move from lib/sam/stores/
│       ├── plan-store.ts           ← Move from lib/sam/stores/
│       ├── behavior-store.ts       ← Move from lib/sam/stores/
│       ├── intervention-store.ts   ← Move from lib/sam/stores/
│       ├── tool-store.ts           ← Move from lib/sam/stores/
│       ├── analytics-stores.ts     ← Move from lib/sam/stores/
│       └── memory-stores.ts        ← Move from lib/sam/stores/
```

**Tasks:**
1. Create `packages/adapter-taxomind/src/stores/` directory
2. Move each store file from `lib/sam/stores/` to adapter
3. Update imports in moved files (change `@/lib/db` to use passed Prisma client)
4. Export all stores from `packages/adapter-taxomind/src/stores/index.ts`
5. Update `packages/adapter-taxomind/src/index.ts` to export stores

### Phase 2: Update TaxomindIntegrationContext (Week 1)

**Goal:** Extend the context to include all agentic stores.

**File:** `packages/adapter-taxomind/src/index.ts`

```typescript
// UPDATED TaxomindIntegrationContext
export interface TaxomindIntegrationContext {
  profile: IntegrationProfile;
  registry: CapabilityRegistry;
  factory: AdapterFactory;
  adapters: {
    database: PrismaDatabaseAdapter;
    auth: NextAuthAdapter;
    ai: AnthropicAIAdapter;
    aiService: TaxomindAIService;
    vector: TaxomindVectorService;
  };
  // NEW: Agentic-specific stores
  stores: {
    goal: GoalStore;
    subGoal: SubGoalStore;
    plan: PlanStore;
    behavior: BehaviorEventStore;
    pattern: PatternStore;
    intervention: InterventionStore;
    checkIn: CheckInStore;
    tool: ToolStore;
    learningPlan: LearningPlanStore;
    tutoringSession: TutoringSessionStore;
    analytics: {
      session: LearningSessionStore;
      progress: TopicProgressStore;
      gap: LearningGapStore;
      skill: SkillAssessmentStore;
      recommendation: RecommendationStore;
      content: ContentStore;
    };
    memory: {
      vector: VectorAdapter;
      knowledgeGraph: KnowledgeGraphStore;
      sessionContext: SessionContextStore;
    };
  };
}
```

**Tasks:**
1. Update `TaxomindIntegrationContext` interface
2. Update `initializeTaxomindIntegration()` to create all stores
3. Update `bootstrapTaxomindIntegration()` to set singleton

### Phase 3: Create Singleton Bootstrap (Week 2)

**Goal:** Single initialization point for the entire application.

**File:** `lib/sam/taxomind-context.ts` (NEW - thin wrapper)

```typescript
/**
 * Taxomind Integration Context Singleton
 * Single entry point for all SAM Agentic capabilities
 */

import { db } from '@/lib/db';
import {
  bootstrapTaxomindIntegration,
  getTaxomindIntegration,
  type TaxomindIntegrationContext,
} from '@sam-ai/adapter-taxomind';

let initialized = false;

/**
 * Initialize the Taxomind integration context (call once at app startup)
 */
export function initializeTaxomindContext(): TaxomindIntegrationContext {
  if (initialized) {
    return getTaxomindIntegration();
  }

  const context = bootstrapTaxomindIntegration({
    prisma: db,
    isDevelopment: process.env.NODE_ENV === 'development',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
  });

  initialized = true;
  return context;
}

/**
 * Get the Taxomind integration context (must be initialized first)
 */
export function getTaxomindContext(): TaxomindIntegrationContext {
  if (!initialized) {
    return initializeTaxomindContext();
  }
  return getTaxomindIntegration();
}

// Re-export types for convenience
export type { TaxomindIntegrationContext };
```

### Phase 4: Update Agentic Bridge (Week 2)

**Goal:** Make `lib/sam/agentic-bridge.ts` use adapter instead of direct stores.

**Changes to `lib/sam/agentic-bridge.ts`:**

```typescript
// BEFORE (Direct imports):
import {
  createPrismaGoalStore,
  createPrismaPlanStore,
  // ... 15+ store imports
} from './stores';

// AFTER (Through adapter):
import { getTaxomindContext } from './taxomind-context';

// In constructor:
constructor(config: SAMAgenticBridgeConfig) {
  const context = getTaxomindContext();

  // Use stores from context instead of creating directly
  this.goalStore = context.stores.goal;
  this.planStore = context.stores.plan;
  this.behaviorStore = context.stores.behavior;
  // etc.

  // Use AI adapter from context
  this.aiAdapter = context.adapters.ai;
}
```

### Phase 5: Update Proactive Interventions (Week 2)

**Goal:** Fix the in-memory store problem in proactive interventions.

**File:** `lib/sam/proactive-intervention-integration.ts`

```typescript
// BEFORE (No stores - uses in-memory!):
behaviorMonitor = createBehaviorMonitor({
  logger: proactiveLogger,
  // NO STORES PASSED - defaults to in-memory!
});

// AFTER (Use Prisma stores from context):
import { getTaxomindContext } from './taxomind-context';

export function initializeProactiveInterventions(): ProactiveInterventionSubsystems {
  const context = getTaxomindContext();

  behaviorMonitor = createBehaviorMonitor({
    logger: proactiveLogger,
    eventStore: context.stores.behavior,
    patternStore: context.stores.pattern,
    interventionStore: context.stores.intervention,
  });

  checkInScheduler = createCheckInScheduler({
    logger: proactiveLogger,
    store: context.stores.checkIn,
  });

  planTracker = createMultiSessionPlanTracker({
    logger: proactiveLogger,
    store: context.stores.learningPlan,
  });
}
```

### Phase 6: Update API Routes (Week 3)

**Goal:** All API routes use context instead of direct store creation.

**Example: `app/api/sam/agentic/goals/route.ts`**

```typescript
// BEFORE:
import { createPrismaGoalStore } from '@/lib/sam/stores';
const goalStore = createPrismaGoalStore();

// AFTER:
import { getTaxomindContext } from '@/lib/sam/taxomind-context';
const context = getTaxomindContext();
const goalStore = context.stores.goal;
```

**Files to Update:**
- `app/api/sam/unified/route.ts`
- `app/api/sam/agentic/goals/route.ts`
- `app/api/sam/agentic/goals/[goalId]/route.ts`
- `app/api/sam/agentic/goals/[goalId]/decompose/route.ts`
- `app/api/sam/agentic/plans/route.ts`
- `app/api/sam/agentic/plans/[planId]/route.ts`
- `app/api/sam/agentic/tools/route.ts`
- `app/api/sam/agentic/tools/confirmations/route.ts`
- `app/api/sam/agentic/behavior/route.ts`
- `app/api/sam/agentic/checkins/route.ts`

### Phase 7: Deprecate and Remove lib/sam/stores (Week 3)

**Goal:** Remove duplicate store files.

**Tasks:**
1. Add deprecation comments to `lib/sam/stores/index.ts`
2. Search codebase for any remaining direct imports
3. Update all imports to use adapter
4. Delete `lib/sam/stores/` directory
5. Update `lib/sam/index.ts` if it exists

---

## 6. Detailed File Changes

### Files to CREATE

| File | Purpose |
|------|---------|
| `packages/adapter-taxomind/src/stores/index.ts` | Export all stores |
| `lib/sam/taxomind-context.ts` | Singleton context wrapper |

### Files to MOVE

| From | To |
|------|-----|
| `lib/sam/stores/prisma-goal-store.ts` | `packages/adapter-taxomind/src/stores/goal-store.ts` |
| `lib/sam/stores/prisma-subgoal-store.ts` | `packages/adapter-taxomind/src/stores/subgoal-store.ts` |
| `lib/sam/stores/prisma-plan-store.ts` | `packages/adapter-taxomind/src/stores/plan-store.ts` |
| `lib/sam/stores/prisma-behavior-store.ts` | `packages/adapter-taxomind/src/stores/behavior-store.ts` |
| `lib/sam/stores/prisma-pattern-store.ts` | `packages/adapter-taxomind/src/stores/pattern-store.ts` |
| `lib/sam/stores/prisma-intervention-store.ts` | `packages/adapter-taxomind/src/stores/intervention-store.ts` |
| `lib/sam/stores/prisma-checkin-store.ts` | `packages/adapter-taxomind/src/stores/checkin-store.ts` |
| `lib/sam/stores/prisma-tool-store.ts` | `packages/adapter-taxomind/src/stores/tool-store.ts` |
| `lib/sam/stores/prisma-analytics-stores.ts` | `packages/adapter-taxomind/src/stores/analytics-stores.ts` |
| `lib/sam/stores/prisma-memory-stores.ts` | `packages/adapter-taxomind/src/stores/memory-stores.ts` |
| `lib/sam/stores/prisma-learning-plan-store.ts` | `packages/adapter-taxomind/src/stores/learning-plan-store.ts` |
| `lib/sam/stores/prisma-tutoring-session-store.ts` | `packages/adapter-taxomind/src/stores/tutoring-session-store.ts` |
| `lib/sam/stores/prisma-skill-store.ts` | `packages/adapter-taxomind/src/stores/skill-store.ts` |
| `lib/sam/stores/prisma-learning-path-store.ts` | `packages/adapter-taxomind/src/stores/learning-path-store.ts` |
| `lib/sam/stores/prisma-course-graph-store.ts` | `packages/adapter-taxomind/src/stores/course-graph-store.ts` |
| `lib/sam/stores/prisma-skill-build-track-store.ts` | `packages/adapter-taxomind/src/stores/skill-build-track-store.ts` |

### Files to MODIFY

| File | Changes |
|------|---------|
| `packages/adapter-taxomind/src/index.ts` | Add stores to context, update exports |
| `lib/sam/agentic-bridge.ts` | Use context instead of direct stores |
| `lib/sam/proactive-intervention-integration.ts` | Inject Prisma stores |
| `lib/sam/orchestration-integration.ts` | Use context |
| `lib/sam/agentic-tooling.ts` | Use context |
| `lib/sam/agentic-memory.ts` | Use context |
| `app/api/sam/unified/route.ts` | Use context |
| `app/api/sam/agentic/goals/route.ts` | Use context |
| `app/api/sam/agentic/plans/*.ts` | Use context |
| `app/api/sam/agentic/tools/*.ts` | Use context |

### Files to DELETE (After Migration)

| File | Reason |
|------|--------|
| `lib/sam/stores/index.ts` | Moved to adapter |
| `lib/sam/stores/prisma-goal-store.ts` | Moved to adapter |
| `lib/sam/stores/prisma-subgoal-store.ts` | Moved to adapter |
| `lib/sam/stores/prisma-plan-store.ts` | Moved to adapter |
| `lib/sam/stores/prisma-behavior-store.ts` | Moved to adapter |
| `lib/sam/stores/prisma-pattern-store.ts` | Moved to adapter |
| `lib/sam/stores/prisma-intervention-store.ts` | Moved to adapter |
| `lib/sam/stores/prisma-checkin-store.ts` | Moved to adapter |
| `lib/sam/stores/prisma-tool-store.ts` | Moved to adapter |
| `lib/sam/stores/prisma-analytics-stores.ts` | Moved to adapter |
| `lib/sam/stores/prisma-memory-stores.ts` | Moved to adapter |
| All other `lib/sam/stores/*.ts` files | Moved to adapter |

---

## 7. Testing Strategy

### Unit Tests

```bash
# Test adapter-taxomind stores
cd packages/adapter-taxomind
npm test

# Test that stores are properly exported
npm run test -- --grep "store exports"
```

### Integration Tests

```bash
# Test full flow through adapter
npm run test:integration

# Verify no direct imports remain
grep -r "from './stores'" lib/sam/ --include="*.ts"
grep -r "from '../stores'" app/api/sam/ --include="*.ts"
```

### Manual Testing Checklist

- [ ] Create a goal via API → Verify saved to database
- [ ] Decompose goal → Verify sub-goals created
- [ ] Track behavior event → Verify persisted (not lost on restart)
- [ ] Trigger intervention → Verify persisted
- [ ] Execute tool → Verify audit log created
- [ ] Check proactive features after server restart → Data should persist

---

## 8. Rollback Plan

### If Issues Arise

1. **Keep `lib/sam/stores/` as backup** during migration
2. **Feature flag** the new context:
   ```typescript
   const USE_ADAPTER_CONTEXT = process.env.USE_ADAPTER_CONTEXT === 'true';

   if (USE_ADAPTER_CONTEXT) {
     // New: use adapter
     const context = getTaxomindContext();
     goalStore = context.stores.goal;
   } else {
     // Old: direct creation
     goalStore = createPrismaGoalStore();
   }
   ```
3. **Gradual rollout**: Enable for one API route at a time
4. **Monitor**: Check for errors in logs after each change

### Rollback Commands

```bash
# If needed, revert store deletion
git checkout HEAD~1 -- lib/sam/stores/

# Revert adapter changes
git checkout HEAD~1 -- packages/adapter-taxomind/

# Revert bridge changes
git checkout HEAD~1 -- lib/sam/agentic-bridge.ts
```

---

## Summary

### Before (Current State)

```
20+ store files in lib/sam/stores/
Direct imports from packages/agentic
Inconsistent storage (some in-memory)
adapter-taxomind exists but unused
```

### After (Target State)

```
0 store files in lib/sam/stores/ (deleted)
All imports through adapter-taxomind
Consistent Prisma storage everywhere
Single TaxomindIntegrationContext entry point
```

### Key Benefits

1. **Single Source of Truth** - All stores in one place
2. **Consistent Storage** - Everything uses Prisma
3. **True Portability** - Adapter can be swapped for other platforms
4. **Easier Maintenance** - Changes in one location
5. **Better Testing** - Mock the context, not 20+ stores

---

## Appendix: Quick Reference Commands

```bash
# Build adapter after changes
cd packages/adapter-taxomind && npm run build

# Check for remaining direct imports
grep -r "lib/sam/stores" . --include="*.ts" | grep -v node_modules

# Verify exports
node -e "const a = require('@sam-ai/adapter-taxomind'); console.log(Object.keys(a))"

# Run type check
npx tsc --noEmit
```

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Author:** Claude Code Assistant
