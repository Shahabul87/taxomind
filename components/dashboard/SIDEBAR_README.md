# Smart Dashboard Sidebar

A modern, professional, collapsible sidebar that automatically expands on mouse hover and collapses when the mouse leaves.

## Features

### 🎯 Core Features
- **Auto-expand/collapse**: Hover to expand (256px), leave to collapse (72px)
- **Role-based navigation**: Shows different menu items based on user role
- **Active link highlighting**: Smooth gradient indicator for current page
- **Smooth animations**: Powered by Framer Motion for fluid transitions
- **Tooltips when collapsed**: Hover over icons to see labels
- **Notification badges**: Visual indicators for unread items
- **Fixed positioning**: Always visible, positioned below header

### 🎨 Design Highlights
- **Icon-first design**: Beautiful icons from Lucide React
- **Gradient active states**: Purple-to-indigo gradient for active items
- **Smooth hover effects**: Subtle animations on hover
- **Custom scrollbar**: Thin, styled scrollbar for long menus
- **Dark mode support**: Adapts to theme automatically
- **Professional spacing**: Well-balanced padding and gaps

### 🔐 Role-Based Navigation

#### All Users (Learner, Teacher, Affiliate)
- Dashboard
- My Learning
- Browse Courses
- Blog Posts
- Certificates
- Calendar
- Messages (with badge)
- Favorites
- Settings
- Help & Support

#### Teachers Only
- My Courses
- Create Course
- Analytics
- My Posts

#### Affiliates Only
- Earnings
- Promotions

## Usage

```tsx
import { SmartSidebar } from "@/components/dashboard/smart-sidebar";

// In your dashboard layout
<SmartSidebar user={user} />
<div className="ml-[72px]">
  {/* Your content */}
</div>
```

## Props

```typescript
interface SmartSidebarProps {
  user: User & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}
```

## Technical Implementation

### Animation Behavior

```tsx
// Expands/collapses smoothly on hover
<motion.aside
  onMouseEnter={() => setIsExpanded(true)}
  onMouseLeave={() => setIsExpanded(false)}
  animate={{ width: isExpanded ? 256 : 72 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
/>
```

### Active Link Detection

```tsx
const isActiveLink = (href: string) => {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname.startsWith(href);
};
```

### Navigation Item Structure

```tsx
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;         // Optional badge text
  roles?: string[];       // Who can see this item
}
```

## Customization

### Adding New Navigation Items

Edit the `navigationItems` array in `smart-sidebar.tsx`:

```tsx
const navigationItems: NavItem[] = [
  {
    label: "Your Feature",
    href: "/your-path",
    icon: YourIcon,
    roles: ["all"], // or ["teacher", "affiliate"]
  },
  // ... more items
];
```

### Changing Collapsed Width

Update the width values:

```tsx
// In the component
animate={{ width: isExpanded ? 256 : 72 }}

// In SimpleDashboard.tsx
className="ml-[72px]" // Match collapsed width
```

### Styling Active Links

The active link uses a gradient background:

```tsx
className={cn(
  isActive
    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
    : "hover:bg-slate-100 dark:hover:bg-slate-800"
)}
```

### Badge Customization

Add badges to navigation items:

```tsx
{
  label: "Messages",
  href: "/messages",
  icon: MessageSquare,
  badge: "3", // Show notification count
  roles: ["all"],
}
```

## Layout Integration

The sidebar is integrated with:
1. **SmartHeader** - Fixed header at top (64px height)
2. **Main Content** - Offset by sidebar width (72px)
3. **Responsive Design** - Full height minus header

```tsx
<>
  <SmartHeader user={user} />
  <SmartSidebar user={user} />
  <div className="ml-[72px]">
    {/* Content here */}
  </div>
</>
```

## Positioning Details

- **Position**: `fixed left-0 top-16` (below 64px header)
- **Height**: `h-[calc(100vh-4rem)]` (full viewport minus header)
- **Z-index**: `z-40` (below header's z-50)
- **Width**: Animated between 72px (collapsed) and 256px (expanded)

## Responsive Behavior

Currently optimized for desktop. For mobile:
- Consider hiding sidebar on small screens
- Use a drawer/sheet component instead
- Toggle with hamburger menu

### Future Mobile Enhancement

```tsx
// Suggested mobile adaptation
const isMobile = useMediaQuery("(max-width: 768px)");

if (isMobile) {
  return <MobileDrawer user={user} />;
}
```

## Performance Optimizations

1. **Framer Motion**: Hardware-accelerated animations
2. **Local State**: No global state management needed
3. **Role Filtering**: Items filtered once per render
4. **Smooth Scrolling**: Custom thin scrollbar for long lists

## Accessibility

- **Keyboard Navigation**: All links are keyboard accessible
- **Focus Indicators**: Visual focus states on links
- **ARIA Labels**: Tooltips provide context when collapsed
- **Semantic HTML**: Proper `nav` and `a` elements

## Icon Usage

All icons from Lucide React:
- Consistent 5x5 size: `className="h-5 w-5"`
- Colored by state (active, hover, default)
- Smooth transitions on color changes

## Troubleshooting

### Content Hidden Behind Sidebar

Add left margin to your content:

```tsx
<div className="ml-[72px]">
  {/* Your content */}
</div>
```

### Sidebar Not Visible

Check z-index and header height:
- Header: `z-50`, `h-16`
- Sidebar: `z-40`, `top-16`

### Tooltips Not Showing

Ensure `group` class is on parent and tooltip has `group-hover:opacity-100`.

### Icons Not Rendering

Import from lucide-react:

```tsx
import { IconName } from "lucide-react";
```

## Files

- `components/dashboard/smart-sidebar.tsx` - Main sidebar component
- `app/dashboard/_components/SimpleDashboard.tsx` - Integration
- `app/globals.css` - Custom scrollbar styles

## Color Palette

- **Active**: Purple-to-indigo gradient
- **Hover**: Slate-100 (light) / Slate-800 (dark)
- **Text**: Slate-700 (light) / Slate-300 (dark)
- **Icons**: Slate-600 (light) / Slate-400 (dark)
- **Border**: Slate-200 (light) / Slate-800 (dark)
- **Background**: White (light) / Slate-900 (dark)

## Future Enhancements

Consider adding:
- [ ] Mobile drawer version
- [ ] Collapsible sections/groups
- [ ] Recent/favorite items at top
- [ ] Keyboard shortcuts display
- [ ] User preferences for default state
- [ ] Pin/unpin functionality
- [ ] Drag-and-drop to reorder
