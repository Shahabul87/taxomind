/**
 * Admin Account Seed Script
 *
 * This script creates or verifies the superadmin account.
 * Safe to run on production — idempotent, no data loss.
 *
 * Reads credentials from environment variables:
 *   SUPERADMIN_EMAIL    - Superadmin email address
 *   SUPERADMIN_PASSWORD - Superadmin password
 *   SUPERADMIN_NAME     - Superadmin display name (optional)
 *
 * Usage:
 *   Local:   npx tsx scripts/seed-admin.ts
 *   Railway: railway run npx tsx scripts/seed-admin.ts
 *
 * Modes:
 *   Default:    Creates or verifies superadmin, migrates hash to noble/scrypt
 *   --verify:   Only checks if admin exists and password matches (no changes)
 *   --diagnose: Full diagnostic output for debugging production issues
 */

import { PrismaClient, AdminRole } from "@prisma/client";
import { scrypt } from "@noble/hashes/scrypt";
import { randomBytes } from "@noble/hashes/utils";

const prisma = new PrismaClient();

// --- Password utilities (standalone, no app imports for script portability) ---

const encodeBase64 = (bytes: Uint8Array): string => Buffer.from(bytes).toString("base64");
const decodeBase64 = (str: string): Uint8Array => new Uint8Array(Buffer.from(str, "base64"));

async function hashPasswordNoble(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = scrypt(password, salt, { N: 16384, r: 8, p: 1, dkLen: 32 });
  return `noble:${encodeBase64(salt)}:${encodeBase64(hash)}`;
}

function verifyNobleHash(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "noble") return false;
  const salt = decodeBase64(parts[1]);
  const storedHash = decodeBase64(parts[2]);
  const computed = scrypt(password, salt, { N: 16384, r: 8, p: 1, dkLen: 32 });
  if (computed.length !== storedHash.length) return false;
  let result = 0;
  for (let i = 0; i < computed.length; i++) result |= computed[i] ^ storedHash[i];
  return result === 0;
}

async function verifyBcryptHash(password: string, stored: string): Promise<boolean> {
  try {
    const bcrypt = await import("bcryptjs");
    const compare = bcrypt.compare || bcrypt.default?.compare;
    if (!compare) return false;
    return await compare(password, stored);
  } catch {
    return false;
  }
}

async function verifyAnyHash(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("noble:")) return verifyNobleHash(password, stored);
  if (stored.match(/^\$2[aby]\$/)) return await verifyBcryptHash(password, stored);
  return false;
}

// --- CLI args ---
const args = process.argv.slice(2);
const isVerifyOnly = args.includes("--verify");
const isDiagnose = args.includes("--diagnose");

// --- Env vars ---
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;
const SUPERADMIN_NAME = process.env.SUPERADMIN_NAME || "Super Admin";

async function main() {
  console.log("=== Admin Account Seed Script ===\n");

  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    console.error("Missing required environment variables:");
    if (!SUPERADMIN_EMAIL) console.error("  - SUPERADMIN_EMAIL is not set");
    if (!SUPERADMIN_PASSWORD) console.error("  - SUPERADMIN_PASSWORD is not set");
    console.error("\nUsage:");
    console.error("  SUPERADMIN_EMAIL=admin@example.com SUPERADMIN_PASSWORD=your-password npx tsx scripts/seed-admin.ts");
    process.exit(1);
  }

  console.log(`Email: ${SUPERADMIN_EMAIL}`);
  console.log(`Mode:  ${isDiagnose ? "DIAGNOSE" : isVerifyOnly ? "VERIFY" : "SEED"}\n`);

  try {
    // Check if superadmin already exists
    const existingAdmin = await prisma.adminAccount.findUnique({
      where: { email: SUPERADMIN_EMAIL },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        emailVerified: true,
        isTwoFactorEnabled: true,
        totpEnabled: true,
        totpVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (existingAdmin) {
      const hashFormat = existingAdmin.password?.startsWith("noble:") ? "noble/scrypt"
        : existingAdmin.password?.match(/^\$2[aby]\$/) ? "bcrypt (legacy)"
        : "unknown";
      const passwordMatches = existingAdmin.password
        ? await verifyAnyHash(SUPERADMIN_PASSWORD, existingAdmin.password)
        : false;

      console.log("Admin account found:");
      console.log(`  ID:              ${existingAdmin.id}`);
      console.log(`  Email:           ${existingAdmin.email}`);
      console.log(`  Name:            ${existingAdmin.name || "(not set)"}`);
      console.log(`  Role:            ${existingAdmin.role}`);
      console.log(`  Email Verified:  ${existingAdmin.emailVerified ? "YES" : "NO"}`);
      console.log(`  2FA Enabled:     ${existingAdmin.isTwoFactorEnabled ? "YES" : "NO"}`);
      console.log(`  TOTP Configured: ${existingAdmin.totpEnabled && existingAdmin.totpVerified ? "YES" : "NO"}`);
      console.log(`  Hash Format:     ${hashFormat}`);
      console.log(`  Password Match:  ${passwordMatches ? "YES" : "NO"}`);
      console.log(`  Created:         ${existingAdmin.createdAt}`);
      console.log(`  Updated:         ${existingAdmin.updatedAt}`);

      if (isDiagnose) {
        console.log(`\n--- Diagnostic Detail ---`);
        console.log(`  Hash preview:    ${existingAdmin.password?.substring(0, 15)}...`);
        console.log(`  Hash length:     ${existingAdmin.password?.length || 0}`);
        const activeSessions = await prisma.adminActiveSession.count({
          where: { adminAccountId: existingAdmin.id, isActive: true },
        });
        console.log(`  Active Sessions: ${activeSessions}`);
        const recentAudit = await prisma.adminAuditLog.findMany({
          where: { adminAccountId: existingAdmin.id },
          orderBy: { timestamp: "desc" },
          take: 5,
          select: { action: true, timestamp: true, ipAddress: true },
        });
        if (recentAudit.length > 0) {
          console.log(`  Recent Audit Logs:`);
          for (const log of recentAudit) {
            console.log(`    ${log.timestamp.toISOString()} | ${log.action} | IP: ${log.ipAddress || "N/A"}`);
          }
        }
      }

      if (isVerifyOnly) {
        process.exit(passwordMatches ? 0 : 1);
      }

      // Apply fixes
      const updates: Record<string, unknown> = {};

      if (!existingAdmin.emailVerified) {
        updates.emailVerified = new Date();
        console.log("\n  [FIX] Setting emailVerified");
      }

      if (!passwordMatches) {
        updates.password = await hashPasswordNoble(SUPERADMIN_PASSWORD);
        console.log("  [FIX] Password does not match env var — re-hashing with noble/scrypt");
      } else if (hashFormat !== "noble/scrypt") {
        updates.password = await hashPasswordNoble(SUPERADMIN_PASSWORD);
        console.log("  [FIX] Migrating password hash from bcrypt to noble/scrypt");
      }

      if (Object.keys(updates).length > 0) {
        await prisma.adminAccount.update({
          where: { email: SUPERADMIN_EMAIL },
          data: updates,
        });
        console.log("\n  All fixes applied. Admin should be able to login now.");
      } else {
        console.log("\n  No fixes needed. Everything looks good.");
      }

      return;
    }

    // --- Create new superadmin ---
    if (isVerifyOnly || isDiagnose) {
      console.log("Admin account NOT FOUND in database.");
      process.exit(1);
    }

    console.log("Creating new superadmin account...");
    const hashedPassword = await hashPasswordNoble(SUPERADMIN_PASSWORD);

    const superadmin = await prisma.adminAccount.create({
      data: {
        email: SUPERADMIN_EMAIL,
        password: hashedPassword,
        name: SUPERADMIN_NAME,
        role: AdminRole.SUPERADMIN,
        emailVerified: new Date(),
        isTwoFactorEnabled: false,
      },
    });

    console.log("\nSuperadmin account created:");
    console.log(`  ID:    ${superadmin.id}`);
    console.log(`  Email: ${superadmin.email}`);
    console.log(`  Name:  ${superadmin.name}`);
    console.log(`  Role:  ${superadmin.role}`);
    console.log(`  Hash:  noble/scrypt`);
    console.log(`\nLogin URL: https://taxomind.com/admin/auth/login`);

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
