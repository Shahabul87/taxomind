/**
 * @sam-ai/agentic - Prisma Tool Stores
 * Prisma-based implementations of tool registry stores
 */
// ============================================================================
// TOOL STORE
// ============================================================================
/**
 * Create a Prisma-based ToolStore
 */
export function createPrismaToolStore(prisma, toolHandlers) {
    return {
        async register(tool) {
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
        async get(toolId) {
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
        async list(options) {
            const where = {};
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
                const handler = toolHandlers.get(record.id);
                if (!handler)
                    return null;
                return mapRecordToToolDefinition(record, handler);
            })
                .filter((t) => t !== null);
        },
        async update(toolId, updates) {
            const data = {};
            if (updates.name)
                data.name = updates.name;
            if (updates.description)
                data.description = updates.description;
            if (updates.version)
                data.version = updates.version;
            if (updates.enabled !== undefined)
                data.enabled = updates.enabled;
            if (updates.deprecated !== undefined)
                data.deprecated = updates.deprecated;
            if (updates.deprecationMessage)
                data.deprecationMessage = updates.deprecationMessage;
            if (updates.timeoutMs)
                data.timeoutMs = updates.timeoutMs;
            if (updates.maxRetries)
                data.maxRetries = updates.maxRetries;
            if (updates.tags)
                data.tags = updates.tags;
            if (updates.rateLimit)
                data.rateLimit = JSON.stringify(updates.rateLimit);
            if (updates.metadata)
                data.metadata = JSON.stringify(updates.metadata);
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
        async delete(toolId) {
            await prisma.agentTool.delete({
                where: { id: toolId },
            });
            toolHandlers.delete(toolId);
        },
        async enable(toolId) {
            await prisma.agentTool.update({
                where: { id: toolId },
                data: { enabled: true, updatedAt: new Date() },
            });
        },
        async disable(toolId) {
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
export function createPrismaInvocationStore(prisma) {
    return {
        async create(invocation) {
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
        async get(invocationId) {
            const record = await prisma.agentToolInvocation.findUnique({
                where: { id: invocationId },
            });
            if (!record) {
                return null;
            }
            return mapRecordToInvocation(record);
        },
        async update(invocationId, updates) {
            const data = {};
            if (updates.status)
                data.status = updates.status;
            if (updates.confirmationPrompt)
                data.confirmationPrompt = updates.confirmationPrompt;
            if (updates.userConfirmed !== undefined)
                data.userConfirmed = updates.userConfirmed;
            if (updates.confirmedAt)
                data.confirmedAt = updates.confirmedAt;
            if (updates.startedAt)
                data.startedAt = updates.startedAt;
            if (updates.completedAt)
                data.completedAt = updates.completedAt;
            if (updates.duration)
                data.duration = updates.duration;
            if (updates.result)
                data.result = JSON.stringify(updates.result);
            if (updates.metadata)
                data.metadata = JSON.stringify(updates.metadata);
            data.updatedAt = new Date();
            const record = await prisma.agentToolInvocation.update({
                where: { id: invocationId },
                data,
            });
            return mapRecordToInvocation(record);
        },
        async getBySession(sessionId, limit) {
            const records = await prisma.agentToolInvocation.findMany({
                where: { sessionId },
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
            return records.map(mapRecordToInvocation);
        },
        async getByUser(userId, options) {
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
export function createPrismaAuditStore(prisma) {
    return {
        async log(entry) {
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
        async query(options) {
            const where = {};
            if (options.userId)
                where.userId = options.userId;
            if (options.toolId)
                where.toolId = options.toolId;
            if (options.action?.length)
                where.action = { in: options.action };
            if (options.level?.length)
                where.level = { in: options.level };
            if (options.startDate || options.endDate) {
                where.timestamp = {};
                if (options.startDate)
                    where.timestamp.gte = options.startDate;
                if (options.endDate)
                    where.timestamp.lte = options.endDate;
            }
            const records = await prisma.agentAuditLog.findMany({
                where,
                take: options.limit,
                skip: options.offset,
                orderBy: { timestamp: 'desc' },
            });
            return records.map(mapRecordToAuditEntry);
        },
        async count(options) {
            const where = {};
            if (options.userId)
                where.userId = options.userId;
            if (options.toolId)
                where.toolId = options.toolId;
            if (options.action?.length)
                where.action = { in: options.action };
            if (options.level?.length)
                where.level = { in: options.level };
            if (options.startDate || options.endDate) {
                where.timestamp = {};
                if (options.startDate)
                    where.timestamp.gte = options.startDate;
                if (options.endDate)
                    where.timestamp.lte = options.endDate;
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
export function createPrismaPermissionStore(prisma) {
    return {
        async grant(permission) {
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
        async revoke(userId, toolId, category) {
            const where = { userId };
            if (toolId)
                where.toolId = toolId;
            if (category)
                where.category = category;
            await prisma.agentPermission.deleteMany({ where });
        },
        async check(userId, toolId, requiredLevels) {
            const permissions = await prisma.agentPermission.findMany({
                where: {
                    userId,
                    OR: [
                        { toolId },
                        { toolId: null }, // Global permissions
                    ],
                },
            });
            const grantedLevels = new Set();
            const now = new Date();
            for (const record of permissions) {
                // Check expiration
                if (record.expiresAt && record.expiresAt < now) {
                    continue;
                }
                for (const level of record.levels) {
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
        async getUserPermissions(userId) {
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
export function createPrismaConfirmationStore(prisma) {
    return {
        async create(request) {
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
        async get(requestId) {
            const record = await prisma.agentConfirmation.findUnique({
                where: { id: requestId },
            });
            if (!record) {
                return null;
            }
            return mapRecordToConfirmation(record);
        },
        async getByInvocation(invocationId) {
            const record = await prisma.agentConfirmation.findFirst({
                where: { invocationId },
            });
            if (!record) {
                return null;
            }
            return mapRecordToConfirmation(record);
        },
        async respond(requestId, confirmed) {
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
        async getPending(userId) {
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
function mapRecordToToolDefinition(record, handler) {
    return {
        id: record.id,
        name: record.name,
        description: record.description,
        category: record.category,
        version: record.version,
        inputSchema: JSON.parse(record.inputSchema),
        outputSchema: record.outputSchema ? JSON.parse(record.outputSchema) : undefined,
        requiredPermissions: record.requiredPermissions,
        confirmationType: record.confirmationType,
        handler,
        timeoutMs: record.timeoutMs,
        maxRetries: record.maxRetries,
        rateLimit: record.rateLimit ? JSON.parse(record.rateLimit) : undefined,
        tags: record.tags,
        examples: record.examples ? JSON.parse(record.examples) : undefined,
        metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
        enabled: record.enabled,
        deprecated: record.deprecated,
        deprecationMessage: record.deprecationMessage,
    };
}
function mapRecordToInvocation(record) {
    return {
        id: record.id,
        toolId: record.toolId,
        userId: record.userId,
        sessionId: record.sessionId,
        input: record.input ? JSON.parse(record.input) : undefined,
        validatedInput: record.validatedInput ? JSON.parse(record.validatedInput) : undefined,
        status: record.status,
        confirmationType: record.confirmationType,
        confirmationPrompt: record.confirmationPrompt,
        userConfirmed: record.userConfirmed,
        confirmedAt: record.confirmedAt,
        startedAt: record.startedAt,
        completedAt: record.completedAt,
        duration: record.duration,
        result: record.result ? JSON.parse(record.result) : undefined,
        metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}
function mapRecordToAuditEntry(record) {
    return {
        id: record.id,
        timestamp: record.timestamp,
        level: record.level,
        action: record.action,
        userId: record.userId,
        sessionId: record.sessionId,
        toolId: record.toolId,
        invocationId: record.invocationId,
        input: record.input ? JSON.parse(record.input) : undefined,
        output: record.output ? JSON.parse(record.output) : undefined,
        error: record.error ? JSON.parse(record.error) : undefined,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent,
        requestId: record.requestId,
        metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
    };
}
function mapRecordToPermission(record) {
    return {
        userId: record.userId,
        toolId: record.toolId,
        category: record.category,
        levels: record.levels,
        grantedBy: record.grantedBy,
        grantedAt: record.grantedAt,
        expiresAt: record.expiresAt,
        conditions: record.conditions ? JSON.parse(record.conditions) : undefined,
    };
}
function mapRecordToConfirmation(record) {
    return {
        id: record.id,
        invocationId: record.invocationId,
        toolId: record.toolId,
        toolName: record.toolName,
        userId: record.userId,
        title: record.title,
        message: record.message,
        details: record.details ? JSON.parse(record.details) : undefined,
        type: record.type,
        severity: record.severity,
        confirmText: record.confirmText,
        cancelText: record.cancelText,
        timeout: record.timeout,
        status: record.status,
        respondedAt: record.respondedAt,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
    };
}
//# sourceMappingURL=prisma-tool-stores.js.map