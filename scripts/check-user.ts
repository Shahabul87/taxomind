/**
 * Check if a user exists in the database
 * Run with: npx tsx scripts/check-user.ts <userId>
 */

import { db } from '../lib/db';

async function checkUser(userId: string) {
  try {
    console.log(`\n🔍 Checking for user: ${userId}\n`);

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailVerified: true,
      },
    });

    if (user) {
      console.log('✅ User EXISTS in database:');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('❌ User NOT FOUND in database!');
      console.log('\nThis explains the 401 error.');
      console.log('Your session cookie has a user ID that no longer exists.\n');
      console.log('Solutions:');
      console.log('1. Sign out and sign in again to create a new user');
      console.log('2. Visit: http://localhost:3000/api/auth/signout');
      console.log('3. Then visit: http://localhost:3000/auth/login\n');
    }

    // Check total users in database
    const totalUsers = await db.user.count();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

    // List all users
    if (totalUsers > 0 && totalUsers <= 10) {
      const allUsers = await db.user.findMany({
        select: { id: true, email: true, name: true },
        take: 10,
      });
      console.log('\n📋 All users in database:');
      allUsers.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email} (${u.id})`);
      });
    }
  } catch (error: any) {
    console.error('❌ Error checking user:', error.message);
  } finally {
    await db.$disconnect();
  }
}

const userId = process.argv[2] || 'cmgvy101v0000h4uvpd1enrp6';
checkUser(userId);
