/**
 * Admin Account Seed Script
 *
 * Creates admin accounts in the AdminAccount table (separate from regular users)
 *
 * Usage: npx tsx scripts/seed-admin.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env.development") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔐 Seeding admin accounts...\n");

  try {
    // Admin credentials
    const adminEmail = "sham251087@gmail.com";
    const adminPassword = "ShaM2510*##&*";
    const adminName = "Shahabul Alam";

    // Hash the password
    const hashedPassword = await hash(adminPassword, 12);

    // Check if admin already exists
    const existingAdmin = await prisma.adminAccount.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin account already exists: ${adminEmail}`);
      console.log("   Updating password...");

      await prisma.adminAccount.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          name: adminName,
          emailVerified: new Date(),
        },
      });

      console.log("✅ Admin password updated successfully!\n");
    } else {
      // Create new admin account
      await prisma.adminAccount.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: "SUPERADMIN",
          emailVerified: new Date(),
          isTwoFactorEnabled: false,
        },
      });

      console.log("✅ Admin account created successfully!\n");
    }

    // Display summary
    console.log("============================================");
    console.log("🔑 ADMIN LOGIN CREDENTIALS");
    console.log("============================================");
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔒 Password: ${adminPassword}`);
    console.log(`👤 Name:     ${adminName}`);
    console.log(`🛡️  Role:     SUPERADMIN`);
    console.log("============================================");
    console.log("\n🌐 Admin Login URL: /admin/auth/login");
    console.log("============================================\n");

  } catch (error) {
    console.error("❌ Error seeding admin:", error);
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
