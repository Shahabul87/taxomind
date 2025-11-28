#!/usr/bin/env node
/**
 * Authentication Migration Script
 *
 * DEPRECATED: This script is no longer needed as the auth system has been redesigned.
 *
 * NEW ARCHITECTURE:
 * - User model: Regular users (no role field, use isTeacher flag for teachers)
 * - AdminAccount model: Admin users (has AdminRole: ADMIN, SUPERADMIN)
 *
 * Admin and User authentication are completely separate systems.
 * This script is kept for reference only.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAuthentication() {
  console.log('⚠️  DEPRECATED SCRIPT\n');
  console.log('This script is deprecated. The authentication system has been redesigned.\n');
  console.log('NEW ARCHITECTURE:');
  console.log('- User model: Regular users (no role field)');
  console.log('  - Use isTeacher: true for teachers/course creators');
  console.log('- AdminAccount model: Admin users with AdminRole (ADMIN, SUPERADMIN)\n');
  console.log('Admin and User authentication are completely separate.\n');

  try {
    // Show current stats
    console.log('📊 Current System Stats:\n');

    const userCount = await prisma.user.count();
    const adminAccountCount = await prisma.adminAccount.count();
    const teacherCount = await prisma.user.count({ where: { isTeacher: true } });

    console.log(`  Total users: ${userCount}`);
    console.log(`  Teachers: ${teacherCount}`);
    console.log(`  Admin accounts: ${adminAccountCount}\n`);

    // Check permissions table
    const permissionCount = await prisma.permission.count();
    console.log(`  Permissions defined: ${permissionCount}`);

    // NOTE: RolePermission table is deprecated - users don't have roles
    // UserPermission table stores individual user permissions instead
    const userPermissionCount = await prisma.userPermission.count();
    console.log(`  User-permission mappings: ${userPermissionCount}\n`);

    console.log('✅ No migration needed - system is already on new architecture.\n');
    console.log('To manage admins, use:');
    console.log('  - AdminAccount model for admin CRUD operations');
    console.log('  - AdminRole enum (ADMIN, SUPERADMIN) for admin roles');
    console.log('\nTo manage users, use:');
    console.log('  - User model for regular users');
    console.log('  - isTeacher flag for teacher/course creator access\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateAuthentication().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
