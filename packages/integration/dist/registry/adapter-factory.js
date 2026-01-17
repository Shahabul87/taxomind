/**
 * @sam-ai/integration - Adapter Factory
 * Dependency injection container for adapters
 */
import { CapabilityRegistry } from './capability-registry';
// ============================================================================
// ADAPTER FACTORY
// ============================================================================
/**
 * Adapter Factory
 * Central dependency injection container for all adapters
 */
export class AdapterFactory {
    profile;
    registry;
    // Adapter registrations
    databaseAdapter = null;
    repositoryFactory = null;
    authAdapter = null;
    authContextProvider = null;
    permissionChecker = null;
    vectorAdapter = null;
    embeddingAdapter = null;
    vectorService = null;
    aiAdapter = null;
    aiService = null;
    notificationAdapter = null;
    notificationService = null;
    realtimeAdapter = null;
    samRealtimeService = null;
    // Custom adapters
    customAdapters = new Map();
    constructor(profile) {
        this.profile = profile;
        this.registry = new CapabilityRegistry(profile);
    }
    // -------------------------------------------------------------------------
    // Profile & Registry Access
    // -------------------------------------------------------------------------
    /**
     * Get the integration profile
     */
    getProfile() {
        return this.profile;
    }
    /**
     * Get the capability registry
     */
    getRegistry() {
        return this.registry;
    }
    /**
     * Update profile
     */
    updateProfile(updates) {
        this.profile = { ...this.profile, ...updates };
        this.registry.updateProfile(updates);
    }
    // -------------------------------------------------------------------------
    // Database Adapters
    // -------------------------------------------------------------------------
    /**
     * Register database adapter
     */
    registerDatabaseAdapter(provider, options = {}) {
        this.databaseAdapter = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get database adapter
     */
    async getDatabaseAdapter() {
        if (!this.databaseAdapter) {
            throw new Error('Database adapter not registered');
        }
        if (!this.databaseAdapter.instance) {
            this.databaseAdapter.instance = await this.databaseAdapter.provider(this.profile, this);
        }
        return this.databaseAdapter.instance;
    }
    /**
     * Check if database adapter is registered
     */
    hasDatabaseAdapter() {
        return this.databaseAdapter !== null;
    }
    /**
     * Register repository factory
     */
    registerRepositoryFactory(provider, options = {}) {
        this.repositoryFactory = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get repository factory
     */
    async getRepositoryFactory() {
        if (!this.repositoryFactory) {
            throw new Error('Repository factory not registered');
        }
        if (!this.repositoryFactory.instance) {
            this.repositoryFactory.instance = await this.repositoryFactory.provider(this.profile, this);
        }
        return this.repositoryFactory.instance;
    }
    // -------------------------------------------------------------------------
    // Auth Adapters
    // -------------------------------------------------------------------------
    /**
     * Register auth adapter
     */
    registerAuthAdapter(provider, options = {}) {
        this.authAdapter = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get auth adapter
     */
    async getAuthAdapter() {
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
    hasAuthAdapter() {
        return this.authAdapter !== null;
    }
    /**
     * Register auth context provider
     */
    registerAuthContextProvider(provider, options = {}) {
        this.authContextProvider = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get auth context provider
     */
    async getAuthContextProvider() {
        if (!this.authContextProvider) {
            throw new Error('Auth context provider not registered');
        }
        if (!this.authContextProvider.instance) {
            this.authContextProvider.instance = await this.authContextProvider.provider(this.profile, this);
        }
        return this.authContextProvider.instance;
    }
    /**
     * Register permission checker
     */
    registerPermissionChecker(provider, options = {}) {
        this.permissionChecker = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get permission checker
     */
    async getPermissionChecker() {
        if (!this.permissionChecker) {
            throw new Error('Permission checker not registered');
        }
        if (!this.permissionChecker.instance) {
            this.permissionChecker.instance = await this.permissionChecker.provider(this.profile, this);
        }
        return this.permissionChecker.instance;
    }
    // -------------------------------------------------------------------------
    // Vector Adapters
    // -------------------------------------------------------------------------
    /**
     * Register vector adapter
     */
    registerVectorAdapter(provider, options = {}) {
        this.vectorAdapter = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get vector adapter
     */
    async getVectorAdapter() {
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
    hasVectorAdapter() {
        return this.vectorAdapter !== null;
    }
    /**
     * Register embedding adapter
     */
    registerEmbeddingAdapter(provider, options = {}) {
        this.embeddingAdapter = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get embedding adapter
     */
    async getEmbeddingAdapter() {
        if (!this.embeddingAdapter) {
            throw new Error('Embedding adapter not registered');
        }
        if (!this.embeddingAdapter.instance) {
            this.embeddingAdapter.instance = await this.embeddingAdapter.provider(this.profile, this);
        }
        return this.embeddingAdapter.instance;
    }
    /**
     * Register vector service
     */
    registerVectorService(provider, options = {}) {
        this.vectorService = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get vector service
     */
    async getVectorService() {
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
    registerAIAdapter(provider, options = {}) {
        this.aiAdapter = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get AI adapter
     */
    async getAIAdapter() {
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
    hasAIAdapter() {
        return this.aiAdapter !== null;
    }
    /**
     * Register AI service
     */
    registerAIService(provider, options = {}) {
        this.aiService = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get AI service
     */
    async getAIService() {
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
    registerNotificationAdapter(provider, options = {}) {
        this.notificationAdapter = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get notification adapter
     */
    async getNotificationAdapter() {
        if (!this.notificationAdapter) {
            throw new Error('Notification adapter not registered');
        }
        if (!this.notificationAdapter.instance) {
            this.notificationAdapter.instance = await this.notificationAdapter.provider(this.profile, this);
        }
        return this.notificationAdapter.instance;
    }
    /**
     * Check if notification adapter is registered
     */
    hasNotificationAdapter() {
        return this.notificationAdapter !== null;
    }
    /**
     * Register notification service
     */
    registerNotificationService(provider, options = {}) {
        this.notificationService = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get notification service
     */
    async getNotificationService() {
        if (!this.notificationService) {
            throw new Error('Notification service not registered');
        }
        if (!this.notificationService.instance) {
            this.notificationService.instance = await this.notificationService.provider(this.profile, this);
        }
        return this.notificationService.instance;
    }
    // -------------------------------------------------------------------------
    // Realtime Adapters
    // -------------------------------------------------------------------------
    /**
     * Register realtime adapter
     */
    registerRealtimeAdapter(provider, options = {}) {
        this.realtimeAdapter = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get realtime adapter
     */
    async getRealtimeAdapter() {
        if (!this.realtimeAdapter) {
            throw new Error('Realtime adapter not registered');
        }
        if (!this.realtimeAdapter.instance) {
            this.realtimeAdapter.instance = await this.realtimeAdapter.provider(this.profile, this);
        }
        return this.realtimeAdapter.instance;
    }
    /**
     * Check if realtime adapter is registered
     */
    hasRealtimeAdapter() {
        return this.realtimeAdapter !== null;
    }
    /**
     * Register SAM realtime service
     */
    registerSAMRealtimeService(provider, options = {}) {
        this.samRealtimeService = {
            provider,
            lazy: options.lazy ?? true,
        };
        return this;
    }
    /**
     * Get SAM realtime service
     */
    async getSAMRealtimeService() {
        if (!this.samRealtimeService) {
            throw new Error('SAM realtime service not registered');
        }
        if (!this.samRealtimeService.instance) {
            this.samRealtimeService.instance = await this.samRealtimeService.provider(this.profile, this);
        }
        return this.samRealtimeService.instance;
    }
    // -------------------------------------------------------------------------
    // Custom Adapters
    // -------------------------------------------------------------------------
    /**
     * Register a custom adapter
     */
    registerCustomAdapter(name, provider, options = {}) {
        this.customAdapters.set(name, {
            provider: provider,
            lazy: options.lazy ?? true,
        });
        return this;
    }
    /**
     * Get a custom adapter
     */
    async getCustomAdapter(name) {
        const registration = this.customAdapters.get(name);
        if (!registration) {
            throw new Error(`Custom adapter '${name}' not registered`);
        }
        if (!registration.instance) {
            registration.instance = await registration.provider(this.profile, this);
        }
        return registration.instance;
    }
    /**
     * Check if custom adapter is registered
     */
    hasCustomAdapter(name) {
        return this.customAdapters.has(name);
    }
    /**
     * List registered custom adapters
     */
    listCustomAdapters() {
        return Array.from(this.customAdapters.keys());
    }
    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------
    /**
     * Initialize all registered adapters
     */
    async initializeAll() {
        const promises = [];
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
    async disposeAll() {
        // Clear all instances
        if (this.databaseAdapter)
            this.databaseAdapter.instance = undefined;
        if (this.repositoryFactory)
            this.repositoryFactory.instance = undefined;
        if (this.authAdapter)
            this.authAdapter.instance = undefined;
        if (this.authContextProvider)
            this.authContextProvider.instance = undefined;
        if (this.permissionChecker)
            this.permissionChecker.instance = undefined;
        if (this.vectorAdapter)
            this.vectorAdapter.instance = undefined;
        if (this.embeddingAdapter)
            this.embeddingAdapter.instance = undefined;
        if (this.vectorService)
            this.vectorService.instance = undefined;
        if (this.aiAdapter)
            this.aiAdapter.instance = undefined;
        if (this.aiService)
            this.aiService.instance = undefined;
        if (this.notificationAdapter)
            this.notificationAdapter.instance = undefined;
        if (this.notificationService)
            this.notificationService.instance = undefined;
        if (this.realtimeAdapter)
            this.realtimeAdapter.instance = undefined;
        if (this.samRealtimeService)
            this.samRealtimeService.instance = undefined;
        this.customAdapters.forEach((reg) => {
            reg.instance = undefined;
        });
    }
    /**
     * Get summary of registered adapters
     */
    getSummary() {
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
export function createAdapterFactory(profile) {
    return new AdapterFactory(profile);
}
//# sourceMappingURL=adapter-factory.js.map