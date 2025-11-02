# Smart Dashboard Header

A simple, professional header component for authenticated users in the TaxoMind dashboard.

## Features

### 🎯 Core Features
- **User Profile Dropdown**: Quick access to profile, settings, messages, and logout
- **Notifications Panel**: Real-time notifications with unread count badge
- **Search Functionality**: Expandable search bar for courses and resources
- **Theme Toggle**: Dark/light mode switcher
- **Quick Navigation**: Dashboard, Courses, and role-based links

### 🎨 Design Highlights
- Sticky header with backdrop blur effect
- Smooth animations with Framer Motion
- Responsive design (mobile-first)
- Role-based navigation (Learner, Teacher, Affiliate)
- Gradient branding consistent with TaxoMind design system

### 🔐 Smart Features
- **Role Detection**: Shows different nav items based on user role
- **Unread Indicators**: Visual badges for new notifications
- **Keyboard Friendly**: Accessible dropdowns and navigation
- **Auto-close**: Click outside to close dropdowns

## Usage

```tsx
import { SmartHeader } from "@/components/dashboard/smart-header";

// In your dashboard component
<SmartHeader user={user} />
```

## Props

```typescript
interface SmartHeaderProps {
  user: User & {
    role?: string;
    isTeacher?: boolean;
    isAffiliate?: boolean;
  };
}
```

## Customization

### Adding Navigation Links

Edit the quick navigation section in `smart-header.tsx`:

```tsx
<nav className="hidden md:flex items-center gap-1">
  <Link href="/your-link">
    <Icon className="h-4 w-4" />
    Your Label
  </Link>
</nav>
```

### Modifying Notifications

Update the notifications array:

```tsx
const notifications = [
  { id: 1, title: "Your notification", time: "2m ago", unread: true },
  // Add more...
];
```

### Theme Colors

The header uses Tailwind classes with the TaxoMind color palette:
- Primary: `purple-500` / `cyan-500`
- Background: `slate-900` (dark) / `white` (light)
- Text: `slate-700` (light) / `slate-300` (dark)

## Technical Details

### Dependencies
- `next-auth`: User authentication
- `framer-motion`: Smooth animations
- `lucide-react`: Icon library
- `next-themes`: Theme management

### Performance
- Sticky positioning with `top-0 z-50`
- Backdrop blur for modern glassmorphism effect
- Optimized re-renders with local state management

### Accessibility
- ARIA labels on icon buttons
- Keyboard navigation support
- Focus management in dropdowns
- Screen reader friendly

## Integration

The header is integrated into `SimpleDashboard.tsx` and wraps all dashboard views:

```tsx
return (
  <>
    <SmartHeader user={user} />
    <div className="min-h-screen">
      {/* Dashboard content */}
    </div>
  </>
);
```

## Responsive Behavior

- **Mobile** (< 640px): Logo icon only, compact actions
- **Tablet** (640px - 768px): Logo + text, theme toggle visible
- **Desktop** (> 768px): Full navigation menu

## Future Enhancements

Consider adding:
- [ ] Real-time notifications via WebSocket
- [ ] Search with autocomplete
- [ ] Keyboard shortcuts (Cmd+K for search)
- [ ] Notification preferences
- [ ] Quick actions menu

## Files

- `components/dashboard/smart-header.tsx` - Main header component
- `app/dashboard/_components/SimpleDashboard.tsx` - Integration
