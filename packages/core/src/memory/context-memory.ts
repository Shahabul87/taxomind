/**
 * @sam-ai/core - Context Memory Hydration
 *
 * Portable interfaces and logic for auto-syncing page context snapshots
 * into SAM memory systems (vector store, knowledge graph, session context).
 *
 * No Prisma or Taxomind imports — fully portable.
 */

import type {
  PageContextSnapshot,
  ContextDiff,
  HydrationResult,
  MemoryDirectives,
  FormFieldSnapshot,
} from '../types/context-snapshot';

// ============================================================================
// ADAPTER INTERFACES
// ============================================================================

/**
 * Adapter for persisting and retrieving page context snapshots.
 * Implemented by Prisma adapter in Taxomind, or in-memory for testing.
 */
export interface ContextMemoryAdapter {
  storeSnapshot(userId: string, snapshot: PageContextSnapshot): Promise<string>;
  getLatestSnapshot(userId: string): Promise<PageContextSnapshot | null>;
  getSnapshotHistory(userId: string, limit?: number): Promise<PageContextSnapshot[]>;
}

/**
 * Adapter for vector embedding storage (content ingestion).
 */
export interface VectorStoreInterface {
  ingest(userId: string, chunks: string[], metadata?: Record<string, unknown>): Promise<number>;
}

/**
 * Adapter for knowledge graph updates.
 */
export interface KnowledgeGraphInterface {
  addEntities(
    userId: string,
    entities: Array<{ name: string; type: string; relationships: string[] }>,
  ): Promise<number>;
}

/**
 * Adapter for session context updates.
 */
export interface SessionContextInterface {
  update(userId: string, updates: Record<string, unknown>): Promise<void>;
}

/**
 * Logger interface for the hydrator.
 */
export interface ContextMemoryLogger {
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

// ============================================================================
// DIFF COMPUTATION
// ============================================================================

function computeContextDiff(
  previous: PageContextSnapshot | null,
  current: PageContextSnapshot,
): ContextDiff {
  if (!previous) {
    return {
      hasChanges: true,
      changedSections: ['page', 'forms', 'content', 'navigation', 'interaction'],
      newFormFields: current.forms.flatMap((f) => f.fields),
      changedFormValues: [],
      newContent: current.content.textSummary ? [current.content.textSummary] : [],
      removedContent: [],
    };
  }

  const changedSections: ContextDiff['changedSections'] = [];

  // Compare page
  if (previous.page.path !== current.page.path || previous.page.type !== current.page.type) {
    changedSections.push('page');
  }

  // Compare forms
  const prevFormIds = new Set(previous.forms.map((f) => f.formId));
  const newFormFields: FormFieldSnapshot[] = [];
  const changedFormValues: ContextDiff['changedFormValues'] = [];

  for (const form of current.forms) {
    if (!prevFormIds.has(form.formId)) {
      newFormFields.push(...form.fields);
      changedSections.push('forms');
    } else {
      // Compare field values
      const prevForm = previous.forms.find((f) => f.formId === form.formId);
      if (prevForm) {
        for (const field of form.fields) {
          const prevField = prevForm.fields.find((f) => f.name === field.name);
          if (!prevField) {
            newFormFields.push(field);
          } else if (JSON.stringify(prevField.value) !== JSON.stringify(field.value)) {
            changedFormValues.push({
              field: field.name,
              oldValue: prevField.value,
              newValue: field.value,
            });
          }
        }
        if (changedFormValues.length > 0 || newFormFields.length > 0) {
          changedSections.push('forms');
        }
      }
    }
  }

  // Compare content
  const newContent: string[] = [];
  const removedContent: string[] = [];
  if (previous.content.textSummary !== current.content.textSummary) {
    changedSections.push('content');
    if (current.content.textSummary) newContent.push(current.content.textSummary);
    if (previous.content.textSummary) removedContent.push(previous.content.textSummary);
  }

  // Compare navigation
  if (previous.navigation.links.length !== current.navigation.links.length) {
    changedSections.push('navigation');
  }

  // Compare interaction
  if (
    Math.abs(previous.interaction.scrollPosition - current.interaction.scrollPosition) > 10 ||
    previous.interaction.focusedElement !== current.interaction.focusedElement
  ) {
    changedSections.push('interaction');
  }

  // Deduplicate sections
  const uniqueSections = [...new Set(changedSections)];

  return {
    hasChanges: uniqueSections.length > 0,
    changedSections: uniqueSections,
    newFormFields,
    changedFormValues,
    newContent,
    removedContent,
  };
}

// ============================================================================
// HYDRATOR
// ============================================================================

export interface ContextMemoryHydratorOptions {
  adapter: ContextMemoryAdapter;
  vectorStore?: VectorStoreInterface;
  knowledgeGraph?: KnowledgeGraphInterface;
  sessionContext?: SessionContextInterface;
  logger?: ContextMemoryLogger;
}

export class ContextMemoryHydrator {
  private readonly adapter: ContextMemoryAdapter;
  private readonly vectorStore?: VectorStoreInterface;
  private readonly knowledgeGraph?: KnowledgeGraphInterface;
  private readonly sessionContext?: SessionContextInterface;
  private readonly logger?: ContextMemoryLogger;

