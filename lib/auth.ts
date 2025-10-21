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

export const currentRole = async () => {
  const session = await auth();

  // If we have a session but need to verify the user still exists
  if (session?.user?.id) {
    // Quick check if user exists in database
    const userExists = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!userExists) {
      console.warn(`[currentRole] Session contains non-existent user ID: ${session.user.id}`);
      return null;
    }

    // Return the actual role from database (in case it changed)
    return userExists.role;
  }

  return session?.user?.role;
};