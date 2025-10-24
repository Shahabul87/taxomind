# Responsive Header Architecture

## Overview

This document describes the unified responsive header system for Taxomind. The system provides optimized header experiences across all device sizes using a single, centralized component.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          layout.tsx                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          ResponsiveHeaderWrapper (Single Source)           │ │
│  │                                                            │ │
│  │  Uses useBreakpoint() hook to detect screen width         │ │
│  └─────────────────┬──────────────────────────────────────────┘ │
│                    │                                            │
└────────────────────┼────────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │  Conditional Render   │
         └───────────┬───────────┘
                     │
      ┌──────────────┼──────────────────────────────┐
      │              │              │                │
      ▼              ▼              ▼                ▼
┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐   ┌──────────┐
│ Mobile  │   │ Mobile   │   │ Tablet  │   │ Laptop   │   │ Desktop  │
│  Mini   │   │Landscape │   │ Header  │   │ Header   │   │  Header  │
│ Header  │   │ Header   │   │         │   │          │   │(Main)    │
└─────────┘   └──────────┘   └─────────┘   └──────────┘   └──────────┘
  <480px      480-767px      768-1023px    1024-1279px      ≥1280px
```

## Breakpoint Strategy

### Aligned with Tailwind CSS

| Device Type            | Width Range     | Tailwind | Component             | Height | Key Features |
|------------------------|-----------------|----------|-----------------------|--------|--------------|
| Mobile (All)           | 320px - 767px   | default  | MobileMiniHeader      | 52px   | Slide-out menu, unified mobile UX |
| Tablet                 | 768px - 1023px  | md:      | TabletHeader          | 64px   | Visible nav + mega menus |
| Laptop                 | 1024px - 1279px | lg:      | LaptopHeader          | 64px   | Compact full nav |
| Desktop                | 1280px+         | xl:      | MainHeader            | 64px   | Full experience |

**Simplified Strategy:** Single mobile header for all mobile devices (portrait and landscape)

## Component Hierarchy

### Core Files

```
app/(homepage)/
├── _components/
│   ├── responsive-header-wrapper.tsx    ← SINGLE SOURCE OF TRUTH
│   ├── mobile-mini-header.tsx           ← < 768px (all mobile)
│   ├── tablet-header.tsx                ← 768-1023px
│   ├── laptop-header.tsx                ← 1024-1279px
│   ├── notifications-popover.tsx        ← Shared component
│   ├── messages-popover.tsx             ← Shared component
│   └── user-menu.tsx                    ← Shared component
├── hooks/
│   └── useBreakpoint.ts                 ← Breakpoint detection hook
├── main-header.tsx                      ← Desktop header (≥ 1280px)
└── user-header.tsx                      ← Wrapper (uses ResponsiveHeaderWrapper)
```

### Archived/Deprecated Files

```
backups/legacy-headers/
├── responsive-header.tsx                ← OLD: Only handled 2 breakpoints
└── mobile-landscape-header.tsx          ← REMOVED: Simplified to use MobileMiniHeader for all mobile
```

## Component Details

### 1. ResponsiveHeaderWrapper

**Location:** `app/(homepage)/_components/responsive-header-wrapper.tsx`

**Purpose:** Central routing component that detects screen size and renders the appropriate header.

**Key Features:**
- Uses `useBreakpoint()` hook for real-time breakpoint detection
- No layout shift between breakpoints (fixed heights)
- Consistent user prop interface
- Client-side only (`'use client'`)

**Usage:**
```tsx
import { ResponsiveHeaderWrapper } from './(homepage)/_components/responsive-header-wrapper';

