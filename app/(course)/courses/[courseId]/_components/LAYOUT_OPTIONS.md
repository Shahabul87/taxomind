# Course Info Card Layout Options

This document provides a comprehensive comparison of the three alternate layout patterns for the course info card, helping you choose the best option for your needs.

---

## 📋 Quick Comparison Table

| Feature | Current (Overlay) | Docked | Anchored | Hybrid |
|---------|------------------|--------|----------|--------|
| **Complexity** | Medium | Low | Medium-High | High |
| **Visual Impact** | High | Medium | Very High | Very High |
| **Sticky Math** | Medium | Simple | Medium | Complex |
| **Mobile UX** | Good | Good | Good | Excellent |
| **Premium Feel** | High | Medium | Very High | Very High |
| **Performance** | Good | Excellent | Good | Good |
| **Accessibility** | Good | Excellent | Good | Good |
| **Code Maintenance** | Medium | Easy | Medium | Complex |

---

## 🎨 Layout Pattern Details

### 1. **Current Layout (Overlay Pattern)**
**File:** `course-layout.tsx`

#### Behavior:
- Card overlays hero section on desktop (positioned absolutely)
- Switches to sticky positioning after scrolling past hero
- Uses intersection observer to track hero visibility
- Mobile: Card appears in flow below hero

#### Best For:
- ✅ Balanced visual impact and simplicity
- ✅ Standard LMS pattern
- ✅ Teams comfortable with moderate complexity

#### Pros:
- Strong visual hierarchy
- Good balance of features vs complexity
- Well-tested pattern in the industry
- Smooth transitions

#### Cons:
- Requires careful sticky offset calculation
- Intersection observer overhead
- Z-index management needed

---

### 2. **Docked Layout (No Overlay)**
**File:** `course-layout-docked.tsx`

#### Behavior:
- Card placed entirely below hero on ALL breakpoints
- Simple sticky positioning (no overlay transitions)
- Clean visual separation between sections
- Most straightforward implementation

#### Best For:
- ✅ Simplicity-first approach
- ✅ Accessibility-critical applications
- ✅ Teams new to complex layouts
- ✅ Projects with tight deadlines

#### Pros:
- **Simplest implementation** - minimal code, easy to maintain
- **No z-index conflicts** - everything in document flow
- **Best accessibility** - no overlapping elements
- **Predictable behavior** - works the same across all screen sizes
- **Performance** - no intersection observers or complex calculations
- **Easy debugging** - straightforward layout logic

#### Cons:
- Less visual punch compared to overlay patterns
- More scrolling required (especially on mobile)
- Feels less premium than anchored/overlay patterns
- Less differentiation from standard blog/article layouts

#### Code Example:
```tsx
import { CourseLayoutDocked } from &apos;./_components/course-layout-docked&apos;;

export default function CoursePage() {
  return &lt;CourseLayoutDocked course={course} userId={userId} /&gt;;
}
```

---

### 3. **Anchored Layout (Hero Card Pattern)**
**File:** `course-layout-anchored.tsx`

#### Behavior:
- Card positioned absolutely within hero (bottom-right)
- Anchored to hero bottom initially
- Smooth fade transition to sticky card after scrolling past anchor point
- Most &quot;premium LMS&quot; feel

#### Best For:
- ✅ High-end, premium course platforms
- ✅ Enterprise LMS with strong branding
- ✅ When visual impact is priority #1
- ✅ Courses with high production value

#### Pros:
- **Premium visual hierarchy** - card integrated into hero design
- **Strong brand presence** - common in top-tier platforms (Udemy, Coursera style)
- **Smooth transitions** - elegant fade between anchored and sticky states
- **Professional appearance** - polished, high-quality feel
- **Good for hero images** - card overlays hero beautifully

#### Cons:
- More complex positioning logic (absolute → sticky transition)
- Requires careful z-index management
- Need to handle responsive breakpoints carefully
- Slightly higher JavaScript overhead (intersection observers)
- May require additional testing for edge cases

#### Code Example:
```tsx
import { CourseLayoutAnchored } from &apos;./_components/course-layout-anchored&apos;;

export default function CoursePage() {
  return &lt;CourseLayoutAnchored course={course} userId={userId} /&gt;;
}
```

---

### 4. **Hybrid Layout (Best of Both Worlds)**
**File:** `course-layout-hybrid.tsx`

#### Behavior:
- **Desktop (≥1024px):** Anchored card on hero → smooth transition to sticky
- **Tablet (768-1023px):** Card in flow below hero with sticky
- **Mobile (&lt;768px):** Card in flow + mobile enroll bar
- Responsive behavior optimized for each breakpoint

#### Best For:
- ✅ Enterprise applications with diverse user base
- ✅ When optimal UX at every screen size is critical
- ✅ Projects with dedicated design resources
- ✅ High-traffic platforms needing conversion optimization

#### Pros:
- **Best UX at every breakpoint** - tailored experience for each screen size
- **Premium desktop experience** - anchored card for large screens
- **Clean mobile experience** - predictable flow layout
- **Optimized conversions** - card always in ideal position
- **Smooth animations** - Framer Motion integration
- **Respects user preferences** - honors reduced motion settings

#### Cons:
- **Most complex implementation** - multiple transition states
- **Higher maintenance** - more code to maintain and test
- **Requires thorough testing** - need to test all breakpoints carefully
- **Larger bundle size** - includes Framer Motion animations
- **Steeper learning curve** - team needs to understand all patterns

#### Code Example:
```tsx
import { CourseLayoutHybrid } from &apos;./_components/course-layout-hybrid&apos;;

export default function CoursePage() {
  return &lt;CourseLayoutHybrid course={course} userId={userId} /&gt;;
}
```

