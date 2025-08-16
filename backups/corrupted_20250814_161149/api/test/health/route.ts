import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import os from 'os';

// Health check endpoint with system metrics
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check database connection
    let dbStatus = 'disconnected';
    let dbLatency = 0;
    
    try {
      const dbStart = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'error';
    }
    
    // System metrics
    const systemMetrics = {
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2) + '%',
      },
      cpu: {
        model: os.cpus()[0]?.model,
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      process: {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    };
    
    // Environment info
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production',
      hasDatabase: !!process.env.DATABASE_URL,
      hasAuth: !!process.env.NEXTAUTH_SECRET,
    };
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
      },
      system: systemMetrics,
      environment,
      checks: {
        api: 'operational',
        database: dbStatus === 'connected' ? 'operational' : 'degraded',
        memory: systemMetrics.memory.percentage < '90%' ? 'healthy' : 'warning',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${Date.now() - startTime}ms`,
      },
      { status: 500 }
    );
  }
}

// Liveness probe endpoint (simple check)
export async function HEAD(req: NextRequest) {
  return new NextResponse(null, { status: 200 });
}