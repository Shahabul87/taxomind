# Dashboard Layout Integration Guide

This guide shows how to add the SmartHeader and SmartSidebar to any page in the application.

## Quick Integration

### Method 1: Using DashboardLayoutWrapper (Recommended)

For any client component page:

```tsx
'use client';

import { DashboardLayoutWrapper } from '@/components/dashboard/dashboard-layout-wrapper';
import { useSession } from 'next-auth/react';

export default function YourPage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayoutWrapper user={session.user}>
      {/* Your page content here */}
      <div className="container mx-auto px-4 py-6">
        <h1>Your Page Title</h1>
        {/* Rest of your content */}
      </div>
    </DashboardLayoutWrapper>
  );
}
```

### Method 2: Manual Integration

For more control:

```tsx
'use client';

import { SmartHeader } from '@/components/dashboard/smart-header';
import { SmartSidebar } from '@/components/dashboard/smart-sidebar';
import { useSession } from 'next-auth/react';

export default function YourPage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <SmartHeader user={session.user} />
      <SmartSidebar user={session.user} />
      <div className="ml-[72px] min-h-screen pt-16">
        {/* Your content here */}
        <div className="container mx-auto px-4 py-6">
          <h1>Your Page Title</h1>
        </div>
      </div>
    </>
  );
}
```

## Pages Already Integrated

✅ **Dashboard** - `/app/dashboard/page.tsx`
✅ **Profile** - `/app/profile/page.tsx`

## Pages That Need Integration

### High Priority (Main Navigation)
- [ ] `/app/analytics/page.tsx` - Analytics page
- [ ] `/app/calendar/page.tsx` - Calendar page
- [ ] `/app/ai-tutor/page.tsx` - AI Tutor page
- [ ] `/app/messages/page.tsx` - Messages page
- [ ] `/app/groups/page.tsx` - Study Groups browse
- [ ] `/app/groups/my-groups/page.tsx` - My Groups
- [ ] `/app/groups/create/page.tsx` - Create Group
- [ ] `/app/support/page.tsx` - Help & Support

### Medium Priority (Submenu Items)
- [ ] `/app/my-courses/page.tsx` - My Courses
- [ ] `/app/(protected)/teacher/courses/page.tsx` - Teacher Courses
- [ ] `/app/(protected)/teacher/create/page.tsx` - Create Course
- [ ] `/app/(protected)/teacher/posts/all-posts/page.tsx` - My Posts
- [ ] `/app/blog/page.tsx` - Browse Posts (complex, see notes)

### Low Priority (Optional)
- [ ] Certificate pages
- [ ] Favorites page
- [ ] Settings pages
- [ ] Resources page

## Special Cases

### Blog Page
The blog page (`/app/blog/page.tsx`) uses a complex server-rendered structure with the `ModernBlogPage` component. For this page:

**Option A: Wrap the entire page** (Simpler)
Edit `/app/blog/components/modern-blog-page.tsx`:
```tsx
'use client';

import { useSession } from 'next-auth/react';
import { DashboardLayoutWrapper } from '@/components/dashboard/dashboard-layout-wrapper';

export function ModernBlogPage({ featuredPosts, initialPosts, categories, trendingPosts }: Props) {
  const { data: session } = useSession();

  // All existing code...

  return (
    <DashboardLayoutWrapper user={session?.user}>
      {/* All existing JSX */}
    </DashboardLayoutWrapper>
  );
}
```

**Option B: Keep blog separate** (Current approach)
The blog might be a public-facing page that doesn't need dashboard UI. Consider if you want logged-in users to see the sidebar when browsing blog posts.

### Course Pages
Course learning pages (`/app/(course)/courses/[courseId]/...`) typically use full-screen layouts. These might NOT need the sidebar as they have their own navigation.

## Integration Checklist

When adding to a new page:

1. **Import the wrapper or components**
   ```tsx
   import { DashboardLayoutWrapper } from '@/components/dashboard/dashboard-layout-wrapper';
   ```

