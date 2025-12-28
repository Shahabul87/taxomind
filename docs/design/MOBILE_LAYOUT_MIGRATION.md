# Mobile Layout Migration Guide

## ✅ Completed Pages
1. **Dashboard** (`/dashboard`) - Using MobileGestureController
2. **My Plans** (`/my-plan`) - Using MobileLayout
3. **Profile** (`/profile`) - Using MobileLayout via ProfilePageLayout

## 📋 Migration Templates

### Template 1: Client Component Pages
```typescript
'use client';

import { MobileLayout } from '@/components/layouts/MobileLayout';
import { useSession } from 'next-auth/react';

export default function PageName() {
  const { data: session } = useSession();

  return (
    <MobileLayout
      user={session?.user as any}
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
    >
      {/* Your page content */}
    </MobileLayout>
  );
}
```

### Template 2: Server Component Pages
```typescript
import { PageWithMobileLayout } from '@/components/layouts/PageWithMobileLayout';
import { currentUser } from '@/lib/auth';

export default async function PageName() {
  const user = await currentUser();

  return (
    <PageWithMobileLayout>
      {/* Your page content */}
    </PageWithMobileLayout>
  );
}
```

### Template 3: Pages with Existing Layout
```typescript
// If page has existing layout wrapper like:
// <SomeLayout>
//   <SmartSidebar />
//   <SmartHeader />
//   {children}
// </SomeLayout>

// Replace with:
import { MobileLayout } from '@/components/layouts/MobileLayout';

export function SomeLayout({ children }) {
  return (
    <MobileLayout
      showHeader={true}
      showSidebar={true}
      showBottomBar={true}
      enableGestures={true}
    >
      {children}
    </MobileLayout>
  );
}
```

## 🎯 Pages to Update

### High Priority (Main Navigation)
- [ ] `/messages` - Messages page
- [ ] `/analytics` - Analytics dashboard
- [ ] `/groups` - Study Groups
- [ ] `/my-courses` - My Courses
- [ ] `/certificates` - Certificates
- [ ] `/favorites` - Favorites
- [ ] `/settings` - Settings (may need special handling)
- [ ] `/support` - Help & Support

### Course Related Pages
- [ ] `/teacher/courses` - Teacher courses list
- [ ] `/teacher/create` - Create course
- [ ] `/courses/[courseId]` - Course detail pages

### Blog/Posts Pages
- [ ] `/teacher/posts/all-posts` - All posts
- [ ] `/teacher/posts/create-post` - Create post
- [ ] `/blog` - Blog browse page

### Analytics Pages
- [ ] `/analytics/admin` - Admin analytics
- [ ] `/analytics/teacher` - Teacher analytics
- [ ] `/analytics/user` - User analytics

### Group Pages
- [ ] `/groups/create` - Create group
- [ ] `/groups/[groupId]` - Group detail
- [ ] `/groups/[groupId]/settings` - Group settings
- [ ] `/groups/my-groups` - My groups

## 🔧 Migration Steps

### Step 1: Identify Current Layout Structure
Look for these patterns in the page:
- Direct use of `SmartSidebar` and `SmartHeader`
- Custom layout wrappers
- Hardcoded margins like `ml-[72px]` or `pt-16`

### Step 2: Choose Migration Pattern
- **Has authentication?** → Use Template 1 (Client) or 2 (Server)
- **Has layout wrapper?** → Use Template 3
- **Simple page?** → Wrap with MobileLayout directly

### Step 3: Remove Old Code
Remove:
```typescript
// Remove these imports
import { SmartSidebar } from '@/components/dashboard/smart-sidebar';
import { SmartHeader } from '@/components/dashboard/smart-header';

// Remove these elements
<SmartSidebar user={user} />
<SmartHeader user={user} />

// Remove these classes
className="ml-[72px]"  // Sidebar margin
className="pt-16"       // Header padding
```

### Step 4: Add MobileLayout
```typescript
import { MobileLayout } from '@/components/layouts/MobileLayout';

// Wrap content with MobileLayout
<MobileLayout
  user={user}
  showHeader={true}
  showSidebar={true}
  showBottomBar={true}
  enableGestures={true}
  enablePullToRefresh={false} // Enable for lists/feeds
  contentClassName="" // Add page-specific styles
>
  {/* Your content */}
</MobileLayout>
```

### Step 5: Adjust Content Styles
- Remove fixed margins/paddings that conflict
- Content is automatically padded based on device
- Use `contentClassName` prop for page-specific styles

## 🎨 Mobile Features Available

### Gestures
- **Left edge swipe** → Opens sidebar
- **Scroll down** → Hides header
- **Scroll up** → Shows header
- **Pull to refresh** → Optional refresh (for feeds/lists)

### Navigation
- **Bottom bar** → Quick navigation (mobile only)
- **FAB button** → Quick actions menu
- **Smart header** → Auto-hide on scroll

### Responsive Behavior
- **Mobile** (<768px) → Full mobile experience
- **Tablet** (768-1024px) → Hybrid experience
- **Desktop** (>1024px) → Traditional layout

## ⚠️ Special Considerations

### Settings Page
May need custom handling for settings panels:
```typescript
<MobileLayout
  showBottomBar={false} // Hide for settings
  contentClassName="max-w-4xl mx-auto"
>
```

### Course Learning Pages
May need full-screen mode:
```typescript
<MobileLayout
  showHeader={false} // Hide for immersive learning
  showSidebar={false}
  showBottomBar={false}
>
```

### Modal/Dialog Pages
Keep modals outside MobileLayout:
```typescript
<>
  <MobileLayout>
    {/* Page content */}
  </MobileLayout>
  {/* Modals outside */}
  <SomeModal />
</>
```

## 🧪 Testing Checklist

After updating each page:
- [ ] Desktop view works correctly
- [ ] Mobile gestures work (edge swipe)
- [ ] Header auto-hides on scroll
- [ ] Bottom navigation appears on mobile
- [ ] Content padding is correct
- [ ] No duplicate sidebars/headers
- [ ] Page-specific features still work

## 📝 Common Issues & Fixes

### Issue: Duplicate headers/sidebars
**Fix**: Remove old SmartSidebar/SmartHeader components

### Issue: Content cut off on mobile
**Fix**: Check contentClassName, remove fixed widths

### Issue: Gestures not working
**Fix**: Ensure enableGestures={true} and page is wrapped properly

### Issue: Bottom bar covering content
**Fix**: MobileLayout automatically adds padding, remove manual padding

## 🚀 Quick Start Command

To quickly update a page:
1. Open the page file
2. Import MobileLayout
3. Wrap content
4. Remove old layout code
5. Test on mobile view

---

Last Updated: November 2024