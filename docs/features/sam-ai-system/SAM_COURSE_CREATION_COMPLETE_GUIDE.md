# SAM AI Course Creation - Complete Technical Guide

**Version:** 1.0.0
**Last Updated:** December 28, 2025
**Author:** Claude Code

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [3-Stage Sequential Generation](#3-stage-sequential-generation)
4. [Core Files Reference](#core-files-reference)
5. [Hooks Deep Dive](#hooks-deep-dive)
6. [API Endpoints](#api-endpoints)
7. [Type Definitions](#type-definitions)
8. [AI Prompt Engineering](#ai-prompt-engineering)
9. [Form Data Flow](#form-data-flow)
10. [Database Integration](#database-integration)
11. [Error Handling](#error-handling)
12. [Quality Scoring](#quality-scoring)

---

## Overview

SAM AI (Smart Academic Mentor) is an intelligent course creation system that generates educational content using a **3-stage sequential process** based on Bloom's Taxonomy. The system creates courses with proper pedagogical structure, ensuring learning progression from foundational concepts to advanced topics.

### Key Features
- **3-Stage Sequential Generation**: Chapter → Section → Detail generation
- **Bloom's Taxonomy Integration**: Content aligned with cognitive learning levels
- **Real-time Progress Streaming**: SSE-based progress updates
- **Form Auto-Population**: AI-generated content fills forms automatically
- **Quality Scoring**: AI-powered content quality assessment
- **Category Management**: Automatic category lookup/creation

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI Creator Page                                  │
│                   /teacher/create/ai-creator                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐   │
│  │  Step 1-4    │────▶│  Form Collection  │────▶│  SAM Generation  │   │
│  │  Wizard UI   │     │  (CourseContext)  │     │  Modal Trigger   │   │
│  └──────────────┘     └───────────────────┘     └──────────────────┘   │
│                                                          │              │
│                                                          ▼              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                Sequential Creation Modal                          │  │
│  │  ┌─────────┐     ┌─────────┐     ┌─────────┐                     │  │
│  │  │ Stage 1 │────▶│ Stage 2 │────▶│ Stage 3 │                     │  │
│  │  │Chapters │     │Sections │     │ Details │                     │  │
│  │  └─────────┘     └─────────┘     └─────────┘                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                              │                                          │
│                              ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Database Creation                              │  │
│  │  Course → Chapters → Sections (Prisma Transactions)              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
AICreatorPage (page.tsx)
├── AICreatorLayout (shared layout with progress bar)
├── Step Components (1-4)
│   ├── StepOne: Basic Info (title, description, category)
│   ├── StepTwo: Learning Objectives & Target Audience
│   ├── StepThree: Structure Configuration
│   └── StepFour: Review & Generate
├── SequentialCreationModal (modal for generation)
└── Hooks
    ├── useSAMWizard (form management)
    ├── useSequentialCreation (3-stage orchestration)
    └── useSamActionHandler (action processing)
```

---

## 3-Stage Sequential Generation

The core of SAM's course creation is a 3-stage sequential process:

### Stage 1: Chapter Generation

**Purpose**: Generate chapter titles and descriptions based on course context

**Input**:
```typescript
interface Stage1Input {
  courseTitle: string;
  courseDescription: string;
  courseCategory: string;
  targetAudience: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: number;
  numberOfChapters: number;
}
```

**Output**:
```typescript
interface GeneratedChapter {
  title: string;
  description: string;
  position: number;
  bloomsLevel: BloomsLevel;
  learningOutcomes: string[];
  estimatedDuration: number;
}
```

**Bloom's Taxonomy Progression**:
- Chapters 1-2: REMEMBER, UNDERSTAND (foundational)
- Chapters 3-4: APPLY, ANALYZE (intermediate)
- Chapters 5+: EVALUATE, CREATE (advanced)

### Stage 2: Section Generation

**Purpose**: Generate sections for each chapter with detailed content structure

**Input**:
```typescript
interface Stage2Input {
  courseContext: CourseContext;
  chapters: GeneratedChapter[];
  sectionsPerChapter: number;
}
```

**Output**:
```typescript
interface GeneratedSection {
  chapterIndex: number;
  title: string;
  description: string;
  position: number;
  bloomsLevel: BloomsLevel;
  contentType: 'VIDEO' | 'TEXT' | 'INTERACTIVE' | 'QUIZ';
  estimatedDuration: number;
}
```

### Stage 3: Detail Enhancement

**Purpose**: Add rich details to each section (content outlines, key concepts, assessments)

**Input**:
```typescript
interface Stage3Input {
  courseContext: CourseContext;
  chapters: GeneratedChapter[];
  sections: GeneratedSection[];
}
```

**Output**:
```typescript
interface SectionDetails {
  sectionIndex: number;
  contentOutline: string[];
  keyConceptsCovered: string[];
  practicalExercises: string[];
  assessmentQuestions: AssessmentQuestion[];
  resourceLinks: string[];
}
```

---

## Core Files Reference

### Main Entry Points

| File | Purpose |
|------|---------|
| `app/(protected)/teacher/create/ai-creator/page.tsx` | Main wizard page |
| `components/sam/sequential-creation-modal.tsx` | Generation modal UI |
| `hooks/use-sam-sequential-creation.ts` | 3-stage orchestration |

### Hooks

| File | Purpose |
|------|---------|
| `hooks/use-sam-wizard.ts` | Form state management |
| `hooks/use-sam-action-handler.ts` | Action processing |
| `hooks/use-sam-intelligent-sync.ts` | Intelligent form sync |

### API Routes

| File | Purpose |
|------|---------|
| `app/api/sam/sequential-creation/stage-1/route.ts` | Chapter generation |
| `app/api/sam/sequential-creation/stage-2/route.ts` | Section generation |
| `app/api/sam/sequential-creation/stage-3/route.ts` | Detail generation |
| `app/api/sam/ai-tutor/chat/route.ts` | General SAM chat |
| `app/api/sam/context-aware-assistant/route.ts` | Context-aware suggestions |

### Types

| File | Purpose |
|------|---------|
| `lib/sam/course-creation/types.ts` | Core type definitions |
| `app/(protected)/teacher/create/ai-creator/types/sam-creator.types.ts` | UI-specific types |

### Utilities

| File | Purpose |
|------|---------|
| `lib/sam/utils/form-data-to-sam-context.ts` | Form → SAM context |
| `lib/sam/ai-provider.ts` | Unified AI adapter |

---

## Hooks Deep Dive

### useSequentialCreation

**Location**: `hooks/use-sam-sequential-creation.ts`

**Purpose**: Orchestrates the entire 3-stage course creation process

**Key Functions**:

```typescript
export function useSequentialCreation() {
  // State
  const [isCreating, setIsCreating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<CreationPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [generatedChapters, setGeneratedChapters] = useState<GeneratedChapter[]>([]);
  const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
  const [sectionDetails, setSectionDetails] = useState<SectionDetails[]>([]);

  // Main orchestration function
  const startSequentialCreation = async (config: SequentialCreationConfig) => {
    // 1. Create course in DB first
    const courseId = await createCourseInDB(config.courseContext);

    // 2. Run Stage 1: Generate chapters
    const chapters = await runStage1(config.courseContext);

    // 3. Create chapters in DB
    const chapterIds = await createChaptersInDB(courseId, chapters);

    // 4. Run Stage 2: Generate sections
    const sections = await runStage2(config.courseContext, chapters);

    // 5. Create sections in DB
    const sectionIds = await createSectionsInDB(chapterIds, sections);

    // 6. Run Stage 3: Generate details
    const details = await runStage3(config.courseContext, chapters, sections);

    // 7. Update sections with details
    await updateSectionsWithDetails(sectionIds, details);

    return { courseId, chapters, sections, details };
  };

  return {
    isCreating,
    currentPhase,
    progress,
    generatedChapters,
    generatedSections,
    sectionDetails,
    startSequentialCreation,
    cancelCreation,
  };
}
```

**Category Handling**:

```typescript
const getOrCreateCategoryId = async (
  categoryName: string,
  parentId?: string | null
): Promise<string | null> => {
  if (!categoryName) return null;

  try {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: categoryName,
        parentId: parentId || null,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.data?.id || result.id || null;
    }
    return null;
  } catch {
    return null;
  }
};
```

### useSAMWizard

**Location**: `app/(protected)/teacher/create/ai-creator/hooks/use-sam-wizard.ts`

**Purpose**: Manages form state across all wizard steps

**Key Features**:
- Form validation per step
- Data persistence
- SAM context building
- Step navigation

```typescript
export function useSAMWizard() {
  const [formData, setFormData] = useState<CourseCreationRequest>(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return validateBasicInfo(formData);
      case 2:
        return validateLearningObjectives(formData);
      case 3:
        return validateStructure(formData);
      case 4:
        return true; // Review step
      default:
        return false;
    }
  };

  // Build SAM context from form data
  const buildSamContext = (): CourseContext => ({
    courseTitle: formData.title,
    courseDescription: formData.description,
    courseCategory: formData.category,
    courseSubcategory: formData.subcategory,
    targetAudience: formData.targetAudience,
    difficultyLevel: formData.difficulty,
    estimatedDuration: formData.duration,
    numberOfChapters: formData.chapterCount,
    numberOfSections: formData.sectionsPerChapter,
    courseLearningObjectives: formData.learningObjectives,
  });

  return {
    formData,
    setFormData,
    currentStep,
    setCurrentStep,
    validateStep,
    buildSamContext,
    validationErrors,
  };
}
```

### useSamActionHandler

**Location**: `app/(protected)/teacher/create/ai-creator/hooks/use-sam-action-handler.ts`

**Purpose**: Processes SAM actions and auto-fills forms

**Supported Actions**:

```typescript
type SamAction =
  | { type: 'form_populate'; field: string; value: unknown; confidence: number }
  | { type: 'form_update'; updates: Record<string, unknown> }
  | { type: 'course_creation_action'; action: string; parameters: Record<string, unknown> }
  | { type: 'navigation'; payload: { url: string } }
  | { type: 'gamification_action'; points: number; achievement?: string };

export function useSamActionHandler(
  setFormData: React.Dispatch<React.SetStateAction<CourseCreationRequest>>
) {
  const processAction = useCallback((action: SamAction) => {
    switch (action.type) {
      case 'form_populate':
        // Map SAM field name to form field
        const mappedField = mapFieldName(action.field);
        if (mappedField) {
          setFormData(prev => ({
            ...prev,
            [mappedField]: action.value,
          }));
        }
        break;

      case 'form_update':
        setFormData(prev => ({
          ...prev,
          ...mapFieldNames(action.updates),
        }));
        break;

      case 'course_creation_action':
        handleCourseCreationAction(action.action, action.parameters);
        break;
    }
  }, [setFormData]);

  return { processAction };
}
```

---

## API Endpoints

### Stage 1: Chapter Generation

**Endpoint**: `POST /api/sam/sequential-creation/stage-1`

**Request**:
```typescript
{
  courseContext: {
    courseTitle: string;
    courseDescription: string;
    courseCategory: string;
    targetAudience: string;
    difficultyLevel: string;
    numberOfChapters: number;
  }
}
```

**Response** (SSE Stream):
```
data: {"type":"progress","stage":1,"progress":0,"message":"Starting chapter generation..."}
data: {"type":"chapter","index":0,"data":{"title":"...","description":"...","bloomsLevel":"REMEMBER"}}
data: {"type":"chapter","index":1,"data":{"title":"...","description":"...","bloomsLevel":"UNDERSTAND"}}
...
data: {"type":"complete","stage":1,"totalChapters":5}
```

### Stage 2: Section Generation

**Endpoint**: `POST /api/sam/sequential-creation/stage-2`

**Request**:
```typescript
{
  courseContext: CourseContext;
  chapters: GeneratedChapter[];
  sectionsPerChapter: number;
}
```

**Response** (SSE Stream):
```
data: {"type":"progress","stage":2,"progress":0,"message":"Generating sections for Chapter 1..."}
data: {"type":"section","chapterIndex":0,"sectionIndex":0,"data":{"title":"...","contentType":"VIDEO"}}
...
data: {"type":"complete","stage":2,"totalSections":20}
```

### Stage 3: Detail Generation

**Endpoint**: `POST /api/sam/sequential-creation/stage-3`

**Request**:
```typescript
{
  courseContext: CourseContext;
  chapters: GeneratedChapter[];
  sections: GeneratedSection[];
}
```

**Response** (SSE Stream):
```
data: {"type":"progress","stage":3,"progress":0,"message":"Enhancing Section 1 details..."}
data: {"type":"details","sectionIndex":0,"data":{"contentOutline":[...],"keyConceptsCovered":[...]}}
...
data: {"type":"complete","stage":3,"totalDetails":20}
```

---

## Type Definitions

### Core Types

**Location**: `lib/sam/course-creation/types.ts`

```typescript
// Bloom's Taxonomy Levels
export type BloomsLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

// Course Context (collected from wizard)
export interface CourseContext {
  courseTitle: string;
  courseDescription: string;
  courseCategory: string;
  courseSubcategory?: string;
  targetAudience: string;
  difficultyLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: number;
  numberOfChapters: number;
  numberOfSections: number;
  courseLearningObjectives?: string[];
}

// Generated Chapter
export interface GeneratedChapter {
  title: string;
  description: string;
  position: number;
  bloomsLevel: BloomsLevel;
  learningOutcomes: string[];
  estimatedDuration: number;
}

// Generated Section
export interface GeneratedSection {
  chapterIndex: number;
  title: string;
  description: string;
  position: number;
  bloomsLevel: BloomsLevel;
  contentType: 'VIDEO' | 'TEXT' | 'INTERACTIVE' | 'QUIZ';
  estimatedDuration: number;
  learningObjectives: string[];
}

// Section Details
export interface SectionDetails {
  sectionIndex: number;
  contentOutline: string[];
  keyConceptsCovered: string[];
  practicalExercises: string[];
  assessmentQuestions: AssessmentQuestion[];
  resourceLinks: string[];
}

// Creation Phases
export type CreationPhase =
  | 'idle'
  | 'creating_course'
  | 'generating_chapters'
  | 'creating_chapters'
  | 'generating_sections'
  | 'creating_sections'
  | 'generating_details'
  | 'updating_sections'
  | 'completed'
  | 'error';

// Sequential Creation Config
export interface SequentialCreationConfig {
  courseContext: CourseContext;
  onProgress?: (progress: number, phase: CreationPhase, message: string) => void;
  onChapterGenerated?: (chapter: GeneratedChapter, index: number) => void;
  onSectionGenerated?: (section: GeneratedSection, chapterIndex: number, sectionIndex: number) => void;
  onDetailGenerated?: (detail: SectionDetails, sectionIndex: number) => void;
}

// Sequential Creation Result
export interface SequentialCreationResult {
  success: boolean;
  courseId: string | null;
  chapters: GeneratedChapter[];
  sections: GeneratedSection[];
  details: SectionDetails[];
  chaptersCreated: number;
  sectionsCreated: number;
  error?: string;
}
```

---

## AI Prompt Engineering

### Stage 1 Prompt (Chapter Generation)

```typescript
const buildStage1Prompt = (context: CourseContext): string => `
You are SAM, an expert educational content designer specializing in Bloom's Taxonomy.

Create ${context.numberOfChapters} chapters for this course:

COURSE DETAILS:
- Title: ${context.courseTitle}
- Description: ${context.courseDescription}
- Category: ${context.courseCategory}
- Target Audience: ${context.targetAudience}
- Difficulty: ${context.difficultyLevel}
- Duration: ${context.estimatedDuration} hours

BLOOM'S TAXONOMY PROGRESSION:
- Chapters 1-2: Focus on REMEMBER and UNDERSTAND levels
- Chapters 3-4: Focus on APPLY and ANALYZE levels
- Final chapters: Focus on EVALUATE and CREATE levels

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Chapter title",
    "description": "2-3 sentence description",
    "bloomsLevel": "REMEMBER|UNDERSTAND|APPLY|ANALYZE|EVALUATE|CREATE",
    "learningOutcomes": ["outcome1", "outcome2", "outcome3"],
    "estimatedDuration": 45
  }
]

Generate chapters that build upon each other progressively.
`;
```

### Stage 2 Prompt (Section Generation)

```typescript
const buildStage2Prompt = (
  context: CourseContext,
  chapter: GeneratedChapter,
  chapterIndex: number
): string => `
You are SAM, generating sections for Chapter ${chapterIndex + 1}.

CHAPTER DETAILS:
- Title: ${chapter.title}
- Description: ${chapter.description}
- Bloom's Level: ${chapter.bloomsLevel}
- Learning Outcomes: ${chapter.learningOutcomes.join(', ')}

COURSE CONTEXT:
- Course: ${context.courseTitle}
- Audience: ${context.targetAudience}
- Difficulty: ${context.difficultyLevel}

Generate ${context.numberOfSections} sections for this chapter.

CONTENT TYPE DISTRIBUTION:
- 60% VIDEO: Lecture content
- 20% INTERACTIVE: Hands-on exercises
- 10% TEXT: Reading materials
- 10% QUIZ: Assessment

OUTPUT FORMAT (JSON array):
[
  {
    "title": "Section title",
    "description": "1-2 sentence description",
    "bloomsLevel": "Match or slightly advance chapter level",
    "contentType": "VIDEO|TEXT|INTERACTIVE|QUIZ",
    "estimatedDuration": 15,
    "learningObjectives": ["objective1", "objective2"]
  }
]
`;
```

### Stage 3 Prompt (Detail Generation)

```typescript
const buildStage3Prompt = (
  context: CourseContext,
  section: GeneratedSection
): string => `
You are SAM, adding rich details to a section.

SECTION DETAILS:
- Title: ${section.title}
- Description: ${section.description}
- Content Type: ${section.contentType}
- Bloom's Level: ${section.bloomsLevel}
- Duration: ${section.estimatedDuration} minutes

Generate comprehensive details for this section.

OUTPUT FORMAT (JSON):
{
  "contentOutline": [
    "Main topic 1",
    "  - Subtopic 1.1",
    "  - Subtopic 1.2",
    "Main topic 2",
    "  - Subtopic 2.1"
  ],
  "keyConceptsCovered": [
    "Concept 1: Brief explanation",
    "Concept 2: Brief explanation"
  ],
  "practicalExercises": [
    "Exercise 1: Description",
    "Exercise 2: Description"
  ],
  "assessmentQuestions": [
    {
      "question": "Question text?",
      "type": "multiple_choice|true_false|short_answer",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ],
  "resourceLinks": [
    "https://example.com/resource1",
    "https://example.com/resource2"
  ]
}
`;
```

---

## Form Data Flow

### Step 1 → SAM Context Conversion

```
┌─────────────────────────────────────────────────────────────┐
│                    Wizard Form Data                          │
│  {                                                          │
│    title: "Learn TypeScript",                               │
│    description: "Complete guide...",                        │
│    category: "Programming",                                  │
│    subcategory: "Web Development",                          │
│    difficulty: "INTERMEDIATE",                               │
│    targetAudience: "JavaScript developers",                  │
│    duration: 10,                                            │
│    chapterCount: 5,                                         │
│    sectionsPerChapter: 4,                                   │
│    learningObjectives: ["Understand types", "Use generics"] │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               formDataToSamContext()                         │
│  lib/sam/utils/form-data-to-sam-context.ts                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CourseContext                             │
│  {                                                          │
│    courseTitle: "Learn TypeScript",                          │
│    courseDescription: "Complete guide...",                   │
│    courseCategory: "Programming",                            │
│    courseSubcategory: "Web Development",                     │
│    difficultyLevel: "INTERMEDIATE",                          │
│    targetAudience: "JavaScript developers",                  │
│    estimatedDuration: 10,                                   │
│    numberOfChapters: 5,                                     │
│    numberOfSections: 4,                                     │
│    courseLearningObjectives: ["Understand types", ...]      │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### SAM Response → Form Auto-Fill

```
┌─────────────────────────────────────────────────────────────┐
│                   SAM API Response                           │
│  {                                                          │
│    actions: [                                               │
│      {                                                      │
│        type: "form_populate",                               │
│        field: "courseTitle",                                │
│        value: "Master TypeScript",                          │
│        confidence: 0.95                                     │
│      }                                                      │
│    ]                                                        │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               useSamActionHandler()                          │
│  - Maps "courseTitle" → "title"                             │
│  - Validates confidence threshold                            │
│  - Updates form state                                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Form Field Updated                            │
│  setFormData(prev => ({ ...prev, title: "Master TypeScript" }))
└─────────────────────────────────────────────────────────────┘
```

---

## Database Integration

### Course Creation Flow

```typescript
// 1. Create Course
const courseId = await createCourseInDB(courseContext);

async function createCourseInDB(context: CourseContext): Promise<string> {
  // Lookup/create category
  let categoryId = null;
  let subcategoryId = null;

  if (context.courseCategory) {
    categoryId = await getOrCreateCategoryId(context.courseCategory);

    if (context.courseSubcategory && categoryId) {
      subcategoryId = await getOrCreateCategoryId(
        context.courseSubcategory,
        categoryId
      );
    }
  }

  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: context.courseTitle,
      description: context.courseDescription,
      learningObjectives: context.courseLearningObjectives || [],
      ...(categoryId && { categoryId }),
      ...(subcategoryId && { subcategoryId }),
    }),
  });

  const result = await response.json();
  return result.data?.id || result.id;
}

// 2. Create Chapters
async function createChaptersInDB(
  courseId: string,
  chapters: GeneratedChapter[]
): Promise<string[]> {
  const chapterIds: string[] = [];

  for (const chapter of chapters) {
    const response = await fetch(`/api/courses/${courseId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: chapter.title,
        description: chapter.description,
        position: chapter.position,
        learningOutcomes: chapter.learningOutcomes.join('\n'),
        difficulty: chapter.bloomsLevel,
      }),
    });

    const result = await response.json();
    chapterIds.push(result.data?.id || result.id);
  }

  return chapterIds;
}

// 3. Create Sections
async function createSectionsInDB(
  chapterIds: string[],
  sections: GeneratedSection[]
): Promise<string[]> {
  const sectionIds: string[] = [];

  for (const section of sections) {
    const chapterId = chapterIds[section.chapterIndex];

    const response = await fetch(`/api/chapters/${chapterId}/sections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: section.title,
        description: section.description,
        position: section.position,
        type: section.contentType,
        duration: section.estimatedDuration,
      }),
    });

    const result = await response.json();
    sectionIds.push(result.data?.id || result.id);
  }

  return sectionIds;
}
```

### Prisma Schema Reference

```prisma
model Course {
  id                String    @id @default(cuid())
  title             String
  description       String?
  imageUrl          String?
  price             Float?
  isPublished       Boolean   @default(false)
  categoryId        String?
  subcategoryId     String?
  userId            String
  learningObjectives String[]  @default([])

  chapters          Chapter[]
  category          Category? @relation("CourseCategory", fields: [categoryId], references: [id])
  subcategory       Category? @relation("CourseSubcategory", fields: [subcategoryId], references: [id])
}

model Chapter {
  id              String    @id @default(cuid())
  title           String
  description     String?
  position        Int
  isPublished     Boolean   @default(false)
  courseId        String
  learningOutcomes String?
  difficulty      String?

  sections        Section[]
  course          Course    @relation(fields: [courseId], references: [id])
}

model Section {
  id          String    @id @default(cuid())
  title       String
  description String?
  position    Int
  isPublished Boolean   @default(false)
  chapterId   String
  type        String    @default("VIDEO")
  duration    Int?
  videoUrl    String?

  chapter     Chapter   @relation(fields: [chapterId], references: [id])
}
```

---

## Error Handling

### Error Types

```typescript
export enum CreationErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AI_GENERATION_ERROR = 'AI_GENERATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CATEGORY_ERROR = 'CATEGORY_ERROR',
}

export interface CreationError {
  type: CreationErrorType;
  message: string;
  stage?: 1 | 2 | 3;
  details?: Record<string, unknown>;
  recoverable: boolean;
}
```

### Error Handling Pattern

```typescript
const startSequentialCreation = async (config: SequentialCreationConfig) => {
  try {
    setCurrentPhase('creating_course');
    const courseId = await createCourseInDB(config.courseContext);

    if (!courseId) {
      throw {
        type: CreationErrorType.DATABASE_ERROR,
        message: 'Failed to create course',
        recoverable: false,
      };
    }

    setCurrentPhase('generating_chapters');
    const chapters = await runStage1(config.courseContext);

    if (chapters.length === 0) {
      throw {
        type: CreationErrorType.AI_GENERATION_ERROR,
        message: 'No chapters generated',
        stage: 1,
        recoverable: true,
      };
    }

    // Continue with stages 2 and 3...

  } catch (error) {
    setCurrentPhase('error');

    if (error.recoverable) {
      // Allow retry
      setLastError(error);
    } else {
      // Cleanup partial creation
      await rollbackCreation(courseId);
    }

    throw error;
  }
};
```

### Retry Logic

```typescript
const runStageWithRetry = async <T>(
  stageFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await stageFn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError;
};
```

---

## Quality Scoring

### Scoring Dimensions

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Marketing | 25% | Title appeal, description clarity |
| Branding | 20% | Professional presentation |
| Sales | 20% | Conversion potential |
| Pedagogical | 35% | Learning effectiveness |

### Scoring Implementation

```typescript
// Current implementation uses placeholder scores
// TODO: Replace with @sam-ai/educational engines

interface CourseScore {
  marketingScore: number;    // 0-100
  brandingScore: number;     // 0-100
  salesScore: number;        // 0-100
  pedagogicalScore: number;  // 0-100
  overallScore: number;      // Weighted average
  reasoning: string;         // AI explanation
  suggestions: string[];     // Improvement suggestions
}

// Placeholder scoring (to be replaced)
const calculateScores = async (
  courseData: CourseContext
): Promise<CourseScore> => {
  // Currently uses random numbers
  // Should use: UnifiedBloomsEngine from @sam-ai/educational

  return {
    marketingScore: Math.floor(Math.random() * 30) + 70,
    brandingScore: Math.floor(Math.random() * 30) + 70,
    salesScore: Math.floor(Math.random() * 30) + 70,
    pedagogicalScore: Math.floor(Math.random() * 30) + 70,
    overallScore: Math.floor(Math.random() * 20) + 80,
    reasoning: 'Generated placeholder scores',
    suggestions: ['Improve title clarity', 'Add more objectives'],
  };
};
```

---

## Usage Example

### Complete Course Creation Flow

```typescript
// 1. Import hooks
import { useSequentialCreation } from '@/hooks/use-sam-sequential-creation';
import { useSAMWizard } from './hooks/use-sam-wizard';

// 2. Initialize in component
function AICreatorPage() {
  const { formData, setFormData, buildSamContext } = useSAMWizard();
  const {
    isCreating,
    progress,
    currentPhase,
    startSequentialCreation
  } = useSequentialCreation();

  // 3. Handle generation
  const handleGenerate = async () => {
    const courseContext = buildSamContext();

    try {
      const result = await startSequentialCreation({
        courseContext,
        onProgress: (p, phase, msg) => {
          console.log(`${phase}: ${p}% - ${msg}`);
        },
        onChapterGenerated: (chapter, index) => {
          console.log(`Chapter ${index + 1}: ${chapter.title}`);
        },
      });

      if (result.success) {
        router.push(`/teacher/courses/${result.courseId}`);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  return (
    <div>
      {/* Wizard steps UI */}
      <Button onClick={handleGenerate} disabled={isCreating}>
        {isCreating ? `Creating... ${progress}%` : 'Generate Course'}
      </Button>

      {/* Progress modal */}
      <SequentialCreationModal
        isOpen={isCreating}
        progress={progress}
        phase={currentPhase}
      />
    </div>
  );
}
```

---

## Future Improvements

1. **Real Quality Scoring**: Replace placeholder scores with `@sam-ai/educational` engines
2. **Memory Persistence**: Store SAM context in database for session continuity
3. **Batch Processing**: Generate multiple chapters/sections in parallel
4. **Undo/Rollback**: Allow undoing partial generations
5. **Template Library**: Pre-built course templates for common topics
6. **Multi-Language**: Support course generation in multiple languages

---

## Related Documentation

- [SAM Integration Analysis](./SAM_COURSE_CREATION_INTEGRATION_ANALYSIS.md)
- [SAM Sequential Creation Plan](./SAM_SEQUENTIAL_COURSE_CREATION_PLAN.md)
- [SAM Portability Guide](./SAM_PORTABILITY_GUIDE.md)
- [SAM System Complete Guide](./SAM_SYSTEM_COMPLETE_GUIDE.md)

---

*This documentation is auto-generated and maintained by Claude Code.*
