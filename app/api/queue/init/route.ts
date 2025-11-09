/**
 * Queue Worker Initialization API
 * Initializes all queue workers (call this on application startup)
 */

import { NextResponse } from 'next/server';
import { initializeWorkers } from '@/lib/queue/workers/init-workers';
import { logger } from '@/lib/logger';

let workersInitialized = false;

export async function POST(): Promise<NextResponse> {
  try {
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
  return NextResponse.json(
    {
      success: true,
      workersInitialized,
    },
    { status: 200 }
  );
}
