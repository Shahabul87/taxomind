# Category-Specific Course Page System

## 🎯 Overview

This system provides **dynamic, category-specific layouts** for course pages. Different course categories (Programming, AI/ML, Design, Business, etc.) automatically render with unique hero sections, visual styles, and custom features.

## 🏗️ Architecture

### 1. Configuration Layer (`category-layouts.ts`)

Defines layout variants and maps category names to specific configurations:

```typescript
export type CategoryLayoutVariant =
  | 'programming'
  | 'ai-ml'
  | 'design'
  | 'business'
  | 'data-science'
  | 'marketing'
  | 'default';
```

**Key Functions:**
- `getCategoryLayout(categoryName)` - Returns layout config for a category
- `getCategoryAccentGradient(categoryName)` - Returns category-specific colors
- `getCategorySections(categoryName)` - Returns custom sections for tabs

### 2. Category Hero Components (`_components/category-heroes/`)

Specialized hero sections for each category:

#### **Programming Hero**
- **Visual**: Code editor mockup with syntax highlighting
- **Features**: Tech stack badges, code preview, live demo support
- **Stats**: Projects, Labs, Challenges
- **Accent**: Blue-Cyan gradient

#### **AI/ML Hero**
- **Visual**: Neural network diagram with animated layers
- **Features**: ML models/algorithms display, datasets showcase
- **Stats**: Models, Datasets, Projects
- **Accent**: Purple-Pink gradient

#### **Design Hero**
- **Visual**: Design canvas with color palettes, typography, layouts
- **Features**: Design tools showcase, project gallery
- **Stats**: Projects, Templates, Resources
- **Accent**: Pink-Rose gradient

#### **Default Hero**
- **Visual**: Standard hero with course image
- **Features**: Basic course information, universal layout
- **Stats**: Modules, Lessons, Resources
- **Accent**: Slate-Gray gradient

## 📋 Usage

### Automatic Category Detection

The system automatically detects the category and applies the appropriate layout:

```tsx
import { CategoryHero } from './_components/category-heroes';

<CategoryHero
  course={course}
  categoryName={course.category?.name}
/>
```

### Manual Variant Selection

You can also use specific heroes directly:

```tsx
import { ProgrammingHero, AIMLHero, DesignHero } from './_components/category-heroes';

<ProgrammingHero course={course} techStack={['React', 'TypeScript']} />
<AIMLHero course={course} models={['CNN', 'RNN', 'Transformers']} />
<DesignHero course={course} tools={['Figma', 'Adobe XD']} />
```

## 🎨 Adding New Category Variants

### Step 1: Add to Configuration

Update `category-layouts.ts`:

```typescript
// 1. Add variant type
export type CategoryLayoutVariant =
  | 'programming'
  | 'photography' // New variant
  | 'default';

// 2. Add pattern mapping
const CATEGORY_PATTERNS = {
  'photography': 'photography',
  'photo editing': 'photography',
  // ...
};

// 3. Add layout config
export const CATEGORY_LAYOUTS = {
  photography: {
    variant: 'photography',
    heroStyle: 'visual-rich',
    showProjectGallery: true,
    accentColor: 'from-amber-600 to-orange-600',
    iconStyle: 'creative',
    customSections: ['camera-settings', 'portfolio'],
  },
  // ...
};
```

### Step 2: Create Hero Component

Create `photography-hero.tsx`:

```tsx
import { Camera, Aperture } from 'lucide-react';
import Image from 'next/image';

export function PhotographyHero({ course, cameras = [] }) {
  return (
    <div className="bg-gradient-to-br from-amber-900 to-orange-900">
      {/* Your unique hero design */}
    </div>
  );
}
```

### Step 3: Update Index

Add to `category-heroes/index.tsx`:

```tsx
import { PhotographyHero } from './photography-hero';

export function CategoryHero({ course, categoryName }) {
  // ...
  switch (variant) {
    case 'photography':
      return <PhotographyHero course={course} cameras={cameras} />;
    // ...
  }
}

export { PhotographyHero };
```

