# SAM Sequential Course Creation Plan

## Problem Statement

Current AI course generation produces poor quality, repetitive content because:
1. **Single-shot generation**: Trying to generate all chapters and sections at once
2. **No contextual awareness**: Each chapter/section doesn't know about others
3. **Generic fallbacks**: Using template-based fallbacks when AI fails
4. **No deep thinking**: AI doesn't have time to reason about educational flow

**Evidence**: Sections like "Key Concepts Overview", "Fundamental Principles", "Getting Started" repeat across chapters.

---

## Proposed Solution: 3-Stage Sequential Generation

SAM will generate course content in **3 distinct stages**, where each stage builds upon the previous with full context awareness.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SAM SEQUENTIAL GENERATION                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │   STAGE 1   │───▶│   STAGE 2   │───▶│   STAGE 3   │                     │
│  │  Chapters   │    │  Sections   │    │  Details    │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│                                                                             │
│  Course Context ─────────────────────────────────────────────▶             │
│  + Chapter Context ──────────────────────────────▶                         │
│  + Section Context ──────────────────▶                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Chapter Generation (Course Level)

### Input Context
```typescript
interface Stage1Context {
  // From wizard form
  courseTitle: string;
  courseDescription: string;
  courseCategory: string;
  courseSubcategory: string;
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  courseLearningObjectives: string[];

  // Structure preferences
  totalChapters: number;
  sectionsPerChapter: number;
  bloomsFocus: string[];

  // Quality settings
  learningObjectivesPerChapter: number;
}
```

### SAM Thinking Process for Each Chapter
```
For Chapter N of {totalChapters}:

1. POSITION ANALYSIS
   - Where does this chapter fit in the learning journey?
   - What should students already know from previous chapters?
   - What does this chapter prepare students for?

2. TOPIC SELECTION
   - Given the course scope, what unique topic fits here?
   - Avoid overlap with other chapters
   - Ensure logical progression

3. BLOOM'S LEVEL ASSIGNMENT
   - Early chapters: REMEMBER/UNDERSTAND
   - Middle chapters: APPLY/ANALYZE
   - Later chapters: EVALUATE/CREATE

4. DESCRIPTION GENERATION
   - Why does this chapter exist?
   - What transformation will occur?
   - What practical skills are gained?

5. LEARNING OBJECTIVES (5+ per chapter)
   - Use Bloom's verbs for assigned level
   - Specific, measurable outcomes
   - Build on previous chapter objectives
```

### Output per Chapter
```typescript
interface GeneratedChapter {
  position: number;
  title: string;  // Unique, descriptive title
  description: string;  // 150-300 words
  bloomsLevel: string;
  learningObjectives: string[];  // 5+ objectives
  keyTopics: string[];  // 3-5 main topics
  prerequisites: string;  // What to know before
  estimatedTime: string;

  // Metadata for Stage 2
  topicsToExpand: string[];  // Topics that become sections
}
```

### Sequential Generation
```
Chapter 1 → Save → Chapter 2 → Save → ... → Chapter N → Save
     ↓              ↓                            ↓
  DB + Memory    DB + Memory                 DB + Memory
```

Each chapter is:
1. Generated with full awareness of previous chapters
2. Immediately saved to database
3. Added to running context for next chapter

---

## Stage 2: Section Generation (Chapter Level)

### Input Context (Per Chapter)
```typescript
interface Stage2Context {
  // Full course context from Stage 1
  courseTitle: string;
  courseDescription: string;
  courseLearningObjectives: string[];

  // All chapters generated so far
  allChapters: {
    position: number;
    title: string;
    description: string;
    bloomsLevel: string;
    learningObjectives: string[];
  }[];

  // Current chapter to generate sections for
  currentChapter: {
    id: string;  // From database
    position: number;
    title: string;
    description: string;
    bloomsLevel: string;
    learningObjectives: string[];
    keyTopics: string[];
  };

  // Settings
  sectionsPerChapter: number;
  learningObjectivesPerSection: number;
}
```

