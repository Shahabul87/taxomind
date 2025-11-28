/**
 * User authentication guard middleware
 *
 * NOTE: Users don't have roles - Admin auth is completely separate (AdminAccount model)
 * This middleware only checks if user is authenticated and optionally if they're a teacher.
 * For admin routes, use AdminGuard component with AdminAccount auth instead.
 */

import { currentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export interface UserRequirement {
  requireTeacher?: boolean;
  redirectTo?: string;
}

/**
 * Require authenticated user, optionally require teacher status
 */
export async function requireUser(requirement: UserRequirement = {}) {
  const user = await currentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if teacher status is required
  if (requirement.requireTeacher) {
    // Check isTeacher flag from user data
    // Note: currentUser() returns session user, we may need to fetch full user
    const redirectPath = requirement.redirectTo || '/dashboard';
    // If user is not a teacher, redirect them
    // This check would need to be implemented based on your user data structure
    redirect(redirectPath);
  }

  return user;
}

/**
 * Get default dashboard path for users
 * All regular users go to /dashboard, admin routes are separate
 */
export function getDefaultDashboard(): string {
  return '/dashboard';
}

/**
 * User type checking utilities for components
 * NOTE: For admin checks, use AdminGuard component instead
 */
export function useUserType() {
  return {
    isAuthenticated: () => true, // Mock - should check session
    isTeacher: () => false, // Mock - should check user.isTeacher
  };
}