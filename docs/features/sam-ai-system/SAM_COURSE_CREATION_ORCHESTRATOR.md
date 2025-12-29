# SAM Course Creation Orchestrator

## Overview

The SAM Course Creation Orchestrator is an enterprise-grade system that automates the complete course creation process with quality assurance, progress tracking, and rollback capabilities.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SAM Course Creation Flow                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │ AI Creator   │───▶│ SAM AI       │───▶│ Course Creation          │  │
│  │ Wizard       │    │ Generation   │    │ Orchestrator             │  │
│  │ (4 Steps)    │    │ Modal        │    │                          │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│        │                    │                       │                   │
│        ▼                    ▼                       ▼                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │ Form Data    │    │ Generated    │    │ Quality Validation       │  │
│  │ Collection   │    │ Structure    │    │ (70+ score required)     │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│                                                   │                     │
│                                                   ▼                     │
│                            ┌──────────────────────────────────────┐    │
│                            │     Database Transaction             │    │
│                            │  ┌────────────────────────────────┐  │    │
│                            │  │ 1. Create Course Shell        │  │    │
│                            │  │ 2. Fill Course Details        │  │    │
│                            │  │ 3. Create Chapters (n)        │  │    │
│                            │  │ 4. Create Sections (n×m)      │  │    │
│                            │  │ 5. Finalize                   │  │    │
│                            │  └────────────────────────────────┘  │    │
│                            └──────────────────────────────────────┘    │
│                                          │                              │
│                     ┌────────────────────┼────────────────────┐        │
│                     ▼                    ▼                    ▼        │
│              ┌────────────┐       ┌────────────┐       ┌────────────┐  │
│              │  Success   │       │  Error     │       │  Cancel    │  │
│              │  Navigate  │       │  Rollback  │       │  Cleanup   │  │
│              └────────────┘       └────────────┘       └────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Orchestrator Hook

**File**: `hooks/use-sam-course-creation-orchestrator.ts`

The main orchestration hook that manages the entire creation process.

```typescript
import { useSAMCourseCreationOrchestrator } from '@/hooks/use-sam-course-creation-orchestrator';

const {
  progress,        // Current creation progress
  quality,         // Quality score object
  isCreating,      // Boolean - is creation in progress
  error,           // Error message if any
  createCourse,    // Main creation function
  validateContent, // Pre-validate content quality
  reset,           // Reset orchestrator state
  cancel,          // Cancel ongoing creation
} = useSAMCourseCreationOrchestrator();
```

### 2. Progress Component

**File**: `components/sam/course-creation-progress.tsx`

Visual progress indicator with phase tracking and quality display.

```typescript
import { CourseCreationProgress } from '@/components/sam/course-creation-progress';

<CourseCreationProgress
  progress={progress}
  quality={quality}
  isCreating={isCreating}
  error={error}
  onCancel={handleCancel}
  onRetry={handleRetry}
/>
```

### 3. Complete Creation API

**File**: `app/api/sam/create-course-complete/route.ts`

Single API endpoint for atomic course creation with transaction support.

## Creation Phases

| Phase | Description | Progress % |
|-------|-------------|------------|
| `idle` | Waiting to start | 0% |
| `validating` | Checking content quality | 5% |
| `creating_course` | Creating course shell | 15% |
| `filling_course` | Filling course details | 25% |
| `creating_chapters` | Creating all chapters | 30-60% |
| `creating_sections` | Creating all sections | 60-95% |
| `finalizing` | Final cleanup | 95% |
| `complete` | Success! | 100% |
| `error` | Failed with error | - |
| `rolling_back` | Undoing partial creation | - |

## Quality Validation

The orchestrator validates content quality before creation using 5 metrics:

### Quality Breakdown

| Metric | Weight | Description |
|--------|--------|-------------|
| Clarity | 20% | Title length, description clarity |
| Relevance | 20% | Target audience alignment |
| Completeness | 25% | Learning objectives, chapters, sections |
| Engagement | 15% | Content type diversity (videos, quizzes, projects) |
| Bloom's Alignment | 20% | Taxonomy level progression and verb usage |

