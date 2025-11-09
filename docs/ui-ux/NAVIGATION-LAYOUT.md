# 🎨 Global Navigation Layout - Final Design

## Visual Layout

### For Unauthenticated Users

```
┌────────────────────────────────────────────────────────┐
│ 🏠 Taxomind                     [Sign In]  🌙         │
│ ↑                                   ↑        ↑         │
│ Home/Brand                      Auth      Theme       │
│                                                        │
│                                                        │
│              Homepage Content                          │
│         (No header, just content)                      │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### For Authenticated Users

```
┌────────────────────────────────────────────────────────┐
│ 🏠 Taxomind                               🌙           │
│ ↑                                         ↑            │
│ Home/Brand                              Theme          │
│                                                        │
│                                                        │
│              Page Content                              │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Components Breakdown

### Left Side (Top-Left Corner)

**Component**: Home Button with Brand Name

```tsx
<Link href="/">
  <Home icon /> Taxomind
</Link>
```

**Features**:
- ✅ Home icon (Lucide React)
- ✅ "Taxomind" brand name (visible on desktop, hidden on mobile)
- ✅ Clickable link to homepage (`/`)
- ✅ Semi-transparent background with hover effect

**Responsive**:
- **Desktop**: Shows icon + "Taxomind" text
- **Mobile**: Shows icon only

### Right Side (Top-Right Corner)

**For Unauthenticated Users**:

```tsx
<Link href="/auth/login">
  <LogIn icon /> Sign In
</Link>
<ThemeToggle />
```

