# Course Info Card - Alternate Layout Implementation Guide

This guide shows how to modify the existing `course-layout.tsx` to achieve different card positioning patterns.

---

## Current Implementation: Overlay Pattern

The current layout overlays the card on the hero, then switches to sticky.

---

## Option 1: Docked Layout (Simplest)

**Benefits:** Clean, simple, no overlay complexity

**Changes needed in `course-layout.tsx`:**

```tsx
// REMOVE the overlay card section (lines 86-98)
// REMOVE the sentinel and isPastHero state tracking (lines 54-69, 97)

// KEEP only the sticky card in the right column
export const CourseLayout = ({ course, userId, isEnrolled = false }) => {
  // Keep sticky offset calculation useEffect

  return (
    <div className="min-h-screen bg-white/10">
      <StickyMiniHeader course={course} isEnrolled={isEnrolled} />

      {/* Hero - no overlay */}
      <CourseHeroSection course={course} />

      {/* Main content */}
      <div id="main-content" className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <CourseDescription course={course} />
            <CourseLearningObjectives course={course} />
          </div>

          {/* Right column - always visible, always sticky */}
          <div className="md:relative">
            <CourseInfoCard
              course={course}
              userId={userId}
              isEnrolled={isEnrolled}
            />
          </div>
        </div>
      </div>

      <MobileEnrollBar course={course} isEnrolled={isEnrolled} />
    </div>
  );
};
```

---

## Option 2: Anchored Layout (Premium Feel)

**Benefits:** Card anchored to hero bottom initially, premium appearance

**Changes needed:**

```tsx
export const CourseLayout = ({ course, userId, isEnrolled = false }) => {
  const [isSticky, setIsSticky] = useState(false);
  const anchorPointRef = useRef<HTMLDivElement>(null);

  // Sticky offset calculation (keep existing)
  useEffect(() => { /* existing code */ }, []);

  // Track anchor point
  useEffect(() => {
    const el = anchorPointRef.current;
    if (!el) return;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        setIsSticky(!e.isIntersecting && e.boundingClientRect.top < 0);
      }
    }, { threshold: 0, rootMargin: '-80px 0px 0px 0px' });

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white/10">
      <StickyMiniHeader course={course} isEnrolled={isEnrolled} />

      {/* Hero with anchored card */}
      <div className="relative">
        <CourseHeroSection course={course} />

        {/* Anchored card - desktop only */}
        <div
          className="hidden md:block absolute bottom-8 right-0 z-30"
          style={{
            opacity: isSticky ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
            pointerEvents: isSticky ? 'none' : 'auto',
          }}
        >
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="flex justify-end">
              <CourseInfoCard
                course={course}
                userId={userId}
                isEnrolled={isEnrolled}
                disableAnalytics
              />
            </div>
          </div>
        </div>

        {/* Anchor point */}
        <div ref={anchorPointRef} className="absolute bottom-0 left-0 right-0 h-1" />
      </div>

      {/* Main content with sticky card */}
      <div id="main-content" className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <CourseDescription course={course} />
            <CourseLearningObjectives course={course} />
          </div>

          <div className="md:relative">
            {/* Show sticky card after passing anchor */}
            <div style={{
              opacity: isSticky ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
              pointerEvents: isSticky ? 'auto' : 'none',
            }}>
              <CourseInfoCard
                course={course}
                userId={userId}
                isEnrolled={isEnrolled}
              />
            </div>
          </div>
        </div>
      </div>

      <MobileEnrollBar course={course} isEnrolled={isEnrolled} />
    </div>
  );
};
```

---

## Option 3: Hybrid Layout (Responsive Optimized)

**Benefits:** Best experience at each breakpoint

**Changes needed:**

