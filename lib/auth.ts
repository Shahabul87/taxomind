import 'server-only';

import { auth } from "@/auth";
import { adminAuth } from "@/auth.admin";
import { db } from "@/lib/db";

export const currentUser = async () => {
  const session = await auth();

  // If we have a session but need to verify the user still exists
  if (session?.user?.id) {
    // Quick check if user exists in database
    const userExists = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!userExists) {
      console.warn(`[currentUser] Session contains non-existent user ID: ${session.user.id}`);
      console.warn('User should clear cookies and log in again.');
      return null; // Return null to indicate no valid user
    }
  }

  return session?.user;
};

/**
 * @deprecated Users no longer have roles. Admin authentication is separate.
 * Use isTeacher flag or check against admin auth system instead.
 */
export const currentRole = async () => {
  console.warn('[currentRole] DEPRECATED: Users no longer have roles. Admin auth is separate.');
  return null;
};

/**
 * Get the current authenticated user - checks BOTH regular user AND admin auth systems.
 * Use this function when you need to support both user types (e.g., SAM AI Assistant).
 *
 * @returns User object with id, name, email, and isAdmin flag
 */
export const currentUserOrAdmin = async (): Promise<{
  id: string;
  name?: string | null;
  email?: string | null;
  isAdmin: boolean;
} | null> => {
  // First, try regular user auth
  const userSession = await auth();

  if (userSession?.user?.id) {
    // Verify user exists in database
    const userExists = await db.user.findUnique({
      where: { id: userSession.user.id },
      select: { id: true, name: true, email: true }
    });

    if (userExists) {
      return {
        id: userExists.id,
        name: userExists.name,
        email: userExists.email,
        isAdmin: false,
      };
    }
  }

  // If no regular user, try admin auth
  const adminSession = await adminAuth();

  if (adminSession?.user?.id) {
    // Verify admin exists in database
    const adminExists = await db.adminAccount.findUnique({
      where: { id: adminSession.user.id },
      select: { id: true, name: true, email: true }
    });

    if (adminExists) {
      return {
        id: adminExists.id,
        name: adminExists.name,
        email: adminExists.email,
        isAdmin: true,
      };
    }
  }

  return null;
};