<ResponsiveHeaderWrapper user={currentUser} />
```

### 2. useBreakpoint Hook

**Location:** `app/(homepage)/hooks/useBreakpoint.ts`

**Purpose:** Detects current screen width and returns breakpoint identifier.

**Return Type:**
```typescript
type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop';
```

**Features:**
- Debounced resize detection (150ms)
- Prevents unnecessary re-renders
- SSR-safe initialization

### 3. Individual Header Components

#### MobileMiniHeader (< 768px)
- **Height:** 52px
- **Design:** Unified mobile experience for all mobile devices
- **Navigation:** Full slide-out menu
- **Touch Targets:** Minimum 44×44px
- **Features:** Search, notifications (if authenticated), menu toggle
- **Supports:** Portrait phones, landscape phones, small tablets

#### TabletHeader (768-1023px)
- **Height:** 64px
- **Design:** Balanced tablet experience
- **Navigation:** Visible nav links + mega menus
- **Features:** Full navigation with AI Features mega menu

#### LaptopHeader (1024-1279px)
- **Height:** 64px
- **Design:** Compact to prevent wrapping
- **Navigation:** Full inline navigation
- **Features:** All nav items with `whitespace-nowrap`

#### MainHeader (≥ 1280px)
- **Height:** 64px
- **Design:** Full desktop experience
- **Navigation:** Rich mega menus with hover
- **Features:** Maximum spacing, largest fonts, advanced interactions

## Implementation Guidelines

### Adding a New Header

1. Create component in `app/(homepage)/_components/`
2. Follow naming convention: `{device}-header.tsx`
3. Accept standard user prop interface
4. Set fixed height for consistency
5. Import in `responsive-header-wrapper.tsx`
6. Add conditional rendering logic
7. Update `useBreakpoint` if new breakpoint needed

### Modifying Breakpoints

1. Update `useBreakpoint.ts` breakpoint ranges
2. Update type definition if adding new breakpoint
3. Update `ResponsiveHeaderWrapper` conditional logic
4. Update this documentation
5. Test all transitions

### Shared Components

The following components are shared across multiple headers:

- **NotificationsPopover** - Notification dropdown
- **MessagesPopover** - Messages dropdown  
- **UserMenu** - User profile menu
- **ThemeToggle** - Dark/light mode toggle
- **AIFeaturesMegaMenu** - AI features dropdown (desktop)
- **AIFeaturesMobileSheet** - AI features sheet (mobile)

Import from `app/(homepage)/_components/` or `@/components/ui/`

## Design Principles

### 1. Mobile-First Approach
Start with smallest screen (mobileMini), progressively enhance for larger screens.

### 2. Performance Optimization
- Debounced resize events (150ms)
- Minimal re-renders
- Lazy-loaded components where appropriate
- GPU-accelerated animations

### 3. Consistency
- Same user data across all breakpoints
- Consistent authentication state
- Unified navigation structure
- Cohesive visual design language

### 4. Accessibility (WCAG 2.1 AA)
- Minimum 44×44px touch targets
- Keyboard navigation support
- Screen reader optimization
- Skip navigation links
- ARIA labels and roles

### 5. No Layout Shift
- Fixed header heights within breakpoints
- Consistent spacing
- Smooth transitions
- No visual jumping

## Testing Strategy

### Manual Testing Checklist

Test at the following specific widths:

#### Mobile (< 768px)
- [ ] 320px (iPhone SE portrait)
- [ ] 375px (iPhone 12/13/14 portrait)
- [ ] 414px (iPhone 12 Pro Max portrait)
- [ ] 480px (iPhone landscape)
- [ ] 600px (mid-range)
- [ ] 767px (upper boundary)

#### Tablet (768-1023px)
- [ ] 768px (iPad portrait)
- [ ] 834px (iPad Air portrait)
- [ ] 1023px (upper boundary)

#### Laptop (1024-1279px)
- [ ] 1024px (iPad landscape, small laptop)
- [ ] 1200px (mid-size laptop)
- [ ] 1279px (upper boundary)

#### Desktop (≥ 1280px)
- [ ] 1280px (HD laptop)
- [ ] 1440px (MacBook Pro)
- [ ] 1920px (Full HD desktop)
- [ ] 2560px (2K/4K displays)

### Automated Testing (Future)

```typescript
// Example test structure
describe('ResponsiveHeaderWrapper', () => {
  it('renders MobileMiniHeader for width < 480px', () => {
    // Test implementation
  });
  
  it('renders MobileLandscapeHeader for 480px-767px', () => {
    // Test implementation
  });
  
  // ... etc
});
```

## Migration Notes

### From Old System

**Before:**
```tsx
// Old incomplete system (archived)
import { ResponsiveHeader } from './_components/responsive-header';
<ResponsiveHeader user={user} /> // Only handled 2 breakpoints
```

**After:**
```tsx
// New unified system
import { ResponsiveHeaderWrapper } from './_components/responsive-header-wrapper';
<ResponsiveHeaderWrapper user={user} /> // Handles all 5 breakpoints
```

### Changes Made

1. ✅ Archived `responsive-header.tsx` (incomplete implementation)
2. ✅ Updated `user-header.tsx` to use `ResponsiveHeaderWrapper`
3. ✅ Removed mobile menu code from `MainHeader` (lines 476-835)
4. ✅ Cleaned up unused state and imports in `MainHeader`
5. ✅ Added comprehensive documentation to `ResponsiveHeaderWrapper`
6. ✅ Verified all 5 headers are properly integrated

## Troubleshooting

### Header Not Switching at Breakpoint

1. Check browser DevTools for actual window width
2. Verify `useBreakpoint` hook is detecting correctly
3. Check for CSS that might be forcing specific display
4. Clear browser cache and hard refresh

### Layout Shift on Resize

1. Verify all headers have fixed heights within their range
2. Check for dynamic content that changes height
3. Ensure consistent padding/margin across headers
4. Review animation timings

### Mobile Menu Not Working

1. For < 1280px screens, ensure correct header component is rendering
2. Check z-index values (menu should be z-50+)
3. Verify scroll lock is working (body overflow: hidden)
4. Test touch targets are minimum 44×44px

### Performance Issues

1. Check resize event debounce (should be 150ms)
2. Verify no unnecessary re-renders with React DevTools
3. Check for expensive operations in useEffect hooks
4. Consider memoization for heavy computations

## Future Enhancements

### Optional: 2xl Breakpoint (1536px+)

If you need specialized 4K display optimization:

1. Update `useBreakpoint.ts`:
```typescript
export type Breakpoint = 'mobileMini' | 'mobileLandscape' | 'tablet' | 'laptop' | 'desktop' | 'desktopLarge';

// In checkBreakpoint():
if (width >= 1536) {
  setBreakpoint('desktopLarge');
} else if (width >= 1280) {
  setBreakpoint('desktop');
}
```

2. Create `desktop-large-header.tsx`
3. Update `ResponsiveHeaderWrapper` conditional rendering
4. Test on 2K/4K displays

### Server-Side Rendering (SSR)

Current implementation is client-side only. For SSR:

1. Detect viewport via User-Agent
2. Render appropriate header server-side
3. Hydrate with client-side detection
4. Handle mismatch gracefully

### Progressive Web App (PWA)

1. Add install prompt to header
2. Optimize for standalone display mode
3. Handle safe area insets (iOS notch)
4. Support app-like navigation

## Support

For issues or questions:

1. Check this documentation first
2. Review component JSDoc comments
3. Test in browser DevTools device mode
4. Check git history for recent changes

---

**Last Updated:** October 23, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

