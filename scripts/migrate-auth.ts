#!/usr/bin/env node
/**
 * Authentication Migration Script
 * Migrates users to the simplified two-role system (ADMIN and USER)
 */

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAuthentication() {
  console.log('🔐 Starting authentication migration...\n');
  
  try {
    // Step 1: Update all user roles to simplified system
    console.log('📋 Migrating user roles to simplified system...');
    
    // Count existing users by current roles
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    console.log(`  Total users: ${userCount}`);
    console.log(`  Admin users: ${adminCount}`);
    console.log(`  Regular users: ${userCount - adminCount}`);
    
    // All non-admin users should have USER role
    const updatedUsers = await prisma.user.updateMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      },
      data: {
        role: 'USER'
      }
    });
    
    console.log(`  ✅ Updated ${updatedUsers.count} users to USER role`);
    
    // Step 2: Create permissions if they don't exist
    console.log('\n🔑 Setting up permissions...');
    
    const permissions = [
      // User permissions
      'USER_VIEW_OWN',
      'USER_MANAGE_OWN',
      'USER_VIEW_ANALYTICS',
      
      // Course permissions
      'COURSE_VIEW',
      'COURSE_CREATE',
      'COURSE_EDIT_OWN',
      'COURSE_DELETE_OWN',
      'COURSE_PUBLISH',
      'COURSE_UNPUBLISH',
      'COURSE_PRICE_SET',
      'COURSE_PURCHASE',
      
      // Payment permissions
      'PAYMENT_RECEIVE',
      'PAYMENT_WITHDRAW',
      'PAYMENT_VIEW_REPORTS',
      
      // Platform permissions
      'CONTENT_MODERATE',
      'CONTENT_FLAG',
      'CONTENT_APPROVE',
      'PLATFORM_ANALYTICS',
      
      // Admin permissions
      'ALL_PERMISSIONS'
    ];
    
    for (const name of permissions) {
      await prisma.permission.upsert({
        where: { name },
        create: { name, description: `Permission for ${name}` },
        update: {}
      });
    }
    console.log('  ✅ Permissions created/verified');
    
    // Step 3: Create role-permission mappings
    console.log('\n🔗 Creating role-permission mappings...');
    
    const rolePermissionMap: Record<UserRole, string[]> = {
      ADMIN: [
        'ALL_PERMISSIONS'
      ],
      USER: [
        'USER_VIEW_OWN',
        'USER_MANAGE_OWN',
        'COURSE_VIEW',
        'COURSE_PURCHASE',
        'COURSE_CREATE',
        'COURSE_EDIT_OWN',
        'COURSE_DELETE_OWN',
        'COURSE_PUBLISH',
        'COURSE_UNPUBLISH',
        'COURSE_PRICE_SET',
        'USER_VIEW_ANALYTICS',
        'PAYMENT_RECEIVE',
        'PAYMENT_WITHDRAW',
        'PAYMENT_VIEW_REPORTS'
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
    
    // Step 4: Clean up legacy fields
    console.log('\n🧹 Cleaning up legacy data...');
    
    // Update users who were teachers/instructors
    const instructors = await prisma.user.findMany({
      where: { 
        role: "USER",
        courses: {
          some: {}
        }
      },
      include: {
        courses: {
          select: { id: true }
        }
      }
    });
    
    console.log(`  Found ${instructors.length} users with courses (content creators)`);
    
    // Step 5: Create audit log entry
    console.log('\n📝 Creating audit log...');
    
    await prisma.auditLog.create({
      data: {
        userId: 'SYSTEM',
        action: 'AUTH_MIGRATION',
        entityType: 'USER',
        entityId: 'ALL',
        details: {
          migratedAt: new Date().toISOString(),
          totalUsers: userCount,
          adminUsers: adminCount,
          regularUsers: userCount - adminCount,
          contentCreators: instructors.length
        }
      }
    });
    
    console.log('  ✅ Audit log created');
    
    // Step 6: Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Authentication Migration Complete!');
    console.log('='.repeat(50));
    console.log(`
Summary:
- Total users migrated: ${userCount}
- Admin users: ${adminCount}
- Regular users (with content creation access): ${userCount - adminCount}
- Content creators identified: ${instructors.length}

The system now uses a simplified two-role model:
- ADMIN: Full system access
- USER: Regular users with content creation capabilities

All users can create courses and content.
Role-based feature access is now handled through permissions.
    `);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
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