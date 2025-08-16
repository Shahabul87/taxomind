#!/usr/bin/env tsx
/**
 * Migration script to update user roles from multiple roles to 2-role system
 * Run with: npx tsx scripts/migrate-roles.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRoles() {
  console.log('🔄 Starting role migration...\n');

  try {
    // Count users by current role
    const roleCounts = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count 
      FROM "User" 
      GROUP BY role
    ` as Array<{role: string, count: bigint}>;

    console.log('📊 Current role distribution:');
    roleCounts.forEach(({ role, count }) => {
      console.log(`   ${role}: ${count} users`);
    });

    // Migration mapping
    const roleMapping = {
      'STUDENT': 'USER',
      'TEACHER': 'USER',
      'INSTRUCTOR': 'USER',
      'LEARNER': 'USER',
      'MODERATOR': 'USER',
      'AFFILIATE': 'USER',
      'ADMIN': 'ADMIN',
      'USER': 'USER'
    };

    // Update roles
    for (const [oldRole, newRole] of Object.entries(roleMapping)) {
      if (oldRole !== newRole) {
        const result = await prisma.$executeRaw`
          UPDATE "User" 
          SET role = ${newRole}::"UserRole"
          WHERE role = ${oldRole}::"UserRole"
        `;
        
        if (result > 0) {
          console.log(`✅ Migrated ${result} users from ${oldRole} to ${newRole}`);
        }
      }
    }

    // Set isTeacher flag for users who were TEACHER or INSTRUCTOR
    const teacherUpdate = await prisma.$executeRaw`
      UPDATE "User" 
      SET "isTeacher" = true
      WHERE role = 'USER'::"UserRole" 
      AND (
        role = 'TEACHER'::"UserRole" OR 
        role = 'INSTRUCTOR'::"UserRole"
      )
    `;
    
    if (teacherUpdate > 0) {
      console.log(`✅ Set isTeacher flag for ${teacherUpdate} users`);
    }

    // Final count
    const finalCounts = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count 
      FROM "User" 
      GROUP BY role
    ` as Array<{role: string, count: bigint}>;

    console.log('\n📊 Final role distribution:');
    finalCounts.forEach(({ role, count }) => {
      console.log(`   ${role}: ${count} users`);
    });

    console.log('\n✨ Role migration completed successfully!');
    console.log('📝 Note: The isTeacher flag has been set for former TEACHER/INSTRUCTOR users');
    console.log('   They can still create and manage courses as USER role with isTeacher=true');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateRoles().catch(console.error);