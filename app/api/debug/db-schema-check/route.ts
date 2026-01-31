import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

export async function GET() {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const results: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    // Test 1: Check if we can connect to the database
    try {
      await db.$queryRaw`SELECT 1`;
      results.dbConnection = 'SUCCESS';
    } catch (error) {
      results.dbConnection = `ERROR: ${error instanceof Error ? error.message : 'Unknown'}`;
      return NextResponse.json({
        status: 'Database Schema Check',
        ...results,
        error: 'Database connection failed',
      }, { status: 500 });
    }

    // Test 2: Check User table structure
    try {
      const userColumns = await db.$queryRaw<Array<{ column_name: string; data_type: string }>>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'User'
        ORDER BY ordinal_position
      `;
      results.userTableColumns = userColumns.map(c => `${c.column_name} (${c.data_type})`);
      results.userTableColumnCount = userColumns.length;

      // Check for required NextAuth fields
      const requiredFields = ['id', 'name', 'email', 'emailVerified', 'image'];
      const existingFields = userColumns.map(c => c.column_name);
      const missingFields = requiredFields.filter(f => !existingFields.includes(f));
      results.userMissingFields = missingFields.length > 0 ? missingFields : 'NONE';
    } catch (error) {
      results.userTableError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 3: Check Account table structure
    try {
      const accountColumns = await db.$queryRaw<Array<{ column_name: string; data_type: string }>>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'Account'
        ORDER BY ordinal_position
      `;
      results.accountTableColumns = accountColumns.map(c => `${c.column_name} (${c.data_type})`);
      results.accountTableColumnCount = accountColumns.length;

      // Check for required NextAuth Account fields
      const requiredAccountFields = ['id', 'userId', 'type', 'provider', 'providerAccountId', 'refresh_token', 'access_token', 'expires_at', 'token_type', 'scope', 'id_token', 'session_state'];
      const existingAccountFields = accountColumns.map(c => c.column_name);
      const missingAccountFields = requiredAccountFields.filter(f => !existingAccountFields.includes(f));
      results.accountMissingFields = missingAccountFields.length > 0 ? missingAccountFields : 'NONE';
    } catch (error) {
      results.accountTableError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 4: Check if there are any users in the database
    try {
      const userCount = await db.user.count();
      results.totalUsers = userCount;
    } catch (error) {
      results.userCountError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 5: Check if there are any OAuth accounts
    try {
      const accountCount = await db.account.count();
      const oauthAccounts = await db.account.groupBy({
        by: ['provider'],
        _count: true,
      });
      results.totalAccounts = accountCount;
      results.accountsByProvider = oauthAccounts;
    } catch (error) {
      results.accountCountError = error instanceof Error ? error.message : 'Unknown';
    }

    // Test 6: Check AdminAccount table
    try {
      const adminColumns = await db.$queryRaw<Array<{ column_name: string; data_type: string }>>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'AdminAccount'
        ORDER BY ordinal_position
      `;
      results.adminAccountColumns = adminColumns.map(c => c.column_name);
      results.adminAccountColumnCount = adminColumns.length;
    } catch (error) {
      results.adminAccountError = error instanceof Error ? error.message : 'Unknown';
    }

    return NextResponse.json({
      status: 'Database Schema Check',
      ...results,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'Database Schema Check Error',
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