## 🎯 Category Pattern Matching

The system uses **flexible pattern matching** to detect categories:

```typescript
// Exact match
'Programming' → programming variant

// Partial match
'Web Development' → programming variant (contains 'web development')
'Machine Learning' → ai-ml variant (contains 'machine learning')

// Multiple aliases
'AI', 'Artificial Intelligence', 'Neural Networks' → ai-ml variant

// Fallback
'Unknown Category' → default variant
```

## 🎨 Customization Options

### Layout Configuration Properties

```typescript
interface CategoryLayoutConfig {
  variant: CategoryLayoutVariant;
  heroStyle: 'code-focused' | 'visual-rich' | 'data-driven' | 'standard';

  // Feature flags
  showLiveDemo?: boolean;        // Interactive code/demo
  showCodePreview?: boolean;     // Code snippets
  showProjectGallery?: boolean;  // Visual project showcase
  showCaseStudies?: boolean;     // Business case studies

  // Content
  customSections?: string[];     // Tab sections
  tabOrder?: string[];          // Tab display order

  // Styling
  accentColor: string;          // Gradient classes
  iconStyle: 'technical' | 'creative' | 'professional';
}
```

### Tab Order Customization

Control which tabs appear and their order:

```typescript
programming: {
  tabOrder: ['overview', 'curriculum', 'projects', 'code-playground', 'reviews']
}

design: {
  tabOrder: ['overview', 'curriculum', 'portfolio', 'case-studies', 'reviews']
}
```

## 🔧 Technical Details

### Type Safety

All components use proper TypeScript types:

```typescript
interface BaseCourse {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  subtitle?: string | null;
  difficulty?: string | null;
  category?: { name: string } | null;
}
```

### Performance

- **Zero runtime overhead**: Category detection happens once during render
- **Code splitting**: Each hero component can be lazy-loaded if needed
- **Static extraction**: Category configs can be extracted at build time

### Accessibility

All heroes include:
- Proper heading hierarchy (`h1` for title)
- Alt text for images
- ARIA labels for interactive elements
- Keyboard navigation support

## 📊 Current Category Mappings

| Category | Variant | Hero Style | Accent Colors |
|----------|---------|------------|---------------|
| Programming, Web Dev, Mobile Dev | programming | code-focused | Blue-Cyan |
| AI, Machine Learning, Deep Learning | ai-ml | data-driven | Purple-Pink |
| Data Science, Analytics | data-science | data-driven | Green-Teal |
| Design, UI/UX, Graphic Design | design | visual-rich | Pink-Rose |
| Business, Management, Finance | business | standard | Indigo-Blue |
| Marketing, SEO, Social Media | marketing | visual-rich | Orange-Red |
| Others | default | standard | Slate-Gray |

## 🚀 Future Enhancements

Potential additions:
- [ ] A/B testing for hero variants
- [ ] User preference for hero style
- [ ] Dynamic stats from course metadata
- [ ] Animated transitions between sections
- [ ] Video backgrounds for premium courses
- [ ] Interactive demos in hero section

## 📝 Examples

### Example 1: Programming Course

```tsx
// Category: "Web Development"
// Auto-detected as: programming variant
// Result: Blue-cyan hero with code editor mockup
```

### Example 2: AI Course

```tsx
// Category: "Machine Learning"
// Auto-detected as: ai-ml variant
// Result: Purple-pink hero with neural network visualization
```

### Example 3: Unknown Category

```tsx
// Category: "Cooking"
// Auto-detected as: default variant
// Result: Standard hero with course image
```

## 🔗 Related Files

- `/app/(course)/courses/[courseId]/page.tsx` - Main course page
- `/app/(course)/courses/[courseId]/_config/category-layouts.ts` - Configuration
- `/app/(course)/courses/[courseId]/_components/category-heroes/` - Hero components
- `/app/(course)/courses/[courseId]/_components/course-page-tabs.tsx` - Tabs component

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Maintained By**: Taxomind Team
