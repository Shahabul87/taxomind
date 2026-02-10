# AI Provider Audit Report

**Date**: February 2026
**Status**: Active - Implementation in Progress
**Author**: Enterprise Architecture Review

---

## Executive Summary

The Taxomind AI provider system has **~29 call sites that bypass enterprise provider resolution**, meaning user preferences, rate limiting, usage tracking, and admin controls are silently ignored for a large portion of AI operations.

---

## Current Provider Resolution Flow

The enterprise client (`lib/ai/enterprise-client.ts`) implements a 4-step resolution chain:

1. **Explicit provider override** (if specified in the call)
2. **User preference** (if `userId` provided, queries `UserAIPreferences`)
3. **Platform default** (from `PlatformAISettings` DB table)
4. **Factory fallback** (DeepSeek > Anthropic > OpenAI based on configured API keys)

**The problem**: Steps 2-4 are only active when calls go through `aiClient.chat()` with a `userId`. Most SAM AI calls bypass this entirely.

---

## Bypass Paths

### Category A: Direct `aiClient.chat()` Calls Missing `userId` (9 calls in 4 files)

These calls go through the enterprise client but skip user preference resolution and usage tracking because `userId` is not provided.

| File | Line(s) | Function | Capability |
|------|---------|----------|-----------|
| `lib/ai-content-generator.ts` | 164 | `generateCourseStrategy()` | course |
| `lib/ai-content-generator.ts` | 225 | `generateDetailedCourseStructure()` | course |
| `lib/ai-content-generator.ts` | 309 | `generateEnhancedChapters()` | course |
| `lib/ai-content-generator.ts` | 358 | `generateCourseLevelProject()` | course |
| `lib/course-blueprint-generator.ts` | 150 | `generateCourseBlueprint()` | course |
| `lib/course-blueprint-generator.ts` | 203 | `generateSamSuggestion()` | chat |
| `lib/sam/exam-generation/exam-generator-service.ts` | 167 | `generateWithAI()` | analysis |
| `lib/sam-engines/educational/sam-subjective-evaluator.ts` | 122 | `evaluateAnswer()` | analysis |
| `lib/sam-engines/educational/sam-subjective-evaluator.ts` | 576 | `quickEvaluate()` | analysis |

**Impact**: No rate limiting, no usage tracking, no user preference resolution for these calls.

### Category B: `getCoreAIAdapter()` Bypass (20 routes + 9 services)

These calls use `getCoreAIAdapter()` from `lib/sam/integration-adapters.ts`, which creates a singleton adapter using `getDefaultAdapter()` from `ai-factory.ts`. This completely bypasses the enterprise client's 4-step resolution chain.

#### Routes (10 files)

| File | Engine | Capability |
|------|--------|-----------|
| `app/api/sam/microlearning/route.ts` | MicrolearningEngine | analysis |
| `app/api/sam/metacognition/route.ts` | MetacognitionEngine | analysis |
| `app/api/sam/competency/route.ts` | CompetencyEngine | analysis |
| `app/api/sam/peer-learning/route.ts` | PeerLearningEngine | chat |
| `app/api/sam/integrity/route.ts` | IntegrityEngine | analysis |
| `app/api/sam/multimodal/route.ts` | MultimodalInputEngine | analysis |
| `app/api/sam/skill-build-track/route.ts` | SkillBuildTrackEngine | analysis |
| `app/api/sam/context/route.ts` | (direct adapter use) | chat |
| `app/api/sam/agentic/goals/[goalId]/decompose/route.ts` | GoalDecomposer | chat |
| `app/api/admin/system-health/route.ts` | (diagnostic) | N/A |

#### Services (10 files)

