# ADR-0004: Adopt Role-Based Access Control (RBAC)

## Status
Accepted

## Context
The Taxomind LMS serves multiple user types with different responsibilities and access requirements:
- **Students**: Access courses, submit assignments, track progress
- **Teachers**: Create content, manage courses, grade assignments, view analytics
- **Administrators**: Full system access, user management, system configuration
- **Content Creators**: Create and manage educational content
- **Parents/Guardians**: Monitor student progress (future requirement)

We need an authorization system that:
- Scales with growing user base and role complexity
- Provides fine-grained access control
- Integrates with our authentication system (NextAuth.js)
- Supports permission inheritance and delegation
- Enables audit trails for compliance
- Allows dynamic permission assignment

## Decision
We will implement a Role-Based Access Control (RBAC) system with support for future migration to Attribute-Based Access Control (ABAC) if needed.

## Consequences

### Positive
- **Simplicity**: Roles are intuitive and easy to understand for administrators
- **Scalability**: Can handle thousands of users by grouping permissions into roles
- **Maintainability**: Centralized permission management through roles
- **Security**: Principle of least privilege enforcement
- **Audit Compliance**: Clear permission boundaries for audit trails
- **Performance**: Efficient permission checks with role-based caching
- **Flexibility**: Can combine multiple roles per user if needed
- **Migration Path**: Can extend to ABAC later without major refactoring

### Negative
- **Role Explosion**: May lead to many similar roles with slight variations
- **Inflexibility**: Difficult to handle exceptions without creating new roles
- **Context Limitations**: Cannot easily handle contextual permissions
- **Delegation Complexity**: Role delegation requires additional logic
- **Maintenance Overhead**: Roles need regular review and updates
- **Initial Setup**: Requires careful planning of role hierarchy

## Alternatives Considered

### 1. Attribute-Based Access Control (ABAC)
- **Pros**: Fine-grained control, context-aware, flexible policies
- **Cons**: Complex implementation, performance overhead, steep learning curve
- **Reason for rejection**: Over-engineered for current requirements

### 2. Access Control Lists (ACL)
- **Pros**: Direct resource-level permissions, simple concept
- **Cons**: Difficult to manage at scale, performance issues with many resources
- **Reason for rejection**: Not scalable for thousands of courses and users

### 3. Simple Role Check (Admin/User only)
- **Pros**: Very simple, easy to implement
- **Cons**: Too restrictive, doesn't match business requirements
- **Reason for rejection**: Insufficient for multi-tenant educational platform

### 4. Policy-Based Access Control (PBAC)
- **Pros**: Flexible policies, declarative approach
- **Cons**: Complex policy language, difficult debugging
- **Reason for rejection**: Unnecessary complexity for current needs

### 5. Capability-Based Security
- **Pros**: Fine-grained, delegatable permissions
- **Cons**: Complex token management, unfamiliar paradigm
- **Reason for rejection**: Too different from conventional approaches

## Implementation Notes

### Database Schema
```prisma
enum Role {
  ADMIN
  TEACHER
  STUDENT
  USER  // Default role
}

model User {
  id          String       @id @default(cuid())
  email       String       @unique
  role        Role         @default(USER)
  permissions Permission[]  // Direct permissions (future enhancement)
  courses     Course[]     // Owned courses (for teachers)
  Enrollment  Enrollment[] // Enrolled courses (for students)
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  users       User[]   // Future: direct permission assignment
  roles       RolePermission[]
}

model RolePermission {
  role        Role
  permission  Permission @relation(fields: [permissionId], references: [id])
  permissionId String
  
  @@id([role, permissionId])
}
```

### Permission Structure
```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  // Course permissions
  COURSE_CREATE: 'course:create',
  COURSE_READ: 'course:read',
  COURSE_UPDATE: 'course:update',
  COURSE_DELETE: 'course:delete',
  COURSE_PUBLISH: 'course:publish',
  
  // User management
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ROLE_ASSIGN: 'user:role:assign',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // System
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_AUDIT: 'system:audit',
} as const

// Role-Permission mapping
export const ROLE_PERMISSIONS = {
  ADMIN: Object.values(PERMISSIONS), // All permissions
  TEACHER: [
    PERMISSIONS.COURSE_CREATE,
    PERMISSIONS.COURSE_READ,
    PERMISSIONS.COURSE_UPDATE,
    PERMISSIONS.COURSE_PUBLISH,
    PERMISSIONS.ANALYTICS_VIEW,
  ],
  STUDENT: [
    PERMISSIONS.COURSE_READ,
  ],
  USER: [
    PERMISSIONS.COURSE_READ,
  ],
}
```

