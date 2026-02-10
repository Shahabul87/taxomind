# Unified SAM Exam Builder

## Overview

The Unified Exam Builder consolidates the exam creation experience into a single, integrated system with two modes:

- **Manual Mode** - Teachers create questions by hand with Bloom's Taxonomy guidance
- **AI Generator Mode** - SAM AI generates questions aligned to Bloom's levels

Both modes support **AI-powered evaluation reports**, **answer visibility toggling**, **drag-drop reordering**, and **save to database**.

---

## Architecture

```
ExamTab
  |
  v
UnifiedExamBuilder (main UI container)
  |
  +-- useUnifiedExamBuilder (hook) -- state management via useReducer
  |     |
  |     +-- unified-exam-reducer.ts (24 actions, 14 state fields)
  |     +-- types.ts (UnifiedQuestion, ExamEvaluationReport, etc.)
  |
  +-- ManualQuestionCreator     (tab 1: manual question form)
  +-- AIQuestionGenerator       (tab 2: AI generation with Bloom's config)
  +-- QuestionBankBrowser       (tab 3: import from existing question bank)
  +-- ExamSettingsPanel         (tab 4: title, time limit, passing score, etc.)
  |
  +-- UnifiedQuestionPreviewList  (right sidebar: question list with drag-reorder)
  +-- BloomsDistributionChart     (right sidebar: visual Bloom's coverage)
  +-- ExamEvaluationReport        (right sidebar: AI evaluation results)

API Routes:
  POST /api/sam/exam-builder/evaluate   - AI evaluation of exam questions
  POST /api/sam/exam-builder/generate   - AI question generation via SAM engine
  POST /api/courses/.../exams           - Save exam to database
  GET  /api/courses/.../exams           - Fetch existing exams
```

---

## File Reference

| File | Purpose |
|------|---------|
| `exam-creator/types.ts` | All TypeScript types + constants |
| `exam-creator/unified-exam-reducer.ts` | Reducer with 24 action types |
| `exam-creator/useUnifiedExamBuilder.ts` | Main hook (state + API calls) |
| `exam-creator/UnifiedExamBuilder.tsx` | Main UI component |
| `exam-creator/UnifiedQuestionPreviewList.tsx` | Drag-reorder question list |
| `exam-creator/ExamEvaluationReport.tsx` | AI evaluation report display |
| `exam-creator/ExamList.tsx` | Existing exams list (view/edit/delete) |
| `tabs/ExamTab.tsx` | Thin wrapper that mounts UnifiedExamBuilder |
| `api/sam/exam-builder/evaluate/route.ts` | AI evaluation endpoint |
| `api/sam/exam-builder/generate/route.ts` | AI generation endpoint |
| `api/courses/.../exams/route.ts` | CRUD for exams in database |

---

## Data Flow

### Manual Mode Flow

```
Teacher opens Exam Creator
  |
  v
Clicks "Create New Exam"
  |
  v
UnifiedExamBuilder mounts with isCreating=true
  |
  +-- Tab 1 (Manual): Teacher fills question form
  |     |
  |     v
  |   ManualQuestionCreator.onAddQuestion(formData)
  |     |
  |     v
  |   useUnifiedExamBuilder.addManualQuestion(formData)
  |     |
  |     v
  |   Converts EnhancedQuestionFormData -> UnifiedQuestion
  |   Dispatches ADD_QUESTION to reducer
  |   Question appears in UnifiedQuestionPreviewList
  |
  +-- Repeat for each question
  |
  +-- Teacher clicks "AI Evaluate" (optional)
  |     |
  |     v
  |   useUnifiedExamBuilder.evaluateExam()
  |     |
  |     v
  |   POST /api/sam/exam-builder/evaluate
  |   {questions, sectionContext}
  |     |
  |     v
  |   Server analyzes each question:
  |     - detectBloomsLevel() via keyword matching
  |     - assessClarity() (length, punctuation, options quality)
  |     - assessCognitiveRigor() (complexity indicators)
  |     - Per-question quality score = clarity*0.3 + rigor*0.4 + alignment*0.3
  |     |
  |     v
  |   Returns ExamEvaluationReport:
  |     - overallScore, grade (A-F)
  |     - bloomsAnalysis (target vs actual distribution)
  |     - questionAnalyses[] (per-question scores + issues)
  |     - coverageGaps[] (missing Bloom's levels)
  |     - examSuggestions[] (improvement tips)
  |     |
  |     v
  |   Report displayed in ExamEvaluationReport sidebar component
  |   Per-question evaluationData attached to each question
  |
  +-- Teacher goes to Settings tab, enters title
  |
  +-- Teacher clicks "Save Exam"
        |
        v
      useUnifiedExamBuilder.saveExam()
        |
        v
      POST /api/courses/{courseId}/chapters/{chapterId}/sections/{sectionId}/exams
      {title, description, timeLimit, passingScore, questions[], totalPoints}
        |
        v
      Server creates Exam + ExamQuestion records in a Prisma transaction
        |
        v
      Builder resets, exams list refreshes
```

