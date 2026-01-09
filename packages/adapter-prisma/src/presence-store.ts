/**
 * @sam-ai/adapter-prisma - Presence Store
 * Database-backed implementation for user presence tracking
 */

import type {
  PresenceStore,
  UserPresence,
  PresenceStatus,
} from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

export interface PrismaPresenceStoreConfig {
  /** Prisma client instance */
  prisma: PrismaClient;
}

// Prisma client type (using any for portability)
type PrismaClient = {
  sAMUserPresence: {
    findUnique: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord | null>;
    findMany: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord[]>;
    upsert: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord>;
    update: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord>;
    delete: (args: Record<string, unknown>) => Promise<PrismaPresenceRecord>;
    deleteMany: (args: Record<string, unknown>) => Promise<{ count: number }>;
  };
};

// Database record structure
interface PrismaPresenceRecord {
  id: string;
  userId: string;
  connectionId: string | null;
  status: string;
  lastActivityAt: Date;
  connectedAt: Date | null;
  deviceType: string;
  browser: string | null;
  os: string | null;
  pageUrl: string | null;
  courseId: string | null;
  chapterId: string | null;
  sectionId: string | null;
  planId: string | null;
  stepId: string | null;
  goalId: string | null;
  subscriptions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapRecordToPresence(record: PrismaPresenceRecord): UserPresence {
  return {
    userId: record.userId,
    connectionId: record.connectionId || '',
    status: record.status as PresenceStatus,
    lastActivityAt: record.lastActivityAt,
    connectedAt: record.connectedAt || record.createdAt,
    metadata: {
      deviceType: record.deviceType as 'desktop' | 'mobile' | 'tablet',
      browser: record.browser || undefined,
      os: record.os || undefined,
      location: {
        pageUrl: record.pageUrl || undefined,
        courseId: record.courseId || undefined,
        chapterId: record.chapterId || undefined,
        sectionId: record.sectionId || undefined,
      },
      sessionContext: {
        planId: record.planId || undefined,
        stepId: record.stepId || undefined,
        goalId: record.goalId || undefined,
      },
    },
    subscriptions: record.subscriptions,
  };
}

function mapPresenceToData(presence: UserPresence): Record<string, unknown> {
  return {
    connectionId: presence.connectionId || null,
    status: presence.status,
    lastActivityAt: presence.lastActivityAt,
    connectedAt: presence.connectedAt,
    deviceType: presence.metadata.deviceType,
    browser: presence.metadata.browser || null,
    os: presence.metadata.os || null,
    pageUrl: presence.metadata.location?.pageUrl || null,
    courseId: presence.metadata.location?.courseId || null,
    chapterId: presence.metadata.location?.chapterId || null,
    sectionId: presence.metadata.location?.sectionId || null,
    planId: presence.metadata.sessionContext?.planId || null,
    stepId: presence.metadata.sessionContext?.stepId || null,
    goalId: presence.metadata.sessionContext?.goalId || null,
    subscriptions: presence.subscriptions,
  };
}

// ============================================================================
// PRISMA PRESENCE STORE
// ============================================================================

export class PrismaPresenceStore implements PresenceStore {
  private prisma: PrismaClient;

  constructor(config: PrismaPresenceStoreConfig) {
    this.prisma = config.prisma;
  }

  async get(userId: string): Promise<UserPresence | null> {
    const record = await this.prisma.sAMUserPresence.findUnique({
      where: { userId },
    });

    if (!record) return null;
    return mapRecordToPresence(record);
  }

  async getByConnection(connectionId: string): Promise<UserPresence | null> {
    const record = await this.prisma.sAMUserPresence.findUnique({
      where: { connectionId },
    });

    if (!record) return null;
    return mapRecordToPresence(record);
  }

  async set(presence: UserPresence): Promise<void> {
    const data = mapPresenceToData(presence);

    await this.prisma.sAMUserPresence.upsert({
      where: { userId: presence.userId },
      create: {
        userId: presence.userId,
        ...data,
      },
      update: data,
    });
  }

  async update(userId: string, updates: Partial<UserPresence>): Promise<UserPresence | null> {
    const existing = await this.get(userId);
    if (!existing) return null;

    const merged: UserPresence = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...(updates.metadata || {}),
        location: {
          ...existing.metadata.location,
          ...(updates.metadata?.location || {}),
        },
        sessionContext: {
          ...existing.metadata.sessionContext,
          ...(updates.metadata?.sessionContext || {}),
        },
      },
    };

    const data = mapPresenceToData(merged);

    const record = await this.prisma.sAMUserPresence.update({
      where: { userId },
      data,
    });

    return mapRecordToPresence(record);
  }

  async delete(userId: string): Promise<boolean> {
    try {
      await this.prisma.sAMUserPresence.delete({
        where: { userId },
      });
      return true;
    } catch {
      return false;
    }
  }

  async deleteByConnection(connectionId: string): Promise<boolean> {
    try {
      await this.prisma.sAMUserPresence.delete({
        where: { connectionId },
      });
      return true;
    } catch {
      return false;
    }
  }

  async getOnline(): Promise<UserPresence[]> {
    const records = await this.prisma.sAMUserPresence.findMany({
      where: {
        OR: [
          { status: 'ONLINE' },
          { status: 'STUDYING' },
          { status: 'IDLE' },
        ],
      },
    });

    return records.map(mapRecordToPresence);
  }

  async getByStatus(status: PresenceStatus): Promise<UserPresence[]> {
    const records = await this.prisma.sAMUserPresence.findMany({
      where: {
        status: status.toUpperCase(),
      },
    });

    return records.map(mapRecordToPresence);
  }

  async cleanup(olderThan: Date): Promise<number> {
    const result = await this.prisma.sAMUserPresence.deleteMany({
      where: {
        status: 'OFFLINE',
        lastActivityAt: {
          lt: olderThan,
        },
      },
    });

    return result.count;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaPresenceStore(config: PrismaPresenceStoreConfig): PrismaPresenceStore {
  return new PrismaPresenceStore(config);
}
