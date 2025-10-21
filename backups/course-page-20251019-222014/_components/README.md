# Course Feature Components

This directory contains modular components for the course feature page, breaking down the previously monolithic `course-feature.tsx` into smaller, reusable components.

## Component Structure

### Main Components

- **`CourseLayout`** - Main layout component that orchestrates all other components
- **`CourseHeroSection`** - Large hero image with course info overlay (title, category, stats)
- **`CourseDescription`** - Expandable course description section with HTML parsing
- **`CourseLearningObjectives`** - What you'll learn section with expandable objectives
- **`CourseInfoCard`** - Sticky sidebar containing enrollment button and course features

### Sub-Components

- **`CourseEnrollButton`** - Handles enrollment and checkout functionality
- **`CourseFeaturesList`** - Displays list of course features (lifetime access, etc.)

### Utilities

- **`utils/html-utils.ts`** - HTML content processing utilities
  - `cleanHtmlContent()` - Strips HTML tags and formats text
  - `parseHtmlContent()` - Parses HTML with proper entity handling

## Usage

### Basic Usage
```tsx
import { CourseLayout } from './_components';

<CourseLayout 
  course={course}
  userId={userId}
  isEnrolled={isEnrolled}
/>
```

### Individual Component Usage
```tsx
import { 
  CourseHeroSection,
  CourseDescription,
  CourseLearningObjectives,
  CourseInfoCard 
} from './_components';

// Use individual components for custom layouts
<CourseHeroSection course={course} />
<CourseDescription course={course} />
<CourseLearningObjectives course={course} />
<CourseInfoCard 
  course={course}
  userId={userId}
  isEnrolled={isEnrolled}
/>
```

## Component Props

### CourseLayout Props
```tsx
interface CourseLayoutProps {
  course: Course & { 
    category?: { name: string } | null;
    reviews?: Array<{
      id: string;
      rating: number;
      createdAt: Date;
    }>;
    chapters?: Chapter[];
    _count?: {
      enrollments: number;
    };
    whatYouWillLearn?: string[];
  };
  userId?: string;
  isEnrolled?: boolean;
}
```

### CourseEnrollButton Props
```tsx
interface CourseEnrollButtonProps {
  course: Course;
  userId?: string;
  isEnrolled?: boolean;
}
```

### CourseFeaturesList Props
```tsx
interface CourseFeaturesListProps {
  features?: string[];
}
```

## Features

- **Modular Architecture**: Each component has a single responsibility
- **Reusable Components**: Components can be used independently
- **Type Safety**: Full TypeScript support with proper interfaces
- **Animation Support**: Framer Motion animations preserved
- **HTML Processing**: Proper HTML content cleaning and parsing
- **Responsive Design**: Mobile-first responsive design
- **Accessibility**: Proper semantic HTML and ARIA support

## File Structure

```
_components/
├── README.md                     # This documentation
├── index.ts                      # Export barrel file
├── course-layout.tsx             # Main layout component
├── course-hero-section.tsx       # Hero section with course info
├── course-description.tsx        # Expandable description
├── course-learning-objectives.tsx # Learning objectives section
├── course-info-card.tsx          # Sticky sidebar card
├── course-enroll-button.tsx      # Enrollment/checkout button
└── course-features-list.tsx      # Course features list

utils/
└── html-utils.ts                 # HTML processing utilities
```

## Benefits of Modularization

1. **Maintainability**: Easier to maintain and debug individual components
2. **Reusability**: Components can be reused across different pages
3. **Testing**: Easier to write unit tests for individual components
4. **Code Organization**: Better separation of concerns
5. **Performance**: Potential for better code splitting and lazy loading
6. **Developer Experience**: Easier to understand and modify specific functionality

## Migration from Monolithic Component

The original `course-feature.tsx` (539 lines) has been broken down into:
- Main layout: 47 lines
- Hero section: 120 lines  
- Description: 85 lines
- Learning objectives: 130 lines
- Info card: 55 lines
- Enroll button: 105 lines
- Features list: 25 lines
- Utils: 35 lines

Total: ~600 lines across 8 files (better organized and maintainable) 