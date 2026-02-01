# SAM Agentic AI Architecture

> **MANDATORY READING**: This document describes the complete SAM Agentic AI system architecture. When generating code that integrates with SAM, you MUST follow the patterns and guidelines documented here.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Statistics](#system-statistics)
3. [Package Structure](#package-structure)
4. [Integration Layer](#integration-layer)
5. [TaxomindContext - The Single Entry Point](#taxomindcontext---the-single-entry-point)
6. [Store Categories](#store-categories)
7. [API Routes Structure](#api-routes-structure)
8. [Dashboard Integration Status](#dashboard-integration-status)
9. [Code Integration Guidelines](#code-integration-guidelines)
10. [Common Patterns](#common-patterns)
11. [File Reference Map](#file-reference-map)
12. [Launch Readiness Status](#launch-readiness-status)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TAXOMIND APPLICATION                              │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         API ROUTES (app/api/sam/*)                     │  │
│  │  • 232 SAM-related routes                                             │  │
│  │  • unified/route.ts       • agentic/goals/*    • agentic/tools/*      │  │
│  │  • agentic/events/*       • agentic/plans/*    • feedback/*           │  │
│  └─────────────────────────────────────┬─────────────────────────────────┘  │
│                                        │                                     │
│  ┌─────────────────────────────────────▼─────────────────────────────────┐  │
│  │                     lib/sam/ INTEGRATION LAYER                         │  │
│  │                                                                        │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │  │
│  │  │                    taxomind-context.ts                            │ │  │
│  │  │              (SINGLE ENTRY POINT FOR ALL 42+ STORES)              │ │  │
│  │  │                                                                   │ │  │
│  │  │  getTaxomindContext() → TaxomindIntegrationContext                │ │  │
│  │  │  integration: AdapterFactory + Profile + Registry                │ │  │
│  │  │  getStore('goal')     → PrismaGoalStore                           │ │  │
│  │  │  getGoalStores()      → { goal, subGoal, plan }                   │ │  │
│  │  │  getProactiveStores() → { behaviorEvent, pattern, intervention }  │ │  │
│  │  │  getMemoryStores()    → { vector, knowledgeGraph, sessionContext }│ │  │
│  │  │  getPracticeStores()  → { practiceSession, skillMastery10K, ... } │ │  │
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
│  │  │  33 store files including practice, educational engines, etc.    │ │  │
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
│  │  │ Goal Plan   │ │ Orchestrator│ │ 40+ Engines │ │ 22 Hooks        │  │  │
│  │  │ Tool Exec   │ │ StateMachine│ │ Standards   │ │ Provider        │  │  │
│  │  │ Proactive   │ │ AI Adapters │ │ Analyzers   │ │ Context         │  │  │
│  │  │ Memory      │ │             │ │             │ │                 │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘  │  │
│  │                                                                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │  │
│  │  │ @sam-ai/    │ │ @sam-ai/    │ │ @sam-ai/    │ │ @sam-ai/        │  │  │
│  │  │ pedagogy    │ │ memory      │ │ safety      │ │ quality         │  │  │
│  │  │             │ │             │ │             │ │                 │  │  │
│  │  │ Blooms      │ │ Mastery     │ │ Bias        │ │ 6 Quality Gates │  │  │
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

## System Statistics

| Metric | Count | Status |
|--------|-------|--------|
| **API Routes** | 232 | ✅ Active |
| **React Components** | 122 | ✅ Active |
| **Stores in Context** | 42+ | ✅ Initialized |
| **Educational Engines** | 40+ | ✅ Available |
| **React Hooks** | 22/22 | ✅ All Connected |
| **SAM Packages** | 16 | ✅ Portable |
| **Dashboard Views** | 5 | ✅ Integrated |
| **Dashboard Widgets** | 60+ | ✅ Active |

---

## Package Structure

### Complete Package List (16 Packages)

| Package | Location | Purpose | Status |
|---------|----------|---------|--------|
| `@sam-ai/agentic` | `packages/agentic/` | Goal planning, tools, proactive interventions, memory | ✅ Fully Integrated |
| `@sam-ai/core` | `packages/core/` | Orchestrator, StateMachine, AI Adapters | ✅ Active |
| `@sam-ai/educational` | `packages/educational/` | 40+ Educational Engines | ✅ Well-integrated |
| `@sam-ai/memory` | `packages/memory/` | MasteryTracker, SpacedRepetition | ✅ Active |
| `@sam-ai/pedagogy` | `packages/pedagogy/` | Blooms Taxonomy, Scaffolding, ZPD | ✅ Active |
| `@sam-ai/safety` | `packages/safety/` | Bias detection, Fairness, Accessibility | ✅ Active |
| `@sam-ai/quality` | `packages/quality/` | 6 Quality Gates | ✅ Active |
| `@sam-ai/react` | `packages/react/` | 22 Hooks, Provider | ✅ All hooks connected |
| `@sam-ai/api` | `packages/api/` | Route Handlers, Middleware | ✅ Active |
| `@sam-ai/adapter-prisma` | `packages/adapter-prisma/` | Database Integration | ✅ Active |
| `@sam-ai/adapter-taxomind` | `packages/adapter-taxomind/` | Taxomind-specific adapters | ✅ Active |
| `@sam-ai/testing` | `packages/testing/` | Golden test framework | ✅ Available |
| `@sam-ai/external-knowledge` | `packages/external-knowledge/` | Content enrichment | ✅ Available |
| `@sam-ai/realtime` | `packages/realtime/` | WebSocket, Presence | ✅ Active |
| `@sam-ai/sam-engine` | `packages/sam-engine/` | Core engine | ✅ Active |
| `@sam-ai/integration` | `packages/integration/` | Cross-package integration | ✅ Active |

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
| `self-evaluation/` | Confidence scoring, verification | `createConfidenceScorer`, `createResponseVerifier` |
| `meta-learning/` | Pattern recognition, optimization | `createLearningPatternDetector` |
| `observability/` | Telemetry, metrics, quality tracking | `createTelemetryService` |
| `realtime/` | WebSocket, presence, push | `createRealtimeServer`, `createRealtimeClient` |

### 2. `@sam-ai/educational` - Educational Engines (40+)
**Location**: `packages/educational/src/`

**Content & Generation Engines**:
- `ExamEngine` - Exam generation with Blooms alignment
- `EvaluationEngine` - AI-powered answer evaluation
- `ContentGenerationEngine` - Content creation
- `PracticeProblemsEngine` - Practice problem generation
- `AdaptiveContentEngine` - Personalized learning
- `SocraticTeachingEngine` - Guided questioning

**Analysis Engines**:
- `BloomsAnalysisEngine` - Cognitive level analysis
- `UnifiedBloomsEngine` - Unified Blooms processing
- `EnhancedDepthAnalysisEngine` - Content depth analysis
- `PersonalizationEngine` - Learning personalization
- `PredictiveEngine` - Learning predictions

**Specialized Engines**:
- `MicrolearningEngine` - Bite-sized content
- `MetacognitionEngine` - Self-reflection
- `CompetencyEngine` - Skills and competencies
- `PeerLearningEngine` - Collaborative learning
- `IntegrityEngine` - Plagiarism/AI detection
- `MultimodalInputEngine` - Voice, image, handwriting
- `SkillBuildTrackEngine` - 10,000 hour tracking

**Domain Engines**:
- `FinancialEngine` - Financial simulations
- `ResearchEngine` - Academic research
- `MarketEngine` - Career/market integration
- `TrendsEngine` - Industry trends
- `CollaborationEngine` - Team collaboration
- `SocialEngine` - Social learning
- `InnovationEngine` - Innovation lab

### 3. `@sam-ai/react` - React Integration (26 Hooks)
**Location**: `packages/react/src/`

| Hook | Purpose | Dashboard Widget |
|------|---------|------------------|
| `useSAM` | Main SAM integration | SAMAssistant |
| `useSAMChat` | Chat functionality | SAMEnginePoweredChat |
| `useGoals` | Goal management | GoalPlanner |
| `usePlans` | Plan management | PlanControlPanel |
| `useInterventions` | Proactive interventions | UserInterventionsWidget |
| `useSAMPracticeProblems` | Practice problems | PracticeProblemsWidget |
| `useSAMAdaptiveContent` | Adaptive learning | AdaptiveContentWidget |
| `useSAMSocraticDialogue` | Socratic dialogue | SocraticDialogueWidget |
| `useTutoringOrchestration` | Tutoring orchestration | TutoringOrchestrationWidget |
| `useRealtime` | Realtime connection | RealtimeCollaborationWidget |
| `useNotifications` | Notifications | NotificationsWidget |
| `useRecommendations` | Learning recommendations | LearningRecommendationsWidget |
| `usePresence` | User presence | ActiveLearnersWidget |
| `useMemory` | Memory search | MemorySearchPanel |
| `useBehavior` | Behavior patterns | BehaviorPatternsWidget |
| `useProgress` | Progress tracking | ProgressDashboard |
| `useCelebration` | Achievement celebrations | CelebrationOverlay |
| `useToolApproval` | Tool approval flow | ToolApprovalDialog |
| `useLearningGaps` | Gap analysis | LearningGapDashboard |
| `useCheckIn` | Check-in system | CheckInModal |
| `useSkillBuildTrack` | Skill tracking | SkillBuildTracker |
| `usePractice` | Practice sessions | PracticeTimer |
| `useExamEngine` | Exam generation with Bloom's | EnhancedExamCreator |
| `useQuestionBank` | Question bank management | QuestionBankBrowser |
| `useInnovationFeatures` | Innovation features (DNA, Fitness, Buddy) | InnovationDashboard |
| `useMultimodal` | Multimodal input processing | MultimodalUploader |

#### Phase 6 Hooks - Educational Engines (New)

**`useExamEngine`** - Exam generation with Bloom's Taxonomy alignment
```typescript
const {
  isGenerating,
  generatedExam,
  error,
  generateExam,
  getExam,
  getDefaultBloomsDistribution,
} = useExamEngine({
  courseId: 'course-id',
  sectionIds: ['section-1', 'section-2'],
  onExamGenerated: (exam) => console.log('Generated:', exam),
});

// Generate exam with Bloom's distribution
await generateExam({
  totalQuestions: 20,
  timeLimit: 60,
  bloomsDistribution: { REMEMBER: 15, UNDERSTAND: 20, APPLY: 25, ANALYZE: 20, EVALUATE: 15, CREATE: 5 },
  adaptiveMode: true,
});
```

**`useQuestionBank`** - Question bank CRUD operations
```typescript
const {
  questions,
  stats,
  pagination,
  isLoading,
  getQuestions,
  addQuestions,
  deleteQuestion,
  loadMore,
} = useQuestionBank({
  courseId: 'course-id',
  pageSize: 20,
});

// Fetch questions by Bloom's level
await getQuestions({ bloomsLevel: 'APPLY', difficulty: 'MEDIUM' });

// Add questions to bank
await addQuestions([{ text: 'Question text', type: 'MULTIPLE_CHOICE', bloomsLevel: 'UNDERSTAND', difficulty: 'MEDIUM' }]);
```

**`useInnovationFeatures`** - Cognitive Fitness, Learning DNA, Study Buddy AI, Quantum Paths
```typescript
const {
  cognitiveFitness,
  learningDNA,
  studyBuddy,
  quantumPaths,
  assessCognitiveFitness,
  generateLearningDNA,
  createStudyBuddy,
  createQuantumPath,
} = useInnovationFeatures({ autoLoadStatus: true });

// Assess cognitive fitness
const fitness = await assessCognitiveFitness();

// Generate learning DNA
const dna = await generateLearningDNA();

// Create AI study buddy
const buddy = await createStudyBuddy({ type: 'motivator' });

// Create quantum learning path
const path = await createQuantumPath('Master TypeScript');
```

**`useMultimodal`** - Voice, image, handwriting, document processing
```typescript
const {
  isProcessing,
  processedInput,
  error,
  processInput,
  validateInput,
  fileToBase64,
  extractText,
  assessQuality,
} = useMultimodal({
  courseId: 'course-id',
  onProcessingComplete: (result) => console.log('Processed:', result),
});

// Process file
const file = await fileToBase64(inputFile);
const validation = await validateInput(file);
if (validation.isValid) {
  await processInput(file, { enableOCR: true, generateAccessibilityData: true });
}
```

---

## Integration Layer

### Critical Files in `lib/sam/`

```
lib/sam/
├── taxomind-context.ts      # SINGLE ENTRY POINT - All 42+ stores
├── integration-adapters.ts  # Adapter bridge (Core AI + Embeddings)
├── index.ts                 # Main export file (1340+ lines)
├── agentic-bridge.ts        # Main integration bridge (35KB)
├── agentic-tooling.ts       # Tool registry integration (11KB)
├── agentic-memory.ts        # Memory system integration
├── agentic-notifications.ts # Push notifications (14KB)
├── context-gathering-integration.ts  # Context Gathering Engine wiring (see SAM_CONTEXT_GATHERING_ARCHITECTURE.md)
├── agentic-proactive-scheduler.ts  # Proactive interventions (22KB)
├── agentic-vector-search.ts # Vector search integration
├── agentic-knowledge-graph.ts # Knowledge graph (15KB)
├── multi-agent-coordinator.ts # Agent orchestration (35KB)
├── orchestration-integration.ts # Tutoring orchestration (20KB)
├── proactive-intervention-integration.ts # Intervention system (28KB)
├── journey-timeline-service.ts # Learning journey tracking
├── memory-lifecycle-service.ts # Memory reindexing (28KB)
├── prediction-calibration.ts # Confidence calibration (22KB)
├── progress-recorder.ts      # Blooms progress recording (13KB)
├── gamification.ts          # Gamification engine (26KB)
├── utils/
│   └── blooms-normalizer.ts # Blooms level normalization utilities
└── stores/                  # 34 Prisma store adapters
    ├── index.ts             # Store exports
    ├── context-snapshot-store.ts  # Context Gathering snapshot persistence
    ├── prisma-goal-store.ts
    ├── prisma-plan-store.ts
    ├── prisma-behavior-store.ts
    ├── prisma-practice-session-store.ts
    ├── prisma-skill-mastery-10k-store.ts
    ├── prisma-practice-leaderboard-store.ts
    ├── prisma-daily-practice-log-store.ts
    ├── prisma-practice-challenge-store.ts
    ├── prisma-practice-goal-store.ts
    ├── prisma-spaced-repetition-store.ts
    └── ... (33 total store files)
```

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
  getEducationalEngineStores,
  getPracticeStores,
  getPresenceStore,
  getStudentProfileStore,
  getReviewScheduleStore,
  getSpacedRepetitionStore,
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
const { microlearning, metacognition, competency, peerLearning, integrity, multimodal } = getEducationalEngineStores();
const { practiceSession, skillMastery10K, practiceLeaderboard, dailyPracticeLog, practiceChallenge, practiceGoal, spacedRepetition } = getPracticeStores();

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
| `getObservabilityStores()` | 5 telemetry/quality stores | Observability metrics |
| `getAnalyticsStores()` | 6 analytics stores | Learning analytics |
| `getMultiSessionStores()` | `{ learningPlan, tutoringSession, skillBuildTrack }` | Cross-session continuity |
| `getEducationalEngineStores()` | 6 educational engine stores | Educational capabilities |
| `getPracticeStores()` | 7 practice tracking stores | 10,000 hour practice |

---

## Store Categories

### Complete Store List (42+ Stores)

#### 1. Goal Planning Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `goal` | `PrismaGoalStore` | User learning goals |
| `subGoal` | `PrismaSubGoalStore` | Decomposed sub-goals |
| `plan` | `PrismaPlanStore` | Execution plans for goals |

#### 2. Proactive Intervention Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `behaviorEvent` | `BehaviorEventStore` | Track user behavior events |
| `pattern` | `PatternStore` | Detected behavior patterns |
| `intervention` | `InterventionStore` | Triggered interventions |
| `checkIn` | `CheckInStore` | Scheduled check-ins |

#### 3. Memory Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `vector` | `PrismaVectorAdapter` | Vector embeddings for semantic search |
| `knowledgeGraph` | `PrismaKnowledgeGraphStore` | Knowledge graph entities/relationships |
| `sessionContext` | `PrismaSessionContextStore` | Session-specific context |

#### 4. Tool Registry Store
| Store | Interface | Purpose |
|-------|-----------|---------|
| `tool` | `PrismaToolStore` | Registered tools and their definitions |

#### 5. Analytics Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `learningSession` | `PrismaLearningSessionStore` | Learning session data |
| `topicProgress` | `PrismaTopicProgressStore` | Topic-level progress |
| `learningGap` | `PrismaLearningGapStore` | Identified knowledge gaps |
| `skillAssessment` | `PrismaSkillAssessmentStore` | Skill assessments |
| `recommendation` | `PrismaRecommendationStore` | Learning recommendations |
| `content` | `PrismaContentStore` | Content metadata |

#### 6. Learning Path Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `skill` | `PrismaSkillStore` | Skill definitions |
| `learningPath` | `PrismaLearningPathStore` | Learning path structures |
| `courseGraph` | `PrismaCourseGraphStore` | Course prerequisite graphs |

#### 7. Multi-Session Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `learningPlan` | `PrismaLearningPlanStore` | Multi-session learning plans |
| `tutoringSession` | `PrismaTutoringSessionStore` | Cross-session tutoring continuity |
| `skillBuildTrack` | `PrismaSkillBuildTrackStore` | Skill development tracking |

#### 8. Observability Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `toolTelemetry` | `PrismaToolTelemetryStore` | Tool execution metrics |
| `confidenceCalibration` | `PrismaConfidenceCalibrationStore` | AI confidence predictions |
| `memoryQuality` | `PrismaMemoryQualityStore` | Memory retrieval quality |
| `planLifecycle` | `PrismaPlanLifecycleStore` | Plan state transitions |
| `metrics` | `PrismaMetricsStore` | General metrics recording |

#### 9. Self-Evaluation Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `confidenceScore` | `PrismaConfidenceScoreStore` | Confidence scoring records |
| `verificationResult` | `PrismaVerificationResultStore` | Verification outcomes |
| `qualityRecord` | `PrismaQualityRecordStore` | Quality metrics |
| `calibration` | `PrismaCalibrationStore` | Calibration data |
| `selfCritique` | `PrismaSelfCritiqueStore` | Self-critique iterations |

#### 10. Meta-Learning Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `learningPattern` | `PrismaLearningPatternStore` | Detected learning patterns |
| `metaLearningInsight` | `PrismaMetaLearningInsightStore` | Meta-learning insights |
| `learningStrategy` | `PrismaLearningStrategyStore` | Learning strategy recommendations |
| `learningEvent` | `PrismaLearningEventStore` | Learning event history |

#### 11. Educational Engine Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `microlearning` | `PrismaMicrolearningStore` | Microlearning modules |
| `metacognition` | `PrismaMetacognitionStore` | Self-reflection data |
| `competency` | `PrismaCompetencyStore` | Skills and competencies |
| `peerLearning` | `PrismaPeerLearningStore` | Collaborative learning |
| `integrity` | `PrismaIntegrityStore` | Academic integrity |
| `multimodal` | `PrismaMultimodalStore` | Voice/image/handwriting |

#### 12. Practice Tracking Stores (10,000 Hour System)
| Store | Interface | Purpose |
|-------|-----------|---------|
| `practiceSession` | `PrismaPracticeSessionStore` | Practice session tracking |
| `skillMastery10K` | `PrismaSkillMastery10KStore` | Skill mastery progression |
| `practiceLeaderboard` | `PrismaPracticeLeaderboardStore` | Practice leaderboards |
| `dailyPracticeLog` | `PrismaDailyPracticeLogStore` | Daily practice logs |
| `practiceChallenge` | `PrismaPracticeChallengeStore` | Practice challenges |
| `practiceGoal` | `PrismaPracticeGoalStore` | Practice goals |
| `spacedRepetition` | `PrismaSpacedRepetitionStore` | SM-2 review scheduling |

#### 13. Additional Stores
| Store | Interface | Purpose |
|-------|-----------|---------|
| `journeyTimeline` | `PrismaJourneyTimelineStore` | Learning journey timeline |
| `presence` | `PrismaPresenceStore` | Realtime user presence |
| `studentProfile` | `PrismaStudentProfileStore` | Student mastery profiles |
| `reviewSchedule` | `PrismaReviewScheduleStore` | Spaced repetition scheduling |
| `pushQueue` | `PrismaPushQueueStore` | Push notification queue |

---

## Dashboard Integration Status

### NewDashboard.tsx - Complete Integration

The main dashboard (`app/dashboard/user/_components/NewDashboard.tsx`) integrates **60+ SAM components** across 5 views:

#### View 1: Learning (Default)
- SAMContextTracker (context sync)
- SAMQuickActionsSafe (quick actions)
- SpacedRepetitionCalendar (review scheduling)
- RecommendationWidget (AI recommendations)
- ContextualHelpWidget (smart help)
- MicrolearningWidget (bite-sized learning)
- PredictiveInsights (learning predictions)
- MetaLearningInsightsWidget (pattern recognition)
- LearningPathWidget (personalized paths)
- PrerequisiteTreeView (prerequisite visualization)
- LearningPathTimeline (progress timeline)
- CognitiveLoadMonitor (mental workload)
- CheckInHistory (proactive check-ins)
- StudyBuddyFinder (peer matching)
- ActiveLearnersWidget (presence awareness)
- PeerLearningHub (collaborative learning)
- LearningPathOptimizer (path optimization)
- MetacognitionPanel (self-reflection)
- BehaviorPatternsWidget (behavior analysis)
- MemorySearchPanel (memory search)
- TrendsExplorer (industry trends)
- CareerProgressWidget (career integration)
- AccessibilityMetricsWidget (accessibility)
- DiscouragingLanguageAlert (safety)
- SocialLearningFeed (social engagement)
- CollaborationSpace (collaborative workspace)
- SocraticDialogueWidget (guided questioning)
- AdaptiveContentWidget (personalized learning)
- PracticeProblemsWidget (practice problems)
- TutoringOrchestrationWidget (tutoring)
- RealtimeCollaborationWidget (realtime status)
- UserInterventionsWidget (proactive alerts)
- NotificationsWidget (notifications)
- LearningRecommendationsWidget (recommendations)
- SAMAssistantWrapper (conversational AI)
- ToolApprovalDialog (tool approvals)
- CelebrationOverlay (achievements)

#### View 2: Skills
- SkillBuildTrackerConnected (skill tracking)
- KnowledgeGraphBrowser (skill relationships)
- QualityScoreDashboard (content quality)
- BiasDetectionReport (fairness analysis)
- ResearchAssistant (academic research)
- IntegrityChecker (academic integrity)

#### View 3: Practice (10,000 Hour System)
- PracticeStreakDisplay (streaks)
- PracticeTimer (main timer)
- PomodoroTimer (pomodoro)
- PracticeRecommendations (SAM recommendations)
- PracticeGoalSetter (goal setting)
- PracticeCalendarHeatmap (activity heatmap)
- PracticeLeaderboard (leaderboards)
- MilestoneTimeline (milestones)

#### View 4: Gamification
- LevelProgressBar (XP/levels)
- StreakWidget (streaks)
- AchievementsWidget (achievements)
- AchievementBadges (SAM badges)
- LeaderboardWidget (leaderboards)
- SAMLeaderboardWidget (SAM leaderboard)
- CompetencyDashboard (competencies)
- ConfidenceCalibrationWidget (confidence)

#### View 5: Gaps
- LearningGapDashboard (gap analysis)
- GapOverviewWidget (overview)
- SkillDecayTracker (decay tracking)
- TrendAnalysisChart (trends)
- PersonalizedRecommendations (recommendations)
- ComparisonView (comparisons)

---

## API Routes Structure

### SAM API Routes Map (232 Routes)

```
app/api/sam/
├── context/route.ts           # Context Gathering snapshot submission
├── unified/
│   ├── route.ts              # Main unified SAM endpoint (uses context snapshots)
│   └── stream/route.ts       # Streaming responses (uses context snapshots)
├── agentic/
│   ├── goals/                # Goal management
│   ├── plans/                # Plan management
│   ├── tools/                # Tool registry
│   ├── events/               # Behavior events
│   ├── behavior/             # Behavior tracking
│   ├── analytics/            # Analytics, predictions, trends
│   ├── collaboration/        # Collaboration sessions
│   ├── social/               # Social feed and challenges
│   ├── journey/              # Learning journey
│   └── recommendations/      # Recommendations
├── ai-tutor/
│   ├── chat/                 # AI tutoring chat
│   ├── assessment-engine/    # Assessments
│   ├── content-analysis/     # Content analysis
│   ├── practice-problems/    # Practice problems
│   ├── adaptive-content/     # Adaptive content
│   ├── socratic/             # Socratic dialogue
│   └── ... (20+ routes)
├── practice/
│   ├── sessions/             # Practice sessions
│   ├── mastery/              # Skill mastery
│   ├── leaderboard/          # Leaderboards
│   ├── heatmap/              # Calendar heatmap
│   ├── milestones/           # Milestones
│   └── recommendations/      # Practice recommendations
├── learning-gap/
│   ├── gaps/                 # Gap management
│   ├── recommendations/      # Gap recommendations
│   ├── trends/               # Trend analysis
│   └── comparison/           # Comparisons
├── blooms-analysis/          # Blooms Taxonomy
├── pedagogy/                 # Pedagogical analysis
├── quality/                  # Quality validation
├── memory/                   # Memory operations
├── knowledge/                # Knowledge graph
├── competency/               # Competency framework
├── peer-matching/            # Peer learning
├── feedback/                 # User feedback
└── ... (200+ more routes)
```

### Cron Routes

| Cron Route | Schedule | Purpose |
|------------|----------|---------|
| `sam-memory-lifecycle` | Every 6 hours | Memory reindexing and cleanup |
| `sam-checkins` | Every hour | Process pending check-ins |
| `sam-analytics-rollups` | Daily | Aggregate analytics data |
| `sam-proactive` | Every 15 min | Schedule proactive interventions |

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
  type Plan,
  type BehaviorEvent,
} from '@sam-ai/agentic';

// ✅ CORRECT - Import store types from taxomind-context
import {
  type PrismaGoalStore,
  type PrismaPlanStore,
} from '@/lib/sam/taxomind-context';
```

### Rule 3: Use Package Factories for Business Logic

```typescript
// ✅ CORRECT - Use package factories
import {
  createGoalDecomposer,
  createBehaviorMonitor,
  createCheckInScheduler,
} from '@sam-ai/agentic';

// Pass stores from TaxomindContext
const proactiveStores = getProactiveStores();
const behaviorMonitor = createBehaviorMonitor({
  eventStore: proactiveStores.behaviorEvent,
  patternStore: proactiveStores.pattern,
  interventionStore: proactiveStores.intervention,
  logger,
});
```

### Rule 4: Use Blooms Normalizer for Taxonomy Operations

```typescript
// ✅ CORRECT - Use blooms-normalizer for Bloom's level handling
import {
  normalizeToUppercase,
  normalizeToUppercaseSafe,
  normalizeToLowercase,
  isValidBloomsLevel,
  getBloomsHierarchyIndex,
} from '@/lib/sam/utils/blooms-normalizer';

// Normalize user input to Prisma format
const prismaLevel = normalizeToUppercaseSafe(userInput, 'UNDERSTAND');

// Normalize for frontend display
const displayLevel = normalizeToLowercase('ANALYZE'); // 'analyze'
```

### Rule 5: Follow Integration Bridge Pattern

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

  const { stores } = getTaxomindContext();
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

### Rule 6: Export from lib/sam/index.ts

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

    const exampleStore = getStore('goal');
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

### Pattern 2: React Hook Integration

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

| File | Purpose | Size |
|------|---------|------|
| `lib/sam/taxomind-context.ts` | **SINGLE ENTRY POINT** for all 42+ stores | 771 lines |
| `lib/sam/index.ts` | Main export aggregator | 1340+ lines |
| `lib/sam/agentic-bridge.ts` | Main integration bridge | 35KB |
| `lib/sam/agentic-tooling.ts` | Tool registry integration | 11KB |
| `lib/sam/agentic-notifications.ts` | Push notifications | 14KB |
| `lib/sam/agentic-proactive-scheduler.ts` | Proactive interventions | 22KB |
| `lib/sam/multi-agent-coordinator.ts` | Agent orchestration | 35KB |
| `lib/sam/orchestration-integration.ts` | Tutoring orchestration | 20KB |
| `lib/sam/memory-lifecycle-service.ts` | Memory reindexing | 28KB |
| `lib/sam/progress-recorder.ts` | Blooms progress recording | 13KB |
| `lib/sam/context-gathering-integration.ts` | Context Gathering Engine wiring | 10KB |
| `lib/sam/stores/context-snapshot-store.ts` | Prisma store for page snapshots | 3KB |
| `lib/sam/utils/blooms-normalizer.ts` | Blooms level normalization | 10KB |
| `lib/adapters/adaptive-content-adapter.ts` | AdaptiveContentEngine database adapter | 6KB |
| `lib/adapters/social-engine-adapter.ts` | SocialEngine database adapter | 7KB |
| `lib/adapters/knowledge-graph-engine-adapter.ts` | KnowledgeGraphEngine database adapter | 10KB |

### Store Files (33 Total)

| File | Stores Provided |
|------|-----------------|
| `prisma-goal-store.ts` | `PrismaGoalStore` |
| `prisma-subgoal-store.ts` | `PrismaSubGoalStore` |
| `prisma-plan-store.ts` | `PrismaPlanStore` |
| `prisma-behavior-store.ts` | `PrismaBehaviorEventStore` |
| `prisma-practice-session-store.ts` | `PrismaPracticeSessionStore` |
| `prisma-skill-mastery-10k-store.ts` | `PrismaSkillMastery10KStore` |
| `prisma-practice-leaderboard-store.ts` | `PrismaPracticeLeaderboardStore` |
| `prisma-daily-practice-log-store.ts` | `PrismaDailyPracticeLogStore` |
| `prisma-practice-challenge-store.ts` | `PrismaPracticeChallengeStore` |
| `prisma-practice-goal-store.ts` | `PrismaPracticeGoalStore` |
| `prisma-spaced-repetition-store.ts` | `PrismaSpacedRepetitionStore` |
| ... | (33 total store files) |

### Component Files

| File | Purpose | Size |
|------|---------|------|
| `components/sam/SAMAssistant.tsx` | Conversational AI | 176KB |
| `components/sam/index.ts` | Component exports | 447 lines |
| `components/sam/KnowledgeGraphBrowser.tsx` | Knowledge graph | 33KB |
| `components/sam/SpacedRepetitionCalendar.tsx` | Review scheduling | 29KB |
| `components/sam/SAMQuickActions.tsx` | Quick actions | 26KB |

---

## Launch Readiness Status

### ✅ READY FOR PRIMARY LAUNCH

| Category | Status | Details |
|----------|--------|---------|
| **Architecture** | ✅ Complete | Proper agentic structure with TaxomindContext |
| **Package Integration** | ✅ Complete | 16 packages fully integrated |
| **Store System** | ✅ Complete | 42+ stores initialized and accessible |
| **API Routes** | ✅ Complete | 232 routes active |
| **React Components** | ✅ Complete | 122 components available |
| **React Hooks** | ✅ Complete | 22/22 hooks connected |
| **Dashboard** | ✅ Complete | 60+ widgets across 5 views |
| **Educational Engines** | ✅ Complete | 40+ engines available |
| **Practice System** | ✅ Complete | 10,000 hour tracking active |
| **Build Status** | ✅ Passing | No errors |

### Gap Analysis - All Resolved

| Gap | Status | Resolution |
|-----|--------|------------|
| GAP 1: Hidden Capabilities | ✅ Fixed | BiasDetectionReport, MetacognitionPanel, etc. exposed |
| GAP 2: Underutilized Hooks | ✅ Fixed | All 22/22 hooks now connected |
| GAP 3: Orphaned Components | ✅ Fixed | CelebrationOverlay, ToolApprovalDialog integrated |

### Minor Post-Launch Recommendations

1. **Optional**: Install `firebase-admin` for push notifications
2. **Optional**: Add SAM widgets to course learning page
3. **Optional**: Create admin dashboard for observability metrics

---

## Realtime Infrastructure

### Overview

SAM provides real-time communication infrastructure for:
- **Presence Tracking**: User online/offline/idle status
- **Push Delivery**: Real-time intervention and notification delivery
- **SSE Fallback**: Server-Sent Events for environments without WebSocket support

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

---

## External Knowledge Integration

### Overview

SAM integrates external knowledge sources for enriching educational content:
- **News**: Real-time AI/education news from NewsAPI.org
- **Research**: Academic papers from Semantic Scholar
- **Documentation**: Technical docs from DevDocs and MDN

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

---

## Educational Engine API Integration

### Research & Trends APIs

| Route | Method | Component | Purpose |
|-------|--------|-----------|---------|
| `/api/sam/ai-research` | GET | `ResearchAssistant.tsx` | Academic paper search via ResearchEngine |
| `/api/sam/agentic/analytics/trends` | GET | `TrendsExplorer.tsx` | Industry trends and skill demand |

### Course Analysis APIs (Teacher Dashboard)

| Route | Method | Component | Purpose |
|-------|--------|-----------|---------|
| `/api/sam/course-guide/recommendations` | POST | SAM Analysis Page | Detailed AI recommendations for course improvement |
| `/api/sam/course-market-analysis/competitors` | GET/POST/DELETE | SAM Analysis Page | Competitor course tracking and analysis |
| `/api/sam/course-guide` | GET/POST | SAM Analysis Page | Course guide generation and export |
| `/api/sam/course-market-analysis` | POST | SAM Analysis Page | Market positioning analysis |
| `/api/sam/blooms-analysis` | POST | SAM Analysis Page | Bloom&apos;s Taxonomy cognitive analysis |
| `/api/sam/integrated-analysis` | GET/POST | SAM Analysis Page | Comprehensive integrated analysis |

### Exam System APIs

| Route | Method | Purpose | Notes |
|-------|--------|---------|-------|
| `/api/exams/evaluate` | POST | AI-powered exam evaluation | For enhanced exam system with essay/subjective questions |
| `/api/exams/sam-assist` | POST | SAM AI grading assistance | Teacher grading support |
| `/api/exams/grading-queue` | GET/POST/PATCH | Grading queue management | Manual grading workflow |
| `/api/exams/results/[attemptId]` | GET | Exam results retrieval | Student exam results |
| `/api/exams/generate-questions` | POST | AI question generation | Bloom&apos;s-aligned question generation |

### Adaptive Content Engine API Integration

The `AdaptiveContentEngine` from `@sam-ai/educational` is now fully integrated with a portable adapter pattern:

**Adapter**: `lib/adapters/adaptive-content-adapter.ts`
- Implements `AdaptiveContentDatabaseAdapter` interface from `@sam-ai/educational`
- Uses Prisma for database operations
- Singleton pattern via `getAdaptiveContentAdapter()`

**API Routes**:

| Route | Method | Purpose | Hook |
|-------|--------|---------|------|
| `/api/sam/adaptive-content` | GET/POST | Main endpoint (status, actions) | `useSAMAdaptiveContent` |
| `/api/sam/adaptive-content/profile` | GET/POST | Get/create learner profile | `useSAMAdaptiveContent` |
| `/api/sam/adaptive-content/profile/update` | POST | Update learner profile preferences | `useSAMAdaptiveContent` |
| `/api/sam/adaptive-content/detect-style` | POST | Detect learning style from interactions | `useSAMAdaptiveContent` |
| `/api/sam/adaptive-content/adapt` | POST | Adapt content for learner&apos;s style | `useSAMAdaptiveContent` |
| `/api/sam/adaptive-content/interaction` | POST | Record content interactions | `useSAMAdaptiveContent` |
| `/api/sam/adaptive-content/recommendations` | POST | Get content recommendations | `useSAMAdaptiveContent` |

**Integration Pattern**:
```typescript
// API Route Pattern - Engine singleton with adapter
import { createAdaptiveContentEngine } from '@sam-ai/educational';
import { getAdaptiveContentAdapter, getSAMConfig } from '@/lib/adapters';

let engineInstance: AdaptiveContentEngine | null = null;

function getEngine(): AdaptiveContentEngine {
  if (!engineInstance) {
    const samConfig = getSAMConfig();
    engineInstance = createAdaptiveContentEngine({
      database: getAdaptiveContentAdapter(),
      aiAdapter: samConfig.ai,
      enableCaching: true,
      minInteractionsForAdaptation: 5,
    });
  }
  return engineInstance;
}
```

**Features**:
- VARK Learning Style Detection (visual, auditory, reading, kinesthetic, multimodal)
- Content adaptation based on learner profile
- Style-based recommendations
- Interaction tracking for profile building
- Content caching for performance

### Social Engine API Integration

The `SocialEngine` from `@sam-ai/educational` is now fully integrated with a portable adapter pattern:

**Adapter**: `lib/adapters/social-engine-adapter.ts`
- Implements `SocialDatabaseAdapter` interface from `@sam-ai/educational`
- Uses Prisma for database operations with `SAMSocialAnalytics` model
- Singleton pattern via `getSocialEngineAdapter()`

**API Routes**:

| Route | Method | Purpose | Description |
|-------|--------|---------|-------------|
| `/api/sam/social-engine` | GET/POST | Main endpoint | Engine status, execute actions |
| `/api/sam/social-engine/effectiveness` | POST | Group effectiveness | Measure collaboration effectiveness |
| `/api/sam/social-engine/engagement` | POST | Community engagement | Analyze engagement metrics |
| `/api/sam/social-engine/knowledge-sharing` | POST | Knowledge sharing | Evaluate knowledge sharing impact |
| `/api/sam/social-engine/mentor-matching` | POST | Mentor matching | Match mentors with mentees |
| `/api/sam/social-engine/dynamics` | POST | Group dynamics | Assess group dynamics |

**Integration Pattern**:
```typescript
// API Route Pattern - Engine singleton with adapter
import { createSocialEngine } from '@sam-ai/educational';
import type { SocialEngine } from '@sam-ai/educational';
import { getSocialEngineAdapter } from '@/lib/adapters';

let engineInstance: SocialEngine | null = null;

function getEngine(): SocialEngine {
  if (!engineInstance) {
    engineInstance = createSocialEngine({
      databaseAdapter: getSocialEngineAdapter(),
    });
  }
  return engineInstance;
}
```

**Features**:
- Collaboration effectiveness measurement with knowledgeSharing, peerSupport, collaborativeLearning, communityBuilding metrics
- Community engagement analysis with participation rate, interaction frequency, content contribution tracking
- Knowledge sharing impact evaluation with learning outcomes and network effects
- Mentor-mentee matching using database adapter for learning profiles
- Group dynamics assessment with leadership, communication, conflict analysis
- Automatic sentiment analysis for interactions

**Database Model**: `SAMSocialAnalytics` stores analysis results by type (effectiveness, engagement, sharing_impact, mentor_match, dynamics).

### Knowledge Graph Engine API Integration

The `KnowledgeGraphEngine` from `@sam-ai/educational` is now fully integrated with a portable adapter pattern:

**Adapter**: `lib/adapters/knowledge-graph-engine-adapter.ts`
- Implements `KnowledgeGraphDatabaseAdapter` interface for concept, relation, graph, and mastery storage
- Uses Prisma for database operations with 4 new models
- Singleton pattern via `getKnowledgeGraphEngineAdapter()`

**Database Models**:
- `SAMKnowledgeConcept` - Stores extracted concepts with type, Bloom&apos;s level, keywords
- `SAMConceptRelation` - Stores concept relationships (prerequisite, supports, extends, etc.)
- `SAMKnowledgeGraph` - Stores graph metadata, stats, and quality assessments
- `SAMConceptMastery` - Tracks user mastery progress for each concept

**API Routes**:

| Route | Method | Purpose | Description |
|-------|--------|---------|-------------|
| `/api/sam/knowledge-graph-engine` | GET/POST | Main endpoint | Engine status, actions |
| `/api/sam/knowledge-graph-engine/extract-concepts` | POST | Concept extraction | Extract concepts from content |
| `/api/sam/knowledge-graph-engine/analyze-course` | POST | Course analysis | Build knowledge graph for course |
| `/api/sam/knowledge-graph-engine/prerequisites` | POST | Prerequisites | Analyze prerequisites for concept |
| `/api/sam/knowledge-graph-engine/learning-path` | POST | Learning path | Generate optimal learning path |
| `/api/sam/knowledge-graph-engine/mastery` | GET/POST | Mastery tracking | Get/update concept mastery |
| `/api/sam/knowledge-graph-engine/graph` | GET/DELETE | Graph management | Retrieve or delete graph |

**Integration Pattern**:
```typescript
// API Route Pattern - Engine singleton with SAMConfig
import { createKnowledgeGraphEngine } from '@sam-ai/educational';
import type { KnowledgeGraphEngine } from '@sam-ai/educational';
import { getSAMConfig, getKnowledgeGraphEngineAdapter } from '@/lib/adapters';

let engineInstance: KnowledgeGraphEngine | null = null;

function getEngine(): KnowledgeGraphEngine {
  if (!engineInstance) {
    const samConfig = getSAMConfig();
    engineInstance = createKnowledgeGraphEngine({
      samConfig,
      enableAIExtraction: true,
      confidenceThreshold: 0.7,
      maxPrerequisiteDepth: 10,
    });
  }
  return engineInstance;
}
```

**Features**:
- AI-powered concept extraction from educational content
- Automatic relationship detection (prerequisite, supports, extends, related, contrasts)
- Course structure quality analysis with scoring and recommendations
- Prerequisite chain analysis with gap detection
- Personalized learning path generation with multiple strategies (fastest, thorough, balanced)
- Concept mastery tracking with evidence-based level progression
- Bloom&apos;s Taxonomy and concept type classification

**Note**: This is separate from `/api/sam/knowledge-graph/` which uses the agentic knowledge graph manager from `@sam-ai/agentic` for entity-based graph traversal.

### Teacher SAM Analysis Page Integration

The teacher SAM analysis page (`app/(protected)/teacher/courses/[courseId]/sam-analysis/page.tsx`) integrates:

1. **Dashboard Tab**: SAMAnalyticsDashboard component
2. **Market Analysis Tab**:
   - Market insights (value, growth rate, optimal price, position)
   - Competitor management (add, view, delete competitors)
3. **Bloom&apos;s Analysis Tab**: Cognitive balance and depth analysis
4. **Course Guide Tab**: Content depth, engagement, market acceptance metrics
5. **Recommendations Tab**:
   - Integrated recommendations from analysis engines
   - AI-powered detailed recommendations with priority levels:
     - 🚨 Immediate Actions (critical)
     - ⚡ High Priority
     - 📋 Medium Priority
     - 🎯 Long Term Goals

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-08 | Initial architecture documentation |
| 1.1.0 | 2025-01-10 | Added observability, presence, student profile stores |
| 1.2.0 | 2026-01-10 | Added realtime infrastructure and external knowledge |
| 2.0.0 | 2026-01-17 | Comprehensive analysis update with full utilization status, 42+ stores, 232 routes, 122 components, all gaps resolved |
| 2.1.0 | 2026-01-17 | Added Educational Engine API Integration section, documented previously unconnected APIs (ResearchAssistant, competitor management, course recommendations, exam evaluation) |
| 2.2.0 | 2026-01-17 | Added AdaptiveContentEngine full integration with portable adapter pattern, 7 new API routes, VARK learning style detection |
| 2.3.0 | 2026-01-17 | Added SocialEngine full integration with portable adapter pattern, 6 new API routes (effectiveness, engagement, knowledge-sharing, mentor-matching, dynamics) |
| 2.4.0 | 2026-01-17 | Added KnowledgeGraphEngine full integration with portable adapter pattern, 7 new API routes (extract-concepts, analyze-course, prerequisites, learning-path, mastery, graph), 4 new Prisma models |
| 2.5.0 | 2026-02-01 | Added Context Gathering Engine references (integration file, snapshot store, context API route). See SAM_CONTEXT_GATHERING_ARCHITECTURE.md for full details |

---

**Last Updated**: February 1, 2026
**Maintainer**: Taxomind Development Team
**Build Status**: ✅ Passing