| File | Function | userId Available |
|------|----------|------------------|
| `lib/sam/agentic/goal-planning-service.ts` | `initializeGoalDecomposer()` | YES (`this.userId`) |
| `lib/sam/agentic-chat/processor.ts` | `planAndExecuteTool()` | YES (`this.userId`) |
| `lib/sam/agentic-chat/intent-classifier.ts` | `classifyTier2()` | NO (standalone function) |
| `lib/sam/modes/ai-mode-classifier.ts` | `classifyModeWithAI()` | NO (standalone function) |
| `lib/sam/criterion-evaluator.ts` | `createAnthropicCriterionEvaluator()` | NO (factory function) |
| `lib/sam/agentic-tooling.ts` | `getToolAiAdapter()` | NO (singleton) |
| `lib/sam/services/conversation-threading.ts` | `autoSummarize()` | YES (from conversation record) |
| `lib/sam/cross-feature-bridge.ts` | `getSharedSkillBuildTrackEngine()` | NO (shared singleton) |
| `lib/sam/pipeline/subsystem-init.ts` | `initializeSubsystems()` | NO (app bootstrap) |
| `lib/sam/sam-services.ts` | `_initializeAIAdapter()` | NO (app singleton) |

**Impact**: All SAM AI calls use hardcoded DeepSeek > Anthropic > OpenAI priority, ignoring user preferences entirely.

### Category C: Platform Settings Never Enforced (3 sub-claims)

The `PlatformAISettings` table contains:

1. **Provider enable/disable toggles** (`anthropicEnabled`, `deepseekEnabled`, etc.) - **Never checked** during provider resolution
2. **`allowUserProviderSelection`** / **`allowUserModelSelection`** - **Never enforced** in the enterprise client
3. **`maintenanceMode`** - **Never checked** before AI operations

These fields exist in the database schema (`prisma/domains/08-ai.prisma`) but the enterprise client only reads `defaultProvider` and `fallbackProvider`.

### Category D: No Global Provider Setting

Users can set per-capability providers (chat, course, analysis, code, skill-roadmap) but there is no "use the same provider for everything" option. The `preferredGlobalProvider` field does not exist in `UserAIPreferences`.

---

## Desired Unified Flow

```
User AI Request
    │
    ▼
TaxomindContext.getUserScopedAIAdapter(userId, capability)
    │
    ▼
createUserScopedAdapter(userId, capability)
    │  Returns CoreAIAdapter that internally calls:
    │  aiClient.chat({ userId, capability, messages... })
    │
    ▼
Enterprise Client (full resolution chain)
    │  1. Check maintenanceMode
    │  2. Explicit override (if any)
    │  3. User prefs (global → per-capability) filtered by enabled providers
    │  4. Platform default (filtered by enabled)
    │  5. Factory fallback (filtered by enabled)
    │
    ▼
SAM Packages (portable — see only CoreAIAdapter interface)
```

---

## Solution: UserScopedCoreAdapter

A bridge adapter (`lib/ai/user-scoped-adapter.ts`) that implements the `CoreAIAdapter` interface from `@sam-ai/core` but internally delegates to the enterprise client with `userId` and `capability` baked in.

This preserves SAM package portability (they only see `CoreAIAdapter`) while ensuring every AI call goes through full enterprise resolution.

---

## File Reference Map

| Layer | File | Role |
|-------|------|------|
| Bridge | `lib/ai/user-scoped-adapter.ts` | NEW - Creates CoreAIAdapter wrapping enterprise client |
| Enterprise | `lib/ai/enterprise-client.ts` | Provider resolution, rate limiting, usage tracking |
| Context | `lib/sam/taxomind-context.ts` | Single entry point for AI adapters |
| Legacy | `lib/sam/integration-adapters.ts` | getCoreAIAdapter() - to be deprecated |
| Factory | `lib/sam/providers/ai-factory.ts` | Low-level adapter creation |
| Registry | `lib/sam/providers/ai-registry.ts` | Provider availability checks |
| Schema | `prisma/domains/08-ai.prisma` | UserAIPreferences, PlatformAISettings |
| Preferences API | `app/api/settings/ai-preferences/route.ts` | User preference CRUD |
