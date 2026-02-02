# Large Files Module Guide

> **Purpose**: When adding new features to these files, create a **separate module** and import it. Do NOT add more code directly to these files.

---

## How to Use This Guide

1. Find the file you need to modify below
2. Follow the module pattern described
3. Create your new feature as a separate file
4. Import it into the original file

---

## Critical Files (2000+ lines)

### 1. `components/sam/SAMAssistant.tsx` (4,233 lines)

**What it does**: Main SAM AI assistant component — chat, tools, tutoring, suggestions, input handling.

**Current state**: 44 useState hooks, 8+ mixed responsibilities.

**When adding new features, create modules in**:
```
components/sam/modules/
  ├── hooks/          # Custom hooks (useChat, useTutoring, useTools, etc.)
  ├── messages/       # Message rendering components
  ├── tools/          # Tool panel components
  ├── suggestions/    # Suggestion components
  └── input/          # Input area components
```

**Pattern**:
```typescript
// ✅ CORRECT — New file: components/sam/modules/hooks/useNewFeature.ts
export function useNewFeature() {
  const [state, setState] = useState(...);
  // feature logic here
  return { state, actions };
}

// In SAMAssistant.tsx — just import and use
import { useNewFeature } from './modules/hooks/useNewFeature';
```

---

### 2. `app/api/course-depth-analysis/route.ts` (2,812 lines)

**What it does**: Course depth analysis API — data fetching, AI prompt generation, response parsing, structure building.

**When adding new features, create modules in**:
```
app/api/course-depth-analysis/
  ├── route.ts              # Keep thin — orchestration only
  ├── services/             # Business logic
  │   ├── data-fetcher.ts
  │   └── ai-orchestrator.ts
  ├── parsers/              # Response parsing
  ├── builders/             # Structure building
  └── types.ts              # Shared types
```

**Pattern**:
```typescript
// ✅ CORRECT — New file: app/api/course-depth-analysis/services/new-analysis.ts
export async function runNewAnalysis(courseId: string) { ... }

// In route.ts — import and call
import { runNewAnalysis } from './services/new-analysis';
```

---

### 3. `lib/microlearning/types.ts` (2,621 lines)

**What it does**: Type definitions for the entire microlearning domain — content, segments, assessments, analytics, etc.

**When adding new types, create domain-specific type files**:
```
lib/microlearning/types/
  ├── index.ts              # Re-exports everything (barrel)
  ├── content.types.ts
  ├── segment.types.ts
  ├── assessment.types.ts
  ├── analytics.types.ts
  └── new-domain.types.ts   # Your new types here
```

**Pattern**:
```typescript
// ✅ CORRECT — New file: lib/microlearning/types/new-domain.types.ts
export interface NewFeatureConfig { ... }
export type NewFeatureStatus = 'active' | 'inactive';

// In types/index.ts — re-export
export * from './new-domain.types';
```

---

### 4. `lib/microlearning/content-segmenter.ts` (2,269 lines)

**What it does**: Content segmentation — splitting learning content into micro-chunks using multiple strategies.

**When adding new segmentation strategies, create modules in**:
```
lib/microlearning/segmentation/
  ├── index.ts              # Orchestrator (delegates to strategies)
  ├── strategies/
  │   ├── topic-strategy.ts
  │   ├── time-strategy.ts
  │   └── new-strategy.ts   # Your new strategy
  ├── analyzers/            # Content analysis utilities
  └── builders/             # Segment construction
```

**Pattern**:
```typescript
// ✅ CORRECT — New file: lib/microlearning/segmentation/strategies/new-strategy.ts
export class NewSegmentationStrategy implements SegmentationStrategy {
  segment(content: Content): Segment[] { ... }
}

// In content-segmenter.ts — register strategy
import { NewSegmentationStrategy } from './segmentation/strategies/new-strategy';
```

---

### 5. `app/api/sam/unified/route.ts` (2,111 lines)

**What it does**: Unified SAM API endpoint — routing, middleware, intent detection, response building, tool execution.

**When adding new features, create modules in**:
```
app/api/sam/unified/
  ├── route.ts              # Keep thin — routing only
  ├── middleware/            # Auth, rate limiting, validation
  ├── services/
  │   ├── intent-detector.ts
  │   ├── response-builder.ts
  │   └── new-service.ts    # Your new service
  ├── handlers/             # Request handlers by intent type
  └── types.ts
```

