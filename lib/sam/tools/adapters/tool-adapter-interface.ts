/**
 * External Tool Adapter Interface
 *
 * Standardized interface for wrapping external services (APIs, libraries)
 * as SAM tools. Adapters handle availability checks, execution, and metadata.
 *
 * Existing tools in agentic-external-api-tools.ts predate this interface
 * but follow the same patterns. New external integrations should implement
 * this interface for consistency.
 */

export interface ExternalToolAdapter<TInput = unknown, TOutput = unknown> {
  /** Unique adapter identifier (used as tool ID prefix) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Tool category for grouping in UI */
  category: 'reference' | 'calculation' | 'search' | 'content' | 'communication';
  /** Short description of what this tool does */
  description: string;
  /** Whether this adapter is currently available (API key present, service reachable, etc.) */
  isAvailable(): boolean;
  /** Execute the tool with validated input */
  execute(input: TInput): Promise<TOutput>;
  /** Get adapter metadata for discovery */
  getMetadata(): ExternalToolMetadata;
}

export interface ExternalToolMetadata {
  /** Whether an API key is required */
  requiresApiKey: boolean;
  /** API key environment variable name (if applicable) */
  apiKeyEnvVar?: string;
  /** Rate limit description */
  rateLimit?: string;
  /** Base URL of the external service */
  serviceUrl?: string;
  /** Whether the service is free to use */
  isFree: boolean;
  /** Timeout in milliseconds */
  timeoutMs: number;
}

export interface AdapterRegistration {
  adapter: ExternalToolAdapter;
  available: boolean;
  registeredAt: Date;
  lastHealthCheck?: Date;
  lastHealthStatus?: 'healthy' | 'degraded' | 'unavailable';
}

// =============================================================================
// ADAPTER REGISTRY
// =============================================================================

const adapterRegistry = new Map<string, AdapterRegistration>();

/**
 * Register an external tool adapter
 */
export function registerAdapter(adapter: ExternalToolAdapter): void {
  adapterRegistry.set(adapter.id, {
    adapter,
    available: adapter.isAvailable(),
    registeredAt: new Date(),
  });
}

/**
 * Get all registered adapters
 */
export function getRegisteredAdapters(): AdapterRegistration[] {
  return Array.from(adapterRegistry.values());
}

/**
 * Get a specific adapter by ID
 */
export function getAdapter(id: string): ExternalToolAdapter | null {
  return adapterRegistry.get(id)?.adapter ?? null;
}

/**
 * Get all available (usable) adapters
 */
export function getAvailableAdapters(): ExternalToolAdapter[] {
  return Array.from(adapterRegistry.values())
    .filter((reg) => reg.available)
    .map((reg) => reg.adapter);
}

/**
 * Run health checks on all registered adapters and update their status
 */
export function refreshAdapterAvailability(): void {
  for (const [id, reg] of adapterRegistry.entries()) {
    const available = reg.adapter.isAvailable();
    adapterRegistry.set(id, {
      ...reg,
      available,
      lastHealthCheck: new Date(),
      lastHealthStatus: available ? 'healthy' : 'unavailable',
    });
  }
}

/**
 * Get a summary of all adapters for the discovery endpoint
 */
export function getAdapterDiscoverySummary(): Array<{
  id: string;
  name: string;
  category: string;
  description: string;
  available: boolean;
  metadata: ExternalToolMetadata;
}> {
  return Array.from(adapterRegistry.values()).map((reg) => ({
    id: reg.adapter.id,
    name: reg.adapter.name,
    category: reg.adapter.category,
    description: reg.adapter.description,
    available: reg.available,
    metadata: reg.adapter.getMetadata(),
  }));
}
