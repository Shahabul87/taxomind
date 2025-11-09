# DELETE User API Crash Analysis

## 🚨 Critical Issue Summary

The delete button in `/dashboard/admin/users` is returning **401 Unauthorized** errors, causing the operation to fail.

## 📊 Evidence from Server Logs

```log
DELETE /api/admin/users 401 in 555ms
DELETE /api/admin/users 401 in 27ms
```

## 🔍 Root Causes Identified

### 1. **Authentication System Mismatch** (CRITICAL)
**File**: `app/api/admin/users/route.ts:443`
**Problem**: The API route uses `withRole(UserRole.ADMIN, ...)` which depends on:
- `lib/api-protection.ts` → calls `currentUser()` and `currentRole()`
- `lib/auth.ts` → calls `auth()` from `@/auth` (NextAuth regular session)

**However**, the admin dashboard uses a **separate authentication system**:
- Admin login at `/admin/auth/login` creates admin-specific JWT tokens
- Stored in `admin-session-token` cookie
- Validated using `auth.admin.ts` and `lib/auth/admin-jwt.ts`

**Result**: When the DELETE request is made:
1. Admin is logged in with admin JWT token
2. API endpoint checks for regular NextAuth session
3. No regular session found → 401 Unauthorized

### 2. **Missing Admin Auth Check in API Protection**
**File**: `lib/api-protection.ts:20-25`
**Problem**: The `requireAuth()` function only checks regular user session:
```typescript
export async function requireAuth() {
  const user = await currentUser(); // Only checks regular NextAuth
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }
  return user;
}
```

**Missing**: Check for admin JWT token from `adminAuth()` function

### 3. **No Fallback to Admin Session**
**File**: `lib/api-protection.ts:92-119`
**Problem**: `withRole()` wrapper doesn't attempt admin authentication:
```typescript
export function withRole<T extends any[]>(
  allowedRoles: UserRole | UserRole[],
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      await requireRole(allowedRoles); // Only checks regular session
      return await handler(...args);
    } catch (error: any) {
      // Returns 401 if no regular session found
    }
  };
}
```

## 🛠️ Required Fixes

### Fix 1: Add Admin Auth Support to `requireAuth()`
**File**: `lib/api-protection.ts`
**Solution**: Check both regular session AND admin session

```typescript
import { currentUser, currentRole } from "@/lib/auth";
import { adminAuth } from "@/auth.admin"; // Add admin auth import

export async function requireAuth() {
  // Try regular user session first
  let user = await currentUser();

  // If no regular session, try admin session
  if (!user) {
    try {
      const adminSession = await adminAuth();
      if (adminSession?.user) {
        return adminSession.user;
      }
    } catch (error) {
      // Admin session check failed, continue to throw error
    }
  }

  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }

  return user;
}
```

### Fix 2: Add Admin Role Check to `requireRole()`
**File**: `lib/api-protection.ts`
**Solution**: Check both regular role AND admin role

```typescript
export async function requireRole(allowedRoles: UserRole | UserRole[]) {
  const user = await requireAuth();
  let role = await currentRole();

  // If no regular role, try admin role
  if (!role) {
    try {
      const adminSession = await adminAuth();
      role = adminSession?.user?.role;
    } catch (error) {
      // Admin role check failed
    }
  }

  if (!role) {
    throw new UnauthorizedError("Role not found");
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(role)) {
    throw new ForbiddenError(`Access denied. Required role: ${roles.join(" or ")}`);
  }

  return { user, role };
}
```

### Fix 3: Enhanced Error Logging
**File**: `app/api/admin/users/route.ts`
**Solution**: Add detailed logging for debugging

```typescript
export const DELETE = withRole(UserRole.ADMIN, async (request: NextRequest) => {
  console.log("[DELETE /api/admin/users] Request received");

  try {
    const body = await request.json();
    console.log("[DELETE /api/admin/users] Request body:", body);

    const { userId } = body;

    if (!userId) {
      console.log("[DELETE /api/admin/users] Missing userId in request");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "User ID is required",
          },
        },
        { status: 400 }
      );
    }

    console.log("[DELETE /api/admin/users] Checking if user exists:", userId);

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("[DELETE /api/admin/users] User not found:", userId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
        },
        { status: 404 }
      );
    }

    console.log("[DELETE /api/admin/users] Deleting user:", userId);

    // Delete user (cascade delete will handle related records)
    await db.user.delete({
      where: { id: userId },
    });

    console.log("[DELETE /api/admin/users] User deleted successfully:", userId);

    return NextResponse.json({
      success: true,
      data: { message: "User deleted successfully" },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error("[DELETE /api/admin/users] Error deleting user:", error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An error occurred while deleting the user",
          details: process.env.NODE_ENV === "development" ? {
            error: error instanceof Error ? error.message : String(error)
          } : undefined
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          version: "1.0.0",
        },
      },
      { status: 500 }
    );
  }
});
```

## 🧪 Additional Issues to Fix

### Issue 4: Missing Database Cascade Constraints
**Risk**: Deleting a user may leave orphaned records
**Solution**: Verify Prisma schema has proper cascade delete configured

### Issue 5: No User Protection
**Risk**: Admin could accidentally delete themselves or other admins
**Solution**: Add protection to prevent deleting current user or other admins

```typescript
// Check if user is trying to delete themselves
const currentAdminUser = await requireAuth();
if (userId === currentAdminUser.id) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Cannot delete your own account",
      },
    },
    { status: 403 }
  );
}

// Prevent deleting other admin users (optional, based on requirements)
if (user.role === UserRole.ADMIN) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Cannot delete admin users",
      },
    },
    { status: 403 }
  );
}
```

## 📝 Testing Checklist

After implementing fixes:
- [ ] Admin can delete regular users
- [ ] Admin cannot delete themselves
- [ ] Admin cannot delete other admins (if implemented)
- [ ] Proper error messages shown in UI
- [ ] No orphaned database records after deletion
- [ ] Audit logs created for deletion (if applicable)
- [ ] 401 errors no longer occur

## 🎯 Priority

**CRITICAL** - This breaks core admin functionality and must be fixed immediately.

## 📅 Created

2025-10-12

## 🔗 Related Files

- `app/api/admin/users/route.ts` - API endpoint
- `lib/api-protection.ts` - Authentication middleware
- `lib/auth.ts` - Regular user auth
- `auth.admin.ts` - Admin auth system
- `app/dashboard/admin/users/users-client.tsx` - Frontend delete button
