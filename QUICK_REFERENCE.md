# Quick Reference Guide

**Scalable Course Architecture - Cheat Sheet**

---

## 🎯 One-Minute Overview

**What**: Different course categories show different content sections
**How**: Category detection → Section registry → Dynamic rendering
**Result**: Programming courses ≠ Business courses ≠ Design courses

---

## 📁 File Locations

```
app/(course)/courses/[courseId]/

📄 page.tsx                              Main page (uses DynamicSections)
📄 loading.tsx                           Loading skeleton
📄 error.tsx                             Error boundary

📂 _lib/                                 Server utilities
  ├─ data-fetchers.ts                   Database queries
  ├─ category-detector.ts               Category → variant mapping
  └─ metadata-generator.ts              SEO metadata

📂 _config/                              Configuration
  ├─ category-layouts.ts                Layout configs
  ├─ category-registry.ts               Hero component mapping
  ├─ feature-flags.ts                   Feature toggles
  ├─ theme-config.ts                    Visual themes
  └─ seo-config.ts                      SEO templates

📂 _types/                               TypeScript types
  ├─ category.types.ts
  ├─ course.types.ts
  └─ section.types.ts

📂 _components/
  📂 category-heroes/                   Hero variants (4)
    ├─ programming-hero.tsx
    ├─ ai-ml-hero.tsx
    ├─ design-hero.tsx
    └─ default-hero.tsx

  📂 category-sections/                 Section components (17)
    📂 programming/
      ├─ tech-stack-section.tsx
      ├─ code-playground-section.tsx
      ├─ prerequisites-section.tsx
      └─ index.ts

    📂 ai-ml/
      ├─ model-architecture-section.tsx
      ├─ algorithms-section.tsx
      ├─ datasets-section.tsx
      └─ index.ts

    📂 design/
      ├─ portfolio-section.tsx
      ├─ design-tools-section.tsx
      └─ index.ts

    📂 business/
      ├─ case-studies-section.tsx
      ├─ frameworks-section.tsx
      └─ index.ts

    📂 marketing/
      ├─ strategies-section.tsx
      ├─ tools-section.tsx
      └─ index.ts

    📂 data-science/
      ├─ analytics-tools-section.tsx
      ├─ visualization-section.tsx
      └─ index.ts

  📄 section-registry.ts                Section mapping (IMPORTANT!)
  📄 dynamic-sections.tsx               Section orchestrator

📂 _actions/                            Server Actions (3)
  ├─ enroll-action.ts                   Enrollment logic
  ├─ review-action.ts                   Review CRUD
  └─ bookmark-action.ts                 Bookmark toggle
```

---

## 🔄 Request Flow (Simple)

```
User visits course
      ↓
Fetch course from DB
      ↓
Detect category: "Programming" → variant: "programming"
      ↓
Select hero: ProgrammingHero
      ↓
Get section IDs: ['tech-stack', 'code-playground', 'prerequisites']
      ↓
Render sections with course data
      ↓
User sees programming-specific page
```

---

## 📋 Category → Sections Mapping

| Category | Variant | Sections |
|----------|---------|----------|
| **Programming** | `programming` | Tech Stack, Code Playground, Prerequisites |
| **AI/ML** | `ai-ml` | Model Architecture, Algorithms, Datasets |
| **Design** | `design` | Portfolio, Design Tools |
| **Business** | `business` | Case Studies, Frameworks |
| **Marketing** | `marketing` | Strategies, Tools |
| **Data Science** | `data-science` | Analytics Tools, Visualization, Datasets |
| **Unknown** | `default` | No custom sections |

---

## 🛠️ Key Components

### 1. page.tsx
```typescript
const categoryLayout = getCategoryLayout(course.category?.name);
const HeroComponent = getHeroComponent(categoryLayout.variant);

return (
  <>
    <HeroComponent {...props} />
    <DynamicSections course={course} variant={categoryLayout.variant} />
  </>
);
```

### 2. section-registry.ts
```typescript
// Import sections
import { TechStackSection } from './category-sections/programming';

// Register sections
const SECTION_REGISTRY = {
  programming: {
    'tech-stack': TechStackSection,
  },
};

// Define order
export const CATEGORY_SECTION_CONFIG = {
  programming: ['tech-stack', 'code-playground', 'prerequisites'],
};
```

### 3. dynamic-sections.tsx
```typescript
export function DynamicSections({ course, variant }) {
  const sectionIds = getOrderedSectionIds(variant);
  const sections = getCategorySections(variant);

  return (
    <div>
      {sectionIds.map(id => {
        const section = sections.find(s => s.id === id);
        return <section.component course={course} variant={variant} />;
      })}
    </div>
  );
}
```

---

## ➕ Adding New Category (5 Steps)

### Step 1: Create Section Components
```bash
mkdir -p app/(course)/courses/[courseId]/_components/category-sections/YOUR_CATEGORY
```

### Step 2: Write Section Components
```typescript
// YOUR_CATEGORY/your-section.tsx
'use client';
export function YourSection({ course }: BaseSectionProps) {
  return <section>Your content</section>;
}

// YOUR_CATEGORY/index.ts
export { YourSection } from './your-section';
```