### AI Generator Mode Flow

```
Teacher switches to "AI Generate" tab
  |
  v
AIQuestionGenerator component:
  - Configure Bloom's distribution sliders
  - Select question types, difficulty, count
  - Optionally include hints, explanations, misconceptions
  |
  v
AIQuestionGenerator.onQuestionsGenerated(generatedQuestions)
  |
  v
useUnifiedExamBuilder.addGeneratedQuestions(generated)
  |
  v
Questions appear in UnifiedQuestionPreviewList with answerVisibility="hidden"
  |
  v
Teacher reviews, edits, or removes questions
  |
  v
Same save flow as manual mode
```

### AI Generation API (server-side)

```
POST /api/sam/exam-builder/generate
{config, sectionContext}
  |
  v
Validates with Zod schemas
  |
  v
Verifies section ownership (user.id === course.userId)
  |
  v
createExamEngine({samConfig, database}) -- singleton
  |
  v
engine.generateExam(courseId, [sectionId], examConfig)
  - examConfig includes Bloom's distribution, difficulty, question types
  |
  v
Transforms generated questions to UnifiedQuestion format
  - Each question gets unique ID, options with isCorrect flags
  - answerVisibility set to "hidden"
  |
  v
Records SAMInteraction in database (for analytics)
  |
  v
Returns {success, questions, bloomsAnalysis, metadata}
```

---

## State Management

### Reducer State (`UnifiedExamState`)

| Field | Type | Purpose |
|-------|------|---------|
| `mode` | `"manual" \| "ai"` | Current builder mode |
| `questions` | `UnifiedQuestion[]` | Questions in the builder |
| `examMetadata` | `ExamMetadata` | Title, settings, time limit, etc. |
| `evaluationReport` | `ExamEvaluationReport \| null` | AI evaluation results |
| `answerVisibility` | `Record<string, AnswerVisibility>` | Per-question hidden/revealed |
| `isGenerating` | `boolean` | AI generation loading state |
| `isEvaluating` | `boolean` | AI evaluation loading state |
| `isSaving` | `boolean` | Save-to-database loading state |
| `editingQuestionId` | `string \| null` | Question being edited |
| `existingExams` | `Exam[]` | Previously saved exams |
| `isLoadingExams` | `boolean` | Initial fetch loading state |
| `previewingExam` | `Exam \| null` | Exam being previewed |
| `publishingExamId` | `string \| null` | Exam being published/unpublished |
| `isCreating` | `boolean` | Whether builder form is open |

### Key Actions (24 total)

| Action | Description |
|--------|-------------|
| `ADD_QUESTION` | Add single manual question |
| `ADD_QUESTIONS` | Add batch of AI-generated questions |
| `UPDATE_QUESTION` | Update question fields (e.g., evaluation data) |
| `DELETE_QUESTION` | Remove question + clean up visibility |
| `REORDER_QUESTIONS` | Swap two questions by index |
| `SET_QUESTIONS` | Replace entire question array (drag-reorder) |
| `SET_EVALUATION_REPORT` | Store AI evaluation report |
| `APPLY_EVALUATION_SUGGESTIONS` | Apply AI-suggested rewrite to a question |
| `REVEAL_ANSWER` / `HIDE_ANSWER` | Toggle single question answer visibility |
| `REVEAL_ALL_ANSWERS` / `HIDE_ALL_ANSWERS` | Toggle all at once |
| `RESET_BUILDER` | Clear all questions, metadata, evaluation data |

### useRef Pattern for Stable Callbacks

Per CLAUDE.md rules, `eslint-disable react-hooks/exhaustive-deps` is forbidden. The hook uses `useRef` to keep callbacks stable:

```typescript
const sectionContextRef = useRef(sectionContext);
sectionContextRef.current = sectionContext;

const stateRef = useRef(state);
stateRef.current = state;

// Callbacks read from refs, not closure state
const evaluateExam = useCallback(async () => {
  const currentQuestions = stateRef.current.questions;
  const ctx = sectionContextRef.current;
  // ...
}, []); // Stable - no deps needed
```

---

## Key Components

### UnifiedExamBuilder

The main container component. Two visual states:

1. **Not creating** (`isCreating=false`): Shows `ExamList` of existing exams + "Create New Exam" CTA button
2. **Creating** (`isCreating=true`): Shows the 4-tab builder with right sidebar

