# Global Navigation Component

## Overview

The global navigation component provides a persistent home button and theme toggle that appears on every page of the application.

## Features

- **Home Button**: Quick navigation back to the homepage from any page (top-left corner)
- **Theme Toggle**: Switch between light and dark modes with animated transition (top-right corner)
- **Fixed Positioning**: Always visible at opposite corners (z-index: 100)
- **Responsive Design**: Adapts to mobile and desktop screens
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## Files

### Component
- **Location**: `/components/global-navigation.tsx`
- **Type**: Client Component
- **Dependencies**:
  - `lucide-react` (Home icon)
  - `/components/ui/theme-toggle.tsx`

### Integration
- **Root Layout**: `/app/layout.tsx`
- Rendered inside the `SAMGlobalProvider` before the main content
- Uses the existing `ThemeProvider` from `/components/providers/theme-provider.tsx`

## Usage

The component is automatically rendered in the root layout, so it appears on all pages without any additional setup.

### Styling

```tsx
// Home Button - Top Left
<div className="fixed top-4 left-4 z-[100]">
  {/* Button styles */}
</div>

// Theme Toggle - Top Right
<div className="fixed top-4 right-4 z-[100]">
  {/* Theme toggle */}
</div>

// Button styling
className={[
  "bg-white/70 dark:bg-slate-800/80", // Theme-aware background
  "hover:bg-white/90 dark:hover:bg-slate-700", // Hover states
  "border border-slate-200 dark:border-slate-700", // Borders
].join(" ")}
```

### Z-Index Hierarchy

- Global Navigation (both buttons): `z-[100]`
- SAM AI Assistant: Higher z-index (appears above navigation)
- Skip Navigation Link: `z-[9999]` (highest priority for accessibility)

## Theme Toggle

The theme toggle is provided by `/components/ui/theme-toggle.tsx` and uses:

- **Icons**: Sun (light mode) and Moon (dark mode) from Lucide React
- **Animation**: Framer Motion for smooth icon transitions
- **Storage**: Persists theme preference in `localStorage`
- **SSR-Safe**: Prevents hydration mismatches

## Customization

### Changing Position

Edit `/components/global-navigation.tsx`:

Current layout:
- Home button: `top-4 left-4` (top-left)
- Theme toggle: `top-4 right-4` (top-right)

To change positions:

```tsx
// Move home button to bottom-left
<div className="fixed bottom-4 left-4 z-[100]">

// Move theme toggle to bottom-right
<div className="fixed bottom-4 right-4 z-[100]">

// Both on same side (right)
<div className="fixed top-4 right-4 z-[100] flex gap-2">
  <HomeButton />
  <ThemeToggle />
</div>
```

### Adding More Buttons

Add additional buttons to the navigation:

```tsx
export function GlobalNavigation() {
  return (
    <div className="fixed top-4 right-4 z-[100] flex items-center gap-2">
      <Link href="/">...</Link>

      {/* Add new button here */}
      <Link href="/dashboard">
        <Dashboard className="w-5 h-5" />
      </Link>

      <ThemeToggle />
    </div>
  );
}
```

### Conditional Rendering

To hide on specific pages:

```tsx
"use client";

import { usePathname } from "next/navigation";

export function GlobalNavigation() {
  const pathname = usePathname();

  // Hide on login page
  if (pathname === "/login") return null;

  return (
    <div className="fixed top-4 right-4 z-[100] ...">
      {/* ... */}
    </div>
  );
}
```

## Accessibility

The component follows WCAG 2.1 AA standards:

- ✅ Proper ARIA labels (`aria-label="Go to home page"`)
- ✅ Descriptive titles (`title="Home"`)
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Color contrast ratios met

## Browser Support

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Supports dark mode system preferences
- ✅ Fallback for browsers without CSS backdrop-filter

## Testing

The component can be tested by:

1. Navigating to different pages and verifying the buttons are visible
2. Clicking the home button and confirming navigation to `/`
3. Toggling the theme and checking `localStorage.theme` value
4. Testing keyboard navigation (Tab to focus, Enter to activate)
5. Checking responsive behavior on mobile devices

## Future Enhancements

Potential improvements:

- [ ] Add notification badge on home button
- [ ] Add user profile dropdown
- [ ] Add search button
- [ ] Add language selector
- [ ] Add keyboard shortcut hints (e.g., "Press H for home")
- [ ] Add breadcrumb navigation for nested pages
