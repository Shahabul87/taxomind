# SAM AI Course Creation Integration Analysis Report

**Date:** December 27, 2025
**Analyst:** Claude Code
**Scope:** SAM AI Portable Integration with Course Creation Wizard
**Last Updated:** December 27, 2025 (Issues #1, #3, #4, #5 FIXED)

---

## Executive Summary

This report provides a comprehensive analysis of the SAM AI integration with the course creation process at `/teacher/create/ai-creator`. **4 of 5 issues have been fixed.** Only Issue #2 (Replace heuristic routes with @sam-ai engines) remains pending.

### Overall Status: ✅ MOSTLY CONNECTED (4/5 Fixed)

| Aspect | Status | Impact |
|--------|--------|--------|
| Basic SAM Chat | ✅ Working | Low |
| Portable Package Architecture | ✅ Installed | Low |
| Complete Generation Flow | ✅ FIXED | HIGH |
| Form Data Context | ✅ FIXED | HIGH |
| AI Adapter Consistency | ✅ FIXED | MEDIUM |
| Action Handling | ✅ FIXED | MEDIUM |
| Quality Scoring | ❌ Uses Random Numbers | MEDIUM |

---

## Issue #1: SAMCompleteGenerationModal Not Wired

### Problem
The `SAMCompleteGenerationModal` component exists but is **NOT imported or used** in the main AI Creator page.

### File Proof

**Component Exists:**
```
app/(protected)/teacher/create/ai-creator/components/sam-complete-generation-modal.tsx:48
export function SAMCompleteGenerationModal({...})
```

**NOT Imported in Page:**
```bash
$ grep -n "SAMCompleteGenerationModal" app/(protected)/teacher/create/ai-creator/page.tsx
# No matches found
```

**Hook Exists But Not Used:**
```typescript
// app/(protected)/teacher/create/ai-creator/page.tsx:126
const { generateCompleteStructure } = useSamCompleteGeneration();
// ^ Imported but NEVER CALLED in handleGenerateCourse()
```

### Current Broken Flow
```
page.tsx:168 handleGenerateCourse()
  ├── /api/courses POST (creates empty course)
  └── /api/sam/ai-tutor/chat (chapter generation via regex parsing)
      └── Uses simple text parsing instead of structured JSON
```

### Expected Flow (Using Portable SAM)
```
SAMCompleteGenerationModal
  └── generateCompleteStructure()
      └── /api/sam/generate-course-structure-complete
          └── Returns structured JSON { chapters, sections, objectives }
```

---

## Issue #2: Heuristic Routes Instead of @sam-ai Engines

### Problem
Course scoring uses **random numbers** instead of actual AI analysis from `@sam-ai/educational` engines.

### File Proof

**Random Score Generation:**
```typescript
// app/(protected)/teacher/create/ai-creator/components/course-scoring-panel.tsx:153-158
return {
  title,
  marketingScore: Math.floor(Math.random() * 30) + 70, // 70-100 RANDOM!
  brandingScore: Math.floor(Math.random() * 30) + 70,  // RANDOM!
  salesScore: Math.floor(Math.random() * 30) + 70,     // RANDOM!
  overallScore: Math.floor(Math.random() * 20) + 80,   // 80-100 RANDOM!
  reasoning: `This title leverages proven marketing principles...` // STATIC TEXT!
};
```

**@sam-ai/educational Engines Available But Not Used:**
```
packages/educational/src/engines/unified-blooms-engine.ts    ✅ EXISTS
packages/educational/src/engines/content-generation-engine.ts ✅ EXISTS
packages/quality/src/pipeline.ts                              ✅ EXISTS
```

### Impact
- Course quality scores are meaningless (random 70-100)
- No actual Bloom's Taxonomy analysis
- No real pedagogical assessment

---

## Issue #3: pageData.forms is Always Empty

### Problem
When calling SAM API endpoints, the `forms` array is **always hardcoded to `[]`**, making SAM blind to actual form data.

### File Proof

**Every API Call Sends Empty Forms:**
```typescript
// app/(protected)/teacher/create/ai-creator/page.tsx:212
pageData: { pageType: "course_creation", title: "Chapter Generation", forms: [] }

// app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts:119
pageData: { pageType: 'course_creation', title: 'AI Course Creator - Suggestions', forms: [] }

// app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts:180
pageData: { pageType: 'course_creation', title: 'AI Course Creator - Validation', forms: [] }

// app/(protected)/teacher/create/ai-creator/components/course-scoring-panel.tsx:127
pageData: { pageType: 'course_creation', title: 'Course Scoring Panel', forms: [] }

// app/(protected)/teacher/create/_components/sam-course-creator-modal.tsx:359
pageData: { pageType: 'course_creation', title: 'Course Creator', forms: [] }
```

**Total Occurrences:** 10+ locations with hardcoded `forms: []`

**Form Registry Store Exists But Not Connected:**
```typescript
// lib/stores/form-registry-store.ts:94
const storeImpl: StateCreator<FormRegistryStore> = (set, get) => ({...})
// ^ This store tracks all form data in real-time but is NEVER read when calling SAM APIs
```

### Impact
- SAM cannot see what the user has entered in forms
- Context-aware suggestions are impossible
- Auto-fill actions cannot work

---

## Issue #4: Fragmented AI Adapter Usage

### Problem
Two different patterns are used across SAM API routes, causing configuration drift.

### File Proof

**Pattern A: Direct createAnthropicAdapter (per-file instantiation)**
```typescript
// app/api/sam/ai-tutor/chat/route.ts:2,6,14
import { createAnthropicAdapter } from '@sam-ai/core';
let aiAdapter: ReturnType<typeof createAnthropicAdapter> | null = null;
aiAdapter = createAnthropicAdapter({
  apiKey,
  model: 'claude-sonnet-4-5-20250929',
  timeout: 60000,
  maxRetries: 2,
});
```

**Pattern B: runSAMChat wrapper (centralized)**
```typescript
// lib/sam/ai-provider.ts:23
export async function runSAMChat(options: {...})

// Used in:
// app/api/sam/generate-course-structure-complete/route.ts:178
const responseText = await runSAMChat({...});
```

**Files Using Pattern A (Direct Adapter):**
- `app/api/sam/ai-tutor/chat/route.ts`
- `app/api/sam/context-aware-assistant/route.ts`
- `app/api/sam/ai-tutor/practice-problems/route.ts`
- `app/api/sam/ai-tutor/content-analysis/route.ts`

**Files Using Pattern B (runSAMChat):**
- `app/api/sam/generate-course-structure-complete/route.ts`
- `app/api/sam/unified-assistant/route.ts`
- `app/api/sam/course-assistant/route.ts`
- 15+ other routes

### Impact
- Model/config changes require updating multiple files
- Inconsistent behavior between routes
- Not truly "portable"

---

## Issue #5: Action Handling Not Consumed

### Problem
SAM API emits structured action tags, but the wizard UI does not consume them.

### File Proof

**Actions ARE Generated by API:**
```typescript
// app/api/sam/ai-tutor/chat/route.ts:219-291
{
  type: 'form_populate',
  field: 'courseTitle',
  value: extractedValue,
  confidence: 0.95,
  source: 'ai_suggestion'
}

{
  type: 'course_creation_action',
  action: 'generate_chapters',
  parameters: {...}
}
```

**Actions NOT Consumed in Wizard:**
```typescript
// app/(protected)/teacher/create/ai-creator/page.tsx
// No code handling action.type === 'form_populate'
// No auto-fill logic
// No action processing
```

**SAMAssistant Has Action Handler But Not Connected to Wizard:**
```typescript
// components/sam/SAMAssistant.tsx:617-621
if (action.type === 'navigation' && action.payload?.url) {
  router.push(action.payload.url);
} else if (action.type === 'page_action' && action.payload?.action === 'refresh') {
  router.refresh();
} else if (action.type === 'form_fill' && action.payload?.field) {
  // Only handles basic form_fill, not course_creation_action
}
```

### Impact
- AI suggestions require manual copy/paste
- No auto-fill functionality
- Actions are generated but wasted

---

## Architecture Diagram: Current vs Expected

### Current Flow (Broken)
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Creator Page                              │
│  ┌────────────────┐    ┌────────────────┐                       │
│  │ Form Fields    │    │ SAM Assistant  │                       │
│  │ (React Hook    │    │ (Not receiving │                       │
│  │  Form)         │────│  form data)    │                       │
│  └────────────────┘    └────────────────┘                       │
│         │                      │                                │
│         │ forms: []            │ forms: []                      │
│         ▼                      ▼                                │
│  ┌────────────────────────────────────────┐                     │
│  │         /api/sam/ai-tutor/chat         │◄── Pattern A        │
│  │         (createAnthropicAdapter)       │    (Direct)         │
│  └────────────────────────────────────────┘                     │
│         │                                                       │
│         │ Actions generated but NOT consumed                    │
│         ▼                                                       │
│  ┌────────────────────────────────────────┐                     │
│  │    handleGenerateCourse() - Regex      │                     │
│  │    parsing chapter titles              │                     │
│  └────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### Expected Flow (Portable SAM)
```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Creator Page                              │
│  ┌────────────────┐    ┌────────────────┐                       │
│  │ Form Fields    │◄──►│ Form Registry  │                       │
│  │ (React Hook    │    │ Store (Zustand)│                       │
│  │  Form)         │    └───────┬────────┘                       │
│  └────────────────┘            │                                │
│         │                      │ Real form data                 │
│         │                      ▼                                │
│  ┌────────────────────────────────────────┐                     │
│  │   SAMCompleteGenerationModal           │                     │
│  │   └── useSamCompleteGeneration()       │                     │
│  └────────────────────────────────────────┘                     │
│         │                                                       │
│         ▼ forms: [actual field data]                            │
│  ┌────────────────────────────────────────┐                     │
│  │  /api/sam/generate-course-structure    │◄── Pattern B        │
│  │  (runSAMChat - centralized)            │    (Unified)        │
│  └────────────────────────────────────────┘                     │
│         │                                                       │
│         ▼ Structured JSON response                              │
│  ┌────────────────────────────────────────┐                     │
│  │  @sam-ai/educational engines           │                     │
│  │  └── UnifiedBloomsEngine               │                     │
│  │  └── ContentGenerationEngine           │                     │
│  └────────────────────────────────────────┘                     │
│         │                                                       │
│         ▼ Actions consumed                                      │
│  ┌────────────────────────────────────────┐                     │
│  │  Action Handler (auto-fill forms)      │                     │
│  └────────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fix Priority Matrix

| Issue | Priority | Effort | Impact |
|-------|----------|--------|--------|
| #3: Feed SAM form data | P0 | LOW | HIGH |
| #1: Wire complete generation modal | P0 | MEDIUM | HIGH |
| #4: Unify AI adapters | P1 | LOW | MEDIUM |
| #5: Wire action handling | P1 | MEDIUM | MEDIUM |
| #2: Replace random scores | P2 | HIGH | MEDIUM |

---

## Recommended Fix Plan

### Phase 1: Quick Wins (1-2 hours)

1. **Fix forms: [] to use Form Registry**
   - File: `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts`
   - Change: Import `useFormRegistry` and pass actual form data

2. **Import and use SAMCompleteGenerationModal**
   - File: `app/(protected)/teacher/create/ai-creator/page.tsx`
   - Change: Import modal and trigger from Generate Course button

### Phase 2: Architecture Alignment (4-6 hours)

3. **Unify AI adapter to runSAMChat**
   - Files: All routes using direct `createAnthropicAdapter`
   - Change: Replace with centralized `runSAMChat` wrapper

4. **Wire action handling**
   - File: `app/(protected)/teacher/create/ai-creator/page.tsx`
   - Change: Add action consumer for `form_populate` and `course_creation_action`

### Phase 3: Full Portable Integration (8-12 hours)

5. **Replace random scores with @sam-ai/educational**
   - File: `course-scoring-panel.tsx`
   - Change: Use `UnifiedBloomsEngine` for actual scoring

6. **Persist memory to database**
   - File: `lib/sam/utils/sam-memory-system.ts`
   - Change: Replace Map with `@sam-ai/adapter-prisma`

---

## Files Requiring Changes

| File | Issue(s) | Changes Needed |
|------|----------|----------------|
| `app/(protected)/teacher/create/ai-creator/page.tsx` | #1, #3, #5 | Import modal, feed forms, handle actions |
| `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts` | #3 | Pass form registry data |
| `app/(protected)/teacher/create/ai-creator/components/course-scoring-panel.tsx` | #2, #3 | Use real AI scoring |
| `app/api/sam/ai-tutor/chat/route.ts` | #4 | Switch to runSAMChat |
| `components/sam/SAMAssistant.tsx` | #5 | Enhanced action handling |
| `lib/sam/utils/sam-memory-system.ts` | N/A | Upgrade from stub |

---

## Conclusion

The SAM AI portable packages (`@sam-ai/core`, `@sam-ai/educational`, `@sam-ai/react`) are **properly installed and functional**, but the course creation wizard is only using a fraction of their capabilities due to 5 integration gaps. Fixing these issues would enable:

- Real-time form context awareness
- Structured course generation with Bloom's taxonomy
- Automatic form population from AI suggestions
- Consistent AI behavior across all routes
- Meaningful quality scoring

**Estimated Total Fix Time:** 12-20 hours
**ROI:** Transforms course creation from "basic AI chat" to "intelligent AI-powered wizard"

---

## Fixes Applied (December 27, 2025)

### ✅ Issue #1: SAMCompleteGenerationModal Wired

**Files Changed:**
- `app/(protected)/teacher/create/ai-creator/page.tsx`

**Changes:**
```typescript
// Added imports
import { SAMCompleteGenerationModal } from "./components/sam-complete-generation-modal";
import { createSamContext } from "@/lib/sam/utils/form-data-to-sam-context";

// Added modal state and generation handlers
const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
const { generateCompleteStructure, isGenerating, progress, error } = useSamCompleteGeneration();

// Replaced regex-based chapter generation with structured SAM generation
const handleCompleteGeneration = useCallback(async () => {
  await generateCompleteStructure({
    formData,
    samContext,
    onFormDataUpdate: setFormData,
    onGenerationComplete: async (result) => {
      // Creates course + chapters + sections in DB
    },
  });
}, [...]);
```

---

### ✅ Issue #3: Feed SAM Actual Form Data

**Files Created:**
- `lib/sam/utils/form-data-to-sam-context.ts`

**Files Changed:**
- `app/(protected)/teacher/create/ai-creator/page.tsx`
- `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts`
- `app/(protected)/teacher/create/ai-creator/components/course-scoring-panel.tsx`
- `app/(protected)/teacher/create/_components/sam-course-creator-modal.tsx`

**Changes:**
```typescript
// Created utility to convert form data to SAM context
export function formDataToSamContext(
  formData: Record<string, unknown>,
  fieldConfig: Record<string, FieldConfig>
): FormField[]

export function createSamContext(options: {
  formData: Record<string, unknown>;
  pageType?: string;
  pageTitle?: string;
  userRole?: 'teacher' | 'student' | 'admin';
  currentStep?: number;
  totalSteps?: number;
  additionalContext?: Record<string, unknown>;
})

// Before: forms: []
// After: uses createSamContext() with actual form data
```

---

### ✅ Issue #4: Unified AI Adapter Usage

**Files Changed:**
- `app/api/sam/ai-tutor/chat/route.ts`
- `app/api/sam/context-aware-assistant/route.ts`
- `app/api/sam/ai-tutor/practice-problems/route.ts`
- `app/api/sam/ai-tutor/content-analysis/route.ts`

**Changes:**
```typescript
// Before: Direct createAnthropicAdapter
import { createAnthropicAdapter } from '@sam-ai/core';
let aiAdapter: ReturnType<typeof createAnthropicAdapter> | null = null;
function getAIAdapter() { ... }
const response = await getAIAdapter().chat({ ... });

// After: Centralized runSAMChat
import { runSAMChat } from '@/lib/sam/ai-provider';
const responseText = await runSAMChat({
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 2000,
  temperature: 0.7,
  systemPrompt,
  messages,
});
```

---

### ✅ Issue #5: Action Handling Wired to Wizard UI

**Files Created:**
- `app/(protected)/teacher/create/ai-creator/hooks/use-sam-action-handler.ts`

**Files Changed:**
- `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts`
- `app/(protected)/teacher/create/ai-creator/types/sam-creator.types.ts`

**New Hook Features:**
```typescript
export function useSamActionHandler(
  setFormData: React.Dispatch<React.SetStateAction<CourseCreationRequest>>,
  options?: {
    onActionProcessed?: (result: ActionResult) => void;
    onNavigate?: (url: string) => void;
    onCourseCreationAction?: (action: string, details: Record<string, unknown>) => void;
  }
) {
  // Processes SAM actions and auto-fills form fields
  const processAction = useCallback((action: SamAction) => { ... });
  const processApiResponse = useCallback((response) => { ... });
  return { processAction, processApiResponse, processFieldUpdate };
}
```

**Supported Actions:**
- `form_populate` - Auto-fills form fields from SAM suggestions
- `form_update` - Updates specific form fields
- `course_creation_action` - Triggers course creation workflows (generate titles, create structure, etc.)
- `navigation` - Navigates to suggested pages
- `gamification_action` - Tracks points and achievements

**Field Mapping:**
- Maps SAM field names to CourseCreationRequest fields
- Supports multiple naming conventions (camelCase, snake_case, abbreviated)
- Automatic type coercion for numbers, booleans, and arrays
- Difficulty level normalization (easy→BEGINNER, medium→INTERMEDIATE, etc.)

---

### ❌ Issue #2: Still Pending

**Problem:** Course scoring still uses random numbers instead of @sam-ai/educational engines.

**Files Requiring Changes:**
- `app/(protected)/teacher/create/ai-creator/components/course-scoring-panel.tsx`

**Next Steps:**
1. Import `UnifiedBloomsEngine` from `@sam-ai/educational`
2. Replace `Math.random()` calls with actual AI analysis
3. Integrate quality validation pipeline from `@sam-ai/quality`

---

*Report generated and updated by Claude Code analysis*
