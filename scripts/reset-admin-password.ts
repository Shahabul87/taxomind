#!/usr/bin/env tsx

/**
 * Script to reset admin password
 * Usage: tsx scripts/reset-admin-password.ts
 *
 * NOTE: Admin auth uses AdminAccount model (separate from User model)
 * Users don't have roles - admin auth is completely separate.
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
const prompts = require("prompts");

const db = new PrismaClient();

async function resetAdminPassword() {
  try {
    // Get all admin accounts (separate from User model)
    const admins = await db.adminAccount.findMany({
      select: { id: true, email: true, name: true, role: true },
    });

    if (admins.length === 0) {
      console.log("❌ No admin accounts found");
      console.log("💡 Admin accounts use AdminAccount model (separate from User)");
      return;
    }

    console.log("\n🔐 Admin Password Reset Tool\n");
    console.log("Found admin accounts:");
    admins.forEach((admin, i) => {
      console.log(`${i + 1}. ${admin.email} (${admin.name}) - Role: ${admin.role}`);
    });

    const { adminIndex, newPassword, confirmPassword } = await prompts([
      {
        type: "number",
        name: "adminIndex",
        message: "Select admin to reset password (enter number)",
        min: 1,
        max: admins.length,
      },
      {
        type: "password",
        name: "newPassword",
        message: "Enter new password",
        validate: (value: string) => value.length >= 6 || "Password must be at least 6 characters",
      },
      {
        type: "password",
        name: "confirmPassword",
        message: "Confirm new password",
        validate: (value: string, answers: any) => value === answers.newPassword || "Passwords don't match",
      },
    ]);

    if (!adminIndex || !newPassword) {
      console.log("❌ Operation cancelled");
      return;
    }

    const selectedAdmin = admins[adminIndex - 1];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in AdminAccount
    await db.adminAccount.update({
      where: { id: selectedAdmin.id },
      data: {
        password: hashedPassword,
        emailVerified: new Date(), // Ensure email is verified
      },
    });

    console.log(`\n✅ Password reset successfully for ${selectedAdmin.email}`);
    console.log("\n📝 Login credentials:");
    console.log(`Email: ${selectedAdmin.email}`);
    console.log(`Password: ${newPassword}`);
    console.log("\n🚀 You can now login at: http://localhost:3000/admin/auth/login");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

// Quick reset with default password for development
async function quickReset() {
  try {
    const defaultPassword = "Admin123!@#";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Reset all admin passwords in AdminAccount
    const result = await db.adminAccount.updateMany({
      data: {
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    console.log(`\n✅ Reset ${result.count} admin account(s) with default password`);
    console.log("\n📝 Default admin credentials:");
    console.log("Check your AdminAccount records for email addresses");
    console.log(`Password: ${defaultPassword}`);
    console.log("\n⚠️  IMPORTANT: Change this password after first login!");
    console.log("\n🚀 Login at: http://localhost:3000/admin/auth/login");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

// Check if --quick flag is passed
const isQuickReset = process.argv.includes("--quick");

if (isQuickReset) {
  console.log("🚀 Quick reset mode - using default password");
  quickReset();
} else {
  resetAdminPassword();
}
