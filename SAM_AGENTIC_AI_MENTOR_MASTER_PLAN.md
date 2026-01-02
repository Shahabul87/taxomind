# SAM Agentic AI Mentor - Comprehensive Master Plan

**Version**: 1.0.0
**Created**: December 2024
**Status**: Strategic Planning Complete
**Scope**: Transform SAM from Reactive AI Tutor to Autonomous Agentic Mentor

---

## Executive Summary

This document provides a comprehensive implementation plan to transform SAM (Smart Adaptive Mentor) from a reactive AI tutoring system into a fully autonomous agentic AI mentor capable of:

- **Proactive intervention** - Initiating conversations, not just responding
- **Autonomous goal planning** - Breaking complex learning journeys into actionable steps
- **Tool execution** - Taking actions on behalf of students with proper permissions
- **Long-term memory** - Cross-session context with vector store and knowledge graph
- **Self-improvement** - Learning from teaching outcomes to improve strategies
- **Real-time collaboration** - WebSocket-based live mentoring and presence

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Target State Vision](#target-state-vision)
3. [Architecture Design](#architecture-design)
4. [Implementation Phases](#implementation-phases)
5. [Package Structure](#package-structure)
6. [Database Schema Additions](#database-schema-additions)
7. [API Endpoints](#api-endpoints)
8. [Testing Strategy](#testing-strategy)
9. [Reliability and Operations](#reliability-and-operations)
10. [Success Metrics](#success-metrics)
11. [Risk Mitigation](#risk-mitigation)
12. [Timeline and Milestones](#timeline-and-milestones)

---

## Current State Assessment

### What SAM Has Today (10 Packages, 40+ Engines)

| Package | Engines | Status |
|---------|---------|--------|
| `@sam-ai/core` | Orchestrator, StateMachine, 6 Core Engines | ✅ Production |
| `@sam-ai/educational` | 40+ specialized engines | ✅ Production |
| `@sam-ai/memory` | MasteryTracker, SpacedRepetition, Pathways | ✅ Production |
| `@sam-ai/pedagogy` | Blooms, Scaffolding, ZPD | ✅ Production |
| `@sam-ai/safety` | Bias, Fairness, Accessibility | ✅ Production |
| `@sam-ai/quality` | 6 Quality Gates | ✅ Production |
| `@sam-ai/react` | 11+ Hooks, Provider | ✅ Production |
| `@sam-ai/api` | Route Handlers, Middleware | ✅ Production |
| `@sam-ai/adapter-prisma` | Database Integration | ✅ Production |

### Current Capabilities
- ✅ Bloom's Taxonomy analysis (AI-powered)
- ✅ Content generation and assessment creation
- ✅ Spaced repetition scheduling (SM-2)
- ✅ Mastery tracking (5 levels)
- ✅ Form auto-detection and smart fill
- ✅ Gamification (XP, badges, streaks)
- ✅ Streaming responses (SSE)
- ✅ 100+ API endpoints
- ✅ Socratic dialogue engine
- ✅ Multimodal input analysis

### Critical Gaps for Agentic AI

| Gap Category | Missing Capability | Priority |
|--------------|-------------------|----------|
| **Agency** | Autonomous goal planning with resumable state | 🔴 Critical |
| **Agency** | Task decomposition and step-by-step execution | 🔴 Critical |
| **Tools** | Tool registry with permissioned actions | 🔴 Critical |
| **Tools** | Audit logging for agent actions | 🔴 Critical |
| **Memory** | Vector store for semantic search | 🔴 Critical |
| **Memory** | Knowledge graph integration | 🔴 Critical |
| **Memory** | Cross-session context preservation | 🔴 Critical |
| **Proactive** | Agent-initiated check-ins and interventions | 🔴 Critical |
| **Proactive** | Multi-session learning plan tracking | 🔴 Critical |
| **Self-Eval** | Confidence scoring on responses | 🟡 Important |
| **Self-Eval** | Source citation and verification | 🟡 Important |
| **Ops** | WebSocket for real-time presence | 🟡 Important |
| **Ops** | Multi-provider model routing | 🟡 Important |
| **Ops** | External knowledge integrations | 🟡 Important |
| **Ops** | Golden tests and regression suite | 🟡 Important |

---

## Target State Vision

### The Agentic SAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AGENTIC LAYER (NEW)                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     GOAL PLANNING SYSTEM                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │Goal Decomp  │  │Plan Builder │  │State Machine (Resumable)│ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     TOOL EXECUTION LAYER                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │   │
│  │  │Tool Registry│  │ Permission  │  │Audit Logger │             │   │
│  │  │             │  │   Manager   │  │             │             │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     LONG-TERM MEMORY                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │Vector Store │  │Knowledge    │  │Cross-Session Context    │ │   │
│  │  │(Embeddings) │  │Graph        │  │Manager                  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     PROACTIVE INTERVENTION                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │Behavior     │  │Intervention │  │Notification Manager     │ │   │
│  │  │Monitor      │  │Trigger      │  │(Push/Email/In-App)      │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     SELF-EVALUATION                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │   │
│  │  │Confidence   │  │Source       │  │Rubric Verification      │ │   │
│  │  │Scorer       │  │Tracer       │  │Before Delivery          │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                    EXISTING SAM ORCHESTRATOR                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Context → Blooms → Content → Assessment → Personalization      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────┤
│                    SPECIALIZED ENGINES (40+)                            │
│  Educational • Memory • Pedagogy • Safety • Quality                     │
├─────────────────────────────────────────────────────────────────────────┤
│                    RELIABILITY & OPS LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │WebSocket/   │  │Model Router │  │External     │  │Golden Tests │   │
│  │Presence     │  │& Fallback   │  │Knowledge    │  │& Regression │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Design

### New Package: `@sam-ai/agentic`

This is the core package that transforms SAM into an autonomous agent.

```typescript
// packages/agentic/src/index.ts

// ============================================================================
// GOAL PLANNING SYSTEM
// ============================================================================

export {
  // Goal decomposition
  GoalDecomposer,
  createGoalDecomposer,

  // Plan building
  PlanBuilder,
  createPlanBuilder,

  // Resumable state machine
  AgentStateMachine,
  createAgentStateMachine,

  // Step executor
  StepExecutor,
  createStepExecutor,

  // Plan persistence
  PlanStore,
  createPlanStore,
} from './goal-planning';

export type {
  LearningGoal,
  GoalDecomposition,
  SubGoal,
  ExecutionPlan,
  PlanStep,
  StepStatus,
  PlanState,
  ResumableState,
} from './goal-planning';

// ============================================================================
// TOOL EXECUTION LAYER
// ============================================================================

export {
  // Tool registry
  ToolRegistry,
  createToolRegistry,

  // Permission manager
  PermissionManager,
  createPermissionManager,

  // Tool executor with sandbox
  ToolExecutor,
  createToolExecutor,

  // Audit logger
  AuditLogger,
  createAuditLogger,

  // User confirmation
  ConfirmationManager,
  createConfirmationManager,
} from './tool-execution';

export type {
  Tool,
  ToolDefinition,
  ToolPermission,
  ToolExecution,
  AuditLogEntry,
  ConfirmationRequest,
  ConfirmationResponse,
} from './tool-execution';

// ============================================================================
// LONG-TERM MEMORY
// ============================================================================

export {
  // Vector store
  VectorStore,
  createVectorStore,

  // Knowledge graph manager
  KnowledgeGraphManager,
  createKnowledgeGraphManager,

  // Cross-session context
  CrossSessionContext,
  createCrossSessionContext,

  // Memory retriever (RAG)
  MemoryRetriever,
  createMemoryRetriever,

  // Student journey timeline
  JourneyTimeline,
  createJourneyTimeline,
} from './long-term-memory';

export type {
  Embedding,
  VectorSearchResult,
  KnowledgeNode,
  KnowledgeEdge,
  SessionContext,
  JourneyEvent,
  JourneyMilestone,
} from './long-term-memory';

// ============================================================================
// PROACTIVE INTERVENTION
// ============================================================================

export {
  // Behavior monitor
  BehaviorMonitor,
  createBehaviorMonitor,

  // Intervention trigger
  InterventionTrigger,
  createInterventionTrigger,

  // Notification manager
  NotificationManager,
  createNotificationManager,

  // Check-in scheduler
  CheckInScheduler,
  createCheckInScheduler,

  // Multi-session plan tracker
  MultiSessionPlanTracker,
  createMultiSessionPlanTracker,
} from './proactive-intervention';

export type {
  BehaviorPattern,
  InterventionRule,
  InterventionType,
  Notification,
  NotificationChannel,
  CheckIn,
  MultiSessionPlan,
  DailyPracticeSchedule,
} from './proactive-intervention';

// ============================================================================
// SELF-EVALUATION
// ============================================================================

export {
  // Confidence scorer
  ConfidenceScorer,
  createConfidenceScorer,

  // Source tracer
  SourceTracer,
  createSourceTracer,

  // Rubric verifier
  RubricVerifier,
  createRubricVerifier,

  // Self-critique loop
  SelfCritiqueLoop,
  createSelfCritiqueLoop,

  // Teaching effectiveness tracker
  EffectivenessTracker,
  createEffectivenessTracker,
} from './self-evaluation';

export type {
  ConfidenceScore,
  ConfidenceLevel,
  SourceCitation,
  RubricCheck,
  CritiqueResult,
  EffectivenessMetric,
} from './self-evaluation';

// ============================================================================
// MULTI-AGENT COORDINATION
// ============================================================================

export {
  // Agent coordinator
  AgentCoordinator,
  createAgentCoordinator,

  // Specialized agents
  TeacherAgent,
  SocraticAgent,
  DebuggerAgent,
  CausalAgent,
  MotivationalAgent,

  // Conflict resolver
  ConflictResolver,
  createConflictResolver,
} from './multi-agent';

export type {
  Agent,
  AgentRole,
  AgentMessage,
  CoordinationProtocol,
  ConflictResolution,
} from './multi-agent';
```

### New Package: `@sam-ai/realtime`

For WebSocket and real-time capabilities.

```typescript
// packages/realtime/src/index.ts

export {
  // WebSocket manager
  WebSocketManager,
  createWebSocketManager,

  // Presence system
  PresenceManager,
  createPresenceManager,

  // Live collaboration
  LiveCollaborationEngine,
  createLiveCollaborationEngine,

  // Real-time sync
  RealTimeSync,
  createRealTimeSync,
} from './realtime';

export type {
  WebSocketConnection,
  PresenceState,
  CollaborationSession,
  SyncEvent,
} from './realtime';
```

### New Package: `@sam-ai/knowledge`

For external knowledge integrations.

```typescript
// packages/knowledge/src/index.ts

export {
  // External source integrations
  NewsIntegration,
  ResearchIntegration,
  TrendsIntegration,

  // Knowledge freshness manager
  FreshnessManager,
  createFreshnessManager,

  // Source aggregator
  SourceAggregator,
  createSourceAggregator,
} from './external-knowledge';

export type {
  ExternalSource,
  SourceConfig,
  FreshnessPolicy,
  AggregatedKnowledge,
} from './external-knowledge';
```

---

## Implementation Phases

### Phase A: Agentic Core (Weeks 1-8)

**Goal**: Enable autonomous goal tracking, task decomposition, and step-by-step planning with resumable state.

#### A.1 Goal Planning System (Weeks 1-3)

```typescript
// Goal decomposition engine
interface GoalDecomposer {
  decompose(goal: LearningGoal): Promise<GoalDecomposition>;
  validateDecomposition(decomposition: GoalDecomposition): ValidationResult;
  estimateEffort(decomposition: GoalDecomposition): EffortEstimate;
}

interface LearningGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  context: {
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    currentMastery?: MasteryLevel;
    targetMastery?: MasteryLevel;
  };
}

interface GoalDecomposition {
  goalId: string;
  subGoals: SubGoal[];
  dependencies: DependencyGraph;
  estimatedDuration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
}

interface SubGoal {
  id: string;
  parentGoalId: string;
  title: string;
  type: 'learn' | 'practice' | 'assess' | 'review';
  estimatedMinutes: number;
  prerequisites: string[];
  successCriteria: string[];
}
```

#### A.2 Plan Builder & Executor (Weeks 3-5)

```typescript
// Plan builder
interface PlanBuilder {
  createPlan(decomposition: GoalDecomposition, constraints: PlanConstraints): ExecutionPlan;
  optimizePlan(plan: ExecutionPlan): ExecutionPlan;
  adaptPlan(plan: ExecutionPlan, feedback: PlanFeedback): ExecutionPlan;
}

interface ExecutionPlan {
  id: string;
  goalId: string;
  steps: PlanStep[];
  schedule: PlanSchedule;
  checkpoints: Checkpoint[];
  fallbackStrategies: FallbackStrategy[];
}

interface PlanStep {
  id: string;
  planId: string;
  subGoalId: string;
  type: StepType;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  order: number;
  estimatedMinutes: number;
  actualMinutes?: number;
  inputs: StepInput[];
  outputs?: StepOutput[];
  retryCount: number;
  maxRetries: number;
}

type StepType =
  | 'read_content'
  | 'watch_video'
  | 'complete_exercise'
  | 'take_quiz'
  | 'reflect'
  | 'practice_problem'
  | 'socratic_dialogue'
  | 'spaced_review'
  | 'create_summary'
  | 'peer_discussion';
```

#### A.3 Resumable State Machine (Weeks 5-8)

```typescript
// Resumable state machine for plan execution
interface AgentStateMachine {
  // State management
  getCurrentState(): PlanState;
  saveState(): Promise<void>;
  loadState(planId: string): Promise<PlanState>;

  // Execution control
  start(plan: ExecutionPlan): Promise<void>;
  pause(): Promise<PlanState>;
  resume(state: PlanState): Promise<void>;
  abort(reason: string): Promise<void>;

  // Step execution
  executeStep(step: PlanStep): Promise<StepResult>;
  handleStepFailure(step: PlanStep, error: Error): Promise<RecoveryAction>;

  // State transitions
  onStepComplete(step: PlanStep, result: StepResult): Promise<void>;
  onPlanComplete(plan: ExecutionPlan): Promise<void>;
  onInterruption(reason: string): Promise<PlanState>;
}

interface PlanState {
  planId: string;
  currentStepId: string | null;
  completedSteps: string[];
  failedSteps: string[];
  pausedAt?: Date;
  context: ExecutionContext;
  checkpointData: Record<string, unknown>;
}
```

---

### Phase B: Tool Execution Layer (Weeks 9-14)

**Goal**: Build explicit tool registry with permissioned actions, audit logging, and user confirmation.

#### B.1 Tool Registry (Weeks 9-10)

```typescript
// Tool registry with metadata
interface ToolRegistry {
  // Registration
  register(tool: ToolDefinition): void;
  unregister(toolId: string): void;

  // Discovery
  getAvailableTools(context: ToolContext): Tool[];
  findToolsForTask(task: string): Tool[];

  // Execution
  execute(toolId: string, params: ToolParams, context: ExecutionContext): Promise<ToolResult>;

  // Validation
  validateParams(toolId: string, params: ToolParams): ValidationResult;
}

interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;

  // Schema
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;

  // Permissions
  requiredPermissions: Permission[];
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;

  // Execution
  handler: ToolHandler;
  timeout: number;
  retryable: boolean;

  // Audit
  auditLevel: 'none' | 'minimal' | 'full';
}

type ToolCategory =
  | 'content_creation'
  | 'content_modification'
  | 'assessment'
  | 'scheduling'
  | 'notification'
  | 'analysis'
  | 'external_api';
```

#### B.2 Available Tools

```typescript
// Core mentor tools
const MENTOR_TOOLS: ToolDefinition[] = [
  // Content tools
  {
    id: 'create_course_content',
    name: 'Create Course Content',
    category: 'content_creation',
    riskLevel: 'medium',
    requiresConfirmation: true,
    // ...
  },
  {
    id: 'update_course_content',
    name: 'Update Course Content',
    category: 'content_modification',
    riskLevel: 'medium',
    requiresConfirmation: true,
  },
  {
    id: 'generate_assessment',
    name: 'Generate Assessment',
    category: 'assessment',
    riskLevel: 'low',
    requiresConfirmation: false,
  },

  // Scheduling tools
  {
    id: 'schedule_practice',
    name: 'Schedule Practice Session',
    category: 'scheduling',
    riskLevel: 'safe',
    requiresConfirmation: false,
  },
  {
    id: 'schedule_review',
    name: 'Schedule Spaced Review',
    category: 'scheduling',
    riskLevel: 'safe',
    requiresConfirmation: false,
  },
  {
    id: 'create_daily_plan',
    name: 'Create Daily Learning Plan',
    category: 'scheduling',
    riskLevel: 'safe',
    requiresConfirmation: false,
  },

  // Notification tools
  {
    id: 'send_reminder',
    name: 'Send Learning Reminder',
    category: 'notification',
    riskLevel: 'low',
    requiresConfirmation: false,
  },
  {
    id: 'send_encouragement',
    name: 'Send Encouragement Message',
    category: 'notification',
    riskLevel: 'safe',
    requiresConfirmation: false,
  },

  // Analysis tools
  {
    id: 'analyze_progress',
    name: 'Analyze Learning Progress',
    category: 'analysis',
    riskLevel: 'safe',
    requiresConfirmation: false,
  },
  {
    id: 'identify_knowledge_gaps',
    name: 'Identify Knowledge Gaps',
    category: 'analysis',
    riskLevel: 'safe',
    requiresConfirmation: false,
  },
];
```

#### B.3 Permission Manager (Weeks 11-12)

```typescript
interface PermissionManager {
  // Check permissions
  hasPermission(userId: string, permission: Permission): Promise<boolean>;
  checkToolPermission(userId: string, toolId: string): Promise<PermissionResult>;

  // Grant/revoke
  grantPermission(userId: string, permission: Permission): Promise<void>;
  revokePermission(userId: string, permission: Permission): Promise<void>;

  // Permission sets
  getUserPermissions(userId: string): Promise<Permission[]>;
  setDefaultPermissions(role: UserRole): Permission[];
}

type Permission =
  | 'tool.content.create'
  | 'tool.content.modify'
  | 'tool.content.delete'
  | 'tool.schedule.create'
  | 'tool.schedule.modify'
  | 'tool.notification.send'
  | 'tool.analysis.run'
  | 'tool.assessment.create'
  | 'tool.external.api';
```

#### B.4 Audit Logger (Weeks 13-14)

```typescript
interface AuditLogger {
  // Log entries
  log(entry: AuditLogEntry): Promise<void>;

  // Query
  getEntries(query: AuditQuery): Promise<AuditLogEntry[]>;
  getEntriesForUser(userId: string, options: QueryOptions): Promise<AuditLogEntry[]>;
  getEntriesForTool(toolId: string, options: QueryOptions): Promise<AuditLogEntry[]>;

  // Reports
  generateReport(options: ReportOptions): Promise<AuditReport>;
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;

  // Actor
  userId: string;
  sessionId: string;

  // Action
  action: AuditAction;
  toolId: string;
  toolName: string;

  // Context
  planId?: string;
  stepId?: string;

  // Input/Output
  input: Record<string, unknown>;
  output?: Record<string, unknown>;

  // Result
  status: 'success' | 'failed' | 'pending_confirmation' | 'cancelled';
  error?: string;

  // Confirmation
  confirmationRequired: boolean;
  confirmedBy?: string;
  confirmedAt?: Date;

  // Risk
  riskLevel: string;

  // PII redaction
  piiRedacted: boolean;
}
```

---

### Phase C: Long-Term Memory & Retrieval (Weeks 15-22)

**Goal**: Implement vector store + knowledge graph for course content, user history, and artifacts.

#### C.1 Vector Store (Weeks 15-17)

```typescript
interface VectorStore {
  // Indexing
  index(documents: Document[]): Promise<IndexResult>;
  indexContent(content: CourseContent): Promise<IndexResult>;
  indexConversation(conversation: Conversation): Promise<IndexResult>;

  // Search
  search(query: string, options: SearchOptions): Promise<VectorSearchResult[]>;
  similaritySearch(embedding: number[], options: SearchOptions): Promise<VectorSearchResult[]>;

  // Hybrid search (vector + keyword)
  hybridSearch(query: string, options: HybridSearchOptions): Promise<VectorSearchResult[]>;

  // Management
  deleteBySource(sourceId: string): Promise<void>;
  refresh(sourceId: string): Promise<void>;
}

interface VectorSearchResult {
  id: string;
  content: string;
  metadata: DocumentMetadata;
  score: number;
  source: {
    type: 'course' | 'chapter' | 'section' | 'conversation' | 'artifact';
    id: string;
    title: string;
  };
}

interface SearchOptions {
  limit?: number;
  minScore?: number;
  filters?: SearchFilter[];
  courseId?: string;
  userId?: string;
  dateRange?: DateRange;
}
```

#### C.2 Knowledge Graph Manager (Weeks 18-20)

```typescript
interface KnowledgeGraphManager {
  // Nodes
  addNode(node: KnowledgeNode): Promise<void>;
  updateNode(nodeId: string, updates: Partial<KnowledgeNode>): Promise<void>;
  removeNode(nodeId: string): Promise<void>;

  // Edges
  addEdge(edge: KnowledgeEdge): Promise<void>;
  removeEdge(fromId: string, toId: string, type: EdgeType): Promise<void>;

  // Queries
  getNode(nodeId: string): Promise<KnowledgeNode | null>;
  getRelatedNodes(nodeId: string, edgeTypes?: EdgeType[]): Promise<KnowledgeNode[]>;
  findPath(fromId: string, toId: string): Promise<KnowledgePath | null>;

  // Subgraph
  getSubgraph(centerId: string, depth: number): Promise<KnowledgeSubgraph>;

  // Learning path
  suggestLearningPath(userId: string, targetConcept: string): Promise<LearningPath>;
}

interface KnowledgeNode {
  id: string;
  type: 'concept' | 'skill' | 'topic' | 'course' | 'resource';
  name: string;
  description: string;
  metadata: Record<string, unknown>;
  embeddings?: number[];
}

interface KnowledgeEdge {
  from: string;
  to: string;
  type: EdgeType;
  weight: number;
  metadata: Record<string, unknown>;
}

type EdgeType =
  | 'prerequisite'
  | 'related_to'
  | 'part_of'
  | 'teaches'
  | 'assesses'
  | 'leads_to'
  | 'conflicts_with'
  | 'reinforces';
```

#### C.3 Cross-Session Context (Weeks 21-22)

```typescript
interface CrossSessionContext {
  // Session management
  startSession(userId: string): Promise<Session>;
  endSession(sessionId: string): Promise<void>;

  // Context retrieval
  getRecentContext(userId: string, limit?: number): Promise<SessionContext[]>;
  getRelevantContext(userId: string, query: string): Promise<RelevantContext>;

  // Context storage
  storeContext(sessionId: string, context: ContextEntry): Promise<void>;

  // Summarization
  summarizeRecentSessions(userId: string, count: number): Promise<SessionSummary>;
}

interface SessionContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;

  // Content
  topics: string[];
  concepts: string[];
  questions: string[];

  // Progress
  completedSteps: string[];
  achievements: string[];

  // Emotional context
  emotionalStates: EmotionalState[];
  frustrationPoints: FrustrationPoint[];

  // Summary
  summary: string;
  keyInsights: string[];
}

interface JourneyTimeline {
  // Events
  addEvent(event: JourneyEvent): Promise<void>;
  getEvents(userId: string, options: TimelineOptions): Promise<JourneyEvent[]>;

  // Milestones
  addMilestone(milestone: JourneyMilestone): Promise<void>;
  getMilestones(userId: string): Promise<JourneyMilestone[]>;

  // Timeline view
  getTimeline(userId: string, range: DateRange): Promise<Timeline>;
}
```

---

### Phase D: Mentor Workflows (Weeks 23-30)

**Goal**: Build multi-session learning plans, milestones, daily practice scheduling, and proactive check-ins.

#### D.1 Multi-Session Plan Tracker (Weeks 23-25)

```typescript
interface MultiSessionPlanTracker {
  // Plan creation
  createLearningPlan(input: LearningPlanInput): Promise<LearningPlan>;

  // Weekly breakdown
  generateWeeklyBreakdown(plan: LearningPlan): Promise<WeeklyBreakdown>;

  // Daily practice
  getDailyPractice(userId: string, date: Date): Promise<DailyPractice>;

  // Progress tracking
  trackProgress(planId: string, progress: ProgressUpdate): Promise<void>;
  getProgressReport(planId: string): Promise<ProgressReport>;

  // Adaptive adjustments
  adjustPlan(planId: string, feedback: PlanFeedback): Promise<LearningPlan>;
}

interface LearningPlan {
  id: string;
  userId: string;
  goal: LearningGoal;

  // Timeline
  startDate: Date;
  targetDate: Date;
  durationWeeks: number;

  // Breakdown
  weeklyMilestones: WeeklyMilestone[];
  dailyTargets: DailyTarget[];

  // Progress
  currentWeek: number;
  currentDay: number;
  overallProgress: number; // 0-100

  // Adaptive
  difficultyAdjustments: DifficultyAdjustment[];
  paceAdjustments: PaceAdjustment[];
}

interface DailyPractice {
  date: Date;
  userId: string;
  planId: string;

  // Activities
  activities: DailyActivity[];
  estimatedMinutes: number;

  // Spaced repetition
  reviewItems: ReviewItem[];

  // Goals
  dailyGoals: string[];

  // Motivation
  motivationalMessage: string;
  streakInfo: StreakInfo;
}
```

#### D.2 Proactive Check-In System (Weeks 26-28)

```typescript
interface CheckInScheduler {
  // Scheduling
  scheduleCheckIn(checkIn: ScheduledCheckIn): Promise<void>;
  getScheduledCheckIns(userId: string): Promise<ScheduledCheckIn[]>;

  // Trigger evaluation
  evaluateTriggers(userId: string): Promise<TriggeredCheckIn[]>;

  // Execution
  executeCheckIn(checkInId: string): Promise<CheckInResult>;

  // Response handling
  handleResponse(checkInId: string, response: CheckInResponse): Promise<void>;
}

interface ScheduledCheckIn {
  id: string;
  userId: string;
  type: CheckInType;
  scheduledTime: Date;

  // Trigger conditions
  triggerConditions: TriggerCondition[];

  // Content
  message: string;
  questions: CheckInQuestion[];
  suggestedActions: SuggestedAction[];

  // Channel
  channel: 'in_app' | 'push' | 'email' | 'sms';
}

type CheckInType =
  | 'daily_reminder'
  | 'progress_check'
  | 'struggle_detection'
  | 'milestone_celebration'
  | 'inactivity_reengagement'
  | 'goal_review'
  | 'weekly_summary';

interface TriggerCondition {
  type: TriggerType;
  threshold: number;
  comparison: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number | string;
}

type TriggerType =
  | 'days_inactive'
  | 'streak_at_risk'
  | 'mastery_plateau'
  | 'frustration_detected'
  | 'goal_behind_schedule'
  | 'assessment_failed'
  | 'time_since_last_session';
```

#### D.3 Behavior Monitor (Weeks 29-30)

```typescript
interface BehaviorMonitor {
  // Real-time monitoring
  trackEvent(event: BehaviorEvent): Promise<void>;

  // Pattern detection
  detectPatterns(userId: string): Promise<BehaviorPattern[]>;

  // Anomaly detection
  detectAnomalies(userId: string): Promise<BehaviorAnomaly[]>;

  // Predictions
  predictChurn(userId: string): Promise<ChurnPrediction>;
  predictStruggle(userId: string): Promise<StrugglePrediction>;

  // Interventions
  suggestInterventions(patterns: BehaviorPattern[]): Promise<Intervention[]>;
}

interface BehaviorEvent {
  userId: string;
  sessionId: string;
  timestamp: Date;

  type: BehaviorEventType;
  data: Record<string, unknown>;

  // Context
  pageContext: PageContext;
  emotionalSignals?: EmotionalSignal[];
}

type BehaviorEventType =
  | 'page_view'
  | 'content_interaction'
  | 'assessment_attempt'
  | 'hint_request'
  | 'question_asked'
  | 'frustration_signal'
  | 'success_signal'
  | 'session_start'
  | 'session_end'
  | 'goal_set'
  | 'goal_abandoned';

interface Intervention {
  type: InterventionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedActions: SuggestedAction[];
  timing: InterventionTiming;
}

type InterventionType =
  | 'encouragement'
  | 'difficulty_adjustment'
  | 'content_recommendation'
  | 'break_suggestion'
  | 'goal_revision'
  | 'peer_connection'
  | 'mentor_escalation';
```

---

### Phase E: Self-Evaluation Loops (Weeks 31-36)

**Goal**: Add confidence scoring, source citation, and verification steps before delivering advice.

#### E.1 Confidence Scorer (Weeks 31-32)

```typescript
interface ConfidenceScorer {
  // Score calculation
  calculateConfidence(response: AIResponse, context: ConfidenceContext): Promise<ConfidenceScore>;

  // Calibration
  calibrate(feedback: ConfidenceFeedback[]): Promise<void>;

  // Thresholds
  getThresholds(): ConfidenceThresholds;
  setThresholds(thresholds: ConfidenceThresholds): void;
}

interface ConfidenceScore {
  overall: number; // 0-1

  // Component scores
  factualAccuracy: number;
  pedagogicalAppropriateness: number;
  personalizationFit: number;
  sourceSupport: number;

  // Metadata
  factors: ConfidenceFactor[];
  uncertainties: Uncertainty[];

  // Recommendations
  shouldDefer: boolean;
  shouldSeekConfirmation: boolean;
  shouldCiteSource: boolean;

  // Display
  displayLevel: 'very_confident' | 'confident' | 'somewhat_confident' | 'uncertain';
  explanation: string;
}

interface ConfidenceFactor {
  name: string;
  contribution: number;
  evidence: string;
}

interface Uncertainty {
  type: 'factual' | 'pedagogical' | 'personalization';
  description: string;
  impact: 'low' | 'medium' | 'high';
}
```

#### E.2 Source Tracer (Weeks 33-34)

```typescript
interface SourceTracer {
  // Trace sources
  traceResponse(response: AIResponse): Promise<SourceTrace>;

  // Citation generation
  generateCitations(trace: SourceTrace): Promise<Citation[]>;

  // Verification
  verifyClaim(claim: string, sources: Source[]): Promise<VerificationResult>;
}

interface SourceTrace {
  responseId: string;

  // Source mapping
  segments: TracedSegment[];

  // Coverage
  sourcedPercentage: number;
  unsourcedClaims: UnsourcedClaim[];

  // Quality
  sourceQuality: SourceQualityScore;
}

interface TracedSegment {
  text: string;
  startIndex: number;
  endIndex: number;

  sources: SourceReference[];
  confidence: number;

  type: 'fact' | 'explanation' | 'opinion' | 'recommendation';
}

interface SourceReference {
  sourceId: string;
  sourceType: 'course_content' | 'external_doc' | 'research_paper' | 'knowledge_graph';

  title: string;
  location: string;
  relevance: number;

  quote?: string;
}

interface Citation {
  segmentIndex: number;
  format: 'inline' | 'footnote' | 'reference';
  text: string;
  sources: SourceReference[];
}
```

#### E.3 Rubric Verifier (Weeks 35-36)

```typescript
interface RubricVerifier {
  // Pre-delivery verification
  verifyBeforeDelivery(response: AIResponse, rubrics: Rubric[]): Promise<VerificationResult>;

  // Rubric management
  getRubricsForContext(context: ResponseContext): Promise<Rubric[]>;

  // Compliance checking
  checkCompliance(response: AIResponse, rubric: Rubric): Promise<ComplianceResult>;
}

interface Rubric {
  id: string;
  name: string;
  category: RubricCategory;

  criteria: RubricCriterion[];

  // Thresholds
  minimumScore: number;
  mustPassAll: boolean;
}

type RubricCategory =
  | 'factual_accuracy'
  | 'pedagogical_quality'
  | 'safety'
  | 'accessibility'
  | 'personalization'
  | 'engagement';

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;

  evaluator: CriterionEvaluator;
  passingScore: number;
}

interface VerificationResult {
  passed: boolean;
  overallScore: number;

  rubricResults: RubricResult[];

  blockers: Blocker[];
  warnings: Warning[];

  recommendations: Recommendation[];
}
```

---

### Phase F: Reliability, Ops, and Robustness (Weeks 37-44)

**Goal**: Production-grade reliability with real-time, external integrations, model routing, and testing.

#### F.1 Real-Time Layer (Weeks 37-38)

```typescript
// WebSocket manager for live mentoring
interface WebSocketManager {
  // Connection management
  connect(userId: string): Promise<WebSocketConnection>;
  disconnect(connectionId: string): Promise<void>;

  // Presence
  getOnlineUsers(courseId?: string): Promise<OnlineUser[]>;
  updatePresence(connectionId: string, status: PresenceStatus): Promise<void>;

  // Messaging
  send(connectionId: string, message: WSMessage): Promise<void>;
  broadcast(userIds: string[], message: WSMessage): Promise<void>;

  // Rooms
  joinRoom(connectionId: string, roomId: string): Promise<void>;
  leaveRoom(connectionId: string, roomId: string): Promise<void>;
  broadcastToRoom(roomId: string, message: WSMessage): Promise<void>;
}

interface WebSocketConnection {
  id: string;
  userId: string;
  connectedAt: Date;

  // Handlers
  onMessage(handler: MessageHandler): void;
  onDisconnect(handler: DisconnectHandler): void;

  // Status
  isAlive(): boolean;
  latency(): number;
}
```

#### F.2 Model Router & Fallback (Weeks 39-40)

```typescript
interface ModelRouter {
  // Routing
  route(request: AIRequest): Promise<RoutingDecision>;

  // Provider management
  registerProvider(provider: AIProvider): void;
  getProviderStatus(providerId: string): ProviderStatus;

  // Fallback
  handleFailure(request: AIRequest, error: Error): Promise<FallbackResult>;

  // Cost optimization
  optimizeForCost(request: AIRequest): Promise<RoutingDecision>;

  // Latency optimization
  optimizeForLatency(request: AIRequest): Promise<RoutingDecision>;
}

interface AIProvider {
  id: string;
  name: string;
  type: 'anthropic' | 'openai' | 'local' | 'custom';

  // Capabilities
  models: ModelInfo[];
  supportsStreaming: boolean;
  supportsTools: boolean;

  // Limits
  rateLimit: RateLimit;
  contextWindow: number;

  // Cost
  costPerToken: CostStructure;

  // Health
  healthCheck(): Promise<HealthStatus>;
}

interface RoutingDecision {
  provider: AIProvider;
  model: string;
  reason: RoutingReason;

  fallbacks: FallbackOption[];

  estimatedCost: number;
  estimatedLatency: number;
}

type RoutingReason =
  | 'cost_optimization'
  | 'latency_optimization'
  | 'capability_requirement'
  | 'privacy_requirement'
  | 'fallback'
  | 'load_balancing';
```

#### F.3 External Knowledge Integrations (Weeks 41-42)

```typescript
interface ExternalKnowledgeIntegration {
  // Sources
  registerSource(source: ExternalSource): void;

  // Fetching
  fetchLatest(sourceId: string, query?: string): Promise<ExternalContent[]>;

  // Caching
  getCachedContent(sourceId: string): Promise<CachedContent | null>;
  refreshCache(sourceId: string): Promise<void>;

  // Quality
  assessQuality(content: ExternalContent): Promise<QualityAssessment>;

  // Integration
  integrateWithKnowledgeGraph(content: ExternalContent[]): Promise<void>;
}

interface ExternalSource {
  id: string;
  name: string;
  type: 'news' | 'research' | 'trends' | 'documentation' | 'api';

  // Configuration
  endpoint: string;
  apiKey?: string;

  // Refresh
  refreshInterval: number; // minutes

  // Filtering
  relevanceFilter: RelevanceFilter;

  // Quality
  trustScore: number;
}
```

#### F.4 Golden Tests & Regression Suite (Weeks 43-44)

```typescript
interface GoldenTestSuite {
  // Test management
  addTest(test: GoldenTest): Promise<void>;
  updateTest(testId: string, updates: Partial<GoldenTest>): Promise<void>;
  removeTest(testId: string): Promise<void>;

  // Execution
  runAllTests(): Promise<TestSuiteResult>;
  runTestsForEngine(engineId: string): Promise<TestSuiteResult>;
  runRegressionSuite(): Promise<RegressionResult>;

  // Comparison
  compareResults(baseline: TestSuiteResult, current: TestSuiteResult): Promise<Comparison>;

  // Reporting
  generateReport(result: TestSuiteResult): Promise<TestReport>;
}

interface GoldenTest {
  id: string;
  name: string;
  description: string;

  // Test definition
  engine: string;
  input: TestInput;
  expectedOutput: ExpectedOutput;

  // Validation
  validators: Validator[];
  tolerances: Tolerance[];

  // Metadata
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  tags: string[];
}

interface RegressionResult {
  passed: boolean;

  // Comparisons
  improvements: Improvement[];
  regressions: Regression[];
  unchanged: string[];

  // Metrics
  overallQuality: number;
  qualityDelta: number;

  // Recommendations
  recommendations: RegressionRecommendation[];
}
```

---

## Database Schema Additions

### New Prisma Models

```prisma
// ============================================================================
// AGENTIC CORE
// ============================================================================

model SAMLearningGoal {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String?
  targetDate  DateTime?
  priority    SAMGoalPriority @default(MEDIUM)
  status      SAMGoalStatus @default(ACTIVE)

  // Context
  courseId    String?
  chapterId   String?
  sectionId   String?

  // Mastery targets
  currentMastery String?
  targetMastery  String?

  // Relations
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course      Course?  @relation(fields: [courseId], references: [id])

  subGoals    SAMSubGoal[]
  plans       SAMExecutionPlan[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([courseId])
}

model SAMSubGoal {
  id            String   @id @default(cuid())
  goalId        String
  title         String
  type          SAMSubGoalType
  order         Int

  estimatedMinutes Int
  prerequisites String[]
  successCriteria  String[]

  status        SAMStepStatus @default(PENDING)
  completedAt   DateTime?

  // Relations
  goal          SAMLearningGoal @relation(fields: [goalId], references: [id], onDelete: Cascade)
  steps         SAMPlanStep[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([goalId])
}

model SAMExecutionPlan {
  id          String   @id @default(cuid())
  goalId      String
  userId      String

  // Schedule
  startDate   DateTime?
  targetDate  DateTime?

  // Progress
  currentStepId String?
  overallProgress Float @default(0)

  // State
  status      SAMPlanStatus @default(ACTIVE)
  pausedAt    DateTime?

  // Checkpoint data for resumability
  checkpointData Json?

  // Relations
  goal        SAMLearningGoal @relation(fields: [goalId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  steps       SAMPlanStep[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([goalId])
}

model SAMPlanStep {
  id            String   @id @default(cuid())
  planId        String
  subGoalId     String?

  type          SAMStepType
  order         Int

  // Execution
  status        SAMStepStatus @default(PENDING)
  startedAt     DateTime?
  completedAt   DateTime?

  // Time tracking
  estimatedMinutes Int
  actualMinutes    Int?

  // Retry
  retryCount    Int @default(0)
  maxRetries    Int @default(3)

  // Data
  inputs        Json?
  outputs       Json?
  error         String?

  // Relations
  plan          SAMExecutionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  subGoal       SAMSubGoal? @relation(fields: [subGoalId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([planId])
  @@index([subGoalId])
}

// ============================================================================
// TOOL EXECUTION
// ============================================================================

model SAMAuditLog {
  id            String   @id @default(cuid())
  userId        String
  sessionId     String?

  // Action
  action        String
  toolId        String
  toolName      String

  // Context
  planId        String?
  stepId        String?

  // Input/Output
  input         Json
  output        Json?

  // Result
  status        SAMAuditStatus
  error         String?

  // Confirmation
  confirmationRequired Boolean @default(false)
  confirmedBy   String?
  confirmedAt   DateTime?

  // Risk
  riskLevel     String
  piiRedacted   Boolean @default(false)

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([toolId])
  @@index([createdAt])
}

model SAMToolPermission {
  id            String   @id @default(cuid())
  userId        String
  permission    String

  grantedBy     String?
  grantedAt     DateTime @default(now())
  expiresAt     DateTime?

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, permission])
  @@index([userId])
}

// ============================================================================
// LONG-TERM MEMORY
// ============================================================================

model SAMVectorDocument {
  id            String   @id @default(cuid())

  // Source
  sourceType    SAMVectorSourceType
  sourceId      String
  sourceTitle   String

  // Content
  content       String
  embedding     Float[]

  // Metadata
  metadata      Json?

  // Relations
  userId        String?
  courseId      String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([sourceType, sourceId])
  @@index([userId])
  @@index([courseId])
}

model SAMKnowledgeNode {
  id            String   @id @default(cuid())
  type          SAMKnowledgeNodeType
  name          String
  description   String?

  metadata      Json?
  embeddings    Float[]?

  // Relations
  outgoingEdges SAMKnowledgeEdge[] @relation("from")
  incomingEdges SAMKnowledgeEdge[] @relation("to")

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([type])
  @@index([name])
}

model SAMKnowledgeEdge {
  id            String   @id @default(cuid())
  fromId        String
  toId          String
  type          SAMEdgeType
  weight        Float @default(1.0)
  metadata      Json?

  // Relations
  from          SAMKnowledgeNode @relation("from", fields: [fromId], references: [id], onDelete: Cascade)
  to            SAMKnowledgeNode @relation("to", fields: [toId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())

  @@unique([fromId, toId, type])
  @@index([fromId])
  @@index([toId])
}

model SAMSessionContext {
  id            String   @id @default(cuid())
  userId        String
  sessionId     String

  startTime     DateTime
  endTime       DateTime?

  // Content
  topics        String[]
  concepts      String[]
  questions     String[]

  // Progress
  completedSteps String[]
  achievements   String[]

  // Emotional
  emotionalStates Json?
  frustrationPoints Json?

  // Summary
  summary       String?
  keyInsights   String[]

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([sessionId])
}

model SAMJourneyEvent {
  id            String   @id @default(cuid())
  userId        String

  type          SAMJourneyEventType
  title         String
  description   String?

  // Context
  courseId      String?
  chapterId     String?
  sectionId     String?

  // Data
  data          Json?

  // Milestone
  isMilestone   Boolean @default(false)
  milestoneType String?

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([type])
  @@index([createdAt])
}

// ============================================================================
// PROACTIVE INTERVENTION
// ============================================================================

model SAMScheduledCheckIn {
  id            String   @id @default(cuid())
  userId        String

  type          SAMCheckInType
  scheduledTime DateTime

  // Content
  message       String
  questions     Json?
  suggestedActions Json?

  // Channel
  channel       SAMNotificationChannel @default(IN_APP)

  // Status
  status        SAMCheckInStatus @default(SCHEDULED)
  sentAt        DateTime?
  respondedAt   DateTime?

  // Response
  response      Json?

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([scheduledTime])
  @@index([status])
}

model SAMBehaviorEvent {
  id            String   @id @default(cuid())
  userId        String
  sessionId     String

  type          SAMBehaviorEventType
  data          Json

  // Context
  pageContext   Json?
  emotionalSignals Json?

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  timestamp     DateTime @default(now())

  @@index([userId])
  @@index([sessionId])
  @@index([type])
  @@index([timestamp])
}

// ============================================================================
// SELF-EVALUATION
// ============================================================================

model SAMConfidenceLog {
  id            String   @id @default(cuid())
  userId        String
  responseId    String

  // Scores
  overallScore  Float
  factualAccuracy Float
  pedagogicalAppropriateness Float
  personalizationFit Float
  sourceSupport Float

  // Metadata
  factors       Json?
  uncertainties Json?

  // Display
  displayLevel  String
  explanation   String?

  // Feedback
  userFeedback  SAMConfidenceFeedback?

  // Relations
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([responseId])
}

model SAMSourceCitation {
  id            String   @id @default(cuid())
  responseId    String

  // Segment
  segmentText   String
  segmentStart  Int
  segmentEnd    Int

  // Source
  sourceId      String
  sourceType    String
  sourceTitle   String
  sourceLocation String?

  // Quality
  relevance     Float
  confidence    Float

  createdAt     DateTime @default(now())

  @@index([responseId])
  @@index([sourceId])
}

// ============================================================================
// ENUMS
// ============================================================================

enum SAMGoalPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum SAMGoalStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ABANDONED
}

enum SAMSubGoalType {
  LEARN
  PRACTICE
  ASSESS
  REVIEW
}

enum SAMPlanStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  FAILED
  CANCELLED
}

enum SAMStepStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  SKIPPED
}

enum SAMStepType {
  READ_CONTENT
  WATCH_VIDEO
  COMPLETE_EXERCISE
  TAKE_QUIZ
  REFLECT
  PRACTICE_PROBLEM
  SOCRATIC_DIALOGUE
  SPACED_REVIEW
  CREATE_SUMMARY
  PEER_DISCUSSION
}

enum SAMAuditStatus {
  SUCCESS
  FAILED
  PENDING_CONFIRMATION
  CANCELLED
}

enum SAMVectorSourceType {
  COURSE
  CHAPTER
  SECTION
  CONVERSATION
  ARTIFACT
}

enum SAMKnowledgeNodeType {
  CONCEPT
  SKILL
  TOPIC
  COURSE
  RESOURCE
}

enum SAMEdgeType {
  PREREQUISITE
  RELATED_TO
  PART_OF
  TEACHES
  ASSESSES
  LEADS_TO
  CONFLICTS_WITH
  REINFORCES
}

enum SAMJourneyEventType {
  GOAL_SET
  GOAL_COMPLETED
  MILESTONE_REACHED
  ASSESSMENT_PASSED
  MASTERY_LEVEL_UP
  STREAK_ACHIEVED
  BADGE_EARNED
  CONTENT_COMPLETED
  STRUGGLE_DETECTED
  BREAKTHROUGH
}

enum SAMCheckInType {
  DAILY_REMINDER
  PROGRESS_CHECK
  STRUGGLE_DETECTION
  MILESTONE_CELEBRATION
  INACTIVITY_REENGAGEMENT
  GOAL_REVIEW
  WEEKLY_SUMMARY
}

enum SAMNotificationChannel {
  IN_APP
  PUSH
  EMAIL
  SMS
}

enum SAMCheckInStatus {
  SCHEDULED
  SENT
  RESPONDED
  EXPIRED
  CANCELLED
}

enum SAMBehaviorEventType {
  PAGE_VIEW
  CONTENT_INTERACTION
  ASSESSMENT_ATTEMPT
  HINT_REQUEST
  QUESTION_ASKED
  FRUSTRATION_SIGNAL
  SUCCESS_SIGNAL
  SESSION_START
  SESSION_END
  GOAL_SET
  GOAL_ABANDONED
}

enum SAMConfidenceFeedback {
  ACCURATE
  INACCURATE
  HELPFUL
  NOT_HELPFUL
}
```

---

## API Endpoints

### New Agentic API Routes

```
/api/sam/agentic/
├── goals/
│   ├── POST   /                    # Create learning goal
│   ├── GET    /                    # List user goals
│   ├── GET    /[goalId]            # Get goal details
│   ├── PUT    /[goalId]            # Update goal
│   ├── DELETE /[goalId]            # Delete goal
│   └── POST   /[goalId]/decompose  # Decompose into sub-goals
├── plans/
│   ├── POST   /                    # Create execution plan
│   ├── GET    /[planId]            # Get plan details
│   ├── POST   /[planId]/start      # Start plan execution
│   ├── POST   /[planId]/pause      # Pause plan
│   ├── POST   /[planId]/resume     # Resume plan
│   ├── POST   /[planId]/step/[stepId]/complete  # Complete step
│   └── GET    /[planId]/state      # Get resumable state
├── tools/
│   ├── GET    /                    # List available tools
│   ├── POST   /execute             # Execute tool
│   ├── GET    /permissions         # Get user permissions
│   └── POST   /confirm             # Confirm pending action
├── memory/
│   ├── POST   /search              # Vector search
│   ├── GET    /context             # Get cross-session context
│   ├── GET    /journey             # Get journey timeline
│   └── POST   /knowledge/query     # Query knowledge graph
├── proactive/
│   ├── GET    /check-ins           # Get scheduled check-ins
│   ├── POST   /check-ins/respond   # Respond to check-in
│   ├── GET    /interventions       # Get pending interventions
│   └── POST   /daily-practice      # Get daily practice
├── evaluation/
│   ├── GET    /confidence/[responseId]  # Get confidence score
│   ├── GET    /citations/[responseId]   # Get source citations
│   └── POST   /feedback                 # Submit accuracy feedback
└── audit/
    ├── GET    /logs                # Get audit logs
    └── GET    /report              # Generate audit report
```

---

## Testing Strategy

### Test Categories

| Category | Coverage Target | Tools |
|----------|-----------------|-------|
| Unit Tests | 90% | Vitest |
| Integration Tests | 80% | Vitest + Testcontainers |
| E2E Tests | Critical paths | Playwright |
| Golden Tests | All engines | Custom harness |
| Regression Tests | All engines | Custom harness |
| Performance Tests | Core flows | k6 |
| Security Tests | Auth + PII | OWASP ZAP |

### Golden Test Structure

```typescript
// tests/golden/goal-decomposition.golden.ts
{
  name: 'Goal Decomposition - Basic Learning Goal',
  engine: 'GoalDecomposer',
  input: {
    goal: {
      title: 'Master JavaScript Fundamentals',
      context: { courseId: 'course-123' }
    }
  },
  expectedOutput: {
    subGoals: {
      minCount: 3,
      maxCount: 8,
      requiredTypes: ['learn', 'practice', 'assess']
    },
    estimatedDuration: {
      min: 300, // 5 hours
      max: 1800 // 30 hours
    }
  },
  validators: [
    'subGoalCountInRange',
    'durationReasonable',
    'prerequisitesValid'
  ]
}
```

---

## Reliability and Operations

### Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Response Latency (p50) | < 500ms | < 1000ms |
| Response Latency (p99) | < 2000ms | < 5000ms |
| Vector Search Latency | < 100ms | < 300ms |
| Tool Execution Time | < 3s | < 10s |
| Availability | 99.9% | 99.5% |
| Error Rate | < 0.1% | < 1% |

### Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| PII Redaction | Automatic in audit logs |
| Encryption at Rest | AES-256 |
| Encryption in Transit | TLS 1.3 |
| Rate Limiting | Per-user, per-tool |
| Permission Model | RBAC with tool granularity |
| Audit Trail | Complete action history |

### Database Indexes

```sql
-- High-priority indexes for agentic queries
CREATE INDEX idx_goals_user_status ON sam_learning_goal(user_id, status);
CREATE INDEX idx_plans_user_active ON sam_execution_plan(user_id, status) WHERE status = 'ACTIVE';
CREATE INDEX idx_audit_user_time ON sam_audit_log(user_id, created_at DESC);
CREATE INDEX idx_behavior_user_session ON sam_behavior_event(user_id, session_id, timestamp);
CREATE INDEX idx_vector_source ON sam_vector_document(source_type, source_id);

-- GIN index for vector search (pgvector)
CREATE INDEX idx_vector_embedding ON sam_vector_document USING ivfflat (embedding vector_cosine_ops);
```

---

## Success Metrics

### Phase A: Agentic Core
- Goals created per user: > 2/month
- Plan completion rate: > 70%
- Plan resume success: > 95%
- Step execution accuracy: > 90%

### Phase B: Tool Execution
- Tool usage per session: > 3
- Confirmation approval rate: > 90%
- Audit log completeness: 100%
- Permission violation rate: < 0.1%

### Phase C: Long-Term Memory
- Context retrieval accuracy: > 85%
- Cross-session recall: > 80%
- Knowledge graph coverage: > 70% of course content
- Search latency: < 100ms

### Phase D: Mentor Workflows
- Daily practice engagement: > 60%
- Check-in response rate: > 50%
- Intervention effectiveness: > 40% behavior change
- Multi-session plan adherence: > 65%

### Phase E: Self-Evaluation
- Confidence calibration accuracy: > 80%
- Source citation coverage: > 70%
- Rubric pass rate: > 95%
- User feedback correlation: > 0.7

### Phase F: Reliability
- System uptime: 99.9%
- Model fallback success: > 99%
- External source freshness: < 24 hours
- Regression test pass rate: > 99%

---

## Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Vector store scaling | High | Medium | Start with pgvector, plan Pinecone migration |
| Real-time complexity | Medium | High | MVP with polling, add WebSocket incrementally |
| Model costs | High | Medium | Aggressive caching, local model fallback |
| Privacy concerns | High | Medium | PII detection, automatic redaction |
| Agent reliability | High | Medium | Confidence thresholds, human escalation |
| Knowledge freshness | Medium | Low | Background refresh jobs, staleness alerts |

---

## Timeline and Milestones

### 44-Week Implementation Timeline

```
Week  1-8:   Phase A - Agentic Core
Week  9-14:  Phase B - Tool Execution Layer
Week 15-22:  Phase C - Long-Term Memory
Week 23-30:  Phase D - Mentor Workflows
Week 31-36:  Phase E - Self-Evaluation
Week 37-44:  Phase F - Reliability & Ops

Key Milestones:
├── Week 8:  First autonomous goal-to-plan pipeline
├── Week 14: Tool execution with audit trail
├── Week 22: Vector + knowledge graph operational
├── Week 30: Proactive check-ins live
├── Week 36: Confidence scoring deployed
└── Week 44: Production-ready agentic mentor
```

### Deliverables by Phase

| Phase | Primary Deliverable | Secondary Deliverables |
|-------|--------------------|-----------------------|
| A | `@sam-ai/agentic` package | Goal/Plan API, State machine |
| B | Tool registry + executor | Audit system, Permissions |
| C | Vector store + KG | Cross-session context |
| D | Proactive engine | Check-ins, Daily practice |
| E | Confidence system | Source tracing, Rubrics |
| F | WebSocket + Router | Golden tests, Monitoring |

---

## Appendix: File Structure

```
packages/
├── agentic/                    # NEW: Core agentic capabilities
│   ├── src/
│   │   ├── goal-planning/
│   │   │   ├── goal-decomposer.ts
│   │   │   ├── plan-builder.ts
│   │   │   ├── agent-state-machine.ts
│   │   │   ├── step-executor.ts
│   │   │   ├── plan-store.ts
│   │   │   └── types.ts
│   │   ├── tool-execution/
│   │   │   ├── tool-registry.ts
│   │   │   ├── permission-manager.ts
│   │   │   ├── tool-executor.ts
│   │   │   ├── audit-logger.ts
│   │   │   ├── confirmation-manager.ts
│   │   │   └── types.ts
│   │   ├── long-term-memory/
│   │   │   ├── vector-store.ts
│   │   │   ├── knowledge-graph-manager.ts
│   │   │   ├── cross-session-context.ts
│   │   │   ├── memory-retriever.ts
│   │   │   ├── journey-timeline.ts
│   │   │   └── types.ts
│   │   ├── proactive-intervention/
│   │   │   ├── behavior-monitor.ts
│   │   │   ├── intervention-trigger.ts
│   │   │   ├── notification-manager.ts
│   │   │   ├── check-in-scheduler.ts
│   │   │   ├── multi-session-plan-tracker.ts
│   │   │   └── types.ts
│   │   ├── self-evaluation/
│   │   │   ├── confidence-scorer.ts
│   │   │   ├── source-tracer.ts
│   │   │   ├── rubric-verifier.ts
│   │   │   ├── self-critique-loop.ts
│   │   │   ├── effectiveness-tracker.ts
│   │   │   └── types.ts
│   │   ├── multi-agent/
│   │   │   ├── agent-coordinator.ts
│   │   │   ├── agents/
│   │   │   │   ├── teacher-agent.ts
│   │   │   │   ├── socratic-agent.ts
│   │   │   │   ├── debugger-agent.ts
│   │   │   │   ├── causal-agent.ts
│   │   │   │   └── motivational-agent.ts
│   │   │   ├── conflict-resolver.ts
│   │   │   └── types.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── realtime/                   # NEW: WebSocket and presence
│   ├── src/
│   │   ├── websocket-manager.ts
│   │   ├── presence-manager.ts
│   │   ├── live-collaboration.ts
│   │   ├── realtime-sync.ts
│   │   └── types.ts
│   └── package.json
├── knowledge/                  # NEW: External knowledge
│   ├── src/
│   │   ├── integrations/
│   │   │   ├── news-integration.ts
│   │   │   ├── research-integration.ts
│   │   │   └── trends-integration.ts
│   │   ├── freshness-manager.ts
│   │   ├── source-aggregator.ts
│   │   └── types.ts
│   └── package.json
└── ... (existing packages)
```

---

## Summary

This comprehensive plan transforms SAM from a reactive AI tutor into a fully autonomous agentic AI mentor with:

1. **Agentic Core**: Persistent goal tracking, task decomposition, resumable state
2. **Tool Execution**: Registry, permissions, audit logging, user confirmation
3. **Long-Term Memory**: Vector store, knowledge graph, cross-session context
4. **Mentor Workflows**: Multi-session plans, daily practice, proactive check-ins
5. **Self-Evaluation**: Confidence scoring, source tracing, rubric verification
6. **Reliability**: WebSocket, model routing, external knowledge, golden tests

**Estimated Timeline**: 44 weeks
**New Packages**: 3 (`@sam-ai/agentic`, `@sam-ai/realtime`, `@sam-ai/knowledge`)
**New Database Models**: 14
**New API Endpoints**: 25+

---

*Document Version: 1.0.0*
*Last Updated: December 2024*
*Status: Ready for Implementation*
