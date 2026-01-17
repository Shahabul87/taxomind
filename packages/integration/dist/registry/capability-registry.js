/**
 * @sam-ai/integration - Capability Registry
 * Centralized registry for tracking available capabilities
 */
// ============================================================================
// CAPABILITY REGISTRY
// ============================================================================
/**
 * Capability Registry
 * Manages and queries the integration profile capabilities
 */
export class CapabilityRegistry {
    profile;
    featureOverrides = new Map();
    constructor(profile) {
        this.profile = profile;
    }
    // -------------------------------------------------------------------------
    // Profile Access
    // -------------------------------------------------------------------------
    /**
     * Get the full integration profile
     */
    getProfile() {
        return this.profile;
    }
    /**
     * Update the profile
     */
    updateProfile(updates) {
        this.profile = { ...this.profile, ...updates };
    }
    /**
     * Get profile ID
     */
    getProfileId() {
        return this.profile.id;
    }
    /**
     * Get profile name
     */
    getProfileName() {
        return this.profile.name;
    }
    // -------------------------------------------------------------------------
    // Database Capabilities
    // -------------------------------------------------------------------------
    /**
     * Get database capability
     */
    getDatabase() {
        return this.profile.capabilities.database;
    }
    /**
     * Check if database is available
     */
    hasDatabase() {
        return this.profile.capabilities.database.available;
    }
    /**
     * Check if vector database is available
     */
    hasVectorDatabase() {
        const db = this.profile.capabilities.database;
        return db.available && db.supportsVectors && db.vectorAdapter !== 'none';
    }
    /**
     * Get vector adapter type
     */
    getVectorAdapterType() {
        return this.profile.capabilities.database.vectorAdapter;
    }
    /**
     * Check if transactions are supported
     */
    supportsTransactions() {
        return this.profile.capabilities.database.supportsTransactions;
    }
    // -------------------------------------------------------------------------
    // Auth Capabilities
    // -------------------------------------------------------------------------
    /**
     * Get auth capability
     */
    getAuth() {
        return this.profile.capabilities.auth;
    }
    /**
     * Check if auth is available
     */
    hasAuth() {
        return this.profile.capabilities.auth.available;
    }
    /**
     * Get available roles
     */
    getAvailableRoles() {
        return this.profile.capabilities.auth.roles;
    }
    /**
     * Check if multi-tenant is supported
     */
    supportsMultiTenant() {
        return this.profile.capabilities.auth.supportsMultiTenant;
    }
    // -------------------------------------------------------------------------
    // AI Capabilities
    // -------------------------------------------------------------------------
    /**
     * Get AI capability
     */
    getAI() {
        return this.profile.capabilities.ai;
    }
    /**
     * Check if AI is available
     */
    hasAI() {
        return this.profile.capabilities.ai.available;
    }
    /**
     * Get chat provider
     */
    getChatProvider() {
        return this.profile.capabilities.ai.chatProvider;
    }
    /**
     * Get embedding provider
     */
    getEmbeddingProvider() {
        return this.profile.capabilities.ai.embeddingProvider;
    }
    /**
     * Check if streaming is supported
     */
    supportsStreaming() {
        return this.profile.capabilities.ai.supportsStreaming;
    }
    /**
     * Check if function calling is supported
     */
    supportsFunctionCalling() {
        return this.profile.capabilities.ai.supportsFunctionCalling;
    }
    // -------------------------------------------------------------------------
    // Realtime Capabilities
    // -------------------------------------------------------------------------
    /**
     * Get realtime capability
     */
    getRealtime() {
        return this.profile.capabilities.realtime;
    }
    /**
     * Check if realtime is available
     */
    hasRealtime() {
        return this.profile.capabilities.realtime.available;
    }
    /**
     * Get realtime type
     */
    getRealtimeType() {
        return this.profile.capabilities.realtime.type;
    }
    /**
     * Check if presence is supported
     */
    supportsPresence() {
        return this.profile.capabilities.realtime.supportsPresence;
    }
    // -------------------------------------------------------------------------
    // Notification Capabilities
    // -------------------------------------------------------------------------
    /**
     * Get notification capability
     */
    getNotifications() {
        return this.profile.capabilities.notifications;
    }
    /**
     * Check if notifications are available
     */
    hasNotifications() {
        return this.profile.capabilities.notifications.available;
    }
    /**
     * Get available notification channels
     */
    getNotificationChannels() {
        return this.profile.capabilities.notifications.channels;
    }
    /**
     * Check if specific channel is available
     */
    hasNotificationChannel(channel) {
        return this.profile.capabilities.notifications.channels.includes(channel);
    }
    // -------------------------------------------------------------------------
    // Other Capabilities
    // -------------------------------------------------------------------------
    /**
     * Get storage capability
     */
    getStorage() {
        return this.profile.capabilities.storage;
    }
    /**
     * Check if storage is available
     */
    hasStorage() {
        return this.profile.capabilities.storage.available;
    }
    /**
     * Get queue capability
     */
    getQueue() {
        return this.profile.capabilities.queue;
    }
    /**
     * Check if queue is available
     */
    hasQueue() {
        return this.profile.capabilities.queue.available &&
            this.profile.capabilities.queue.type !== 'none';
    }
    /**
     * Get cache capability
     */
    getCache() {
        return this.profile.capabilities.cache;
    }
    /**
     * Check if cache is available
     */
    hasCache() {
        return this.profile.capabilities.cache.available &&
            this.profile.capabilities.cache.type !== 'none';
    }
    // -------------------------------------------------------------------------
    // Feature Checks
    // -------------------------------------------------------------------------
    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature) {
        // Check for override first
        if (this.featureOverrides.has(feature)) {
            return this.featureOverrides.get(feature);
        }
        return this.profile.features[feature];
    }
    /**
     * Override a feature flag
     */
    setFeatureOverride(feature, enabled) {
        this.featureOverrides.set(feature, enabled);
    }
    /**
     * Clear feature overrides
     */
    clearFeatureOverrides() {
        this.featureOverrides.clear();
    }
    /**
     * Get full feature availability with reasons
     */
    getFeatureAvailability() {
        return {
            goalPlanning: this.checkGoalPlanningAvailability(),
            toolExecution: this.checkToolExecutionAvailability(),
            proactiveInterventions: this.checkProactiveInterventionsAvailability(),
            selfEvaluation: this.checkSelfEvaluationAvailability(),
            learningAnalytics: this.checkLearningAnalyticsAvailability(),
            memorySystem: this.checkMemorySystemAvailability(),
            knowledgeGraph: this.checkKnowledgeGraphAvailability(),
            realTimeSync: this.checkRealTimeSyncAvailability(),
        };
    }
    checkGoalPlanningAvailability() {
        if (!this.isFeatureEnabled('goalPlanning')) {
            return { available: false, reason: 'Feature disabled in profile' };
        }
        if (!this.hasDatabase()) {
            return { available: false, reason: 'Database required for goal persistence' };
        }
        if (!this.hasAI()) {
            return { available: false, reason: 'AI required for goal decomposition', fallback: 'Manual goal creation available' };
        }
        return { available: true };
    }
    checkToolExecutionAvailability() {
        if (!this.isFeatureEnabled('toolExecution')) {
            return { available: false, reason: 'Feature disabled in profile' };
        }
        if (!this.hasAuth()) {
            return { available: false, reason: 'Auth required for permission management' };
        }
        return { available: true };
    }
    checkProactiveInterventionsAvailability() {
        if (!this.isFeatureEnabled('proactiveInterventions')) {
            return { available: false, reason: 'Feature disabled in profile' };
        }
        if (!this.hasDatabase()) {
            return { available: false, reason: 'Database required for behavior tracking' };
        }
        if (!this.hasNotifications()) {
            return { available: false, reason: 'Notifications required for interventions', fallback: 'In-app only mode available' };
        }
        return { available: true };
    }
    checkSelfEvaluationAvailability() {
        if (!this.isFeatureEnabled('selfEvaluation')) {
            return { available: false, reason: 'Feature disabled in profile' };
        }
        if (!this.hasAI()) {
            return { available: false, reason: 'AI required for confidence scoring' };
        }
        return { available: true };
    }
    checkLearningAnalyticsAvailability() {
        if (!this.isFeatureEnabled('learningAnalytics')) {
            return { available: false, reason: 'Feature disabled in profile' };
        }
        if (!this.hasDatabase()) {
            return { available: false, reason: 'Database required for analytics storage' };
        }
        return { available: true };
    }
    checkMemorySystemAvailability() {
        if (!this.isFeatureEnabled('memorySystem')) {
            return { available: false, reason: 'Feature disabled in profile' };
        }
        if (!this.hasVectorDatabase()) {
            return { available: false, reason: 'Vector database required', fallback: 'In-memory vector store available' };
        }
        return { available: true };
    }
    checkKnowledgeGraphAvailability() {
        if (!this.isFeatureEnabled('knowledgeGraph')) {
            return { available: false, reason: 'Feature disabled in profile' };
        }
        if (!this.hasDatabase()) {
            return { available: false, reason: 'Database required for graph storage' };
        }
        return { available: true };
    }
    checkRealTimeSyncAvailability() {
        if (!this.isFeatureEnabled('realTimeSync')) {
            return { available: false, reason: 'Feature disabled in profile' };
        }
        if (!this.hasRealtime()) {
            return { available: false, reason: 'Realtime adapter required', fallback: 'Polling mode available' };
        }
        return { available: true };
    }
    // -------------------------------------------------------------------------
    // Tool Configuration
    // -------------------------------------------------------------------------
    /**
     * Get tool configuration by ID
     */
    getToolConfig(toolId) {
        const allTools = [
            ...this.profile.tools.content,
            ...this.profile.tools.assessment,
            ...this.profile.tools.communication,
            ...this.profile.tools.analytics,
            ...this.profile.tools.system,
            ...this.profile.tools.external,
            ...this.profile.tools.custom,
        ];
        return allTools.find(t => t.id === toolId);
    }
    /**
     * Check if tool is enabled
     */
    isToolEnabled(toolId) {
        const config = this.getToolConfig(toolId);
        return config?.enabled ?? false;
    }
    /**
     * Get tools by category
     */
    getToolsByCategory(category) {
        return this.profile.tools[category];
    }
    /**
     * Get all enabled tools
     */
    getEnabledTools() {
        const allTools = [
            ...this.profile.tools.content,
            ...this.profile.tools.assessment,
            ...this.profile.tools.communication,
            ...this.profile.tools.analytics,
            ...this.profile.tools.system,
            ...this.profile.tools.external,
            ...this.profile.tools.custom,
        ];
        return allTools.filter(t => t.enabled);
    }
    // -------------------------------------------------------------------------
    // Data Sources
    // -------------------------------------------------------------------------
    /**
     * Get data source configuration
     */
    getDataSource(type) {
        return this.profile.dataSources.find(ds => ds.type === type);
    }
    /**
     * Check if data source is enabled
     */
    isDataSourceEnabled(type) {
        const ds = this.getDataSource(type);
        return ds?.enabled ?? false;
    }
    /**
     * Get all enabled data sources
     */
    getEnabledDataSources() {
        return this.profile.dataSources.filter(ds => ds.enabled);
    }
    // -------------------------------------------------------------------------
    // Environment
    // -------------------------------------------------------------------------
    /**
     * Check if running in development
     */
    isDevelopment() {
        return this.profile.environment.isDevelopment;
    }
    /**
     * Check if running in production
     */
    isProduction() {
        return this.profile.environment.isProduction;
    }
    /**
     * Get runtime environment
     */
    getRuntime() {
        return this.profile.environment.runtime;
    }
    /**
     * Get host framework
     */
    getFramework() {
        return this.profile.environment.framework;
    }
    // -------------------------------------------------------------------------
    // Limits
    // -------------------------------------------------------------------------
    /**
     * Get limit value
     */
    getLimit(limit) {
        return this.profile.limits[limit];
    }
    /**
     * Check if within limit
     */
    isWithinLimit(limit, value) {
        const maxValue = this.profile.limits[limit];
        if (maxValue === undefined)
            return true;
        return value <= maxValue;
    }
}
// ============================================================================
// FACTORY
// ============================================================================
/**
 * Create a capability registry from a profile
 */
export function createCapabilityRegistry(profile) {
    return new CapabilityRegistry(profile);
}
//# sourceMappingURL=capability-registry.js.map