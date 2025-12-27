/**
 * Evaluation Version Controller
 *
 * Priority 9: Prevent Evaluation Drift
 * Manages evaluation configurations, prompt versions, and freezing
 */

import type {
  EvaluationConfig,
  EvaluationParameters,
  PromptTemplate,
  PromptType,
} from './types';
import { DEFAULT_EVALUATION_PARAMETERS } from './types';

// ============================================================================
// CONFIGURATION STORE INTERFACE
// ============================================================================

/**
 * Store interface for evaluation configurations
 */
export interface EvaluationConfigStore {
  /**
   * Get configuration by ID
   */
  get(id: string): Promise<EvaluationConfig | undefined>;

  /**
   * Get configuration by ID and version
   */
  getVersion(id: string, version: string): Promise<EvaluationConfig | undefined>;

  /**
   * Get all versions of a configuration
   */
  getAllVersions(id: string): Promise<EvaluationConfig[]>;

  /**
   * Save configuration
   */
  save(config: EvaluationConfig): Promise<void>;

  /**
   * List all configurations
   */
  list(): Promise<EvaluationConfig[]>;

  /**
   * List frozen configurations
   */
  listFrozen(): Promise<EvaluationConfig[]>;

  /**
   * Delete configuration (only if not frozen)
   */
  delete(id: string): Promise<boolean>;
}

/**
 * Store interface for prompt templates
 */
export interface PromptTemplateStore {
  /**
   * Get template by ID
   */
  get(id: string): Promise<PromptTemplate | undefined>;

  /**
   * Get template by ID and version
   */
  getVersion(id: string, version: string): Promise<PromptTemplate | undefined>;

  /**
   * Get all versions of a template
   */
  getAllVersions(id: string): Promise<PromptTemplate[]>;

  /**
   * Save template
   */
  save(template: PromptTemplate): Promise<void>;

  /**
   * List all templates
   */
  list(): Promise<PromptTemplate[]>;

  /**
   * List templates by type
   */
  listByType(type: PromptType): Promise<PromptTemplate[]>;

  /**
   * Delete template (only if not frozen)
   */
  delete(id: string): Promise<boolean>;
}

// ============================================================================
// IN-MEMORY STORES
// ============================================================================

/**
 * In-memory implementation of EvaluationConfigStore
 */
export class InMemoryConfigStore implements EvaluationConfigStore {
  private readonly configs: Map<string, EvaluationConfig[]> = new Map();

  async get(id: string): Promise<EvaluationConfig | undefined> {
    const versions = this.configs.get(id);
    if (!versions || versions.length === 0) return undefined;
    // Return latest version
    return versions[versions.length - 1];
  }

  async getVersion(id: string, version: string): Promise<EvaluationConfig | undefined> {
    const versions = this.configs.get(id);
    if (!versions) return undefined;
    return versions.find((c) => c.version === version);
  }

  async getAllVersions(id: string): Promise<EvaluationConfig[]> {
    return this.configs.get(id) ?? [];
  }

  async save(config: EvaluationConfig): Promise<void> {
    const versions = this.configs.get(config.id) ?? [];
    const existingIndex = versions.findIndex((c) => c.version === config.version);

    if (existingIndex >= 0) {
      // Check if frozen
      if (versions[existingIndex].frozen) {
        throw new Error(`Cannot modify frozen configuration: ${config.id}@${config.version}`);
      }
      versions[existingIndex] = config;
    } else {
      versions.push(config);
    }

    this.configs.set(config.id, versions);
  }

  async list(): Promise<EvaluationConfig[]> {
    const result: EvaluationConfig[] = [];
    for (const versions of this.configs.values()) {
      if (versions.length > 0) {
        result.push(versions[versions.length - 1]);
      }
    }
    return result;
  }

  async listFrozen(): Promise<EvaluationConfig[]> {
    const all = await this.list();
    return all.filter((c) => c.frozen);
  }

  async delete(id: string): Promise<boolean> {
    const config = await this.get(id);
    if (config?.frozen) {
      throw new Error(`Cannot delete frozen configuration: ${id}`);
    }
    return this.configs.delete(id);
  }
}

/**
 * In-memory implementation of PromptTemplateStore
 */
export class InMemoryPromptStore implements PromptTemplateStore {
  private readonly templates: Map<string, PromptTemplate[]> = new Map();

