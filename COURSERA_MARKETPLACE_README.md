# Coursera-Style Marketplace Landing Page

A professional, modern, and fully accessible landing page implementation inspired by Coursera's marketplace design pattern.

## 📁 Component Structure

```
components/
├── layout/
│   ├── CoursesNavbar.tsx      # Main navigation bar with search & explore
│   └── SearchBar.tsx           # Reusable search component
├── hero/
│   ├── HeroCard.tsx            # Individual hero card (primary/secondary variants)
│   └── HeroCarousel.tsx        # Carousel wrapper with 2-column layout
└── sections/
    └── QuickActions.tsx        # CTA tiles for quick navigation

app/courses/_components/
├── coursera-style-hero.tsx     # Main hero section wrapper
└── coursera-marketplace-demo.tsx  # Demo page wrapper

app/courses/marketplace/
└── page.tsx                    # Demo route at /courses/marketplace
```

## 🎨 Design Tokens

Added to `app/globals.css`:

```css
/* Light Mode */
--hero-primary: 217 91% 60%;      /* Light blue for primary cards */
--hero-primary-dark: 221 83% 53%; /* Darker blue for hover states */
--hero-secondary: 24 95% 93%;     /* Peach for secondary cards */
--hero-secondary-dark: 24 85% 88%;
--hero-text: 222 47% 11%;
--hero-text-muted: 215 16% 47%;

/* Dark Mode equivalents also included */
```

## 🧩 Components

### 1. CoursesNavbar

**Location:** `components/layout/CoursesNavbar.tsx`

Full-featured navigation bar with:
- Logo (left)
- Explore dropdown with categories (center-left)
- Large search bar (center)
- Log In / Join for Free buttons (right)
- Responsive mobile menu with hamburger toggle

**Usage:**
```tsx
import { CoursesNavbar } from "@/components/layout/CoursesNavbar";

<CoursesNavbar />
```

**Features:**
- ✅ Sticky navigation with subtle scroll shadow
- ✅ Mega dropdown for category exploration
- ✅ Full mobile responsiveness
- ✅ ARIA labels and keyboard navigation
- ✅ Dark mode support

---

### 2. SearchBar

**Location:** `components/layout/SearchBar.tsx`

Clean, rounded search input with icon.

**Props:**
```typescript
interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}
```

**Usage:**
```tsx
import { SearchBar } from "@/components/layout/SearchBar";

<SearchBar
  placeholder="What do you want to learn?"
  onSearch={(query) => console.log(query)}
/>
```

**Features:**
- ✅ Auto-navigation to `/courses?search=...` on submit
- ✅ Custom onSearch callback support
- ✅ Rounded pill design
- ✅ Focus states with ring

---

### 3. HeroCard

**Location:** `components/hero/HeroCard.tsx`

Individual promotional card for the hero carousel.

**Props:**
```typescript
interface HeroCardProps {
  variant: "primary" | "secondary";
  tag?: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  className?: string;
}
```

**Usage:**
```tsx
import { HeroCard } from "@/components/hero/HeroCard";

<HeroCard
  variant="primary"
  tag="From Industry Leaders"
  title="Learn people management skills"
  description="Become a confident and effective leader."
  ctaLabel="Enroll Now"
  ctaHref="/courses/management"
/>
```

**Features:**
- ✅ Two variants: `primary` (blue) and `secondary` (orange/peach)
- ✅ Optional tag/badge
- ✅ Decorative background gradients
- ✅ Hover effects with shadow lift
- ✅ Rounded corners (3xl) for modern look

---

### 4. HeroCarousel

**Location:** `components/hero/HeroCarousel.tsx`

Displays hero cards in a 2-column carousel layout (1 column on mobile).

**Props:**
```typescript
interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlayInterval?: number; // default: 5000ms
  className?: string;
}
```

**Usage:**
```tsx
import { HeroCarousel } from "@/components/hero/HeroCarousel";

const slides = [
  {
    id: "1",
    variant: "primary",
    tag: "New",
    title: "Launch your career",
    description: "Learn from experts",
    ctaLabel: "Get Started",
    ctaHref: "/courses",
  },
  // ... more slides
];

<HeroCarousel slides={slides} autoPlayInterval={6000} />
```

**Features:**
- ✅ Auto-play with configurable interval
- ✅ Manual navigation (arrows + dots)
- ✅ 2-column layout on desktop (shows current + next slide)
- ✅ 1-column on mobile
- ✅ Respects `prefers-reduced-motion`
- ✅ ARIA carousel semantics

---

### 5. QuickActions

**Location:** `components/sections/QuickActions.tsx`

Grid of CTA tiles for common user actions.

**Props:**
```typescript
interface QuickActionsProps {
  className?: string;
}
```

**Usage:**
```tsx
import { QuickActions } from "@/components/sections/QuickActions";

<QuickActions className="mt-12" />
```

**Tiles Included:**
1. **Launch a new career** → `/courses?filter=career`
2. **Gain in-demand skills** → `/courses?filter=popular`
3. **Earn a degree** → `/courses?filter=degree`
4. **Get guidance from AI** → `/courses?filter=ai-guided`

**Features:**
- ✅ Responsive grid (1 col mobile → 4 cols desktop)
- ✅ Hover effects (scale + shadow)
- ✅ Icon + title + arrow pattern
- ✅ Gradient backgrounds for visual depth

---

### 6. CourseraStyleHero

**Location:** `app/courses/_components/coursera-style-hero.tsx`

All-in-one hero section combining navbar + carousel + quick actions.

**Usage:**
```tsx
import { CourseraStyleHero } from "./coursera-style-hero";

<CourseraStyleHero />
```

