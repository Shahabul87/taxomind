/**
 * SAM Memory Client Adapter
 * Provides the same interface as the stub but with persistent storage via API
 *
 * Features:
 * - Local cache for immediate returns (optimistic updates)
 * - Background sync to server for persistence
 * - Graceful degradation on API failures
 * - Session storage for client-side resilience
 */

import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

type MemoryValue = string | number | boolean | object | null | undefined;

interface ConversationData {
  type: string;
  content: string;
  context?: string;
  page?: string;
  timestamp?: Date;
  suggestions?: string[];
  actionsTaken?: Record<string, MemoryValue>;
  [key: string]: MemoryValue;
}

interface WizardState {
  currentPage?: string;
  wizardData?: Record<string, MemoryValue>;
  generatedStructure?: Record<string, MemoryValue>;
  courseData?: Record<string, MemoryValue>;
  completionStatus?: Record<string, MemoryValue>;
  pageContexts?: Record<string, Record<string, MemoryValue>>;
  conversations?: ConversationData[];
  wizardInteractions?: Record<string, MemoryValue>[];
  successfulGenerations?: number;
  sessionInfo?: {
    id: string;
    startTime: string;
    endTime?: string;
    active: boolean;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'sam_wizard_memory';
const API_ENDPOINT = '/api/sam/wizard-memory';
const SYNC_DEBOUNCE_MS = 500;

// ============================================================================
// HELPERS
// ============================================================================

function getStorageKey(courseId?: string): string {
  return courseId ? `${STORAGE_KEY}_${courseId}` : STORAGE_KEY;
}

function loadFromStorage(courseId?: string): WizardState {
  if (typeof window === 'undefined') return {};
  try {
    const stored = sessionStorage.getItem(getStorageKey(courseId));
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveToStorage(state: WizardState, courseId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(getStorageKey(courseId), JSON.stringify(state));
  } catch (error) {
    logger.warn('[sam-memory-client] Failed to save to storage:', error);
  }
}

// ============================================================================
// CLIENT CLASS
// ============================================================================

class SamMemoryClient {
  private cache: WizardState = {};
  private courseId?: string;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingOperations: Array<{
    operation: string;
    data: Record<string, unknown>;
  }> = [];

  constructor() {
    // Load from session storage on init
    if (typeof window !== 'undefined') {
      this.cache = loadFromStorage();
    }
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  private updateCache(updater: (state: WizardState) => WizardState): void {
    this.cache = updater(this.cache);
    saveToStorage(this.cache, this.courseId);
    this.scheduleSyncToServer();
  }

  private scheduleSyncToServer(): void {
    if (typeof window === 'undefined') return;

    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.flushPendingOperations();
    }, SYNC_DEBOUNCE_MS);
  }

  private async flushPendingOperations(): Promise<void> {
    if (this.pendingOperations.length === 0) return;

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    // Execute all pending operations
    for (const op of operations) {
      try {
        await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: op.operation,
            data: op.data,
            courseId: this.courseId,
          }),
        });
      } catch (error) {
        logger.warn('[sam-memory-client] Failed to sync operation:', {
          operation: op.operation,
          error,
        });
      }
    }
  }

  private queueOperation(
    operation: string,
    data: Record<string, unknown>
  ): void {
    this.pendingOperations.push({ operation, data });
  }

  private async fetchFromServer<T>(
    key: string,
    params?: Record<string, string>
  ): Promise<T | null> {
    if (typeof window === 'undefined') return null;

    try {
      const searchParams = new URLSearchParams({
        key,
        ...params,
        ...(this.courseId ? { courseId: this.courseId } : {}),
      });

      const response = await fetch(`${API_ENDPOINT}?${searchParams}`);
      if (!response.ok) return null;

      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      logger.warn('[sam-memory-client] Failed to fetch from server:', {
        key,
        error,
      });
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // Public API - Same as stub
  // --------------------------------------------------------------------------

  /**
   * Set course context for memory operations
   */
  setCourseContext(courseId: string | undefined): void {
    this.courseId = courseId;
    this.cache = loadFromStorage(courseId);
  }

  /**
   * Update current page context
   */
  updateCurrentPage(page: string): void {
    logger.info('[sam-memory-client] Page updated', { page });
    this.updateCache((state) => ({ ...state, currentPage: page }));
    this.queueOperation('updateCurrentPage', { page });
  }

  /**
   * Store a value in memory
   */
  store(key: string, value: MemoryValue): void {
    logger.info('[sam-memory-client] Stored', { key });
    this.updateCache((state) => ({
      ...state,
      [key]: value,
    }));
    // Note: Generic store not synced to server - use specific methods
  }

  /**
   * Retrieve a value from memory
   */
  retrieve(key: string): MemoryValue {
    return this.cache[key as keyof WizardState] ?? null;
  }

  /**
   * Clear memory
   */
  clear(): void {
    logger.info('[sam-memory-client] Cleared');
    this.cache = {};
    saveToStorage({}, this.courseId);
    // Sync clear to server
    if (typeof window !== 'undefined') {
      fetch(`${API_ENDPOINT}${this.courseId ? `?courseId=${this.courseId}` : ''}`, {
        method: 'DELETE',
      }).catch(() => {
        // Ignore errors on clear
      });
    }
  }

  /**
   * Get current page
   */
  getCurrentPage(): string | null {
    return this.cache.currentPage ?? null;
  }

  /**
   * Update course data
   */
  updateCourseData(courseData: Record<string, MemoryValue>): void {
    const id =
      typeof courseData.id === 'string' ? courseData.id : 'unknown';
    logger.info('[sam-memory-client] Course data updated', { courseId: id });
    this.updateCache((state) => ({ ...state, courseData }));
    this.queueOperation('updateCourseData', { courseData });
  }

  /**
   * Update completion status
   */
  updateCompletionStatus(status: Record<string, MemoryValue>): void {
    logger.info('[sam-memory-client] Completion status updated');
    this.updateCache((state) => ({ ...state, completionStatus: status }));
    this.queueOperation('updateCompletionStatus', { completionStatus: status });
  }

  /**
   * Get course data
   */
  getCourseData(): object | null {
    return this.cache.courseData ?? null;
  }

  /**
   * Get completion status
   */
  getCompletionStatus(): object | null {
    return this.cache.completionStatus ?? null;
  }

  /**
   * Get context for page
   */
  getContextForPage(page: string): object | null {
    logger.info('[sam-memory-client] Get context for page', { page });
    return this.cache.pageContexts?.[page] ?? null;
  }

  /**
   * Set context for page
   */
  setContextForPage(page: string, context: Record<string, MemoryValue>): void {
    logger.info('[sam-memory-client] Set context for page', { page });
    this.updateCache((state) => ({
      ...state,
      pageContexts: {
        ...(state.pageContexts ?? {}),
        [page]: context,
      },
    }));
    this.queueOperation('setContextForPage', { page, context });
  }

  /**
   * Add conversation
   */
  addConversation(data: ConversationData): void {
    logger.info('[sam-memory-client] Add conversation', {
      type: data.type,
      context: data.context,
    });
    const conversationEntry = {
      ...data,
      timestamp: data.timestamp ?? new Date(),
    };
    this.updateCache((state) => {
      const conversations = state.conversations ?? [];
      return {
        ...state,
        conversations: [...conversations, conversationEntry],
      };
    });
    this.queueOperation('addConversation', { conversation: data });
  }

  /**
   * Get conversations
   */
  getConversations(limit?: number): ConversationData[] {
    const conversations = this.cache.conversations ?? [];
    return limit ? conversations.slice(-limit) : conversations;
  }

  /**
   * Get relevant interactions
   */
  getRelevantInteractions(
    context: string,
    limit: number = 10
  ): ConversationData[] {
    logger.info('[sam-memory-client] Get relevant interactions', {
      context,
      limit,
    });
    const conversations = this.cache.conversations ?? [];
    const filtered = conversations.filter(
      (conv) => conv.context === context || conv.page === context
    );
    return filtered.slice(-limit);
  }

  /**
   * Save generated course structure
   */
  saveGeneratedStructure(structure: Record<string, MemoryValue>): void {
    logger.info('[sam-memory-client] Save generated structure', {
      hasDescription: 'courseDescription' in structure,
      hasObjectives: 'enhancedObjectives' in structure,
      hasChapters: 'chapters' in structure,
    });
    this.updateCache((state) => ({ ...state, generatedStructure: structure }));
    this.queueOperation('saveGeneratedStructure', { structure });
  }

  /**
   * Get generated structure
   */
  getGeneratedStructure(): Record<string, MemoryValue> | null {
    return this.cache.generatedStructure ?? null;
  }

  /**
   * Increment successful generations counter
   */
  incrementSuccessfulGenerations(): void {
    const newCount = (this.cache.successfulGenerations ?? 0) + 1;
    this.updateCache((state) => ({
      ...state,
      successfulGenerations: newCount,
    }));
    logger.info('[sam-memory-client] Incremented successful generations', {
      newCount,
    });
    this.queueOperation('incrementSuccessfulGenerations', {});
  }

  /**
   * Get successful generations count
   */
  getSuccessfulGenerations(): number {
    return this.cache.successfulGenerations ?? 0;
  }

  /**
   * Save wizard data
   */
  saveWizardData(data: Record<string, MemoryValue>): void {
    logger.info('[sam-memory-client] Save wizard data', {
      hasCourseTitle: 'courseTitle' in data,
      hasOverview: 'courseShortOverview' in data,
      hasCategory: 'courseCategory' in data,
    });
    // REPLACE (not merge) so that stale fields from a previous course
    // don't survive a reset. The caller always sends the full wizard state.
    this.updateCache((state) => ({
      ...state,
      wizardData: data,
    }));
    this.queueOperation('saveWizardData', { wizardData: data });
  }

  /**
   * Get wizard data
   */
  getWizardData(): Record<string, MemoryValue> | null {
    return this.cache.wizardData ?? null;
  }

  /**
   * Add wizard interaction
   */
  addWizardInteraction(interaction: Record<string, MemoryValue>): void {
    logger.info('[sam-memory-client] Add wizard interaction', {
      type: interaction.type,
      step: interaction.step,
    });
    this.updateCache((state) => {
      const interactions = state.wizardInteractions ?? [];
      return {
        ...state,
        wizardInteractions: [
          ...interactions,
          {
            ...interaction,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });
    this.queueOperation('addWizardInteraction', { interaction });
  }

  /**
   * Get wizard interactions
   */
  getWizardInteractions(limit?: number): Record<string, MemoryValue>[] {
    const interactions = this.cache.wizardInteractions ?? [];
    return limit ? interactions.slice(-limit) : interactions;
  }

  /**
   * Start a session
   */
  startSession(sessionId: string): void {
    logger.info('[sam-memory-client] Start session', { sessionId });
    this.updateCache((state) => ({
      ...state,
      sessionInfo: {
        id: sessionId,
        startTime: new Date().toISOString(),
        active: true,
      },
    }));
    this.queueOperation('startSession', { sessionId });
  }

  /**
   * End current session
   */
  endSession(): void {
    if (this.cache.sessionInfo) {
      logger.info('[sam-memory-client] End session', {
        sessionId: this.cache.sessionInfo.id,
      });
      this.updateCache((state) => ({
        ...state,
        sessionInfo: state.sessionInfo
          ? {
              ...state.sessionInfo,
              endTime: new Date().toISOString(),
              active: false,
            }
          : undefined,
      }));
      this.queueOperation('endSession', {});
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): Record<string, MemoryValue> | null {
    return this.cache.sessionInfo ?? null;
  }

  // --------------------------------------------------------------------------
  // Async Methods (for explicit server sync)
  // --------------------------------------------------------------------------

  /**
   * Force sync all pending operations to server
   */
  async sync(): Promise<void> {
    await this.flushPendingOperations();
  }

  /**
   * Load state from server (useful on page load)
   */
  async loadFromServer(): Promise<void> {
    const serverState = await this.fetchFromServer<WizardState>('all');
    if (serverState) {
      this.cache = { ...this.cache, ...serverState };
      saveToStorage(this.cache, this.courseId);
    }
  }
}

// Export singleton instance
export const samMemory = new SamMemoryClient();
