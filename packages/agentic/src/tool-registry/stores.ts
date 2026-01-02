/**
 * @sam-ai/agentic - In-Memory Stores
 * Reference implementation of stores for development and testing
 */

import {
  type ToolDefinition,
  type ToolInvocation,
  type AuditLogEntry,
  type UserPermission,
  type ConfirmationRequest,
  type ToolStore,
  type InvocationStore,
  type AuditStore,
  type PermissionStore,
  type ConfirmationStore,
  type ToolQueryOptions,
  type AuditQueryOptions,
  type PermissionLevel,
  type ToolCategory,
  type PermissionCheckResult,
} from './types';

// ============================================================================
// IN-MEMORY TOOL STORE
// ============================================================================

export class InMemoryToolStore implements ToolStore {
  private tools: Map<string, ToolDefinition> = new Map();

  async register(tool: ToolDefinition): Promise<void> {
    this.tools.set(tool.id, { ...tool });
  }

  async get(toolId: string): Promise<ToolDefinition | null> {
    const tool = this.tools.get(toolId);
    return tool ? { ...tool } : null;
  }

  async list(options?: ToolQueryOptions): Promise<ToolDefinition[]> {
    let tools = Array.from(this.tools.values());

    if (options?.category) {
      tools = tools.filter((t) => t.category === options.category);
    }

    if (options?.tags?.length) {
      tools = tools.filter((t) =>
        options.tags?.some((tag) => t.tags?.includes(tag))
      );
    }

    if (options?.enabled !== undefined) {
      tools = tools.filter((t) => t.enabled === options.enabled);
    }

    if (options?.deprecated !== undefined) {
      tools = tools.filter((t) => (t.deprecated ?? false) === options.deprecated);
    }

    if (options?.search) {
      const search = options.search.toLowerCase();
      tools = tools.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
      );
    }

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? tools.length;

    return tools.slice(offset, offset + limit).map((t) => ({ ...t }));
  }

  async update(
    toolId: string,
    updates: Partial<ToolDefinition>
  ): Promise<ToolDefinition> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    const updated = { ...tool, ...updates };
    this.tools.set(toolId, updated);
    return { ...updated };
  }

  async delete(toolId: string): Promise<void> {
    this.tools.delete(toolId);
  }

  async enable(toolId: string): Promise<void> {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.enabled = true;
    }
  }

  async disable(toolId: string): Promise<void> {
    const tool = this.tools.get(toolId);
    if (tool) {
      tool.enabled = false;
    }
  }

  // Helper for testing
  clear(): void {
    this.tools.clear();
  }
}

// ============================================================================
// IN-MEMORY INVOCATION STORE
// ============================================================================

export class InMemoryInvocationStore implements InvocationStore {
  private invocations: Map<string, ToolInvocation> = new Map();
  private counter = 0;

