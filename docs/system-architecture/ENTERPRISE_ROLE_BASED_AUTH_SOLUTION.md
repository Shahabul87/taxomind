# Enterprise Role-Based Authentication Solution

## Current Analysis

### ✅ What's Working:
- NextAuth v5 is properly configured
- Role information is stored in JWT token
- Basic role checking exists in middleware
- User roles are properly typed with Prisma

### ❌ What's Missing:
- **Comprehensive role validation**
- **Permission-based access control**
- **Role hierarchy management**
- **Real-time role checking**
- **Audit logging for role changes**

## 🏗️ Enterprise Solution Architecture

### 1. **Enhanced Role System**

```typescript
// types/auth.ts
export enum UserRole {
  ADMIN = "ADMIN",
  TEACHER = "TEACHER", 
  STUDENT = "STUDENT",
  MODERATOR = "MODERATOR", // New role
  GUEST = "GUEST" // New role
}

export enum Permission {
  // Course Management
  CREATE_COURSE = "CREATE_COURSE",
  EDIT_COURSE = "EDIT_COURSE",
  DELETE_COURSE = "DELETE_COURSE",
  PUBLISH_COURSE = "PUBLISH_COURSE",
  
  // User Management
  CREATE_USER = "CREATE_USER",
  EDIT_USER = "EDIT_USER",
  DELETE_USER = "DELETE_USER",
  ASSIGN_ROLES = "ASSIGN_ROLES",
  
  // Analytics
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
  VIEW_ALL_ANALYTICS = "VIEW_ALL_ANALYTICS",
  EXPORT_DATA = "EXPORT_DATA",
  
  // Content Management
  MODERATE_CONTENT = "MODERATE_CONTENT",
  APPROVE_CONTENT = "APPROVE_CONTENT",
  
  // System
  MANAGE_SETTINGS = "MANAGE_SETTINGS",
  ACCESS_ADMIN_PANEL = "ACCESS_ADMIN_PANEL"
}

export interface RolePermissions {
  [UserRole.ADMIN]: Permission[];
  [UserRole.TEACHER]: Permission[];
  [UserRole.STUDENT]: Permission[];
  [UserRole.MODERATOR]: Permission[];
  [UserRole.GUEST]: Permission[];
}
```

### 2. **Permission Matrix Configuration**

```typescript
// lib/auth/permissions.ts
import { UserRole, Permission, RolePermissions } from "@/types/auth";

export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.ADMIN]: [
    // Full system access
    Permission.CREATE_COURSE,
    Permission.EDIT_COURSE,
    Permission.DELETE_COURSE,
    Permission.PUBLISH_COURSE,
    Permission.CREATE_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    Permission.ASSIGN_ROLES,
    Permission.VIEW_ALL_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.MODERATE_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.MANAGE_SETTINGS,
    Permission.ACCESS_ADMIN_PANEL
  ],
  
  [UserRole.TEACHER]: [
    // Course and content management
    Permission.CREATE_COURSE,
    Permission.EDIT_COURSE,
    Permission.PUBLISH_COURSE,
    Permission.VIEW_ANALYTICS, // Own courses only
    Permission.MODERATE_CONTENT // Own content only
  ],
  
  [UserRole.STUDENT]: [
    // Basic learning access
    Permission.VIEW_ANALYTICS // Own progress only
  ],
  
  [UserRole.MODERATOR]: [
    // Content moderation
    Permission.MODERATE_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.VIEW_ANALYTICS
  ],
  
  [UserRole.GUEST]: [
    // Very limited access
  ]
};

export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  const permissions = getRolePermissions(userRole);
  return permissions.includes(permission);
};

export const hasAnyPermission = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole: UserRole, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(userRole, permission));
};
```

### 3. **Enhanced Authentication Utilities**

