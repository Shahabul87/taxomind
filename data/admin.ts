import { db } from "@/lib/db";

/**
 * Get admin account by ID
 */
export const getAdminAccountById = async (id: string) => {
  try {
    const admin = await db.adminAccount.findUnique({
      where: { id },
    });

    return admin;
  } catch {
    return null;
  }
};

/**
 * Get admin account by email
 */
export const getAdminAccountByEmail = async (email: string) => {
  try {
    const admin = await db.adminAccount.findUnique({
      where: { email },
    });

    return admin;
  } catch {
    return null;
  }
};

/**
 * Check if an email exists in AdminAccount
 */
export const adminEmailExists = async (email: string): Promise<boolean> => {
  try {
    const admin = await db.adminAccount.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!admin;
  } catch {
    return false;
  }
};
