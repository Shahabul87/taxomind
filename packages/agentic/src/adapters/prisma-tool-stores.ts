/**
 * @sam-ai/agentic - Prisma Tool Stores
 * Prisma-based implementations of tool registry stores
 */

import type {
  ToolStore,
  ToolDefinition,
  ToolQueryOptions,
  InvocationStore,
  ToolInvocation,
  AuditStore,
  AuditLogEntry,
  AuditQueryOptions,
  PermissionStore,
  UserPermission,
  PermissionLevel,
  PermissionCheckResult,
  ToolCategory,
  ConfirmationStore,
  ConfirmationRequest,
} from '../tool-registry/types';

// ============================================================================
// PRISMA CLIENT TYPE
// ============================================================================

/**
 * Prisma Client interface (to avoid direct dependency on @prisma/client)
 */
export interface PrismaClientLike {
  agentTool: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null>;
    findMany: (args?: { where?: Record<string, unknown>; take?: number; skip?: number; orderBy?: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    delete: (args: { where: { id: string } }) => Promise<Record<string, unknown>>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  agentToolInvocation: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null>;
    findMany: (args?: { where?: Record<string, unknown>; take?: number; skip?: number; orderBy?: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
  agentAuditLog: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findMany: (args?: { where?: Record<string, unknown>; take?: number; skip?: number; orderBy?: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
  agentPermission: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findMany: (args?: { where?: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
    deleteMany: (args?: { where?: Record<string, unknown> }) => Promise<{ count: number }>;
  };
  agentConfirmation: {
    create: (args: { data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
    findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null>;
    findFirst: (args?: { where?: Record<string, unknown> }) => Promise<Record<string, unknown> | null>;
    findMany: (args?: { where?: Record<string, unknown> }) => Promise<Record<string, unknown>[]>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<Record<string, unknown>>;
  };
}

// ============================================================================
// TOOL STORE
// ============================================================================

/**
 * Create a Prisma-based ToolStore
 */
export function createPrismaToolStore(
  prisma: PrismaClientLike,
  toolHandlers: Map<string, ToolDefinition['handler']>
): ToolStore {
  return {
    async register(tool: ToolDefinition): Promise<void> {
      // Store handler in memory map
      toolHandlers.set(tool.id, tool.handler);

      // Store tool metadata in database
      await prisma.agentTool.create({
        data: {
          id: tool.id,
          name: tool.name,
          description: tool.description,
          category: tool.category,
          version: tool.version,
          inputSchema: JSON.stringify(tool.inputSchema),
          outputSchema: tool.outputSchema ? JSON.stringify(tool.outputSchema) : null,
          requiredPermissions: tool.requiredPermissions,
          confirmationType: tool.confirmationType,
          timeoutMs: tool.timeoutMs,
          maxRetries: tool.maxRetries,
          rateLimit: tool.rateLimit ? JSON.stringify(tool.rateLimit) : null,
          tags: tool.tags ?? [],
          examples: tool.examples ? JSON.stringify(tool.examples) : null,
          metadata: tool.metadata ? JSON.stringify(tool.metadata) : null,
          enabled: tool.enabled,
          deprecated: tool.deprecated ?? false,
          deprecationMessage: tool.deprecationMessage,
        },
      });
    },

    async get(toolId: string): Promise<ToolDefinition | null> {
      const record = await prisma.agentTool.findUnique({
        where: { id: toolId },
      });

      if (!record) {
        return null;
      }

      const handler = toolHandlers.get(toolId);
      if (!handler) {
        return null;
      }

      return mapRecordToToolDefinition(record, handler);
    },

    async list(options?: ToolQueryOptions): Promise<ToolDefinition[]> {
      const where: Record<string, unknown> = {};

      if (options?.category) {
        where.category = options.category;
      }
      if (options?.enabled !== undefined) {
        where.enabled = options.enabled;
      }
      if (options?.deprecated !== undefined) {
        where.deprecated = options.deprecated;
      }
      if (options?.tags?.length) {
        where.tags = { hasSome: options.tags };
      }
      if (options?.search) {
        where.OR = [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } },
        ];
      }

      const records = await prisma.agentTool.findMany({
        where,
        take: options?.limit,
        skip: options?.offset,
        orderBy: { name: 'asc' },
      });

      return records
        .map((record) => {
          const handler = toolHandlers.get(record.id as string);
          if (!handler) return null;
          return mapRecordToToolDefinition(record, handler);
        })
        .filter((t): t is ToolDefinition => t !== null);
    },

    async update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition> {
      const data: Record<string, unknown> = {};

      if (updates.name) data.name = updates.name;
      if (updates.description) data.description = updates.description;
      if (updates.version) data.version = updates.version;
      if (updates.enabled !== undefined) data.enabled = updates.enabled;
      if (updates.deprecated !== undefined) data.deprecated = updates.deprecated;
      if (updates.deprecationMessage) data.deprecationMessage = updates.deprecationMessage;
      if (updates.timeoutMs) data.timeoutMs = updates.timeoutMs;
      if (updates.maxRetries) data.maxRetries = updates.maxRetries;
      if (updates.tags) data.tags = updates.tags;
      if (updates.rateLimit) data.rateLimit = JSON.stringify(updates.rateLimit);
      if (updates.metadata) data.metadata = JSON.stringify(updates.metadata);

      data.updatedAt = new Date();

      const record = await prisma.agentTool.update({
        where: { id: toolId },
        data,
      });

      const handler = toolHandlers.get(toolId);
      if (!handler) {
        throw new Error(`Handler not found for tool: ${toolId}`);
      }

      return mapRecordToToolDefinition(record, handler);
    },

    async delete(toolId: string): Promise<void> {
      await prisma.agentTool.delete({
        where: { id: toolId },
      });
      toolHandlers.delete(toolId);
    },

    async enable(toolId: string): Promise<void> {
      await prisma.agentTool.update({
        where: { id: toolId },
        data: { enabled: true, updatedAt: new Date() },
      });
    },

    async disable(toolId: string): Promise<void> {
      await prisma.agentTool.update({
        where: { id: toolId },
        data: { enabled: false, updatedAt: new Date() },
      });
    },
  };
}

// ============================================================================
// INVOCATION STORE
// ============================================================================

/**
 * Create a Prisma-based InvocationStore
 */
export function createPrismaInvocationStore(prisma: PrismaClientLike): InvocationStore {
  return {
    async create(
      invocation: Omit<ToolInvocation, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<ToolInvocation> {
      const record = await prisma.agentToolInvocation.create({
        data: {
          toolId: invocation.toolId,
          userId: invocation.userId,
          sessionId: invocation.sessionId,
          input: JSON.stringify(invocation.input),
          validatedInput: invocation.validatedInput ? JSON.stringify(invocation.validatedInput) : null,
          status: invocation.status,
          confirmationType: invocation.confirmationType,
          confirmationPrompt: invocation.confirmationPrompt,
          userConfirmed: invocation.userConfirmed,
          confirmedAt: invocation.confirmedAt,
          startedAt: invocation.startedAt,
          completedAt: invocation.completedAt,
          duration: invocation.duration,
          result: invocation.result ? JSON.stringify(invocation.result) : null,
          metadata: invocation.metadata ? JSON.stringify(invocation.metadata) : null,
        },
      });

      return mapRecordToInvocation(record);
    },

    async get(invocationId: string): Promise<ToolInvocation | null> {
      const record = await prisma.agentToolInvocation.findUnique({
        where: { id: invocationId },
      });

      if (!record) {
        return null;
      }

      return mapRecordToInvocation(record);
    },

    async update(
      invocationId: string,
      updates: Partial<ToolInvocation>
    ): Promise<ToolInvocation> {
      const data: Record<string, unknown> = {};

      if (updates.status) data.status = updates.status;
      if (updates.confirmationPrompt) data.confirmationPrompt = updates.confirmationPrompt;
      if (updates.userConfirmed !== undefined) data.userConfirmed = updates.userConfirmed;
      if (updates.confirmedAt) data.confirmedAt = updates.confirmedAt;
      if (updates.startedAt) data.startedAt = updates.startedAt;
      if (updates.completedAt) data.completedAt = updates.completedAt;
      if (updates.duration) data.duration = updates.duration;
      if (updates.result) data.result = JSON.stringify(updates.result);
      if (updates.metadata) data.metadata = JSON.stringify(updates.metadata);

      data.updatedAt = new Date();

      const record = await prisma.agentToolInvocation.update({
        where: { id: invocationId },
        data,
      });

      return mapRecordToInvocation(record);
    },

    async getBySession(sessionId: string, limit?: number): Promise<ToolInvocation[]> {
      const records = await prisma.agentToolInvocation.findMany({
        where: { sessionId },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });

      return records.map(mapRecordToInvocation);
    },

    async getByUser(
      userId: string,
      options?: { limit?: number; offset?: number }
    ): Promise<ToolInvocation[]> {
      const records = await prisma.agentToolInvocation.findMany({
        where: { userId },
        take: options?.limit,
        skip: options?.offset,
        orderBy: { createdAt: 'desc' },
      });

      return records.map(mapRecordToInvocation);
    },
  };
}

// ============================================================================
// AUDIT STORE
// ============================================================================

/**
 * Create a Prisma-based AuditStore
 */
export function createPrismaAuditStore(prisma: PrismaClientLike): AuditStore {
  return {
    async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
      const record = await prisma.agentAuditLog.create({
        data: {
          level: entry.level,
          action: entry.action,
          userId: entry.userId,
          sessionId: entry.sessionId,
          toolId: entry.toolId,
          invocationId: entry.invocationId,
          input: entry.input ? JSON.stringify(entry.input) : null,
          output: entry.output ? JSON.stringify(entry.output) : null,
          error: entry.error ? JSON.stringify(entry.error) : null,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          requestId: entry.requestId,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        },
      });

      return mapRecordToAuditEntry(record);
    },

    async query(options: AuditQueryOptions): Promise<AuditLogEntry[]> {
      const where: Record<string, unknown> = {};

      if (options.userId) where.userId = options.userId;
      if (options.toolId) where.toolId = options.toolId;
      if (options.action?.length) where.action = { in: options.action };
      if (options.level?.length) where.level = { in: options.level };
      if (options.startDate || options.endDate) {
        where.timestamp = {};
        if (options.startDate) (where.timestamp as Record<string, unknown>).gte = options.startDate;
        if (options.endDate) (where.timestamp as Record<string, unknown>).lte = options.endDate;
      }

      const records = await prisma.agentAuditLog.findMany({
        where,
        take: options.limit,
        skip: options.offset,
        orderBy: { timestamp: 'desc' },
      });

      return records.map(mapRecordToAuditEntry);
    },

    async count(options: AuditQueryOptions): Promise<number> {
      const where: Record<string, unknown> = {};

      if (options.userId) where.userId = options.userId;
      if (options.toolId) where.toolId = options.toolId;
      if (options.action?.length) where.action = { in: options.action };
      if (options.level?.length) where.level = { in: options.level };
      if (options.startDate || options.endDate) {
        where.timestamp = {};
        if (options.startDate) (where.timestamp as Record<string, unknown>).gte = options.startDate;
        if (options.endDate) (where.timestamp as Record<string, unknown>).lte = options.endDate;
      }

      return prisma.agentAuditLog.count({ where });
    },
  };
}

// ============================================================================
// PERMISSION STORE
// ============================================================================

/**
 * Create a Prisma-based PermissionStore
 */
export function createPrismaPermissionStore(prisma: PrismaClientLike): PermissionStore {
  return {
    async grant(
      permission: Omit<UserPermission, 'grantedAt'>
    ): Promise<UserPermission> {
      const record = await prisma.agentPermission.create({
        data: {
          userId: permission.userId,
          toolId: permission.toolId,
          category: permission.category,
          levels: permission.levels,
          grantedBy: permission.grantedBy,
          expiresAt: permission.expiresAt,
          conditions: permission.conditions ? JSON.stringify(permission.conditions) : null,
        },
      });

      return mapRecordToPermission(record);
    },

    async revoke(
      userId: string,
      toolId?: string,
      category?: ToolCategory
    ): Promise<void> {
      const where: Record<string, unknown> = { userId };
      if (toolId) where.toolId = toolId;
      if (category) where.category = category;

      await prisma.agentPermission.deleteMany({ where });
    },

    async check(
      userId: string,
      toolId: string,
      requiredLevels: PermissionLevel[]
    ): Promise<PermissionCheckResult> {
      const permissions = await prisma.agentPermission.findMany({
        where: {
          userId,
          OR: [
            { toolId },
            { toolId: null }, // Global permissions
          ],
        },
      });

      const grantedLevels = new Set<PermissionLevel>();
      const now = new Date();

      for (const record of permissions) {
        // Check expiration
        if (record.expiresAt && (record.expiresAt as Date) < now) {
          continue;
        }

        for (const level of record.levels as PermissionLevel[]) {
          grantedLevels.add(level);
        }
      }

      const missingLevels = requiredLevels.filter((l) => !grantedLevels.has(l));

      return {
        granted: missingLevels.length === 0,
        grantedLevels: Array.from(grantedLevels),
        missingLevels,
        reason: missingLevels.length > 0
          ? `Missing permissions: ${missingLevels.join(', ')}`
          : undefined,
      };
    },

    async getUserPermissions(userId: string): Promise<UserPermission[]> {
      const records = await prisma.agentPermission.findMany({
        where: { userId },
      });

      return records.map(mapRecordToPermission);
    },
  };
}

// ============================================================================
// CONFIRMATION STORE
// ============================================================================

/**
 * Create a Prisma-based ConfirmationStore
 */
export function createPrismaConfirmationStore(prisma: PrismaClientLike): ConfirmationStore {
  return {
    async create(
      request: Omit<ConfirmationRequest, 'id' | 'createdAt'>
    ): Promise<ConfirmationRequest> {
      const record = await prisma.agentConfirmation.create({
        data: {
          invocationId: request.invocationId,
          toolId: request.toolId,
          toolName: request.toolName,
          userId: request.userId,
          title: request.title,
          message: request.message,
          details: request.details ? JSON.stringify(request.details) : null,
          type: request.type,
          severity: request.severity,
          confirmText: request.confirmText,
          cancelText: request.cancelText,
          timeout: request.timeout,
          status: request.status,
          expiresAt: request.expiresAt,
        },
      });

      return mapRecordToConfirmation(record);
    },

    async get(requestId: string): Promise<ConfirmationRequest | null> {
      const record = await prisma.agentConfirmation.findUnique({
        where: { id: requestId },
      });

      if (!record) {
        return null;
      }

      return mapRecordToConfirmation(record);
    },

    async getByInvocation(invocationId: string): Promise<ConfirmationRequest | null> {
      const record = await prisma.agentConfirmation.findFirst({
        where: { invocationId },
      });

      if (!record) {
        return null;
      }

      return mapRecordToConfirmation(record);
    },

    async respond(
      requestId: string,
      confirmed: boolean
    ): Promise<ConfirmationRequest> {
      const record = await prisma.agentConfirmation.update({
        where: { id: requestId },
        data: {
          status: confirmed ? 'confirmed' : 'denied',
          respondedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      return mapRecordToConfirmation(record);
    },

    async getPending(userId: string): Promise<ConfirmationRequest[]> {
      const records = await prisma.agentConfirmation.findMany({
        where: {
          userId,
          status: 'pending',
        },
      });

      return records.map(mapRecordToConfirmation);
    },
  };
}

// ============================================================================
// MAPPING HELPERS
// ============================================================================

function mapRecordToToolDefinition(
  record: Record<string, unknown>,
  handler: ToolDefinition['handler']
): ToolDefinition {
  return {
    id: record.id as string,
    name: record.name as string,
    description: record.description as string,
    category: record.category as ToolCategory,
    version: record.version as string,
    inputSchema: JSON.parse(record.inputSchema as string),
    outputSchema: record.outputSchema ? JSON.parse(record.outputSchema as string) : undefined,
    requiredPermissions: record.requiredPermissions as PermissionLevel[],
    confirmationType: record.confirmationType as ToolDefinition['confirmationType'],
    handler,
    timeoutMs: record.timeoutMs as number | undefined,
    maxRetries: record.maxRetries as number | undefined,
    rateLimit: record.rateLimit ? JSON.parse(record.rateLimit as string) : undefined,
    tags: record.tags as string[] | undefined,
    examples: record.examples ? JSON.parse(record.examples as string) : undefined,
    metadata: record.metadata ? JSON.parse(record.metadata as string) : undefined,
    enabled: record.enabled as boolean,
    deprecated: record.deprecated as boolean | undefined,
    deprecationMessage: record.deprecationMessage as string | undefined,
  };
}

function mapRecordToInvocation(record: Record<string, unknown>): ToolInvocation {
  return {
    id: record.id as string,
    toolId: record.toolId as string,
    userId: record.userId as string,
    sessionId: record.sessionId as string,
    input: record.input ? JSON.parse(record.input as string) : undefined,
    validatedInput: record.validatedInput ? JSON.parse(record.validatedInput as string) : undefined,
    status: record.status as ToolInvocation['status'],
    confirmationType: record.confirmationType as ToolInvocation['confirmationType'],
    confirmationPrompt: record.confirmationPrompt as string | undefined,
    userConfirmed: record.userConfirmed as boolean | undefined,
    confirmedAt: record.confirmedAt as Date | undefined,
    startedAt: record.startedAt as Date | undefined,
    completedAt: record.completedAt as Date | undefined,
    duration: record.duration as number | undefined,
    result: record.result ? JSON.parse(record.result as string) : undefined,
    metadata: record.metadata ? JSON.parse(record.metadata as string) : undefined,
    createdAt: record.createdAt as Date,
    updatedAt: record.updatedAt as Date,
  };
}

function mapRecordToAuditEntry(record: Record<string, unknown>): AuditLogEntry {
  return {
    id: record.id as string,
    timestamp: record.timestamp as Date,
    level: record.level as AuditLogEntry['level'],
    action: record.action as AuditLogEntry['action'],
    userId: record.userId as string,
    sessionId: record.sessionId as string,
    toolId: record.toolId as string | undefined,
    invocationId: record.invocationId as string | undefined,
    input: record.input ? JSON.parse(record.input as string) : undefined,
    output: record.output ? JSON.parse(record.output as string) : undefined,
    error: record.error ? JSON.parse(record.error as string) : undefined,
    ipAddress: record.ipAddress as string | undefined,
    userAgent: record.userAgent as string | undefined,
    requestId: record.requestId as string | undefined,
    metadata: record.metadata ? JSON.parse(record.metadata as string) : undefined,
  };
}

function mapRecordToPermission(record: Record<string, unknown>): UserPermission {
  return {
    userId: record.userId as string,
    toolId: record.toolId as string | undefined,
    category: record.category as ToolCategory | undefined,
    levels: record.levels as PermissionLevel[],
    grantedBy: record.grantedBy as string | undefined,
    grantedAt: record.grantedAt as Date,
    expiresAt: record.expiresAt as Date | undefined,
    conditions: record.conditions ? JSON.parse(record.conditions as string) : undefined,
  };
}

function mapRecordToConfirmation(record: Record<string, unknown>): ConfirmationRequest {
  return {
    id: record.id as string,
    invocationId: record.invocationId as string,
    toolId: record.toolId as string,
    toolName: record.toolName as string,
    userId: record.userId as string,
    title: record.title as string,
    message: record.message as string,
    details: record.details ? JSON.parse(record.details as string) : undefined,
    type: record.type as ConfirmationRequest['type'],
    severity: record.severity as ConfirmationRequest['severity'],
    confirmText: record.confirmText as string | undefined,
    cancelText: record.cancelText as string | undefined,
    timeout: record.timeout as number | undefined,
    status: record.status as ConfirmationRequest['status'],
    respondedAt: record.respondedAt as Date | undefined,
    createdAt: record.createdAt as Date,
    expiresAt: record.expiresAt as Date | undefined,
  };
}
