# SAM AI System - Portability and Consolidation Plan

> **Created**: December 2024
> **Last Updated**: December 2024
> **Status**: Phase 3 Complete - Ready for npm Publish
> **Goal**: Make SAM a truly portable npm package for context-aware tutoring, exam evaluation, and Bloom&apos;s taxonomy question creation

---

## Phase 0 Decisions (COMPLETED)

### Namespace Decision: `@sam-ai/*`

**Decision Date**: December 2024
**Decision**: Use `@sam-ai/*` as the canonical package namespace.

**Rationale**:
- Cleaner, more memorable namespace
- Modular architecture with clear separation of concerns
- Already structured in `packages/core`, `packages/api`, `packages/react`
- Better for tree-shaking and selective imports

**Deprecated**: `@taxomind/sam-engine` - marked as deprecated in README.

### In-Scope Engines for Portability

| Engine | Priority | Package | Status |
|--------|----------|---------|--------|
| ContextEngine | **Must-have** | @sam-ai/core | Registered, working |
| BloomsEngine | **Must-have** | @sam-ai/core | Registered, working |
| ContentEngine | **Must-have** | @sam-ai/core | Registered, working |
| PersonalizationEngine | **Nice-to-have** | @sam-ai/core | Registered, working |
| AssessmentEngine | **Must-have** | @sam-ai/core | Registered, working (Phase 1) |
| ResponseEngine | **Must-have** | @sam-ai/core | Registered, working |
| ExamEngine (Advanced) | **Phase 3** | @sam-ai/educational | Isolated, needs adapter |
| EvaluationEngine | **Phase 3** | @sam-ai/educational | Isolated, needs adapter |

### Hard Dependencies to Decouple

| Dependency | Current Location | Strategy |
|------------|-----------------|----------|
| Prisma ORM | `lib/sam-engines/*` | Database adapter pattern |
| Next.js specific imports | `app/api/sam/*` | Move to @sam-ai/api |
| Entity context (DB calls) | `lib/sam/entity-context.ts` | Make adapter-injected |
| Form actions | `lib/sam/form-actions.ts` | Keep in Taxomind app |

### Next Steps (Phase 3)

1. Integrate database adapter into SAM orchestrator configuration
2. Migrate `lib/sam-engines/*` to use adapter pattern
3. Create @sam-ai/educational package for ExamEngine and EvaluationEngine
4. npm publish preparation and testing

---

## Phase 2 Actions (COMPLETED)

### 2.1 SAMDatabaseAdapter Interface Defined

**File**: `packages/core/src/adapters/database.ts`

Created comprehensive database adapter interface with:
- [x] Core entity types: `SAMUser`, `SAMCourse`, `SAMChapter`, `SAMSection`
- [x] Assessment types: `SAMQuestion`, `SAMBloomsProgress`, `SAMCognitiveProgress`
- [x] Analytics types: `SAMInteractionLog`, `SAMCourseAnalysis`
- [x] Query options: `QueryOptions`, `TransactionContext`
- [x] `NoopDatabaseAdapter` for testing/fallback

### 2.2 PrismaSAMAdapter Created

**File**: `lib/sam/adapters/prisma-adapter.ts`

Taxomind-specific Prisma implementation:
- [x] User operations (findUser, findUsers, updateUser)
- [x] Course operations (findCourse, findCourses)
- [x] Chapter/Section operations
- [x] Question bank operations (CRUD)
- [x] Bloom&apos;s progress tracking
- [x] Cognitive progress tracking
- [x] Interaction logging
- [x] Course analysis operations
- [x] Type mappers for Prisma enums → SAM types

### 2.3 InMemoryDatabaseAdapter Created

**File**: `packages/core/src/adapters/memory-database.ts`

Portable in-memory adapter for:
- [x] Unit testing without database
- [x] Standalone SAM demos
- [x] Local development
- [x] Optional localStorage persistence (browser)
- [x] Seed data support
- [x] Full CRUD operations

### 2.4 Core Package Exports Updated

**File**: `packages/core/src/index.ts`

