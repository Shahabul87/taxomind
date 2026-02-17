import { getDb } from './db-provider';
import type { ToolDefinition, ToolQueryOptions, ToolStore } from '@sam-ai/agentic';

const toolRegistry = new Map<string, ToolDefinition>();

const serializeSchema = (schema: ToolDefinition['inputSchema'] | ToolDefinition['outputSchema']): string => {
  try {
    return JSON.stringify(schema);
  } catch {
    return '{}';
  }
};

const applyToolFilters = (tools: ToolDefinition[], options?: ToolQueryOptions): ToolDefinition[] => {
  if (!options) return tools;

  let filtered = [...tools];

  if (options.category) {
    filtered = filtered.filter((tool) => tool.category === options.category);
  }
  if (options.tags?.length) {
    filtered = filtered.filter((tool) => tool.tags?.some((tag) => options.tags?.includes(tag)));
  }
  if (options.enabled !== undefined) {
    filtered = filtered.filter((tool) => tool.enabled === options.enabled);
  }
  if (options.deprecated !== undefined) {
    filtered = filtered.filter((tool) => (tool.deprecated ?? false) === options.deprecated);
  }
  if (options.search) {
    const search = options.search.toLowerCase();
    filtered = filtered.filter(
      (tool) =>
        tool.name.toLowerCase().includes(search) ||
        tool.description.toLowerCase().includes(search)
    );
  }

  const offset = options.offset ?? 0;
  const limit = options.limit ?? filtered.length;
  return filtered.slice(offset, offset + limit);
};

export class PrismaToolStore implements ToolStore {
  async register(tool: ToolDefinition): Promise<void> {
    toolRegistry.set(tool.id, tool);

    await getDb().agentTool.upsert({
      where: { id: tool.id },
      create: {
        id: tool.id,
        name: tool.name,
        description: tool.description,
        category: tool.category,
        version: tool.version,
        inputSchema: serializeSchema(tool.inputSchema),
        outputSchema: tool.outputSchema ? serializeSchema(tool.outputSchema) : null,
        requiredPermissions: tool.requiredPermissions,
        confirmationType: tool.confirmationType,
        timeoutMs: tool.timeoutMs ?? null,
        maxRetries: tool.maxRetries ?? null,
        rateLimit: tool.rateLimit ? JSON.stringify(tool.rateLimit) : null,
        tags: tool.tags ?? [],
        examples: tool.examples ? JSON.stringify(tool.examples) : null,
        metadata: tool.metadata ? JSON.stringify(tool.metadata) : null,
        enabled: tool.enabled,
        deprecated: tool.deprecated ?? false,
        deprecationMessage: tool.deprecationMessage ?? null,
      },
      update: {
        name: tool.name,
        description: tool.description,
        category: tool.category,
        version: tool.version,
        inputSchema: serializeSchema(tool.inputSchema),
        outputSchema: tool.outputSchema ? serializeSchema(tool.outputSchema) : null,
        requiredPermissions: tool.requiredPermissions,
        confirmationType: tool.confirmationType,
        timeoutMs: tool.timeoutMs ?? null,
        maxRetries: tool.maxRetries ?? null,
        rateLimit: tool.rateLimit ? JSON.stringify(tool.rateLimit) : null,
        tags: tool.tags ?? [],
        examples: tool.examples ? JSON.stringify(tool.examples) : null,
        metadata: tool.metadata ? JSON.stringify(tool.metadata) : null,
        enabled: tool.enabled,
        deprecated: tool.deprecated ?? false,
        deprecationMessage: tool.deprecationMessage ?? null,
      },
    });
  }

  async get(toolId: string): Promise<ToolDefinition | null> {
    return toolRegistry.get(toolId) ?? null;
  }

  async list(options?: ToolQueryOptions): Promise<ToolDefinition[]> {
    return applyToolFilters(Array.from(toolRegistry.values()), options);
  }

  async update(toolId: string, updates: Partial<ToolDefinition>): Promise<ToolDefinition> {
    const existing = toolRegistry.get(toolId);
    if (!existing) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    const updated: ToolDefinition = {
      ...existing,
      ...updates,
      id: existing.id,
      handler: existing.handler,
      inputSchema: updates.inputSchema ?? existing.inputSchema,
      outputSchema: updates.outputSchema ?? existing.outputSchema,
    };

    toolRegistry.set(toolId, updated);

    await getDb().agentTool.update({
      where: { id: toolId },
      data: {
        name: updated.name,
        description: updated.description,
        category: updated.category,
        version: updated.version,
        inputSchema: serializeSchema(updated.inputSchema),
        outputSchema: updated.outputSchema ? serializeSchema(updated.outputSchema) : null,
        requiredPermissions: updated.requiredPermissions,
        confirmationType: updated.confirmationType,
        timeoutMs: updated.timeoutMs ?? null,
        maxRetries: updated.maxRetries ?? null,
        rateLimit: updated.rateLimit ? JSON.stringify(updated.rateLimit) : null,
        tags: updated.tags ?? [],
        examples: updated.examples ? JSON.stringify(updated.examples) : null,
        metadata: updated.metadata ? JSON.stringify(updated.metadata) : null,
        enabled: updated.enabled,
        deprecated: updated.deprecated ?? false,
        deprecationMessage: updated.deprecationMessage ?? null,
      },
    });

    return updated;
  }

  async delete(toolId: string): Promise<void> {
    toolRegistry.delete(toolId);
    await getDb().agentTool.delete({ where: { id: toolId } });
  }

  async enable(toolId: string): Promise<void> {
    const tool = toolRegistry.get(toolId);
    if (tool) {
      tool.enabled = true;
      toolRegistry.set(toolId, tool);
    }
    await getDb().agentTool.update({
      where: { id: toolId },
      data: { enabled: true },
    });
  }

  async disable(toolId: string): Promise<void> {
    const tool = toolRegistry.get(toolId);
    if (tool) {
      tool.enabled = false;
      toolRegistry.set(toolId, tool);
    }
    await getDb().agentTool.update({
      where: { id: toolId },
      data: { enabled: false },
    });
  }
}

export function getToolRegistryCache(): Map<string, ToolDefinition> {
  return toolRegistry;
}

export function createPrismaToolStore(): PrismaToolStore {
  return new PrismaToolStore();
}
