# Taxomind Authentication Architecture

## Overview

Taxomind implements a **Google-style authentication system** that separates user roles from capabilities, providing a clean and scalable approach to access control.

### Core Principles

1. **Two Roles Only**: 
   - `ADMIN` - Platform administrators who manage the system
   - `USER` - Everyone else who uses the platform

2. **Multiple Capabilities**: Users can have different capabilities/contexts
   - `STUDENT` - Default capability for all users
   - `TEACHER` - Can create and manage courses
   - `AFFILIATE` - Can promote courses and earn commissions
   - `CONTENT_CREATOR` - Can create blog posts and articles
   - `MODERATOR` - Can moderate user-generated content
   - `REVIEWER` - Can review and rate courses

3. **Context Switching**: Users can switch between different contexts (like Google Workspace)
   - A user can be a student in one moment
   - Switch to teacher context to create courses
   - Switch to affiliate context to manage promotions

## Architecture Components

### 1. Role Management (`UserRole`)

```typescript
enum UserRole {
  ADMIN  // Platform administrators
  USER   // Regular users
}
```

**Admins**:
- Manage platform settings
- View system analytics
- Manage users and capabilities
- Access audit logs
- Configure security settings

**Users**:
- Access platform features based on capabilities
- Switch between different contexts
- Manage their own profile

### 2. Capability System (`UserCapability`)

Located in: `/lib/auth/capabilities.ts`

```typescript
enum UserCapability {
  STUDENT           // Learn from courses
  TEACHER           // Create courses
  AFFILIATE         // Promote courses
  CONTENT_CREATOR   // Create content
  MODERATOR         // Moderate content
  REVIEWER          // Review courses
}
```

**Key Features**:
- Capabilities are granted/revoked dynamically
- Some capabilities require approval
- Capabilities can have metadata (e.g., affiliate code)
- Full audit trail for capability changes

### 3. Context Manager

Located in: `/lib/auth/context-manager.ts`

**Purpose**: Manages user context switching and dashboard personalization

**Features**:
- Track active context per user
- Provide context-specific dashboard data
- Handle context switching
- Remember user preferences

### 4. Admin Management

Located in: `/lib/auth/admin-manager.ts`

**Admin Creation Strategies**:

1. **First User Strategy** (Development)
   ```bash
   FIRST_USER_IS_ADMIN=true
   ```
   The first user to register becomes admin

2. **Environment Email List**
   ```bash
   ADMIN_EMAILS=admin@example.com,owner@example.com
   ```
   Listed emails automatically become admins

3. **CLI Command**
   ```bash
   npm run admin:promote -- --email user@example.com
   ```

4. **Invitation System**
   - Admins can invite other admins
   - Time-limited invitation links
   - Secure token-based process

## Implementation Guide

### 1. Database Schema

```sql
-- User table (existing, with role field)
User {
  id: String
  role: UserRole (ADMIN | USER)
  isTeacher: Boolean  -- Legacy, maintained for compatibility
  isAffiliate: Boolean -- Legacy, maintained for compatibility
  ...
}

-- New UserCapability table
UserCapability {
  id: String
  userId: String
  capability: String
  isActive: Boolean
  activatedAt: DateTime
  deactivatedAt: DateTime
  metadata: JSON
}

-- New UserContext table
UserContext {
  id: String
  userId: String
  activeCapability: String
  preferences: JSON
}
```

### 2. Middleware Configuration

The middleware (`middleware.ts`) handles:

```typescript
// Role-based access
if (userRole === "ADMIN") {
  // Allow all routes
} else {
  // Check capability-based access
  if (route.startsWith("/teacher")) {
    requireCapability("TEACHER")
  }
}
```

### 3. API Endpoints

#### Capability Management
- `GET /api/auth/capabilities` - Get user capabilities
- `POST /api/auth/capabilities` - Grant capability
- `DELETE /api/auth/capabilities` - Revoke capability

#### Context Management
- `GET /api/auth/context` - Get current context
- `POST /api/auth/context` - Switch context

