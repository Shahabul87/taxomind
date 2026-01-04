/**
 * @sam-ai/agentic - Orchestration Stores
 * In-memory store implementations for orchestration components
 */

import type {
  OrchestrationConfirmationRequest,
  ConfirmationResponse,
  OrchestrationConfirmationRequestStore,
  TutoringSession,
  TutoringSessionStore,
} from './types';

// ============================================================================
// IN-MEMORY CONFIRMATION REQUEST STORE
// ============================================================================

export class InMemoryOrchestrationConfirmationStore implements OrchestrationConfirmationRequestStore {
  private readonly requests: Map<string, OrchestrationConfirmationRequest> = new Map();

  async create(
    request: Omit<OrchestrationConfirmationRequest, 'id' | 'createdAt'>
  ): Promise<OrchestrationConfirmationRequest> {
    const id = `confirm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date();

    const fullRequest: OrchestrationConfirmationRequest = {
      ...request,
      id,
      createdAt,
    };

    this.requests.set(id, fullRequest);
    return fullRequest;
  }

  async get(requestId: string): Promise<OrchestrationConfirmationRequest | null> {
    return this.requests.get(requestId) ?? null;
  }

  async getByUser(
    userId: string,
    options?: { status?: string[]; limit?: number }
  ): Promise<OrchestrationConfirmationRequest[]> {
    let requests = Array.from(this.requests.values()).filter(
      r => r.userId === userId
    );

    if (options?.status) {
      requests = requests.filter(r => options.status!.includes(r.status));
    }

    // Sort by creation date (newest first)
    requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (options?.limit) {
      requests = requests.slice(0, options.limit);
    }

    return requests;
  }

  async update(
    requestId: string,
    updates: Partial<OrchestrationConfirmationRequest>
  ): Promise<OrchestrationConfirmationRequest> {
    const existing = this.requests.get(requestId);
    if (!existing) {
      throw new Error(`Confirmation request not found: ${requestId}`);
    }

    const updated: OrchestrationConfirmationRequest = {
      ...existing,
      ...updates,
    };

    this.requests.set(requestId, updated);
    return updated;
  }

  async respond(
    requestId: string,
    response: ConfirmationResponse
  ): Promise<OrchestrationConfirmationRequest> {
    const existing = this.requests.get(requestId);
    if (!existing) {
      throw new Error(`Confirmation request not found: ${requestId}`);
    }

    const updated: OrchestrationConfirmationRequest = {
      ...existing,
      status: response.approved ? 'approved' : 'rejected',
      respondedAt: new Date(),
      rejectionReason: response.rejectionReason ?? null,
    };

    this.requests.set(requestId, updated);
    return updated;
  }

  async expireOld(maxAgeMinutes: number): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let expired = 0;

    for (const [id, request] of this.requests) {
      if (request.status === 'pending' && request.createdAt < cutoff) {
        request.status = 'expired';
        this.requests.set(id, request);
        expired++;
      }
    }

    return expired;
  }

  // Utility methods for testing/management

  clear(): void {
    this.requests.clear();
  }

  size(): number {
    return this.requests.size;
  }

  getAll(): OrchestrationConfirmationRequest[] {
    return Array.from(this.requests.values());
  }
}

// ============================================================================
// IN-MEMORY TUTORING SESSION STORE
// ============================================================================

export class InMemoryTutoringSessionStore implements TutoringSessionStore {
  private readonly sessions: Map<string, TutoringSession> = new Map();
  private readonly userActiveSessions: Map<string, string> = new Map();

  async getOrCreate(userId: string, planId?: string): Promise<TutoringSession> {
    // Check for existing active session
    const activeSessionId = this.userActiveSessions.get(userId);
    if (activeSessionId) {
      const existingSession = this.sessions.get(activeSessionId);
      if (existingSession && !existingSession.endedAt) {
        // Update last activity
        existingSession.startedAt = existingSession.startedAt; // Keep original
        return existingSession;
      }
    }

    // Create new session
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const session: TutoringSession = {
      id,
      userId,
      planId: planId ?? null,
      startedAt: now,
      endedAt: null,
      messageCount: 0,
      stepsCompleted: [],
      toolsExecuted: [],
      metadata: {},
    };

    this.sessions.set(id, session);
    this.userActiveSessions.set(userId, id);

    return session;
  }

  async update(
    sessionId: string,
    updates: Partial<TutoringSession>
  ): Promise<TutoringSession> {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      throw new Error(`Tutoring session not found: ${sessionId}`);
    }

    const updated: TutoringSession = {
      ...existing,
      ...updates,
    };

    this.sessions.set(sessionId, updated);
    return updated;
  }

  async end(sessionId: string): Promise<TutoringSession> {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      throw new Error(`Tutoring session not found: ${sessionId}`);
    }

    const ended: TutoringSession = {
      ...existing,
      endedAt: new Date(),
    };

    this.sessions.set(sessionId, ended);

    // Remove from active sessions
    if (this.userActiveSessions.get(existing.userId) === sessionId) {
      this.userActiveSessions.delete(existing.userId);
    }

    return ended;
  }

  async getActive(userId: string): Promise<TutoringSession | null> {
    const activeSessionId = this.userActiveSessions.get(userId);
    if (!activeSessionId) {
      return null;
    }

    const session = this.sessions.get(activeSessionId);
    if (!session || session.endedAt) {
      this.userActiveSessions.delete(userId);
      return null;
    }

    return session;
  }

  async getRecent(userId: string, limit?: number): Promise<TutoringSession[]> {
    let sessions = Array.from(this.sessions.values()).filter(
      s => s.userId === userId
    );

    // Sort by start date (newest first)
    sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    if (limit) {
      sessions = sessions.slice(0, limit);
    }

    return sessions;
  }

  // Utility methods for testing/management

  async get(sessionId: string): Promise<TutoringSession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  clear(): void {
    this.sessions.clear();
    this.userActiveSessions.clear();
  }

  size(): number {
    return this.sessions.size;
  }

  getAll(): TutoringSession[] {
    return Array.from(this.sessions.values());
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createInMemoryOrchestrationConfirmationStore(): InMemoryOrchestrationConfirmationStore {
  return new InMemoryOrchestrationConfirmationStore();
}

export function createInMemorySessionStore(): InMemoryTutoringSessionStore {
  return new InMemoryTutoringSessionStore();
}

// ============================================================================
// STORE UTILITIES
// ============================================================================

/**
 * Create all in-memory stores for orchestration
 */
export function createInMemoryOrchestrationStores(): OrchestrationStores {
  return {
    confirmationStore: new InMemoryOrchestrationConfirmationStore(),
    sessionStore: new InMemoryTutoringSessionStore(),
  };
}

export interface OrchestrationStores {
  confirmationStore: OrchestrationConfirmationRequestStore;
  sessionStore: TutoringSessionStore;
}
