# Mobile Horizontal Overflow Error - Analytics Tab

**Date**: January 25, 2026
**Status**: RESOLVED
**Affected Pages**: `/dashboard/user?tab=analytics` (mobile view)

---

## Problem Description

On mobile devices, the Analytics tab content was pushed to the right, causing the left side of the content to be cut off. For example, the title "Learning Analytics" displayed as "rning Analytics" with the first letters invisible.

### Symptoms
- Content shifted horizontally to the right on mobile
- Left portion of the page was cut off/invisible
- Users could not see the full content on mobile devices
- Issue persisted across tab navigation

### Screenshot Reference
- `.playwright-mcp/` folder contains screenshots showing the issue

---

## Root Causes Identified

### 1. Negative Margin in LearningAnalyticsDashboard

**File**: `app/dashboard/user/_components/learning-command-center/analytics/LearningAnalyticsDashboard.tsx`

**Problem**: Line 271 had a `-mx-3` negative margin:
```tsx
<div className="mb-3 sm:mb-4 -mx-3 sm:mx-0 overflow-x-auto">
```

The `-mx-3` was designed to extend the tabs to the edge on mobile, but it pulled the content outside its container boundary, causing overflow issues.

### 2. EdgeSwipeHandler Drag Not Properly Constrained

**File**: `components/mobile/EdgeSwipeHandler.tsx`

**Problems**:
- Framer Motion's `drag="x"` was allowing drags from anywhere on the screen, not just edges
- The `handleDragStart` returning `false` didn't actually cancel the drag
- The x position wasn't resetting properly after tab navigation
- `dragElastic={0.2}` was allowing content displacement beyond constraints

### 3. Missing Mobile Overflow Prevention

**File**: `app/globals.css`

**Problem**: No explicit `overflow-x: hidden` was set for mobile devices at the document level.

---

## Solutions Implemented

### Fix 1: Remove Negative Margin

**File**: `app/dashboard/user/_components/learning-command-center/analytics/LearningAnalyticsDashboard.tsx`

```diff
- <div className="mb-3 sm:mb-4 -mx-3 sm:mx-0 overflow-x-auto">
+ <div className="mb-3 sm:mb-4 overflow-x-auto scrollbar-hide">
```

**Rationale**: The negative margin was unnecessary and causing layout issues. Using `scrollbar-hide` provides a cleaner mobile experience for the tabs.

### Fix 2: Proper Edge Swipe Tracking

**File**: `components/mobile/EdgeSwipeHandler.tsx`

Added state to track if drag started from edge:
```tsx
const [isDragFromEdge, setIsDragFromEdge] = useState(false);
```

Updated `handleDragStart` to properly track edge drags:
```tsx
const handleDragStart = (event, info) => {
  const startX = info.point.x;
  const viewportWidth = window.innerWidth;
  const isLeftEdge = startX < edgeWidth;
  const isRightEdge = startX > viewportWidth - edgeWidth;

  if (isLeftEdge || isRightEdge) {
    setIsDragFromEdge(true);
  } else {
    // Not from edge - don't allow drag
    setIsDragFromEdge(false);
    x.set(0);
    controls.set({ x: 0 });
  }
};
```

Updated `handleDrag` to reset position if not from edge:
```tsx
const handleDrag = (event, info) => {
  if (!isDragFromEdge) {
    x.set(0);
    return;
  }
  // ... rest of handler
};
```

Updated `handleDragEnd` to only process edge-initiated swipes:
```tsx
const handleDragEnd = async (event, info) => {
  // Only process swipe if it started from an edge
  if (isDragFromEdge) {
    // ... swipe processing
  }

  // Reset drag from edge state
  setIsDragFromEdge(false);

  // Always animate back to center
  x.set(0);
  await controls.start({ x: 0, transition: {...} });
};
```

### Fix 3: Position Reset on Tab Change

**File**: `components/mobile/EdgeSwipeHandler.tsx`

