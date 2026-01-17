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

### 3. `@sam-ai/react` - React Integration (22 Hooks)
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
└── stores/                  # 33 Prisma store adapters
    ├── index.ts             # Store exports
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
├── unified/
│   ├── route.ts              # Main unified SAM endpoint
│   └── stream/route.ts       # Streaming responses
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
| `lib/sam/utils/blooms-normalizer.ts` | Blooms level normalization | 10KB |

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

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-08 | Initial architecture documentation |
| 1.1.0 | 2025-01-10 | Added observability, presence, student profile stores |
| 1.2.0 | 2026-01-10 | Added realtime infrastructure and external knowledge |
| 2.0.0 | 2026-01-17 | Comprehensive analysis update with full utilization status, 42+ stores, 232 routes, 122 components, all gaps resolved |

---

**Last Updated**: January 17, 2026
**Maintainer**: Taxomind Development Team
**Build Status**: ✅ Passing