### SAM Thinking Process for Each Section
```
For Section M of Chapter N:

1. CHAPTER CONTEXT ANALYSIS
   - What is this chapter trying to teach?
   - What are the chapter's learning objectives?
   - What key topics need to be covered?

2. SECTION POSITIONING
   - Is this the intro section? → Set foundation
   - Is this a middle section? → Deep dive into specific topic
   - Is this the final section? → Synthesis and application

3. UNIQUE TITLE GENERATION
   - Must be distinct from ALL other sections in the course
   - Must relate specifically to chapter content
   - Should indicate what student will DO or LEARN

4. CONTENT TYPE SELECTION
   - video: Conceptual explanations, demonstrations
   - reading: Deep theoretical content
   - assignment: Hands-on practice
   - quiz: Knowledge verification
   - project: Synthesis and application

5. TOPIC MAPPING
   - Map section to specific chapter topic
   - Ensure no topic overlap between sections
   - Cover all chapter topics across sections
```

### Output per Section
```typescript
interface GeneratedSection {
  position: number;
  title: string;  // Unique within entire course
  description: string;  // Will be filled in Stage 3
  contentType: string;
  estimatedDuration: string;

  // Metadata for Stage 3
  topicFocus: string;  // Specific topic from chapter
  parentChapterContext: {
    title: string;
    bloomsLevel: string;
    relevantObjectives: string[];
  };
}
```

### Uniqueness Validation
Before accepting a section title, SAM checks:
```typescript
const existingSectionTitles = await getAllSectionTitlesInCourse(courseId);
if (existingSectionTitles.includes(newTitle) || isSimilar(newTitle, existingSectionTitles)) {
  // Regenerate with explicit instruction to avoid similarity
}
```

---

## Stage 3: Detail Generation (Section Level)

### Input Context (Per Section)
```typescript
interface Stage3Context {
  // Full course context
  courseTitle: string;
  courseDescription: string;

  // Chapter context
  chapter: {
    title: string;
    description: string;
    bloomsLevel: string;
    learningObjectives: string[];
  };

  // All sections in this chapter
  chapterSections: {
    position: number;
    title: string;
    contentType: string;
  }[];

  // Current section to fill
  currentSection: {
    id: string;
    position: number;
    title: string;
    contentType: string;
    topicFocus: string;
  };

  // Settings
  learningObjectivesPerSection: number;
}
```

### SAM Thinking Process for Section Details
```
For Section "{title}" in Chapter "{chapterTitle}":

1. DESCRIPTION GENERATION
   a. What specific knowledge does this section deliver?
   b. Why is this section important for the chapter?
   c. How does this connect to previous/next sections?
   d. What will students DO in this section?

2. LEARNING OBJECTIVES (3+ per section)
   a. Use Bloom's verb appropriate to chapter level
   b. Make objectives specific to section topic
   c. Ensure objectives are measurable
   d. Connect to practical application

3. QUALITY CRITERIA
   - Description: 50-150 words
   - Each objective: 15-30 words
   - Must mention specific tools/concepts
   - Must include action the student takes
```

### Output per Section Detail
```typescript
interface SectionDetails {
  description: string;  // 50-150 words
  learningObjectives: string[];  // 3+ objectives
  keyConceptsCovered: string[];
  practicalActivity: string;
  resources?: string[];
}
```

---

## Implementation Architecture

### New API Endpoints

```
POST /api/sam/course-creation/stage-1/chapters
  → Generates ONE chapter at a time
  → Returns chapter data + continues to next

POST /api/sam/course-creation/stage-2/sections
  → Generates ONE section at a time for a chapter
  → Returns section data + continues to next

POST /api/sam/course-creation/stage-3/details
  → Fills ONE section with description/objectives
  → Returns section details + continues to next
```

### State Machine for Creation

```typescript
type CreationState =
  | { stage: 1; phase: 'generating'; currentChapter: number; totalChapters: number }
  | { stage: 1; phase: 'saving'; currentChapter: number }
  | { stage: 2; phase: 'generating'; currentChapter: number; currentSection: number }
  | { stage: 2; phase: 'saving'; currentChapter: number; currentSection: number }
  | { stage: 3; phase: 'generating'; currentChapter: number; currentSection: number }
  | { stage: 3; phase: 'saving'; currentChapter: number; currentSection: number }
  | { stage: 'complete' };
```

