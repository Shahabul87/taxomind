# New Hero Landing Page

**Enterprise-grade marketing landing page** recreating a "Learn by Doing" hero layout with clean, accessible, and responsive implementation.

## 📍 Route
- **URL**: `/new-hero`
- **Location**: `app/(marketing)/new-hero/page.tsx`

## 🎨 Design Features

### Visual Composition
- **Massive headline**: "Learn / by doing" with elegant typography
- **SVG ornaments**: Decorative graphics positioned around headline
  - Horizontal axis lines with tick marks
  - Purple bar chart (left side)
  - Orange scatter burst (upper right)
  - Blue sine wave with point (lower right)
  - Floating white card stack
- **Green CTA button**: "Get started" with subtle hover animations
- **Category ribbon**: Sticky bottom navigation with 5 categories

### Components Structure

```
app/(marketing)/new-hero/
├── page.tsx                    # Main page component
└── README.md                   # This file

components/marketing/
├── Header.tsx                  # Top navigation (logo + sign in)
├── Hero.tsx                    # Main hero section with ornaments
├── CategoryRibbon.tsx          # Bottom category navigation
└── Footer.tsx                  # Footer with legal links

components/graphics/
├── AxisLines.tsx              # Horizontal axis with ticks
├── BarChart.tsx               # Purple bar chart
├── ScatterBurst.tsx           # Orange particle burst
├── SineWave.tsx               # Blue sine wave path
└── FloatingCards.tsx          # White card stack
```

## 🎯 Technology Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** + `tailwind-animate`
- **Framer Motion** (subtle animations)
- **Lucide Icons** (category icons)

## ♿ Accessibility (WCAG 2.2 AA)

### Semantic HTML
- Proper landmarks: `<header>`, `<main>`, `<nav>`, `<footer>`
- ARIA labels on all interactive elements
- Role attributes for clarity

### Keyboard Navigation
- All interactive elements focusable
- Visible focus rings (`ring-2 ring-offset-2`)
- No keyboard traps

### Screen Reader Support
- Decorative SVGs marked `aria-hidden="true"`
- Descriptive `aria-label` attributes
- Semantic heading hierarchy

### Motion Accessibility
- `prefers-reduced-motion` support
- All animations respect user preferences
- No essential information conveyed through motion alone

### Color Contrast
- AA contrast ratios for all text
- Dark mode support with adjusted contrast
- Focus indicators visible in both themes

## 📱 Responsive Design

### Breakpoints
```css
sm   (640px+)  : Stacked layout, simplified ornaments
md   (768px+)  : text-6xl headline, basic ornaments visible
lg   (1024px+) : Full ornaments, text-7xl headline
xl   (1280px+) : text-8xl headline, optimal spacing
2xl  (1536px+) : Maximum scale with clamp
```

### Mobile Optimizations
- Horizontal scroll for category chips with `snap-x`
- Touch-friendly tap targets (min 44x44px)
- Safe area insets for notched devices
- Simplified/hidden ornaments on small screens

### Typography Scaling
```css
/* Responsive headline size */
text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[clamp(4rem,12vw,10rem)]
```

## 🎨 Theming

### CSS Variables (Light Mode)
```css
--primary: 142 76% 46%           /* Green CTA (#22c55e) */
--primary-foreground: 0 0% 100%  /* White text on green */
--background: 220 22% 98%        /* Off-white bg */
--foreground: 222 47% 12%        /* Near-black text */
--border: 214 24% 90%            /* Subtle borders */
```

### CSS Variables (Dark Mode)
```css
--primary: 142 76% 56%           /* Brighter green */
--primary-foreground: 232 46% 6.5% /* Dark text on green */
--background: 232 46% 6.5%       /* Deep slate bg */
--foreground: 220 20% 96%        /* Light text */
--border: 230 18% 20%            /* Muted borders */
```

## 🎬 Animations

### Hero Headline
- Fade in with stagger (0.8s duration)
- Slide up on appearance
- Respects `prefers-reduced-motion`

### SVG Ornaments
```typescript
// AxisLines: Fade + slide from left (0.8s, delay 0.2s)
// BarChart: Bars scale up sequentially (0.6s each)
// ScatterBurst: Particles pop in with stagger (0.5s)
// SineWave: Path draws in (1.5s, delay 0.5s)
// FloatingCards: Fade + rotate (0.6s, staggered)
```

### CTA Button
```typescript
whileHover={{ y: -2, scale: 1.01 }}  // Lift on hover
whileTap={{ scale: 0.98 }}           // Press feedback
```

### Category Chips
- Elevation on hover (`hover:shadow-md`)
- Border color change to primary
- Smooth transitions (150ms)

## 🚀 Performance

### Optimization Strategies
- **SVGs inline**: No external requests, small file size
- **System font stack**: No web font downloads
- **Code splitting**: Framer Motion only loads when needed
- **Image optimization**: Next.js Image component (if used)

### Expected Metrics
```
Lighthouse (Desktop):
- LCP: < 1.0s
- CLS: < 0.02
- INP: < 100ms
- FCP: < 0.8s

Lighthouse (Mobile):
- LCP: < 2.0s
- CLS: < 0.02
- INP: < 150ms
```

## 🧪 Testing Checklist

### Visual Testing
- [ ] Layout matches reference at all breakpoints
- [ ] Ornaments positioned correctly
- [ ] No text overflow or clipping
- [ ] Dark mode renders properly
- [ ] Category ribbon scrolls smoothly on mobile

### Accessibility Testing
```bash
# Axe DevTools scan
- 0 violations in light mode
- 0 violations in dark mode

# Keyboard navigation
- Tab through all interactive elements
- Focus indicators visible
- No focus traps

# Screen reader
- VoiceOver/NVDA announces all content correctly
- Decorative elements skipped
```

### Performance Testing
```bash
# Lighthouse audit
npm run build
npm run start
# Open http://localhost:3000/new-hero
# Run Lighthouse in Chrome DevTools
```

### Browser Compatibility
- [ ] Chrome 120+
- [ ] Safari 17+
- [ ] Firefox 120+
- [ ] Edge 120+
- [ ] iOS Safari 17+
- [ ] Android Chrome 120+

## 📝 Code Quality

### TypeScript
- Strict mode enabled
- No `any` types used
- Proper interface definitions
- Explicit return types on functions

### ESLint
```bash
npx eslint app/\(marketing\)/new-hero/page.tsx components/marketing/*.tsx components/graphics/*.tsx --max-warnings 0
# ✅ All files pass with 0 warnings
```

### File Naming
- No `_enhanced`, `_updated`, `_new` suffixes
- Clean, descriptive names
- Consistent casing (PascalCase for components)

## 🔧 Usage

### Development
```bash
npm run dev
# Open http://localhost:3000/new-hero
```

### Production Build
```bash
npm run build
npm run start
# Open http://localhost:3000/new-hero
```

### Customization

#### Change CTA Color
Edit `app/globals.css`:
```css
:root {
  --primary: 142 76% 46%; /* Change HSL values */
}
```

#### Add New Category
Edit `components/marketing/CategoryRibbon.tsx`:
```typescript
const categories = [
  // ... existing categories
  { id: 'new-cat', label: 'New Category', icon: IconName },
];
```

#### Modify Headline
Edit `components/marketing/Hero.tsx`:
```typescript
<h1>
  <span>Your</span>
  <span>headline</span>
</h1>
```

## 📄 License

Part of Taxomind enterprise LMS platform.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
