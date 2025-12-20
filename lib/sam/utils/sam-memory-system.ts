import { logger } from '@/lib/logger';

/**
 * SAM Memory System - Stub Implementation
 * This is a minimal stub for backward compatibility
 */

type MemoryValue = string | number | boolean | object | null | undefined;

interface MemoryEntry {
  key: string;
  value: MemoryValue;
  timestamp: Date;
}

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

class SamMemorySystem {
  private memory: Map<string, MemoryEntry> = new Map();

  /**
   * Update current page context
   */
  updateCurrentPage(page: string): void {
    logger.info('SAM Memory: Page updated (stub)', { page });
    this.memory.set('currentPage', {
      key: 'currentPage',
      value: page,
      timestamp: new Date()
    });
  }

  /**
   * Store a value in memory
   */
  store(key: string, value: MemoryValue): void {
    logger.info('SAM Memory: Stored (stub)', { key });
    this.memory.set(key, {
      key,
      value,
      timestamp: new Date()
    });
  }

  /**
   * Retrieve a value from memory
   */
  retrieve(key: string): MemoryValue {
    const entry = this.memory.get(key);
    return entry ? entry.value : null;
  }

  /**
   * Clear memory
   */
  clear(): void {
    logger.info('SAM Memory: Cleared (stub)');
    this.memory.clear();
  }

  /**
   * Get current page
   */
  getCurrentPage(): string | null {
    const result = this.retrieve('currentPage');
    return typeof result === 'string' ? result : null;
  }

  /**
   * Update course data (stub)
   */
  updateCourseData(courseData: Record<string, MemoryValue>): void {
    const id = typeof courseData.id === 'string' ? courseData.id : 'unknown';
    logger.info('SAM Memory: Course data updated (stub)', { courseId: id });
    this.store('courseData', courseData);
  }

  /**
   * Update completion status (stub)
   */
  updateCompletionStatus(status: Record<string, MemoryValue>): void {
    logger.info('SAM Memory: Completion status updated (stub)');
    this.store('completionStatus', status);
  }

  /**
   * Get course data (stub)
   */
  getCourseData(): object | null {
    const result = this.retrieve('courseData');
    return typeof result === 'object' && result !== null ? result : null;
  }

  /**
   * Get completion status (stub)
   */
  getCompletionStatus(): object | null {
    const result = this.retrieve('completionStatus');
    return typeof result === 'object' && result !== null ? result : null;
  }

  /**
   * Get context for page (stub)
   */
  getContextForPage(page: string): object | null {
    logger.info('SAM Memory: Get context for page (stub)', { page });
    const result = this.retrieve(`page_${page}`);
    return typeof result === 'object' && result !== null ? result : null;
  }

  /**
   * Set context for page (stub)
   */
  setContextForPage(page: string, context: Record<string, MemoryValue>): void {
    logger.info('SAM Memory: Set context for page (stub)', { page });
    this.store(`page_${page}`, context);
  }

  /**
   * Add conversation (stub)
   */
  addConversation(data: ConversationData): void {
    logger.info('SAM Memory: Add conversation (stub)', { type: data.type, context: data.context });
    const conversationsRaw = this.retrieve('conversations');
    const conversations = Array.isArray(conversationsRaw) ? conversationsRaw : [];
    conversations.push({
      ...data,
      timestamp: data.timestamp || new Date()
    });
    this.store('conversations', conversations);
  }

  /**
   * Get conversations (stub)
   */
  getConversations(limit?: number): ConversationData[] {
    const conversationsRaw = this.retrieve('conversations');
    const conversations = Array.isArray(conversationsRaw) ? conversationsRaw as ConversationData[] : [];
    return limit ? conversations.slice(-limit) : conversations;
  }

  /**
   * Get relevant interactions (stub)
   */
  getRelevantInteractions(context: string, limit: number = 10): ConversationData[] {
    logger.info('SAM Memory: Get relevant interactions (stub)', { context, limit });
    const conversations = this.getConversations(limit);
    return conversations.filter((conv: ConversationData) => conv.context === context || conv.page === context);
  }

