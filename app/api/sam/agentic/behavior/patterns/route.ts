/**
 * SAM Behavior Patterns API
 * Detects and retrieves behavior patterns for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import {
  createPrismaBehaviorEventStore,
  createPrismaPatternStore,
  createPrismaInterventionStore,
} from '@/lib/sam/stores';
import { createBehaviorMonitor } from '@sam-ai/agentic';

// Initialize stores
const behaviorEventStore = createPrismaBehaviorEventStore();
const patternStore = createPrismaPatternStore();
const interventionStore = createPrismaInterventionStore();

// Lazy initialize behavior monitor
let behaviorMonitorInstance: ReturnType<typeof createBehaviorMonitor> | null = null;

function getBehaviorMonitor() {
  if (!behaviorMonitorInstance) {
    behaviorMonitorInstance = createBehaviorMonitor({
      eventStore: behaviorEventStore,
      patternStore: patternStore,
      interventionStore: interventionStore,
      logger: console,
    });
  }
  return behaviorMonitorInstance;
}

// ============================================================================
// GET - Get detected patterns for the user
// ============================================================================

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const behaviorMonitor = getBehaviorMonitor();
    const patterns = await behaviorMonitor.getPatterns(session.user.id);

    return NextResponse.json({
      success: true,
      data: { patterns },
    });
  } catch (error) {
    logger.error('Error fetching behavior patterns:', error);

    return NextResponse.json(
      { error: 'Failed to fetch behavior patterns' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Trigger pattern detection
// ============================================================================

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const behaviorMonitor = getBehaviorMonitor();

    // Detect patterns from recent events
    const patterns = await behaviorMonitor.detectPatterns(session.user.id);

    logger.info(
      `Detected ${patterns.length} patterns for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      data: {
        patterns,
        detected: patterns.length,
      },
    });
  } catch (error) {
    logger.error('Error detecting behavior patterns:', error);

    return NextResponse.json(
      { error: 'Failed to detect behavior patterns' },
      { status: 500 }
    );
  }
}