### Step 3: Update section-registry.ts
```typescript
// Add import
import { YourSection } from './category-sections/YOUR_CATEGORY';

// Add to registry
const SECTION_REGISTRY = {
  'YOUR_CATEGORY': {
    'your-section': YourSection,
  },
};

// Add to config
export const CATEGORY_SECTION_CONFIG = {
  'YOUR_CATEGORY': ['your-section'],
};
```

### Step 4: Update category-layouts.ts
```typescript
export type CategoryLayoutVariant =
  | 'programming'
  | 'YOUR_CATEGORY'  // ← Add this
  | 'default';
```

### Step 5: Update category-detector.ts
```typescript
const CATEGORY_PATTERNS = {
  'your category name': 'YOUR_CATEGORY',
};
```

**Done!** Build and test.

---

## 🔍 Debugging Checklist

### Sections Not Appearing?
- [ ] Check `<DynamicSections />` in page.tsx
- [ ] Verify section registry imports
- [ ] Check `CATEGORY_SECTION_CONFIG` has section IDs
- [ ] Verify variant matches registry key

### TypeScript Errors?
- [ ] Run `npx tsc --noEmit`
- [ ] Check all imports resolve
- [ ] Verify export names match imports
- [ ] Check index.ts files export correctly

### Build Fails?
- [ ] No dynamic imports: `import(\`../${var}/...\`)`
- [ ] All imports are explicit and static
- [ ] Run `rm -rf .next && npm run build`

### Wrong Section Order?
- [ ] Check `CATEGORY_SECTION_CONFIG` array order
- [ ] Verify `getOrderedSectionIds()` returns correct array

---

## 📊 Server Actions Usage

### Enrollment
```typescript
import { enrollInCourse } from '../_actions/enroll-action';

const result = await enrollInCourse(courseId);
if (result.success) {
  // Enrolled!
}
```

### Review
```typescript
import { createCourseReview } from '../_actions/review-action';

const result = await createCourseReview(courseId, rating, comment);
```

### Bookmark
```typescript
import { toggleCourseBookmark } from '../_actions/bookmark-action';

const result = await toggleCourseBookmark(courseId);
```

---

## 🎨 Section Component Template

```typescript
'use client';

import { Icon } from 'lucide-react';
import type { BaseSectionProps } from '../../../_types/section.types';

export function YourSection({ course, variant }: BaseSectionProps) {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 mb-6">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            Section Title
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Section description
          </p>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Your content here */}
        </div>

      </div>
    </section>
  );
}
```

---

## 📝 Common Commands

```bash
# Development
npm run dev                    # Start dev server

# Build & Check
npm run build                  # Production build
npx tsc --noEmit              # TypeScript check
npm run lint                   # ESLint check

# Database
npm run dev:docker:start       # Start PostgreSQL
npx prisma studio             # View database

# Clean
rm -rf .next                  # Clean build cache
```

---

## 🎯 Type Definitions

```typescript
// Category variant
type CategoryLayoutVariant =
  | 'programming'
  | 'ai-ml'
  | 'design'
  | 'business'
  | 'marketing'
  | 'data-science'
  | 'default';

// Section props
interface BaseSectionProps {
  course: BaseCourse;
  variant: CategoryLayoutVariant;
}

// Programming-specific
interface ProgrammingSectionProps extends BaseSectionProps {
  techStack?: string[];
  prerequisites?: string[];
}

// AI/ML-specific
interface AIMLSectionProps extends BaseSectionProps {
  models?: string[];
  datasets?: string[];
}
```

---

## ⚡ Performance Tips

### Server Components (Default)
- No JavaScript sent to browser
- Faster initial load
- Better SEO

### Client Components (When Needed)
```typescript
'use client'; // Only when you need:
// - useState, useEffect
// - Event handlers
// - Browser APIs
```

### Code Splitting
- Each category only downloads its sections
- Unused categories = not downloaded
- Automatic with Next.js

---

## 🔐 Security Checklist

### Server Actions
- [x] Zod validation on all inputs
- [x] Authentication checks (`currentUser()`)
- [x] Authorization (user owns resource)
- [x] No secrets in client code
- [x] Path revalidation after mutations

### Components
- [x] HTML entities (`&apos;`, `&quot;`)
- [x] No XSS vulnerabilities
- [x] Prisma parameterized queries (no SQL injection)

---

## 📚 Further Reading

- **Full Documentation**: `HOW_IT_WORKS.md`
- **Implementation Report**: `IMPLEMENTATION_REPORT.md`
- **Integration Tests**: `INTEGRATION_TEST_REPORT.md`
- **Architecture Plan**: `SCALABLE_COURSE_ARCHITECTURE_PLAN.md`

---

## 🆘 Need Help?

### Common Issues & Solutions

**Issue**: Sections not rendering
**Fix**: Check `DynamicSections` is in page.tsx

**Issue**: TypeScript errors
**Fix**: Run `npx tsc --noEmit` and fix errors

**Issue**: Build fails
**Fix**: Check for dynamic imports, use explicit imports

**Issue**: Wrong section order
**Fix**: Update `CATEGORY_SECTION_CONFIG` array

---

**Quick Reference Version**: 1.0.0
**Last Updated**: November 4, 2025
