/**
 * Context Snapshot Store - Implements ContextMemoryAdapter from @sam-ai/core
 * Uses Prisma with SAMPageContextSnapshot model for persistent storage
 */

import { getDb } from './db-provider';
import type { ContextMemoryAdapter } from '@sam-ai/core';
import type { PageContextSnapshot } from '@sam-ai/core';

export class PrismaContextSnapshotStore implements ContextMemoryAdapter {
  async storeSnapshot(userId: string, snapshot: PageContextSnapshot): Promise<string> {
    const record = await getDb().sAMPageContextSnapshot.create({
      data: {
        userId,
        pageType: snapshot.page.type,
        pagePath: snapshot.page.path,
        contentHash: snapshot.contentHash,
        snapshot: snapshot as unknown as Record<string, unknown>,
        summary: '',
        confidence: 0,
      },
    });
    return record.id;
  }

  async getLatestSnapshot(userId: string): Promise<PageContextSnapshot | null> {
    const record = await getDb().sAMPageContextSnapshot.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return null;
    return record.snapshot as unknown as PageContextSnapshot;
  }

  async getSnapshotHistory(userId: string, limit = 10): Promise<PageContextSnapshot[]> {
    const records = await getDb().sAMPageContextSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return records.map((r) => r.snapshot as unknown as PageContextSnapshot);
  }

  async getLatestSnapshotForPath(
    userId: string,
    pagePath: string,
  ): Promise<PageContextSnapshot | null> {
    const record = await getDb().sAMPageContextSnapshot.findFirst({
      where: { userId, pagePath },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) return null;
    return record.snapshot as unknown as PageContextSnapshot;
  }

  async updateSummaryAndConfidence(
    snapshotId: string,
    summary: string,
    confidence: number,
  ): Promise<void> {
    await getDb().sAMPageContextSnapshot.update({
      where: { id: snapshotId },
      data: { summary, confidence },
    });
  }

  async cleanupOldSnapshots(userId: string, keepLast = 50): Promise<number> {
    const snapshots = await getDb().sAMPageContextSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: keepLast,
      select: { id: true },
    });

    if (snapshots.length === 0) return 0;

    const result = await getDb().sAMPageContextSnapshot.deleteMany({
      where: { id: { in: snapshots.map((s) => s.id) } },
    });

    return result.count;
  }
}

export function createPrismaContextSnapshotStore(): PrismaContextSnapshotStore {
  return new PrismaContextSnapshotStore();
}