Added `children` to useEffect dependency to reset on tab changes:
```tsx
useEffect(() => {
  x.set(0);
  controls.set({ x: 0 });

  const handleVisibilityChange = () => {
    if (!document.hidden) {
      x.set(0);
      controls.set({ x: 0 });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [x, controls, children]); // Added children dependency
```

### Fix 4: Disable Drag Elasticity

**File**: `components/mobile/EdgeSwipeHandler.tsx`

```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  dragElastic={0}        // Changed from 0.2
  dragMomentum={false}   // Added to prevent momentum-based displacement
  // ...
>
```

### Fix 5: Global Mobile Overflow Prevention

**File**: `app/globals.css`

```css
/* Prevent horizontal overflow on mobile devices */
@media (max-width: 1024px) {
  html,
  body {
    overflow-x: hidden;
    max-width: 100vw;
  }
}
```

---

## Files Modified

| File | Change Type | Description |
|------|-------------|-------------|
| `app/dashboard/user/_components/learning-command-center/analytics/LearningAnalyticsDashboard.tsx` | Edit | Removed `-mx-3` negative margin |
| `components/mobile/EdgeSwipeHandler.tsx` | Edit | Complete rewrite of drag handling - removed direct style binding, conditional drag enable |
| `app/globals.css` | Edit | Added mobile overflow prevention |
| `app/dashboard/user/_components/NewDashboard.tsx` | Edit | Added `overflow-x-hidden` to ALL tab containers (8 tabs) |

### Additional Changes (January 25, 2026 - Part 2)

**Problem**: Same horizontal overflow issue persisted on Skills tab and other tabs.

**Root Cause**:
1. Only Analytics tab had `overflow-x-hidden` - other tabs were missing it
2. EdgeSwipeHandler was using `style={{ x }}` which directly bound the motion value, causing persistent offsets
3. `drag="x"` was always enabled, allowing drags from anywhere

**Solution Applied**:

1. **Added `overflow-x-hidden` to all 8 tab containers in NewDashboard.tsx**:
   - `learning` tab (line 344)
   - `analytics` tab (already had it)
   - `goals` tab (line 429)
   - `practice` tab (line 524)
   - `skills` tab (line 610)
   - `gaps` tab (line 719)
   - `innovation` tab (line 753)
   - `create` tab (line 790)

2. **Rewrote EdgeSwipeHandler drag handling**:
   - Removed `useMotionValue` - no longer needed
   - Removed `style={{ x }}` - was causing persistent offsets
   - Changed `drag="x"` to `drag={isDragFromEdge ? 'x' : false}` - only enables drag when starting from edge
   - Added `initial={{ x: 0 }}` - ensures clean initial state
   - Use only `animate={controls}` for position management

---

## Testing Checklist

- [ ] Open `/dashboard/user?tab=analytics` on mobile viewport (Chrome DevTools)
- [ ] Verify "Learning Analytics" title is fully visible
- [ ] Switch between tabs and verify no horizontal offset
- [ ] Test edge swipe from left edge - should open sidebar
- [ ] Test swipe from center - should NOT move content
- [ ] Verify StudyHeatmap scrolls horizontally within its container
- [ ] Test on actual mobile device if possible

---

## Related Components

- `StudyHeatmap.tsx` - Has `min-w-[750px]` which requires horizontal scroll, but is properly contained with `overflow-x-auto`
- `MobileGestureController.tsx` - Parent component that wraps EdgeSwipeHandler
- `DashboardClient.tsx` - Contains `overflow-x-hidden max-w-full` on root container

---

## Prevention Guidelines

1. **Avoid negative margins on mobile** - Use padding adjustments instead
2. **Always constrain drag gestures** - Use state to track valid drag origins
3. **Reset animation state on navigation** - Include relevant deps in useEffect
4. **Set global overflow rules** - Prevent horizontal scroll at document level for mobile
5. **Test on mobile viewport** - Always verify layout changes on mobile before committing

---

## Keywords for Search
`horizontal overflow`, `mobile layout`, `content pushed right`, `EdgeSwipeHandler`, `framer motion drag`, `negative margin`, `-mx-3`, `analytics tab`