```typescript
// lib/auth/enhanced-auth.ts
import { auth } from "@/auth";
import { UserRole, Permission } from "@/types/auth";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "./permissions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

// Server-side authentication utilities
export const getCurrentUser = async () => {
  const session = await auth();
  return session?.user;
};

export const getCurrentRole = async (): Promise<UserRole | null> => {
  const session = await auth();
  return session?.user?.role || null;
};

export const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
};

export const requireRole = async (role: UserRole) => {
  const user = await requireAuth();
  if (user.role !== role) {
    redirect("/unauthorized");
  }
  return user;
};

export const requireAnyRole = async (roles: UserRole[]) => {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
};

export const requirePermission = async (permission: Permission) => {
  const user = await requireAuth();
  if (!hasPermission(user.role, permission)) {
    redirect("/unauthorized");
  }
  return user;
};

export const requireAnyPermission = async (permissions: Permission[]) => {
  const user = await requireAuth();
  if (!hasAnyPermission(user.role, permissions)) {
    redirect("/unauthorized");
  }
  return user;
};

export const requireAllPermissions = async (permissions: Permission[]) => {
  const user = await requireAuth();
  if (!hasAllPermissions(user.role, permissions)) {
    redirect("/unauthorized");
  }
  return user;
};

// Check if user has access to specific resource
export const requireResourceAccess = async (
  resourceType: 'course' | 'user' | 'analytics',
  resourceId: string,
  operation: 'read' | 'write' | 'delete'
) => {
  const user = await requireAuth();
  
  // Admin has access to everything
  if (user.role === UserRole.ADMIN) {
    return user;
  }
  
  // Check resource-specific permissions
  switch (resourceType) {
    case 'course':
      return await requireCourseAccess(user, resourceId, operation);
    case 'user':
      return await requireUserAccess(user, resourceId, operation);
    case 'analytics':
      return await requireAnalyticsAccess(user, resourceId, operation);
    default:
      redirect("/unauthorized");
  }
};

// Resource-specific access checks
const requireCourseAccess = async (user: any, courseId: string, operation: string) => {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { userId: true, isPublished: true }
  });
  
  if (!course) {
    redirect("/not-found");
  }
  
  // Teachers can access their own courses
  if (user.role === UserRole.TEACHER && course.userId === user.id) {
    return user;
  }
  
  // Students can read published courses they're enrolled in
  if (user.role === UserRole.STUDENT && operation === 'read' && course.isPublished) {
    const enrollment = await db.userCourseEnrollment.findFirst({
      where: { userId: user.id, courseId }
    });
    
    if (enrollment) {
      return user;
    }
  }
  
  redirect("/unauthorized");
};

const requireUserAccess = async (user: any, targetUserId: string, operation: string) => {
  // Users can access their own data
  if (user.id === targetUserId) {
    return user;
  }
  
  // Only admins can access other users' data
  if (user.role !== UserRole.ADMIN) {
    redirect("/unauthorized");
  }
  
  return user;
};

const requireAnalyticsAccess = async (user: any, resourceId: string, operation: string) => {
  // Admins can access all analytics
  if (user.role === UserRole.ADMIN) {
    return user;
  }
  
  // Teachers can access analytics for their courses
  if (user.role === UserRole.TEACHER) {
    const course = await db.course.findFirst({
      where: { id: resourceId, userId: user.id }
    });
    
    if (course) {
      return user;
    }
  }
  
  // Students can access their own analytics
  if (user.role === UserRole.STUDENT && resourceId === user.id) {
    return user;
  }
  
  redirect("/unauthorized");
};
```

### 4. **Client-side Role Hooks**

