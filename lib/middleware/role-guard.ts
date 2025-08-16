// Role-based access control middleware

import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export type UserRole = 'USER' | 'ADMIN';

export interface RoleRequirement {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export async function requireRole(requirement: RoleRequirement) {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user role - you'll need to adapt this based on your user model
  // For now, we'll assume all users are students unless they have specific roles
  const userRole = getUserRole(user);

  if (!requirement.allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on user role
    const redirectPath = getDefaultDashboard(userRole);
    redirect(requirement.redirectTo || redirectPath);
  }

  return user;
}

// Helper function to determine user role
function getUserRole(user: any): UserRole {
  // Check if user has role property
  if (user.role) {
    switch (user.role.toString().toUpperCase()) {
      case 'ADMIN':
        return 'ADMIN';
      case 'USER':
      default:
        return 'USER';
    }
  }

  // Legacy users: Check by email domain for admin
  if (user.email?.includes('@admin.') || user.email?.includes('admin@')) {
    return 'ADMIN';
  }

  // Default all users to USER role
  return 'USER';
}

// Get default dashboard for each role
function getDefaultDashboard(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'USER':
    default:
      return '/dashboard/user';
  }
}

// Role checking hook for components
export function useUserRole() {
  // This would be implemented as a React hook in a real application
  // For now, return a mock function
  return {
    hasRole: (role: UserRole) => true, // Mock implementation
    isAdmin: () => false,
    isUser: () => true
  };
}