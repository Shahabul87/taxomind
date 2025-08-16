# Role-Based Access Control System

## Overview

This LMS now features a comprehensive role-based access control (RBAC) system that replaces the previous email-based role detection with a proper permissions-based approach.

## User Roles

### 1. STUDENT (Default)
- **Primary users**: Learners enrolled in courses
- **Access**: Course viewing, exam taking, personal progress tracking
- **Dashboard**: `/analytics/student`

### 2. TEACHER
- **Primary users**: Instructors and content creators
- **Access**: Course creation/management, student progress viewing, grading
- **Dashboard**: `/analytics/teacher`

### 3. ADMIN
- **Primary users**: System administrators
- **Access**: Full system access, user management, all analytics
- **Dashboard**: `/analytics/admin`

## Permissions System

### Student Permissions
- `course:view` - View course content
- `course:enroll` - Enroll in courses
- `exam:take` - Take examinations
- `progress:view_own` - View personal progress
- `analytics:view_own` - View personal analytics

### Teacher Permissions
- All Student permissions plus:
- `course:create` - Create new courses
- `course:edit_own` - Edit own courses
- `course:delete_own` - Delete own courses
- `exam:create` - Create examinations
- `exam:edit_own` - Edit own exams
- `exam:grade` - Grade student submissions
- `student:view_progress` - View student progress
- `analytics:view_students` - View student analytics
- `analytics:view_courses` - View course analytics

### Admin Permissions
- All Teacher permissions plus:
- `course:edit_any` - Edit any course
- `course:delete_any` - Delete any course
- `user:view_all` - View all users
- `user:edit_roles` - Modify user roles
- `user:delete` - Delete users
- `analytics:view_all` - View all analytics
- `system:manage` - System management
- `role:assign` - Assign roles to users

## Implementation Components

### 1. Core Libraries

#### `/lib/role-management.ts`
- Permission definitions and checking
- Role assignment functions
- User management utilities

#### `/lib/api-protection.ts`
- Server-side route protection
- Role and permission validation
- Error handling for unauthorized access

### 2. Authentication Guards

#### `/components/auth/role-guard.tsx`
- Client-side role-based component protection
- Supports single or multiple role requirements
- Automatic redirects for unauthorized access

#### `/components/auth/permission-guard.tsx`
- Permission-based component rendering
- Conditional component display
- Fallback content support

#### `/components/auth/admin-guard.tsx`
- Admin-only access protection
- Used for sensitive administrative areas

### 3. Custom Hooks

#### `/hooks/use-permissions.ts`
- Permission checking utilities
- Role validation helpers
- User state management

### 4. API Protection

#### Server-side Protection Examples:
```typescript
// Require specific permission
export const POST = withPermission("course:create", async (req) => {
  // Handler code
});

// Require specific role
export const GET = withRole(UserRole.ADMIN, async (req) => {
  // Handler code
});

// Require authentication only
export const PUT = withAuth(async (req) => {
  // Handler code
});
```

### 5. Middleware Enhancement

#### Enhanced Route Protection
- Role-based automatic redirects
- Protected route validation
- Analytics route segregation

## Admin Interface

### User Management (`/admin/users`)
- View all system users
- Change user roles
- Delete users
- User statistics dashboard

### Features:
- Real-time role updates
- User search and filtering
- Role-based user statistics
- Bulk operations support

## API Endpoints

### Admin User Management
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users` - Update user role
- `GET /api/admin/users/[userId]` - Get specific user
- `PATCH /api/admin/users/[userId]` - Update specific user
- `DELETE /api/admin/users/[userId]` - Delete user

## Usage Examples

### Client-side Role Protection
```tsx
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRole } from "@prisma/client";

// Single role
<RoleGuard allowedRoles={UserRole.ADMIN}>
  <AdminContent />
</RoleGuard>

// Multiple roles
<RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
  <TeacherContent />
</RoleGuard>
```

### Permission-based Rendering
```tsx
import { PermissionGuard } from "@/components/auth/permission-guard";

<PermissionGuard permission="course:create">
  <CreateCourseButton />
</PermissionGuard>
```

### Using the Permissions Hook
```tsx
import { usePermissions } from "@/hooks/use-permissions";

function CourseActions() {
  const { canCreateCourses, isAdmin, hasPermission } = usePermissions();
  
  return (
    <div>
      {canCreateCourses && <CreateButton />}
      {isAdmin && <AdminPanel />}
      {hasPermission("exam:grade") && <GradingInterface />}
    </div>
  );
}
```

### Server-side Permission Checking
```typescript
import { requirePermission, hasPermission } from "@/lib/role-management";

// In API routes
async function handler() {
  await requirePermission("course:edit_any");
  // Proceed with operation
}

// In server components
async function Component() {
  const canManage = await hasPermission("user:edit_roles");
  return canManage ? <AdminTools /> : <UserTools />;
}
```

## Migration from Email-based System

### Previous Implementation (Removed)
```typescript
// Old email-based role detection
const isAdmin = userEmail?.includes('admin@') || userEmail?.includes('@admin.');
const isTeacher = userEmail?.includes('teacher@') || userEmail?.includes('@teacher.');
```

### New Implementation
```typescript
// New role-based system
const { isAdmin, isTeacher, hasPermission } = usePermissions();
const userRole = await currentRole();
```

## Security Features

1. **Server-side Validation**: All permissions checked on server
2. **JWT Integration**: Roles stored in authentication tokens
3. **Middleware Protection**: Route-level access control
4. **API Protection**: Endpoint-level permission validation
5. **Component Guards**: UI-level access control

## Default Role Assignment

New users are assigned the `STUDENT` role by default. Admins can change user roles through the admin interface or via API.

## Error Handling

- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User lacks required permissions
- **Automatic Redirects**: Users redirected to appropriate dashboards
- **Fallback Content**: Graceful degradation for unauthorized access

## Best Practices

1. Always use server-side permission checking for sensitive operations
2. Implement client-side guards for better UX
3. Use permission-based checks rather than role-based when possible
4. Provide clear error messages for unauthorized access
5. Test all role combinations thoroughly

## Future Enhancements

- [ ] Role hierarchy with inheritance
- [ ] Time-based permissions
- [ ] Department/organization-based access
- [ ] Permission delegation
- [ ] Audit logging for role changes
- [ ] Bulk user operations
- [ ] Custom role creation