### Progress Calculation

```typescript
function calculateProgress(state: CreationState, totalChapters: number, sectionsPerChapter: number): number {
  const totalSections = totalChapters * sectionsPerChapter;

  // Stage 1: 0-30%
  // Stage 2: 30-60%
  // Stage 3: 60-100%

  if (state.stage === 1) {
    return (state.currentChapter / totalChapters) * 30;
  }

  if (state.stage === 2) {
    const chapterProgress = (state.currentChapter - 1) / totalChapters;
    const sectionProgress = state.currentSection / sectionsPerChapter / totalChapters;
    return 30 + (chapterProgress + sectionProgress) * 30;
  }

  if (state.stage === 3) {
    const chapterProgress = (state.currentChapter - 1) / totalChapters;
    const sectionProgress = state.currentSection / sectionsPerChapter / totalChapters;
    return 60 + (chapterProgress + sectionProgress) * 40;
  }

  return 100;
}
```

---

## UI/UX: Creation Modal

### Modal Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  ✨ SAM is Creating Your Course                             [X] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ████████████████████░░░░░░░░░░░░░░░░░░░  45%               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ Stage 1  │──│ Stage 2  │──│ Stage 3  │                       │
│  │ Chapters │  │ Sections │  │ Details  │                       │
│  │    ✓     │  │  Active  │  │ Pending  │                       │
│  └──────────┘  └──────────┘  └──────────┘                       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📚 Creating Chapter 3 Sections                             │ │
│  │                                                            │ │
│  │ SAM is now generating unique sections for:                 │ │
│  │ "Chapter 3: Advanced State Management Patterns"            │ │
│  │                                                            │ │
│  │ Current: Section 2 of 4                                    │ │
│  │ "Implementing Redux Middleware"                            │ │
│  │                                                            │ │
│  │ ✓ Section 1: Understanding State Architecture              │ │
│  │ ● Section 2: Implementing Redux Middleware (generating...) │ │
│  │ ○ Section 3: Pending                                       │ │
│  │ ○ Section 4: Pending                                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 🧠 SAM's Thinking:                                         │ │
│  │ "For this React course chapter on state management,        │ │
│  │  Section 2 should focus on middleware since Section 1      │ │
│  │  covered architecture basics. This creates a natural       │ │
│  │  progression from theory to implementation..."             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                                          [Cancel]  [View Course] │
└──────────────────────────────────────────────────────────────────┘
```

### Stage Indicators

```typescript
interface StageStatus {
  stage: 1 | 2 | 3;
  name: string;
  icon: string;
  status: 'pending' | 'active' | 'complete';
  items: {
    name: string;
    status: 'pending' | 'generating' | 'saving' | 'complete';
  }[];
}
```

### Real-time Updates

Using Server-Sent Events (SSE) or WebSocket for live updates:

```typescript
// Client receives events like:
{ type: 'stage_change', stage: 2, message: 'Starting section generation' }
{ type: 'item_start', stage: 2, chapter: 1, section: 1, title: 'Generating...' }
{ type: 'item_complete', stage: 2, chapter: 1, section: 1, title: 'Understanding Basics' }
{ type: 'thinking', message: 'SAM is considering chapter flow...' }
{ type: 'progress', percentage: 45 }
```

---

## Quality Assurance

### Title Uniqueness Check
```typescript
async function validateSectionTitle(
  courseId: string,
  proposedTitle: string
): Promise<{ valid: boolean; suggestion?: string }> {
  const existingTitles = await db.section.findMany({
    where: { chapter: { courseId } },
    select: { title: true }
  });

  // Check exact match
  if (existingTitles.some(s => s.title === proposedTitle)) {
    return { valid: false, suggestion: 'Title already exists' };
  }

  // Check similarity (Levenshtein distance < 0.3)
  for (const existing of existingTitles) {
    if (calculateSimilarity(proposedTitle, existing.title) > 0.7) {
      return { valid: false, suggestion: `Too similar to "${existing.title}"` };
    }
  }

  return { valid: true };
}
```

### Bloom's Verb Verification
```typescript
function verifyBloomsAlignment(
  objective: string,
  targetLevel: string
): boolean {
  const verbsForLevel = BLOOMS_TAXONOMY[targetLevel].verbs;
  const firstWord = objective.split(' ')[0];
  return verbsForLevel.some(v =>
    v.toLowerCase() === firstWord.toLowerCase()
  );
}
```

### Content Quality Scoring
```typescript
interface QualityScore {
  uniqueness: number;      // 0-100: How unique across course
  specificity: number;     // 0-100: How specific (not generic)
  bloomsAlignment: number; // 0-100: Proper verb usage
  completeness: number;    // 0-100: Has all required fields
  overall: number;         // Weighted average
}
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Days 1-2)
- [ ] Create new API endpoints for 3-stage generation
- [ ] Implement state machine for creation flow
- [ ] Build context accumulation system
- [ ] Set up SSE for real-time progress