  async get(id: string): Promise<PromptTemplate | undefined> {
    const versions = this.templates.get(id);
    if (!versions || versions.length === 0) return undefined;
    return versions[versions.length - 1];
  }

  async getVersion(id: string, version: string): Promise<PromptTemplate | undefined> {
    const versions = this.templates.get(id);
    if (!versions) return undefined;
    return versions.find((t) => t.version === version);
  }

  async getAllVersions(id: string): Promise<PromptTemplate[]> {
    return this.templates.get(id) ?? [];
  }

  async save(template: PromptTemplate): Promise<void> {
    const versions = this.templates.get(template.id) ?? [];
    const existingIndex = versions.findIndex((t) => t.version === template.version);

    if (existingIndex >= 0) {
      if (versions[existingIndex].frozen) {
        throw new Error(`Cannot modify frozen template: ${template.id}@${template.version}`);
      }
      versions[existingIndex] = template;
    } else {
      versions.push(template);
    }

    this.templates.set(template.id, versions);
  }

  async list(): Promise<PromptTemplate[]> {
    const result: PromptTemplate[] = [];
    for (const versions of this.templates.values()) {
      if (versions.length > 0) {
        result.push(versions[versions.length - 1]);
      }
    }
    return result;
  }

  async listByType(type: PromptType): Promise<PromptTemplate[]> {
    const all = await this.list();
    return all.filter((t) => t.type === type);
  }

  async delete(id: string): Promise<boolean> {
    const template = await this.get(id);
    if (template?.frozen) {
      throw new Error(`Cannot delete frozen template: ${id}`);
    }
    return this.templates.delete(id);
  }
}

// ============================================================================
// VERSION CONTROLLER CONFIGURATION
// ============================================================================

/**
 * Version controller configuration
 */
export interface VersionControllerConfig {
  /**
   * Configuration store
   */
  configStore?: EvaluationConfigStore;

  /**
   * Prompt template store
   */
  promptStore?: PromptTemplateStore;

  /**
   * Logger
   */
  logger?: VersionControllerLogger;

  /**
   * Auto-increment version on save
   */
  autoIncrement?: boolean;
}

/**
 * Logger interface
 */
export interface VersionControllerLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

// ============================================================================
// VERSION CONTROLLER IMPLEMENTATION
// ============================================================================

/**
 * Evaluation Version Controller
 * Manages versioned evaluation configurations and prompt templates
 */
export class EvaluationVersionController {
  private readonly configStore: EvaluationConfigStore;
  private readonly promptStore: PromptTemplateStore;
  private readonly logger?: VersionControllerLogger;
  private readonly autoIncrement: boolean;
  private idCounter: number = 0;

  constructor(config: VersionControllerConfig = {}) {
    this.configStore = config.configStore ?? new InMemoryConfigStore();
    this.promptStore = config.promptStore ?? new InMemoryPromptStore();
    this.logger = config.logger;
    this.autoIncrement = config.autoIncrement ?? true;
  }

  // ==========================================================================
  // CONFIGURATION MANAGEMENT
  // ==========================================================================

  /**
   * Create a new evaluation configuration
   */
  async createConfig(
    name: string,
    modelId: string,
    promptVersion: string,
    rubricVersion: string,
    parameters?: Partial<EvaluationParameters>,
    description?: string,
    tags?: string[]
  ): Promise<EvaluationConfig> {
    const id = this.generateId('config');
    const now = new Date();

    const config: EvaluationConfig = {
      id,
      name,
      version: '1.0.0',
      modelId,
      promptVersion,
      rubricVersion,
      frozen: false,
      parameters: { ...DEFAULT_EVALUATION_PARAMETERS, ...parameters },
      createdAt: now,
      updatedAt: now,
      description,
      tags: tags ?? [],
    };

    await this.configStore.save(config);

    this.logger?.info('Created evaluation configuration', {
      id: config.id,
      version: config.version,
      modelId,
    });

    return config;
  }

  /**
   * Get configuration by ID
   */
  async getConfig(id: string): Promise<EvaluationConfig | undefined> {
    return this.configStore.get(id);
  }

  /**
   * Get specific version of configuration
   */
  async getConfigVersion(id: string, version: string): Promise<EvaluationConfig | undefined> {
    return this.configStore.getVersion(id, version);
  }

