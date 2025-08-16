import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      return;
    }
    
    // Get first 10 users with basic info
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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
      console.log('   Role:', user.role);
      console.log('   Email Verified:', user.emailVerified ? '✅ Yes' : '❌ No');
      console.log('   2FA Enabled:', user.isTwoFactorEnabled ? '✅ Yes' : '❌ No');
      console.log('   Account Locked:', user.isAccountLocked ? '🔒 Yes' : '🔓 No');
      console.log('   Last Login:', user.lastLoginAt || 'Never');
      console.log('   Created:', user.createdAt?.toLocaleString());
    });
    
    // Count users by role
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
      orderBy: {
        _count: {
          role: 'desc'
        }
      }
    });
    
    console.log('\n📊 User Distribution by Role:');
    console.log('-------------------------------------');
    roleDistribution.forEach(role => {
      const percentage = ((role._count / userCount) * 100).toFixed(1);
      console.log(`   ${role.role}: ${role._count} users (${percentage}%)`);
    });
    
    // Check for admin users
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    console.log('\n🔐 Security Status:');
    console.log('-------------------------------------');
    console.log(`   Admin users: ${adminCount}`);
    
    const verifiedCount = await prisma.user.count({
      where: { emailVerified: { not: null } }
    });
    console.log(`   Verified emails: ${verifiedCount}/${userCount} (${((verifiedCount/userCount)*100).toFixed(1)}%)`);
    
    const twoFactorCount = await prisma.user.count({
      where: { isTwoFactorEnabled: true }
    });
    console.log(`   2FA enabled: ${twoFactorCount}/${userCount} (${((twoFactorCount/userCount)*100).toFixed(1)}%)`);
    
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