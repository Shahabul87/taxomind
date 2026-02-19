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
          content: section.content ?? undefined,
          metadata: {
            type: section.contentType,
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
      form: null,
      conversation: { messages: [] } as never,
      gamification: {} as never,
      ui: {} as never,
      metadata: { sessionId: '', startedAt: new Date(), lastActivityAt: new Date(), version: '0.1.0' },
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

  // 5. Stack management — prune old snapshots from the bottom
  // Keep only the last 20 snapshots per user (newest on top, oldest pruned)
  store.cleanupOldSnapshots(userId, 20).catch(() => {
    // Non-blocking — cleanup failure shouldn't affect the main flow
  });

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
 * Includes full content from the snapshot so the AI has real page data.
 */
export async function getContextSummaryForRoute(
  userId: string,
): Promise<{ pageSummary: string; formSummary: string; contentSummary: string; navigationSummary: string } | null> {
  const store = getSnapshotStore();
  const snapshot = await store.getLatestSnapshot(userId);
  if (!snapshot) return null;

  // ---- Page Summary ----
  const pageParts: string[] = [];
  pageParts.push(`Page: ${snapshot.page.title || snapshot.page.path} (${snapshot.page.type})`);
  if (snapshot.page.entityId) {
    pageParts.push(`Entity ID: ${snapshot.page.entityId}`);
  }
  if (snapshot.page.breadcrumb?.length > 0) {
    pageParts.push(`Breadcrumb: ${snapshot.page.breadcrumb.join(' > ')}`);
  }
  const stateFlags: string[] = [];
  if (snapshot.page.state?.isEditing) stateFlags.push('editing');
  if (snapshot.page.state?.isDraft) stateFlags.push('draft');
  if (snapshot.page.state?.isPublished) stateFlags.push('published');
  if (stateFlags.length > 0) {
    pageParts.push(`State: ${stateFlags.join(', ')}`);
  }
  const pageSummary = pageParts.join('\n');

  // ---- Content Summary (the actual visible text on the page) ----
  const contentParts: string[] = [];
  if (snapshot.content?.headings?.length > 0) {
    contentParts.push('Headings on page:');
    for (const h of snapshot.content.headings.slice(0, 20)) {
      contentParts.push(`  ${'#'.repeat(h.level)} ${h.text}`);
    }
    if (snapshot.content.headings.length > 20) {
      contentParts.push(`  ...and ${snapshot.content.headings.length - 20} more`);
    }
  }
  if (snapshot.content?.tables?.length > 0) {
    contentParts.push(`Tables: ${snapshot.content.tables.length}`);
    for (const t of snapshot.content.tables.slice(0, 3)) {
      const caption = t.caption ? ` "${t.caption}"` : '';
      contentParts.push(`  - ${t.rowCount} rows, columns: ${t.headers.join(', ')}${caption}`);
    }
  }
  if (snapshot.content?.textSummary) {
    contentParts.push(`\nVisible text on page:\n${snapshot.content.textSummary}`);
  }
  if (snapshot.content?.wordCount > 0) {
    contentParts.push(`Word count: ${snapshot.content.wordCount}`);
  }
  const contentSummary = contentParts.length > 0
    ? contentParts.join('\n')
    : 'No visible content captured.';

  // ---- Form Summary ----
  const formParts: string[] = [];
  const formCount = snapshot.forms?.length ?? 0;
  if (formCount > 0) {
    formParts.push(`${formCount} form(s) on page:`);
    for (const form of snapshot.forms) {
      formParts.push(`Form: ${form.formName || form.formId} (purpose: ${form.purpose})`);
      formParts.push(`  Status: ${form.state.completionPercent}% complete, ${form.state.errorCount} error(s)`);
      for (const field of form.fields) {
        const valueStr = field.value != null && field.value !== ''
          ? `"${String(field.value).slice(0, 80)}"`
          : '(empty)';
        const flags: string[] = [];
        if (field.required) flags.push('required');
        if (field.disabled) flags.push('disabled');
        const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
        formParts.push(`  - ${field.label || field.name} (${field.type}): ${valueStr}${flagStr}`);
      }
    }
  }
  const formSummary = formParts.length > 0 ? formParts.join('\n') : 'No forms on this page.';

  // ---- Navigation Summary ----
  const navParts: string[] = [];
  if (snapshot.navigation?.tabs?.length) {
    const activeTab = snapshot.navigation.tabs.find((t) => t.isActive);
    navParts.push(`Tabs: ${snapshot.navigation.tabs.map((t) => t.label).join(', ')}${activeTab ? ` (active: ${activeTab.label})` : ''}`);
  }
  if (snapshot.navigation?.links?.length) {
    const actionLinks = snapshot.navigation.links.filter((l) => l.category === 'action');
    if (actionLinks.length > 0) {
      navParts.push(`Action links: ${actionLinks.slice(0, 10).map((l) => l.text).join(', ')}`);
    }
    const navLinks = snapshot.navigation.links.filter((l) => l.category === 'navigation');
    if (navLinks.length > 0) {
      navParts.push(`Navigation links: ${navLinks.slice(0, 15).map((l) => l.text).join(', ')}`);
    }
  }
  const navigationSummary = navParts.length > 0 ? navParts.join('\n') : '';

  return { pageSummary, formSummary, contentSummary, navigationSummary };
}
