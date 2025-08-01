# Role-Based Authentication Implementation Guide

## 🎯 Current Implementation Status

### ✅ What's Working:
- **NextAuth v5** properly configured with JWT strategy
- **Role information** stored in JWT tokens and database
- **Basic middleware** with role checking
- **Typed user roles** with Prisma schema

### ✅ What We've Enhanced:
- **Permission-based access control** system
- **Enterprise-grade role guards** (React components)
- **Comprehensive hooks** for role/permission checking
- **Type-safe role management**
- **Testing infrastructure**

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Database      │    │   Auth System    │    │   Frontend      │
│                 │    │                  │    │                 │
│ User.role       │───▶│ JWT Token        │───▶│ useCurrentRole  │
│ UserRole enum   │    │ Session          │    │ RoleGuard       │
│                 │    │ Middleware       │    │ PermissionGuard │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Permissions    │
                       │                  │
                       │ ROLE_PERMISSIONS │
                       │ hasPermission()  │
                       │ Access Control   │
                       └──────────────────┘
```

## 🔧 How to Use

### 1. **Check User Role (Client-side)**

```typescript
import { useCurrentRole } from "@/hooks/use-enhanced-auth";
import { UserRole } from "@/types/auth";

function MyComponent() {
  const role = useCurrentRole();
  
  return (
    <div>
      {role === UserRole.ADMIN && <AdminButton />}
      {role === UserRole.TEACHER && <TeacherButton />}
      {role === UserRole.STUDENT && <StudentButton />}
    </div>
  );
}
```

### 2. **Check Permissions (Client-side)**

```typescript
import { useHasPermission } from "@/hooks/use-enhanced-auth";
import { Permission } from "@/types/auth";

function CourseActions() {
  const canCreateCourse = useHasPermission(Permission.CREATE_COURSE);
  const canManageUsers = useHasPermission(Permission.CREATE_USER);
  
  return (
    <div>
      {canCreateCourse && <CreateCourseButton />}
      {canManageUsers && <ManageUsersButton />}
    </div>
  );
}
```

### 3. **Role Guards (Components)**

```typescript
import { AdminGuard, TeacherGuard, PermissionGuard } from "@/components/auth/enhanced-role-guard";
import { Permission } from "@/types/auth";

function Dashboard() {
  return (
    <div>
      <AdminGuard fallback={<div>Admin access required</div>}>
        <AdminPanel />
      </AdminGuard>
      
      <TeacherGuard fallback={<div>Teacher access required</div>}>
        <TeacherDashboard />
      </TeacherGuard>
      
      <PermissionGuard 
        permissions={[Permission.CREATE_COURSE]}
        fallback={<div>No permission to create courses</div>}
      >
        <CreateCourseForm />
      </PermissionGuard>
    </div>
  );
}
```

### 4. **Server-side Protection**

```typescript
// In page.tsx or API route
import { currentRole } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const role = await currentRole();
  
  if (role !== UserRole.ADMIN) {
    redirect("/unauthorized");
  }
  
  return <AdminContent />;
}
```

### 5. **API Route Protection**

```typescript
// app/api/admin/route.ts
import { currentUser, currentRole } from "@/lib/auth";
import { UserRole } from "@/types/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await currentUser();
  const role = await currentRole();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  if (role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  // Admin-only logic here
  return NextResponse.json({ data: "admin data" });
}
```

## 🎭 Role & Permission Matrix

| Role | Permissions | Access Level |
|------|-------------|--------------|
| **ADMIN** | All permissions | Full system access |
| **TEACHER** | CREATE_COURSE, EDIT_COURSE, DELETE_COURSE, PUBLISH_COURSE, VIEW_ANALYTICS, MODERATE_CONTENT | Course management + own content |
| **STUDENT** | VIEW_ANALYTICS | Basic learning access + own progress |

### Permission Details:

#### **Course Management**
- `CREATE_COURSE` - Create new courses
- `EDIT_COURSE` - Modify course content
- `DELETE_COURSE` - Remove courses
- `PUBLISH_COURSE` - Publish courses for students
- `VIEW_ALL_COURSES` - See all courses in system

#### **User Management**
- `CREATE_USER` - Add new users
- `EDIT_USER` - Modify user details
- `DELETE_USER` - Remove users
- `ASSIGN_ROLES` - Change user roles
- `VIEW_ALL_USERS` - Access user directory

#### **Analytics & Data**
- `VIEW_ANALYTICS` - See own analytics
- `VIEW_ALL_ANALYTICS` - See system-wide analytics
- `EXPORT_DATA` - Export system data

#### **Content & Moderation**
- `MODERATE_CONTENT` - Review and moderate content
- `APPROVE_CONTENT` - Approve pending content

#### **System Administration**
- `MANAGE_SETTINGS` - Configure system settings
- `ACCESS_ADMIN_PANEL` - Access admin dashboard

## 📊 Testing Your Implementation

### 1. **Test Pages Available:**
- `/test-auth-roles` - Basic auth testing
- `/test-enhanced-auth` - Comprehensive role/permission testing

### 2. **Test API Endpoints:**
- `GET /api/test-auth` - Check current user auth status
- `POST /api/test-auth` - Test admin-only operation

### 3. **Manual Testing Checklist:**

```bash
# 1. Test unauthenticated access
curl http://localhost:3000/api/test-auth
# Should return 401 Unauthorized

# 2. Test role-based page access
# Visit /test-enhanced-auth when logged in as different roles

# 3. Test middleware protection
# Try accessing /admin routes with different roles

# 4. Test component guards
# Check if role guards show/hide content correctly
```

## 🚀 Quick Setup Guide

### 1. **Add to your component:**

```typescript
import { TeacherGuard } from "@/components/auth/enhanced-role-guard";
import { useHasPermission } from "@/hooks/use-enhanced-auth";
import { Permission } from "@/types/auth";

function MyCourseComponent() {
  const canEdit = useHasPermission(Permission.EDIT_COURSE);
  
  return (
    <div>
      <h1>My Course</h1>
      
      <TeacherGuard fallback={<p>Teacher access required</p>}>
        <TeacherActions />
      </TeacherGuard>
      
      {canEdit && <EditButton />}
    </div>
  );
}
```

### 2. **Protect your API routes:**

```typescript
import { currentRole } from "@/lib/auth";
import { UserRole } from "@/types/auth";

export async function POST() {
  const role = await currentRole();
  
  if (role !== UserRole.TEACHER && role !== UserRole.ADMIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  // Your teacher/admin logic here
}
```

### 3. **Use in pages:**

```typescript
import { requireAnyRole } from "@/lib/auth/enhanced-auth";
import { UserRole } from "@/types/auth";

export default async function TeacherCoursePage() {
  // Automatically redirects if user doesn't have required role
  await requireAnyRole([UserRole.TEACHER, UserRole.ADMIN]);
  
  return <TeacherCourseContent />;
}
```

## 🔍 Debugging Tips

### 1. **Check Current User State:**
```typescript
import { useCurrentUser } from "@/hooks/use-enhanced-auth";

function DebugAuth() {
  const { user, loading, authenticated } = useCurrentUser();
  
  console.log('Auth State:', { user, loading, authenticated });
  
  return <div>Check console for auth state</div>;
}
```

### 2. **Verify Permissions:**
```typescript
import { getRolePermissions } from "@/lib/auth/permissions";
import { UserRole } from "@/types/auth";

// Check what permissions a role has
const adminPermissions = getRolePermissions(UserRole.ADMIN);
console.log('Admin permissions:', adminPermissions);
```

### 3. **Test Middleware:**
- Check browser Network tab for redirect responses
- Look for 307 redirects to `/auth/login` for protected routes
- Verify middleware logs in development console

## 🎯 Summary

**You now have a complete enterprise-grade role-based authentication system with:**

✅ **Clear role hierarchy** (Admin > Teacher > Student)  
✅ **Permission-based access control**  
✅ **Type-safe implementation**  
✅ **Client & server-side protection**  
✅ **React components for UI guards**  
✅ **Comprehensive testing tools**  
✅ **Easy-to-use hooks and utilities**  

**Test it now:**
1. Visit `/test-enhanced-auth` to see role-based content
2. Try `/api/test-auth` to check API protection
3. Create a test user with different roles to see the differences!

Your LMS now has bulletproof role-based authentication! 🚀