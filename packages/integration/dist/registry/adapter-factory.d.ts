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
/**
 * Adapter provider function type
 */
export type AdapterProvider<T> = (profile: IntegrationProfile, factory: AdapterFactory) => T | Promise<T>;
/**
 * Lazy adapter provider (creates on first use)
 */
export type LazyAdapterProvider<T> = () => T | Promise<T>;
/**
 * Adapter Factory
 * Central dependency injection container for all adapters
 */
export declare class AdapterFactory {
    private profile;
    private registry;
    private databaseAdapter;
    private repositoryFactory;
    private authAdapter;
    private authContextProvider;
    private permissionChecker;
    private vectorAdapter;
    private embeddingAdapter;
    private vectorService;
    private aiAdapter;
    private aiService;
    private notificationAdapter;
    private notificationService;
    private realtimeAdapter;
    private samRealtimeService;
    private customAdapters;
    constructor(profile: IntegrationProfile);
    /**
     * Get the integration profile
     */
    getProfile(): IntegrationProfile;
    /**
     * Get the capability registry
     */
    getRegistry(): CapabilityRegistry;
    /**
     * Update profile
     */
    updateProfile(updates: Partial<IntegrationProfile>): void;
    /**
     * Register database adapter
     */
    registerDatabaseAdapter(provider: AdapterProvider<DatabaseAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get database adapter
     */
    getDatabaseAdapter(): Promise<DatabaseAdapter>;
    /**
     * Check if database adapter is registered
     */
    hasDatabaseAdapter(): boolean;
    /**
     * Register repository factory
     */
    registerRepositoryFactory(provider: AdapterProvider<RepositoryFactory>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get repository factory
     */
    getRepositoryFactory(): Promise<RepositoryFactory>;
    /**
     * Register auth adapter
     */
    registerAuthAdapter(provider: AdapterProvider<AuthAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get auth adapter
     */
    getAuthAdapter(): Promise<AuthAdapter>;
    /**
     * Check if auth adapter is registered
     */
    hasAuthAdapter(): boolean;
    /**
     * Register auth context provider
     */
    registerAuthContextProvider(provider: AdapterProvider<AuthContextProvider>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get auth context provider
     */
    getAuthContextProvider(): Promise<AuthContextProvider>;
    /**
     * Register permission checker
     */
    registerPermissionChecker(provider: AdapterProvider<PermissionChecker>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get permission checker
     */
    getPermissionChecker(): Promise<PermissionChecker>;
    /**
     * Register vector adapter
     */
    registerVectorAdapter(provider: AdapterProvider<VectorAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get vector adapter
     */
    getVectorAdapter(): Promise<VectorAdapter>;
    /**
     * Check if vector adapter is registered
     */
    hasVectorAdapter(): boolean;
    /**
     * Register embedding adapter
     */
    registerEmbeddingAdapter(provider: AdapterProvider<EmbeddingAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get embedding adapter
     */
    getEmbeddingAdapter(): Promise<EmbeddingAdapter>;
    /**
     * Register vector service
     */
    registerVectorService(provider: AdapterProvider<VectorService>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get vector service
     */
    getVectorService(): Promise<VectorService>;
    /**
     * Register AI adapter
     */
    registerAIAdapter(provider: AdapterProvider<AIAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get AI adapter
     */
    getAIAdapter(): Promise<AIAdapter>;
    /**
     * Check if AI adapter is registered
     */
    hasAIAdapter(): boolean;
    /**
     * Register AI service
     */
    registerAIService(provider: AdapterProvider<AIService>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get AI service
     */
    getAIService(): Promise<AIService>;
    /**
     * Register notification adapter
     */
    registerNotificationAdapter(provider: AdapterProvider<NotificationAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get notification adapter
     */
    getNotificationAdapter(): Promise<NotificationAdapter>;
    /**
     * Check if notification adapter is registered
     */
    hasNotificationAdapter(): boolean;
    /**
     * Register notification service
     */
    registerNotificationService(provider: AdapterProvider<NotificationService>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get notification service
     */
    getNotificationService(): Promise<NotificationService>;
    /**
     * Register realtime adapter
     */
    registerRealtimeAdapter(provider: AdapterProvider<RealtimeAdapter>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get realtime adapter
     */
    getRealtimeAdapter(): Promise<RealtimeAdapter>;
    /**
     * Check if realtime adapter is registered
     */
    hasRealtimeAdapter(): boolean;
    /**
     * Register SAM realtime service
     */
    registerSAMRealtimeService(provider: AdapterProvider<SAMRealtimeService>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get SAM realtime service
     */
    getSAMRealtimeService(): Promise<SAMRealtimeService>;
    /**
     * Register a custom adapter
     */
    registerCustomAdapter<T>(name: string, provider: AdapterProvider<T>, options?: {
        lazy?: boolean;
    }): this;
    /**
     * Get a custom adapter
     */
    getCustomAdapter<T>(name: string): Promise<T>;
    /**
     * Check if custom adapter is registered
     */
    hasCustomAdapter(name: string): boolean;
    /**
     * List registered custom adapters
     */
    listCustomAdapters(): string[];
    /**
     * Initialize all registered adapters
     */
    initializeAll(): Promise<void>;
    /**
     * Dispose all adapters
     */
    disposeAll(): Promise<void>;
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
    };
}
/**
 * Create adapter factory from profile
 */
export declare function createAdapterFactory(profile: IntegrationProfile): AdapterFactory;
//# sourceMappingURL=adapter-factory.d.ts.map