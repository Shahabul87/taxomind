/**
 * Context Gathering Integration
 *
 * Taxomind-specific wiring that connects the portable ContextGatheringEngine
 * and ContextMemoryHydrator to Prisma stores and entity data.
 */

import {
  createContextGatheringEngine,
  createContextMemoryHydrator,
  type PageContextSnapshot,
  type ContextGatheringOutput,
  type ContextGatheringInput,
  type EntityContextData,
  type UserProfileData,
  type SAMConfig,
} from '@sam-ai/core';
import { PrismaContextSnapshotStore } from './stores/context-snapshot-store';
import {
  fetchCourseContext,
  fetchChapterContext,
  fetchSectionContext,
} from './entity-context';

// ============================================================================
// SINGLETON STORE
// ============================================================================

let snapshotStore: PrismaContextSnapshotStore | null = null;

function getSnapshotStore(): PrismaContextSnapshotStore {
  if (!snapshotStore) {
    snapshotStore = new PrismaContextSnapshotStore();
  }
  return snapshotStore;
}

// ============================================================================
// ENTITY ENRICHMENT
// ============================================================================

async function fetchEntityContext(
  pageType: string,
  entityId?: string,
): Promise<EntityContextData | undefined> {
  if (!entityId) return undefined;

  try {
    if (pageType.includes('section')) {
      const section = await fetchSectionContext(entityId);
      if (section) {
        return {
          entityType: 'section',
          entityId: section.id,
          title: section.title,
          description: section.description ?? undefined,
          content: section.contentPreview ?? undefined,
          metadata: {
            type: section.type,
            chapterTitle: section.chapterTitle,
            courseTitle: section.courseTitle,
          },
        };
      }
    }

    if (pageType.includes('chapter')) {
      const chapter = await fetchChapterContext(entityId);
      if (chapter) {
        return {
          entityType: 'chapter',
          entityId: chapter.id,
          title: chapter.title,
          description: chapter.description ?? undefined,
          metadata: {
            position: chapter.position,
            courseTitle: chapter.courseTitle,
            sectionCount: chapter.sections.length,
          },
        };
      }
    }

    if (pageType.includes('course')) {
      const course = await fetchCourseContext(entityId);
      if (course) {
        return {
          entityType: 'course',
          entityId: course.id,
          title: course.title,
          description: course.description ?? undefined,
          metadata: {
            difficulty: course.difficulty,
            chapterCount: course.chapterCount,
            isPublished: course.isPublished,
            categoryName: course.categoryName,
          },
        };
      }
    }
  } catch {
    // Entity fetch failed — continue without enrichment
  }

  return undefined;
}

// ============================================================================
// MAIN INTEGRATION FUNCTION
// ============================================================================

export interface ProcessContextOptions {
  samConfig: SAMConfig;
  userId: string;
  userRole?: string;
}

/**
 * Process a client-submitted context snapshot:
 * 1. Fetch enrichment data from DB (entity context, user profile)
 * 2. Run ContextGatheringEngine
 * 3. Run ContextMemoryHydrator with output directives
 * 4. Return enriched output
 */
export async function processContextSnapshot(
  clientSnapshot: PageContextSnapshot,
  options: ProcessContextOptions,
): Promise<ContextGatheringOutput> {
  const { samConfig, userId, userRole } = options;
  const store = getSnapshotStore();

  // 1. Fetch enrichment data
  const entityContext = await fetchEntityContext(
    clientSnapshot.page.type,
    clientSnapshot.page.entityId,
  );

  const userProfile: UserProfileData = {
    userId,
    role: userRole ?? 'user',
  };

  // 2. Run engine
  const engine = createContextGatheringEngine(samConfig);
  const engineInput: ContextGatheringInput = {
    snapshot: clientSnapshot,
    enrichmentData: {
      entityContext,
      userProfile,
    },
  };

  const result = await engine.execute({
    context: {
      user: { id: userId, role: userRole ?? 'user' } as never,
      page: { type: clientSnapshot.page.type, path: clientSnapshot.page.path } as never,
      conversation: { messages: [] } as never,
      gamification: {} as never,
      ui: {} as never,
    },
    ...engineInput,
  });

  if (!result.success || !result.data) {
    throw new Error(
      `Context gathering engine failed: ${result.error?.message ?? 'Unknown error'}`,
    );
  }

  const output = result.data;

  // 3. Run memory hydration
  const hydrator = createContextMemoryHydrator({
    adapter: store,
  });

  const hydrationResult = await hydrator.hydrate(
    userId,
    output.snapshot,
    output.memoryDirectives,
  );

  // 4. Update summary/confidence on the stored snapshot
  if (hydrationResult.snapshotId) {
    await store.updateSummaryAndConfidence(
      hydrationResult.snapshotId,
      output.pageSummary,
      output.contextConfidence,
    );
  }

  return output;
}

/**
 * Get the latest context snapshot for a user (for use in unified route).
 */
export async function getLatestContextSnapshot(
  userId: string,
): Promise<PageContextSnapshot | null> {
  const store = getSnapshotStore();
  return store.getLatestSnapshot(userId);
}

/**
 * Get the latest enriched context summary for a user's current page.
 */
export async function getContextSummaryForRoute(
  userId: string,
): Promise<{ pageSummary: string; formSummary: string } | null> {
  const store = getSnapshotStore();
  const snapshot = await store.getLatestSnapshot(userId);
  if (!snapshot) return null;

  // Build lightweight summaries without running the full engine
  const pageSummary = `Page: ${snapshot.page.title || snapshot.page.path} (${snapshot.page.type})`;
  const formCount = snapshot.forms?.length ?? 0;
  const formSummary = formCount > 0
    ? `${formCount} form(s) on page. Fields: ${snapshot.forms.flatMap((f) => f.fields.map((fi) => fi.label || fi.name)).join(', ')}`
    : 'No forms on this page.';

  return { pageSummary, formSummary };
}
