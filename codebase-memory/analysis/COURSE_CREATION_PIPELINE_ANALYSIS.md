# Course Creation Pipeline - Deep Analysis & Fix Plan

**Date**: 2026-02-17
**Status**: READY FOR IMPLEMENTATION

---

## Executive Summary

Five bugs identified across the 3-stage depth-first course creation pipeline.
The pipeline architecture is: For EACH chapter → Stage1 (chapter) → Stage2 (sections × N) → Stage3 (details × N), then move to next chapter.

---

## Issue 1: Random Chapter Ordering in Modal

### Root Cause
The pipeline is **depth-first per chapter**: Ch1(S1→S2→S3) → Ch2(S1→S2→S3) → ...

But the `StageProgressBar` in `sequential-creation-modal.tsx:118-211` displays stages as **linear sequential segments** at 30%/60%/100%. This means:
- When generating Ch1-Stage1, progress fills Stage 1 bar
- When generating Ch1-Stage2, progress fills Stage 2 bar
- When generating Ch2-Stage1, progress **jumps back** to Stage 1 bar

The `CurrentActivityDisplay` (line 217-289) jumps between "Generating Chapter X", "Creating Section X", "Adding details" as stages cycle PER CHAPTER — making it look random.

Additionally, the client-side `handleItemComplete` in `sse-event-handler.ts:461-572` counts stage 2 AND stage 3 as "sections" (line 498-499):
```typescript
const isSection = (stage === 2 || stage === 3) && chapter && section && title;
```
Stage 3 UPDATES existing section entries (dedup at line 539-540), so the section count doesn't inflate — but visually the user sees the same section appearing twice (first from Stage 2, then updated from Stage 3).

### Fix
Redesign the modal to show **chapter-centric progress** instead of stage-centric progress. Show "Chapter X of Y" with a sub-progress bar for the 3 stages within that chapter.

---

## Issue 2: completedItems Never Incremented → Wrong Percentage

### Root Cause
**CRITICAL BUG** in `orchestrator.ts:261`:
```typescript
let completedItems = 0;
```

This variable is:
- ✅ Set on **resume** (lines 402-411): `completedItems = chapterSectionCounts.reduce(...)`
- ❌ **NEVER incremented** during active pipeline run

The `emitProgress()` function (line 283-297) calculates:
```typescript
progress.percentage = Math.min(100, Math.round((completedItems / totalItems) * 100));
```

Since `completedItems` stays 0, the **server-side percentage is always 0%**.

The client works around this because `sse-event-handler.ts` tracks items independently via `itemTimestampsRef` (line 486: `itemTimestampsRef.current.push(Date.now())`). The client's `calculateETA()` uses `timestamps.length` as `itemsCompleted`. But the `progress` SSE events from the server always send 0%.

The client's percentage display relies on `progress.percentage` from the server SSE `progress` event, which is always 0. The client does NOT independently compute a percentage — it uses whatever the server sends.

### Additional Problem
The `totalItems` formula at line 259-260:
```typescript
const totalSections = totalChapters * effectiveSectionsPerChapter;
const totalItems = totalChapters + totalSections + totalSections;
```

This equals: `totalChapters + 2 * (totalChapters * sectionsPerChapter)`

For 3 chapters × 5 sections: `3 + 2 × 15 = 33 items`

This is **correct for core generation items** (1 chapter + N sections + N details per chapter).

But the percentage never moves because `completedItems` is never incremented.

### Fix
Increment `completedItems` in the orchestrator after each `item_complete` SSE event. The cleanest approach: increment in the `onSSEEvent` callback wrapper in the orchestrator, keyed on `item_complete` events with stages 1, 2, or 3.

---

## Issue 3: Modal Doesn't Show Exactly What AI Is Generating

### Root Cause
The `CurrentActivityDisplay` only shows generic phase descriptions:
- `'generating_chapter'` → "Generating Chapter X of Y"
- `'generating_section'` → "Creating Section X of Y"
- `'generating_details'` → "Adding details to Section X of Chapter Y"

Problems:
1. **No chapter title shown** — just "Chapter 2 of 3", not "Chapter 2: Functions & Methods"
2. **No section title shown** — just "Section 3 of 5", not "Section 3: Error Handling Patterns"
3. **No depth-first context** — doesn't say "Chapter 1 → Generating sections (3 of 5)" to show WHERE in the pipeline
4. **Stage progress bar is misleading** — stages don't map to the depth-first architecture
5. The `currentItem` field in progress IS emitted (e.g., `item_generating` events include `message: "Generating chapter 2..."`) but the modal only shows it as a small chevron text below the activity display

### Fix
Redesign `CurrentActivityDisplay` to show:
- Current chapter name + number
- Current sub-stage (structure/sections/details) within that chapter
- Current section name when in Stage 2 or 3
- Mini chapter timeline showing which chapters are done/in-progress/pending

---

## Issue 4: Total Items Calculation

