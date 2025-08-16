/**
 * Migration script for enhanced authentication system
 * Run with: npx tsx scripts/migrate-auth.ts
 */

import { PrismaClient, UserRole } from '@prisma/client';
import { Permission } from '../lib/permissions';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting authentication migration...');
  
  try {
    // Step 1: Migrate existing user roles
    console.log('📝 Migrating user roles...');
    
    // Update USER role to LEARNER
    const userUpdate = await prisma.user.updateMany({
      where: { role: 'USER' as any },
      data: { role: "USER" }
    });
    console.log(`  ✅ Updated ${userUpdate.count} users from USER to LEARNER`);
    
    // Update STUDENT role to LEARNER
    const studentUpdate = await prisma.user.updateMany({
      where: { role: "USER" as any },
      data: { role: "USER" }
    });
    console.log(`  ✅ Updated ${studentUpdate.count} users from STUDENT to LEARNER`);
    
    // Update TEACHER role to INSTRUCTOR
    const teacherUpdate = await prisma.user.updateMany({
      where: { role: "USER", isTeacher: true as any },
      data: { role: "USER", isTeacher: true }
    });
    console.log(`  ✅ Updated ${teacherUpdate.count} users from TEACHER to INSTRUCTOR`);
    
    // Step 2: Create default permissions
    console.log('🔑 Creating default permissions...');
    
    const permissionList = Object.values(Permission);
    
    for (const permissionName of permissionList) {
      const category = getPermissionCategory(permissionName);
      
      await prisma.permission.upsert({
        where: { name: permissionName },
        update: {},
        create: {
          name: permissionName,
          category,
          description: `Permission for ${permissionName.toLowerCase().replace(/_/g, ' ')}`
        }
      });
    }
    console.log(`  ✅ Created/updated ${permissionList.length} permissions`);
    
    // Step 3: Set up role-permission mappings
    console.log('🔗 Setting up role-permission mappings...');
    
    const rolePermissionMap: Record<UserRole, string[]> = {
      ADMIN: permissionList, // Admins get all permissions
      USER: [
        'USER_VIEW_OWN',
        'USER_MANAGE_OWN',
        'COURSE_VIEW',
        'COURSE_PURCHASE',
      ],
      STUDENT: [
        'USER_VIEW_OWN',
        'USER_MANAGE_OWN',
        'COURSE_VIEW',
        'COURSE_PURCHASE',
      ],
      TEACHER: [
        'COURSE_CREATE',
        'COURSE_EDIT_OWN',
        'COURSE_DELETE_OWN',
        'COURSE_PUBLISH',
        'COURSE_UNPUBLISH',
        'COURSE_PRICE_SET',
        'USER_VIEW_ANALYTICS',
        'USER_MANAGE_OWN',
        'PAYMENT_RECEIVE',
        'PAYMENT_WITHDRAW',
        'PAYMENT_VIEW_REPORTS',
      ],
      INSTRUCTOR: [
        'COURSE_CREATE',
        'COURSE_EDIT_OWN',
        'COURSE_DELETE_OWN',
        'COURSE_PUBLISH',
        'COURSE_UNPUBLISH',
        'COURSE_PRICE_SET',
        'USER_VIEW_ANALYTICS',
        'USER_MANAGE_OWN',
        'PAYMENT_RECEIVE',
        'PAYMENT_WITHDRAW',
        'PAYMENT_VIEW_REPORTS',
      ],
      LEARNER: [
        'USER_MANAGE_OWN',
        'USER_VIEW_ANALYTICS',
      ],
      MODERATOR: [
        'CONTENT_MODERATE',
        'CONTENT_FLAG',
        'CONTENT_APPROVE',
        'USER_VIEW_ANALYTICS',
        'PLATFORM_ANALYTICS',
      ],
      AFFILIATE: [
        'USER_VIEW_ANALYTICS',
        'USER_MANAGE_OWN',
        'PAYMENT_RECEIVE',
        'PAYMENT_VIEW_REPORTS',
      ]
    };
    
    for (const [role, permissions] of Object.entries(rolePermissionMap)) {
      for (const permissionName of permissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
        });
        
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              role_permissionId: {
                role: role as UserRole,
                permissionId: permission.id
              }
            },
            update: {},
            create: {
              role: role as UserRole,
              permissionId: permission.id
            }
          });
        }
      }
    }
    console.log('  ✅ Role-permission mappings created');
    
    // Step 4: Set instructor status for existing instructors
    console.log('👨‍🏫 Setting instructor status...');
    
    const instructors = await prisma.user.findMany({
      where: { role: "USER", isTeacher: true },
      include: {
        courses: {
          select: { id: true }
        }
      }
    });
    
    for (const instructor of instructors) {
      const courseCount = instructor.courses.length;
      let tier: 'BASIC' | 'STANDARD' | 'PREMIUM' = 'BASIC';
      
      if (courseCount > 20) tier = 'PREMIUM';
      else if (courseCount > 5) tier = 'STANDARD';
      
      await prisma.user.update({
        where: { id: instructor.id },
        data: {
          // instructorStatus fields removed - not in current schema
          role: courseCount > 0 ? 'TEACHER' : 'USER'
        }
      });
    }
    console.log(`  ✅ Updated ${instructors.length} instructor profiles`);
    
    // Step 5: Create audit log entry for migration
    console.log('📊 Creating audit log...');
    
    await prisma.enhancedAuditLog.create({
      data: {
        action: 'AUTH_MIGRATION_COMPLETED',
        resource: 'SYSTEM',
        severity: 'INFO',
        metadata: {
          migratedUsers: userUpdate.count + studentUpdate.count + teacherUpdate.count,
          permissionsCreated: permissionList.length,
          instructorsUpdated: instructors.length,
          timestamp: new Date().toISOString()
        }
      }
    });
    
    console.log('✨ Migration completed successfully!');
    
    // Display summary
    console.log('\n📈 Migration Summary:');
    console.log('─────────────────────');
    console.log(`  Total users migrated: ${userUpdate.count + studentUpdate.count + teacherUpdate.count}`);
    console.log(`  Permissions created: ${permissionList.length}`);
    console.log(`  Instructors updated: ${instructors.length}`);
    console.log('─────────────────────');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

function getPermissionCategory(permissionName: string): string {
  if (permissionName.startsWith('COURSE_')) return 'COURSE';
  if (permissionName.startsWith('CONTENT_')) return 'CONTENT';
  if (permissionName.startsWith('USER_')) return 'USER';
  if (permissionName.startsWith('PAYMENT_')) return 'PAYMENT';
  if (permissionName.startsWith('PLATFORM_')) return 'PLATFORM';
  return 'OTHER';
}

// Run the migration
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });