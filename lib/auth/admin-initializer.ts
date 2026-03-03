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
 *   - Migrates legacy bcrypt hashes to noble/scrypt format
 *   - Resets createdAt for accounts without MFA (refreshes grace period)
 *
 * IMPORTANT: Uses hashPassword/verifyPassword from passwordUtils.ts
 * to ensure consistent noble/scrypt hash format across the entire system.
 */

import { db } from "@/lib/db";
import { hashPassword, verifyPassword, needsRehashing } from "@/lib/passwordUtils";
import { logger } from "@/lib/logger";

interface InitResult {
  created: boolean;
  exists: boolean;
  fixed?: boolean;
  passwordUpdated?: boolean;
  hashMigrated?: boolean;
}

export async function ensureSuperadminExists(
  email: string,
  password: string,
  name?: string,
): Promise<InitResult> {
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
    let hashMigrated = false;

    // Fix emailVerified if missing
    if (!existingAdmin.emailVerified) {
      updates.emailVerified = new Date();
      fixed = true;
      logger.info('[Admin] Fixing missing emailVerified for superadmin');
    }

    // Check if password from env var matches stored hash
    // Uses verifyPassword which handles both noble/scrypt and bcrypt formats
    if (existingAdmin.password) {
      const passwordMatches = await verifyPassword(password, existingAdmin.password);
      if (!passwordMatches) {
        // Password changed in env vars — re-hash with noble/scrypt
        updates.password = await hashPassword(password);
        passwordUpdated = true;
        logger.info('[Admin] Password changed in env vars - re-hashing');
      } else if (needsRehashing(existingAdmin.password)) {
        // Password matches but stored in legacy bcrypt format — migrate to noble/scrypt
        updates.password = await hashPassword(password);
        hashMigrated = true;
        logger.info('[Admin] Migrating password hash from bcrypt to noble/scrypt');
      }
    } else {
      // No password set — hash and store
      updates.password = await hashPassword(password);
      passwordUpdated = true;
      logger.info('[Admin] No password set - storing hashed password');
    }

    // Reset createdAt for accounts without MFA to refresh the grace period
    // This prevents the MFA enforcement from blocking login before MFA can be set up
    const hasMFA = existingAdmin.isTwoFactorEnabled && existingAdmin.totpEnabled && existingAdmin.totpVerified;
    if (!hasMFA) {
      const accountAgeDays = Math.floor((Date.now() - existingAdmin.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (accountAgeDays > 5) {
        updates.createdAt = new Date();
        fixed = true;
        logger.info('[Admin] Resetting grace period for superadmin', { mfaConfigured: false, accountAgeDays });
      }
    }

    if (Object.keys(updates).length > 0) {
      await db.adminAccount.update({
        where: { email },
        data: updates,
      });
      logger.info('[Admin] Superadmin account updated', {
        emailVerifiedFixed: !existingAdmin.emailVerified,
        passwordUpdated,
        hashMigrated,
      });
    }

    return { created: false, exists: true, fixed, passwordUpdated, hashMigrated };
  }

  // Create new superadmin account with noble/scrypt hash
  const hashedPassword = await hashPassword(password);

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

  logger.info('[Admin] Superadmin account created');
  return { created: true, exists: false };
}