  constructor(options: ContextMemoryHydratorOptions) {
    this.adapter = options.adapter;
    this.vectorStore = options.vectorStore;
    this.knowledgeGraph = options.knowledgeGraph;
    this.sessionContext = options.sessionContext;
    this.logger = options.logger;
  }

  async hydrate(
    userId: string,
    snapshot: PageContextSnapshot,
    directives: MemoryDirectives,
  ): Promise<HydrationResult> {
    const sectionsUpdated: string[] = [];
    let vectorsQueued = 0;
    let graphEntitiesAdded = 0;
    let sessionUpdated = false;

    // 1. Compute diff against last snapshot
    const previousSnapshot = await this.adapter.getLatestSnapshot(userId);
    const diff = computeContextDiff(previousSnapshot, snapshot);

    if (!diff.hasChanges && previousSnapshot?.contentHash === snapshot.contentHash) {
      this.logger?.info('No context changes detected, skipping hydration', {
        userId,
        contentHash: snapshot.contentHash,
      });
      return {
        sectionsUpdated: [],
        vectorsQueued: 0,
        graphEntitiesAdded: 0,
        sessionUpdated: false,
        snapshotId: '',
      };
    }

    // 2. Store new snapshot
    const snapshotId = await this.adapter.storeSnapshot(userId, snapshot);
    this.logger?.info('Stored context snapshot', { userId, snapshotId });

    // 3. Vector ingestion (only changed content)
    if (directives.shouldIngestContent && this.vectorStore && directives.contentForIngestion.length > 0) {
      try {
        vectorsQueued = await this.vectorStore.ingest(
          userId,
          directives.contentForIngestion,
          {
            source: 'context-snapshot',
            pageType: snapshot.page.type,
            pagePath: snapshot.page.path,
            snapshotId,
          },
        );
        sectionsUpdated.push('vectors');
        this.logger?.info('Queued vectors for ingestion', { userId, count: vectorsQueued });
      } catch (err) {
        this.logger?.error('Vector ingestion failed', {
          userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 4. Update session context
    if (directives.shouldUpdateSessionContext && this.sessionContext) {
      try {
        await this.sessionContext.update(userId, directives.sessionContextUpdates);
        sessionUpdated = true;
        sectionsUpdated.push('session');
        this.logger?.info('Updated session context', { userId });
      } catch (err) {
        this.logger?.error('Session context update failed', {
          userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 5. Update knowledge graph
    if (
      directives.shouldUpdateKnowledgeGraph &&
      this.knowledgeGraph &&
      directives.entitiesForGraph.length > 0
    ) {
      try {
        graphEntitiesAdded = await this.knowledgeGraph.addEntities(
          userId,
          directives.entitiesForGraph,
        );
        sectionsUpdated.push('knowledge-graph');
        this.logger?.info('Updated knowledge graph', {
          userId,
          count: graphEntitiesAdded,
        });
      } catch (err) {
        this.logger?.error('Knowledge graph update failed', {
          userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return {
      sectionsUpdated,
      vectorsQueued,
      graphEntitiesAdded,
      sessionUpdated,
      snapshotId,
    };
  }

  /**
   * Get diff between current snapshot and the last stored one.
   */
  async getDiff(userId: string, newSnapshot: PageContextSnapshot): Promise<ContextDiff> {
    const previousSnapshot = await this.adapter.getLatestSnapshot(userId);
    return computeContextDiff(previousSnapshot, newSnapshot);
  }
}

// ============================================================================
// IN-MEMORY ADAPTER (for testing)
// ============================================================================

export class InMemoryContextMemoryAdapter implements ContextMemoryAdapter {
  private readonly snapshots = new Map<string, PageContextSnapshot[]>();
  private idCounter = 0;

  async storeSnapshot(userId: string, snapshot: PageContextSnapshot): Promise<string> {
    const existing = this.snapshots.get(userId) ?? [];
    existing.push(snapshot);
    this.snapshots.set(userId, existing);
    this.idCounter += 1;
    return `snap_${this.idCounter}`;
  }

  async getLatestSnapshot(userId: string): Promise<PageContextSnapshot | null> {
    const existing = this.snapshots.get(userId);
    if (!existing || existing.length === 0) return null;
    return existing[existing.length - 1];
  }

  async getSnapshotHistory(userId: string, limit = 10): Promise<PageContextSnapshot[]> {
    const existing = this.snapshots.get(userId) ?? [];
    return existing.slice(-limit);
  }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createContextMemoryHydrator(
  options: ContextMemoryHydratorOptions,
): ContextMemoryHydrator {
  return new ContextMemoryHydrator(options);
}

export function createInMemoryContextMemoryAdapter(): InMemoryContextMemoryAdapter {
  return new InMemoryContextMemoryAdapter();
}