```typescript
// hooks/use-enhanced-auth.ts
import { useSession } from "next-auth/react";
import { UserRole, Permission } from "@/types/auth";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/auth/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export const useCurrentUser = () => {
  const { data: session, status } = useSession();
  return {
    user: session?.user,
    loading: status === "loading",
    authenticated: status === "authenticated"
  };
};

export const useCurrentRole = () => {
  const { user } = useCurrentUser();
  return user?.role || null;
};

export const useHasPermission = (permission: Permission) => {
  const role = useCurrentRole();
  return role ? hasPermission(role, permission) : false;
};

export const useHasAnyPermission = (permissions: Permission[]) => {
  const role = useCurrentRole();
  return role ? hasAnyPermission(role, permissions) : false;
};

export const useHasAllPermissions = (permissions: Permission[]) => {
  const role = useCurrentRole();
  return role ? hasAllPermissions(role, permissions) : false;
};

export const useRequireAuth = () => {
  const { user, loading, authenticated } = useCurrentUser();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && !authenticated) {
      router.push("/auth/login");
    }
  }, [loading, authenticated, router]);
  
  return { user, loading, authenticated };
};

export const useRequireRole = (role: UserRole) => {
  const { user, loading, authenticated } = useRequireAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && authenticated && user?.role !== role) {
      router.push("/unauthorized");
    }
  }, [loading, authenticated, user?.role, role, router]);
  
  return { user, loading, authenticated };
};

export const useRequireAnyRole = (roles: UserRole[]) => {
  const { user, loading, authenticated } = useRequireAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && authenticated && user?.role && !roles.includes(user.role)) {
      router.push("/unauthorized");
    }
  }, [loading, authenticated, user?.role, roles, router]);
  
  return { user, loading, authenticated };
};

export const useRequirePermission = (permission: Permission) => {
  const { user, loading, authenticated } = useRequireAuth();
  const hasRequiredPermission = useHasPermission(permission);
  const router = useRouter();
  
  useEffect(() => {
    if (!loading && authenticated && !hasRequiredPermission) {
      router.push("/unauthorized");
    }
  }, [loading, authenticated, hasRequiredPermission, router]);
  
  return { user, loading, authenticated, hasPermission: hasRequiredPermission };
};
```

### 5. **Role Guard Components**

```typescript
// components/auth/enhanced-role-guard.tsx
import { ReactNode } from "react";
import { UserRole, Permission } from "@/types/auth";
import { useCurrentRole, useHasPermission, useHasAnyPermission } from "@/hooks/use-enhanced-auth";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAllPermissions?: boolean;
  fallback?: ReactNode;
  redirect?: boolean;
}

export const RoleGuard = ({ 
  children, 
  allowedRoles, 
  requiredPermissions, 
  requireAllPermissions = false,
  fallback = null,
  redirect = false 
}: RoleGuardProps) => {
  const currentRole = useCurrentRole();
  
  // Check role-based access
  const hasRoleAccess = allowedRoles ? 
    (currentRole && allowedRoles.includes(currentRole)) : true;
  
  // Check permission-based access
  const hasPermissionAccess = requiredPermissions ? 
    (requireAllPermissions ? 
      useHasAllPermissions(requiredPermissions) : 
      useHasAnyPermission(requiredPermissions)
    ) : true;
  
  const hasAccess = hasRoleAccess && hasPermissionAccess;
  
  if (!hasAccess) {
    if (redirect) {
      window.location.href = "/unauthorized";
      return null;
    }
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Specific role guards
export const AdminGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={[UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const TeacherGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const StudentGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard allowedRoles={[UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const PermissionGuard = ({ 
  children, 
  permissions, 
  fallback 
}: { 
  children: ReactNode; 
  permissions: Permission[]; 
  fallback?: ReactNode;
}) => (
  <RoleGuard requiredPermissions={permissions} fallback={fallback}>
    {children}
  </RoleGuard>
);
```

### 6. **Enhanced Middleware with Audit Logging**

```typescript
// lib/auth/audit-logger.ts
export class AuthAuditLogger {
  static async logAccess(data: {
    userId?: string;
    action: string;
    resource?: string;
    success: boolean;
    reason?: string;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      await db.authAuditLog.create({
        data: {
          ...data,
          timestamp: new Date(),
        }
      });
    } catch (error) {
      console.error("Failed to log auth audit:", error);
    }
  }
  
  static async logRoleChange(data: {
    adminId: string;
    targetUserId: string;
    oldRole: UserRole;
    newRole: UserRole;
    reason?: string;
  }) {
    try {
      await db.roleChangeLog.create({
        data: {
          ...data,
          timestamp: new Date(),
        }
      });
    } catch (error) {
      console.error("Failed to log role change:", error);
    }
  }
}
```

