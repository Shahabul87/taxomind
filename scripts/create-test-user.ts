#!/usr/bin/env tsx

/**
 * Script to create a test user with known credentials
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const db = new PrismaClient();

async function createTestUser() {
  try {
    console.log("🔧 Creating test users...\n");

    // Create test admin
    const adminPassword = "Admin123!@#";
    const adminHashedPassword = await bcrypt.hash(adminPassword, 10);

    const testAdmin = await db.user.upsert({
      where: { email: "testadmin@example.com" },
      update: {
        password: adminHashedPassword,
        emailVerified: new Date(),
        role: "ADMIN",
      },
      create: {
        email: "testadmin@example.com",
        name: "Test Admin",
        password: adminHashedPassword,
        emailVerified: new Date(),
        role: "ADMIN",
      },
    });

    console.log("✅ Test Admin created:");
    console.log("   Email: testadmin@example.com");
    console.log("   Password: Admin123!@#");
    console.log("   Role: ADMIN\n");

    // Create test user
    const userPassword = "User123!@#";
    const userHashedPassword = await bcrypt.hash(userPassword, 10);

    const testUser = await db.user.upsert({
      where: { email: "testuser@example.com" },
      update: {
        password: userHashedPassword,
        emailVerified: new Date(),
        role: "USER",
      },
      create: {
        email: "testuser@example.com",
        name: "Test User",
        password: userHashedPassword,
        emailVerified: new Date(),
        role: "USER",
      },
    });

    console.log("✅ Test User created:");
    console.log("   Email: testuser@example.com");
    console.log("   Password: User123!@#");
    console.log("   Role: USER\n");

    // Also reset the existing admin passwords
    const existingAdminPassword = await bcrypt.hash("Admin123!@#", 10);
    
    await db.user.updateMany({
      where: {
        email: {
          in: ["admin@example.com", "system@taxomind.com"]
        }
      },
      data: {
        password: existingAdminPassword,
        emailVerified: new Date(),
      }
    });

    console.log("✅ Reset passwords for existing admins:");
    console.log("   admin@example.com → Password: Admin123!@#");
    console.log("   system@taxomind.com → Password: Admin123!@#\n");

    // Create capabilities for test users
    await db.userCapability.createMany({
      data: [
        {
          userId: testAdmin.id,
          capability: "STUDENT",
          isActive: true,
        },
        {
          userId: testUser.id,
          capability: "STUDENT",
          isActive: true,
        },
      ],
      skipDuplicates: true,
    });

    // Create user contexts
    await db.userContext.upsert({
      where: { userId: testAdmin.id },
      update: {},
      create: {
        userId: testAdmin.id,
        activeCapability: "STUDENT",
      },
    });

    await db.userContext.upsert({
      where: { userId: testUser.id },
      update: {},
      create: {
        userId: testUser.id,
        activeCapability: "STUDENT",
      },
    });

    console.log("✅ User capabilities and contexts created\n");
    console.log("🚀 You can now login at: http://localhost:3000/auth/login");
    console.log("\n📝 Test Credentials Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("testadmin@example.com / Admin123!@#  (ADMIN)");
    console.log("testuser@example.com / User123!@#    (USER)");
    console.log("admin@example.com / Admin123!@#      (ADMIN)");
    console.log("system@taxomind.com / Admin123!@#    (ADMIN)");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

createTestUser();