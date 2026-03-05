/**
 * Queue Worker Initialization API
 * Initializes all queue workers (call this on application startup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeWorkers } from '@/lib/queue/workers/init-workers';
import { logger } from '@/lib/logger';
import { withCronAuth } from '@/lib/api/cron-auth';

let workersInitialized = false;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Require cron auth — this is an internal startup endpoint
    const authResponse = withCronAuth(request);
    if (authResponse) return authResponse;

    if (workersInitialized) {
      return NextResponse.json(
        {
          success: true,
          message: 'Workers already initialized',
        },
        { status: 200 }
      );
    }

    logger.info('[QUEUE_INIT] Initializing queue workers...');

    initializeWorkers();
    workersInitialized = true;

    logger.info('[QUEUE_INIT] Queue workers initialized successfully');

    return NextResponse.json(
      {
        success: true,
        message: 'Queue workers initialized successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[QUEUE_INIT] Error initializing workers:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INITIALIZATION_ERROR',
          message: 'Failed to initialize queue workers',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json(
      {
        success: true,
        workersInitialized,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[QUEUE_INIT_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
