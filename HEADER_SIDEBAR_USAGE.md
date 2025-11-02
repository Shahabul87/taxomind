# Header & Sidebar Usage Guide

**Last Updated:** January 2025
**Status:** Active - Required for all new route implementations

---

## 🎯 Overview

The **global header and sidebar have been removed from the root layout** (`app/layout.tsx`) to reduce system overhead and improve performance. Each route group is now responsible for implementing its own header and sidebar as needed.

### Why This Change?

**Before:**
- Header and sidebar rendered on EVERY page (even when not needed)
- Complex conditional logic in root layout
- System overhead from unnecessary user data fetching
- Harder to maintain and debug

**After:**
- Opt-in header/sidebar per route group
- Cleaner root layout (only core providers)
- Better performance (no unnecessary rendering)
- More flexible per-route customization

---

## 📦 Available Components

### 1. Header Components

#### Location: `app/(homepage)/_components/`

**Main Header System:**
```typescript
import { ResponsiveHeaderWrapper } from '@/app/(homepage)/_components/responsive-header-wrapper';
```

**Individual Headers (for custom implementations):**
```typescript
import { MobileMiniHeader } from '@/app/(homepage)/_components/mobile-mini-header';
import { TabletHeader } from '@/app/(homepage)/_components/tablet-header';
import { LaptopHeader } from '@/app/(homepage)/_components/laptop-header';
import { MainHeader } from '@/app/(homepage)/main-header';
```

**Responsive Breakpoints:**
| Device | Width Range | Component | Height |
|--------|-------------|-----------|--------|
| Mobile | 320px - 767px | MobileMiniHeader | 52px |
| Tablet | 768px - 1023px | TabletHeader | 64px |
| Laptop | 1024px - 1279px | LaptopHeader | 64px |
| Desktop | 1280px+ | MainHeader | 64px |

---

### 2. Sidebar Component

#### Location: `components/layout/layout-with-sidebar.tsx`

```typescript
import LayoutWithSidebar from '@/components/layout/layout-with-sidebar';
```

**Features:**
- Responsive sidebar (fixed on desktop, overlay on mobile)
- Auto-hides on specific routes (homepage, blog detail, auth pages)
- User-aware navigation items
- Collapsible menu groups

**Routes Where Sidebar Auto-Hides:**
- `/` (Homepage)
- `/about`, `/features`, `/blog`, `/courses`
- `/post/[postId]` (Blog detail pages)
- `/dashboard/admin` (Has its own sidebar)
- Auth routes (`/auth/*`)

---

## 🚀 Implementation Guide

### Method 1: Using Route Group Layout (Recommended)

Create a `layout.tsx` in your route group to add header/sidebar:

#### Example: Regular Page with Header + Sidebar

```typescript
// app/(dashboard)/layout.tsx
import { Suspense } from 'react';
import { currentUser } from '@/lib/auth';
import { ResponsiveHeaderWrapper } from '@/app/(homepage)/_components/responsive-header-wrapper';
import LayoutWithSidebar from '@/components/layout/layout-with-sidebar';
import { logger } from '@/lib/logger';

// Header Fallback Component
function HeaderFallback() {
  return (
    <header className="w-full bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full relative overflow-hidden">
        <div className="flex justify-between items-center h-14 sm:h-16 relative">
          <div className="flex items-center space-x-2 pl-8 md:pl-0">
            <div className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 bg-purple-400 rounded animate-pulse" />
            <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
              Taxomind
            </span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="w-8 h-8 bg-slate-800/80 rounded-lg animate-pulse"></div>
            <div className="w-8 h-8 bg-slate-800/80 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Async Header Component
async function AsyncHeader() {
  let user;
  try {
    user = await currentUser();
  } catch (error: any) {
    logger.error("Error fetching user:", error);
    user = null;
  }
  return <ResponsiveHeaderWrapper user={user} />;
}

// Async Layout with Sidebar
async function AsyncLayoutWithSidebar({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await currentUser();
  } catch (error: any) {
    logger.error("Error fetching user for sidebar:", error);
    user = null;
  }
  return (
    <LayoutWithSidebar user={user}>
      {children}
    </LayoutWithSidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Header */}
      <Suspense fallback={<HeaderFallback />}>
        <AsyncHeader />
      </Suspense>

      {/* Content with Sidebar */}
      <Suspense fallback={
        <div className="pt-14 xl:pt-16 min-h-screen flex items-center justify-center">
          <div>Loading...</div>
        </div>
      }>
        <AsyncLayoutWithSidebar>
          {children}
        </AsyncLayoutWithSidebar>
      </Suspense>
    </>
  );
}
```

