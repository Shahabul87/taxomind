# Slim Rail Sidebar - Technical Documentation

## Overview

The **Slim Rail Sidebar** is a modern, accessible navigation system that provides:

- **Slim rail (64px) by default** on desktop
- **Expands to compact width (224px)** on pin or hover
- **Submenu fly-outs** that appear on hover/focus
- **Mobile off-canvas** with accordion submenus
- **Full keyboard navigation** & ARIA support
- **Smooth collapse/expand animations**
- **Dark mode** support via CSS tokens
- **SSR-safe** state management

## Architecture

### Component Structure

```
components/layout/
├── LayoutSideBar.tsx          # Main controller component
└── SLIM-RAIL-SIDEBAR-README.md

lib/sidebar/
└── nav-data.ts                 # Navigation tree structure

hooks/
└── useSidebarState.ts          # State management hook

lib/
└── a11y-menu.ts                # Keyboard navigation utilities
```

### File Responsibilities

#### `LayoutSideBar.tsx` (Main Component)
- Renders desktop slim rail or mobile off-canvas sidebar
- Manages flyout state for submenus
- Handles desktop hover behavior
- Implements keyboard navigation
- Responsive breakpoint logic

#### `nav-data.ts` (Navigation Data)
- Defines typed navigation tree (`NavNode[]`)
- Organizes menu items by section (main/secondary/bottom)
- Supports nested children with descriptions
- Role-based filtering
- Active state detection

#### `useSidebarState.ts` (State Hook)
- Manages pin state (localStorage persistence)
- Hover intent delays (100ms enter, 150ms leave)
- Mobile/desktop detection
- SSR-safe initialization
- Width calculations

#### `a11y-menu.ts` (Accessibility)
- Keyboard event handlers
- Focus management utilities
- Arrow key navigation
- Tab focus trapping

## Features

### 1. Desktop Behavior

**Slim Rail (Default)**:
- Width: `64px` (`--sidebar-width-rail`)
- Shows: Icons only
- Hover: Expands after 100ms delay

**Compact Expanded (Pinned/Hovered)**:
- Width: `224px` (`--sidebar-width-compact`)
- Shows: Icons + labels
- Pin button visible
- Smooth 300ms transition

### 2. Submenu Fly-outs

**Trigger**:
- Hover over item with children
- OR keyboard focus + Right arrow

**Positioning**:
- Side: Right of sidebar
- Align: Start (top-aligned with trigger)
- Offset: 8px gap
- Uses Radix Popover for smart positioning

**Content**:
- Menu items with optional descriptions
- Active state highlighting
- Hover effects
- Keyboard navigable

### 3. Mobile Behavior (<1024px)

**Off-Canvas Sheet**:
- Slides in from left
- Full menu expanded
- Accordions for submenu items
- Backdrop overlay
- Swipe/tap to close

**Menu Button**:
- Fixed position: `top-20 left-4`
- Hamburger → X animation
- Z-index: 50

### 4. Keyboard Navigation

**Global**:
- `Escape`: Close flyouts/mobile menu
- `Tab`: Navigate between items

**Menu Items**:
- `Enter` / `Space`: Activate
- `Arrow Up/Down`: Navigate items
- `Arrow Right`: Open flyout
- `Arrow Left`: Close flyout

**Accessibility**:
- `role="navigation"` on sidebar
- `role="menu"` / `role="menuitem"` on flyouts
- `aria-haspopup`, `aria-expanded` on parent items
- `aria-label` on buttons
- Focus rings: 2px solid, `--sidebar-ring`

## CSS Tokens

All colors use CSS custom properties for theming:

### Light Mode
```css
--sidebar-bg: 0 0% 100%                    /* white */
--sidebar-bg-hover: 210 40% 98%            /* soft gray */
--sidebar-border: 214.3 31.8% 91.4%        /* subtle border */
--sidebar-text: 222.2 47.4% 11.2%          /* dark text */
--sidebar-text-muted: 215.4 16.3% 46.9%    /* muted text */
--sidebar-active-bg: 248 95% 97%           /* purple tint */
--sidebar-active-text: 248 70% 50%         /* active purple */
--sidebar-active-indicator: 248 70% 50%    /* 2px left border */
```

### Dark Mode
```css
--sidebar-bg: 233 40% 7%                   /* dark bg */
--sidebar-bg-hover: 232 30% 12%            /* lighter on hover */
--sidebar-border: 230 20% 20%              /* dark border */
--sidebar-text: 210 40% 98%                /* light text */
--sidebar-text-muted: 220 15% 65%          /* muted light */
--sidebar-active-bg: 248 70% 15%           /* purple dark */
--sidebar-active-text: 248 95% 75%         /* purple light */
```

### Flyout Tokens
```css
--flyout-bg: hsl(var(--sidebar-bg))
--flyout-border: hsl(var(--sidebar-border))
--flyout-shadow: 220 13% 91%  (light) / 233 40% 5% (dark)
--flyout-hover-bg: 210 40% 96.1%  (light) / 232 27% 15% (dark)
```