New exports added:
```typescript
// Database Adapters
export {
  NoopDatabaseAdapter,
  createNoopDatabaseAdapter,
  InMemoryDatabaseAdapter,
  createInMemoryDatabase,
} from './adapters';

export type {
  SAMDatabaseAdapter,
  SAMUser, SAMCourse, SAMChapter, SAMSection,
  SAMQuestion, SAMBloomsProgress, SAMCognitiveProgress,
  SAMInteractionLog, SAMCourseAnalysis,
  QueryOptions, TransactionContext,
} from './adapters';
```

**TypeScript validation**: Passed (`npx tsc --noEmit`)

---

## Phase 3 Actions (COMPLETED)

### 3.1 Database Adapter Integrated into SAMConfig

**File**: `packages/core/src/types/config.ts`

Updated SAMConfig interface to accept database adapter:
- [x] Added `SAMDatabaseAdapter` import
- [x] Added `database?: SAMDatabaseAdapter` to `SAMConfig` interface
- [x] Added `database?: SAMDatabaseAdapter` to `SAMConfigInput` interface
- [x] Updated `createSAMConfig()` to include database adapter

### 3.2 Unified API Routes Updated

**Files**: `app/api/sam/unified/route.ts`, `app/api/sam/unified/stream/route.ts`

Both routes now inject PrismaSAMAdapter:
- [x] Import `createPrismaSAMAdapter` from `@/lib/sam/adapters`
- [x] Create `databaseAdapter` in orchestrator setup
- [x] Pass `database: databaseAdapter` to `createSAMConfig()`

### 3.3 Package.json Files Prepared for npm Publish

**Files**: All three packages updated

| Package | File | Changes |
|---------|------|---------|
| @sam-ai/core | `packages/core/package.json` | Added publishConfig, repository, bugs, homepage, engines, prepublishOnly |
| @sam-ai/api | `packages/api/package.json` | Changed file:../core to workspace:*, added npm metadata |
| @sam-ai/react | `packages/react/package.json` | Changed file:../core to workspace:*, added npm metadata |

### 3.4 Build Validation Passed

All packages built successfully:

```
@sam-ai/core   - dist/index.js (147.65 KB), dist/index.mjs (144.34 KB), dist/index.d.ts (62.51 KB)
@sam-ai/api    - dist/index.js (40.16 KB), dist/index.mjs (37.64 KB), dist/index.d.ts (18.22 KB)
@sam-ai/react  - dist/index.js (29.46 KB), dist/index.mjs (27.46 KB), dist/index.d.ts (10.98 KB)
```

**TypeScript validation**: Passed (`npx tsc --noEmit` - exit code 0)
**ESLint validation**: Passed (no errors)

### Next Steps (Phase 4+)

1. Create @sam-ai/educational package for ExamEngine and EvaluationEngine
2. Migrate `lib/sam-engines/*` to use adapter pattern
3. Complete @sam-ai/api handlers and @sam-ai/react hooks
4. npm publish after testing in standalone project

---

## Phase 1 Actions (COMPLETED)

### 1.1 AssessmentEngine Registered

**File**: `app/api/sam/unified/route.ts`
- [x] Added `createAssessmentEngine` import
- [x] Registered AssessmentEngine in orchestrator (now 6 engines)
- [x] Added `assessment` and `exam` presets to ENGINE_PRESETS
- [x] Updated `getEnginePreset()` to detect assessment requests

### 1.2 Package READMEs Created

| Package | README | Status |
|---------|--------|--------|
| @sam-ai/core | `packages/core/README.md` | Created |
| @sam-ai/api | `packages/api/README.md` | Created |
| @sam-ai/react | `packages/react/README.md` | Created |

### 1.3 Import Paths Fixed

**tsconfig.json** updated with path mappings:
```json
"@sam-ai/core": ["./packages/core/src/index.ts"],
"@sam-ai/api": ["./packages/api/src/index.ts"],
"@sam-ai/react": ["./packages/react/src/index.ts"]
```

**Files updated**:
- [x] `app/api/sam/unified/route.ts` → `import from '@sam-ai/core'`
- [x] `app/api/sam/unified/stream/route.ts` → `import from '@sam-ai/core'`

**TypeScript validation**: Passed (`npx tsc --noEmit`)

---

## Executive Summary

SAM (Smart Adaptive Mentor) is a sophisticated AI tutoring system with Bloom's Taxonomy-based assessment and context-aware learning assistance. The current implementation has **three competing implementations**, **fragmented architecture**, and **local dependencies** that prevent true npm portability.