  /**
   * Save generated course structure (stub)
   */
  saveGeneratedStructure(structure: Record<string, MemoryValue>): void {
    logger.info('SAM Memory: Save generated structure (stub)', {
      hasDescription: 'courseDescription' in structure,
      hasObjectives: 'enhancedObjectives' in structure,
      hasChapters: 'chapters' in structure
    });
    this.store('generatedStructure', structure);
  }

  /**
   * Get generated structure (stub)
   */
  getGeneratedStructure(): Record<string, MemoryValue> | null {
    const result = this.retrieve('generatedStructure');
    return typeof result === 'object' && result !== null ? result as Record<string, MemoryValue> : null;
  }

  /**
   * Increment successful generations counter (stub)
   */
  incrementSuccessfulGenerations(): void {
    const currentCount = this.retrieve('successfulGenerations');
    const count = typeof currentCount === 'number' ? currentCount : 0;
    this.store('successfulGenerations', count + 1);
    logger.info('SAM Memory: Incremented successful generations', { newCount: count + 1 });
  }

  /**
   * Get successful generations count (stub)
   */
  getSuccessfulGenerations(): number {
    const count = this.retrieve('successfulGenerations');
    return typeof count === 'number' ? count : 0;
  }

  /**
   * Save wizard data (stub)
   */
  saveWizardData(data: Record<string, MemoryValue>): void {
    logger.info('SAM Memory: Save wizard data (stub)', {
      hasCourseTitle: 'courseTitle' in data,
      hasOverview: 'courseShortOverview' in data,
      hasCategory: 'courseCategory' in data
    });
    this.store('wizardData', data);
  }

  /**
   * Get wizard data (stub)
   */
  getWizardData(): Record<string, MemoryValue> | null {
    const result = this.retrieve('wizardData');
    return typeof result === 'object' && result !== null ? result as Record<string, MemoryValue> : null;
  }

  /**
   * Add wizard interaction (stub)
   */
  addWizardInteraction(interaction: Record<string, MemoryValue>): void {
    logger.info('SAM Memory: Add wizard interaction (stub)', {
      type: interaction.type,
      step: interaction.step
    });
    const interactionsRaw = this.retrieve('wizardInteractions');
    const interactions = Array.isArray(interactionsRaw) ? interactionsRaw : [];
    interactions.push({
      ...interaction,
      timestamp: new Date()
    });
    this.store('wizardInteractions', interactions);
  }

  /**
   * Get wizard interactions (stub)
   */
  getWizardInteractions(limit?: number): Record<string, MemoryValue>[] {
    const interactionsRaw = this.retrieve('wizardInteractions');
    const interactions = Array.isArray(interactionsRaw) ? interactionsRaw as Record<string, MemoryValue>[] : [];
    return limit ? interactions.slice(-limit) : interactions;
  }

  /**
   * Start a session (stub)
   */
  startSession(sessionId: string): void {
    logger.info('SAM Memory: Start session (stub)', { sessionId });
    this.store('currentSession', {
      id: sessionId,
      startTime: new Date(),
      active: true
    });
  }

  /**
   * End current session (stub)
   */
  endSession(): void {
    const sessionRaw = this.retrieve('currentSession');
    if (sessionRaw && typeof sessionRaw === 'object') {
      const session = sessionRaw as Record<string, MemoryValue>;
      logger.info('SAM Memory: End session (stub)', { sessionId: session.id });
      this.store('currentSession', {
        ...session,
        endTime: new Date(),
        active: false
      });
    }
  }

  /**
   * Get current session (stub)
   */
  getCurrentSession(): Record<string, MemoryValue> | null {
    const result = this.retrieve('currentSession');
    return typeof result === 'object' && result !== null ? result as Record<string, MemoryValue> : null;
  }
}

// Export singleton instance
export const samMemory = new SamMemorySystem();
