/**
 * Prisma Tutoring Session Store
 * Implements TutoringSessionStore interface for cross-session continuity
 * Uses SAMSessionContext model with JSON fields for tutoring-specific data
 */

import { getDb } from './db-provider';
import type {
  TutoringSession,
  TutoringSessionStore,
} from '@sam-ai/agentic';

/**
 * Structure for storing tutoring session data in currentState JSON
 */
interface TutoringSessionState {
  sessionType: 'tutoring';
  planId: string | null;
  messageCount: number;
  stepsCompleted: string[];
  toolsExecuted: string[];
  metadata: Record<string, unknown>;
}

/**
 * Convert SAMSessionContext to TutoringSession
 */
function toTutoringSession(record: {
  id: string;
  userId: string;
  courseId: string | null;
  lastActiveAt: Date;
  currentState: unknown;
  createdAt: Date;
  updatedAt: Date;
}): TutoringSession | null {
  const state = record.currentState as TutoringSessionState | null;
  if (!state || state.sessionType !== 'tutoring') {
    return null;
  }

  return {
    id: record.id,
    userId: record.userId,
    planId: state.planId,
    startedAt: record.createdAt,
    endedAt: null,
    messageCount: state.messageCount,
    stepsCompleted: state.stepsCompleted,
    toolsExecuted: state.toolsExecuted,
    metadata: state.metadata,
  };
}

/**
 * Prisma implementation of TutoringSessionStore
 * Uses SAMSessionContext model with JSON fields for session data
 */