---

## 🚀 How to Switch Layouts

### Step 1: Choose Your Layout
Based on the comparison above, select the layout that best fits your needs.

### Step 2: Update Your Course Page
**File:** `app/(course)/courses/[courseId]/page.tsx`

```tsx
// Option 1: Current Layout (Overlay)
import { CourseLayout } from &apos;./_components/course-layout&apos;;

// Option 2: Docked Layout (Simplest)
import { CourseLayoutDocked } from &apos;./_components/course-layout-docked&apos;;

// Option 3: Anchored Layout (Premium)
import { CourseLayoutAnchored } from &apos;./_components/course-layout-anchored&apos;;

// Option 4: Hybrid Layout (Best of Both)
import { CourseLayoutHybrid } from &apos;./_components/course-layout-hybrid&apos;;

export default async function CoursePage({ params }: CoursePageProps) {
  // ... your data fetching logic

  return (
    &lt;&gt;
      {/* Replace with your chosen layout */}
      &lt;CourseLayoutDocked
        course={course}
        userId={userId}
        isEnrolled={isEnrolled}
      /&gt;
    &lt;/&gt;
  );
}
```

### Step 3: Test All Breakpoints
```bash
# Start dev server
npm run dev

# Test at these breakpoints:
# - Mobile: 375px, 428px
# - Tablet: 768px, 834px, 1024px
# - Desktop: 1280px, 1440px, 1920px
```

### Step 4: Verify Functionality
- ✅ Card sticks properly after scrolling
- ✅ Mini header doesn&apos;t overlap card
- ✅ Enroll buttons work correctly
- ✅ Animations are smooth (if applicable)
- ✅ Mobile enroll bar appears correctly

---

## 📊 Decision Framework

### Choose **Docked** if:
- 🎯 You value simplicity and maintainability
- 🎯 Your team is small or new to complex layouts
- 🎯 Accessibility is a top priority
- 🎯 You need to ship quickly
- 🎯 Performance is critical

### Choose **Anchored** if:
- 🎯 Visual impact is your #1 priority
- 🎯 You&apos;re building a premium course platform
- 🎯 Your courses have high production value
- 🎯 You want to match top-tier LMS platforms
- 🎯 Your team can handle moderate complexity

### Choose **Hybrid** if:
- 🎯 You want the best experience at every breakpoint
- 🎯 Conversion optimization is critical
- 🎯 You have dedicated design/dev resources
- 🎯 Your platform has diverse user demographics
- 🎯 You&apos;re willing to invest in complexity for UX gains

### Stick with **Current** if:
- 🎯 It&apos;s working well for you
- 🎯 You don&apos;t need additional features
- 🎯 Your team is already familiar with it
- 🎯 You prefer a proven, stable implementation

---

## 🔧 Customization Tips

### Adjusting Sticky Offset
All layouts use CSS custom property `--sticky-offset`:

```tsx
// Modify in layout file
const offset = miniBottom + 16; // Change 16 to your desired px
docEl.style.setProperty(&apos;--sticky-offset&apos;, `${Math.ceil(offset)}px`);
```

### Changing Card Position (Anchored/Hybrid)
```tsx
// Modify bottom position in anchored card
&lt;div className=&quot;absolute bottom-8 right-0&quot;&gt; {/* Change bottom-8 to bottom-12, etc. */}
```

### Adjusting Transition Timing
```tsx
// Docked/Anchored
style={{ top: &apos;var(--sticky-offset, 4rem)&apos;, transition: &apos;top 150ms ease&apos; }}
//                                                              ^^^^^^^ Adjust here

// Hybrid (uses Framer Motion)
transition: {
  duration: 0.4, // Adjust animation duration
  ease: &apos;easeOut&apos;,
}
```

---

## 🐛 Troubleshooting

### Issue: Card overlaps mini header
**Solution:** Increase sticky offset
```tsx
const offset = miniBottom + 24; // Increase from 16 to 24
```

### Issue: Sticky position not working
**Solution:** Check parent container doesn&apos;t have `overflow: hidden`

### Issue: Animations are janky
**Solution:** Enable GPU acceleration
```tsx
className=&quot;... will-change-transform&quot;
```

### Issue: Card doesn&apos;t transition smoothly
**Solution:** Ensure intersection observer threshold is correct
```tsx
{ threshold: 0, rootMargin: &apos;-80px 0px 0px 0px&apos; } // Adjust rootMargin
```

---

## 📚 Additional Resources

- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [CSS Tricks: Sticky Positioning](https://css-tricks.com/position-sticky-2/)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [Next.js Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)

---

## 🎓 Best Practices

1. **Always test on real devices** - Emulators don&apos;t catch all issues
2. **Use Lighthouse** - Check performance impact of chosen layout
3. **A/B test** - If conversion is critical, test layouts with real users
4. **Monitor analytics** - Track scroll depth, card interactions
5. **Respect user preferences** - Honor `prefers-reduced-motion`
6. **Progressive enhancement** - Ensure basic functionality without JS

---

## 📝 Migration Checklist

When switching layouts:

- [ ] Update import in `page.tsx`
- [ ] Test all breakpoints (mobile, tablet, desktop)
- [ ] Verify sticky offset calculation
- [ ] Check z-index stacking
- [ ] Test with/without mini header
- [ ] Verify enroll button functionality
- [ ] Test mobile enroll bar
- [ ] Check accessibility (keyboard navigation, screen readers)
- [ ] Run Lighthouse performance audit
- [ ] Update any custom CSS that targets card
- [ ] Test with real course data (long titles, missing images, etc.)
- [ ] Verify analytics tracking still works

---

**Last Updated:** January 2025
**Tested With:** Next.js 15, React 19, Framer Motion 11