Layout: `grid grid-cols-1 xl:grid-cols-3` - left 2/3 for tabs, right 1/3 for preview.

### UnifiedQuestionPreviewList

Compact question list with:
- **Reorder.Group** from framer-motion for drag-drop reordering
- **Bloom's level icon + color** per question
- **Quality score circle** (green/amber/red) from evaluation data
- **Expandable content**: full question text, metadata badges, MCQ options, answer reveal, evaluation issues
- **Answer visibility toggle**: Eye/EyeOff buttons per question
- When answer is revealed: shows correct answer (green), explanation (blue), hint (amber)

### ExamEvaluationReport

Collapsible panel with four sections:
1. **Bloom's Alignment** - Target vs actual distribution per level, missing levels highlighted
2. **Coverage Gaps** - Areas needing attention with severity badges (high/medium/low)
3. **Question Analysis** - Per-question quality scores, issues (error/warning/info), "Apply AI Suggestion" button
4. **Suggestions** - Exam-level improvement recommendations

Overall score displayed as circular grade badge (A-F) with progress bar.

### BloomsDistributionChart

Horizontal bar chart showing question count per Bloom's level. Animated bars via framer-motion.

---

## Answer Visibility System

Every question has an `answerVisibility` field tracked in reducer state:

```
Question created -> answerVisibility = "hidden"
  |
  v
User clicks "Reveal Answer" on a question
  |
  v
dispatch(REVEAL_ANSWER, questionId)
  |
  v
answerVisibility[questionId] = "revealed"
  |
  v
Answer section animates open showing:
  - Correct answer (green box)
  - Explanation (blue box)
  - Hint (amber box, if present)
  - For MCQ: correct option highlighted with CheckCircle icon
```

Bulk toggle: "Reveal All" / "Hide All" button in the Questions card header.

---

## API Endpoints

### POST `/api/sam/exam-builder/evaluate`

**Input:**
```json
{
  "questions": [
    {
      "id": "q-123",
      "question": "Explain the concept of...",
      "questionType": "SHORT_ANSWER",
      "bloomsLevel": "UNDERSTAND",
      "difficulty": "MEDIUM",
      "points": 5,
      "estimatedTime": 120,
      "correctAnswer": "...",
      "explanation": "..."
    }
  ],
  "sectionContext": {
    "courseId": "...",
    "chapterId": "...",
    "sectionId": "..."
  }
}
```

**Output:**
```json
{
  "success": true,
  "report": {
    "overallScore": 78,
    "grade": "C",
    "bloomsAnalysis": {
      "targetDistribution": {"REMEMBER": 10, "UNDERSTAND": 20, ...},
      "actualDistribution": {"REMEMBER": 33, "UNDERSTAND": 67, ...},
      "alignmentScore": 65,
      "missingLevels": ["APPLY", "ANALYZE", "EVALUATE", "CREATE"],
      "overrepresentedLevels": ["UNDERSTAND"]
    },
    "questionAnalyses": [
      {
        "detectedBloomsLevel": "UNDERSTAND",
        "bloomsAlignmentScore": 100,
        "qualityScore": 82,
        "clarityScore": 85,
        "cognitiveRigorScore": 70,
        "issues": [],
        "suggestions": [],
        "suggestedRewrite": null
      }
    ],
    "coverageGaps": [
      {
        "area": "Bloom's Level: APPLY",
        "severity": "high",
        "recommendation": "Add apply questions. Use verbs like: apply, demonstrate, solve"
      }
    ],
    "examSuggestions": ["Add questions for missing Bloom's levels: APPLY, ANALYZE, EVALUATE, CREATE"],
    "summary": "This exam contains 3 questions covering 2/6 Bloom's taxonomy levels...",
    "evaluatedAt": "2026-02-08T12:00:00.000Z"
  }
}
```

**Evaluation Algorithm:**
- Per-question quality = clarity (30%) + cognitive rigor (40%) + Bloom's alignment (30%)
- Overall score = avg quality (50%) + distribution alignment (30%) + coverage factor (20%)
- Grade: A (90+), B (80+), C (70+), D (60+), F (<60)

### POST `/api/sam/exam-builder/generate`

**Input:**
```json
{
  "config": {
    "questionCount": 10,
    "bloomsDistribution": {"REMEMBER": 10, "UNDERSTAND": 20, "APPLY": 30, ...},
    "questionTypes": ["MULTIPLE_CHOICE", "SHORT_ANSWER"],
    "difficulty": "MEDIUM",
    "includeHints": true,
    "includeExplanations": true
  },
  "sectionContext": {
    "courseId": "...",
    "chapterId": "...",
    "sectionId": "...",
    "sectionContent": "...",
    "learningObjectives": ["..."]
  }
}
```

