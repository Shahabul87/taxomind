import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  createAnthropicAdapter,
  type AIAdapter,
} from '@sam-ai/core';
import {
  createToolRegistry,
  createToolExecutor,
  createPermissionManager,
  createAuditLogger,
  createConfirmationManager,
  type ToolRegistry,
  type ToolExecutor,
  type PermissionManager,
  type ConfirmationManager,
  type AuditLogger,
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  createMentorTools,
  type ToolDefinition,
} from '@sam-ai/agentic';
import {
  createPrismaInvocationStore,
  createPrismaAuditStore,
  createPrismaPermissionStore,
  createPrismaConfirmationStore,
} from '@sam-ai/agentic';
import { createPrismaToolStore, getToolRegistryCache } from '@/lib/sam/stores/prisma-tool-store';
import { createToolRepositories } from '@/lib/sam/tool-repositories';
import { createExternalAPITools } from '@/lib/sam/agentic-external-api-tools';

interface ToolingSystem {
  toolRegistry: ToolRegistry;
  toolExecutor: ToolExecutor;
  permissionManager: PermissionManager;
  confirmationManager: ConfirmationManager;
  auditLogger: AuditLogger;
  toolStore: ReturnType<typeof createPrismaToolStore>;
  permissionStore: ReturnType<typeof createPrismaPermissionStore>;
}

let toolingSystem: ToolingSystem | null = null;
let toolRegistrationDone = false;
let externalToolsRegistered = false;
let toolAiAdapter: AIAdapter | null = null;

function getToolAiAdapter(): AIAdapter {
  if (!toolAiAdapter) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    toolAiAdapter = createAnthropicAdapter({
      apiKey,
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
      timeout: 60000,
      maxRetries: 1,
    });
  }
  return toolAiAdapter;
}

async function registerMentorTools(toolRegistry: ToolRegistry): Promise<void> {
  if (toolRegistrationDone) return;

  // Create database-backed repositories for mentor tools
  const repositories = createToolRepositories();

  const tools = createMentorTools({
    aiAdapter: getToolAiAdapter(),
    logger,
    // Wire content tools with content repository
    content: {
      contentRepository: repositories.contentRepository,
    },
    // Wire scheduling tools with session and reminder repositories
    scheduling: {
      sessionRepository: repositories.sessionRepository,
      reminderRepository: repositories.reminderRepository,
    },
    // Wire notification tools with notification and progress repositories
    notification: {
      notificationRepository: repositories.notificationRepository,
      progressRepository: repositories.progressRepository,
    },
  });

  const toolCache = getToolRegistryCache();

  for (const tool of tools) {
    // Ensure handler/schema are always in memory
    toolCache.set(tool.id, tool);

    const existing = await db.agentTool.findUnique({ where: { id: tool.id } });
    if (!existing) {
      await toolRegistry.register(tool);
    } else {
      await toolRegistry.update(tool.id, {
        name: tool.name,
        description: tool.description,
        version: tool.version,
        category: tool.category,
        confirmationType: tool.confirmationType,
        requiredPermissions: tool.requiredPermissions,
        timeoutMs: tool.timeoutMs,
        maxRetries: tool.maxRetries,
        rateLimit: tool.rateLimit,
        tags: tool.tags,
        examples: tool.examples,
        metadata: tool.metadata,
        enabled: tool.enabled,
        deprecated: tool.deprecated,
        deprecationMessage: tool.deprecationMessage,
      });
    }
  }

  toolRegistrationDone = true;
}

async function registerExternalAPITools(toolRegistry: ToolRegistry): Promise<void> {
  if (externalToolsRegistered) return;

  logger.info('[Tooling] Registering external API tools');

  const externalTools = createExternalAPITools({
    logger,
    rateLimitPerMinute: 30, // Conservative rate limiting
  });

  const toolCache = getToolRegistryCache();

  for (const tool of externalTools) {
    // Ensure handler/schema are always in memory
    toolCache.set(tool.id, tool);

    const existing = await db.agentTool.findUnique({ where: { id: tool.id } });
    if (!existing) {
      await toolRegistry.register(tool);
      logger.debug('[Tooling] Registered external tool', { id: tool.id });
    } else {
      await toolRegistry.update(tool.id, {
        name: tool.name,
        description: tool.description,
        version: tool.version,
        category: tool.category,
        confirmationType: tool.confirmationType,
        requiredPermissions: tool.requiredPermissions,
        timeoutMs: tool.timeoutMs,
        maxRetries: tool.maxRetries,
        rateLimit: tool.rateLimit,
        tags: tool.tags,
        examples: tool.examples,
        metadata: tool.metadata,
        enabled: tool.enabled,
        deprecated: tool.deprecated,
        deprecationMessage: tool.deprecationMessage,
      });
      logger.debug('[Tooling] Updated external tool', { id: tool.id });
    }
  }

  externalToolsRegistered = true;
  logger.info('[Tooling] External API tools registered', { count: externalTools.length });
}

export function getToolingSystem(): ToolingSystem {
  if (toolingSystem) {
    return toolingSystem;
  }

  const toolStore = createPrismaToolStore();
  // Cast db to avoid type incompatibility with Prisma extensions
  const prismaClient = db as unknown as Parameters<typeof createPrismaInvocationStore>[0];
  const invocationStore = createPrismaInvocationStore(prismaClient);
  const auditStore = createPrismaAuditStore(prismaClient);
  const permissionStore = createPrismaPermissionStore(prismaClient);
  const confirmationStore = createPrismaConfirmationStore(prismaClient);

  const auditLogger = createAuditLogger({
    auditStore,
    logger,
  });

  const permissionManager = createPermissionManager({
    permissionStore,
    logger,
  });

  const confirmationManager = createConfirmationManager({
    confirmationStore,
    logger,
  });

  const toolRegistry = createToolRegistry({
    toolStore,
    invocationStore,
    auditStore,
    permissionStore,
    confirmationStore,
    logger,
    enableAuditLogging: true,
  });

  const toolExecutor = createToolExecutor({
    toolStore,
    invocationStore,
    permissionManager,
    auditLogger,
    confirmationManager,
    logger,
    enableSandbox: true,
  });

  toolingSystem = {
    toolRegistry,
    toolExecutor,
    permissionManager,
    confirmationManager,
    auditLogger,
    toolStore,
    permissionStore,
  };

  return toolingSystem;
}

export async function ensureToolingInitialized(): Promise<ToolingSystem> {
  const system = getToolingSystem();
  await registerMentorTools(system.toolRegistry);
  await registerExternalAPITools(system.toolRegistry);
  return system;
}

export async function ensureDefaultToolPermissions(
  userId: string,
  role: UserRole,
  grantedBy?: string
): Promise<void> {
  const { permissionManager, permissionStore } = getToolingSystem();
  const existing = await permissionStore.getUserPermissions(userId);
  if (existing.length === 0) {
    await permissionManager.setRolePermissions(userId, role, grantedBy);
  }
}

export function mapUserToToolRole(user: { role?: string; isTeacher?: boolean } | null): UserRole {
  if (!user) return UserRole.STUDENT;
  if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
    return UserRole.ADMIN;
  }
  if (user.isTeacher) {
    return UserRole.INSTRUCTOR;
  }
  return UserRole.STUDENT;
}

export function getRolePermissions(role: UserRole) {
  return DEFAULT_ROLE_PERMISSIONS.find((entry) => entry.role === role);
}

// Re-export external API tools utilities
export {
  createExternalAPITools,
  getExternalAPIToolIds,
  isExternalAPITool,
} from '@/lib/sam/agentic-external-api-tools';