```tsx
import { motion, useReducedMotion } from 'framer-motion';

export const CourseLayout = ({ course, userId, isEnrolled = false }) => {
  const prefersReducedMotion = useReducedMotion();
  const [isSticky, setIsSticky] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const anchorPointRef = useRef<HTMLDivElement>(null);

  // Detect screen size
  useEffect(() => {
    const check = () => setIsLargeScreen(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sticky offset (keep existing)
  useEffect(() => { /* existing code */ }, []);

  // Anchor tracking (desktop only)
  useEffect(() => {
    if (!isLargeScreen) {
      setIsSticky(false);
      return;
    }

    const el = anchorPointRef.current;
    if (!el) return;

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        setIsSticky(!e.isIntersecting && e.boundingClientRect.top < 0);
      }
    }, { threshold: 0, rootMargin: '-80px 0px 0px 0px' });

    io.observe(el);
    return () => io.disconnect();
  }, [isLargeScreen]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-white/10">
      <StickyMiniHeader course={course} isEnrolled={isEnrolled} />

      <div className="relative">
        <CourseHeroSection course={course} />

        {/* Desktop: Anchored card */}
        {isLargeScreen && (
          <motion.div
            className="absolute bottom-8 right-0 z-30"
            initial="hidden"
            animate={!isSticky ? 'visible' : 'exit'}
            variants={cardVariants}
          >
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
              <div className="flex justify-end">
                <CourseInfoCard
                  course={course}
                  userId={userId}
                  isEnrolled={isEnrolled}
                  disableAnalytics
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={anchorPointRef} className="absolute bottom-0 left-0 right-0 h-1" />
      </div>

      <div id="main-content" className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <CourseDescription course={course} />
            <CourseLearningObjectives course={course} />
          </div>

          <div className="lg:relative">
            {/* Desktop: sticky after anchor, Tablet/Mobile: always visible */}
            <motion.div
              initial="hidden"
              animate={!isLargeScreen || isSticky ? 'visible' : 'exit'}
              variants={cardVariants}
            >
              <CourseInfoCard
                course={course}
                userId={userId}
                isEnrolled={isEnrolled}
              />
            </motion.div>
          </div>
        </div>
      </div>

      <MobileEnrollBar course={course} isEnrolled={isEnrolled} />
    </div>
  );
};
```

---

## Quick Comparison

| Layout | Code Changes | Complexity | Visual Impact | Best For |
|--------|--------------|------------|---------------|----------|
| **Docked** | Minimal (remove overlay) | Low | Medium | Simple projects, tight deadlines |
| **Anchored** | Moderate (add anchor logic) | Medium | High | Premium LMS, strong branding |
| **Hybrid** | Significant (add responsive logic) | High | Very High | Enterprise, conversion optimization |

---

## Testing Checklist

After implementing any variant:

- [ ] Test at 375px (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1024px (desktop)
- [ ] Test at 1920px (large desktop)
- [ ] Verify sticky offset doesn't overlap mini header
- [ ] Check enroll buttons work correctly
- [ ] Test keyboard navigation
- [ ] Verify mobile enroll bar appears
- [ ] Run `npx tsc --noEmit` (no TypeScript errors)
- [ ] Run `npm run lint` (no ESLint errors)

---

## Performance Tips

1. **Use CSS transforms** instead of changing position for animations
2. **Throttle scroll handlers** if adding custom logic
3. **Use `will-change: transform`** for animated elements
4. **Lazy load images** in the card
5. **Minimize reflows** by batching DOM reads/writes

---

## Common Issues

### Card overlaps header
**Fix:** Increase `--sticky-offset` calculation
```tsx
const offset = miniBottom + 24; // Increase from 16
```

### Transitions are janky
**Fix:** Add GPU acceleration
```tsx
className="... will-change-transform"
```

### Card doesn't stick on Safari
**Fix:** Ensure parent doesn't have `overflow: hidden`

---

## Migration Path

1. **Start with Docked** - Simplest, most stable
2. **Test thoroughly** - Ensure all functionality works
3. **If needed, upgrade to Anchored** - More premium feel
4. **Consider Hybrid last** - Only if responsive optimization critical

---

Last updated: January 2025