  async create(
    data: Omit<ToolInvocation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ToolInvocation> {
    const id = `inv_${++this.counter}`;
    const now = new Date();

    const invocation: ToolInvocation = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.invocations.set(id, invocation);
    return { ...invocation };
  }

  async get(invocationId: string): Promise<ToolInvocation | null> {
    const inv = this.invocations.get(invocationId);
    return inv ? { ...inv } : null;
  }

  async update(
    invocationId: string,
    updates: Partial<ToolInvocation>
  ): Promise<ToolInvocation> {
    const inv = this.invocations.get(invocationId);
    if (!inv) {
      throw new Error(`Invocation not found: ${invocationId}`);
    }

    const updated: ToolInvocation = {
      ...inv,
      ...updates,
      updatedAt: new Date(),
    };
    this.invocations.set(invocationId, updated);
    return { ...updated };
  }

  async getBySession(sessionId: string, limit?: number): Promise<ToolInvocation[]> {
    const invocations = Array.from(this.invocations.values())
      .filter((inv) => inv.sessionId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? invocations.slice(0, limit) : invocations;
  }

  async getByUser(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ToolInvocation[]> {
    const invocations = Array.from(this.invocations.values())
      .filter((inv) => inv.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? invocations.length;

    return invocations.slice(offset, offset + limit);
  }

  // Helper for testing
  clear(): void {
    this.invocations.clear();
    this.counter = 0;
  }
}

// ============================================================================
// IN-MEMORY AUDIT STORE
// ============================================================================

export class InMemoryAuditStore implements AuditStore {
  private entries: AuditLogEntry[] = [];
  private counter = 0;

  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: `audit_${++this.counter}`,
      timestamp: new Date(),
    };

    this.entries.push(logEntry);
    return { ...logEntry };
  }

  async query(options: AuditQueryOptions): Promise<AuditLogEntry[]> {
    let entries = [...this.entries];

    if (options.userId) {
      entries = entries.filter((e) => e.userId === options.userId);
    }

    if (options.toolId) {
      entries = entries.filter((e) => e.toolId === options.toolId);
    }

    if (options.action?.length) {
      entries = entries.filter((e) => options.action?.includes(e.action));
    }

    if (options.level?.length) {
      entries = entries.filter((e) => options.level?.includes(e.level));
    }

    if (options.startDate) {
      entries = entries.filter((e) => e.timestamp >= options.startDate!);
    }

    if (options.endDate) {
      entries = entries.filter((e) => e.timestamp <= options.endDate!);
    }

    entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const offset = options.offset ?? 0;
    const limit = options.limit ?? entries.length;

    return entries.slice(offset, offset + limit);
  }

  async count(options: AuditQueryOptions): Promise<number> {
    const entries = await this.query({ ...options, limit: undefined, offset: undefined });
    return entries.length;
  }

  // Helper for testing
  clear(): void {
    this.entries = [];
    this.counter = 0;
  }

  getAll(): AuditLogEntry[] {
    return [...this.entries];
  }
}

// ============================================================================
// IN-MEMORY PERMISSION STORE
// ============================================================================

export class InMemoryPermissionStore implements PermissionStore {
  private permissions: UserPermission[] = [];

  async grant(permission: Omit<UserPermission, 'grantedAt'>): Promise<UserPermission> {
    const fullPermission: UserPermission = {
      ...permission,
      grantedAt: new Date(),
    };

    // Remove existing matching permission
    this.permissions = this.permissions.filter(
      (p) =>
        !(
          p.userId === permission.userId &&
          p.toolId === permission.toolId &&
          p.category === permission.category
        )
    );

    this.permissions.push(fullPermission);
    return { ...fullPermission };
  }

  async revoke(
    userId: string,
    toolId?: string,
    category?: ToolCategory
  ): Promise<void> {
    this.permissions = this.permissions.filter((p) => {
      if (p.userId !== userId) return true;
      if (toolId && p.toolId !== toolId) return true;
      if (category && p.category !== category) return true;
      return false;
    });
  }

  async check(
    userId: string,
    toolId: string,
    requiredLevels: PermissionLevel[]
  ): Promise<PermissionCheckResult> {
    const now = new Date();

    // Get all applicable permissions
    const userPermissions = this.permissions.filter((p) => {
      if (p.userId !== userId) return false;
      if (p.expiresAt && p.expiresAt < now) return false;
      if (p.toolId && p.toolId !== toolId) return false;
      // Category-based permissions would need tool lookup
      return true;
    });

    // Collect all granted levels
    const grantedLevels = new Set<PermissionLevel>();
    for (const perm of userPermissions) {
      for (const level of perm.levels) {
        grantedLevels.add(level);
      }
    }

    // Check which required levels are missing
    const missingLevels = requiredLevels.filter((level) => !grantedLevels.has(level));

    return {
      granted: missingLevels.length === 0,
      grantedLevels: Array.from(grantedLevels),
      missingLevels,
      reason: missingLevels.length > 0
        ? `Missing permissions: ${missingLevels.join(', ')}`
        : undefined,
    };
  }

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    const now = new Date();
    return this.permissions
      .filter((p) => p.userId === userId && (!p.expiresAt || p.expiresAt > now))
      .map((p) => ({ ...p }));
  }

  // Helper for testing
  clear(): void {
    this.permissions = [];
  }
}

// ============================================================================
// IN-MEMORY CONFIRMATION STORE
// ============================================================================

export class InMemoryConfirmationStore implements ConfirmationStore {
  private confirmations: Map<string, ConfirmationRequest> = new Map();
  private counter = 0;

  async create(
    request: Omit<ConfirmationRequest, 'id' | 'createdAt'>
  ): Promise<ConfirmationRequest> {
    const id = `conf_${++this.counter}`;

    const confirmation: ConfirmationRequest = {
      ...request,
      id,
      createdAt: new Date(),
    };

    this.confirmations.set(id, confirmation);
    return { ...confirmation };
  }

  async get(requestId: string): Promise<ConfirmationRequest | null> {
    const conf = this.confirmations.get(requestId);
    return conf ? { ...conf } : null;
  }

  async getByInvocation(invocationId: string): Promise<ConfirmationRequest | null> {
    for (const conf of this.confirmations.values()) {
      if (conf.invocationId === invocationId) {
        return { ...conf };
      }
    }
    return null;
  }

  async respond(requestId: string, confirmed: boolean): Promise<ConfirmationRequest> {
    const conf = this.confirmations.get(requestId);
    if (!conf) {
      throw new Error(`Confirmation not found: ${requestId}`);
    }

    conf.status = confirmed ? 'confirmed' : 'denied';
    conf.respondedAt = new Date();

    return { ...conf };
  }

  async getPending(userId: string): Promise<ConfirmationRequest[]> {
    const now = new Date();
    return Array.from(this.confirmations.values())
      .filter(
        (c) =>
          c.userId === userId &&
          c.status === 'pending' &&
          (!c.expiresAt || c.expiresAt > now)
      )
      .map((c) => ({ ...c }));
  }

  // Helper for testing
  clear(): void {
    this.confirmations.clear();
    this.counter = 0;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export interface InMemoryStores {
  toolStore: InMemoryToolStore;
  invocationStore: InMemoryInvocationStore;
  auditStore: InMemoryAuditStore;
  permissionStore: InMemoryPermissionStore;
  confirmationStore: InMemoryConfirmationStore;
}

export function createInMemoryStores(): InMemoryStores {
  return {
    toolStore: new InMemoryToolStore(),
    invocationStore: new InMemoryInvocationStore(),
    auditStore: new InMemoryAuditStore(),
    permissionStore: new InMemoryPermissionStore(),
    confirmationStore: new InMemoryConfirmationStore(),
  };
}
