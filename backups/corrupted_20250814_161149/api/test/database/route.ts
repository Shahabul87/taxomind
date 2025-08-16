import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Database connection and operations test endpoint
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const operation = searchParams.get('operation') || 'status';
  
  const results: any = {
    timestamp: new Date().toISOString(),
    operation,
  };
  
  try {
    switch (operation) {
      case 'status':
        // Check database connection status
        try {
          await db.$queryRaw`SELECT 1`;
          results.connection = 'connected';
          results.status = 'healthy';
        } catch (error) {
          results.connection = 'disconnected';
          results.status = 'unhealthy';
          results.error = error instanceof Error ? error.message : 'Connection failed';
        }
        break;
        
      case 'ping':
        // Measure database latency
        const pingStart = Date.now();
        await db.$queryRaw`SELECT 1`;
        const pingTime = Date.now() - pingStart;
        results.latency = `${pingTime}ms`;
        results.status = pingTime < 50 ? 'excellent' : pingTime < 100 ? 'good' : pingTime < 200 ? 'fair' : 'poor';
        break;
        
      case 'tables':
        // List all tables
        const tables = await db.$queryRaw<Array<{table_name: string}>>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name
        `;
        results.tables = tables.map(t => t.table_name);
        results.tableCount = tables.length;
        break;
        
      case 'counts':
        // Get record counts for main tables
        const counts = {
          users: await db.user.count(),
          courses: await db.course.count(),
          chapters: await db.chapter.count(),
          sections: await db.section.count(),
          enrollments: await db.enrollment.count(),
          purchases: await db.purchase.count(),
        };
        results.recordCounts = counts;
        results.totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
        break;
        
      case 'query':
        // Test various query types
        const queryTests = [];
        
        // Simple select
        const selectStart = Date.now();
        await db.user.findFirst();
        queryTests.push({
          type: 'simple_select',
          time: `${Date.now() - selectStart}ms`,
        });
        
        // Count query
        const countStart = Date.now();
        await db.course.count();
        queryTests.push({
          type: 'count',
          time: `${Date.now() - countStart}ms`,
        });
        
        // Join query
        const joinStart = Date.now();
        await db.course.findFirst({
          include: {
            user: true,
            category: true,
          },
        });
        queryTests.push({
          type: 'join',
          time: `${Date.now() - joinStart}ms`,
        });
        
        // Aggregate query
        const aggregateStart = Date.now();
        await db.course.aggregate({
          _count: true,
          _avg: {
            price: true,
          },
        });
        queryTests.push({
          type: 'aggregate',
          time: `${Date.now() - aggregateStart}ms`,
        });
        
        results.queryTests = queryTests;
        break;
        
      case 'indexes':
        // Check database indexes
        const indexes = await db.$queryRaw<Array<{
          tablename: string;
          indexname: string;
          indexdef: string;
        }>>`
          SELECT 
            tablename,
            indexname,
            indexdef
          FROM pg_indexes
          WHERE schemaname = 'public'
          ORDER BY tablename, indexname
        `;
        
        const indexesByTable: Record<string, string[]> = {};
        indexes.forEach(idx => {
          if (!indexesByTable[idx.tablename]) {
            indexesByTable[idx.tablename] = [];
          }
          indexesByTable[idx.tablename].push(idx.indexname);
        });
        
        results.indexes = indexesByTable;
        results.totalIndexes = indexes.length;
        break;
        
      case 'connections':
        // Check active connections
        const connections = await db.$queryRaw<Array<{
          count: bigint;
        }>>`
          SELECT COUNT(*) as count
          FROM pg_stat_activity
          WHERE state = 'active'
        `;
        results.activeConnections = Number(connections[0].count);
        
        const maxConnections = await db.$queryRaw<Array<{
          setting: string;
        }>>`
          SELECT setting 
          FROM pg_settings 
          WHERE name = 'max_connections'
        `;
        results.maxConnections = parseInt(maxConnections[0].setting);
        results.connectionUsage = `${((results.activeConnections / results.maxConnections) * 100).toFixed(2)}%`;
        break;
        
      case 'transaction':
        // Test transaction
        let transactionSuccess = false;
        try {
          await db.$transaction(async (tx) => {
            // Create a test user
            const testUser = await tx.user.create({
              data: {
                email: `test-${Date.now()}@test.com`,
                name: 'Test User',
              },
            });
            
            // Immediately delete it (rollback test)
            await tx.user.delete({
              where: { id: testUser.id },
            });
            
            transactionSuccess = true;
          });
        } catch (error) {
          results.transactionError = error instanceof Error ? error.message : 'Transaction failed';
        }
        results.transactionTest = transactionSuccess ? 'passed' : 'failed';
        break;
        
      default:
        results.error = 'Unknown operation';
        results.availableOperations = [
          'status - Check connection status',
          'ping - Measure database latency',
          'tables - List all tables',
          'counts - Get record counts',
          'query - Test various query types',
          'indexes - Check database indexes',
          'connections - Check active connections',
          'transaction - Test transaction capability',
        ];
    }
    
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        operation,
        error: error instanceof Error ? error.message : 'Database test failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST endpoint for write tests
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { test = 'create' } = body;
    
    let result;
    
    switch (test) {
      case 'create':
        // Test creating a record
        const timestamp = Date.now();
        const testUser = await db.user.create({
          data: {
            email: `test-${timestamp}@test.com`,
            name: `Test User ${timestamp}`,
          },
        });
        
        // Clean up
        await db.user.delete({
          where: { id: testUser.id },
        });
        
        result = {
          test: 'create',
          success: true,
          message: 'Successfully created and deleted test record',
        };
        break;
        
      case 'bulk':
        // Test bulk operations
        const bulkTimestamp = Date.now();
        const users = await db.user.createMany({
          data: Array(5).fill(null).map((_, i) => ({
            email: `bulk-${bulkTimestamp}-${i}@test.com`,
            name: `Bulk User ${i}`,
          })),
        });
        
        // Clean up
        await db.user.deleteMany({
          where: {
            email: {
              contains: `bulk-${bulkTimestamp}`,
            },
          },
        });
        
        result = {
          test: 'bulk',
          success: true,
          created: users.count,
          message: 'Successfully performed bulk operations',
        };
        break;
        
      default:
        result = {
          test,
          success: false,
          error: 'Unknown test type',
        };
    }
    
    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Write test failed',
      },
      { status: 500 }
    );
  }
}