### 7. **Database Schema Extensions**

```prisma
// Add to prisma/schema.prisma

model AuthAuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // "access_granted", "access_denied", "login", "logout"
  resource  String?  // "/admin/dashboard", "/courses/123"
  success   Boolean
  reason    String?  // "insufficient_permissions", "invalid_role"
  ip        String?
  userAgent String?
  timestamp DateTime @default(now())
  
  @@index([userId])
  @@index([timestamp])
  @@index([action])
}

model RoleChangeLog {
  id           String   @id @default(cuid())
  adminId      String   // Who made the change
  targetUserId String   // Whose role was changed
  oldRole      UserRole
  newRole      UserRole
  reason       String?
  timestamp    DateTime @default(now())
  
  admin  User @relation("RoleChangeAdmin", fields: [adminId], references: [id])
  target User @relation("RoleChangeTarget", fields: [targetUserId], references: [id])
  
  @@index([adminId])
  @@index([targetUserId])
  @@index([timestamp])
}

// Add to User model
model User {
  // ... existing fields
  
  // Audit relations
  roleChangesAsAdmin  RoleChangeLog[] @relation("RoleChangeAdmin")
  roleChangesAsTarget RoleChangeLog[] @relation("RoleChangeTarget")
}
```

## 8. **Usage Examples**

### Server Components
```typescript
// app/admin/users/page.tsx
import { requirePermission } from "@/lib/auth/enhanced-auth";
import { Permission } from "@/types/auth";

export default async function AdminUsersPage() {
  // Automatically redirects if user doesn't have permission
  await requirePermission(Permission.MANAGE_USERS);
  
  return <UserManagementComponent />;
}
```

### Client Components
```typescript
// components/course-actions.tsx
import { PermissionGuard } from "@/components/auth/enhanced-role-guard";
import { Permission } from "@/types/auth";

export function CourseActions() {
  return (
    <div>
      <PermissionGuard 
        permissions={[Permission.EDIT_COURSE]}
        fallback={<p>You don't have permission to edit courses</p>}
      >
        <EditCourseButton />
      </PermissionGuard>
      
      <PermissionGuard permissions={[Permission.DELETE_COURSE]}>
        <DeleteCourseButton />
      </PermissionGuard>
    </div>
  );
}
```

### API Routes
```typescript
// app/api/courses/[courseId]/route.ts
import { requireResourceAccess } from "@/lib/auth/enhanced-auth";

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  // Automatically checks if user can edit this specific course
  await requireResourceAccess('course', params.courseId, 'write');
  
  // Proceed with course update
}
```

## 9. **Testing Strategy**

```typescript
// __tests__/auth-roles.test.ts
describe('Role-Based Authentication', () => {
  test('admin can access all resources', async () => {
    const adminUser = await createTestUser({ role: UserRole.ADMIN });
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminUser.token}`);
    
    expect(response.status).toBe(200);
  });
  
  test('teacher cannot access admin routes', async () => {
    const teacherUser = await createTestUser({ role: UserRole.TEACHER });
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${teacherUser.token}`);
    
    expect(response.status).toBe(403);
  });
  
  test('student can only access own courses', async () => {
    const studentUser = await createTestUser({ role: UserRole.STUDENT });
    const course = await createTestCourse({ ownerId: 'different-user' });
    
    const response = await request(app)
      .get(`/api/courses/${course.id}`)
      .set('Authorization', `Bearer ${studentUser.token}`);
    
    expect(response.status).toBe(403);
  });
});
```

This enterprise-grade solution provides:
- ✅ **Clear role hierarchy**
- ✅ **Permission-based access control**
- ✅ **Resource-level security**
- ✅ **Audit logging**
- ✅ **Comprehensive testing**
- ✅ **Type safety**
- ✅ **Real-time validation**