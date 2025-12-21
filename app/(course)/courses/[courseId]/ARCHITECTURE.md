# Course Detail Page Architecture

> A comprehensive guide to the category-aware, enterprise-level course detail page system in Taxomind LMS.

---

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Core Concepts](#core-concepts)
4. [Category-Specific Hero System](#category-specific-hero-system)
5. [Configuration System](#configuration-system)
6. [Component Architecture](#component-architecture)
7. [Data Flow](#data-flow)
8. [Adding New Categories](#adding-new-categories)
9. [Performance Optimizations](#performance-optimizations)
10. [SEO Implementation](#seo-implementation)

---

## Overview

The course detail page implements a **category-aware rendering system** that dynamically adapts the visual presentation based on the course category. This creates a unique, tailored experience for different types of courses (Programming, AI/ML, Design, Business, etc.).

### Key Features

- **Dynamic Hero Components**: 5 distinct hero variants with unique themes
- **Category Detection**: Automatic pattern matching for 30+ category names
- **Performance First**: Parallel data fetching, lazy loading, Suspense boundaries
- **SEO Optimized**: JSON-LD structured data, dynamic metadata
- **Mobile-First UX**: Sticky headers, bottom enrollment bars

---

## Directory Structure

```
app/(course)/courses/[courseId]/
│
├── page.tsx                    # Main Server Component (orchestrator)
├── layout.tsx                  # Layout wrapper
├── loading.tsx                 # Loading skeleton
├── error.tsx                   # Error boundary
│
├── _config/                    # Configuration files
│   ├── category-layouts.ts     # Category → Layout mapping
│   ├── category-registry.ts    # Category registration system
│   ├── feature-flags.ts        # Feature toggle system
│   ├── seo-config.ts           # SEO settings
│   └── theme-config.ts         # Theme variables
│
├── _lib/                       # Utility functions
│   ├── data-fetchers.ts        # Data fetching utilities
│   └── metadata-generator.ts   # SEO metadata generator
│
├── _types/                     # TypeScript type definitions
│   └── index.ts                # Shared types
│
├── _components/                # UI Components
│   ├── category-heroes/        # Category-specific hero components
│   │   ├── index.tsx           # Export hub
│   │   ├── programming-hero.tsx
│   │   ├── ai-ml-hero.tsx
│   │   ├── design-hero.tsx
│   │   └── default-hero.tsx
│   │
│   ├── hero-wrapper.tsx        # Client wrapper for heroes
│   ├── sticky-mini-header.tsx  # Scroll-aware sticky CTA
│   ├── mobile-enroll-bar.tsx   # Mobile bottom CTA
│   ├── course-page-tabs.tsx    # Tab navigation system
│   └── ...                     # 40+ more components
│
└── learn/                      # Learning interface (separate)
    └── ...
```

---

## Core Concepts

### 1. Server/Client Component Split

The architecture leverages Next.js 15's Server Components for data fetching and Client Components for interactivity:

```
┌─────────────────────────────────────────────────────────┐
│                    page.tsx (Server)                     │
│  - Parallel data fetching                               │
│  - Category detection                                   │
│  - SEO metadata generation                              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 HeroWrapper (Client)                     │
│  - Enrollment logic                                     │
│  - User interactions                                    │
│  - Toast notifications                                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│            Category-Specific Hero (Client)               │
│  - ProgrammingHero | AIMLHero | DesignHero | Default    │
│  - Unique visuals per category                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Category Layout Variants

Each category maps to a specific layout configuration:

| Variant | Categories | Hero Style | Accent Color |
|---------|-----------|------------|--------------|
| `programming` | Web Dev, Mobile, JavaScript, Python | Code-focused | Blue/Cyan |
| `ai-ml` | AI, Machine Learning, Deep Learning, NLP | Data-driven | Purple/Pink |
| `data-science` | Data Analysis, Statistics, Analytics | Data-driven | Green/Teal |
| `design` | UI/UX, Graphic Design, Figma | Visual-rich | Pink/Rose |
| `business` | Management, Finance, Leadership | Standard | Indigo/Blue |
| `marketing` | Digital Marketing, SEO, Social Media | Visual-rich | Orange/Red |
| `default` | All others | Standard | Slate/Gray |

---

## Category-Specific Hero System

### How It Works

```typescript
// 1. Server Component detects category
const categoryLayout = getCategoryLayout(course.category?.name);
// Returns: { variant: 'programming', heroStyle: 'code-focused', ... }

// 2. HeroWrapper receives the variant
<HeroWrapper
  variant={categoryLayout.variant}  // 'programming'
  course={course}
  isEnrolled={!!enrollment}
  categorySpecificProps={{ techStack: ['React', 'TypeScript'] }}
/>

// 3. HeroWrapper renders the appropriate hero
switch (variant) {
  case 'programming':
    return <ProgrammingHero {...props} techStack={techStack} />;
  case 'ai-ml':
    return <AIMLHero {...props} models={models} />;
  case 'design':
    return <DesignHero {...props} tools={tools} />;
  default:
    return <DefaultHero {...props} />;
}
```

### Visual Differences by Category

#### Programming Hero (`programming-hero.tsx`)
```
┌────────────────────────────────────────────────────────────┐
│ Background: Blue-900 → Indigo-900 gradient                 │
│ Pattern: Horizontal code lines                             │
│ Badges: Tech Stack (React, TypeScript, Node.js)            │
│ Stats: Projects | Labs | Challenges                        │
│ Icons: Code2, Terminal, Braces, GitBranch                  │
└────────────────────────────────────────────────────────────┘
```

#### AI/ML Hero (`ai-ml-hero.tsx`)
```
┌────────────────────────────────────────────────────────────┐
│ Background: Purple-900 → Pink-900 gradient                 │
│ Pattern: SVG Neural network nodes & connections            │
│ Badges: ML Models (CNN, RNN, Transformers, BERT)           │
│ Stats: Models | Datasets | Projects                        │
│ Icons: Brain, Cpu, Network, Sparkles                       │
└────────────────────────────────────────────────────────────┘
```

#### Design Hero (`design-hero.tsx`)
```
┌────────────────────────────────────────────────────────────┐
│ Background: Pink-900 → Purple-900 gradient                 │
│ Pattern: Radial dot grid                                   │
│ Badges: Design Tools (Figma, Adobe XD, Sketch)             │
│ Stats: Projects | Templates | Resources                    │
│ Icons: Palette, Layers, Pen, Sparkles                      │
└────────────────────────────────────────────────────────────┘
```

---

## Configuration System

### Category Layouts (`_config/category-layouts.ts`)

```typescript
// Type definitions
export type CategoryLayoutVariant =
  | 'programming'
  | 'ai-ml'
  | 'design'
  | 'business'
  | 'data-science'
  | 'marketing'
  | 'default';

export type CategoryLayoutConfig = {
  variant: CategoryLayoutVariant;
  heroStyle: 'code-focused' | 'visual-rich' | 'data-driven' | 'standard';
  showLiveDemo?: boolean;
  showCodePreview?: boolean;
  showProjectGallery?: boolean;
  showCaseStudies?: boolean;
  customSections?: string[];
  tabOrder?: string[];
  accentColor: string;
  iconStyle: 'technical' | 'creative' | 'professional';
};

// Pattern matching for category detection
const CATEGORY_PATTERNS: Record<string, CategoryLayoutVariant> = {
  'programming': 'programming',
  'web development': 'programming',
  'javascript': 'programming',
  'python': 'programming',
  'react': 'programming',
  // ... 30+ patterns
};

// Layout configurations
export const CATEGORY_LAYOUTS: Record<CategoryLayoutVariant, CategoryLayoutConfig> = {
  programming: {
    variant: 'programming',
    heroStyle: 'code-focused',
    showLiveDemo: true,
    showCodePreview: true,
    tabOrder: ['overview', 'curriculum', 'projects', 'code-playground', 'reviews'],
    accentColor: 'from-blue-600 to-cyan-600',
    iconStyle: 'technical',
    customSections: ['tech-stack', 'code-examples', 'prerequisites'],
  },
  // ... other variants
};
```

### Usage

```typescript
import { getCategoryLayout } from './_config/category-layouts';

// Automatic detection
const layout = getCategoryLayout('Web Development');
// Returns: programming config

const layout = getCategoryLayout('Machine Learning');
// Returns: ai-ml config

const layout = getCategoryLayout('Unknown Category');
// Returns: default config
```

---

## Component Architecture

### Main Page Component (`page.tsx`)

```typescript
const CourseIdPage = async ({ params }) => {
  const courseId = params.courseId;

  // 1. Parallel data fetching for performance
  const [course, user] = await Promise.all([
    getCourseData(courseId),
    currentUser(),
  ]);

  // 2. Check enrollment status
  const enrollment = await getEnrollmentStatus(user?.id, courseId);

  // 3. Get category-specific configuration
  const categoryLayout = getCategoryLayout(course.category?.name);

  // 4. Generate SEO structured data
  const jsonLd = generateCourseJsonLd(course);

  // 5. Prepare category-specific props
  const getCategorySpecificProps = () => {
    switch (categoryLayout.variant) {
      case 'programming':
        return { techStack: ['React', 'TypeScript', 'Node.js'] };
      case 'ai-ml':
        return { models: ['CNN', 'RNN', 'Transformers'] };
      case 'design':
        return { tools: ['Figma', 'Adobe XD', 'Sketch'] };
      default:
        return {};
    }
  };

  return (
    <div>
      {/* JSON-LD for SEO */}
      <script type="application/ld+json" ... />

      {/* Sticky header for desktop */}
      <StickyMiniHeader course={course} isEnrolled={!!enrollment} />

      {/* Category-specific hero */}
      <HeroWrapper
        variant={categoryLayout.variant}
        course={course}
        isEnrolled={!!enrollment}
        categorySpecificProps={getCategorySpecificProps()}
      />

      {/* Mobile bottom bar */}
      <MobileEnrollBar course={course} isEnrolled={!!enrollment} />

      {/* Tabbed content with lazy loading */}
      <Suspense fallback={<Skeleton />}>
        <CoursePageTabs ... />
      </Suspense>
    </div>
  );
};
```

### Hero Wrapper (`hero-wrapper.tsx`)

The HeroWrapper is a Client Component that:
1. Handles enrollment logic (free vs paid courses)
2. Manages Stripe checkout for paid courses
3. Shows toast notifications
4. Renders the appropriate hero based on variant

```typescript
export function HeroWrapper({ variant, course, isEnrolled, userId }) {
  const handleEnroll = async () => {
    const isFree = course.price === 0 || course.isFree;

    if (isFree) {
      // Direct enrollment via API
      await fetch(`/api/courses/${course.id}/enroll`, { method: 'POST' });
      router.push(`/courses/${course.id}/learn`);
    } else {
      // Redirect to Stripe checkout
      const { url } = await fetch(`/api/courses/${course.id}/checkout`);
      window.location.href = url;
    }
  };

  // Render category-specific hero
  switch (variant) {
    case 'programming':
      return <ProgrammingHero onEnroll={handleEnroll} ... />;
    // ... other cases
  }
}
```

---

## Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                              │
│                    /courses/[courseId]                            │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      page.tsx (Server)                            │
│                                                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ getCourseData() │  │  currentUser()  │  │ getEnrollment() │   │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘   │
│           │                    │                    │             │
│           └────────────────────┼────────────────────┘             │
│                                │                                  │
│                    Promise.all() - Parallel                       │
│                                │                                  │
│                                ▼                                  │
│                    getCategoryLayout()                            │
│                                │                                  │
│                                ▼                                  │
│                    Generate JSON-LD                               │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    RENDER COMPONENTS                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              StickyMiniHeader (Client)                       │ │
│  │  - Scroll detection                                          │ │
│  │  - Shows after 140px scroll                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              HeroWrapper (Client)                            │ │
│  │  ┌─────────────────────────────────────────────────────────┐│ │
│  │  │ variant='programming' → ProgrammingHero                 ││ │
│  │  │ variant='ai-ml'       → AIMLHero                        ││ │
│  │  │ variant='design'      → DesignHero                      ││ │
│  │  │ variant='default'     → DefaultHero                     ││ │
│  │  └─────────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              MobileEnrollBar (Client)                        │ │
│  │  - Fixed bottom on mobile                                    │ │
│  │  - Hidden when enrolled                                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              CoursePageTabs (Client + Lazy)                  │ │
│  │  - Dynamic imports for each tab content                      │ │
│  │  - Suspense boundaries                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Adding New Categories

### Step 1: Add Category Pattern

In `_config/category-layouts.ts`:

```typescript
const CATEGORY_PATTERNS: Record<string, CategoryLayoutVariant> = {
  // ... existing patterns

  // Add new category patterns
  'cybersecurity': 'security',
  'ethical hacking': 'security',
  'penetration testing': 'security',
};
```

### Step 2: Add Layout Configuration

```typescript
export const CATEGORY_LAYOUTS: Record<CategoryLayoutVariant, CategoryLayoutConfig> = {
  // ... existing layouts

  security: {
    variant: 'security',
    heroStyle: 'code-focused',
    showLiveDemo: true,
    tabOrder: ['overview', 'curriculum', 'labs', 'certifications', 'reviews'],
    accentColor: 'from-red-600 to-orange-600',
    iconStyle: 'technical',
    customSections: ['security-tools', 'lab-environments', 'certifications'],
  },
};
```

### Step 3: Create Hero Component

Create `_components/category-heroes/security-hero.tsx`:

```typescript
import { Shield, Lock, Terminal, AlertTriangle } from 'lucide-react';

export function SecurityHero({ course, tools = [], isEnrolled, onEnroll }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-red-900 via-orange-900 to-amber-900">
      {/* Matrix-style background pattern */}
      <div className="absolute inset-0 opacity-10">
        {/* Add security-themed pattern */}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-24">
        {/* Content similar to other heroes */}
        {/* Use Shield, Lock icons */}
        {/* Show security tools badges */}
        {/* Stats: Labs | Challenges | Certifications */}
      </div>
    </div>
  );
}
```

### Step 4: Register in Index

In `_components/category-heroes/index.tsx`:

```typescript
import { SecurityHero } from './security-hero';

export { SecurityHero };
```

### Step 5: Add to HeroWrapper

In `_components/hero-wrapper.tsx`:

```typescript
import { SecurityHero } from './category-heroes/security-hero';

switch (variant) {
  // ... existing cases
  case 'security':
    return (
      <SecurityHero
        {...commonProps}
        tools={categorySpecificProps.tools}
      />
    );
}
```

### Step 6: Add Category Props in Page

In `page.tsx`:

```typescript
const getCategorySpecificProps = () => {
  switch (categoryLayout.variant) {
    // ... existing cases
    case 'security':
      return { tools: ['Burp Suite', 'Metasploit', 'Wireshark', 'Nmap'] };
  }
};
```

---

## Performance Optimizations

### 1. Parallel Data Fetching

```typescript
// ✅ Good - Parallel
const [course, user] = await Promise.all([
  getCourseData(courseId),
  currentUser(),
]);

// ❌ Bad - Sequential (slower)
const course = await getCourseData(courseId);
const user = await currentUser();
```

### 2. Dynamic Imports with Lazy Loading

```typescript
// Heavy components are lazy-loaded
const CourseReviews = dynamic(
  () => import('./course-reviews').then(m => m.CourseReviews),
  { loading: () => <SkeletonList />, ssr: false }
);
```

### 3. Suspense Boundaries

```typescript
<Suspense fallback={<div className="h-96 animate-pulse" />}>
  <CoursePageTabs ... />
</Suspense>
```

### 4. Image Optimization

```typescript
// HTTPS enforcement for Next.js Image
const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://');

<Image
  src={secureImageUrl}
  alt={course.title}
  fill
  className="object-cover"
/>
```

---

## SEO Implementation

### JSON-LD Structured Data

```typescript
// Generated in page.tsx
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": course.title,
  "description": course.description,
  "provider": {
    "@type": "Organization",
    "name": "Taxomind",
    "sameAs": "https://taxomind.com"
  },
  "coursePrerequisites": course.prerequisites,
  "educationalLevel": course.difficulty,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": averageRating,
    "reviewCount": totalReviews
  }
};
```

### Dynamic Metadata

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  return generateCourseMetadata(params.courseId);
}

// Returns:
{
  title: `${course.title} | Taxomind`,
  description: course.description,
  openGraph: {
    title: course.title,
    description: course.description,
    images: [course.imageUrl],
  },
  twitter: {
    card: 'summary_large_image',
    title: course.title,
  }
}
```

---

## Best Practices

### 1. Type Safety

Always use proper TypeScript interfaces:

```typescript
interface CourseWithDetails extends Course {
  category?: Category | null;
  user?: User | null;
  chapters?: Chapter[];
  _count?: { Enrollment: number };
}
```

### 2. Error Handling

```typescript
try {
  const response = await fetch(`/api/courses/${course.id}/enroll`);
  if (!response.ok) throw new Error('Enrollment failed');
} catch (error) {
  toast.error('An error occurred. Please try again.');
  console.error('[ENROLL_ERROR]', error);
}
```

### 3. Accessibility

- All images have alt text
- Interactive elements are keyboard accessible
- Color contrast meets WCAG standards
- Reduced motion support for animations

### 4. Mobile-First

- Mobile enroll bar for touch devices
- Responsive breakpoints (xs, sm, md, lg, xl)
- Touch-friendly tap targets

---

## Conclusion

This architecture provides:

1. **Scalability**: Easy to add new categories without modifying core logic
2. **Maintainability**: Clear separation of concerns
3. **Performance**: Optimized data fetching and lazy loading
4. **User Experience**: Tailored visuals for each course type
5. **SEO**: Comprehensive structured data and metadata

The category-aware hero system is a unique differentiator that creates a personalized experience for learners based on the type of course they're viewing.

---

*Last Updated: December 2024*
*Architecture Version: 2.0*