#### Admin Management
- `GET /api/admin/create` - Check admin status
- `POST /api/admin/create` - Admin operations

### 4. Frontend Integration

#### Dashboard Component

```tsx
// UnifiedDashboard.tsx
const UnifiedDashboard = ({ user }) => {
  const [context, setContext] = useState(null);
  
  // Fetch user context
  useEffect(() => {
    fetchContext().then(setContext);
  }, []);
  
  // Render based on context
  switch(context?.capability) {
    case "TEACHER":
      return <TeacherDashboard />;
    case "AFFILIATE":
      return <AffiliateDashboard />;
    default:
      return <StudentDashboard />;
  }
};
```

#### Context Switcher

```tsx
// Context switching UI
<DropdownMenu>
  <DropdownMenuTrigger>
    Switch Context
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {availableContexts.map(ctx => (
      <DropdownMenuItem onClick={() => switchContext(ctx)}>
        {ctx.label}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

## Migration Guide

### From Old System to New System

1. **Database Migration**
   ```bash
   # Run migration to create new tables
   npx prisma migrate dev --name add_capabilities
   
   # Run data migration script
   npm run migrate:capabilities
   ```

2. **Code Updates**
   - Replace role checks with capability checks
   - Update middleware to use new system
   - Update dashboards to support context switching

3. **Testing**
   ```bash
   # Test capability grants
   npm run test:capabilities
   
   # Test context switching
   npm run test:context
   
   # Test admin creation
   npm run test:admin
   ```

## Security Considerations

### 1. Capability Security
- Capabilities are stored in database, not JWT
- Each capability change is audited
- Some capabilities require admin approval
- Email verification required for most capabilities

### 2. Admin Security
- Multiple admin creation strategies for flexibility
- Cannot demote last admin
- Admin actions are fully audited
- MFA enforced for admin accounts

### 3. Context Security
- Context switches are validated server-side
- Users can only switch to capabilities they have
- Context preferences are user-specific
- No capability elevation through context switching

## Best Practices

### 1. Capability Management
```typescript
// ✅ Good: Check capability before granting access
if (await hasCapability(userId, UserCapability.TEACHER)) {
  // Allow course creation
}

// ❌ Bad: Check role for feature access
if (user.role === "USER" && user.isTeacher) {
  // Mixing concerns
}
```

### 2. Context Switching
```typescript
// ✅ Good: Use context manager
const context = await getCurrentContext(userId);
const dashboard = await getContextDashboardData(userId, context);

// ❌ Bad: Manual context tracking
if (session.teacherMode) {
  // Stateful context management
}
```

### 3. Admin Creation
```typescript
// ✅ Good: Use admin manager
const result = await promoteToAdmin(userId, promotedBy, reason);

// ❌ Bad: Direct database update
await db.user.update({ role: "ADMIN" });
```

## Troubleshooting

### Common Issues

1. **User can't access teacher routes**
   - Check if user has TEACHER capability
   - Verify email is verified
   - Check audit logs for capability grants

2. **Context switching not working**
   - Verify user has target capability
   - Check UserContext table
   - Review browser console for errors

3. **Admin can't be created**
   - Check if admin already exists
   - Verify environment variables
   - Check invitation token validity

### Debug Commands

```bash
# Check user capabilities
npm run debug:capabilities -- --user <userId>

# Check admin status
npm run debug:admin

# Reset user context
npm run debug:reset-context -- --user <userId>
```

## Future Enhancements

1. **Capability Groups**: Bundle related capabilities
2. **Temporary Capabilities**: Time-limited capabilities
3. **Capability Dependencies**: Require prerequisites
4. **Capability Marketplace**: Users can request/purchase capabilities
5. **Advanced Context**: Multiple active contexts
6. **Capability Analytics**: Track capability usage

## Conclusion

This Google-style authentication system provides:
- **Clean separation** between roles and capabilities
- **Flexible context switching** for different user activities
- **Scalable architecture** for future features
- **Strong security** with comprehensive audit trails
- **Great UX** with seamless context transitions

The system is designed to grow with the platform while maintaining simplicity and security.