SAM Analysis Comparison & Unified Plan

  1. Analysis Comparison

  Current State - Where I Was Wrong

  | Area           | My Assessment                           | Your Assessment (Correct)                                       | Delta                                   |
  |----------------|-----------------------------------------|-----------------------------------------------------------------|-----------------------------------------|
  | Memory System  | ❌ "In-memory only"                     | ✅ OpenAI embeddings + Prisma vector + KG                       | Operational, not just stubbed           |
  | Tool Execution | ⚠️ "Registry defined but not connected" | ✅ Hooked into API + UI, LLM-driven planning                    | Already wired                           |
  | Unified Flow   | ❌ Missed this entirely                 | ✅ Confidence, verification, interventions, memory in main chat | Critical integration exists             |
  | Vector Search  | ❌ "No vector DB"                       | ✅ Prisma/pgvector with search endpoints                        | Working but could use external adapters |

  My blind spots: I focused on package code, not the integration layer (lib/sam/*, app/api/sam/unified/*). You've done significant wiring work I didn't surface.

  Gap Alignment

  | Gap                            | My Analysis          | Your Analysis                               | Alignment                                          |
  |--------------------------------|----------------------|---------------------------------------------|----------------------------------------------------|
  | Provider Abstraction           | 🔴 Critical gap      | Not mentioned                               | You're likely okay with Anthropic + OpenAI for now |
  | Database Abstraction           | 🔴 Critical gap      | ⚠️ Want external vector adapters            | Partial alignment - vector DB flexibility          |
  | Standalone Runtime             | 🔴 Critical gap      | 🔴 Integration Profile needed               | Different framing, same need                       |
  | State Machine Driving Tutoring | ❌ Missed            | 🔴 Critical gap                             | Your insight is key                                |
  | Memory Lifecycle               | ❌ Missed            | 🔴 No auto-reindex, no scheduled KG refresh | Critical operational gap                           |
  | Real-time/WebSocket            | 🟡 Mentioned         | 🔴 Only SSE in chat                         | Aligned                                            |
  | QA/Observability               | 🟡 Briefly mentioned | 🔴 No golden tests, thin metrics            | Your emphasis is stronger                          |

⏺ ---
  2. Unified Gap Assessment

  🔴 CRITICAL GAPS (Blocking Portability + Autonomy)

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      UNIFIED CRITICAL GAPS                              │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  1. NO INTEGRATION PROFILE                                              │
  │     ├─ SAM doesn't know what host it's in                              │
  │     ├─ Can't adapt behavior per deployment                             │
  │     ├─ Portability logic scattered in lib/sam/*                        │
  │     └─ No capability registry for what's available                     │
  │                                                                         │
  │  2. STATE MACHINE NOT DRIVING TUTORING                                  │
  │     ├─ StepExecutor exists but isn't orchestrating                     │
  │     ├─ Goals/Plans are passive data, not active drivers                │
  │     ├─ No continuous tutoring loop across sessions                     │
  │     └─ Tool usage not tied to plan context                             │
  │                                                                         │
  │  3. MEMORY LIFECYCLE NOT MANAGED                                        │
  │     ├─ No auto-reindex on course updates                               │
  │     ├─ No scheduled KG refresh                                         │
  │     ├─ No external vector DB adapters (only Prisma/pgvector)           │
  │     └─ Memory outputs not consistently normalized                       │
  │                                                                         │
  │  4. NO REAL-TIME PROACTIVE CHANNEL                                      │
  │     ├─ Interventions rely on API/cron polling                          │
  │     ├─ No WebSocket for SAM presence                                   │
  │     ├─ SSE only in chat, not for push notifications                    │
  │     └─ UI interventions limited to assistant panel                     │
  │                                                                         │
  │  5. THIN AGENTIC QA/OBSERVABILITY                                       │
  │     ├─ No golden tests for agentic flows                               │
  │     ├─ No tool success metrics                                         │
  │     ├─ No memory retrieval quality tracking                            │
  │     └─ No confidence calibration monitoring                            │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  Gap Prioritization Matrix

  | Gap                         | Portability Impact | Autonomy Impact | User Experience | Effort |
  |-----------------------------|--------------------|-----------------|-----------------|--------|
  | Integration Profile         | 🔴 Critical        | 🟡 Medium       | 🟡 Medium       | Medium |
  | State Machine Orchestration | 🟡 Medium          | 🔴 Critical     | 🔴 Critical     | High   |
  | Memory Lifecycle            | 🟡 Medium          | 🔴 Critical     | 🟡 Medium       | Medium |
  | Real-time Proactive         | 🟢 Low             | 🔴 Critical     | 🔴 Critical     | High   |
  | QA/Observability            | 🟢 Low             | 🟡 Medium       | 🟢 Low          | Medium |

  ---

⏺ 3. Unified Development Plan

  Architecture Target

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                    PORTABLE, INTEGRATED, INTEGRATION-AWARE SAM              │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                                                                             │
  │  ┌─────────────────────────────────────────────────────────────────────┐   │
  │  │                    INTEGRATION PROFILE LAYER                         │   │
  │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │   │
  │  │  │ Capability   │  │ Entity       │  │ Adapter Factory           │  │   │
  │  │  │ Registry     │  │ Mapping      │  │ (DB/Auth/AI/Notify)       │  │   │
  │  │  └──────────────┘  └──────────────┘  └───────────────────────────┘  │   │
  │  └─────────────────────────────────────────────────────────────────────┘   │
  │                                    │                                        │
  │  ┌─────────────────────────────────┴───────────────────────────────────┐   │
  │  │                    AGENTIC ORCHESTRATION LAYER                       │   │
  │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │   │
  │  │  │ Tutoring     │  │ Step         │  │ Tool Planning +           │  │   │
  │  │  │ Loop         │  │ Executor     │  │ Confirmation Gates        │  │   │
  │  │  │ Controller   │  │ (Active)     │  │                           │  │   │
  │  │  └──────────────┘  └──────────────┘  └───────────────────────────┘  │   │
  │  └─────────────────────────────────────────────────────────────────────┘   │
  │                                    │                                        │
  │  ┌─────────────────────────────────┴───────────────────────────────────┐   │
  │  │                    MEMORY & KNOWLEDGE PIPELINE                       │   │
  │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │   │
  │  │  │ Lifecycle    │  │ Vector       │  │ KG Refresh                │  │   │
  │  │  │ Manager      │  │ Adapters     │  │ Scheduler                 │  │   │
  │  │  │ (Reindex)    │  │ (External)   │  │                           │  │   │
  │  │  └──────────────┘  └──────────────┘  └───────────────────────────┘  │   │
  │  └─────────────────────────────────────────────────────────────────────┘   │
  │                                    │                                        │
  │  ┌─────────────────────────────────┴───────────────────────────────────┐   │
  │  │                    PROACTIVE & REAL-TIME LAYER                       │   │
  │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │   │
  │  │  │ WebSocket    │  │ Push         │  │ UI Intervention           │  │   │
  │  │  │ Channel      │  │ Dispatcher   │  │ Surfaces                  │  │   │
  │  │  └──────────────┘  └──────────────┘  └───────────────────────────┘  │   │
  │  └─────────────────────────────────────────────────────────────────────┘   │
  │                                    │                                        │
  │  ┌─────────────────────────────────┴───────────────────────────────────┐   │
  │  │                    QUALITY & OPERATIONS LAYER                        │   │
  │  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │   │
  │  │  │ Golden       │  │ Telemetry    │  │ Health                    │  │   │
  │  │  │ Tests        │  │ (Tools/Mem)  │  │ Dashboard                 │  │   │
  │  │  └──────────────┘  └──────────────┘  └───────────────────────────┘  │   │
  │  └─────────────────────────────────────────────────────────────────────┘   │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘

  ---
  4. Phase-by-Phase Implementation Plan

  Phase 1: Integration Profile + Portability (3-4 weeks)

  Goal: SAM knows its host, adapts behavior, and can be embedded elsewhere

  Deliverables

  | Deliverable         | Description                              | Files                               |
  |---------------------|------------------------------------------|-------------------------------------|
  | @sam-ai/integration | New package for integration abstractions | packages/integration/               |
  | IntegrationProfile  | Host capability registry                 | packages/integration/src/profile.ts |
  | AdapterFactory      | Create adapters based on profile         | packages/integration/src/adapters/  |
  | HostDetector        | Auto-detect host environment             | packages/integration/src/detect.ts  |
  | Taxomind Adapter    | Move lib/sam/* specifics here            | packages/adapter-taxomind/          |

  Integration Profile Schema

  // packages/integration/src/types.ts
  interface IntegrationProfile {
    id: string;
    name: string;
    version: string;

    // What the host provides
    capabilities: {
      // Database
      database: {
        type: 'prisma' | 'drizzle' | 'mongoose' | 'in-memory';
        supportsVectors: boolean;
        vectorAdapter?: 'pgvector' | 'pinecone' | 'weaviate' | 'qdrant';
      };

      // Authentication
      auth: {
        type: 'nextauth' | 'clerk' | 'custom' | 'anonymous';
        roles: string[];
        getUserId: () => Promise<string | null>;
      };

      // AI Providers
      ai: {
        chat: 'anthropic' | 'openai' | 'google' | 'ollama';
        embeddings: 'openai' | 'cohere' | 'local';
      };

      // Real-time
      realtime: {
        available: boolean;
        type?: 'websocket' | 'sse' | 'polling';
      };

      // Notifications
      notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
        inApp: boolean;
      };
    };

    // Entity mapping (how host entities map to SAM concepts)
    entities: {
      user: { table: string; idField: string; };
      course?: { table: string; idField: string; };
      content?: { table: string; idField: string; };
      progress?: { table: string; idField: string; };
    };

    // Allowed tools in this host
    allowedTools: string[];

    // Data sources for memory/KG
    dataSources: {
      curriculum: boolean;
      userHistory: boolean;
      externalKnowledge: boolean;
    };
  }

  Tasks

  Phase 1 Tasks
  ├── 1.1 Create @sam-ai/integration package structure
  │   ├── Define IntegrationProfile interface
  │   ├── Create CapabilityRegistry class
  │   └── Create AdapterFactory with DI container
  │
  ├── 1.2 Create adapter interfaces
  │   ├── DatabaseAdapter (abstract Prisma specifics)
  │   ├── AuthAdapter (abstract NextAuth specifics)
  │   ├── VectorAdapter (pgvector, Pinecone, Weaviate)
  │   └── NotificationAdapter (email, push, in-app)
  │
  ├── 1.3 Create @sam-ai/adapter-taxomind package
  │   ├── Move lib/sam/stores/* to adapter
  │   ├── Implement Taxomind-specific entity mappings
  │   └── Remove @/ imports from @sam-ai/* packages
  │
  ├── 1.4 Refactor agentic-bridge.ts
  │   ├── Accept IntegrationProfile as config
  │   ├── Use AdapterFactory instead of direct imports
  │   └── Make all host-specific logic adapter-driven
  │
  └── 1.5 Create host detection utility
      ├── Auto-detect Next.js, Express, standalone
      ├── Probe for available capabilities
      └── Generate IntegrationProfile from environment

  ---
  Phase 2: Agentic Autonomy (4-5 weeks)

  Goal: State machine actively drives tutoring, not just stores data

  Current Problem

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         CURRENT (Passive)                               │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  User Message → Unified Route → LLM Response → (Goals/Plans ignored)   │
  │                                                                         │
  │  Goals/Plans are CRUD objects, not active drivers                      │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         TARGET (Active)                                 │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  User Message                                                           │
  │       │                                                                 │
  │       ▼                                                                 │
  │  ┌─────────────────────────────────────────────────────────────────┐   │
  │  │              TUTORING LOOP CONTROLLER                            │   │
  │  │                                                                  │   │
  │  │  1. Get active plan + current step                              │   │
  │  │  2. Inject step context into prompt                             │   │
  │  │  3. Evaluate if step can advance                                │   │
  │  │  4. Plan tool usage for step (with confirmation)                │   │
  │  │  5. Update plan state after response                            │   │
  │  │  6. Schedule next step/check-in                                 │   │
  │  │                                                                  │   │
  │  └─────────────────────────────────────────────────────────────────┘   │
  │       │                                                                 │
  │       ▼                                                                 │
  │  Context-Enriched LLM Call → Response → State Update → Next Step       │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  Deliverables

  | Deliverable               | Description                           | Location                            |
  |---------------------------|---------------------------------------|-------------------------------------|
  | TutoringLoopController    | Orchestrates plan-driven tutoring     | packages/agentic/src/orchestration/ |
  | ActiveStepExecutor        | Executes steps with tool binding      | packages/agentic/src/orchestration/ |
  | PlanContextInjector       | Injects plan context into prompts     | packages/agentic/src/orchestration/ |
  | ConfirmationGate          | User confirmation for tool usage      | packages/agentic/src/orchestration/ |
  | Unified Route Integration | Wire controller into /api/sam/unified | app/api/sam/unified/route.ts        |

  Tutoring Loop Flow

  // packages/agentic/src/orchestration/tutoring-loop.ts
  interface TutoringLoopController {
    // Before LLM call
    prepareContext(userId: string, message: string): Promise<TutoringContext>;

    // After LLM call
    evaluateProgress(context: TutoringContext, response: string): Promise<StepEvaluation>;

    // State transitions
    advanceStep(planId: string, evaluation: StepEvaluation): Promise<StepTransition>;

    // Tool orchestration
    planToolUsage(context: TutoringContext): Promise<ToolPlan>;

    // Confirmation gates
    requestConfirmation(toolPlan: ToolPlan): Promise<ConfirmationResult>;
  }

  interface TutoringContext {
    userId: string;
    sessionId: string;
    activePlan: ExecutionPlan | null;
    currentStep: PlanStep | null;
    stepObjectives: string[];
    allowedTools: ToolDefinition[];
    memoryContext: CrossSessionContext;
    interventionsPending: Intervention[];
  }

  Tasks

  Phase 2 Tasks
  ├── 2.1 Create orchestration module
  │   ├── TutoringLoopController class
  │   ├── ActiveStepExecutor (wires StepExecutor to runtime)
  │   └── PlanContextInjector (formats plan context for LLM)
  │
  ├── 2.2 Integrate with unified route
  │   ├── Call controller.prepareContext() before LLM
  │   ├── Inject step objectives into system prompt
  │   ├── Call controller.evaluateProgress() after response
  │   └── Auto-advance steps when criteria met
  │
  ├── 2.3 Tool planning with plan context
  │   ├── toolPlanner.ts uses current step to scope tools
  │   ├── Add step_id to tool invocations for tracing
  │   └── Require confirmation for high-impact tools
  │
  ├── 2.4 Step advancement logic
  │   ├── Define completion criteria per step type
  │   ├── Auto-transition to next step
  │   ├── Handle blocked/failed steps (fallback strategies)
  │   └── Surface step transitions to user
  │
  ├── 2.5 Cross-session continuity
  │   ├── Resume active plan on session start
  │   ├── Summarize previous session progress
  │   └── Remind user of current objectives
  │
  └── 2.6 UI integration
      ├── Show current step/plan progress in SAMAssistant
      ├── Display step completion feedback
      └── Allow manual step navigation

  ---
  Phase 3: Memory & Knowledge Graph Pipeline (3-4 weeks)

  Goal: Memory is lifecycle-managed with external adapter support

  Current Problem

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                         CURRENT                                         │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  Course Update ─────────────────────────────────────────────────→ ∅    │
  │  (Memory not updated)                                                   │
  │                                                                         │
  │  KG ─────────────────────────────────────────────────────────────→ ∅   │
  │  (Never refreshed)                                                      │
  │                                                                         │
  │  Vector Search ───→ Prisma/pgvector only                               │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  Deliverables

  | Deliverable            | Description                | Location                           |
  |------------------------|----------------------------|------------------------------------|
  | MemoryLifecycleManager | Manages reindex triggers   | packages/agentic/src/memory/       |
  | VectorAdapterInterface | Abstract vector operations | packages/integration/src/adapters/ |
  | PineconeAdapter        | Pinecone implementation    | packages/adapter-pinecone/         |
  | WeaviateAdapter        | Weaviate implementation    | packages/adapter-weaviate/         |
  | KGRefreshScheduler     | Scheduled KG updates       | lib/sam/services/                  |
  | MemoryNormalizer       | Consistent output format   | packages/agentic/src/memory/       |

  Tasks

  Phase 3 Tasks
  ├── 3.1 Create VectorAdapter interface
  │   ├── upsert(vectors), search(query, k), delete(ids)
  │   ├── PrismaVectorAdapter (wrap existing)
  │   ├── PineconeAdapter
  │   └── WeaviateAdapter
  │
  ├── 3.2 Memory lifecycle management
  │   ├── Listen to course/chapter/section CRUD events
  │   ├── Queue reindex jobs for affected content
  │   ├── Debounce rapid updates (batch reindex)
  │   └── Track reindex status per entity
  │
  ├── 3.3 KG refresh scheduler
  │   ├── Cron job for periodic KG rebuild
  │   ├── Incremental updates (not full rebuild)
  │   ├── Relationship consistency checks
  │   └── Stale relationship pruning
  │
  ├── 3.4 Memory output normalization
  │   ├── Define standard MemoryContext schema
  │   ├── All retrievers output same format
  │   └── Consistent prompt injection
  │
  └── 3.5 Background worker infrastructure
      ├── Job queue (BullMQ or similar)
      ├── Reindex worker
      ├── KG refresh worker
      └── Worker health monitoring

  ---
  Phase 4: Proactive + Real-Time (3-4 weeks)

  Goal: SAM pushes interventions via WebSocket, not just API polling

  Deliverables

  | Deliverable             | Description                    | Location                      |
  |-------------------------|--------------------------------|-------------------------------|
  | SAMWebSocketServer      | Dedicated WS channel for SAM   | lib/sam/realtime/             |
  | ProactivePushDispatcher | Push interventions/check-ins   | lib/sam/realtime/             |
  | PresenceTracker         | Track user activity state      | lib/sam/realtime/             |
  | InterventionSurfaces    | UI components beyond assistant | components/sam/interventions/ |

  WebSocket Events

  // SAM WebSocket Event Types
  type SAMWebSocketEvent =
    | { type: 'intervention'; payload: Intervention }
    | { type: 'checkin'; payload: TriggeredCheckIn }
    | { type: 'recommendation'; payload: Recommendation }
    | { type: 'step_completed'; payload: StepCompletion }
    | { type: 'goal_progress'; payload: GoalProgress }
    | { type: 'nudge'; payload: ProactiveNudge };

  Tasks

  Phase 4 Tasks
  ├── 4.1 WebSocket infrastructure
  │   ├── SAMWebSocketServer (Socket.io or native WS)
  │   ├── User connection management
  │   ├── Heartbeat/reconnection handling
  │   └── Authentication middleware
  │
  ├── 4.2 Proactive push dispatcher
  │   ├── Connect check-in scheduler to WS
  │   ├── Push interventions immediately (not cron-delayed)
  │   ├── Priority-based delivery (critical = immediate)
  │   └── Fallback to notification if WS unavailable
  │
  ├── 4.3 Presence tracking
  │   ├── Track last activity timestamp
  │   ├── Detect idle/away states
  │   ├── Trigger check-ins based on inactivity
  │   └── Surface "SAM is thinking" indicators
  │
  ├── 4.4 UI intervention surfaces
  │   ├── Toast notifications for nudges
  │   ├── Modal for critical interventions
  │   ├── Sidebar widget for check-ins
  │   ├── Inline prompts in course content
  │   └── Dashboard widget for recommendations
  │
  └── 4.5 Integration with existing chat
      ├── Upgrade SSE to WS in unified/stream
      ├── Hybrid mode (WS primary, SSE fallback)
      └── Consistent event format

  ---
  Phase 5: Quality & Operations (2-3 weeks)

  Goal: Confidence in agentic behavior through tests and metrics

  Deliverables

  | Deliverable            | Description                    | Location                           |
  |------------------------|--------------------------------|------------------------------------|
  | Agentic Golden Tests   | E2E tests for agentic flows    | packages/agentic/__tests__/golden/ |
  | ToolTelemetry          | Tool success/failure metrics   | lib/sam/telemetry/                 |
  | MemoryQualityTracker   | Retrieval relevance metrics    | lib/sam/telemetry/                 |
  | ConfidenceCalibration  | Track prediction accuracy      | lib/sam/telemetry/                 |
  | AgenticHealthDashboard | Admin dashboard for SAM health | app/(dashboard)/admin/sam-health/  |

  Metrics to Track

  interface AgenticMetrics {
    // Tool Execution
    tools: {
      executionCount: number;
      successRate: number;
      avgLatencyMs: number;
      confirmationRate: number;
      failuresByType: Record<string, number>;
    };

    // Memory/Retrieval
    memory: {
      searchCount: number;
      avgRelevanceScore: number;
      cacheHitRate: number;
      reindexQueue: number;
    };

    // Confidence
    confidence: {
      avgScore: number;
      calibrationError: number;
      verificationOverrideRate: number;
    };

    // Plans/Goals
    plans: {
      activeCount: number;
      completionRate: number;
      avgStepsPerPlan: number;
      dropoffByStep: Record<number, number>;
    };

    // Proactive
    proactive: {
      checkInsSent: number;
      checkInResponseRate: number;
      interventionAcceptRate: number;
    };
  }

  Tasks

  Phase 5 Tasks
  ├── 5.1 Golden tests
  │   ├── Goal creation → decomposition → plan flow
  │   ├── Tool planning → confirmation → execution flow
  │   ├── Memory retrieval → context injection flow
  │   ├── Intervention trigger → delivery flow
  │   └── Full tutoring session simulation
  │
  ├── 5.2 Telemetry instrumentation
  │   ├── Wrap tool executor with metrics
  │   ├── Track memory search latency/relevance
  │   ├── Log confidence vs actual quality
  │   └── Export to OpenTelemetry
  │
  ├── 5.3 Confidence calibration
  │   ├── Compare confidence scores to user feedback
  │   ├── Track calibration error over time
  │   ├── Adjust scoring weights based on data
  │   └── Alert on calibration drift
  │
  ├── 5.4 Health dashboard
  │   ├── Real-time metrics display
  │   ├── Alert thresholds configuration
  │   ├── Historical trend charts
  │   └── Drill-down by user/course
  │
  └── 5.5 Runbook documentation
      ├── Troubleshooting guide
      ├── Recovery procedures
      └── Scaling playbook

  ---

⏺ 5. Implementation Priority Summary

  Recommended Order

  | Phase   | Duration  | Critical Deliverable           | Why First?                      |
  |---------|-----------|--------------------------------|---------------------------------|
  | Phase 1 | 3-4 weeks | Integration Profile + Adapters | Foundation for portability      |
  | Phase 2 | 4-5 weeks | Tutoring Loop Controller       | Makes SAM truly agentic         |
  | Phase 3 | 3-4 weeks | Memory Lifecycle Manager       | Ensures knowledge stays current |
  | Phase 4 | 3-4 weeks | WebSocket Proactive Push       | Real-time engagement            |
  | Phase 5 | 2-3 weeks | Golden Tests + Dashboard       | Confidence in production        |

  Total: 15-20 weeks

  Quick Wins (Can Do Immediately)

  1. Create IntegrationProfile type - 1 day
  2. Extract Prisma stores to adapter package - 2-3 days
  3. Add step context to unified route prompt - 1 day
  4. Create course update webhook for reindex - 2 days
  5. Add tool execution telemetry - 1 day

  Risk Areas

  | Risk                                   | Mitigation                               |
  |----------------------------------------|------------------------------------------|
  | Breaking existing Taxomind integration | Create adapter first, then migrate       |
  | Tutoring loop adds latency             | Async state updates, cache active plan   |
  | WebSocket scaling                      | Use Redis pub/sub for horizontal scale   |
  | Test flakiness with LLM                | Use deterministic mocks for golden tests |

  ---
  6. Final Comparison Summary

  | Aspect        | My Original               | Your Analysis                  | Unified                          |
  |---------------|---------------------------|--------------------------------|----------------------------------|
  | Focus         | Package-level portability | Runtime integration & autonomy | Both: portable AND autonomous    |
  | Memory        | Missing vector DB         | Has pgvector, needs lifecycle  | ✅ Lifecycle + external adapters |
  | State Machine | Not mentioned             | Critical gap                   | ✅ Tutoring loop controller      |
  | Real-time     | WebSocket needed          | Only SSE, needs push           | ✅ Dedicated WS channel          |
  | Testing       | Briefly mentioned         | Critical gap                   | ✅ Golden tests + calibration    |
  | Portability   | Provider abstraction      | Integration Profile            | ✅ Profile + adapters            |

  ---

⏺ Key Takeaways

  1. Your analysis is more accurate - I missed the existing integration work in lib/sam/* and app/api/sam/unified/*
  2. Critical gaps are behavioral, not structural:
    - SAM has the pieces but they're not orchestrated
    - State machine exists but doesn't drive tutoring
    - Memory exists but isn't lifecycle-managed
  3. Portability requires abstraction + detection:
    - Not just adapters, but an Integration Profile that SAM reads
    - SAM should adapt behavior based on what host provides
  4. Phase 2 (Agentic Autonomy) is the highest value:
    - Most impactful for user experience
    - Makes SAM truly intelligent vs just feature-rich