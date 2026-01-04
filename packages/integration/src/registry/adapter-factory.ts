/**
 * @sam-ai/integration - Adapter Factory
 * Dependency injection container for adapters
 */

import type { IntegrationProfile } from '../types/profile';
import type { DatabaseAdapter, RepositoryFactory } from '../adapters/database';
import type { AuthAdapter, AuthContextProvider, PermissionChecker } from '../adapters/auth';
import type { VectorAdapter, EmbeddingAdapter, VectorService } from '../adapters/vector';
import type { AIAdapter, AIService } from '../adapters/ai';
import type { NotificationAdapter, NotificationService } from '../adapters/notification';
import type { RealtimeAdapter, SAMRealtimeService } from '../adapters/realtime';
import { CapabilityRegistry } from './capability-registry';

// ============================================================================
// ADAPTER PROVIDER TYPES
// ============================================================================

/**
 * Adapter provider function type
 */
export type AdapterProvider<T> = (
  profile: IntegrationProfile,
  factory: AdapterFactory
) => T | Promise<T>;

/**
 * Lazy adapter provider (creates on first use)
 */
export type LazyAdapterProvider<T> = () => T | Promise<T>;

/**
 * Adapter registration
 */
interface AdapterRegistration<T> {
  provider: AdapterProvider<T>;
  instance?: T;
  lazy: boolean;
}

// ============================================================================
// ADAPTER FACTORY
// ============================================================================

/**
 * Adapter Factory
 * Central dependency injection container for all adapters
 */
export class AdapterFactory {
  private profile: IntegrationProfile;
  private registry: CapabilityRegistry;

  // Adapter registrations
  private databaseAdapter: AdapterRegistration<DatabaseAdapter> | null = null;
  private repositoryFactory: AdapterRegistration<RepositoryFactory> | null = null;
  private authAdapter: AdapterRegistration<AuthAdapter> | null = null;
  private authContextProvider: AdapterRegistration<AuthContextProvider> | null = null;
  private permissionChecker: AdapterRegistration<PermissionChecker> | null = null;
  private vectorAdapter: AdapterRegistration<VectorAdapter> | null = null;
  private embeddingAdapter: AdapterRegistration<EmbeddingAdapter> | null = null;
  private vectorService: AdapterRegistration<VectorService> | null = null;
  private aiAdapter: AdapterRegistration<AIAdapter> | null = null;
  private aiService: AdapterRegistration<AIService> | null = null;
  private notificationAdapter: AdapterRegistration<NotificationAdapter> | null = null;
  private notificationService: AdapterRegistration<NotificationService> | null = null;
  private realtimeAdapter: AdapterRegistration<RealtimeAdapter> | null = null;
  private samRealtimeService: AdapterRegistration<SAMRealtimeService> | null = null;

  // Custom adapters
  private customAdapters: Map<string, AdapterRegistration<unknown>> = new Map();

  constructor(profile: IntegrationProfile) {
    this.profile = profile;
    this.registry = new CapabilityRegistry(profile);
  }

  // -------------------------------------------------------------------------
  // Profile & Registry Access
  // -------------------------------------------------------------------------

  /**
   * Get the integration profile
   */
  getProfile(): IntegrationProfile {
    return this.profile;
  }

  /**
   * Get the capability registry
   */
  getRegistry(): CapabilityRegistry {
    return this.registry;
  }

  /**
   * Update profile
   */
  updateProfile(updates: Partial<IntegrationProfile>): void {
    this.profile = { ...this.profile, ...updates };
    this.registry.updateProfile(updates);
  }

  // -------------------------------------------------------------------------
  // Database Adapters
  // -------------------------------------------------------------------------

