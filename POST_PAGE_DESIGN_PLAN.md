# 🎨 Post Page Design Plan
## `/post/[postId]` - Enterprise-Level Reading Experience

### 📋 Table of Contents
1. [Executive Summary](#executive-summary)
2. [Data Model Analysis](#data-model-analysis)
3. [Component Architecture](#component-architecture)
4. [Reading Mode System](#reading-mode-system)
5. [UI/UX Design Specifications](#uiux-design-specifications)
6. [Responsive Design Strategy](#responsive-design-strategy)
7. [Performance Optimization](#performance-optimization)
8. [Accessibility Standards](#accessibility-standards)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

The `/post/[postId]` page will serve as the primary content consumption interface for the Taxomind platform. This enterprise-level design focuses on:

- **Multi-modal Reading Experience**: Adaptive reading modes tailored to different content types and user preferences
- **Progressive Enhancement**: Core content loads immediately with enhanced features loading progressively
- **Universal Accessibility**: WCAG 2.1 AAA compliance with full keyboard navigation and screen reader support
- **Performance First**: Sub-second initial load times with lazy loading for heavy assets
- **Device Agnostic**: Seamless experience from 320px mobile to 4K desktop displays

---

## Data Model Analysis

### Core Post Model Structure

```typescript
interface Post {
  // Core Fields
  id: string
  title: string
  description?: string
  body: string
  imageUrl?: string
  category?: string

  // Metadata
  views: number
  published?: boolean
  isArchived: boolean
  createdAt: DateTime
  updatedAt: DateTime

  // Relations
  userId: string
  authorId?: string
  User: User

  // Content Sections
  PostChapterSection: PostChapterSection[]
  PostImageSection: PostImageSection[]

  // Engagement
  comments: Comment[]
  Tag: Tag[]
}

interface PostChapterSection {
  id: string
  title: string
  description?: string
  content?: string
  imageUrl?: string
  position: number
  isPublished?: boolean
  isFree?: boolean
}
```

### Key Data Relationships
- **Author Information**: Full user profile with avatar, bio, social links
- **Chapter Organization**: Ordered sections with progressive disclosure
- **Comment Thread**: Nested comment system with reactions
- **Tag Taxonomy**: Multi-tag categorization for related content discovery

---

## Component Architecture

### 1. Page Layout Structure

```
PostPage/
├── PostHeader/
│   ├── HeroSection/
│   │   ├── BackgroundImage (parallax)
│   │   ├── TitleOverlay
│   │   ├── MetadataBar
│   │   └── QuickActions
│   ├── AuthorCard/
│   │   ├── AuthorAvatar
│   │   ├── AuthorBio
│   │   ├── FollowButton
│   │   └── SocialLinks
│   └── NavigationBreadcrumb
├── PostContent/
│   ├── ReadingModeSelector
│   ├── ContentRenderer/
│   │   ├── ChapterView
│   │   ├── ScrollView
│   │   ├── FocusView
│   │   ├── MagazineView
│   │   └── TimelineView
│   ├── TableOfContents (sticky)
│   └── ReadingProgress
├── PostEngagement/
│   ├── ReactionBar
│   ├── ShareTools
│   ├── BookmarkAction
│   └── PrintOptions
├── PostComments/
│   ├── CommentForm
│   ├── CommentThread
│   └── CommentPagination
└── PostFooter/
    ├── RelatedPosts
    ├── TagCloud
    └── Newsletter
```

### 2. Component Specifications

#### PostHeader Component
```typescript
interface PostHeaderProps {
  title: string
  subtitle?: string
  coverImage?: string
  author: AuthorInfo
  publishDate: Date
  updateDate?: Date
  readingTime: number
  category?: string
  tags: Tag[]
  viewCount: number
  commentCount: number
}
```

**Features:**
- Adaptive hero height (40vh mobile, 60vh desktop)
- Parallax scrolling effect on cover image
- Glassmorphism overlay for text readability
- Animated entrance with intersection observer
- Sticky metadata bar on scroll

#### ContentRenderer Component
```typescript
interface ContentRendererProps {
  chapters: PostChapterSection[]
  readingMode: ReadingMode
  userPreferences: UserPreferences
  onProgressUpdate: (progress: number) => void
}

type ReadingMode =
  | 'standard'    // Traditional blog layout
  | 'focus'       // Distraction-free
  | 'magazine'    // Multi-column magazine
  | 'timeline'    // Chronological timeline
  | 'presentation' // Slide-based
  | 'immersive'   // Full-screen story
```

---

## Reading Mode System

### 1. Standard Mode
- **Layout**: Single column, optimal line length (65-75 characters)
- **Typography**: System font stack, 18px base, 1.7 line height
- **Features**: Inline images, embedded videos, code highlighting

### 2. Focus Mode
- **Layout**: Centered narrow column (max-width: 680px)
- **Typography**: Serif font option, increased spacing
- **Features**: Hidden sidebars, minimal UI, reading progress only

### 3. Magazine Mode
- **Layout**: Multi-column grid (2-3 columns responsive)
- **Typography**: Justified text, drop caps, pull quotes
- **Features**: Image galleries, infographics, sidebar content

### 4. Timeline Mode
- **Layout**: Vertical timeline with chapter milestones
- **Typography**: Mixed sizes for hierarchy
- **Features**: Progress indicators, chapter previews, quick navigation

### 5. Presentation Mode
- **Layout**: Full-screen slides from chapters
- **Typography**: Large display fonts, minimal text per slide
- **Features**: Keyboard navigation, presenter notes, auto-advance

### 6. Immersive Mode
- **Layout**: Full viewport storytelling
- **Typography**: Dynamic sizing based on content
- **Features**: Scroll-triggered animations, ambient backgrounds

---

## UI/UX Design Specifications

### Color System

```scss
// Light Theme
$background-primary: #FFFFFF;
$background-secondary: #F7F9FC;
$text-primary: #1A1A1A;
$text-secondary: #6B7280;
$accent-primary: #3B82F6;
$accent-secondary: #8B5CF6;

// Dark Theme
$dark-background-primary: #0F0F0F;
$dark-background-secondary: #1A1A1A;
$dark-text-primary: #F3F4F6;
$dark-text-secondary: #9CA3AF;
$dark-accent-primary: #60A5FA;
$dark-accent-secondary: #A78BFA;

// Semantic Colors
$success: #10B981;
$warning: #F59E0B;
$error: #EF4444;
$info: #3B82F6;
```

### Typography Scale

```scss
// Font Families
$font-sans: 'Inter', system-ui, -apple-system, sans-serif;
$font-serif: 'Merriweather', Georgia, serif;
$font-mono: 'JetBrains Mono', 'Courier New', monospace;

// Size Scale (Mobile / Desktop)
$text-xs: 0.75rem / 0.813rem;
$text-sm: 0.875rem / 0.938rem;
$text-base: 1rem / 1.125rem;
$text-lg: 1.125rem / 1.25rem;
$text-xl: 1.25rem / 1.5rem;
$text-2xl: 1.5rem / 1.875rem;
$text-3xl: 1.875rem / 2.25rem;
$text-4xl: 2.25rem / 3rem;
$text-5xl: 3rem / 4rem;
```

### Spacing System

```scss
// Consistent 8px grid
$space-1: 0.25rem;  // 4px
$space-2: 0.5rem;   // 8px
$space-3: 0.75rem;  // 12px
$space-4: 1rem;     // 16px
$space-6: 1.5rem;   // 24px
$space-8: 2rem;     // 32px
$space-10: 2.5rem;  // 40px
$space-12: 3rem;    // 48px
$space-16: 4rem;    // 64px
$space-20: 5rem;    // 80px
```

### Interactive Elements

#### Buttons
```typescript
interface ButtonVariants {
  primary: 'bg-accent-primary hover:scale-105 transition-all'
  secondary: 'border-2 hover:bg-accent-secondary/10'
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800'
  danger: 'bg-red-500 hover:bg-red-600'
}
```

#### Cards
```scss
.content-card {
  @apply bg-white dark:bg-gray-800;
  @apply rounded-xl shadow-sm hover:shadow-md;
  @apply border border-gray-200 dark:border-gray-700;
  @apply transition-all duration-200;
}
```

---

## Responsive Design Strategy

### Breakpoint System

```scss
$breakpoints: (
  'xs': 320px,   // Small phones
  'sm': 640px,   // Large phones
  'md': 768px,   // Tablets
  'lg': 1024px,  // Small laptops
  'xl': 1280px,  // Desktops
  '2xl': 1536px, // Large desktops
  '3xl': 1920px  // 4K displays
);
```

### Layout Adaptations

#### Mobile (320px - 767px)
- Single column layout
- Collapsed navigation to hamburger
- Swipeable chapter navigation
- Bottom sheet for comments
- Thumb-friendly tap targets (min 44px)

#### Tablet (768px - 1023px)
- Optional two-column for magazine mode
- Side drawer for TOC
- Floating action buttons
- Modal-based interactions

#### Desktop (1024px+)
- Multi-column layouts available
- Persistent sidebars
- Hover interactions enabled
- Keyboard shortcuts active
- Picture-in-picture for videos

### Container Strategy

```scss
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;

  @screen sm { max-width: 640px; }
  @screen md { max-width: 768px; }
  @screen lg { max-width: 1024px; }
  @screen xl { max-width: 1280px; }
  @screen 2xl { max-width: 1536px; }
}
```

---

## Performance Optimization

### Loading Strategy

1. **Critical CSS**: Inline above-the-fold styles
2. **Progressive Images**:
   - LQIP (Low Quality Image Placeholder)
   - WebP with JPEG fallback
   - Responsive srcset
3. **Code Splitting**:
   - Route-based chunks
   - Dynamic imports for heavy components
   - Lazy load comments section
4. **Resource Hints**:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="dns-prefetch" href="https://cdn.example.com">
   <link rel="preload" as="image" href="/hero.webp">
   ```

### Performance Metrics Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTI (Time to Interactive)**: < 3.5s
- **FCP (First Contentful Paint)**: < 1.8s

### Optimization Techniques

```typescript
// Image Optimization
const ImageComponent = dynamic(() => import('next/image'), {
  loading: () => <ImageSkeleton />,
  ssr: false
});

// Intersection Observer for lazy loading
const useIntersectionObserver = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Virtual Scrolling for long content
const VirtualizedChapters = ({ chapters, height = 600 }) => {
  return (
    <VirtualList
      height={height}
      itemCount={chapters.length}
      itemSize={200}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ChapterCard chapter={chapters[index]} />
        </div>
      )}
    </VirtualList>
  );
};
```

---

## Accessibility Standards

### WCAG 2.1 AAA Compliance

#### Keyboard Navigation
```typescript
const keyboardShortcuts = {
  'j': 'Next chapter',
  'k': 'Previous chapter',
  '/': 'Search',
  'f': 'Toggle fullscreen',
  'm': 'Change reading mode',
  'n': 'Toggle night mode',
  'b': 'Bookmark',
  's': 'Share',
  '?': 'Show shortcuts'
};
```

#### Screen Reader Support
```html
<!-- Semantic HTML structure -->
<article role="article" aria-label="Blog post">
  <header>
    <h1 id="post-title">{title}</h1>
    <div role="complementary" aria-label="Post metadata">
      <time datetime={date}>{formattedDate}</time>
    </div>
  </header>

  <nav aria-label="Table of contents">
    <ol role="list">
      {chapters.map(chapter => (
        <li role="listitem">
          <a href={`#${chapter.id}`} aria-label={`Jump to ${chapter.title}`}>
            {chapter.title}
          </a>
        </li>
      ))}
    </ol>
  </nav>

  <main id="post-content" aria-label="Post content">
    {content}
  </main>
</article>
```

#### Focus Management
```scss
// Focus indicators
:focus-visible {
  outline: 3px solid $accent-primary;
  outline-offset: 2px;
}

// Skip links
.skip-link {
  @apply sr-only focus:not-sr-only;
  @apply focus:absolute focus:top-4 focus:left-4;
  @apply focus:bg-white focus:p-2 focus:rounded;
}
```

### Accessibility Features

1. **High Contrast Mode**: Automatic detection and adaptation
2. **Font Size Controls**: User-adjustable from 75% to 200%
3. **Reduced Motion**: Respect `prefers-reduced-motion`
4. **Color Blind Modes**: Deuteranopia, Protanopia, Tritanopia filters
5. **Reading Line**: Optional reading guide overlay
6. **Voice Control**: Basic voice command support

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Set up route structure `/post/[postId]`
- [ ] Create base layout components
- [ ] Implement data fetching with proper error handling
- [ ] Basic responsive design
- [ ] Standard reading mode

### Phase 2: Core Features (Week 2)
- [ ] Multiple reading modes (Focus, Magazine)
- [ ] Table of Contents with scroll spy
- [ ] Comment system integration
- [ ] Share functionality
- [ ] Print stylesheet

### Phase 3: Enhanced UX (Week 3)
- [ ] Animation and transitions
- [ ] Progressive image loading
- [ ] Offline support with Service Worker
- [ ] Reading progress persistence
- [ ] Bookmarking system

### Phase 4: Advanced Features (Week 4)
- [ ] Timeline and Presentation modes
- [ ] Voice reading (TTS)
- [ ] Annotation system
- [ ] Export to PDF/EPUB
- [ ] Analytics integration

### Phase 5: Polish & Optimization (Week 5)
- [ ] Performance optimization
- [ ] A/B testing setup
- [ ] SEO enhancements
- [ ] Accessibility audit
- [ ] Cross-browser testing

---

## Technical Implementation Details

### Server Component Structure

```typescript
// app/post/[postId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostData } from '@/actions/posts';
import PostHeader from './_components/post-header';
import PostContent from './_components/post-content';
import PostEngagement from './_components/post-engagement';
import PostComments from './_components/post-comments';
import RelatedPosts from './_components/related-posts';

export async function generateMetadata({
  params
}: {
  params: { postId: string }
}): Promise<Metadata> {
  const post = await getPostData(params.postId);

  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: [post.imageUrl].filter(Boolean),
      type: 'article',
      authors: [post.User.name],
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.imageUrl].filter(Boolean),
    },
    alternates: {
      canonical: `/post/${params.postId}`,
    },
  };
}

export default async function PostPage({
  params
}: {
  params: { postId: string }
}) {
  const post = await getPostData(params.postId);

  if (!post) notFound();

  // Increment view count (non-blocking)
  incrementViewCount(params.postId);

  return (
    <article className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <PostHeader {...post} />
      <PostContent
        chapters={post.PostChapterSection}
        images={post.PostImageSection}
      />
      <PostEngagement postId={params.postId} />
      <PostComments
        postId={params.postId}
        initialComments={post.comments}
      />
      <RelatedPosts
        category={post.category}
        tags={post.Tag}
        currentPostId={params.postId}
      />
    </article>
  );
}
```

### Client Components

```typescript
// _components/post-content.tsx
'use client';

import { useState, useEffect } from 'react';
import { useReadingPreferences } from '@/hooks/use-reading-preferences';
import StandardMode from './reading-modes/standard';
import FocusMode from './reading-modes/focus';
import MagazineMode from './reading-modes/magazine';
import TimelineMode from './reading-modes/timeline';

const readingModes = {
  standard: StandardMode,
  focus: FocusMode,
  magazine: MagazineMode,
  timeline: TimelineMode,
} as const;

export default function PostContent({
  chapters,
  images
}: PostContentProps) {
  const { mode, preferences, updatePreference } = useReadingPreferences();
  const [progress, setProgress] = useState(0);

  const ModeComponent = readingModes[mode] || StandardMode;

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setProgress((scrolled / total) * 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <ReadingProgress progress={progress} />
      <ModeSelector
        currentMode={mode}
        onModeChange={updatePreference('mode')}
      />
      <ModeComponent
        chapters={chapters}
        images={images}
        preferences={preferences}
      />
    </>
  );
}
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Engagement Metrics**
   - Time on page
   - Scroll depth
   - Reading completion rate
   - Mode preference distribution
   - Chapter navigation patterns

2. **Performance Metrics**
   - Page load time by device
   - Time to first interaction
   - API response times
   - Client-side errors

3. **User Behavior**
   - Most read chapters
   - Comment engagement rate
   - Share frequency
   - Bookmark usage

### Implementation

```typescript
// Analytics wrapper
const trackEvent = (event: AnalyticsEvent) => {
  // Google Analytics
  gtag('event', event.action, {
    event_category: event.category,
    event_label: event.label,
    value: event.value,
  });

  // Custom analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(event),
  });
};

// Usage
trackEvent({
  action: 'reading_mode_changed',
  category: 'engagement',
  label: mode,
  value: 1,
});
```

---

## Conclusion

This comprehensive design plan provides a robust foundation for building an enterprise-level post page that prioritizes:

1. **User Experience**: Multiple reading modes catering to different preferences
2. **Performance**: Optimized loading and rendering strategies
3. **Accessibility**: Full compliance with modern standards
4. **Scalability**: Component-based architecture for easy maintenance
5. **Engagement**: Rich interactive features to boost user retention

The modular approach ensures that features can be implemented incrementally while maintaining a cohesive user experience across all devices and platforms.

---

### Next Steps

1. Review and approve the design plan
2. Set up the development environment
3. Begin Phase 1 implementation
4. Establish testing protocols
5. Create documentation for components

**Estimated Timeline**: 5-6 weeks for full implementation
**Team Requirements**: 2-3 developers, 1 designer, 1 QA engineer

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Status: Ready for Review*