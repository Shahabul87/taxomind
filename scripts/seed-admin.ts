/**
 * Admin Account Seed Script
 *
 * This script creates the initial superadmin account.
 * It can be run safely on production without affecting other data.
 *
 * Reads credentials from environment variables:
 *   SUPERADMIN_EMAIL    - Superadmin email address
 *   SUPERADMIN_PASSWORD - Superadmin password
 *   SUPERADMIN_NAME     - Superadmin display name (optional)
 *
 * Usage:
 *   Local: npx tsx scripts/seed-admin.ts
 *   Railway: railway run npx tsx scripts/seed-admin.ts
 */

import { PrismaClient, AdminRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Read superadmin credentials from environment variables
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;
const SUPERADMIN_NAME = process.env.SUPERADMIN_NAME || "Super Admin";

async function main() {
  console.log("🔐 Admin Account Seed Script");
  console.log("============================\n");

  if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    console.error("❌ Missing required environment variables:");
    if (!SUPERADMIN_EMAIL) console.error("   - SUPERADMIN_EMAIL is not set");
    if (!SUPERADMIN_PASSWORD) console.error("   - SUPERADMIN_PASSWORD is not set");
    console.error("\nSet these env vars and try again:");
    console.error("  SUPERADMIN_EMAIL=admin@example.com SUPERADMIN_PASSWORD=your-password npx tsx scripts/seed-admin.ts");
    process.exit(1);
  }

  try {
    // Check if superadmin already exists
    const existingAdmin = await prisma.adminAccount.findUnique({
      where: { email: SUPERADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log("✅ Superadmin account already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      console.log(`   Email Verified: ${existingAdmin.emailVerified || 'NOT VERIFIED'}`);

      // Fix: Ensure emailVerified is set for existing superadmin
      if (!existingAdmin.emailVerified) {
        console.log("\n🔧 Fixing: Setting emailVerified for superadmin...");
        await prisma.adminAccount.update({
          where: { email: SUPERADMIN_EMAIL },
          data: { emailVerified: new Date() },
        });
        console.log("✅ emailVerified has been set. You can now login!");
      } else {
        console.log("\n⚠️  No changes needed. Account is already verified.");
      }
      return;
    }

    // Hash the password
    console.log("🔑 Hashing password...");
    const hashedPassword = await hash(SUPERADMIN_PASSWORD, 12);

    // Create the superadmin account
    console.log("👤 Creating superadmin account...");
    const superadmin = await prisma.adminAccount.create({
      data: {
        email: SUPERADMIN_EMAIL,
        password: hashedPassword,
        name: SUPERADMIN_NAME,
        role: AdminRole.SUPERADMIN,
        emailVerified: new Date(), // Pre-verified for superadmin
        isTwoFactorEnabled: false,
      },
    });

    console.log("\n✅ Superadmin account created successfully!");
    console.log("============================================");
    console.log(`   ID: ${superadmin.id}`);
    console.log(`   Email: ${superadmin.email}`);
    console.log(`   Name: ${superadmin.name}`);
    console.log(`   Role: ${superadmin.role}`);
    console.log("============================================\n");

    console.log("🔐 Login Credentials:");
    console.log(`   URL: https://taxomind.com/admin/auth/login`);
    console.log(`   Email: ${SUPERADMIN_EMAIL}`);
    console.log(`   Password: [as configured in script]\n`);

    console.log("🚨 IMPORTANT: Change the password after first login!");

    // Log the action in audit log if table exists
    try {
      await prisma.auditLog.create({
        data: {
          action: "ADMIN_CREATED",
          details: `Superadmin account created for ${SUPERADMIN_EMAIL}`,
          ipAddress: "seed-script",
        },
      });
      console.log("\n📝 Action logged to audit log.");
    } catch {
      console.log("\n⚠️  Could not log to audit log (table may not exist).");
    }

  } catch (error) {
    console.error("❌ Error creating superadmin account:", error);
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