**What it includes:**
1. `<CoursesNavbar />` (sticky at top)
2. `<HeroCarousel />` with 3 default slides
3. `<QuickActions />` tiles below

---

## 📄 Demo Page

**Route:** `/courses/marketplace`

A complete demo page showing all components in action.

**To view:**
1. Start dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/courses/marketplace`

**File:** `app/courses/marketplace/page.tsx`

## 🎯 Design Principles

### Spacing
- More whitespace than typical Coursera (less cramped)
- Hero: `py-8 md:py-12 lg:py-16`
- Cards: `p-6` to `p-12` (responsive)

### Borders & Shadows
- Radii: `rounded-3xl` for hero cards, `rounded-2xl` for tiles
- Shadow: `shadow-[0_20px_45px_rgba(15,23,42,0.08)]`
- Hover lift: `hover:-translate-y-1`

### Typography
- Hero title: `text-2xl sm:text-3xl lg:text-4xl font-semibold`
- Subtitle: `text-base sm:text-lg`
- CTA tiles: `text-lg font-medium`

### Colors
- Primary CTA: Blue (`bg-blue-600 hover:bg-blue-700`)
- Secondary CTA: Orange (`bg-orange-600`)
- Backgrounds: Gradient from `gray-50` to `white` (light mode)

## ♿ Accessibility

All components follow WCAG 2.1 Level AA standards:

1. **Keyboard Navigation:**
   - All interactive elements are focusable
   - Visible focus rings (`ring-2 ring-blue-500`)

2. **ARIA Labels:**
   - Carousel: `role="region" aria-label="Featured courses"`
   - Buttons: Descriptive `aria-label` attributes
   - Icons: `aria-hidden="true"` for decorative elements

3. **Screen Readers:**
   - Semantic HTML (`<header>`, `<nav>`, `<main>`)
   - Proper heading hierarchy
   - Tab navigation order

4. **Reduced Motion:**
   - Carousel auto-play respects `prefers-reduced-motion`
   - All animations can be disabled

5. **Color Contrast:**
   - Text: 4.5:1 minimum (AA standard)
   - Interactive elements: Clear focus indicators

## 📱 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | 1 column, stacked nav, vertical tiles |
| Tablet | 640px - 1024px | Search full-width, 2 hero cards |
| Desktop | ≥ 1024px | 2-column hero, 4 CTA tiles in row |
| XL | ≥ 1280px | Max container width, optimal spacing |

## 🚀 Integration Guide

### Option 1: Replace Existing Hero

In `app/courses/page.tsx`:

```tsx
import { CourseraStyleHero } from "./_components/coursera-style-hero";

export default function CoursesPage() {
  return (
    <>
      <CourseraStyleHero />
      {/* Your existing course grid below */}
    </>
  );
}
```

### Option 2: Standalone Route

Already set up at `/courses/marketplace` for demo purposes.

### Option 3: Custom Integration

Pick individual components:

```tsx
import { CoursesNavbar } from "@/components/layout/CoursesNavbar";
import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { QuickActions } from "@/components/sections/QuickActions";

export default function CustomPage() {
  return (
    <>
      <CoursesNavbar />
      <div className="pt-20"> {/* Space for fixed navbar */}
        <HeroCarousel slides={mySlides} />
        <QuickActions />
      </div>
    </>
  );
}
```

## 🔧 Customization

### Change Hero Slides

Edit `app/courses/_components/coursera-style-hero.tsx`:

```tsx
const heroSlides = [
  {
    id: "1",
    variant: "primary" as const,
    tag: "Your Tag",
    title: "Your Title",
    description: "Your description",
    ctaLabel: "Your CTA",
    ctaHref: "/your-link",
  },
  // ... more slides
];
```

### Change Quick Action Tiles

Edit `components/sections/QuickActions.tsx`:

```tsx
const actionCards: ActionCard[] = [
  {
    id: "custom",
    title: "Your Action",
    href: "/your-path",
    icon: YourIcon, // from lucide-react
    gradient: "from-blue-500/10 to-cyan-500/10",
  },
];
```

### Change Categories in Navbar

Edit `components/layout/CoursesNavbar.tsx`:

```tsx
const categories: Category[] = [
  { id: "your-id", name: "Your Category", href: "/your-link" },
];
```

## 🎨 Dark Mode

All components support dark mode automatically via Tailwind's `dark:` utilities.

Toggle in your app with:
```tsx
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
setTheme(theme === "dark" ? "light" : "dark");
```

## ✅ Quality Checklist

- ✅ Zero TypeScript errors in new components
- ✅ Fully responsive (mobile → desktop XL)
- ✅ WCAG 2.1 AA compliant
- ✅ Dark mode support
- ✅ Reduced motion support
- ✅ Keyboard navigation
- ✅ Clean, maintainable code
- ✅ Reusable components
- ✅ Proper prop types
- ✅ HTML entity compliance (`&apos;` for apostrophes)

## 🐛 Troubleshooting

### Navbar overlaps content
Add `pt-16 md:pt-20` to your content wrapper:
```tsx
<div className="pt-20">{/* content */}</div>
```

### Carousel not auto-playing
Check if `prefers-reduced-motion` is enabled in OS settings.

### Search not working
Ensure you have a route handler for `/api/courses/search` or use the `onSearch` callback.

## 📚 Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI + shadcn/ui
- **Icons:** lucide-react
- **Animations:** CSS transitions (120-160ms)

---

**Built with enterprise standards and clean architecture principles.**

For questions or improvements, see the main project CLAUDE.md.