**Current Reality:**
- NPM Readiness: **40%** (local imports, missing READMEs)
- Portability Score: **50/100** (Prisma deps in lib/sam-engines)
- Development Progress: **65%** (features exist but fragmented)

---

## Current State Analysis

### Three Competing SAM Implementations

| Implementation | Location | Status | Used By |
|---------------|----------|--------|---------|
| **@sam-ai/core** (Unified) | `packages/core/src/*` | Active | `app/api/sam/unified/route.ts` |
| **lib/sam-engines** (Advanced) | `lib/sam-engines/*` | Active | Isolated API routes |
| **@taxomind/sam-engine** | `packages/sam-engine/` | Unused | Nothing in app |

### Critical Issues Identified

| Issue | Impact | Priority |
|-------|--------|----------|
| Local import paths (`@/packages/core/src`) | Blocks npm publishing | **P0** |
| AssessmentEngine not registered in orchestrator | Feature incomplete | **P0** |
| Missing package READMEs (core, api, react) | npm publish metadata fails | **P0** |
| Prisma dependencies in lib/sam-engines | Blocks portability | **P1** |
| Stale documentation referencing non-existent files | Developer confusion | **P1** |
| Namespace inconsistency (@sam-ai vs @taxomind) | Brand confusion | **P2** |

### Current Architecture Flow

```
SAMAssistant.tsx (UI)
       │
       ▼
app/api/sam/unified/route.ts ──────► @/packages/core/src (LOCAL PATH!)
       │                                    │
       │                                    ├── ContextEngine ✓
       │                                    ├── BloomsEngine ✓
       │                                    ├── ContentEngine ✓
       │                                    ├── PersonalizationEngine ✓
       │                                    ├── ResponseEngine ✓
       │                                    └── AssessmentEngine ✗ (NOT REGISTERED!)
       │
       ├── lib/sam/entity-context.ts (Prisma DB calls)
       └── lib/sam/form-actions.ts

ISOLATED APIs (Not wired to unified assistant):
├── app/api/sam/exam-engine/route.ts ──► lib/sam-engines/educational/sam-exam-engine.ts
├── app/api/exams/sam-assist/route.ts ──► lib/sam-engines/educational/sam-evaluation-engine.ts
└── lib/sam-engines/core/sam-master-integration.ts (Parallel unused path)
```

### What Works End-to-End vs Isolated

| Feature | Status | Path |
|---------|--------|------|
| Context-aware chat | **Working** | SAMAssistant → unified/route.ts |
| Bloom's analysis (keyword) | **Working** | BloomsEngine in orchestrator |
| Bloom's analysis (LLM+DB) | **Isolated** | lib/sam-engines/educational/sam-blooms-engine.ts |
| Exam generation | **Isolated** | exam-engine/route.ts (not in chat) |
| Exam evaluation | **Isolated** | sam-assist/route.ts (not in chat) |
| Personalization | **Working** | PersonalizationEngine registered |
| Assessment questions | **Not Used** | AssessmentEngine exists but not registered |

---

## Target Architecture

```
@sam-ai/core (npm package - 0 framework deps)
├── Orchestrator
├── 6 Engines (Context, Blooms, Content, Personalization, Assessment, Response)
├── Adapters (AI, Cache, Database)
├── Types & State Machine
└── Zero Prisma/Next.js dependencies

@sam-ai/react (npm package)
├── SAMProvider
├── useSAM, useSAMChat, useSAMAnalysis hooks
└── Peer dependency: react ^18 || ^19

@sam-ai/api (npm package)
├── Route handlers for Next.js
├── Middleware (auth, rate-limit, validation)
└── Peer dependency: next ^14 || ^15

@sam-ai/educational (optional npm package)
├── ExamEngine
├── EvaluationEngine
├── BloomsAnalysisEngine (LLM-powered)
└── Requires database adapter

Application Layer (consumer app)
├── npm install @sam-ai/core @sam-ai/react
├── Provide adapters (DB, Auth)
└── Configure engines
```

---

## Implementation Phases

### Phase 0: Decision Point (Day 1)

**Choose the canonical package line:**

