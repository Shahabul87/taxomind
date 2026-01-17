import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { type AIAdapter } from '@sam-ai/core';
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
  ConfirmationType,
  PermissionLevel,
  UserRole,
  DEFAULT_ROLE_PERMISSIONS,
  createMentorTools,
  type ToolDefinition,
} from '@sam-ai/agentic';
import { ToolPermissionLevel, type ToolConfiguration } from '@sam-ai/integration';
import {
  createPrismaInvocationStore,
  createPrismaAuditStore,
  createPrismaPermissionStore,
  createPrismaConfirmationStore,
} from '@sam-ai/agentic';
import { getToolRegistryCache } from '@/lib/sam/stores/prisma-tool-store';
import { getIntegrationProfile, getStore } from '@/lib/sam/taxomind-context';
import { createToolRepositories } from '@/lib/sam/tool-repositories';
import { createExternalAPITools } from '@/lib/sam/agentic-external-api-tools';
import { getCoreAIAdapter } from '@/lib/sam/integration-adapters';

interface ToolingSystem {
  toolRegistry: ToolRegistry;
  toolExecutor: ToolExecutor;
  permissionManager: PermissionManager;
  confirmationManager: ConfirmationManager;
  auditLogger: AuditLogger;
  toolStore: ReturnType<typeof getStore<'tool'>>;
  permissionStore: ReturnType<typeof createPrismaPermissionStore>;
}

let toolingSystem: ToolingSystem | null = null;
let toolRegistrationDone = false;
let externalToolsRegistered = false;
let toolAiAdapter: AIAdapter | null = null;
let toolAiAdapterPromise: Promise<AIAdapter | null> | null = null;

/**
 * Reset tooling adapter cache (useful when switching providers)
 */
export function resetToolingAdapterCache(): void {
  toolAiAdapter = null;
  toolAiAdapterPromise = null;
  toolRegistrationDone = false;
  logger.info('[Tooling] Adapter cache cleared, tools will re-register');
}

async function getToolAiAdapter(): Promise<AIAdapter | null> {
  if (toolAiAdapter) {
    return toolAiAdapter;
  }

  if (toolAiAdapterPromise) {
    return toolAiAdapterPromise;
  }

  toolAiAdapterPromise = (async () => {
    const adapter = await getCoreAIAdapter();
    if (!adapter) {
      logger.warn('[Tooling] AI adapter unavailable - AI-powered tools disabled');
      return null;
    }
    toolAiAdapter = adapter;
    return adapter;
  })();

  return toolAiAdapterPromise;
}

function mapPermissionLevel(
  level: ToolPermissionLevel
): PermissionLevel[] {
  switch (level) {
    case ToolPermissionLevel.READ_ONLY:
      return [PermissionLevel.READ];
    case ToolPermissionLevel.READ_WRITE:
      return [PermissionLevel.READ, PermissionLevel.WRITE];
    case ToolPermissionLevel.ADMIN:
      return [PermissionLevel.ADMIN];
    case ToolPermissionLevel.DISABLED:
    default:
      return [];
  }
}

function buildToolConfigMap(): Map<string, ToolConfiguration> {
  try {
    const profile = getIntegrationProfile();
    const configs = Object.values(profile.tools).flat();
    return new Map(configs.map((config) => [config.id, config]));
  } catch (error) {
    logger.warn('[Tooling] Failed to load integration tool configs', {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Map();
  }
}

function applyToolConfig(tool: ToolDefinition, config?: ToolConfiguration): void {
  if (!config) return;

  tool.enabled = config.enabled;
  tool.requiredPermissions = mapPermissionLevel(config.permissionLevel);
  tool.confirmationType = config.requiresConfirmation
    ? ConfirmationType.EXPLICIT
    : ConfirmationType.NONE;

  if (config.rateLimit) {
    tool.rateLimit = {
      maxCalls: config.rateLimit.maxCalls,
      windowMs: config.rateLimit.windowMs,
      scope: tool.rateLimit?.scope ?? 'user',
    };
  }

  if (config.allowedRoles) {
    tool.metadata = {
      ...tool.metadata,
      allowedRoles: config.allowedRoles,
    };
  }
}

async function registerMentorTools(toolRegistry: ToolRegistry): Promise<void> {
  if (toolRegistrationDone) return;

  const aiAdapter = await getToolAiAdapter();
  if (!aiAdapter) {
    logger.warn('[Tooling] Skipping mentor tools registration - AI adapter not available');
    toolRegistrationDone = true;
    return;
  }

  // Create database-backed repositories for mentor tools
  const repositories = createToolRepositories();

  const toolConfigMap = buildToolConfigMap();
  const tools = createMentorTools({
    aiAdapter,
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
    applyToolConfig(tool, toolConfigMap.get(tool.id));
    const existing = await db.agentTool.findUnique({ where: { id: tool.id } });
    if (!existing) {
      // Tool not in DB - register it (this also adds to cache)
      await toolRegistry.register(tool);
    } else {
      // Tool exists in DB - add to cache first, then update
      toolCache.set(tool.id, tool);
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

  const toolConfigMap = buildToolConfigMap();
  const externalTools = createExternalAPITools({
    logger,
    rateLimitPerMinute: 30, // Conservative rate limiting
  });

  const toolCache = getToolRegistryCache();

  for (const tool of externalTools) {
    applyToolConfig(tool, toolConfigMap.get(tool.id));
    const existing = await db.agentTool.findUnique({ where: { id: tool.id } });
    if (!existing) {
      // Tool not in DB - register it (this also adds to cache)
      await toolRegistry.register(tool);
      logger.debug('[Tooling] Registered external tool', { id: tool.id });
    } else {
      // Tool exists in DB - add to cache first, then update
      toolCache.set(tool.id, tool);
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

  // Get toolStore from TaxomindContext singleton (consistent store access)
  const toolStore = getStore('tool');
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
    // Disable audit logging for registry operations (registration happens at startup without user context)
    // Tool execution audit logging is handled separately by the toolExecutor
    enableAuditLogging: false,
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
  logger.info('[Tooling] ensureToolingInitialized called');
  try {
    const system = getToolingSystem();
    logger.info('[Tooling] Got tooling system');

    await registerMentorTools(system.toolRegistry);
    logger.info('[Tooling] Mentor tools registered');

    await registerExternalAPITools(system.toolRegistry);
    logger.info('[Tooling] External API tools registered');

    return system;
  } catch (error) {
    logger.error('[Tooling] Error during initialization:', error);
    throw error;
  }
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
