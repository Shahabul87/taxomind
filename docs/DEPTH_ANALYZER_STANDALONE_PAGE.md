# Depth Analyzer Standalone Page - Implementation Plan

## Overview

Create a standalone, feature-rich Depth Analyzer page at `/teacher/depth-analyzer` that can analyze:
- **Entire Courses** (by Course ID)
- **Individual Chapters** (by Chapter ID)
- **Individual Sections** (by Section ID)

This page will replace the embedded analyzer on the course page and provide a centralized location for all depth analysis needs.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPTH ANALYZER PAGE                                  │
│                      /teacher/depth-analyzer                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      HEADER SECTION                                  │   │
│  │  ┌──────────┐  Cognitive Depth Analyzer                             │   │
│  │  │  Brain   │  Analyze your courses, chapters, and sections         │   │
│  │  │  Icon    │  powered by Bloom's Taxonomy & Webb's DOK             │   │
│  │  └──────────┘                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    SELECTION PANEL (Glass Card)                      │   │
│  │                                                                      │   │
│  │   Analysis Level:  ○ Course  ○ Chapter  ○ Section                   │   │
│  │                                                                      │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │  📚 Select Course                                      ▼    │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │  📖 Select Chapter (cascading from course)            ▼    │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │   ┌─────────────────────────────────────────────────────────────┐   │   │
│  │   │  📄 Select Section (cascading from chapter)           ▼    │   │   │
│  │   └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │   ┌────────────────────────────────────────────────────────────┐    │   │
│  │   │  🔍 Analyze Now                                            │    │   │
│  │   └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    QUICK ACCESS CARDS                                │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ Recent       │  │ Low Score    │  │ Needs        │               │   │
│  │  │ Analyses     │  │ Items        │  │ Review       │               │   │
│  │  │ (Last 5)     │  │ (Score <60)  │  │ (No Analysis)│               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ANALYSIS RESULTS                                  │   │
│  │                                                                      │   │
│  │   (Reuses existing CourseDepthAnalyzer component                    │   │
│  │    with modifications for chapter/section level)                    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
app/(protected)/teacher/depth-analyzer/
├── page.tsx                          # Main page (server component)
├── _components/
│   ├── depth-analyzer-client.tsx     # Main client component
│   ├── analysis-level-selector.tsx   # Radio group for level selection
│   ├── cascading-selector.tsx        # Course → Chapter → Section dropdowns
│   ├── quick-access-cards.tsx        # Recent analyses, low scores, etc.
│   ├── analysis-results-panel.tsx    # Wrapper for analysis display
│   └── content-tree-view.tsx         # Optional: Tree view of all content
```

---

## Implementation Phases

### Phase 1: Route & Sidebar Setup

#### 1.1 Add to Smart Sidebar

**File:** `components/dashboard/smart-sidebar.tsx`

Add new navigation item with `Microscope` or `Scan` icon:

```typescript
// Add to imports
import { Microscope } from 'lucide-react';

// Add to navigationItems array (under Courses submenu or as standalone)
{
  label: 'Depth Analyzer',
  href: '/teacher/depth-analyzer',
  icon: Microscope,
  roles: ['all'],
},
```

**Placement Options:**
1. **Option A:** Add as submenu item under "Courses" dropdown
2. **Option B:** Add as standalone item (recommended for visibility)

#### 1.2 Create Base Route

**File:** `app/(protected)/teacher/depth-analyzer/page.tsx`

```typescript
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DepthAnalyzerClient } from "./_components/depth-analyzer-client";

export default async function DepthAnalyzerPage() {
  const user = await currentUser();

  if (!user?.id) {
    return redirect("/auth/login");
  }

  // Fetch user's courses with chapters and sections for the selector
  const courses = await db.course.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      chapters: {
        orderBy: { position: 'asc' },
        include: {
          sections: {
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen">
      <DepthAnalyzerClient
        courses={courses}
        userId={user.id}
      />
    </div>
  );
}
```

---

### Phase 2: UI Components

#### 2.1 Main Client Component Design

**File:** `app/(protected)/teacher/depth-analyzer/_components/depth-analyzer-client.tsx`

**Design Features:**
- **Glass morphism** cards with blur effects
- **Gradient backgrounds** (purple → indigo → blue theme)
- **Animated** selection transitions
- **3D card hover** effects
- **Particle/mesh** background animation
- **Dark mode** support

**Key UI Elements:**

```tsx
// Header with animated gradient
<div className="relative overflow-hidden">
  {/* Animated mesh gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10" />

  {/* Floating orbs animation */}
  <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
  <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

  {/* Content */}
  <div className="relative z-10 px-6 py-12">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto text-center"
    >
      <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 shadow-xl mb-6">
        <Microscope className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
        Cognitive Depth Analyzer
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-300 mt-4 max-w-2xl mx-auto">
        Analyze your educational content using Bloom&apos;s Taxonomy, Webb&apos;s DOK,
        and research-validated frameworks
      </p>
    </motion.div>
  </div>
</div>
```

#### 2.2 Analysis Level Selector

**Visual Design:** Segmented control with icons

```tsx
<div className="flex items-center justify-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl">
  {[
    { value: 'course', label: 'Course', icon: BookOpen, color: 'purple' },
    { value: 'chapter', label: 'Chapter', icon: Layers, color: 'indigo' },
    { value: 'section', label: 'Section', icon: FileText, color: 'blue' },
  ].map((level) => (
    <button
      key={level.value}
      onClick={() => setAnalysisLevel(level.value)}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300",
        analysisLevel === level.value
          ? `bg-gradient-to-r from-${level.color}-500 to-${level.color}-600 text-white shadow-lg`
          : "hover:bg-slate-200 dark:hover:bg-slate-700"
      )}
    >
      <level.icon className="h-5 w-5" />
      <span className="font-medium">{level.label}</span>
    </button>
  ))}