  /**
   * Update configuration (creates new version if auto-increment enabled)
   */
  async updateConfig(
    id: string,
    updates: Partial<
      Pick<
        EvaluationConfig,
        'name' | 'modelId' | 'promptVersion' | 'rubricVersion' | 'parameters' | 'description' | 'tags'
      >
    >
  ): Promise<EvaluationConfig> {
    const existing = await this.configStore.get(id);
    if (!existing) {
      throw new Error(`Configuration not found: ${id}`);
    }

    if (existing.frozen) {
      throw new Error(`Cannot update frozen configuration: ${id}`);
    }

    const newVersion = this.autoIncrement
      ? this.incrementVersion(existing.version)
      : existing.version;

    const updated: EvaluationConfig = {
      ...existing,
      ...updates,
      parameters: updates.parameters
        ? { ...existing.parameters, ...updates.parameters }
        : existing.parameters,
      version: newVersion,
      updatedAt: new Date(),
    };

    await this.configStore.save(updated);

    this.logger?.info('Updated evaluation configuration', {
      id: updated.id,
      oldVersion: existing.version,
      newVersion: updated.version,
    });

    return updated;
  }

  /**
   * Freeze configuration (production lock)
   */
  async freezeConfig(id: string, version?: string): Promise<EvaluationConfig> {
    const config = version
      ? await this.configStore.getVersion(id, version)
      : await this.configStore.get(id);

    if (!config) {
      throw new Error(`Configuration not found: ${id}${version ? `@${version}` : ''}`);
    }

    if (config.frozen) {
      this.logger?.warn('Configuration already frozen', { id, version: config.version });
      return config;
    }

    const frozen: EvaluationConfig = {
      ...config,
      frozen: true,
      frozenAt: new Date(),
    };

    await this.configStore.save(frozen);

    this.logger?.info('Froze evaluation configuration', {
      id: frozen.id,
      version: frozen.version,
    });

    return frozen;
  }

