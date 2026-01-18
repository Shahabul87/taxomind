/**
 * @sam-ai/integration - Capability Registry
 * Centralized registry for tracking available capabilities
 */
import type { IntegrationProfile, DatabaseCapability, AuthCapability, AICapability, RealtimeCapability, NotificationCapability, StorageCapability, QueueCapability, CacheCapability, ToolConfiguration, DataSourceConfiguration } from '../types/profile';
/**
 * Result of a capability check
 */
export interface CapabilityCheckResult {
    available: boolean;
    reason?: string;
    fallback?: string;
}
/**
 * Feature availability
 */
export interface FeatureAvailability {
    goalPlanning: CapabilityCheckResult;
    toolExecution: CapabilityCheckResult;
    proactiveInterventions: CapabilityCheckResult;
    selfEvaluation: CapabilityCheckResult;
    learningAnalytics: CapabilityCheckResult;
    memorySystem: CapabilityCheckResult;
    knowledgeGraph: CapabilityCheckResult;
    realTimeSync: CapabilityCheckResult;
}
/**
 * Capability Registry
 * Manages and queries the integration profile capabilities
 */
export declare class CapabilityRegistry {
    private profile;
    private featureOverrides;
    constructor(profile: IntegrationProfile);
    /**
     * Get the full integration profile
     */
    getProfile(): IntegrationProfile;
    /**
     * Update the profile
     */
    updateProfile(updates: Partial<IntegrationProfile>): void;
    /**
     * Get profile ID
     */
    getProfileId(): string;
    /**
     * Get profile name
     */
    getProfileName(): string;
    /**
     * Get database capability
     */
    getDatabase(): DatabaseCapability;
    /**
     * Check if database is available
     */
    hasDatabase(): boolean;
    /**
     * Check if vector database is available
     */
    hasVectorDatabase(): boolean;
    /**
     * Get vector adapter type
     */
    getVectorAdapterType(): string | undefined;
    /**
     * Check if transactions are supported
     */
    supportsTransactions(): boolean;
    /**
     * Get auth capability
     */
    getAuth(): AuthCapability;
    /**
     * Check if auth is available
     */
    hasAuth(): boolean;
    /**
     * Get available roles
     */
    getAvailableRoles(): string[];
    /**
     * Check if multi-tenant is supported
     */
    supportsMultiTenant(): boolean;
    /**
     * Get AI capability
     */
    getAI(): AICapability;
    /**
     * Check if AI is available
     */
    hasAI(): boolean;
    /**
     * Get chat provider
     */
    getChatProvider(): string;
    /**
     * Get embedding provider
     */
    getEmbeddingProvider(): string;
    /**
     * Check if streaming is supported
     */
    supportsStreaming(): boolean;
    /**
     * Check if function calling is supported
     */
    supportsFunctionCalling(): boolean;
    /**
     * Get realtime capability
     */
    getRealtime(): RealtimeCapability;
    /**
     * Check if realtime is available
     */
    hasRealtime(): boolean;
    /**
     * Get realtime type
     */
    getRealtimeType(): string;
    /**
     * Check if presence is supported
     */
    supportsPresence(): boolean;
    /**
     * Get notification capability
     */
    getNotifications(): NotificationCapability;
    /**
     * Check if notifications are available
     */
    hasNotifications(): boolean;
    /**
     * Get available notification channels
     */
    getNotificationChannels(): string[];
    /**
     * Check if specific channel is available
     */
    hasNotificationChannel(channel: string): boolean;
    /**
     * Get storage capability
     */
    getStorage(): StorageCapability;
    /**
     * Check if storage is available
     */
    hasStorage(): boolean;
    /**
     * Get queue capability
     */
    getQueue(): QueueCapability;
    /**
     * Check if queue is available
     */
    hasQueue(): boolean;
    /**
     * Get cache capability
     */
    getCache(): CacheCapability;
    /**
     * Check if cache is available
     */
    hasCache(): boolean;
    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature: keyof IntegrationProfile['features']): boolean;
    /**
     * Override a feature flag
     */
    setFeatureOverride(feature: keyof IntegrationProfile['features'], enabled: boolean): void;
    /**
     * Clear feature overrides
     */
    clearFeatureOverrides(): void;
    /**
     * Get full feature availability with reasons
     */
    getFeatureAvailability(): FeatureAvailability;
    private checkGoalPlanningAvailability;
    private checkToolExecutionAvailability;
    private checkProactiveInterventionsAvailability;
    private checkSelfEvaluationAvailability;
    private checkLearningAnalyticsAvailability;
    private checkMemorySystemAvailability;
    private checkKnowledgeGraphAvailability;
    private checkRealTimeSyncAvailability;
    /**
     * Get tool configuration by ID
     */
    getToolConfig(toolId: string): ToolConfiguration | undefined;
    /**
     * Check if tool is enabled
     */
    isToolEnabled(toolId: string): boolean;
    /**
     * Get tools by category
     */
    getToolsByCategory(category: keyof IntegrationProfile['tools']): ToolConfiguration[];
    /**
     * Get all enabled tools
     */
    getEnabledTools(): ToolConfiguration[];
    /**
     * Get data source configuration
     */
    getDataSource(type: string): DataSourceConfiguration | undefined;
    /**
     * Check if data source is enabled
     */
    isDataSourceEnabled(type: string): boolean;
    /**
     * Get all enabled data sources
     */
    getEnabledDataSources(): DataSourceConfiguration[];
    /**
     * Check if running in development
     */
    isDevelopment(): boolean;
    /**
     * Check if running in production
     */
    isProduction(): boolean;
    /**
     * Get runtime environment
     */
    getRuntime(): string;
    /**
     * Get host framework
     */
    getFramework(): string;
    /**
     * Get limit value
     */
    getLimit(limit: keyof IntegrationProfile['limits']): number | undefined;
    /**
     * Check if within limit
     */
    isWithinLimit(limit: keyof IntegrationProfile['limits'], value: number): boolean;
}
/**
 * Create a capability registry from a profile
 */
export declare function createCapabilityRegistry(profile: IntegrationProfile): CapabilityRegistry;
//# sourceMappingURL=capability-registry.d.ts.map