### Minimum Score

- **Required**: 70/100 to proceed with creation
- **Suggestions**: Top 5 improvement suggestions provided

### Quality Scoring Logic

```typescript
// Title validation
if (title.length < 10) clarity -= 20;

// Description validation
if (description.length < 100) completeness -= 30;

// Learning objectives
if (objectives.length < 3) completeness -= 25;

// Bloom's verb alignment
if (verbAlignmentRate < 80%) bloomsAlignment -= penalty;

// Content type diversity
if (!hasVideos) engagement -= 15;
if (!hasQuizzes) engagement -= 15;
if (!hasProjects) engagement -= 10;
```

## Error Handling & Rollback

The orchestrator tracks all created entities and can rollback on failure:

```typescript
// Entities tracked for rollback
interface CreatedEntities {
  courseId?: string;
  chapterIds: string[];
  sectionIds: string[];
}

// Rollback process (reverse order)
1. Delete sections (newest first)
2. Delete chapters (newest first)
3. Delete course
```

## Usage Example

```typescript
// In AI Creator page.tsx
const handleCompleteGeneration = async () => {
  const result = await generateCompleteStructure({
    formData,
    samContext,
    onGenerationComplete: async (generatedStructure) => {
      // Use orchestrator for quality-controlled creation
      const creationResult = await orchestrateCreation(
        formData,
        generatedStructure
      );

      if (creationResult.success) {
        // Course created successfully
        // Router navigates to /teacher/courses/{courseId}
      }
    },
  });
};
```

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "course_abc123",
      "title": "Course Title",
      "url": "/teacher/courses/course_abc123"
    },
    "chapters": [
      {
        "id": "chapter_1",
        "title": "Chapter 1",
        "position": 1,
        "sections": [...]
      }
    ],
    "quality": {
      "overall": 85,
      "breakdown": {...},
      "passed": true,
      "suggestions": []
    },
    "stats": {
      "totalChapters": 8,
      "totalSections": 24,
      "creationTimeMs": 3500
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Quality score (65) is below minimum (70)",
    "code": "QUALITY_CHECK_FAILED"
  },
  "quality": {...},
  "suggestions": [
    "Add at least 3 learning objectives",
    "Use more diverse Bloom's taxonomy levels"
  ]
}
```

## Configuration Options

```typescript
const options = {
  validateBeforeCreate: true,     // Enable quality validation
  minimumQualityScore: 70,        // Minimum score to proceed
  generateIfMissing: true,        // Auto-generate structure if not provided
};
```

## Integration with AI Creator Wizard

The orchestrator is integrated at Step 4 of the AI Creator wizard:

1. **Step 1-3**: User fills in course details
2. **Step 4**: User clicks "Create Course"
3. **SAM Generation Modal**: SAM generates course structure
4. **Orchestrator Activation**: Quality validation + creation
5. **Progress Overlay**: Real-time progress display
6. **Completion**: Navigate to course management

## Best Practices

1. **Always validate first**: Use `validateContent()` before `createCourse()`
2. **Handle cancellation**: Support user cancellation with `cancel()`
3. **Show progress**: Display progress UI during creation
4. **Provide retry**: Allow retry on failure with `reset()`
5. **Track metrics**: Log creation time and success rates

## Related Files

- `hooks/use-sam-course-creation-orchestrator.ts` - Main orchestrator hook
- `components/sam/course-creation-progress.tsx` - Progress UI component
- `app/api/sam/create-course-complete/route.ts` - Complete creation API
- `app/(protected)/teacher/create/ai-creator/page.tsx` - Integration point
- `docs/features/sam-ai-system/SAM_COURSE_AUTO_FILL_IMPLEMENTATION_PLAN.md` - Full implementation plan

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01 | Initial implementation |

---

**Maintainer**: SAM AI Team
**Last Updated**: January 2025