### Middleware Implementation
```typescript
// middleware.ts
import { auth } from "@/auth"
import { ROLE_PERMISSIONS } from "@/lib/permissions"

export default auth((req) => {
  const { nextUrl, auth } = req
  const userRole = auth?.user?.role || 'USER'
  
  // Extract required permission from route
  const requiredPermission = getRequiredPermission(nextUrl.pathname)
  
  if (requiredPermission) {
    const hasPermission = ROLE_PERMISSIONS[userRole]?.includes(requiredPermission)
    
    if (!hasPermission) {
      return Response.redirect(new URL('/unauthorized', nextUrl))
    }
  }
  
  // Role-based redirects
  if (nextUrl.pathname.startsWith('/admin') && userRole !== 'ADMIN') {
    return Response.redirect(new URL('/dashboard', nextUrl))
  }
  
  if (nextUrl.pathname.startsWith('/teacher') && userRole !== 'TEACHER') {
    return Response.redirect(new URL('/dashboard', nextUrl))
  }
})
```

### Permission Checking Utilities
```typescript
// hooks/use-permissions.ts
export function usePermissions() {
  const { data: session } = useSession()
  const userRole = session?.user?.role || 'USER'
  
  const hasPermission = useCallback((permission: string) => {
    return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
  }, [userRole])
  
  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(p => hasPermission(p))
  }, [hasPermission])
  
  const hasAllPermissions = useCallback((permissions: string[]) => {
    return permissions.every(p => hasPermission(p))
  }, [hasPermission])
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole,
  }
}
```

### Component-Level Protection
```typescript
// components/PermissionGate.tsx
export function PermissionGate({ 
  permission, 
  children, 
  fallback 
}: PermissionGateProps) {
  const { hasPermission } = usePermissions()
  
  if (!hasPermission(permission)) {
    return fallback || null
  }
  
  return <>{children}</>
}

// Usage
<PermissionGate permission={PERMISSIONS.COURSE_CREATE}>
  <CreateCourseButton />
</PermissionGate>
```

### API Route Protection
```typescript
// lib/api/with-permission.ts
export function withPermission(
  handler: NextApiHandler,
  requiredPermission: string
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await auth()
    
    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    const userPermissions = ROLE_PERMISSIONS[session.user.role]
    
    if (!userPermissions?.includes(requiredPermission)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    
    return handler(req, res)
  }
}
```

### Audit Logging
```typescript
// lib/audit.ts
export async function logPermissionCheck({
  userId,
  permission,
  resource,
  granted,
}: AuditLogEntry) {
  await db.auditLog.create({
    data: {
      userId,
      action: 'PERMISSION_CHECK',
      details: {
        permission,
        resource,
        granted,
      },
      timestamp: new Date(),
    },
  })
}
```

### Future Migration Path to ABAC
```typescript
// Prepare for future ABAC migration
interface AccessContext {
  user: User
  resource: Resource
  action: string
  environment: {
    time: Date
    ip: string
    location?: string
  }
}

// Future policy engine
class PolicyEngine {
  evaluate(context: AccessContext): boolean {
    // Evaluate policies based on attributes
    return true
  }
}
```

## Testing Strategy
1. Unit tests for permission checking functions
2. Integration tests for middleware protection
3. E2E tests for role-based user journeys
4. Security testing for privilege escalation attempts
5. Performance testing for permission checks at scale

## Monitoring
- Track permission check failures
- Monitor role distribution
- Alert on unusual permission patterns
- Regular audit of role assignments
- Performance metrics for authorization checks

## References
- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Google Zanzibar Paper](https://research.google/pubs/pub48190/)

## Date
2024-01-18

## Authors
- Taxomind Architecture Team