**Pattern**:
```typescript
// ✅ CORRECT — New file: app/api/sam/unified/services/new-service.ts
export async function handleNewFeature(request: NewFeatureRequest) { ... }

// In route.ts — import handler
import { handleNewFeature } from './services/new-service';
```

---

### 6. `components/sam/sam-course-creator-modal.tsx` (2,092 lines)

**Path**: `app/(protected)/teacher/create/_components/sam-course-creator-modal.tsx`

**What it does**: Multi-step course creation wizard with AI assistance.

**When adding new steps or features, create modules in**:
```
app/(protected)/teacher/create/_components/course-creator/
  ├── index.tsx             # Main modal (orchestration)
  ├── steps/
  │   ├── StepOne.tsx
  │   ├── StepTwo.tsx
  │   └── NewStep.tsx       # Your new step
  ├── hooks/
  │   ├── useCourseCreation.ts
  │   └── useNewFeature.ts  # Your new hook
  └── services/
      └── ai-service.ts
```

---

## High Priority Files (1600-2000 lines)

### 7. `components/sam/KnowledgeGraphBrowser.tsx` (1,938 lines)

**Module path**: `components/sam/knowledge-graph/`
- `canvas/` — Canvas rendering, zoom, pan
- `interaction/` — Click, hover, drag handlers
- `data/` — Graph data fetching and transformation
- `ui/` — Panels, tooltips, controls

### 8. `app/dashboard/admin/users/users-client.tsx` (1,852 lines)

**Module path**: `app/dashboard/admin/users/modules/`
- `components/` — UserTable, UserFilters, UserActions
- `hooks/` — useUserManagement, useUserFilters
- `services/` — API calls, data transformation

### 9. `components/dashboard/smart/skill-build-tracker.tsx` (1,670 lines)

**Module path**: `components/dashboard/smart/skill-tracker/`
- `components/` — Charts, progress cards, skill lists
- `hooks/` — useSkillTracking, useProgressData

### 10. `lib/emotion-detection/emotion-detector.ts` (1,614 lines)

**Module path**: `lib/emotion-detection/modules/`
- `detectors/` — Individual emotion detection strategies
- `analyzers/` — Pattern analysis, trend detection
- `monitoring/` — Real-time monitoring utilities

---

## Medium Priority Files (1000-1600 lines)

| File | Lines | Module Path |
|------|-------|-------------|
| `lib/cross-course-benchmarking.ts` | 1,550 | `lib/benchmarking/` — Split types, analyzers, reporters |
| `lib/db/db-monitoring.ts` | 1,478 | `lib/db/monitoring/` — Split health checks by service |
| `lib/sam-engines/educational/standards/qm-evaluator.ts` | 1,411 | `lib/sam-engines/educational/standards/qm/` — Split by evaluation area |
| `lib/resilience/health-monitor.ts` | 1,350 | `lib/resilience/monitors/` — Split by service type |
| `components/analytics/tabs/JobMarketTab.tsx` | 1,332 | `components/analytics/job-market/` — Split data, charts, AI |
| `lib/intelligent-question-sequencing.ts` | 1,301 | `lib/question-sequencing/` — Split algorithms into strategies |
| `lib/sam/multi-agent-coordinator.ts` | 1,241 | `lib/sam/coordination/` — Split orchestration, conflict resolution |
| `lib/sam/agentic-bridge.ts` | 1,225 | `lib/sam/bridge/` — Split by subsystem |

---

## Code Smell Reference

**Files with excessive useState (extract custom hooks first)**:
| File | useState Count |
|------|---------------|
| `SAMAssistant.tsx` | 44 |
| `KnowledgeGraphBrowser.tsx` | 25 |
| `users-client.tsx` | 24 |
| `sam-course-creator-modal.tsx` | 24 |

**Files with excessive imports (likely needs decomposition)**:
| File | Import Count |
|------|-------------|
| `NewDashboard.tsx` | 88 |
| `LearningCommandCenter.tsx` | 35 |
| `sam/unified/route.ts` | 29 |

---

## Rules

1. **NEVER add new features directly** to files listed above
2. **Create a separate module** file in the suggested path
3. **Import and use** the module from the original file
4. **Keep the original file as an orchestrator** — it delegates, not implements
5. **Co-locate tests** with new modules: `__tests__/` next to module files

---

*Last updated: January 2025*
*Generated from codebase analysis of files exceeding 1,000 lines*
