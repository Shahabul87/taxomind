/**
 * Superadmin Auto-Initializer
 *
 * Creates the superadmin account in the AdminAccount table on app startup.
 * Reads credentials from environment variables:
 *   SUPERADMIN_EMAIL    - Required
 *   SUPERADMIN_PASSWORD - Required
 *   SUPERADMIN_NAME     - Optional (defaults to "Super Admin")
 *
 * This module is idempotent:
 *   - Only creates the account if one doesn't exist
 *   - Ensures emailVerified is set for existing accounts
 *   - Re-hashes the password if the env var password has changed
 *   - Resets createdAt for accounts without MFA (refreshes grace period)
 */

import { db } from "@/lib/db";

interface InitResult {
  created: boolean;
  exists: boolean;
  fixed?: boolean;
  passwordUpdated?: boolean;
}

export async function ensureSuperadminExists(
  email: string,
  password: string,
  name?: string,
): Promise<InitResult> {
  const { hash, compare } = await import("bcryptjs");

  // Check if superadmin already exists
  const existingAdmin = await db.adminAccount.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
      emailVerified: true,
      isTwoFactorEnabled: true,
      totpEnabled: true,
      totpVerified: true,
      createdAt: true,
    },
  });

  if (existingAdmin) {
    const updates: Record<string, unknown> = {};
    let fixed = false;
    let passwordUpdated = false;

    // Fix emailVerified if missing
    if (!existingAdmin.emailVerified) {
      updates.emailVerified = new Date();
      fixed = true;
    }

    // Check if password from env var matches stored hash
    // If not, re-hash (supports password rotation via env vars)
    if (existingAdmin.password) {
      const passwordMatches = await compare(password, existingAdmin.password);
      if (!passwordMatches) {
        updates.password = await hash(password, 12);
        passwordUpdated = true;
      }
    } else {
      // No password set — hash and store
      updates.password = await hash(password, 12);
      passwordUpdated = true;
    }

    // Reset createdAt for accounts without MFA to refresh the grace period
    // This prevents the MFA enforcement from blocking login before MFA can be set up
    const hasMFA = existingAdmin.isTwoFactorEnabled && existingAdmin.totpEnabled && existingAdmin.totpVerified;
    if (!hasMFA) {
      const accountAgeDays = Math.floor((Date.now() - existingAdmin.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (accountAgeDays > 5) {
        updates.createdAt = new Date();
        fixed = true;
        console.log('[Admin] Resetting grace period for superadmin (MFA not configured, account age:', accountAgeDays, 'days)');
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.adminAccount.update({
        where: { email },
        data: updates,
      });
    }

    return { created: false, exists: true, fixed, passwordUpdated };
  }

  // Create new superadmin account
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
