# Header Components (Current vs Legacy)

This repo now uses the new enterprise MainHeader for navigation and AI Features. The previous TaxomindHeader has been archived.

- Current: `app/(homepage)/main-header.tsx`
- Legacy (archived): `backups/legacy-headers/taxomind-header.tsx`

## Features

### User Profile Display
- **Avatar**: Displays user image or initials with gradient background
- **Online Status**: Green indicator for active users
- **Level Badge**: Shows user's current learning level (Beginner, Intermediate, Advanced, Expert)
- **Points & Streak**: Real-time display of user points and learning streak
- **Role Badge**: Visual indicators for Admin, Teacher, and Student roles

### Profile Dropdown
- **User Stats Grid**: Quick view of enrolled courses, completed courses, and achievements
- **Progress Bar**: Visual representation of overall learning progress
- **Quick Actions**: Direct links to dashboard, profile, courses, achievements, etc.
- **Role-Based Menu Items**: Shows teacher portal for teachers, admin panel for admins

### Navigation
- **Desktop Navigation**: Clean horizontal navigation with icon support
- **Mobile Menu**: Responsive slide-out menu with user stats
- **Search**: Quick search functionality
- **Theme Toggle**: Dark/Light mode switcher
- **Notifications**: Bell icon with unread indicator

## Usage (current)

```tsx
import { MainHeader } from '@/app/(homepage)/main-header';

// In your layout or page component
const user = {
  id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  image: '/path/to/avatar.jpg',
  role: 'USER', // or 'ADMIN', 'TEACHER'
  coursesEnrolled: 5,
  coursesCompleted: 2,
  achievements: 8,
  learningStreak: 15,
  totalPoints: 2500,
  level: 'Intermediate'
};

export default function Layout({ children }) {
  return (
    <>
      <MainHeader user={user} />
      <main>{children}</main>
    </>
  );
}
```

## User Object Properties

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| id | string | Unique user identifier | Yes |
| name | string | User's display name | No |
| email | string | User's email address | No |
| image | string | URL to user's avatar | No |
| role | string | User role (ADMIN, TEACHER, USER) | No |
| coursesEnrolled | number | Total enrolled courses | No |
| coursesCompleted | number | Completed courses count | No |
| achievements | number | Total achievements earned | No |
| learningStreak | number | Current learning streak in days | No |
| totalPoints | number | Total points earned | No |
| level | string | User level (Beginner, Intermediate, Advanced, Expert) | No |

## Styling

MainHeader uses:
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Next.js Image** component for optimized image loading

## Features by User Role (MainHeader)

### All Users
- View profile and stats
- Access courses and blog
- Search functionality
- Theme switching

### Students (Default)
- Dashboard access
- Course progress tracking
- Achievement viewing
- Study calendar

### Teachers
- Teacher portal access
- All student features
- Course creation tools (via teacher portal)

### Admins
- Admin panel access
- All teacher features
- System management tools (via admin panel)

## Mobile Responsiveness

- **Desktop (lg+)**: Full horizontal navigation with all features
- **Tablet (md)**: Condensed navigation, user info visible
- **Mobile (< md)**: Hamburger menu with slide-out navigation

## Color Scheme

- **Background**: Slate-900 with blur effect
- **Primary**: Purple to Blue gradient
- **Text**: Gray-300 (secondary), White (primary)
- **Accents**: 
  - Purple: Primary actions
  - Blue: Secondary actions
  - Green: Success/Online status
  - Yellow: Points/Achievements
  - Orange: Streaks
  - Red: Admin/Danger actions

## Dependencies

```json
{
  "next": "^15.0.0",
  "react": "^18.0.0",
  "framer-motion": "^10.0.0",
  "lucide-react": "^0.263.0",
  "next-themes": "^0.2.0"
}
```

## Customization

To customize the header for your needs:

1. **Colors**: Modify the gradient classes in the component
2. **Navigation Items**: Add/remove links in the navigation section
3. **User Stats**: Adjust the stats grid to show different metrics
4. **Dropdown Menu**: Customize menu items based on your app's features
5. **Animations**: Adjust Framer Motion animation properties

## Legacy component

If you still need the older component for reference, find it at:

- `backups/legacy-headers/taxomind-header.tsx`

It is no longer used in production and will not receive updates.

## Best Practices

1. Always provide a user object when the user is authenticated
2. Handle loading states for user data fetching
3. Implement proper logout functionality
4. Connect notification system to real backend
5. Track user interactions for analytics