  /**
   * Register database adapter
   */
  registerDatabaseAdapter(
    provider: AdapterProvider<DatabaseAdapter>,
    options: { lazy?: boolean } = {}
  ): this {
    this.databaseAdapter = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get database adapter
   */
  async getDatabaseAdapter(): Promise<DatabaseAdapter> {
    if (!this.databaseAdapter) {
      throw new Error('Database adapter not registered');
    }

    if (!this.databaseAdapter.instance) {
      this.databaseAdapter.instance = await this.databaseAdapter.provider(
        this.profile,
        this
      );
    }

    return this.databaseAdapter.instance;
  }

  /**
   * Check if database adapter is registered
   */
  hasDatabaseAdapter(): boolean {
    return this.databaseAdapter !== null;
  }

  /**
   * Register repository factory
   */
  registerRepositoryFactory(
    provider: AdapterProvider<RepositoryFactory>,
    options: { lazy?: boolean } = {}
  ): this {
    this.repositoryFactory = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get repository factory
   */
  async getRepositoryFactory(): Promise<RepositoryFactory> {
    if (!this.repositoryFactory) {
      throw new Error('Repository factory not registered');
    }

    if (!this.repositoryFactory.instance) {
      this.repositoryFactory.instance = await this.repositoryFactory.provider(
        this.profile,
        this
      );
    }

    return this.repositoryFactory.instance;
  }

  // -------------------------------------------------------------------------
  // Auth Adapters
  // -------------------------------------------------------------------------

  /**
   * Register auth adapter
   */
  registerAuthAdapter(
    provider: AdapterProvider<AuthAdapter>,
    options: { lazy?: boolean } = {}
  ): this {
    this.authAdapter = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get auth adapter
   */
  async getAuthAdapter(): Promise<AuthAdapter> {
    if (!this.authAdapter) {
      throw new Error('Auth adapter not registered');
    }

    if (!this.authAdapter.instance) {
      this.authAdapter.instance = await this.authAdapter.provider(this.profile, this);
    }

    return this.authAdapter.instance;
  }

  /**
   * Check if auth adapter is registered
   */
  hasAuthAdapter(): boolean {
    return this.authAdapter !== null;
  }

  /**
   * Register auth context provider
   */
  registerAuthContextProvider(
    provider: AdapterProvider<AuthContextProvider>,
    options: { lazy?: boolean } = {}
  ): this {
    this.authContextProvider = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get auth context provider
   */
  async getAuthContextProvider(): Promise<AuthContextProvider> {
    if (!this.authContextProvider) {
      throw new Error('Auth context provider not registered');
    }

    if (!this.authContextProvider.instance) {
      this.authContextProvider.instance = await this.authContextProvider.provider(
        this.profile,
        this
      );
    }

    return this.authContextProvider.instance;
  }

  /**
   * Register permission checker
   */
  registerPermissionChecker(
    provider: AdapterProvider<PermissionChecker>,
    options: { lazy?: boolean } = {}
  ): this {
    this.permissionChecker = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get permission checker
   */
  async getPermissionChecker(): Promise<PermissionChecker> {
    if (!this.permissionChecker) {
      throw new Error('Permission checker not registered');
    }

    if (!this.permissionChecker.instance) {
      this.permissionChecker.instance = await this.permissionChecker.provider(
        this.profile,
        this
      );
    }

    return this.permissionChecker.instance;
  }

  // -------------------------------------------------------------------------
  // Vector Adapters
  // -------------------------------------------------------------------------

  /**
   * Register vector adapter
   */
  registerVectorAdapter(
    provider: AdapterProvider<VectorAdapter>,
    options: { lazy?: boolean } = {}
  ): this {
    this.vectorAdapter = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get vector adapter
   */
  async getVectorAdapter(): Promise<VectorAdapter> {
    if (!this.vectorAdapter) {
      throw new Error('Vector adapter not registered');
    }

    if (!this.vectorAdapter.instance) {
      this.vectorAdapter.instance = await this.vectorAdapter.provider(this.profile, this);
    }

    return this.vectorAdapter.instance;
  }

  /**
   * Check if vector adapter is registered
   */
  hasVectorAdapter(): boolean {
    return this.vectorAdapter !== null;
  }

  /**
   * Register embedding adapter
   */
  registerEmbeddingAdapter(
    provider: AdapterProvider<EmbeddingAdapter>,
    options: { lazy?: boolean } = {}
  ): this {
    this.embeddingAdapter = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get embedding adapter
   */
  async getEmbeddingAdapter(): Promise<EmbeddingAdapter> {
    if (!this.embeddingAdapter) {
      throw new Error('Embedding adapter not registered');
    }

    if (!this.embeddingAdapter.instance) {
      this.embeddingAdapter.instance = await this.embeddingAdapter.provider(
        this.profile,
        this
      );
    }

    return this.embeddingAdapter.instance;
  }

  /**
   * Register vector service
   */
  registerVectorService(
    provider: AdapterProvider<VectorService>,
    options: { lazy?: boolean } = {}
  ): this {
    this.vectorService = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get vector service
   */
  async getVectorService(): Promise<VectorService> {
    if (!this.vectorService) {
      throw new Error('Vector service not registered');
    }

    if (!this.vectorService.instance) {
      this.vectorService.instance = await this.vectorService.provider(this.profile, this);
    }

    return this.vectorService.instance;
  }

  // -------------------------------------------------------------------------
  // AI Adapters
  // -------------------------------------------------------------------------

  /**
   * Register AI adapter
   */
  registerAIAdapter(
    provider: AdapterProvider<AIAdapter>,
    options: { lazy?: boolean } = {}
  ): this {
    this.aiAdapter = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get AI adapter
   */
  async getAIAdapter(): Promise<AIAdapter> {
    if (!this.aiAdapter) {
      throw new Error('AI adapter not registered');
    }

    if (!this.aiAdapter.instance) {
      this.aiAdapter.instance = await this.aiAdapter.provider(this.profile, this);
    }

    return this.aiAdapter.instance;
  }

  /**
   * Check if AI adapter is registered
   */
  hasAIAdapter(): boolean {
    return this.aiAdapter !== null;
  }

  /**
   * Register AI service
   */
  registerAIService(
    provider: AdapterProvider<AIService>,
    options: { lazy?: boolean } = {}
  ): this {
    this.aiService = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get AI service
   */
  async getAIService(): Promise<AIService> {
    if (!this.aiService) {
      throw new Error('AI service not registered');
    }

    if (!this.aiService.instance) {
      this.aiService.instance = await this.aiService.provider(this.profile, this);
    }

    return this.aiService.instance;
  }

  // -------------------------------------------------------------------------
  // Notification Adapters
  // -------------------------------------------------------------------------

  /**
   * Register notification adapter
   */
  registerNotificationAdapter(
    provider: AdapterProvider<NotificationAdapter>,
    options: { lazy?: boolean } = {}
  ): this {
    this.notificationAdapter = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get notification adapter
   */
  async getNotificationAdapter(): Promise<NotificationAdapter> {
    if (!this.notificationAdapter) {
      throw new Error('Notification adapter not registered');
    }

    if (!this.notificationAdapter.instance) {
      this.notificationAdapter.instance = await this.notificationAdapter.provider(
        this.profile,
        this
      );
    }

    return this.notificationAdapter.instance;
  }

  /**
   * Check if notification adapter is registered
   */
  hasNotificationAdapter(): boolean {
    return this.notificationAdapter !== null;
  }

  /**
   * Register notification service
   */
  registerNotificationService(
    provider: AdapterProvider<NotificationService>,
    options: { lazy?: boolean } = {}
  ): this {
    this.notificationService = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get notification service
   */
  async getNotificationService(): Promise<NotificationService> {
    if (!this.notificationService) {
      throw new Error('Notification service not registered');
    }

    if (!this.notificationService.instance) {
      this.notificationService.instance = await this.notificationService.provider(
        this.profile,
        this
      );
    }

    return this.notificationService.instance;
  }

  // -------------------------------------------------------------------------
  // Realtime Adapters
  // -------------------------------------------------------------------------

  /**
   * Register realtime adapter
   */
  registerRealtimeAdapter(
    provider: AdapterProvider<RealtimeAdapter>,
    options: { lazy?: boolean } = {}
  ): this {
    this.realtimeAdapter = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get realtime adapter
   */
  async getRealtimeAdapter(): Promise<RealtimeAdapter> {
    if (!this.realtimeAdapter) {
      throw new Error('Realtime adapter not registered');
    }

    if (!this.realtimeAdapter.instance) {
      this.realtimeAdapter.instance = await this.realtimeAdapter.provider(
        this.profile,
        this
      );
    }

    return this.realtimeAdapter.instance;
  }

  /**
   * Check if realtime adapter is registered
   */
  hasRealtimeAdapter(): boolean {
    return this.realtimeAdapter !== null;
  }

  /**
   * Register SAM realtime service
   */
  registerSAMRealtimeService(
    provider: AdapterProvider<SAMRealtimeService>,
    options: { lazy?: boolean } = {}
  ): this {
    this.samRealtimeService = {
      provider,
      lazy: options.lazy ?? true,
    };
    return this;
  }

  /**
   * Get SAM realtime service
   */
  async getSAMRealtimeService(): Promise<SAMRealtimeService> {
    if (!this.samRealtimeService) {
      throw new Error('SAM realtime service not registered');
    }

    if (!this.samRealtimeService.instance) {
      this.samRealtimeService.instance = await this.samRealtimeService.provider(
        this.profile,
        this
      );
    }

    return this.samRealtimeService.instance;
  }

  // -------------------------------------------------------------------------
  // Custom Adapters
  // -------------------------------------------------------------------------

  /**
   * Register a custom adapter
   */
  registerCustomAdapter<T>(
    name: string,
    provider: AdapterProvider<T>,
    options: { lazy?: boolean } = {}
  ): this {
    this.customAdapters.set(name, {
      provider: provider as AdapterProvider<unknown>,
      lazy: options.lazy ?? true,
    });
    return this;
  }

  /**
   * Get a custom adapter
   */
  async getCustomAdapter<T>(name: string): Promise<T> {
    const registration = this.customAdapters.get(name);
    if (!registration) {
      throw new Error(`Custom adapter '${name}' not registered`);
    }

    if (!registration.instance) {
      registration.instance = await registration.provider(this.profile, this);
    }

    return registration.instance as T;
  }

  /**
   * Check if custom adapter is registered
   */
  hasCustomAdapter(name: string): boolean {
    return this.customAdapters.has(name);
  }

  /**
   * List registered custom adapters
   */
  listCustomAdapters(): string[] {
    return Array.from(this.customAdapters.keys());
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /**
   * Initialize all registered adapters
   */
  async initializeAll(): Promise<void> {
    const promises: Promise<unknown>[] = [];

    if (this.databaseAdapter && !this.databaseAdapter.lazy) {
      promises.push(this.getDatabaseAdapter());
    }
    if (this.authAdapter && !this.authAdapter.lazy) {
      promises.push(this.getAuthAdapter());
    }
    if (this.vectorAdapter && !this.vectorAdapter.lazy) {
      promises.push(this.getVectorAdapter());
    }
    if (this.aiAdapter && !this.aiAdapter.lazy) {
      promises.push(this.getAIAdapter());
    }
    if (this.notificationAdapter && !this.notificationAdapter.lazy) {
      promises.push(this.getNotificationAdapter());
    }
    if (this.realtimeAdapter && !this.realtimeAdapter.lazy) {
      promises.push(this.getRealtimeAdapter());
    }

    await Promise.all(promises);
  }

  /**
   * Dispose all adapters
   */
  async disposeAll(): Promise<void> {
    // Clear all instances
    if (this.databaseAdapter) this.databaseAdapter.instance = undefined;
    if (this.repositoryFactory) this.repositoryFactory.instance = undefined;
    if (this.authAdapter) this.authAdapter.instance = undefined;
    if (this.authContextProvider) this.authContextProvider.instance = undefined;
    if (this.permissionChecker) this.permissionChecker.instance = undefined;
    if (this.vectorAdapter) this.vectorAdapter.instance = undefined;
    if (this.embeddingAdapter) this.embeddingAdapter.instance = undefined;
    if (this.vectorService) this.vectorService.instance = undefined;
    if (this.aiAdapter) this.aiAdapter.instance = undefined;
    if (this.aiService) this.aiService.instance = undefined;
    if (this.notificationAdapter) this.notificationAdapter.instance = undefined;
    if (this.notificationService) this.notificationService.instance = undefined;
    if (this.realtimeAdapter) this.realtimeAdapter.instance = undefined;
    if (this.samRealtimeService) this.samRealtimeService.instance = undefined;

    this.customAdapters.forEach((reg) => {
      reg.instance = undefined;
    });
  }

  /**
   * Get summary of registered adapters
   */
  getSummary(): {
    database: boolean;
    auth: boolean;
    vector: boolean;
    ai: boolean;
    notification: boolean;
    realtime: boolean;
    custom: string[];
  } {
    return {
      database: this.hasDatabaseAdapter(),
      auth: this.hasAuthAdapter(),
      vector: this.hasVectorAdapter(),
      ai: this.hasAIAdapter(),
      notification: this.hasNotificationAdapter(),
      realtime: this.hasRealtimeAdapter(),
      custom: this.listCustomAdapters(),
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create adapter factory from profile
 */
export function createAdapterFactory(profile: IntegrationProfile): AdapterFactory {
  return new AdapterFactory(profile);
}