export class PrismaTutoringSessionStore implements TutoringSessionStore {
  /**
   * Get or create a tutoring session for a user
   */
  async getOrCreate(userId: string, planId?: string): Promise<TutoringSession> {
    // Try to find an active session
    const existing = await getDb().sAMSessionContext.findFirst({
      where: {
        userId,
        // Look for sessions where currentState contains sessionType: 'tutoring'
        currentState: {
          path: ['sessionType'],
          equals: 'tutoring',
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    // Check if it's still active (within the last hour)
    if (existing) {
      const session = toTutoringSession(existing);
      if (session) {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        if (existing.lastActiveAt > hourAgo) {
          // Update last active time
          await getDb().sAMSessionContext.update({
            where: { id: existing.id },
            data: { lastActiveAt: new Date() },
          });
          return session;
        }
        // End old session
        await this.end(existing.id);
      }
    }

    // Create new session
    const state: TutoringSessionState = {
      sessionType: 'tutoring',
      planId: planId ?? null,
      messageCount: 0,
      stepsCompleted: [],
      toolsExecuted: [],
      metadata: {},
    };

    const record = await getDb().sAMSessionContext.create({
      data: {
        userId,
        courseId: null,
        lastActiveAt: new Date(),
        currentState: state as unknown as Record<string, unknown>,
        history: [],
        preferences: {},
        insights: {},
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      planId: planId ?? null,
      startedAt: record.createdAt,
      endedAt: null,
      messageCount: 0,
      stepsCompleted: [],
      toolsExecuted: [],
      metadata: {},
    };
  }

  /**
   * Update a tutoring session
   */
  async update(
    sessionId: string,
    updates: Partial<TutoringSession>
  ): Promise<TutoringSession> {
    const existing = await getDb().sAMSessionContext.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new Error(`Tutoring session not found: ${sessionId}`);
    }

    const currentState = existing.currentState as unknown as TutoringSessionState;

    // Merge updates into current state
    const newState: TutoringSessionState = {
      sessionType: 'tutoring',
      planId: updates.planId !== undefined ? updates.planId : currentState.planId,
      messageCount: updates.messageCount ?? currentState.messageCount,
      stepsCompleted: updates.stepsCompleted ?? currentState.stepsCompleted,
      toolsExecuted: updates.toolsExecuted ?? currentState.toolsExecuted,
      metadata: { ...currentState.metadata, ...updates.metadata },
    };

    const record = await getDb().sAMSessionContext.update({
      where: { id: sessionId },
      data: {
        currentState: newState as unknown as Record<string, unknown>,
        lastActiveAt: new Date(),
      },
    });

    const session = toTutoringSession(record);
    if (!session) {
      throw new Error('Failed to convert updated session');
    }
    return session;
  }

  /**
   * End a tutoring session
   */
  async end(sessionId: string): Promise<TutoringSession> {
    const existing = await getDb().sAMSessionContext.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new Error(`Tutoring session not found: ${sessionId}`);
    }

    const currentState = existing.currentState as unknown as TutoringSessionState;

    // Add ended state to the session
    const endedState = {
      ...currentState,
      endedAt: new Date().toISOString(),
    };

    const record = await getDb().sAMSessionContext.update({
      where: { id: sessionId },
      data: {
        currentState: endedState as unknown as Record<string, unknown>,
        lastActiveAt: new Date(),
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      planId: currentState.planId,
      startedAt: record.createdAt,
      endedAt: new Date(),
      messageCount: currentState.messageCount,
      stepsCompleted: currentState.stepsCompleted,
      toolsExecuted: currentState.toolsExecuted,
      metadata: currentState.metadata,
    };
  }

  /**
   * Get the active session for a user
   */
  async getActive(userId: string): Promise<TutoringSession | null> {
    const record = await getDb().sAMSessionContext.findFirst({
      where: {
        userId,
        currentState: {
          path: ['sessionType'],
          equals: 'tutoring',
        },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    if (!record) return null;

    const session = toTutoringSession(record);
    if (!session) return null;

    // Check if session is still active (within the last hour)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (record.lastActiveAt < hourAgo) {
      return null;
    }

    return session;
  }

  /**
   * Get recent sessions for a user
   */
  async getRecent(userId: string, limit?: number): Promise<TutoringSession[]> {
    const records = await getDb().sAMSessionContext.findMany({
      where: {
        userId,
        currentState: {
          path: ['sessionType'],
          equals: 'tutoring',
        },
      },
      orderBy: { lastActiveAt: 'desc' },
      take: limit ?? 10,
    });

    return records
      .map(toTutoringSession)
      .filter((s): s is TutoringSession => s !== null);
  }

  /**
   * Get a session by ID
   */
  async get(sessionId: string): Promise<TutoringSession | null> {
    const record = await getDb().sAMSessionContext.findUnique({
      where: { id: sessionId },
    });

    if (!record) return null;
    return toTutoringSession(record);
  }

  /**
   * Record a step completion
   */
  async recordStepCompletion(sessionId: string, stepId: string): Promise<void> {
    const existing = await getDb().sAMSessionContext.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new Error(`Tutoring session not found: ${sessionId}`);
    }

    const currentState = existing.currentState as unknown as TutoringSessionState;
    if (!currentState.stepsCompleted.includes(stepId)) {
      currentState.stepsCompleted.push(stepId);
    }

    await getDb().sAMSessionContext.update({
      where: { id: sessionId },
      data: {
        currentState: currentState as unknown as Record<string, unknown>,
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Record a tool execution
   */
  async recordToolExecution(sessionId: string, toolId: string): Promise<void> {
    const existing = await getDb().sAMSessionContext.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new Error(`Tutoring session not found: ${sessionId}`);
    }

    const currentState = existing.currentState as unknown as TutoringSessionState;
    currentState.toolsExecuted.push(toolId);

    await getDb().sAMSessionContext.update({
      where: { id: sessionId },
      data: {
        currentState: currentState as unknown as Record<string, unknown>,
        lastActiveAt: new Date(),
      },
    });
  }

  /**
   * Increment message count
   */
  async incrementMessageCount(sessionId: string): Promise<void> {
    const existing = await getDb().sAMSessionContext.findUnique({
      where: { id: sessionId },
    });

    if (!existing) {
      throw new Error(`Tutoring session not found: ${sessionId}`);
    }

    const currentState = existing.currentState as unknown as TutoringSessionState;
    currentState.messageCount += 1;

    await getDb().sAMSessionContext.update({
      where: { id: sessionId },
      data: {
        currentState: currentState as unknown as Record<string, unknown>,
        lastActiveAt: new Date(),
      },
    });
  }
}

/**
 * Factory function to create a PrismaTutoringSessionStore
 */
export function createPrismaTutoringSessionStore(): PrismaTutoringSessionStore {
  return new PrismaTutoringSessionStore();
}