</div>
```

#### 2.3 Cascading Selector Component

**Features:**
- Smart dropdowns that cascade (Course → Chapter → Section)
- Search/filter functionality
- Shows item count and status badges
- Animated transitions

```tsx
interface CascadingSelectorProps {
  courses: CourseWithChaptersAndSections[];
  analysisLevel: 'course' | 'chapter' | 'section';
  onSelectionChange: (selection: SelectionState) => void;
}

// Selection state
interface SelectionState {
  courseId: string | null;
  chapterId: string | null;
  sectionId: string | null;
}
```

#### 2.4 Quick Access Cards

**Three cards showing:**

1. **Recent Analyses** - Last 5 analyzed items with scores
2. **Needs Attention** - Items with score < 60%
3. **Not Analyzed** - Items without any analysis

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <QuickAccessCard
    title="Recent Analyses"
    icon={Clock}
    items={recentAnalyses}
    color="emerald"
    onItemClick={handleQuickSelect}
  />
  <QuickAccessCard
    title="Needs Improvement"
    icon={AlertTriangle}
    items={lowScoreItems}
    color="amber"
    badge={lowScoreItems.length}
    onItemClick={handleQuickSelect}
  />
  <QuickAccessCard
    title="Not Analyzed"
    icon={HelpCircle}
    items={notAnalyzedItems}
    color="slate"
    badge={notAnalyzedItems.length}
    onItemClick={handleQuickSelect}
  />
</div>
```

---

### Phase 3: API Modifications

#### 3.1 Extend Existing API or Create New Endpoint

**Option A:** Modify existing `/api/course-depth-analysis/route.ts`
- Add `analysisLevel` parameter: `course` | `chapter` | `section`
- Add `targetId` parameter for chapter/section IDs

**Option B:** Create new endpoints
- `/api/depth-analysis/course/[courseId]`
- `/api/depth-analysis/chapter/[chapterId]`
- `/api/depth-analysis/section/[sectionId]`

**Recommended:** Option A with modified request body:

```typescript
interface DepthAnalysisRequest {
  analysisLevel: 'course' | 'chapter' | 'section';
  targetId: string; // courseId, chapterId, or sectionId
  forceRefresh?: boolean;
}
```

#### 3.2 Data Fetching for Chapter/Section

For **Chapter Analysis:**
```typescript
const chapter = await db.chapter.findUnique({
  where: { id: chapterId },
  include: {
    sections: {
      include: {
        exam: { include: { questions: { include: { options: true } } } },
        muxData: true,
      },
    },
    course: { select: { title: true, description: true } },
  },
});
```

For **Section Analysis:**
```typescript
const section = await db.section.findUnique({
  where: { id: sectionId },
  include: {
    exam: { include: { questions: { include: { options: true } } } },
    muxData: true,
    chapter: {
      select: {
        title: true,
        course: { select: { title: true } }
      }
    },
  },
});
```

---

### Phase 4: Remove from Course Page

#### 4.1 Modify Course Page

**File:** `app/(protected)/teacher/courses/[courseId]/page.tsx`

Remove:
```diff
- import { CourseDepthAnalyzer } from "./_components/course-depth-analyzer";

// Remove the entire Course Depth Analysis section (lines 471-491)
- {/* Course Depth Analysis - Single Column */}
- <div className="px-2 sm:px-4 md:px-6 mb-4 sm:mb-6 md:mb-8">
-   <div className="bg-white/80 ...">
-     ...
-     <CourseDepthAnalyzer ... />
-   </div>
- </div>
```

Add link to new analyzer:
```tsx
{/* Quick Link to Depth Analyzer */}
<div className="px-2 sm:px-4 md:px-6 mb-4">
  <Link href={`/teacher/depth-analyzer?courseId=${params.courseId}`}>
    <Card className="p-4 hover:shadow-lg transition-all group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500">
          <Microscope className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">Analyze Course Depth</h3>
          <p className="text-sm text-slate-500">
            Run Bloom&apos;s Taxonomy analysis on this course
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
      </div>
    </Card>
  </Link>
</div>
```

---

### Phase 5: Enhanced Features

#### 5.1 URL Query Parameters

Support direct linking:
- `/teacher/depth-analyzer?courseId=xxx`
- `/teacher/depth-analyzer?chapterId=xxx`
- `/teacher/depth-analyzer?sectionId=xxx`

```typescript
// In page.tsx
interface PageProps {
  searchParams: Promise<{
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  }>;
}

export default async function DepthAnalyzerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  // Pre-select based on URL params
}
```

#### 5.2 Comparison Mode (Future)

Allow comparing analysis results between:
- Different chapters
- Different sections
- Before/after improvements

#### 5.3 Export & Reporting

- Export analysis as PDF
- Generate improvement roadmap
- Share with collaborators

---

## UI/UX Design Specifications

### Color Palette

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary Gradient | `from-purple-500 via-indigo-500 to-blue-500` | Same |
| Background | `bg-gradient-to-b from-slate-50 to-white` | `from-slate-900 to-slate-950` |
| Cards | `bg-white/80 backdrop-blur-xl` | `bg-slate-800/80 backdrop-blur-xl` |
| Borders | `border-slate-200/50` | `border-slate-700/50` |

### Animation Specifications

```typescript
// Page entry animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Card animations
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  hover: {
    y: -4,
    transition: { duration: 0.2 }
  }
};
```

### Responsive Breakpoints

| Screen | Layout |
|--------|--------|
| Mobile (<640px) | Single column, stacked cards |
| Tablet (640-1024px) | Two column grid |
| Desktop (>1024px) | Three column grid, side panel |

---

## Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Create route directory structure
- [ ] Add sidebar navigation item with Microscope icon
- [ ] Create base page.tsx with data fetching
- [ ] Create empty client component shell

### Phase 2: UI Components (Day 2-3)
- [ ] Build animated header section
- [ ] Create analysis level selector (radio group)
- [ ] Build cascading selector component
- [ ] Create quick access cards
- [ ] Add loading states and skeletons

### Phase 3: API Integration (Day 3-4)
- [ ] Modify API to support chapter/section analysis
- [ ] Create hooks for data fetching
- [ ] Integrate existing analyzer components
- [ ] Add caching for analysis results

### Phase 4: Cleanup (Day 4)
- [ ] Remove analyzer from course page
- [ ] Add quick link to new analyzer
- [ ] Update any existing references
- [ ] Test all navigation paths

### Phase 5: Polish (Day 5)
- [ ] Add URL parameter support
- [ ] Implement export functionality
- [ ] Add comparison mode (optional)
- [ ] Performance optimization
- [ ] Accessibility audit

---

## Technical Dependencies

### Required Packages (Already Installed)
- `framer-motion` - Animations
- `lucide-react` - Icons
- `@radix-ui/react-*` - UI primitives
- `tailwindcss` - Styling

### Components to Reuse
- `CourseDepthAnalyzer` - Core analysis UI
- `BloomsPyramidVisualization` - Pyramid chart
- `DepthInsightsPanel` - Insights display
- `ImprovementRecommendations` - Recommendations
- `ChapterDepthAnalysis` - Chapter breakdown

---

## API Response Schema

```typescript
interface DepthAnalysisResponse {
  success: boolean;
  analysisLevel: 'course' | 'chapter' | 'section';
  target: {
    id: string;
    title: string;
    parentTitle?: string; // Course title for chapter/section
  };
  analysis: {
    scores: {
      depth: number;
      balance: number;
      complexity: number;
      completeness: number;
    };
    overallDistribution: Record<string, number>;
    // ... rest of existing analysis fields
  };
  // Phase 1-4 enhanced data
  qmCompliance?: QMComplianceData;
  olcCompliance?: OLCComplianceData;
  distributionAnalysis?: DistributionAnalysisData;
  deepContentAnalysis?: DeepContentAnalysisData;
  transcriptAnalysis?: TranscriptAnalysisData;
}
```

---

## Success Metrics

1. **User Adoption** - 80% of teachers use the new page within 2 weeks
2. **Analysis Coverage** - 50% increase in chapters/sections analyzed
3. **Performance** - Page load under 2 seconds
4. **Satisfaction** - Positive feedback on new UI

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Performance with large courses | Implement virtualization for large lists |
| Data inconsistency | Add cache invalidation on content changes |
| User confusion | Add onboarding tooltip tour |
| API overload | Add rate limiting and caching |

---

**Document Version:** 1.0
**Created:** January 2025
**Author:** Claude Code
**Status:** Ready for Implementation