  /**
   * Clone configuration (for creating new version from frozen)
   */
  async cloneConfig(id: string, newName?: string): Promise<EvaluationConfig> {
    const existing = await this.configStore.get(id);
    if (!existing) {
      throw new Error(`Configuration not found: ${id}`);
    }

    const cloned: EvaluationConfig = {
      ...existing,
      id: this.generateId('config'),
      name: newName ?? `${existing.name} (Clone)`,
      version: '1.0.0',
      frozen: false,
      frozenAt: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.configStore.save(cloned);

    this.logger?.info('Cloned evaluation configuration', {
      originalId: id,
      newId: cloned.id,
    });

    return cloned;
  }

  /**
   * List all configurations
   */
  async listConfigs(): Promise<EvaluationConfig[]> {
    return this.configStore.list();
  }

  /**
   * List frozen configurations
   */
  async listFrozenConfigs(): Promise<EvaluationConfig[]> {
    return this.configStore.listFrozen();
  }

  // ==========================================================================
  // PROMPT TEMPLATE MANAGEMENT
  // ==========================================================================

  /**
   * Create a new prompt template
   */
  async createPromptTemplate(
    name: string,
    type: PromptType,
    template: string,
    requiredVariables: string[],
    optionalVariables?: string[],
    exampleValues?: Record<string, string>,
    description?: string
  ): Promise<PromptTemplate> {
    const id = this.generateId('prompt');
    const now = new Date();

    const promptTemplate: PromptTemplate = {
      id,
      name,
      version: '1.0.0',
      type,
      template,
      requiredVariables,
      optionalVariables,
      exampleValues,
      frozen: false,
      createdAt: now,
      description,
    };

    await this.promptStore.save(promptTemplate);

    this.logger?.info('Created prompt template', {
      id: promptTemplate.id,
      type,
      version: promptTemplate.version,
    });

    return promptTemplate;
  }

  /**
   * Get prompt template by ID
   */
  async getPromptTemplate(id: string): Promise<PromptTemplate | undefined> {
    return this.promptStore.get(id);
  }

  /**
   * Get specific version of prompt template
   */
  async getPromptTemplateVersion(
    id: string,
    version: string
  ): Promise<PromptTemplate | undefined> {
    return this.promptStore.getVersion(id, version);
  }

  /**
   * Update prompt template
   */
  async updatePromptTemplate(
    id: string,
    updates: Partial<
      Pick<
        PromptTemplate,
        'name' | 'template' | 'requiredVariables' | 'optionalVariables' | 'exampleValues' | 'description'
      >
    >
  ): Promise<PromptTemplate> {
    const existing = await this.promptStore.get(id);
    if (!existing) {
      throw new Error(`Prompt template not found: ${id}`);
    }

    if (existing.frozen) {
      throw new Error(`Cannot update frozen prompt template: ${id}`);
    }

    const newVersion = this.autoIncrement
      ? this.incrementVersion(existing.version)
      : existing.version;

    const updated: PromptTemplate = {
      ...existing,
      ...updates,
      version: newVersion,
    };

    await this.promptStore.save(updated);

    this.logger?.info('Updated prompt template', {
      id: updated.id,
      oldVersion: existing.version,
      newVersion: updated.version,
    });

    return updated;
  }

  /**
   * Freeze prompt template
   */
  async freezePromptTemplate(id: string, version?: string): Promise<PromptTemplate> {
    const template = version
      ? await this.promptStore.getVersion(id, version)
      : await this.promptStore.get(id);

    if (!template) {
      throw new Error(`Prompt template not found: ${id}${version ? `@${version}` : ''}`);
    }

    if (template.frozen) {
      this.logger?.warn('Prompt template already frozen', { id, version: template.version });
      return template;
    }

    const frozen: PromptTemplate = {
      ...template,
      frozen: true,
      frozenAt: new Date(),
    };

    await this.promptStore.save(frozen);

    this.logger?.info('Froze prompt template', {
      id: frozen.id,
      version: frozen.version,
    });

    return frozen;
  }

  /**
   * Render prompt template with variables
   */
  async renderPrompt(id: string, variables: Record<string, string>): Promise<string> {
    const template = await this.promptStore.get(id);
    if (!template) {
      throw new Error(`Prompt template not found: ${id}`);
    }

    // Check required variables
    for (const required of template.requiredVariables) {
      if (!(required in variables)) {
        throw new Error(`Missing required variable: ${required}`);
      }
    }

    // Replace placeholders
    let rendered = template.template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(placeholder, value);
    }

    return rendered;
  }

  /**
   * List all prompt templates
   */
  async listPromptTemplates(): Promise<PromptTemplate[]> {
    return this.promptStore.list();
  }

  /**
   * List prompt templates by type
   */
  async listPromptTemplatesByType(type: PromptType): Promise<PromptTemplate[]> {
    return this.promptStore.listByType(type);
  }

  // ==========================================================================
  // VERSION MANAGEMENT UTILITIES
  // ==========================================================================

  /**
   * Compare two semantic versions
   * Returns: -1 if a < b, 0 if equal, 1 if a > b
   */
  compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] ?? 0;
      const partB = partsB[i] ?? 0;

      if (partA < partB) return -1;
      if (partA > partB) return 1;
    }

    return 0;
  }

  /**
   * Increment version (patch by default)
   */
  incrementVersion(
    version: string,
    type: 'major' | 'minor' | 'patch' = 'patch'
  ): string {
    const parts = version.split('.').map(Number);

    switch (type) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
        parts[2]++;
        break;
    }

    return parts.join('.');
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}-${++this.idCounter}-${Date.now().toString(36)}`;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create version controller with default stores
 */
export function createVersionController(
  config?: VersionControllerConfig
): EvaluationVersionController {
  return new EvaluationVersionController(config);
}

/**
 * Create version controller with logging
 */
export function createVersionControllerWithLogging(
  logger: VersionControllerLogger
): EvaluationVersionController {
  return new EvaluationVersionController({ logger });
}

// ============================================================================
// DEFAULT INSTANCES
// ============================================================================

let defaultVersionController: EvaluationVersionController | undefined;

/**
 * Get default version controller instance
 */
export function getDefaultVersionController(): EvaluationVersionController {
  if (!defaultVersionController) {
    defaultVersionController = new EvaluationVersionController();
  }
  return defaultVersionController;
}

/**
 * Reset default version controller (for testing)
 */
export function resetDefaultVersionController(): void {
  defaultVersionController = undefined;
}
