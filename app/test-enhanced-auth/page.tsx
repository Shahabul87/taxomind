"use client";

import { useCurrentUser, useCurrentRole, useHasPermission } from "@/hooks/use-enhanced-auth";
import { AdminGuard, UserGuard, UserOrAdminGuard, PermissionGuard, RoleBadge } from "@/components/auth/enhanced-role-guard";
import { UserRole, Permission } from "@/types/auth";
import { getRolePermissions } from "@/lib/auth/permissions";
import Link from 'next/link';

export default function TestEnhancedAuth() {
  const { user, loading, authenticated } = useCurrentUser();
  const currentRole = useCurrentRole();
  
  const canCreateCourse = useHasPermission(Permission.CREATE_COURSE);
  const canManageUsers = useHasPermission(Permission.CREATE_USER);
  const canAccessAdmin = useHasPermission(Permission.ACCESS_ADMIN_PANEL);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <Link href="/auth/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const userPermissions = currentRole ? getRolePermissions(currentRole) : [];

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          🔐 Enhanced Role-Based Authentication Test
          {currentRole && <RoleBadge role={currentRole} />}
        </h1>
        
        {/* User Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">👤 User Information</h2>
            <div className="space-y-2">
              <p><strong>ID:</strong> {user?.id}</p>
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {currentRole}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">🛡️ Permission Check</h2>
            <div className="space-y-2">
              <p><strong>Can Create Courses:</strong> {canCreateCourse ? "✅ Yes" : "❌ No"}</p>
              <p><strong>Can Manage Users:</strong> {canManageUsers ? "✅ Yes" : "❌ No"}</p>
              <p><strong>Can Access Admin Panel:</strong> {canAccessAdmin ? "✅ Yes" : "❌ No"}</p>
              <p><strong>Total Permissions:</strong> {userPermissions.length}</p>
            </div>
          </div>
        </div>

        {/* All User Permissions */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">📋 Your Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {userPermissions.map((permission) => (
              <span 
                key={permission} 
                className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm border border-green-200"
              >
                {permission.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
          {userPermissions.length === 0 && (
            <p className="text-gray-500 italic">No permissions assigned</p>
          )}
        </div>

        {/* Role-based Content Testing */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">🎯 Role-based Content Testing</h2>
          
          {/* Admin Only Section */}
          <div className="border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">👑 Admin Only Section</h3>
            <AdminGuard fallback={<p className="text-red-600 italic">❌ Access denied - Admin role required</p>}>
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <p className="text-red-800">✅ Welcome Admin! You can see this content.</p>
                <div className="mt-2 space-x-2">
                  <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                    Manage Users
                  </button>
                  <button className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600">
                    System Settings
                  </button>
                </div>
              </div>
            </AdminGuard>
          </div>

          {/* User Section */}
          <div className="border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">👤 User Section</h3>
            <UserGuard fallback={<p className="text-green-600 italic">❌ Access denied - User role required</p>}>
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-green-800">✅ Welcome User! You can manage your content.</p>
                <div className="mt-2 space-x-2">
                  <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                    Create Course
                  </button>
                  <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                    View Analytics
                  </button>
                </div>
              </div>
            </UserGuard>
          </div>

          {/* User or Admin Section */}
          <div className="border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">👥 User or Admin Section</h3>
            <UserOrAdminGuard fallback={<p className="text-blue-600 italic">❌ Access denied - User or Admin role required</p>}>
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <p className="text-blue-800">✅ Welcome! You have access to this content.</p>
                <div className="mt-2 space-x-2">
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    View Content
                  </button>
                  <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                    Manage Resources
                  </button>
                </div>
              </div>
            </UserOrAdminGuard>
          </div>

          {/* Permission-based Section */}
          <div className="border border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🔑 Permission-based Section</h3>
            
            <div className="space-y-3">
              <PermissionGuard 
                permissions={[Permission.CREATE_COURSE]} 
                fallback={<p className="text-purple-600 italic">❌ You don&apos;t have permission to create courses</p>}
              >
                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                  <p className="text-purple-800">✅ You can create courses!</p>
                  <button className="mt-2 px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">
                    Create New Course
                  </button>
                </div>
              </PermissionGuard>

              <PermissionGuard 
                permissions={[Permission.MANAGE_SETTINGS]} 
                fallback={<p className="text-purple-600 italic">❌ You don&apos;t have permission to manage settings</p>}
              >
                <div className="bg-purple-50 p-3 rounded border border-purple-200">
                  <p className="text-purple-800">✅ You can manage system settings!</p>
                  <button className="mt-2 px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600">
                    System Settings
                  </button>
                </div>
              </PermissionGuard>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 p-4 rounded-lg mt-6">
          <h3 className="text-lg font-semibold mb-3">🚀 Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/user" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Dashboard
            </Link>
            <Link href="/courses" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Courses
            </Link>
            {canCreateCourse && (
              <Link href="/teacher/create" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                Create Course
              </Link>
            )}
            {canAccessAdmin && (
              <Link href="/admin/dashboard" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Admin Panel
              </Link>
            )}
            <Link href="/auth/login" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
              Login as Different User
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}