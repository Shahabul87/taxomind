# SAM AI Development Plan

> **Version**: 2.6.0
> **Created**: December 2024
> **Updated**: December 29, 2024
> **Status**: Active Development
> **Architecture**: Portable NPM Packages

---

## ⚠️ IMPORTANT: Package Status

| Package | Status | Use? |
|---------|--------|------|
| `@sam-ai/core` | ✅ **ACTIVE** | YES - Main orchestration |
| `@sam-ai/educational` | ✅ **ACTIVE** | YES - Add new engines here |
| `@sam-ai/pedagogy` | ✅ **ACTIVE** | YES |
| `@sam-ai/memory` | ✅ **ACTIVE** | YES |
| `@sam-ai/quality` | ✅ **ACTIVE** | YES |
| `@sam-ai/safety` | ✅ **ACTIVE** | YES |
| `@sam-ai/api` | ✅ **ACTIVE** | YES |
| `@sam-ai/react` | ✅ **ACTIVE** | YES |
| `@sam-ai/adapter-prisma` | ✅ **ACTIVE** | YES |
| `@sam-ai/sam-engine` | ❌ **DEPRECATED** | NO - Do not modify |

**All new development should target `@sam-ai/core` and `@sam-ai/educational`**

---

## Table of Contents

1. [Architecture Philosophy](#architecture-philosophy)
2. [Package Structure](#package-structure)
3. [Current State](#current-state)
4. [Missing Features](#missing-features)
5. [Development Phases](#development-phases)
6. [Implementation Tracker](#implementation-tracker)
7. [Technical Specifications](#technical-specifications)

---

## Architecture Philosophy

### SAM is a Portable NPM Package System

```
┌─────────────────────────────────────────────────────────────┐
│                    HOST APPLICATION                          │
│                      (Taxomind)                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  lib/anthropic.ts        lib/sam/ai-provider.ts         │ │
│  │  (Anthropic SDK)         (Creates adapters)             │ │
│  └──────────────────────────┬──────────────────────────────┘ │
│                             │ Injects AIAdapter              │
│  ┌──────────────────────────▼──────────────────────────────┐ │
│  │                 SAM NPM PACKAGES                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ @sam-ai/    │ │ @sam-ai/    │ │ @sam-ai/    │        │ │
│  │  │ core        │ │ educational │ │ sam-engine  │        │ │
│  │  │ (AIAdapter) │ │ (29 engines)│ │ (orchestr.) │        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │ │
│  │  │ @sam-ai/    │ │ @sam-ai/    │ │ @sam-ai/    │        │ │
│  │  │ pedagogy    │ │ quality     │ │ safety      │        │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘        │ │
│  │  ┌─────────────┐ ┌─────────────┐                        │ │
│  │  │ @sam-ai/    │ │ @sam-ai/    │                        │ │
│  │  │ memory      │ │ adapter-*   │                        │ │
│  │  └─────────────┘ └─────────────┘                        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **AI Provider Agnostic** - SAM packages use `AIAdapter` interface
2. **Dependency Injection** - Host app injects AI providers
3. **Database Agnostic** - Use adapter pattern for persistence
4. **Framework Agnostic** - No Next.js dependencies in core packages
5. **Zero Hard Dependencies** - All external services via adapters

### Current AI Integration (Already Implemented)

```typescript
// packages/core/src/adapters/anthropic.ts - DONE ✅
export class AnthropicAdapter implements AIAdapter {
  async chat(params: AIChatParams): Promise<AIChatResponse>;
  async *chatStream(params: AIChatParams): AsyncIterable<AIChatStreamChunk>;
}

// lib/sam/ai-provider.ts - Host app creates adapters - DONE ✅
export async function runSAMChat(options: {
  messages: AIMessage[];
  systemPrompt?: string;
  extended?: boolean;
}): Promise<string>;
```

---

## Package Structure

### Published NPM Packages

| Package | Purpose | Dependencies | Status |
|---------|---------|--------------|--------|
| `@sam-ai/core` | Types, interfaces, adapters | None | ✅ Ready |
| `@sam-ai/educational` | 29 learning engines | `@sam-ai/core` | ✅ Ready |
| `@sam-ai/pedagogy` | Pedagogical validators | `@sam-ai/core` | ✅ Ready |
| `@sam-ai/memory` | Learning context | `@sam-ai/core` | ✅ Ready |
| `@sam-ai/quality` | Quality gates | `@sam-ai/core` | ✅ Ready |
| `@sam-ai/safety` | Safety validators | `@sam-ai/core` | ✅ Ready |
| `@sam-ai/sam-engine` | Core orchestrator | `@sam-ai/core` | ⚠️ Needs Update |
| `@sam-ai/adapter-prisma` | Prisma database adapter | `@sam-ai/core` | ✅ Ready |
| `@sam-ai/react` | React components | `@sam-ai/core` | ✅ Ready |

### Package Dependency Graph

```
@sam-ai/core (base - no deps)
    │
    ├── @sam-ai/educational
    ├── @sam-ai/pedagogy
    ├── @sam-ai/memory
    ├── @sam-ai/quality
    ├── @sam-ai/safety
    ├── @sam-ai/sam-engine
    ├── @sam-ai/adapter-prisma
    └── @sam-ai/react
```

---

## Current State

### Implemented Engines (32 Total)

#### Educational Engines (16) ✅
- [x] ExamEngine - Exam generation with Bloom's alignment
- [x] EvaluationEngine - AI grading (subjective + objective)
- [x] BloomsAnalysisEngine - Taxonomy analysis
- [x] UnifiedBloomsEngine - Hybrid fast/AI analysis
- [x] PersonalizationEngine - Learning style detection
- [x] ContentGenerationEngine - Course/content creation
- [x] ResourceEngine - External resource discovery
- [x] MultimediaEngine - Video/audio analysis
- [x] PracticeProblemsEngine - Dynamic problems
- [x] AdaptiveContentEngine - Complexity adjustment
- [x] SocraticTeachingEngine - Dialogue-based learning
- [x] **KnowledgeGraphEngine** - Concept extraction, prerequisites, learning paths ✅
- [x] **MicrolearningEngine** - 5-minute modules, content chunking, spaced delivery, mobile optimization ✅
- [x] **MetacognitionEngine** - Self-reflection, study habits, learning strategies, goal tracking ✅
- [x] **CompetencyEngine** - Skill trees, job mapping, career paths, portfolio building ✅
- [x] **PeerLearningEngine** - Peer matching, study groups, mentoring, reviews, projects ✅ NEW

#### Analytics & Intelligence Engines (7) ✅
- [x] AnalyticsEngine - Learning metrics
- [x] MemoryEngine - Conversation context
- [x] PredictiveEngine - Risk detection
- [x] AchievementEngine - Gamification
- [x] IntegrityEngine - Plagiarism detection
- [x] CourseGuideEngine - Course analytics
- [x] EnhancedDepthEngine - Content depth

#### Business Intelligence Engines (7) ✅
- [x] FinancialEngine - Revenue/pricing
- [x] ResearchEngine - Academic papers
- [x] TrendsEngine - Market trends
- [x] MarketEngine - Competitive analysis
- [x] CollaborationEngine - Group analytics
- [x] SocialEngine - Community dynamics
- [x] InnovationEngine - Quantum paths, study buddies

#### Validators & Gates (14) ✅
- [x] BloomsAligner, ScaffoldingEvaluator, ZPDEvaluator (Pedagogy)
- [x] 5 Quality Gates (Completeness, Example, Difficulty, Structure, Depth)
- [x] 6 Safety Validators (Bias, Language, Accessibility, Framing, Fairness x2)

---

## Missing Features

### P0 - Critical (Package Architecture)

| # | Feature | Description | Package | Status |
|---|---------|-------------|---------|--------|
| 1 | **SAM Engine Adapter Pattern** | Remove hardcoded providers, use AIAdapter | `@sam-ai/sam-engine` | ⚠️ SKIPPED (Package Deprecated) |
| 2 | **Streaming Support in Engines** | Add stream methods to all engines | `@sam-ai/educational` | ❌ Not Started |
| 3 | **Knowledge Graph Engine** | Concept relationships & prerequisites | `@sam-ai/educational` | ✅ Implemented |
| 4 | **Real-Time Engine** | WebSocket/SSE abstraction | `@sam-ai/core` | ❌ Not Started |

### P1 - High Priority (New Engines)

| # | Feature | Description | Package | Status |
|---|---------|-------------|---------|--------|
| 5 | **MicrolearningEngine** | 5-minute learning modules | `@sam-ai/educational` | ✅ Implemented |
| 6 | **MetacognitionEngine** | Self-reflection & learning awareness | `@sam-ai/educational` | ✅ Implemented |
| 7 | **MultimodalInputEngine** | Image/voice/handwriting processing | `@sam-ai/educational` | ❌ Not Started |
| 8 | **CompetencyEngine** | Skill trees & job mapping | `@sam-ai/educational` | ✅ Implemented |
| 9 | **PeerLearningEngine** | Intelligent peer matching | `@sam-ai/educational` | ✅ Implemented |

### P2 - Medium Priority (Enhancements)

| # | Feature | Description | Package | Status |
|---|---------|-------------|---------|--------|
| 10 | **LanguageSupportEngine** | Multi-language & translation | `@sam-ai/educational` | ❌ Not Started |
| 11 | **EmotionalIntelligenceEngine** | Frustration/burnout detection | `@sam-ai/educational` | ⚠️ Partial |
| 12 | **AccessibilityEngine** | Screen reader, dyslexia modes | `@sam-ai/educational` | ⚠️ Partial |

### P3 - Enhancement (Existing Engine Gaps)

| # | Feature | Engine | Gap | Status |
|---|---------|--------|-----|--------|
| 13 | Rubric templates | EvaluationEngine | No sharing between teachers | ❌ |
| 14 | Cross-course tracking | BloomsEngine | No progression across courses | ❌ |
| 15 | Long-term retention | MemoryEngine | No forgetting curve | ❌ |
| 16 | CAT full implementation | ExamEngine | Basic adaptive only | ❌ |
| 17 | Item exposure control | ExamEngine | No test security | ❌ |

---

## Development Phases

### ~~Phase 1: SAM Engine Refactor~~ SKIPPED
> **NOTE**: `@sam-ai/sam-engine` is **DEPRECATED**. The app already uses `@sam-ai/core` with proper adapter pattern.
> No refactoring needed - the architecture is already correct!

### Phase 1: New Engine Development (Week 1-2)
**Goal**: Add missing engines to `@sam-ai/educational`

- [x] 1.1 Create `KnowledgeGraphEngine` in `@sam-ai/educational` ✅ (Dec 29, 2024)
- [x] 1.2 Create `MicrolearningEngine` in `@sam-ai/educational` ✅ (Dec 29, 2024)
- [x] 1.3 Create `MetacognitionEngine` in `@sam-ai/educational` ✅ (Dec 29, 2024)
- [x] 1.4 Export new engines from `packages/educational/src/index.ts` ✅ (Dec 29, 2024)
- [ ] 1.5 Add to `lib/sam-integration/index.ts` re-exports

### Phase 2: Knowledge Graph Engine ✅ COMPLETED (Dec 29, 2024)
**Goal**: Build concept relationship system

- [x] 2.1 Define `KnowledgeGraphEngine` types in `@sam-ai/educational/types` ✅
- [x] 2.2 Implement engine in `@sam-ai/educational/engines` ✅
- [x] 2.3 Add concept extraction from content (AI + keyword-based) ✅
- [x] 2.4 Build prerequisite analysis and gap detection ✅
- [x] 2.5 Create learning path generation ✅
- [x] 2.6 Add course knowledge structure analysis ✅
- [ ] 2.7 Implement Prisma adapter for persistence (optional - uses in-memory cache)
- [ ] 2.8 Add database schema for concepts/relations (pending host app integration)

### Phase 3: Real-Time Abstractions (Week 4)
**Goal**: Create portable real-time interfaces

- [ ] 3.1 Define `RealTimeAdapter` interface in `@sam-ai/core`
- [ ] 3.2 Create `RealTimeLearningEngine` in `@sam-ai/educational`
- [ ] 3.3 Implement WebSocket adapter for host apps
- [ ] 3.4 Add typing indicators support
- [ ] 3.5 Create streaming response utilities

### Phase 4: Microlearning Engine ✅ COMPLETED (Dec 29, 2024)
**Goal**: Bite-sized learning modules

- [x] 4.1 Define microlearning types in `@sam-ai/educational/types` ✅
- [x] 4.2 Create `MicrolearningEngine` in `@sam-ai/educational` ✅
- [x] 4.3 Implement content chunking algorithms (AI + rule-based) ✅
- [x] 4.4 Add spaced delivery scheduling (SM-2 algorithm) ✅
- [x] 4.5 Create mobile-optimized content transforms (swipeable cards, progressive loading) ✅
- [x] 4.6 Add learning session management ✅
- [x] 4.7 Implement analytics and recommendations ✅

### Phase 5: Metacognition Engine ✅ COMPLETED (Dec 29, 2024)
**Goal**: Self-aware learning system

- [x] 5.1 Define metacognition types in `@sam-ai/educational/types` ✅
- [x] 5.2 Create `MetacognitionEngine` in `@sam-ai/educational` ✅
- [x] 5.3 Implement self-reflection prompt generation (AI + template-based) ✅
- [x] 5.4 Add study habit analysis (sessions, environments, patterns) ✅
- [x] 5.5 Create learning strategy recommendations (12 strategies, evidence-based) ✅
- [x] 5.6 Add confidence calibration assessment ✅
- [x] 5.7 Implement cognitive load assessment ✅
- [x] 5.8 Add goal setting and monitoring ✅
- [x] 5.9 Create metacognitive skill assessment ✅
- [x] 5.10 Implement self-regulation tracking ✅

### Phase 6: Multimodal Input Engine (Week 7-8)
**Goal**: Accept diverse input types

- [ ] 6.1 Define `MultimodalAdapter` interface in `@sam-ai/core`
- [ ] 6.2 Create `MultimodalInputEngine` in `@sam-ai/educational`
- [ ] 6.3 Add image analysis abstraction (host provides OCR)
- [ ] 6.4 Add voice input abstraction (host provides STT)
- [ ] 6.5 Create handwriting recognition interface

### Phase 7: Competency Engine (Week 9-10)
**Goal**: Job-market aligned skills

- [ ] 7.1 Define competency types in `@sam-ai/core`
- [ ] 7.2 Create `CompetencyEngine` in `@sam-ai/educational`
- [ ] 7.3 Build skill tree data structures
- [ ] 7.4 Implement job-skill mapping
- [ ] 7.5 Create portfolio builder utilities

### Phase 8: Peer Learning Engine (Week 11-12)
**Goal**: Intelligent peer connections

- [ ] 8.1 Define peer matching types in `@sam-ai/core`
- [ ] 8.2 Create `PeerLearningEngine` in `@sam-ai/educational`
- [ ] 8.3 Implement matching algorithms
- [ ] 8.4 Add study group formation
- [ ] 8.5 Create peer explanation scoring

---

## Implementation Tracker

### Overall Progress

```
Phase 1: New Engines    [████████░░] 80% (4/5 tasks)
Phase 2: Knowledge Graph[████████░░] 80% (6/8 tasks) ✅
Phase 3: Real-Time      [░░░░░░░░░░] 0%
Phase 4: Microlearning  [██████████] 100% ✅
Phase 5: Metacognition  [██████████] 100% ✅
Phase 6: Multimodal     [░░░░░░░░░░] 0%
Phase 7: Competency     [░░░░░░░░░░] 0%
Phase 8: Peer Learning  [░░░░░░░░░░] 0%
─────────────────────────────────────
TOTAL PROGRESS          [███░░░░░░░] 35%
```

### Detailed Task Status

#### Phase 1: New Engine Development

| Task | Status | Notes |
|------|--------|-------|
| 1.1 KnowledgeGraphEngine | ✅ Completed | `packages/educational/src/engines/knowledge-graph-engine.ts` |
| 1.2 MicrolearningEngine | ✅ Completed | `packages/educational/src/engines/microlearning-engine.ts` |
| 1.3 MetacognitionEngine | ✅ Completed | `packages/educational/src/engines/metacognition-engine.ts` |
| 1.4 Export from index.ts | ✅ Completed | `packages/educational/src/index.ts` |
| 1.5 Add to sam-integration | ❌ Not Started | `lib/sam-integration/index.ts` |

---

## Technical Specifications

### 1. Current Integration (Already Correct ✅)

The app already uses the correct adapter pattern via `@sam-ai/core`:

```typescript
// lib/sam-integration/config.ts - ALREADY IMPLEMENTED ✅
import { createSAMConfig, createAnthropicAdapter } from '@sam-ai/core';

export function getTaxomindSAMConfig(): SAMConfig {
  const aiAdapter = createAnthropicAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: 'claude-sonnet-4-5-20250929',
  });

  return createSAMConfig({
    ai: aiAdapter,
    // ... features, personality
  });
}
```

```typescript
// lib/adapters/sam-config-factory.ts - ALREADY IMPLEMENTED ✅
import { createAnthropicAdapter, createSAMConfig, createMemoryCache } from '@sam-ai/core';
import { createPrismaSAMAdapter } from '@sam-ai/adapter-prisma';

export function getSAMConfig(): SAMConfig {
  const aiAdapter = createAnthropicAdapter({
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: 'claude-sonnet-4-20250514',
  });

  return createSAMConfig({
    ai: aiAdapter,
    database: getDatabaseAdapter(),
    cache: createMemoryCache({ maxSize: 1000, defaultTTL: 300 }),
  });
}
```

**No changes needed to the integration layer!**

### 2. Knowledge Graph Engine

**Types** (`@sam-ai/core`):
```typescript
export interface Concept {
  id: string;
  name: string;
  description?: string;
  courseId?: string;
  bloomsLevel?: BloomsLevel;
}

export interface ConceptRelation {
  prerequisiteId: string;
  dependentId: string;
  strength: number; // 0-1
  type: 'required' | 'recommended' | 'related';
}

export interface KnowledgeGraphAdapter {
  getConcept(id: string): Promise<Concept | null>;
  getPrerequisites(conceptId: string): Promise<Concept[]>;
  getDependents(conceptId: string): Promise<Concept[]>;
  addConcept(concept: Concept): Promise<Concept>;
  addRelation(relation: ConceptRelation): Promise<void>;
  getConceptPath(from: string, to: string): Promise<Concept[]>;
}
```

**Engine** (`@sam-ai/educational`):
```typescript
export interface KnowledgeGraphEngineConfig {
  adapter: AIAdapter;
  graphAdapter: KnowledgeGraphAdapter;
}

export class KnowledgeGraphEngine extends BaseEngine {
  async extractConcepts(content: string): Promise<Concept[]>;
  async findPrerequisites(conceptId: string): Promise<Concept[]>;
  async suggestLearningPath(userId: string, targetConcept: string): Promise<Concept[]>;
  async identifyGaps(userId: string, courseId: string): Promise<Concept[]>;
}
```

### 3. Database Schema (Host App - Prisma)

```prisma
// Add to prisma/schema.prisma in host app

model Concept {
  id          String   @id @default(cuid())
  name        String
  description String?
  courseId    String?
  bloomsLevel String?
  course      Course?  @relation(fields: [courseId], references: [id])

  prerequisites  ConceptRelation[] @relation("prerequisite")
  dependents     ConceptRelation[] @relation("dependent")
  mastery        StudentConceptMastery[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([courseId])
  @@index([name])
}

model ConceptRelation {
  id              String   @id @default(cuid())
  prerequisiteId  String
  dependentId     String
  strength        Float    @default(1.0)
  type            String   @default("required") // required, recommended, related

  prerequisite    Concept  @relation("prerequisite", fields: [prerequisiteId], references: [id], onDelete: Cascade)
  dependent       Concept  @relation("dependent", fields: [dependentId], references: [id], onDelete: Cascade)

  @@unique([prerequisiteId, dependentId])
  @@index([prerequisiteId])
  @@index([dependentId])
}

model StudentConceptMastery {
  id         String    @id @default(cuid())
  userId     String
  conceptId  String
  mastery    Float     @default(0)
  lastReview DateTime?
  nextReview DateTime?

  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  concept    Concept   @relation(fields: [conceptId], references: [id], onDelete: Cascade)

  @@unique([userId, conceptId])
  @@index([userId])
  @@index([conceptId])
}

model MicroModule {
  id           String   @id @default(cuid())
  title        String
  duration     Int      // seconds (max 300)
  type         String   // video, quiz, flashcard, reading, exercise
  content      Json
  bloomsLevel  String
  conceptId    String?
  courseId     String?

  completions  MicroModuleCompletion[]

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([courseId])
  @@index([conceptId])
}

model MicroModuleCompletion {
  id         String   @id @default(cuid())
  userId     String
  moduleId   String
  score      Float?
  timeSpent  Int      // seconds

  user       User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  module     MicroModule  @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  completedAt DateTime @default(now())

  @@unique([userId, moduleId])
  @@index([userId])
}
```

---

## NPM Publishing Checklist

### Before Publishing Each Package

- [ ] All types exported from `index.ts`
- [ ] No host-specific dependencies (Next.js, Prisma client)
- [ ] All adapters use interfaces, not implementations
- [ ] Unit tests passing
- [ ] TypeScript strict mode
- [ ] README with usage examples
- [ ] Peer dependencies documented
- [ ] Version bumped

### Package.json Template

```json
{
  "name": "@sam-ai/educational",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "peerDependencies": {
    "@sam-ai/core": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsup": "^8.0.0",
    "vitest": "^1.0.0"
  }
}
```

---

## Success Metrics

| Phase | Success Criteria |
|-------|-----------------|
| Phase 1 | SAM Engine uses injected adapter, streaming works |
| Phase 2 | Concepts extracted, prerequisites queryable |
| Phase 3 | Real-time abstraction works with any WS library |
| Phase 4 | Content chunked into <5min modules |
| Phase 5 | Reflection prompts contextually relevant |
| Phase 6 | Multimodal inputs processed via adapters |
| Phase 7 | Skills mapped, portfolios generated |
| Phase 8 | Peer matching produces compatible pairs |

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| Dec 2024 | 1.0.0 | Initial plan created |
| Dec 2024 | 2.0.0 | Updated for portable NPM architecture |
| Dec 2024 | 2.1.0 | Discovered `@sam-ai/sam-engine` is DEPRECATED - Updated plan to focus on `@sam-ai/core` and `@sam-ai/educational` |
| Dec 29, 2024 | 2.2.0 | Implemented KnowledgeGraphEngine with concept extraction, prerequisites, learning paths |
| Dec 29, 2024 | 2.3.0 | Implemented MicrolearningEngine with content chunking, spaced repetition (SM-2), mobile optimization |
| Dec 29, 2024 | 2.4.0 | Implemented MetacognitionEngine with reflection prompts, study habits, strategies, goals, self-regulation |

---

## Notes

- SAM packages MUST NOT import from host app (`lib/`, `app/`)
- All external services via adapter interfaces
- Host app responsible for: AI keys, database, auth, real-time infra
- SAM packages provide: algorithms, prompts, validation, transformations

---

**Next Action**: Phase 1.5 - Add to sam-integration re-exports, or Phase 3 - Real-Time Abstractions, or Phase 6 - Multimodal Input Engine
