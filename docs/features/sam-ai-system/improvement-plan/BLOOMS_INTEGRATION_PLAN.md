# Bloom's Taxonomy Integration Plan

**Created**: January 2025
**Status**: Pending Implementation
**Priority**: High - Affects data consistency and personalization

---

## Executive Summary

Verification of the Bloom's Taxonomy integration has confirmed several gaps that need addressing:

1. **Persistence Split**: Course analysis is generated but not persisted
2. **Enum Mismatch**: Frontend uses lowercase, backend expects uppercase
3. **Stubbed Personalization**: `getCognitiveProfile()` always returns defaults
4. **Data Model Gaps**: Chapters lack direct Bloom's level storage
5. **Progress Updates**: Not wired from assessment completions to dashboards

---

## Task 1: Create Bloom's Enum Normalization Helper ✅ COMPLETED

### Problem
- Frontend components use lowercase: `'remember'`, `'understand'`, etc.
- Backend/Prisma expects uppercase: `'REMEMBER'`, `'UNDERSTAND'`, etc.
- Zod validation fails on lowercase input

### Files to Modify

| File | Change |
|------|--------|
| `lib/sam/utils/blooms-normalizer.ts` | **CREATE** - New normalization utility |
| `app/api/sam/blooms-analysis/route.ts` | Import and use normalizer |
| `app/api/ai/exam-generator/route.ts` | Import and use normalizer |
| `components/ai/blooms-taxonomy-selector.tsx` | Use uppercase internally |

### Implementation

```typescript
// lib/sam/utils/blooms-normalizer.ts
import { BloomsLevel } from '@prisma/client';

const BLOOMS_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;

export function normalizeBloomsLevel(level: string): BloomsLevel {
  const normalized = level.toUpperCase() as BloomsLevel;
  if (BLOOMS_LEVELS.includes(normalized)) {
    return normalized;
  }
  throw new Error(`Invalid Bloom's level: ${level}`);
}

export function normalizeBloomsLevelSafe(level: string, fallback: BloomsLevel = 'UNDERSTAND'): BloomsLevel {
  try {
    return normalizeBloomsLevel(level);
  } catch {
    return fallback;
  }
}

export function isValidBloomsLevel(level: string): level is BloomsLevel {
  return BLOOMS_LEVELS.includes(level.toUpperCase() as BloomsLevel);
}
```

### Subtasks
- [ ] Create `lib/sam/utils/blooms-normalizer.ts`
- [ ] Add exports to `lib/sam/utils/index.ts`
- [ ] Update `app/api/sam/blooms-analysis/route.ts` to normalize input
- [ ] Update `app/api/ai/exam-generator/route.ts` to normalize input
- [ ] Update `components/ai/blooms-taxonomy-selector.tsx` to emit uppercase
- [ ] Add unit tests for normalizer

---

## Task 2: Unify Course Analysis Persistence Path ✅ COMPLETED

### Problem
- `POST /api/sam/blooms-analysis` returns analysis but doesn't persist
- `GET /api/sam/blooms-analysis` expects data in `CourseBloomsAnalysis` table
- Each analysis is ephemeral - data loss on refresh

### Current Flow (Broken)
```
POST /api/sam/blooms-analysis
  → engine.analyzeCourse()
  → recordSAMInteraction()
  → return JSON (NOT persisted)

GET /api/sam/blooms-analysis
  → db.courseBloomsAnalysis.findFirst() (EMPTY - nothing was saved)
  → return cached data (null)
```

### Target Flow
```
POST /api/sam/blooms-analysis
  → engine.analyzeCourse()
  → db.courseBloomsAnalysis.upsert()  ← ADD
  → db.sectionBloomsMapping.upsert()  ← ADD
  → recordSAMInteraction()
  → return JSON

GET /api/sam/blooms-analysis
  → db.courseBloomsAnalysis.findFirst() (HAS DATA)
  → return cached data
```

### Files to Modify

| File | Change |
|------|--------|
| `app/api/sam/blooms-analysis/route.ts` | Add persistence after analysis |
| `lib/sam/stores/blooms-analysis-store.ts` | **CREATE** - Store adapter |

### Implementation

```typescript
// Add to POST handler in app/api/sam/blooms-analysis/route.ts

// After analysis is generated (around line 100)
const analysisResult = await engine.analyzeCourse(courseData);