---

#### Example: Header Only (No Sidebar)

```typescript
// app/(marketing)/layout.tsx
import { Suspense } from 'react';
import { currentUser } from '@/lib/auth';
import { ResponsiveHeaderWrapper } from '@/app/(homepage)/_components/responsive-header-wrapper';
import { logger } from '@/lib/logger';

async function AsyncHeader() {
  let user;
  try {
    user = await currentUser();
  } catch (error: any) {
    logger.error("Error fetching user:", error);
    user = null;
  }
  return <ResponsiveHeaderWrapper user={user} />;
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={<div className="h-16 bg-slate-900 animate-pulse" />}>
        <AsyncHeader />
      </Suspense>
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}
```

---

#### Example: No Header or Sidebar (Full Screen)

```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      {children}
    </main>
  );
}
```

---

### Method 2: Per-Page Implementation

For individual pages that need custom header/sidebar:

```typescript
// app/custom-page/page.tsx
import { Suspense } from 'react';
import { currentUser } from '@/lib/auth';
import { ResponsiveHeaderWrapper } from '@/app/(homepage)/_components/responsive-header-wrapper';
import LayoutWithSidebar from '@/components/layout/layout-with-sidebar';

async function AsyncHeader() {
  const user = await currentUser();
  return <ResponsiveHeaderWrapper user={user} />;
}

async function AsyncLayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <LayoutWithSidebar user={user}>
      {children}
    </LayoutWithSidebar>
  );
}

export default async function CustomPage() {
  return (
    <>
      <Suspense fallback={<div>Loading header...</div>}>
        <AsyncHeader />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <AsyncLayoutWithSidebar>
          <div>Your page content here</div>
        </AsyncLayoutWithSidebar>
      </Suspense>
    </>
  );
}
```

---

## 📂 Component Locations Reference

### Header Components
```
app/(homepage)/
├── _components/
│   ├── responsive-header-wrapper.tsx  ← Main unified header system
│   ├── mobile-mini-header.tsx         ← Mobile (< 768px)
│   ├── tablet-header.tsx              ← Tablet (768px - 1023px)
│   └── laptop-header.tsx              ← Laptop (1024px - 1279px)
└── main-header.tsx                    ← Desktop (1280px+)
```

### Sidebar Component
```
components/layout/
└── layout-with-sidebar.tsx            ← Main sidebar wrapper
```

### Supporting Components
```
app/_components/
└── conditional-header-wrapper.tsx     ← Conditional rendering helper

components/layout/
└── LayoutSideBar.tsx                  ← Sidebar UI component
```

---

## 🎨 Styling Considerations

### Header Padding

When adding a header, ensure content has proper top padding:

```typescript
// With fixed header (height: 64px)
<main className="pt-16">  {/* 64px padding */}
  {children}
</main>

// With mobile header (height: 52px) + responsive desktop (64px)
<main className="pt-14 xl:pt-16">
  {children}
</main>
```

### Sidebar Padding

The `LayoutWithSidebar` component handles sidebar spacing automatically:
- Desktop: Left margin for sidebar
- Mobile: Full width with overlay sidebar

---

## ✅ Best Practices

### 1. **Use Suspense for Async Components**
Always wrap async components that fetch user data:
```typescript
<Suspense fallback={<LoadingState />}>
  <AsyncHeader />
</Suspense>
```

### 2. **Error Handling**
Wrap `currentUser()` calls in try-catch:
```typescript
try {
  user = await currentUser();
} catch (error: any) {
  logger.error("Error fetching user:", error);
  user = null;
}
```

### 3. **Route Group Organization**
Organize routes by layout requirements:
- `(dashboard)` → Header + Sidebar
- `(marketing)` → Header only
- `(auth)` → No header/sidebar
- `(reading)` → Custom immersive layout