### Current Formula
```
totalItems = totalChapters + totalSections + totalSections
           = totalChapters + 2 × (totalChapters × sectionsPerChapter)
```

### User's Example: 3 chapters × 5 sections × 3 LOs/chapter × 3 LOs/section

**Core generation items (what AI generates):**
| Item Type | Count | Formula |
|-----------|-------|---------|
| Chapters (Stage 1) | 3 | totalChapters |
| Sections (Stage 2) | 15 | totalChapters × sectionsPerChapter |
| Section Details (Stage 3) | 15 | totalChapters × sectionsPerChapter |
| **Total Core Items** | **33** | **totalChapters × (1 + 2 × sectionsPerChapter)** |

This formula IS correct. Each "item" = one AI generation call for one piece of content.

**What each item produces:**
- Stage 1 (chapter): title, description, bloomsLevel, N learningObjectives, keyTopics, prerequisites, estimatedTime
- Stage 2 (section): title, contentType, estimatedDuration, topicFocus, concepts
- Stage 3 (details): description, N learningObjectives, resources, practicalActivity, keyConceptsCovered

The learning objectives count (3/chapter, 3/section) affects the CONTENT of each generated item but does NOT add more items. Each AI call generates ALL the objectives for that item.

### The Real Problem
The total items count is correct, but:
1. **completedItems never increments** (Issue 2) so percentage is always 0%
2. Non-core SSE events (quality_retry, critic_review, thinking, agentic_decision, etc.) create visual noise that makes it SEEM like generation goes beyond the count
3. The modal's `sections.slice(-5)` only shows last 5 sections, hiding earlier ones and making it confusing

### Fix
- Fix completedItems increment (Issue 2)
- Clearly separate "core items" from "quality/enhancement events" in the UI
- Show a clear counter: "Item 12 of 33"

---

## Issue 5: AI Call Count

### Precise Breakdown for 3 Chapters × 5 Sections

**Core AI Calls (always fire):**
| Call | Count | Formula |
|------|-------|---------|
| Stage 1: Chapter generation | 3 | totalChapters |
| Stage 2: Section generation | 15 | totalChapters × sectionsPerChapter |
| Stage 3: Detail generation | 15 | totalChapters × sectionsPerChapter |
| **Core Total** | **33** | |

**Non-Core AI Calls (probabilistic/conditional):**
| Call | Count | Notes |
|------|-------|-------|
| Blueprint Planner | 1 | Always fires on new run |
| Stage 1 Quality Validation (SAM) | 3 | Always fires per chapter (validate, not generate) |
| Stage 2 Quality Validation (SAM) | 15 | Always fires per section |
| Stage 3 Quality Validation (SAM) | 15 | Always fires per section detail |
| Stage 1 Self-Critique | ~1 | ~30% fire rate on chapters |
| Stage 1 Critic Review | ~1 | ~30% fire rate (borderline 55-70 quality) |
| Stage 1 Critic Retry | ~1 | Only if critic says "revise" |
| Stage 2 Critic Review | ~2 | ~15% fire rate on 15 sections |
| Stage 2 Critic Retry | ~1 | Only if critic says "revise" |
| Stage 3 Critic Review | ~2 | ~15% fire rate on 15 sections |
| Stage 3 Critic Retry | ~1 | Only if critic says "revise" |
| Agentic Decisions | 2 | totalChapters - 1 (between chapters) |
| Quality Gate Retries | ~10 | ~30% retry rate on 33 core calls |
| Reflection | 1 | 1 per course (post-processing) |
| Healing (post-process) | ~1 | Conditional, up to 2 chapters |
| **Non-Core Total** | **~56** | |

**Grand Total: ~33 core + ~56 non-core = ~89 AI calls**

Note: The `cost-estimator.ts` calculates ~53 total calls because it doesn't count SAM validation calls as separate AI calls (they use the SAM quality engine, not the chat API). The actual external AI API calls are closer to:
- 33 core generation + ~10 retries + 1 planner + ~4 critics + ~4 critic retries + 2 decisions + 1 reflection + ~1 healing ≈ **~56 external AI API calls**
- Plus ~33 SAM quality validation calls (may use AI internally)

### Fix
The `cost-estimator.ts` already has a good model. We should:
1. Expose the cost estimate in the modal before starting
2. Show "AI Call X of ~Y" during generation
3. Differentiate core generation calls from quality/enhancement calls in the UI

---

## Implementation Fix Plan

### Fix A: Increment completedItems in orchestrator (Issue 2)

**File**: `lib/sam/course-creation/orchestrator.ts`

In the `onSSEEvent` wrapper or right after the pipeline emits `item_complete` for stages 1/2/3, increment `completedItems`. The cleanest approach is to wrap the `onSSEEvent` callback to intercept `item_complete` events:

```typescript
// After line 267 (total_items event), wrap onSSEEvent:
const originalOnSSEEvent = onSSEEvent;
const wrappedOnSSEEvent = originalOnSSEEvent
  ? (event: { type: string; data: Record<string, unknown> }) => {
      // Increment completedItems for core generation events
      if (event.type === 'item_complete') {
        const stage = event.data.stage as number;
        if (stage === 1 || stage === 2 || stage === 3) {
          const isHealing = event.data.isHealing as boolean | undefined;
          const isResumeReplay = event.data.isResumeReplay as boolean | undefined;
          if (!isHealing && !isResumeReplay) {
            completedItems++;
          }
        }
      }
      originalOnSSEEvent(event);
    }
  : undefined;
```

Then pass `wrappedOnSSEEvent` instead of `onSSEEvent` to all downstream functions.

### Fix B: Redesign StageProgressBar for depth-first (Issues 1, 3)

**File**: `components/sam/sequential-creation-modal.tsx`

Replace the 3-stage linear progress bar with a **chapter-centric progress display**:

1. Show "Chapter X of Y: [Chapter Title]" as the primary indicator
2. Under each chapter, show 3 sub-stages (structure → sections → details) with mini progress
3. Show completed chapters with green checkmarks
4. Show current chapter's internal progress

### Fix C: Enhance CurrentActivityDisplay (Issue 3)

**File**: `components/sam/sequential-creation-modal.tsx`

Update to show:
- Current chapter title (not just number)
- Current section title when in Stage 2/3
- Clear stage within the current chapter: "Building sections (3 of 5) for Chapter 2: Functions"

### Fix D: Add precise item counter to SSE events (Issue 4)

**File**: `lib/sam/course-creation/orchestrator.ts`

Include `completedItems` and `totalItems` in every `item_complete` SSE event so the client always has an accurate count.

### Fix E: Expose AI call estimate in modal (Issue 5)

**File**: `components/sam/sequential-creation-modal.tsx`

Before generation starts, show estimated:
- Total items to generate: 33
- Estimated AI calls: ~56
- Estimated time: ~18 minutes

---

## Issue 6: CRITICAL - Double Budget Counting (Causes Generation to Fail Mid-Course)

### Root Cause
In `chapter-generator.ts`, every core AI call has its tokens counted **twice**:
1. `budgetTracker.recordActualUsage(inputTokens, outputTokens)` — records real tokens + increments callCount
2. `trackBudget(2000)` — records ANOTHER 2000 estimated tokens + increments callCount again

Both `recordActualUsage()` and `recordCall()` (inside `trackBudget()`) increment `accumulatedTokens` and `callCount`.

### Impact
For a 3ch × 5sec course (estimated budget ~76k tokens × 3 = 228k max):
- Each AI call uses ~3000-5000 actual tokens
- With double counting, each call records ~5000-7000 tokens (actual + 2000 estimate)
- Budget exhaustion occurs ~40-60% through the pipeline
- **Result**: Stage 3 (detail generation) gets killed after 1-2 sections, leaving sections without descriptions/learning objectives

### Fix Applied
Changed `trackBudget(2000)` at lines 328, 683, 912 to only execute when `enableStreamingThinking` is true (streaming path has no actual usage data). For non-streaming path, only check `canProceed()` since `recordActualUsage()` already tracked the real tokens.

Critic retry calls (lines 450, 637, 876) use `runSAMChatWithPreference` (not `runSAMChatWithUsage`) — no `recordActualUsage()` for those — so their `trackBudget(2000)` is correct.

---

## Files Modified

| File | Changes |
|------|---------|
| `lib/sam/course-creation/orchestrator.ts` | Fix completedItems increment, add item counts to SSE events |
| `lib/sam/course-creation/chapter-generator.ts` | **Fix double budget counting** — conditional trackBudget() |
| `lib/sam/course-creation/pipeline-budget.ts` | Add init logging, improved utilization warnings, JSDoc clarification |
| `components/sam/sequential-creation-modal.tsx` | Redesign progress display for depth-first, enhance activity display |
| `hooks/use-sam-sequential-creation/sse-event-handler.ts` | Handle enhanced SSE event data |
| `lib/sam/course-creation/types.ts` | Add serverCompletedItems/serverTotalItems to CreationProgress |
| `app/(protected)/teacher/create/ai-creator/components/steps/course-structure-step.tsx` | Pre-generation item count display |

---

## Test Plan

Test with: 3 chapters × 5 sections × 3 LOs/chapter × 3 LOs/section (beginner difficulty)

Expected behavior after fixes:
1. **Full course generates** — all 3 chapters with all 15 sections get descriptions and learning objectives
2. Progress bar advances smoothly from 0% to 100% (33 items)
3. Modal shows "Chapter 1: [Title] - Building sections (3 of 5)"
4. Items counter shows "12 of 33 items"
5. Stage sub-progress within chapter shows correctly
6. No visual jumping between chapters/stages
7. Budget utilization stays under 100% in server logs