### Phase 2: SAM Prompts (Days 3-4)
- [ ] Design Stage 1 prompts with chain-of-thought
- [ ] Design Stage 2 prompts with uniqueness focus
- [ ] Design Stage 3 prompts with quality criteria
- [ ] Implement prompt templates with context injection

### Phase 3: UI Components (Days 5-6)
- [ ] Build new creation modal with stage indicators
- [ ] Implement progress visualization
- [ ] Add "SAM's thinking" display
- [ ] Create item-by-item status list

### Phase 4: Quality Systems (Day 7)
- [ ] Implement uniqueness validation
- [ ] Add Bloom's alignment checker
- [ ] Build quality scoring system
- [ ] Add retry logic for low-quality outputs

### Phase 5: Testing & Refinement (Days 8-10)
- [ ] End-to-end testing
- [ ] Prompt refinement based on outputs
- [ ] Performance optimization
- [ ] User feedback integration

---

## File Structure

```
app/
├── api/sam/course-creation/
│   ├── stage-1/
│   │   └── route.ts          # Chapter generation
│   ├── stage-2/
│   │   └── route.ts          # Section generation
│   ├── stage-3/
│   │   └── route.ts          # Detail generation
│   └── stream/
│       └── route.ts          # SSE progress stream

hooks/
├── use-sam-sequential-creation.ts    # Main orchestration hook
├── use-creation-progress-stream.ts   # SSE subscription

lib/sam/
├── prompts/
│   ├── stage-1-chapter-prompts.ts
│   ├── stage-2-section-prompts.ts
│   └── stage-3-detail-prompts.ts
├── validators/
│   ├── uniqueness-validator.ts
│   ├── blooms-validator.ts
│   └── quality-scorer.ts

components/
├── course-creation/
│   ├── sequential-creation-modal.tsx
│   ├── stage-indicator.tsx
│   ├── thinking-display.tsx
│   └── item-progress-list.tsx
```

---

## Success Criteria

### Quality Metrics
- [ ] Zero duplicate section titles within a course
- [ ] 100% of learning objectives use correct Bloom's verbs
- [ ] All descriptions are 50+ words and specific
- [ ] User satisfaction score > 4.5/5

### Performance Metrics
- [ ] Complete 8-chapter course in < 3 minutes
- [ ] Each API call < 10 seconds
- [ ] Progress updates every 2-3 seconds

### Reliability Metrics
- [ ] < 5% retry rate for quality issues
- [ ] Zero fallback usage with proper prompts
- [ ] 100% completion rate (no abandoned creations)

---

## Next Steps

1. **Review this plan** - Get feedback on the approach
2. **Approve implementation** - Confirm we should proceed
3. **Start Phase 1** - Build core infrastructure

---

*Created: December 2024*
*Author: SAM AI System Design*
*Status: PROPOSAL - Awaiting Approval*