// Persist course-level analysis
await db.courseBloomsAnalysis.upsert({
  where: { courseId },
  create: {
    courseId,
    overallDistribution: analysisResult.distribution,
    cognitiveRigor: analysisResult.cognitiveRigor,
    standardsAlignment: analysisResult.standardsAlignment,
    recommendations: analysisResult.recommendations,
    analyzedAt: new Date(),
  },
  update: {
    overallDistribution: analysisResult.distribution,
    cognitiveRigor: analysisResult.cognitiveRigor,
    standardsAlignment: analysisResult.standardsAlignment,
    recommendations: analysisResult.recommendations,
    analyzedAt: new Date(),
  },
});

// Persist section-level mappings
for (const section of analysisResult.sectionAnalysis) {
  await db.sectionBloomsMapping.upsert({
    where: { sectionId: section.id },
    create: {
      sectionId: section.id,
      primaryLevel: section.primaryLevel,
      secondaryLevels: section.secondaryLevels,
      confidence: section.confidence,
    },
    update: {
      primaryLevel: section.primaryLevel,
      secondaryLevels: section.secondaryLevels,
      confidence: section.confidence,
    },
  });
}
```

### Subtasks
- [ ] Add upsert logic to POST handler in `app/api/sam/blooms-analysis/route.ts`
- [ ] Create batch upsert for section mappings
- [ ] Add error handling for persistence failures
- [ ] Add `lastAnalyzedAt` check to avoid redundant re-analysis
- [ ] Test persistence flow end-to-end

---

## Task 3: Implement getCognitiveProfile Database Queries ✅ COMPLETED

### Problem
- `getCognitiveProfile()` in both engines is stubbed
- Always returns default profile with 0 mastery across all levels
- Blocks adaptive learning and personalization features

### Solution Implemented

#### unified-blooms-engine.ts (Lines 463-577)

The `getCognitiveProfile` method now:
1. Uses `findBloomsProgress(userId, courseId)` from the database adapter
2. Transforms `SAMBloomsProgress` scores (0-100) to normalized mastery (0-1)
3. Calculates weighted overall mastery (higher-order skills carry more weight)
4. Identifies preferred levels (mastery >= 0.7)
5. Identifies challenge areas (mastery < 0.4)
6. Calculates learning velocity based on assessment frequency and recency

```typescript
// Weights for cognitive complexity
const weights = {
  REMEMBER: 0.10,
  UNDERSTAND: 0.15,
  APPLY: 0.20,
  ANALYZE: 0.20,
  EVALUATE: 0.17,
  CREATE: 0.18,
};
```

#### blooms-engine.ts (Already implemented)

The `blooms-engine.ts` already had a working implementation using:
- `findBloomsProgress(userId, courseId)` for database queries
- `createCognitiveProfile(scores)` for transformation

### Files Modified

| File | Change |
|------|--------|
| `packages/educational/src/engines/unified-blooms-engine.ts` | Implemented real database queries |
| `__tests__/packages/educational/unified-blooms-engine-cognitive-profile.test.ts` | Created 26 unit tests |

### Subtasks
- [x] Uses existing `findBloomsProgress(userId, courseId)` from database adapter interface
- [x] Update `getCognitiveProfile()` in unified-blooms-engine.ts
- [x] Verify `getCognitiveProfile()` in blooms-engine.ts (already working)
- [x] Add unit tests for profile transformation (26 tests passing)

---

## Task 4: Enrich Analysis Input with Learning Objectives ✅ COMPLETED

### Problem
- Course payload for analysis is thin (section description only)
- No assessment/question data included
- No learning objectives extracted
- Bloom's distribution can be inaccurate

### Solution Implemented

#### 1. Enriched Prisma Query (`app/api/sam/blooms-analysis/route.ts`)
Updated the course fetch query to include:
- Course-level `courseGoals`
- Chapter-level `learningOutcomes` and `courseGoals`
- Section-level `learningObjectives` (string field) and `learningObjectiveItems`
- Assessment questions with `bloomsLevel` from exams

#### 2. Extended Interface (`packages/educational/src/types/unified-blooms.types.ts`)
Added `learningOutcomes` and `courseGoals` fields to `CourseChapter` interface.

#### 3. Data Enrichment Helper Functions
Created three helper functions:
- `parseLearningGoals()` - Parses goal strings (numbered lists, bullets, newlines, semicolons)
- `combineLearningObjectives()` - Combines string and item-based objectives, removes duplicates
- `extractQuestionsFromExams()` - Extracts questions with Bloom's levels from exams

#### 4. Enhanced Engine Analysis (`packages/educational/src/engines/unified-blooms-engine.ts`)
- Updated `extractChapterText()` to include learning outcomes, objectives, and question text
- Updated section analysis to use enriched text with learning objectives
- Added `getDominantLevel()` helper for question-based level determination
- Section level now uses weighted combination of keyword and question-based analysis

### Files Modified

| File | Change |
|------|--------|
| `app/api/sam/blooms-analysis/route.ts` | Enriched Prisma query + helper functions |
| `packages/educational/src/types/unified-blooms.types.ts` | Added chapter-level fields |
| `packages/educational/src/engines/unified-blooms-engine.ts` | Enhanced analysis with enriched data |
| `__tests__/api/sam/blooms-analysis-enrichment.test.ts` | 32 unit tests |

### Subtasks
- [x] Update Prisma query to include learning outcomes and objectives
- [x] Update engine interface to accept enriched data
- [x] Extract Bloom's indicators from learning objectives
- [x] Weight analysis by assessment question levels
- [x] Add fallback for courses without objectives (returns empty arrays)

---

## Task 5: Wire Assessment Completion to Progress Updates ✅ COMPLETED

### Problem
- Student dashboards read progress but updates not wired from UI flows
- No automatic progress recording when students complete assessments
- Dashboards will be sparse without manual progress updates

### Solution Implemented

#### 1. Progress Recorder Utility (`lib/sam/progress-recorder.ts`)
Created comprehensive utility for recording Bloom's progress:
- `recordBloomsProgress()` - Single entry recording
- `recordBloomsProgressBatch()` - Batch recording with grouping
- `recordExamProgress()` - Specialized exam completion handler

Key features:
- Exponential Moving Average (EMA) for score smoothing (alpha=0.3)
- Automatic strength/weakness area identification
- Performance metric tracking (accuracy, response time, improvement rate)
- Challenge area detection for scores < 50%
- Progress history with 100-entry limit

#### 2. Exam Submission Integration (`app/api/courses/sections/.../submit/route.ts`)
- Added `recordExamProgress` import
- Extended query to include Section → Chapter → courseId
- Records Bloom's progress asynchronously after grading
- Aggregates scores by Bloom's level from exam questions

#### 3. Test Suite (`__tests__/lib/sam/progress-recorder.test.ts`)
- 30 unit tests covering all utility functions
- Tests for EMA calculation, strength/weakness detection
- Tests for batch processing and level aggregation

### Integration Points

| Trigger | Action |
|---------|--------|
| Quiz/Exam completion | Record Bloom's level achieved |
| Section completion | Update section mastery |
| Practice question answer | Track level performance |
| Learning activity finish | Aggregate to cognitive profile |

### Files to Modify

| File | Change |
|------|--------|
| `app/api/quiz/submit/route.ts` | Add Bloom's progress recording |
| `app/api/exam/submit/route.ts` | Add Bloom's progress recording |
| `app/api/sections/[sectionId]/complete/route.ts` | Add Bloom's progress recording |
| `lib/sam/hooks/useBloomsProgress.ts` | **CREATE** - Hook for progress updates |

### Implementation Pattern

```typescript
// After assessment grading
import { recordBloomsProgress } from '@/lib/sam/progress-recorder';

