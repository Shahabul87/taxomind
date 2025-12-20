# Understanding SAM AI Tutor Architecture

You are tasked with understanding the SAM (Smart Adaptive Mentor) AI Tutor architecture. This document has been updated to reflect the **new unified system** implemented in Phase 4.

## 📚 Key Documentation

### Primary Documentation
**Read**: `docs/features/sam-ai-system/SAM_OLD_VS_NEW_ARCHITECTURE.md`

This is the most comprehensive document explaining:
- The old system problems and why we unified
- The new architecture with SAMAgentOrchestrator
- Complete file mappings (old vs new locations)
- Data flow diagrams
- Migration paths

### Supporting Documentation
- `docs/features/sam-ai-system/SAM_UNIFICATION_PLAN.md` - Original unification plan
- `docs/features/sam-ai-system/PHASE_3_IMPLEMENTATION.md` - State machine details
- `docs/features/sam-ai-system/PHASE_4_STREAMING.md` - Streaming implementation

---

## 🏗️ New Unified Architecture

### Core Package Location
```
packages/core/src/           # @sam-ai/core package
├── orchestrator.ts          # SAMAgentOrchestrator (main entry)
├── state-machine.ts         # SAMStateMachine
├── types/                   # TypeScript definitions
├── engines/                 # 6 unified engines
│   ├── context/
│   ├── blooms/
│   ├── content/
│   ├── personalization/
│   ├── assessment/
│   └── response/
├── adapters/               # AI and cache adapters
└── errors/                 # Error handling
```

### Active SAM Files
```
components/sam/
├── SAMAssistant.tsx         # Main unified component
├── sam-global-provider.tsx  # Global provider

app/api/sam/unified/
├── route.ts                 # Main API endpoint
└── stream/route.ts          # SSE streaming

lib/sam/
├── form-actions.ts          # Form field detection
├── gamification.ts          # XP, levels, achievements
└── engine-presets.ts        # Engine selection
```

---

## 🎯 Key Concepts to Understand

### 1. SAMAgentOrchestrator
The central orchestrator that:
- Manages engine registration and dependencies
- Uses **topological sort** for execution order
- Runs independent engines in **parallel**
- Handles errors gracefully with fallbacks

```typescript
// Key pattern
const orchestrator = new SAMAgentOrchestrator(config);
orchestrator.registerEngine(createContextEngine(config));
orchestrator.registerEngine(createBloomsEngine(config));
// ... register all engines

const result = await orchestrator.orchestrate(context, message, options);
```

### 2. Engine Dependency Graph
Engines declare dependencies and execute in tiers:
```
Tier 1 (Parallel): context, personalization
Tier 2 (After Tier 1): blooms, content
Tier 3 (After all): response, assessment
```

### 3. State Machine
States: `idle` → `processing` → `success`/`error` → `idle`

### 4. Unified API
Single endpoint: `POST /api/sam/unified`
- Accepts message, pageContext, formContext, conversationHistory
- Returns response, suggestions, actions, insights, metadata

---

## 📁 File Location Quick Reference

| What You Need | Location |
|--------------|----------|
| Main orchestrator | `packages/core/src/orchestrator.ts` |
| Engine implementations | `packages/core/src/engines/*/` |
| Main component | `components/sam/SAMAssistant.tsx` |
| API endpoint | `app/api/sam/unified/route.ts` |
| Streaming | `app/api/sam/unified/stream/route.ts` |
| Form actions | `lib/sam/form-actions.ts` |
| Gamification | `lib/sam/gamification.ts` |
| Global provider | `components/sam/sam-global-provider.tsx` |

---

## ⚠️ Deprecated Code

All deprecated SAM code has been moved to:
```
sam_ai_deprecated/
├── README.md                 # Explains what was deprecated and why
├── sam-ai-tutor-legacy/      # Old engines (40+ files)
├── teacher-sam-components/   # Old providers (5 nested providers)
├── old-providers/            # Additional old providers
└── old-docs/                 # Old architecture documentation
```

**Do not use deprecated code.** It exists only for historical reference.

---

## 🔍 Understanding the New System

### Step 1: Read the Architecture Doc (15 min)
```bash
# Read this first
docs/features/sam-ai-system/SAM_OLD_VS_NEW_ARCHITECTURE.md
```

### Step 2: Explore the Core Package (20 min)
```bash
# Understand the orchestrator
packages/core/src/orchestrator.ts

# Understand an engine
packages/core/src/engines/blooms/engine.ts
```

### Step 3: See It In Action (15 min)
```bash
# Main component
components/sam/SAMAssistant.tsx

# API endpoint
app/api/sam/unified/route.ts
```

### Step 4: Understand Data Flow (10 min)
```
User Message
     ↓
SAMAssistant.tsx (handleSendMessage)
     ↓
POST /api/sam/unified
     ↓
SAMAgentOrchestrator.orchestrate()
     ↓
Engine Execution (parallel where safe)
     ↓
Response aggregation
     ↓
JSON Response to frontend
```

---

## ✅ Understanding Checklist

After reading the documentation:

- [ ] Understand why old system was problematic (5 providers, no dependency awareness)
- [ ] Know where @sam-ai/core package lives
- [ ] Can explain SAMAgentOrchestrator role
- [ ] Understand engine dependency graph concept
- [ ] Know the 6 unified engines
- [ ] Can locate main component (SAMAssistant.tsx)
- [ ] Know the unified API endpoint location
- [ ] Understand form actions and gamification features
- [ ] Know where deprecated code lives (and to not use it)

---

## 💡 Common Tasks

### Adding a New Engine
1. Create engine in `packages/core/src/engines/your-engine/`
2. Implement `SAMEngine` interface
3. Register in orchestrator with dependencies
4. Export from `packages/core/src/index.ts`

### Modifying SAM UI
1. Edit `components/sam/SAMAssistant.tsx`
2. Use hooks: `useSAMAssistant()` for state
3. Form actions available in `lib/sam/form-actions.ts`

### Debugging SAM
1. Check browser console for client errors
2. Check server logs for API errors
3. Orchestrator logs engine execution order and timing

---

**Last Updated**: December 2024 (Phase 4 Unification Complete)