### Animations

**Expand/Collapse**:
```css
--sidebar-transition-duration: 300ms
--sidebar-transition-timing: cubic-bezier(0.4, 0.0, 0.2, 1)
```

**Reduced Motion**:
- Detects `prefers-reduced-motion: reduce`
- Transitions: 100ms (instead of 300ms)
- No animation delays

## Usage

### Basic Integration

```tsx
import { LayoutSideBar } from '@/components/layout/LayoutSideBar';

function MyLayout({ user }) {
  return (
    <div className="flex h-screen">
      <LayoutSideBar user={user} />
      <main className="flex-1 overflow-auto">
        {/* Your content */}
      </main>
    </div>
  );
}
```

### Navigation Data

**Add new menu item**:

```typescript
// lib/sidebar/nav-data.ts

export const NAV_ITEMS: NavNode[] = [
  {
    key: 'new-feature',
    label: 'New Feature',
    icon: YourIcon,  // from lucide-react
    href: '/new-feature',
    section: 'main',  // main | secondary | bottom
  },
  // ... other items
];
```

**Add submenu**:

```typescript
{
  key: 'parent',
  label: 'Parent Menu',
  icon: ParentIcon,
  section: 'main',
  children: [
    {
      key: 'child-1',
      label: 'Child Item',
      href: '/parent/child',
      description: 'Optional description shown in flyout',
    },
  ],
}
```

## Customization

### Change Sidebar Widths

```css
/* In globals.css or your CSS file */
:root {
  --sidebar-width-rail: 64px;      /* Slim rail width */
  --sidebar-width-compact: 224px;  /* Expanded width */
}
```

### Change Animation Duration

```css
:root {
  --sidebar-transition-duration: 400ms;  /* Slower */
}
```

### Change Hover Delays

```typescript
// hooks/useSidebarState.ts

const HOVER_ENTER_DELAY = 150;  // Increase delay before expanding
const HOVER_LEAVE_DELAY = 200;  // Increase delay before collapsing
```

### Mobile Breakpoint

```typescript
// hooks/useSidebarState.ts

const MOBILE_BREAKPOINT = 768;  // Change to md breakpoint
```

## Performance

**Optimizations**:
- ✅ Framer Motion animations with `initial={false}` to prevent mount animations
- ✅ Radix Popover portal rendering (prevents layout shift)
- ✅ AnimatePresence for smooth enter/exit
- ✅ No layout reflows (fixed widths)
- ✅ Hover intent delays prevent accidental triggers
- ✅ SSR-safe with client-only localStorage access
- ✅ Memoized hover handlers

**Metrics** (estimated):
- First render: < 50ms
- Expand/collapse: ~300ms animation
- Flyout open: ~180ms animation
- No jank on mid-tier devices

## Accessibility

**WCAG 2.1 AA Compliant**:
- ✅ Keyboard navigation (arrows, enter, esc, tab)
- ✅ Focus indicators (2px ring, 3:1 contrast)
- ✅ ARIA attributes (labels, roles, states)
- ✅ Screen reader friendly
- ✅ Reduced motion support
- ✅ Color contrast AA (4.5:1 for text)

**Testing**:
```bash
# Run Axe accessibility tests
npm run test:a11y  # (if configured)
```

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Safari iOS 14+
- ✅ Chrome Android

**Required features**:
- CSS custom properties
- CSS Grid/Flexbox
- JavaScript ES2020+

## Migration from Old Sidebar

**Before**:
```tsx
import { HomeSidebar } from '@/components/ui/home-sidebar';
```

**After**:
```tsx
import { LayoutSideBar } from '@/components/layout/LayoutSideBar';
```

**Breaking changes**:
- None! The new sidebar maintains the same menu items
- Width changed from 94px (old) to 64px (new slim rail)
- Layout shifts may need adjustment in consuming components

## Troubleshooting

### Issue: Sidebar not expanding on hover

**Check**:
1. `isPinned` state - pinned sidebar doesn't expand further
2. `isMobile` - hover doesn't work on mobile
3. Hover delays in `useSidebarState`

### Issue: Flyouts not appearing

**Check**:
1. Item has `children` defined in nav-data
2. Radix Popover imported correctly
3. Z-index conflicts
4. Portal rendering issues

### Issue: Mobile menu not closing

**Check**:
1. Backdrop `onClick` handler
2. Navigation `onNavigate` callback
3. Escape key handler

## Future Enhancements

**Potential improvements**:
- [ ] Command-K palette integration
- [ ] Recently used submenu items
- [ ] Badge counts for notifications
- [ ] Drag-to-resize width
- [ ] Custom section separators
- [ ] Search within menu
- [ ] Favorites/pinned items

## License

MIT - Same as project license

## Support

For issues, please file a GitHub issue with:
- Browser/OS
- Screenshot/video
- Console errors
- Steps to reproduce

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Author**: Taxomind Team
