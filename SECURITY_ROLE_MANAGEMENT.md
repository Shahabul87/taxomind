# Security & Role Management Documentation

## Table of Contents
1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Registration Flows](#registration-flows)
4. [Role Management](#role-management)
5. [Security Implementation](#security-implementation)
6. [API Endpoints](#api-endpoints)
7. [Database Schema](#database-schema)
8. [Admin Operations](#admin-operations)
9. [Security Best Practices](#security-best-practices)

## Overview

The Taxomind LMS implements a comprehensive role-based access control (RBAC) system with multiple security layers to ensure proper authorization and prevent privilege escalation.

### Key Security Features
- ✅ **Role-based registration flows**
- ✅ **Instructor verification system**
- ✅ **Admin-only role management**
- ✅ **Comprehensive audit logging**
- ✅ **Prevention of unauthorized role changes**
- ✅ **Two-factor authentication support**

## User Roles

### Role Hierarchy

```
ADMIN
  ├── Full system access
  ├── User management
  ├── Role assignments
  └── System configuration

INSTRUCTOR / TEACHER
  ├── Course creation
  ├── Student management
  ├── Analytics access
  └── Content publishing

MODERATOR
  ├── Content moderation
  ├── Community management
  └── Report handling

LEARNER / STUDENT / USER
  ├── Course enrollment
  ├── Learning activities
  └── Basic profile management

AFFILIATE
  ├── Referral tracking
  └── Commission management
```

### Default Role Assignment
- **New registrations**: Automatically assigned `LEARNER` role
- **Teacher registrations**: Start as `LEARNER` with pending instructor verification
- **Admin creation**: Only by existing admins through admin panel

## Registration Flows

### 1. Student Registration (`/auth/register`)
```typescript
// Standard registration flow
POST /api/register
{
  name: string,
  email: string,
  password: string
}
// Result: User created with LEARNER role
```

### 2. Teacher Registration (`/auth/register-teacher`)
```typescript
// Enhanced registration with verification
POST /api/register-teacher
{
  name: string,
  email: string,
  password: string,
  qualifications: string,
  experience: string,
  subjects: string
}
// Result: User created with LEARNER role + pending instructor verification
```

### 3. OAuth Registration
- Automatic role assignment: `LEARNER`
- Email automatically verified
- No password required

## Role Management

### Role Change Restrictions

| Current Role | Can Change To | Method |
|-------------|---------------|---------|
| LEARNER | INSTRUCTOR | Apply through `/auth/register-teacher` or request in settings |
| LEARNER | ADMIN | ❌ Not allowed (Admin must assign) |
| INSTRUCTOR | ADMIN | ❌ Not allowed (Admin must assign) |
| ADMIN | Any | ✅ Can change any user's role |

### Implementation Details

#### 1. Settings Action Security (`/actions/settings.ts`)
```typescript
// Roles are no longer updateable through settings
const updatedUser = await db.user.update({
  where: { id: dbUser.id },
  data: {
    name: values.name,
    email: values.email,
    password: values.password,
    isTwoFactorEnabled: values.isTwoFactorEnabled,
    // role is explicitly excluded
  }
});
```

#### 2. Admin Role Management (`/actions/admin-role-management.ts`)
```typescript
// Only admins can change roles
export const changeUserRole = async (targetUserId: string, newRole: UserRole) => {
  const user = await currentUser();
  
  if (user.role !== UserRole.ADMIN) {
    return { error: "Unauthorized: Admin access required" };
  }
  
  // Prevent self-demotion
  if (user.id === targetUserId) {
    return { error: "Cannot change your own role" };
  }
  
  // Update role with audit logging
  // ...
}
```

## Security Implementation

### 1. Instructor Verification System

```typescript
// Database Models
model InstructorVerification {
  id            String @id @default(cuid())
  userId        String @unique
  status        VerificationStatus // PENDING, APPROVED, REJECTED
  qualifications String?
  experience    String?
  subjects      Json?
  requestedAt   DateTime
  reviewedAt    DateTime?
  reviewedBy    String?
  reviewNotes   String?
  user          User @relation(...)
}

enum InstructorStatus {
  PENDING
  VERIFIED
  REJECTED
  SUSPENDED
}
```

### 2. Audit Logging

All role-related actions are logged:
```typescript
await db.auditLog.create({
  data: {
    userId: performerId,
    action: "ROLE_CHANGE",
    entityType: "USER",
    entityId: targetUserId,
    details: {
      oldRole,
      newRole,
      reason
    }
  }
});
```

### 3. Middleware Protection

```typescript
// middleware.ts
const ROLE_ROUTES = {
  [UserRole.ADMIN]: ['/admin', '/analytics/admin'],
  [UserRole.INSTRUCTOR]: ['/teacher', '/instructor'],
  [UserRole.LEARNER]: ['/dashboard/user', '/my-courses'],
  // ...
};

function hasAccessToRoute(pathname: string, userRole: UserRole): boolean {
  // Admin has access to everything
  if (userRole === UserRole.ADMIN) return true;
  
  // Check role-specific routes
  // ...
}
```

## API Endpoints

### Public Endpoints
- `POST /api/register` - Student registration
- `POST /api/register-teacher` - Teacher registration with verification

### Protected Endpoints (Admin Only)
- `POST /api/admin/change-role` - Change user role
- `GET /api/admin/instructor-requests` - Get pending instructor requests
- `POST /api/admin/review-instructor` - Approve/reject instructor request

### Protected Endpoints (Authenticated Users)
- `POST /api/request-instructor-role` - Request instructor privileges
- `GET /api/my-instructor-status` - Check verification status

## Database Schema

### User Model (Role-Related Fields)
```prisma
model User {
  id                    String           @id @default(cuid())
  role                  UserRole         @default(LEARNER)
  instructorStatus      InstructorStatus? @default(PENDING)
  instructorVerifiedAt  DateTime?
  instructorTier        InstructorTier?  @default(BASIC)
  isAccountLocked       Boolean          @default(false)
  lockReason            String?
  // ...
}

enum UserRole {
  ADMIN
  USER
  STUDENT
  TEACHER
  INSTRUCTOR
  LEARNER
  MODERATOR
  AFFILIATE
}
```

## Admin Operations

### 1. Managing User Roles
```typescript
// Admin Dashboard Component
const AdminUserManagement = () => {
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const result = await changeUserRole(userId, newRole);
    if (result.success) {
      toast.success("Role updated successfully");
    }
  };
  // ...
};
```

### 2. Reviewing Instructor Applications
```typescript
const handleInstructorReview = async (
  requestId: string, 
  approved: boolean,
  notes: string
) => {
  const result = await reviewInstructorRequest(requestId, approved, notes);
  // Send notification email
  // Update UI
};
```

## Security Best Practices

### 1. Never Trust Client-Side Role Checks
```typescript
// ❌ Bad: Client-side only
if (user.role === 'ADMIN') {
  showAdminPanel();
}

// ✅ Good: Server-side validation
const isAdmin = await validateAdminRole(userId);
if (isAdmin) {
  return adminData;
}
```

### 2. Always Validate on the Server
```typescript
// Server action example
export const sensitiveAction = async () => {
  const user = await currentUser();
  
  if (!user || user.role !== UserRole.ADMIN) {
    throw new Error("Unauthorized");
  }
  
  // Proceed with sensitive operation
};
```

### 3. Use Audit Logging
```typescript
// Log all sensitive operations
await logAuditEvent({
  action: "SENSITIVE_OPERATION",
  userId,
  details,
  timestamp: new Date()
});
```

### 4. Implement Rate Limiting
```typescript
// Prevent brute force attempts
const rateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000 // 15 minutes
});
```

### 5. Regular Security Audits
- Review user roles quarterly
- Check for orphaned admin accounts
- Monitor failed authentication attempts
- Review audit logs for suspicious activity

## Migration Guide

### For Existing Systems

1. **Backup Database**
   ```bash
   pg_dump database_name > backup.sql
   ```

2. **Run Migration**
   ```bash
   npx prisma migrate dev --name add_instructor_verification
   ```

3. **Update Existing Users**
   ```sql
   -- Set default instructor status for existing teachers
   UPDATE "User" 
   SET "instructorStatus" = 'VERIFIED' 
   WHERE role IN ('TEACHER', 'INSTRUCTOR');
   ```

4. **Deploy Security Updates**
   - Update settings action
   - Add admin role management
   - Update UI components
   - Deploy instructor verification system

## Testing

### Role Management Tests
```typescript
describe('Role Management', () => {
  test('Non-admin cannot change roles', async () => {
    const result = await changeUserRole(targetId, 'ADMIN');
    expect(result.error).toBe('Unauthorized: Admin access required');
  });
  
  test('Admin can change user roles', async () => {
    // Mock admin user
    const result = await changeUserRole(targetId, 'INSTRUCTOR');
    expect(result.success).toBeDefined();
  });
});
```

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Failed role change attempts** - Potential security breach
2. **Unusual admin activity** - Compromised admin account
3. **Mass role changes** - Potential automation attack
4. **Instructor verification queue** - Ensure timely reviews

### Alert Thresholds
```yaml
alerts:
  - name: "Suspicious Role Changes"
    condition: failed_role_changes > 10 in 5 minutes
    action: notify_security_team
    
  - name: "Admin Account Created"
    condition: new_admin_role_assigned
    action: notify_all_admins
```

## Support & Maintenance

### Common Issues

1. **User cannot access teacher features**
   - Check `instructorStatus` field
   - Verify role is `TEACHER` or `INSTRUCTOR`
   - Review audit logs for role changes

2. **Instructor application stuck**
   - Check `InstructorVerification` table
   - Review pending requests queue
   - Ensure admin notifications are working

3. **Role changes not persisting**
   - Verify database connection
   - Check for transaction rollbacks
   - Review error logs

### Contact

For security concerns or questions:
- Security Team: security@taxomind.com
- Admin Support: admin-support@taxomind.com
- Report vulnerabilities: security-bugs@taxomind.com

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready

## Appendix

### A. Role Permission Matrix

| Permission | ADMIN | INSTRUCTOR | MODERATOR | LEARNER |
|-----------|-------|------------|-----------|---------|
| Create Course | ✅ | ✅ | ❌ | ❌ |
| Delete Any Course | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| View Analytics | ✅ | ✅* | ❌ | ❌ |
| Moderate Content | ✅ | ❌ | ✅ | ❌ |
| Enroll in Courses | ✅ | ✅ | ✅ | ✅ |

*Limited to own courses

### B. Security Checklist

- [ ] Role changes require admin authentication
- [ ] Instructor verification system deployed
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] Email notifications working
- [ ] Admin panel secured
- [ ] Database backups scheduled
- [ ] Security monitoring active
- [ ] Incident response plan ready
- [ ] Regular security training conducted