2. **Get user session**
   ```tsx
   const { data: session } = useSession();
   ```

3. **Add authentication check**
   ```tsx
   if (!session?.user) {
     return <div>Loading...</div>; // or redirect
   }
   ```

4. **Wrap content with layout**
   ```tsx
   <DashboardLayoutWrapper user={session.user}>
     {/* Your content */}
   </DashboardLayoutWrapper>
   ```

5. **Adjust content spacing**
   - The wrapper adds `ml-[72px]` and `pt-16` automatically
   - Your content should start with normal container/padding

6. **Test the page**
   - Sidebar expands on hover
   - Header shows user menu
   - Navigation works
   - Active link highlights correctly

## CSS Considerations

### Spacing
The DashboardLayoutWrapper automatically adds:
- `ml-[72px]` - Left margin for sidebar
- `pt-16` - Top padding for header
- `min-h-screen` - Full height
- Background gradient

### Override if needed
```tsx
<DashboardLayoutWrapper user={session.user}>
  <div className="!pt-0"> {/* Remove top padding */}
    {/* Full-height content */}
  </div>
</DashboardLayoutWrapper>
```

## Common Issues

### Issue: Content hidden behind sidebar
**Solution**: DashboardLayoutWrapper adds `ml-[72px]` automatically. If you see overlap, check for conflicting margins.

### Issue: Header not visible
**Solution**: Ensure no z-index conflicts. Header uses `z-50`, sidebar uses `z-40`.

### Issue: User object missing properties
**Solution**: Type the user properly:
```tsx
import type { User as NextAuthUser } from "next-auth";

const user: NextAuthUser & { role?: string; isTeacher?: boolean } = session.user;
```

### Issue: Page flashes before redirecting
**Solution**: Add loading state:
```tsx
if (status === 'loading') {
  return <LoadingSpinner />;
}
```

## Server vs Client Components

### Server Components
If your page is a server component, you need to:
1. Convert it to client component (`'use client'`)
2. Or create a client wrapper component that uses the layout

Example:
```tsx
// page.tsx (server component)
import { ClientPageWrapper } from './client-wrapper';

export default async function Page() {
  const data = await fetchData();
  return <ClientPageWrapper data={data} />;
}

// client-wrapper.tsx (client component)
'use client';
import { DashboardLayoutWrapper } from '@/components/dashboard/dashboard-layout-wrapper';
import { useSession } from 'next-auth/react';

export function ClientPageWrapper({ data }) {
  const { data: session } = useSession();
  return (
    <DashboardLayoutWrapper user={session?.user}>
      {/* Render with data */}
    </DashboardLayoutWrapper>
  );
}
```

## Testing Integration

After integrating a page:

1. **Navigate to the page** - Check sidebar and header appear
2. **Hover sidebar** - Should expand smoothly
3. **Click navigation** - Should highlight active link
4. **Check responsive** - Test on different screen sizes
5. **Test theme toggle** - Dark/light mode should work
6. **Test user menu** - Profile dropdown should function

## Quick Command to Add Layout

```bash
# 1. Check if page is client or server component
head -1 app/your-page/page.tsx

# 2. If not client component, add at top:
echo "'use client';" | cat - app/your-page/page.tsx > temp && mv temp app/your-page/page.tsx

# 3. Add imports
# 4. Wrap content with DashboardLayoutWrapper
# 5. Test!
```

## Need Help?

If you encounter issues integrating the dashboard layout:
1. Check this guide for common solutions
2. Review the Profile page integration as a reference
3. Ensure NextAuth session is properly configured
4. Verify user object has required properties (role, isTeacher, isAffiliate)

---

**Last Updated**: October 2024
**Component Locations**:
- Header: `/components/dashboard/smart-header.tsx`
- Sidebar: `/components/dashboard/smart-sidebar.tsx`
- Wrapper: `/components/dashboard/dashboard-layout-wrapper.tsx`