### 4. **Performance**
Only fetch user data when needed:
- Header needs user for auth state and profile
- Sidebar needs user for navigation items
- If neither is used, skip `currentUser()` call

---

## 🚨 Common Mistakes

### ❌ Don't: Add header/sidebar to root layout
```typescript
// app/layout.tsx - DON'T DO THIS
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <GlobalHeader />  {/* ❌ Wrong - renders everywhere */}
        {children}
      </body>
    </html>
  );
}
```

### ✅ Do: Add to route group layout
```typescript
// app/(dashboard)/layout.tsx - DO THIS
export default function DashboardLayout({ children }) {
  return (
    <>
      <AsyncHeader />
      <AsyncLayoutWithSidebar>
        {children}
      </AsyncLayoutWithSidebar>
    </>
  );
}
```

---

### ❌ Don't: Fetch user data multiple times
```typescript
// ❌ Fetches user twice (inefficient)
async function MyPage() {
  const user1 = await currentUser();  // First call
  const user2 = await currentUser();  // Second call (duplicate)
  // ...
}
```

### ✅ Do: Fetch once and pass down
```typescript
// ✅ Fetches user once
async function AsyncHeader() {
  const user = await currentUser();  // Single fetch
  return <ResponsiveHeaderWrapper user={user} />;
}
```

---

## 📊 Current Implementation Status

### Routes WITH Header + Sidebar
- `/dashboard/*` (User dashboard)
- `/courses/*` (Course pages)
- `/teacher/*` (Teacher pages)
- `/search` (Search page)

### Routes WITH Header ONLY
- `/` (Homepage)
- `/about`, `/features`, `/solutions`
- `/blog` (Blog list page)

### Routes WITHOUT Header/Sidebar
- `/auth/*` (Login, register, etc.)
- `/post/[postId]` (Blog detail - immersive reading)
- `/dashboard/admin/*` (Has custom admin header)

---

## 🔧 Troubleshooting

### Issue: Header not showing
**Solution:** Check if you've added the header to your route group layout.

### Issue: Sidebar overlaps content
**Solution:** Ensure you're using `LayoutWithSidebar` wrapper, not just the sidebar component.

### Issue: User data not loading
**Solution:** Verify `currentUser()` is working and wrapped in try-catch with error logging.

### Issue: Layout shift on page load
**Solution:** Use proper Suspense fallbacks that match the header/sidebar dimensions.

---

## 📚 Additional Resources

- **Header Architecture:** `app/(homepage)/_components/responsive-header-wrapper.tsx` (lines 24-70)
- **Sidebar Logic:** `components/layout/layout-with-sidebar.tsx` (lines 19-50)
- **Root Layout:** `app/layout.tsx` (now simplified)
- **Enterprise Standards:** `/Users/CLAUDE.md` and `CLAUDE.md`

---

## 🎯 Quick Reference

| Need | Import | File Location |
|------|--------|---------------|
| Header | `ResponsiveHeaderWrapper` | `app/(homepage)/_components/responsive-header-wrapper.tsx` |
| Sidebar | `LayoutWithSidebar` | `components/layout/layout-with-sidebar.tsx` |
| User Data | `currentUser()` | `lib/auth.ts` |
| Logger | `logger` | `lib/logger.ts` |

---

## 📝 Migration Checklist

When creating a new route group:

- [ ] Determine if you need header (most routes do)
- [ ] Determine if you need sidebar (dashboard-like pages)
- [ ] Create `layout.tsx` in route group
- [ ] Import necessary components
- [ ] Add async functions for user data fetching
- [ ] Wrap in Suspense with proper fallbacks
- [ ] Add proper top padding for fixed header
- [ ] Test responsive behavior (mobile, tablet, desktop)
- [ ] Verify user authentication state displays correctly

---

**Version:** 1.0
**Maintainer:** Development Team
**Contact:** See CLAUDE.md for coding standards

---

## 🔄 Updates Log

| Date | Change | Author |
|------|--------|--------|
| 2025-01-30 | Initial document - Header/Sidebar removed from root layout | Claude |
