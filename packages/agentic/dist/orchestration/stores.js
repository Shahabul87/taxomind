/**
 * @sam-ai/agentic - Orchestration Stores
 * In-memory store implementations for orchestration components
 */
// ============================================================================
// IN-MEMORY CONFIRMATION REQUEST STORE
// ============================================================================
export class InMemoryOrchestrationConfirmationStore {
    requests = new Map();
    async create(request) {
        const id = `confirm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const createdAt = new Date();
        const fullRequest = {
            ...request,
            id,
            createdAt,
        };
        this.requests.set(id, fullRequest);
        return fullRequest;
    }
    async get(requestId) {
        return this.requests.get(requestId) ?? null;
    }
    async getByUser(userId, options) {
        let requests = Array.from(this.requests.values()).filter(r => r.userId === userId);
        if (options?.status) {
            requests = requests.filter(r => options.status.includes(r.status));
        }
        // Sort by creation date (newest first)
        requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (options?.limit) {
            requests = requests.slice(0, options.limit);
        }
        return requests;
    }
    async update(requestId, updates) {
        const existing = this.requests.get(requestId);
        if (!existing) {
            throw new Error(`Confirmation request not found: ${requestId}`);
        }
        const updated = {
            ...existing,
            ...updates,
        };
        this.requests.set(requestId, updated);
        return updated;
    }
    async respond(requestId, response) {
        const existing = this.requests.get(requestId);
        if (!existing) {
            throw new Error(`Confirmation request not found: ${requestId}`);
        }
        const updated = {
            ...existing,
            status: response.approved ? 'approved' : 'rejected',
            respondedAt: new Date(),
            rejectionReason: response.rejectionReason ?? null,
        };
        this.requests.set(requestId, updated);
        return updated;
    }
    async expireOld(maxAgeMinutes) {
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
    clear() {
        this.requests.clear();
    }
    size() {
        return this.requests.size;
    }
    getAll() {
        return Array.from(this.requests.values());
    }
}
// ============================================================================
// IN-MEMORY TUTORING SESSION STORE
// ============================================================================
export class InMemoryTutoringSessionStore {
    sessions = new Map();
    userActiveSessions = new Map();
    async getOrCreate(userId, planId) {
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
        const session = {
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
    async update(sessionId, updates) {
        const existing = this.sessions.get(sessionId);
        if (!existing) {
            throw new Error(`Tutoring session not found: ${sessionId}`);
        }
        const updated = {
            ...existing,
            ...updates,
        };
        this.sessions.set(sessionId, updated);
        return updated;
    }
    async end(sessionId) {
        const existing = this.sessions.get(sessionId);
        if (!existing) {
            throw new Error(`Tutoring session not found: ${sessionId}`);
        }
        const ended = {
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
    async getActive(userId) {
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
    async getRecent(userId, limit) {
        let sessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
        // Sort by start date (newest first)
        sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
        if (limit) {
            sessions = sessions.slice(0, limit);
        }
        return sessions;
    }
    // Utility methods for testing/management
    async get(sessionId) {
        return this.sessions.get(sessionId) ?? null;
    }
    clear() {
        this.sessions.clear();
        this.userActiveSessions.clear();
    }
    size() {
        return this.sessions.size;
    }
    getAll() {
        return Array.from(this.sessions.values());
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
export function createInMemoryOrchestrationConfirmationStore() {
    return new InMemoryOrchestrationConfirmationStore();
}
export function createInMemorySessionStore() {
    return new InMemoryTutoringSessionStore();
}
// ============================================================================
// STORE UTILITIES
// ============================================================================
/**
 * Create all in-memory stores for orchestration
 */
export function createInMemoryOrchestrationStores() {
    return {
        confirmationStore: new InMemoryOrchestrationConfirmationStore(),
        sessionStore: new InMemoryTutoringSessionStore(),
    };
}
//# sourceMappingURL=stores.js.map