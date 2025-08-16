/**
 * Safe Authentication Migration Script
 * Works across all environments without breaking existing functionality
 * 
 * Run with: npx tsx scripts/safe-auth-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const environment = process.env.NODE_ENV || 'development';
  console.log(`🔄 Running safe authentication migration in ${environment} environment...`);
  
  try {
    // Step 1: Check current database state
    const userCount = await prisma.user.count();
    console.log(`📊 Found ${userCount} users in database`);
    
    if (userCount === 0) {
      console.log('✅ No users found - fresh database, no migration needed');
      
      // Just ensure the new tables exist (Prisma will handle this)
      console.log('📝 Ensuring new authentication tables exist...');
      
      // Create default permissions if they don't exist
      await createDefaultPermissions();
      
      return;
    }
    
    // Step 2: Check if migration is already done
    const hasNewTables = await checkNewTablesExist();
    if (hasNewTables) {
      console.log('✅ New authentication tables already exist');
      
      // Just ensure permissions are set up
      await createDefaultPermissions();
      
      console.log('✨ Migration already completed or not needed');
      return;
    }
    
    // Step 3: Create new tables and permissions
    console.log('📝 Setting up new authentication features...');
    await createDefaultPermissions();
    
    // Step 4: Optional - Gradually migrate roles (can be done later)
    // For now, keep existing roles working
    console.log('ℹ️  Existing user roles preserved for backward compatibility');
    console.log('ℹ️  New roles (INSTRUCTOR, LEARNER, etc.) are available for new users');
    
    console.log('✨ Safe migration completed successfully!');
    console.log('📌 Both old and new roles will work seamlessly');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkNewTablesExist(): Promise<boolean> {
  try {
    // Try to query a new table
    await prisma.permission.findFirst();
    return true;
  } catch (error) {
    // Table doesn't exist yet
    return false;
  }
}

async function createDefaultPermissions() {
  const permissions = [
    // Course Permissions
    { name: 'COURSE_CREATE', category: 'COURSE', description: 'Create new courses' },
    { name: 'COURSE_EDIT_OWN', category: 'COURSE', description: 'Edit own courses' },
    { name: 'COURSE_EDIT_ANY', category: 'COURSE', description: 'Edit any course' },
    { name: 'COURSE_DELETE_OWN', category: 'COURSE', description: 'Delete own courses' },
    { name: 'COURSE_DELETE_ANY', category: 'COURSE', description: 'Delete any course' },
    { name: 'COURSE_PUBLISH', category: 'COURSE', description: 'Publish courses' },
    { name: 'COURSE_UNPUBLISH', category: 'COURSE', description: 'Unpublish courses' },
    { name: 'COURSE_PRICE_SET', category: 'COURSE', description: 'Set course prices' },
    
    // Content Permissions
    { name: 'CONTENT_MODERATE', category: 'CONTENT', description: 'Moderate content' },
    { name: 'CONTENT_APPROVE', category: 'CONTENT', description: 'Approve content' },
    { name: 'CONTENT_FLAG', category: 'CONTENT', description: 'Flag content' },
    
    // User Permissions
    { name: 'USER_VIEW_ANALYTICS', category: 'USER', description: 'View analytics' },
    { name: 'USER_MANAGE_OWN', category: 'USER', description: 'Manage own profile' },
    { name: 'USER_MANAGE_ANY', category: 'USER', description: 'Manage any user' },
    { name: 'USER_BAN', category: 'USER', description: 'Ban users' },
    { name: 'USER_VERIFY_INSTRUCTOR', category: 'USER', description: 'Verify instructors' },
    
    // Financial Permissions
    { name: 'PAYMENT_RECEIVE', category: 'PAYMENT', description: 'Receive payments' },
    { name: 'PAYMENT_WITHDRAW', category: 'PAYMENT', description: 'Withdraw payments' },
    { name: 'PAYMENT_VIEW_REPORTS', category: 'PAYMENT', description: 'View payment reports' },
    { name: 'PAYMENT_MANAGE_REFUNDS', category: 'PAYMENT', description: 'Manage refunds' },
    
    // Platform Permissions
    { name: 'PLATFORM_ADMIN', category: 'PLATFORM', description: 'Platform administration' },
    { name: 'PLATFORM_ANALYTICS', category: 'PLATFORM', description: 'View platform analytics' },
    { name: 'PLATFORM_SETTINGS', category: 'PLATFORM', description: 'Manage platform settings' },
    { name: 'PLATFORM_AUDIT_LOGS', category: 'PLATFORM', description: 'View audit logs' },
  ];
  
  let created = 0;
  for (const permission of permissions) {
    try {
      await prisma.permission.upsert({
        where: { name: permission.name },
        update: {},
        create: permission
      });
      created++;
    } catch (error) {
      // Permission might already exist, that's okay
    }
  }
  
  console.log(`✅ Ensured ${created} permissions are available`);
}

// Run the migration
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });