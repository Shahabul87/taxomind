import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check Users Script
 *
 * NOTE: Users don't have roles - Admin auth uses AdminAccount model.
 * This script shows User model structure (no role field) and AdminAccount stats.
 */
async function checkUsers() {
  try {
    // Count total users
    const userCount = await prisma.user.count();
    console.log('=====================================');
    console.log('DATABASE USER ANALYSIS');
    console.log('=====================================');
    console.log('Total users in database:', userCount);

    if (userCount === 0) {
      console.log('\n⚠️  No users found in the database!');
      console.log('You may need to run seed scripts or create a test user.');
    } else {
      // Get first 10 users with basic info (NO role field - Users don't have roles)
      const users = await prisma.user.findMany({
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          isTeacher: true,
          emailVerified: true,
          createdAt: true,
          isTwoFactorEnabled: true,
          isAccountLocked: true,
          lastLoginAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log('\n📋 Recent Users:');
      console.log('-------------------------------------');
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User Details:`);
        console.log('   ID:', user.id);
        console.log('   Name:', user.name || '(Not set)');
        console.log('   Email:', user.email || '(Not set)');
        console.log('   Is Teacher:', user.isTeacher ? '✅ Yes' : '❌ No');
        console.log('   Email Verified:', user.emailVerified ? '✅ Yes' : '❌ No');
        console.log('   2FA Enabled:', user.isTwoFactorEnabled ? '✅ Yes' : '❌ No');
        console.log('   Account Locked:', user.isAccountLocked ? '🔒 Yes' : '🔓 No');
        console.log('   Last Login:', user.lastLoginAt || 'Never');
        console.log('   Created:', user.createdAt?.toLocaleString());
      });

      // Count teachers
      const teacherCount = await prisma.user.count({
        where: { isTeacher: true }
      });

      console.log('\n📊 User Distribution:');
      console.log('-------------------------------------');
      console.log(`   Teachers (isTeacher=true): ${teacherCount}`);
      console.log(`   Students (isTeacher=false): ${userCount - teacherCount}`);
    }

    // Check for admin accounts (separate from User model)
    const adminCount = await prisma.adminAccount.count();

    console.log('\n🔐 Admin Accounts (AdminAccount model):');
    console.log('-------------------------------------');
    console.log(`   Total admin accounts: ${adminCount}`);

    if (adminCount > 0) {
      const admins = await prisma.adminAccount.findMany({
        select: { email: true, name: true, role: true }
      });
      admins.forEach((admin, i) => {
        console.log(`   ${i + 1}. ${admin.email} (${admin.name}) - Role: ${admin.role}`);
      });
    }

    console.log('\n🔐 Security Status:');
    console.log('-------------------------------------');

    const verifiedCount = await prisma.user.count({
      where: { emailVerified: { not: null } }
    });
    console.log(`   Verified emails: ${verifiedCount}/${userCount} (${userCount > 0 ? ((verifiedCount/userCount)*100).toFixed(1) : 0}%)`);

    const twoFactorCount = await prisma.user.count({
      where: { isTwoFactorEnabled: true }
    });
    console.log(`   2FA enabled: ${twoFactorCount}/${userCount} (${userCount > 0 ? ((twoFactorCount/userCount)*100).toFixed(1) : 0}%)`);

    const lockedCount = await prisma.user.count({
      where: { isAccountLocked: true }
    });
    console.log(`   Locked accounts: ${lockedCount}`);

    // Check for courses and enrollments
    const courseCount = await prisma.course.count();
    const enrollmentCount = await prisma.enrollment.count();

    console.log('\n📚 Platform Activity:');
    console.log('-------------------------------------');
    console.log(`   Total courses: ${courseCount}`);
    console.log(`   Total enrollments: ${enrollmentCount}`);

    if (userCount > 0) {
      console.log(`   Avg enrollments per user: ${(enrollmentCount/userCount).toFixed(2)}`);
    }

    console.log('\n=====================================');
    console.log('AUTH ARCHITECTURE NOTE:');
    console.log('=====================================');
    console.log('- User model: Regular users (no role field)');
    console.log('  - Use isTeacher flag for teachers/course creators');
    console.log('- AdminAccount model: Admin users');
    console.log('  - Has role field (ADMIN, SUPERADMIN)');
    console.log('- Admin and User auth are completely separate');
    console.log('=====================================');
    console.log('✅ Database check complete!');
    console.log('=====================================');

  } catch (error) {
    console.error('\n❌ Error querying database:', error);
    console.error('\nPossible issues:');
    console.error('1. Database is not running (check Docker container)');
    console.error('2. Wrong DATABASE_URL in .env file');
    console.error('3. Database migrations not applied');
    console.error('\nTry running:');
    console.error('  npm run dev:docker:start');
    console.error('  npx prisma migrate dev');
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
