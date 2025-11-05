# How the Scalable Course Architecture Works

**A Complete Guide to Understanding the Category-Specific Course System**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Request Flow](#request-flow)
4. [Component Breakdown](#component-breakdown)
5. [Category Detection](#category-detection)
6. [Section Rendering](#section-rendering)
7. [Server Actions](#server-actions)
8. [Real-World Examples](#real-world-examples)
9. [Adding New Categories](#adding-new-categories)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### What Problem Does This Solve?

**Before**: All courses looked identical regardless of category.
- A Programming course looked the same as a Business course
- Same layout, same sections, same visual design
- No category-specific content

**After**: Each category has a unique visual identity and custom sections.
- Programming courses show tech stacks and code playgrounds
- Business courses show case studies and frameworks
- AI/ML courses show model architectures and algorithms
- Marketing courses show strategies and tools

### Key Features

✅ **6 Unique Categories**: Programming, AI/ML, Design, Business, Marketing, Data Science
✅ **17 Custom Sections**: Different content blocks per category
✅ **Type-Safe**: 100% TypeScript, zero `any` types
✅ **Build-Safe**: No dynamic imports that break production builds
✅ **Scalable**: Add new categories/sections by following the pattern
✅ **Server Actions**: Enroll, review, bookmark functionality

---

## Architecture Diagram

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Request                             │
│                   /courses/next-js-course                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   page.tsx (Server Component)                    │
│  • Fetches course data from database                            │
│  • Detects category variant                                     │
│  • Selects hero component                                       │
│  • Passes data to DynamicSections                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Category Detection Layer                      │
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │ Course Data  │──────▶│  Category    │──────▶│  Layout      │  │
│  │ (from DB)    │      │  Detector    │      │  Variant     │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│                                                                  │
│  Input: course.category.name = "Programming"                    │
│  Output: variant = "programming"                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Component Selection Layer                     │
│                                                                  │
│  ┌──────────────────┐           ┌──────────────────┐            │
│  │  Hero Registry   │           │ Section Registry │            │
│  │                  │           │                  │            │
│  │  programming →   │           │  programming →   │            │
│  │  ProgrammingHero │           │  [tech-stack,    │            │
│  │                  │           │   code-playground│            │
│  │  ai-ml →         │           │   prerequisites] │            │
│  │  AIMLHero        │           │                  │            │
│  │                  │           │  ai-ml →         │            │
│  │  design →        │           │  [model-arch,    │            │
│  │  DesignHero      │           │   algorithms,    │            │
│  │                  │           │   datasets]      │            │
│  └──────────────────┘           └──────────────────┘            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Rendering Layer                             │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              <ProgrammingHero />                       │     │
│  │  Blue/Cyan theme, code-centric design                  │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         <DynamicSections variant="programming" />      │     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │  <TechStackSection />                            │  │     │
│  │  │  Shows: React, TypeScript, Node.js, PostgreSQL  │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │  <CodePlaygroundSection />                       │  │     │
│  │  │  Shows: Interactive code editor preview          │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │  <PrerequisitesSection />                        │  │     │
│  │  │  Shows: Required skills for course               │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    User Sees Rendered Page                       │
│  • Programming-specific hero with blue/cyan theme               │
│  • Tech stack displayed in grid                                 │
│  • Code playground preview                                      │
│  • Prerequisites listed                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Request Flow

### Step-by-Step: What Happens When a User Visits a Course

```
1. User Request
   ↓
   User navigates to: /courses/react-mastery

2. Next.js Routing
   ↓
   Routes to: app/(course)/courses/[courseId]/page.tsx

3. Server Component Execution
   ↓
   page.tsx runs on the server:

   const [course, user] = await Promise.all([
     getCourseData(courseId),      // Fetch from database
     currentUser(),                 // Check authentication
   ]);

4. Category Detection
   ↓
   const categoryLayout = getCategoryLayout(course.category?.name);
   // course.category.name = "Programming"
   // Returns: { variant: "programming", ... }

5. Hero Selection
   ↓
   const HeroComponent = getHeroComponent(categoryLayout.variant);
   // Returns: ProgrammingHero component

6. Section Lookup
   ↓
   <DynamicSections course={course} variant={categoryLayout.variant} />

   Inside DynamicSections:
   - getOrderedSectionIds("programming")
     Returns: ['tech-stack', 'code-playground', 'prerequisites']

   - getCategorySections("programming")
     Returns: [
       { id: 'tech-stack', component: TechStackSection },
       { id: 'code-playground', component: CodePlaygroundSection },
       { id: 'prerequisites', component: PrerequisitesSection }
     ]

7. Section Rendering
   ↓
   sections.map((section) => (
     <SectionComponent
       key={section.id}
       course={course}
       variant="programming"
     />
   ))

8. HTML Sent to Browser
   ↓
   User sees:
   - ProgrammingHero (blue/cyan theme)
   - TechStackSection (React, TypeScript, etc.)
   - CodePlaygroundSection (interactive code preview)
   - PrerequisitesSection (skills needed)
```

---

## Component Breakdown

### 1. Page Component (`page.tsx`)

**Role**: Main server component that orchestrates everything

```typescript
// app/(course)/courses/[courseId]/page.tsx

const CourseIdPage = async (props) => {
  const params = await props.params;
  const courseId = params.courseId;

  // Step 1: Fetch data in parallel
  const [course, user] = await Promise.all([
    getCourseData(courseId),      // Database query
    currentUser(),                 // Auth check
  ]);

  // Step 2: Check enrollment
  const enrollment = await getEnrollmentStatus(user?.id, courseId);

  // Step 3: Determine category variant
  const categoryLayout = getCategoryLayout(course.category?.name);
  // Example: "Web Development" → variant: "programming"

  // Step 4: Get hero component
  const HeroComponent = getHeroComponent(categoryLayout.variant);
  // Example: variant "programming" → ProgrammingHero

  // Step 5: Render
  return (
    <div>
      {/* Category-specific hero */}
      <HeroComponent {...getHeroProps()} />

      {/* 🔥 KEY: Dynamic sections render here */}
      <DynamicSections
        course={course}
        variant={categoryLayout.variant}
      />

      {/* Other components */}
      <CoursePageTabs ... />
      <SimilarCoursesSection ... />
    </div>
  );
};
```

**Key Points**:
- Server Component (runs on server, not browser)
- Fetches data with React `cache()` for deduplication
- Passes variant to `DynamicSections`

---

### 2. Category Detector (`_lib/category-detector.ts`)

**Role**: Maps course category names to layout variants

```typescript
// Example mappings
const CATEGORY_PATTERNS = {
  'programming': 'programming',
  'web development': 'programming',
  'javascript': 'programming',
  'react': 'programming',

  'machine learning': 'ai-ml',
  'artificial intelligence': 'ai-ml',
  'deep learning': 'ai-ml',

  'ui design': 'design',
  'ux design': 'design',
  'graphic design': 'design',

  // ... more patterns
};

function detectCategoryVariant(course: BaseCourse): DetectionResult {
  const categoryName = course.category?.name?.toLowerCase();

  // Exact match
  if (CATEGORY_PATTERNS[categoryName]) {
    return {
      variant: CATEGORY_PATTERNS[categoryName],
      confidence: 'high',
      matchedPattern: categoryName,
    };
  }

  // Partial match (e.g., "Advanced React" contains "react")
  for (const [pattern, variant] of Object.entries(CATEGORY_PATTERNS)) {
    if (categoryName?.includes(pattern)) {
      return {
        variant,
        confidence: 'medium',
        matchedPattern: pattern,
      };
    }
  }

  // Fallback
  return {
    variant: 'default',
    confidence: 'low',
    matchedPattern: null,
  };
}
```

**Key Points**:
- Fuzzy matching with confidence scores
- Extensible pattern system
- Fallback to 'default' variant

---

### 3. Section Registry (`_components/section-registry.ts`)

**Role**: Maps section IDs to React components (build-safe)

```typescript
// Explicit imports (NOT dynamic)
import {
  TechStackSection,
  PrerequisitesSection,
  CodePlaygroundSection,
} from './category-sections/programming';

import {
  ModelArchitectureSection,
  DatasetsSection,
  AlgorithmsSection,
} from './category-sections/ai-ml';

// ... more imports

// Registry: Maps variant → section ID → component
const SECTION_REGISTRY: Record<CategoryLayoutVariant, CategorySections> = {
  programming: {
    'tech-stack': TechStackSection,
    'prerequisites': PrerequisitesSection,
    'code-playground': CodePlaygroundSection,
  },

  'ai-ml': {
    'model-architecture': ModelArchitectureSection,
    'datasets': DatasetsSection,
    'algorithms': AlgorithmsSection,
  },

  design: {
    'portfolio': PortfolioSection,
    'design-tools': DesignToolsSection,
  },

  // ... more categories
};

// Configuration: Defines section order per category
export const CATEGORY_SECTION_CONFIG: Record<CategoryLayoutVariant, string[]> = {
  programming: ['tech-stack', 'code-playground', 'prerequisites'],
  'ai-ml': ['model-architecture', 'algorithms', 'datasets'],
  design: ['portfolio', 'design-tools'],
  business: ['case-studies', 'frameworks'],
  marketing: ['strategies', 'tools'],
  'data-science': ['analytics-tools', 'visualization', 'datasets'],
  default: [],
};
```

**Key Points**:
- **Build-safe**: All imports are explicit (no `import(\`../${variant}/...\`)`)
- **Type-safe**: Fully typed with TypeScript
- **Order control**: `CATEGORY_SECTION_CONFIG` defines render order

---

### 4. Dynamic Sections (`_components/dynamic-sections.tsx`)

**Role**: Renders sections dynamically based on category

```typescript
export function DynamicSections({ course, variant }: DynamicSectionsProps) {
  // Step 1: Get ordered section IDs for this category
  const sectionIds = getOrderedSectionIds(variant);
  // Example: variant="programming" → ['tech-stack', 'code-playground', 'prerequisites']

  // Step 2: If no sections, return null
  if (sectionIds.length === 0) {
    return null;
  }

  // Step 3: Get section components
  const sections = getCategorySections(variant);
  // Returns: [
  //   { id: 'tech-stack', component: TechStackSection },
  //   { id: 'code-playground', component: CodePlaygroundSection },
  //   { id: 'prerequisites', component: PrerequisitesSection }
  // ]

  // Step 4: Render each section
  return (
    <div className="space-y-0">
      {sectionIds.map((sectionId) => {
        const section = sections.find((s) => s.id === sectionId);

        if (!section) return null;

        const SectionComponent = section.component;

        return (
          <SectionComponent
            key={sectionId}
            course={course}
            variant={variant}
          />
        );
      })}
    </div>
  );
}
```

**Key Points**:
- Server Component (runs on server)
- Loops through section IDs in order
- Renders each section with course data

---

### 5. Section Components (Example: `tech-stack-section.tsx`)

**Role**: Individual content blocks for each category

```typescript
'use client'; // Client component (interactive)

export function TechStackSection({ course, techStack = [] }: ProgrammingSectionProps) {
  // Demo data (in production, fetch from course.metadata)
  const technologies = techStack.length > 0 ? techStack : [
    'React 19',
    'TypeScript',
    'Next.js 15',
    'Tailwind CSS',
    'Node.js',
    'PostgreSQL',
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2>Technologies You'll Master</h2>

        {/* Tech Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {technologies.map((tech, index) => (
            <div key={index} className="bg-white rounded-xl p-6">
              <CheckCircle2 className="text-blue-600" />
              <h3>{tech}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Key Points**:
- `'use client'` directive (runs in browser)
- Receives `course` data as props
- Can be interactive (forms, buttons, animations)

---

## Category Detection

### How Categories Are Detected

```typescript
// Input: Course from database
const course = {
  id: 'abc123',
  title: 'React Mastery Course',
  category: {
    id: 'cat1',
    name: 'Web Development', // ← This is what we use
  },
  // ... more fields
};

// Processing
const categoryLayout = getCategoryLayout(course.category?.name);

// Internal logic:
1. Convert to lowercase: "web development"
2. Check exact match in CATEGORY_PATTERNS
3. If not found, check partial matches
4. Return variant and confidence

// Output
{
  variant: 'programming',  // ← Variant used for rendering
  confidence: 'high',
  matchedPattern: 'web development',
}
```

### Category Mapping Table

| Course Category Name | Detected Variant | Sections Rendered |
|---------------------|------------------|-------------------|
| Programming | `programming` | Tech Stack, Code Playground, Prerequisites |
| Web Development | `programming` | Tech Stack, Code Playground, Prerequisites |
| JavaScript | `programming` | Tech Stack, Code Playground, Prerequisites |
| React | `programming` | Tech Stack, Code Playground, Prerequisites |
| Machine Learning | `ai-ml` | Model Architecture, Algorithms, Datasets |
| Deep Learning | `ai-ml` | Model Architecture, Algorithms, Datasets |
| Data Science | `data-science` | Analytics Tools, Visualization, Datasets |
| UI Design | `design` | Portfolio, Design Tools |
| Business Strategy | `business` | Case Studies, Frameworks |
| Digital Marketing | `marketing` | Strategies, Tools |
| Unknown | `default` | No custom sections |

---

## Section Rendering

### Section Rendering Logic

```typescript
// DynamicSections receives variant
variant = "programming"

// Step 1: Get section IDs
const sectionIds = getOrderedSectionIds(variant);
// Returns: ['tech-stack', 'code-playground', 'prerequisites']

// Step 2: Get section components
const sections = getCategorySections(variant);
// Returns:
[
  { id: 'tech-stack', component: TechStackSection },
  { id: 'code-playground', component: CodePlaygroundSection },
  { id: 'prerequisites', component: PrerequisitesSection },
]

// Step 3: Map and render
sectionIds.map((sectionId) => {
  // Find component for this ID
  const section = sections.find(s => s.id === sectionId);

  // Render it
  return <section.component course={course} variant={variant} />;
});
```

### What Gets Rendered Per Category

**Programming Course**:
```html
<ProgrammingHero />
<TechStackSection />        ← React, TypeScript, Node.js
<CodePlaygroundSection />   ← Interactive code editor
<PrerequisitesSection />    ← Required skills
```

**AI/ML Course**:
```html
<AIMLHero />
<ModelArchitectureSection /> ← CNN, RNN, Transformers
<AlgorithmsSection />        ← Supervised, Unsupervised, Deep Learning
<DatasetsSection />          ← Training datasets
```

**Business Course**:
```html
<DefaultHero />
<CaseStudiesSection />   ← Real business scenarios
<FrameworksSection />    ← SWOT, Porter's Five Forces, OKR
```

**Default (Unknown Category)**:
```html
<DefaultHero />
<!-- No custom sections -->
```

---

## Server Actions

### How Server Actions Work

Server Actions are functions that run on the server and can be called from client components.

**Example: Enrollment Flow**

```typescript
// 1. User clicks "Enroll" button
<button onClick={() => handleEnroll()}>
  Enroll Now
</button>

// 2. Client-side handler
async function handleEnroll() {
  // Call Server Action
  const result = await enrollInCourse(courseId);

  if (result.success) {
    toast.success('Enrolled successfully!');
    router.refresh(); // Revalidate
  } else {
    toast.error(result.error.message);
  }
}

// 3. Server Action runs on server
// File: _actions/enroll-action.ts
'use server';

export async function enrollInCourse(courseId: string) {
  // Validate input
  const validatedData = EnrollSchema.parse({ courseId });

  // Check authentication
  const user = await currentUser();
  if (!user) {
    return { success: false, error: { message: 'Not authenticated' } };
  }

  // Check if already enrolled
  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } }
  });

  if (existing) {
    return { success: false, error: { message: 'Already enrolled' } };
  }

  // Create enrollment
  await db.enrollment.create({
    data: {
      id: generateId(),
      userId: user.id,
      courseId,
      updatedAt: new Date(),
    },
  });

  // Revalidate cache
  revalidatePath(`/courses/${courseId}`);

  return { success: true, data: { message: 'Enrolled!' } };
}
```

### Available Server Actions

**1. Enrollment Actions** (`enroll-action.ts`):
- `enrollInCourse(courseId)` - Enroll user in course
- `unenrollFromCourse(courseId)` - Unenroll user

**2. Review Actions** (`review-action.ts`):
- `createCourseReview(courseId, rating, comment)` - Create review
- `updateCourseReview(reviewId, rating, comment)` - Update review
- `deleteCourseReview(reviewId)` - Delete review

**3. Bookmark Actions** (`bookmark-action.ts`):
- `toggleCourseBookmark(courseId)` - Add/remove bookmark
- `isCourseBookmarked(courseId)` - Check bookmark status
- `getBookmarkedCourses()` - Get all bookmarks

---

## Real-World Examples

### Example 1: Programming Course Journey

**Course**: "Full-Stack Web Development Bootcamp"

**Step 1: User Visits Course**
```
URL: /courses/fullstack-bootcamp
```

**Step 2: Server Fetches Data**
```typescript
const course = await getCourseData('fullstack-bootcamp');
// Returns:
{
  id: 'fullstack-bootcamp',
  title: 'Full-Stack Web Development Bootcamp',
  category: { name: 'Programming' },
  description: 'Learn React, Node.js, and PostgreSQL',
  // ... more data
}
```

**Step 3: Category Detection**
```typescript
getCategoryLayout('Programming')
// Returns: { variant: 'programming', confidence: 'high' }
```

**Step 4: Hero Selection**
```typescript
getHeroComponent('programming')
// Returns: ProgrammingHero component
```

**Step 5: Section Selection**
```typescript
getOrderedSectionIds('programming')
// Returns: ['tech-stack', 'code-playground', 'prerequisites']
```

**Step 6: Rendering**
```html
<!-- Blue/Cyan themed hero -->
<ProgrammingHero />

<!-- Section 1: Tech Stack -->
<section class="bg-blue-50">
  <h2>Technologies You'll Master</h2>
  <div class="grid">
    <div>React 19</div>
    <div>TypeScript</div>
    <div>Next.js 15</div>
    <div>Node.js</div>
    <div>PostgreSQL</div>
    <div>Prisma ORM</div>
  </div>
</section>

<!-- Section 2: Code Playground -->
<section class="bg-slate-50">
  <h2>Interactive Code Playground</h2>
  <div class="code-editor">
    <!-- JavaScript, TypeScript, Python examples -->
  </div>
</section>

<!-- Section 3: Prerequisites -->
<section class="bg-blue-50">
  <h2>Prerequisites</h2>
  <ul>
    <li>Basic HTML/CSS knowledge</li>
    <li>JavaScript fundamentals</li>
  </ul>
</section>
```

---

### Example 2: Business Course Journey

**Course**: "MBA Essentials: Strategy & Leadership"

**Step 1-2: Same as above** (fetch course data)

**Step 3: Category Detection**
```typescript
getCategoryLayout('Business')
// Returns: { variant: 'business', confidence: 'high' }
```

**Step 4: Hero Selection**
```typescript
getHeroComponent('business')
// Returns: DefaultHero (or future BusinessHero)
```

**Step 5: Section Selection**
```typescript
getOrderedSectionIds('business')
// Returns: ['case-studies', 'frameworks']
```

**Step 6: Rendering**
```html
<!-- Professional corporate themed hero -->
<DefaultHero />

<!-- Section 1: Case Studies -->
<section class="bg-blue-50">
  <h2>Real-World Case Studies</h2>

  <!-- Case Study 1 -->
  <div class="case-study">
    <h3>Tech Startup Growth</h3>
    <p>Challenge: Scale from 10 to 500 employees in 18 months</p>
    <p>Outcome: 300% revenue growth, successful Series B funding</p>
    <div class="metrics">
      <span>Revenue: +300%</span>
      <span>Team: 500+</span>
      <span>Funding: $50M</span>
    </div>
  </div>

  <!-- More case studies... -->
</section>

<!-- Section 2: Frameworks -->
<section class="bg-white">
  <h2>Strategic Business Frameworks</h2>

  <div class="framework">
    <h3>SWOT Analysis</h3>
    <p>Identify Strengths, Weaknesses, Opportunities, and Threats</p>
  </div>

  <div class="framework">
    <h3>Porter's Five Forces</h3>
    <p>Analyze competitive forces shaping your industry</p>
  </div>

  <!-- More frameworks... -->
</section>
```

---

## Adding New Categories

### Step-by-Step: Add a "Photography" Category

**Step 1: Create Section Components**

```bash
# Create directory
mkdir -p app/(course)/courses/[courseId]/_components/category-sections/photography

# Create section files
touch app/(course)/courses/[courseId]/_components/category-sections/photography/equipment-section.tsx
touch app/(course)/courses/[courseId]/_components/category-sections/photography/portfolio-section.tsx
touch app/(course)/courses/[courseId]/_components/category-sections/photography/index.ts
```

**Step 2: Implement Sections**

```typescript
// equipment-section.tsx
'use client';

import { Camera, Aperture } from 'lucide-react';
import type { BaseSectionProps } from '../../../_types/section.types';

export function EquipmentSection({ course }: BaseSectionProps) {
  const equipment = [
    { name: 'DSLR Camera', icon: Camera },
    { name: 'Lenses', icon: Aperture },
    // ... more equipment
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
      <h2>Essential Photography Equipment</h2>
      {/* Render equipment grid */}
    </section>
  );
}
```

**Step 3: Create Index File**

```typescript
// photography/index.ts
export { EquipmentSection } from './equipment-section';
export { PortfolioSection } from './portfolio-section';
```

**Step 4: Update Section Registry**

```typescript
// section-registry.ts

// Add import
import {
  EquipmentSection,
  PortfolioSection,
} from './category-sections/photography';

// Update registry
const SECTION_REGISTRY = {
  // ... existing categories

  photography: {
    'equipment': EquipmentSection,
    'portfolio': PortfolioSection,
  },
};

// Update config
export const CATEGORY_SECTION_CONFIG = {
  // ... existing categories

  photography: ['equipment', 'portfolio'],
};
```

**Step 5: Update Category Layouts**

```typescript
// _config/category-layouts.ts

export type CategoryLayoutVariant =
  | 'programming'
  | 'ai-ml'
  | 'design'
  | 'business'
  | 'marketing'
  | 'data-science'
  | 'photography'  // ← Add this
  | 'default';
```

**Step 6: Update Category Detector**

```typescript
// _lib/category-detector.ts

const CATEGORY_PATTERNS = {
  // ... existing patterns

  'photography': 'photography',
  'photo': 'photography',
  'camera': 'photography',
};
```

**Step 7: (Optional) Create Hero Component**

```typescript
// _components/category-heroes/photography-hero.tsx
'use client';

export function PhotographyHero({ course }) {
  return (
    <section className="bg-gradient-to-r from-amber-600 to-orange-600">
      {/* Photography-themed hero */}
    </section>
  );
}

// Update category-registry.ts
import { PhotographyHero } from './category-heroes/photography-hero';

const HERO_COMPONENTS = {
  // ... existing
  photography: PhotographyHero,
};
```

**Step 8: Test**

```bash
npm run build
# Should compile successfully

# Create a test course with category "Photography"
# Visit /courses/[photography-course-id]
# Verify equipment and portfolio sections appear
```

**Done!** ✅ New category added in 8 steps.

---

## Troubleshooting

### Issue 1: Sections Not Appearing

**Symptoms**:
- Course page loads but no custom sections appear
- Only hero and tabs are visible

**Diagnosis**:
```typescript
// Check DynamicSections integration
// In page.tsx, verify:
<DynamicSections course={course} variant={categoryLayout.variant} />
```

**Solutions**:

1. **Check section registry**:
```typescript
// Verify sections are registered
console.log(CATEGORY_SECTION_CONFIG['programming']);
// Should output: ['tech-stack', 'code-playground', 'prerequisites']
```

2. **Check imports**:
```typescript
// Verify all imports resolve
import { TechStackSection } from './category-sections/programming';
// Should not have TypeScript errors
```

3. **Check variant**:
```typescript
// Add debug logging
console.log('Category variant:', categoryLayout.variant);
// Should match a key in CATEGORY_SECTION_CONFIG
```

---

### Issue 2: TypeScript Errors

**Symptoms**:
- `Cannot find module` errors
- `Property does not exist` errors

**Solutions**:

1. **Check file paths**:
```bash
# Verify files exist
ls app/(course)/courses/[courseId]/_components/category-sections/programming/
```

2. **Check exports**:
```typescript
// In index.ts files
export { TechStackSection } from './tech-stack-section';
// Must match component name exactly
```

3. **Rebuild TypeScript**:
```bash
npx tsc --noEmit
# Fix all errors before proceeding
```

---

### Issue 3: Build Fails

**Symptoms**:
- `npm run build` fails
- "Module not found" errors

**Solutions**:

1. **Check dynamic imports** (shouldn't have any):
```typescript
// ❌ BAD (breaks builds)
const Component = await import(`./sections/${variant}/hero`);

// ✅ GOOD (build-safe)
import { ProgrammingHero } from './category-heroes/programming-hero';
const HERO_COMPONENTS = { programming: ProgrammingHero };
```

2. **Clean build cache**:
```bash
rm -rf .next
npm run build
```

3. **Check for circular dependencies**:
```bash
# Use a tool like madge
npx madge --circular app/(course)/courses/[courseId]
```

---

### Issue 4: Sections Render in Wrong Order

**Symptoms**:
- Sections appear but in unexpected order

**Solutions**:

1. **Check `CATEGORY_SECTION_CONFIG`**:
```typescript
// The order in this array determines render order
export const CATEGORY_SECTION_CONFIG = {
  programming: [
    'tech-stack',        // Renders first
    'code-playground',   // Renders second
    'prerequisites',     // Renders third
  ],
};
```

2. **Verify `getOrderedSectionIds`**:
```typescript
const ids = getOrderedSectionIds('programming');
console.log(ids); // Should match config array order
```

---

### Issue 5: Server Actions Not Working

**Symptoms**:
- Enrollment/review actions fail
- "Not a function" errors

**Solutions**:

1. **Check `'use server'` directive**:
```typescript
// MUST be at top of file
'use server';

export async function enrollInCourse() {
  // ...
}
```

2. **Check imports in client components**:
```typescript
// Client component
'use client';

import { enrollInCourse } from '../_actions/enroll-action';

async function handleEnroll() {
  const result = await enrollInCourse(courseId);
}
```

3. **Check validation**:
```typescript
// Ensure Zod schemas are correct
const EnrollSchema = z.object({
  courseId: z.string().min(1),
});

const validated = EnrollSchema.parse({ courseId });
```

---

## Performance Considerations

### Server Component Benefits

**Why sections are Server Components**:
- ✅ No JavaScript sent to browser (unless marked `'use client'`)
- ✅ Runs on server (faster data access)
- ✅ SEO-friendly (fully rendered HTML)
- ✅ Reduced bundle size

**When to use `'use client'`**:
- Need useState, useEffect, or other hooks
- Need event handlers (onClick, onChange)
- Need browser APIs (localStorage, window)

### Code Splitting

**Automatic splitting**:
```
programming courses only download:
- ProgrammingHero
- TechStackSection
- CodePlaygroundSection
- PrerequisitesSection

business courses only download:
- DefaultHero
- CaseStudiesSection
- FrameworksSection

✅ Unused sections are NOT downloaded
```

### Caching Strategy

**React cache() usage**:
```typescript
// Prevents duplicate queries in same request
export const getCourseData = cache(async (courseId: string) => {
  return await db.course.findUnique({ where: { id: courseId } });
});

// Called multiple times, only queries once:
const course1 = await getCourseData('abc');  // DB query
const course2 = await getCourseData('abc');  // Cached!
```

---

## Summary

### What Makes This Architecture Special

1. **Type-Safe**: 100% TypeScript, zero `any` types
2. **Build-Safe**: No dynamic imports, works in production
3. **Scalable**: Add categories by following pattern
4. **Performance**: Server Components, code splitting, caching
5. **Maintainable**: Clear separation of concerns
6. **Flexible**: Easy to customize per category

### Key Takeaways

✅ **Each category gets unique sections**
✅ **Category detection is automatic**
✅ **Adding new categories is straightforward**
✅ **Type-safe and build-safe**
✅ **Production-ready**

### Quick Reference

**Main Components**:
- `page.tsx` - Orchestrates everything
- `DynamicSections` - Renders sections
- `section-registry.ts` - Maps sections to components
- `category-detector.ts` - Detects category variant

**Adding New Category**:
1. Create section components
2. Update section registry
3. Update category layouts type
4. Update category detector patterns
5. (Optional) Create hero component

**Debugging**:
1. Check TypeScript errors first
2. Verify imports resolve
3. Check section registry config
4. Test production build

---

**Documentation Version**: 1.0.0
**Last Updated**: November 4, 2025
**Maintained By**: Taxomind Development Team