Uses `@sam-ai/educational` `createExamEngine` to generate questions, then transforms to `UnifiedQuestion` format.

### POST `/api/courses/{courseId}/chapters/{chapterId}/sections/{sectionId}/exams`

Accepts both legacy format (lowercase enums like `"multiple-choice"`) and unified format (Prisma enums like `"MULTIPLE_CHOICE"`) via `z.union()` schema. Creates `Exam` + `ExamQuestion` records in a Prisma transaction.

### GET `/api/courses/{courseId}/chapters/{chapterId}/sections/{sectionId}/exams`

Returns all exams for a section with questions and attempt counts.

---

## Dual-Format API Compatibility

The exams API route supports both old and new question formats:

| Field | Legacy Format | Unified Format |
|-------|--------------|----------------|
| Question type field | `type` | `questionType` |
| Type values | `"multiple-choice"` | `"MULTIPLE_CHOICE"` |
| Difficulty values | `"easy"` | `"EASY"` |
| Bloom's values | `"remember"` | `"REMEMBER"` |
| Extra fields | None | `estimatedTime`, `hint`, `cognitiveSkills`, `relatedConcepts`, `orderIndex` |

Helper functions `resolveQuestionType()`, `resolveDifficulty()`, `resolveBloomsLevel()` normalize both formats to Prisma enums before database insertion.

---

## Type System

### UnifiedQuestion

Central data type used throughout the system:

```typescript
interface UnifiedQuestion {
  id: string;
  question: string;
  questionType: PrismaQuestionType;      // MULTIPLE_CHOICE, TRUE_FALSE, etc.
  bloomsLevel: PrismaBloomsLevel;        // REMEMBER through CREATE
  difficulty: PrismaQuestionDifficulty;   // EASY, MEDIUM, HARD
  points: number;
  estimatedTime: number;                 // seconds
  options?: QuestionOption[];            // {id, text, isCorrect}
  correctAnswer: string;
  explanation: string;
  hint?: string;
  cognitiveSkills?: string[];
  relatedConcepts?: string[];
  generationMode?: "MANUAL" | "AI_QUICK" | "AI_GUIDED" | ...;
  confidence?: number;
  needsReview?: boolean;
  answerVisibility: "hidden" | "revealed";
  evaluationData?: QuestionEvaluationData;
}
```

### ExamEvaluationReport

AI evaluation results for the entire exam:

```typescript
interface ExamEvaluationReport {
  overallScore: number;          // 0-100
  grade: string;                 // A, B, C, D, F
  bloomsAnalysis: {
    targetDistribution: BloomsDistribution;
    actualDistribution: BloomsDistribution;
    alignmentScore: number;
    missingLevels: PrismaBloomsLevel[];
    overrepresentedLevels: PrismaBloomsLevel[];
  };
  questionAnalyses: QuestionEvaluationData[];
  coverageGaps: CoverageGap[];
  examSuggestions: string[];
  summary: string;
  evaluatedAt: string;
}
```

---

## Settings Bridge

The existing `ExamSettingsPanel` uses its own `ExamSettings` interface. The unified builder converts between `ExamMetadata` (used by the hook/reducer) and `ExamSettings` (used by the panel):

```
ExamMetadata (hook) <-> settingsFromMetadata (useMemo) -> ExamSettingsPanel
ExamSettingsPanel -> handleSettingsChange (useCallback) -> updateExamMetadata (hook)
```

Additional fields in `ExamSettings` not in `ExamMetadata` (e.g., `scheduledStart`, `scheduledEnd`) are set to `null`.

---

## Security

- All API routes verify user authentication via `currentUser()`
- Section ownership verified by checking `course.userId === user.id`
- Request bodies validated with Zod schemas
- Error messages don't leak internals in production (`NODE_ENV` check)
- `error: unknown` pattern used consistently (no `any`)

---

## Testing Checklist

1. **Manual Mode**: Create 5+ questions across different Bloom's levels, verify they appear in preview list
2. **AI Evaluate**: Click "AI Evaluate", verify report shows correct Bloom's mapping, quality scores, suggestions
3. **Apply Suggestion**: Click "Apply AI Suggestion" on a low-quality question, verify text updates
4. **Answer Visibility**: Verify all answers hidden by default, reveal/hide works per-question and bulk
5. **Drag Reorder**: Drag questions in the preview list, verify order persists
6. **AI Generate**: Configure Bloom's distribution, generate questions, verify they appear with hidden answers
7. **Save Exam**: Set title in Settings tab, save, verify exam appears in existing exams list
8. **Edit Exam**: Click edit on existing exam, verify questions load into builder
9. **Publish/Unpublish**: Toggle publish status on existing exams
10. **Delete Exam**: Delete an exam, verify removal from list
