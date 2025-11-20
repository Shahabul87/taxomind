import { auth } from "@/auth";
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