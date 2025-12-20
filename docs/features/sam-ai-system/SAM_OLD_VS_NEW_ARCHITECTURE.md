# SAM AI System: Old vs New Architecture

**Version**: 1.0.0
**Created**: December 2024
**Purpose**: Document the transition from legacy fragmented SAM system to the new unified architecture

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Comparison](#2-architecture-comparison)
3. [File Structure Mapping](#3-file-structure-mapping)
4. [Provider System Comparison](#4-provider-system-comparison)
5. [Engine System Comparison](#5-engine-system-comparison)
6. [API Routes Comparison](#6-api-routes-comparison)
7. [Component Comparison](#7-component-comparison)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Migration Path](#9-migration-path)
10. [Deprecation Plan](#10-deprecation-plan)

---

## 1. Executive Summary

### The Problem with the Old System

| Issue | Impact | Status |
|-------|--------|--------|
| **5 nested providers** | Complex state management, prop drilling | ❌ Legacy |
| **7 fragmented engines** | No orchestration, parallel API calls hitting rate limits | ❌ Legacy |
| **80+ API routes** | Maintenance nightmare, inconsistent patterns | ❌ Legacy |
| **Multiple state sources** | localStorage + Context + API sync conflicts | ❌ Legacy |
| **Scattered types** | Runtime errors, `any` types everywhere | ❌ Legacy |

### The New Unified Solution

| Improvement | Implementation | Status |
|-------------|----------------|--------|
| **1 unified provider** | `SAMProvider` with single state machine | ✅ Active |
| **6 dependency-aware engines** | `SAMAgentOrchestrator` with topological sort | ✅ Active |
| **3 API routes** | `/api/sam/unified`, `/api/sam/unified/stream` | ✅ Active |
| **Single state source** | Unified `SAMContext` | ✅ Active |
| **100% typed** | `@sam-ai/core` package with strict types | ✅ Active |

---

## 2. Architecture Comparison

### OLD Architecture (Legacy)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LEGACY SYSTEM                                │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Layer 1: SAMGlobalProvider                                      ││
│  │   - components/sam/sam-global-provider.tsx                      ││
│  │   - State: isOpen, learningContext, tutorMode, features         ││
│  │   - Hook: useSAMGlobal()                                        ││
│  │  ┌─────────────────────────────────────────────────────────────┐││
│  │  │ Layer 2: ComprehensiveSAMProvider (OLD)                     │││
│  │  │   - old-components/teacher-sam-components/                  │││
│  │  │  ┌─────────────────────────────────────────────────────────┐│││
│  │  │  │ Layer 3: SamAITutorProvider (OLD)                       ││││
│  │  │  │   - old-components/teacher-sam-components/              ││││
│  │  │  │   - Duplicate learningContext!                          ││││
│  │  │  │  ┌─────────────────────────────────────────────────────┐││││
│  │  │  │  │ Layer 4: GlobalSamProvider                          │││││
│  │  │  │  │   - app/(protected)/teacher/_components/            │││││
│  │  │  │  │  ┌─────────────────────────────────────────────────┐│││││
│  │  │  │  │  │ Layer 5: Page Context Injectors                 ││││││
│  │  │  │  │  │   - TeacherPageContextInjector                  ││││││
│  │  │  │  │  │   - CoursePageContextInjector                   ││││││
│  │  │  │  │  └─────────────────────────────────────────────────┘│││││
│  │  │  │  └─────────────────────────────────────────────────────┘││││
│  │  │  └─────────────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  PROBLEMS:                                                          │
│  ❌ 5 layers of nesting                                             │
│  ❌ Duplicate state (learningContext in 2 places)                   │
│  ❌ Hook composition required to merge contexts                     │
│  ❌ Hard to understand data flow                                    │
│  ❌ Performance overhead from re-renders                            │
└─────────────────────────────────────────────────────────────────────┘
```

### NEW Architecture (Unified)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NEW UNIFIED SYSTEM                           │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ SAMAssistant Component                                          ││
│  │   - components/sam/SAMAssistant.tsx                             ││
│  │   - Self-contained with all features                            ││
│  │   - Props: enableStreaming, enableGamification                  ││
│  │                                                                  ││
│  │   ┌──────────────────────────────────────────────────────────┐  ││
│  │   │ Internal State (useState)                                │  ││
│  │   │ - messages, isProcessing, suggestions, actions           │  ││
│  │   │ - detectedForms, formSuggestions                         │  ││
│  │   │ - gamificationEngine, userProgress, xpNotifications      │  ││
│  │   └──────────────────────────────────────────────────────────┘  ││
│  │                                                                  ││
│  │   ┌──────────────────────────────────────────────────────────┐  ││
│  │   │ Auto Page Context Detection (useMemo)                    │  ││
│  │   │ - Detects pageType from pathname                         │  ││
│  │   │ - Extracts entityId, parentEntityId, grandParentEntityId │  ││
│  │   │ - Builds capabilities and breadcrumbs                    │  ││
│  │   └──────────────────────────────────────────────────────────┘  ││
│  │                                                                  ││
│  │   ┌──────────────────────────────────────────────────────────┐  ││
│  │   │ Integration with lib/sam/* utilities                     │  ││
│  │   │ - form-actions.ts: detectFormFields, executeFormFill     │  ││
│  │   │ - gamification.ts: GamificationEngine, XP tracking       │  ││
│  │   │ - engine-presets.ts: selectEngines based on intent       │  ││
│  │   └──────────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ API: /api/sam/unified & /api/sam/unified/stream                 ││
│  │   - Uses @sam-ai/core package                                   ││
│  │   - SAMAgentOrchestrator with dependency graph                  ││
│  │   - All 6 engines registered and managed                        ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ @sam-ai/core Package (packages/core/src/)                       ││
│  │   - SAMAgentOrchestrator: Dependency-aware engine orchestration ││
│  │   - SAMStateMachine: State management (idle/processing/error)   ││
│  │   - 6 Engines: context, blooms, content, personalization,       ││
│  │                assessment, response                              ││
│  │   - Adapters: Anthropic, MemoryCache                            ││
│  │   - Full TypeScript types                                       ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  BENEFITS:                                                          │
│  ✅ Single self-contained component                                 │
│  ✅ No provider nesting required                                    │
│  ✅ Unified state in component                                      │
│  ✅ Clear data flow                                                 │
│  ✅ Full TypeScript support                                         │
│  ✅ Streaming & gamification built-in                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. File Structure Mapping

### OLD Files (To Be Deprecated)

```
📁 old-components/
├── 📁 sam-ai-tutor-legacy/
│   ├── 📁 components/
│   │   ├── global/
│   │   │   └── sam-global-provider.tsx         → DEPRECATED
│   │   ├── contextual/
│   │   │   ├── sam-contextual-chat.tsx        → DEPRECATED
│   │   │   └── sam-context-manager.tsx        → DEPRECATED
│   │   └── course-creation/
│   │       └── sam-contextual-panel.tsx       → DEPRECATED
│   │
│   └── 📁 engines/
│       ├── core/
│       │   ├── sam-engine-integration.ts      → Replaced by SAMAgentOrchestrator
│       │   ├── sam-base-engine.ts             → Replaced by BaseEngine
│       │   └── sam-master-integration.ts      → DEPRECATED
│       ├── advanced/
│       │   ├── sam-trends-engine.ts           → Optional plugin (not migrated)
│       │   ├── sam-news-engine.ts             → Optional plugin (not migrated)
│       │   ├── sam-research-engine.ts         → Optional plugin (not migrated)
│       │   └── sam-innovation-engine.ts       → DEPRECATED
│       ├── business/
│       │   ├── sam-market-engine.ts           → Removed (business-specific)
│       │   ├── sam-enterprise-engine.ts       → DEPRECATED
│       │   └── sam-financial-engine.ts        → DEPRECATED
│       ├── content/
│       │   ├── sam-generation-engine.ts       → Replaced by ContentEngine
│       │   ├── sam-multimedia-engine.ts       → DEPRECATED
│       │   └── sam-resource-engine.ts         → DEPRECATED
│       └── educational/
│           ├── sam-blooms-engine.ts           → Replaced by BloomsEngine
│           ├── sam-exam-engine.ts             → Replaced by AssessmentEngine
│           ├── sam-course-guide-engine.ts     → Replaced by ContentEngine
│           ├── sam-personalization-engine.ts  → Replaced by PersonalizationEngine
│           └── sam-achievement-engine.ts      → Replaced by lib/sam/gamification.ts
│
├── 📁 teacher-sam-components/
│   ├── comprehensive-sam-provider.tsx         → DEPRECATED
│   ├── sam-ai-tutor-provider.tsx              → DEPRECATED
│   └── use-page-sam-context.tsx               → DEPRECATED
│
└── sam-assistant-panel.backup.tsx             → DEPRECATED

📁 app/(protected)/teacher/_components/
├── global-sam-provider.tsx                    → DEPRECATED
└── use-sam-page-context.tsx                   → DEPRECATED
```

### NEW Files (Active)

```
📁 packages/core/src/                          # @sam-ai/core package
├── index.ts                                   # Main exports
├── orchestrator.ts                            # SAMAgentOrchestrator
├── state-machine.ts                           # SAMStateMachine
├── errors.ts                                  # SAMError classes
├── 📁 types/
│   ├── context.ts                             # SAMContext, SAMPageType, etc.
│   ├── engine.ts                              # EngineResult, OrchestrationResult
│   ├── config.ts                              # SAMConfig, AIAdapter, etc.
│   └── index.ts
├── 📁 engines/
│   ├── base.ts                                # BaseEngine class
│   ├── context.ts                             # ContextEngine
│   ├── blooms.ts                              # BloomsEngine
│   ├── content.ts                             # ContentEngine
│   ├── personalization.ts                     # PersonalizationEngine
│   ├── assessment.ts                          # AssessmentEngine
│   ├── response.ts                            # ResponseEngine
│   └── index.ts
└── 📁 adapters/
    ├── anthropic.ts                           # AnthropicAdapter
    ├── memory-cache.ts                        # MemoryCacheAdapter
    └── index.ts

📁 lib/sam/                                    # SAM utilities for frontend
├── index.ts                                   # Central exports
├── engine-presets.ts                          # Engine selection by intent
├── form-actions.ts                            # Form detection & population
├── gamification.ts                            # XP, levels, achievements
├── 📁 config/
│   └── sam-rate-limiter.ts
├── 📁 utils/
│   ├── sam-context.ts
│   ├── sam-database.ts
│   └── sam-achievements.ts
├── 📁 hooks/
│   ├── use-sam-cache.ts
│   └── use-sam-debounce.ts
└── 📁 types/
    └── sam-validators.ts

📁 components/sam/                             # SAM UI components
├── SAMAssistant.tsx                          # Main unified component ⭐
├── sam-global-provider.tsx                    # Legacy (still used for shouldShow)
├── form-sync-wrapper.tsx                      # Form synchronization
├── sam-analytics-dashboard.tsx
├── sam-engine-powered-chat.tsx
└── 📁 student-dashboard/
    ├── index.tsx
    ├── blooms-progress-chart.tsx
    └── learning-path-visualization.tsx

📁 app/api/sam/                                # API routes
├── unified/
│   ├── route.ts                               # Main unified endpoint ⭐
│   └── stream/
│       └── route.ts                           # Streaming endpoint ⭐
└── [80+ legacy routes]                        # To be deprecated
```

---

## 4. Provider System Comparison

### OLD: 5 Nested Providers

```tsx
// LEGACY - DON'T USE
<SAMGlobalProvider>                    // Layer 1: Global state
  <ComprehensiveSAMProvider>           // Layer 2: Comprehensive features
    <SamAITutorProvider>               // Layer 3: Tutor-specific (DUPLICATE STATE!)
      <GlobalSamProvider>              // Layer 4: Teacher routes
        <TeacherPageContextInjector>   // Layer 5: Page-specific
          <YourApp />
        </TeacherPageContextInjector>
      </GlobalSamProvider>
    </SamAITutorProvider>
  </ComprehensiveSAMProvider>
</SAMGlobalProvider>

// Usage required merging hooks:
const globalContext = useSAMGlobal();
const tutorContext = useSamAITutor();
const merged = { ...globalContext, ...tutorContext }; // Manual merge!
```

### NEW: Self-Contained Component

```tsx
// NEW - USE THIS
import { SAMAssistant } from '@/components/sam/SAMAssistant';

function Layout({ children }) {
  return (
    <>
      {children}
      <SAMAssistant
        enableStreaming={true}
        enableGamification={true}
      />
    </>
  );
}

// No hook merging needed - component is self-contained
// Context detection is automatic from URL
```

### Provider Interface Comparison

| OLD Interface | NEW Interface | Notes |
|---------------|---------------|-------|
| `useSAMGlobal()` | N/A | Self-contained |
| `useSamAITutor()` | N/A | Self-contained |
| `useGlobalSam()` | N/A | Self-contained |
| `learningContext` | Auto-detected from URL | `pageContext` in component |
| `tutorMode` | Auto-detected | Based on pathname |
| `features[]` | Quick actions | Page-specific |
| `updateContext()` | N/A | Not needed |
| `toggleSAM()` | `setIsOpen()` | Internal state |

---

## 5. Engine System Comparison

### OLD: 7 Fragmented Engines (No Dependency Graph)

```typescript
// old-components/sam-ai-tutor-legacy/engines/core/sam-engine-integration.ts

class SAMEngineIntegration {
  // All engines run in parallel - NO DEPENDENCY AWARENESS!
  async performIntegratedAnalysis() {
    const [
      marketAnalysis,      // MarketAnalysisEngine
      bloomsAnalysis,      // BloomsAnalysisEngine
      courseGuide,         // CourseGuideEngine
      trendsAnalysis,      // SAMTrendsEngine
      newsDigest,          // SAMNewsEngine
      researchPapers,      // SAMResearchEngine
      // ... examEngine
    ] = await Promise.all([
      this.marketEngine.analyze(),
      this.bloomsEngine.analyze(),
      // ALL RUN IN PARALLEL - Can hit API rate limits!
      // CourseGuide needs Blooms result but doesn't wait for it!
    ]);
  }
}

// PROBLEMS:
// ❌ No dependency graph - CourseGuide needs Blooms but runs parallel
// ❌ All API calls at once - rate limit issues
// ❌ Each engine has separate cache logic
// ❌ Inconsistent error handling
// ❌ No circuit breaker
```

### NEW: 6 Dependency-Aware Engines (Topological Sort)

```typescript
// packages/core/src/orchestrator.ts

class SAMAgentOrchestrator {
  async orchestrate(context, query, options) {
    // Engines are grouped into execution tiers based on dependencies
    // Tier 1: [context]                    - No dependencies
    // Tier 2: [blooms, content, personalization] - Depend on context (parallel)
    // Tier 3: [assessment]                 - Depends on blooms + personalization
    // Tier 4: [response]                   - Depends on all

    for (const tier of this.executionTiers) {
      if (tier.parallel) {
        // Run engines in same tier in parallel
        await Promise.all(tier.engines.map(e => this.executeEngine(e)));
      } else {
        // Run sequentially
        for (const engine of tier.engines) {
          await this.executeEngine(engine);
        }
      }
    }
  }

  // Topological sort calculates execution order
  private recalculateExecutionTiers() {
    // Uses DAG to determine which engines can run in parallel
    // and which must wait for dependencies
  }
}

// BENEFITS:
// ✅ Dependency-aware execution order
// ✅ Parallel execution where safe
// ✅ Shared cache adapter
// ✅ Consistent error handling
// ✅ Graceful degradation
```

### Engine Mapping

| OLD Engine | NEW Engine | Location |
|------------|------------|----------|
| `MarketAnalysisEngine` | ❌ Removed | Business-specific, not core |
| `BloomsAnalysisEngine` | `BloomsEngine` | `packages/core/src/engines/blooms.ts` |
| `AdvancedExamEngine` | `AssessmentEngine` | `packages/core/src/engines/assessment.ts` |
| `CourseGuideEngine` | `ContentEngine` | `packages/core/src/engines/content.ts` |
| `SAMTrendsEngine` | ❌ Not migrated | Optional plugin |
| `SAMNewsEngine` | ❌ Not migrated | Optional plugin |
| `SAMResearchEngine` | ❌ Not migrated | Optional plugin |
| `SAMPersonalizationEngine` | `PersonalizationEngine` | `packages/core/src/engines/personalization.ts` |
| ❌ N/A | `ContextEngine` | NEW - Query analysis |
| ❌ N/A | `ResponseEngine` | NEW - Response generation |

### Engine Dependency Graph

```
                     ┌───────────────────┐
                     │   ContextEngine   │
                     │  (always first)   │
                     │   dependencies: []│
                     └─────────┬─────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌────────────────────┐
│  BloomsEngine   │  │  ContentEngine  │  │PersonalizationEngine│
│ deps: [context] │  │ deps: [context] │  │  deps: [context]   │
└────────┬────────┘  └────────┬────────┘  └─────────┬──────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              ▼
                  ┌───────────────────────┐
                  │   AssessmentEngine    │
                  │ deps: [blooms,        │
                  │        personalization]│
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │    ResponseEngine     │
                  │  deps: [context,      │
                  │         blooms,       │
                  │         content,      │
                  │         personalization│
                  │         assessment]   │
                  └───────────────────────┘

EXECUTION ORDER:
Tier 1: [context]                              ─ Sequential
Tier 2: [blooms, content, personalization]     ─ Parallel
Tier 3: [assessment]                           ─ Sequential
Tier 4: [response]                             ─ Sequential
```

---

## 6. API Routes Comparison

### OLD: 80+ Scattered Routes

```
/api/sam/chat                         → Conversation
/api/sam/conversation                 → Also conversation?
/api/sam/unified-assistant            → Unified?
/api/sam/context-aware-assistant      → Context-aware?

/api/sam/points                       → Gamification
/api/sam/badges                       → Gamification
/api/sam/streaks                      → Gamification
/api/sam/stats                        → Gamification
/api/sam/gamification/*               → More gamification

/api/sam/blooms-analysis              → Analysis
/api/sam/blooms-analysis/student      → Different?
/api/sam/blooms-recommendations       → Could be query param

/api/sam/exam-engine/*                → 4 routes
/api/sam/course-guide/*               → 3 routes
/api/sam/ai-tutor/*                   → 15+ routes

... 60+ more routes

TOTAL: 80+ routes, 25,000+ lines of code
```

### NEW: 2 Primary Routes

```
/api/sam/unified                      → Main chat endpoint
/api/sam/unified/stream               → SSE streaming endpoint

TOTAL: 2 routes, ~800 lines of code
```

### Request/Response Comparison

**OLD Request** (Inconsistent):
```typescript
// Different routes had different request formats
POST /api/sam/chat
{ message: "...", context: {...}, mode: "..." }

POST /api/sam/blooms-analysis
{ courseId: "...", content: "...", options: {...} }

POST /api/sam/ai-tutor/chat
{ query: "...", learningContext: {...}, tutorMode: "..." }
```

**NEW Request** (Standardized):
```typescript
// All requests use same format
POST /api/sam/unified
{
  message: string;
  pageContext: {
    type: SAMPageType;
    path: string;
    entityId?: string;
    parentEntityId?: string;
    capabilities?: string[];
    breadcrumb?: string[];
  };
  formContext?: {
    formId?: string;
    formName?: string;
    fields?: Record<string, FormFieldInfo>;
    isDirty?: boolean;
  };
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  options?: {
    engines?: string[];
    stream?: boolean;
  };
}
```

**NEW Response** (Standardized):
```typescript
{
  success: boolean;
  response: string;
  suggestions: SAMSuggestion[];
  actions: SAMAction[];
  insights: {
    blooms?: BloomsInsight;
    content?: ContentInsight;
    personalization?: PersonalizationInsight;
    context?: ContextInsight;
  };
  metadata: {
    enginesRun: string[];
    enginesFailed: string[];
    enginesCached: string[];
    totalTime: number;
    requestTime: number;
  };
}
```

---

## 7. Component Comparison

### OLD: Multiple Chat Components

```
old-components/
├── sam-ai-tutor-legacy/
│   └── components/
│       ├── contextual/
│       │   ├── sam-contextual-chat.tsx      → Page-aware chat
│       │   └── sam-context-manager.tsx      → Context management
│       └── course-creation/
│           └── sam-contextual-panel.tsx     → Course creation panel
│
└── sam-assistant-panel.backup.tsx           → Backup of old panel

PROBLEMS:
❌ Multiple chat implementations
❌ Different features in each
❌ Inconsistent UI/UX
❌ Hard to maintain
```

### NEW: Single Unified Component

```
components/sam/
└── SAMAssistant.tsx                         → Single unified component

FEATURES:
✅ Streaming support (enableStreaming prop)
✅ Form detection & AI fill suggestions
✅ Gamification (XP, levels, streaks)
✅ Bloom's taxonomy visualization
✅ Engine info display
✅ Quick actions based on page
✅ Error handling with dismiss
✅ Responsive design
```

### Component Feature Matrix

| Feature | OLD Components | NEW SAMAssistant |
|---------|---------------|------------------|
| Basic Chat | ✅ Multiple | ✅ Single |
| Streaming | ❌ | ✅ |
| Form Detection | ❌ | ✅ |
| Form Fill Suggestions | ❌ | ✅ |
| Gamification XP | ❌ | ✅ |
| Level Display | ❌ | ✅ |
| Streak Tracking | ❌ | ✅ |
| Bloom's Visualization | ❌ | ✅ |
| Engine Info | ❌ | ✅ |
| Quick Actions | Partial | ✅ |
| Auto Context | Partial | ✅ Full |
| Minimize/Maximize | ❌ | ✅ |
| Dark Mode | ❌ | ✅ |

---

## 8. Data Flow Diagrams

### OLD Data Flow (Complex)

```
User Input
    │
    ▼
┌─────────────────┐
│ SAMGlobalProvider│
│ learningContext  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ ComprehensiveSAMProvider │
│ (adds more context)      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ SamAITutorProvider      │
│ learningContext (DUPE!) │◄────── Conflict!
│ tutorPersonality        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ GlobalSamProvider       │
│ (teacher routes only)   │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Page Context Injector   │
│ (page-specific data)    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Chat Component          │
│ - useSAMGlobal()        │
│ - useSamAITutor()       │
│ - Manual merge!         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Multiple API endpoints  │
│ /api/sam/chat           │
│ /api/sam/unified-asst   │
│ /api/sam/context-aware  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ SAMEngineIntegration    │
│ Promise.all() - NO DEPS!│
└─────────────────────────┘
```

### NEW Data Flow (Simple)

```
User Input
    │
    ▼
┌─────────────────────────────────────────────┐
│ SAMAssistant Component                      │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Auto Context Detection (useMemo)        │ │
│ │ - pathname → pageType                   │ │
│ │ - URL regex → entityIds                 │ │
│ │ - pageType → capabilities               │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Form Detection (useEffect)              │ │
│ │ - detectFormFields()                    │ │
│ │ - generateFormSuggestions()             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Gamification (useEffect)                │ │
│ │ - GamificationEngine                    │ │
│ │ - XP tracking, levels, streaks          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ sendStreamingMessage() / sendMessage()  │ │
│ │ - Builds request from state             │ │
│ │ - Calls unified API                     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│ /api/sam/unified or /api/sam/unified/stream │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ SAMAgentOrchestrator                    │ │
│ │                                         │ │
│ │ Tier 1: [context]                       │ │
│ │           ↓                             │ │
│ │ Tier 2: [blooms, content, personalize]  │ │
│ │           ↓                             │ │
│ │ Tier 3: [assessment]                    │ │
│ │           ↓                             │ │
│ │ Tier 4: [response]                      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 9. Migration Path

### Current State

The new system is **already operational** alongside the old system:

| System | Status | Usage |
|--------|--------|-------|
| NEW SAMAssistant | ✅ Active | Use for all new development |
| NEW /api/sam/unified | ✅ Active | Primary API endpoint |
| NEW packages/core | ✅ Active | Engine orchestration |
| OLD Providers | ⚠️ Legacy | Still used for `shouldShow` check |
| OLD Engines | ❌ Deprecated | Not actively used |
| OLD API Routes | ⚠️ Legacy | May still be called by old code |

### Migration Steps

#### Step 1: Use New Component (✅ Complete)
```tsx
// In layout or page
import { SAMAssistant } from '@/components/sam/SAMAssistant';

<SAMAssistant enableStreaming enableGamification />
```

#### Step 2: Remove Old Provider Nesting (In Progress)
```tsx
// BEFORE - DON'T DO THIS
<SAMGlobalProvider>
  <ComprehensiveSAMProvider>
    <SamAITutorProvider>
      ...
    </SamAITutorProvider>
  </ComprehensiveSAMProvider>
</SAMGlobalProvider>

// AFTER - DO THIS
// Just use SAMAssistant component directly, no providers needed
<SAMAssistant />
```

#### Step 3: Update API Calls (In Progress)
```tsx
// BEFORE - OLD ENDPOINTS
fetch('/api/sam/chat', { ... })
fetch('/api/sam/unified-assistant', { ... })
fetch('/api/sam/context-aware-assistant', { ... })

// AFTER - NEW ENDPOINT
fetch('/api/sam/unified', {
  method: 'POST',
  body: JSON.stringify({
    message,
    pageContext,
    formContext,
    conversationHistory,
  })
})
```

#### Step 4: Move Old Files to Deprecated (Next)
See deprecation plan below.

---

## 10. Deprecation Plan

### Phase 1: Create Deprecated Folder Structure

```bash
mkdir -p deprecated/sam-legacy
```

### Phase 2: Move Old Files

```bash
# Move old components
mv old-components/sam-ai-tutor-legacy deprecated/sam-legacy/
mv old-components/teacher-sam-components deprecated/sam-legacy/

# Move old provider files
mv app/(protected)/teacher/_components/global-sam-provider.tsx deprecated/sam-legacy/
mv app/(protected)/teacher/_components/use-sam-page-context.tsx deprecated/sam-legacy/
```

### Phase 3: Legacy API Routes

These routes should be reviewed and either:
- Deleted if not used
- Migrated to use /api/sam/unified internally
- Marked as deprecated with warning logs

```
/api/sam/chat                         → Check if used, migrate or delete
/api/sam/unified-assistant            → Migrate to /api/sam/unified
/api/sam/context-aware-assistant      → Migrate to /api/sam/unified
/api/sam/blooms-analysis              → May still be needed standalone
/api/sam/exam-engine/*                → Review usage
/api/sam/ai-tutor/*                   → Review usage
/api/sam/gamification/*               → Now handled in component
```

### Phase 4: Keep Active

These files should remain active:

```
✅ packages/core/                      # New core package
✅ lib/sam/                            # Frontend utilities
✅ components/sam/SAMAssistant.tsx     # Main component
✅ app/api/sam/unified/                # New API routes
✅ components/sam/sam-global-provider.tsx  # Only for shouldShow logic
```

### Timeline

| Phase | Action | Status |
|-------|--------|--------|
| 1 | New system operational | ✅ Complete |
| 2 | Documentation created | ✅ Complete |
| 3 | Move old files to deprecated | 📋 Pending |
| 4 | Update imports across codebase | 📋 Pending |
| 5 | Remove deprecated folder | 📋 Future |

---

## Quick Reference

### What to Use

| Task | Use This | Don't Use |
|------|----------|-----------|
| Add SAM to page | `<SAMAssistant />` | Old providers |
| API calls | `/api/sam/unified` | `/api/sam/chat`, etc |
| Engine logic | `packages/core` | `old-components/engines` |
| Form detection | `lib/sam/form-actions` | Manual detection |
| Gamification | `lib/sam/gamification` | `/api/sam/gamification/*` |
| Page context | Auto-detected | `useSAMGlobal()` |

### Import Paths

```typescript
// NEW - USE THESE
import { SAMAssistant } from '@/components/sam/SAMAssistant';
import { detectFormFields, executeFormFill } from '@/lib/sam/form-actions';
import { GamificationEngine } from '@/lib/sam/gamification';
import { selectEngines, ENGINE_PRESETS } from '@/lib/sam/engine-presets';

// OLD - DON'T USE
import { useSAMGlobal } from '@/components/sam/sam-global-provider';
import { useSamAITutor } from '@/old-components/teacher-sam-components/sam-ai-tutor-provider';
import { SAMEngineIntegration } from '@/old-components/sam-ai-tutor-legacy/engines/core/sam-engine-integration';
```

---

**Document Created**: December 2024
**Last Updated**: December 2024
**Author**: AI Assistant
**Status**: Active - Reference Document