| Option | Pros | Cons |
|--------|------|------|
| **A: @sam-ai/*** | Cleaner namespace, modular, already structured | Need to deprecate @taxomind |
| **B: @taxomind/sam-engine** | Has full README (640 lines), v1.0.0 | Different architecture, monolithic |

**Recommendation**: **Option A (@sam-ai/*)** - more modular, better separation of concerns.

**Decide which engines are in-scope:**

| Engine | Priority | Notes |
|--------|----------|-------|
| Context awareness | Must-have | Working in orchestrator |
| Bloom's analysis | Must-have | Keyword version working, LLM version isolated |
| Question creation | Must-have | AssessmentEngine exists, not registered |
| Exam evaluation | Must-have | Isolated in lib/sam-engines |
| Personalization | Nice-to-have | Working in orchestrator |
| Analytics | Optional | Exists but not critical for portability |

**Action Items:**
- [x] Document namespace decision → @sam-ai/* (completed Dec 2024)
- [x] Mark deprecated package in its README → `packages/sam-engine/README.md` updated
- [x] Create tracking document → This plan updated with Phase 0 decisions

---

### Phase 1: Fix Critical Blockers (Days 2-4)

#### 1.1 Register AssessmentEngine

**File**: `app/api/sam/unified/route.ts` (around line 184)

```typescript
// Current (missing AssessmentEngine):
orchestrator.registerEngine(createContextEngine(samConfig));
orchestrator.registerEngine(createBloomsEngine(samConfig));
orchestrator.registerEngine(createContentEngine(samConfig));
orchestrator.registerEngine(createPersonalizationEngine(samConfig));
orchestrator.registerEngine(createResponseEngine(samConfig));

// Add this line:
import { createAssessmentEngine } from '@/packages/core/src';
orchestrator.registerEngine(createAssessmentEngine(samConfig));
```

#### 1.2 Create Package READMEs

**Files to create:**

| Package | File | Priority |
|---------|------|----------|
| @sam-ai/core | `packages/core/README.md` | P0 |
| @sam-ai/api | `packages/api/README.md` | P0 |
| @sam-ai/react | `packages/react/README.md` | P0 |

**README Template:**
```markdown
# @sam-ai/core

Core engine orchestration for SAM AI Tutor.

## Installation

```bash
npm install @sam-ai/core
```

## Quick Start

```typescript
import { createOrchestrator, createBloomsEngine } from '@sam-ai/core';

const orchestrator = createOrchestrator({
  ai: { apiKey: process.env.ANTHROPIC_API_KEY }
});

orchestrator.registerEngine(createBloomsEngine());

const result = await orchestrator.orchestrate(context, 'Analyze this content');
```

## Engines

- **ContextEngine**: Analyzes user intent and page context
- **BloomsEngine**: Bloom's Taxonomy cognitive level analysis
- **ContentEngine**: Educational content generation
- **PersonalizationEngine**: Learning style and emotion detection
- **AssessmentEngine**: Question generation with Bloom's alignment
- **ResponseEngine**: Aggregates results into final response

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| ai.apiKey | string | required | Anthropic API key |
| ai.model | string | claude-sonnet-4 | Model to use |
| engine.timeout | number | 30000 | Engine timeout in ms |
| engine.cacheEnabled | boolean | true | Enable result caching |

## License

MIT
```

#### 1.3 Fix Import Paths

**Current (blocks npm):**
```typescript
import { ... } from '@/packages/core/src';
```

**Target (npm-ready):**
```typescript
import { ... } from '@sam-ai/core';
```

**Files to update:**
- [ ] `app/api/sam/unified/route.ts` (line 13-28)
- [ ] `app/api/sam/unified/stream/route.ts`
- [ ] `lib/sam/migration-bridge.ts`

**Strategy:**
1. Build packages locally: `cd packages/core && npm run build`
2. Update `tsconfig.json` paths to resolve `@sam-ai/core` → `packages/core/dist`
3. Later: switch to actual npm install

---

### Phase 2: Database Adapter Layer (Days 5-7)

The advanced engines in `lib/sam-engines/*` depend on Prisma directly. To make them portable, create an adapter pattern.

#### 2.1 Define Database Adapter Interface

**File**: `packages/core/src/adapters/database.ts`

```typescript
export interface SAMDatabaseAdapter {
  // Course operations
  getCourse(id: string): Promise<CourseData | null>;
  getCourseWithChapters(id: string): Promise<CourseWithChapters | null>;

  // Question bank operations
  getQuestionBankQuestions(params: {
    courseId?: string;
    sectionIds?: string[];
    bloomsLevel?: BloomsLevel;
  }): Promise<Question[]>;
  saveQuestion(question: QuestionInput): Promise<Question>;

  // Student progress operations
  getStudentProgress(userId: string, courseId: string): Promise<StudentProgress | null>;
  updateStudentProgress(data: ProgressUpdate): Promise<void>;

  // Bloom's analysis operations
  getCourseBloomsAnalysis(courseId: string): Promise<BloomsAnalysis | null>;
  saveCourseBloomsAnalysis(data: BloomsAnalysisInput): Promise<void>;

  // Spaced repetition
  getSpacedRepetitionSchedule(userId: string, conceptId: string): Promise<Schedule | null>;
  updateSpacedRepetitionSchedule(data: ScheduleUpdate): Promise<void>;
}
```

#### 2.2 Create Prisma Adapter (for Taxomind)

**File**: `lib/sam/adapters/prisma-adapter.ts`

```typescript
import { db } from '@/lib/db';
import type { SAMDatabaseAdapter } from '@sam-ai/core';

export class PrismaSAMAdapter implements SAMDatabaseAdapter {
  async getCourse(id: string) {
    return db.course.findUnique({
      where: { id },
      select: { id: true, title: true, description: true }
    });
  }

  async getQuestionBankQuestions(params) {
    return db.questionBank.findMany({
      where: {
        courseId: params.courseId,
        ...(params.sectionIds && { sectionId: { in: params.sectionIds } }),
        ...(params.bloomsLevel && { bloomsLevel: params.bloomsLevel }),
      },
      orderBy: { usageCount: 'asc' },
    });
  }

  // ... implement all methods
}
```

#### 2.3 Create In-Memory Adapter (for quick starts)

**File**: `packages/core/src/adapters/memory-database.ts`

```typescript
export class InMemoryDatabaseAdapter implements SAMDatabaseAdapter {
  private courses: Map<string, CourseData> = new Map();
  private questions: Map<string, Question> = new Map();

  async getCourse(id: string) {
    return this.courses.get(id) || null;
  }

  // ... implement all methods with in-memory storage
}
```

---

### Phase 3: Engine Consolidation (Days 8-10)

#### 3.1 Decision: Package Structure

**Option A: Merge all into @sam-ai/core**
- Single package with all features
- Simpler dependency management
- Larger bundle size

**Option B: Separate @sam-ai/educational** (Recommended)
- Keep core lightweight
- Advanced features optional
- Better tree-shaking

#### 3.2 If Option B: Create @sam-ai/educational

```
packages/educational/
├── src/
│   ├── engines/
│   │   ├── exam-engine.ts        ← from lib/sam-engines/educational/
│   │   ├── evaluation-engine.ts  ← from lib/sam-engines/educational/
│   │   └── blooms-analysis.ts    ← LLM-powered version
│   ├── index.ts
│   └── types.ts
├── package.json
├── tsconfig.json
└── README.md
```

**package.json:**
```json
{
  "name": "@sam-ai/educational",
  "version": "0.1.0",
  "peerDependencies": {
    "@sam-ai/core": "^0.1.0"
  }
}
```

#### 3.3 Wire Educational Engines to Orchestrator

```typescript
// In app configuration
import { createOrchestrator } from '@sam-ai/core';
import { createExamEngine, createEvaluationEngine } from '@sam-ai/educational';

const orchestrator = createOrchestrator(config);

// Register educational engines
orchestrator.registerEngine(createExamEngine({
  ...config,
  database: prismAdapter
}));
```

---

### Phase 4: API and UI Integration (Days 11-12)

#### 4.1 Complete @sam-ai/api Package

**Current state**: Scaffold exists with handlers defined but not fully implemented.

**Files to complete:**
- [ ] `packages/api/src/handlers/chat.ts` - Wire to orchestrator
- [ ] `packages/api/src/handlers/analyze.ts` - Wire to Blooms engine
- [ ] `packages/api/src/middleware/auth.ts` - Make adapter-based

**Target usage:**
```typescript
// In Next.js app
import { createSAMRouteHandler } from '@sam-ai/api';
import { prismAdapter } from './adapters';

export const POST = createSAMRouteHandler({
  orchestrator,
  authAdapter: nextAuthAdapter,
  database: prismAdapter,
});
```

#### 4.2 Complete @sam-ai/react Package

**Current state**: Hooks defined but not fully wired.

**Files to complete:**
- [ ] `packages/react/src/hooks/useSAMChat.ts`
- [ ] `packages/react/src/hooks/useSAMAnalysis.ts`
- [ ] `packages/react/src/context/SAMProvider.tsx`

**Target usage:**
```tsx
import { SAMProvider, useSAMChat } from '@sam-ai/react';

function App() {
  return (
    <SAMProvider apiEndpoint="/api/sam">
      <ChatInterface />
    </SAMProvider>
  );
}

function ChatInterface() {
  const { sendMessage, messages, isLoading } = useSAMChat();
  // ...
}
```

---

### Phase 5: Documentation Cleanup (Day 13)

#### 5.1 Audit Stale Documentation

**Documents with issues:**

| Document | Issue |
|----------|-------|
| `docs/SAM_UNIFIED_INTEGRATION_PLAN.md` | References non-existent `lib/sam/engine-config.ts` |
| `docs/sam-implementation/CONTEXT_AWARE_SAM_IMPLEMENTATION.md` | References missing components |
| `docs/sam-implementation/SAM_MIGRATION_GUIDE.md` | Wrong API endpoint (`/api/sam/unified-assistant`) |
| `docs/sam-implementation/SAM_ENGINES_FINAL_INTEGRATION.md` | Claims integration that doesn't exist |
| `packages/core/PHASE1_DOCUMENTATION.md` | Doesn't reflect current app wiring |

**Action for each:**
- [ ] Verify all file references exist (grep for paths)
- [ ] Update or mark deprecated
- [ ] Add "Last Verified: [date]" header

#### 5.2 Create Canonical Documentation

**New structure:**
```
docs/sam-ai-packages/
├── README.md                 ← Main entry point
├── ARCHITECTURE.md           ← Current accurate architecture
├── QUICK_START.md            ← Getting started guide
├── API_REFERENCE.md          ← Complete API docs
├── ADAPTERS.md               ← Database/auth adapter guide
├── MIGRATION_FROM_EMBEDDED.md ← For Taxomind migration
└── EXAMPLES/
    ├── nextjs.md
    ├── vite-react.md
    └── node-api.md
```

---

### Phase 6: Testing and Validation (Days 14-15)

#### 6.1 Unit Tests for Engines

**File**: `packages/core/__tests__/engines/blooms.test.ts`

```typescript
describe('BloomsEngine', () => {
  it('should analyze content and return distribution', async () => {
    const engine = createBloomsEngine(config);
    const result = await engine.execute({
      context: mockContext,
      query: 'Analyze the learning objectives'
    });

    expect(result.success).toBe(true);
    expect(result.data.analysis.distribution).toBeDefined();
    expect(result.data.analysis.dominantLevel).toBeDefined();
  });
});
```

#### 6.2 Integration Tests for Orchestrator

**File**: `packages/core/__tests__/integration/orchestrator.test.ts`

```typescript
describe('SAMAgentOrchestrator', () => {
  it('should register all 6 engines', () => {
    const orchestrator = createOrchestrator(config);
    registerAllEngines(orchestrator, config);

    expect(orchestrator.getRegisteredEngines()).toEqual([
      'context', 'blooms', 'content', 'personalization', 'assessment', 'response'
    ]);
  });

  it('should execute engines in dependency order', async () => {
    const result = await orchestrator.orchestrate(context, 'test');

    expect(result.metadata.enginesExecuted).toContain('assessment');
    expect(result.success).toBe(true);
  });
});
```

#### 6.3 Standalone Example Project

**Directory**: `examples/standalone/`

```typescript
// examples/standalone/index.ts
import { createOrchestrator, createBloomsEngine, createResponseEngine } from '@sam-ai/core';

async function main() {
  const orchestrator = createOrchestrator({
    ai: { apiKey: process.env.ANTHROPIC_API_KEY! }
  });

  orchestrator.registerEngine(createBloomsEngine());
  orchestrator.registerEngine(createResponseEngine());

  const result = await orchestrator.orchestrate(
    { user: { id: '1', role: 'student' }, page: { type: 'learning' } },
    'Explain photosynthesis'
  );

  console.log('Response:', result.response.message);
  console.log('Bloom\'s Analysis:', result.response.blooms);
}

main();
```

---

### Phase 7: Publish and Release (Day 16)

#### 7.1 Pre-publish Checklist

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] READMEs complete for all packages
- [ ] CHANGELOGs created
- [ ] Version numbers aligned (0.1.0)
- [ ] No local path imports (`@/packages/...`)
- [ ] `npm pack --dry-run` succeeds for each package

#### 7.2 Publish to npm

```bash
# Order matters - publish dependencies first

# 1. Core (no deps on other @sam-ai)
cd packages/core
npm publish --access public

# 2. API (depends on core)
cd ../api
npm publish --access public

# 3. React (depends on core)
cd ../react
npm publish --access public

# 4. Educational (depends on core) - if created
cd ../educational
npm publish --access public
```

#### 7.3 GitHub Actions CI/CD

**File**: `.github/workflows/publish-packages.yml`

```yaml
name: Publish SAM Packages

on:
  push:
    tags:
      - 'sam-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install
      - run: pnpm --filter "@sam-ai/*" build
      - run: pnpm --filter "@sam-ai/*" test
      - run: pnpm --filter "@sam-ai/*" publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Timeline Summary

| Phase | Duration | Key Deliverable |
|-------|----------|-----------------|
| Phase 0: Decision | 1 day | Namespace + scope documented |
| Phase 1: Critical Fixes | 3 days | AssessmentEngine registered, READMEs, imports |
| Phase 2: Database Adapter | 3 days | SAMDatabaseAdapter + Prisma impl |
| Phase 3: Consolidation | 3 days | @sam-ai/educational package |
| Phase 4: API/React | 2 days | Complete handlers and hooks |
| Phase 5: Documentation | 1 day | Clean, accurate docs |
| Phase 6: Testing | 2 days | Unit + integration tests |
| Phase 7: Publish | 1 day | Packages on npm |

**Total: ~16 days**

---

## Success Criteria

### Minimum Viable Portability (MVP)

- [ ] `npm install @sam-ai/core` works in fresh project
- [ ] Can create orchestrator without Prisma/Next.js
- [ ] All 6 engines register and execute
- [ ] Bloom's analysis returns valid distribution
- [ ] Documentation matches implementation

### Full Portability

- [ ] All packages published to npm
- [ ] Example projects work standalone
- [ ] CI/CD pipeline publishes on tag
- [ ] Educational engines portable with adapter
- [ ] Zero stale documentation references

---

## Files to Modify

```
# Critical fixes
app/api/sam/unified/route.ts          ← Register AssessmentEngine, fix imports
app/api/sam/unified/stream/route.ts   ← Fix imports
lib/sam/migration-bridge.ts           ← Use npm imports
tsconfig.json                         ← Add @sam-ai/* path mappings

# New files
packages/core/README.md
packages/api/README.md
packages/react/README.md
packages/core/CHANGELOG.md
packages/core/src/adapters/database.ts
lib/sam/adapters/prisma-adapter.ts
docs/sam-ai-packages/README.md
examples/standalone/index.ts
.github/workflows/publish-packages.yml
```

## Files to Deprecate

```
packages/sam-engine/                   ← Deprecate if choosing @sam-ai/*
docs/SAM_UNIFIED_INTEGRATION_PLAN.md  ← Mark deprecated, references missing files
docs/sam-implementation/*.md          ← Audit and update or deprecate
```

---

## Open Decisions

- [x] ~~Which package line to standardize on~~ → **@sam-ai/*** (Phase 0 decision)
- [ ] Whether to create @sam-ai/educational or merge into core (Phase 3 decision)
- [ ] Whether to integrate exam engine into unified chat or keep as separate API
- [ ] npm organization name and access permissions (need to verify @sam-ai availability)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking existing Taxomind app | Phase 1 uses local builds, npm later |
| Prisma adapter incomplete | Start with core engines, add DB features incrementally |
| npm namespace taken | Have backup names ready |
| Documentation drift | Add verified dates, automate link checking |

---

*Document Version: 2.0*
*Last Updated: December 2024*