const result = await gradeAssessment(submission);

// Record Bloom's level performance
await recordBloomsProgress({
  userId: session.user.id,
  courseId: exam.courseId,
  sectionId: exam.sectionId,
  bloomsLevel: question.bloomsLevel,
  score: questionScore,
  timestamp: new Date(),
});
```

### Subtasks
- [x] Create `lib/sam/progress-recorder.ts` utility
- [ ] Update quiz submission endpoint (future - quiz uses different model)
- [x] Update exam submission endpoint
- [ ] Update section completion endpoint (currently disabled, returns 503)
- [x] Add batch progress recording for efficiency
- [x] Add unit tests for progress recording utilities (30 tests)

---

## Task 6: Add bloomsLevel Field to Chapter Model ✅ COMPLETED

### Problem
- Chapters do not store Bloom's level
- Only sections can store levels via SectionBloomsMapping
- Breaks course-level curriculum design
- Forces inference at runtime

### Solution Implemented

#### 1. Prisma Schema Changes (`prisma/schema.prisma`)
Added to Chapter model:
- `targetBloomsLevel BloomsLevel?` - Teacher-set target cognitive level
- `actualBloomsLevel BloomsLevel?` - Computed from section analysis
- `ChapterBloomsAnalysis ChapterBloomsAnalysis?` - Relation to analysis model

Created new ChapterBloomsAnalysis model:
- `id`, `chapterId` (unique)
- `primaryLevel BloomsLevel` - Dominant Bloom's level
- `distribution Json` - Full Bloom's distribution
- `confidence Float` - Confidence score (cognitive depth)
- `sectionCount Int` - Number of sections analyzed
- `recommendations Json?` - Improvement suggestions
- `analyzedAt`, `updatedAt` timestamps

#### 2. API Route Updates (`app/api/sam/blooms-analysis/route.ts`)
- Added `persistChapterAnalysis()` function to persist chapter-level analysis
- Updates both `ChapterBloomsAnalysis` table and `Chapter.actualBloomsLevel`
- POST handler now calls `persistChapterAnalysis(analysis.chapters)`
- GET handler returns `chapterAnalyses` array with full chapter data

#### 3. Database Migration
- Applied via `npx prisma db push` for development
- Schema validated successfully

### Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added Chapter fields + ChapterBloomsAnalysis model |
| `prisma/domains/03-learning.prisma` | Sync with main schema |
| `app/api/sam/blooms-analysis/route.ts` | Added persistChapterAnalysis + GET endpoint update |

### Subtasks
- [x] Add fields to Chapter model in schema.prisma
- [x] Create ChapterBloomsAnalysis model
- [x] Run database migration (db push)
- [x] Update blooms-analysis API route to persist chapter analysis
- [x] Update GET endpoint to return chapter analysis
- [ ] Update teacher curriculum design UI (future enhancement)

---

## Implementation Order

1. **Task 1: Enum Normalization** (Foundation - prevents validation errors)
2. **Task 2: Persistence Path** (Core fix - enables data retention)
3. **Task 3: getCognitiveProfile** (Unblocks personalization)
4. **Task 4: Enrich Analysis Input** (Improves accuracy)
5. **Task 5: Progress Updates** (Enables dashboard data)
6. **Task 6: Chapter Model** (Schema enhancement)

---

## Success Criteria

- [x] All Bloom's levels normalize to uppercase consistently (Task 1)
- [x] Course analysis persists to `CourseBloomsAnalysis` table (Task 2)
- [x] `getCognitiveProfile()` returns real data from database (Task 3)
- [x] Analysis includes learning objectives and assessment data (Task 4)
- [x] Assessment completion triggers progress recording (Task 5)
- [x] Chapter model supports curriculum-level Bloom's targeting (Task 6)
- [ ] Student dashboards show populated Bloom's data (UI integration - future)
- [ ] Teacher curriculum design UI (UI integration - future)

---

## Risk Mitigation

1. **Data Migration**: Backfill existing courses with analysis on first GET
2. **Backwards Compatibility**: Keep lowercase support in UI, normalize on backend
3. **Performance**: Add caching for cognitive profile lookups
4. **Testing**: Add integration tests for full flow

---

## Related Files Reference

### API Routes
- `app/api/sam/blooms-analysis/route.ts`
- `app/api/sam/blooms-analysis/student/route.ts`
- `app/api/course-depth-analysis/route.ts`
- `app/api/courses/[courseId]/cognitive-assessment/route.ts`

### Engines
- `packages/educational/src/engines/unified-blooms-engine.ts`
- `packages/educational/src/engines/blooms-engine.ts`

### Standards
- `packages/educational/src/standards/validated-distributions.ts`
- `packages/educational/src/standards/distribution-analyzer.ts`

### Frontend
- `components/ai/blooms-taxonomy-selector.tsx`
- `components/analytics/CognitiveAnalytics.tsx`
- `components/sam/student-dashboard/index.tsx`

### Schema
- `prisma/schema.prisma` (lines 278-285 for enum, 2343+ for models)
