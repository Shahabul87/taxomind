import { NextResponse } from 'next/server';
import { PrismaAdapter } from '@auth/prisma-adapter';

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  // Test 1: Check if we can import and use getBasePrismaClient
  try {
    const { getBasePrismaClient, db } = await import('@/lib/db');
    results.dbModuleLoaded = true;
    results.hasGetBasePrismaClient = typeof getBasePrismaClient === 'function';
    results.hasDb = !!db;

    // Test 2: Try to get the base client
    try {
      const baseClient = getBasePrismaClient();
      results.baseClientCreated = !!baseClient;
      results.baseClientType = typeof baseClient;

      // Check if it looks like a PrismaClient
      results.baseClientHasUser = typeof baseClient.user === 'object';
      results.baseClientHasAccount = typeof baseClient.account === 'object';
      results.baseClientMethods = Object.keys(baseClient).filter(k => !k.startsWith('_')).slice(0, 10);
    } catch (error) {
      results.baseClientError = error instanceof Error ? error.message : 'Unknown';
      results.baseClientStack = error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined;
    }

    // Test 3: Try to create the PrismaAdapter
    try {
      const baseClient = getBasePrismaClient();
      const adapter = PrismaAdapter(baseClient);
      results.adapterCreated = !!adapter;
      results.adapterMethods = Object.keys(adapter).slice(0, 10);
    } catch (error) {
      results.adapterError = error instanceof Error ? error.message : 'Unknown';
      results.adapterStack = error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined;
    }

    // Test 4: Try to query the database
    try {
      const baseClient = getBasePrismaClient();
      const userCount = await baseClient.user.count();
      results.databaseQuery = 'SUCCESS';
      results.userCount = userCount;
    } catch (error) {
      results.databaseQueryError = error instanceof Error ? error.message : 'Unknown';
    }

  } catch (error) {
    results.dbModuleError = error instanceof Error ? error.message : 'Unknown';
    results.dbModuleStack = error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined;
  }

  return NextResponse.json({
    status: 'Adapter Test',
    ...results,
  });
}