**Features**:
- ✅ **Sign In Button**: Purple button linking to `/auth/login`
  - Login icon (Lucide React)
  - "Sign In" text (visible on desktop, hidden on mobile)
  - Purple background (#7c3aed) with hover effect
  - Call-to-action styling

- ✅ **Theme Toggle**: Light/Dark mode switch
  - Sun/Moon icon
  - Animated transition
  - Persists preference

**For Authenticated Users**:

```tsx
<ThemeToggle />
```

**Features**:
- ✅ Only theme toggle visible
- ✅ Sign In button hidden when user is logged in

## Authentication Logic

```tsx
const user = useCurrentUser();

// Unauthenticated users see:
// - Home/Brand (left)
// - Sign In button (right)
// - Theme toggle (right)

// Authenticated users see:
// - Home/Brand (left)
// - Theme toggle (right)
```

## Styling Details

### Brand/Home Button

```css
/* Light Theme */
background: white/70 (semi-transparent)
hover: white/90
border: slate-200
text: slate-700

/* Dark Theme */
background: slate-800/80 (semi-transparent)
hover: slate-700
border: slate-700
text: gray-200
```

### Sign In Button

```css
/* Light Theme */
background: purple-600 (#7c3aed)
hover: purple-700
text: white
border: purple-600

/* Dark Theme */
background: purple-700
hover: purple-600
text: white
border: purple-700
```

### Theme Toggle

```css
/* Inherits from ThemeToggle component */
/* Same styling as before with Sun/Moon icons */
```

## Responsive Behavior

### Desktop (≥640px - `sm:` breakpoint)

```
┌────────────────────────────────────────────┐
│ 🏠 Taxomind          [Sign In]  🌙        │
│  ↓                      ↓        ↓         │
│ Icon + Text          Icon+Text  Icon      │
└────────────────────────────────────────────┘
```

### Mobile (<640px)

```
┌──────────────────────────┐
│ 🏠        [▶]  🌙       │
│  ↓          ↓    ↓      │
│ Icon     Icon  Icon     │
└──────────────────────────┘
```

## Z-Index Hierarchy

1. **Skip Navigation** (accessibility): `z-[9999]`
2. **SAM AI Assistant**: Higher than navigation (exact value depends on SAM component)
3. **Global Navigation**: `z-[100]`
   - Home/Brand button: `z-[100]`
   - Sign In button: `z-[100]`
   - Theme toggle: `z-[100]`
4. **Page Content**: Default stacking

## User Experience Flow

### First-Time Visitor (Unauthenticated)

1. Lands on homepage
2. Sees clean layout with no header
3. Notices **Taxomind** brand in top-left
4. Sees prominent **Sign In** button in top-right
5. Can toggle theme with moon/sun icon
6. Clicks **Sign In** → Redirected to `/auth/login`

### Returning User (Authenticated)

1. Lands on any page
2. Sees **Taxomind** brand in top-left
3. **Sign In button is hidden** (already logged in)
4. Only theme toggle visible in top-right
5. Clean, uncluttered interface

## Accessibility

### WCAG 2.1 AA Compliance

✅ **Keyboard Navigation**:
- Tab order: Home → Sign In (if visible) → Theme Toggle
- Enter/Space to activate links

✅ **Screen Readers**:
- `aria-label="Go to home page"` on Home button
- `aria-label="Sign in to your account"` on Sign In button
- Proper button titles for tooltips

✅ **Color Contrast**:
- Sign In button: Purple (#7c3aed) on white meets WCAG AA
- Text contrast ratios meet minimum 4.5:1

✅ **Focus Indicators**:
- Visible focus rings on all interactive elements
- High contrast focus states

## Implementation Details

### File Location
`/components/global-navigation.tsx`

### Dependencies
```tsx
import { Home, LogIn } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useCurrentUser } from "@/hooks/use-current-user";
```

### Integration
Rendered in `/app/layout.tsx` at line 104, inside `SAMGlobalProvider`

### Authentication Hook
Uses `useCurrentUser()` from NextAuth.js to check authentication state

### Routes
- Home: `/`
- Sign In: `/auth/login`
- Theme: Managed by `ThemeProvider` in `localStorage`

## Testing Checklist

### Unauthenticated State
```bash
# 1. Clear cookies/logout
# 2. Visit homepage
# 3. Verify visible:
✅ Home icon + "Taxomind" text (desktop)
✅ Sign In button (purple, right side)
✅ Theme toggle (right side, next to Sign In)
# 4. Click Sign In
✅ Redirects to /auth/login
```

### Authenticated State
```bash
# 1. Log in as user
# 2. Visit any page
# 3. Verify visible:
✅ Home icon + "Taxomind" text (desktop)
✅ Theme toggle (right side)
# 4. Verify hidden:
✅ Sign In button NOT visible
```

### Responsive Testing
```bash
# Desktop (≥640px):
✅ "Taxomind" text visible
✅ "Sign In" text visible

# Mobile (<640px):
✅ Icons only
✅ Text hidden
✅ Buttons still functional
```

### Theme Testing
```bash
# 1. Toggle theme
✅ All buttons adapt to theme
✅ Sign In button maintains purple color
✅ Home button changes with theme
# 2. Reload page
✅ Theme persists
```

## Customization

### Change Brand Name
Edit line 35-37 in `global-navigation.tsx`:
```tsx
<span className="hidden sm:inline-block font-semibold text-sm">
  Your Brand Name
</span>
```

### Change Sign In Button Color
Edit lines 51-53:
```tsx
// Change purple to blue
"bg-blue-600 hover:bg-blue-700 text-white border border-blue-600",
"dark:bg-blue-700 dark:hover:bg-blue-600 dark:border-blue-700",
```

### Add Sign Up Button
Add after Sign In button:
```tsx
{!user ? (
  <>
    <Link href="/auth/register">Sign Up</Link>
    <Link href="/auth/login">Sign In</Link>
  </>
) : null}
```

### Change Sign In Route
Edit line 46:
```tsx
href="/auth/login"  // Change to your auth route
```

## Future Enhancements

Potential additions:

- [ ] User profile dropdown (for authenticated users)
- [ ] Notification badge
- [ ] Search button
- [ ] Language selector
- [ ] "Sign Out" button for authenticated users
- [ ] Avatar image for authenticated users
- [ ] Dashboard link for authenticated users

---

**Status**: ✅ Complete
**Date**: November 1, 2025
**Design**: Clean, minimal, authentication-aware navigation
