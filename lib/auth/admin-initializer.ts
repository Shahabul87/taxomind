/**
 * Superadmin Auto-Initializer
 *
 * Creates the superadmin account in the AdminAccount table on app startup.
 * Reads credentials from environment variables:
 *   SUPERADMIN_EMAIL    - Required
 *   SUPERADMIN_PASSWORD - Required
 *   SUPERADMIN_NAME     - Optional (defaults to "Super Admin")
 *
 * This module is idempotent — it only creates the account if one doesn't exist.
 * It also ensures emailVerified is set for existing accounts.
 */

import { db } from "@/lib/db";

interface InitResult {
  created: boolean;
  exists: boolean;
  fixed?: boolean;
}

export async function ensureSuperadminExists(
  email: string,
  password: string,
  name?: string,
): Promise<InitResult> {
  // Check if superadmin already exists
  const existingAdmin = await db.adminAccount.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });

  if (existingAdmin) {
    // Fix emailVerified if missing (ensures login works)
    if (!existingAdmin.emailVerified) {
      await db.adminAccount.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
      return { created: false, exists: true, fixed: true };
    }
    return { created: false, exists: true };
  }

  // Hash password using bcryptjs (same format the seed script uses)
  const { hash } = await import("bcryptjs");
  const hashedPassword = await hash(password, 12);

  await db.adminAccount.create({
    data: {
      email,
      password: hashedPassword,
      name: name || "Super Admin",
      role: "SUPERADMIN",
      emailVerified: new Date(),
      isTwoFactorEnabled: false,
    },
  });

  return { created: true, exists: false };
}
